import { NextResponse } from 'next/server'
import { runSaasFactoryDiagnostics } from '@/lib/saas-factory/overview-runtime'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try { return NextResponse.json({ ok: true, diagnostics: await runSaasFactoryDiagnostics(new URL(request.url).origin) }) }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 }) }
}
export async function POST(request: Request) { return GET(request) }
