import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { getLiveAttendanceState } from '@/lib/hr-attendance-sync/repository'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser() as { id: string } | null

  if (!user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const state = await getLiveAttendanceState(user.id)
    return NextResponse.json(state)
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Attendance status failed' }, { status: 500 })
  }
}
