import { NextResponse } from 'next/server'
import { runObservatoryDiagnostics } from '@/lib/saas-factory/observatory'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    return NextResponse.json(await runObservatoryDiagnostics())
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown Observatory diagnostics error' }, { status: 500 })
  }
}
