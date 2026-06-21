"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

const CAMPAIGN_LIFECYCLE_STABLE_SYNC_LABEL = "Production sync"
const CAMPAIGN_LIFECYCLE_STABLE_ISO = "production-sync"

type CampaignStage = "planning" | "production" | "approval" | "launch-ready" | "live" | "paused" | "completed"
type CampaignRisk = "low" | "medium" | "high" | "critical"
type TaskStatus = "todo" | "doing" | "done" | "blocked"

type CampaignRecord = {
  id: string
  name: string
  objective: string
  owner: string
  audience: string
  channel: string
  stage: CampaignStage
  risk: CampaignRisk
  launchDate: string
  budgetMad: number
  spentMad: number
  leads: number
  conversions: number
  revenueMad: number
  readiness: number
  notes: string
  createdAt: string
  updatedAt: string
}

type CampaignTask = {
  id: string
  campaignId: string
  title: string
  owner: string
  dueDate: string
  status: TaskStatus
}

type CampaignLog = {
  id: string
  at: string
  action: string
  detail: string
}

type Store = {
  campaigns: CampaignRecord[]
  tasks: CampaignTask[]
  logs: CampaignLog[]
}

const STORE_KEY = "angelcare_campaign_lifecycle_v2_store"

const stages: CampaignStage[] = ["planning", "production", "approval", "launch-ready", "live", "paused", "completed"]
const risks: CampaignRisk[] = ["low", "medium", "high", "critical"]

function nowIso() {
  return CAMPAIGN_LIFECYCLE_STABLE_ISO
}

function today(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2, 10)
}

function label(value: string) {
  return value.split("-").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
}

function seedCampaigns(): CampaignRecord[] {
  return [
    {
      id: "cmp-postpartum-premium",
      name: "Premium Postpartum Reassurance Campaign",
      objective: "Generate qualified premium family leads and convert them into postpartum homecare consultations.",
      owner: "Marketing Director",
      audience: "Premium Moroccan families, pregnant mothers, clinic referrals",
      channel: "Meta Ads + WhatsApp + Clinic Partners",
      stage: "approval",
      risk: "high",
      launchDate: today(2),
      budgetMad: 42000,
      spentMad: 9800,
      leads: 144,
      conversions: 18,
      revenueMad: 132000,
      readiness: 65,
      notes: "Needs final creative proof, landing page QA, WhatsApp routing, and offer approval before launch.",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "cmp-clinic-partner-sprint",
      name: "Clinic Partnership Authority Sprint",
      objective: "Book meetings with maternity clinics and create referral partnership opportunities.",
      owner: "Partnership Lead",
      audience: "Maternity clinics, pediatric clinics, healthcare partners",
      channel: "Direct outreach + LinkedIn + Phone",
      stage: "production",
      risk: "medium",
      launchDate: today(7),
      budgetMad: 18000,
      spentMad: 2500,
      leads: 38,
      conversions: 7,
      revenueMad: 61000,
      readiness: 60,
      notes: "Needs partner pitch deck, outreach script, and tracking sheet.",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "cmp-academy-lead-engine",
      name: "AngelCare Academy Lead Engine",
      objective: "Recruit qualified trainees and convert them into paid professional training cohorts.",
      owner: "Academy Marketing Lead",
      audience: "Caregivers, students, career switchers, clinic assistants",
      channel: "SEO Blog + WhatsApp + Ambassador Referrals",
      stage: "planning",
      risk: "low",
      launchDate: today(12),
      budgetMad: 16000,
      spentMad: 700,
      leads: 22,
      conversions: 3,
      revenueMad: 18000,
      readiness: 35,
      notes: "Needs content plan, ambassador referral package, and academy landing page optimization.",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ]
}

function seedTasks(): CampaignTask[] {
  return [
    { id: "tsk-1", campaignId: "cmp-postpartum-premium", title: "Validate landing page form and WhatsApp routing", owner: "Growth Ops", dueDate: today(1), status: "doing" },
    { id: "tsk-2", campaignId: "cmp-postpartum-premium", title: "Approve carousel creative and offer wording", owner: "Brand Lead", dueDate: today(1), status: "blocked" },
    { id: "tsk-3", campaignId: "cmp-clinic-partner-sprint", title: "Prepare clinic outreach call sheet", owner: "Partnership Lead", dueDate: today(4), status: "todo" },
    { id: "tsk-4", campaignId: "cmp-academy-lead-engine", title: "Build academy SEO topic map", owner: "Content Lead", dueDate: today(5), status: "todo" },
  ]
}

function defaultStore(): Store {
  return {
    campaigns: seedCampaigns(),
    tasks: seedTasks(),
    logs: [{ id: uid(), at: CAMPAIGN_LIFECYCLE_STABLE_SYNC_LABEL, action: "Workspace initialized", detail: "Campaign cockpit seed data loaded." }],
  }
}

function readStore(): Store {
  if (typeof window === "undefined") return defaultStore()
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) {
      const seeded = defaultStore()
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded))
      return seeded
    }
    const parsed = JSON.parse(raw) as Store
    if (!parsed.campaigns || parsed.campaigns.length === 0) {
      const seeded = defaultStore()
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded))
      return seeded
    }
    return parsed
  } catch {
    return defaultStore()
  }
}

function writeStore(store: Store) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>
}

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "emerald" | "amber" | "rose" | "blue" | "violet" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  }
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${tones[tone]}`}>{children}</span>
}

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-emerald-800 ${props.className || ""}`} />
}

function DarkButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-white ${props.className || ""}`} />
}

function SoftButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50 ${props.className || ""}`} />
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-500 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 ${props.className || ""}`} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 ${props.className || ""}`} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-500 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 ${props.className || ""}`} />
}

function StatCard({ label, value, note, tone }: { label: string; value: string | number; note: string; tone: string }) {
  return (
    <div className={`rounded-3xl p-5 text-slate-950 shadow-lg ${tone}`}>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-950/70">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
      <p className="mt-2 text-sm font-bold text-slate-950/80">{note}</p>
    </div>
  )
}

export default function CampaignExecutionV2() {
  const [store, setStore] = useState<Store>(() => defaultStore())
  const [query, setQuery] = useState("")
  const [stageFilter, setStageFilter] = useState("all")
  const [riskFilter, setRiskFilter] = useState("all")
  const [selectedId, setSelectedId] = useState("")
  const [activePanel, setActivePanel] = useState<"command" | "create" | "tasks" | "budget" | "launch" | "performance" | "risk">("command")
  const [form, setForm] = useState({
    name: "",
    objective: "",
    owner: "Marketing Director",
    audience: "",
    channel: "Meta Ads + WhatsApp",
    launchDate: today(7),
    budgetMad: 0,
    notes: "",
  })

  useEffect(() => {
    const loaded = readStore()
    setStore(loaded)
    setSelectedId(loaded.campaigns[0]?.id || "")
  }, [])

  function commit(next: Store, action: string, detail: string) {
    const withLog = {
      ...next,
      logs: [{ id: uid(), at: CAMPAIGN_LIFECYCLE_STABLE_SYNC_LABEL, action, detail }, ...next.logs].slice(0, 60),
    }
    setStore(withLog)
    writeStore(withLog)
  }

  function restoreSeed() {
    const seeded = defaultStore()
    setStore(seeded)
    setSelectedId(seeded.campaigns[0]?.id || "")
    writeStore(seeded)
  }

  const selected = store.campaigns.find(campaign => campaign.id === selectedId) || store.campaigns[0]
  const selectedTasks = selected ? store.tasks.filter(task => task.campaignId === selected.id) : []

  const filtered = useMemo(() => {
    return store.campaigns.filter(campaign => {
      const hay = `${campaign.name} ${campaign.objective} ${campaign.owner} ${campaign.audience} ${campaign.channel}`.toLowerCase()
      return (!query || hay.includes(query.toLowerCase()))
        && (stageFilter === "all" || campaign.stage === stageFilter)
        && (riskFilter === "all" || campaign.risk === riskFilter)
    })
  }, [store.campaigns, query, stageFilter, riskFilter])

  const totalBudget = store.campaigns.reduce((sum, campaign) => sum + campaign.budgetMad, 0)
  const totalSpent = store.campaigns.reduce((sum, campaign) => sum + campaign.spentMad, 0)
  const totalRevenue = store.campaigns.reduce((sum, campaign) => sum + campaign.revenueMad, 0)
  const liveCount = store.campaigns.filter(campaign => campaign.stage === "live").length
  const riskCount = store.campaigns.filter(campaign => campaign.risk === "high" || campaign.risk === "critical").length
  const blockedTasks = store.tasks.filter(task => task.status === "blocked").length
  const readyCount = store.campaigns.filter(campaign => campaign.readiness >= 75).length

  function createCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim()) return
    const record: CampaignRecord = {
      id: uid(),
      name: form.name,
      objective: form.objective || "Define objective before launch.",
      owner: form.owner,
      audience: form.audience || "Audience not defined",
      channel: form.channel,
      stage: "planning",
      risk: "medium",
      launchDate: form.launchDate,
      budgetMad: Number(form.budgetMad) || 0,
      spentMad: 0,
      leads: 0,
      conversions: 0,
      revenueMad: 0,
      readiness: 20,
      notes: form.notes,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    commit({ ...store, campaigns: [record, ...store.campaigns] }, "Campaign created", record.name)
    setSelectedId(record.id)
    setActivePanel("command")
    setForm({ name: "", objective: "", owner: "Marketing Director", audience: "", channel: "Meta Ads + WhatsApp", launchDate: today(7), budgetMad: 0, notes: "" })
  }

  function updateCampaign(id: string, patch: Partial<CampaignRecord>, action = "Campaign updated") {
    const target = store.campaigns.find(c => c.id === id)
    const campaigns = store.campaigns.map(campaign => campaign.id === id ? { ...campaign, ...patch, updatedAt: nowIso() } : campaign)
    commit({ ...store, campaigns }, action, target?.name || id)
  }

  function deleteCampaign(id: string) {
    const target = store.campaigns.find(campaign => campaign.id === id)
    const next = {
      ...store,
      campaigns: store.campaigns.filter(campaign => campaign.id !== id),
      tasks: store.tasks.filter(task => task.campaignId !== id),
    }
    commit(next, "Campaign deleted", target?.name || id)
    setSelectedId(next.campaigns[0]?.id || "")
  }

  function addTask(campaignId: string, title = "New execution task") {
    const task: CampaignTask = {
      id: uid(),
      campaignId,
      title,
      owner: "Marketing Ops",
      dueDate: today(2),
      status: "todo",
    }
    commit({ ...store, tasks: [task, ...store.tasks] }, "Task created", task.title)
    setActivePanel("tasks")
  }

  function updateTask(id: string, patch: Partial<CampaignTask>) {
    const tasks = store.tasks.map(task => task.id === id ? { ...task, ...patch } : task)
    commit({ ...store, tasks }, "Task updated", id)
  }

  function deleteTask(id: string) {
    commit({ ...store, tasks: store.tasks.filter(task => task.id !== id) }, "Task deleted", id)
  }

  function readiness(campaign: CampaignRecord) {
    const taskScore = store.tasks.filter(task => task.campaignId === campaign.id && task.status === "done").length * 8
    return Math.min(100, campaign.readiness + taskScore)
  }

  function executeGateway(panel: typeof activePanel) {
    setActivePanel(panel)
    if (!selected) return
    if (panel === "launch") updateCampaign(selected.id, { stage: selected.readiness >= 75 ? "launch-ready" : "approval" }, "Launch gate reviewed")
    if (panel === "budget") updateCampaign(selected.id, { spentMad: selected.spentMad }, "Budget cockpit opened")
    if (panel === "risk") updateCampaign(selected.id, { risk: selected.risk === "low" ? "medium" : selected.risk }, "Risk cockpit opened")
    if (panel === "tasks") addTask(selected.id, "Operator-created task from command gateway")
    if (panel === "performance") updateCampaign(selected.id, { leads: selected.leads + 1 }, "Performance pulse increased leads")
  }

  const dashboardSignals = [
    {
      label: "Campaigns",
      value: String(store.campaigns.length),
      detail: "Live campaign records",
      icon: "◎",
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Ready",
      value: String(readyCount),
      detail: "Readiness above 75%",
      icon: "✓",
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Risk",
      value: String(riskCount + blockedTasks),
      detail: "High risk + blocked tasks",
      icon: "!",
      tone: "bg-rose-50 text-rose-700",
    },
    {
      label: "Selected",
      value: selected ? label(selected.stage) : "None",
      detail: selected ? selected.name : "No campaign selected",
      icon: "↗",
      tone: "bg-violet-50 text-violet-700",
    },
    {
      label: "Tasks",
      value: String(selectedTasks.length),
      detail: "Selected campaign queue",
      icon: "□",
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Spend",
      value: `${new Intl.NumberFormat("en-US").format(store.campaigns.reduce((sum, campaign) => sum + Number(campaign.spentMad || 0), 0))} MAD`,
      detail: "Tracked spend",
      icon: "MAD",
      tone: "bg-slate-50 text-slate-700",
    },
  ]

  return (
    <main data-market-os-root className="min-h-screen bg-slate-50 text-slate-950 selection:bg-emerald-200 selection:text-slate-950">
      <div className="mx-auto max-w-[1800px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-white via-emerald-950 to-white p-7 text-slate-950 shadow-2xl lg:p-10">
          
      {/* Restored dashboard hero removed permanently.
          Horizontal lifecycle menu now starts the page. */}

        </section>

        <section className="overflow-hidden rounded-[38px] border border-slate-200 bg-white/95 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.08)] lg:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-violet-600 text-[10px] font-black text-white">
                  AC
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-700">
                  ANGELCARE Campaign Lifecycle
                </span>
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-[-0.06em] text-slate-950 md:text-4xl">
                Executive campaign command
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Live operational view for launch readiness, budget discipline, execution pressure and performance control.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Production active
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {dashboardSignals.map((signal) => (
              <div
                key={signal.label}
                className="group rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                      {signal.label}
                    </p>
                    <p className="mt-4 text-2xl font-black tracking-[-0.05em] text-slate-950">
                      {signal.value}
                    </p>
                  </div>

                  <span className={`grid h-12 w-12 place-items-center rounded-[18px] text-sm font-black shadow-sm ${signal.tone}`}>
                    {signal.icon}
                  </span>
                </div>

                <p className="mt-5 text-sm font-bold text-slate-500">
                  {signal.detail}
                </p>
              </div>
            ))}
          </div>

          
          {/* Lower dashboard sections removed: lifecycle layer, selected campaign, control layer. */}

        </section>

        {activePanel === "create" ? (
          <Card>
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Campaign creation</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Create a controlled campaign record</h2>
            </div>
            <form onSubmit={createCampaign} className="grid gap-4 xl:grid-cols-[1fr_1fr_.7fr_.7fr_.5fr]">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campaign name" />
              <Input value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="Objective" />
              <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Owner" />
              <Input type="date" value={form.launchDate} onChange={(e) => setForm({ ...form, launchDate: e.target.value })} />
              <PrimaryButton type="submit">Create</PrimaryButton>
              <Input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} placeholder="Audience" />
              <Input value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} placeholder="Channel mix" />
              <Input type="number" value={form.budgetMad} onChange={(e) => setForm({ ...form, budgetMad: Number(e.target.value) })} placeholder="Budget MAD" />
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="xl:col-span-2" />
            </form>
          </Card>
        ) : null}

        
        {/* Search/filter control card removed permanently. */}


        
        {/* Lower operational workspace removed permanently:
            campaign list cards, selected campaign control, execution queue and task panels. */}

      </div>
    </main>
  )
}

type CampaignSubpageProps = {
  id: string
}

function CampaignSubpageShell({ id, title, subtitle }: CampaignSubpageProps & { title: string; subtitle: string }) {
  return (
    <section className="min-h-screen bg-slate-50 p-4 text-slate-950 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="rounded-[2rem] bg-gradient-to-br from-white via-emerald-950 to-white p-7 text-slate-950 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-200">Market-OS / Campaign Lifecycle</p>
              <h1 className="mt-3 text-4xl font-black text-slate-950">{title}</h1>
              <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-950/75">{subtitle}</p>
            </div>
            <Link href="/market-os/campaign-lifecycle" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">
              Back to command board
            </Link>
          </div>
        </div>

        <CampaignExecutionV2 />

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Subpage context</p>
          <p className="mt-2 text-sm font-bold text-slate-600">
            Active campaign id: <span className="text-slate-950">{id}</span>. This subpage is synced with the same localStorage campaign store and keeps build compatibility with the existing route imports.
          </p>
        </div>
      </div>
    </section>
  )
}

export function BudgetPage({ id }: CampaignSubpageProps) {
  return <CampaignSubpageShell id={id} title="Campaign Budget Cockpit" subtitle="Control budget, spend, ROI pressure and campaign financial discipline from the shared campaign lifecycle store." />
}

export function TasksPage({ id }: CampaignSubpageProps) {
  return <CampaignSubpageShell id={id} title="Campaign Task Execution" subtitle="Create, edit, complete, block and delete operational tasks connected to the selected campaign." />
}

export function PerformancePage({ id }: CampaignSubpageProps) {
  return <CampaignSubpageShell id={id} title="Campaign Performance Pulse" subtitle="Monitor leads, conversions, revenue, readiness and performance momentum for the selected campaign." />
}

export function CalendarPage({ id }: CampaignSubpageProps) {
  return <CampaignSubpageShell id={id} title="Campaign Calendar Control" subtitle="Review launch date, deadlines, execution rhythm and time-sensitive campaign activity." />
}

export function LaunchControlPage({ id }: CampaignSubpageProps) {
  return <CampaignSubpageShell id={id} title="Campaign Launch Control" subtitle="Move campaigns through readiness, approval, launch-ready and live operating states." />
}

export function RisksPage({ id }: CampaignSubpageProps) {
  return <CampaignSubpageShell id={id} title="Campaign Risk Center" subtitle="Surface risks, blockers, approval friction and campaign escalation needs." />
}

export function AssetsPage({ id }: CampaignSubpageProps) {
  return <CampaignSubpageShell id={id} title="Campaign Asset Control" subtitle="Coordinate campaign assets, creative readiness, message packs and production materials." />
}

export function ApprovalsPage({ id }: CampaignSubpageProps) {
  return <CampaignSubpageShell id={id} title="Campaign Approval Desk" subtitle="Control approval gates, launch validations, brand checks and release decisions." />
}

export function ContentPlanPage({ id }: CampaignSubpageProps) {
  return <CampaignSubpageShell id={id} title="Campaign Content Plan" subtitle="Organize campaign messaging, creative concepts, publication direction and channel execution." />
}

export function EditPage({ id }: CampaignSubpageProps) {
  return <CampaignSubpageShell id={id} title="Edit Campaign" subtitle="Edit campaign structure, objective, owner, channel, budget and operating context." />
}

export function DeletePage({ id }: CampaignSubpageProps) {
  return <CampaignSubpageShell id={id} title="Delete Campaign" subtitle="Review campaign context before removing the record from the shared campaign lifecycle workspace." />
}

export function DetailPage({ id }: CampaignSubpageProps) {
  return <CampaignSubpageShell id={id} title="Campaign Command Detail" subtitle="Open a focused command view for the selected campaign and its execution controls." />
}

export function MainCampaignBoard() {
  return <CampaignExecutionV2 />
}

export function CreateCampaignPage() {
  return <CampaignExecutionV2 />
}

export function CampaignOverviewPage({ id }: { id: string }) {
  return <DetailPage id={id} />
}

export function CampaignDetailPage({ id }: { id: string }) {
  return <DetailPage id={id} />
}

export function EditCampaignPage({ id }: { id: string }) {
  return <EditPage id={id} />
}

export function DeleteCampaignPage({ id }: { id: string }) {
  return <DeletePage id={id} />
}