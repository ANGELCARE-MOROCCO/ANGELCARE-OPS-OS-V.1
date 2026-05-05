import { NextResponse } from 'next/server';
import { createEmailOSV12Supabase } from '@/lib/email-os/v12/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createEmailOSV12Supabase();
    const { data, error } = await supabase.from('email_internal_notes').insert({
      thread_id: body.thread_id || null,
      message_id: body.message_id || null,
      note: body.note,
      visibility: body.visibility || 'internal',
      created_by: body.created_by || null
    }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, note: data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
