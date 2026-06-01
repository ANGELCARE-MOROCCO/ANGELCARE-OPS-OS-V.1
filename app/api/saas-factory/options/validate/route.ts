import { NextResponse } from 'next/server'
import { runOptionsValidation } from '../../../../../lib/saas-factory/options-runtime'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await runOptionsValidation())
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Options validation failed' }, { status: 500 })
  }
}

export async function POST() {
  return GET()
}
