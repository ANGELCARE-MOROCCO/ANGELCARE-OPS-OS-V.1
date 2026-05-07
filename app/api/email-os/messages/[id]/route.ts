import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function db() {
  return await createClient();
}

function ok(data: unknown) {
  return NextResponse.json({ ok: true, data });
}

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ ok: false, error: message }, { status });
}

import { auditEmailAction } from '@/lib/email-os/audit';
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await db();
    const { data, error } = await supabase.from('email_messages').select('*, email_accounts(*), email_attachments(*)').eq('id', params.id).single();
    if (error) throw error;
    await auditEmailAction(JSON.stringify({ action: 'message_opened', account_id: data.account_id, entity_type: 'email_message', entity_id: params.id }));
    return ok(data);
  } catch (e) { return fail(e); }
}
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const payload: Record<string, unknown> = {};
    for (const key of ['status','priority','business_context']) if (key in body) payload[key] = body[key];
    const supabase = await db();
    const { data, error } = await supabase.from('email_messages').update(payload).eq('id', params.id).select('*').single();
    if (error) throw error;
    await auditEmailAction(JSON.stringify({ action: 'message_updated', account_id: data.account_id, entity_type: 'email_message', entity_id: params.id, details: payload }));
    return ok(data);
  } catch (e) { return fail(e); }
}
