import { NextResponse } from 'next/server';
import { createEmailOSV12Supabase } from '@/lib/email-os/v12/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createEmailOSV12Supabase();
    const { data, error } = await supabase.from('email_thread_links').insert({
      thread_id: body.thread_id || null,
      message_id: body.message_id || null,
      linked_module: body.linked_module || 'revenue-command-center',
      linked_record_id: body.linked_record_id || null,
      linked_record_label: body.linked_record_label || null,
      relation_type: body.relation_type || 'context',
      created_by: body.created_by || null
    }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, link: data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
