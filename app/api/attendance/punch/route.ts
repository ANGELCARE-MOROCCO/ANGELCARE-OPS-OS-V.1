import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { syncPunchToHrAttendance } from '@/lib/hr-attendance-sync/repository'
import type { AttendanceAction } from '@/lib/hr-attendance-sync/types'

const ALLOWED_ACTIONS: AttendanceAction[] = ['shift_in', 'shift_out', 'lunch_start', 'lunch_end']

export async function POST(request: Request) {
  const user = await getCurrentUser() as { id: string } | null

  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const action = String(body.action || '') as AttendanceAction

  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Invalid attendance action' }, { status: 400 })
  }

  try {
    const result = await syncPunchToHrAttendance({
      userId: user.id,
      action,
      note: body.note || null,
      source: body.source || 'overhead_panel',
      deviceContext: {
        userAgent: request.headers.get('user-agent'),
        origin: request.headers.get('origin'),
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Attendance sync failed' }, { status: 500 })
  }
}
