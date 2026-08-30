import { requireMarketplaceApiContext } from '../auth/context'
import { writeMarketplaceAudit } from '../audit/write-audit'
import { apiFailure, apiSuccess, cleanOptionalText, cleanText, parseJsonObject, requestId } from '../server/request'
import { MarketplaceError } from '../server/errors'
import sharp from 'sharp'
import type { MarketplacePermission } from '../domain/types'
import {
  archiveCommerceResource,
  commerceResourceAction,
  commerceStudioData,
  createCommerceResource,
  getCommerceResource,
  listCommerceResource,
  registerPendingGatewayMedia,
  updateCommerceResource,
} from './repository'
import { commerceResource, sanitizeFileName } from './validation'
import { imageDerivatives, uploadMarketplaceGatewayBytes } from './media-storage'

const MAX_UPLOAD_BYTES = 40 * 1024 * 1024
const ALLOWED_MIME = new Set([
  'image/jpeg','image/png','image/webp','image/avif','image/svg+xml',
  'video/mp4','video/webm','application/pdf',
])

function permissionForResource(resource: string, mutation: boolean): MarketplacePermission {
  if (resource.startsWith('media')) return mutation ? 'marketplace.media.manage' : 'marketplace.media.view'
  if (resource.startsWith('homepage')) return mutation ? 'marketplace.homepage.manage' : 'marketplace.homepage.view'
  if (resource.startsWith('navigation')) return mutation ? 'marketplace.navigation.manage' : 'marketplace.navigation.view'
  if (resource.startsWith('catalog-categories') || resource === 'catalog-item-categories') return mutation ? 'marketplace.categories.manage' : 'marketplace.catalog.view'
  if (resource.startsWith('catalog') || resource === 'price-rules') return mutation ? 'marketplace.catalog.manage' : 'marketplace.catalog.view'
  if (resource.startsWith('merchandising')) return mutation ? 'marketplace.merchandising.manage' : 'marketplace.merchandising.view'
  return mutation ? 'marketplace.publication.manage' : 'marketplace.commerce.view'
}

export async function handleCommerceStudioSummary(request: Request): Promise<Response> {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.commerce.view')
    return apiSuccess(await commerceStudioData(context), { requestId: rid })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleCommerceResource(request: Request, rawResource: string, id?: string): Promise<Response> {
  const rid = requestId(request)
  try {
    const resource = commerceResource(rawResource)
    const mutation = request.method !== 'GET'
    const context = await requireMarketplaceApiContext(permissionForResource(resource, mutation))

    if (request.method === 'GET') {
      if (id) return apiSuccess(await getCommerceResource(resource, id), { requestId: rid })
      const url = new URL(request.url)
      const filters: Record<string, string> = {}
      for (const key of ['locale','status','catalog_item_id','category_id','collection_id','menu_id','territory_id']) {
        const value = url.searchParams.get(key)
        if (value) filters[key] = value
      }
      return apiSuccess(await listCommerceResource(resource, filters), { requestId: rid })
    }

    const body = await parseJsonObject(request)
    if (request.method === 'POST') {
      const result = await createCommerceResource({ resource, payload: body, context })
      await writeMarketplaceAudit({
        context, requestId: rid, action: `marketplace.commerce.${resource}.created`,
        objectType: resource, objectId: String(result.record.id), afterValue: result.record,
        source: 'complete-commerce-administration', request,
      })
      return apiSuccess(result, { requestId: rid, status: 201 })
    }
    if (!id) throw new MarketplaceError('VALIDATION_ERROR', 'Identifiant requis.')
    if (request.method === 'PATCH') {
      const result = await updateCommerceResource({ resource, id, payload: body, context })
      await writeMarketplaceAudit({
        context, requestId: rid, action: `marketplace.commerce.${resource}.updated`,
        objectType: resource, objectId: id, afterValue: result.record,
        source: 'complete-commerce-administration', request,
      })
      return apiSuccess(result, { requestId: rid })
    }
    if (request.method === 'DELETE') {
      const result = await archiveCommerceResource({ resource, id, context })
      await writeMarketplaceAudit({
        context, requestId: rid, action: `marketplace.commerce.${resource}.archived`,
        objectType: resource, objectId: id, afterValue: result.record,
        source: 'complete-commerce-administration', request,
      })
      return apiSuccess(result, { requestId: rid })
    }
    throw new MarketplaceError('VALIDATION_ERROR', 'Méthode non prise en charge.')
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleCommerceAction(request: Request, rawResource: string, id: string, action: string): Promise<Response> {
  const rid = requestId(request)
  try {
    const resource = commerceResource(rawResource)
    const actionPermission: MarketplacePermission = action === 'purge' && resource === 'catalog-items'
      ? 'marketplace.catalog.purge'
      : permissionForResource(resource, true)
    const context = await requireMarketplaceApiContext(actionPermission)
    const body = request.method === 'POST' || request.method === 'PATCH' ? await parseJsonObject(request) : {}
    const result = await commerceResourceAction({ resource, id, action, payload: body, context })
    await writeMarketplaceAudit({
      context, requestId: rid, action: `marketplace.commerce.${resource}.${action}`,
      objectType: resource, objectId: id, afterValue: result.record,
      source: 'complete-commerce-administration', request,
    })
    return apiSuccess(result, { requestId: rid })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

function assertSafeSvg(bytes: Uint8Array): void {
  const source = new TextDecoder().decode(bytes).toLowerCase()
  const forbidden = ['<script', 'javascript:', 'onload=', 'onerror=', '<foreignobject', 'data:text/html']
  if (forbidden.some((marker) => source.includes(marker))) {
    throw new MarketplaceError('VALIDATION_ERROR', 'Le SVG contient un contenu actif non autorisé.')
  }
}

export async function handleMediaUpload(request: Request): Promise<Response> {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.media.manage')
    if (request.method !== 'POST') throw new MarketplaceError('VALIDATION_ERROR', 'Méthode non prise en charge.')
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) throw new MarketplaceError('VALIDATION_ERROR', 'Un fichier est requis.')
    if (!ALLOWED_MIME.has(file.type)) throw new MarketplaceError('VALIDATION_ERROR', 'Format de média non pris en charge.')
    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) throw new MarketplaceError('VALIDATION_ERROR', 'Le fichier doit être inférieur à 40 Mo.')
    const folderId = cleanOptionalText(form.get('folder_id'), 64)
    const replaceAssetId = cleanOptionalText(form.get('replace_asset_id'), 64)
    const altTextFr = cleanText(form.get('alt_text_fr'), 400) || file.name
    const storageFileName = sanitizeFileName(file.name)
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (file.type === 'image/svg+xml') assertSafeSvg(bytes)
    const assetId = replaceAssetId || crypto.randomUUID()
    const publicUrl = `/api/angelcare-marketplace/media/${assetId}/${encodeURIComponent(storageFileName)}`
    if (!replaceAssetId) await registerPendingGatewayMedia({ id: assetId, fileName: file.name, mimeType: file.type, sizeBytes: file.size, folderId, altTextFr, publicUrl, context })
    const gateway = await uploadMarketplaceGatewayBytes({ assetId, filename: storageFileName, mimeType: file.type, bytes, actorUserId: context.actor.id })
    let width: number | null = null
    let height: number | null = null
    if (['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)) {
      const metadata = await sharp(bytes, { failOn: 'warning' }).metadata()
      width = metadata.width || null
      height = metadata.height || null
    }
    const current = await getCommerceResource('media', assetId)
    if (!current) throw new MarketplaceError('NOT_FOUND', 'Session média introuvable.')
    const asset = (await updateCommerceResource({
      resource: 'media', id: assetId, context,
      payload: {
        file_name: file.name, mime_type: gateway.mimeType,
        media_type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
        storage_bucket: 'marketplace-windows-media', storage_path: gateway.storageKey,
        public_url: publicUrl, desktop_url: publicUrl, tablet_url: publicUrl, mobile_url: publicUrl, square_url: publicUrl,
        width, height, size_bytes: gateway.sizeBytes, folder_id: folderId, alt_text_fr: altTextFr,
        optimization_status: 'ready', status: 'active',
        metadata: { ...((current.metadata && typeof current.metadata === 'object') ? current.metadata as Record<string, unknown> : {}), storage_backend: 'windows_self_hosted', sha256: gateway.sha256, upload_state: 'complete' },
      },
    })).record as import('./types').MediaAsset
    await writeMarketplaceAudit({
      context, requestId: rid, action: replaceAssetId ? 'marketplace.media.replaced' : 'marketplace.media.uploaded', objectType: 'media_asset',
      objectId: asset.id, afterValue: asset, source: 'complete-commerce-administration', request,
    })
    return apiSuccess(asset, { requestId: rid, status: 201 })
  } catch (error) {
    return apiFailure(error, rid)
  }
}


export async function handleMediaTransform(request: Request, mediaId: string): Promise<Response> {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.media.manage')
    if (request.method !== 'POST') throw new MarketplaceError('VALIDATION_ERROR', 'Méthode non prise en charge.')
    const existing = await getCommerceResource('media', mediaId)
    if (!existing) throw new MarketplaceError('NOT_FOUND', 'Média introuvable.')
    const mimeType = String(existing.mime_type || '')
    if (!['image/jpeg','image/png','image/webp','image/avif'].includes(mimeType)) {
      throw new MarketplaceError('VALIDATION_ERROR', 'La transformation est réservée aux images raster.')
    }
    const body = await parseJsonObject(request)
    const rotation = Number(body.rotation || 0)
    if (![0,90,180,270].includes(rotation)) throw new MarketplaceError('VALIDATION_ERROR', 'Rotation invalide.')
    const response = await fetch(String(existing.public_url), { cache: 'no-store' })
    if (!response.ok) throw new MarketplaceError('INTERNAL_ERROR', 'Le fichier source ne peut pas être chargé.')
    const sourceBytes = new Uint8Array(await response.arrayBuffer())
    let pipeline = sharp(sourceBytes, { failOn: 'warning' }).rotate(rotation)
    const metadata = await pipeline.metadata()
    const left = Math.max(0, Number(body.crop_x || 0))
    const top = Math.max(0, Number(body.crop_y || 0))
    const requestedWidth = Number(body.crop_width || 0)
    const requestedHeight = Number(body.crop_height || 0)
    if (requestedWidth > 0 && requestedHeight > 0 && metadata.width && metadata.height) {
      const width = Math.min(requestedWidth, metadata.width - left)
      const height = Math.min(requestedHeight, metadata.height - top)
      if (width <= 0 || height <= 0) throw new MarketplaceError('VALIDATION_ERROR', 'Zone de recadrage invalide.')
      pipeline = pipeline.extract({ left, top, width, height })
    }
    const transformed = await pipeline.webp({ quality: 90, effort: 4 }).toBuffer()
    const gateway = await uploadMarketplaceGatewayBytes({ assetId: mediaId, filename: `${Date.now()}-transform.webp`, mimeType: 'image/webp', bytes: new Uint8Array(transformed), actorUserId: context.actor.id })
    const derivatives = await imageDerivatives({ assetId: mediaId, bytes: new Uint8Array(transformed), actorUserId: context.actor.id })
    const publicUrl = `/api/angelcare-marketplace/media/${mediaId}/${encodeURIComponent(gateway.safeFilename)}`
    const variantUrl = (variant: string, filename: string) => `/api/angelcare-marketplace/media/${mediaId}/${encodeURIComponent(filename)}?variant=${variant}`
    const transformedMetadata = await sharp(transformed).metadata()
    const focalPoint = {
      x: Math.max(0, Math.min(100, Number(body.focal_x ?? 50))),
      y: Math.max(0, Math.min(100, Number(body.focal_y ?? 50))),
    }
    const result = await updateCommerceResource({
      resource: 'media', id: mediaId, context,
      payload: {
        storage_bucket: 'marketplace-windows-media', storage_path: gateway.storageKey,
        public_url: publicUrl, desktop_url: variantUrl('desktop', derivatives.desktop.safeFilename), tablet_url: variantUrl('tablet', derivatives.tablet.safeFilename),
        mobile_url: variantUrl('mobile', derivatives.mobile.safeFilename), square_url: variantUrl('square', derivatives.square.safeFilename), mime_type: 'image/webp',
        width: transformedMetadata.width || null, height: transformedMetadata.height || null, size_bytes: gateway.sizeBytes,
        focal_point: focalPoint, optimization_status: 'ready',
        metadata: { ...((existing.metadata && typeof existing.metadata === 'object') ? existing.metadata as Record<string, unknown> : {}), storage_backend: 'windows_self_hosted', sha256: gateway.sha256, gateway_variants: Object.fromEntries(Object.entries(derivatives).map(([variant, record]) => [variant, record.assetId])), last_transform: { rotation, left, top, width: requestedWidth || null, height: requestedHeight || null, transformed_at: new Date().toISOString() } },
      },
    })
    await writeMarketplaceAudit({
      context, requestId: rid, action: 'marketplace.media.transformed', objectType: 'media_asset',
      objectId: mediaId, beforeValue: existing, afterValue: result.record,
      source: 'complete-commerce-administration', request,
    })
    return apiSuccess(result.record, { requestId: rid })
  } catch (error) {
    return apiFailure(error, rid)
  }
}
