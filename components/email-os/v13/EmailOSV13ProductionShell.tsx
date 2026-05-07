'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, BarChart3, CheckCircle2, Clock, Command, Database, Download, Eye, Filter, Gauge, Inbox, Link2, Lock, Mail, MailCheck, Plus, RefreshCw, Reply, Route, Save, Search, Send, Server, Settings, Shield, Tag, Timer, UserCheck, UserCog, Zap } from 'lucide-react';
import type { EmailAuditLog, EmailDraft, EmailMailbox, EmailOsSnapshot, EmailQueueJob, EmailThread, EmailV13Mode } from '@/lib/email-os/v13/types';

const modes: Array<{ mode: EmailV13Mode; label: string; href: string; icon: any; desc: string }> = [
  { mode: 'command', label: 'Command 360', href: '/email-os/v13', icon: Command, desc: 'Executive control room for email health, queues and company risk.' },
  { mode: 'inbox', label: 'Super Inbox', href: '/email-os/inbox/v13', icon: Inbox, desc: 'Multi-mailbox triage with real API-backed actions.' },
  { mode: 'threads', label: 'Thread Dossiers', href: '/email-os/threads/v13', icon: MailCheck, desc: 'Conversation context, internal notes, links and audit.' },
  { mode: 'composer', label: 'Composer', href: '/email-os/composer/v13', icon: Send, desc: 'Save drafts, enforce approval rules and queue delivery.' },
  { mode: 'access', label: 'Access Matrix', href: '/email-os/access/v13', icon: UserCog, desc: 'Read, send, approve and admin controls by mailbox.' },
  { mode: 'engine', label: 'Engine Center', href: '/email-os/engine/v13', icon: Server, desc: 'Queue, retry and provider test operations.' },
  { mode: 'analytics', label: 'Analytics', href: '/email-os/analytics/v13', icon: BarChart3, desc: 'Volume, SLA, unresolved workload and provider readiness.' },
  { mode: 'configuration', label: 'Configuration', href: '/email-os/configuration/v13', icon: Settings, desc: 'Persist provider, SLA, retry and audit policies.' },
  { mode: 'mailboxes', label: 'Mailboxes', href: '/email-os/mailboxes/v13', icon: Mail, desc: 'Create and update operational mailbox registry.' },
  { mode: 'templates', label: 'Templates', href: '/email-os/templates/v13', icon: Route, desc: 'Template library ready for approval and variable binding.' },
  { mode: 'automation', label: 'Automation', href: '/email-os/automation/v13', icon: Zap, desc: 'Rules and event triggers for future cron/webhook binding.' },
  { mode: 'audit', label: 'Audit', href: '/email-os/audit/v13', icon: Shield, desc: 'Every important action writes an audit event.' },
  { mode: 'approvals', label: 'Approvals', href: '/email-os/approvals/v13', icon: Lock, desc: 'Drafts blocked by policy until approval.' },
  { mode: 'outbox', label: 'Outbox', href: '/email-os/outbox/v13', icon: Send, desc: 'Queued and blocked drafts before external delivery.' },
];

const emptySnapshot: EmailOsSnapshot = { mailboxes: [], threads: [], drafts: [], templates: [], permissions: [], queue: [], audit: [], configuration: { id: 'email-os-config-main', providerMode: 'mixed', defaultSlaMinutes: 240, retryLimit: 3, auditRetentionDays: 365, approvalPolicy: '', routingEnabled: true, updatedAt: '' } };
const cx = (...p: Array<string | false | undefined>) => p.filter(Boolean).join(' ');

async function api<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function Pill({ children, tone = 'cyan' }: { children: React.ReactNode; tone?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' }) {
  const map = { cyan: 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100', emerald: 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100', amber: 'border-amber-300/40 bg-amber-400/10 text-amber-100', rose: 'border-rose-300/40 bg-rose-400/10 text-rose-100', slate: 'border-slate-600 bg-slate-900 text-slate-200' };
  return <span className={cx('rounded-full border px-3 py-1 text-xs font-bold', map[tone])}>{children}</span>;
}

function Button({ children, icon: Icon = Zap, onClick, tone = 'cyan' }: { children: React.ReactNode; icon?: any; onClick?: () => void; tone?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' }) {
  const map = { cyan: 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300 hover:text-slate-950', emerald: 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300 hover:text-slate-950', amber: 'border-amber-300/40 bg-amber-300/10 text-amber-100 hover:bg-amber-300 hover:text-slate-950', rose: 'border-rose-300/40 bg-rose-300/10 text-rose-100 hover:bg-rose-300 hover:text-slate-950', slate: 'border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800' };
  return <button type="button" onClick={onClick} className={cx('inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60', map[tone])}><Icon className="h-4 w-4" />{children}</button>;
}

function Card({ title, icon: Icon, children, actions, desc }: { title: string; icon: any; children: React.ReactNode; actions?: React.ReactNode; desc?: string }) {
  return <section className="rounded-[2rem] border border-slate-700/80 bg-[#0b1220] p-5 shadow-2xl shadow-black/20"><div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div className="flex items-start gap-3"><div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-3 text-cyan-200"><Icon className="h-6 w-6" /></div><div><h3 className="text-xl font-black text-white md:text-2xl">{title}</h3>{desc ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">{desc}</p> : null}</div></div>{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}</div>{children}</section>;
}

function Metric({ label, value, icon: Icon, tone = 'cyan' }: { label: string; value: string | number; icon: any; tone?: 'cyan' | 'emerald' | 'amber' | 'rose' }) {
  return <div className="rounded-3xl border border-slate-700/80 bg-[#0b1220] p-5"><div className="flex items-center justify-between"><Icon className="h-6 w-6 text-cyan-200" /><Pill tone={tone}>live</Pill></div><div className="mt-4 text-3xl font-black text-white">{value}</div><div className="mt-1 text-sm font-semibold text-slate-200">{label}</div></div>;
}

export default function EmailOSV13ProductionShell({ mode = 'command' }: { mode?: EmailV13Mode }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<EmailOsSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState('');

  const active = modes.find(m => m.mode === mode) || modes[0];
  const threads = useMemo(() => snapshot.threads.filter(t => !query || [t.subject, t.owner, t.department, t.clientName, t.fromName, ...t.tags].join(' ').toLowerCase().includes(query.toLowerCase())), [snapshot.threads, query]);
  const selectedThreads = snapshot.threads.filter(t => selected.includes(t.id));

  async function refresh(message?: string) {
    setLoading(true);
    const data = await api<EmailOsSnapshot>('/api/email-os/v13/bootstrap');
    setSnapshot(data);
    setLoading(false);
    if (message) setNotice(message);
  }

  async function runThreadAction(action: string, value?: string) {
    if (!selected.length) return setNotice('Select at least one thread first.');
    await api('/api/email-os/v13/threads', { threadIds: selected, action, value });
    setSelected([]);
    await refresh(`Thread action completed: ${action}`);
  }

  async function saveDraft(statusOnly = false) {
    const mailboxId = snapshot.mailboxes[0]?.id;
    if (!mailboxId) return;
    const draft = await api<{ draft: EmailDraft }>('/api/email-os/v13/drafts', { mailboxId, threadId: selected[0], to: selectedThreads[0]?.fromEmail || 'client@example.com', subject: selectedThreads[0]?.subject ? `Re: ${selectedThreads[0].subject}` : 'AngelCare follow-up', body: 'Hello,\n\nThank you for contacting AngelCare. We reviewed your request and prepared the next operational step.\n\nBest regards,\nAngelCare Team', createdBy: 'Email OS User' });
    if (!statusOnly) setNotice(`Draft saved: ${draft.draft.id} (${draft.draft.status})`);
    await refresh();
  }

  async function queueDraft(draftId: string) {
    const result = await api('/api/email-os/v13/actions', { type: 'queue-draft', draftId });
    setNotice(JSON.stringify(result));
    await refresh();
  }

  useEffect(() => { refresh(); }, []);

  return <div className="
email-os-v12-scope
min-h-screen
bg-[#020617]
text-white

[&_ *]:opacity-100
[&_ *]:text-inherit

[&_h1]:!text-white
[&_h2]:!text-white
[&_h3]:!text-white
[&_h4]:!text-white

[&_p]:!text-slate-200
[&_span]:!text-inherit
[&_label]:!text-slate-200

[&_div]:text-inherit

[&_button]:!text-inherit
[&_input]:!text-white
[&_input::placeholder]:!text-slate-400

[&_select]:!text-white
[&_option]:!bg-slate-950
[&_option]:!text-white

[&_ *]:[color:inherit!important]
">
    <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_30%)]" />
    <div className="relative flex min-h-screen">
      <aside className="hidden w-84 shrink-0 border-r border-cyan-400/20 bg-slate-950/95 p-5 xl:block"><div className="rounded-3xl border border-cyan-400/25 bg-cyan-400/10 p-5"><h1 className="text-xl font-black text-white">Email OS V13</h1><p className="mt-2 text-sm leading-6 text-slate-300">Production backend binding layer: API routes, store, queue, audit, provider boundaries.</p></div><nav className="mt-6 space-y-2">{modes.map(item => { const Icon = item.icon; return <button key={item.mode} type="button" onClick={() => router.push(item.href)} className={cx('w-full rounded-2xl border p-4 text-left transition', item.mode === mode ? 'border-cyan-300/70 bg-cyan-300/20 text-white' : 'border-slate-700/70 bg-[#0b1220] text-slate-100 hover:border-cyan-400/50')}><div className="flex items-center gap-3"><Icon className="h-5 w-5 text-cyan-200" /><span className="font-black">{item.label}</span></div><p className="mt-2 text-xs leading-5 text-slate-400">{item.desc}</p></button>; })}</nav></aside>
      <main className="flex-1 p-4 md:p-8"><header className="rounded-[2rem] border border-slate-700/80 bg-[#0b1220] p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.4em] text-cyan-200">AngelCare production binding</p><h2 className="mt-2 text-4xl font-black text-white">{active.label}</h2><p className="mt-2 max-w-4xl text-slate-300">{active.desc}</p></div><div className="flex flex-wrap gap-2"><Button icon={RefreshCw} onClick={() => refresh('Snapshot refreshed')}>Refresh API</Button><Button icon={Save} tone="emerald" onClick={() => api('/api/email-os/v13/audit', { action: 'Manual checkpoint', targetType: 'workspace', targetId: mode, result: 'completed' }).then(() => refresh('Audit checkpoint saved'))}>Checkpoint</Button></div></div><div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3"><Search className="h-5 w-5 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search threads, mailboxes, clients, tags..." className="w-full bg-transparent text-sm outline-none" /></div>{notice ? <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">{notice}</div> : null}</header>
        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric label="Mailboxes" value={snapshot.mailboxes.length} icon={Mail} /><Metric label="Open threads" value={snapshot.threads.filter(t => !['resolved','archived'].includes(t.status)).length} icon={Inbox} tone="amber" /><Metric label="Queue jobs" value={snapshot.queue.length} icon={Database} /><Metric label="Approval drafts" value={snapshot.drafts.filter(d => d.status === 'approval_required').length} icon={Lock} tone="rose" /></section>
        {loading ? <div className="mt-6 text-slate-300">Loading Email OS V13 snapshot...</div> : <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]"><div className="space-y-6">{mode === 'command' && <CommandView snapshot={snapshot} refresh={refresh} />}{mode === 'inbox' && <InboxView threads={threads} selected={selected} setSelected={setSelected} runThreadAction={runThreadAction} />}{mode === 'threads' && <ThreadView threads={threads} selected={selected} setSelected={setSelected} runThreadAction={runThreadAction} />}{mode === 'composer' && <ComposerView snapshot={snapshot} selectedThreads={selectedThreads} saveDraft={saveDraft} queueDraft={queueDraft} />}{mode === 'access' && <AccessView snapshot={snapshot} />}{mode === 'engine' && <EngineView snapshot={snapshot} refresh={refresh} />}{mode === 'analytics' && <AnalyticsView snapshot={snapshot} />}{mode === 'configuration' && <ConfigurationView snapshot={snapshot} refresh={refresh} />}{mode === 'mailboxes' && <MailboxesView snapshot={snapshot} refresh={refresh} />}{mode === 'templates' && <TemplatesView snapshot={snapshot} />}{mode === 'automation' && <AutomationView />}{mode === 'audit' && <AuditView audit={snapshot.audit} />}{mode === 'approvals' && <ApprovalsView drafts={snapshot.drafts} queueDraft={queueDraft} />}{mode === 'outbox' && <OutboxView drafts={snapshot.drafts} queueDraft={queueDraft} />}</div><RightRail snapshot={snapshot} /></section>}
      </main>
    </div>
  </div>;
}

function CommandView({ snapshot, refresh }: { snapshot: EmailOsSnapshot; refresh: (m?: string) => Promise<void> }) { return <><Card title="Backend binding status" icon={Command} desc="These controls call API routes and persist to JSON fallback or Supabase when env is present."><div className="grid gap-3 md:grid-cols-2">{snapshot.mailboxes.map(m => <div key={m.id} className="rounded-3xl border border-slate-700 bg-[#08111f] p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-black text-white">{m.name}</h4><p className="text-sm text-slate-400">{m.address} · {m.provider}</p></div><Pill tone={m.status === 'healthy' ? 'emerald' : m.status === 'restricted' ? 'rose' : 'amber'}>{m.status}</Pill></div><div className="mt-3 flex gap-2"><Button icon={Gauge} onClick={() => api('/api/email-os/v13/provider-test', { mailboxId: m.id }).then(() => refresh('Provider test logged'))}>Test provider</Button></div></div>)}</div></Card><Card title="Priority workload" icon={Timer}>{snapshot.threads.slice(0,6).map(t => <ThreadLine key={t.id} thread={t} />)}</Card></>; }
function InboxView({ threads, selected, setSelected, runThreadAction }: { threads: EmailThread[]; selected: string[]; setSelected: (v: string[]) => void; runThreadAction: (a: string, v?: string) => void }) { return <Card title="API-backed Super Inbox" icon={Inbox} actions={<><Button icon={UserCheck} onClick={() => runThreadAction('assign','Operations Lead')}>Assign</Button><Button icon={Archive} tone="amber" onClick={() => runThreadAction('archive')}>Archive</Button><Button icon={CheckCircle2} tone="emerald" onClick={() => runThreadAction('resolve')}>Resolve</Button><Button icon={Tag} onClick={() => runThreadAction('tag','reviewed')}>Tag</Button></>}>{threads.map(t => <div key={t.id} className="mb-3 rounded-3xl border border-slate-700 bg-[#08111f] p-4"><div className="grid gap-4 md:grid-cols-[auto_1fr_auto]"><input type="checkbox" checked={selected.includes(t.id)} onChange={() => setSelected(selected.includes(t.id) ? selected.filter(x => x !== t.id) : [...selected, t.id])} className="mt-2 h-5 w-5 accent-cyan-300" /><ThreadLine thread={t} /><Button icon={Reply}>Reply</Button></div></div>)}</Card>; }
function ThreadView({ threads, selected, setSelected, runThreadAction }: { threads: EmailThread[]; selected: string[]; setSelected: (v: string[]) => void; runThreadAction: (a: string, v?: string) => void }) { const t = threads.find(x => selected.includes(x.id)) || threads[0]; return <Card title="Thread dossier" icon={MailCheck} actions={<><Button icon={Link2} onClick={() => runThreadAction('note','Linked to business context')}>Add note</Button><Button icon={Zap} tone="rose" onClick={() => runThreadAction('escalate')}>Escalate</Button></>}>{t ? <div className="rounded-3xl border border-slate-700 bg-[#08111f] p-5"><h3 className="text-2xl font-black text-white">{t.subject}</h3><p className="mt-2 text-slate-300">{t.lastMessage}</p><div className="mt-4 flex flex-wrap gap-2"><Pill>{t.id}</Pill><Pill tone="amber">{t.priority}</Pill><Pill tone="slate">{t.status}</Pill><Pill tone="emerald">{t.clientName}</Pill></div><div className="mt-5 space-y-2">{t.internalNotes.map(n => <div key={n} className="rounded-2xl bg-slate-950 p-3 text-sm text-slate-300">{n}</div>)}</div></div> : null}{threads.map(x => <button key={x.id} onClick={() => setSelected([x.id])} className="mt-3 block w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-left text-slate-200">{x.id} · {x.subject}</button>)}</Card>; }
function ComposerView({ snapshot, selectedThreads, saveDraft, queueDraft }: { snapshot: EmailOsSnapshot; selectedThreads: EmailThread[]; saveDraft: () => void; queueDraft: (id: string) => void }) { return <><Card title="Draft composer with approval gate" icon={Send} actions={<><Button icon={Save} onClick={saveDraft}>Save API draft</Button></>}><div className="grid gap-4 lg:grid-cols-2"><div className="rounded-3xl border border-slate-700 bg-[#08111f] p-4"><h4 className="font-black text-white">Selected context</h4>{selectedThreads.length ? selectedThreads.map(t => <p key={t.id} className="mt-2 text-sm text-slate-300">{t.id} · {t.subject}</p>) : <p className="mt-2 text-sm text-slate-400">Select a thread from inbox first for context.</p>}</div><div className="rounded-3xl border border-slate-700 bg-white p-4 text-slate-950"><b>Preview</b><p className="mt-3 text-sm">The API saves draft records and blocks restricted mailbox sends until approval.</p></div></div></Card><OutboxView drafts={snapshot.drafts} queueDraft={queueDraft} /></>; }
function AccessView({ snapshot }: { snapshot: EmailOsSnapshot }) { return <Card title="Permissions matrix" icon={UserCog}>{snapshot.permissions.map(p => <div key={p.id} className="mb-3 grid gap-3 rounded-2xl border border-slate-700 bg-[#08111f] p-4 md:grid-cols-6"><b className="text-white">{p.user}</b><span>{p.role}</span><span>{p.department}</span><Pill tone={p.canRead ? 'emerald' : 'rose'}>read {String(p.canRead)}</Pill><Pill tone={p.canSend ? 'emerald' : 'rose'}>send {String(p.canSend)}</Pill><Pill tone={p.canApprove ? 'emerald' : 'slate'}>approve {String(p.canApprove)}</Pill></div>)}</Card>; }
function EngineView({ snapshot, refresh }: { snapshot: EmailOsSnapshot; refresh: (m?: string) => Promise<void> }) { return <Card title="Queue and provider engine" icon={Server} actions={<Button icon={RefreshCw} onClick={() => api('/api/email-os/v13/queue', { jobIds: snapshot.queue.filter(j => j.state === 'failed').map(j => j.id) }).then(() => refresh('Failed jobs moved back to queue'))}>Retry failed</Button>}>{snapshot.queue.map(j => <QueueLine key={j.id} job={j} />)}</Card>; }
function AnalyticsView({ snapshot }: { snapshot: EmailOsSnapshot }) { return <Card title="Operational analytics" icon={BarChart3}><div className="grid gap-4 md:grid-cols-2"><Metric label="Critical threads" value={snapshot.threads.filter(t => t.priority === 'critical').length} icon={Timer} tone="rose" /><Metric label="Healthy mailboxes" value={snapshot.mailboxes.filter(m => m.status === 'healthy').length} icon={Gauge} tone="emerald" /><Metric label="Restricted mailboxes" value={snapshot.mailboxes.filter(m => m.status === 'restricted').length} icon={Lock} tone="amber" /><Metric label="Audit events" value={snapshot.audit.length} icon={Shield} /></div></Card>; }
function ConfigurationView({ snapshot, refresh }: { snapshot: EmailOsSnapshot; refresh: (m?: string) => Promise<void> }) { return <Card title="Persistent configuration" icon={Settings} actions={<Button icon={Save} onClick={() => api('/api/email-os/v13/configuration', { ...snapshot.configuration, retryLimit: snapshot.configuration.retryLimit + 1 }).then(() => refresh('Configuration persisted through API'))}>Save test change</Button>}><pre className="overflow-auto rounded-3xl border border-slate-700 bg-slate-950 p-4 text-sm text-cyan-100">{JSON.stringify(snapshot.configuration, null, 2)}</pre></Card>; }
function MailboxesView({ snapshot, refresh }: { snapshot: EmailOsSnapshot; refresh: (m?: string) => Promise<void> }) { return <Card title="Mailbox CRUD registry" icon={Mail} actions={<Button icon={Plus} onClick={() => api('/api/email-os/v13/mailboxes', { name: 'New Controlled Mailbox', address: `mailbox-${Date.now()}@angelcare.ma`, department: 'General', owner: 'Email OS', provider: 'smtp_imap' }).then(() => refresh('Mailbox created through API'))}>Create mailbox</Button>}>{snapshot.mailboxes.map(m => <div key={m.id} className="mb-3 rounded-2xl border border-slate-700 bg-[#08111f] p-4"><div className="flex justify-between"><b className="text-white">{m.name}</b><Pill>{m.status}</Pill></div><p className="text-sm text-slate-400">{m.address} · {m.department} · {m.owner}</p></div>)}</Card>; }
function TemplatesView({ snapshot }: { snapshot: EmailOsSnapshot }) { return <Card title="Template library" icon={Route}>{snapshot.templates.map(t => <div key={t.id} className="mb-3 rounded-2xl border border-slate-700 bg-[#08111f] p-4"><b className="text-white">{t.name}</b><p className="text-sm text-slate-300">{t.subject}</p><Pill tone={t.requiresApproval ? 'amber' : 'emerald'}>{t.requiresApproval ? 'approval' : 'direct'}</Pill></div>)}</Card>; }
function AutomationView() { return <Card title="Automation binding plan" icon={Zap}><p className="text-slate-300">Use this route to bind scheduled sync, inbound webhook handling, classification and escalation rules once provider credentials are present.</p></Card>; }
function AuditView({ audit }: { audit: EmailAuditLog[] }) { return <Card title="Audit trail" icon={Shield}>{audit.map(a => <div key={a.id} className="mb-2 rounded-2xl border border-slate-700 bg-[#08111f] p-3 text-sm"><b className="text-white">{a.action}</b><span className="ml-2 text-slate-400">{a.actor} · {a.result} · {new Date(a.createdAt).toLocaleString()}</span></div>)}</Card>; }
function ApprovalsView({ drafts, queueDraft }: { drafts: EmailDraft[]; queueDraft: (id: string) => void }) { return <Card title="Approval queue" icon={Lock}>{drafts.filter(d => d.status === 'approval_required').map(d => <DraftLine key={d.id} draft={d} queueDraft={queueDraft} />)}</Card>; }
function OutboxView({ drafts, queueDraft }: { drafts: EmailDraft[]; queueDraft: (id: string) => void }) { return <Card title="Outbox and drafts" icon={Send}>{drafts.length ? drafts.map(d => <DraftLine key={d.id} draft={d} queueDraft={queueDraft} />) : <p className="text-slate-400">No drafts yet. Use Composer to save one through the API.</p>}</Card>; }
function RightRail({ snapshot }: { snapshot: EmailOsSnapshot }) { return <aside className="space-y-4"><Card title="Live API pulse" icon={ActivityIcon}><div className="space-y-2 text-sm text-emerald-200"><p>Bootstrap: ready</p><p>Store: JSON fallback or Supabase</p><p>Audit events: {snapshot.audit.length}</p><p>Queue jobs: {snapshot.queue.length}</p></div></Card><Card title="Production boundary" icon={Shield}><p className="text-sm leading-6 text-amber-100">This does not fake external delivery. Gmail/Microsoft/SMTP credentials must be added to env before provider adapters can send/receive real mail.</p></Card></aside>; }
function ThreadLine({ thread }: { thread: EmailThread }) { return <div><div className="flex flex-wrap gap-2"><h4 className="font-black text-white">{thread.subject}</h4><Pill tone={thread.priority === 'critical' ? 'rose' : thread.priority === 'high' ? 'amber' : 'cyan'}>{thread.priority}</Pill><Pill tone="slate">{thread.status}</Pill></div><p className="mt-1 text-sm text-slate-300">{thread.fromName} · {thread.clientName} · SLA {thread.slaMinutesLeft} min</p><p className="mt-1 text-xs text-slate-400">{thread.lastMessage}</p></div>; }
function QueueLine({ job }: { job: EmailQueueJob }) { return <div className="mb-3 rounded-2xl border border-slate-700 bg-[#08111f] p-4"><div className="flex justify-between"><b className="text-white">{job.type}</b><Pill tone={job.state === 'failed' ? 'rose' : job.state === 'completed' ? 'emerald' : 'amber'}>{job.state}</Pill></div><p className="text-sm text-slate-400">{job.id} · retry {job.retryCount} · {job.lastError || 'No error'}</p></div>; }
function DraftLine({ draft, queueDraft }: { draft: EmailDraft; queueDraft: (id: string) => void }) { return <div className="mb-3 rounded-2xl border border-slate-700 bg-[#08111f] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><b className="text-white">{draft.subject}</b><p className="text-sm text-slate-400">{draft.to} · {draft.status}</p>{draft.approvalReason ? <p className="mt-1 text-xs text-amber-200">{draft.approvalReason}</p> : null}</div><Button icon={Send} tone="emerald" onClick={() => queueDraft(draft.id)}>Queue</Button></div></div>; }
function ActivityIcon(props: any) { return <Gauge {...props} />; }
