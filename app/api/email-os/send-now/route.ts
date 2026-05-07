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

import { getAccountByEmail } from '@/lib/email-os/accounts';
import { sendMailViaAccount } from '@/lib/email-os/smtp';
import { auditEmailAction } from '@/lib/email-os/audit';
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const account = await getAccountByEmail(body.account_email || body.email);
    if (account.approval_required && !body.approved) return fail('Approval required before sending from this mailbox', 403);
    const to = Array.isArray(body.to) ? body.to : String(body.to || '').split(',').map((x: string) => x.trim()).filter(Boolean);
    const info = await sendMailViaAccount(account, { to, cc: body.cc || [], bcc: body.bcc || [], subject: body.subject, text: body.text || body.body_text || '', html: body.html || body.body_html || undefined });
    const supabase = await db();
    const { data, error } = await supabase.from('email_messages').insert({ account_id: account.id, direction: 'outbound', status: 'sent', from_email: account.email_address, to_emails: to, subject: body.subject, body_text: body.text || body.body_text || '', body_html: body.html || body.body_html || null, sent_at: new Date().toISOString(), business_context: account.department, message_id: info.messageId || null }).select('*').single();
    if (error) throw error;
    await auditEmailAction(JSON.stringify({ action: 'send_now_completed', account_id: account.id, entity_type: 'email_message', entity_id: data.id, details: { to, subject: body.subject } }));
    return ok({ messageId: info.messageId, message: data });
  } catch (e) { return fail(e); }
}
