import { NextResponse } from 'next/server'
import { refreshSaasFactoryCommandOverview } from '@/lib/saas-factory/overview-runtime'
export const dynamic = 'force-dynamic'
export async function POST() {
  try { return NextResponse.json({ ok: true, overview: await refreshSaasFactoryCommandOverview() }) }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 }) }
}
