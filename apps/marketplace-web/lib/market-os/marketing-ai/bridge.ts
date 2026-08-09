import {
  getStorageHealthFromBridge,
  getStorageUsageFromBridge,
  sanitizeStorageFilename,
  uploadStorageFileToBridge,
} from '@/lib/email-os-core/storage-gateway'
import { getMarketingAiConfig } from './config'
import { recordMarketingAiBridgeObject } from './repository'

const ALLOWED_TYPES = new Set([
  'application/json',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'audio/mpeg',
])

export function assertMarketingAiBridgeFile(input: { filename: string; contentType: string; size: number }) {
  const maxBytes = 15 * 1024 * 1024
  if (!input.filename.trim()) throw new Error('BRIDGE_FILENAME_REQUIRED')
  if (input.size <= 0 || input.size > maxBytes) throw new Error('BRIDGE_FILE_SIZE_INVALID')
  if (!ALLOWED_TYPES.has(input.contentType)) throw new Error('BRIDGE_FILE_TYPE_NOT_ALLOWED')
}

export async function getMarketingAiBridgeHealth() {
  const config = getMarketingAiConfig()
  if (!config.bridgeStorageEnabled) {
    return { enabled: false, available: false, message: 'Stockage Bridge désactivé par configuration.', health: null, usage: null }
  }
  try {
    const [health, usage] = await Promise.all([getStorageHealthFromBridge(), getStorageUsageFromBridge()])
    return { enabled: true, available: true, message: 'Bridge Windows disponible.', health, usage }
  } catch (error) {
    return { enabled: true, available: false, message: error instanceof Error ? error.message : 'BRIDGE_HEALTH_FAILED', health: null, usage: null }
  }
}

export async function storeMarketingAiBridgeBytes(input: {
  actorId: string
  runId?: string | null
  actionId?: string | null
  contentId?: string | null
  entityType: string
  filename: string
  contentType: string
  bytes: Uint8Array
  classification?: Record<string, unknown>
}) {
  const config = getMarketingAiConfig()
  if (!config.bridgeStorageEnabled) throw new Error('MARKETING_AI_BRIDGE_DISABLED')
  assertMarketingAiBridgeFile({ filename: input.filename, contentType: input.contentType, size: input.bytes.byteLength })
  const safeFilename = sanitizeStorageFilename(input.filename)
  const uploaded = await uploadStorageFileToBridge({
    moduleKey: config.bridgeModuleKey,
    entityType: input.entityType,
    entityId: input.contentId || input.actionId || input.runId || null,
    originalFilename: safeFilename,
    contentType: input.contentType,
    contentBase64: Buffer.from(input.bytes).toString('base64'),
    createdBy: input.actorId,
    direction: 'archive',
    metadata: {
      namespace: 'market-os/content-command-360',
      runId: input.runId || null,
      actionId: input.actionId || null,
      contentId: input.contentId || null,
      classification: input.classification || {},
    },
  })
  return recordMarketingAiBridgeObject({
    actorId: input.actorId,
    runId: input.runId || null,
    actionId: input.actionId || null,
    contentId: input.contentId || null,
    bridgeFileId: uploaded.id,
    entityType: input.entityType,
    originalFilename: uploaded.original_filename || input.filename,
    safeFilename: uploaded.safe_filename || safeFilename,
    contentType: uploaded.content_type || input.contentType,
    sizeBytes: Number(uploaded.size_bytes || input.bytes.byteLength),
    sha256Hash: uploaded.sha256_hash || '',
    storageKey: uploaded.storage_key || '',
    classification: input.classification || {},
  })
}

export async function storeMarketingAiBridgeJson(input: {
  actorId: string
  runId?: string | null
  actionId?: string | null
  contentId?: string | null
  entityType: string
  filename: string
  value: unknown
  classification?: Record<string, unknown>
}) {
  return storeMarketingAiBridgeBytes({
    ...input,
    contentType: 'application/json',
    bytes: new TextEncoder().encode(JSON.stringify(input.value, null, 2)),
  })
}
