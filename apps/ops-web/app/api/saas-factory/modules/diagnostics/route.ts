import { NextResponse } from 'next/server'
import { runModulesDiagnostics } from '@/lib/saas-factory/modules-command-runtime'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const result = await runModulesDiagnostics(Array.isArray(body.moduleKeys) ? body.moduleKeys : [])
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown modules diagnostics error' }, { status: 500 })
  }
}
