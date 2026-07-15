import { NextResponse } from 'next/server'
import { runModulesSync } from '@/lib/saas-factory/modules-command-runtime'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const result = await runModulesSync(body.scope === 'selected' ? 'selected' : 'all', Array.isArray(body.moduleKeys) ? body.moduleKeys : [])
    return NextResponse.json(result, { status: result.ok ? 200 : 207 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown modules sync error' }, { status: 500 })
  }
}
