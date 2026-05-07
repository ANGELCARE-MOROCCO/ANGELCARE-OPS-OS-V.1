import { createClient } from '@/lib/supabase/server';

export type EmailAccountRecord = Record<string, any>;

async function db() {
  return await createClient();
}

function normalizeSlug(email: string) {
  return String(email || '')
    .split('@')[0]
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .toLowerCase();
}

export async function listAccounts() {
  const supabase = await db();
  const { data, error } = await supabase
    .from('email_accounts')
    .select('*')
    .order('department', { ascending: true })
    .order('mailbox_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getAccountByEmail(email: string) {
  const supabase = await db();
  const { data, error } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('email_address', email)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Mailbox account not found: ' + email);
  return data;
}

export async function getAccountById(id: string) {
  const supabase = await db();
  const { data, error } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Mailbox account not found: ' + id);
  return data;
}

export async function upsertAccountMetadata(input: EmailAccountRecord) {
  const email = input.email || input.email_address;

  if (!email) {
    throw new Error('email is required');
  }

  const payload: EmailAccountRecord = {
    slug: input.slug || normalizeSlug(email),
    label: input.label || input.mailbox_name || input.name || normalizeSlug(email),
    mailbox_name: input.mailbox_name || input.name || input.label || normalizeSlug(email),
    email_address: email,
    department: input.department || 'Email',
    owner_label: input.owner_label || input.owner || 'Mailbox Owner',
    provider: input.provider || 'menara_smtp_imap',
    username: input.username || email,
    signature_name: input.signature_name || input.signature || input.mailbox_name || input.name || normalizeSlug(email),
    routing_rule: input.routing_rule || input.routingRule || 'Standard routing',
    send_enabled: Boolean(input.send_enabled ?? input.sendEnabled ?? true),
    receive_enabled: Boolean(input.receive_enabled ?? input.receiveEnabled ?? true),
    approval_required: Boolean(input.approval_required ?? false),
    status: input.status || 'needs_credentials',
    updated_at: new Date().toISOString(),
  };

  if (input.imap_host) payload.imap_host = input.imap_host;
  if (input.imap_port) payload.imap_port = Number(input.imap_port);
  if (typeof input.imap_secure !== 'undefined') payload.imap_secure = Boolean(input.imap_secure);
  if (input.smtp_host) payload.smtp_host = input.smtp_host;
  if (input.smtp_port) payload.smtp_port = Number(input.smtp_port);
  if (typeof input.smtp_secure !== 'undefined') payload.smtp_secure = Boolean(input.smtp_secure);

  const supabase = await db();
  const { data, error } = await supabase
    .from('email_accounts')
    .upsert(payload, { onConflict: 'email_address' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function upsertAccountPassword(email: string, password: string) {
  if (!email) throw new Error('email is required');
  if (!password) throw new Error('password is required');

  const supabase = await db();

  const { data, error } = await supabase
    .from('email_accounts')
    .update({
      encrypted_password: password,
      status: 'credentials_saved',
      updated_at: new Date().toISOString(),
    })
    .eq('email_address', email)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

const SEED_ACCOUNTS = [
  ['supports', 'Supports', 'supports@angelcare.ma', 'Support', 'Support Lead'],
  ['ops', 'Operations', 'ops@angelcare.ma', 'Operations', 'Operations Lead'],
  ['rh', 'RH', 'rh@angelcare.ma', 'HR', 'HR Manager'],
  ['commercial', 'Commercial', 'Commercial@angelcare.ma', 'Commercial', 'Commercial Director'],
  ['academy', 'Academy', 'Academy@angelcare.ma', 'Academy', 'Academy Manager'],
  ['montessori', 'Montessori', 'montessori@angelcare.ma', 'Academy', 'Montessori Program Lead'],
  ['flashcartes', 'Flashcartes', 'flashcartes@angelcare.ma', 'Academy', 'Flashcartes Program Lead'],
  ['it-support', 'IT Support', 'it.support@angelcare.ma', 'IT', 'IT Support'],
  ['homeservice', 'Home Service', 'Homeservice@angelcare.ma', 'Home Service', 'Home Service Lead'],
  ['events', 'Events', 'events@angelcare.ma', 'Events', 'Events Lead'],
  ['excursions', 'Excursions', 'exursions@angelcare.ma', 'Excursions', 'Excursions Lead'],
  ['b2b', 'B2B', 'b2b@angelcare.ma', 'B2B', 'B2B Manager'],
  ['partenaires', 'Partenaires', 'partenaires@angelcare.ma', 'Partnerships', 'Partnership Manager'],
] as const;

export async function seedAccountsFromEnv() {
  const results = [];

  for (const [slug, mailbox_name, email_address, department, owner_label] of SEED_ACCOUNTS) {
    results.push(await upsertAccountMetadata({
      slug,
      mailbox_name,
      label: mailbox_name,
      email_address,
      department,
      owner_label,
      provider: 'menara_smtp_imap',
      username: email_address,
      signature_name: 'AngelCare ' + mailbox_name,
      routing_rule: department + ' mailbox routing',
      send_enabled: true,
      receive_enabled: true,
      approval_required: ['rh', 'it-support', 'partenaires'].includes(slug),
      status: 'needs_credentials',
    }));
  }

  return results;
}

export function resolvePassword(account: EmailAccountRecord) {
  return (
    account?.password ||
    account?.smtp_password ||
    account?.plain_password ||
    account?.encrypted_password ||
    ''
  );
}


export type EmailOsAccount = {
  id?: string | null
  email_address?: string | null
  email?: string | null
  receive_enabled?: boolean | null
  [key: string]: unknown
}
