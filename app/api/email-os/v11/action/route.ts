import { NextResponse } from 'next/server';
import { adminClient } from '../_supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = adminClient();
    const { data, error } = await supabase.from('email_os_v11_command_actions').insert({
      action_key: body.action_key,
      action_label: body.action_label || body.action_key,
      scope: body.scope || 'email_os',
      mailbox_id: body.mailbox_id || null,
      thread_id: body.thread_id || null,
      message_id: body.message_id || null,
      actor_id: body.actor_id || null,
      payload: body.payload || {},
      status: 'logged',
      result: { note: 'Action logged. Wire to engine runner when needed.' },
    }).select('*').single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
