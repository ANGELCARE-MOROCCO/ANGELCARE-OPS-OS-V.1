import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { getCsaCommandSnapshot } from '@/lib/csa/csa-sync-adapter'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const role = String(user.role || '').toLowerCase()
  const permissions = Array.isArray(user.permissions) ? user.permissions : []
  const allowed = role === 'ceo' || role === 'admin' || permissions.includes('*') || permissions.includes('csa.view') || permissions.includes('csa.home')

  if (!allowed) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

  const snapshot = await getCsaCommandSnapshot()
  return NextResponse.json({ ok: true, snapshot })
}
