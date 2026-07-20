import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { readRevenueOsFoundation } from '@/lib/revenue-command-os/repository'
import { buildRevenueOsSearchIndex, searchRevenueOs } from '@/lib/revenue-command-os/search'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function canRead(user: any) {
  const role = String(user?.role || user?.role_key || '').toLowerCase()
  if (['ceo', 'direction', 'admin'].includes(role)) return true
  const permissions = Array.isArray(user?.permissions) ? user.permissions.map(String) : []
  return permissions.includes('*') || permissions.includes('revenue_os.view') || permissions.includes('revenue.view')
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Authentification requise.' } }, { status: 401 })
  if (!canRead(user)) return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'Accès Revenue OS refusé.' } }, { status: 403 })

  const query = request.nextUrl.searchParams.get('q') || ''
  const { bootstrap } = await readRevenueOsFoundation()
  const index = buildRevenueOsSearchIndex(bootstrap)
  const data = searchRevenueOs(index, query, 14)
  return NextResponse.json({ ok: true, data, query }, { headers: { 'Cache-Control': 'no-store' } })
}
