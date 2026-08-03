import 'server-only'

import { createServiceClient } from '@/lib/supabase/server'
import type {
  PxActor,
  PxAnnotation,
  PxDocumentRecord,
  PxFavorite,
  PxRecentItem,
  PxSavedView,
  PxWorkbench,
  PxWorkbenchItem,
  PxWorkbenchKind,
  PxUniverse,
} from './types'

const TENANT_KEY = 'angelcare-internal'
const VIEW_PREFIX = 'fc_os_'
type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>
function table(client: ServiceClient, name: string) { return client.from(`${VIEW_PREFIX}${name}`) }
function now() { return new Date().toISOString() }
function object(value: unknown): Record<string, any> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {} }
function string(value: unknown, fallback = '') { const output = String(value ?? '').trim(); return output || fallback }
function number(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }

export function actorFromPxUser(user: any): PxActor {
  return {
    id: string(user?.id ?? user?.user_id ?? user?.email, 'unknown-user'),
    name: string(user?.name ?? user?.full_name ?? user?.email, 'Utilisateur Flashcards OS'),
    role: string(user?.role ?? user?.role_key, 'operator'),
  }
}

function mapWorkbench(row: any): PxWorkbench {
  return {
    id: String(row.id), kind: row.kind, sourceId: row.source_id == null ? null : String(row.source_id),
    sourceType: row.source_type == null ? null : String(row.source_type), title: String(row.title), status: row.status,
    universe: row.universe, versionNo: Number(row.version_no || 1), payload: object(row.payload),
    sourceSnapshot: object(row.source_snapshot), createdBy: String(row.created_by || ''), updatedBy: String(row.updated_by || ''),
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  }
}
function mapItem(row: any): PxWorkbenchItem {
  return {
    id: String(row.id), workbenchId: String(row.workbench_id), parentId: row.parent_id == null ? null : String(row.parent_id),
    itemKind: row.item_kind, sourceRef: row.source_ref == null ? null : String(row.source_ref), sourceVersion: row.source_version == null ? null : String(row.source_version),
    title: String(row.title || ''), sortOrder: Number(row.sort_order || 0), startMinute: row.start_minute == null ? null : Number(row.start_minute),
    durationMinutes: row.duration_minutes == null ? null : Number(row.duration_minutes), quantity: Number(row.quantity || 1), locked: Boolean(row.locked),
    payload: object(row.payload), createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  }
}

async function history(client: ServiceClient, actor: PxActor, operation: string, entityType: string, entityId: string, before: unknown, after: unknown) {
  await table(client, 'px_operation_history').insert({
    tenant_key: TENANT_KEY, actor_id: actor.id, actor_name: actor.name, operation, entity_type: entityType,
    entity_id: entityId, before_payload: before ?? null, after_payload: after ?? null,
  })
}

export async function listWorkbenches(actor: PxActor, limit = 60): Promise<PxWorkbench[]> {
  const client = await createServiceClient()
  const { data, error } = await table(client, 'px_workbenches').select('*').eq('tenant_key', TENANT_KEY).eq('created_by', actor.id).order('updated_at', { ascending: false }).limit(limit)
  if (error) throw new Error(error.message)
  return (data || []).map(mapWorkbench)
}

export async function getWorkbench(id: string, actor: PxActor): Promise<{ workbench: PxWorkbench; items: PxWorkbenchItem[] } | null> {
  const client = await createServiceClient()
  const [{ data, error }, { data: items, error: itemsError }] = await Promise.all([
    table(client, 'px_workbenches').select('*').eq('tenant_key', TENANT_KEY).eq('id', id).single(),
    table(client, 'px_workbench_items').select('*').eq('tenant_key', TENANT_KEY).eq('workbench_id', id).order('sort_order'),
  ])
  if (error || !data) return null
  if (itemsError) throw new Error(itemsError.message)
  if (String(data.created_by) !== actor.id && actor.role !== 'admin' && actor.role !== 'super_admin') return null
  return { workbench: mapWorkbench(data), items: (items || []).map(mapItem) }
}

export async function createWorkbench(input: {
  kind: PxWorkbenchKind
  sourceId?: string | null
  sourceType?: string | null
  title: string
  universe?: PxUniverse
  payload?: Record<string, any>
  sourceSnapshot?: Record<string, any>
  items?: Array<Partial<PxWorkbenchItem>>
}, actor: PxActor) {
  const client = await createServiceClient()
  const { data, error } = await table(client, 'px_workbenches').insert({
    tenant_key: TENANT_KEY, kind: input.kind, source_id: input.sourceId || null, source_type: input.sourceType || null,
    title: string(input.title, 'Nouveau workbench'), status: 'active', universe: input.universe || 'internal', version_no: 1,
    payload: input.payload || {}, source_snapshot: input.sourceSnapshot || {}, created_by: actor.id, updated_by: actor.id,
  }).select('*').single()
  if (error || !data) throw new Error(error?.message || 'Workbench creation failed.')
  if (input.items?.length) {
    const rows = input.items.map((item, index) => ({
      tenant_key: TENANT_KEY, workbench_id: data.id, parent_id: item.parentId || null, item_kind: item.itemKind || 'note',
      source_ref: item.sourceRef || null, source_version: item.sourceVersion || null, title: item.title || '', sort_order: item.sortOrder ?? (index + 1) * 100,
      start_minute: item.startMinute ?? null, duration_minutes: item.durationMinutes ?? null, quantity: item.quantity ?? 1, locked: item.locked ?? false, payload: item.payload || {},
    }))
    const { error: itemError } = await table(client, 'px_workbench_items').insert(rows)
    if (itemError) throw new Error(itemError.message)
  }
  await history(client, actor, 'create', 'px_workbench', String(data.id), null, data)
  return getWorkbench(String(data.id), actor)
}

export async function updateWorkbench(id: string, patch: Record<string, any>, actor: PxActor) {
  const client = await createServiceClient()
  const { data: existing, error: existingError } = await table(client, 'px_workbenches').select('*').eq('tenant_key', TENANT_KEY).eq('id', id).single()
  if (existingError || !existing) throw new Error('Workbench not found.')
  if (String(existing.created_by) !== actor.id && actor.role !== 'admin' && actor.role !== 'super_admin') throw new Error('Workbench access denied.')
  const allowed: Record<string, any> = { updated_by: actor.id, updated_at: now() }
  if (patch.title != null) allowed.title = string(patch.title, String(existing.title))
  if (patch.status != null && ['draft', 'active', 'completed'].includes(String(patch.status))) allowed.status = patch.status
  if (patch.universe != null && ['b2c', 'b2b', 'internal'].includes(String(patch.universe))) allowed.universe = patch.universe
  if (patch.payload != null) allowed.payload = object(patch.payload)
  if (patch.sourceSnapshot != null) allowed.source_snapshot = object(patch.sourceSnapshot)
  if (patch.versionNo != null) allowed.version_no = Math.max(1, Math.trunc(number(patch.versionNo, 1)))
  const { data, error } = await table(client, 'px_workbenches').update(allowed).eq('tenant_key', TENANT_KEY).eq('id', id).select('*').single()
  if (error || !data) throw new Error(error?.message || 'Workbench update failed.')
  await history(client, actor, 'update', 'px_workbench', id, existing, data)
  return mapWorkbench(data)
}

export async function deleteWorkbench(id: string, actor: PxActor) {
  const client = await createServiceClient()
  const { data: existing, error: existingError } = await table(client, 'px_workbenches').select('*').eq('tenant_key', TENANT_KEY).eq('id', id).single()
  if (existingError || !existing) throw new Error('Workbench not found.')
  if (String(existing.created_by) !== actor.id && actor.role !== 'admin' && actor.role !== 'super_admin') throw new Error('Workbench access denied.')
  const { count: docs } = await table(client, 'px_document_registry').select('id', { head: true, count: 'exact' }).eq('tenant_key', TENANT_KEY).eq('source_type', 'workbench').eq('source_id', id)
  if (Number(docs || 0) > 0) throw new Error(`This workbench is referenced by ${docs} generated document record(s). Delete those records first.`)
  const { error } = await table(client, 'px_workbenches').delete().eq('tenant_key', TENANT_KEY).eq('id', id)
  if (error) throw new Error(error.message)
  await history(client, actor, 'delete_permanently', 'px_workbench', id, existing, null)
  return { deleted: true, id }
}

export async function createItem(workbenchId: string, input: Partial<PxWorkbenchItem>, actor: PxActor) {
  const current = await getWorkbench(workbenchId, actor)
  if (!current) throw new Error('Workbench not found.')
  const client = await createServiceClient()
  const { data, error } = await table(client, 'px_workbench_items').insert({
    tenant_key: TENANT_KEY, workbench_id: workbenchId, parent_id: input.parentId || null, item_kind: input.itemKind || 'note',
    source_ref: input.sourceRef || null, source_version: input.sourceVersion || null, title: input.title || '', sort_order: input.sortOrder ?? (current.items.length + 1) * 100,
    start_minute: input.startMinute ?? null, duration_minutes: input.durationMinutes ?? null, quantity: input.quantity ?? 1,
    locked: input.locked ?? false, payload: input.payload || {},
  }).select('*').single()
  if (error || !data) throw new Error(error?.message || 'Item creation failed.')
  await table(client, 'px_workbenches').update({ updated_by: actor.id, updated_at: now() }).eq('tenant_key', TENANT_KEY).eq('id', workbenchId)
  await history(client, actor, 'create', 'px_workbench_item', String(data.id), null, data)
  return mapItem(data)
}

export async function updateItem(workbenchId: string, itemId: string, patch: Record<string, any>, actor: PxActor) {
  const current = await getWorkbench(workbenchId, actor)
  if (!current) throw new Error('Workbench not found.')
  const existing = current.items.find((item) => item.id === itemId)
  if (!existing) throw new Error('Workbench item not found.')
  const allowed: Record<string, any> = { updated_at: now() }
  if (patch.parentId !== undefined) allowed.parent_id = patch.parentId || null
  if (patch.title !== undefined) allowed.title = string(patch.title)
  if (patch.sortOrder !== undefined) allowed.sort_order = Math.trunc(number(patch.sortOrder))
  if (patch.startMinute !== undefined) allowed.start_minute = patch.startMinute == null ? null : Math.max(0, Math.trunc(number(patch.startMinute)))
  if (patch.durationMinutes !== undefined) allowed.duration_minutes = patch.durationMinutes == null ? null : Math.max(1, Math.trunc(number(patch.durationMinutes)))
  if (patch.quantity !== undefined) allowed.quantity = Math.max(1, Math.trunc(number(patch.quantity, 1)))
  if (patch.locked !== undefined) allowed.locked = Boolean(patch.locked)
  if (patch.payload !== undefined) allowed.payload = object(patch.payload)
  if (patch.sourceRef !== undefined) allowed.source_ref = patch.sourceRef || null
  if (patch.sourceVersion !== undefined) allowed.source_version = patch.sourceVersion || null
  const client = await createServiceClient()
  const { data, error } = await table(client, 'px_workbench_items').update(allowed).eq('tenant_key', TENANT_KEY).eq('id', itemId).eq('workbench_id', workbenchId).select('*').single()
  if (error || !data) throw new Error(error?.message || 'Item update failed.')
  await table(client, 'px_workbenches').update({ updated_by: actor.id, updated_at: now() }).eq('tenant_key', TENANT_KEY).eq('id', workbenchId)
  await history(client, actor, 'update', 'px_workbench_item', itemId, existing, data)
  return mapItem(data)
}

export async function deleteItem(workbenchId: string, itemId: string, actor: PxActor) {
  const current = await getWorkbench(workbenchId, actor)
  if (!current) throw new Error('Workbench not found.')
  const existing = current.items.find((item) => item.id === itemId)
  if (!existing) throw new Error('Workbench item not found.')
  const client = await createServiceClient()
  const { error } = await table(client, 'px_workbench_items').delete().eq('tenant_key', TENANT_KEY).eq('id', itemId).eq('workbench_id', workbenchId)
  if (error) throw new Error(error.message)
  await table(client, 'px_workbenches').update({ updated_by: actor.id, updated_at: now() }).eq('tenant_key', TENANT_KEY).eq('id', workbenchId)
  await history(client, actor, 'delete_permanently', 'px_workbench_item', itemId, existing, null)
  return { deleted: true, id: itemId }
}

export async function listFavorites(actor: PxActor): Promise<PxFavorite[]> {
  const client = await createServiceClient()
  const { data, error } = await table(client, 'px_favorites').select('*').eq('tenant_key', TENANT_KEY).eq('actor_id', actor.id).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map((row: any) => ({ id: String(row.id), entityType: String(row.entity_type), entityId: String(row.entity_id), label: String(row.label), href: row.href == null ? null : String(row.href), metadata: object(row.metadata), createdAt: String(row.created_at) }))
}

export async function upsertFavorite(input: Record<string, any>, actor: PxActor) {
  const client = await createServiceClient()
  const row = { tenant_key: TENANT_KEY, actor_id: actor.id, entity_type: string(input.entityType), entity_id: string(input.entityId), label: string(input.label, input.entityId), href: input.href || null, metadata: object(input.metadata) }
  const { data, error } = await table(client, 'px_favorites').upsert(row, { onConflict: 'tenant_key,actor_id,entity_type,entity_id' }).select('*').single()
  if (error || !data) throw new Error(error?.message || 'Favorite save failed.')
  return { id: String(data.id), ...row, createdAt: String(data.created_at) }
}

export async function deleteFavorite(id: string, actor: PxActor) {
  const client = await createServiceClient()
  const { error } = await table(client, 'px_favorites').delete().eq('tenant_key', TENANT_KEY).eq('actor_id', actor.id).eq('id', id)
  if (error) throw new Error(error.message)
  return { deleted: true, id }
}

export async function listSavedViews(actor: PxActor): Promise<PxSavedView[]> {
  const client = await createServiceClient()
  const { data, error } = await table(client, 'px_saved_views').select('*').eq('tenant_key', TENANT_KEY).eq('actor_id', actor.id).order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map((row: any) => ({ id: String(row.id), name: String(row.name), workspace: String(row.workspace), query: object(row.query), display: object(row.display), createdAt: String(row.created_at), updatedAt: String(row.updated_at) }))
}

export async function saveView(input: Record<string, any>, actor: PxActor) {
  const client = await createServiceClient()
  const row = { tenant_key: TENANT_KEY, actor_id: actor.id, name: string(input.name, 'Vue enregistrée'), workspace: string(input.workspace, 'flashcards-os'), query: object(input.query), display: object(input.display), updated_at: now() }
  const request = input.id ? table(client, 'px_saved_views').update(row).eq('tenant_key', TENANT_KEY).eq('actor_id', actor.id).eq('id', String(input.id)) : table(client, 'px_saved_views').insert(row)
  const { data, error } = await request.select('*').single()
  if (error || !data) throw new Error(error?.message || 'Saved view operation failed.')
  return { id: String(data.id), name: String(data.name), workspace: String(data.workspace), query: object(data.query), display: object(data.display), createdAt: String(data.created_at), updatedAt: String(data.updated_at) }
}

export async function deleteSavedView(id: string, actor: PxActor) {
  const client = await createServiceClient()
  const { error } = await table(client, 'px_saved_views').delete().eq('tenant_key', TENANT_KEY).eq('actor_id', actor.id).eq('id', id)
  if (error) throw new Error(error.message)
  return { deleted: true, id }
}

export async function listAnnotations(entityType: string, entityId: string): Promise<PxAnnotation[]> {
  const client = await createServiceClient()
  const { data, error } = await table(client, 'px_annotations').select('*').eq('tenant_key', TENANT_KEY).eq('entity_type', entityType).eq('entity_id', entityId).order('created_at')
  if (error) throw new Error(error.message)
  return (data || []).map((row: any) => ({ id: String(row.id), entityType: String(row.entity_type), entityId: String(row.entity_id), anchor: row.anchor == null ? null : String(row.anchor), body: String(row.body), resolved: Boolean(row.resolved), createdBy: String(row.created_by), createdByName: String(row.created_by_name), createdAt: String(row.created_at), updatedAt: String(row.updated_at) }))
}

export async function createAnnotation(input: Record<string, any>, actor: PxActor) {
  const client = await createServiceClient()
  const { data, error } = await table(client, 'px_annotations').insert({ tenant_key: TENANT_KEY, entity_type: string(input.entityType), entity_id: string(input.entityId), anchor: input.anchor || null, body: string(input.body), resolved: false, created_by: actor.id, created_by_name: actor.name }).select('*').single()
  if (error || !data) throw new Error(error?.message || 'Comment creation failed.')
  return data
}

export async function updateAnnotation(id: string, patch: Record<string, any>, actor: PxActor) {
  const client = await createServiceClient()
  const { data: existing, error: existingError } = await table(client, 'px_annotations').select('*').eq('tenant_key', TENANT_KEY).eq('id', id).single()
  if (existingError || !existing) throw new Error('Comment not found.')
  if (String(existing.created_by) !== actor.id && actor.role !== 'admin' && actor.role !== 'super_admin') throw new Error('Comment access denied.')
  const update: Record<string, any> = { updated_at: now() }
  if (patch.body !== undefined) update.body = string(patch.body)
  if (patch.resolved !== undefined) update.resolved = Boolean(patch.resolved)
  const { data, error } = await table(client, 'px_annotations').update(update).eq('tenant_key', TENANT_KEY).eq('id', id).select('*').single()
  if (error || !data) throw new Error(error?.message || 'Comment update failed.')
  return data
}

export async function deleteAnnotation(id: string, actor: PxActor) {
  const client = await createServiceClient()
  const { data: existing, error: existingError } = await table(client, 'px_annotations').select('*').eq('tenant_key', TENANT_KEY).eq('id', id).single()
  if (existingError || !existing) throw new Error('Comment not found.')
  if (String(existing.created_by) !== actor.id && actor.role !== 'admin' && actor.role !== 'super_admin') throw new Error('Comment access denied.')
  const { error } = await table(client, 'px_annotations').delete().eq('tenant_key', TENANT_KEY).eq('id', id)
  if (error) throw new Error(error.message)
  return { deleted: true, id }
}

export async function registerDocument(input: Record<string, any>, actor: PxActor): Promise<PxDocumentRecord> {
  const client = await createServiceClient()
  const { data, error } = await table(client, 'px_document_registry').insert({
    tenant_key: TENANT_KEY, source_type: string(input.sourceType), source_id: string(input.sourceId), template_code: string(input.templateCode),
    title: string(input.title), file_name: string(input.fileName), checksum_sha256: string(input.checksumSha256), audience: string(input.audience, 'operations'),
    confidentiality: string(input.confidentiality, 'internal'), orientation: input.orientation === 'landscape' ? 'landscape' : 'portrait',
    density: ['compact', 'detailed'].includes(String(input.density)) ? input.density : 'standard', metadata: object(input.metadata), created_by: actor.id,
  }).select('*').single()
  if (error || !data) throw new Error(error?.message || 'Document registry operation failed.')
  return { id: String(data.id), sourceType: String(data.source_type), sourceId: String(data.source_id), templateCode: String(data.template_code), title: String(data.title), fileName: String(data.file_name), checksumSha256: String(data.checksum_sha256), audience: String(data.audience), confidentiality: String(data.confidentiality), orientation: data.orientation, density: data.density, metadata: object(data.metadata), createdAt: String(data.created_at) }
}

export async function listDocuments(actor: PxActor): Promise<PxDocumentRecord[]> {
  const client = await createServiceClient()
  const { data, error } = await table(client, 'px_document_registry').select('*').eq('tenant_key', TENANT_KEY).eq('created_by', actor.id).order('created_at', { ascending: false }).limit(100)
  if (error) throw new Error(error.message)
  return (data || []).map((row: any) => ({ id: String(row.id), sourceType: String(row.source_type), sourceId: String(row.source_id), templateCode: String(row.template_code), title: String(row.title), fileName: String(row.file_name), checksumSha256: String(row.checksum_sha256), audience: String(row.audience), confidentiality: String(row.confidentiality), orientation: row.orientation, density: row.density, metadata: object(row.metadata), createdAt: String(row.created_at) }))
}

export async function deleteDocument(id: string, actor: PxActor) {
  const client = await createServiceClient()
  const { error } = await table(client, 'px_document_registry').delete().eq('tenant_key', TENANT_KEY).eq('created_by', actor.id).eq('id', id)
  if (error) throw new Error(error.message)
  return { deleted: true, id }
}

export async function touchRecent(input: Record<string, any>, actor: PxActor): Promise<PxRecentItem> {
  const client = await createServiceClient()
  const row = { tenant_key: TENANT_KEY, actor_id: actor.id, entity_type: string(input.entityType), entity_id: string(input.entityId), label: string(input.label), href: string(input.href), metadata: object(input.metadata), last_opened_at: now() }
  const { data, error } = await table(client, 'px_recent_items').upsert(row, { onConflict: 'tenant_key,actor_id,entity_type,entity_id' }).select('*').single()
  if (error || !data) throw new Error(error?.message || 'Recent item update failed.')
  return { id: String(data.id), entityType: String(data.entity_type), entityId: String(data.entity_id), label: String(data.label), href: String(data.href), metadata: object(data.metadata), lastOpenedAt: String(data.last_opened_at) }
}

export async function listRecent(actor: PxActor): Promise<PxRecentItem[]> {
  const client = await createServiceClient()
  const { data, error } = await table(client, 'px_recent_items').select('*').eq('tenant_key', TENANT_KEY).eq('actor_id', actor.id).order('last_opened_at', { ascending: false }).limit(60)
  if (error) throw new Error(error.message)
  return (data || []).map((row: any) => ({ id: String(row.id), entityType: String(row.entity_type), entityId: String(row.entity_id), label: String(row.label), href: String(row.href), metadata: object(row.metadata), lastOpenedAt: String(row.last_opened_at) }))
}

export async function getOrCreateScenarioWorkbench(scenarioId: string, actor: PxActor) {
  const client = await createServiceClient()
  const { data: existing } = await table(client, 'px_workbenches').select('*').eq('tenant_key', TENANT_KEY).eq('created_by', actor.id).eq('source_type', 'catalogue_scenario').eq('source_id', scenarioId).order('updated_at', { ascending: false }).limit(1).maybeSingle()
  if (existing) return getWorkbench(String(existing.id), actor)

  const [{ data: packageRow }, { data: journeyRow }] = await Promise.all([
    table(client, 'solution_scenarios').select('*').eq('tenant_key', TENANT_KEY).eq('id', scenarioId).maybeSingle(),
    table(client, 'journey_scenarios').select('*').eq('tenant_key', TENANT_KEY).eq('id', scenarioId).maybeSingle(),
  ])
  const row = packageRow || journeyRow
  if (!row) throw new Error('Catalogue scenario not found.')
  const snapshot = object(row.snapshot)
  const mode: PxWorkbenchKind = packageRow ? 'package' : 'journey'
  const items: Array<Partial<PxWorkbenchItem>> = []
  if (mode === 'package') {
    const rationales = Array.isArray(snapshot.collectionRationales) ? snapshot.collectionRationales : []
    const rationaleMap = new Map(rationales.map((item: any) => [String(item.collectionId), item]))
    const lines = Array.isArray(object(snapshot.commercial).lines) ? object(snapshot.commercial).lines : []
    const lineMap = new Map((lines as any[]).map((line: any) => [String(line.collectionId), line]))
    const collectionIds = Array.isArray(snapshot.collectionIds) ? snapshot.collectionIds.map(String) : []
    collectionIds.forEach((collectionId: string, index: number) => {
      const line = lineMap.get(collectionId) as any
      const rationale = rationaleMap.get(collectionId) as any
      items.push({ itemKind: 'collection', sourceRef: collectionId, sourceVersion: line?.versionLabel || null, title: String(line?.collectionName || collectionId), sortOrder: (index + 1) * 100, quantity: Number(line?.quantity || 1), payload: { rationale: rationale?.rationale || '', unitPriceDh: Number(line?.unitPriceDh || 0), subtotalDh: Number(line?.subtotalDh || 0), usageOrder: rationale?.usageOrder || index + 1 } })
    })
  } else {
    const days = Array.isArray(snapshot.days) ? snapshot.days : []
    for (const day of days) {
      const sessions = Array.isArray(day.sessions) ? day.sessions : []
      for (const session of sessions) {
        const activities = Array.isArray(session.activities) ? session.activities : []
        for (const activity of activities) {
          items.push({ itemKind: 'activity', sourceRef: String(activity.collectionId || ''), sourceVersion: null, title: String(activity.title || 'Activité'), sortOrder: Number(day.dayNumber || 1) * 100000 + Number(session.sessionNumber || 1) * 1000 + Number(activity.order || items.length + 1), durationMinutes: Number(activity.durationMinutes || 10), quantity: 1, payload: { dayNumber: Number(day.dayNumber || 1), dayTitle: String(day.title || ''), sessionNumber: Number(session.sessionNumber || 1), sessionTitle: String(session.title || ''), instruction: String(activity.instruction || ''), cardReference: String(activity.cardReference || ''), objectiveKeys: Array.isArray(activity.objectiveKeys) ? activity.objectiveKeys : [], expectedObservation: String(activity.expectedObservation || ''), facilitatorInstruction: String(session.facilitatorInstruction || ''), successIndicator: String(session.successIndicator || '') } })
        }
      }
    }
  }
  return createWorkbench({ kind: mode, sourceId: scenarioId, sourceType: 'catalogue_scenario', title: String(snapshot.name || row.name || 'Flashcards Workbench'), universe: String(row.universe || 'internal') as PxUniverse, payload: { mode, scenarioId, requestId: String(row.request_id || ''), commercial: object(row.commercial_calculation), customerPromise: snapshot.customerPromise || snapshot.expectedOutcome || '', sourceModel: snapshot.modelUsed || '' }, sourceSnapshot: snapshot, items }, actor)
}

export async function duplicateWorkbench(id: string, actor: PxActor) {
  const current = await getWorkbench(id, actor)
  if (!current) throw new Error('Workbench not found.')
  return createWorkbench({ kind: current.workbench.kind, sourceId: current.workbench.sourceId, sourceType: current.workbench.sourceType, title: `${current.workbench.title} · Copie`, universe: current.workbench.universe, payload: { ...current.workbench.payload, duplicatedFrom: id }, sourceSnapshot: current.workbench.sourceSnapshot, items: current.items.map((item) => ({ itemKind: item.itemKind, sourceRef: item.sourceRef, sourceVersion: item.sourceVersion, title: item.title, sortOrder: item.sortOrder, startMinute: item.startMinute, durationMinutes: item.durationMinutes, quantity: item.quantity, locked: item.locked, payload: item.payload })) }, actor)
}

export async function replaceWorkbenchItems(workbenchId: string, items: Array<Partial<PxWorkbenchItem>>, actor: PxActor) {
  const current = await getWorkbench(workbenchId, actor)
  if (!current) throw new Error('Workbench not found.')
  const client = await createServiceClient()
  const before = current.items
  const { error: deleteError } = await table(client, 'px_workbench_items').delete().eq('tenant_key', TENANT_KEY).eq('workbench_id', workbenchId)
  if (deleteError) throw new Error(deleteError.message)
  if (items.length) {
    const rows = items.map((item, index) => ({ tenant_key: TENANT_KEY, workbench_id: workbenchId, parent_id: null, item_kind: item.itemKind || 'note', source_ref: item.sourceRef || null, source_version: item.sourceVersion || null, title: item.title || '', sort_order: item.sortOrder ?? (index + 1) * 100, start_minute: item.startMinute ?? null, duration_minutes: item.durationMinutes ?? null, quantity: item.quantity ?? 1, locked: item.locked ?? false, payload: item.payload || {} }))
    const { error } = await table(client, 'px_workbench_items').insert(rows)
    if (error) throw new Error(error.message)
  }
  await table(client, 'px_workbenches').update({ updated_by: actor.id, updated_at: now() }).eq('tenant_key', TENANT_KEY).eq('id', workbenchId)
  await history(client, actor, 'replace_items', 'px_workbench', workbenchId, before, items)
  return getWorkbench(workbenchId, actor)
}

export async function recordScenarioComposition(input: { workbenchId: string; kind: 'merge'|'transformation'|'duplicate'; sourceScenarioIds?: string[]; transformationKey?: string | null; before: unknown; proposed: unknown; applied?: unknown; providerRoute?: string | null; actualModel?: string | null }, actor: PxActor) {
  const client = await createServiceClient()
  const { data, error } = await table(client, 'px_scenario_compositions').insert({ tenant_key: TENANT_KEY, workbench_id: input.workbenchId, composition_kind: input.kind, source_scenario_ids: input.sourceScenarioIds || [], transformation_key: input.transformationKey || null, before_snapshot: input.before || {}, proposed_snapshot: input.proposed || {}, applied_snapshot: input.applied ?? null, provider_route: input.providerRoute || null, actual_model: input.actualModel || null, created_by: actor.id }).select('*').single()
  if (error || !data) throw new Error(error?.message || 'Composition lineage operation failed.')
  return data
}

export async function getWorkspacePreference(preferenceKey:string, actor:PxActor){
 const client=await createServiceClient();const {data,error}=await table(client,'px_workspace_preferences').select('*').eq('tenant_key',TENANT_KEY).eq('actor_id',actor.id).eq('preference_key',preferenceKey).maybeSingle();if(error)throw new Error(error.message);return data?.value&&typeof data.value==='object'?data.value:{}
}
export async function setWorkspacePreference(preferenceKey:string,value:Record<string,any>,actor:PxActor){
 const client=await createServiceClient();const {data,error}=await table(client,'px_workspace_preferences').upsert({tenant_key:TENANT_KEY,actor_id:actor.id,preference_key:preferenceKey,value,updated_at:now()},{onConflict:'tenant_key,actor_id,preference_key'}).select('*').single();if(error)throw new Error(error.message);return data
}
