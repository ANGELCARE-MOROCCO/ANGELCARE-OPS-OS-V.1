import { NextResponse } from 'next/server';
import { createEmailOSV12Supabase } from '@/lib/email-os/v12/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createEmailOSV12Supabase();
    const { action, message_ids = [], thread_ids = [], note, assigned_to } = body;
    const { error } = await supabase.from('email_engine_logs_v12').insert({
      event_type: 'bulk_action', status: 'queued', severity: 'normal',
      message: `Bulk action requested: ${action}`,
      payload: { action, message_ids, thread_ids, note, assigned_to }
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, action, affected: message_ids.length + thread_ids.length });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
