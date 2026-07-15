import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'

export async function POST(request: Request) {
  await requireAccess('academy.view')
  const supabase = await createClient()
  const body = await request.json().catch(() => ({}))

  const { error } = await supabase.from('academy_audit_logs').insert({
    action: body.action || 'academy.event',
    entity_type: body.entity_type || 'academy',
    entity_id: body.entity_id || null,
    details: body.details || {},
  })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
