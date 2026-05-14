import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { getMarketingDeepOperationalSnapshot } from '@/lib/market-os/marketing-deep-sync-engine'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const role = String(user.role || '').toLowerCase()
  const permissions = Array.isArray(user.permissions) ? user.permissions : []
  const allowed = ['ceo', 'admin', 'direction', 'marketing'].includes(role) || permissions.includes('*') || permissions.includes('marketing.home') || permissions.includes('market_os.view')

  if (!allowed) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(await getMarketingDeepOperationalSnapshot())
}
