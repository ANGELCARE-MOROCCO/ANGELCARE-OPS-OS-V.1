'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BadgeCheck, CheckCircle2, Database, Inbox, Mail, PlayCircle, RefreshCw, Send, Server, Settings, Shield, Zap } from 'lucide-react';
import type { EmailOsDraft, EmailOsMailbox, EmailOsThread } from '@/lib/email-os/v15/types';

type Mode = 'command' | 'inbox' | 'configuration' | 'engine' | 'composer';

type ApiEnvelope<T> = { status?: string; data?: T; blockedReason?: string; message?: string };

function classNames(...parts: Array<string | false | undefined>) { return parts.filter(Boolean).join(' '); }

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  return res.json();
}

function Button({ children, onClick, tone = 'cyan' }: { children: React.ReactNode; onClick?: () => void; tone?: 'cyan' | 'emerald' | 'rose' | 'amber' }) {
  const tones = {
    cyan: 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300 hover:text-slate-950',
    emerald: 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300 hover:text-slate-950',
    rose: 'border-rose-300/40 bg-rose-300/10 text-rose-100 hover:bg-rose-300 hover:text-slate-950',
    amber: 'border-amber-300/40 bg-amber-300/10 text-amber-100 hover:bg-amber-300 hover:text-slate-950',
  };
  return <button type="button" onClick={onClick} className={classNames('rounded-2xl border px-4 py-2 text-sm font-black transition', tones[tone])}>{children}</button>;
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="rounded-[2rem] border border-slate-700/80 bg-[#0b1220] p-5 shadow-2xl shadow-black/20"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-xl font-black text-white">{title}</h3>{action}</div>{children}</section>;
}

function Status({ value }: { value?: string }) {
  const v = value || 'unknown';
  const tone = v.includes('blocked') || v.includes('missing') || v.includes('denied') || v.includes('restricted') ? 'border-rose-300/40 bg-rose-400/10 text-rose-200' : v.includes('ok') || v.includes('ready') || v.includes('assigned') ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-200' : 'border-amber-300/40 bg-amber-400/10 text-amber-200';
  return <span className={classNames('rounded-full border px-3 py-1 text-xs font-black', tone)}>{v}</span>;
}

export function EmailOSV15ProductionShell({ mode = 'command' }: { mode?: Mode }) {
  const [health, setHealth] = useState<any>(null);
  const [mailboxes, setMailboxes] = useState<EmailOsMailbox[]>([]);
  const [threads, setThreads] = useState<EmailOsThread[]>([]);
  const [drafts, setDrafts] = useState<EmailOsDraft[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [subject, setSubject] = useState('AngelCare follow-up');
  const [body, setBody] = useState('Hello,\n\nWe reviewed your request and prepared the next operational step.\n\nBest regards,\nAngelCare Team');

  const blockers = useMemo(() => health?.blockers || [], [health]);

  async function refresh() {
    const h = await api<any>('/api/email-os/v15/health');
    const boot = await api<any>('/api/email-os/v15/bootstrap');
    setHealth(h);
    setMailboxes(boot.mailboxes?.data || []);
    setThreads(boot.threads?.data || []);
    setDrafts(boot.drafts?.data || []);
    setLog(x => [`Refreshed V15 production state · blockers: ${(h.blockers || []).join(', ') || 'none'}`, ...x].slice(0, 20));
  }

  useEffect(() => { refresh(); }, []);

  async function updateThread(id: string, status: string) {
    const result = await api<ApiEnvelope<EmailOsThread>>('/api/email-os/v15/threads', { method: 'PATCH', body: JSON.stringify({ id, status, actor: 'current-user' }) });
    setLog(x => [`Thread ${id} -> ${status}: ${result.message || result.status}`, ...x].slice(0, 20));
    await refresh();
  }

  async function createDraft() {
    const result = await api<ApiEnvelope<EmailOsDraft>>('/api/email-os/v15/drafts', { method: 'POST', body: JSON.stringify({ subject, body, toAddresses: ['client@example.com'], ccAddresses: [], actor: 'current-user' }) });
    setLog(x => [`Draft created: ${result.message || result.status}`, ...x].slice(0, 20));
    await refresh();
  }

  async function requestSend(draft: EmailOsDraft) {
    const result = await api<any>('/api/email-os/v15/send', { method: 'POST', body: JSON.stringify({ provider: 'smtp_imap', draft, actor: 'current-user' }) });
    setLog(x => [`Send requested: ${result.sendResult?.message || result.sendResult?.status}`, ...x].slice(0, 20));
  }

  async function requestSync(mailbox: EmailOsMailbox) {
    const result = await api<any>('/api/email-os/v15/sync', { method: 'POST', body: JSON.stringify({ provider: mailbox.provider, mailboxAddress: mailbox.address, actor: 'current-user' }) });
    setLog(x => [`Sync ${mailbox.address}: ${result.result?.message || result.result?.status}`, ...x].slice(0, 20));
  }

  return <div className="min-h-screen bg-slate-950 text-white [&_*]:opacity-100 [&_p]:text-slate-300 [&_label]:text-slate-200 [&_input]:text-slate-100 [&_textarea]:text-slate-100 [&_select]:text-slate-100">
    <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,.12),transparent_32%)]" />
    <main className="relative mx-auto max-w-7xl space-y-6 p-5 md:p-8">
      <header className="rounded-[2rem] border border-cyan-400/30 bg-[#0b1220] p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.4em] text-cyan-200">AngelCare Email OS V15</p>
            <h1 className="mt-2 text-4xl font-black text-white md:text-6xl">Production binding control</h1>
            <p className="mt-3 max-w-4xl text-base leading-7 text-slate-300">This workspace makes fake execution impossible: actions call API routes, API routes check database/provider/permission readiness, and blocked states are visible instead of hidden.</p>
          </div>
          <Button onClick={refresh}>Refresh production state</Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">{(blockers.length ? blockers : ['production_ready']).map((b: string) => <Status key={b} value={b} />)}</div>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Card title="Database"><div className="flex items-center gap-3"><Database className="h-6 w-6 text-cyan-200"/><Status value={health?.env?.databaseConfigured ? 'ok_database_configured' : 'blocked_database_missing'} /></div></Card>
        <Card title="Provider"><div className="flex items-center gap-3"><Server className="h-6 w-6 text-emerald-200"/><Status value={health?.env?.googleConfigured || health?.env?.microsoftConfigured || health?.env?.smtpConfigured ? 'provider_ready' : 'provider_credentials_missing'} /></div></Card>
        <Card title="Mailboxes"><div className="text-3xl font-black text-white">{mailboxes.length}</div><p className="mt-2 text-sm">Loaded from V15 store boundary.</p></Card>
        <Card title="Threads"><div className="text-3xl font-black text-white">{threads.length}</div><p className="mt-2 text-sm">API-backed state operations.</p></Card>
      </div>

      {(mode === 'command' || mode === 'configuration') && <Card title="Configuration checklist" action={<Button onClick={refresh}>Test now</Button>}>
        <div className="grid gap-3 md:grid-cols-2">
          {['Add EMAIL_OS_DATABASE_URL', 'Run supabase/email-os-v15-schema.sql', 'Add EMAIL_OS_ENCRYPTION_KEY', 'Add Google/Microsoft/SMTP credentials', 'Create mailbox permission rows', 'Test sync and send routes'].map((x, i) => <div key={x} className="rounded-2xl border border-slate-700 bg-[#08111f] p-4"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-cyan-200"/><span className="font-bold text-white">{i+1}. {x}</span></div></div>)}
        </div>
      </Card>}

      {(mode === 'command' || mode === 'inbox') && <Card title="Inbox execution — real API calls">
        <div className="space-y-3">{threads.map(t => <div key={t.id} className="rounded-3xl border border-slate-700 bg-[#08111f] p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><h3 className="text-lg font-black text-white">{t.subject}</h3><p className="mt-1 text-sm text-slate-400">{t.sender} · {t.clientName} · {t.revenueLink}</p><p className="mt-2 text-sm text-slate-300">{t.lastMessagePreview}</p></div><div className="flex flex-wrap gap-2"><Status value={t.status}/><Button onClick={() => updateThread(t.id, 'assigned')}>Assign</Button><Button tone="emerald" onClick={() => updateThread(t.id, 'resolved')}>Resolve</Button><Button tone="rose" onClick={() => updateThread(t.id, 'escalated')}>Escalate</Button></div></div></div>)}</div>
      </Card>}

      {(mode === 'command' || mode === 'composer') && <Card title="Composer — create draft and request send">
        <div className="grid gap-4 lg:grid-cols-[1fr_.8fr]"><div className="space-y-3"><label className="block"><span className="mb-2 block text-sm font-bold">Subject</span><input value={subject} onChange={e=>setSubject(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3"/></label><label className="block"><span className="mb-2 block text-sm font-bold">Body</span><textarea value={body} onChange={e=>setBody(e.target.value)} rows={7} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3"/></label><Button tone="emerald" onClick={createDraft}>Create real draft record</Button></div><div className="space-y-2">{drafts.length ? drafts.map(d => <div key={d.id} className="rounded-2xl border border-slate-700 bg-[#08111f] p-3"><div className="font-bold text-white">{d.subject}</div><div className="mt-2 flex gap-2"><Status value={d.status}/><Button onClick={() => requestSend(d)}>Request send</Button></div></div>) : <p>No drafts yet.</p>}</div></div>
      </Card>}

      {(mode === 'command' || mode === 'engine') && <Card title="Provider sync engine — blocked unless credentials exist">
        <div className="grid gap-3 md:grid-cols-2">{mailboxes.map(m => <div key={m.id} className="rounded-3xl border border-slate-700 bg-[#08111f] p-4"><h3 className="font-black text-white">{m.name}</h3><p className="mt-1 text-sm text-slate-400">{m.address} · {m.provider}</p><div className="mt-3 flex gap-2"><Status value={m.status}/><Button onClick={() => requestSync(m)}>Sync mailbox</Button></div></div>)}</div>
      </Card>}

      <Card title="Visible execution log"><div className="space-y-2">{log.length ? log.map(x => <div key={x} className="rounded-2xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200"><Zap className="mr-2 inline h-4 w-4 text-cyan-200"/>{x}</div>) : <p>No actions yet.</p>}</div></Card>

      <Card title="Why this is different from fake UI"><div className="grid gap-3 md:grid-cols-3"><div className="rounded-2xl bg-slate-950 p-4"><Shield className="mb-2 h-6 w-6 text-cyan-200"/><h4 className="font-black text-white">Server boundaries</h4><p className="mt-2 text-sm">Buttons call API routes, not only local UI state.</p></div><div className="rounded-2xl bg-slate-950 p-4"><AlertTriangle className="mb-2 h-6 w-6 text-amber-200"/><h4 className="font-black text-white">Honest blocking</h4><p className="mt-2 text-sm">Missing credentials show blocked states clearly.</p></div><div className="rounded-2xl bg-slate-950 p-4"><BadgeCheck className="mb-2 h-6 w-6 text-emerald-200"/><h4 className="font-black text-white">Ready to bind</h4><p className="mt-2 text-sm">Schema, API, provider adapters and audit boundaries are included.</p></div></div></Card>
    </main>
  </div>;
}
