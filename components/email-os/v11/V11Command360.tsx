'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Archive, BarChart3, Command, FileText, Inbox, LockKeyhole, MailPlus, RefreshCcw, Search, Send, Server, ShieldCheck, Sparkles, Terminal, Users } from 'lucide-react';

type Pulse = {
  mailboxes: number;
  queued: number;
  failed: number;
  approvals: number;
  threads: number;
  health: string;
  events: string[];
};

const nav = [
  { label: 'Inbox', path: '/email-os/inbox', icon: Inbox },
  { label: 'Threads', path: '/email-os/threads', icon: Activity },
  { label: 'Composer', path: '/email-os/composer', icon: MailPlus },
  { label: 'Outbox', path: '/email-os/outbox', icon: Send },
  { label: 'Files', path: '/email-os/files', icon: FileText },
  { label: 'Servers', path: '/email-os/mailboxes', icon: Server },
  { label: 'Access', path: '/email-os/access', icon: LockKeyhole },
  { label: 'Analytics', path: '/email-os/analytics', icon: BarChart3 },
  { label: 'Engine', path: '/email-os/engine', icon: Terminal },
  { label: 'Settings', path: '/email-os/settings', icon: ShieldCheck },
];

const actions = [
  { key: 'sync_imap', label: 'Sync IMAP', tone: 'cyan' },
  { key: 'process_queue', label: 'Process Queue', tone: 'emerald' },
  { key: 'retry_failed', label: 'Retry Failed', tone: 'amber' },
  { key: 'health_scan', label: 'Health Scan', tone: 'violet' },
  { key: 'export_audit', label: 'Export Audit', tone: 'slate' },
  { key: 'lock_sensitive', label: 'Lock Sensitive', tone: 'rose' },
];

export default function V11Command360() {
  const router = useRouter();
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  async function loadPulse() {
    const res = await fetch('/api/email-os/v11/pulse', { cache: 'no-store' });
    const data = await res.json();
    setPulse(data);
  }

  async function runAction(action_key: string) {
    setBusy(action_key);
    try {
      await fetch('/api/email-os/v11/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_key, payload: { source: 'v11_command_360' } }),
      });
      await loadPulse();
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    loadPulse();
    const t = setInterval(loadPulse, 12000);
    return () => clearInterval(t);
  }, []);

  const filteredNav = useMemo(() => {
    if (!query.trim()) return nav;
    return nav.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  return (
    <main className="min-h-screen bg-[#050814] text-white p-6">
      <section className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-slate-950 to-violet-500/10 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3 text-cyan-300 text-sm uppercase tracking-[0.25em]"><Command className="h-4 w-4" /> Email OS V11</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight">360° Communication Control Layer</h1>
            <p className="mt-2 max-w-3xl text-slate-300">Additive command layer built on your working V9/V10 routes. It does not replace your pages — it gives users faster navigation, action control, pulse monitoring, and manager-grade oversight.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={loadPulse} className="rounded-2xl border border-cyan-400/30 px-4 py-3 text-cyan-200 hover:bg-cyan-400/10"><RefreshCcw className="mr-2 inline h-4 w-4" />Refresh</button>
            <button onClick={() => router.push('/email-os/composer')} className="rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-200"><MailPlus className="mr-2 inline h-4 w-4" />Compose</button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {[
            ['Mailboxes', pulse?.mailboxes ?? 0],
            ['Queued', pulse?.queued ?? 0],
            ['Failed', pulse?.failed ?? 0],
            ['Approvals', pulse?.approvals ?? 0],
            ['Threads', pulse?.threads ?? 0],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-widest text-slate-400">{k}</div>
              <div className="mt-2 text-3xl font-black">{v}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Navigation Command Grid</h2>
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-300">
              <Search className="h-4 w-4" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Jump to page..." className="bg-transparent outline-none" />
            </label>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.path} onClick={() => router.push(item.path)} className="group rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-5 text-left hover:border-cyan-300/50 hover:bg-cyan-300/10">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200"><Icon className="h-5 w-5" /></div>
                    <span className="text-xs text-slate-500 group-hover:text-cyan-200">OPEN</span>
                  </div>
                  <div className="text-lg font-bold">{item.label}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.path}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-emerald-400/20 bg-black p-5 shadow-2xl shadow-emerald-950/40">
          <div className="flex items-center gap-2 text-emerald-300"><Terminal className="h-4 w-4" /><h2 className="font-bold">Live Pulse Console</h2></div>
          <pre className="mt-4 min-h-[330px] whitespace-pre-wrap rounded-2xl border border-emerald-400/10 bg-emerald-950/10 p-4 font-mono text-xs leading-6 text-emerald-200">
{(pulse?.events?.length ? pulse.events : ['Standing by...', 'Waiting for telemetry...']).join('\n')}
          </pre>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-slate-950/80 p-5">
        <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-cyan-300" /><h2 className="text-xl font-bold">Human-Controlled Execution Actions</h2></div>
        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {actions.map((a) => (
            <button key={a.key} disabled={busy === a.key} onClick={() => runAction(a.key)} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 disabled:opacity-60">
              <div className="text-sm font-bold">{busy === a.key ? 'Running...' : a.label}</div>
              <div className="mt-1 text-xs text-slate-400">Logged + available for engine hooks</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><Users className="h-5 w-5 text-cyan-300" /><h3 className="mt-3 font-bold">Manager Control</h3><p className="mt-2 text-sm text-slate-400">Saved views, thread notes, queue focus, and action logs for supervised operations.</p></div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><Archive className="h-5 w-5 text-cyan-300" /><h3 className="mt-3 font-bold">Attachment Context</h3><p className="mt-2 text-sm text-slate-400">Links threads to files, revenue records, support cases, or partner dossiers.</p></div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><ShieldCheck className="h-5 w-5 text-cyan-300" /><h3 className="mt-3 font-bold">No Autopilot</h3><p className="mt-2 text-sm text-slate-400">Actions are controlled, visible, logged, and manager-driven. No hidden autonomous behavior.</p></div>
      </section>
    </main>
  );
}
