"use client"

import * as React from "react"
import Link from "next/link"
import {
  Badge,
  Button,
  ContentRow,
  Metric,
  Meter,
  Panel,
  Shell,
  channels,
  canPublish,
  itemReadiness,
  nextStatus,
  statusFlow,
  statusLabel,
  useContentStore,
  todayISO,
  ContentItem,
  ContentStatus,
} from "./content-command/content-command-system"

type BoardView = "command" | "pipeline" | "table" | "calendar" | "queue"
type FocusMode = "all" | "urgent" | "review" | "publishing" | "brand" | "planning"

const pageSurface = "market-os-content-command-contrast-fix min-h-screen bg-slate-50 text-slate-950 antialiased"
const premiumPanel = "rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/60"

const workspaceLinks = [
  {
    href: "/market-os/content-command-center/create",
    label: "Create content",
    intent: "Open the production form",
    detail: "Create a content item with channel, owner, reviewer, deadline, objective, audience, CTA and body.",
    tone: "bg-slate-950 text-white border-slate-950",
  },
  {
    href: "/market-os/content-command-center/briefs",
    label: "Brief builder",
    intent: "Convert strategy into work",
    detail: "Build content briefs and turn them into production-ready direction for creators.",
    tone: "bg-white text-slate-950 border-slate-200",
  },
  {
    href: "/market-os/content-command-center/calendar",
    label: "Monthly calendar",
    intent: "Plan publishing rhythm",
    detail: "Use the month grid to schedule, reschedule and open content by date.",
    tone: "bg-white text-slate-950 border-slate-200",
  },
  {
    href: "/market-os/content-command-center/review",
    label: "Review queue",
    intent: "Approve or reject work",
    detail: "Review drafts, send revisions, approve content and unblock publishing.",
    tone: "bg-white text-slate-950 border-slate-200",
  },
  {
    href: "/market-os/content-command-center/publishing",
    label: "Publishing queue",
    intent: "Release approved work",
    detail: "Publish now, hold, cancel or reschedule approved and scheduled content.",
    tone: "bg-white text-slate-950 border-slate-200",
  },
  {
    href: "/market-os/content-command-center/tasks",
    label: "Production tasks",
    intent: "Assign execution work",
    detail: "Create tasks, assign owners, update status and clear blockers.",
    tone: "bg-white text-slate-950 border-slate-200",
  },
  {
    href: "/market-os/content-command-center/assets",
    label: "Asset library",
    intent: "Control creative materials",
    detail: "Register assets, connect them to content and manage approval status.",
    tone: "bg-white text-slate-950 border-slate-200",
  },
  {
    href: "/market-os/content-command-center/brand-governance",
    label: "Brand governance",
    intent: "Protect tone and compliance",
    detail: "Maintain rules, CTA discipline, medical sensitivity and premium brand standards.",
    tone: "bg-white text-slate-950 border-slate-200",
  },
]

const executiveLanes = [
  {
    key: "planning" as FocusMode,
    title: "Planning lane",
    description: "Ideas, briefs and draft work that still needs strategic direction.",
  },
  {
    key: "review" as FocusMode,
    title: "Review lane",
    description: "Items that require approval, rejection or revision before release.",
  },
  {
    key: "publishing" as FocusMode,
    title: "Publishing lane",
    description: "Approved and scheduled work ready for calendar or publishing decisions.",
  },
  {
    key: "brand" as FocusMode,
    title: "Brand lane",
    description: "Brand-score, assets, CTA, compliance and message safety control.",
  },
]

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

function moneylessPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`
}

function isOverdue(item: ContentItem) {
  return item.dueDate < todayISO(0) && item.status !== "published" && item.status !== "archived"
}

function stageColor(status: string) {
  if (["published", "approved", "scheduled"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (["review", "revision"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-800"
  if (["archived"].includes(status)) return "border-slate-200 bg-slate-100 text-slate-500"
  return "border-slate-200 bg-white text-slate-700"
}

function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-600">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  )
}

function CorporateHero({
  total,
  urgent,
  review,
  publishable,
  onReset,
}: {
  total: number
  urgent: number
  review: number
  publishable: number
  onReset: () => void
}) {
  return (
    <section className="select-none overflow-hidden rounded-[2rem] border border-slate-900 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_32%),linear-gradient(135deg,#020617,#0f172a_62%,#111827)] text-white shadow-2xl shadow-slate-200">
      <div className="grid gap-8 p-6 lg:grid-cols-[1.5fr_.8fr] lg:p-8 2xl:p-10">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">Market-OS</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">Content Command Center</span>
            <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-100">Operational</span>
          </div>
          <h1 className="mt-5 max-w-5xl text-4xl font-black leading-[1.05] tracking-tight text-white md:text-5xl xl:text-6xl">
            Enterprise content production command center.
          </h1>
          <p className="mt-5 max-w-4xl text-base font-semibold leading-8 text-white/80 md:text-lg">
            A senior workspace for marketing, brand and communication operators to control content pipeline, calendar, review queue, publishing rhythm, assets, briefs and governance from one clean command surface.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button href="/market-os/content-command-center/create" kind="primary">+ Create content</Button>
            <Button href="/market-os/content-command-center/calendar" kind="dark">Open calendar</Button>
            <Button href="/market-os/content-command-center/review" kind="dark">Review queue</Button>
            <button onClick={onReset} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/20">Reset workspace</button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-widest text-slate-300">Active content</p>
            <p className="mt-2 text-4xl font-black text-white">{total}</p>
            <p className="mt-1 text-sm font-bold text-slate-300">Items in shared production store</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-black uppercase text-slate-300">Urgent</p>
              <p className="mt-2 text-2xl font-black text-white">{urgent}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-black uppercase text-slate-300">Review</p>
              <p className="mt-2 text-2xl font-black text-white">{review}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-black uppercase text-slate-300">Ready</p>
              <p className="mt-2 text-2xl font-black text-white">{publishable}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function GatewayCard({ link }: { link: (typeof workspaceLinks)[number] }) {
  return (
    <Link href={link.href} className={cx("group block select-none rounded-3xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl", link.tone)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={cx("text-xs font-black uppercase tracking-[0.2em]", link.tone.includes("slate-950") ? "text-white/70" : "text-rose-600")}>{link.intent}</p>
          <h3 className={cx("mt-3 text-xl font-black", link.tone.includes("slate-950") ? "text-white" : "text-slate-950")}>{link.label}</h3>
        </div>
        <span className={cx("rounded-full px-3 py-1 text-xs font-black", link.tone.includes("slate-950") ? "bg-white text-slate-950" : "bg-slate-950 text-white")}>Open</span>
      </div>
      <p className={cx("mt-4 text-sm font-semibold leading-6", link.tone.includes("slate-950") ? "text-white/75" : "text-slate-600")}>{link.detail}</p>
    </Link>
  )
}

function CommandStatGrid({ store }: { store: ReturnType<typeof useContentStore>["store"] }) {
  const pending = store.items.filter(i => ["review", "revision"].includes(i.status))
  const scheduled = store.items.filter(i => i.status === "scheduled")
  const publishable = store.items.filter(i => canPublish(i, store.tasks, store.rules))
  const overdue = store.items.filter(isOverdue)
  const blockedTasks = store.tasks.filter(t => t.status === "blocked")
  const lowBrand = store.items.filter(i => i.brandScore < 75)

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <Metric label="Content items" value={String(store.items.length)} sub="Active workspace" />
      <Metric label="Pending review" value={String(pending.length)} sub="Approval decisions" />
      <Metric label="Scheduled" value={String(scheduled.length)} sub="Calendar queue" />
      <Metric label="Publishable" value={String(publishable.length)} sub="Ready now" />
      <Metric label="Blocked tasks" value={String(blockedTasks.length)} sub="Execution risk" />
      <Metric label="Brand watch" value={String(lowBrand.length)} sub="Score below 75" />
    </section>
  )
}

function ControlStrip({
  query,
  setQuery,
  status,
  setStatus,
  channel,
  setChannel,
  view,
  setView,
  focus,
  setFocus,
}: {
  query: string
  setQuery: (value: string) => void
  status: string
  setStatus: (value: string) => void
  channel: string
  setChannel: (value: string) => void
  view: BoardView
  setView: (value: BoardView) => void
  focus: FocusMode
  setFocus: (value: FocusMode) => void
}) {
  return (
    <Panel className="p-5">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_.6fr_.6fr_.8fr_.9fr]">
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search title, campaign, owner, channel, objective..."
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-100"
        />
        <select value={status} onChange={event => setStatus(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-100">
          <option value="all">All statuses</option>
          {[...statusFlow, "revision", "archived"].map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}
        </select>
        <select value={channel} onChange={event => setChannel(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-100">
          <option value="all">All channels</option>
          {channels.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <select value={view} onChange={event => setView(event.target.value as BoardView)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-100">
          <option value="command">Command view</option>
          <option value="pipeline">Pipeline view</option>
          <option value="table">Table view</option>
          <option value="calendar">Calendar preview</option>
          <option value="queue">Queue view</option>
        </select>
        <select value={focus} onChange={event => setFocus(event.target.value as FocusMode)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-100">
          <option value="all">All focus modes</option>
          <option value="urgent">Urgent only</option>
          <option value="review">Review focus</option>
          <option value="publishing">Publishing focus</option>
          <option value="brand">Brand focus</option>
          <option value="planning">Planning focus</option>
        </select>
      </div>
    </Panel>
  )
}

function ExecutiveDecisionPanel({ store }: { store: ReturnType<typeof useContentStore>["store"] }) {
  const overdue = store.items.filter(isOverdue)
  const pending = store.items.filter(i => ["review", "revision"].includes(i.status))
  const publishable = store.items.filter(i => canPublish(i, store.tasks, store.rules))
  const lowBrand = store.items.filter(i => i.brandScore < 75)
  const nextMove = overdue.length
    ? "Clear overdue production risk before creating new work."
    : pending.length
      ? "Open review queue and unblock approvals."
      : publishable.length
        ? "Move ready items into publishing."
        : "Create or brief the next content priority."

  return (
    <Panel className="p-5">
      <SectionHeader eyebrow="Decision intelligence" title="Operator next move" description="A practical, state-based assistant panel for senior content leaders. No fake AI call: it reads the workspace and explains the next best action." />
      <div className="mt-5 select-none rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-lg">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Recommended action</p>
        <h3 className="mt-3 text-2xl font-black text-white">{nextMove}</h3>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
          This recommendation is based on overdue items, review queue pressure, publishable content and brand-score risks.
        </p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Link href="/market-os/content-command-center/tasks" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-800">Overdue items: {overdue.length}</Link>
        <Link href="/market-os/content-command-center/review" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-black text-amber-800">Review queue: {pending.length}</Link>
        <Link href="/market-os/content-command-center/publishing" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-800">Publishable: {publishable.length}</Link>
        <Link href="/market-os/content-command-center/brand-governance" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-800">Brand watch: {lowBrand.length}</Link>
      </div>
    </Panel>
  )
}

function PipelineColumn({
  status,
  items,
  store,
  onAdvance,
  onArchive,
}: {
  status: ContentStatus
  items: ContentItem[]
  store: ReturnType<typeof useContentStore>["store"]
  onAdvance: (id: string) => void
  onArchive: (id: string) => void
}) {
  return (
    <div className="min-h-[300px] rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-950">{statusLabel(status)}</h3>
          <p className="mt-1 text-xs font-bold text-slate-500">{items.length} item(s)</p>
        </div>
        <Badge>{items.length}</Badge>
      </div>
      <div className="mt-4 space-y-3">
        {items.slice(0, 5).map(item => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-black uppercase", stageColor(item.status))}>{statusLabel(item.status)}</span>
              <Badge kind="priority">{item.priority}</Badge>
            </div>
            <Link href={`/market-os/content-command-center/${item.id}`} className="mt-3 block text-sm font-black leading-5 text-slate-950 hover:underline">{item.title}</Link>
            <p className="mt-2 text-xs font-bold text-slate-500">{item.channel} • {item.owner}</p>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px] font-black uppercase text-slate-400">
                <span>Readiness</span>
                <span>{moneylessPercent(itemReadiness(item, store.tasks, store.rules))}</span>
              </div>
              <Meter value={itemReadiness(item, store.tasks, store.rules)} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => onAdvance(item.id)} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Next</button>
              <Link href={`/market-os/content-command-center/${item.id}/edit`} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Edit</Link>
              <button onClick={() => onArchive(item.id)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Archive</button>
            </div>
          </div>
        ))}
        {items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-500">No items in this lane.</div> : null}
      </div>
    </div>
  )
}

function PipelineBoard({
  store,
  visibleItems,
  onAdvance,
  onArchive,
}: {
  store: ReturnType<typeof useContentStore>["store"]
  visibleItems: ContentItem[]
  onAdvance: (id: string) => void
  onArchive: (id: string) => void
}) {
  return (
    <Panel className="p-5">
      <SectionHeader
        eyebrow="Production pipeline"
        title="From idea to published"
        description="Move content through the real workflow. Every Next action updates the shared store and will be reflected in review, publishing, calendar and detail pages."
        action={<Button href="/market-os/content-command-center/create" kind="primary">+ New content</Button>}
      />
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="grid min-w-[1180px] gap-4 xl:grid-cols-7">
        {statusFlow.map(status => (
          <PipelineColumn
            key={status}
            status={status}
            items={visibleItems.filter(item => item.status === status)}
            store={store}
            onAdvance={onAdvance}
            onArchive={onArchive}
          />
        ))}
        </div>
      </div>
    </Panel>
  )
}

function CalendarPreview({ items }: { items: ContentItem[] }) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - startOffset + 1
    const date = new Date(year, month, dayNumber)
    const inMonth = dayNumber >= 1 && dayNumber <= daysInMonth
    const iso = date.toISOString().slice(0, 10)
    return { index, dayNumber, inMonth, iso }
  })

  return (
    <Panel className="p-5">
      <SectionHeader eyebrow="Calendar preview" title="This month publishing map" description="A compact executive view. Open the full calendar page for monthly planning actions, rescheduling and content creation by date." action={<Button href="/market-os/content-command-center/calendar" kind="primary">Open full calendar</Button>} />
      <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs font-black uppercase text-slate-400">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {cells.map(cell => {
          const scheduled = items.filter(item => item.scheduledDate === cell.iso)
          return (
            <div key={cell.index} className={cx("min-h-[90px] rounded-2xl border p-2", cell.inMonth ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 text-slate-300")}>
              <p className="text-xs font-black">{cell.inMonth ? cell.dayNumber : ""}</p>
              <div className="mt-2 space-y-1">
                {scheduled.slice(0, 2).map(item => <Link key={item.id} href={`/market-os/content-command-center/${item.id}`} className="block truncate rounded-lg bg-slate-950 px-2 py-1 text-[10px] font-black text-white">{item.title}</Link>)}
                {scheduled.length > 2 ? <p className="text-[10px] font-black text-slate-500">+{scheduled.length - 2} more</p> : null}
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

function WorkQueuePanel({
  store,
  onAdvance,
}: {
  store: ReturnType<typeof useContentStore>["store"]
  onAdvance: (id: string) => void
}) {
  const review = store.items.filter(item => ["review", "revision"].includes(item.status))
  const publishing = store.items.filter(item => ["approved", "scheduled"].includes(item.status))
  const blocked = store.tasks.filter(task => task.status === "blocked")

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Panel className="p-5">
        <SectionHeader eyebrow="Review" title="Approval queue" description="Approve, revise or open full review workflow." action={<Button href="/market-os/content-command-center/review">Open review</Button>} />
        <div className="mt-5 space-y-3">
          {review.slice(0, 5).map(item => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <Link href={`/market-os/content-command-center/${item.id}`} className="text-sm font-black text-slate-950 hover:underline">{item.title}</Link>
              <p className="mt-1 text-xs font-bold text-slate-500">Reviewer: {item.reviewer}</p>
              <button onClick={() => onAdvance(item.id)} className="mt-3 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Move forward</button>
            </div>
          ))}
          {review.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">No pending review items.</p> : null}
        </div>
      </Panel>
      <Panel className="p-5">
        <SectionHeader eyebrow="Publishing" title="Release queue" description="Approved and scheduled items waiting for publishing decisions." action={<Button href="/market-os/content-command-center/publishing">Open publishing</Button>} />
        <div className="mt-5 space-y-3">
          {publishing.slice(0, 5).map(item => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <Link href={`/market-os/content-command-center/${item.id}`} className="text-sm font-black text-slate-950 hover:underline">{item.title}</Link>
              <p className="mt-1 text-xs font-bold text-slate-500">Scheduled: {item.scheduledDate}</p>
              <button onClick={() => onAdvance(item.id)} className="mt-3 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Publish / next</button>
            </div>
          ))}
          {publishing.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">No items currently waiting for release.</p> : null}
        </div>
      </Panel>
      <Panel className="p-5">
        <SectionHeader eyebrow="Blockers" title="Execution risk" description="Blocked tasks and operational blockers to clear." action={<Button href="/market-os/content-command-center/tasks">Open tasks</Button>} />
        <div className="mt-5 space-y-3">
          {blocked.slice(0, 5).map(task => (
            <div key={task.id} className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-black text-red-900">{task.title}</p>
              <p className="mt-1 text-xs font-bold text-red-700">Owner: {task.owner} • Due: {task.dueDate}</p>
            </div>
          ))}
          {blocked.length === 0 ? <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">No blocked tasks right now.</p> : null}
        </div>
      </Panel>
    </div>
  )
}

function BrandGovernanceStrip({ store }: { store: ReturnType<typeof useContentStore>["store"] }) {
  const activeRules = store.rules.filter(rule => rule.active)
  const requiredRules = store.rules.filter(rule => rule.active && rule.required)
  const lowScore = store.items.filter(item => item.brandScore < 75)
  const assetIssues = store.assets.filter(asset => asset.status === "needs revision" || asset.status === "draft")

  return (
    <Panel className="p-5">
      <SectionHeader eyebrow="Brand command" title="Governance and asset control" description="Senior content work needs disciplined brand safety, CTA clarity, asset approval and tone control." action={<Button href="/market-os/content-command-center/brand-governance" kind="primary">Open governance</Button>} />
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Active rules</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{activeRules.length}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">Governance controls</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Required</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{requiredRules.length}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">Must pass</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Brand watch</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{lowScore.length}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">Score below 75</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Asset issues</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{assetIssues.length}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">Draft/revision</p>
        </div>
      </div>
    </Panel>
  )
}

function WorkspaceNavigator() {
  return (
    <Panel className="p-5">
      <SectionHeader eyebrow="Workspace navigation" title="Execution gateways" description="Clear routes for expert operators. No hidden buttons: each card opens the page where that work is actually completed." />
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workspaceLinks.map(link => <GatewayCard key={link.href} link={link} />)}
      </div>
    </Panel>
  )
}

function ExpertFocusLanes({ focus, setFocus }: { focus: FocusMode; setFocus: (value: FocusMode) => void }) {
  return (
    <section className="grid gap-4 xl:grid-cols-4">
      {executiveLanes.map(lane => (
        <button
          key={lane.key}
          onClick={() => setFocus(lane.key)}
          className={cx(
            "rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl",
            focus === lane.key ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-950"
          )}
        >
          <p className={cx("text-xs font-black uppercase tracking-[0.2em]", focus === lane.key ? "text-white/60" : "text-rose-600")}>Focus mode</p>
          <h3 className={cx("mt-3 text-xl font-black", focus === lane.key ? "text-white" : "text-slate-950")}>{lane.title}</h3>
          <p className={cx("mt-2 text-sm font-semibold leading-6", focus === lane.key ? "text-white/75" : "text-slate-600")}>{lane.description}</p>
        </button>
      ))}
    </section>
  )
}

export default function ContentCommandCenter() {
  const { store, commit, reset } = useContentStore()
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState("all")
  const [channel, setChannel] = React.useState("all")
  const [view, setView] = React.useState<BoardView>("command")
  const [focus, setFocus] = React.useState<FocusMode>("all")

  const filtered = React.useMemo(() => {
    return store.items.filter(item => {
      const haystack = `${item.title} ${item.campaign} ${item.owner} ${item.reviewer} ${item.channel} ${item.objective} ${item.audience}`.toLowerCase()
      const matchesQuery = query ? haystack.includes(query.toLowerCase()) : true
      const matchesStatus = status === "all" ? true : item.status === status
      const matchesChannel = channel === "all" ? true : item.channel === channel
      const matchesFocus =
        focus === "all" ? true :
        focus === "urgent" ? isOverdue(item) || item.priority === "Critical" :
        focus === "review" ? ["review", "revision"].includes(item.status) :
        focus === "publishing" ? ["approved", "scheduled"].includes(item.status) :
        focus === "brand" ? item.brandScore < 80 || item.assets.length === 0 :
        focus === "planning" ? ["idea", "brief", "draft"].includes(item.status) : true
      return matchesQuery && matchesStatus && matchesChannel && matchesFocus
    })
  }, [store.items, query, status, channel, focus])

  const pending = store.items.filter(item => ["review", "revision"].includes(item.status))
  const overdue = store.items.filter(isOverdue)
  const publishable = store.items.filter(item => canPublish(item, store.tasks, store.rules))

  const advance = React.useCallback((id: string) => {
    commit(draft => {
      draft.items = draft.items.map(item => item.id === id ? { ...item, status: nextStatus(item.status), updatedAt: new Date().toISOString() } : item)
    }, "advance", `Moved content ${id} to next stage`)
  }, [commit])

  const archive = React.useCallback((id: string) => {
    commit(draft => {
      draft.items = draft.items.map(item => item.id === id ? { ...item, status: "archived", updatedAt: new Date().toISOString() } : item)
    }, "archive", `Archived content ${id}`)
  }, [commit])

  const remove = React.useCallback((id: string) => {
    commit(draft => {
      draft.items = draft.items.filter(item => item.id !== id)
      draft.tasks = draft.tasks.filter(task => task.contentId !== id)
      draft.assets = draft.assets.filter(asset => asset.linkedContentId !== id)
    }, "delete", `Deleted content ${id}`)
  }, [commit])

  return (
    <Shell>
      <style jsx global>{`
        .market-os-content-command-contrast-fix ::selection {
          background: rgba(15, 23, 42, 0.12);
          color: inherit;
        }
        .market-os-content-command-contrast-fix .premium-no-select ::selection {
          background: transparent;
          color: inherit;
        }
        .market-os-content-command-contrast-fix a,
        .market-os-content-command-contrast-fix button {
          text-decoration: none;
        }
      `}</style>
      <main className={cx(pageSurface, "mx-auto max-w-[1900px] space-y-6 p-4 lg:p-8")}>
        <CorporateHero total={store.items.length} urgent={overdue.length} review={pending.length} publishable={publishable.length} onReset={reset} />
        <CommandStatGrid store={store} />
        <ControlStrip
          query={query}
          setQuery={setQuery}
          status={status}
          setStatus={setStatus}
          channel={channel}
          setChannel={setChannel}
          view={view}
          setView={setView}
          focus={focus}
          setFocus={setFocus}
        />
        <ExpertFocusLanes focus={focus} setFocus={setFocus} />
        <WorkspaceNavigator />

        {view === "command" ? (
          <div className="space-y-5">
            <PipelineBoard store={store} visibleItems={filtered} onAdvance={advance} onArchive={archive} />
            <ExecutiveDecisionPanel store={store} />
          </div>
        ) : null}

        {view === "pipeline" ? <PipelineBoard store={store} visibleItems={filtered} onAdvance={advance} onArchive={archive} /> : null}
        {view === "calendar" ? <CalendarPreview items={filtered} /> : null}
        {view === "queue" ? <WorkQueuePanel store={store} onAdvance={advance} /> : null}

        {view === "table" || view === "command" ? (
          <Panel className="p-5">
            <SectionHeader
              eyebrow="Content inventory"
              title="Operational work table"
              description="Every row has real actions: open, edit, advance, archive and delete. These actions update the same local store used by all subpages."
              action={<Button href="/market-os/content-command-center/create" kind="primary">+ Create content</Button>}
            />
            <div className="mt-5 space-y-3">
              {filtered.map(item => (
                <ContentRow key={item.id} item={item} tasks={store.tasks} onAdvance={() => advance(item.id)} onArchive={() => archive(item.id)} onDelete={() => remove(item.id)} />
              ))}
              {filtered.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <h3 className="text-2xl font-black text-slate-950">No content matches this view.</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">Clear filters or create a new content item.</p>
                  <div className="mt-5 flex justify-center">
                    <Button href="/market-os/content-command-center/create" kind="primary">+ Create content</Button>
                  </div>
                </div>
              ) : null}
            </div>
          </Panel>
        ) : null}

        <WorkQueuePanel store={store} onAdvance={advance} />
        <BrandGovernanceStrip store={store} />

        <Panel className="p-5">
          <SectionHeader eyebrow="Audit trail" title="Recent execution log" description="Visible trace of actions performed across the content command workspace." />
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {store.logs.slice(0, 8).map(log => (
              <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">{log.action}</p>
                <p className="mt-2 text-sm font-black text-slate-950">{log.entity}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{log.detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      </main>
    </Shell>
  )
}
