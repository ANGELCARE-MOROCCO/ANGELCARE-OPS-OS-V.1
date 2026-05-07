import { createClient } from '@supabase/supabase-js';
import type { EmailAuditLog } from './types';

export function missingEmailOsEnv() {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return missing;
}

export function providerBlockers() {
  const blockers: string[] = [];
  const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
  const hasMicrosoft = Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET && process.env.MICROSOFT_TENANT_ID);
  const hasSmtp = Boolean(process.env.EMAIL_SMTP_HOST && process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_PASS);
  if (!hasGoogle && !hasMicrosoft && !hasSmtp) blockers.push('No real provider credentials found: add Google, Microsoft Graph, or SMTP/IMAP env values.');
  return blockers;
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function blockerResponse(extra: string[] = []) {
  const missing = missingEmailOsEnv();
  return Response.json({
    error: 'Email OS V12 is in zero-demo mode and refuses to invent data.',
    blockers: [...missing.map((m) => `Missing env: ${m}`), ...providerBlockers(), ...extra],
  }, { status: 503 });
}

export async function audit(action: string, targetType: string, targetId: string | null, result: string, metadata: Record<string, unknown> = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const row = { actor: 'Email OS Operator', action, target_type: targetType, target_id: targetId, result, metadata };
  const { data } = await supabase.from('email_os_audit').insert(row).select('*').single<EmailAuditLog>();
  return data;
}

export async function requireSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase is not configured. Zero-demo mode requires real database env values.');
  return supabase;
}

export function getProviderState() {
  const blockers = providerBlockers();
  return { providerReady: blockers.length === 0, blockers };
}
