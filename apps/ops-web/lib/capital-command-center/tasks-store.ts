import { createClient } from '@/lib/supabase/server'

type AnyRecord = Record<string, any>

export type TaskResource = 'tasks' | 'projects' | 'cycles' | 'modules' | 'daily-reports' | 'activity'

const RESOURCE_TABLES: Record<TaskResource, string> = {
  tasks: 'capital_tasks',
  projects: 'capital_task_projects',
  cycles: 'capital_task_cycles',
  modules: 'capital_task_modules',
  'daily-reports': 'capital_task_daily_reports',
  activity: 'capital_task_activity',
}

const INSERTABLE: Record<TaskResource, string[]> = {
  tasks: [
    'tenant_id','project_id','cycle_id','module_id','title','description','department','workspace','status','priority','assignee_id','assignee_name','created_by','created_by_name','start_date','due_date','completed_at','estimate_points','tags','labels','related_entity_type','related_entity_id','investor_name','partner_name','client_name','fundraising_stage','capital_impact','risk_level','blocker_reason','evidence_url','completion_notes','metadata',
  ],
  projects: ['tenant_id','name','description','department','status','priority','owner_id','owner_name','start_date','target_date','color','metadata'],
  cycles: ['tenant_id','name','description','project_id','status','start_date','end_date','goal','metadata'],
  modules: ['tenant_id','name','description','project_id','owner_id','owner_name','status','target_date','metadata'],
  'daily-reports': ['tenant_id','report_date','author_id','author_name','department','completed_count','blocked_count','overdue_count','summary','completed_tasks','blockers','tomorrow_priorities','metadata'],
  activity: ['task_id','project_id','actor_id','actor_name','action','before','after'],
}

const ARRAY_FIELDS = new Set(['tags', 'labels'])
const INT_FIELDS = new Set(['estimate_points', 'completed_count', 'blocked_count', 'overdue_count'])
const DATE_FIELDS = new Set(['start_date', 'due_date', 'target_date', 'end_date', 'report_date'])
const UUID_FIELDS = new Set(['tenant_id', 'project_id', 'cycle_id', 'module_id', 'assignee_id', 'created_by', 'owner_id', 'related_entity_id', 'author_id', 'actor_id', 'task_id'])

function isUuidLike(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function asArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function cleanPayload(resource: TaskResource, body: AnyRecord, partial = false) {
  const allowed = INSERTABLE[resource]
  const payload: AnyRecord = {}
  for (const key of allowed) {
    if (!(key in body)) continue
    const value = body[key]
    if (ARRAY_FIELDS.has(key)) payload[key] = asArray(value)
    else if (INT_FIELDS.has(key)) payload[key] = Number.isFinite(Number(value)) ? Number(value) : 0
    else if (DATE_FIELDS.has(key)) payload[key] = value ? String(value) : null
    else if (UUID_FIELDS.has(key)) payload[key] = isUuidLike(value) ? value : null
    else if (key === 'metadata') payload[key] = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
    else payload[key] = value === '' ? null : value
  }
  if (!partial && resource === 'tasks' && !payload.title) payload.title = 'Untitled task'
  if (!partial && ['projects', 'cycles', 'modules'].includes(resource) && !payload.name) payload.name = 'Untitled'
  if (!partial && resource === 'daily-reports' && !payload.report_date) payload.report_date = new Date().toISOString().slice(0, 10)
  if (partial) payload.updated_at = new Date().toISOString()
  return payload
}

export function taskTable(resource: TaskResource) {
  return RESOURCE_TABLES[resource]
}

export async function listResource(resource: TaskResource) {
  const supabase = await createClient()
  let query = supabase.from(RESOURCE_TABLES[resource]).select('*')
  if (resource === 'tasks' || resource === 'projects' || resource === 'cycles' || resource === 'modules') query = query.order('created_at', { ascending: false })
  if (resource === 'daily-reports') query = query.order('report_date', { ascending: false })
  if (resource === 'activity') query = query.order('created_at', { ascending: false }).limit(100)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getResource(resource: TaskResource, id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from(RESOURCE_TABLES[resource]).select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createResource(resource: TaskResource, body: AnyRecord) {
  const supabase = await createClient()
  const payload = cleanPayload(resource, body)
  const { data, error } = await supabase.from(RESOURCE_TABLES[resource]).insert(payload).select('*').single()
  if (error) throw error
  if (resource !== 'activity') await logActivity({ action: `${resource}.created`, after: data, task_id: resource === 'tasks' ? data?.id : null, project_id: resource === 'projects' ? data?.id : data?.project_id || null })
  return data
}

export async function updateResource(resource: TaskResource, id: string, body: AnyRecord) {
  const supabase = await createClient()
  const before = await getResource(resource, id).catch(() => null)
  const payload = cleanPayload(resource, body, true)
  const { data, error } = await supabase.from(RESOURCE_TABLES[resource]).update(payload).eq('id', id).select('*').single()
  if (error) throw error
  if (resource !== 'activity') await logActivity({ action: `${resource}.updated`, before, after: data, task_id: resource === 'tasks' ? data?.id : null, project_id: resource === 'projects' ? data?.id : data?.project_id || null })
  return data
}

export async function deleteResource(resource: TaskResource, id: string) {
  const supabase = await createClient()
  const before = await getResource(resource, id).catch(() => null)
  const { error } = await supabase.from(RESOURCE_TABLES[resource]).delete().eq('id', id)
  if (error) throw error
  if (resource !== 'activity') await logActivity({ action: `${resource}.deleted`, before, task_id: resource === 'tasks' ? id : null, project_id: resource === 'projects' ? id : before?.project_id || null })
  return true
}

export async function listComments(taskId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('capital_task_comments').select('*').eq('task_id', taskId).order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createComment(taskId: string, body: AnyRecord) {
  const supabase = await createClient()
  const payload = { task_id: taskId, author_id: isUuidLike(body.author_id) ? body.author_id : null, author_name: body.author_name || 'AngelCare Operator', body: String(body.body || '').trim() }
  if (!payload.body) throw new Error('Comment body is required')
  const { data, error } = await supabase.from('capital_task_comments').insert(payload).select('*').single()
  if (error) throw error
  await logActivity({ action: 'comment.created', task_id: taskId, after: data })
  return data
}

export async function logActivity(input: AnyRecord) {
  try {
    const supabase = await createClient()
    await supabase.from('capital_task_activity').insert({
      task_id: isUuidLike(input.task_id) ? input.task_id : null,
      project_id: isUuidLike(input.project_id) ? input.project_id : null,
      actor_id: isUuidLike(input.actor_id) ? input.actor_id : null,
      actor_name: input.actor_name || 'AngelCare System',
      action: input.action || 'activity',
      before: input.before || null,
      after: input.after || null,
    })
  } catch {
    // Activity logging must never break primary operations.
  }
}

export const STARTER_TASKS = [
  { title: 'Build investor data room index', department: 'Fundraising', workspace: 'Capital Command', status: 'planned', priority: 'high', fundraising_stage: 'Data Room', capital_impact: 'Investor readiness' },
  { title: 'Prepare Morocco national funding tracker', department: 'Fundraising', workspace: 'Capital Command', status: 'planned', priority: 'high', fundraising_stage: 'National Funding Programs', capital_impact: 'Non-dilutive funding' },
  { title: 'Prepare international grants concept note', department: 'Fundraising', workspace: 'Capital Command', status: 'planned', priority: 'high', fundraising_stage: 'International Funding Programs', capital_impact: 'Grant pipeline' },
  { title: 'Confirm 100 outreach segmentation', department: 'Fundraising', workspace: 'Capital Command', status: 'in_progress', priority: 'critical', fundraising_stage: 'Investor Outreach', capital_impact: 'Appointment conversion' },
  { title: 'Prepare AngelCare financial model V1', department: 'Finance', workspace: 'Capital Command', status: 'planned', priority: 'critical', fundraising_stage: 'Financial Model', capital_impact: 'Capital ask validation' },
  { title: 'Prepare pitch deck V1', department: 'Fundraising', workspace: 'Capital Command', status: 'planned', priority: 'high', fundraising_stage: 'Pitch Deck', capital_impact: 'Investor narrative' },
  { title: 'Prepare VC objection bank', department: 'Fundraising', workspace: 'Capital Command', status: 'backlog', priority: 'medium', fundraising_stage: 'VC Materials', capital_impact: 'Meeting readiness' },
  { title: 'Build B2B schools partnership task list', department: 'Partnerships', workspace: 'Capital Command', status: 'planned', priority: 'high', fundraising_stage: 'B2B Partnerships', capital_impact: 'Distribution channel' },
  { title: 'Prepare daily report format', department: 'Finance', workspace: 'Capital Command', status: 'planned', priority: 'medium', fundraising_stage: 'Due Diligence', capital_impact: 'Execution control' },
  { title: 'Prepare use-of-funds breakdown', department: 'Finance', workspace: 'Capital Command', status: 'planned', priority: 'critical', fundraising_stage: 'Closing / Injection', capital_impact: 'Capital allocation' },
  { title: 'Prepare fundraising compliance checklist', department: 'Compliance', workspace: 'Capital Command', status: 'planned', priority: 'high', fundraising_stage: 'Due Diligence', capital_impact: 'Credibility protection' },
  { title: 'Prepare investor appointment follow-up workflow', department: 'Fundraising', workspace: 'Capital Command', status: 'planned', priority: 'high', fundraising_stage: 'Follow-up', capital_impact: 'Appointment conversion' },
]
