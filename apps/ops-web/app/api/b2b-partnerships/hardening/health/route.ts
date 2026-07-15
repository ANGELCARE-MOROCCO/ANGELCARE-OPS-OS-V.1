import { NextResponse } from 'next/server'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'

const REQUIRED_TABLES = [
  'b2b_prospects',
  'b2b_contacts',
  'b2b_activities',
  'b2b_outreach_logs',
  'b2b_calls',
  'b2b_meetings',
  'b2b_proposals',
  'b2b_partner_programs',
  'b2b_tasks',
  'b2b_reports',
  'b2b_audit_events',
]

export async function GET() {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })

    const permission = requireB2BPermission('read', { actorId: actor.id, actorRole: actor.role })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const checks = await Promise.all(REQUIRED_TABLES.map(async (table) => {
      const result = await db.from(table).select('id', { count: 'exact', head: true })
      return { table, ok: !result.error, count: result.count ?? 0 }
    }))

    return NextResponse.json({
      ok: true,
      data: {
        status: checks.every((check) => check.ok) ? 'ready' : 'attention_required',
        white_background_rule: 'locked',
        live_sync_ready: true,
        required_tables: checks,
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Unable to run B2B health checks.' }, { status: 500 })
  }
}
