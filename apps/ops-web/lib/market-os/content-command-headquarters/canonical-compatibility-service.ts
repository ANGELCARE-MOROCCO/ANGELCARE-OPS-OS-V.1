import { createServiceClient } from '@/lib/supabase/server'
import {
  archiveDossierWithCleanup,
  saveDossierBrief,
} from './dossier-recovery-service'
import {
  auditContentHeadquarters,
  createContentDossier,
  createMission,
  getContentHeadquartersSnapshot,
} from './repository'
import type { ContentDossier, ContentEvidence, ContentMissionTask, JsonRecord } from './types'
import type {
  CanonicalCommitPayload,
  CanonicalCompatibilityStore,
  CompatibilityAsset,
  CompatibilityBrandRule,
  CompatibilityBrief,
  CompatibilityContentItem,
  CompatibilityLog,
  CompatibilityTask,
} from './canonical-compatibility-types'

const TABLES = {
  dossiers: 'market_content_dossiers',
  missions: 'market_content_missions',
  tasks: 'market_content_mission_tasks',
  evidence: 'market_content_evidence',
  doctrine: 'market_ai_doctrine_entries',
  audit: 'market_content_audit',
  templates: 'market_content_templates',
  notes: 'market_content_notes',
  taxonomy: 'market_content_taxonomy_nodes',
  links: 'market_content_compatibility_links',
} as const

const clean = (value: unknown) => String(value ?? '').trim()
const list = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : []
const dateOnly = (value: unknown) => clean(value).slice(0, 10)
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const isMissing = (error: unknown) => {
  const message = clean((error as { message?: string })?.message || error).toLowerCase()
  return message.includes('does not exist') || message.includes('schema cache') || message.includes('could not find')
}

function priorityToLegacy(value: unknown): CompatibilityContentItem['priority'] {
  const normalized = clean(value).toLowerCase()
  if (normalized === 'critical') return 'Critical'
  if (normalized === 'high') return 'High'
  if (normalized === 'low') return 'Low'
  return 'Medium'
}

function priorityToCanonical(value: unknown) {
  return clean(value).toLowerCase() || 'medium'
}

function dossierStatusToLegacy(status: unknown): CompatibilityContentItem['status'] {
  const value = clean(status)
  if (['opportunity', 'ideation'].includes(value)) return 'idea'
  if (['brief', 'scope_locked', 'planned', 'assigned'].includes(value)) return 'brief'
  if (['in_creation', 'checkpoint_review'].includes(value)) return 'draft'
  if (['draft_submitted', 'ai_review', 'human_review'].includes(value)) return 'review'
  if (value === 'revision') return 'revision'
  if (['validated', 'source_required', 'source_secured', 'classified', 'ready_distribution'].includes(value)) return 'approved'
  if (value === 'scheduled') return 'scheduled'
  if (['published', 'performance_review', 'closed'].includes(value)) return 'published'
  if (value === 'archived') return 'archived'
  return 'brief'
}

function legacyStatusToDossier(status: unknown) {
  const value = clean(status)
  const map: Record<string, string> = {
    idea: 'ideation',
    brief: 'brief',
    draft: 'in_creation',
    review: 'human_review',
    approved: 'validated',
    scheduled: 'scheduled',
    published: 'published',
    revision: 'revision',
    archived: 'archived',
  }
  return map[value] || 'brief'
}

function briefStatusFromDossier(dossier: ContentDossier): CompatibilityBrief['status'] {
  const explicit = clean((dossier.brief as JsonRecord)?.status)
  if (['draft', 'ready', 'used', 'archived'].includes(explicit)) return explicit as CompatibilityBrief['status']
  if (dossier.status === 'archived') return 'archived'
  if (['scope_locked', 'planned', 'assigned', 'in_creation', 'checkpoint_review', 'draft_submitted', 'ai_review', 'human_review', 'revision', 'validated', 'source_required', 'source_secured', 'classified', 'ready_distribution', 'scheduled', 'published', 'performance_review', 'closed'].includes(dossier.status)) return 'used'
  return 'draft'
}

function evidenceStatusToLegacy(value: unknown): CompatibilityAsset['status'] {
  const status = clean(value)
  if (['accepted', 'approved', 'verified'].includes(status)) return 'approved'
  if (['rejected', 'revision', 'needs_revision'].includes(status)) return 'needs revision'
  if (['archived', 'superseded', 'cancelled'].includes(status)) return 'archived'
  return 'draft'
}

function legacyAssetStatus(value: CompatibilityAsset['status']) {
  if (value === 'approved') return 'accepted'
  if (value === 'needs revision') return 'revision'
  if (value === 'archived') return 'archived'
  return 'submitted'
}

function assetType(row: ContentEvidence): CompatibilityAsset['type'] {
  const source = `${row.content_type || ''} ${row.evidence_type || ''} ${row.filename || ''}`.toLowerCase()
  if (source.includes('video')) return 'Video'
  if (source.includes('pdf')) return 'PDF'
  if (source.includes('script')) return 'Script'
  if (source.includes('brief')) return 'Brief'
  if (source.includes('presentation') || source.includes('powerpoint')) return 'Presentation'
  if (source.includes('landing')) return 'Landing'
  if (source.includes('image')) return 'Image'
  return 'Other'
}

function doctrineCategory(value: unknown): CompatibilityBrandRule['category'] {
  const category = clean(value).toLowerCase()
  if (category.includes('visual')) return 'Visual'
  if (category.includes('cta') || category.includes('conversion')) return 'CTA'
  if (category.includes('medical') || category.includes('privacy') || category.includes('sensitive')) return 'Medical sensitivity'
  if (category.includes('message') || category.includes('copy')) return 'Message'
  if (category.includes('tone') || category.includes('brand')) return 'Tone'
  return 'Compliance'
}

async function safeRead<T>(table: string, order = 'updated_at', limit = 500): Promise<T[]> {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(table).select('*').order(order, { ascending: false }).limit(limit)
  if (result.error) {
    if (isMissing(result.error)) return []
    throw result.error
  }
  return list<T>(result.data)
}

export async function getCanonicalCompatibilityStore(): Promise<CanonicalCompatibilityStore> {
  const [snapshot, doctrine, audit] = await Promise.all([
    getContentHeadquartersSnapshot(),
    safeRead<JsonRecord>(TABLES.doctrine, 'updated_at', 500),
    safeRead<JsonRecord>(TABLES.audit, 'created_at', 250),
  ])

  const packageByDossier = new Map<string, JsonRecord>()
  for (const pkg of snapshot.publicationPackages) {
    if (!packageByDossier.has(pkg.dossier_id)) packageByDossier.set(pkg.dossier_id, pkg as unknown as JsonRecord)
  }

  const assetsByDossier = new Map<string, string[]>()
  for (const entry of snapshot.evidence) {
    const current = assetsByDossier.get(entry.dossier_id) || []
    current.push(entry.id)
    assetsByDossier.set(entry.dossier_id, current)
  }

  const dossierById = new Map<string, ContentDossier>(snapshot.dossiers.map((dossier) => [dossier.id, dossier]))

  const items: CompatibilityContentItem[] = snapshot.dossiers.map((dossier) => {
    const brief = (dossier.brief || {}) as JsonRecord
    const pkg = packageByDossier.get(dossier.id)
    return {
      id: dossier.id,
      title: dossier.title,
      type: dossier.subcategory || dossier.category || dossier.family,
      channel: dossier.channel || 'Instagram',
      campaign: dossier.campaign_label || '',
      owner: dossier.owner_name || '',
      reviewer: dossier.reviewer_name || '',
      status: dossierStatusToLegacy(dossier.status),
      priority: priorityToLegacy(dossier.priority),
      dueDate: dateOnly(dossier.due_at),
      scheduledDate: dateOnly(pkg?.scheduled_at),
      body: clean(brief.body || brief.message || dossier.message_pillar),
      objective: dossier.objective || clean(brief.objective),
      audience: dossier.audience || clean(brief.audience),
      angle: dossier.message_pillar || clean(brief.angle || brief.message),
      cta: dossier.cta || clean(brief.cta),
      assets: assetsByDossier.get(dossier.id) || [],
      brandScore: Number(dossier.readiness || 0),
      seoKeyword: clean(brief.seoKeyword || brief.seo_keyword),
      notes: clean(brief.notes || brief.limitations),
      createdAt: dossier.created_at,
      updatedAt: dossier.updated_at,
    }
  })

  const tasks: CompatibilityTask[] = snapshot.tasks.map((task) => ({
    id: task.id,
    contentId: task.dossier_id || '',
    title: task.title,
    owner: task.assigned_to_name || '',
    status: ['todo', 'doing', 'done', 'blocked'].includes(task.status) ? task.status as CompatibilityTask['status'] : task.status === 'cancelled' ? 'done' : 'todo',
    dueDate: dateOnly(task.due_at),
    priority: priorityToLegacy(task.priority),
    notes: task.description || task.completion_definition || '',
  }))

  const assets: CompatibilityAsset[] = snapshot.evidence.map((entry) => ({
    id: entry.id,
    name: entry.title || entry.filename || 'Asset',
    type: assetType(entry),
    channel: dossierById.get(entry.dossier_id)?.channel || 'Instagram',
    linkedContentId: entry.dossier_id,
    owner: entry.submitted_by_name || '',
    status: evidenceStatusToLegacy(entry.status),
    url: entry.preview_url || '',
    notes: entry.note || '',
  }))

  const briefs: CompatibilityBrief[] = snapshot.dossiers.map((dossier) => {
    const brief = (dossier.brief || {}) as JsonRecord
    return {
      id: `brief:${dossier.id}`,
      title: clean(brief.title) || dossier.title,
      campaign: dossier.campaign_label || '',
      audience: clean(brief.audience) || dossier.audience,
      objective: clean(brief.objective) || dossier.objective,
      message: clean(brief.message || brief.coreMessage || brief.core_message) || dossier.message_pillar,
      channel: dossier.channel || 'Instagram',
      owner: clean(brief.owner) || dossier.owner_name || '',
      dueDate: dateOnly(brief.dueDate || brief.due_date || dossier.due_at),
      status: briefStatusFromDossier(dossier),
    }
  })

  const rules: CompatibilityBrandRule[] = doctrine
    .filter((entry) => !['rejected'].includes(clean(entry.authority_state)))
    .map((entry) => {
      const content = clean(entry.content)
      let required = true
      let notes = content
      try {
        const parsed = JSON.parse(content) as JsonRecord
        required = parsed.required === undefined ? true : Boolean(parsed.required)
        notes = clean(parsed.notes || parsed.content || entry.content)
      } catch {}
      return {
        id: clean(entry.id),
        title: clean(entry.title),
        category: doctrineCategory(entry.category),
        required,
        active: !['historical', 'rejected'].includes(clean(entry.authority_state)),
        notes,
      }
    })

  const logs: CompatibilityLog[] = audit.map((entry) => ({
    id: clean(entry.id),
    timestamp: clean(entry.created_at),
    action: clean(entry.action),
    entity: clean(entry.entity_type),
    detail: typeof entry.detail === 'string' ? entry.detail : JSON.stringify(entry.detail || {}),
  }))

  return { items, tasks, assets, briefs, rules, logs }
}

function mapById<T extends { id: string }>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row]))
}

async function updateDossierFromItem(actor: { id: string; name: string }, item: CompatibilityContentItem) {
  const supabase = await createServiceClient() as any
  const current = await supabase.from(TABLES.dossiers).select('*').eq('id', item.id).maybeSingle()
  if (current.error) throw current.error
  if (!current.data) return
  const currentBrief = (current.data.brief || {}) as JsonRecord
  const patch = {
    title: item.title,
    category: item.type || current.data.category,
    subcategory: item.type || current.data.subcategory,
    channel: item.channel,
    campaign_label: item.campaign || null,
    owner_name: item.owner || null,
    reviewer_name: item.reviewer || null,
    status: legacyStatusToDossier(item.status),
    priority: priorityToCanonical(item.priority),
    due_at: item.dueDate || null,
    audience: item.audience,
    objective: item.objective,
    message_pillar: item.angle || item.body,
    cta: item.cta,
    readiness: Math.max(0, Math.min(100, Number(item.brandScore || 0))),
    brief: {
      ...currentBrief,
      body: item.body,
      objective: item.objective,
      audience: item.audience,
      message: item.angle || item.body,
      cta: item.cta,
      notes: item.notes,
      seoKeyword: item.seoKeyword,
      status: item.status === 'archived' ? 'archived' : currentBrief.status || 'draft',
    },
    updated_at: new Date().toISOString(),
  }
  const update = await supabase.from(TABLES.dossiers).update(patch).eq('id', item.id)
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: actor.id, actorName: actor.name, action: 'canonical_compat.dossier.updated', entityType: 'content_dossier', entityId: item.id, detail: { source: 'legacy_ui_compatibility' } })
}

async function createDossierFromItem(actor: { id: string; name: string }, item: CompatibilityContentItem) {
  return createContentDossier({
    actorId: actor.id,
    actorName: actor.name,
    title: item.title || 'Contenu sans titre',
    family: /(print|poster|flyer|brochure|rollup)/i.test(item.type) ? 'print_offline' : /(document|policy|sop|presentation|memo)/i.test(item.type) ? 'corporate_document' : 'digital',
    category: item.type || 'Content',
    subcategory: item.type || 'Content',
    serviceKey: 'angelcare',
    serviceLabel: 'ANGELCARE',
    campaignLabel: item.campaign,
    audience: item.audience,
    city: '',
    language: 'fr',
    channel: item.channel,
    journeyStage: 'production',
    objective: item.objective,
    messagePillar: item.angle || item.body,
    cta: item.cta,
    ownerName: item.owner,
    reviewerName: item.reviewer,
    dueAt: item.dueDate,
    brief: {
      body: item.body,
      objective: item.objective,
      audience: item.audience,
      message: item.angle || item.body,
      cta: item.cta,
      notes: item.notes,
      seoKeyword: item.seoKeyword,
      status: 'draft',
    },
    scopeConstitution: { legacyCompatibilityEntry: true, originalClientId: item.id },
  })
}

async function ensureMissionForDossier(actor: { id: string; name: string }, dossierId: string) {
  const supabase = await createServiceClient() as any
  const dossierResult = await supabase.from(TABLES.dossiers).select('id,title,objective,priority,owner_id,owner_name,reviewer_id,reviewer_name,due_at,mission_id').eq('id', dossierId).single()
  if (dossierResult.error) throw dossierResult.error
  if (dossierResult.data.mission_id) {
    const mission = await supabase.from(TABLES.missions).select('id,code').eq('id', dossierResult.data.mission_id).single()
    if (!mission.error && mission.data) return mission.data as { id: string; code: string }
  }
  const created = await createMission({
    actorId: actor.id,
    actorName: actor.name,
    dossierId,
    title: `Mission · ${dossierResult.data.title}`,
    objective: dossierResult.data.objective || `Exécuter ${dossierResult.data.title}`,
    scope: 'Exécution canonique du dossier Content Command Center.',
    successDefinition: 'Tâches clôturées, preuves constituées et décisions enregistrées.',
    priority: dossierResult.data.priority || 'medium',
    assignedTo: dossierResult.data.owner_id || undefined,
    assignedToName: dossierResult.data.owner_name || undefined,
    reviewerId: dossierResult.data.reviewer_id || undefined,
    reviewerName: dossierResult.data.reviewer_name || undefined,
    dueAt: dossierResult.data.due_at || undefined,
  })
  const link = await supabase.from(TABLES.dossiers).update({ mission_id: created.id, updated_at: new Date().toISOString() }).eq('id', dossierId)
  if (link.error) throw link.error
  return { id: created.id, code: created.code }
}

async function createTaskFromCompatibility(actor: { id: string; name: string }, task: CompatibilityTask) {
  if (!task.contentId || !isUuid(task.contentId)) throw new Error('TASK_DOSSIER_REQUIRED')
  const supabase = await createServiceClient() as any
  const mission = await ensureMissionForDossier(actor, task.contentId)
  const countResult = await supabase.from(TABLES.tasks).select('id', { count: 'exact', head: true }).eq('mission_id', mission.id)
  if (countResult.error) throw countResult.error
  const sequence = Number(countResult.count || 0) + 1
  const insert = await supabase.from(TABLES.tasks).insert({
    mission_id: mission.id,
    dossier_id: task.contentId,
    code: `${mission.code}-T${String(sequence).padStart(2, '0')}`,
    title: task.title,
    description: task.notes || '',
    status: task.status,
    priority: priorityToCanonical(task.priority),
    sequence_number: sequence,
    assigned_to_name: task.owner || null,
    due_at: task.dueDate || null,
    evidence_required: true,
    completion_definition: 'Preuve exigée et acceptée dans Dossier 360.',
    created_by: actor.id || null,
  }).select('*').single()
  if (insert.error) throw insert.error
  await auditContentHeadquarters({ actorId: actor.id, actorName: actor.name, action: 'canonical_compat.task.created', entityType: 'mission_task', entityId: insert.data.id, detail: { originalClientId: task.id } })
  return insert.data as ContentMissionTask
}

async function updateTaskFromCompatibility(actor: { id: string; name: string }, task: CompatibilityTask) {
  if (!isUuid(task.id)) return
  const supabase = await createServiceClient() as any
  const update = await supabase.from(TABLES.tasks).update({
    title: task.title,
    description: task.notes || '',
    status: task.status,
    priority: priorityToCanonical(task.priority),
    assigned_to_name: task.owner || null,
    due_at: task.dueDate || null,
    progress: task.status === 'done' ? 100 : task.status === 'doing' ? 50 : 0,
    updated_at: new Date().toISOString(),
  }).eq('id', task.id)
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: actor.id, actorName: actor.name, action: 'canonical_compat.task.updated', entityType: 'mission_task', entityId: task.id })
}

async function createAssetFromCompatibility(actor: { id: string; name: string }, asset: CompatibilityAsset) {
  if (!asset.linkedContentId || !isUuid(asset.linkedContentId)) throw new Error('ASSET_DOSSIER_REQUIRED')
  const supabase = await createServiceClient() as any
  const insert = await supabase.from(TABLES.evidence).insert({
    dossier_id: asset.linkedContentId,
    evidence_type: 'asset_reference',
    title: asset.name,
    note: asset.notes || '',
    content_type: asset.type,
    filename: asset.name,
    preview_url: asset.url || null,
    progress_percent: asset.status === 'approved' ? 100 : 0,
    submitted_by: actor.id || null,
    submitted_by_name: asset.owner || actor.name,
    status: legacyAssetStatus(asset.status),
  }).select('*').single()
  if (insert.error) throw insert.error
  await auditContentHeadquarters({ actorId: actor.id, actorName: actor.name, action: 'canonical_compat.asset.created', entityType: 'evidence', entityId: insert.data.id, detail: { originalClientId: asset.id } })
  return insert.data as ContentEvidence
}

async function updateAssetFromCompatibility(actor: { id: string; name: string }, asset: CompatibilityAsset) {
  if (!isUuid(asset.id)) return
  const supabase = await createServiceClient() as any
  const update = await supabase.from(TABLES.evidence).update({
    title: asset.name,
    note: asset.notes || '',
    content_type: asset.type,
    filename: asset.name,
    preview_url: asset.url || null,
    submitted_by_name: asset.owner || actor.name,
    status: legacyAssetStatus(asset.status),
    progress_percent: asset.status === 'approved' ? 100 : 0,
  }).eq('id', asset.id)
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: actor.id, actorName: actor.name, action: 'canonical_compat.asset.updated', entityType: 'evidence', entityId: asset.id })
}

function dossierIdFromBrief(brief: CompatibilityBrief) {
  if (brief.id.startsWith('brief:')) return brief.id.slice('brief:'.length)
  return isUuid(brief.id) ? brief.id : ''
}

async function createBriefFromCompatibility(actor: { id: string; name: string }, brief: CompatibilityBrief) {
  return createContentDossier({
    actorId: actor.id,
    actorName: actor.name,
    title: brief.title || 'Brief sans titre',
    family: 'digital',
    category: 'Brief',
    subcategory: 'Brief Constitution',
    serviceKey: 'angelcare',
    serviceLabel: 'ANGELCARE',
    campaignLabel: brief.campaign,
    audience: brief.audience,
    city: '',
    language: 'fr',
    channel: brief.channel,
    journeyStage: 'brief',
    objective: brief.objective,
    messagePillar: brief.message,
    ownerName: brief.owner,
    dueAt: brief.dueDate,
    brief: {
      title: brief.title,
      campaign: brief.campaign,
      audience: brief.audience,
      objective: brief.objective,
      message: brief.message,
      channel: brief.channel,
      owner: brief.owner,
      dueDate: brief.dueDate,
      status: brief.status,
    },
    scopeConstitution: { createdFromBriefingSuite: true, originalClientId: brief.id },
  })
}

async function updateBriefFromCompatibility(actor: { id: string; name: string }, brief: CompatibilityBrief) {
  const dossierId = dossierIdFromBrief(brief)
  if (!dossierId || !isUuid(dossierId)) return
  await saveDossierBrief({
    actorId: actor.id,
    actorName: actor.name,
    dossierId,
    brief: {
      objective: brief.objective,
      audience: brief.audience,
      coreMessage: brief.message,
      channels: brief.channel ? [brief.channel] : [],
      dueAt: brief.dueDate,
    },
  })
  const supabase = await createServiceClient() as any
  const update = await supabase.from(TABLES.dossiers).update({
    title: brief.title,
    campaign_label: brief.campaign || null,
    audience: brief.audience,
    objective: brief.objective,
    message_pillar: brief.message,
    channel: brief.channel,
    owner_name: brief.owner || null,
    due_at: brief.dueDate || null,
    updated_at: new Date().toISOString(),
  }).eq('id', dossierId)
  if (update.error) throw update.error
}

function doctrineCode(rule: CompatibilityBrandRule) {
  if (isUuid(rule.id)) return ''
  return (`BRAND-${rule.id || rule.title}`).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

async function upsertRule(actor: { id: string; name: string }, rule: CompatibilityBrandRule) {
  const supabase = await createServiceClient() as any
  const payload = {
    title: rule.title,
    category: rule.category,
    authority_state: rule.active ? 'provisional' : 'historical',
    content: JSON.stringify({ notes: rule.notes, required: rule.required, source: 'Brand Governance Workspace' }),
    source: 'Content Command Brand Governance',
    updated_at: new Date().toISOString(),
  }
  if (isUuid(rule.id)) {
    const current = await supabase.from(TABLES.doctrine).select('authority_state').eq('id', rule.id).maybeSingle()
    if (current.error) throw current.error
    const immutable = ['canonical', 'approved'].includes(clean(current.data?.authority_state))
    const update = await supabase.from(TABLES.doctrine).update(immutable ? { title: rule.title, category: rule.category, content: payload.content, updated_at: payload.updated_at } : payload).eq('id', rule.id)
    if (update.error) throw update.error
    return
  }
  const insert = await supabase.from(TABLES.doctrine).insert({
    code: doctrineCode(rule),
    ...payload,
    version: '1.0.0',
    created_by: actor.id || null,
  })
  if (insert.error) throw insert.error
}

export async function applyCanonicalCompatibilityCommit(input: CanonicalCommitPayload & { actorId: string; actorName: string }) {
  const actor = { id: input.actorId, name: input.actorName }
  const beforeItems = mapById(input.before.items || [])
  const afterItems = mapById(input.after.items || [])
  const beforeTasks = mapById(input.before.tasks || [])
  const afterTasks = mapById(input.after.tasks || [])
  const beforeAssets = mapById(input.before.assets || [])
  const afterAssets = mapById(input.after.assets || [])
  const beforeBriefs = mapById(input.before.briefs || [])
  const afterBriefs = mapById(input.after.briefs || [])
  const beforeRules = mapById(input.before.rules || [])
  const afterRules = mapById(input.after.rules || [])

  const canonicalIdByClientId = new Map<string, string>()
  for (const item of afterItems.values()) {
    const previous = beforeItems.get(item.id)
    if (!previous) {
      const created = await createDossierFromItem(actor, item)
      canonicalIdByClientId.set(item.id, created.id)
      await recordCompatibilityLink({ legacySystem: 'content-command-client', legacyEntity: 'content_item', legacyId: item.id, canonicalEntity: 'content_dossier', canonicalId: created.id, metadata: { title: item.title } })
    } else if (!same(previous, item)) await updateDossierFromItem(actor, item)
  }
  for (const item of beforeItems.values()) {
    if (!afterItems.has(item.id) && isUuid(item.id)) {
      try { await archiveDossierWithCleanup({ actorId: actor.id, actorName: actor.name, dossierId: item.id, reason: input.detail || 'Archived from canonical compatibility UI.' }) }
      catch (error) { if (!clean((error as Error)?.message).includes('ALREADY_ARCHIVED')) throw error }
    }
  }

  for (const task of afterTasks.values()) {
    const previous = beforeTasks.get(task.id)
    const resolvedTask = canonicalIdByClientId.has(task.contentId) ? { ...task, contentId: canonicalIdByClientId.get(task.contentId) || task.contentId } : task
    if (!previous) {
      const created = await createTaskFromCompatibility(actor, resolvedTask)
      await recordCompatibilityLink({ legacySystem: 'content-command-client', legacyEntity: 'content_task', legacyId: task.id, canonicalEntity: 'mission_task', canonicalId: created.id, metadata: { title: task.title } })
    } else if (!same(previous, task)) await updateTaskFromCompatibility(actor, resolvedTask)
  }
  for (const task of beforeTasks.values()) {
    if (!afterTasks.has(task.id) && isUuid(task.id)) {
      const supabase = await createServiceClient() as any
      const update = await supabase.from(TABLES.tasks).update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', task.id)
      if (update.error) throw update.error
      await auditContentHeadquarters({ actorId: actor.id, actorName: actor.name, action: 'canonical_compat.task.cancelled', entityType: 'mission_task', entityId: task.id, detail: { reason: input.detail } })
    }
  }

  for (const asset of afterAssets.values()) {
    const previous = beforeAssets.get(asset.id)
    const resolvedAsset = canonicalIdByClientId.has(asset.linkedContentId) ? { ...asset, linkedContentId: canonicalIdByClientId.get(asset.linkedContentId) || asset.linkedContentId } : asset
    if (!previous) {
      const created = await createAssetFromCompatibility(actor, resolvedAsset)
      await recordCompatibilityLink({ legacySystem: 'content-command-client', legacyEntity: 'content_asset', legacyId: asset.id, canonicalEntity: 'evidence', canonicalId: created.id, metadata: { name: asset.name } })
    } else if (!same(previous, asset)) await updateAssetFromCompatibility(actor, resolvedAsset)
  }
  for (const asset of beforeAssets.values()) {
    if (!afterAssets.has(asset.id) && isUuid(asset.id)) {
      const supabase = await createServiceClient() as any
      const update = await supabase.from(TABLES.evidence).update({ status: 'archived' }).eq('id', asset.id)
      if (update.error) throw update.error
      await auditContentHeadquarters({ actorId: actor.id, actorName: actor.name, action: 'canonical_compat.asset.archived', entityType: 'evidence', entityId: asset.id, detail: { reason: input.detail } })
    }
  }

  for (const brief of afterBriefs.values()) {
    const previous = beforeBriefs.get(brief.id)
    if (!previous) {
      const created = await createBriefFromCompatibility(actor, brief)
      await recordCompatibilityLink({ legacySystem: 'content-command-client', legacyEntity: 'content_brief', legacyId: brief.id, canonicalEntity: 'content_dossier', canonicalId: created.id, metadata: { title: brief.title } })
    } else if (!same(previous, brief)) await updateBriefFromCompatibility(actor, brief)
  }
  for (const brief of beforeBriefs.values()) {
    if (!afterBriefs.has(brief.id)) {
      const dossierId = dossierIdFromBrief(brief)
      if (dossierId && isUuid(dossierId)) {
        const supabase = await createServiceClient() as any
        const dossier = await supabase.from(TABLES.dossiers).select('id,status,category,brief').eq('id', dossierId).maybeSingle()
        if (dossier.error) throw dossier.error
        if (dossier.data) {
          const nextBrief = { ...(dossier.data.brief || {}), status: 'archived', archivedAt: new Date().toISOString() }
          const patch: JsonRecord = { brief: nextBrief, updated_at: new Date().toISOString() }
          if (dossier.data.category === 'Brief' && ['opportunity', 'ideation', 'brief', 'scope_locked'].includes(clean(dossier.data.status))) patch.status = 'archived'
          const update = await supabase.from(TABLES.dossiers).update(patch).eq('id', dossierId)
          if (update.error) throw update.error
        }
      }
    }
  }

  for (const rule of afterRules.values()) {
    const previous = beforeRules.get(rule.id)
    if (!previous || !same(previous, rule)) await upsertRule(actor, rule)
  }
  for (const rule of beforeRules.values()) {
    if (!afterRules.has(rule.id) && isUuid(rule.id)) {
      const supabase = await createServiceClient() as any
      const current = await supabase.from(TABLES.doctrine).select('authority_state').eq('id', rule.id).maybeSingle()
      if (current.error) throw current.error
      if (!['canonical', 'approved'].includes(clean(current.data?.authority_state))) {
        const update = await supabase.from(TABLES.doctrine).update({ authority_state: 'historical', updated_at: new Date().toISOString() }).eq('id', rule.id)
        if (update.error) throw update.error
      }
    }
  }

  await auditContentHeadquarters({ actorId: actor.id, actorName: actor.name, action: 'canonical_compat.store_commit', entityType: 'content_command', detail: { mutationAction: input.mutationAction, detail: input.detail } })
  return getCanonicalCompatibilityStore()
}

export async function recordCompatibilityLink(input: { legacySystem: string; legacyEntity: string; legacyId: string; canonicalEntity: string; canonicalId: string; metadata?: JsonRecord }) {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(TABLES.links).upsert({
    legacy_system: input.legacySystem,
    legacy_entity: input.legacyEntity,
    legacy_id: input.legacyId,
    canonical_entity: input.canonicalEntity,
    canonical_id: input.canonicalId,
    metadata: input.metadata || {},
    migrated_at: new Date().toISOString(),
  }, { onConflict: 'legacy_system,legacy_entity,legacy_id' })
  if (result.error && !isMissing(result.error)) throw result.error
}

export async function listCanonicalTemplates() {
  return safeRead<JsonRecord>(TABLES.templates, 'updated_at', 500)
}

export async function upsertCanonicalTemplate(input: { actorId: string; actorName: string; template: JsonRecord }) {
  const supabase = await createServiceClient() as any
  const id = clean(input.template.id)
  const code = clean(input.template.code || input.template.templateCode || input.template.name || id || `TPL-${Date.now()}`).toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 90)
  const row = {
    code,
    name: clean(input.template.name || input.template.title || 'Template'),
    family: clean(input.template.family || 'digital'),
    category: clean(input.template.category || 'Custom'),
    status: clean(input.template.status || 'draft'),
    owner_name: clean(input.template.owner || input.actorName),
    dna: input.template,
    updated_at: new Date().toISOString(),
  }
  const query = id && isUuid(id)
    ? supabase.from(TABLES.templates).update(row).eq('id', id).select('*').single()
    : supabase.from(TABLES.templates).upsert({ ...row, created_by: input.actorId || null }, { onConflict: 'code' }).select('*').single()
  const result = await query
  if (result.error) throw result.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'template.upserted', entityType: 'content_template', entityId: result.data.id })
  return result.data as JsonRecord
}

export async function archiveCanonicalTemplate(input: { actorId: string; actorName: string; templateId: string; reason: string }) {
  const supabase = await createServiceClient() as any
  const update = await supabase.from(TABLES.templates).update({ status: 'archived', archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', input.templateId)
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'template.archived', entityType: 'content_template', entityId: input.templateId, detail: { reason: input.reason } })
}

export async function listCanonicalNotes(filters: { dossierId?: string; taskId?: string; templateId?: string } = {}) {
  const supabase = await createServiceClient() as any
  let query = supabase.from(TABLES.notes).select('*').order('created_at', { ascending: false }).limit(500)
  if (filters.dossierId) query = query.eq('dossier_id', filters.dossierId)
  if (filters.taskId) query = query.eq('task_id', filters.taskId)
  if (filters.templateId) query = query.eq('template_id', filters.templateId)
  const result = await query
  if (result.error) {
    if (isMissing(result.error)) return []
    throw result.error
  }
  return list<JsonRecord>(result.data)
}

export async function createCanonicalNote(input: { actorId: string; actorName: string; payload: JsonRecord }) {
  const supabase = await createServiceClient() as any
  const dossierId = clean(input.payload.dossier_id || input.payload.entity_id)
  const missionId = clean(input.payload.mission_id)
  const taskId = clean(input.payload.task_id)
  const templateId = clean(input.payload.template_id)
  const insert = await supabase.from(TABLES.notes).insert({
    dossier_id: isUuid(dossierId) ? dossierId : null,
    mission_id: isUuid(missionId) ? missionId : null,
    task_id: isUuid(taskId) ? taskId : null,
    template_id: isUuid(templateId) ? templateId : null,
    note_type: clean(input.payload.note_type || input.payload.type || 'comment'),
    body: clean(input.payload.body || input.payload.comment || input.payload.message || input.payload.content),
    status: clean(input.payload.status || 'open'),
    author_id: input.actorId || null,
    author_name: clean(input.payload.author || input.actorName),
    metadata: input.payload,
  }).select('*').single()
  if (insert.error) throw insert.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'note.created', entityType: 'content_note', entityId: insert.data.id })
  return insert.data as JsonRecord
}

export async function archiveCanonicalNote(input: { actorId: string; actorName: string; noteId: string }) {
  const supabase = await createServiceClient() as any
  const update = await supabase.from(TABLES.notes).update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', input.noteId)
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'note.archived', entityType: 'content_note', entityId: input.noteId })
}

export async function listCanonicalTaxonomy() {
  return safeRead<JsonRecord>(TABLES.taxonomy, 'updated_at', 500)
}

export async function upsertCanonicalTaxonomy(input: { actorId: string; actorName: string; payload: JsonRecord }) {
  const supabase = await createServiceClient() as any
  const stableKey = clean(input.payload.stable_key || input.payload.stableKey || input.payload.code || input.payload.id || input.payload.label || input.payload.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (!stableKey) throw new Error('TAXONOMY_STABLE_KEY_REQUIRED')
  const result = await supabase.from(TABLES.taxonomy).upsert({
    node_type: clean(input.payload.node_type || input.payload.type || input.payload.family || 'category'),
    stable_key: stableKey,
    label: clean(input.payload.label || input.payload.name || input.payload.title || stableKey),
    status: clean(input.payload.status || 'active'),
    metadata: input.payload,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'node_type,stable_key' }).select('*').single()
  if (result.error) throw result.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'taxonomy.upserted', entityType: 'taxonomy_node', entityId: result.data.id })
  return result.data as JsonRecord
}

export async function archiveCanonicalTaxonomy(input: { actorId: string; actorName: string; nodeId: string }) {
  const supabase = await createServiceClient() as any
  const update = await supabase.from(TABLES.taxonomy).update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', input.nodeId)
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'taxonomy.archived', entityType: 'taxonomy_node', entityId: input.nodeId })
}
