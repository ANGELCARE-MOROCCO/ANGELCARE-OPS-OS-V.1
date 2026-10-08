import { NextResponse } from 'next/server'
import { executePortalAction } from '@/lib/angelcare360/server/portal-actions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await executePortalAction(body || {})
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Action impossible.' }, { status: 400 })
  }
}
