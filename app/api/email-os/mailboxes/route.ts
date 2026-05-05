import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  const db = admin();
  if (!db) return NextResponse.json({ mailboxes: [], warning: 'Supabase env missing' });
  const { data, error } = await db.from('email_accounts').select('*').order('label', { ascending: true });
  if (error) return NextResponse.json({ mailboxes: [], error: error.message }, { status: 500 });
  return NextResponse.json({ mailboxes: data || [] });
}

export async function POST(req: Request) {
  const db = admin();
  if (!db) return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 });
  const body = await req.json();
  const payload = {
    label: body.label,
    email_address: body.email_address || body.mailbox_email,
    mailbox_email: body.email_address || body.mailbox_email,
    department: body.department || 'global',
    business_context: body.business_context || 'operations',
    smtp_host: body.smtp_host || 'smtp.menara.ma',
    smtp_port: Number(body.smtp_port || 587),
    smtp_secure: !!body.smtp_secure,
    imap_host: body.imap_host || 'imap.menara.ma',
    imap_port: Number(body.imap_port || 993),
    imap_secure: body.imap_secure !== false,
    outbound_enabled: body.outbound_enabled !== false,
    inbound_enabled: body.inbound_enabled !== false,
  };
  const { data, error } = await db.from('email_accounts').upsert(payload, { onConflict: 'email_address' }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await db.from('email_v7_activity_events').insert({ mailbox_id: data.id, event_type: 'mailbox_upsert', severity: 'info', title: 'Mailbox configuration saved', payload });
  return NextResponse.json({ mailbox: data });
}
