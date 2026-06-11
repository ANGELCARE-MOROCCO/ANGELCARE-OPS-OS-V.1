import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

async function guard(action: 'read' | 'create' | 'update' = 'read') {
  const db = await getServerB2BDatabaseClient()
  const actor = await getCurrentB2BAppUser()

  if (!actor?.id) {
    return { ok: false as const, db, actor, response: NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 }) }
  }

  const permission = requireB2BPermission(action, {
    actorId: actor.id,
    actorRole: actor.role || actor.role_key,
  })

  if (!permission.ok) {
    return { ok: false as const, db, actor, response: NextResponse.json({ ok: false, error: permission.error }, { status: permission.status }) }
  }

  return { ok: true as const, db, actor }
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function nullableText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function safeLimit(req: NextRequest, fallback = 120) {
  const url = new URL(req.url)
  return Math.min(Number(url.searchParams.get('limit') || fallback), 500)
}

export async function GET(req: NextRequest) {
  try {
    const g = await guard('read')
    if (!g.ok) return g.response

    const url = new URL(req.url)
    const limit = safeLimit(req, 160)
    const status = url.searchParams.get('status')
    const prospectId = url.searchParams.get('prospect_id')

    let query = g.db.from('b2b_tasks').select('*').order('created_at', { ascending: false }).limit(limit)

    if (status && status !== 'all') query = query.eq('status', status)
    if (prospectId && prospectId !== 'all') query = query.eq('prospect_id', prospectId)

    const { data, error } = await query

    if (error) {
      console.error('[B2B_TASKS_GET_FAILED]', error)
      return NextResponse.json({ ok: true, data: [] })
    }

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    console.error('[B2B_TASKS_GET_CRASHED]', error)
    return NextResponse.json({ ok: true, data: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const g = await guard('create')
    if (!g.ok) return g.response

    const body = await req.json()
    const title = text(body.title)

    if (!title) {
      return NextResponse.json({ ok: false, error: 'Task title is required.' }, { status: 400 })
    }

    const payload = {
      title,
      task_type: nullableText(body.task_type) || 'Update CRM',
      prospect_id: nullableText(body.prospect_id),
      assigned_to: nullableText(body.assigned_to) || g.actor.id,
      priority: nullableText(body.priority) || 'Medium',
      status: nullableText(body.status) || 'To Do',
      due_date: nullableText(body.due_date),
      description: nullableText(body.description),
      created_by: g.actor.id,
      completed_at: body.status === 'Done' ? new Date().toISOString() : null,
    }

    const { data, error } = await g.db.from('b2b_tasks').insert(payload).select('*').single()

    if (error) {
      console.error('[B2B_TASKS_POST_FAILED]', error)
      return NextResponse.json({ ok: false, error: 'Unable to create B2B task.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('[B2B_TASKS_POST_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to create B2B task.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const g = await guard('update')
    if (!g.ok) return g.response

    const body = await req.json()
    const id = text(body.id)

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Task id is required.' }, { status: 400 })
    }

    const updatePayload: Record<string, unknown> = {}
    for (const key of ['title', 'task_type', 'prospect_id', 'assigned_to', 'priority', 'status', 'due_date', 'description', 'start_at', 'end_at', 'reminder_at', 'next_action', 'completion_notes']) {
      if (body[key] !== undefined) updatePayload[key] = body[key] || null
    }

    if (body.status === 'Done') updatePayload.completed_at = new Date().toISOString()

    const { data, error } = await g.db.from('b2b_tasks').update(updatePayload).eq('id', id).select('*').single()

    if (error) {
      console.error('[B2B_TASKS_PATCH_FAILED]', error)
      return NextResponse.json({ ok: false, error: 'Unable to update B2B task.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[B2B_TASKS_PATCH_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to update B2B task.' }, { status: 500 })
  }
}
