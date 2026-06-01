import { NextResponse } from 'next/server'
import { runHRDiagnostics } from '@/lib/hr-production/operations'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await runHRDiagnostics('diagnostics'))
  } catch (error: any) {
    return NextResponse.json({ ok: false, sourceConfidence: 'fallback', error: error?.message || 'Unable to run HR diagnostics.' }, { status: 500 })
  }
}

export async function POST() {
  try {
    return NextResponse.json(await runHRDiagnostics('diagnostics_manual'))
  } catch (error: any) {
    return NextResponse.json({ ok: false, sourceConfidence: 'fallback', error: error?.message || 'Unable to run HR diagnostics.' }, { status: 500 })
  }
}
