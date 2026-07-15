import { NextResponse } from 'next/server'
import { publishOptionsRegistry } from '../../../../../lib/saas-factory/options-runtime'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const result = await publishOptionsRegistry(body)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Options publish failed' }, { status: 500 })
  }
}
