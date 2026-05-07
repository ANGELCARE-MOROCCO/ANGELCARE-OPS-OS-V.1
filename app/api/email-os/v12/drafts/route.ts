import { audit, blockerResponse, getSupabaseAdmin } from '@/lib/email-os/v12/server';

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return blockerResponse();
  const body = await req.json();
  const action = body.action || 'create';
  if (action === 'queue') {
    if (!body.draftId) return Response.json({ error: 'draftId is required' }, { status: 400 });
    const { data: draft, error: readError } = await supabase.from('email_os_drafts').select('*').eq('id', body.draftId).single();
    if (readError) return Response.json({ error: readError.message }, { status: 500 });
    if (draft.status === 'approval_required') return Response.json({ error: 'Draft requires approval before queueing.' }, { status: 409 });
    const { error: updateError } = await supabase.from('email_os_drafts').update({ status: 'queued', updated_at: new Date().toISOString() }).eq('id', body.draftId);
    if (updateError) return Response.json({ error: updateError.message }, { status: 500 });
    await supabase.from('email_os_queue').insert({ type: 'send_draft', mailbox_id: draft.mailbox_id, thread_id: draft.thread_id, draft_id: draft.id, state: 'queued', retry_count: 0, payload: { to: draft.to_email, subject: draft.subject } });
    await audit('queue_draft', 'draft', body.draftId, 'queued');
    return Response.json({ ok: true });
  }
  const mailboxId = body.mailboxId;
  if (!mailboxId || !body.to || !body.subject || !body.body) return Response.json({ error: 'mailboxId, to, subject and body are required' }, { status: 400 });
  const { data: mailbox } = await supabase.from('email_os_mailboxes').select('*').eq('id', mailboxId).single();
  const status = mailbox?.restricted ? 'approval_required' : 'draft';
  const approvalReason = mailbox?.restricted ? 'Mailbox is restricted and requires approval.' : null;
  const { data, error } = await supabase.from('email_os_drafts').insert({ mailbox_id: mailboxId, thread_id: body.threadId || null, to_email: body.to, cc_emails: body.cc || [], subject: body.subject, body: body.body, status, approval_reason: approvalReason, created_by: body.createdBy || 'Email OS Operator' }).select('*').single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  await audit('create_draft', 'draft', data.id, 'completed');
  return Response.json({ draft: data });
}
