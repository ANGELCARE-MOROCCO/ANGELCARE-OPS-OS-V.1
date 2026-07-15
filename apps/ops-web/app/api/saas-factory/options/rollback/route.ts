import { NextResponse } from 'next/server'
import { rollbackOptionsRegistry } from '../../../../../lib/saas-factory/options-runtime'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    return NextResponse.json(await rollbackOptionsRegistry(body))
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Options rollback failed' }, { status: 500 })
  }
}
