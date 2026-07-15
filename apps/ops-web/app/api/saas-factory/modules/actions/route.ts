import { NextResponse } from 'next/server'
import { executeModuleAction } from '@/lib/saas-factory/modules-command-runtime'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const result = await executeModuleAction(String(body.action || 'unsupported'), body.payload || {})
    return NextResponse.json(result, { status: result.ok ? 200 : result.blocked ? 409 : 400 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown modules action error' }, { status: 500 })
  }
}
