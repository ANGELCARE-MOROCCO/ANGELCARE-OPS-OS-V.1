import { NextResponse } from 'next/server'
import { getFactoryOverview } from '@/lib/saas-factory/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const overview = await getFactoryOverview()
    return NextResponse.json({
      ok: true,
      section: 'rules',
      source: overview.source,
      snapshot: overview.counts,
      generated_at: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown SaaS Factory rules error' }, { status: 500 })
  }
}
