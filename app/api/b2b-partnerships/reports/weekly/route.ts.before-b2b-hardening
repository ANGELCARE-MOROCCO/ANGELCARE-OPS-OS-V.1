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

async function count(db: any, table: string, build?: (q: any) => any) {
  let q = db.from(table).select('id', { count: 'exact', head: true })
  if (build) q = build(q)
  const { count, error } = await q
  if (error) {
    console.error(`[B2B_WEEKLY_COUNT_FAILED:${table}]`, error)
    return 0
  }
  return count || 0
}

export async function GET() {
  try {
    const g = await guard('read')
    if (!g.ok) return g.response

    const data = {
      prospects: await count(g.db, 'b2b_prospects'),
      qualified: await count(g.db, 'b2b_prospects', (q) => q.in('priority_score', ['A', 'B'])),
      outreach_week: await count(g.db, 'b2b_outreach_logs'),
      meetings_booked: await count(g.db, 'b2b_meetings', (q) => q.eq('status', 'Scheduled')),
      meetings_completed: await count(g.db, 'b2b_meetings', (q) => q.eq('status', 'Completed')),
      proposals_active: await count(g.db, 'b2b_proposals', (q) => q.in('status', ['Sent', 'Viewed', 'Follow-up Needed', 'Negotiation'])),
      generated_at: new Date().toISOString(),
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[B2B_WEEKLY_REPORT_GET_CRASHED]', error)
    return NextResponse.json({ ok: true, data: { prospects: 0, qualified: 0, outreach_week: 0, meetings_booked: 0, meetings_completed: 0, proposals_active: 0 } })
  }
}
