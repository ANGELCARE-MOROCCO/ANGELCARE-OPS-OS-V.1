function toEmailIsoString(value: string | Date | null | undefined): string {
  if (!value) return new Date().toISOString()
  return value instanceof Date ? toEmailIsoString(value) : new Date(value).toISOString()
}

import { simpleParser } from 'mailparser';
import { auditEmailAction } from './audit';
import { db } from './supabase';
import { resolvePassword } from './accounts';

export async function testImapConnection(account: any) {
  const { ImapFlow } = await import('imapflow');
  const client = new ImapFlow({
    host: account.imap_host, port: Number(account.imap_port), secure: Boolean(account.imap_secure),
    auth: { user: account.username || account.email_address, pass: resolvePassword(account) }, logger: false,
  });
  await client.connect();
  await client.mailboxOpen('INBOX');
  await client.logout();
  return true;
}

export async function syncMailbox(account: any, limit = 25) {
  if (!account.receive_enabled) throw new Error('Receiving is disabled for this mailbox');
  const password = resolvePassword(account);
  if (!password) throw new Error('Missing mailbox password');
  const { ImapFlow } = await import('imapflow');
  const supabase = await db();
  const { data: job } = await supabase.from('email_sync_jobs').insert({ account_id: account.id, state: 'running', started_at: new Date().toISOString() }).select('*').single();
  const client = new ImapFlow({
    host: account.imap_host, port: Number(account.imap_port), secure: Boolean(account.imap_secure),
    auth: { user: account.username || account.email_address, pass: password }, logger: false,
  });
  let count = 0;
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const box = await client.mailboxOpen('INBOX');
      const total = box.exists || 0;
      const start = Math.max(1, total - limit + 1);
      for await (const msg of client.fetch(`${start}:*`, { uid: true, envelope: true, source: true, internalDate: true })) {
        const parsed = await simpleParser(msg.source);
        const subject = parsed.subject || msg.envelope?.subject || '(no subject)';
        const from = parsed.from?.value?.[0] as any;
        const to = parsed.to?.value?.map((x: any) => x.address).filter(Boolean) || [];
        const providerUid = String(msg.uid);
        const { data: thread } = await supabase.from('email_threads').insert({
          account_id: account.id, external_thread_id: parsed.messageId || providerUid, subject,
          participants: parsed.from?.value || [], status: 'open',
          priority: subject.toLowerCase().includes('urgent') ? 'critical' : 'normal',
          business_context: account.department, assigned_owner_label: account.owner_label,
          last_message_at: new Date(msg.internalDate || Date.now()).toISOString(),
        }).select('*').single();
        const { error } = await supabase.from('email_messages').upsert({
          account_id: account.id, thread_id: thread?.id || null, provider_uid: providerUid, message_id: parsed.messageId || null,
          direction: 'inbound', status: 'received', from_email: from?.address || '', from_name: from?.name || '',
          to_emails: to, subject, body_text: parsed.text || '', body_html: parsed.html || null,
          snippet: (parsed.text || '').replace(/\s+/g, ' ').slice(0, 240),
          priority: subject.toLowerCase().includes('urgent') ? 'critical' : 'normal',
          business_context: account.department, received_at: new Date(msg.internalDate || Date.now()).toISOString(),
          raw_headers: Object.fromEntries(parsed.headers || []),
        }, { onConflict: 'account_id,provider_uid' });
        if (!error) count++;
      }
    } finally { lock.release(); }
    await client.logout();
    await supabase.from('email_accounts').update({ status: 'connected', last_sync_at: new Date().toISOString(), last_error: null }).eq('id', account.id);
    if (job?.id) await supabase.from('email_sync_jobs').update({ state: 'completed', finished_at: new Date().toISOString(), message_count: count }).eq('id', job.id);
    await auditEmailAction({ action: 'imap_sync_completed', account_id: account.id, details: { count } });
    return { count };
  } catch (error: any) {
    await supabase.from('email_accounts').update({ status: 'warning', last_error: error.message }).eq('id', account.id);
    if (job?.id) await supabase.from('email_sync_jobs').update({ state: 'failed', finished_at: new Date().toISOString(), error: error.message }).eq('id', job.id);
    await auditEmailAction({ action: 'imap_sync_failed', account_id: account.id, details: { error: error.message } });
    throw error;
  }
}
