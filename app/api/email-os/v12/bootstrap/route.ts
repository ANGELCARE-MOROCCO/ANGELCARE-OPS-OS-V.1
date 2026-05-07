import { blockerResponse, getProviderState, getSupabaseAdmin, missingEmailOsEnv } from '@/lib/email-os/v12/server';
import type { EmailSnapshot } from '@/lib/email-os/v12/types';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return blockerResponse(['Run database/email-os-v12/schema.sql in Supabase before using Email OS.']);

  const [mailboxes, threads, drafts, permissions, queue, audit, configuration] = await Promise.all([
    supabase.from('email_os_mailboxes').select('*').order('created_at', { ascending: true }),
    supabase.from('email_os_threads').select('*').order('last_message_at', { ascending: false }).limit(100),
    supabase.from('email_os_drafts').select('*').order('updated_at', { ascending: false }).limit(100),
    supabase.from('email_os_permissions').select('*').order('user_label', { ascending: true }),
    supabase.from('email_os_queue').select('*').order('updated_at', { ascending: false }).limit(100),
    supabase.from('email_os_audit').select('*').order('created_at', { ascending: false }).limit(80),
    supabase.from('email_os_configuration').select('*').eq('id', 'email-os-config-main').maybeSingle(),
  ]);

  const dbErrors = [mailboxes.error, threads.error, drafts.error, permissions.error, queue.error, audit.error, configuration.error].filter(Boolean).map((e: any) => e.message);
  if (dbErrors.length) return blockerResponse(['Database schema not ready or table access failed.', ...dbErrors]);

  const provider = getProviderState();
  const snapshot: EmailSnapshot = {
    mailboxes: mailboxes.data || [],
    threads: threads.data || [],
    drafts: drafts.data || [],
    permissions: permissions.data || [],
    queue: queue.data || [],
    audit: audit.data || [],
    configuration: configuration.data || null,
    providerReady: provider.providerReady,
    databaseReady: missingEmailOsEnv().length === 0,
    blockers: provider.blockers,
  };
  return Response.json(snapshot);
}
