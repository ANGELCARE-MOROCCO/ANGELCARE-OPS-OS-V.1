import { NextRequest, NextResponse } from 'next/server'
import { createResource, listResource } from '@/lib/capital-command-center/tasks-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await listResource('modules' as any)
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to load modules' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const data = await createResource('modules' as any, body || {})
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to create modules' }, { status: 500 })
  }
}
