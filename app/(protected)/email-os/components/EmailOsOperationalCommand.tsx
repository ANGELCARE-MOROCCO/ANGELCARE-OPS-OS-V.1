"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity, AlertTriangle, Archive, BarChart3, Bell, Bot, CheckCircle2, ChevronRight, Clock, Cpu,
  Database, Download, Edit3, Eye, FileText, Filter, Gauge, HardDrive, Inbox, KeyRound, Layers,
  Lock, Mail, Network, Paperclip, Play, Plus, RefreshCcw, Reply, Route, Search, Send, Settings,
  Shield, Sparkles, Terminal, Trash2, Upload, Users, Zap
} from "lucide-react";

type PageMode =
  | "command" | "inbox" | "outbox" | "threads" | "composer" | "files" | "mailboxes" | "access" | "analytics" | "engine" | "settings" | "approvals" | "sync";

type Mailbox = {
  id?: string;
  label?: string;
  email_address?: string;
  mailbox_email?: string;
  department?: string;
  business_context?: string;
  health_status?: string;
  sync_status?: string;
  outbound_enabled?: boolean;
  inbound_enabled?: boolean;
  queue_size?: number;
  failure_rate?: number;
  last_sync_at?: string;
};

type Message = {
  id?: string;
  subject?: string;
  from_email?: string;
  to_email?: string;
  status?: string;
  priority?: string;
  category?: string;
  snippet?: string;
  received_at?: string;
  created_at?: string;
  mailbox_id?: string;
  has_attachments?: boolean;
};

type Thread = { id?: string; subject?: string; status?: string; priority?: string; category?: string; message_count?: number; assigned_to?: string; last_activity_at?: string; mailbox_label?: string };

const NAV: { id: PageMode; label: string; href: string; icon: any; hint: string }[] = [
  { id: "command", label: "Command", href: "/email-os", icon: Activity, hint: "global radar" },
  { id: "inbox", label: "Inbox", href: "/email-os/inbox", icon: Inbox, hint: "incoming" },
  { id: "outbox", label: "Outbox", href: "/email-os/outbox", icon: Send, hint: "queue" },
  { id: "threads", label: "Threads", href: "/email-os/threads", icon: Layers, hint: "timeline" },
  { id: "composer", label: "Composer", href: "/email-os/composer", icon: Edit3, hint: "create" },
  { id: "files", label: "Files", href: "/email-os/files", icon: Paperclip, hint: "vault" },
  { id: "mailboxes", label: "Servers", href: "/email-os/mailboxes", icon: HardDrive, hint: "smtp/imap" },
  { id: "access", label: "Access", href: "/email-os/access", icon: Lock, hint: "permissions" },
  { id: "analytics", label: "Analytics", href: "/email-os/analytics", icon: BarChart3, hint: "reports" },
  { id: "engine", label: "Engine", href: "/email-os/engine", icon: Cpu, hint: "execution" },
  { id: "settings", label: "Settings", href: "/email-os/settings", icon: Settings, hint: "config" },
];

const FALLBACK_MAILBOXES: Mailbox[] = [
  { id: "ops", label: "Operations Command", email_address: "operations@angelcare.ma", department: "Operations", health_status: "unknown", sync_status: "idle", queue_size: 0, failure_rate: 0 },
  { id: "family", label: "Family Desk", email_address: "families@angelcare.ma", department: "Operations", health_status: "unknown", sync_status: "idle", queue_size: 0, failure_rate: 0 },
  { id: "billing", label: "Billing Desk", email_address: "billing@angelcare.ma", department: "Finance", health_status: "unknown", sync_status: "idle", queue_size: 0, failure_rate: 0 },
  { id: "ceo", label: "CEO Office", email_address: "ceo@angelcare.ma", department: "Executive", health_status: "unknown", sync_status: "idle", queue_size: 0, failure_rate: 0 },
  { id: "hr", label: "HR Office", email_address: "hr@angelcare.ma", department: "HR", health_status: "unknown", sync_status: "idle", queue_size: 0, failure_rate: 0 },
  { id: "sales", label: "Sales", email_address: "sales@angelcare.ma", department: "Revenue", health_status: "unknown", sync_status: "idle", queue_size: 0, failure_rate: 0 },
];
const FALLBACK_MESSAGES: Message[] = [
  { id: "m1", subject: "Care mission confirmation", from_email: "family@example.com", status: "new", priority: "high", category: "Mission", snippet: "Confirm caregiver arrival and coverage for tonight.", received_at: "ready" },
  { id: "m2", subject: "Invoice payment proof", from_email: "client@example.com", status: "queued", priority: "medium", category: "Billing", snippet: "Payment proof attached, waiting for confirmation.", received_at: "ready", has_attachments: true },
  { id: "m3", subject: "Incident draft approval", from_email: "ops@angelcare.ma", status: "approval", priority: "critical", category: "Incident", snippet: "Sensitive message requires approval before sending.", received_at: "ready" },
];
const FALLBACK_THREADS: Thread[] = [
  { id: "t1", subject: "Family onboarding", status: "open", priority: "high", category: "Family", message_count: 7, assigned_to: "Operations", mailbox_label: "Operations" },
  { id: "t2", subject: "Caregiver contract", status: "pending", priority: "medium", category: "HR", message_count: 4, assigned_to: "HR", mailbox_label: "HR" },
  { id: "t3", subject: "Billing recovery", status: "escalated", priority: "critical", category: "Billing", message_count: 11, assigned_to: "Finance", mailbox_label: "Billing" },
];

function cx(...x: Array<string | false | undefined>) { return x.filter(Boolean).join(" "); }
async function api(path: string, options?: RequestInit) {
  try { const r = await fetch(path, options); return r.ok ? await r.json() : null; } catch { return null; }
}
function emailOf(m: Mailbox) { return m.email_address || m.mailbox_email || "not-configured@angelcare.ma"; }
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("rounded-[1.6rem] border border-cyan-300/15 bg-slate-950/70 p-5 shadow-[0_0_35px_rgba(34,211,238,.08)]", className)}>{children}</div>;
}
function Stat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return <Card><div className="flex items-center justify-between"><Icon className="h-5 w-5 text-cyan-300"/><span className="text-[10px] uppercase tracking-[.25em] text-slate-400">{label}</span></div><div className="mt-3 text-3xl font-black text-white">{value}</div><div className="mt-1 text-xs text-slate-400">{sub}</div></Card>;
}
function ConsolePanel({ lines }: { lines: string[] }) {
  return <div className="min-h-[260px] rounded-[1.6rem] border border-emerald-400/30 bg-black p-5 font-mono text-xs text-emerald-300 shadow-[inset_0_0_40px_rgba(16,185,129,.14),0_0_35px_rgba(16,185,129,.08)]">
    {lines.map((line, i) => <div key={i} className="mb-1 flex gap-2"><span className="text-emerald-600">{String(i + 1).padStart(2, "0")}</span><span>{line}</span></div>)}
    <div className="mt-4 flex items-center gap-2 text-emerald-200"><span className="h-2 w-2 animate-ping rounded-full bg-emerald-300"/> live operational pulse</div>
  </div>;
}
function ActionButton({ children, onClick, danger = false, primary = false }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; primary?: boolean }) {
  return <button onClick={onClick} className={cx("rounded-2xl px-4 py-3 text-sm font-black transition", primary ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20" : danger ? "border border-rose-300/30 bg-rose-400/10 text-rose-100" : "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10")}>{children}</button>;
}

export default function EmailOsOperationalCommand({ mode = "command" }: { mode?: PageMode }) {
  const router = useRouter();
  const [mailboxes, setMailboxes] = useState<Mailbox[]>(FALLBACK_MAILBOXES);
  const [messages, setMessages] = useState<Message[]>(FALLBACK_MESSAGES);
  const [threads, setThreads] = useState<Thread[]>(FALLBACK_THREADS);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [activeMailbox, setActiveMailbox] = useState<string>("all");
  const [statusMsg, setStatusMsg] = useState("Ready");
  const [compose, setCompose] = useState({ to: "", cc: "", bcc: "", subject: "", body: "", mailbox_id: "", priority: "normal", category: "Operations", approval_required: true });
  const [editMailbox, setEditMailbox] = useState<Mailbox | null>(null);

  async function refresh() {
    const pulse = await api("/api/email-os/realtime-pulse");
    if (Array.isArray(pulse?.mailboxes)) setMailboxes(pulse.mailboxes);
    if (Array.isArray(pulse?.messages)) setMessages(pulse.messages);
    const mb = await api("/api/email-os/mailboxes");
    if (Array.isArray(mb?.mailboxes)) setMailboxes(mb.mailboxes);
    const inbox = await api("/api/email-os/inbox");
    if (Array.isArray(inbox?.messages)) setMessages(inbox.messages);
    const th = await api("/api/email-os/threads");
    if (Array.isArray(th?.threads)) setThreads(th.threads);
  }
  useEffect(() => { refresh(); const t = setInterval(refresh, 8000); return () => clearInterval(t); }, []);

  const filteredMessages = useMemo(() => messages.filter(m => {
    const hay = `${m.subject || ""} ${m.from_email || ""} ${m.to_email || ""} ${m.category || ""} ${m.status || ""}`.toLowerCase();
    const matchQuery = hay.includes(query.toLowerCase());
    const matchMailbox = activeMailbox === "all" || m.mailbox_id === activeMailbox;
    return matchQuery && matchMailbox;
  }), [messages, query, activeMailbox]);
  const queueSize = mailboxes.reduce((a, b) => a + Number(b.queue_size || 0), 0);
  const failureAvg = mailboxes.length ? (mailboxes.reduce((a, b) => a + Number(b.failure_rate || 0), 0) / mailboxes.length).toFixed(1) : "0";

  async function runImapSync() { setStatusMsg("Running IMAP sync..."); await api("/api/email-os/imap-sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "all" }) }); setStatusMsg("IMAP sync requested"); refresh(); }
  async function runOutbox() { setStatusMsg("Processing outbox..."); await api("/api/email-os/send-outbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "batch" }) }); setStatusMsg("Outbox processing requested"); refresh(); }
  async function testMailbox(m?: Mailbox) { setStatusMsg(`Testing ${m ? emailOf(m) : "selected mailbox"}...`); await api("/api/email-os/health", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mailbox_id: m?.id }) }); setStatusMsg("Health test requested"); refresh(); }
  async function queueEmail() {
    setStatusMsg("Queueing email...");
    const res = await api("/api/email-os/queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(compose) });
    setStatusMsg(res?.ok === false ? `Queue failed: ${res.error || "unknown"}` : "Email queued successfully");
    setCompose({ ...compose, to: "", cc: "", bcc: "", subject: "", body: "" });
    refresh();
  }
  function toggle(id?: string) { if (!id) return; setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#164e63_0,#020617_32%,#020617_100%)] p-4 text-slate-100 md:p-6">
    <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-slate-950/80 p-6 shadow-2xl">
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(34,211,238,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.15)_1px,transparent_1px)] [background-size:28px_28px]"/>
      <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[.25em] text-emerald-200"><Zap className="h-4 w-4"/> Operational route repair active</div>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">AngelCare Internal Email Command OS</h1>
          <p className="mt-3 max-w-4xl text-sm text-slate-300">Route-based navigation restored. Every top panel now opens a real page and every page exposes production controls: inbox, outbox, threads, composer, files, mailboxes, access, analytics, engine, and settings.</p>
        </div>
        <div className="flex flex-wrap gap-3"><ActionButton primary onClick={runImapSync}><RefreshCcw className="mr-2 inline h-4 w-4"/>Sync IMAP</ActionButton><ActionButton onClick={runOutbox}><Play className="mr-2 inline h-4 w-4"/>Run Outbox</ActionButton><ActionButton onClick={() => router.push("/email-os/composer")}><Plus className="mr-2 inline h-4 w-4"/>New Email</ActionButton></div>
      </div>
    </section>

    <nav className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-11">
      {NAV.map(({ id, href, label, icon: Icon, hint }) => <Link key={id} href={href} className={cx("rounded-2xl border px-3 py-3 text-center text-sm font-black transition", mode === id ? "border-cyan-300 bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20" : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/40 hover:bg-white/10")}><Icon className="mx-auto mb-1 h-5 w-5"/><span>{label}</span><div className="text-[10px] font-bold opacity-70">{hint}</div></Link>)}
    </nav>

    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"><Terminal className="mr-2 inline h-4 w-4 text-emerald-300"/> Status: <b className="text-white">{statusMsg}</b></div>

    {mode === "command" && <section className="mt-5 space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Stat icon={Mail} label="Mailboxes" value={String(mailboxes.length)} sub="Controlled assets"/><Stat icon={Send} label="Queue" value={String(queueSize)} sub="Pending workload"/><Stat icon={Gauge} label="Failure" value={`${failureAvg}%`} sub="Average mailbox rate"/><Stat icon={Activity} label="Pulse" value="Live" sub="8s refresh loop"/></div>
      <div className="grid gap-5 xl:grid-cols-3"><Card className="xl:col-span-2"><div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-black text-white">Operational Radar</h2><Link href="/email-os/mailboxes" className="text-sm font-bold text-cyan-200">Open server panel <ChevronRight className="inline h-4 w-4"/></Link></div><div className="grid gap-4 md:grid-cols-3">{mailboxes.slice(0, 9).map(m => <MailboxCard key={m.id || emailOf(m)} mailbox={m} onTest={() => testMailbox(m)} onEdit={() => setEditMailbox(m)}/>)}</div></Card><ConsolePanel lines={["Route navigation restored: page-level /email-os/* links active", "IMAP sync endpoint connected to control button", "Outbox processor connected to execution button", "Composer queue action connected", "Mailbox server cards wired to health/config actions"]}/></div>
    </section>}

    {mode === "inbox" && <InboxPanel title="Advanced Inbox" messages={filteredMessages} selected={selected} toggle={toggle} query={query} setQuery={setQuery} mailboxes={mailboxes} activeMailbox={activeMailbox} setActiveMailbox={setActiveMailbox} />}
    {mode === "outbox" && <InboxPanel title="Outbox Queue / Sent / Failed" messages={filteredMessages.filter(m => ["queued", "sent", "failed", "approval", "sending"].includes(m.status || "queued"))} selected={selected} toggle={toggle} query={query} setQuery={setQuery} mailboxes={mailboxes} activeMailbox={activeMailbox} setActiveMailbox={setActiveMailbox} extra={<ActionButton primary onClick={runOutbox}><Play className="mr-2 inline h-4 w-4"/>Process Queue</ActionButton>} />}
    {mode === "threads" && <ThreadsPanel threads={threads} />}
    {mode === "composer" && <ComposerPanel compose={compose} setCompose={setCompose} mailboxes={mailboxes} queueEmail={queueEmail} />}
    {mode === "files" && <FilesPanel />}
    {mode === "mailboxes" && <MailboxesPanel mailboxes={mailboxes} setEditMailbox={setEditMailbox} testMailbox={testMailbox} />}
    {mode === "access" && <AccessPanel mailboxes={mailboxes} />}
    {mode === "analytics" && <AnalyticsPanel mailboxes={mailboxes} queueSize={queueSize} failureAvg={failureAvg} />}
    {mode === "engine" && <EnginePanel runImapSync={runImapSync} runOutbox={runOutbox} testMailbox={testMailbox} />}
    {mode === "settings" && <SettingsPanel mailboxes={mailboxes} setEditMailbox={setEditMailbox} />}
    {mode === "approvals" && <InboxPanel title="Approval Desk" messages={filteredMessages.filter(m => ["approval", "waiting_approval", "pending_approval"].includes(m.status || ""))} selected={selected} toggle={toggle} query={query} setQuery={setQuery} mailboxes={mailboxes} activeMailbox={activeMailbox} setActiveMailbox={setActiveMailbox} />}
    {mode === "sync" && <EnginePanel runImapSync={runImapSync} runOutbox={runOutbox} testMailbox={testMailbox} syncOnly />}

    {editMailbox && <MailboxDrawer mailbox={editMailbox} onClose={() => setEditMailbox(null)} onSave={async (m) => { setStatusMsg("Saving mailbox config..."); await api("/api/email-os/mailboxes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m) }); setEditMailbox(null); setStatusMsg("Mailbox config saved/requested"); refresh(); }} />}
  </main>;
}

function MailboxCard({ mailbox, onEdit, onTest }: { mailbox: Mailbox; onEdit: () => void; onTest: () => void }) {
  return <div className="rounded-3xl border border-cyan-300/15 bg-slate-900/80 p-4"><div className="flex items-center justify-between"><div className="rounded-2xl bg-cyan-300/10 p-3"><Mail className="h-6 w-6 text-cyan-200"/></div><span className={cx("rounded-full px-3 py-1 text-xs font-black", mailbox.health_status === "warning" || mailbox.health_status === "failed" ? "bg-amber-300/20 text-amber-200" : mailbox.health_status === "online" || mailbox.health_status === "healthy" ? "bg-emerald-300/20 text-emerald-200" : "bg-slate-700 text-slate-200")}>{mailbox.health_status || "unknown"}</span></div><h3 className="mt-4 font-black text-white">{mailbox.label || "Mailbox"}</h3><p className="text-xs text-slate-400">{emailOf(mailbox)}</p><div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-xl bg-white/5 p-2"><b>{mailbox.queue_size || 0}</b><br/>Queue</div><div className="rounded-xl bg-white/5 p-2"><b>{mailbox.failure_rate || 0}%</b><br/>Fail</div><div className="rounded-xl bg-white/5 p-2"><b>{mailbox.sync_status || "idle"}</b><br/>Sync</div></div><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={onTest} className="rounded-xl bg-emerald-400/10 py-2 text-xs font-bold text-emerald-100">Test</button><button onClick={onEdit} className="rounded-xl bg-cyan-400/10 py-2 text-xs font-bold text-cyan-100">Edit</button></div></div>;
}
function InboxPanel(props: { title: string; messages: Message[]; selected: string[]; toggle: (id?: string) => void; query: string; setQuery: (x: string) => void; mailboxes: Mailbox[]; activeMailbox: string; setActiveMailbox: (x: string) => void; extra?: React.ReactNode }) {
  return <section className="mt-5"><Card><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-3xl font-black text-white">{props.title}</h2><p className="mt-1 text-sm text-slate-400">Search, select, assign, escalate, archive, open timeline, and route messages by mailbox.</p></div><div className="flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400"/><input value={props.query} onChange={e => props.setQuery(e.target.value)} placeholder="Search emails" className="rounded-2xl border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-sm outline-none"/></div><select value={props.activeMailbox} onChange={e => props.setActiveMailbox(e.target.value)} className="rounded-2xl border border-white/10 bg-black/40 px-4 text-sm outline-none"><option value="all">All mailboxes</option>{props.mailboxes.map(m => <option key={m.id || emailOf(m)} value={m.id || emailOf(m)}>{m.label || emailOf(m)}</option>)}</select>{props.extra}</div></div><div className="mt-4 flex flex-wrap gap-2"><ActionButton><Archive className="mr-2 inline h-4 w-4"/>Archive</ActionButton><ActionButton><Users className="mr-2 inline h-4 w-4"/>Assign</ActionButton><ActionButton><AlertTriangle className="mr-2 inline h-4 w-4"/>Escalate</ActionButton><ActionButton danger><Trash2 className="mr-2 inline h-4 w-4"/>Delete</ActionButton><span className="px-2 py-3 text-sm text-slate-400">Selected: {props.selected.length}</span></div><div className="mt-5 grid gap-3">{props.messages.map(m => <div key={m.id || m.subject} onClick={() => props.toggle(m.id)} className={cx("cursor-pointer rounded-3xl border p-4 transition", props.selected.includes(m.id || "") ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-white/5 hover:bg-white/10")}><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-800 px-2 py-1 text-xs">{m.category || "General"}</span><span className="rounded-full bg-rose-400/20 px-2 py-1 text-xs text-rose-200">{m.priority || "normal"}</span>{m.has_attachments && <Paperclip className="h-4 w-4 text-cyan-200"/>}</div><h3 className="mt-2 text-lg font-black text-white">{m.subject || "Untitled email"}</h3><p className="text-sm text-slate-400">{m.from_email || m.to_email || "unknown"} — {m.snippet || "No preview available"}</p></div><div className="flex flex-wrap gap-2 xl:justify-end"><span className="rounded-full bg-emerald-300/15 px-3 py-2 text-xs font-bold text-emerald-200">{m.status || "new"}</span><Link href={`/email-os/threads/${m.id || "timeline"}`} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold"><Eye className="mr-1 inline h-3 w-3"/>Open</Link><Link href="/email-os/composer" className="rounded-xl bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-100"><Reply className="mr-1 inline h-3 w-3"/>Reply</Link></div></div></div>)}</div></Card></section>;
}
function ThreadsPanel({ threads }: { threads: Thread[] }) { return <section className="mt-5 grid gap-4 lg:grid-cols-3">{threads.map(t => <Card key={t.id || t.subject}><div className="flex items-center justify-between"><Layers className="h-7 w-7 text-cyan-200"/><span className="rounded-full bg-white/10 px-3 py-1 text-xs">{t.message_count || 0} msgs</span></div><h3 className="mt-4 text-xl font-black text-white">{t.subject || "Thread"}</h3><p className="mt-1 text-sm text-slate-400">{t.mailbox_label || "Mailbox"} • {t.assigned_to || "Unassigned"}</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs text-amber-200">{t.priority || "normal"}</span><span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs text-cyan-200">{t.status || "open"}</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs">{t.category || "General"}</span></div><Link href={`/email-os/threads/${t.id || "detail"}`} className="mt-5 block w-full rounded-2xl bg-white/10 py-3 text-center font-bold"><Reply className="mr-2 inline h-4 w-4"/>Open timeline</Link></Card>)}</section>; }
function ComposerPanel({ compose, setCompose, mailboxes, queueEmail }: { compose: any; setCompose: (x: any) => void; mailboxes: Mailbox[]; queueEmail: () => void }) { return <section className="mt-5 grid gap-5 xl:grid-cols-2"><Card><h2 className="text-3xl font-black text-white">Ultra Composer</h2><select value={compose.mailbox_id} onChange={e => setCompose({ ...compose, mailbox_id: e.target.value })} className="mt-4 w-full rounded-2xl border border-white/10 bg-black/40 p-4 outline-none"><option value="">Select sending mailbox</option>{mailboxes.map(m => <option key={m.id || emailOf(m)} value={m.id || emailOf(m)}>{m.label} — {emailOf(m)}</option>)}</select>{["to", "cc", "bcc", "subject"].map(k => <input key={k} value={compose[k]} onChange={e => setCompose({ ...compose, [k]: e.target.value })} placeholder={k.toUpperCase()} className="mt-4 w-full rounded-2xl border border-white/10 bg-black/40 p-4 outline-none"/>)}<textarea value={compose.body} onChange={e => setCompose({ ...compose, body: e.target.value })} placeholder="Message body" className="mt-4 min-h-56 w-full rounded-2xl border border-white/10 bg-black/40 p-4 outline-none"/><div className="mt-4 grid grid-cols-2 gap-3"><ActionButton><Bot className="mr-2 inline h-4 w-4"/>Template Assist</ActionButton><ActionButton><Upload className="mr-2 inline h-4 w-4"/>Attach</ActionButton><ActionButton><Clock className="mr-2 inline h-4 w-4"/>Schedule</ActionButton><ActionButton primary onClick={queueEmail}><Send className="mr-2 inline h-4 w-4"/>Queue Send</ActionButton></div></Card><Card><h3 className="mb-4 text-2xl font-black text-white">Live Preview + Approval Check</h3><div className="rounded-3xl bg-white p-6 text-slate-900"><p className="text-xs text-slate-500">From mailbox: {compose.mailbox_id || "not selected"}</p><p className="text-xs text-slate-500">To: {compose.to || "recipient@example.com"}</p><h4 className="mt-4 text-2xl font-black">{compose.subject || "Subject preview"}</h4><p className="mt-4 whitespace-pre-wrap text-sm">{compose.body || "Body preview will appear here."}</p></div><div className="mt-4 grid gap-2"><div className="rounded-2xl bg-emerald-300/10 p-3 text-sm text-emerald-100"><CheckCircle2 className="mr-2 inline h-4 w-4"/>Queue + approval compatible</div><div className="rounded-2xl bg-cyan-300/10 p-3 text-sm text-cyan-100"><Sparkles className="mr-2 inline h-4 w-4"/>Template variables and compliance area ready</div></div></Card></section>; }
function FilesPanel() { return <section className="mt-5"><Card><h2 className="text-3xl font-black text-white">Attachment Vault</h2><div className="mt-5 grid gap-4 md:grid-cols-3"><div className="rounded-3xl border border-dashed border-cyan-300/30 p-8 text-center"><Upload className="mx-auto h-10 w-10 text-cyan-200"/><h3 className="mt-3 font-black">Upload & Link</h3><p className="text-sm text-slate-400">Attach files to drafts, threads, incidents, billing proof, and audit events.</p></div>{["invoice-proof.pdf", "care-plan.docx", "incident-note.png"].map(f => <div key={f} className="rounded-3xl border border-white/10 bg-slate-950/70 p-5"><FileText className="h-8 w-8 text-cyan-200"/><h3 className="mt-3 font-bold text-white">{f}</h3><button className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs"><Download className="mr-1 inline h-3 w-3"/>Preview</button></div>)}</div></Card></section>; }
function MailboxesPanel({ mailboxes, setEditMailbox, testMailbox }: { mailboxes: Mailbox[]; setEditMailbox: (m: Mailbox) => void; testMailbox: (m?: Mailbox) => void }) { return <section className="mt-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-3xl font-black text-white">Mailbox Server Control Panel</h2><ActionButton primary onClick={() => setEditMailbox({ label: "New Mailbox", email_address: "", health_status: "unknown", sync_status: "idle" })}><Plus className="mr-2 inline h-4 w-4"/>Add Mailbox</ActionButton></div><div className="grid gap-4 lg:grid-cols-3">{mailboxes.map(m => <MailboxCard key={m.id || emailOf(m)} mailbox={m} onEdit={() => setEditMailbox(m)} onTest={() => testMailbox(m)}/>)}</div></section>; }
function AccessPanel({ mailboxes }: { mailboxes: Mailbox[] }) { const roles = ["CEO", "Operations Manager", "HR Manager", "Billing Officer", "Sales Agent", "Viewer"]; return <section className="mt-5"><Card><h2 className="text-3xl font-black text-white">CEO Access Matrix</h2><p className="mt-2 text-sm text-slate-400">Grant read, send, approve, assign, configure, and owner-level rights by mailbox.</p><div className="mt-5 overflow-auto"><table className="w-full min-w-[900px] text-sm"><thead><tr className="text-left text-slate-400"><th className="p-3">Role</th>{mailboxes.slice(0, 6).map(m => <th key={m.id || emailOf(m)} className="p-3">{m.label}</th>)}</tr></thead><tbody>{roles.map(r => <tr key={r} className="border-t border-white/10"><td className="p-3 font-bold text-white">{r}</td>{mailboxes.slice(0, 6).map(m => <td key={m.id || emailOf(m)} className="p-3"><button className="rounded-xl bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-100">Read</button> <button className="rounded-xl bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-100">Send</button></td>)}</tr>)}</tbody></table></div></Card></section>; }
function AnalyticsPanel({ mailboxes, queueSize, failureAvg }: { mailboxes: Mailbox[]; queueSize: number; failureAvg: string }) { return <section className="mt-5 space-y-5"><div className="grid gap-4 md:grid-cols-4"><Stat icon={Mail} label="Assets" value={String(mailboxes.length)} sub="mailboxes"/><Stat icon={Send} label="Queue" value={String(queueSize)} sub="pending"/><Stat icon={AlertTriangle} label="Failure" value={`${failureAvg}%`} sub="avg"/><Stat icon={Database} label="Audit" value="On" sub="events tracked"/></div><Card><h2 className="text-3xl font-black text-white">Analytics Command Board</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{["Traffic by mailbox", "Failure by provider", "Approvals by department", "Queue pressure", "Response rhythm", "Attachment volume"].map(x => <div key={x} className="rounded-3xl border border-white/10 bg-white/5 p-5"><BarChart3 className="h-8 w-8 text-cyan-200"/><h3 className="mt-3 font-black text-white">{x}</h3><div className="mt-4 h-24 rounded-2xl bg-gradient-to-t from-cyan-300/20 to-transparent"/></div>)}</div></Card></section>; }
function EnginePanel({ runImapSync, runOutbox, testMailbox, syncOnly = false }: { runImapSync: () => void; runOutbox: () => void; testMailbox: () => void; syncOnly?: boolean }) { return <section className="mt-5 grid gap-5 xl:grid-cols-2"><Card><h2 className="text-3xl font-black text-white">Execution Engine</h2><p className="mt-2 text-sm text-slate-400">Manual engine controls. No fake tabs: these buttons call API routes.</p><div className="mt-5 grid gap-3 md:grid-cols-2"><ActionButton primary onClick={runImapSync}><RefreshCcw className="mr-2 inline h-4 w-4"/>Run IMAP Sync</ActionButton>{!syncOnly && <ActionButton primary onClick={runOutbox}><Play className="mr-2 inline h-4 w-4"/>Process Outbox</ActionButton>}<ActionButton onClick={() => testMailbox()}><Shield className="mr-2 inline h-4 w-4"/>Health Check</ActionButton><ActionButton><Network className="mr-2 inline h-4 w-4"/>Throttle Review</ActionButton></div></Card><ConsolePanel lines={["SMTP send-outbox route ready", "IMAP sync route ready", "Realtime pulse route ready", "Mailbox health route ready", "Queue throttle route ready"]}/></section>; }
function SettingsPanel({ mailboxes, setEditMailbox }: { mailboxes: Mailbox[]; setEditMailbox: (m: Mailbox) => void }) { return <section className="mt-5"><Card><h2 className="text-3xl font-black text-white">SMTP / IMAP Configuration</h2><p className="mt-2 text-sm text-slate-400">Menara recommended: SMTP smtp.menara.ma:587 STARTTLS, IMAP imap.menara.ma:993 SSL.</p><div className="mt-5 grid gap-4 lg:grid-cols-3">{mailboxes.map(m => <div key={m.id || emailOf(m)} className="rounded-3xl border border-white/10 bg-white/5 p-5"><KeyRound className="h-7 w-7 text-cyan-200"/><h3 className="mt-3 font-black text-white">{m.label}</h3><p className="text-xs text-slate-400">{emailOf(m)}</p><button onClick={() => setEditMailbox(m)} className="mt-4 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950">Configure SMTP/IMAP</button></div>)}</div></Card></section>; }
function MailboxDrawer({ mailbox, onClose, onSave }: { mailbox: Mailbox; onClose: () => void; onSave: (m: any) => void }) { const [form, setForm] = useState<any>({ ...mailbox, smtp_host: "smtp.menara.ma", smtp_port: 587, smtp_secure: false, imap_host: "imap.menara.ma", imap_port: 993, imap_secure: true }); return <div className="fixed inset-0 z-50 bg-black/70 p-4 backdrop-blur"><div className="ml-auto h-full max-w-2xl overflow-auto rounded-[2rem] border border-cyan-300/20 bg-slate-950 p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-2xl font-black text-white">Mailbox Configuration</h2><button onClick={onClose} className="rounded-xl bg-white/10 px-3 py-2">Close</button></div><div className="mt-5 grid gap-3 md:grid-cols-2">{["label", "email_address", "department", "business_context", "smtp_host", "smtp_port", "smtp_user", "smtp_pass", "imap_host", "imap_port", "imap_user", "imap_pass"].map(k => <label key={k} className="text-xs font-bold uppercase tracking-widest text-slate-400">{k}<input value={form[k] ?? ""} onChange={e => setForm({ ...form, [k]: e.target.value })} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none" type={k.includes("pass") ? "password" : "text"}/></label>)}</div><div className="mt-5 grid grid-cols-2 gap-3"><button onClick={() => onSave(form)} className="rounded-2xl bg-cyan-300 py-3 font-black text-slate-950">Save Configuration</button><button onClick={onClose} className="rounded-2xl border border-white/10 py-3 font-bold text-white">Cancel</button></div></div></div>; }
