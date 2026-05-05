import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function POST(req: NextRequest) {
  const form = await req.formData(); const id = String(form.get('approval_id') || ''); const decision = String(form.get('decision') || 'approved')
  const supabase = await createClient()
  const { data: approval, error } = await supabase.from('email_approvals').select('*').eq('id', id).single()
  if (error || !approval) return NextResponse.json({ ok:false, error:error?.message || 'Approval not found' }, { status:404 })
  const status = decision === 'approved' ? 'approved' : 'rejected'
  await supabase.from('email_approvals').update({ status, decided_at:new Date().toISOString() }).eq('id', id)
  if (status === 'approved') {
    await supabase.from('email_messages').update({ status:'queued', updated_at:new Date().toISOString() }).eq('id', approval.message_id)
    await supabase.from('email_outbox_queue').insert({ message_id:approval.message_id, status:'queued', scheduled_at:new Date().toISOString(), created_at:new Date().toISOString() })
  } else {
    await supabase.from('email_messages').update({ status:'draft', updated_at:new Date().toISOString() }).eq('id', approval.message_id)
  }
  await supabase.from('email_audit_logs').insert({ message_id:approval.message_id, action:`approval_${status}`, payload:{ approval_id:id, decision } })
  return NextResponse.redirect(new URL('/email-os/approvals', req.url))
}
