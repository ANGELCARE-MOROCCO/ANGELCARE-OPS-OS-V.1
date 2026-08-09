import { db } from './supabase';
import { getAccountById } from './accounts';
import { sendMailViaAccount } from './smtp';
import { auditEmailAction } from './audit';

export async function queueDraft(draftId: string) {
  const supabase = await db();
  const { data: draft, error } = await supabase.from('email_drafts').select('*').eq('id', draftId).single();
  if (error) throw error;
  const { data, error: outboxError } = await supabase.from('email_outbox').insert({ draft_id: draft.id, account_id: draft.account_id, status: 'queued' }).select('*').single();
  if (outboxError) throw outboxError;
  await supabase.from('email_drafts').update({ status: 'queued' }).eq('id', draft.id);
  await auditEmailAction({ action: 'draft_queued', account_id: draft.account_id, entity_type: 'draft', entity_id: draft.id });
  return data;
}
export async function processOutbox(limit = 10) {
  const supabase = await db();
  const { data: jobs, error } = await supabase.from('email_outbox').select('*, email_drafts(*)').in('status', ['queued','retry']).lte('scheduled_at', new Date().toISOString()).order('created_at').limit(limit);
  if (error) throw error;
  const results = [];
  for (const job of jobs || []) {
    try {
      const draft = job.email_drafts;
      const account = await getAccountById(job.account_id);
      await sendMailViaAccount(account, { to: draft.to_emails, cc: draft.cc_emails, bcc: draft.bcc_emails, subject: draft.subject, text: draft.body_text, html: draft.body_html });
      await supabase.from('email_outbox').update({ status: 'sent', attempts: job.attempts + 1, sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', job.id);
      await supabase.from('email_drafts').update({ status: 'sent' }).eq('id', draft.id);
      results.push({ id: job.id, status: 'sent' });
    } catch (error: any) {
      const attempts = (job.attempts || 0) + 1;
      await supabase.from('email_outbox').update({ status: attempts >= job.max_attempts ? 'failed' : 'retry', attempts, last_error: error.message, scheduled_at: new Date(Date.now() + Math.min(attempts * 60000, 900000)).toISOString(), updated_at: new Date().toISOString() }).eq('id', job.id);
      results.push({ id: job.id, status: 'failed_or_retry', error: error.message });
    }
  }
  return results;
}
