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

export async function GET() {
  try {
    const supabase = await db();
    const [accounts, messages, drafts, approvals, outbox, syncJobs, audit, attachments] = await Promise.all([
      supabase.from('email_accounts').select('*').order('department').order('mailbox_name'),
      supabase.from('email_messages').select('*').order('created_at', { ascending: false }).limit(250),
      supabase.from('email_drafts').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('email_approvals').select('*').order('requested_at', { ascending: false }).limit(100),
      supabase.from('email_outbox').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('email_sync_jobs').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('email_audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('email_attachments').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    for (const result of [accounts, messages, drafts, approvals, outbox, syncJobs, audit, attachments]) {
      if (result.error) throw result.error;
    }
    return ok({ accounts: accounts.data || [], messages: messages.data || [], drafts: drafts.data || [], approvals: approvals.data || [], outbox: outbox.data || [], syncJobs: syncJobs.data || [], audit: audit.data || [], attachments: attachments.data || [] });
  } catch (e) { return fail(e); }
}
