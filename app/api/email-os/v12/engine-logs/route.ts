import { NextResponse } from 'next/server';
import { createEmailOSV12Supabase } from '@/lib/email-os/v12/supabaseServer';

export async function GET(req: Request) {
  try {
    const supabase = createEmailOSV12Supabase();
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') || 100);
    const { data, error } = await supabase.from('email_engine_logs_v12').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return NextResponse.json({ ok: true, logs: data || [] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createEmailOSV12Supabase();
    const { data, error } = await supabase.from('email_engine_logs_v12').insert({
      mailbox_id: body.mailbox_id || null,
      message_id: body.message_id || null,
      event_type: body.event_type || 'manual_event',
      status: body.status || 'info',
      severity: body.severity || 'normal',
      message: body.message || null,
      payload: body.payload || {}
    }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, log: data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
