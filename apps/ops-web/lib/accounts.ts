import { db } from './supabase';
import { encryptSecret, decryptSecret } from './crypto';
import { ANGELCARE_EMAIL_MAILBOXES } from './mailbox-seed';

export type EmailAccount = any;

export async function getAccountByEmail(email: string) {
  const supabase = await db();
  const { data, error } = await supabase.from('email_accounts').select('*').eq('email_address', email).single();
  if (error) throw error;
  return data;
}
export async function getAccountById(id: string) {
  const supabase = await db();
  const { data, error } = await supabase.from('email_accounts').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
export async function listAccounts() {
  const supabase = await db();
  const { data, error } = await supabase.from('email_accounts').select('*').order('department').order('mailbox_name');
  if (error) throw error;
  return data || [];
}
export function resolvePassword(account: any) {
  if (account.encrypted_password) return decryptSecret(account.encrypted_password);
  const index = ANGELCARE_EMAIL_MAILBOXES.findIndex(m => m.email_address.toLowerCase() === String(account.email_address).toLowerCase());
  return index >= 0 ? (process.env[`EMAIL_MBX_${String(index + 1).padStart(2, '0')}_PASSWORD`] || '') : '';
}
export async function upsertAccountPassword(email: string, password: string) {
  const supabase = await db();
  const { data, error } = await supabase.from('email_accounts').update({
    encrypted_password: encryptSecret(password), status: 'credentials_saved', updated_at: new Date().toISOString()
  }).eq('email_address', email).select('*').single();
  if (error) throw error;
  return data;
}
export async function upsertAccountMetadata(input: any) {
  const supabase = await db();
  const payload = {
    slug: input.slug || String(input.email || input.email_address).split('@')[0].replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase(),
    mailbox_name: input.mailbox_name || input.name || String(input.email || input.email_address).split('@')[0],
    email_address: input.email || input.email_address,
    department: input.department || 'Email',
    owner_label: input.owner_label || input.owner || 'Mailbox Owner',
    signature_name: input.signature_name || input.signature || input.mailbox_name || input.name || 'AngelCare',
    routing_rule: input.routing_rule || input.routingRule || 'Standard routing',
    send_enabled: input.send_enabled ?? input.sendEnabled ?? true,
    receive_enabled: input.receive_enabled ?? input.receiveEnabled ?? true,
    provider: 'menara_smtp_imap',
    username: input.email || input.email_address,
    imap_host: process.env.MENARA_IMAP_HOST || 'imap.menara.ma',
    imap_port: Number(process.env.MENARA_IMAP_PORT || 993),
    imap_secure: String(process.env.MENARA_IMAP_SECURE || 'true') === 'true',
    smtp_host: process.env.MENARA_SMTP_HOST || 'smtp-auth.menara.ma',
    smtp_port: Number(process.env.MENARA_SMTP_PORT || 587),
    smtp_secure: String(process.env.MENARA_SMTP_SECURE || 'false') === 'true',
    status: input.status || 'needs_credentials',
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('email_accounts').upsert(payload, { onConflict: 'email_address' }).select('*').single();
  if (error) throw error;
  return data;
}
export async function seedAccountsFromEnv() {
  const results = [];
  for (let i = 0; i < ANGELCARE_EMAIL_MAILBOXES.length; i++) {
    results.push(await upsertAccountMetadata(ANGELCARE_EMAIL_MAILBOXES[i]));
  }
  return results;
}
