import { createServiceClient } from '@/lib/supabase/server'
import { getStorageHealthFromBridge, getStorageUsageFromBridge } from '@/lib/email-os-core/storage-gateway'
import type {
  AiDirectorProfile,
  ContentActionPlan,
  ContentCheckpoint,
  ContentDossier,
  ContentEvidence,
  ContentHeadquartersSnapshot,
  ContentMission,
  ContentMissionTask,
  ContentReview,
  ContentSourceObject,
  ContentStrategy,
  GeneratedSample,
  JsonRecord,
  MarketSignal,
  PublicationPackage,
} from './types'

const TABLES = {
  signals: 'market_content_signals',
  strategies: 'market_content_strategies',
  actionPlans: 'market_content_action_plans',
  missions: 'market_content_missions',
  tasks: 'market_content_mission_tasks',
  dossiers: 'market_content_dossiers',
  checkpoints: 'market_content_checkpoints',
  evidence: 'market_content_evidence',
  aiReviews: 'market_content_ai_reviews',
  humanReviews: 'market_content_human_reviews',
  sources: 'market_content_source_objects',
  samples: 'market_content_generated_samples',
  directors: 'market_content_ai_directors',
  packages: 'market_content_publication_packages',
  audit: 'market_content_audit',
} as const

function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function isMissingTable(error: unknown) {
  const text = String((error as { message?: string })?.message || error || '').toLowerCase()
  return text.includes('market_content_') && (text.includes('does not exist') || text.includes('schema cache'))
}

async function readTable<T>(supabase: any, table: string, order = 'created_at', ascending = false, limit = 250): Promise<T[]> {
  const result = await supabase.from(table).select('*').order(order, { ascending }).limit(limit)
  if (result.error) throw result.error
  return list<T>(result.data)
}

async function bridgeSnapshot() {
  try {
    const [health, usage] = await Promise.all([getStorageHealthFromBridge(), getStorageUsageFromBridge()])
    return { enabled: true, available: true, message: 'Bridge Windows disponible.', usage: { health, usage } as JsonRecord }
  } catch (error) {
    return { enabled: true, available: false, message: error instanceof Error ? error.message : 'BRIDGE_UNAVAILABLE', usage: null }
  }
}

async function providerSnapshot() {
  try {
    const supabase = await createServiceClient() as any
    const { data, error } = await supabase
      .from('ai_provider_module_assignments')
      .select('id,module_key,enabled,assignment_mode')
      .eq('module_key', 'marketing_ai')
      .eq('enabled', true)
      .limit(1)
    if (error) throw error
    return { available: Array.isArray(data) && data.length > 0, message: Array.isArray(data) && data.length > 0 ? 'Provider Marketing AI gouverné disponible.' : 'Aucune affectation Marketing AI active.' }
  } catch (error) {
    return { available: false, message: isMissingTable(error) ? 'AI Provider Control non installé.' : (error instanceof Error ? error.message : 'AI_PROVIDER_UNAVAILABLE') }
  }
}

function startOfToday() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.getTime()
}

export async function getContentHeadquartersSnapshot(): Promise<ContentHeadquartersSnapshot> {
  const supabase = await createServiceClient() as any
  try {
    const [
      signals,
      strategies,
      actionPlans,
      missions,
      tasks,
      dossiers,
      checkpoints,
      evidence,
      aiReviews,
      humanReviews,
      sources,
      generatedSamples,
      aiDirectors,
      publicationPackages,
      bridge,
      provider,
    ] = await Promise.all([
      readTable<MarketSignal>(supabase, TABLES.signals, 'detected_at'),
      readTable<ContentStrategy>(supabase, TABLES.strategies, 'updated_at'),
      readTable<ContentActionPlan>(supabase, TABLES.actionPlans, 'updated_at'),
      readTable<ContentMission>(supabase, TABLES.missions, 'updated_at'),
      readTable<ContentMissionTask>(supabase, TABLES.tasks, 'updated_at', false, 500),
      readTable<ContentDossier>(supabase, TABLES.dossiers, 'updated_at', false, 500),
      readTable<ContentCheckpoint>(supabase, TABLES.checkpoints, 'sequence_number', true, 500),
      readTable<ContentEvidence>(supabase, TABLES.evidence, 'created_at', false, 500),
      readTable<Record<string, unknown>>(supabase, TABLES.aiReviews, 'created_at', false, 500),
      readTable<Record<string, unknown>>(supabase, TABLES.humanReviews, 'created_at', false, 500),
      readTable<ContentSourceObject>(supabase, TABLES.sources, 'created_at', false, 500),
      readTable<GeneratedSample>(supabase, TABLES.samples, 'created_at', false, 250),
      readTable<AiDirectorProfile>(supabase, TABLES.directors, 'updated_at', false, 100),
      readTable<PublicationPackage>(supabase, TABLES.packages, 'updated_at', false, 500),
      bridgeSnapshot(),
      providerSnapshot(),
    ])

    const evidenceWithPreview = evidence.map((entry) => ({ ...entry, preview_url: entry.bridge_file_id ? `/api/market-os/content-command-headquarters/file-preview?fileId=${encodeURIComponent(entry.bridge_file_id)}` : entry.preview_url }))
    const samplesWithPreview = generatedSamples.map((entry) => ({ ...entry, preview_data_url: entry.bridge_file_id ? `/api/market-os/content-command-headquarters/file-preview?fileId=${encodeURIComponent(entry.bridge_file_id)}` : entry.preview_data_url }))

    const reviews: ContentReview[] = [
      ...aiReviews.map((row) => ({ ...row, review_type: 'ai' as const } as ContentReview)),
      ...humanReviews.map((row) => ({ ...row, review_type: 'human' as const } as ContentReview)),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const today = startOfToday()
    const tomorrow = today + 86_400_000
    const activeMissionStatuses = new Set(['assigned', 'accepted', 'in_progress', 'checkpoint', 'submitted', 'ai_review', 'human_review', 'revision', 'blocked'])
    const productionStatuses = new Set(['ideation', 'brief', 'scope_locked', 'planned', 'assigned', 'in_creation', 'checkpoint_review', 'draft_submitted', 'ai_review', 'human_review', 'revision'])
    const validSourceDossierIds = new Set(sources.filter((source) => source.is_current && source.integrity_state === 'verified').map((source) => source.dossier_id))
    const evidenceDossierIds = new Set(evidence.map((entry) => entry.dossier_id))
    const reviewedEvidenceIds = new Set(reviews.map((entry) => entry.evidence_id).filter(Boolean))

    return {
      generatedAt: new Date().toISOString(),
      migrationReady: true,
      signals,
      strategies,
      actionPlans,
      missions,
      tasks,
      dossiers,
      checkpoints,
      evidence: evidenceWithPreview,
      reviews,
      sources,
      generatedSamples: samplesWithPreview,
      aiDirectors,
      publicationPackages,
      bridge,
      provider,
      rollups: {
        activeSignals: signals.filter((signal) => !['converted', 'rejected', 'expired'].includes(signal.status)).length,
        anticipationOpportunities: signals.filter((signal) => signal.status === 'qualified' || signal.opportunity_score >= 70).length,
        activeStrategies: strategies.filter((strategy) => ['approved', 'active'].includes(strategy.status)).length,
        activeMissions: missions.filter((mission) => activeMissionStatuses.has(mission.status)).length,
        tasksDueToday: tasks.filter((task) => task.due_at && new Date(task.due_at).getTime() >= today && new Date(task.due_at).getTime() < tomorrow && !['done', 'cancelled'].includes(task.status)).length,
        overdueTasks: tasks.filter((task) => task.due_at && new Date(task.due_at).getTime() < today && !['done', 'cancelled'].includes(task.status)).length,
        dossiersInProduction: dossiers.filter((dossier) => productionStatuses.has(dossier.status)).length,
        dossiersAwaitingEvidence: dossiers.filter((dossier) => ['in_creation', 'checkpoint_review'].includes(dossier.status) && !evidenceDossierIds.has(dossier.id)).length,
        dossiersAwaitingValidation: dossiers.filter((dossier) => ['draft_submitted', 'ai_review', 'human_review', 'revision'].includes(dossier.status)).length,
        dossiersAwaitingSource: dossiers.filter((dossier) => ['validated', 'source_required'].includes(dossier.status) && !validSourceDossierIds.has(dossier.id)).length,
        sourceIntegrityRisks: sources.filter((source) => source.is_current && source.integrity_state !== 'verified').length,
        readyForDistribution: dossiers.filter((dossier) => ['classified', 'ready_distribution'].includes(dossier.status)).length,
        aiReviewsPending: evidence.filter((entry) => entry.status === 'submitted' && !reviewedEvidenceIds.has(entry.id)).length,
        humanDecisionsPending: dossiers.filter((dossier) => ['human_review'].includes(dossier.status)).length + missions.filter((mission) => ['qualifying', 'scope_approved', 'human_review'].includes(mission.status)).length,
      },
    }
  } catch (error) {
    if (!isMissingTable(error)) throw error
    return {
      generatedAt: new Date().toISOString(),
      migrationReady: false,
      signals: [], strategies: [], actionPlans: [], missions: [], tasks: [], dossiers: [], checkpoints: [], evidence: [], reviews: [], sources: [], generatedSamples: [], aiDirectors: [], publicationPackages: [],
      bridge: await bridgeSnapshot(),
      provider: await providerSnapshot(),
      rollups: { activeSignals: 0, anticipationOpportunities: 0, activeStrategies: 0, activeMissions: 0, tasksDueToday: 0, overdueTasks: 0, dossiersInProduction: 0, dossiersAwaitingEvidence: 0, dossiersAwaitingValidation: 0, dossiersAwaitingSource: 0, sourceIntegrityRisks: 0, readyForDistribution: 0, aiReviewsPending: 0, humanDecisionsPending: 0 },
    }
  }
}

export async function auditContentHeadquarters(input: { actorId: string; actorName: string; action: string; entityType: string; entityId?: string | null; detail?: JsonRecord }) {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(TABLES.audit).insert({
    actor_id: input.actorId || null,
    actor_name: input.actorName,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId || null,
    detail: input.detail || {},
  })
  if (result.error && !isMissingTable(result.error)) throw result.error
}

export async function createMarketSignal(input: { actorId: string; actorName: string; title: string; summary: string; sourceType: string; sourceLabel: string; sourceUrl?: string; services?: string[]; audiences?: string[]; cities?: string[] }) {
  const supabase = await createServiceClient() as any
  const codeResult = await supabase.rpc('market_content_next_code', { p_prefix: 'SIG' })
  if (codeResult.error) throw codeResult.error
  const insert = await supabase.from(TABLES.signals).insert({
    code: String(codeResult.data),
    title: input.title,
    summary: input.summary,
    source_type: input.sourceType,
    source_label: input.sourceLabel,
    source_url: input.sourceUrl || null,
    status: 'captured',
    services: input.services || [],
    audiences: input.audiences || [],
    cities: input.cities || [],
    created_by: input.actorId || null,
  }).select('*').single()
  if (insert.error) throw insert.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'signal.created', entityType: 'signal', entityId: insert.data.id, detail: { code: insert.data.code } })
  return insert.data as MarketSignal
}

export async function updateSignalStatus(input: { actorId: string; actorName: string; signalId: string; status: string; humanConclusion?: string; confidence?: number; urgency?: number; opportunityScore?: number }) {
  const supabase = await createServiceClient() as any
  const update = await supabase.from(TABLES.signals).update({
    status: input.status,
    human_conclusion: input.humanConclusion ?? undefined,
    confidence: input.confidence ?? undefined,
    urgency: input.urgency ?? undefined,
    opportunity_score: input.opportunityScore ?? undefined,
    updated_at: new Date().toISOString(),
  }).eq('id', input.signalId).select('*').single()
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'signal.status_changed', entityType: 'signal', entityId: input.signalId, detail: { status: input.status } })
  return update.data as MarketSignal
}

export async function createStrategy(input: { actorId: string; actorName: string; title: string; problemStatement: string; businessObjective: string; contentObjective: string; signalIds?: string[]; services?: string[]; audiences?: string[]; cities?: string[] }) {
  const supabase = await createServiceClient() as any
  const codeResult = await supabase.rpc('market_content_next_code', { p_prefix: 'STR' })
  if (codeResult.error) throw codeResult.error
  const insert = await supabase.from(TABLES.strategies).insert({
    code: String(codeResult.data),
    title: input.title,
    problem_statement: input.problemStatement,
    business_objective: input.businessObjective,
    content_objective: input.contentObjective,
    signal_ids: input.signalIds || [],
    services: input.services || [],
    audiences: input.audiences || [],
    cities: input.cities || [],
    status: 'draft',
    owner_id: input.actorId || null,
    owner_name: input.actorName,
  }).select('*').single()
  if (insert.error) throw insert.error
  if (input.signalIds?.length) await supabase.from(TABLES.signals).update({ status: 'converted', updated_at: new Date().toISOString() }).in('id', input.signalIds)
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'strategy.created', entityType: 'strategy', entityId: insert.data.id, detail: { code: insert.data.code, signalIds: input.signalIds || [] } })
  return insert.data as ContentStrategy
}

export async function compileStrategyToPlan(input: { actorId: string; actorName: string; strategyId: string; title: string; objective: string; deliverables?: JsonRecord[]; requiredRoles?: string[]; capacityHours?: number }) {
  const supabase = await createServiceClient() as any
  const codeResult = await supabase.rpc('market_content_next_code', { p_prefix: 'PLAN' })
  if (codeResult.error) throw codeResult.error
  const insert = await supabase.from(TABLES.actionPlans).insert({
    strategy_id: input.strategyId,
    code: String(codeResult.data),
    title: input.title,
    objective: input.objective,
    status: 'draft',
    deliverables: input.deliverables || [],
    required_roles: input.requiredRoles || [],
    capacity_estimate_hours: input.capacityHours || 0,
    created_by: input.actorId || null,
  }).select('*').single()
  if (insert.error) throw insert.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'strategy.compiled', entityType: 'action_plan', entityId: insert.data.id, detail: { strategyId: input.strategyId } })
  return insert.data as ContentActionPlan
}

export async function createMission(input: { actorId: string; actorName: string; strategyId?: string; actionPlanId?: string; dossierId?: string; title: string; objective: string; scope: string; successDefinition: string; priority?: string; assignedTo?: string; assignedToName?: string; reviewerId?: string; reviewerName?: string; aiDirectorId?: string; dueAt?: string; tasks?: Array<{ title: string; description?: string; assignedTo?: string; assignedToName?: string; dueAt?: string; evidenceRequired?: boolean; completionDefinition?: string }> }) {
  const supabase = await createServiceClient() as any
  const codeResult = await supabase.rpc('market_content_next_code', { p_prefix: 'MIS' })
  if (codeResult.error) throw codeResult.error
  const missionInsert = await supabase.from(TABLES.missions).insert({
    code: String(codeResult.data),
    strategy_id: input.strategyId || null,
    action_plan_id: input.actionPlanId || null,
    dossier_id: input.dossierId || null,
    title: input.title,
    objective: input.objective,
    scope: input.scope,
    success_definition: input.successDefinition,
    status: input.assignedTo ? 'assigned' : 'ready',
    priority: input.priority || 'medium',
    origin_type: input.actionPlanId ? 'action_plan' : input.dossierId ? 'content_dossier' : 'manual',
    assigned_to: input.assignedTo || null,
    assigned_to_name: input.assignedToName || null,
    reviewer_id: input.reviewerId || null,
    reviewer_name: input.reviewerName || null,
    ai_director_id: input.aiDirectorId || null,
    due_at: input.dueAt || null,
    created_by: input.actorId || null,
  }).select('*').single()
  if (missionInsert.error) throw missionInsert.error

  if (input.tasks?.length) {
    const taskRows = input.tasks.map((task, index) => ({
      mission_id: missionInsert.data.id,
      dossier_id: input.dossierId || null,
      code: `${missionInsert.data.code}-T${String(index + 1).padStart(2, '0')}`,
      title: task.title,
      description: task.description || '',
      status: 'todo',
      priority: input.priority || 'medium',
      sequence_number: index + 1,
      assigned_to: task.assignedTo || input.assignedTo || null,
      assigned_to_name: task.assignedToName || input.assignedToName || null,
      due_at: task.dueAt || input.dueAt || null,
      evidence_required: task.evidenceRequired ?? true,
      completion_definition: task.completionDefinition || 'Preuve soumise et acceptée dans le dossier.',
      created_by: input.actorId || null,
    }))
    const taskInsert = await supabase.from(TABLES.tasks).insert(taskRows)
    if (taskInsert.error) throw taskInsert.error
  }
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'mission.created', entityType: 'mission', entityId: missionInsert.data.id, detail: { code: missionInsert.data.code, tasks: input.tasks?.length || 0 } })
  return missionInsert.data as ContentMission
}

export async function createContentDossier(input: { actorId: string; actorName: string; title: string; family: string; category: string; subcategory: string; serviceKey: string; serviceLabel: string; campaignId?: string; campaignLabel?: string; strategyId?: string; audience: string; city: string; language: string; channel: string; journeyStage: string; objective: string; messagePillar: string; offer?: string; cta?: string; ownerId?: string; ownerName?: string; reviewerId?: string; reviewerName?: string; aiDirectorId?: string; dueAt?: string; brief?: JsonRecord; scopeConstitution?: JsonRecord }) {
  const supabase = await createServiceClient() as any
  const codeResult = await supabase.rpc('market_content_next_content_code', { p_family: input.family, p_service: input.serviceKey })
  if (codeResult.error) throw codeResult.error
  const insert = await supabase.from(TABLES.dossiers).insert({
    content_code: String(codeResult.data),
    title: input.title,
    family: input.family,
    category: input.category,
    subcategory: input.subcategory,
    service_key: input.serviceKey,
    service_label: input.serviceLabel,
    campaign_id: input.campaignId || null,
    campaign_label: input.campaignLabel || null,
    strategy_id: input.strategyId || null,
    audience: input.audience,
    city: input.city,
    language: input.language,
    channel: input.channel,
    journey_stage: input.journeyStage,
    objective: input.objective,
    message_pillar: input.messagePillar,
    offer: input.offer || '',
    cta: input.cta || '',
    status: 'brief',
    owner_id: input.ownerId || input.actorId || null,
    owner_name: input.ownerName || input.actorName,
    reviewer_id: input.reviewerId || null,
    reviewer_name: input.reviewerName || null,
    ai_director_id: input.aiDirectorId || null,
    due_at: input.dueAt || null,
    brief: input.brief || {},
    scope_constitution: input.scopeConstitution || {},
    created_by: input.actorId || null,
  }).select('*').single()
  if (insert.error) throw insert.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'dossier.created', entityType: 'content_dossier', entityId: insert.data.id, detail: { contentCode: insert.data.content_code, family: input.family } })
  return insert.data as ContentDossier
}

export async function updateMissionTask(input: { actorId: string; actorName: string; taskId: string; status?: string; progress?: number; note?: string }) {
  const supabase = await createServiceClient() as any
  const update = await supabase.from(TABLES.tasks).update({
    status: input.status ?? undefined,
    progress: input.progress ?? undefined,
    updated_at: new Date().toISOString(),
  }).eq('id', input.taskId).select('*').single()
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'task.updated', entityType: 'mission_task', entityId: input.taskId, detail: { status: input.status, progress: input.progress, note: input.note || null } })
  return update.data as ContentMissionTask
}


export async function updateMissionLifecycle(input: { actorId: string; actorName: string; missionId: string; status: string; note?: string }) {
  const supabase = await createServiceClient() as any
  const current = await supabase.from(TABLES.missions).select('id,status,progress').eq('id', input.missionId).single()
  if (current.error) throw current.error
  const transitions: Record<string, string[]> = {
    proposed: ['qualifying', 'cancelled'], qualifying: ['scope_approved', 'cancelled'], scope_approved: ['ready', 'cancelled'], ready: ['assigned', 'cancelled'], assigned: ['accepted', 'paused', 'cancelled'], accepted: ['in_progress', 'paused', 'cancelled'], in_progress: ['checkpoint', 'submitted', 'blocked', 'paused'], checkpoint: ['in_progress', 'submitted', 'blocked'], submitted: ['ai_review', 'human_review', 'revision'], ai_review: ['human_review', 'revision'], human_review: ['validated', 'revision'], revision: ['in_progress', 'submitted'], validated: ['closed'], blocked: ['in_progress', 'paused', 'cancelled'], paused: ['in_progress', 'cancelled'], closed: ['archived'], cancelled: ['archived'],
  }
  if (!(transitions[String(current.data.status)] || []).includes(input.status)) throw new Error('MISSION_TRANSITION_NOT_ALLOWED')
  const progressByState: Record<string, number> = { accepted: 5, in_progress: Math.max(10, Number(current.data.progress || 0)), checkpoint: Math.max(35, Number(current.data.progress || 0)), submitted: Math.max(85, Number(current.data.progress || 0)), ai_review: Math.max(88, Number(current.data.progress || 0)), human_review: Math.max(92, Number(current.data.progress || 0)), validated: 100, closed: 100 }
  const update = await supabase.from(TABLES.missions).update({ status: input.status, progress: progressByState[input.status] ?? current.data.progress, updated_at: new Date().toISOString() }).eq('id', input.missionId).select('*').single()
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'mission.lifecycle_updated', entityType: 'mission', entityId: input.missionId, detail: { from: current.data.status, to: input.status, note: input.note || null } })
  return update.data as ContentMission
}

export async function recordHumanContentReview(input: { actorId: string; actorName: string; dossierId: string; evidenceId?: string; result: 'approved' | 'revision' | 'blocked'; score: number; summary: string; findings?: JsonRecord[]; corrections?: JsonRecord[]; authorityRole?: string }) {
  const supabase = await createServiceClient() as any
  const dossierResult = await supabase.from(TABLES.dossiers).select('id,status,progress,source_state').eq('id', input.dossierId).single()
  if (dossierResult.error) throw dossierResult.error
  const aiReviewResult = await supabase.from(TABLES.aiReviews).select('id,result,score').eq('dossier_id', input.dossierId).order('created_at', { ascending: false }).limit(1)
  if (aiReviewResult.error) throw aiReviewResult.error
  const latestAi = Array.isArray(aiReviewResult.data) ? aiReviewResult.data[0] : null
  if (input.result === 'approved') {
    if (Number(dossierResult.data.progress || 0) < 90) throw new Error('DOSSIER_SCOPE_INCOMPLETE')
    if (!latestAi || !['pass', 'pass_minor', 'approved'].includes(String(latestAi.result))) throw new Error('AI_REVIEW_GATE_REQUIRED')
  }
  const review = await supabase.from(TABLES.humanReviews).insert({
    dossier_id: input.dossierId,
    evidence_id: input.evidenceId || null,
    result: input.result,
    score: Math.max(0, Math.min(100, input.score)),
    summary: input.summary,
    findings: input.findings || [],
    corrections: input.corrections || [],
    reviewer_id: input.actorId || null,
    reviewer_name: input.actorName,
    authority_role: input.authorityRole || 'Content Authority',
  }).select('*').single()
  if (review.error) throw review.error
  const nextStatus = input.result === 'approved' ? (dossierResult.data.source_state === 'secured' ? 'source_secured' : 'source_required') : input.result === 'revision' ? 'revision' : 'human_review'
  const dossierUpdate = await supabase.from(TABLES.dossiers).update({ status: nextStatus, readiness: input.result === 'approved' ? 100 : undefined, updated_at: new Date().toISOString() }).eq('id', input.dossierId)
  if (dossierUpdate.error) throw dossierUpdate.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: `dossier.human_review_${input.result}`, entityType: 'content_dossier', entityId: input.dossierId, detail: { reviewId: review.data.id, score: input.score, nextStatus } })
  return review.data as ContentReview
}

export async function createPublicationPackage(input: { actorId: string; actorName: string; dossierId: string; channel: string; scheduledAt?: string; requiredRenditions?: JsonRecord[] }) {
  const supabase = await createServiceClient() as any
  const dossier = await supabase.from(TABLES.dossiers).select('id,status,source_state').eq('id', input.dossierId).single()
  if (dossier.error) throw dossier.error
  if (!['source_secured', 'classified', 'ready_distribution', 'scheduled', 'published'].includes(String(dossier.data.status)) || dossier.data.source_state !== 'secured') throw new Error('PUBLICATION_SOURCE_GATE_REQUIRED')
  const insert = await supabase.from(TABLES.packages).insert({
    dossier_id: input.dossierId,
    channel: input.channel,
    scheduled_at: input.scheduledAt || null,
    status: input.scheduledAt ? 'scheduled' : 'draft',
    package_readiness: input.requiredRenditions?.length ? 65 : 35,
    required_renditions: input.requiredRenditions || [],
    created_by: input.actorId || null,
  }).select('*').single()
  if (insert.error) throw insert.error
  const nextStatus = input.scheduledAt ? 'scheduled' : 'ready_distribution'
  await supabase.from(TABLES.dossiers).update({ status: nextStatus, publication_state: insert.data.status, updated_at: new Date().toISOString() }).eq('id', input.dossierId)
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'publication_package.created', entityType: 'publication_package', entityId: insert.data.id, detail: { dossierId: input.dossierId, channel: input.channel, scheduledAt: input.scheduledAt || null } })
  return insert.data as PublicationPackage
}

export async function updatePublicationPackage(input: { actorId: string; actorName: string; packageId: string; status: string; scheduledAt?: string; externalReference?: string; evidence?: JsonRecord[] }) {
  const supabase = await createServiceClient() as any
  const current = await supabase.from(TABLES.packages).select('*').eq('id', input.packageId).single()
  if (current.error) throw current.error
  const transitions: Record<string, string[]> = { draft: ['ready', 'cancelled'], ready: ['scheduled', 'cancelled'], scheduled: ['published', 'cancelled'], published: ['verified'], verified: [], cancelled: [] }
  if (!(transitions[String(current.data.status)] || []).includes(input.status)) throw new Error('PUBLICATION_TRANSITION_NOT_ALLOWED')
  if (['published', 'verified'].includes(input.status) && !input.externalReference && !(input.evidence || []).length) throw new Error('PUBLICATION_EVIDENCE_REQUIRED')
  const update = await supabase.from(TABLES.packages).update({
    status: input.status,
    scheduled_at: input.scheduledAt ?? current.data.scheduled_at,
    published_at: input.status === 'published' || input.status === 'verified' ? new Date().toISOString() : current.data.published_at,
    external_reference: input.externalReference ?? current.data.external_reference,
    evidence: input.evidence ?? current.data.evidence,
    package_readiness: input.status === 'verified' ? 100 : input.status === 'published' ? 95 : input.status === 'scheduled' ? 85 : input.status === 'ready' ? 75 : current.data.package_readiness,
    updated_at: new Date().toISOString(),
  }).eq('id', input.packageId).select('*').single()
  if (update.error) throw update.error
  const dossierState = input.status === 'verified' ? 'published' : input.status === 'scheduled' ? 'scheduled' : input.status === 'ready' ? 'ready_distribution' : undefined
  if (dossierState) await supabase.from(TABLES.dossiers).update({ status: dossierState, publication_state: input.status, updated_at: new Date().toISOString() }).eq('id', current.data.dossier_id)
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'publication_package.updated', entityType: 'publication_package', entityId: input.packageId, detail: { from: current.data.status, to: input.status, externalReference: input.externalReference || null } })
  return update.data as PublicationPackage
}

export async function createAiDirector(input: { actorId: string; actorName: string; code: string; name: string; directorType: string; mandate: string; providerModuleKey?: string; preferredModel?: string; authorityMode?: string; services?: string[]; contentFamilies?: string[]; audiences?: string[]; cities?: string[]; languages?: string[]; allowedSources?: string[]; excludedSources?: string[]; schedulePolicy?: JsonRecord; ratePolicy?: JsonRecord; skillCodes?: string[]; commandCodes?: string[] }) {
  const supabase = await createServiceClient() as any
  const insert = await supabase.from(TABLES.directors).insert({
    code: input.code,
    name: input.name,
    director_type: input.directorType,
    mandate: input.mandate,
    status: 'draft',
    provider_module_key: input.providerModuleKey || 'marketing_ai',
    preferred_model: input.preferredModel || '',
    authority_mode: input.authorityMode || 'human_governed',
    services: input.services || [],
    content_families: input.contentFamilies || [],
    audiences: input.audiences || [],
    cities: input.cities || [],
    languages: input.languages || ['fr'],
    allowed_sources: input.allowedSources || [],
    excluded_sources: input.excludedSources || [],
    schedule_policy: input.schedulePolicy || {},
    rate_policy: input.ratePolicy || {},
    skill_codes: input.skillCodes || [],
    command_codes: input.commandCodes || [],
    human_supervisor_id: input.actorId || null,
    human_supervisor_name: input.actorName,
    created_by: input.actorId || null,
  }).select('*').single()
  if (insert.error) throw insert.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'ai_director.created', entityType: 'ai_director', entityId: insert.data.id, detail: { code: input.code } })
  return insert.data as AiDirectorProfile
}

export async function updateAiDirector(input: { actorId: string; actorName: string; directorId: string; status?: string; mandate?: string; preferredModel?: string; groundingEnabled?: boolean; imageGenerationEnabled?: boolean; schedulePolicy?: JsonRecord; ratePolicy?: JsonRecord }) {
  const supabase = await createServiceClient() as any
  const update = await supabase.from(TABLES.directors).update({
    status: input.status ?? undefined,
    mandate: input.mandate ?? undefined,
    preferred_model: input.preferredModel ?? undefined,
    grounding_enabled: input.groundingEnabled ?? undefined,
    image_generation_enabled: input.imageGenerationEnabled ?? undefined,
    schedule_policy: input.schedulePolicy ?? undefined,
    rate_policy: input.ratePolicy ?? undefined,
    next_run_at: input.status === 'active' ? new Date().toISOString() : undefined,
    updated_at: new Date().toISOString(),
  }).eq('id', input.directorId).select('*').single()
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'ai_director.updated', entityType: 'ai_director', entityId: input.directorId, detail: { status: input.status || null } })
  return update.data as AiDirectorProfile
}

export async function promoteLegacyContentBatch(input: { actorId: string; actorName: string; records: JsonRecord[] }) {
  const supabase = await createServiceClient() as any
  const records = input.records.slice(0, 250)
  const ids = records.map((row) => String(row.id || '')).filter(Boolean)
  const existingResult = ids.length ? await supabase.from(TABLES.dossiers).select('legacy_origin_id').in('legacy_origin_id', ids) : { data: [], error: null }
  if (existingResult.error) throw existingResult.error
  const existing = new Set((existingResult.data || []).map((row: { legacy_origin_id?: string }) => String(row.legacy_origin_id || '')))
  const created: ContentDossier[] = []
  const skipped: string[] = []
  const statusMap: Record<string, string> = { idea: 'ideation', brief: 'brief', draft: 'in_creation', review: 'human_review', approved: 'validated', scheduled: 'scheduled', published: 'published', revision: 'revision', archived: 'archived' }
  for (const row of records) {
    const legacyId = String(row.id || '')
    if (!legacyId || existing.has(legacyId)) { if (legacyId) skipped.push(legacyId); continue }
    const type = String(row.type || 'Digital content')
    const normalized = type.toLowerCase()
    const family = /(brochure|flyer|catalog|prospectus|poster|print|rollup|packaging|stationery)/.test(normalized) ? 'print_offline'
      : /(policy|sop|memo|company profile|governance|agreement|form|presentation|document)/.test(normalized) ? 'corporate_document' : 'digital'
    const codeResult = await supabase.rpc('market_content_next_content_code', { p_family: family, p_service: 'legacy' })
    if (codeResult.error) throw codeResult.error
    const insert = await supabase.from(TABLES.dossiers).insert({
      content_code: String(codeResult.data), title: String(row.title || 'Contenu importé'), family, category: type, subcategory: 'Legacy Content Command',
      service_key: 'legacy_content_command', service_label: 'Classification à confirmer', campaign_label: String(row.campaign || ''), audience: String(row.audience || ''), city: '', language: 'fr', channel: String(row.channel || ''), journey_stage: '', objective: String(row.objective || ''), message_pillar: String(row.angle || row.body || ''), cta: String(row.cta || ''), status: statusMap[String(row.status || '')] || 'brief', priority: String(row.priority || 'medium').toLowerCase(), owner_name: String(row.owner || ''), reviewer_name: String(row.reviewer || ''), due_at: row.dueDate || null,
      progress: ['approved','scheduled','published'].includes(String(row.status || '')) ? 100 : String(row.status || '') === 'review' ? 75 : 35,
      readiness: Number(row.brandScore || 0), source_state: 'legacy_reference_only', publication_state: String(row.status || '') === 'published' ? 'legacy_unverified' : 'not_ready',
      brief: { objective: row.objective || '', audience: row.audience || '', body: row.body || '', notes: row.notes || '', seoKeyword: row.seoKeyword || '' },
      classification: { legacyAssets: row.assets || [], legacyType: row.type || '', legacyStatus: row.status || '', scheduledDate: row.scheduledDate || null },
      legacy_origin_id: legacyId, legacy_origin_type: 'phase1_browser_content', provenance: { source: 'angelcare_content_command_phase1_local_storage', importedAt: new Date().toISOString(), originalUpdatedAt: row.updatedAt || null }, created_by: input.actorId || null,
    }).select('*').single()
    if (insert.error) throw insert.error
    const dossier = insert.data as ContentDossier
    const tasks = Array.isArray(row.tasks) ? row.tasks as JsonRecord[] : []
    if (tasks.length) {
      const missionCode = await supabase.rpc('market_content_next_code', { p_prefix: 'MIS' }); if (missionCode.error) throw missionCode.error
      const missionInsert = await supabase.from(TABLES.missions).insert({ code: String(missionCode.data), dossier_id: dossier.id, title: `Mission héritée · ${dossier.title}`, objective: dossier.objective, scope: 'Finaliser le contenu importé depuis le workflow Phase 1 sans perdre sa provenance.', success_definition: 'Tâches clôturées, preuves validées et source canonique sécurisée.', status: 'assigned', priority: dossier.priority, origin_type: 'legacy_phase1', origin_ref: legacyId, assigned_to_name: dossier.owner_name, reviewer_name: dossier.reviewer_name, due_at: dossier.due_at, created_by: input.actorId || null }).select('*').single()
      if (missionInsert.error) throw missionInsert.error
      await supabase.from(TABLES.dossiers).update({ mission_id: missionInsert.data.id }).eq('id', dossier.id)
      const rows = tasks.map((task, index) => ({ mission_id: missionInsert.data.id, dossier_id: dossier.id, code: `${missionInsert.data.code}-T${String(index + 1).padStart(2,'0')}`, title: String(task.title || `Tâche ${index + 1}`), description: String(task.notes || ''), status: String(task.status || 'todo'), priority: String(task.priority || dossier.priority).toLowerCase(), sequence_number: index + 1, assigned_to_name: String(task.owner || dossier.owner_name || ''), due_at: task.dueDate || dossier.due_at, evidence_required: true, completion_definition: 'Preuve exigée dans le nouveau dossier 360.', created_by: input.actorId || null }))
      const taskInsert = await supabase.from(TABLES.tasks).insert(rows); if (taskInsert.error) throw taskInsert.error
    }
    created.push(dossier)
  }
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'legacy_phase1.promoted', entityType: 'content_dossier', detail: { created: created.length, skipped: skipped.length } })
  return { created, skipped }
}
