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

const fallbackConfig = [
  { id: 'task-status-todo', config_group: 'task_status', config_key: 'to_do', group_key: 'task_status', item_key: 'to_do', label: 'À faire', value: 'To Do', description: 'Tâche à lancer.', sort_order: 10, is_active: true },
  { id: 'task-status-planned', config_group: 'task_status', config_key: 'planned', group_key: 'task_status', item_key: 'planned', label: 'Planifiée', value: 'Planned', description: 'Tâche planifiée avec date de début.', sort_order: 20, is_active: true },
  { id: 'task-status-progress', config_group: 'task_status', config_key: 'in_progress', group_key: 'task_status', item_key: 'in_progress', label: 'En cours', value: 'In Progress', description: 'Action commerciale en cours.', sort_order: 30, is_active: true },
  { id: 'task-status-blocked', config_group: 'task_status', config_key: 'blocked', group_key: 'task_status', item_key: 'blocked', label: 'Bloquée', value: 'Blocked', description: 'Besoin support manager.', sort_order: 40, is_active: true },
  { id: 'task-status-done', config_group: 'task_status', config_key: 'done', group_key: 'task_status', item_key: 'done', label: 'Terminée', value: 'Done', description: 'Action clôturée.', sort_order: 50, is_active: true },

  { id: 'channel-email', config_group: 'outreach_channel', config_key: 'email', group_key: 'outreach_channel', item_key: 'email', label: 'Email', value: 'Email', description: 'Email commercial structuré.', sort_order: 10, is_active: true },
  { id: 'channel-whatsapp', config_group: 'outreach_channel', config_key: 'whatsapp', group_key: 'outreach_channel', item_key: 'whatsapp', label: 'WhatsApp', value: 'WhatsApp', description: 'Message direct court et impactant.', sort_order: 20, is_active: true },
  { id: 'channel-phone', config_group: 'outreach_channel', config_key: 'phone', group_key: 'outreach_channel', item_key: 'phone', label: 'Téléphone', value: 'Phone', description: 'Appel de découverte ou relance.', sort_order: 30, is_active: true },
  { id: 'channel-linkedin', config_group: 'outreach_channel', config_key: 'linkedin', group_key: 'outreach_channel', item_key: 'linkedin', label: 'LinkedIn', value: 'LinkedIn', description: 'Approche décideur professionnelle.', sort_order: 40, is_active: true },

  { id: 'template-first-contact', config_group: 'template_category', config_key: 'first_contact', group_key: 'template_category', item_key: 'first_contact', label: 'Premier contact', value: 'Premier contact', description: 'Ouverture froide premium.', sort_order: 10, is_active: true },
  { id: 'template-follow-up', config_group: 'template_category', config_key: 'follow_up', group_key: 'template_category', item_key: 'follow_up', label: 'Relance', value: 'Relance', description: 'Relance après absence de réponse.', sort_order: 20, is_active: true },
  { id: 'template-proposal', config_group: 'template_category', config_key: 'proposal', group_key: 'template_category', item_key: 'proposal', label: 'Proposition', value: 'Proposition', description: 'Suivi proposition commerciale.', sort_order: 30, is_active: true },

  { id: 'intern-target-prospects', config_group: 'intern_target', config_key: 'weekly_qualified_prospects', group_key: 'intern_target', item_key: 'weekly_qualified_prospects', label: 'Prospects qualifiés semaine', value: 150, description: 'Objectif hebdomadaire business developer intern.', sort_order: 10, is_active: true },
  { id: 'automation-follow-up', config_group: 'automation_default', config_key: 'default_follow_up_days', group_key: 'automation_default', item_key: 'default_follow_up_days', label: 'Relance par défaut', value: 3, description: 'Délai de relance standard en jours.', sort_order: 10, is_active: true },
]

function normalize(row: any) {
  const config_group = row.config_group || row.group_key || row.group || 'general'
  const config_key = row.config_key || row.item_key || row.key || row.code || String(row.id || crypto.randomUUID())
  return {
    ...row,
    config_group,
    config_key,
    group_key: row.group_key || config_group,
    item_key: row.item_key || config_key,
    label: row.label || row.value || config_key,
    value: row.value ?? {},
    is_active: row.is_active ?? true,
  }
}

export async function GET() {
  try {
    const g = await guard('read')
    if (!g.ok) return g.response

    const { data, error } = await g.db.from('b2b_config_items').select('*')

    if (error) {
      console.error('[B2B_CONFIG_GET_FAILED]', error)
      return NextResponse.json({ ok: true, data: fallbackConfig })
    }

    const rows = (data?.length ? data : fallbackConfig).map(normalize)
    rows.sort((a, b) => String(a.config_group).localeCompare(String(b.config_group)) || Number(a.sort_order || 0) - Number(b.sort_order || 0))
    return NextResponse.json({ ok: true, data: rows })
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
    const config_group = body.config_group || body.group_key || body.group || 'general'
    const config_key = body.config_key || body.item_key || body.key || crypto.randomUUID()

    const payload = {
      config_group,
      config_key,
      group_key: config_group,
      item_key: config_key,
      label: body.label || body.value || 'Configuration',
      value: body.value ?? {},
      description: body.description || null,
      sort_order: Number(body.sort_order || 100),
      is_active: body.is_active ?? true,
    }

    const { data, error } = await g.db.from('b2b_config_items').insert(payload).select('*').single()

    if (error) {
      console.error('[B2B_CONFIG_POST_FAILED]', error)
      return NextResponse.json({ ok: false, error: 'Unable to create configuration.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: normalize(data) }, { status: 201 })
  } catch (error) {
    console.error('[B2B_CONFIG_POST_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to create configuration.' }, { status: 500 })
  }
}
