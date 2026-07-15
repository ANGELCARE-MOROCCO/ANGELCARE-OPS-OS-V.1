import { NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

const tables = ['b2b_prospects','b2b_tasks','b2b_meetings','b2b_proposals','b2b_partner_programs','b2b_templates','b2b_campaigns','b2b_import_batches','b2b_automation_rules','b2b_scoring_rules']

export async function GET() {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    const permission = requireB2BPermission('read', { actorId: actor.id, actorRole: actor.role || actor.role_key })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })
    const results = await Promise.all(tables.map(async (table) => {
      try {
        const r = await db.from(table).select('id', { count: 'exact', head: true })
        return { table, ok: !r.error, count: r.count || 0, error: r.error ? String(r.error.message || r.error) : null }
      } catch (error) {
        return { table, ok: false, count: 0, error: error instanceof Error ? error.message : String(error) }
      }
    }))
    return NextResponse.json({ ok: true, data: { checked_at: new Date().toISOString(), results } })
  } catch (error) {
    console.error('[B2B_QA_HEALTH_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to run B2B health checks.' }, { status: 500 })
  }
}
