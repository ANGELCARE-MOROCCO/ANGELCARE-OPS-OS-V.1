import { createClient } from '@/lib/supabase/server'

type AnyRecord = Record<string, any>

type ActionResult = {
  ok: boolean
  action?: string
  table?: string
  id?: string | null
  data?: any
  error?: string
}

async function getSupabase() {
  return await createClient()
}

function nowIso() {
  return new Date().toISOString()
}

function cleanPayload(input: AnyRecord = {}) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== '')
  )
}

async function insertBestEffort(table: string, payload: AnyRecord): Promise<ActionResult> {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase.from(table).insert(cleanPayload(payload)).select('*').single()
    if (error) return { ok: false, table, error: error.message }
    return { ok: true, table, id: data?.id ?? null, data }
  } catch (error: any) {
    return { ok: false, table, error: error?.message || 'Insert failed' }
  }
}

async function updateBestEffort(table: string, id: string, payload: AnyRecord): Promise<ActionResult> {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from(table)
      .update(cleanPayload({ ...payload, updated_at: nowIso() }))
      .eq('id', id)
      .select('*')
      .single()
    if (error) return { ok: false, table, id, error: error.message }
    return { ok: true, table, id, data }
  } catch (error: any) {
    return { ok: false, table, id, error: error?.message || 'Update failed' }
  }
}

async function logActivity(payload: AnyRecord) {
  const base = {
    module: 'hr',
    entity_type: payload.entity_type || payload.type || 'hr_action',
    entity_id: payload.entity_id || payload.id || null,
    title: payload.title || payload.action || 'HR action completed',
    description: payload.description || payload.notes || null,
    action: payload.action || 'action_completed',
    actor_name: payload.actor_name || payload.actor || 'HR Operator',
    metadata: payload.metadata || payload,
    created_at: nowIso(),
  }

  await insertBestEffort('hr_activity_timeline', base)
  await insertBestEffort('hr_audit_logs', {
    ...base,
    event_type: base.action,
    severity: payload.severity || 'info',
  })
}

export async function executeHRAction(input: AnyRecord = {}): Promise<ActionResult> {
  const action = String(input.action || input.action_type || input.type || 'generic_action')
  const table = String(input.table || input.target_table || '')
  const id = input.id || input.entity_id || null

  let result: ActionResult = { ok: true, action, data: input }

  if (table && id && input.payload) {
    result = await updateBestEffort(table, String(id), input.payload)
  } else if (table && input.payload) {
    result = await insertBestEffort(table, input.payload)
  }

  await logActivity({ ...input, action, entity_id: id, title: input.title || `HR action: ${action}` })
  return { ...result, action }
}

export async function createApproval(input: AnyRecord = {}): Promise<ActionResult> {
  const payload = {
    title: input.title || input.subject || 'HR approval request',
    request_type: input.request_type || input.type || 'hr_approval',
    entity_type: input.entity_type || 'hr',
    entity_id: input.entity_id || null,
    requester_name: input.requester_name || input.actor_name || 'HR Operator',
    approver_name: input.approver_name || input.manager_name || null,
    status: input.status || 'pending',
    priority: input.priority || 'normal',
    notes: input.notes || input.description || null,
    metadata: input.metadata || input,
    created_at: nowIso(),
    updated_at: nowIso(),
  }

  const result = await insertBestEffort('hr_approval_requests', payload)
  await logActivity({ ...payload, action: 'approval_created', title: payload.title })
  return { ...result, action: 'approval_created' }
}

export async function decideApproval(input: AnyRecord = {}): Promise<ActionResult> {
  const id = String(input.id || input.approval_id || input.entity_id || '')
  if (!id) return { ok: false, action: 'approval_decision', error: 'Missing approval id' }

  const decision = String(input.decision || input.status || 'approved')
  const result = await updateBestEffort('hr_approval_requests', id, {
    status: decision,
    decision,
    decision_notes: input.notes || input.decision_notes || null,
    decided_by: input.decided_by || input.actor_name || 'HR Operator',
    decided_at: nowIso(),
  })

  await logActivity({ ...input, action: 'approval_decision', entity_type: 'approval', entity_id: id, title: `Approval ${decision}` })
  return { ...result, action: 'approval_decision' }
}

export async function bulkAttendanceControl(input: AnyRecord = {}): Promise<ActionResult> {
  const ids: string[] = Array.isArray(input.ids) ? input.ids : Array.isArray(input.record_ids) ? input.record_ids : []
  const status = input.status || input.attendance_status || input.action_status || 'manager_review'

  try {
    const supabase = await getSupabase()
    let query = supabase
      .from('hr_attendance_records')
      .update({ status, payroll_status: input.payroll_status || undefined, updated_at: nowIso() })

    if (ids.length) query = query.in('id', ids)
    else if (input.work_date) query = query.eq('work_date', input.work_date)
    else return { ok: false, action: 'bulk_attendance_control', error: 'Missing attendance ids or work_date' }

    const { data, error } = await query.select('*')
    if (error) return { ok: false, action: 'bulk_attendance_control', error: error.message }

    await logActivity({ ...input, action: 'bulk_attendance_control', entity_type: 'attendance', title: 'Bulk attendance control executed' })
    return { ok: true, action: 'bulk_attendance_control', data }
  } catch (error: any) {
    return { ok: false, action: 'bulk_attendance_control', error: error?.message || 'Bulk attendance control failed' }
  }
}

export async function createDepartment(input: AnyRecord = {}): Promise<ActionResult> {
  const payload = {
    name: input.name || input.department_name || input.title || 'New Department',
    title: input.title || input.name || input.department_name || 'New Department',
    code: input.code || input.slug || null,
    manager_name: input.manager_name || input.owner_name || null,
    status: input.status || 'active',
    priority: input.priority || 'normal',
    notes: input.notes || input.description || null,
    metadata: input.metadata || input,
    created_at: nowIso(),
    updated_at: nowIso(),
  }

  const primary = await insertBestEffort('hr_departments', payload)
  const result = primary.ok ? primary : await insertBestEffort('hr_daily_operations', {
    ...payload,
    record_type: 'department',
    module: 'hr',
  })

  await logActivity({ ...payload, action: 'department_created', entity_type: 'department', entity_id: result.id, title: `Department created: ${payload.name}` })
  return { ...result, action: 'department_created' }
}
