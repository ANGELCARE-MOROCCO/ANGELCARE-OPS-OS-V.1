import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

const ALLOWED_ACTIONS = ['shift_in', 'shift_out', 'lunch_start', 'lunch_end']

export async function POST(request: Request) {
const user = await getCurrentUser() as { id: string } | null

  if (!user || !user.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

  const body = await request.json()
  const action = String(body.action || '')

  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Invalid attendance action' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase.from('app_attendance_logs').insert([
    {
      user_id: user.id,
      action,
      note: body.note || null,
    },
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}