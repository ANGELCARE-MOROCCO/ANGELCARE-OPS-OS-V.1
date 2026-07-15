import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { createClient } from '@/lib/supabase/server'
import { getLiveAttendanceState } from '@/lib/hr-attendance-sync/repository'

export const dynamic = 'force-dynamic'

function noStoreJson(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

async function resolveAuthenticatedUserId() {
  const appUser = (await getCurrentUser().catch(() => null)) as { id?: string } | null
  if (appUser?.id) return appUser.id

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    return data?.user?.id || null
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const userId = await resolveAuthenticatedUserId()

    if (!userId) {
      return noStoreJson(
        { ok: false, error: 'Unauthorized attendance session. Please refresh and sign in again.' },
        { status: 401 },
      )
    }

    const state = await getLiveAttendanceState(userId)
    return noStoreJson({ ...state, source: 'hr_attendance_records', timestamp: new Date().toISOString() })
  } catch (error) {
    return noStoreJson(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Attendance status unavailable',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
