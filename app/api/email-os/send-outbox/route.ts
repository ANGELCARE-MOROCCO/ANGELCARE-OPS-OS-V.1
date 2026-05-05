import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

function admin() { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY; return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null; }

export async function POST(req: Request) {
  const db = admin(); if (!db) return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 });
  const body = await req.json().catch(()=>({}));
  const limit = Number(body.limit || 10);
  const { data: queue, error } = await db.from('email_outbox_queue').select('*').in('execution_status', ['queued','retrying']).order('priority', { ascending: true }).limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const results:any[] = [];
  for (const item of queue || []) {
    try {
      const { data: mailbox } = await db.from('email_accounts').select('*').eq('id', item.mailbox_id).single();
      if (!mailbox) throw new Error('Mailbox missing');
      const pass = mailbox.smtp_pass || process.env[`SMTP_PASS_${String(mailbox.label || '').toUpperCase().replace(/[^A-Z0-9]/g,'_')}`] || process.env.SMTP_PASS;
      const user = mailbox.smtp_user || mailbox.email_address || process.env.SMTP_USER;
      if (!pass || !user) throw new Error('SMTP credentials missing');
      const transporter = nodemailer.createTransport({ host: mailbox.smtp_host || 'smtp.menara.ma', port: Number(mailbox.smtp_port || 587), secure: !!mailbox.smtp_secure, auth: { user, pass } });
      const sent = await transporter.sendMail({ from: `${mailbox.from_name || mailbox.label || 'AngelCare'} <${mailbox.email_address || user}>`, to: item.to_email || item.recipient_email || item.to, subject: item.subject, html: item.html_body || item.body || item.content || '' });
      await db.from('email_outbox_queue').update({ execution_status: 'sent', status: 'sent', sent_at: new Date().toISOString(), provider_message_id: sent.messageId, attempt_count: (item.attempt_count || 0) + 1 }).eq('id', item.id);
      await db.from('email_v7_activity_events').insert({ mailbox_id: mailbox.id, event_type: 'email_sent', severity: 'success', title: `Email sent: ${item.subject}`, payload: { queue_id: item.id, messageId: sent.messageId } });
      results.push({ id: item.id, ok: true, messageId: sent.messageId });
    } catch (e:any) {
      const attempts = (item.attempt_count || 0) + 1;
      const failed = attempts >= (item.max_attempts || 3);
      await db.from('email_outbox_queue').update({ execution_status: failed ? 'failed' : 'retrying', status: failed ? 'failed' : 'retrying', attempt_count: attempts, last_error: e.message }).eq('id', item.id);
      await db.from('email_v7_activity_events').insert({ mailbox_id: item.mailbox_id, event_type: 'email_send_failed', severity: failed ? 'critical' : 'warning', title: `Send failed: ${item.subject || 'email'}`, description: e.message, payload: { queue_id: item.id, attempts } });
      results.push({ id: item.id, ok: false, error: e.message });
    }
  }
  return NextResponse.json({ processed: results.length, results });
}
