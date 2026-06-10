import { NextResponse } from 'next/server'
import { getB2BDashboardMetrics } from '@/lib/b2b-partnerships/metrics'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'

export async function GET() {
  try {
    console.log('[B2B_METRICS_STAGE]', 'before-db')
    const db = await getServerB2BDatabaseClient()
    console.log('[B2B_METRICS_STAGE]', 'after-db')

    console.log('[B2B_METRICS_STAGE]', 'before-actor')
    const actor = await getCurrentB2BAppUser()
    console.log('[B2B_METRICS_STAGE]', 'after-actor', actor ? { id: actor.id, role: actor.role } : null)

    if (!actor?.id) {
      return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    }

    const permission = requireB2BPermission('read', {
      actorId: actor.id,
      actorRole: actor.role,
    })

    if (!permission.ok) {
      return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })
    }

    console.log('[B2B_METRICS_STAGE]', 'before-metrics')
    const data = await getB2BDashboardMetrics(db)
    console.log('[B2B_METRICS_STAGE]', 'after-metrics')
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[B2B_METRICS_GET_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to load B2B dashboard metrics.' }, { status: 500 })
  }
}
