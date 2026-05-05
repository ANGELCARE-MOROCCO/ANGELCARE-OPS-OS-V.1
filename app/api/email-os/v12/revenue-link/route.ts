import { NextResponse } from 'next/server';
import { createEmailOSV12Supabase } from '@/lib/email-os/v12/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createEmailOSV12Supabase();
    const { data, error } = await supabase.from('email_context_links_v12').insert({
      mailbox_id: body.mailbox_id || null,
      thread_id: body.thread_id || null,
      context_type: body.context_type || 'revenue',
      context_id: body.context_id || null,
      context_label: body.context_label || null,
      metadata: body.metadata || {}
    }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, context: data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
