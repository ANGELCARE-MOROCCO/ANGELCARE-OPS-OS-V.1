import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

export async function GET() {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    const permission = requireB2BPermission('read', { actorId: actor.id, actorRole: actor.role || actor.role_key })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })
    const { data, error } = await db.from('b2b_executive_snapshots').select('*').order('created_at', { ascending: false }).limit(50)
    if (error) return NextResponse.json({ ok: false, error: 'Unable to load executive snapshots.' }, { status: 500 })
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    console.error('[B2B_EXEC_REPORT_GET_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to load executive reports.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    const permission = requireB2BPermission('create', { actorId: actor.id, actorRole: actor.role || actor.role_key })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })
    const body = await req.json().catch(() => ({}))
    const { data, error } = await db.from('b2b_executive_snapshots').insert({
      snapshot_type: body.snapshot_type || 'weekly',
      period_start: body.period_start || null,
      period_end: body.period_end || null,
      generated_by: actor.id,
      metrics: body.metrics || {},
      pipeline_health: body.pipeline_health || {},
      execution_health: body.execution_health || {},
      risks: body.risks || [],
      recommendations: body.recommendations || [],
      notes: body.notes || null,
    }).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: 'Unable to create executive snapshot.' }, { status: 500 })
    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('[B2B_EXEC_REPORT_POST_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to create executive report.' }, { status: 500 })
  }
}
