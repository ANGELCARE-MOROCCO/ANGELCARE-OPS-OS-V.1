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

function render(template: string, vars: Record<string, string>) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => vars[key] || '')
}

export async function POST(req: NextRequest) {
  try {
    const g = await guard('read')
    if (!g.ok) return g.response

    const body = await req.json()
    const prospectId = body.prospect_id
    const templateId = body.template_id

    let prospect: any = null
    if (prospectId) {
      const { data } = await g.db.from('b2b_prospects').select('*').eq('id', prospectId).maybeSingle()
      prospect = data
    }

    let template: any = null
    if (templateId) {
      const { data } = await g.db.from('b2b_templates').select('*').eq('id', templateId).maybeSingle()
      template = data
    }

    const vars = {
      prospect_name: prospect?.name || body.prospect_name || '',
      decision_maker_name: prospect?.decision_maker_name || prospect?.main_contact_name || body.decision_maker_name || '',
      city: prospect?.city || '',
      sector: prospect?.sector || '',
      assigned_owner: g.actor.full_name || g.actor.email || '',
    }

    const subject = render(template?.subject || body.subject || '', vars)
    const message = render(template?.body || body.body || body.message_body || '', vars)

    return NextResponse.json({ ok: true, data: { subject, message, vars, prospect, template } })
  } catch (error) {
    console.error('[B2B_COMMUNICATION_PREPARE_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to prepare communication.' }, { status: 500 })
  }
}
