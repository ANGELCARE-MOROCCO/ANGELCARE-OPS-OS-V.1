import { NextResponse } from 'next/server'
import { syncAttendanceForUserDay } from '@/lib/hr-attendance/repository'
export async function POST(req: Request) {
  const body = await req.json()
  await syncAttendanceForUserDay(body.userId || body.user_id || null, body.staffId || body.staff_id || null, body.date || new Date().toISOString())
  return NextResponse.json({ ok: true, syncedAt: new Date().toISOString() })
}
