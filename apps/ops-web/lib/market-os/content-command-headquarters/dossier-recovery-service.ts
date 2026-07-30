import { createServiceClient } from '@/lib/supabase/server'
import { auditContentHeadquarters } from './repository'
import type { ContentDossier, JsonRecord } from './types'

const TABLES = {
  dossiers: 'market_content_dossiers',
  missions: 'market_content_missions',
  tasks: 'market_content_mission_tasks',
  checkpoints: 'market_content_checkpoints',
  evidence: 'market_content_evidence',
  aiReviews: 'market_content_ai_reviews',
  humanReviews: 'market_content_human_reviews',
  sources: 'market_content_source_objects',
  sourceReplacements: 'market_content_source_replacements',
  samples: 'market_content_generated_samples',
  credits: 'market_content_generation_credits',
  packages: 'market_content_publication_packages',
  performance: 'market_content_performance_events',
  learning: 'market_content_learning_records',
} as const

const IMMUTABLE_DOSSIER_STATUSES = new Set([
  'validated', 'source_required', 'source_secured', 'classified', 'ready_distribution',
  'scheduled', 'published', 'performance_review', 'closed',
])

const ACTIVE_TASK_STATUSES = ['todo', 'doing', 'blocked']
const ACTIVE_MISSION_STATUSES = [
  'proposed', 'qualifying', 'scope_approved', 'ready', 'assigned', 'accepted',
  'in_progress', 'checkpoint', 'submitted', 'ai_review', 'human_review',
  'revision', 'blocked', 'paused',
]
const PROTECTED_MISSION_STATUSES = new Set(['validated', 'closed', 'archived'])
const PROTECTED_PACKAGE_STATUSES = new Set([
  'authorized', 'scheduled', 'executing', 'published', 'verified', 'withdrawn', 'superseded',
])

const clean = (value: unknown) => String(value ?? '').trim()
const jsonRecord = (value: unknown): JsonRecord => value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
const stringList = (value: unknown): string[] => Array.isArray(value)
  ? value.map(clean).filter(Boolean)
  : clean(value).split(/[\n,;]/).map((item) => item.trim()).filter(Boolean)

function isMissingValue(value: unknown) {
  const normalized = clean(value).toLocaleLowerCase('fr-FR')
  if (!normalized) return true
  return [
    'non défini', 'non définie', 'non documenté', 'non documentée', 'à constituer',
    'à sélectionner', 'format non défini', 'ton non défini', 'version non définie',
  ].some((marker) => normalized.includes(marker))
}

export type DossierBriefPayload = {
  objective?: string
  audience?: string
  userProblem?: string
  coreMessage?: string
  supportingMessages?: string[]
  format?: string
  channels?: string[]
  tone?: string
  references?: string[]
  version?: string
  dueAt?: string
}

export type DossierBriefReadiness = {
  score: number
  complete: boolean
  missing: string[]
  checks: Array<{ key: string; label: string; present: boolean }>
}

function normalizeBrief(dossier: JsonRecord, payload: DossierBriefPayload = {}): JsonRecord {
  const existing = jsonRecord(dossier.brief)
  const scope = jsonRecord(dossier.scope_constitution)
  const channels = payload.channels !== undefined
    ? stringList(payload.channels)
    : stringList(existing.channels ?? dossier.channel)

  return {
    ...existing,
    version: clean(payload.version ?? existing.version ?? dossier.brief_version) || 'v1',
    objective: clean(payload.objective ?? existing.objective ?? dossier.objective),
    audience: clean(payload.audience ?? existing.audience ?? dossier.audience),
    user_problem: clean(payload.userProblem ?? existing.user_problem ?? existing.problem),
    message: clean(payload.coreMessage ?? existing.message ?? dossier.message_pillar),
    supporting_messages: payload.supportingMessages !== undefined ? stringList(payload.supportingMessages) : stringList(existing.supporting_messages),
    format: clean(payload.format ?? existing.format ?? scope.requiredOutput ?? scope.required_output),
    channels,
    tone: clean(payload.tone ?? existing.tone),
    references: payload.references !== undefined ? stringList(payload.references) : stringList(existing.references),
    due_at: clean(payload.dueAt ?? existing.due_at ?? dossier.due_at) || null,
  }
}

export function inspectDossierBriefReadiness(briefValue: unknown): DossierBriefReadiness {
  const brief = jsonRecord(briefValue)
  const checks = [
    { key: 'objective', label: 'Objectif', present: !isMissingValue(brief.objective) },
    { key: 'audience', label: 'Audience', present: !isMissingValue(brief.audience) },
    { key: 'user_problem', label: 'Problème utilisateur', present: !isMissingValue(brief.user_problem) },
    { key: 'message', label: 'Message central', present: !isMissingValue(brief.message) },
    { key: 'format', label: 'Format', present: !isMissingValue(brief.format) },
    { key: 'channels', label: 'Canal', present: stringList(brief.channels).length > 0 },
    { key: 'tone', label: 'Ton', present: !isMissingValue(brief.tone) },
    { key: 'version', label: 'Version initiale', present: !isMissingValue(brief.version) },
  ]
  const present = checks.filter((item) => item.present).length
  return {
    score: Math.round((present / checks.length) * 100),
    complete: present === checks.length,
    missing: checks.filter((item) => !item.present).map((item) => item.label),
    checks,
  }
}

async function requireDossier(dossierId: string) {
  if (!clean(dossierId)) throw new Error('DOSSIER_ID_REQUIRED')
  const supabase = await createServiceClient() as any
  const result = await supabase.from(TABLES.dossiers).select('*').eq('id', dossierId).single()
  if (result.error) throw result.error
  if (!result.data) throw new Error('DOSSIER_NOT_FOUND')
  return result.data as JsonRecord
}

export async function saveDossierBrief(input: {
  actorId: string
  actorName: string
  dossierId: string
  brief: DossierBriefPayload
}) {
  const current = await requireDossier(input.dossierId)
  const status = clean(current.status)
  if (IMMUTABLE_DOSSIER_STATUSES.has(status)) throw new Error('DOSSIER_BRIEF_IMMUTABLE')
  if (status === 'archived') throw new Error('DOSSIER_ARCHIVED_RESTORE_REQUIRED')

  const normalized = normalizeBrief(current, input.brief)
  const readiness = inspectDossierBriefReadiness(normalized)
  const nextBrief: JsonRecord = {
    ...normalized,
    status: readiness.complete ? 'ready' : 'draft',
    readiness: readiness.score,
    updated_at: new Date().toISOString(),
    updated_by: input.actorId || null,
    updated_by_name: input.actorName,
  }

  const channels = stringList(nextBrief.channels)
  const supabase = await createServiceClient() as any
  const update = await supabase.from(TABLES.dossiers).update({
    brief: nextBrief,
    objective: clean(nextBrief.objective),
    audience: clean(nextBrief.audience),
    message_pillar: clean(nextBrief.message),
    channel: channels[0] || clean(current.channel),
    due_at: clean(nextBrief.due_at) || null,
    status: ['opportunity', 'ideation'].includes(status) ? 'brief' : status,
    readiness: readiness.score,
    updated_at: new Date().toISOString(),
  }).eq('id', input.dossierId).select('*').single()
  if (update.error) throw update.error

  await auditContentHeadquarters({
    actorId: input.actorId,
    actorName: input.actorName,
    action: 'dossier.brief_saved',
    entityType: 'content_dossier',
    entityId: input.dossierId,
    detail: { readiness, version: nextBrief.version },
  })
  return { dossier: update.data as ContentDossier, readiness }
}

export async function repairDossierBrief(input: { actorId: string; actorName: string; dossierId: string }) {
  const current = await requireDossier(input.dossierId)
  const normalized = normalizeBrief(current)
  const readiness = inspectDossierBriefReadiness(normalized)
  const repaired = await saveDossierBrief({ actorId: input.actorId, actorName: input.actorName, dossierId: input.dossierId, brief: {
    objective: clean(normalized.objective),
    audience: clean(normalized.audience),
    userProblem: clean(normalized.user_problem),
    coreMessage: clean(normalized.message),
    supportingMessages: stringList(normalized.supporting_messages),
    format: clean(normalized.format),
    channels: stringList(normalized.channels),
    tone: clean(normalized.tone),
    references: stringList(normalized.references),
    version: clean(normalized.version) || 'v1',
    dueAt: clean(normalized.due_at),
  } })
  await auditContentHeadquarters({
    actorId: input.actorId,
    actorName: input.actorName,
    action: 'dossier.brief_repaired',
    entityType: 'content_dossier',
    entityId: input.dossierId,
    detail: { previousBriefKeys: Object.keys(jsonRecord(current.brief)), readiness },
  })
  return repaired
}

export async function assignDossierReviewer(input: {
  actorId: string
  actorName: string
  dossierId: string
  reviewerId?: string
  reviewerName?: string
  selfAssign?: boolean
}) {
  const current = await requireDossier(input.dossierId)
  if (IMMUTABLE_DOSSIER_STATUSES.has(clean(current.status))) throw new Error('DOSSIER_GOVERNANCE_IMMUTABLE')
  const reviewerId = input.selfAssign ? input.actorId : clean(input.reviewerId)
  const reviewerName = input.selfAssign ? input.actorName : clean(input.reviewerName)
  if (!reviewerName) throw new Error('REVIEWER_NAME_REQUIRED')
  const supabase = await createServiceClient() as any
  const update = await supabase.from(TABLES.dossiers).update({
    reviewer_id: reviewerId || null,
    reviewer_name: reviewerName,
    updated_at: new Date().toISOString(),
  }).eq('id', input.dossierId).select('*').single()
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'dossier.reviewer_assigned', entityType: 'content_dossier', entityId: input.dossierId, detail: { reviewerId: reviewerId || null, reviewerName } })
  return update.data as ContentDossier
}

export async function confirmDossierConstitution(input: {
  actorId: string
  actorName: string
  dossierId: string
  continueUnderCondition?: boolean
}) {
  const current = await requireDossier(input.dossierId)
  const status = clean(current.status)
  if (!['opportunity', 'ideation', 'brief', 'scope_locked'].includes(status)) throw new Error('DOSSIER_CONSTITUTION_STATE_CONFLICT')
  const normalized = normalizeBrief(current)
  const readiness = inspectDossierBriefReadiness(normalized)
  if (!readiness.complete) throw new Error(`BRIEF_INCOMPLETE:${readiness.missing.join('|')}`)

  const reviewerAssigned = Boolean(clean(current.reviewer_id) || clean(current.reviewer_name))
  const conditions = reviewerAssigned ? [] : [{
    code: 'REVIEW_AUTHORITY_PENDING',
    label: 'Autorité de révision à affecter avant la revue humaine',
    blockingAt: 'ai_review',
    authority: 'Content Command Governance',
  }]
  if (!reviewerAssigned && input.continueUnderCondition === false) throw new Error('REVIEW_AUTHORITY_PENDING')

  const scope = jsonRecord(current.scope_constitution)
  const now = new Date().toISOString()
  const nextBrief: JsonRecord = { ...normalized, status: 'constituted', readiness: 100, constituted_at: now, constituted_by: input.actorId || null, constituted_by_name: input.actorName }
  const nextScope: JsonRecord = {
    ...scope,
    status: 'locked',
    locked: true,
    locked_at: now,
    locked_by: input.actorId || null,
    locked_by_name: input.actorName,
    brief_version: clean(nextBrief.version),
    conditions,
    progression_authority: reviewerAssigned ? 'normal' : 'conditional',
  }

  const supabase = await createServiceClient() as any
  const update = await supabase.from(TABLES.dossiers).update({
    brief: nextBrief,
    scope_constitution: nextScope,
    status: 'scope_locked',
    progress: Math.max(15, Number(current.progress || 0)),
    readiness: reviewerAssigned ? 100 : 92,
    updated_at: now,
  }).eq('id', input.dossierId).select('*').single()
  if (update.error) throw update.error
  await auditContentHeadquarters({
    actorId: input.actorId,
    actorName: input.actorName,
    action: 'dossier.constitution_confirmed',
    entityType: 'content_dossier',
    entityId: input.dossierId,
    detail: { from: status, to: 'scope_locked', briefVersion: nextBrief.version, conditions, continuation: reviewerAssigned ? 'normal' : 'under_condition' },
  })
  return { dossier: update.data as ContentDossier, readiness, conditions }
}

async function countRows(supabase: any, table: string, dossierId: string) {
  const result = await supabase.from(table).select('id', { count: 'exact', head: true }).eq('dossier_id', dossierId)
  if (result.error) throw result.error
  return Number(result.count || 0)
}

export type DossierRecoveryInspection = {
  dossier: { id: string; code: string; title: string; status: string }
  dependencies: Record<string, number>
  activeTasks: number
  activeMissions: number
  protectedReasons: string[]
  archiveAllowed: boolean
  permanentDeleteAllowed: boolean
  typedConfirmation: string
}

export async function inspectDossierRecovery(dossierId: string): Promise<DossierRecoveryInspection> {
  const dossier = await requireDossier(dossierId)
  const supabase = await createServiceClient() as any
  const [
    tasksResult, missionsResult, packagesResult,
    checkpoints, evidence, aiReviews, humanReviews, sources, sourceReplacements,
    samples, credits, performance, learning,
  ] = await Promise.all([
    supabase.from(TABLES.tasks).select('id,status,mission_id').eq('dossier_id', dossierId),
    supabase.from(TABLES.missions).select('id,status,title').eq('dossier_id', dossierId),
    supabase.from(TABLES.packages).select('id,status,external_reference,published_at').eq('dossier_id', dossierId),
    countRows(supabase, TABLES.checkpoints, dossierId),
    countRows(supabase, TABLES.evidence, dossierId),
    countRows(supabase, TABLES.aiReviews, dossierId),
    countRows(supabase, TABLES.humanReviews, dossierId),
    countRows(supabase, TABLES.sources, dossierId),
    countRows(supabase, TABLES.sourceReplacements, dossierId),
    countRows(supabase, TABLES.samples, dossierId),
    countRows(supabase, TABLES.credits, dossierId),
    countRows(supabase, TABLES.performance, dossierId),
    countRows(supabase, TABLES.learning, dossierId),
  ])
  if (tasksResult.error) throw tasksResult.error
  if (missionsResult.error) throw missionsResult.error
  if (packagesResult.error) throw packagesResult.error

  const tasks = Array.isArray(tasksResult.data) ? tasksResult.data as JsonRecord[] : []
  const missions = Array.isArray(missionsResult.data) ? missionsResult.data as JsonRecord[] : []
  const packages = Array.isArray(packagesResult.data) ? packagesResult.data as JsonRecord[] : []
  const activeTasks = tasks.filter((item) => ACTIVE_TASK_STATUSES.includes(clean(item.status))).length
  const activeMissions = missions.filter((item) => ACTIVE_MISSION_STATUSES.includes(clean(item.status))).length
  const protectedPackages = packages.filter((item) => PROTECTED_PACKAGE_STATUSES.has(clean(item.status)) || clean(item.external_reference) || clean(item.published_at)).length
  const protectedMissions = missions.filter((item) => PROTECTED_MISSION_STATUSES.has(clean(item.status))).length
  const status = clean(dossier.status)
  const protectedReasons: string[] = []
  if (IMMUTABLE_DOSSIER_STATUSES.has(status)) protectedReasons.push(`Le statut « ${status} » appartient à l’historique institutionnel protégé.`)
  if (humanReviews > 0) protectedReasons.push(`${humanReviews} décision(s) humaine(s) persistée(s).`)
  if (sources > 0 || sourceReplacements > 0) protectedReasons.push('Une source canonique ou un remplacement de source existe.')
  if (protectedPackages > 0) protectedReasons.push(`${protectedPackages} package(s) de publication autorisé(s), exécuté(s) ou vérifié(s).`)
  if (performance > 0 || learning > 0) protectedReasons.push('Des observations de performance ou apprentissages institutionnels existent.')
  if (protectedMissions > 0) protectedReasons.push(`${protectedMissions} mission(s) validée(s), clôturée(s) ou archivée(s).`)

  return {
    dossier: { id: clean(dossier.id), code: clean(dossier.content_code) || clean(dossier.id), title: clean(dossier.title), status },
    dependencies: {
      tasks: tasks.length,
      missions: missions.length,
      checkpoints,
      evidence,
      aiReviews,
      humanReviews,
      sources,
      sourceReplacements,
      samples,
      credits,
      publicationPackages: packages.length,
      performance,
      learning,
    },
    activeTasks,
    activeMissions,
    protectedReasons,
    archiveAllowed: status !== 'archived',
    permanentDeleteAllowed: protectedReasons.length === 0,
    typedConfirmation: clean(dossier.content_code) || clean(dossier.id),
  }
}

export async function archiveDossierWithCleanup(input: { actorId: string; actorName: string; dossierId: string; reason: string }) {
  if (clean(input.reason).length < 8) throw new Error('REASON_REQUIRED')
  const current = await requireDossier(input.dossierId)
  const inspection = await inspectDossierRecovery(input.dossierId)
  if (!inspection.archiveAllowed) throw new Error('DOSSIER_ALREADY_ARCHIVED')
  if (IMMUTABLE_DOSSIER_STATUSES.has(inspection.dossier.status)) throw new Error('DOSSIER_ARCHIVE_REQUIRES_SUPERSESSION')
  const supabase = await createServiceClient() as any
  const now = new Date().toISOString()

  const taskUpdate = await supabase.from(TABLES.tasks).update({ status: 'cancelled', progress: 0, updated_at: now }).eq('dossier_id', input.dossierId).in('status', ACTIVE_TASK_STATUSES)
  if (taskUpdate.error) throw taskUpdate.error
  const missionUpdate = await supabase.from(TABLES.missions).update({ status: 'cancelled', updated_at: now }).eq('dossier_id', input.dossierId).in('status', ACTIVE_MISSION_STATUSES)
  if (missionUpdate.error) throw missionUpdate.error
  const packageUpdate = await supabase.from(TABLES.packages).update({ status: 'cancelled', updated_at: now }).eq('dossier_id', input.dossierId).in('status', ['draft', 'preflight', 'ready', 'failed', 'recovery'])
  if (packageUpdate.error) throw packageUpdate.error
  const dossierUpdate = await supabase.from(TABLES.dossiers).update({
    status: 'archived',
    readiness: 0,
    updated_at: now,
    provenance: {
      ...jsonRecord(current.provenance),
      archive_reason: input.reason,
      archived_at: now,
      archived_by: input.actorId || null,
      archived_by_name: input.actorName,
      cleanup: { activeTasks: inspection.activeTasks, activeMissions: inspection.activeMissions },
    },
  }).eq('id', input.dossierId).select('*').single()
  if (dossierUpdate.error) throw dossierUpdate.error

  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'dossier.archived_with_cleanup', entityType: 'content_dossier', entityId: input.dossierId, detail: { reason: input.reason, inspection } })
  return { dossier: dossierUpdate.data as ContentDossier, inspection }
}

export async function permanentlyDeleteDraftDossier(input: { actorId: string; actorName: string; dossierId: string; reason: string; confirmation: string }) {
  if (clean(input.reason).length < 8) throw new Error('REASON_REQUIRED')
  const inspection = await inspectDossierRecovery(input.dossierId)
  if (!inspection.permanentDeleteAllowed) throw new Error(`DOSSIER_PURGE_BLOCKED:${inspection.protectedReasons.join('|')}`)
  if (clean(input.confirmation) !== inspection.typedConfirmation) throw new Error('TYPED_CONFIRMATION_MISMATCH')
  const supabase = await createServiceClient() as any

  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'dossier.permanent_delete.requested', entityType: 'content_dossier', entityId: input.dossierId, detail: { reason: input.reason, inspection } })

  const detach = await supabase.from(TABLES.dossiers).update({ mission_id: null, updated_at: new Date().toISOString() }).eq('id', input.dossierId)
  if (detach.error) throw detach.error
  const taskDelete = await supabase.from(TABLES.tasks).delete().eq('dossier_id', input.dossierId)
  if (taskDelete.error) throw taskDelete.error
  const missionDelete = await supabase.from(TABLES.missions).delete().eq('dossier_id', input.dossierId)
  if (missionDelete.error) throw missionDelete.error
  const dossierDelete = await supabase.from(TABLES.dossiers).delete().eq('id', input.dossierId)
  if (dossierDelete.error) throw dossierDelete.error

  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'dossier.permanent_deleted_with_cleanup', entityType: 'content_dossier', entityId: input.dossierId, detail: { reason: input.reason, code: inspection.dossier.code, removedDependencies: inspection.dependencies } })
  return { deleted: true, code: inspection.dossier.code, removedDependencies: inspection.dependencies }
}
