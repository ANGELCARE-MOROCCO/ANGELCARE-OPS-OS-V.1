import { createServiceClient } from '@/lib/supabase/server'
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
  registerUploadedMedia,
  updateCommerceResource,
} from './repository'
import { commerceResource, sanitizeFileName } from './validation'

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
    const context = await requireMarketplaceApiContext(permissionForResource(resource, true))
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

async function uploadStorageObject(input: { db: Awaited<ReturnType<typeof createServiceClient>>; path: string; bytes: Uint8Array; contentType: string }): Promise<string> {
  const { error } = await input.db.storage.from('angelcare-marketplace-media').upload(input.path, input.bytes, {
    contentType: input.contentType,
    upsert: false,
    cacheControl: '31536000',
  })
  if (error) throw new MarketplaceError('INTERNAL_ERROR', 'Une variante média n’a pas pu être téléversée.', { cause: error })
  return input.db.storage.from('angelcare-marketplace-media').getPublicUrl(input.path).data.publicUrl
}

async function imageDerivatives(input: { db: Awaited<ReturnType<typeof createServiceClient>>; bytes: Uint8Array; basePath: string; mimeType: string }): Promise<{ desktopUrl: string | null; tabletUrl: string | null; mobileUrl: string | null; squareUrl: string | null; width: number | null; height: number | null }> {
  if (!['image/jpeg','image/png','image/webp','image/avif'].includes(input.mimeType)) {
    return { desktopUrl: null, tabletUrl: null, mobileUrl: null, squareUrl: null, width: null, height: null }
  }
  const source = sharp(input.bytes, { failOn: 'warning' }).rotate()
  const metadata = await source.metadata()
  const variants = [
    ['desktop', 1920, 1080, 'inside'],
    ['tablet', 1280, 960, 'inside'],
    ['mobile', 768, 1024, 'inside'],
    ['square', 1200, 1200, 'cover'],
  ] as const
  const urls: Record<string, string> = {}
  for (const [name, width, height, fit] of variants) {
    const output = await source.clone().resize({ width, height, fit, withoutEnlargement: true, position: 'centre' }).webp({ quality: 86, effort: 4 }).toBuffer()
    const path = input.basePath.replace(/\.[^.]+$/, `-${name}.webp`)
    urls[name] = await uploadStorageObject({ db: input.db, path, bytes: new Uint8Array(output), contentType: 'image/webp' })
  }
  return {
    desktopUrl: urls.desktop || null,
    tabletUrl: urls.tablet || null,
    mobileUrl: urls.mobile || null,
    squareUrl: urls.square || null,
    width: metadata.width || null,
    height: metadata.height || null,
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
    const date = new Date()
    const storagePath = `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${storageFileName}`
    const db = await createServiceClient()
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (file.type === 'image/svg+xml') assertSafeSvg(bytes)
    const publicUrl = await uploadStorageObject({ db, path: storagePath, bytes, contentType: file.type })
    const derivatives = await imageDerivatives({ db, bytes, basePath: storagePath, mimeType: file.type })
    const asset = replaceAssetId
      ? (await updateCommerceResource({
          resource: 'media',
          id: replaceAssetId,
          payload: {
            file_name: file.name,
            mime_type: file.type,
            media_type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
            storage_bucket: 'angelcare-marketplace-media',
            storage_path: storagePath,
            public_url: publicUrl,
            desktop_url: derivatives.desktopUrl || publicUrl,
            tablet_url: derivatives.tabletUrl || derivatives.desktopUrl || publicUrl,
            mobile_url: derivatives.mobileUrl || derivatives.tabletUrl || derivatives.desktopUrl || publicUrl,
            square_url: derivatives.squareUrl || derivatives.mobileUrl || publicUrl,
            width: derivatives.width,
            height: derivatives.height,
            size_bytes: file.size,
            folder_id: folderId,
            alt_text_fr: altTextFr,
            optimization_status: 'ready',
            status: 'active',
          },
          context,
        })).record as import('./types').MediaAsset
      : await registerUploadedMedia({
          fileName: file.name, mimeType: file.type, storagePath, publicUrl,
          desktopUrl: derivatives.desktopUrl, tabletUrl: derivatives.tabletUrl, mobileUrl: derivatives.mobileUrl, squareUrl: derivatives.squareUrl,
          width: derivatives.width, height: derivatives.height, sizeBytes: file.size, folderId, altTextFr, context,
        })
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
    const db = await createServiceClient()
    const storagePath = `transforms/${mediaId}/${Date.now()}-source.webp`
    const publicUrl = await uploadStorageObject({ db, path: storagePath, bytes: new Uint8Array(transformed), contentType: 'image/webp' })
    const derivatives = await imageDerivatives({ db, bytes: new Uint8Array(transformed), basePath: storagePath, mimeType: 'image/webp' })
    const focalPoint = {
      x: Math.max(0, Math.min(100, Number(body.focal_x ?? 50))),
      y: Math.max(0, Math.min(100, Number(body.focal_y ?? 50))),
    }
    const result = await updateCommerceResource({
      resource: 'media', id: mediaId, context,
      payload: {
        storage_bucket: 'angelcare-marketplace-media', storage_path: storagePath,
        public_url: publicUrl, desktop_url: derivatives.desktopUrl || publicUrl,
        tablet_url: derivatives.tabletUrl || derivatives.desktopUrl || publicUrl,
        mobile_url: derivatives.mobileUrl || derivatives.tabletUrl || derivatives.desktopUrl || publicUrl,
        square_url: derivatives.squareUrl || publicUrl, mime_type: 'image/webp',
        width: derivatives.width, height: derivatives.height, size_bytes: transformed.byteLength,
        focal_point: focalPoint, optimization_status: 'ready',
        metadata: { ...((existing.metadata && typeof existing.metadata === 'object') ? existing.metadata as Record<string, unknown> : {}), last_transform: { rotation, left, top, width: requestedWidth || null, height: requestedHeight || null, transformed_at: new Date().toISOString() } },
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
