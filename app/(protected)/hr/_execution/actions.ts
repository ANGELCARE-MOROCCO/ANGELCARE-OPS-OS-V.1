"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type AnyRow = Record<string, any>

const tableMap: Record<string, string> = {
  actions: 'hr_execution_action_queue',
  approvals: 'hr_approval_requests',
  leave: 'hr_leave_requests',
  documents: 'hr_staff_documents',
  roster: 'hr_rosters',
  performance: 'hr_performance_reviews',
  training: 'hr_certifications',
  compliance: 'hr_disciplinary_actions',
  staff: 'hr_staff_profiles',
  payroll: 'hr_payroll_preparation_items',
  memos: 'hr_staff_notifications',
  audit: 'hr_execution_audit_events',
}

function read(formData: FormData, key: string, fallback = '') {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : fallback
}

function num(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key) || fallback)
  return Number.isFinite(value) ? value : fallback
}

function nullable(value: string) {
  return value ? value : null
}

async function audit(title: string, description: string, source_module = 'hr', metadata: AnyRow = {}) {
  try {
    const supabase = await createClient()
    await supabase.from('hr_execution_audit_events').insert({
      event_type: 'manual_execution',
      title,
      description,
      source_module,
      severity: 'info',
      status: 'closed',
      metadata,
    })
  } catch {
    // Audit must never block the operator action.
  }
}

async function insertSafe(table: string, payload: AnyRow) {
  const supabase = await createClient()
  const { error } = await supabase.from(table).insert(payload as any)
  if (error) throw new Error(error.message)
}

async function updateSafe(table: string, id: string, payload: AnyRow) {
  const supabase = await createClient()
  const { error } = await supabase.from(table).update(payload as any).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function createHRExecutionRecord(formData: FormData) {
  const moduleKey = read(formData, 'moduleKey', 'actions')
  const table = tableMap[moduleKey]
  const path = read(formData, 'path', `/hr/${moduleKey}`)

  if (!table) throw new Error(`Unknown HR module: ${moduleKey}`)

  if (moduleKey === 'actions') {
    const title = read(formData, 'title', 'Manual HR action')
    await insertSafe(table, {
      action_type: read(formData, 'action_type', 'manual'),
      title,
      description: read(formData, 'description'),
      priority: read(formData, 'priority', 'medium'),
      status: read(formData, 'status', 'pending'),
      target_route: path,
      metadata: { source: 'hr-real-execution-pack' },
    })
    await audit('HR action created', title, moduleKey)
  }

  if (moduleKey === 'approvals') {
    const type = read(formData, 'type', 'general_approval')
    await insertSafe(table, {
      type,
      status: read(formData, 'status', 'pending'),
    })
    await audit('HR approval request created', type, moduleKey)
  }

  if (moduleKey === 'leave') {
    await insertSafe(table, {
      start_date: nullable(read(formData, 'start_date')),
      end_date: nullable(read(formData, 'end_date')),
      status: read(formData, 'status', 'pending'),
      reason: read(formData, 'reason', 'Leave request'),
    })
    await audit('Leave request created', read(formData, 'reason', 'Leave request'), moduleKey)
  }

  if (moduleKey === 'documents') {
    await insertSafe(table, {
      type: read(formData, 'type', 'staff_document'),
      file_url: read(formData, 'file_url', '#'),
    })
    await audit('Staff document registered', read(formData, 'type', 'staff_document'), moduleKey)
  }

  if (moduleKey === 'roster') {
    await insertSafe(table, {
      shift_date: nullable(read(formData, 'shift_date')),
      start_time: nullable(read(formData, 'start_time')),
      end_time: nullable(read(formData, 'end_time')),
      role: read(formData, 'role', 'General shift'),
    })
    await audit('Roster shift created', read(formData, 'role', 'General shift'), moduleKey)
  }

  if (moduleKey === 'performance') {
    await insertSafe(table, {
      score: num(formData, 'score', 70),
      notes: read(formData, 'notes', 'Performance review'),
    })
    await audit('Performance review created', read(formData, 'notes', 'Performance review'), moduleKey)
  }

  if (moduleKey === 'training') {
    await insertSafe(table, {
      name: read(formData, 'name', 'Training / certification'),
      valid_until: nullable(read(formData, 'valid_until')),
    })
    await audit('Certification created', read(formData, 'name', 'Training / certification'), moduleKey)
  }

  if (moduleKey === 'compliance') {
    await insertSafe(table, {
      action: read(formData, 'action', 'Corrective action'),
      reason: read(formData, 'reason', 'Compliance case'),
    })
    await audit('Compliance case created', read(formData, 'action', 'Corrective action'), moduleKey)
  }

  if (moduleKey === 'staff') {
    await insertSafe(table, {
      position: read(formData, 'position', 'Unassigned position'),
      department: read(formData, 'department', 'HR'),
      contract_type: read(formData, 'contract_type', 'Not set'),
      status: read(formData, 'status', 'active'),
    })
    await audit('Staff profile created', read(formData, 'position', 'Unassigned position'), moduleKey)
  }

  if (moduleKey === 'payroll') {
    await insertSafe(table, {
      base_salary: num(formData, 'base_salary', 0),
      attendance_days: num(formData, 'attendance_days', 0),
      absence_days: num(formData, 'absence_days', 0),
      overtime_hours: num(formData, 'overtime_hours', 0),
      bonus_amount: num(formData, 'bonus_amount', 0),
      deduction_amount: num(formData, 'deduction_amount', 0),
      status: read(formData, 'status', 'draft'),
      notes: read(formData, 'notes', 'Payroll preparation item'),
    })
    await audit('Payroll preparation item created', read(formData, 'notes', 'Payroll preparation item'), moduleKey)
  }

  if (moduleKey === 'memos') {
    await insertSafe(table, {
      message: read(formData, 'message', 'HR memo'),
      type: read(formData, 'type', 'memo'),
      priority: read(formData, 'priority', 'normal'),
      target_route: path,
    })
    await audit('HR memo sent', read(formData, 'message', 'HR memo'), moduleKey)
  }

  revalidatePath(path)
  revalidatePath('/hr')
}

export async function updateHRExecutionStatus(formData: FormData) {
  const moduleKey = read(formData, 'moduleKey', 'actions')
  const id = read(formData, 'id')
  const status = read(formData, 'status', 'closed')
  const path = read(formData, 'path', `/hr/${moduleKey}`)
  const table = tableMap[moduleKey]

  if (!id || !table) return

  await updateSafe(table, id, { status })
  await audit('HR status updated', `${moduleKey} record ${id} → ${status}`, moduleKey, { id, status })
  revalidatePath(path)
  revalidatePath('/hr')
}


/**
 * Compatibility aliases for HR action pages that import direct action names.
 * These preserve the generic execution layer while allowing premium pages to use readable server actions.
 */
export async function createHRAction(formData: FormData) {
  formData.set('moduleKey', 'actions')
  if (!formData.get('path')) formData.set('path', '/hr/actions')
  return createHRExecutionRecord(formData)
}

export async function completeHRAction(formData: FormData) {
  formData.set('moduleKey', 'actions')
  formData.set('status', 'completed')
  if (!formData.get('path')) formData.set('path', '/hr/actions')
  return updateHRExecutionStatus(formData)
}

export async function escalateHRAction(formData: FormData) {
  formData.set('moduleKey', 'actions')
  formData.set('status', 'escalated')
  if (!formData.get('path')) formData.set('path', '/hr/actions')
  return updateHRExecutionStatus(formData)
}

export async function archiveHRAction(formData: FormData) {
  formData.set('moduleKey', 'actions')
  formData.set('status', 'archived')
  if (!formData.get('path')) formData.set('path', '/hr/actions')
  return updateHRExecutionStatus(formData)
}