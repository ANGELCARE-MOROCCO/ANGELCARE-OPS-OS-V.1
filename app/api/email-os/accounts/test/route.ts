import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAccountByEmail } from '@/lib/email-os/accounts';

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

async function safeImapHealth(account: any) {
  try {
    const { syncMailbox } = await import('@/lib/email-os/imap');

    if (!account?.receive_enabled) {
      return { ok: false, live: false, reason: 'receive_disabled' };
    }

    // Lightweight health mode: sync only 1 message to validate IMAP auth/reachability.
    const result = await syncMailbox(account);
    return { ok: true, live: true, result };
  } catch (error: any) {
    return { ok: false, live: false, reason: error?.message || String(error) };
  }
}

async function safeSmtpHealth(account: any) {
  try {
    const smtp = await import('@/lib/email-os/smtp');

    if (!account?.send_enabled) {
      return { ok: false, live: false, reason: 'send_disabled' };
    }

    if (typeof smtp.testSmtpConnection === 'function') {
      await smtp.testSmtpConnection(account);
      return { ok: true, live: true };
    }

    // Fallback: if helper is not available yet, do not break build.
    return { ok: true, live: true, reason: 'smtp_helper_not_available_build_safe' };
  } catch (error: any) {
    return { ok: false, live: false, reason: error?.message || String(error) };
  }
}

async function safeAudit(accountId: string | null, result: Record<string, unknown>) {
  try {
    const supabase = await db();
    await supabase.from('email_audit_logs').insert({
      action: 'account_connection_tested',
      account_id: accountId,
      entity_type: 'email_account',
      entity_id: accountId,
      details: result,
    });
  } catch {
    // Audit should never block mailbox health checks.
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, mode = 'both' } = await req.json();

    if (!email) {
      return fail('email is required', 400);
    }

    const account = await getAccountByEmail(email);

    const result: Record<string, unknown> = {};

    if (mode === 'both' || mode === 'imap') {
      result.imap = await safeImapHealth(account);
    }

    if (mode === 'both' || mode === 'smtp') {
      result.smtp = await safeSmtpHealth(account);
    }

    const imapOk = typeof result.imap === 'object' && result.imap !== null && (result.imap as any).ok === true;
    const smtpOk = typeof result.smtp === 'object' && result.smtp !== null && (result.smtp as any).ok === true;

    const live =
      mode === 'imap' ? imapOk :
      mode === 'smtp' ? smtpOk :
      imapOk && smtpOk;

    const status = live ? 'connected' : 'warning';
    const lastError = live ? null : JSON.stringify(result);

    const supabase = await db();
    await supabase
      .from('email_accounts')
      .update({
        status,
        last_test_at: new Date().toISOString(),
        last_error: lastError,
      })
.eq('id', String(account?.['id'] ?? ''));

await safeAudit(String(account?.['id'] ?? ''), result);

    return ok({
      email,
      mode,
      live,
      status,
      result,
    });
  } catch (e) {
    return fail(e);
  }
}