"use client"

import * as React from "react"
import { ContentCommandTrainingAccessButton } from "./content-command/ContentCommandTrainingAccessButton"
import {
  Badge,
  Button,
  ContentRow,
  Metric,
  Meter,
  Panel,
  Shell,
  canPublish,
  isOverdue,
  itemReadiness,
  nextStatus,
  statusFlow,
  statusLabel,
  useContentStore,
  type ContentItem,
  type ContentStatus,
} from "./content-command/content-command-system"

type FilterMode = "all" | "urgent" | "review" | "publishing" | "blocked"

const quickLinks = [
  ["Create content", "/market-os/content-command-center/create", "Open the full production form"],
  ["Briefs", "/market-os/content-command-center/briefs", "Create and convert briefs into content"],
  ["Tasks", "/market-os/content-command-center/tasks", "Assign and clear production work"],
  ["Assets", "/market-os/content-command-center/assets", "Register, approve and link assets"],
  ["Calendar", "/market-os/content-command-center/calendar", "Schedule and reschedule content"],
  ["Review", "/market-os/content-command-center/review", "Approve or request revision"],
  ["Publishing", "/market-os/content-command-center/publishing", "Control ready-to-publish items"],
  ["Brand", "/market-os/content-command-center/brand-governance", "Maintain content governance rules"],
  ["CSV Import Workspace", "/market-os/imports", "Upload, validate and preview structured CSV datasets"],
  ["Enterprise Import Ops", "/market-os/imports/operations", "Review schema, approve imports and control CSV governance"],
] as const

function groupByStatus(items: ContentItem[]) {
  return statusFlow.reduce<Record<ContentStatus, ContentItem[]>>((acc, status) => {
    acc[status] = items.filter((item) => item.status === status)
    return acc
  }, { idea: [], brief: [], draft: [], review: [], approved: [], scheduled: [], published: [], revision: [], archived: [] })
}

export default function ContentCommandCenter() {
  const { store, commit, reset } = useContentStore()
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<FilterMode>("all")

  const activeItems = store.items.filter((item) => item.status !== "archived")
  const blockedIds = new Set(store.tasks.filter((task) => task.status === "blocked").map((task) => task.contentId))
  const publishable = activeItems.filter((item) => canPublish(item, store.tasks, store.rules))
  const reviewQueue = activeItems.filter((item) => item.status === "review" || item.status === "revision")
  const urgent = activeItems.filter((item) => item.priority === "Critical" || isOverdue(item.dueDate))
  const averageReadiness = activeItems.length ? Math.round(activeItems.reduce((sum, item) => sum + itemReadiness(item, store.tasks, store.rules), 0) / activeItems.length) : 0

  const filteredItems = activeItems.filter((item) => {
    const haystack = `${item.title} ${item.campaign} ${item.channel} ${item.owner} ${item.status}`.toLowerCase()
    const matchesQuery = haystack.includes(query.toLowerCase())
    const matchesMode =
      filter === "all" ||
      (filter === "urgent" && urgent.some((urgentItem) => urgentItem.id === item.id)) ||
      (filter === "review" && reviewQueue.some((reviewItem) => reviewItem.id === item.id)) ||
      (filter === "publishing" && publishable.some((publishableItem) => publishableItem.id === item.id)) ||
      (filter === "blocked" && blockedIds.has(item.id))
    return matchesQuery && matchesMode
  })

  const lanes = groupByStatus(activeItems)

  return <Shell>
    <main className="mx-auto max-w-[1600px] space-y-6 p-4 lg:p-8"><div className="flex justify-end"><ContentCommandTrainingAccessButton /></div>
      <section className="overflow-hidden rounded-[2rem] border border-slate-900 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.30),transparent_30%),linear-gradient(135deg,#020617,#0f172a_52%,#312e81)] text-white shadow-2xl shadow-slate-300">
        <div className="grid gap-8 p-6 lg:grid-cols-[1.5fr_.8fr] lg:p-8">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge kind="dark">Market-OS submodule</Badge>
              <Badge kind="dark">Phase 2 Core Execution</Badge>
            </div>
            <h1 className="mt-5 max-w-5xl text-4xl font-black leading-tight tracking-tight md:text-5xl">Content production workspace, not a static dashboard.</h1>
            <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-slate-300 md:text-base">Create, organize, assign, review, approve, schedule and monitor every marketing content item from one controlled Content Command Center surface.</p>
            <div className="mt-6 flex flex-wrap gap-3"><Button href="/market-os/content-command-center/create" kind="primary">Create content</Button><Button href="/market-os/content-command-center/assets" kind="dark">Asset library</Button><Button href="/market-os/content-command-center/tasks" kind="dark">Production tasks</Button><Button href="/market-os/imports" kind="dark">CSV Import Workspace</Button><Button href="/market-os/imports/operations" kind="primary">Enterprise Import Ops</Button><ContentCommandTrainingAccessButton /><Button onClick={reset}>Reset local demo data</Button></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5"><p className="text-xs font-black uppercase tracking-widest text-slate-300">Workspace readiness</p><p className="mt-2 text-4xl font-black">{averageReadiness}%</p><div className="mt-4"><Meter value={averageReadiness} /></div></div>
            <div className="grid grid-cols-3 gap-3"><div className="rounded-2xl border border-white/10 bg-white/10 p-4"><p className="text-xs font-black uppercase text-slate-300">Urgent</p><p className="mt-2 text-2xl font-black">{urgent.length}</p></div><div className="rounded-2xl border border-white/10 bg-white/10 p-4"><p className="text-xs font-black uppercase text-slate-300">Review</p><p className="mt-2 text-2xl font-black">{reviewQueue.length}</p></div><div className="rounded-2xl border border-white/10 bg-white/10 p-4"><p className="text-xs font-black uppercase text-slate-300">Ready</p><p className="mt-2 text-2xl font-black">{publishable.length}</p></div></div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active content" value={String(activeItems.length)} sub="Non-archived production items" />
        <Metric label="Open tasks" value={String(store.tasks.filter((task) => task.status !== "done").length)} sub="Todo, doing or blocked" />
        <Metric label="Assets" value={String(store.assets.length)} sub="Registered creative references" />
        <Metric label="Brand rules" value={String(store.rules.filter((rule) => rule.active).length)} sub="Active governance controls" />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map(([label, href, detail]) => <a key={href} href={href} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-xl"><p className="text-xs font-black uppercase tracking-wider text-rose-600">Open workspace</p><h3 className="mt-2 text-xl font-black text-slate-950">{label}</h3><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{detail}</p></a>)}
      </section>

      <Panel className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-600">Operational control</p>
            <h2 className="mt-2 text-2xl font-black">Production command table</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">Search, filter, advance status, archive and delete content without leaving the submodule.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "urgent", "review", "publishing", "blocked"] as const).map((mode) => <button key={mode} onClick={() => setFilter(mode)} className={`rounded-2xl px-4 py-3 text-sm font-black ${filter === mode ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>{statusLabel(mode)}</button>)}
          </div>
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title, campaign, owner, channel or status..." className="mt-5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none" />
        <div className="mt-5 space-y-3">
          {filteredItems.map((item) => <ContentRow key={item.id} item={item} tasks={store.tasks} onAdvance={() => commit((draft) => { draft.items = draft.items.map((candidate) => candidate.id === item.id ? { ...candidate, status: nextStatus(candidate.status), updatedAt: new Date().toISOString() } : candidate) }, "content advance", `Advanced ${item.title}`)} onArchive={() => commit((draft) => { draft.items = draft.items.map((candidate) => candidate.id === item.id ? { ...candidate, status: "archived" } : candidate) }, "content archive", `Archived ${item.title}`)} onDelete={() => commit((draft) => { draft.items = draft.items.filter((candidate) => candidate.id !== item.id); draft.tasks = draft.tasks.filter((task) => task.contentId !== item.id); draft.assets = draft.assets.filter((asset) => asset.linkedContentId !== item.id) }, "content delete", `Deleted ${item.title}`)} />)}
          {!filteredItems.length ? <p className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500">No content matches this view.</p> : null}
        </div>
      </Panel>

      <section className="grid gap-4 xl:grid-cols-7">
        {statusFlow.map((status) => <Panel key={status} className="p-4 xl:col-span-1"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black uppercase tracking-wider text-slate-600">{statusLabel(status)}</h3><Badge>{lanes[status].length}</Badge></div><div className="mt-4 space-y-3">{lanes[status].slice(0, 4).map((item) => <a key={item.id} href={`/market-os/content-command-center/${item.id}`} className="block rounded-2xl border border-slate-200 bg-slate-50 p-3 hover:bg-white"><p className="text-sm font-black text-slate-950">{item.title}</p><p className="mt-1 text-xs font-bold text-slate-500">{item.channel} • {item.owner}</p></a>)}</div></Panel>)}
      </section>
    </main>
  </Shell>
}