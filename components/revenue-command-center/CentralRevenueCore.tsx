"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { ComponentType } from "react"
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Handshake,
  LineChart,
  Map,
  Megaphone,
  PhoneCall,
  RefreshCw,
  ShieldAlert,
  Target,
  Users,
  Workflow,
  Zap,
} from "lucide-react"

type CoreSectionId =
  | "prospects"
  | "appointments"
  | "sdr"
  | "daily-tasks"
  | "campaigns"
  | "partnerships"
  | "revenue-analytics"
  | "executive-briefing"
  | "follow-ups"
  | "b2c-workflow"
  | "decision-maps"

type RevenuePriority = "critical" | "high" | "medium" | "low"
type RevenueStatus = "new" | "active" | "blocked" | "recovery" | "won" | "lost" | "done"

type CoreRecord = {
  id: string
  section: CoreSectionId
  title: string
  owner: string
  status: RevenueStatus
  priority: RevenuePriority
  valueMad: number
  probability: number
  nextAction: string
  dueDate: string
  source: string
  linkedEntity?: string
  decisionMaker?: string
  notes: string
  createdAt: string
  updatedAt: string
}

type CoreAlert = {
  id: string
  level: "critical" | "warning" | "info"
  title: string
  message: string
  linkedSection: CoreSectionId
  createdAt: string
}

type CoreStore = {
  records: CoreRecord[]
  alerts: CoreAlert[]
  lastSyncedAt: string
}

const CENTRAL_STORE_KEY = "angelcare_revenue_central_core_v1"
const LEGACY_PROSPECTS_KEY = "revenue_prospects_v12_mega_store"

const sectionMeta: Array<{
  id: CoreSectionId
  title: string
  subtitle: string
  icon: ComponentType<{ className?: string }>
}> = [
  { id: "prospects", title: "Prospects", subtitle: "Unified pipeline, value, ownership and qualification", icon: Users },
  { id: "appointments", title: "Appointments", subtitle: "Booking, attendance, conversion and recovery", icon: CalendarCheck },
  { id: "sdr", title: "SDR", subtitle: "Outbound execution, calls, scripts and next actions", icon: PhoneCall },
  { id: "daily-tasks", title: "Daily tasks", subtitle: "One execution queue for revenue operators", icon: ClipboardList },
  { id: "campaigns", title: "Campaigns", subtitle: "Revenue campaigns, lead sources and activation", icon: Megaphone },
  { id: "partnerships", title: "Partnerships", subtitle: "B2B pipeline, meetings, agreements and referrals", icon: Handshake },
  { id: "revenue-analytics", title: "Revenue analytics", subtitle: "Pipeline value, conversion, risk and priorities", icon: BarChart3 },
  { id: "executive-briefing", title: "Executive briefing", subtitle: "Direction-level alerts and intervention map", icon: BriefcaseBusiness },
  { id: "follow-ups", title: "Follow-ups", subtitle: "Overdue pressure, recovery loops and reminders", icon: RefreshCw },
  { id: "b2c-workflow", title: "B2C workflow", subtitle: "Family journey from intake to conversion", icon: Workflow },
  { id: "decision-maps", title: "Decision maps", subtitle: "Stakeholders, blockers and decision confirmation", icon: Map },
]

const nowIso = () => new Date().toISOString()
const mad = (value: number) => `${Math.round(value).toLocaleString("fr-MA")} MAD`

function fallbackStore(): CoreStore {
  const today = new Date().toISOString().slice(0, 10)
  const records: CoreRecord[] = [
    {
      id: "core-prospect-001",
      section: "prospects",
      title: "B2B preschool prospect - qualification required",
      owner: "Revenue Team",
      status: "active",
      priority: "critical",
      valueMad: 420000,
      probability: 71,
      nextAction: "Confirm decision maker and convert into appointment",
      dueDate: today,
      source: "Central seed",
      linkedEntity: "Prospect pipeline",
      decisionMaker: "Not confirmed",
      notes: "Critical pipeline item. Must remain visible across SDR, appointments, follow-ups, analytics and executive briefing.",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "core-followup-001",
      section: "follow-ups",
      title: "Overdue follow-up recovery loop",
      owner: "SDR Team",
      status: "recovery",
      priority: "high",
      valueMad: 95000,
      probability: 48,
      nextAction: "Call, log answer, and schedule next step",
      dueDate: today,
      source: "Central seed",
      linkedEntity: "Recovery queue",
      notes: "Shared follow-up layer connected to prospects, appointments and executive risk.",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "core-partnership-001",
      section: "partnerships",
      title: "Kindergarten partnership activation",
      owner: "Business Development",
      status: "active",
      priority: "high",
      valueMad: 180000,
      probability: 62,
      nextAction: "Prepare meeting brief and referral offer",
      dueDate: today,
      source: "Central seed",
      linkedEntity: "B2B partnership",
      decisionMaker: "Direction / Owner",
      notes: "Must feed campaigns, appointments, decision map, executive briefing and analytics.",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ]

  return {
    records,
    alerts: buildAlerts(records),
    lastSyncedAt: nowIso(),
  }
}

function buildAlerts(records: CoreRecord[]): CoreAlert[] {
  const critical = records.filter((r) => r.priority === "critical" || r.status === "blocked" || r.status === "recovery")
  const overdue = records.filter((r) => r.dueDate && new Date(r.dueDate) < new Date(new Date().toISOString().slice(0, 10)))
  return [
    ...critical.slice(0, 6).map((record) => ({
      id: `alert-${record.id}`,
      level: "critical" as const,
      title: `Critical revenue attention: ${record.title}`,
      message: `${record.owner} must execute: ${record.nextAction}`,
      linkedSection: record.section,
      createdAt: nowIso(),
    })),
    ...overdue.slice(0, 4).map((record) => ({
      id: `overdue-${record.id}`,
      level: "warning" as const,
      title: `Overdue revenue action: ${record.title}`,
      message: `Due date passed. Move it into follow-up or recovery today.`,
      linkedSection: record.section,
      createdAt: nowIso(),
    })),
  ]
}

function normalizeLegacyProspects(records: CoreRecord[]): CoreRecord[] {
  if (typeof window === "undefined") return records
  try {
    const raw = window.localStorage.getItem(LEGACY_PROSPECTS_KEY)
    if (!raw) return records
    const legacy = JSON.parse(raw)
    const prospects = Array.isArray(legacy?.prospects) ? legacy.prospects : []
    const migrated: CoreRecord[] = prospects.map((p: any) => ({
      id: `legacy-prospect-${String(p.id ?? crypto.randomUUID())}`,
      section: "prospects" as const,
      title: String(p.company || p.name || p.contactName || "Legacy prospect"),
      owner: String(p.owner || p.closer || "Revenue Team"),
      status: p.stage === "closed_won" ? "won" : p.stage === "closed_lost" ? "lost" : p.health === "recovery" ? "recovery" : "active",
      priority: ["critical", "high", "medium", "low"].includes(p.priority) ? p.priority : "medium",
      valueMad: Number(p.valueMad || 0),
      probability: Number(p.probability || p.score || 0),
      nextAction: String(p.nextAction || "Qualify and assign next action"),
      dueDate: String(p.nextContactDate || new Date().toISOString().slice(0, 10)),
      source: String(p.source || "Migrated prospects workspace"),
      linkedEntity: String(p.type || "prospect"),
      decisionMaker: String(p.decisionMaker || (p.decisionMakerConfirmed ? "Confirmed" : "Not confirmed")),
      notes: String(p.needSummary || p.qualificationNotes || p.notes || "Migrated from previous Revenue Prospects workspace."),
      createdAt: String(p.createdAt || nowIso()),
      updatedAt: nowIso(),
    }))
    const existing = new Set(records.map((r) => r.id))
    return [...records, ...migrated.filter((r) => !existing.has(r.id))]
  } catch {
    return records
  }
}

function readStore(): CoreStore {
  if (typeof window === "undefined") return fallbackStore()
  try {
    const raw = window.localStorage.getItem(CENTRAL_STORE_KEY)
    const parsed = raw ? JSON.parse(raw) : fallbackStore()
    const records = normalizeLegacyProspects(Array.isArray(parsed.records) ? parsed.records : [])
    const store: CoreStore = {
      records: records.length ? records : fallbackStore().records,
      alerts: buildAlerts(records.length ? records : fallbackStore().records),
      lastSyncedAt: nowIso(),
    }
    window.localStorage.setItem(CENTRAL_STORE_KEY, JSON.stringify(store))
    return store
  } catch {
    const store = fallbackStore()
    window.localStorage.setItem(CENTRAL_STORE_KEY, JSON.stringify(store))
    return store
  }
}

export default function CentralRevenueCore({ initialFocus = "prospects" }: { initialFocus?: CoreSectionId | string }) {
  const safeFocus = sectionMeta.some((s) => s.id === initialFocus) ? (initialFocus as CoreSectionId) : "prospects"
  const [active, setActive] = useState<CoreSectionId>(safeFocus)
  const [store, setStore] = useState<CoreStore>(() => fallbackStore())
  const [draft, setDraft] = useState({ title: "", owner: "", valueMad: "", nextAction: "" })

  useEffect(() => {
    setStore(readStore())
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CENTRAL_STORE_KEY, JSON.stringify({ ...store, alerts: buildAlerts(store.records), lastSyncedAt: nowIso() }))
    }
  }, [store.records])

  const activeRecords = useMemo(() => store.records.filter((r) => r.section === active), [store.records, active])
  const criticalRecords = useMemo(() => store.records.filter((r) => r.priority === "critical" || r.status === "blocked" || r.status === "recovery"), [store.records])
  const totalValue = useMemo(() => store.records.reduce((sum, r) => sum + Number(r.valueMad || 0), 0), [store.records])
  const weightedPipeline = useMemo(() => store.records.reduce((sum, r) => sum + Number(r.valueMad || 0) * (Number(r.probability || 0) / 100), 0), [store.records])

  function addRecord() {
    const title = draft.title.trim()
    if (!title) return
    const record: CoreRecord = {
      id: `core-${active}-${Date.now()}`,
      section: active,
      title,
      owner: draft.owner.trim() || "Revenue Team",
      status: "active",
      priority: "high",
      valueMad: Number(draft.valueMad || 0),
      probability: 50,
      nextAction: draft.nextAction.trim() || "Assign next action",
      dueDate: new Date().toISOString().slice(0, 10),
      source: "Central Revenue Core",
      notes: "Created inside the unified central engine and visible to all revenue intelligence layers.",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    setStore((current) => ({ ...current, records: [record, ...current.records], alerts: buildAlerts([record, ...current.records]) }))
    setDraft({ title: "", owner: "", valueMad: "", nextAction: "" })
  }

  function updateStatus(id: string, status: RevenueStatus) {
    setStore((current) => {
      const records: CoreRecord[] = current.records.map((r) => (r.id === id ? { ...r, status, updatedAt: nowIso() } : r))
      return { ...current, records, alerts: buildAlerts(records) }
    })
  }

  function escalate(id: string) {
    setStore((current) => {
      const records: CoreRecord[] = current.records.map((r) => (r.id === id ? { ...r, priority: "critical" as RevenuePriority, status: "recovery" as RevenueStatus, updatedAt: nowIso() } : r))
      return { ...current, records, alerts: buildAlerts(records) }
    })
  }

  const activeMeta = sectionMeta.find((s) => s.id === active) ?? sectionMeta[0]
  const ActiveIcon = activeMeta.icon

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="w-full min-w-0 px-6 py-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.36em] text-emerald-700">Revenue Command Center / Central Core</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Central Revenue Core</h1>
              <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                One shared revenue engine for prospects, appointments, SDR, daily tasks, campaigns, partnerships, analytics, executive briefing, follow-ups, B2C workflow and decision maps.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm"><b className="block text-2xl">{store.records.length}</b><span>records</span></div>
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 shadow-sm"><b className="block text-2xl">{criticalRecords.length}</b><span>critical</span></div>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"><b className="block text-2xl">{mad(weightedPipeline)}</b><span>weighted</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className=" grid max-w-[1500px] gap-5 px-6 py-6 lg:grid-cols-[320px_1fr_360px]">
        <aside className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-700"><Target className="h-4 w-4" /> Core sections</div>
          <div className="space-y-2">
            {sectionMeta.map((section) => {
              const Icon = section.icon
              const count = store.records.filter((r) => r.section === section.id).length
              const selected = active === section.id
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActive(section.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${selected ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3"><Icon className="h-4 w-4 text-emerald-700" /><b className="text-sm text-slate-950">{section.title}</b></div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">{count}</span>
                  </div>
                  <p className="mt-1 pl-7 text-xs font-semibold leading-5 text-slate-500">{section.subtitle}</p>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="space-y-5">
          <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-3xl bg-slate-950 p-4 text-white"><ActiveIcon className="h-6 w-6" /></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-950">{activeMeta.title}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{activeMeta.subtitle}</p>
                </div>
              </div>
              <Link href="/revenue-command-center" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm">
                Core home <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-4">
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder={`Add ${activeMeta.title} item`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-400" />
              <input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Owner" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-400" />
              <input value={draft.valueMad} onChange={(e) => setDraft({ ...draft, valueMad: e.target.value })} placeholder="Value MAD" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-400" />
              <button type="button" onClick={addRecord} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-800">Add to core</button>
            </div>
            <textarea value={draft.nextAction} onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })} placeholder="Next action / execution instruction" className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-400" />
          </div>

          <div className="grid gap-4">
            {activeRecords.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500">No records yet in this layer. Add the first one above.</div>
            ) : activeRecords.map((record) => (
              <article key={record.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${record.priority === "critical" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>{record.priority}</span>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase text-blue-700">{record.status}</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-700">{record.probability}% probability</span>
                    </div>
                    <h3 className="mt-3 text-xl font-black text-slate-950">{record.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{record.notes}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-3"><span className="text-xs font-black uppercase text-slate-400">Owner</span><b className="block text-sm text-slate-900">{record.owner}</b></div>
                      <div className="rounded-2xl bg-slate-50 p-3"><span className="text-xs font-black uppercase text-slate-400">Value</span><b className="block text-sm text-slate-900">{mad(record.valueMad)}</b></div>
                      <div className="rounded-2xl bg-slate-50 p-3"><span className="text-xs font-black uppercase text-slate-400">Due</span><b className="block text-sm text-slate-900">{record.dueDate || "Today"}</b></div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900"><Zap className="mr-2 inline h-4 w-4" />{record.nextAction}</div>
                  </div>
                  <div className="flex min-w-44 flex-col gap-2">
                    <button type="button" onClick={() => updateStatus(record.id, "done")} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white">Mark done</button>
                    <button type="button" onClick={() => updateStatus(record.id, "active")} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800">Keep active</button>
                    <button type="button" onClick={() => escalate(record.id)} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white">Escalate critical</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-[32px] border border-rose-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-rose-700"><ShieldAlert className="h-4 w-4" /> Critical alert layer</div>
            <div className="mt-4 space-y-3">
              {buildAlerts(store.records).length === 0 ? <p className="text-sm font-bold text-slate-500">No critical alerts.</p> : buildAlerts(store.records).slice(0, 8).map((alert) => (
                <button key={alert.id} onClick={() => setActive(alert.linkedSection)} className="w-full rounded-2xl border border-rose-100 bg-rose-50 p-3 text-left">
                  <b className="block text-sm text-rose-800"><AlertTriangle className="mr-2 inline h-4 w-4" />{alert.title}</b>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-rose-700">{alert.message}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-slate-800"><LineChart className="h-4 w-4" /> Core analytics</div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-black uppercase text-slate-400">Total pipeline</span><b className="block text-xl text-slate-950">{mad(totalValue)}</b></div>
              <div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-black uppercase text-slate-400">Weighted forecast</span><b className="block text-xl text-slate-950">{mad(weightedPipeline)}</b></div>
              <div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-black uppercase text-slate-400">Last sync</span><b className="block text-sm text-slate-950">{new Date(store.lastSyncedAt).toLocaleString()}</b></div>
            </div>
          </div>

          <div className="rounded-[32px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Stabilized behavior</div>
            <p className="mt-3 text-sm font-bold leading-6 text-emerald-900">
              All listed revenue routes now open this same central engine. Legacy prospects are migrated into the shared core store so newly added work is not trapped inside isolated submodule pages.
            </p>
          </div>
        </aside>
      </section>
    </main>
  )
}
