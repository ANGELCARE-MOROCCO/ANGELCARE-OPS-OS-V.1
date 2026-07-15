import { NextRequest, NextResponse } from 'next/server'
import { bulkAttendanceControl } from '@/lib/hr-production/action-completion'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const result = await bulkAttendanceControl(body)
    return NextResponse.json({ ok: true, result })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Bulk attendance control failed' }, { status: 500 })
  }
}
