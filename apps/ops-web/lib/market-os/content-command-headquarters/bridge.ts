import {
  sanitizeStorageFilename,
  uploadStorageFileToBridge,
} from '@/lib/email-os-core/storage-gateway'
import { createServiceClient } from '@/lib/supabase/server'
import type { JsonRecord } from './types'
import { auditContentHeadquarters } from './repository'

const MODULE_KEY = 'market_os_content_command'

function bridgeBaseUrl() {
  return String(process.env.EMAIL_OS_STORAGE_BRIDGE_URL || process.env.EMAIL_OS_BRIDGE_URL || '').replace(/\/$/, '')
}

function bridgeAdminToken() {
  return String(process.env.EMAIL_BRIDGE_ADMIN_TOKEN || process.env.EMAIL_OS_BRIDGE_ADMIN_TOKEN || '')
}

async function permanentDeleteBridgeFile(input: { bridgeFileId: string; storageKey: string; reason: string; actorId: string }) {
  const baseUrl = bridgeBaseUrl()
  const token = bridgeAdminToken()
  if (!baseUrl || !token) throw new Error('BRIDGE_ADMIN_DELETE_NOT_CONFIGURED')
  const response = await fetch(`${baseUrl}/admin/storage/delete`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      'x-admin-token': token,
    },
    body: JSON.stringify({
      id: input.bridgeFileId,
      fileId: input.bridgeFileId,
      bridgeFileId: input.bridgeFileId,
      storageKey: input.storageKey,
      storage_key: input.storageKey,
      permanent: true,
      confirmation: 'PERMANENT_DELETE_CONFIRMED',
      reason: input.reason,
      actorId: input.actorId,
      moduleKey: MODULE_KEY,
    }),
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok || payload.ok === false) throw new Error(String(payload.error || payload.message || `BRIDGE_DELETE_FAILED_${response.status}`))
  return payload
}

export async function uploadContentHeadquartersFile(input: {
  actorId: string
  entityType: string
  entityId: string
  contentCode?: string
  filename: string
  contentType: string
  bytes: Uint8Array
  direction?: 'archive' | 'inbound' | 'outbound'
  metadata?: JsonRecord
}) {
  if (!input.filename.trim()) throw new Error('FILE_NAME_REQUIRED')
  if (!input.bytes.byteLength) throw new Error('FILE_BYTES_REQUIRED')
  const safeFilename = sanitizeStorageFilename(input.filename)
  const uploaded = await uploadStorageFileToBridge({
    moduleKey: MODULE_KEY,
    entityType: input.entityType,
    entityId: input.entityId,
    originalFilename: safeFilename,
    contentType: input.contentType || 'application/octet-stream',
    contentBase64: Buffer.from(input.bytes).toString('base64'),
    createdBy: input.actorId,
    direction: input.direction || 'archive',
    metadata: {
      namespace: 'market-os/content-command-headquarters',
      contentCode: input.contentCode || null,
      ...(input.metadata || {}),
    },
  })
  if (!uploaded.id || !uploaded.storage_key || !uploaded.sha256_hash) throw new Error('BRIDGE_UPLOAD_INTEGRITY_INCOMPLETE')
  return {
    bridgeFileId: String(uploaded.id),
    storageKey: String(uploaded.storage_key),
    originalFilename: String(uploaded.original_filename || input.filename),
    safeFilename: String(uploaded.safe_filename || safeFilename),
    contentType: String(uploaded.content_type || input.contentType || 'application/octet-stream'),
    sizeBytes: Number(uploaded.size_bytes || input.bytes.byteLength),
    sha256Hash: String(uploaded.sha256_hash),
  }
}

export async function storeProgressEvidence(input: {
  actorId: string
  actorName: string
  dossierId: string
  missionId?: string | null
  taskId?: string | null
  checkpointId?: string | null
  evidenceType: string
  title: string
  note: string
  progressPercent: number
  file: File
}) {
  const uploaded = await uploadContentHeadquartersFile({
    actorId: input.actorId,
    entityType: 'content_progress_evidence',
    entityId: input.dossierId,
    filename: input.file.name,
    contentType: input.file.type || 'application/octet-stream',
    bytes: new Uint8Array(await input.file.arrayBuffer()),
    metadata: {
      missionId: input.missionId || null,
      taskId: input.taskId || null,
      checkpointId: input.checkpointId || null,
      evidenceType: input.evidenceType,
    },
  })
  const supabase = await createServiceClient() as any
  const insert = await supabase.from('market_content_evidence').insert({
    dossier_id: input.dossierId,
    mission_id: input.missionId || null,
    task_id: input.taskId || null,
    checkpoint_id: input.checkpointId || null,
    evidence_type: input.evidenceType,
    title: input.title,
    note: input.note,
    bridge_file_id: uploaded.bridgeFileId,
    storage_key: uploaded.storageKey,
    content_type: uploaded.contentType,
    filename: uploaded.originalFilename,
    size_bytes: uploaded.sizeBytes,
    progress_percent: Math.max(0, Math.min(100, input.progressPercent)),
    submitted_by: input.actorId || null,
    submitted_by_name: input.actorName,
    status: 'submitted',
  }).select('*').single()
  if (insert.error) throw insert.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'evidence.submitted', entityType: 'content_evidence', entityId: insert.data.id, detail: { dossierId: input.dossierId, bridgeFileId: uploaded.bridgeFileId } })
  return insert.data
}

export async function storeInitialCanonicalSource(input: {
  actorId: string
  actorName: string
  dossierId: string
  contentCode: string
  reason: string
  file: File
}) {
  const uploaded = await uploadContentHeadquartersFile({
    actorId: input.actorId,
    entityType: 'content_canonical_source',
    entityId: input.dossierId,
    contentCode: input.contentCode,
    filename: input.file.name,
    contentType: input.file.type || 'application/octet-stream',
    bytes: new Uint8Array(await input.file.arrayBuffer()),
    metadata: { canonical: true, sourceVersion: 1, reason: input.reason },
  })
  const supabase = await createServiceClient() as any
  const result = await supabase.rpc('market_content_register_initial_source', {
    p_dossier_id: input.dossierId,
    p_content_code: input.contentCode,
    p_bridge_file_id: uploaded.bridgeFileId,
    p_storage_key: uploaded.storageKey,
    p_original_filename: uploaded.originalFilename,
    p_safe_filename: uploaded.safeFilename,
    p_content_type: uploaded.contentType,
    p_size_bytes: uploaded.sizeBytes,
    p_sha256_hash: uploaded.sha256Hash,
    p_actor_id: input.actorId || null,
    p_actor_name: input.actorName,
    p_reason: input.reason,
  })
  if (result.error) throw result.error
  return result.data
}

export async function replaceCanonicalSource(input: {
  actorId: string
  actorName: string
  dossierId: string
  contentCode: string
  reason: string
  confirmation: string
  file: File
}) {
  if (input.confirmation !== `REMPLACER ${input.contentCode}`) throw new Error('INVALID_REPLACEMENT_CONFIRMATION')
  const supabase = await createServiceClient() as any
  const lock = await supabase.rpc('market_content_begin_source_replacement', {
    p_dossier_id: input.dossierId,
    p_content_code: input.contentCode,
    p_actor_id: input.actorId || null,
    p_actor_name: input.actorName,
    p_reason: input.reason,
  })
  if (lock.error) throw lock.error
  const replacementId = String(lock.data?.replacement_id || (Array.isArray(lock.data) ? lock.data[0]?.replacement_id : '') || '')
  const previousBridgeFileId = String(lock.data?.previous_bridge_file_id || (Array.isArray(lock.data) ? lock.data[0]?.previous_bridge_file_id : '') || '')
  const previousStorageKey = String(lock.data?.previous_storage_key || (Array.isArray(lock.data) ? lock.data[0]?.previous_storage_key : '') || '')
  if (!replacementId) throw new Error('SOURCE_REPLACEMENT_LOCK_FAILED')

  try {
    const uploaded = await uploadContentHeadquartersFile({
      actorId: input.actorId,
      entityType: 'content_canonical_source',
      entityId: input.dossierId,
      contentCode: input.contentCode,
      filename: input.file.name,
      contentType: input.file.type || 'application/octet-stream',
      bytes: new Uint8Array(await input.file.arrayBuffer()),
      metadata: { canonical: true, replacementId, reason: input.reason },
    })

    const commit = await supabase.rpc('market_content_commit_source_replacement', {
      p_replacement_id: replacementId,
      p_bridge_file_id: uploaded.bridgeFileId,
      p_storage_key: uploaded.storageKey,
      p_original_filename: uploaded.originalFilename,
      p_safe_filename: uploaded.safeFilename,
      p_content_type: uploaded.contentType,
      p_size_bytes: uploaded.sizeBytes,
      p_sha256_hash: uploaded.sha256Hash,
      p_actor_id: input.actorId || null,
      p_actor_name: input.actorName,
    })
    if (commit.error) throw commit.error

    if (previousBridgeFileId && previousStorageKey) {
      await permanentDeleteBridgeFile({
        bridgeFileId: previousBridgeFileId,
        storageKey: previousStorageKey,
        reason: `Replacement ${replacementId}: ${input.reason}`,
        actorId: input.actorId,
      })
      const verify = await supabase.rpc('market_content_confirm_previous_source_deleted', {
        p_replacement_id: replacementId,
        p_actor_id: input.actorId || null,
        p_actor_name: input.actorName,
      })
      if (verify.error) throw verify.error
    }
    return commit.data
  } catch (error) {
    await supabase.rpc('market_content_fail_source_replacement', {
      p_replacement_id: replacementId,
      p_error: error instanceof Error ? error.message : String(error),
      p_actor_id: input.actorId || null,
      p_actor_name: input.actorName,
    })
    throw error
  }
}

export async function downloadContentHeadquartersFile(input: { bridgeFileId?: string | null; storageKey?: string | null }) {
  const baseUrl = bridgeBaseUrl()
  const token = bridgeAdminToken()
  if (!baseUrl || !token) throw new Error('BRIDGE_ADMIN_READ_NOT_CONFIGURED')
  const query = new URLSearchParams()
  if (input.bridgeFileId) { query.set('id', input.bridgeFileId); query.set('fileId', input.bridgeFileId) }
  if (input.storageKey) { query.set('storageKey', input.storageKey); query.set('storage_key', input.storageKey) }
  const response = await fetch(`${baseUrl}/admin/storage/file?${query.toString()}`, {
    method: 'GET',
    headers: { authorization: `Bearer ${token}`, 'x-admin-token': token },
    cache: 'no-store',
  })
  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  if (!response.ok) {
    const failure = await response.text().catch(() => '')
    throw new Error(failure || `BRIDGE_FILE_READ_FAILED_${response.status}`)
  }
  if (!contentType.includes('application/json')) return { bytes: new Uint8Array(await response.arrayBuffer()), contentType }
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>
  const base64 = String(payload.contentBase64 || payload.content_base64 || payload.base64 || payload.data || '')
  if (!base64) throw new Error('BRIDGE_FILE_BYTES_UNAVAILABLE')
  return { bytes: new Uint8Array(Buffer.from(base64, 'base64')), contentType: String(payload.contentType || payload.content_type || contentType) }
}
