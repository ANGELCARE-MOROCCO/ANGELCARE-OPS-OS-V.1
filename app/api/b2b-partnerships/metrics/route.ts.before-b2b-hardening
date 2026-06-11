import { NextResponse } from 'next/server'
import { getB2BCommandMetrics } from '@/lib/b2b-partnerships/metrics'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'

export async function GET() {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    const permission = requireB2BPermission('read', { actorId: actor.id, actorRole: actor.role || actor.role_key, permissions: actor.permissions })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })
    const data = await getB2BCommandMetrics(db)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[B2B_COMMAND_METRICS_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to load B2B command metrics.' }, { status: 500 })
  }
}
