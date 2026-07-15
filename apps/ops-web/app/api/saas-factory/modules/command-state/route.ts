import { NextResponse } from 'next/server'
import { getModulesCommandState } from '@/lib/saas-factory/modules-command-runtime'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const state = await getModulesCommandState()
    return NextResponse.json(state)
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown modules command-state error' }, { status: 500 })
  }
}
