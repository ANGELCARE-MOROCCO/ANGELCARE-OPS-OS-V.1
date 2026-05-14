import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { getCSADeepOperationalSnapshot } from '@/lib/csa/csa-deep-sync-engine'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const role = String(user.role || '').toLowerCase()
  const permissions = Array.isArray(user.permissions) ? user.permissions : []

  const allowed =
    ['ceo', 'admin', 'direction', 'csa'].includes(role) ||
    permissions.includes('*') ||
    permissions.includes('csa.home') ||
    permissions.includes('csa.view')

  if (!allowed) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

  const snapshot = await getCSADeepOperationalSnapshot()
  return NextResponse.json(snapshot)
}
