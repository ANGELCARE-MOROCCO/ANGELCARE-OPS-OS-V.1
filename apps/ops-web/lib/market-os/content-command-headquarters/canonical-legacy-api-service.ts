import { createServiceClient } from '@/lib/supabase/server'
import {
  applyCanonicalCompatibilityCommit,
  archiveCanonicalNote,
  archiveCanonicalTaxonomy,
  archiveCanonicalTemplate,
  createCanonicalNote,
  getCanonicalCompatibilityStore,
  listCanonicalNotes,
  listCanonicalTaxonomy,
  listCanonicalTemplates,
  upsertCanonicalTaxonomy,
  upsertCanonicalTemplate,
} from './canonical-compatibility-service'
import { auditContentHeadquarters, createContentDossier, getContentHeadquartersSnapshot } from './repository'
import type { CanonicalCompatibilityStore, CompatibilityAsset, CompatibilityContentItem, CompatibilityTask } from './canonical-compatibility-types'
import type { JsonRecord } from './types'

export type CanonicalActor = { id: string; name: string }

const clean = (value: unknown) => String(value ?? '').trim()
const dateOnly = (value: unknown) => clean(value).slice(0, 10)
const json = (value: unknown): JsonRecord => value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
const list = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : []

function cloneStore(store: CanonicalCompatibilityStore): CanonicalCompatibilityStore {
  return JSON.parse(JSON.stringify(store)) as CanonicalCompatibilityStore
}

function legacyPriority(value: unknown): CompatibilityContentItem['priority'] {
  const v = clean(value).toLowerCase()
  return v === 'critical' ? 'Critical' : v === 'high' ? 'High' : v === 'low' ? 'Low' : 'Medium'
}

function assetStatus(value: unknown): CompatibilityAsset['status'] {
  const v = clean(value).toLowerCase()
  if (v.includes('approve') || v.includes('ready') || v.includes('valid')) return 'approved'
  if (v.includes('revision') || v.includes('blocked')) return 'needs revision'
  if (v.includes('archive') || v.includes('retired')) return 'archived'
  return 'draft'
}

function legacyTaskStatus(value: unknown): CompatibilityTask['status'] {
  const v = clean(value).toLowerCase()
  if (['done', 'completed', 'closed', 'validated'].includes(v)) return 'done'
  if (['doing', 'in_progress', 'running', 'active'].includes(v)) return 'doing'
  if (['blocked', 'paused', 'failed'].includes(v)) return 'blocked'
  return 'todo'
}

function compatibilityAssetFromPayload(payload: JsonRecord): CompatibilityAsset {
  const metadata = json(payload.metadata)
  return {
    id: clean(payload.id) || `asset-${Date.now()}`,
    name: clean(payload.title || payload.name) || 'Asset sans titre',
    type: (clean(payload.type || metadata.assetType || 'Other') || 'Other') as CompatibilityAsset['type'],
    channel: clean(payload.channel || metadata.channel || 'Instagram'),
    linkedContentId: clean(payload.linkedContentId || payload.linked_content_id || metadata.dossierId || metadata.contentId),
    owner: clean(payload.owner || metadata.owner || 'Creative Producer'),
    status: assetStatus(payload.status),
    url: clean(payload.preview_url || payload.url || payload.storage_path),
    notes: clean(payload.notes || metadata.notes || payload.description),
  }
}

function bulkAsset(row: CompatibilityAsset, dossiers: Map<string, CompatibilityContentItem>) {
  const dossier = dossiers.get(row.linkedContentId)
  return {
    id: row.id,
    family: dossier?.type?.toLowerCase().includes('print') ? 'print_offline' : dossier?.type?.toLowerCase().includes('document') ? 'corporate_document' : 'digital',
    title: row.name,
    category: row.type,
    subcategory: row.type,
    output: row.type,
    channel: row.channel,
    service_product: dossier?.campaign || 'AngelCare',
    owner: row.owner,
    status: row.status,
    priority: dossier?.priority || 'Medium',
    storage_path: row.url || null,
    preview_url: row.url || null,
    metadata: { dossierId: row.linkedContentId || null, notes: row.notes, canonical: true },
    created_at: dossier?.createdAt || null,
    updated_at: dossier?.updatedAt || null,
  }
}

function compatibilityDocumentFromPayload(payload: JsonRecord): CompatibilityContentItem {
  const metadata = json(payload.metadata)
  const now = new Date().toISOString()
  return {
    id: clean(payload.id) || `document-${Date.now()}`,
    title: clean(payload.title || payload.name) || 'Document sans titre',
    type: clean(payload.document_type || payload.category || 'Corporate Document'),
    channel: clean(payload.channel || 'Landing Page'),
    campaign: clean(metadata.campaign || payload.campaign || 'Documentation institutionnelle'),
    owner: clean(payload.owner || 'Content Lead'),
    reviewer: clean(metadata.reviewer || 'Brand Manager'),
    status: clean(payload.status).toLowerCase().includes('archive') ? 'archived' : clean(payload.status).toLowerCase().includes('approve') ? 'approved' : 'draft',
    priority: legacyPriority(payload.priority),
    dueDate: dateOnly(payload.due_at || metadata.dueDate),
    scheduledDate: dateOnly(metadata.scheduledDate),
    body: clean(metadata.body || payload.description),
    objective: clean(metadata.objective || payload.description || payload.title),
    audience: clean(metadata.audience || 'Audience institutionnelle'),
    angle: clean(metadata.message || metadata.angle),
    cta: clean(metadata.cta),
    assets: [],
    brandScore: Number(metadata.readiness || 0),
    seoKeyword: clean(metadata.seoKeyword),
    notes: clean(metadata.notes || payload.confidentiality),
    createdAt: clean(payload.created_at) || now,
    updatedAt: now,
  }
}

function bulkDocument(row: CompatibilityContentItem) {
  return {
    id: row.id,
    title: row.title,
    document_type: row.type,
    category: row.type,
    subcategory: row.type,
    owner: row.owner,
    version: 'v1',
    status: row.status,
    confidentiality: row.notes || 'internal',
    storage_path: null,
    metadata: {
      dossierId: row.id,
      campaign: row.campaign,
      audience: row.audience,
      objective: row.objective,
      message: row.angle,
      canonical: true,
    },
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }
}

function compatibilityTaskFromPayload(payload: JsonRecord): CompatibilityTask {
  const metadata = json(payload.metadata)
  return {
    id: clean(payload.id) || `task-${Date.now()}`,
    contentId: clean(payload.contentId || payload.content_id || payload.dossier_id || metadata.dossierId),
    title: clean(payload.title || payload.name) || 'Tâche sans titre',
    owner: clean(payload.owner || payload.assignee_name || payload.assigned_to_name || 'Content Lead'),
    status: legacyTaskStatus(payload.status),
    dueDate: dateOnly(payload.dueDate || payload.due_date || payload.due_at),
    priority: legacyPriority(payload.priority),
    notes: clean(payload.notes || payload.description || payload.completion_definition),
  }
}

function bulkTask(row: CompatibilityTask) {
  return {
    id: row.id,
    dossier_id: row.contentId || null,
    content_id: row.contentId || null,
    title: row.title,
    owner: row.owner,
    assigned_to_name: row.owner,
    status: row.status,
    due_at: row.dueDate || null,
    priority: row.priority,
    notes: row.notes,
    description: row.notes,
    metadata: { canonical: true },
  }
}

export async function listLegacyAssets() {
  const store = await getCanonicalCompatibilityStore()
  const dossiers = new Map<string, CompatibilityContentItem>(store.items.map((row) => [row.id, row]))
  return store.assets.map((row) => bulkAsset(row, dossiers))
}

export async function upsertLegacyAsset(actor: CanonicalActor, payload: JsonRecord) {
  const before = await getCanonicalCompatibilityStore()
  const after = cloneStore(before)
  const record = compatibilityAssetFromPayload(payload)
  const index = after.assets.findIndex((row) => row.id === record.id)
  if (index >= 0) after.assets[index] = record
  else after.assets.unshift(record)
  const persisted = await applyCanonicalCompatibilityCommit({ before, after, mutationAction: 'legacy_asset_upsert', detail: record.name, actorId: actor.id, actorName: actor.name })
  const match = persisted.assets.find((row) => row.id === record.id) || persisted.assets.find((row) => row.name === record.name && row.linkedContentId === record.linkedContentId)
  return bulkAsset(match || record, new Map(persisted.items.map((row) => [row.id, row])))
}

export async function archiveLegacyAsset(actor: CanonicalActor, id: string) {
  const before = await getCanonicalCompatibilityStore()
  const after = cloneStore(before)
  after.assets = after.assets.filter((row) => row.id !== id)
  await applyCanonicalCompatibilityCommit({ before, after, mutationAction: 'legacy_asset_archive', detail: id, actorId: actor.id, actorName: actor.name })
}

export async function listLegacyDocuments() {
  const store = await getCanonicalCompatibilityStore()
  return store.items.map(bulkDocument)
}

export async function upsertLegacyDocument(actor: CanonicalActor, payload: JsonRecord) {
  const before = await getCanonicalCompatibilityStore()
  const after = cloneStore(before)
  const record = compatibilityDocumentFromPayload(payload)
  const index = after.items.findIndex((row) => row.id === record.id)
  if (index >= 0) after.items[index] = record
  else after.items.unshift(record)
  const persisted = await applyCanonicalCompatibilityCommit({ before, after, mutationAction: 'legacy_document_upsert', detail: record.title, actorId: actor.id, actorName: actor.name })
  const match = persisted.items.find((row) => row.id === record.id) || persisted.items.find((row) => row.title === record.title)
  return bulkDocument(match || record)
}

export async function archiveLegacyDocument(actor: CanonicalActor, id: string) {
  const before = await getCanonicalCompatibilityStore()
  const after = cloneStore(before)
  after.items = after.items.filter((row) => row.id !== id)
  await applyCanonicalCompatibilityCommit({ before, after, mutationAction: 'legacy_document_archive', detail: id, actorId: actor.id, actorName: actor.name })
}

export async function listLegacyTasks() {
  const store = await getCanonicalCompatibilityStore()
  return store.tasks.map(bulkTask)
}

export async function upsertLegacyTask(actor: CanonicalActor, payload: JsonRecord) {
  const before = await getCanonicalCompatibilityStore()
  const after = cloneStore(before)
  const record = compatibilityTaskFromPayload(payload)
  const index = after.tasks.findIndex((row) => row.id === record.id)
  if (index >= 0) after.tasks[index] = record
  else after.tasks.unshift(record)
  const persisted = await applyCanonicalCompatibilityCommit({ before, after, mutationAction: 'legacy_task_upsert', detail: record.title, actorId: actor.id, actorName: actor.name })
  const match = persisted.tasks.find((row) => row.id === record.id) || persisted.tasks.find((row) => row.title === record.title && row.contentId === record.contentId)
  return bulkTask(match || record)
}

export async function archiveLegacyTask(actor: CanonicalActor, id: string) {
  const before = await getCanonicalCompatibilityStore()
  const after = cloneStore(before)
  after.tasks = after.tasks.filter((row) => row.id !== id)
  await applyCanonicalCompatibilityCommit({ before, after, mutationAction: 'legacy_task_cancel', detail: id, actorId: actor.id, actorName: actor.name })
}

export async function legacyWorkspace() {
  const [store, templates, notes, taxonomy, snapshot] = await Promise.all([
    getCanonicalCompatibilityStore(),
    listCanonicalTemplates(),
    listCanonicalNotes(),
    listCanonicalTaxonomy(),
    getContentHeadquartersSnapshot(),
  ])
  const dossiers = new Map<string, CompatibilityContentItem>(store.items.map((row) => [row.id, row]))
  return {
    assets: store.assets.map((row) => bulkAsset(row, dossiers)),
    documents: store.items.map(bulkDocument),
    tasks: store.tasks.map(bulkTask),
    comments: notes.map(noteToLegacy),
    categories: taxonomy.map(taxonomyToLegacy),
    templates: templates.map(templateToLegacy),
    activity: store.logs.map((row) => ({ id: row.id, entity_type: row.entity, entity_id: null, action: row.action, actor: 'Content Command', payload: { detail: row.detail }, created_at: row.timestamp })),
    snapshot,
  }
}

export function templateToLegacy(row: JsonRecord) {
  const dna = json(row.dna)
  return { ...dna, id: clean(row.id), name: clean(row.name || dna.name), family: clean(row.family || dna.family), category: clean(row.category || dna.category), owner: clean(row.owner_name || dna.owner), status: clean(row.status || dna.status), lastUpdated: clean(row.updated_at), updated_at: row.updated_at }
}

export function noteToLegacy(row: JsonRecord) {
  const metadata = json(row.metadata)
  return { ...metadata, id: clean(row.id), entity_id: clean(row.dossier_id || metadata.entity_id), template_id: clean(row.template_id || metadata.template_id), author: clean(row.author_name || metadata.author), role: clean(metadata.role || 'team'), message: clean(row.body || metadata.message), status: clean(row.status), created_at: row.created_at, updated_at: row.updated_at }
}

export function taxonomyToLegacy(row: JsonRecord) {
  const metadata = json(row.metadata)
  return { ...metadata, id: clean(row.id), family: clean(metadata.family || row.node_type), name: clean(row.label), label: clean(row.label), code: clean(row.stable_key), status: clean(row.status), updated_at: row.updated_at }
}

export async function canonicalTemplates() { return (await listCanonicalTemplates()).map(templateToLegacy) }
export async function saveCanonicalTemplate(actor: CanonicalActor, payload: JsonRecord) { return templateToLegacy(await upsertCanonicalTemplate({ actorId: actor.id, actorName: actor.name, template: payload })) }
export async function removeCanonicalTemplate(actor: CanonicalActor, id: string) { return archiveCanonicalTemplate({ actorId: actor.id, actorName: actor.name, templateId: id, reason: 'Retired through compatibility route' }) }
export async function canonicalComments(filters: { dossierId?: string; taskId?: string; templateId?: string } = {}) { return (await listCanonicalNotes(filters)).map(noteToLegacy) }
export async function saveCanonicalComment(actor: CanonicalActor, payload: JsonRecord) { return noteToLegacy(await createCanonicalNote({ actorId: actor.id, actorName: actor.name, payload })) }
export async function removeCanonicalComment(actor: CanonicalActor, id: string) { return archiveCanonicalNote({ actorId: actor.id, actorName: actor.name, noteId: id }) }
export async function canonicalCategories() { return (await listCanonicalTaxonomy()).map(taxonomyToLegacy) }
export async function saveCanonicalCategory(actor: CanonicalActor, payload: JsonRecord) { return taxonomyToLegacy(await upsertCanonicalTaxonomy({ actorId: actor.id, actorName: actor.name, payload })) }
export async function removeCanonicalCategory(actor: CanonicalActor, id: string) { return archiveCanonicalTaxonomy({ actorId: actor.id, actorName: actor.name, nodeId: id }) }

export async function canonicalAnalytics() {
  const snapshot = await getContentHeadquartersSnapshot()
  const store = await getCanonicalCompatibilityStore()
  const statuses = store.items.reduce<Record<string, number>>((acc, row) => { acc[row.status] = (acc[row.status] || 0) + 1; return acc }, {})
  return {
    totals: {
      dossiers: snapshot.dossiers.length,
      missions: snapshot.missions.length,
      tasks: snapshot.tasks.length,
      evidence: snapshot.evidence.length,
      publications: snapshot.publicationPackages.length,
    },
    statuses,
    overdueTasks: store.tasks.filter((row) => row.dueDate && row.dueDate < new Date().toISOString().slice(0, 10) && row.status !== 'done').length,
    source: 'market_content_canonical',
  }
}

export async function canonicalSearch(query: string) {
  const workspace = await legacyWorkspace()
  const q = query.trim().toLowerCase()
  if (!q) return []
  const rows = [
    ...workspace.documents.map((row: JsonRecord) => ({ type: 'document', ...row })),
    ...workspace.tasks.map((row: JsonRecord) => ({ type: 'task', ...row })),
    ...workspace.assets.map((row: JsonRecord) => ({ type: 'asset', ...row })),
    ...workspace.templates.map((row: JsonRecord) => ({ type: 'template', ...row })),
  ]
  return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q)).slice(0, 120)
}

export async function recordLegacyCommand(actor: CanonicalActor, payload: JsonRecord) {
  const action = clean(payload.action || payload.command || 'legacy_command')
  await auditContentHeadquarters({ actorId: actor.id, actorName: actor.name, action: `compatibility.${action}`, entityType: clean(payload.entity_type || 'content_command'), entityId: clean(payload.entity_id) || null, detail: payload })
  return { persisted: true, source: 'market_content_audit', action }
}

export async function createLegacyDocumentDirect(actor: CanonicalActor, payload: JsonRecord) {
  const record = compatibilityDocumentFromPayload(payload)
  const dossier = await createContentDossier({
    actorId: actor.id,
    actorName: actor.name,
    title: record.title,
    family: record.type.toLowerCase().includes('print') ? 'print_offline' : record.type.toLowerCase().includes('document') ? 'corporate_document' : 'digital',
    category: record.type,
    subcategory: clean(payload.subcategory || record.type),
    serviceKey: clean(payload.service_key || 'angelcare'),
    serviceLabel: clean(payload.service_label || 'AngelCare'),
    campaignLabel: record.campaign,
    audience: record.audience,
    city: clean(payload.city || 'National'),
    language: clean(payload.language || 'fr'),
    channel: record.channel,
    journeyStage: clean(payload.journey_stage || 'brief'),
    objective: record.objective,
    messagePillar: record.angle,
    cta: record.cta,
    ownerName: record.owner,
    reviewerName: record.reviewer,
    dueAt: record.dueDate,
    brief: { title: record.title, objective: record.objective, audience: record.audience, message: record.body || record.angle, format: record.type, channels: [record.channel], tone: 'Premium AngelCare', version: 'v1', notes: record.notes },
  })
  return bulkDocument({ ...record, id: dossier.id, createdAt: dossier.created_at, updatedAt: dossier.updated_at })
}

export async function canonicalVersions(dossierId?: string) {
  const supabase = await createServiceClient() as any
  const [sources, samples, replacements] = await Promise.all([
    supabase.from('market_content_source_objects').select('*').order('created_at', { ascending: false }).limit(250),
    supabase.from('market_content_generated_samples').select('*').order('created_at', { ascending: false }).limit(250),
    supabase.from('market_content_source_replacements').select('*').order('requested_at', { ascending: false }).limit(250),
  ])
  const rows = [...list<JsonRecord>(sources.data), ...list<JsonRecord>(samples.data), ...list<JsonRecord>(replacements.data)]
  return dossierId ? rows.filter((row) => clean(row.dossier_id) === dossierId) : rows
}
