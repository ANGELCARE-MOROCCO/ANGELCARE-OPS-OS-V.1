import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function ok(data: unknown) {
  return NextResponse.json({ ok: true, data });
}

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ ok: false, error: message }, { status });
}

function encryptSecret(value?: string) {
  if (!value) return undefined;
  const secret = process.env.EMAIL_CREDENTIAL_SECRET || 'temporary_development_secret_replace_with_32_chars';
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email || body.email_address;
    if (!email) return fail('email is required', 400);

    const supabase = await createClient();

    const payload: Record<string, unknown> = {
      slug: String(email).split('@')[0].replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase(),
      mailbox_name: body.mailbox_name || body.name || String(email).split('@')[0],
      email_address: email,
      department: body.department || 'Email',
      owner_label: body.owner_label || body.owner || 'Mailbox Owner',
      provider: 'menara_smtp_imap',
      username: body.username || email,
      imap_host: body.imap_host || 'imap.menara.ma',
      imap_port: Number(body.imap_port || 993),
      imap_secure: Boolean(body.imap_secure ?? true),
      smtp_host: body.smtp_host || 'smtp-auth.menara.ma',
      smtp_port: Number(body.smtp_port || 587),
      smtp_secure: Boolean(body.smtp_secure ?? false),
      signature_name: body.signature_name || body.mailbox_name || body.name || String(email).split('@')[0],
      routing_rule: body.routing_rule || body.routingRule || 'Standard routing',
      send_enabled: Boolean(body.send_enabled ?? true),
      receive_enabled: Boolean(body.receive_enabled ?? true),
      approval_required: Boolean(body.approval_required ?? false),
      status: body.password ? 'credentials_saved' : 'needs_credentials',
      updated_at: new Date().toISOString(),
    };

    const encrypted = encryptSecret(body.password);
    if (encrypted) payload.encrypted_password = encrypted;

    const { data, error } = await supabase
      .from('email_accounts')
      .upsert(payload, { onConflict: 'email_address' })
      .select('*')
      .single();

    if (error) throw error;

    return ok(data);
  } catch (e) {
    return fail(e);
  }
}