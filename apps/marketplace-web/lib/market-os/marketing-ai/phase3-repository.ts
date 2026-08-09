import { createContentCommandSupabaseServerClient } from '@/lib/market-os/content-command/db/supabase-server'
import type { Phase3AutopilotSnapshot, Phase3Compilation, Phase3CompilationItem, Phase3ContextPackage, Phase3Decision, Phase3ExecutionJob, Phase3ToolName } from './phase3-types'

function db() { return createContentCommandSupabaseServerClient() }
function iso(value: unknown) { return value ? String(value) : new Date().toISOString() }

function compilation(row: Record<string, unknown>): Phase3Compilation {
  return {
    id: String(row.id), compilationKey: String(row.compilation_key || ''), missionId: String(row.mission_id), strategyRunId: row.strategy_run_id ? String(row.strategy_run_id) : null,
    title: String(row.title || ''), objective: String(row.objective || ''), status: String(row.status || 'draft') as Phase3Compilation['status'],
    authorityMode: String(row.authority_mode || 'prepare') as Phase3Compilation['authorityMode'], riskLevel: String(row.risk_level || 'high') as Phase3Compilation['riskLevel'],
    contextSnapshot: (row.context_snapshot || {}) as unknown as Phase3ContextPackage, summary: (row.summary || {}) as Record<string, unknown>,
    createdBy: String(row.created_by || ''), approvedBy: row.approved_by ? String(row.approved_by) : null, approvedAt: row.approved_at ? String(row.approved_at) : null,
    createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  }
}
function item(row: Record<string, unknown>): Phase3CompilationItem {
  return {
    id: String(row.id), compilationId: String(row.compilation_id), sequence: Number(row.sequence || 0), itemType: String(row.item_type) as Phase3CompilationItem['itemType'],
    title: String(row.title || ''), description: String(row.description || ''), toolName: String(row.tool_name) as Phase3ToolName, targetWorkspace: String(row.target_workspace || ''),
    payload: (row.payload || {}) as Record<string, unknown>, dependencies: Array.isArray(row.dependencies) ? row.dependencies.map(String) : [], requiresApproval: Boolean(row.requires_approval),
    status: String(row.status || 'proposed') as Phase3CompilationItem['status'], canonicalRecordId: row.canonical_record_id ? String(row.canonical_record_id) : null,
    canonicalTable: row.canonical_table ? String(row.canonical_table) : null, mirrorState: row.mirror_state ? String(row.mirror_state) : null, error: row.error ? String(row.error) : null,
    createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  }
}
function job(row: Record<string, unknown>): Phase3ExecutionJob {
  return {
    id: String(row.id), compilationId: row.compilation_id ? String(row.compilation_id) : null, compilationItemId: row.compilation_item_id ? String(row.compilation_item_id) : null,
    missionId: row.mission_id ? String(row.mission_id) : null, commandCode: row.command_code ? String(row.command_code) : null, jobType: String(row.job_type || ''),
    toolName: row.tool_name ? String(row.tool_name) as Phase3ToolName : null, status: String(row.status || 'queued') as Phase3ExecutionJob['status'], priority: Number(row.priority || 50),
    idempotencyKey: String(row.idempotency_key || ''), attemptCount: Number(row.attempt_count || 0), maxAttempts: Number(row.max_attempts || 3), scheduledAt: iso(row.scheduled_at),
    claimedAt: row.claimed_at ? String(row.claimed_at) : null, heartbeatAt: row.heartbeat_at ? String(row.heartbeat_at) : null, completedAt: row.completed_at ? String(row.completed_at) : null,
    nextRetryAt: row.next_retry_at ? String(row.next_retry_at) : null, input: (row.input || {}) as Record<string, unknown>, output: (row.output || {}) as Record<string, unknown>,
    error: row.error ? String(row.error) : null, createdAt: iso(row.created_at),
  }
}
function decision(row: Record<string, unknown>): Phase3Decision {
  return {
    id: String(row.id), compilationId: row.compilation_id ? String(row.compilation_id) : null, jobId: row.job_id ? String(row.job_id) : null, missionId: row.mission_id ? String(row.mission_id) : null,
    decisionType: String(row.decision_type) as Phase3Decision['decisionType'], reason: String(row.reason || ''), conditions: Array.isArray(row.conditions) ? row.conditions.map(String) : [],
    status: String(row.status || 'effective') as Phase3Decision['status'], decidedBy: String(row.decided_by || ''), decidedByName: String(row.decided_by_name || ''), decidedAt: iso(row.decided_at),
  }
}

export async function createCompilation(input: { compilationKey: string; missionId: string; strategyRunId?: string | null; title: string; objective: string; authorityMode: string; riskLevel: string; contextSnapshot: Phase3ContextPackage; summary: Record<string, unknown>; createdBy: string }) {
  const { data, error } = await db().from('market_ai_compilations').upsert({ compilation_key: input.compilationKey, mission_id: input.missionId, strategy_run_id: input.strategyRunId || null, title: input.title, objective: input.objective, status: 'awaiting_decision', authority_mode: input.authorityMode, risk_level: input.riskLevel, context_snapshot: input.contextSnapshot, summary: input.summary, created_by: input.createdBy }, { onConflict: 'compilation_key' }).select('*').single()
  if (error) throw new Error(`COMPILATION_CREATE_FAILED:${error.message}`)
  return compilation(data as Record<string, unknown>)
}
export async function createCompilationItems(compilationId: string, items: Array<Omit<Phase3CompilationItem,'id'|'compilationId'|'createdAt'|'updatedAt'>>) {
  const rows = items.map((entry: Omit<Phase3CompilationItem,'id'|'compilationId'|'createdAt'|'updatedAt'>) => ({ compilation_id: compilationId, sequence: entry.sequence, item_type: entry.itemType, title: entry.title, description: entry.description, tool_name: entry.toolName, target_workspace: entry.targetWorkspace, payload: entry.payload, dependencies: entry.dependencies, requires_approval: entry.requiresApproval, status: entry.status }))
  const { data, error } = await db().from('market_ai_compilation_items').insert(rows).select('*')
  if (error) throw new Error(`COMPILATION_ITEMS_CREATE_FAILED:${error.message}`)
  return (data || []).map((row: Record<string, unknown>) => item(row))
}
export async function getCompilation(id: string) {
  const [head, body] = await Promise.all([
    db().from('market_ai_compilations').select('*').eq('id', id).maybeSingle(),
    db().from('market_ai_compilation_items').select('*').eq('compilation_id', id).order('sequence'),
  ])
  if (head.error) throw new Error(`COMPILATION_READ_FAILED:${head.error.message}`)
  if (body.error) throw new Error(`COMPILATION_ITEMS_READ_FAILED:${body.error.message}`)
  return head.data ? { compilation: compilation(head.data as Record<string, unknown>), items: (body.data || []).map((row: Record<string, unknown>) => item(row)) } : null
}
export async function listCompilations(limit = 100) {
  const { data, error } = await db().from('market_ai_compilations').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`COMPILATION_LIST_FAILED:${error.message}`)
  return (data || []).map((row: Record<string, unknown>) => compilation(row))
}
export async function updateCompilationStatus(id: string, status: Phase3Compilation['status'], actorId?: string) {
  const patch: Record<string, unknown> = { status }
  if (status === 'approved') { patch.approved_by = actorId || null; patch.approved_at = new Date().toISOString() }
  const { data, error } = await db().from('market_ai_compilations').update(patch).eq('id', id).select('*').single()
  if (error) throw new Error(`COMPILATION_UPDATE_FAILED:${error.message}`)
  return compilation(data as Record<string, unknown>)
}
export async function createDecision(input: { compilationId?: string | null; jobId?: string | null; missionId?: string | null; decisionType: string; reason: string; conditions: string[]; actor: { id: string; name: string } }) {
  const { data, error } = await db().from('market_ai_decisions').insert({ compilation_id: input.compilationId || null, job_id: input.jobId || null, mission_id: input.missionId || null, decision_type: input.decisionType, reason: input.reason, conditions: input.conditions, status: 'effective', decided_by: input.actor.id, decided_by_name: input.actor.name }).select('*').single()
  if (error) throw new Error(`DECISION_CREATE_FAILED:${error.message}`)
  return decision(data as Record<string, unknown>)
}
export async function listDecisions(limit = 100) {
  const { data, error } = await db().from('market_ai_decisions').select('*').order('decided_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`DECISION_LIST_FAILED:${error.message}`)
  return (data || []).map((row: Record<string, unknown>) => decision(row))
}
export async function enqueueCompilation(compilationId: string, actorId: string) {
  const current = await getCompilation(compilationId)
  if (!current) throw new Error('COMPILATION_NOT_FOUND')
  if (current.compilation.status !== 'approved') throw new Error('COMPILATION_NOT_APPROVED')
  const rows = current.items.filter((entry: Phase3CompilationItem) => ['proposed','approved','blocked','failed'].includes(entry.status)).map((entry: Phase3CompilationItem) => ({
    compilation_id: compilationId, compilation_item_id: entry.id, mission_id: current.compilation.missionId, job_type: 'materialize_compilation_item', tool_name: entry.toolName,
    status: entry.requiresApproval && entry.status !== 'approved' ? 'awaiting_approval' : 'queued', priority: Math.max(1, 100 - entry.sequence), idempotency_key: `compilation:${compilationId}:item:${entry.id}:v1`, max_attempts: 3,
    scheduled_at: new Date().toISOString(), input: { payload: entry.payload, title: entry.title, targetWorkspace: entry.targetWorkspace, dependencies: entry.dependencies, actorId }, created_by: actorId,
  }))
  if (!rows.length) return []
  const { data, error } = await db().from('market_ai_execution_jobs').upsert(rows, { onConflict: 'idempotency_key', ignoreDuplicates: true }).select('*')
  if (error) throw new Error(`JOB_ENQUEUE_FAILED:${error.message}`)
  await db().from('market_ai_compilations').update({ status: 'executing' }).eq('id', compilationId)
  await db().from('market_ai_compilation_items').update({ status: 'queued' }).eq('compilation_id', compilationId).in('status', ['proposed','approved','blocked','failed'])
  return (data || []).map((row: Record<string, unknown>) => job(row))
}
export async function claimDueJobs(limit: number, workerId: string) {
  const { data, error } = await db().rpc('market_ai_claim_due_jobs', { p_limit: limit, p_worker_id: workerId })
  if (error) throw new Error(`JOB_CLAIM_FAILED:${error.message}`)
  return ((data || []) as Record<string, unknown>[]).map(job)
}
export async function updateJob(id: string, patch: Record<string, unknown>) {
  const { data, error } = await db().from('market_ai_execution_jobs').update(patch).eq('id', id).select('*').single()
  if (error) throw new Error(`JOB_UPDATE_FAILED:${error.message}`)
  return job(data as Record<string, unknown>)
}
export async function updateCompilationItem(id: string, patch: Record<string, unknown>) {
  const { data, error } = await db().from('market_ai_compilation_items').update(patch).eq('id', id).select('*').single()
  if (error) throw new Error(`COMPILATION_ITEM_UPDATE_FAILED:${error.message}`)
  return item(data as Record<string, unknown>)
}
export async function listJobs(limit = 150) {
  const { data, error } = await db().from('market_ai_execution_jobs').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`JOB_LIST_FAILED:${error.message}`)
  return (data || []).map((row: Record<string, unknown>) => job(row))
}
export async function createDeadLetter(input: { jobId: string; reason: string; payload: Record<string, unknown> }) {
  const { error } = await db().from('market_ai_dead_letters').insert({ job_id: input.jobId, reason: input.reason, payload: input.payload, status: 'open' })
  if (error) throw new Error(`DEAD_LETTER_CREATE_FAILED:${error.message}`)
}
export async function getToolExecutionByIdempotencyKey(idempotencyKey: string) {
  const { data, error } = await db().from('market_ai_tool_executions').select('*').eq('idempotency_key', idempotencyKey).maybeSingle()
  if (error) throw new Error(`TOOL_EXECUTION_READ_FAILED:${error.message}`)
  return data as Record<string, unknown> | null
}
export async function findCanonicalRecordByIdempotencyKey(idempotencyKey: string) {
  const { data, error } = await db().from('market_os_records').select('*').contains('metadata', { marketing_ai_idempotency_key: idempotencyKey }).limit(1).maybeSingle()
  if (error) return null
  return data as Record<string, unknown> | null
}
export async function recoverStaleExecutionJobs(staleMinutes = 15) {
  const cutoff = new Date(Date.now() - Math.max(5, staleMinutes) * 60_000).toISOString()
  const { data, error } = await db().from('market_ai_execution_jobs').update({ status: 'retry_scheduled', worker_id: null, claimed_at: null, heartbeat_at: null, next_retry_at: new Date().toISOString(), error: 'STALE_JOB_RECOVERED' }).in('status', ['claimed','running']).lt('heartbeat_at', cutoff).select('*')
  if (error) throw new Error(`STALE_JOB_RECOVERY_FAILED:${error.message}`)
  return (data || []).map((row: Record<string, unknown>) => job(row))
}
export async function saveToolExecution(input: { jobId?: string | null; compilationItemId?: string | null; toolName: string; actorId: string; input: Record<string, unknown>; status: string; output?: Record<string, unknown>; error?: string | null; idempotencyKey: string }) {
  const { data, error } = await db().from('market_ai_tool_executions').upsert({ job_id: input.jobId || null, compilation_item_id: input.compilationItemId || null, tool_name: input.toolName, actor_id: input.actorId, input: input.input, status: input.status, output: input.output || {}, error: input.error || null, idempotency_key: input.idempotencyKey, completed_at: ['completed','failed','blocked'].includes(input.status) ? new Date().toISOString() : null }, { onConflict: 'idempotency_key' }).select('*').single()
  if (error) throw new Error(`TOOL_EXECUTION_WRITE_FAILED:${error.message}`)
  return data
}
export async function listCanonicalMarketingRecords(limit = 200) {
  const { data, error } = await db().from('market_os_records').select('*').eq('engine', 'marketing_ai_phase3').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`CANONICAL_RECORD_LIST_FAILED:${error.message}`)
  return data || []
}
export async function createCanonicalRecord(input: { recordType: string; title: string; description: string; status?: string; priority?: string; stage?: string; dueDate?: string | null; metadata: Record<string, unknown>; actorName: string }) {
  const { data, error } = await db().from('market_os_records').insert({ record_type: input.recordType, engine: 'marketing_ai_phase3', pipeline: 'content_command_360', title: input.title, description: input.description, status: input.status || 'draft', priority: input.priority || 'high', stage: input.stage || 'prepared', due_date: input.dueDate || null, owner_agent: input.actorName, metadata: input.metadata }).select('*').single()
  if (error) throw new Error(`CANONICAL_RECORD_CREATE_FAILED:${error.message}`)
  return data as Record<string, unknown>
}
export async function createSyncLink(input: { sourceType: string; sourceId: string; targetType: string; targetId: string; strategy: string; metadata?: Record<string, unknown>; actorId: string }) {
  const { data, error } = await db().from('market_ai_sync_links').upsert({ source_type: input.sourceType, source_id: input.sourceId, target_type: input.targetType, target_id: input.targetId, strategy: input.strategy, status: 'active', metadata: input.metadata || {}, created_by: input.actorId }, { onConflict: 'source_type,source_id,target_type,target_id' }).select('*').single()
  if (error) throw new Error(`SYNC_LINK_CREATE_FAILED:${error.message}`)
  return data
}
export async function listSyncLinks(limit = 200) {
  const { data, error } = await db().from('market_ai_sync_links').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`SYNC_LINK_LIST_FAILED:${error.message}`)
  return data || []
}
export async function listConflicts(limit = 100) {
  const { data, error } = await db().from('market_ai_sync_conflicts').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`CONFLICT_LIST_FAILED:${error.message}`)
  return data || []
}
export async function listBridgeVersions(limit = 100) {
  const { data, error } = await db().from('market_ai_bridge_versions').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`BRIDGE_VERSION_LIST_FAILED:${error.message}`)
  return data || []
}
export async function getPhase3Dashboard(contextSources: Phase3AutopilotSnapshot['contextSources']): Promise<Phase3AutopilotSnapshot> {
  try {
    const client = db()
    const [compilations, awaiting, queued, running, dead, decisions, conflicts, materialized, recentCompilations, recentJobs, recentDecisions] = await Promise.all([
      client.from('market_ai_compilations').select('*', { count: 'exact', head: true }), client.from('market_ai_compilations').select('*', { count: 'exact', head: true }).eq('status','awaiting_decision'),
      client.from('market_ai_execution_jobs').select('*', { count: 'exact', head: true }).in('status',['queued','retry_scheduled','awaiting_approval']), client.from('market_ai_execution_jobs').select('*', { count: 'exact', head: true }).in('status',['claimed','running']),
      client.from('market_ai_dead_letters').select('*', { count: 'exact', head: true }).eq('status','open'), client.from('market_ai_decisions').select('*', { count: 'exact', head: true }).eq('status','pending'),
      client.from('market_ai_sync_conflicts').select('*', { count: 'exact', head: true }).eq('status','open'), client.from('market_ai_compilation_items').select('*', { count: 'exact', head: true }).eq('status','materialized'),
      client.from('market_ai_compilations').select('*').order('created_at',{ascending:false}).limit(8), client.from('market_ai_execution_jobs').select('*').order('created_at',{ascending:false}).limit(10), client.from('market_ai_decisions').select('*').order('decided_at',{ascending:false}).limit(8),
    ])
    const results = [compilations, awaiting, queued, running, dead, decisions, conflicts, materialized, recentCompilations, recentJobs, recentDecisions]
    const failed = results.find((result) => result.error)
    if (failed?.error) throw failed.error
    return {
      source: 'database', totals: { compilations: compilations.count || 0, awaitingDecision: awaiting.count || 0, queuedJobs: queued.count || 0, runningJobs: running.count || 0, deadLetters: dead.count || 0, pendingDecisions: decisions.count || 0, conflicts: conflicts.count || 0, materializedRecords: materialized.count || 0 },
      contextSources, recentCompilations: (recentCompilations.data || []).map((row: Record<string, unknown>) => compilation(row)), recentJobs: (recentJobs.data || []).map((row: Record<string, unknown>) => job(row)), decisions: (recentDecisions.data || []).map((row: Record<string, unknown>) => decision(row)),
      integrationHealth: contextSources.map((source) => ({ key: source.key, label: source.label, status: source.status === 'available' ? 'connected' : source.status === 'partial' ? 'partial' : 'unavailable', detail: source.warning || `${source.recordCount ?? 0} enregistrements visibles` })),
    }
  } catch {
    return { source: 'unavailable', totals: { compilations: 0, awaitingDecision: 0, queuedJobs: 0, runningJobs: 0, deadLetters: 0, pendingDecisions: 0, conflicts: 0, materializedRecords: 0 }, contextSources, recentCompilations: [], recentJobs: [], decisions: [], integrationHealth: contextSources.map((source) => ({ key: source.key, label: source.label, status: source.status === 'available' ? 'connected' : source.status === 'partial' ? 'partial' : 'unavailable', detail: source.warning || 'État non disponible' })) }
  }
}

export async function getJob(id: string) {
  const { data, error } = await db().from('market_ai_execution_jobs').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(`JOB_READ_FAILED:${error.message}`)
  return data ? job(data as Record<string, unknown>) : null
}

export async function listDeadLetters(limit = 100) {
  const { data, error } = await db().from('market_ai_dead_letters').select('*,market_ai_execution_jobs(*)').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`DEAD_LETTER_LIST_FAILED:${error.message}`)
  return data || []
}

export async function approveCompilationItems(compilationId: string) {
  const { data, error } = await db().from('market_ai_compilation_items').update({ status: 'approved' }).eq('compilation_id', compilationId).eq('status', 'proposed').select('*')
  if (error) throw new Error(`COMPILATION_ITEMS_APPROVE_FAILED:${error.message}`)
  return (data || []).map((row: Record<string, unknown>) => item(row))
}

export async function resolveConflict(id: string, actorId: string, resolution: Record<string, unknown>) {
  const { data, error } = await db().from('market_ai_sync_conflicts').update({ status: 'resolved', resolved_by: actorId, resolved_at: new Date().toISOString(), proposed_resolution: resolution }).eq('id', id).select('*').single()
  if (error) throw new Error(`CONFLICT_RESOLVE_FAILED:${error.message}`)
  return data
}
