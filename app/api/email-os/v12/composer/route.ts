import { NextResponse } from 'next/server';
import { createEmailOSV12Supabase } from '@/lib/email-os/v12/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createEmailOSV12Supabase();
    const { error } = await supabase.from('email_engine_logs_v12').insert({
      mailbox_id: body.mailbox_id || null,
      event_type: 'composer_submission',
      status: body.send_now ? 'send_requested' : 'draft_saved',
      severity: 'normal',
      message: body.subject || 'Composer V12 submission',
      payload: {
        to: body.to, cc: body.cc, bcc: body.bcc, subject: body.subject,
        linked_context: body.linked_context || null, approval_required: body.approval_required || false
      }
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, status: body.send_now ? 'queued_for_send' : 'draft_recorded' });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
