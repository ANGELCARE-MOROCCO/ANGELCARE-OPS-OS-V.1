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

const fallbackConfig = [
  { id: 'task-status-todo', group_key: 'task status', item_key: 'to_do', label: 'À faire', value: 'To Do', is_active: true },
  { id: 'task-status-planned', group_key: 'task status', item_key: 'planned', label: 'Planifiée', value: 'Planned', is_active: true },
  { id: 'task-status-progress', group_key: 'task status', item_key: 'in_progress', label: 'En cours', value: 'In Progress', is_active: true },
  { id: 'task-status-done', group_key: 'task status', item_key: 'done', label: 'Terminée', value: 'Done', is_active: true },
  { id: 'channel-email', group_key: 'outreach channel', item_key: 'email', label: 'Email', value: 'Email', is_active: true },
  { id: 'channel-whatsapp', group_key: 'outreach channel', item_key: 'whatsapp', label: 'WhatsApp', value: 'WhatsApp', is_active: true },
  { id: 'channel-phone', group_key: 'outreach channel', item_key: 'phone', label: 'Téléphone', value: 'Phone', is_active: true },
  { id: 'template-email', group_key: 'template category', item_key: 'email', label: 'Email commercial', value: 'email', is_active: true },
  { id: 'template-whatsapp', group_key: 'template category', item_key: 'whatsapp', label: 'WhatsApp', value: 'whatsapp', is_active: true },
]

export async function GET() {
  try {
    const g = await guard('read')
    if (!g.ok) return g.response

    const { data, error } = await g.db.from('b2b_config_items').select('*').order('group_key', { ascending: true }).order('label', { ascending: true })

    if (error) {
      console.error('[B2B_CONFIG_GET_FAILED]', error)
      return NextResponse.json({ ok: true, data: fallbackConfig })
    }

    return NextResponse.json({ ok: true, data: data?.length ? data : fallbackConfig })
  } catch (error) {
    console.error('[B2B_CONFIG_GET_CRASHED]', error)
    return NextResponse.json({ ok: true, data: fallbackConfig })
  }
}

export async function POST(req: NextRequest) {
  try {
    const g = await guard('create')
    if (!g.ok) return g.response

    const body = await req.json()
    const payload = {
      group_key: body.group_key || body.group || 'general',
      item_key: body.item_key || body.key || crypto.randomUUID(),
      label: body.label || body.value || 'Configuration',
      value: body.value || body.label || '',
      description: body.description || null,
      is_active: body.is_active ?? true,
    }

    const { data, error } = await g.db.from('b2b_config_items').insert(payload).select('*').single()

    if (error) {
      console.error('[B2B_CONFIG_POST_FAILED]', error)
      return NextResponse.json({ ok: false, error: 'Unable to create configuration.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('[B2B_CONFIG_POST_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to create configuration.' }, { status: 500 })
  }
}
