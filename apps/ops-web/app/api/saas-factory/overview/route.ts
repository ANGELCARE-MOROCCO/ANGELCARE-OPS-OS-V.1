import { NextResponse } from 'next/server'
import { getSaasFactoryCommandOverview } from '@/lib/saas-factory/overview-runtime'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const overview = await getSaasFactoryCommandOverview()
    return NextResponse.json({ ok: true, overview, source: overview.source, warnings: overview.warnings || [] })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown SaaS Factory overview error' }, { status: 500 })
  }
}
