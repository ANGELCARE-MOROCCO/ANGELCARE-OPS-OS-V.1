import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TABLE = 'b2b_workspace_settings'
const WORKSPACE_KEY = 'global'
const REQUIRED_TABLES = ['b2b_prospects', 'b2b_tasks', 'b2b_meetings', 'b2b_proposals', 'b2b_workspace_partner_programs', 'b2b_workspace_reports', 'b2b_workspace_automation_rules', 'b2b_workspace_settings']

type AnyRecord = Record<string, any>

function json(data: AnyRecord, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

function object(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {}
}

async function guard(action: 'read' | 'update' = 'read') {
  const db = await getServerB2BDatabaseClient()
  const actor = await getCurrentB2BAppUser()

  if (!actor?.id) {
    return { ok: false as const, db, actor, response: json({ ok: false, data: null, error: 'Authentication required.' }, 401) }
  }

  const permission = requireB2BPermission(action, {
    actorId: actor.id,
    actorRole: actor.role || actor.role_key,
    permissions: actor.permissions,
  })

  if (!permission.ok) {
    return { ok: false as const, db, actor, response: json({ ok: false, data: null, error: permission.error }, permission.status) }
  }

  return { ok: true as const, db, actor }
}

async function buildHealth(db: Awaited<ReturnType<typeof getServerB2BDatabaseClient>>, actorRole?: string | null) {
  const checks = await Promise.allSettled(REQUIRED_TABLES.map((table) => db.from(table).select('id', { count: 'exact', head: true })))
  const ready = checks.every((result) => result.status === 'fulfilled' && !(result.value as any).error)

  return {
    tables_ready: ready ? 'Ready' : 'Check',
    actor_role: actorRole || 'user',
    checked_at: new Date().toISOString(),
  }
}

export async function GET() {
  try {
    const g = await guard('read')
    if (!g.ok) return g.response

    const [health, { data, error }] = await Promise.all([
      buildHealth(g.db, g.actor?.role || g.actor?.role_key),
      g.db.from(TABLE).select('*').eq('workspace_key', WORKSPACE_KEY).maybeSingle(),
    ])

    if (error) {
      return json({ ok: false, data: { ...health, settings: {} }, error: error.message }, 200)
    }

    return json({ ok: true, data: { ...health, settings: object(data?.settings) } })
  } catch (error) {
    console.error('[B2B_SETTINGS_GET_FAILED]', error)
    return json({ ok: false, data: { tables_ready: 'Check', actor_role: 'user', checked_at: new Date().toISOString(), settings: {} }, error: 'Unexpected server error.' }, 500)
  }
}

async function saveSettings(req: NextRequest) {
  const g = await guard('update')
  if (!g.ok) return g.response

  const body = await req.json().catch(() => ({}))
  const settings = object(body?.settings ?? body)
  const payload: Record<string, unknown> = {
    workspace_key: WORKSPACE_KEY,
    settings,
    updated_by: g.actor?.id ?? null,
    updated_at: new Date().toISOString(),
  }

  const { data: existing } = await g.db.from(TABLE).select('id, created_by').eq('workspace_key', WORKSPACE_KEY).maybeSingle()
  if (!existing?.id) {
    payload['created_by'] = g.actor?.id ?? null
  }

  const { data, error } = await g.db.from(TABLE).upsert(payload, { onConflict: 'workspace_key' }).select('*').single()
  if (error) {
    console.error('[B2B_SETTINGS_SAVE_FAILED]', error)
    return json({ ok: false, data: { tables_ready: 'Check', actor_role: g.actor?.role || g.actor?.role_key || 'user', checked_at: new Date().toISOString(), settings: {} }, error: 'Unable to save settings.' }, 500)
  }

  const health = await buildHealth(g.db, g.actor?.role || g.actor?.role_key)
  return json({ ok: true, data: { ...health, settings: object(data?.settings) } })
}

export async function POST(req: NextRequest) {
  return saveSettings(req)
}

export async function PATCH(req: NextRequest) {
  return saveSettings(req)
}
