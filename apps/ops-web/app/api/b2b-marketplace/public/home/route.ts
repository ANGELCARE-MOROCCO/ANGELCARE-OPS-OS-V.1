import { NextResponse } from 'next/server'
import { getMarketplaceHome } from '@/lib/b2b-marketplace/repository'

export const dynamic = 'force-dynamic'
export async function GET() {
  return NextResponse.json({ ok: true, data: await getMarketplaceHome() })
}
