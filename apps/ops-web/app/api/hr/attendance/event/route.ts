import { NextResponse } from 'next/server'
import { recordAttendanceEvent } from '@/lib/hr-attendance/repository'
export async function POST(req: Request) {
  const body = await req.json()
  const data = await recordAttendanceEvent({
    userId: body.userId || body.user_id || null,
    staffId: body.staffId || body.staff_id || null,
    eventType: body.eventType || body.event_type,
    source: body.source || 'overhead_panel',
    note: body.note || null,
    metadata: body.metadata || {},
  })
  return NextResponse.json({ ok: true, data })
}
