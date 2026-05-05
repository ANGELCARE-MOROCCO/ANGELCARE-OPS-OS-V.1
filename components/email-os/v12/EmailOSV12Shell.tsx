'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Activity, Archive, BarChart3, Bell, Briefcase, Building2, CheckCircle2, ChevronRight,
  Clock, Command, Database, Eye, FileText, Gauge, Inbox, KeyRound, Layers, Mail,
  MessageSquare, Network, Plus, RefreshCw, Search, Send, Server, Shield, Sparkles,
  Target, UserCog, Users, Zap
} from 'lucide-react';

export type V12Mode = 'command' | 'inbox' | 'threads' | 'composer' | 'access' | 'engine' | 'analytics';

const nav = [
  { label: 'V12 Command', href: '/email-os/v12', icon: Command, tag: '360' },
  { label: 'Super Inbox', href: '/email-os/inbox/v12', icon: Inbox, tag: 'OPS' },
  { label: 'Threads', href: '/email-os/threads/v12', icon: MessageSquare, tag: 'CTX' },
  { label: 'Composer', href: '/email-os/composer/v12', icon: Send, tag: 'SEND' },
  { label: 'Access Matrix', href: '/email-os/access/v12', icon: UserCog, tag: 'CEO' },
  { label: 'Engine Center', href: '/email-os/engine/v12', icon: Server, tag: 'RUN' },
  { label: 'Analytics', href: '/email-os/analytics/v12', icon: BarChart3, tag: 'BI' },
];

const stats = [
  { label: 'Active mailboxes', value: '13', icon: Mail },
  { label: 'Pending actions', value: '42', icon: Clock },
  { label: 'Revenue links', value: '128', icon: Briefcase },
  { label: 'Health score', value: '96%', icon: Gauge },
];

const operations = [
  'Bulk assign selected conversations', 'Link thread to deal / prospect / partner', 'Create internal notes',
  'Open revenue context', 'Retry failed messages', 'Inspect mailbox health', 'Apply user mailbox access',
  'Create follow-up from email', 'Send from correct mailbox', 'Save custom inbox view', 'Export audit trail',
  'Monitor failed SMTP/IMAP events'
];

export function EmailOSV12Shell({ mode = 'command' }: { mode?: V12Mode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [selectedMailbox, setSelectedMailbox] = useState('Operations');

  const title = useMemo(() => {
    const found = nav.find((n) => pathname?.startsWith(n.href));
    return found?.label || 'V12 Command';
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.12),transparent_32%)]" />
      <div className="relative flex min-h-screen">
        <aside className="w-80 border-r border-cyan-400/20 bg-slate-950/80 backdrop-blur-xl p-5 hidden xl:block">
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5 shadow-2xl shadow-cyan-950/40">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-300/20 p-3"><Network className="h-7 w-7 text-cyan-200" /></div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">AngelCare</p>
                <h1 className="text-xl font-black">Email OS V12</h1>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-300">Revenue-linked communication command layer with user access control, saved views, notes, engine monitoring and execution depth.</p>
          </div>

          <nav className="mt-6 space-y-2">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <button key={item.href} onClick={() => router.push(item.href)} className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-cyan-300 bg-cyan-300/15 shadow-lg shadow-cyan-950/40' : 'border-slate-700/60 bg-slate-900/60 hover:border-cyan-400/40 hover:bg-slate-800/80'}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-3"><Icon className="h-5 w-5 text-cyan-200" /> <span className="font-semibold">{item.label}</span></span>
                    <span className="rounded-full border border-cyan-300/30 px-2 py-1 text-[10px] text-cyan-100">{item.tag}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <header className="rounded-[2rem] border border-slate-700/70 bg-slate-900/70 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">Maximum integration layer</p>
                <h2 className="mt-2 text-3xl md:text-5xl font-black tracking-tight">{title}</h2>
                <p className="mt-2 max-w-3xl text-slate-300">360° operations layer connected to mailboxes, users, revenue records, internal notes, saved views, composer actions and engine monitoring.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select value={selectedMailbox} onChange={(e) => setSelectedMailbox(e.target.value)} className="rounded-2xl border border-cyan-300/30 bg-slate-950 px-4 py-3 text-sm">
                  {['Operations','CEO Office','Billing','HR','Incident','Family Support','Caregiver','Academy','Marketing','Sales','Legal','Partnerships','General'].map(m => <option key={m}>{m}</option>)}
                </select>
                <button className="rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-200"><Plus className="mr-2 inline h-4 w-4" />New action</button>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search thread, mailbox, deal, contact, note, failure log..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500" />
            </div>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return <div key={s.label} className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
                <div className="flex items-center justify-between"><Icon className="h-6 w-6 text-emerald-300" /><Activity className="h-4 w-4 animate-pulse text-cyan-300" /></div>
                <div className="mt-4 text-3xl font-black">{s.value}</div>
                <div className="mt-1 text-sm text-slate-400">{s.label}</div>
              </div>
            })}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-[2rem] border border-slate-700/70 bg-slate-900/70 p-5">
              {mode === 'command' && <CommandDashboard />}
              {mode === 'inbox' && <SuperInbox />}
              {mode === 'threads' && <ThreadControl />}
              {mode === 'composer' && <ComposerControl />}
              {mode === 'access' && <AccessMatrix />}
              {mode === 'engine' && <EngineCenter />}
              {mode === 'analytics' && <AnalyticsCenter />}
            </div>
            <aside className="space-y-4">
              <div className="rounded-[2rem] border border-emerald-400/30 bg-black p-5 font-mono shadow-2xl shadow-emerald-950/40">
                <div className="mb-4 flex items-center justify-between text-emerald-300"><span>LIVE PULSE</span><RefreshCw className="h-4 w-4 animate-spin" /></div>
                {['SMTP route armed', 'IMAP signal nominal', 'Revenue linker active', 'Access matrix synced', 'Bulk engine standing by'].map((line, i) => (
                  <div key={line} className="mb-2 text-sm text-emerald-300">[{String(i + 1).padStart(2, '0')}] {line}<span className="animate-pulse"> _</span></div>
                ))}
              </div>
              <div className="rounded-[2rem] border border-slate-700/70 bg-slate-900/70 p-5">
                <h3 className="text-lg font-black">V12 action stack</h3>
                <div className="mt-4 space-y-2">
                  {operations.map((op) => <div key={op} className="flex items-center gap-2 rounded-2xl border border-slate-700/60 bg-slate-950/50 p-3 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-300" />{op}</div>)}
                </div>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, desc }: any) { return <div className="mb-5 flex items-start gap-3"><div className="rounded-2xl bg-cyan-300/15 p-3"><Icon className="h-6 w-6 text-cyan-200" /></div><div><h3 className="text-2xl font-black">{title}</h3><p className="text-sm text-slate-400">{desc}</p></div></div> }
function ActionButton({ children }: any) { return <button className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-300 hover:text-slate-950">{children}</button> }

function CommandDashboard() { return <><SectionTitle icon={Sparkles} title="360° Command Surface" desc="Single-page operational view for communication, users, revenue links and engine state." /><div className="grid gap-4 md:grid-cols-2"><Panel title="Revenue integration" items={['Link thread to prospect/deal', 'Create follow-up from message', 'Open revenue timeline', 'Attach communication proof']} /><Panel title="Operations control" items={['Saved inbox views', 'Bulk assignment actions', 'Internal note layer', 'Unresolved board']} /><Panel title="Governance" items={['User x mailbox matrix', 'Temporary access', 'Restricted mailbox warning', 'Access audit']} /><Panel title="Engine monitoring" items={['Failed send monitoring', 'Retry queue', 'SMTP/IMAP history', 'Mailbox risk panel']} /></div></> }
function SuperInbox() { return <><SectionTitle icon={Inbox} title="Super Inbox V12" desc="Saved views, bulk operations and mailbox workload controls." /><div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr_1fr]"><Panel title="Saved views" items={['Executive unresolved', 'Revenue linked', 'Failed/retry', 'My assigned']} /><Panel title="Message operations" items={['Select conversations', 'Bulk assign', 'Bulk archive', 'Bulk tag', 'Create note']} /><Panel title="Preview controls" items={['Open thread dossier', 'Link to deal', 'Create follow-up', 'Send reply']} /></div></> }
function ThreadControl() { return <><SectionTitle icon={MessageSquare} title="Thread Control Dossier" desc="Conversation timeline with internal notes and linked business context." /><Panel title="Thread dossier actions" items={['Add internal note', 'Link to revenue record', 'Attach partner/campaign', 'Assign owner', 'Mark unresolved/resolved', 'Open full timeline']} /></> }
function ComposerControl() { return <><SectionTitle icon={Send} title="Composer V12" desc="Context-aware composer with preview, templates, links and governance checks." /><Panel title="Composer production controls" items={['Mailbox identity', 'CC/BCC', 'Template variables', 'Live preview', 'Attachment placeholder', 'Revenue context link', 'Approval warning', 'Queue/send action']} /></> }
function AccessMatrix() { return <><SectionTitle icon={Shield} title="CEO Access Matrix" desc="Visual governance layer for users, departments and 13 mailboxes." /><Panel title="Access controls" items={['Read toggle', 'Send toggle', 'Approve toggle', 'Assign toggle', 'Apply by role', 'Temporary access', 'Audit trail']} /></> }
function EngineCenter() { return <><SectionTitle icon={Server} title="Engine Monitoring Center" desc="Queue, retry, health and event logs in one control surface." /><Panel title="Engine controls" items={['Process queue', 'Retry failed', 'Inspect mailbox health', 'View SMTP events', 'View IMAP events', 'Export engine logs']} /></> }
function AnalyticsCenter() { return <><SectionTitle icon={BarChart3} title="Communication Analytics" desc="Performance and volume intelligence for company communications." /><Panel title="Analytics dimensions" items={['Send success rate', 'Response volume', 'Mailbox load', 'Agent activity', 'Revenue-linked communication', 'Failure % by mailbox']} /></> }
function Panel({ title, items }: { title: string; items: string[] }) { return <div className="rounded-3xl border border-slate-700/70 bg-slate-950/60 p-5"><h4 className="text-lg font-black">{title}</h4><div className="mt-4 space-y-2">{items.map(i => <div key={i} className="flex items-center justify-between rounded-2xl bg-slate-900/70 p-3 text-sm"><span className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-cyan-300" />{i}</span><ActionButton>Run</ActionButton></div>)}</div></div> }
