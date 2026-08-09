import { createContentCommandSupabaseServerClient } from '@/lib/market-os/content-command/db/supabase-server'
import { generateMarketingAiCommands, getCatalogCommandByCode, getMarketingAiSkills } from './catalog'
import type {
  MarketingAiCommand,
  MarketingAiDashboardSnapshot,
  MarketingAiMission,
  MarketingAiOutput,
  MarketingAiRun,
  MarketingAiSchedule,
  MarketingAiSkill,
} from './types'

function rowToCommand(row: Record<string, unknown>): MarketingAiCommand {
  return {
    id: String(row.id || ''),
    code: String(row.code || ''),
    name: String(row.name || ''),
    skillCode: String(row.skill_code || ''),
    skillName: String(row.skill_name || ''),
    category: String(row.category || ''),
    objective: String(row.objective || ''),
    instruction: String(row.instruction || ''),
    defaultFrequency: String(row.default_frequency || 'manual') as MarketingAiCommand['defaultFrequency'],
    authorityMode: String(row.authority_mode || 'prepare') as MarketingAiCommand['authorityMode'],
    riskLevel: String(row.risk_level || 'medium') as MarketingAiCommand['riskLevel'],
    requiresHumanReview: Boolean(row.requires_human_review),
    status: String(row.status || 'draft') as MarketingAiCommand['status'],
    deployed: Boolean(row.deployed),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    source: String(row.source || 'manual') as MarketingAiCommand['source'],
    version: String(row.version || '1.0.0'),
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  }
}

function rowToSkill(row: Record<string, unknown>): MarketingAiSkill {
  return {
    code: String(row.code || ''),
    name: String(row.name || ''),
    category: String(row.category || ''),
    description: String(row.description || ''),
    defaultFrequency: String(row.default_frequency || 'monthly') as MarketingAiSkill['defaultFrequency'],
    mode: String(row.mode || 'analysis'),
    riskLevel: String(row.risk_level || 'medium') as MarketingAiSkill['riskLevel'],
    progressiveLevels: Array.isArray(row.progressive_levels) ? row.progressive_levels.map(String) : [],
    monthlyResourceUpdate: Boolean(row.monthly_resource_update),
    status: String(row.status || 'active') as MarketingAiSkill['status'],
  }
}

function rowToSchedule(row: Record<string, unknown>): MarketingAiSchedule {
  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    commandId: row.command_id ? String(row.command_id) : null,
    commandCode: String(row.command_code || ''),
    frequency: String(row.frequency || 'manual') as MarketingAiSchedule['frequency'],
    timezone: String(row.timezone || 'Africa/Casablanca'),
    hour: Number(row.hour || 0),
    minute: Number(row.minute || 0),
    dayOfWeek: row.day_of_week == null ? null : Number(row.day_of_week),
    dayOfMonth: row.day_of_month == null ? null : Number(row.day_of_month),
    enabled: Boolean(row.enabled),
    authorityMode: String(row.authority_mode || 'prepare') as MarketingAiSchedule['authorityMode'],
    objective: String(row.objective || ''),
    context: (row.context && typeof row.context === 'object' ? row.context : {}) as Record<string, unknown>,
    lastRunAt: row.last_run_at ? String(row.last_run_at) : null,
    nextRunAt: row.next_run_at ? String(row.next_run_at) : null,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  }
}

function rowToMission(row: Record<string, unknown>): MarketingAiMission {
  return {
    id: String(row.id || ''),
    title: String(row.title || ''),
    objective: String(row.objective || ''),
    sponsor: String(row.sponsor || ''),
    authorityMode: String(row.authority_mode || 'prepare') as MarketingAiMission['authorityMode'],
    status: String(row.status || 'draft') as MarketingAiMission['status'],
    priority: String(row.priority || 'high') as MarketingAiMission['priority'],
    commandCodes: Array.isArray(row.command_codes) ? row.command_codes.map(String) : [],
    context: (row.context && typeof row.context === 'object' ? row.context : {}) as Record<string, unknown>,
    restrictions: Array.isArray(row.restrictions) ? row.restrictions.map(String) : [],
    expectedOutcomes: Array.isArray(row.expected_outcomes) ? row.expected_outcomes.map(String) : [],
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  }
}

function rowToRun(row: Record<string, unknown>): MarketingAiRun {
  return {
    id: String(row.id || ''),
    missionId: row.mission_id ? String(row.mission_id) : null,
    scheduleId: row.schedule_id ? String(row.schedule_id) : null,
    commandId: row.command_id ? String(row.command_id) : null,
    commandCode: String(row.command_code || ''),
    status: String(row.status || 'queued') as MarketingAiRun['status'],
    authorityMode: String(row.authority_mode || 'prepare') as MarketingAiRun['authorityMode'],
    model: row.model ? String(row.model) : null,
    objective: String(row.objective || ''),
    input: (row.input && typeof row.input === 'object' ? row.input : {}) as Record<string, unknown>,
    output: (row.output && typeof row.output === 'object' ? row.output : null) as MarketingAiOutput | null,
    error: row.error ? String(row.error) : null,
    inputTokens: Number(row.input_tokens || 0),
    outputTokens: Number(row.output_tokens || 0),
    totalTokens: Number(row.total_tokens || 0),
    latencyMs: Number(row.latency_ms || 0),
    grounded: Boolean(row.grounded),
    startedAt: row.started_at ? String(row.started_at) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    createdAt: String(row.created_at || new Date().toISOString()),
  }
}

function db() {
  return createContentCommandSupabaseServerClient()
}

export async function listMarketingAiSkills(): Promise<{ source: 'database' | 'catalog_fallback'; skills: MarketingAiSkill[] }> {
  try {
    const { data, error } = await db().from('market_ai_skills').select('*').order('category').order('code')
    if (error) throw error
    if (!data?.length) return { source: 'catalog_fallback', skills: getMarketingAiSkills() }
    return { source: 'database', skills: data.map((row) => rowToSkill(row as Record<string, unknown>)) }
  } catch {
    return { source: 'catalog_fallback', skills: getMarketingAiSkills() }
  }
}

export async function listMarketingAiCommands(input: { search?: string; category?: string; status?: string; page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, input.page || 1)
  const pageSize = Math.min(200, Math.max(10, input.pageSize || 50))
  try {
    let query = db().from('market_ai_commands').select('*', { count: 'exact' })
    if (input.search) query = query.or(`code.ilike.%${input.search}%,name.ilike.%${input.search}%,objective.ilike.%${input.search}%`)
    if (input.category) query = query.eq('category', input.category)
    if (input.status) query = query.eq('status', input.status)
    const from = (page - 1) * pageSize
    const { data, error, count } = await query.order('code').range(from, from + pageSize - 1)
    if (error) throw error
    if (!data?.length && page === 1 && !input.search && !input.category && !input.status) throw new Error('EMPTY_CATALOG')
    return { source: 'database' as const, items: (data || []).map((row) => rowToCommand(row as Record<string, unknown>)), total: count || 0, page, pageSize }
  } catch {
    const catalog = generateMarketingAiCommands().filter((command) => {
      const search = (input.search || '').toLowerCase()
      return (!search || `${command.code} ${command.name} ${command.objective}`.toLowerCase().includes(search))
        && (!input.category || command.category === input.category)
        && (!input.status || command.status === input.status)
    })
    const from = (page - 1) * pageSize
    return { source: 'catalog_fallback' as const, items: catalog.slice(from, from + pageSize), total: catalog.length, page, pageSize }
  }
}

export async function findMarketingAiCommand(code: string): Promise<MarketingAiCommand | null> {
  try {
    const { data, error } = await db().from('market_ai_commands').select('*').eq('code', code).maybeSingle()
    if (error) throw error
    return data ? rowToCommand(data as Record<string, unknown>) : getCatalogCommandByCode(code) || null
  } catch {
    return getCatalogCommandByCode(code) || null
  }
}


export async function ensureMarketingAiSkillsForCommands(commands: MarketingAiCommand[]) {
  const unique = [...new Map(commands.map((command) => [command.skillCode, command])).values()]
  if (!unique.length) return []
  const client = db()
  const { data, error } = await client.from('market_ai_skills').select('code').in('code', unique.map((command) => command.skillCode))
  if (error) throw new Error(`SKILL_IMPORT_CHECK_FAILED:${error.message}`)
  const existing = new Set((data || []).map((row: { code?: string | null }) => String(row.code || '')))
  const missing = unique.filter((command) => !existing.has(command.skillCode)).map((command, index) => ({
    code: command.skillCode,
    catalog_order: 1000 + index,
    name: command.skillName || command.skillCode,
    category: command.category,
    description: `Compétence personnalisée importée pour les commandes ${command.skillCode}.`,
    default_frequency: command.defaultFrequency,
    mode: 'custom',
    risk_level: command.riskLevel,
    progressive_levels: ['foundation', 'operational', 'advanced', 'executive', 'self_improving'],
    monthly_resource_update: true,
    status: 'active',
  }))
  if (!missing.length) return []
  const { data: created, error: createError } = await client.from('market_ai_skills').upsert(missing, { onConflict: 'code' }).select('code')
  if (createError) throw new Error(`SKILL_IMPORT_CREATE_FAILED:${createError.message}`)
  return created || []
}

export async function upsertMarketingAiCommands(commands: MarketingAiCommand[], actorId: string) {
  const rows = commands.map((command) => ({
    code: command.code,
    name: command.name,
    skill_code: command.skillCode,
    skill_name: command.skillName,
    category: command.category,
    objective: command.objective,
    instruction: command.instruction,
    default_frequency: command.defaultFrequency,
    authority_mode: command.authorityMode,
    risk_level: command.riskLevel,
    requires_human_review: command.requiresHumanReview,
    status: command.status,
    deployed: command.deployed,
    tags: command.tags,
    source: command.source,
    version: command.version,
    updated_by: actorId,
  }))
  const { data, error } = await db().from('market_ai_commands').upsert(rows, { onConflict: 'code' }).select('id,code')
  if (error) throw new Error(`COMMAND_IMPORT_FAILED:${error.message}`)
  return data || []
}

export async function updateMarketingAiCommand(code: string, patch: Partial<MarketingAiCommand>, actorId: string) {
  const update: Record<string, unknown> = { updated_by: actorId }
  if (patch.name != null) update.name = patch.name
  if (patch.objective != null) update.objective = patch.objective
  if (patch.instruction != null) update.instruction = patch.instruction
  if (patch.defaultFrequency != null) update.default_frequency = patch.defaultFrequency
  if (patch.authorityMode != null) update.authority_mode = patch.authorityMode
  if (patch.riskLevel != null) update.risk_level = patch.riskLevel
  if (patch.requiresHumanReview != null) update.requires_human_review = patch.requiresHumanReview
  if (patch.status != null) update.status = patch.status
  if (patch.deployed != null) update.deployed = patch.deployed
  if (patch.tags != null) update.tags = patch.tags
  const { data, error } = await db().from('market_ai_commands').update(update).eq('code', code).select('*').single()
  if (error) throw new Error(`COMMAND_UPDATE_FAILED:${error.message}`)
  return rowToCommand(data as Record<string, unknown>)
}

export async function listMarketingAiSchedules(): Promise<MarketingAiSchedule[]> {
  const { data, error } = await db().from('market_ai_command_schedules').select('*').order('enabled', { ascending: false }).order('next_run_at')
  if (error) throw new Error(`SCHEDULE_LIST_FAILED:${error.message}`)
  return (data || []).map((row) => rowToSchedule(row as Record<string, unknown>))
}

export async function saveMarketingAiSchedule(schedule: Omit<MarketingAiSchedule, 'id'> & { id?: string }, actorId: string) {
  const row = {
    id: schedule.id,
    name: schedule.name,
    command_id: schedule.commandId || null,
    command_code: schedule.commandCode,
    frequency: schedule.frequency,
    timezone: schedule.timezone,
    hour: schedule.hour,
    minute: schedule.minute,
    day_of_week: schedule.dayOfWeek ?? null,
    day_of_month: schedule.dayOfMonth ?? null,
    enabled: schedule.enabled,
    authority_mode: schedule.authorityMode,
    objective: schedule.objective,
    context: schedule.context,
    next_run_at: schedule.nextRunAt || null,
    updated_by: actorId,
  }
  const { data, error } = await db().from('market_ai_command_schedules').upsert(row).select('*').single()
  if (error) throw new Error(`SCHEDULE_SAVE_FAILED:${error.message}`)
  return rowToSchedule(data as Record<string, unknown>)
}

export async function listDueMarketingAiSchedules(limit: number): Promise<MarketingAiSchedule[]> {
  const { data, error } = await db().from('market_ai_command_schedules').select('*').eq('enabled', true).lte('next_run_at', new Date().toISOString()).order('next_run_at').limit(limit)
  if (error) throw new Error(`DUE_SCHEDULE_LIST_FAILED:${error.message}`)
  return (data || []).map((row) => rowToSchedule(row as Record<string, unknown>))
}

export async function markScheduleRun(scheduleId: string, nextRunAt: string | null) {
  const { error } = await db().from('market_ai_command_schedules').update({ last_run_at: new Date().toISOString(), next_run_at: nextRunAt }).eq('id', scheduleId)
  if (error) throw new Error(`SCHEDULE_MARK_FAILED:${error.message}`)
}

export async function listMarketingAiMissions(limit = 100): Promise<MarketingAiMission[]> {
  const { data, error } = await db().from('market_ai_mandates').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`MISSION_LIST_FAILED:${error.message}`)
  return (data || []).map((row) => rowToMission(row as Record<string, unknown>))
}

export async function createMarketingAiMission(input: Omit<MarketingAiMission, 'id' | 'createdAt' | 'updatedAt' | 'sponsor' | 'status'>, actor: { id: string; name: string }) {
  const { data, error } = await db().from('market_ai_mandates').insert({
    title: input.title,
    objective: input.objective,
    sponsor: actor.name,
    sponsor_id: actor.id,
    authority_mode: input.authorityMode,
    status: 'approved',
    priority: input.priority,
    command_codes: input.commandCodes,
    context: input.context,
    restrictions: input.restrictions,
    expected_outcomes: input.expectedOutcomes,
  }).select('*').single()
  if (error) throw new Error(`MISSION_CREATE_FAILED:${error.message}`)
  return rowToMission(data as Record<string, unknown>)
}

export async function getMarketingAiMission(id: string): Promise<MarketingAiMission | null> {
  const { data, error } = await db().from('market_ai_mandates').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(`MISSION_READ_FAILED:${error.message}`)
  return data ? rowToMission(data as Record<string, unknown>) : null
}

export async function updateMarketingAiMissionStatus(id: string, status: MarketingAiMission['status']) {
  const { error } = await db().from('market_ai_mandates').update({ status }).eq('id', id)
  if (error) throw new Error(`MISSION_STATUS_FAILED:${error.message}`)
}


export async function assertMarketingAiRunBudget(actorId: string, maxRunsPerHour: number, maxTokensPerDay: number) {
  const client = db()
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const [runs, tokens] = await Promise.all([
    client.from('market_ai_runs').select('*', { count: 'exact', head: true }).eq('created_by', actorId).gte('created_at', hourAgo),
    client.from('market_ai_runs').select('total_tokens').gte('created_at', dayAgo),
  ])
  if (runs.error) throw new Error(`RUN_BUDGET_CHECK_FAILED:${runs.error.message}`)
  if (tokens.error) throw new Error(`TOKEN_BUDGET_CHECK_FAILED:${tokens.error.message}`)
  const totalTokens = (tokens.data || []).reduce((sum: number, row: { total_tokens?: number | null }) => sum + Number(row.total_tokens || 0), 0)
  if ((runs.count || 0) >= maxRunsPerHour) throw new Error('MARKETING_AI_HOURLY_RUN_LIMIT_REACHED')
  if (totalTokens >= maxTokensPerDay) throw new Error('MARKETING_AI_DAILY_TOKEN_LIMIT_REACHED')
  return { runsLastHour: runs.count || 0, tokensLastDay: totalTokens }
}

export async function createMarketingAiRun(input: {
  command: MarketingAiCommand
  objective: string
  authorityMode: MarketingAiRun['authorityMode']
  missionId?: string | null
  scheduleId?: string | null
  context: Record<string, unknown>
  actorId: string
}) {
  const { data, error } = await db().from('market_ai_runs').insert({
    mission_id: input.missionId || null,
    schedule_id: input.scheduleId || null,
    command_id: input.command.id || null,
    command_code: input.command.code,
    status: 'running',
    authority_mode: input.authorityMode,
    objective: input.objective,
    input: input.context,
    started_at: new Date().toISOString(),
    created_by: input.actorId,
  }).select('*').single()
  if (error) throw new Error(`RUN_CREATE_FAILED:${error.message}`)
  return rowToRun(data as Record<string, unknown>)
}

export async function completeMarketingAiRun(id: string, input: {
  output: MarketingAiOutput
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  latencyMs: number
  grounded: boolean
}) {
  const { data, error } = await db().from('market_ai_runs').update({
    status: input.output.humanDecisionRequired ? 'needs_review' : 'completed',
    output: input.output,
    model: input.model,
    input_tokens: input.inputTokens,
    output_tokens: input.outputTokens,
    total_tokens: input.totalTokens,
    latency_ms: input.latencyMs,
    grounded: input.grounded,
    completed_at: new Date().toISOString(),
  }).eq('id', id).select('*').single()
  if (error) throw new Error(`RUN_COMPLETE_FAILED:${error.message}`)
  return rowToRun(data as Record<string, unknown>)
}

export async function failMarketingAiRun(id: string, errorMessage: string, blocked = false) {
  const { error } = await db().from('market_ai_runs').update({ status: blocked ? 'blocked' : 'failed', error: errorMessage, completed_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(`RUN_FAIL_WRITE_FAILED:${error.message}`)
}

export async function listMarketingAiRuns(limit = 100): Promise<MarketingAiRun[]> {
  const { data, error } = await db().from('market_ai_runs').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`RUN_LIST_FAILED:${error.message}`)
  return (data || []).map((row) => rowToRun(row as Record<string, unknown>))
}

export async function recordGuardrailEvent(input: { actorId: string; runId?: string | null; commandCode?: string; requestedAction: string; reason: string; payload?: Record<string, unknown> }) {
  const { error } = await db().from('market_ai_guardrail_events').insert({
    actor_id: input.actorId,
    run_id: input.runId || null,
    command_code: input.commandCode || null,
    requested_action: input.requestedAction,
    reason: input.reason,
    payload: input.payload || {},
  })
  if (error) throw new Error(`GUARDRAIL_WRITE_FAILED:${error.message}`)
}

export async function recordLearningEvent(input: { actorId: string; runId?: string | null; title: string; evidence: string[]; recommendation: string; confidence: number; status?: string }) {
  const { error } = await db().from('market_ai_learning_events').insert({
    actor_id: input.actorId,
    run_id: input.runId || null,
    title: input.title,
    evidence: input.evidence,
    recommendation: input.recommendation,
    confidence: input.confidence,
    status: input.status || 'proposed',
  })
  if (error) throw new Error(`LEARNING_WRITE_FAILED:${error.message}`)
}

export async function listLearningEvents(limit = 100) {
  const { data, error } = await db().from('market_ai_learning_events').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`LEARNING_LIST_FAILED:${error.message}`)
  return data || []
}

export async function governLearningEvent(input: { id: string; status: 'under_review' | 'accepted' | 'accepted_with_limitations' | 'rejected' | 'retired' | 'superseded'; reason: string; actorId: string; actorName: string }) {
  const { data: current, error: readError } = await db().from('market_ai_learning_events').select('*').eq('id', input.id).maybeSingle()
  if (readError) throw new Error(`LEARNING_READ_FAILED:${readError.message}`)
  if (!current) throw new Error('LEARNING_NOT_FOUND')
  const prior = current as Record<string, unknown>
  const evidence = Array.isArray(prior.evidence) ? prior.evidence : []
  if (['accepted', 'accepted_with_limitations'].includes(input.status) && evidence.length === 0) throw new Error('LEARNING_EVIDENCE_REQUIRED')
  const governance = { status: input.status, reason: input.reason, actorId: input.actorId, actorName: input.actorName, decidedAt: new Date().toISOString(), priorStatus: String(prior.status || 'proposed'), doctrinePromoted: false }
  const { data, error } = await db().from('market_ai_learning_events').update({ status: input.status, recommendation: `${String(prior.recommendation || '')}\n\n[Gouvernance humaine] ${input.reason}`, evidence: [...evidence, JSON.stringify(governance)] }).eq('id', input.id).select('*').single()
  if (error) throw new Error(`LEARNING_GOVERNANCE_FAILED:${error.message}`)
  return data
}

export async function listResourceUpdates(limit = 100) {
  const { data, error } = await db().from('market_ai_resource_updates').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`RESOURCE_LIST_FAILED:${error.message}`)
  return data || []
}

export async function recordResourceUpdate(input: { actorId: string; runId?: string | null; title: string; domains: string[]; summary: string; sources: unknown[]; recommendations: string[] }) {
  const { data, error } = await db().from('market_ai_resource_updates').insert({
    actor_id: input.actorId,
    run_id: input.runId || null,
    title: input.title,
    domains: input.domains,
    summary: input.summary,
    sources: input.sources,
    recommendations: input.recommendations,
    status: 'review_required',
  }).select('*').single()
  if (error) throw new Error(`RESOURCE_WRITE_FAILED:${error.message}`)
  return data
}

export async function getMarketingAiDashboard(provider: MarketingAiDashboardSnapshot['provider']): Promise<MarketingAiDashboardSnapshot> {
  const fallback = generateMarketingAiCommands()
  try {
    const client = db()
    const [skills, commands, activeCommands, schedules, dueSchedules, missions, runs, needsReview, learning, recentRuns, due] = await Promise.all([
      client.from('market_ai_skills').select('*', { count: 'exact', head: true }),
      client.from('market_ai_commands').select('*', { count: 'exact', head: true }),
      client.from('market_ai_commands').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('deployed', true),
      client.from('market_ai_command_schedules').select('*', { count: 'exact', head: true }).eq('enabled', true),
      client.from('market_ai_command_schedules').select('*', { count: 'exact', head: true }).eq('enabled', true).lte('next_run_at', new Date().toISOString()),
      client.from('market_ai_mandates').select('*', { count: 'exact', head: true }),
      client.from('market_ai_runs').select('*', { count: 'exact', head: true }),
      client.from('market_ai_runs').select('*', { count: 'exact', head: true }).eq('status', 'needs_review'),
      client.from('market_ai_learning_events').select('*', { count: 'exact', head: true }),
      client.from('market_ai_runs').select('*').order('created_at', { ascending: false }).limit(8),
      client.from('market_ai_command_schedules').select('*').eq('enabled', true).lte('next_run_at', new Date().toISOString()).order('next_run_at').limit(8),
    ])
    const anyError = [skills, commands, activeCommands, schedules, dueSchedules, missions, runs, needsReview, learning, recentRuns, due].find((result) => result.error)
    if (anyError?.error) throw anyError.error
    return {
      source: 'database',
      provider,
      totals: {
        skills: skills.count || 0,
        commands: commands.count || 0,
        activeCommands: activeCommands.count || 0,
        schedules: schedules.count || 0,
        dueSchedules: dueSchedules.count || 0,
        missions: missions.count || 0,
        runs: runs.count || 0,
        needsReview: needsReview.count || 0,
        learningEvents: learning.count || 0,
      },
      recentRuns: (recentRuns.data || []).map((row) => rowToRun(row as Record<string, unknown>)),
      dueSchedules: (due.data || []).map((row) => rowToSchedule(row as Record<string, unknown>)),
    }
  } catch {
    return {
      source: 'catalog_fallback',
      provider,
      totals: { skills: getMarketingAiSkills().length, commands: fallback.length, activeCommands: fallback.length, schedules: 0, dueSchedules: 0, missions: 0, runs: 0, needsReview: 0, learningEvents: 0 },
      recentRuns: [],
      dueSchedules: [],
    }
  }
}

export async function createInternalActionQueue(input: { actorId: string; runId: string; missionId?: string | null; commandCode: string; actions: MarketingAiOutput['internalActions'] }) {
  const rows = input.actions.filter((action) => action.type !== 'none').map((action) => ({
    run_id: input.runId,
    mission_id: input.missionId || null,
    command_code: input.commandCode,
    action_type: action.type,
    title: action.title,
    description: action.description,
    requires_approval: action.requiresApproval,
    payload: action.payload,
    status: action.requiresApproval ? 'awaiting_approval' : 'prepared',
    created_by: input.actorId,
  }))
  if (!rows.length) return []
  const { data, error } = await db().from('market_ai_action_queue').insert(rows).select('*')
  if (error) throw new Error(`ACTION_QUEUE_CREATE_FAILED:${error.message}`)
  return data || []
}

export async function listInternalActionQueue(limit = 100) {
  const { data, error } = await db().from('market_ai_action_queue').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`ACTION_QUEUE_LIST_FAILED:${error.message}`)
  return data || []
}


export async function getInternalAction(id: string) {
  const { data, error } = await db().from('market_ai_action_queue').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(`ACTION_QUEUE_READ_FAILED:${error.message}`)
  return data || null
}

export async function recordMarketingAiBridgeObject(input: {
  actorId: string
  runId?: string | null
  actionId?: string | null
  contentId?: string | null
  bridgeFileId: string
  entityType: string
  originalFilename: string
  safeFilename: string
  contentType?: string | null
  sizeBytes: number
  sha256Hash: string
  storageKey: string
  classification: Record<string, unknown>
}) {
  const { data, error } = await db().from('market_ai_bridge_objects').upsert({
    run_id: input.runId || null,
    action_id: input.actionId || null,
    content_id: input.contentId || null,
    bridge_file_id: input.bridgeFileId,
    entity_type: input.entityType,
    original_filename: input.originalFilename,
    safe_filename: input.safeFilename,
    content_type: input.contentType || null,
    size_bytes: input.sizeBytes,
    sha256_hash: input.sha256Hash,
    storage_key: input.storageKey,
    classification: input.classification,
    status: 'active',
    created_by: input.actorId,
  }, { onConflict: 'bridge_file_id' }).select('*').single()
  if (error) throw new Error(`BRIDGE_OBJECT_WRITE_FAILED:${error.message}`)
  return data
}

export async function listMarketingAiBridgeObjects(limit = 100) {
  const { data, error } = await db().from('market_ai_bridge_objects').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`BRIDGE_OBJECT_LIST_FAILED:${error.message}`)
  return data || []
}

export async function updateInternalActionStatus(id: string, status: 'approved' | 'rejected' | 'executed' | 'failed', actorId: string, executionResult?: Record<string, unknown>) {
  const { data, error } = await db().from('market_ai_action_queue').update({
    status,
    decided_by: actorId,
    decided_at: new Date().toISOString(),
    execution_result: executionResult || {},
  }).eq('id', id).select('*').single()
  if (error) throw new Error(`ACTION_QUEUE_UPDATE_FAILED:${error.message}`)
  return data
}
