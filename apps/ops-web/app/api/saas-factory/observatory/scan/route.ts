import { NextResponse } from 'next/server'
import { runObservatoryScan } from '@/lib/saas-factory/observatory'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    return NextResponse.json(await runObservatoryScan())
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown Observatory scan error' }, { status: 500 })
  }
}
