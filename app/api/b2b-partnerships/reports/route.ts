import { NextRequest, NextResponse } from 'next/server'
import { B2B_AUDIT_ACTIONS } from '@/lib/b2b-partnerships/constants'
import { logB2BAuditEvent } from '@/lib/b2b-partnerships/audit'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'

function optionalString(value: unknown) { return typeof value === 'string' && value.trim() ? value.trim() : null }

export async function GET() {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })

    const permission = requireB2BPermission('read', { actorId: actor.id, actorRole: actor.role })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const { data, error } = await db.from('b2b_reports').select('*').order('created_at', { ascending: false })
    if (error) return NextResponse.json({ ok: false, error: 'Unable to load reports.' }, { status: 500 })

    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch {
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
    const periodStart = optionalString(body.period_start)
    const periodEnd = optionalString(body.period_end)
    const summary = optionalString(body.summary)

    if (!periodStart || !periodEnd) return NextResponse.json({ ok: false, error: 'Report period is required.' }, { status: 400 })
    if (!summary) return NextResponse.json({ ok: false, error: 'Report summary is required.' }, { status: 400 })

    const metricsRes = await fetch(new URL('/api/b2b-partnerships/reports/weekly', req.url), { headers: req.headers })
    const metricsJson = await metricsRes.json()

    const { data, error } = await db
      .from('b2b_reports')
      .insert({
        report_type: 'weekly',
        period_start: periodStart,
        period_end: periodEnd,
        owner_id: actor.id,
        metrics: metricsJson?.data ?? {},
        summary,
        best_opportunities: optionalString(body.best_opportunities),
        objections: optionalString(body.objections),
        support_needed: optionalString(body.support_needed),
        next_week_plan: optionalString(body.next_week_plan),
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ ok: false, error: 'Unable to create weekly report.' }, { status: 500 })

    await logB2BAuditEvent({ db, actorId: actor.id, entityType: 'b2b_report', entityId: data.id, action: B2B_AUDIT_ACTIONS.REPORT_GENERATED, afterData: data })

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}
