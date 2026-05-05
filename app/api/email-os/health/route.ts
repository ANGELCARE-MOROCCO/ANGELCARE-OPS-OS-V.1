import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import net from 'net';

function admin() { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY; return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null; }
function ping(host: string, port: number, timeout = 4500) { return new Promise<{ok:boolean;latency:number}>((resolve)=>{ const start=Date.now(); const s=net.createConnection({host, port}); const done=(ok:boolean)=>{s.destroy(); resolve({ok, latency:Date.now()-start});}; s.setTimeout(timeout); s.once('connect',()=>done(true)); s.once('timeout',()=>done(false)); s.once('error',()=>done(false)); }); }

export async function POST(req: Request) {
  const db = admin(); if (!db) return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 });
  const { mailboxId } = await req.json();
  const { data: mailbox, error } = await db.from('email_accounts').select('*').eq('id', mailboxId).single();
  if (error || !mailbox) return NextResponse.json({ error: error?.message || 'Mailbox not found' }, { status: 404 });
  const smtp = await ping(mailbox.smtp_host || 'smtp.menara.ma', Number(mailbox.smtp_port || 587));
  const imap = await ping(mailbox.imap_host || 'imap.menara.ma', Number(mailbox.imap_port || 993));
  const score = (smtp.ok ? 50 : 0) + (imap.ok ? 50 : 0);
  const status = score === 100 ? 'online' : score >= 50 ? 'warning' : 'critical';
  await db.from('email_accounts').update({ health_status: status, last_health_check_at: new Date().toISOString() }).eq('id', mailbox.id);
  await db.from('email_v7_health_snapshots').insert({ mailbox_id: mailbox.id, smtp_ok: smtp.ok, imap_ok: imap.ok, latency_ms: Math.max(smtp.latency, imap.latency), health_score: score, signal: { smtp, imap } });
  await db.from('email_v7_activity_events').insert({ mailbox_id: mailbox.id, event_type: 'health_check', severity: status === 'online' ? 'success' : 'warning', title: `Health check ${status}`, payload: { smtp, imap, score } });
  return NextResponse.json({ status, score, smtp, imap });
}
