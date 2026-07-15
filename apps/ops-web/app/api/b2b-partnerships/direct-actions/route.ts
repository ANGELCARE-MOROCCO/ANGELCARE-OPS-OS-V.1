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
    permissions: actor.permissions,
  })

  if (!permission.ok) {
    return { ok: false as const, db, actor, response: NextResponse.json({ ok: false, error: permission.error }, { status: permission.status }) }
  }

  return { ok: true as const, db, actor }
}

function nullableText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function shouldCreateFollowUp(body: any) {
  return Boolean(body.create_follow_up || body.createFollowUp || body.follow_up_at || body.next_follow_up_at)
}

export async function POST(req: NextRequest) {
  try {
    const g = await guard('create')
    if (!g.ok) return g.response

    const body = await req.json()

    const actionPayload = {
      prospect_id: nullableText(body.prospect_id),
      contact_id: nullableText(body.contact_id),
      action_type: body.action_type || body.channel || 'Email',
      channel: body.channel || body.action_type || 'Email',
      subject: body.subject || null,
      message_body: body.message_body || body.message || null,
      outcome: body.outcome || 'Prepared',
      created_by: g.actor.id,
    }

    const { data: actionRow, error: actionError } = await g.db
      .from('b2b_direct_actions')
      .insert(actionPayload)
      .select('*')
      .single()

    if (actionError) {
      console.error('[B2B_DIRECT_ACTION_POST_FAILED]', actionError)
    }

    let taskRow = null
    if (shouldCreateFollowUp(body)) {
      const due = body.follow_up_at || body.next_follow_up_at || body.reminder_at || null
      const { data: task, error: taskError } = await g.db
        .from('b2b_tasks')
        .insert({
          title: body.follow_up_title || `Relance ${actionPayload.channel}`,
          task_type: 'Follow-up',
          prospect_id: actionPayload.prospect_id,
          assigned_to: body.assigned_to || g.actor.id,
          priority: body.priority || 'Medium',
          status: 'Planned',
          due_date: due,
          start_at: due,
          reminder_at: due,
          description: body.follow_up_description || `Relance générée automatiquement après action ${actionPayload.channel}.`,
          next_action: body.next_action || 'Relancer le prospect',
          created_by: g.actor.id,
        })
        .select('*')
        .single()

      if (taskError) {
        console.error('[B2B_DIRECT_ACTION_TASK_CREATE_FAILED]', taskError)
      } else {
        taskRow = task
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        action: actionRow || actionPayload,
        follow_up_task: taskRow,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[B2B_DIRECT_ACTION_POST_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to log direct action.' }, { status: 500 })
  }
}
