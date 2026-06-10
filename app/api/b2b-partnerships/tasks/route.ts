import { NextRequest, NextResponse } from 'next/server'
import { B2B_AUDIT_ACTIONS } from '@/lib/b2b-partnerships/constants'
import { logB2BActivity, logB2BAuditEvent } from '@/lib/b2b-partnerships/audit'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { validateTaskPriority, validateTaskStatus } from '@/lib/b2b-partnerships/validation'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export async function GET(req: NextRequest) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    const permission = requireB2BPermission('read', { actorId: actor.id, actorRole: actor.role })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const url = new URL(req.url)
    const prospectId = url.searchParams.get('prospect_id')
    const status = url.searchParams.get('status')
    let query = db
      .from('b2b_tasks')
      .select('*, prospect:b2b_prospects(id,name,sector,city,status,priority_score,next_follow_up_at)')
      .order('due_date', { ascending: true })
    if (prospectId) query = query.eq('prospect_id', prospectId)
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) return NextResponse.json({ ok: false, error: 'Unable to load tasks.' }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (error) {
    console.error('[B2B_TASKS_GET_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    const permission = requireB2BPermission('create', { actorId: actor.id, actorRole: actor.role })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })
    const body = await req.json()
    const title = text(body.title)
    if (!title) return NextResponse.json({ ok: false, error: 'Task title is required.' }, { status: 400 })
    const status = body.status ?? 'To Do'
    const priority = body.priority ?? 'Medium'
    if (!validateTaskStatus(status)) return NextResponse.json({ ok: false, error: 'Invalid task status.' }, { status: 400 })
    if (!validateTaskPriority(priority)) return NextResponse.json({ ok: false, error: 'Invalid task priority.' }, { status: 400 })

    const payload = {
      title,
      task_type: text(body.task_type),
      prospect_id: text(body.prospect_id),
      assigned_to: text(body.assigned_to) ?? actor.id,
      priority,
      due_date: text(body.due_date),
      status,
      description: text(body.description),
      created_by: actor.id,
      completed_at: status === 'Done' ? new Date().toISOString() : null,
    }

    const { data, error } = await db.from('b2b_tasks').insert(payload).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: 'Unable to create task.' }, { status: 500 })

    await logB2BActivity({ db, prospectId: payload.prospect_id, actorId: actor.id, activityType: 'task.created', title: `Task created: ${title}`, description: payload.description, metadata: { due_date: payload.due_date, priority } })
    await logB2BAuditEvent({ db, actorId: actor.id, entityType: 'b2b_task', entityId: data.id, action: B2B_AUDIT_ACTIONS.TASK_CREATED, afterData: data })
    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('[B2B_TASKS_POST_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    const body = await req.json()
    const id = text(body.id)
    if (!id) return NextResponse.json({ ok: false, error: 'Task id is required.' }, { status: 400 })

    const { data: existing } = await db.from('b2b_tasks').select('*').eq('id', id).single()
    if (!existing) return NextResponse.json({ ok: false, error: 'Task not found.' }, { status: 404 })
    const permission = requireB2BPermission('update', { actorId: actor.id, actorRole: actor.role, assignedOwnerId: existing.assigned_to, createdBy: existing.created_by })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })
    const status = body.status ?? existing.status
    const priority = body.priority ?? existing.priority
    if (!validateTaskStatus(status)) return NextResponse.json({ ok: false, error: 'Invalid task status.' }, { status: 400 })
    if (!validateTaskPriority(priority)) return NextResponse.json({ ok: false, error: 'Invalid task priority.' }, { status: 400 })

    const update = {
      title: text(body.title) ?? existing.title,
      task_type: text(body.task_type) ?? existing.task_type,
      prospect_id: text(body.prospect_id) ?? existing.prospect_id,
      assigned_to: text(body.assigned_to) ?? existing.assigned_to,
      priority,
      due_date: text(body.due_date),
      status,
      description: text(body.description),
      completed_at: status === 'Done' ? existing.completed_at ?? new Date().toISOString() : null,
    }
    const { data, error } = await db.from('b2b_tasks').update(update).eq('id', id).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: 'Unable to update task.' }, { status: 500 })

    await logB2BActivity({ db, prospectId: data.prospect_id, actorId: actor.id, activityType: status === 'Done' ? 'task.completed' : 'task.updated', title: `Task ${status}: ${data.title}`, description: data.description, metadata: { due_date: data.due_date, priority: data.priority } })
    await logB2BAuditEvent({ db, actorId: actor.id, entityType: 'b2b_task', entityId: id, action: status === 'Done' ? B2B_AUDIT_ACTIONS.TASK_COMPLETED : B2B_AUDIT_ACTIONS.TASK_UPDATED, beforeData: existing, afterData: data })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[B2B_TASKS_PATCH_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}
