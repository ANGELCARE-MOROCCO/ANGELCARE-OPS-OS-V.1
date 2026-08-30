import sharp from 'sharp'
import { createServiceClient } from '@/lib/supabase/server'
import { requireMarketplaceApiContext } from '../auth/context'
import { writeMarketplaceAudit } from '../audit/write-audit'
import { MarketplaceError } from '../server/errors'
import { apiFailure, apiSuccess, cleanOptionalText, cleanText, parseJsonObject, requestId } from '../server/request'
import { listMediaUsageReferences } from '../total-commerce-control/repository'
import {
  createMarketplaceMediaDeliveryUrl,
  createMarketplaceMediaUploadSession,
  deleteMarketplaceGatewayAsset,
  fetchMarketplaceGatewayAsset,
  imageDerivatives,
  marketplaceMediaStorageConfiguration,
  marketplaceMediaStorageHealth,
} from './media-storage'
import {
  getCommerceResource,
  markGatewayMediaFailed,
  permanentlyDeleteMediaMetadata,
  registerPendingGatewayMedia,
  updateCommerceResource,
} from './repository'
import { sanitizeFileName } from './validation'

const ALLOWED_MIME = new Set(['image/jpeg','image/png','image/webp','image/avif','image/svg+xml','video/mp4','video/webm','application/pdf'])

function stableMediaPath(assetId: string, fileName: string, variant?: string): string {
  const pathname = `/api/angelcare-marketplace/media/${encodeURIComponent(assetId)}/${encodeURIComponent(sanitizeFileName(fileName))}`
  return variant ? `${pathname}?variant=${encodeURIComponent(variant)}` : pathname
}

export async function handleMarketplaceMediaUploadSession(request: Request): Promise<Response> {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.media.manage')
    const body = await parseJsonObject(request)
    const fileName = cleanText(body.fileName, 180)
    const mimeType = cleanText(body.mimeType, 120).toLowerCase()
    const sizeBytes = Number(body.sizeBytes || 0)
    if (!fileName) throw new MarketplaceError('VALIDATION_ERROR', 'Le nom du fichier est requis.')
    if (!ALLOWED_MIME.has(mimeType)) throw new MarketplaceError('VALIDATION_ERROR', 'Ce format média n’est pas pris en charge.')
    const configuration = marketplaceMediaStorageConfiguration()
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > configuration.maxUploadBytes) {
      throw new MarketplaceError('VALIDATION_ERROR', `Le fichier doit être inférieur à ${Math.round(configuration.maxUploadBytes / 1024 / 1024)} Mo.`)
    }
    const replaceAssetId = cleanOptionalText(body.replaceAssetId, 64)
    const assetId = replaceAssetId || crypto.randomUUID()
    if (replaceAssetId && !await getCommerceResource('media', replaceAssetId)) throw new MarketplaceError('NOT_FOUND', 'Média à remplacer introuvable.')
    const publicUrl = stableMediaPath(assetId, fileName)
    if (!replaceAssetId) {
      await registerPendingGatewayMedia({
        id: assetId,
        fileName,
        mimeType,
        sizeBytes,
        folderId: cleanOptionalText(body.folderId, 64),
        altTextFr: cleanText(body.altTextFr, 400) || fileName,
        publicUrl,
        context,
      })
    }
    const session = createMarketplaceMediaUploadSession({ assetId, filename: sanitizeFileName(fileName), mimeType, maxBytes: sizeBytes, actorUserId: context.actor.id })
    await writeMarketplaceAudit({
      context, requestId: rid, action: replaceAssetId ? 'marketplace.media.replace_session_created' : 'marketplace.media.upload_session_created',
      objectType: 'media_asset', objectId: assetId, afterValue: { fileName, mimeType, sizeBytes, storageBackend: 'windows_self_hosted' },
      source: 'marketplace-media-storage', request,
    })
    return apiSuccess({ assetId, ...session, completionUrl: `/api/angelcare-marketplace/admin/media/${assetId}/complete`, publicUrl }, { requestId: rid, status: 201 })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleMarketplaceMediaUploadComplete(request: Request, mediaId: string): Promise<Response> {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.media.manage')
    const body = await parseJsonObject(request)
    const gateway = await fetchMarketplaceGatewayAsset(mediaId)
    const expectedMime = cleanText(body.mimeType, 120).toLowerCase()
    const expectedSize = Number(body.sizeBytes || 0)
    if (expectedMime && gateway.mimeType !== expectedMime) throw new MarketplaceError('DATA_INTEGRITY', 'Le type reçu ne correspond pas à la session de téléversement.')
    if (expectedSize && gateway.sizeBytes !== expectedSize) throw new MarketplaceError('DATA_INTEGRITY', 'La taille reçue ne correspond pas à la session de téléversement.')
    let width: number | null = null
    let height: number | null = null
    let derivatives: Awaited<ReturnType<typeof imageDerivatives>> | null = null
    if (['image/jpeg','image/png','image/webp','image/avif'].includes(gateway.mimeType)) {
      const response = await fetch(createMarketplaceMediaDeliveryUrl(mediaId, 5 * 60 * 1000), { cache: 'no-store' })
      if (response.ok) {
        const sourceBytes = new Uint8Array(await response.arrayBuffer())
        const metadata = await sharp(sourceBytes, { failOn: 'warning' }).metadata()
        width = metadata.width || null
        height = metadata.height || null
        derivatives = await imageDerivatives({ assetId: mediaId, bytes: sourceBytes, actorUserId: context.actor.id })
      }
    }
    const publicUrl = stableMediaPath(mediaId, gateway.safeFilename)
    const current = await getCommerceResource('media', mediaId)
    if (!current) throw new MarketplaceError('NOT_FOUND', 'Session média introuvable.')
    const result = await updateCommerceResource({
      resource: 'media', id: mediaId, context,
      payload: {
        file_name: cleanText(body.fileName, 180) || gateway.safeFilename,
        folder_id: cleanOptionalText(body.folderId, 64),
        mime_type: gateway.mimeType,
        media_type: gateway.mimeType.startsWith('video/') ? 'video' : gateway.mimeType === 'application/pdf' ? 'document' : 'image',
        size_bytes: gateway.sizeBytes,
        width,
        height,
        storage_bucket: 'marketplace-windows-media',
        storage_path: gateway.storageKey,
        public_url: publicUrl,
        desktop_url: derivatives ? stableMediaPath(mediaId, derivatives.desktop.safeFilename, 'desktop') : publicUrl,
        tablet_url: derivatives ? stableMediaPath(mediaId, derivatives.tablet.safeFilename, 'tablet') : publicUrl,
        mobile_url: derivatives ? stableMediaPath(mediaId, derivatives.mobile.safeFilename, 'mobile') : publicUrl,
        square_url: derivatives ? stableMediaPath(mediaId, derivatives.square.safeFilename, 'square') : publicUrl,
        alt_text_fr: cleanText(body.altTextFr, 400) || cleanText(current.alt_text_fr, 400) || gateway.safeFilename,
        optimization_status: 'ready',
        status: 'active',
        metadata: {
          ...((current.metadata && typeof current.metadata === 'object' && !Array.isArray(current.metadata)) ? current.metadata : {}),
          storage_backend: 'windows_self_hosted', upload_state: 'complete', sha256: gateway.sha256,
          gateway_created_at: gateway.createdAt,
          gateway_variants: derivatives ? Object.fromEntries(Object.entries(derivatives).map(([variant, record]) => [variant, record.assetId])) : {},
        },
      },
    })
    await writeMarketplaceAudit({
      context, requestId: rid, action: current.status === 'processing' ? 'marketplace.media.uploaded' : 'marketplace.media.replaced',
      objectType: 'media_asset', objectId: mediaId, beforeValue: current, afterValue: result.record,
      source: 'marketplace-media-storage', request,
    })
    return apiSuccess(result.record, { requestId: rid })
  } catch (error) {
    const context = await requireMarketplaceApiContext('marketplace.media.manage').catch(() => null)
    if (context) await markGatewayMediaFailed({ id: mediaId, message: error instanceof Error ? error.message : String(error), context }).catch(() => undefined)
    return apiFailure(error, rid)
  }
}

export async function handleMarketplaceMediaPermanentDelete(request: Request, mediaId: string): Promise<Response> {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.media.manage')
    const body = await parseJsonObject(request)
    if (cleanText(body.confirmation, 80) !== 'SUPPRIMER DÉFINITIVEMENT') throw new MarketplaceError('VALIDATION_ERROR', 'La confirmation de suppression est incorrecte.')
    const usages = await listMediaUsageReferences(mediaId)
    if (usages.length) throw new MarketplaceError('DEPENDENCY_BLOCKED', `Suppression refusée: ${usages.length} usage(s) doivent d’abord être retirés.`)
    const current = await getCommerceResource('media', mediaId)
    if (!current) throw new MarketplaceError('NOT_FOUND', 'Média introuvable.')
    if (String(current.storage_bucket) === 'marketplace-windows-media') {
      const variants = current.metadata && typeof current.metadata === 'object' && !Array.isArray(current.metadata)
        ? (current.metadata as Record<string, unknown>).gateway_variants
        : null
      if (variants && typeof variants === 'object' && !Array.isArray(variants)) {
        for (const variantId of Object.values(variants as Record<string, unknown>)) {
          if (typeof variantId === 'string') await deleteMarketplaceGatewayAsset(variantId).catch(() => undefined)
        }
      }
      await deleteMarketplaceGatewayAsset(mediaId)
    }
    const deleted = await permanentlyDeleteMediaMetadata({ id: mediaId, context })
    await writeMarketplaceAudit({
      context, requestId: rid, action: 'marketplace.media.permanently_deleted', objectType: 'media_asset', objectId: mediaId,
      beforeValue: current, afterValue: { deleted: true, storageBackend: current.storage_bucket }, source: 'marketplace-media-storage', request,
    })
    return apiSuccess({ deleted: true, asset: deleted }, { requestId: rid })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleMarketplaceMediaStorageHealth(request: Request): Promise<Response> {
  const rid = requestId(request)
  try {
    await requireMarketplaceApiContext('marketplace.media.view')
    return apiSuccess(await marketplaceMediaStorageOperations(), { requestId: rid })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function marketplaceMediaStorageOperations() {
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_media_assets').select('id,file_name,mime_type,size_bytes,status,storage_bucket,storage_path,metadata,created_at,updated_at').eq('storage_bucket', 'marketplace-windows-media').order('updated_at', { ascending: false }).limit(1000)
  if (error) throw new MarketplaceError('INTERNAL_ERROR', 'Les métadonnées du stockage média ne peuvent pas être chargées.', { cause: error })
  const rows = data || []
  return {
    ...await marketplaceMediaStorageHealth(),
    assets: {
      count: rows.length,
      bytes: rows.reduce((total, row) => total + Number(row.size_bytes || 0), 0),
      processing: rows.filter(row => row.status === 'processing').length,
      failed: rows.filter(row => row.status === 'failed').length,
      lastUpload: rows.find(row => row.status === 'active') || null,
      lastFailure: rows.find(row => row.status === 'failed') || null,
    },
  }
}

export async function handleMarketplaceMediaDelivery(request: Request, mediaId: string): Promise<Response> {
  try {
    const db = await createServiceClient()
    const { data, error } = await db.from('angelcare_marketplace_media_assets').select('id,status,storage_bucket,metadata').eq('id', mediaId).maybeSingle()
    if (error || !data || data.status !== 'active') return new Response('Média introuvable', { status: 404 })
    if (data.storage_bucket !== 'marketplace-windows-media') return new Response('Autorité de stockage incompatible', { status: 409 })
    const variant = new URL(request.url).searchParams.get('variant')
    let deliveryAssetId = mediaId
    if (variant) {
      if (!['desktop', 'tablet', 'mobile', 'square'].includes(variant)) return new Response('Variante média invalide', { status: 400 })
      const variants = data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
        ? (data.metadata as Record<string, unknown>).gateway_variants
        : null
      const variantId = variants && typeof variants === 'object' && !Array.isArray(variants)
        ? (variants as Record<string, unknown>)[variant]
        : null
      if (typeof variantId !== 'string') return new Response('Variante média introuvable', { status: 404 })
      deliveryAssetId = variantId
    }
    return Response.redirect(createMarketplaceMediaDeliveryUrl(deliveryAssetId), 307)
  } catch {
    return new Response('Média indisponible', { status: 503 })
  }
}
