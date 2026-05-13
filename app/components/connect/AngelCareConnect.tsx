"use client"

import { useEffect, useMemo, useState } from "react"
import type React from "react"
import {
  AlertTriangle,
  Archive,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Command,
  Crown,
  EyeOff,
  FileText,
  Headphones,
  Inbox,
  LockKeyhole,
  Maximize2,
  MessageCircle,
  Mic,
  Minus,
  MoreHorizontal,
  Paperclip,
  Phone,
  Pin,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react"

type ConnectMode = "private" | "rooms" | "broadcasts" | "actions"
type RoomKind = "private" | "department" | "executive" | "project" | "context"
type Priority = "normal" | "important" | "urgent"

type Conversation = {
  id: string
  title: string
  subtitle: string
  kind: RoomKind
  privacy: string
  unread: number
  priority: Priority
  routeContext?: string
  members: string[]
  lastMessage: string
  lastAt: string
  pinned?: boolean
}

type Message = {
  id: string
  conversationId: string
  author: string
  body: string
  at: string
  mine?: boolean
  confidential?: boolean
  action?: "task" | "approval" | "call"
}

const CONNECT_OPEN_KEY = "angelcare.connect.open"
const CONNECT_MODE_KEY = "angelcare.connect.mode"

const conversations: Conversation[] = [
  {
    id: "dm-direction",
    title: "Direction Rabat ↔ You",
    subtitle: "Closed one-to-one executive thread",
    kind: "private",
    privacy: "Only selected participants",
    unread: 3,
    priority: "urgent",
    members: ["Direction Rabat", "You"],
    lastMessage: "Confidential decision note ready for validation.",
    lastAt: "09:42",
    pinned: true,
  },
  {
    id: "dm-hr",
    title: "HR Manager",
    subtitle: "Private HR coordination",
    kind: "private",
    privacy: "One-to-one private",
    unread: 1,
    priority: "important",
    members: ["HR Manager", "You"],
    lastMessage: "Staff profile escalation needs a decision.",
    lastAt: "10:15",
  },
  {
    id: "room-revenue",
    title: "Revenue Command Room",
    subtitle: "Sales, CRM, billing and objections",
    kind: "department",
    privacy: "Revenue permission required",
    unread: 8,
    priority: "urgent",
    members: ["Direction", "Sales", "CRM", "Billing"],
    lastMessage: "Two leads require same-day follow-up and owner assignment.",
    lastAt: "11:02",
    pinned: true,
  },
  {
    id: "room-ops",
    title: "Operations Control Room",
    subtitle: "Missions, incidents, staffing and execution",
    kind: "department",
    privacy: "Operations permission required",
    unread: 4,
    priority: "important",
    members: ["Ops", "Care Coordinators", "Direction"],
    lastMessage: "Coverage gap detected for afternoon mission block.",
    lastAt: "11:26",
  },
  {
    id: "room-direction",
    title: "Direction Room",
    subtitle: "Executive-only decisions and broadcasts",
    kind: "executive",
    privacy: "CEO / Direction / Admin only",
    unread: 2,
    priority: "urgent",
    members: ["Direction Rabat", "CEO", "Admin"],
    lastMessage: "Weekly activation priorities locked for execution.",
    lastAt: "12:00",
    pinned: true,
  },
  {
    id: "context-current",
    title: "Current Page Discussion",
    subtitle: "Context-aware conversation for this workspace",
    kind: "context",
    privacy: "Visible only to users allowed on this page",
    unread: 0,
    priority: "normal",
    routeContext: "Auto-detects current module",
    members: ["Module team", "Authorized users"],
    lastMessage: "Attach notes, blockers, decisions and follow-ups to the page.",
    lastAt: "Now",
  },
]

const seedMessages: Message[] = [
  {
    id: "m1",
    conversationId: "dm-direction",
    author: "Direction Rabat",
    body: "This thread is private. Use it for decisions, sensitive approvals, and executive escalations only.",
    at: "09:40",
    confidential: true,
  },
  {
    id: "m2",
    conversationId: "dm-direction",
    author: "You",
    body: "Received. I will keep this conversation closed and action-focused.",
    at: "09:41",
    mine: true,
  },
  {
    id: "m3",
    conversationId: "room-revenue",
    author: "CRM Desk",
    body: "New objection cluster detected: pricing, trust, and schedule availability. Need sales script update.",
    at: "11:01",
    action: "task",
  },
  {
    id: "m4",
    conversationId: "room-revenue",
    author: "Direction Rabat",
    body: "Convert this into an execution task with owner, deadline, and validation proof.",
    at: "11:02",
    action: "approval",
    confidential: true,
  },
]

function cx(...items: Array<string | false | undefined>) {
  return items.filter(Boolean).join(" ")
}

function badgeTone(priority: Priority) {
  if (priority === "urgent") return "border-rose-300 bg-rose-50 text-rose-700"
  if (priority === "important") return "border-amber-300 bg-amber-50 text-amber-700"
  return "border-slate-200 bg-slate-50 text-slate-600"
}

function iconFor(kind: RoomKind) {
  if (kind === "private") return LockKeyhole
  if (kind === "executive") return Crown
  if (kind === "department") return Building2
  if (kind === "project") return BriefcaseBusiness
  return Command
}

export default function AngelCareConnect() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ConnectMode>("private")
  const [selectedId, setSelectedId] = useState("dm-direction")
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<Message[]>(seedMessages)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(CONNECT_OPEN_KEY) === "true")
      const stored = window.localStorage.getItem(CONNECT_MODE_KEY) as ConnectMode | null
      if (stored) setMode(stored)
    } catch {}
  }, [])

  function setPanelOpen(next: boolean) {
    setOpen(next)
    try { window.localStorage.setItem(CONNECT_OPEN_KEY, String(next)) } catch {}
  }

  function changeMode(next: ConnectMode) {
    setMode(next)
    try { window.localStorage.setItem(CONNECT_MODE_KEY, next) } catch {}
  }

  const filtered = useMemo(() => {
    if (mode === "private") return conversations.filter((c) => c.kind === "private")
    if (mode === "rooms") return conversations.filter((c) => c.kind !== "private")
    if (mode === "broadcasts") return conversations.filter((c) => c.kind === "executive" || c.priority === "urgent")
    return conversations
  }, [mode])

  const selected = conversations.find((c) => c.id === selectedId) || conversations[0]
  const thread = messages.filter((m) => m.conversationId === selected.id)
  const unreadTotal = conversations.reduce((sum, c) => sum + c.unread, 0)

  function sendMessage() {
    const body = draft.trim()
    if (!body) return
    setMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        conversationId: selected.id,
        author: "You",
        body,
        at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mine: true,
        confidential: selected.kind === "private" || selected.kind === "executive",
      },
    ])
    setDraft("")
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 rounded-[28px] border border-slate-200 bg-slate-950 px-5 py-4 text-white shadow-2xl shadow-slate-950/30 transition hover:-translate-y-1 hover:bg-slate-900"
        aria-label="Open AngelCare Connect"
      >
        <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950">
          <MessageCircle className="h-5 w-5" />
          {unreadTotal > 0 && (
            <span className="absolute -right-2 -top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">{unreadTotal}</span>
          )}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Connect</span>
          <span className="block text-sm font-black">Private communication</span>
        </span>
      </button>
    )
  }

  return (
    <section className="fixed bottom-5 right-5 z-[70] w-[min(1180px,calc(100vw-28px))] overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/30">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black uppercase tracking-[0.22em] text-cyan-200">AngelCare Connect</p>
            <p className="truncate text-lg font-black">Private inbox · Corporate rooms · Secure actions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCompact(!compact)} className="rounded-2xl border border-white/10 p-3 text-white/80 hover:bg-white/10" aria-label="Toggle compact view">
            <Maximize2 className="h-4 w-4" />
          </button>
          <button onClick={() => setPanelOpen(false)} className="rounded-2xl border border-white/10 p-3 text-white/80 hover:bg-white/10" aria-label="Close Connect">
            <Minus className="h-4 w-4" />
          </button>
          <button onClick={() => setPanelOpen(false)} className="rounded-2xl bg-white p-3 text-slate-950 hover:bg-slate-100" aria-label="Close Connect">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={cx("grid bg-slate-50", compact ? "h-[560px] grid-cols-[300px_1fr]" : "h-[720px] grid-cols-[310px_1fr_310px]")}>
        <aside className="border-r border-slate-200 bg-white p-4">
          <div className="grid grid-cols-4 gap-2 rounded-3xl bg-slate-100 p-1">
            {([
              ["private", Inbox],
              ["rooms", Users],
              ["broadcasts", MegaphoneIcon],
              ["actions", Zap],
            ] as const).map(([key, Icon]) => (
              <button
                key={key}
                onClick={() => changeMode(key)}
                className={cx("grid h-11 place-items-center rounded-2xl transition", mode === key ? "bg-slate-950 text-white shadow" : "text-slate-500 hover:bg-white")}
                title={key}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400" placeholder="Search private chats, rooms…" />
          </div>

          <div className="mt-4 space-y-2 overflow-y-auto pr-1">
            {filtered.map((conversation) => {
              const Icon = iconFor(conversation.kind)
              const active = selected.id === conversation.id
              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedId(conversation.id)}
                  className={cx("w-full rounded-3xl border p-3 text-left transition", active ? "border-slate-900 bg-slate-950 text-white shadow-xl shadow-slate-950/15" : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:shadow")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className={cx("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", active ? "bg-white text-slate-950" : "bg-slate-100 text-slate-700")}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 truncate text-sm font-black">
                          {conversation.pinned && <Pin className="h-3 w-3 text-cyan-400" />}
                          {conversation.title}
                        </span>
                        <span className={cx("mt-1 block truncate text-xs font-semibold", active ? "text-white/65" : "text-slate-500")}>{conversation.lastMessage}</span>
                      </span>
                    </div>
                    {conversation.unread > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">{conversation.unread}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="flex min-w-0 flex-col bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-black text-slate-950">{selected.title}</h2>
                  <span className={cx("rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide", badgeTone(selected.priority))}>{selected.priority}</span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700">secured</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500">{selected.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 hover:bg-slate-50" title="Start voice call"><Phone className="h-4 w-4" /></button>
                <button className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 hover:bg-slate-50" title="Start video call"><Video className="h-4 w-4" /></button>
                <button className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 hover:bg-slate-50" title="More"><MoreHorizontal className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {thread.length === 0 && (
              <div className="grid h-full place-items-center text-center">
                <div className="max-w-sm rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
                  <LockKeyhole className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-4 text-lg font-black text-slate-950">Private thread ready</p>
                  <p className="mt-2 text-sm font-semibold text-slate-500">No message yet. Start with a clear decision, escalation, or execution request.</p>
                </div>
              </div>
            )}
            {thread.map((message) => (
              <div key={message.id} className={cx("flex", message.mine ? "justify-end" : "justify-start")}>
                <div className={cx("max-w-[78%] rounded-[26px] border px-4 py-3 shadow-sm", message.mine ? "border-slate-900 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-900")}>
                  <div className="mb-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-wide opacity-70">
                    {message.confidential && <EyeOff className="h-3 w-3" />}
                    <span>{message.author}</span>
                    <span>·</span>
                    <span>{message.at}</span>
                  </div>
                  <p className="text-sm font-semibold leading-6">{message.body}</p>
                  {message.action && (
                    <button className={cx("mt-3 flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black", message.mine ? "bg-white/10 text-white" : "bg-cyan-50 text-cyan-800")}>
                      <ClipboardCheck className="h-4 w-4" /> Convert to {message.action}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50"><Paperclip className="mr-1 inline h-3 w-3" /> Attach</button>
              <button className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50"><Mic className="mr-1 inline h-3 w-3" /> Voice note</button>
              <button className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50"><CheckCircle2 className="mr-1 inline h-3 w-3" /> Request approval</button>
              <button className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50"><Star className="mr-1 inline h-3 w-3" /> Mark priority</button>
            </div>
            <div className="flex items-end gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    sendMessage()
                  }
                }}
                className="min-h-[52px] flex-1 resize-none bg-transparent px-3 py-3 text-sm font-semibold outline-none placeholder:text-slate-400"
                placeholder="Write private message, @mention, decision, escalation, approval request…"
              />
              <button onClick={sendMessage} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white hover:bg-slate-800" aria-label="Send message">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>

        {!compact && (
          <aside className="border-l border-slate-200 bg-white p-4">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <LockKeyhole className="h-5 w-5 text-slate-700" />
                <div>
                  <p className="text-sm font-black text-slate-950">Privacy rule</p>
                  <p className="text-xs font-semibold text-slate-500">{selected.privacy}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-black text-slate-950">Members</p>
              <div className="space-y-2">
                {selected.members.map((member) => (
                  <div key={member} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                    <span className="text-sm font-bold text-slate-700">{member}</span>
                    <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-[28px] border border-slate-200 bg-slate-950 p-4 text-white">
              <p className="text-sm font-black">Smart actions</p>
              <div className="mt-3 space-y-2">
                {[
                  [ClipboardCheck, "Create task from thread"],
                  [AlertTriangle, "Escalate to manager"],
                  [Bell, "Send urgent alert"],
                  [FileText, "Generate summary note"],
                  [Archive, "Archive confidentially"],
                ].map(([Icon, label]) => (
                  <button key={label as string} className="flex w-full items-center justify-between rounded-2xl border border-white/10 px-3 py-2 text-left text-xs font-black text-white/85 hover:bg-white/10">
                    <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label as string}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-[28px] border border-cyan-200 bg-cyan-50 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-cyan-700" />
                <div>
                  <p className="text-sm font-black text-cyan-950">AI-ready layer</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-cyan-800">Later, this panel can summarize rooms, detect blockers, and convert decisions into tasks without changing the widget shell.</p>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </section>
  )
}

function MegaphoneIcon(props: React.ComponentProps<typeof Bell>) {
  return <Bell {...props} />
}
