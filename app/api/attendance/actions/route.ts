import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  return NextResponse.json({ ok: true, module: 'hr-attendance', actions: ['correction','absence','approval','coverage','report'] })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('hr_approval_requests').insert({
      title: body.title || 'Attendance action',
      request_type: 'attendance',
      status: 'pending',
      priority: body.priority || 'normal',
      notes: body.notes || 'Queued from HR attendance API',
    })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, queued: true })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}
