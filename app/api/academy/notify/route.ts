import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'

export async function POST(request: Request) {
  await requireAccess('academy.view')
  const supabase = await createClient()
  const body = await request.json().catch(() => ({}))

  const { error } = await supabase.from('academy_notification_queue').insert({
    channel: body.channel || 'internal',
    target: body.target || null,
    title: body.title || 'Academy notification',
    message: body.message || '',
    status: 'queued',
    payload: body.payload || {},
  })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, status: 'queued' })
}
