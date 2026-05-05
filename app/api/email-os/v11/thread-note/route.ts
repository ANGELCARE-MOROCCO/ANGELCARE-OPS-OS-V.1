import { NextResponse } from 'next/server';
import { adminClient } from '../_supabase';

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.note) return NextResponse.json({ ok: false, error: 'note is required' }, { status: 400 });
  const supabase = adminClient();
  const { data, error } = await supabase.from('email_os_v11_thread_notes').insert({
    thread_id: body.thread_id || null,
    mailbox_id: body.mailbox_id || null,
    actor_id: body.actor_id || null,
    note: body.note,
    visibility: body.visibility || 'internal',
  }).select('*').single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, note: data });
}
