import { NextResponse } from 'next/server'
import { scanSaasFactoryCommand } from '@/lib/saas-factory/overview-runtime'
export const dynamic = 'force-dynamic'
export async function POST(request: Request) {
  try { return NextResponse.json({ ok: true, scan: await scanSaasFactoryCommand(new URL(request.url).origin) }) }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 }) }
}
