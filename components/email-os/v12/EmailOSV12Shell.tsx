"use client"

import {
  Archive,
  Bell,
  Bot,
  CheckCircle2,
  Clock,
  Command,
  Edit3,
  FileText,
  Filter,
  Folder,
  Inbox,
  Mail,
  Menu,
  MoreHorizontal,
  PanelRightOpen,
  Paperclip,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  UserPlus,
  Users,
  X,
  Zap
} from "lucide-react"
import { useMemo, useState } from "react"
import ActionToast from "@/components/email-os/click-actions/ActionToast"
import { useEmailOSActionRunner } from "@/lib/email-os/click-actions/use-action-runner"
import type { EmailOSClickAction } from "@/lib/email-os/click-actions/action-types"

type EmailOSPage =
  | "inbox"
  | "threads"
  | "compose"
  | "templates"
  | "automation"
  | "approvals"
  | "outbox"
  | "audit"
  | "configuration"
  | "mailboxes"
  | "analytics"
  | "runtime"
  | "enterprise"

type Density = "comfortable" | "compact" | "spacious"

type ThreadRecord = {
  id: string
  sender: string
  role: string
  subject: string
  preview: string
  mailbox: string
  mailboxId?: string
  priority: "Critical" | "High" | "Normal"
  status: "Open" | "Assigned" | "Waiting" | "Approval" | "Resolved"
  time: string
  unread?: boolean
  starred?: boolean
  attachments?: number
  labels: string[]
}

const seedThreads: ThreadRecord[] = [
  {
    id: "thr-1001",
    sender: "AngelCare Family Support",
    role: "Care Coordination",
    subject: "Urgent family care schedule change",
    preview: "Family requests immediate replacement for tomorrow morning visit. Needs operations confirmation and caregiver reassignment.",
    mailbox: "Operations Inbox",
    mailboxId: "mbx-ops",
    priority: "Critical",
    status: "Approval",
    time: "11:48",
    unread: true,
    starred: true,
    attachments: 2,
    labels: ["SLA Risk", "Family Support"]
  },
  {
    id: "thr-1002",
    sender: "Corporate Training Client",
    role: "Academy",
    subject: "Training proposal review for caregivers",
    preview: "Client requested updated calendar, final pricing and trainer availability for next intake.",
    mailbox: "Academy Sales",
    mailboxId: "mbx-academy",
    priority: "High",
    status: "Assigned",
    time: "10:15",
    attachments: 1,
    labels: ["Proposal", "Revenue"]
  },
  {
    id: "thr-1003",
    sender: "Billing Department",
    role: "Finance",
    subject: "Invoice correction request for March services",
    preview: "Invoice discrepancy requires confirmation before sending revised statement to client.",
    mailbox: "Finance Inbox",
    mailboxId: "mbx-finance",
    priority: "High",
    status: "Waiting",
    time: "09:34",
    unread: true,
    labels: ["Billing", "Internal"]
  }
]

const workspaces = [
  { key: "inbox", label: "Super Inbox", icon: Inbox },
  { key: "threads", label: "Thread Dossiers", icon: Mail },
  { key: "compose", label: "Compose Studio", icon: Edit3 },
  { key: "templates", label: "Templates", icon: FileText },
  { key: "automation", label: "Automation", icon: Zap },
  { key: "approvals", label: "Approvals", icon: ShieldCheck },
  { key: "outbox", label: "Outbox", icon: Send },
  { key: "mailboxes", label: "Mailboxes", icon: Folder },
  { key: "configuration", label: "Configuration", icon: Settings },
  { key: "audit", label: "Audit", icon: CheckCircle2 }
]

const folders = [
  { key: "inbox", label: "Inbox", count: 42, icon: Inbox },
  { key: "starred", label: "Starred", count: 9, icon: Star },
  { key: "snoozed", label: "Snoozed", count: 5, icon: Clock },
  { key: "sent", label: "Sent", count: 128, icon: Send },
  { key: "drafts", label: "Drafts", count: 6, icon: Edit3 },
  { key: "archive", label: "Archive", count: 812, icon: Archive }
]

function cx(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ")
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "blue" | "amber" | "red" | "green" | "purple" }) {
  const tones = {
    neutral: "border-slate-200 bg-slate-50 text-slate-600",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-rose-200 bg-rose-50 text-rose-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    purple: "border-violet-200 bg-violet-50 text-violet-700"
  }
  return <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", tones[tone])}>{children}</span>
}

function Button({
  children,
  variant = "secondary",
  className = "",
  onClick,
  disabled
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger"
  className?: string
  onClick?: () => void
  disabled?: boolean
}) {
  const variants = {
    primary: "bg-slate-950 text-white shadow-sm hover:bg-slate-800",
    secondary: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx("inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50", variants[variant], className)}
    >
      {children}
    </button>
  )
}

function Sidebar({ collapsed, activePage, setActivePage, run }: any) {
  return (
    <aside className={cx("hidden border-r border-slate-200 bg-white xl:flex xl:flex-col", collapsed ? "w-[76px]" : "w-[276px]")}>
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white"><Mail className="h-5 w-5" /></div>
        {!collapsed && <div><div className="text-sm font-bold text-slate-950">AngelCare Email-OS</div><div className="text-xs text-slate-500">Executable mail workspace</div></div>}
      </div>
      <div className="border-b border-slate-200 p-3">
        <Button variant="primary" className={cx("w-full", collapsed && "px-0")} onClick={() => setActivePage("compose")}>
          <Plus className="h-4 w-4" /> {!collapsed && "Compose"}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {workspaces.map((item) => {
            const Icon = item.icon
            const active = activePage === item.key
            return (
              <button key={item.key} onClick={() => setActivePage(item.key as EmailOSPage)}
                className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}>
                <Icon className="h-4 w-4 shrink-0" /> {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </div>
        {!collapsed && (
          <>
            <div className="mt-6 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Mailboxes</div>
            <div className="mt-2 space-y-1">
              {folders.map((folder) => {
                const Icon = folder.icon
                return (
                  <button key={folder.key} onClick={() => run("sync.mailbox", { mailboxId: folder.key })}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                    <span className="flex items-center gap-3"><Icon className="h-4 w-4" />{folder.label}</span>
                    <span className="text-xs text-slate-400">{folder.count}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

function TopBar({ collapsed, setCollapsed, density, setDensity, query, setQuery, run }: any) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
      <Button variant="ghost" className="hidden px-2 xl:inline-flex" onClick={() => setCollapsed(!collapsed)}><PanelRightOpen className="h-5 w-5" /></Button>
      <Button variant="ghost" className="px-2 xl:hidden"><Menu className="h-5 w-5" /></Button>
      <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search mail, people, labels, approvals..." className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
        <div className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500 md:flex"><Command className="h-3 w-3" /> K</div>
      </div>
      <Button variant="secondary" onClick={() => run("audit.open", { action: "filter.open" })}><Filter className="h-4 w-4" /> Filters</Button>
      <div className="hidden items-center rounded-xl border border-slate-200 bg-white p-1 md:flex">
        {(["compact", "comfortable", "spacious"] as Density[]).map((item) => (
          <button key={item} onClick={() => setDensity(item)} className={cx("rounded-lg px-2.5 py-1.5 text-xs font-medium capitalize", density === item ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100")}>{item}</button>
        ))}
      </div>
      <Button variant="ghost" className="px-2" onClick={() => run("sync.mailbox", { mailboxId: "all" })}><RefreshCw className="h-5 w-5" /></Button>
      <Button variant="ghost" className="px-2" onClick={() => run("audit.open", { action: "notifications.open" })}><Bell className="h-5 w-5" /></Button>
    </header>
  )
}

function ThreadList({ threads, selectedId, setSelectedId, density, query, run, setThreads }: any) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return threads
    return threads.filter((t: ThreadRecord) => [t.sender, t.subject, t.preview, t.mailbox, ...t.labels].join(" ").toLowerCase().includes(q))
  }, [threads, query])
  const rowPadding = density === "compact" ? "p-3" : density === "spacious" ? "p-5" : "p-4"

  return (
    <section className="flex min-h-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
        <div><div className="text-sm font-bold text-slate-950">Priority Inbox</div><div className="text-xs text-slate-500">{filtered.length} conversations ready</div></div>
        <Button variant="ghost" className="px-2" onClick={() => run("sync.mailbox", { mailboxId: "inbox" })}><RefreshCw className="h-4 w-4" /></Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.map((thread: ThreadRecord) => (
          <button key={thread.id}
            onClick={() => {
              setSelectedId(thread.id)
              setThreads((current: ThreadRecord[]) => current.map((t) => t.id === thread.id ? { ...t, unread: false } : t))
              run("thread.read", { threadId: thread.id, mailboxId: thread.mailboxId })
            }}
            className={cx("w-full border-b border-slate-100 text-left transition hover:bg-slate-50", selectedId === thread.id && "bg-blue-50/60", rowPadding)}>
            <div className="flex items-start gap-3">
              <div className={cx("mt-1 h-2.5 w-2.5 rounded-full", thread.unread ? "bg-blue-600" : "bg-transparent")} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className={cx("truncate text-sm", thread.unread ? "font-bold text-slate-950" : "font-semibold text-slate-700")}>{thread.sender}</div>
                  <div className="shrink-0 text-xs text-slate-400">{thread.time}</div>
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-slate-900">{thread.subject}</div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{thread.preview}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge tone={thread.priority === "Critical" ? "red" : thread.priority === "High" ? "amber" : "neutral"}>{thread.priority}</Badge>
                  <Badge tone={thread.status === "Approval" ? "purple" : thread.status === "Assigned" ? "blue" : thread.status === "Resolved" ? "green" : "neutral"}>{thread.status}</Badge>
                  {thread.attachments ? <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Paperclip className="h-3 w-3" /> {thread.attachments}</span> : null}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function ReadingPane({ thread, run, setThreads, setActivePage }: any) {
  function localUpdate(action: string) {
    setThreads((current: ThreadRecord[]) => current.map((t) => {
      if (t.id !== thread.id) return t
      if (action === "archive") return { ...t, status: "Resolved" as const }
      if (action === "assign") return { ...t, status: "Assigned" as const }
      if (action === "escalate") return { ...t, status: "Approval" as const, priority: "Critical" as const }
      if (action === "resolve") return { ...t, status: "Resolved" as const }
      return t
    }))
  }

  return (
    <section className="flex min-h-0 flex-col bg-white">
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-5">
        <div className="min-w-0"><div className="truncate text-sm font-bold text-slate-950">{thread.subject}</div><div className="text-xs text-slate-500">{thread.mailbox} • {thread.status}</div></div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="px-2" onClick={() => { localUpdate("archive"); run("thread.archive", { threadId: thread.id, mailboxId: thread.mailboxId }) }}><Archive className="h-4 w-4" /></Button>
          <Button variant="ghost" className="px-2" onClick={() => run("thread.tag", { threadId: thread.id, mailboxId: thread.mailboxId, data: { label: "Reviewed" } })}><Tag className="h-4 w-4" /></Button>
          <Button variant="ghost" className="px-2" onClick={() => run("audit.open", { threadId: thread.id })}><MoreHorizontal className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">{thread.sender.slice(0, 2).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div><div className="font-bold text-slate-950">{thread.sender}</div><div className="text-xs text-slate-500">{thread.role} • to AngelCare Operations</div></div>
                <div className="text-xs text-slate-400">{thread.time}</div>
              </div>
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm leading-7 text-slate-700">{thread.preview}</p>
                <p className="mt-4 text-sm leading-7 text-slate-700">This conversation is connected to the Email-OS action engine. Use the controls below to execute real audit, queue, approval and thread state actions.</p>
              </div>
              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-blue-900"><Bot className="h-4 w-4" /> AI thread summary</div>
                <p className="mt-2 text-sm leading-6 text-blue-800">Recommended: assign owner, prepare reply, and request approval if external or sensitive.</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => setActivePage("compose")}><Reply className="h-4 w-4" /> Reply</Button>
                <Button variant="secondary" onClick={() => { localUpdate("assign"); run("thread.assign", { threadId: thread.id, mailboxId: thread.mailboxId, data: { ownerId: "ops-lead" } }) }}><UserPlus className="h-4 w-4" /> Assign</Button>
                <Button variant="secondary" onClick={() => run("approval.approve", { threadId: thread.id, mailboxId: thread.mailboxId })}><ShieldCheck className="h-4 w-4" /> Approve</Button>
                <Button variant="secondary" onClick={() => { localUpdate("escalate"); run("thread.escalate", { threadId: thread.id, mailboxId: thread.mailboxId }) }}><Zap className="h-4 w-4" /> Escalate</Button>
                <Button variant="secondary" onClick={() => run("thread.snooze", { threadId: thread.id, mailboxId: thread.mailboxId })}><Clock className="h-4 w-4" /> Snooze</Button>
                <Button variant="secondary" onClick={() => { localUpdate("resolve"); run("thread.resolve", { threadId: thread.id, mailboxId: thread.mailboxId }) }}><CheckCircle2 className="h-4 w-4" /> Resolve</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ActionRail({ thread, run }: any) {
  const actions: Array<[string, EmailOSClickAction, any, typeof Users]> = [
    ["Assign owner", "thread.assign", { threadId: thread.id, mailboxId: thread.mailboxId, data: { ownerId: "ops-lead" } }, Users],
    ["Create follow-up", "queue.retry", { threadId: thread.id, mailboxId: thread.mailboxId }, Clock],
    ["Escalate SLA", "thread.escalate", { threadId: thread.id, mailboxId: thread.mailboxId }, Zap],
    ["Open audit trail", "audit.open", { threadId: thread.id, mailboxId: thread.mailboxId }, CheckCircle2],
    ["Create template", "template.create", { subject: thread.subject, text: "Template created from thread" }, FileText]
  ]

  return (
    <aside className="hidden w-[320px] shrink-0 border-l border-slate-200 bg-slate-50/80 p-4 2xl:block">
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-bold text-slate-950">Thread intelligence</div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">SLA risk</span><Badge tone={thread.priority === "Critical" ? "red" : "amber"}>{thread.priority}</Badge></div>
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Owner</span><span className="font-medium text-slate-800">Ops Lead</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Approval</span><Badge tone={thread.status === "Approval" ? "purple" : "green"}>{thread.status === "Approval" ? "Required" : "Clear"}</Badge></div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-bold text-slate-950">Executable actions</div>
          <div className="mt-3 grid gap-2">
            {actions.map(([label, action, payload, Icon]) => (
              <button key={label} onClick={() => run(action, payload)} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Icon className="h-4 w-4 text-slate-500" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

function MailWorkspace({ density, query, run, setActivePage }: any) {
  const [threads, setThreads] = useState(seedThreads)
  const [selectedId, setSelectedId] = useState(seedThreads[0].id)
  const selected = threads.find((t) => t.id === selectedId) || threads[0]
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[420px_minmax(0,1fr)]">
      <ThreadList threads={threads} setThreads={setThreads} selectedId={selectedId} setSelectedId={setSelectedId} density={density} query={query} run={run} />
      <div className="grid min-h-0 grid-cols-1 overflow-hidden 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <ReadingPane thread={selected} run={run} setThreads={setThreads} setActivePage={setActivePage} />
        <ActionRail thread={selected} run={run} />
      </div>
    </div>
  )
}

function ComposeStudio({ run }: any) {
  const [draft, setDraft] = useState({ to: "", subject: "", text: "" })
  const [status, setStatus] = useState("Ready")

  async function saveDraft() {
    const result = await run("compose.saveDraft", draft)
    setStatus(result.ok ? "Draft saved" : result.error || "Draft save failed")
  }

  async function send() {
    const result = await run("compose.send", draft)
    setStatus(result.ok ? result.message : result.error || "Send failed")
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-slate-50 p-6">
      <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex h-14 items-center justify-between border-b border-slate-200 px-5">
            <div className="font-bold text-slate-950">Compose Studio</div><Badge tone="green">{status}</Badge>
          </div>
          <div className="space-y-4 p-5">
            <input value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400" placeholder="To" />
            <input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400" placeholder="Subject" />
            <textarea value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} className="min-h-[420px] w-full rounded-2xl border border-slate-200 p-4 text-sm leading-7 outline-none focus:border-slate-400" placeholder="Write your message..." />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="primary" onClick={send}><Send className="h-4 w-4" /> Send</Button>
                <Button variant="secondary" onClick={saveDraft}><Edit3 className="h-4 w-4" /> Save draft</Button>
                <Button variant="secondary" onClick={() => run("approval.approve", { draftId: "draft-local", reason: "Manual approval request" })}><ShieldCheck className="h-4 w-4" /> Request approval</Button>
              </div>
              <Button variant="ghost" onClick={() => setDraft({ to: "", subject: "", text: "" })}><X className="h-4 w-4" /> Discard</Button>
            </div>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-slate-950"><Sparkles className="h-4 w-4 text-violet-600" /> AI compose dock</div>
            <div className="mt-4 grid gap-2">
              {["Executive tone", "Customer recovery", "HR formal notice", "Sales follow-up"].map((item) => (
                <button key={item} onClick={() => setDraft({ ...draft, text: `${draft.text}\n\n${item} draft assistance inserted.` })} className="rounded-xl border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">{item}</button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ManagementPage({ page, run }: any) {
  const configs: Record<string, { title: string; subtitle: string; icon: typeof Inbox; rows: string[]; createAction: EmailOSClickAction }> = {
    templates: { title: "Template Library", subtitle: "Reusable corporate replies and regulated messages.", icon: FileText, rows: ["Family care response", "Billing correction", "HR onboarding reminder"], createAction: "template.create" },
    automation: { title: "Automation Rules", subtitle: "Routing, tagging, SLA triggers and approvals.", icon: Zap, rows: ["VIP escalation", "Attachment approval gate", "Finance auto-label"], createAction: "automation.create" },
    approvals: { title: "Approval Queue", subtitle: "Outbound messages waiting for validation.", icon: ShieldCheck, rows: ["Legal contract response", "Sensitive HR notice", "Finance statement"], createAction: "approval.approve" },
    outbox: { title: "Outbox & Delivery", subtitle: "Queued messages, failed sends and retries.", icon: Send, rows: ["Queued proposal", "Retry invoice", "Scheduled HR notice"], createAction: "queue.retry" },
    audit: { title: "Audit Timeline", subtitle: "Operational history for sends and approvals.", icon: CheckCircle2, rows: ["Message approved", "Queue retry", "SLA breach"], createAction: "audit.open" },
    configuration: { title: "Configuration Center", subtitle: "SMTP/IMAP, policies and security.", icon: Settings, rows: ["SMTP provider", "IMAP sync", "SLA thresholds"], createAction: "sync.mailbox" },
    mailboxes: { title: "Mailbox Administration", subtitle: "Create, assign and monitor mailboxes.", icon: Folder, rows: ["Operations Inbox", "HR Inbox", "Finance Inbox"], createAction: "mailbox.create" },
    analytics: { title: "Email Intelligence", subtitle: "Response performance and workload analytics.", icon: Mail, rows: ["SLA trend", "Team workload", "Provider reliability"], createAction: "audit.open" },
    runtime: { title: "Runtime Operations", subtitle: "Workers, queue and background execution.", icon: RefreshCw, rows: ["Queue worker", "SLA sweep", "Realtime events"], createAction: "queue.retry" },
    enterprise: { title: "Enterprise Command", subtitle: "Executive view of risk and delivery.", icon: ShieldCheck, rows: ["Critical threads", "Approval risk", "Queue failures"], createAction: "audit.open" }
  }
  const config = configs[page] || configs.templates
  const Icon = config.icon

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><Icon className="h-5 w-5" /></div>
              <div><h1 className="text-2xl font-bold tracking-tight text-slate-950">{config.title}</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{config.subtitle}</p></div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => run("audit.open", { action: `${page}.filter` })}><Filter className="h-4 w-4" /> Filter</Button>
              <Button variant="primary" onClick={() => run(config.createAction, { subject: `New ${page} item`, text: "Created from UI", mailboxName: "New mailbox", address: "new-mailbox@example.com", data: { name: `New ${page} item` } })}><Plus className="h-4 w-4" /> New item</Button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_140px_140px_180px] border-b border-slate-200 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            <div>Name</div><div>Status</div><div>Owner</div><div className="text-right">Actions</div>
          </div>
          {config.rows.map((row: string, index: number) => (
            <div key={row} className="grid grid-cols-[minmax(0,1fr)_140px_140px_180px] items-center border-b border-slate-100 px-5 py-4 last:border-b-0">
              <div><div className="font-semibold text-slate-900">{row}</div><div className="text-xs text-slate-500">Executable workflow item #{index + 1}</div></div>
              <div><Badge tone={index % 2 === 0 ? "green" : "amber"}>{index % 2 === 0 ? "Active" : "Review"}</Badge></div>
              <div className="text-sm text-slate-600">{index % 2 === 0 ? "Operations" : "Admin"}</div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" className="px-2" onClick={() => run("audit.open", { action: `${page}.view`, data: { row } })}><MoreHorizontal className="h-4 w-4" /></Button>
                <Button variant="secondary" onClick={() => run(config.createAction, { subject: row, text: "Action executed from row", mailboxName: row, address: `${row.toLowerCase().replaceAll(" ", "-")}@example.com`, data: { name: row } })}>Run</Button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

export default function EmailOSV12Shell({ initialPage = "inbox" }: { initialPage?: EmailOSPage }) {
  const [activePage, setActivePage] = useState<EmailOSPage>(initialPage)
  const [collapsed, setCollapsed] = useState(false)
  const [density, setDensity] = useState<Density>("comfortable")
  const [query, setQuery] = useState("")
  const [composeOpen, setComposeOpen] = useState(false)
  const { run, toast, clearToast } = useEmailOSActionRunner()

  const content =
    activePage === "inbox" || activePage === "threads"
      ? <MailWorkspace density={density} query={query} run={run} setActivePage={setActivePage} />
      : activePage === "compose"
        ? <ComposeStudio run={run} />
        : <ManagementPage page={activePage} run={run} />

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans text-slate-900">
      <Sidebar collapsed={collapsed} activePage={activePage} setActivePage={setActivePage} run={run} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar collapsed={collapsed} setCollapsed={setCollapsed} density={density} setDensity={setDensity} query={query} setQuery={setQuery} run={run} />
        <div className="flex min-h-0 flex-1 flex-col">{content}</div>
      </div>

      <button onClick={() => setComposeOpen(true)} className="fixed bottom-6 right-6 z-40 flex h-14 items-center gap-3 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white shadow-2xl shadow-slate-300 transition hover:bg-slate-800">
        <Edit3 className="h-5 w-5" /> Compose
      </button>

      {composeOpen && (
        <FloatingCompose onClose={() => setComposeOpen(false)} run={run} />
      )}

      <ActionToast toast={toast} onClose={clearToast} />
    </div>
  )
}

function FloatingCompose({ onClose, run }: any) {
  const [draft, setDraft] = useState({ to: "", subject: "", text: "" })
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[min(620px,calc(100vw-32px))] rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex h-12 items-center justify-between rounded-t-3xl bg-slate-950 px-4 text-white">
        <div className="text-sm font-bold">New message</div><button onClick={onClose}><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-3 p-4">
        <input value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} className="h-10 w-full border-b border-slate-200 text-sm outline-none" placeholder="To" />
        <input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} className="h-10 w-full border-b border-slate-200 text-sm outline-none" placeholder="Subject" />
        <textarea value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} className="min-h-[240px] w-full resize-none text-sm leading-6 outline-none" placeholder="Write your message..." />
        <div className="flex items-center justify-between">
          <Button variant="primary" onClick={() => run("compose.send", draft)}><Send className="h-4 w-4" /> Send</Button>
          <div className="flex gap-2">
            <Button variant="ghost" className="px-2" onClick={() => run("compose.saveDraft", draft)}><Edit3 className="h-4 w-4" /></Button>
            <Button variant="ghost" className="px-2" onClick={() => setDraft({ ...draft, text: `${draft.text}\n\nAI-assisted response draft inserted.` })}><Sparkles className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}
