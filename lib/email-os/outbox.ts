import { createClient } from '@/lib/supabase/server';
import { getAccountById } from './accounts';
import { sendMailViaAccount } from './smtp';

async function db() {
  return await createClient();
}

export async function queueDraft(draftId: string) {
  const supabase = await db();

  const { data: draft, error: draftError } = await supabase
    .from('email_drafts')
    .select('*')
    .eq('id', draftId)
    .maybeSingle();

  if (draftError) throw draftError;
  if (!draft) throw new Error('Draft not found: ' + draftId);

  const { data, error } = await supabase
    .from('email_outbox')
    .insert({
      draft_id: draft.id,
      account_id: draft.account_id,
      status: 'queued',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function processOutbox(limit = 10) {
  const supabase = await db();

  const { data: jobs, error } = await supabase
    .from('email_outbox')
    .select('*, email_drafts(*)')
    .in('status', ['queued', 'retry'])
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;

  const results = [];

  for (const job of jobs || []) {
    try {
      const draft = job.email_drafts;
      if (!draft) throw new Error('Outbox job missing draft payload');

      const account = await getAccountById(job.account_id);

      await sendMailViaAccount(account, {
        to: draft.to_emails || [],
        cc: draft.cc_emails || [],
        bcc: draft.bcc_emails || [],
        subject: draft.subject || '(no subject)',
        text: draft.body_text || '',
        html: draft.body_html || undefined,
      });

      await supabase
        .from('email_outbox')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', job.id);

      results.push({ id: job.id, status: 'sent' });
    } catch (error: any) {
      await supabase
        .from('email_outbox')
        .update({
          status: 'retry',
          updated_at: new Date().toISOString(),
          last_error: error?.message || String(error),
        })
        .eq('id', job.id);

      results.push({ id: job.id, status: 'retry', error: error?.message || String(error) });
    }
  }

  return results;
}
