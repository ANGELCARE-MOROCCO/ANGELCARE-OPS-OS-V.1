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
import { queueDraft } from '@/lib/email-os/outbox';
import { auditEmailAction } from '@/lib/email-os/audit';
export async function GET() {
  try {
    const supabase = await db();
    const { data, error } = await supabase.from('email_drafts').select('*, email_accounts(*)').order('created_at', { ascending: false });
    if (error) throw error;
    return ok(data || []);
  } catch (e) { return fail(e); }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const account = await getAccountByEmail(body.account_email);
    const to = Array.isArray(body.to) ? body.to : String(body.to || '').split(',').map((x: string) => x.trim()).filter(Boolean);
    const approvalRequired = Boolean(account.approval_required || body.approval_required);
    const supabase = await db();
    const { data: draft, error } = await supabase.from('email_drafts').insert({ account_id: account.id, to_emails: to, cc_emails: body.cc || [], bcc_emails: body.bcc || [], subject: body.subject, body_text: body.body_text || body.text || '', body_html: body.body_html || body.html || null, status: approvalRequired ? 'approval_required' : 'draft', approval_required: approvalRequired }).select('*').single();
    if (error) throw error;
    if (approvalRequired) {
      const { data: approval } = await supabase.from('email_approvals').insert({ draft_id: draft.id, status: 'pending', reason: body.reason || 'Mailbox policy requires approval' }).select('*').single();
      await supabase.from('email_drafts').update({ approval_id: approval?.id }).eq('id', draft.id);
    } else if (body.queue === true) {
      await queueDraft(draft.id);
    }
await auditEmailAction(
  JSON.stringify({
    action: 'draft_created',
    account_id: String(account?.id ?? ''),
    entity_type: 'email_draft',
    entity_id: String(draft?.id ?? ''),
  })
)
    return ok(draft);
  } catch (e) { return fail(e); }
}
