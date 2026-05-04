"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Archive,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Image,
  Layers3,
  Megaphone,
  PauseCircle,
  PlayCircle,
  Plus,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Target,
  UserCheck,
  Wand2,
  XCircle,
} from "lucide-react"
import {
  contentTypeLabels,
  defaultServices,
  seedContentItems,
  stageLabels,
  stageOrder,
  type ContentPriority,
  type ContentStage,
  type ContentWorkspaceItem,
  type ServiceOption,
} from "@/lib/market-os/content-workspace"

const STORAGE_KEY = "market-os-content-items"
const ENABLE_DEMO_CONTENT = false

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ")
}

function loadStoredItems(): ContentWorkspaceItem[] {
  if (typeof window === "undefined") return ENABLE_DEMO_CONTENT ? seedContentItems : []
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return ENABLE_DEMO_CONTENT ? seedContentItems : []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : (ENABLE_DEMO_CONTENT ? seedContentItems : [])
  } catch {
    return ENABLE_DEMO_CONTENT ? seedContentItems : []
  }
}

function persistItems(items: ContentWorkspaceItem[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

type OperationalStage = ContentStage | "archived" | "paused"
type ContentAction = "submit_review" | "approve" | "reject" | "publish" | "pause" | "resume" | "archive" | "cancel"

function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode
  tone?: "slate" | "pink" | "green" | "amber" | "red" | "violet" | "blue" | "dark"
}) {
  const m = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    pink: "bg-pink-50 text-pink-700 border-pink-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    dark: "bg-slate-900 text-white border-slate-800",
  }

  return (
    <span className={cn("rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide", m[tone])}>
      {children}
    </span>
  )
}

const button =
  "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
const input =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-50"

function priorityTone(p: ContentPriority) {
  return p === "urgent" ? "red" : p === "high" ? "amber" : p === "normal" ? "blue" : "slate"
}

function getOperationalStage(item: ContentWorkspaceItem): OperationalStage {
  if (String(item.approval_status) === "archived") return "archived"
  if (String(item.approval_status) === "paused") return "paused"
  return item.stage
}

function stageTone(s: OperationalStage) {
  return s === "published" || s === "approved"
    ? "green"
    : s === "rejected"
      ? "red"
      : s === "review"
        ? "violet"
        : s === "production"
          ? "amber"
          : s === "archived"
            ? "dark"
            : s === "paused"
              ? "blue"
              : "slate"
}

function safeStageLabel(s: OperationalStage) {
  if (s === "archived") return "Archived"
  if (s === "paused") return "Paused"
  return stageLabels[s]
}

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: any; sub: string }) {
  return (
    <div className="rounded-[1.65rem] border border-white/10 bg-white/10 p-5 shadow-xl shadow-black/10 backdrop-blur">
      <Icon className="h-5 w-5 text-pink-200" />
      <p className="mt-4 text-[11px] font-black uppercase tracking-[0.2em] !text-white/75">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight !text-white">{value}</p>
      <p className="mt-1 text-xs font-bold !text-white/65">{sub}</p>
    </div>
  )
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  children,
  dark = false,
}: {
  title: string
  subtitle?: string
  icon: any
  children: React.ReactNode
  dark?: boolean
}) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border p-5 shadow-sm",
        dark ? "border-slate-800 bg-slate-950 text-white shadow-xl shadow-slate-900/10" : "border-slate-200 bg-white text-slate-950",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={cn("flex items-center gap-2 text-lg font-black", dark ? "!text-white" : "!text-slate-950")}>
            <Icon className={cn("h-5 w-5", dark ? "text-pink-300" : "text-pink-600")} />
            {title}
          </h2>
          {subtitle ? <p className={cn("mt-1 text-sm font-semibold", dark ? "!text-white/75" : "!text-slate-500")}>{subtitle}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default function ContentCommandCenter() {
  const [items, setItems] = useState<ContentWorkspaceItem[]>(() => loadStoredItems())
  const [, setServices] = useState<ServiceOption[]>(defaultServices)
  const [selected, setSelected] = useState<ContentWorkspaceItem | null>(() => loadStoredItems()[0] || null)
  const [filter, setFilter] = useState<OperationalStage | "all">("all")
  const [query, setQuery] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("Ready for content execution.")

  useEffect(() => {
    const localItems = loadStoredItems()
    setItems(localItems)
    setSelected((current) => current || localItems[0] || null)

    fetch("/api/market-os/content-workspace")
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j.data) && j.data.length && typeof window !== "undefined" && !window.localStorage.getItem(STORAGE_KEY)) {
          setItems(j.data)
          setSelected(j.data[0] || null)
          persistItems(j.data)
        }
      })
      .catch(() => {})

    fetch("/api/market-os/content-workspace/services")
      .then((r) => r.json())
      .then((j) => Array.isArray(j.data) && setServices(j.data))
      .catch(() => {})
  }, [])

  const visible = useMemo(() => {
    return items.filter((i) => {
      const operationalStage = getOperationalStage(i)
      const stageMatch = filter === "all" ? true : operationalStage === filter
      const q = query.trim().toLowerCase()
      const queryMatch =
        !q ||
        [i.title, i.service_name, i.creator, i.channel, i.target, i.objective]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)

      return stageMatch && queryMatch
    })
  }, [items, filter, query])

  const stats = useMemo(
    () => ({
      total: items.length,
      review: items.filter((i) => i.stage === "review").length,
      approved: items.filter((i) => i.stage === "approved").length,
      published: items.filter((i) => i.stage === "published").length,
      output: Math.round(items.reduce((s, i) => s + (i.production_score || 0), 0) / Math.max(1, items.length)),
      attached: items.filter((i) => !!i.asset_url).length,
    }),
    [items],
  )

  async function apiAction(id: string, action: ContentAction | "smart_tool", patch: Partial<ContentWorkspaceItem> = {}) {
    setBusy(true)
    setMessage(`Syncing ${action.replace("_", " ")}...`)

    const previousItems = items
    const nextItems = items.map((i) => (i.id === id ? { ...i, ...patch } : i))

    setItems(nextItems)
    setSelected(nextItems.find((i) => i.id === id) || null)
    persistItems(nextItems)

    try {
      const res = await fetch("/api/market-os/content-workspace/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...patch }),
      })

      if (!res.ok) throw new Error("Action failed")
      setMessage(`${action.replace("_", " ")} synced.`)
    } catch {
      setItems(nextItems)
      setSelected(nextItems.find((i) => i.id === id) || null)
      persistItems(nextItems)
      setMessage(`${action.replace("_", " ")} saved locally. API sync unavailable.`)
    } finally {
      setBusy(false)
    }
  }

  function actionPatch(action: ContentAction, item: ContentWorkspaceItem): Partial<ContentWorkspaceItem> {
    if (action === "submit_review") {
      return {
        stage: "review" as ContentStage,
        approval_status: "submitted" as any,
        production_score: Math.max(item.production_score || 0, 75),
      }
    }

    if (action === "approve") {
      return {
        stage: "approved" as ContentStage,
        approval_status: "approved" as any,
        production_score: Math.max(item.production_score || 0, 90),
      }
    }

    if (action === "reject") {
      return {
        stage: "rejected" as ContentStage,
        approval_status: "rejected" as any,
      }
    }

    if (action === "publish") {
      return {
        stage: "published" as ContentStage,
        approval_status: String(item.approval_status) === "approved" ? ("approved" as any) : (item.approval_status as any),
        production_score: 100,
      }
    }

    if (action === "pause") {
      return {
        stage: item.stage || ("planned" as ContentStage),
        approval_status: "paused" as any,
      }
    }

    if (action === "resume") {
      return {
        stage: "planned" as ContentStage,
        approval_status: "none" as any,
      }
    }

    if (action === "archive") {
      return {
        stage: item.stage || ("planned" as ContentStage),
        approval_status: "archived" as any,
      }
    }

    if (action === "cancel") {
      return {
        stage: "rejected" as ContentStage,
        approval_status: "cancelled" as any,
      }
    }

    return {}
  }

  function run(action: ContentAction, item?: ContentWorkspaceItem | null) {
    const target = item || selected
    if (!target || busy) return
    apiAction(target.id, action, actionPatch(action, target))
  }

  function runSmartTool(kind: "brief" | "cta" | "tone" | "checklist" | "caption") {
    if (!selected || busy) {
      setMessage("Select a deliverable first.")
      return
    }

    const service = selected.service_name || "AngelCare service"
    const snippets = {
      brief: `SMART BRIEF — ${service}\nClarifier le problème client, la preuve AngelCare, le bénéfice direct, le canal, le CTA et le livrable final attendu.`,
      cta: `CTA RECOMMANDÉ\nEnvoyez-nous un message WhatsApp pour recevoir une orientation rapide et adaptée.`,
      tone: `BRAND TONE CHECK\nTon rassurant, professionnel, humain, précis. Éviter les promesses excessives. Mettre en avant confiance, organisation et qualité.`,
      checklist: `REVIEW CHECKLIST\n1. Service correctement lié.\n2. Message clair.\n3. CTA visible.\n4. Asset attaché.\n5. Manager peut approuver ou rejeter.`,
      caption: `PUBLISHING CAPTION\nAngelCare accompagne les familles avec des solutions fiables, humaines et organisées. Contactez-nous pour une orientation rapide.`,
    }

    const output = `${selected.output_notes || ""}\n\n${snippets[kind]}`.trim()
    apiAction(selected.id, "smart_tool", {
      output_notes: output,
      production_score: Math.max(selected.production_score || 0, 55),
    })
  }

  const workflowPercent = Math.round(
    (items.filter((i) => ["review", "approved", "published"].includes(i.stage)).length / Math.max(1, items.length)) * 100,
  )

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe4f0,transparent_30%),linear-gradient(180deg,#f8fafc,#eef2f7)] p-5 text-slate-950 md:p-8">
      <section className="mx-auto max-w-[1700px] space-y-6">
        <header className="overflow-hidden rounded-[2.6rem] bg-slate-950 text-white shadow-2xl">
          <div className="relative grid gap-7 p-7 xl:grid-cols-[1.35fr_.9fr]">
            <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-pink-500/25 blur-3xl" />
            <div className="relative z-10">
              <div className="flex flex-wrap gap-2">
                <Badge tone="pink">MARKET-OS</Badge>
                <Badge tone="violet">Content workspace</Badge>
                <Badge tone="green">Agent execution</Badge>
              </div>
              <h1 className="mt-5 max-w-5xl text-4xl font-black tracking-tight !text-white drop-shadow-sm md:text-6xl">
                Content Production & Deliverables Command Center
              </h1>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 !text-white/85">
                Plan, control, execute, review, approve, publish and track AngelCare content deliverables with a professional marketing production cockpit.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/market-os/content-command-center/create" className={cn(button, "bg-pink-500 !text-white shadow-lg shadow-pink-500/20")}>
                  <Plus className="mr-2 h-4 w-4 text-white" /> <span className="!text-white">Create content task</span>
                </Link>
                <button onClick={() => setFilter("review")} className={cn(button, "border border-white/15 bg-white/10 !text-white hover:bg-white/15")}>
                  <ClipboardCheck className="mr-2 h-4 w-4 text-white" /> <span className="!text-white">Review queue</span>
                </button>
                <button onClick={() => setFilter("published")} className={cn(button, "border border-white/15 bg-white/10 !text-white hover:bg-white/15")}>
                  <PlayCircle className="mr-2 h-4 w-4 text-white" /> <span className="!text-white">Published outputs</span>
                </button>
              </div>
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-3">
              <StatCard label="Livrables" value={stats.total} icon={FileText} sub="active production load" />
              <StatCard label="In review" value={stats.review} icon={ClipboardCheck} sub="manager validation" />
              <StatCard label="Published" value={stats.published} icon={FileCheck2} sub="market-ready outputs" />
              <StatCard label="Output score" value={`${stats.output}%`} icon={BarChart3} sub="production maturity" />
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[.75fr_1.45fr_.85fr]">
          <aside className="space-y-5">
            <Panel title="1. Navigation & creation" subtitle="Use the dedicated creation page to build complete content tasks, then manage them here." icon={Plus}>
              <Link href="/market-os/content-command-center/create" className={cn(button, "w-full bg-pink-600 !text-white shadow-lg shadow-pink-500/15")}>
                <Plus className="mr-2 h-4 w-4 text-white" />
                <span className="!text-white">Create new content properly</span>
              </Link>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link href="/market-os/content-command-center" className={cn(button, "border border-slate-200 bg-white text-slate-800")}>
                  Center
                </Link>
                <Link href="/market-os" className={cn(button, "border border-slate-200 bg-white text-slate-800")}>
                  Market-OS
                </Link>
              </div>
            </Panel>

            <Panel title="2. Search & filter control" subtitle="Find work by service, creator, channel, audience or objective." icon={Search}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input className={cn(input, "pl-10")} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search content tasks..." />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => setFilter("all")} className={cn(button, filter === "all" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700")}>
                  All
                </button>
                {stageOrder.map((s) => (
                  <button key={s} onClick={() => setFilter(s)} className={cn(button, filter === s ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700")}>
                    {stageLabels[s]}
                  </button>
                ))}
                <button onClick={() => setFilter("paused")} className={cn(button, filter === "paused" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700")}>
                  Paused
                </button>
                <button onClick={() => setFilter("archived")} className={cn(button, filter === "archived" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700")}>
                  Archived
                </button>
              </div>
            </Panel>

            <Panel title="3. Smart production tools" subtitle="These buttons now update the selected task notes and sync locally/API." icon={Sparkles} dark>
              <div className="grid gap-2">
                {[
                  ["Generate brief angle", "brief"],
                  ["Prepare CTA", "cta"],
                  ["Check brand tone", "tone"],
                  ["Create review checklist", "checklist"],
                  ["Prepare publishing caption", "caption"],
                ].map(([label, kind]) => (
                  <button key={kind} onClick={() => runSmartTool(kind as any)} className={cn(button, "justify-start border border-white/10 bg-white/10 text-left !text-white hover:bg-white/15")}>
                    <Wand2 className="mr-2 h-4 w-4 text-pink-200" />
                    {label}
                  </button>
                ))}
              </div>
            </Panel>
          </aside>

          <section className="space-y-5">
            <Panel title="4. Pipeline board" subtitle={`${visible.length} visible deliverables. Select any card to operate it from the execution panel.`} icon={Layers3}>
              <div className="grid gap-4 lg:grid-cols-2">
                {visible.map((item) => {
                  const operationalStage = getOperationalStage(item)

                  return (
                    <article
                      key={item.id}
                      onClick={() => setSelected(item)}
                      className={cn(
                        "cursor-pointer rounded-[2rem] border bg-white p-5 text-slate-950 shadow-sm transition hover:-translate-y-1 hover:shadow-xl",
                        selected?.id === item.id ? "border-pink-300 ring-4 ring-pink-50" : "border-slate-200",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
                            <Badge tone={stageTone(operationalStage)}>{safeStageLabel(operationalStage)}</Badge>
                            <Badge tone="pink">{contentTypeLabels[item.content_type]}</Badge>
                          </div>
                          <h3 className="mt-3 text-lg font-black leading-snug text-slate-950">{item.title}</h3>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {item.service_name || "No service linked"} · {item.creator || "Unassigned"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-pink-50 p-3 text-pink-600">
                          <Layers3 className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-bold text-slate-700">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <Megaphone className="mb-1 h-4 w-4 text-slate-500" />
                          {item.channel}
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <UserCheck className="mb-1 h-4 w-4 text-slate-500" />
                          {item.target}
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <CalendarDays className="mb-1 h-4 w-4 text-slate-500" />
                          {item.deadline || "No deadline"}
                        </div>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-pink-500" style={{ width: `${Math.min(100, Math.max(0, item.production_score || 0))}%` }} />
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-600">{item.objective || "No objective written yet."}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          onClick={(e) => e.stopPropagation()}
                          href={`/market-os/content-command-center/${item.id}`}
                          className={cn(button, "border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800")}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Open / edit
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            run("submit_review", item)
                          }}
                          className={cn(button, "border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700")}
                        >
                          <Send className="mr-2 h-4 w-4" /> Review
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            run("archive", item)
                          }}
                          className={cn(button, "border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700")}
                        >
                          <Archive className="mr-2 h-4 w-4" /> Archive
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </Panel>

            <Panel title="5. Workflow command map" subtitle="Operational volume by lifecycle stage." icon={Filter}>
              <div className="grid gap-3 md:grid-cols-4">
                {[...stageOrder, "paused", "archived"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s as OperationalStage)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-slate-900 transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    <Badge tone={stageTone(s as OperationalStage)}>{safeStageLabel(s as OperationalStage)}</Badge>
                    <p className="mt-3 text-2xl font-black">{items.filter((i) => getOperationalStage(i) === s).length}</p>
                    <p className="text-xs font-bold text-slate-500">deliverables</p>
                  </button>
                ))}
              </div>
            </Panel>
          </section>

          <aside className="space-y-5">
            <Panel title="6. Execution panel" subtitle={message} icon={Eye}>
              {selected ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={stageTone(getOperationalStage(selected))}>{safeStageLabel(getOperationalStage(selected))}</Badge>
                      <Badge tone={priorityTone(selected.priority)}>{selected.priority}</Badge>
                    </div>
                    <h3 className="mt-3 text-xl font-black text-slate-950">{selected.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{selected.service_name || "No service linked"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button disabled={busy} onClick={() => run("submit_review")} className={cn(button, "bg-violet-600 !text-white")}>
                      <Send className="mr-2 h-4 w-4" /> Submit
                    </button>
                    <button disabled={busy} onClick={() => run("approve")} className={cn(button, "bg-emerald-600 !text-white")}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                    </button>
                    <button disabled={busy} onClick={() => run("reject")} className={cn(button, "bg-red-600 !text-white")}>
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </button>
                    <button disabled={busy} onClick={() => run("publish")} className={cn(button, "bg-slate-950 !text-white")}>
                      <PlayCircle className="mr-2 h-4 w-4" /> Publish
                    </button>
                    <button disabled={busy} onClick={() => run("pause")} className={cn(button, "border border-blue-200 bg-blue-50 text-blue-700")}>
                      <PauseCircle className="mr-2 h-4 w-4" /> Pause
                    </button>
                    <button disabled={busy} onClick={() => run("archive")} className={cn(button, "border border-slate-200 bg-slate-100 text-slate-700")}>
                      <Archive className="mr-2 h-4 w-4" /> Archive
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/market-os/content-command-center/${selected.id}`} className={cn(button, "border border-slate-200 bg-white text-center text-slate-800")}>
                      <FileText className="mr-2 h-4 w-4" /> Open editor
                    </Link>
                    <button disabled={busy} onClick={() => run("resume")} className={cn(button, "border border-slate-200 bg-white text-slate-800")}>
                      <RotateCcw className="mr-2 h-4 w-4" /> Resume
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-500">Select a deliverable to execute.</p>
              )}
            </Panel>

            <Panel title="7. Selected output intelligence" subtitle="Live brief, review and asset visibility." icon={Target}>
              {selected ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Objective</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{selected.objective || "No objective yet."}</p>
                  </div>
                  <div className="rounded-2xl bg-pink-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-pink-700">Review notes</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{selected.review_notes || "No review notes yet."}</p>
                  </div>
                  {selected.asset_url ? (
                    <a href={selected.asset_url} target="_blank" className={cn(button, "w-full border border-slate-200 bg-white text-center text-slate-800")}>
                      <ArrowUpRight className="mr-2 h-4 w-4" /> Open attached asset
                    </a>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-bold text-slate-500">
                      <Image className="mx-auto mb-2 h-6 w-6" /> No asset attached yet
                    </div>
                  )}
                </div>
              ) : null}
            </Panel>

            <Panel title="8. Production tracker" subtitle="Output health and operational pace." icon={BarChart3}>
              <div className="space-y-4">
                {[
                  ["Workflow", workflowPercent],
                  ["Asset coverage", Math.round((stats.attached / Math.max(1, stats.total)) * 100)],
                  ["Output score", stats.output],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                      <span>{label}</span>
                      <span>{value}%</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-pink-500" style={{ width: `${Math.min(100, Math.max(0, Number(value)))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </aside>
        </div>
      </section>
    </main>
  )
}