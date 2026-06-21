"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

const CAMPAIGN_LIFECYCLE_STABLE_TIMESTAMP = "Production sync"

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
  return new Date().toISOString()
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
    logs: [{ id: uid(), at: CAMPAIGN_LIFECYCLE_STABLE_TIMESTAMP, action: "Workspace initialized", detail: "Campaign cockpit seed data loaded." }],
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
      logs: [{ id: uid(), at: CAMPAIGN_LIFECYCLE_STABLE_TIMESTAMP, action, detail }, ...next.logs].slice(0, 60),
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

  const totalSpendTracked = store.campaigns.reduce((sum, campaign) => sum + Number(campaign.spentMad || 0), 0)
  const totalSpendTrackedLabel = new Intl.NumberFormat("en-US").format(totalSpendTracked)
  const highRiskCampaigns = store.campaigns.filter((campaign) => campaign.risk === "high").length
  const selectedStageLabel = selected ? label(selected.stage) : "No campaign selected"
  const totalAuditEvents = store.logs.length


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

  const gateways: Array<{ key: typeof activePanel; icon: string; title: string; text: string; action: string }> = [
    { key: "command", icon: "🧭", title: "Command board", text: "Select a campaign, inspect the current state and execute next controls.", action: "Open command" },
    { key: "create", icon: "➕", title: "Create campaign", text: "Open a clean campaign creation form and store the campaign instantly.", action: "Create record" },
    { key: "launch", icon: "🚀", title: "Launch control", text: "Move campaigns through approval, readiness, launch and live control.", action: "Run launch gate" },
    { key: "budget", icon: "💰", title: "Budget cockpit", text: "Edit spend, budget, ROI pressure and budget control signals.", action: "Control budget" },
    { key: "risk", icon: "🛡️", title: "Risk center", text: "Surface high-risk campaigns, blockers and escalation actions.", action: "Open risk panel" },
    { key: "tasks", icon: "✅", title: "Execution tasks", text: "Create, edit, complete, block and delete operational campaign tasks.", action: "Create task" },
    { key: "performance", icon: "📈", title: "Performance pulse", text: "Update leads, conversions, revenue and readiness in one place.", action: "Pulse KPIs" },
  ]

  return (
    <main data-market-os-root className="min-h-screen bg-slate-50 text-slate-950 selection:bg-emerald-200 selection:text-slate-950">
      <div className="mx-auto max-w-[1800px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-white via-emerald-950 to-white p-7 text-slate-950 shadow-2xl lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.3fr_.7fr]">
            
      <section className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:p-9">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.10),transparent_28%),radial-gradient(circle_at_88%_0%,rgba(124,58,237,0.10),transparent_30%)]" />

        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_560px]">
          <div className="grid content-start gap-6">
            
      <section className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.10),transparent_28%),radial-gradient(circle_at_88%_0%,rgba(124,58,237,0.08),transparent_30%)]" />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_520px]">
          <div className="grid content-start gap-5">
            
      {/* Campaign dashboard hero removed permanently.
          This workspace now starts directly with the operational campaign cockpit. */}


            <div>
              <h1 className="max-w-4xl text-4xl font-black leading-[0.94] tracking-[-0.06em] text-slate-950 md:text-6xl">
                Campaign command
                <br />
                <span className="bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent">
                  for ANGELCARE.
                </span>
              </h1>

              <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-slate-500">
                Executive control for launch, budget, risk and performance.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/market-os" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50">
                ← Market OS
              </Link>

              <button onClick={restoreSeed} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50">
                Restore
              </button>

              <Link href="/market-os/campaign-lifecycle/create" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800">
                + Create
              </Link>

              {selected ? (
                <Link href={`/market-os/campaign-lifecycle/${selected.id}/launch-control`} className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-black text-sky-800 shadow-sm transition hover:-translate-y-0.5">
                  Launch
                </Link>
              ) : (
                <span className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-800">
                  Select campaign
                </span>
              )}
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Campaigns</p>
                    <p className="mt-3 text-5xl font-black tracking-[-0.05em] text-slate-950">{store.campaigns.length}</p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-50 text-sky-700">◎</div>
                </div>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Stage</p>
                    <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">{selected ? label(selected.stage) : "No selection"}</p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-violet-700">↗</div>
                </div>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Spend</p>
                    <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">
                      {new Intl.NumberFormat("en-US").format(store.campaigns.reduce((sum, campaign) => sum + Number(campaign.spentMad || 0), 0))} MAD
                    </p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-700">MAD</div>
                </div>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Risk</p>
                    <p className="mt-3 text-5xl font-black tracking-[-0.05em] text-rose-700">
                      {store.campaigns.filter((campaign) => campaign.risk === "high").length}
                    </p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-50 text-rose-700">!</div>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Live summary</p>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                  Active
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Tasks</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{selectedTasks.length}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Logs</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{store.logs.length}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Selection</p>
                  <p className="mt-2 text-sm font-black text-slate-950">
                    {selected ? selected.name : "No campaign"}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>


            <div>
              <h1 className="max-w-5xl text-5xl font-black leading-[0.92] tracking-[-0.06em] text-slate-950 md:text-7xl">
                ANGELCARE campaign
                <br />
                lifecycle command
                <br />
                <span className="bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent">
                  & intelligence cockpit.
                </span>
              </h1>

              <p className="mt-5 max-w-4xl text-lg font-bold leading-8 text-slate-500">
                Minimalist executive workspace for campaign creation, launch governance,
                budget control, risk exposure, operational execution and performance visibility.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm">Executive command</span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm">Launch governance</span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm">Budget visibility</span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm">Risk monitoring</span>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/market-os" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50">
                ← Market OS
              </Link>

              <button onClick={restoreSeed} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50">
                Restore data
              </button>

              <Link href="/market-os/campaign-lifecycle/create" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800">
                + Create campaign
              </Link>

              {selected ? (
                <Link href={`/market-os/campaign-lifecycle/${selected.id}/launch-control`} className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-black text-sky-800 shadow-sm transition hover:-translate-y-0.5">
                  Open launch control
                </Link>
              ) : (
                <span className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-800">
                  Select a campaign to launch
                </span>
              )}
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Campaigns</p>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <p className="text-5xl font-black tracking-[-0.05em] text-slate-950">{store.campaigns.length}</p>
                  <p className="text-xs font-bold text-slate-500">Tracked campaigns</p>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Selected stage</p>
                <div className="mt-3">
                  <p className="text-2xl font-black tracking-[-0.03em] text-slate-950">{selectedStageLabel}</p>
                  <p className="mt-2 text-xs font-bold text-slate-500">Current operational focus</p>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Spend tracked</p>
                <div className="mt-3">
                  <p className="text-4xl font-black tracking-[-0.05em] text-slate-950">{totalSpendTrackedLabel} MAD</p>
                  <p className="mt-2 text-xs font-bold text-slate-500">Live spend visibility</p>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">High risk</p>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <p className="text-5xl font-black tracking-[-0.05em] text-rose-700">{highRiskCampaigns}</p>
                  <p className="text-xs font-bold text-slate-500">Campaigns flagged</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Operations pulse</p>
                  <h3 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">
                    Smart operational summary
                  </h3>
                </div>

                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  Production active
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Selected tasks</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{selectedTasks.length}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Audit events</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{totalAuditEvents}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Selection</p>
                  <p className="mt-2 text-sm font-black text-slate-950">
                    {selected ? selected.name : "No campaign selected"}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

            
              {/* Legacy colored StatCard KPI rail removed permanently.
                  The clean ANGELCARE executive KPI cards now live in the new hero. */}

          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          {gateways.map(gateway => (
            <button
              key={gateway.key}
              onClick={() => executeGateway(gateway.key)}
              className={`rounded-[1.75rem] border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                activePanel === gateway.key ? "border-emerald-700 bg-emerald-950 text-slate-950" : "border-slate-200 bg-white text-slate-950"
              }`}
            >
              <div className="text-3xl">{gateway.icon}</div>
              <h3 className={`mt-4 text-lg font-black ${activePanel === gateway.key ? "text-slate-950" : "text-slate-950"}`}>{gateway.title}</h3>
              <p className={`mt-2 text-sm font-semibold leading-6 ${activePanel === gateway.key ? "text-emerald-50/85" : "text-slate-600"}`}>{gateway.text}</p>
              <span className={`mt-4 inline-flex rounded-xl px-3 py-2 text-xs font-black ${activePanel === gateway.key ? "bg-white text-emerald-950" : "bg-white text-slate-950"}`}>
                {gateway.action}
              </span>
            </button>
          ))}
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

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1fr_.55fr_.55fr_.45fr]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search campaigns, owner, audience..." />
            <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
              <option value="all">All stages</option>
              {stages.map(stage => <option key={stage} value={stage}>{label(stage)}</option>)}
            </Select>
            <Select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
              <option value="all">All risks</option>
              {risks.map(risk => <option key={risk} value={risk}>{label(risk)}</option>)}
            </Select>
            <DarkButton onClick={restoreSeed}>Reset seed</DarkButton>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
          <section className="space-y-4">
            {filtered.map(campaign => (
              <Card key={campaign.id} className={campaign.id === selected?.id ? "ring-4 ring-emerald-100" : ""}>
                <div className="grid gap-5 xl:grid-cols-[1fr_.6fr_.65fr]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={campaign.stage === "live" ? "emerald" : campaign.stage === "approval" ? "amber" : "blue"}>{label(campaign.stage)}</Pill>
                      <Pill tone={campaign.risk === "critical" || campaign.risk === "high" ? "rose" : "slate"}>{label(campaign.risk)}</Pill>
                    </div>
                    <button onClick={() => setSelectedId(campaign.id)} className="mt-3 text-left text-2xl font-black text-slate-950 hover:text-emerald-800">{campaign.name}</button>
                    <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">{campaign.objective}</p>
                    <p className="mt-3 text-sm font-black text-slate-700">Owner: {campaign.owner} • Launch: {campaign.launchDate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Readiness</p>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-700" style={{ width: `${readiness(campaign)}%` }} />
                    </div>
                    <p className="mt-2 text-sm font-black">{readiness(campaign)}%</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase text-slate-500">Leads</p>
                        <p className="text-2xl font-black">{campaign.leads}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase text-slate-500">ROI</p>
                        <p className="text-2xl font-black">{campaign.spentMad ? Math.round((campaign.revenueMad / campaign.spentMad) * 10) / 10 : 0}x</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Link href={`/market-os/campaign-lifecycle/${campaign.id}`} className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950">Open command page</Link>
                    <SoftButton onClick={() => { setSelectedId(campaign.id); setActivePanel("tasks"); addTask(campaign.id) }}>Add task</SoftButton>
                    <SoftButton onClick={() => updateCampaign(campaign.id, { stage: stages[Math.min(stages.indexOf(campaign.stage) + 1, stages.length - 1)] }, "Campaign advanced")}>Advance stage</SoftButton>
                    <SoftButton onClick={() => updateCampaign(campaign.id, { readiness: Math.min(100, campaign.readiness + 10) }, "Readiness increased")}>Boost readiness</SoftButton>
                    <button onClick={() => deleteCampaign(campaign.id)} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-slate-950">Delete campaign</button>
                  </div>
                </div>
              </Card>
            ))}
            {filtered.length === 0 ? (
              <Card className="text-center">
                <h3 className="text-2xl font-black text-slate-950">No campaigns visible.</h3>
                <p className="mt-2 text-sm font-semibold text-slate-500">Restore seed data or create a campaign.</p>
                <div className="mt-4 flex justify-center gap-3">
                  <PrimaryButton onClick={restoreSeed}>Restore seed data</PrimaryButton>
                  <SoftButton onClick={() => setActivePanel("create")}>Create campaign</SoftButton>
                </div>
              </Card>
            ) : null}
          </section>

          <aside className="space-y-6">
            <Card className="bg-white text-slate-950">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Selected campaign control</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">{selected?.name || "No campaign selected"}</h2>
              {selected ? (
                <div className="mt-5 space-y-4">
                  <Textarea value={selected.notes} onChange={(e) => updateCampaign(selected.id, { notes: e.target.value }, "Campaign notes updated")} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={selected.stage} onChange={(e) => updateCampaign(selected.id, { stage: e.target.value as CampaignStage }, "Stage changed")}>
                      {stages.map(stage => <option key={stage} value={stage}>{label(stage)}</option>)}
                    </Select>
                    <Select value={selected.risk} onChange={(e) => updateCampaign(selected.id, { risk: e.target.value as CampaignRisk }, "Risk changed")}>
                      {risks.map(risk => <option key={risk} value={risk}>{label(risk)}</option>)}
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" value={selected.spentMad} onChange={(e) => updateCampaign(selected.id, { spentMad: Number(e.target.value) }, "Spend updated")} />
                    <Input type="number" value={selected.revenueMad} onChange={(e) => updateCampaign(selected.id, { revenueMad: Number(e.target.value) }, "Revenue updated")} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/market-os/campaign-lifecycle/${selected.id}/tasks`} className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950">Tasks</Link>
                    <Link href={`/market-os/campaign-lifecycle/${selected.id}/budget`} className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950">Budget</Link>
                    <Link href={`/market-os/campaign-lifecycle/${selected.id}/launch-control`} className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950">Launch</Link>
                    <Link href={`/market-os/campaign-lifecycle/${selected.id}/performance`} className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950">Performance</Link>
                  </div>
                </div>
              ) : <PrimaryButton onClick={restoreSeed} className="mt-5">Restore campaigns</PrimaryButton>}
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Execution queue</p>
                  <h3 className="mt-1 text-2xl font-black">Selected campaign tasks</h3>
                </div>
                {selected ? <DarkButton onClick={() => addTask(selected.id)}>+ Task</DarkButton> : null}
              </div>
              <div className="mt-4 space-y-3">
                {selectedTasks.map(task => (
                  <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <Input value={task.title} onChange={(e) => updateTask(task.id, { title: e.target.value })} />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Input value={task.owner} onChange={(e) => updateTask(task.id, { owner: e.target.value })} />
                      <Select value={task.status} onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}>
                        <option value="todo">Todo</option>
                        <option value="doing">Doing</option>
                        <option value="done">Done</option>
                        <option value="blocked">Blocked</option>
                      </Select>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="mt-3 rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-slate-950">Delete task</button>
                  </div>
                ))}
                {selectedTasks.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">No tasks yet. Click + Task to create one.</p> : null}
              </div>
            </Card>

            <Card>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Audit log</p>
              <div className="mt-4 space-y-2">
                {store.logs.slice(0, 8).map(log => (
                  <div key={log.id} className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-sm font-black text-slate-950">{log.action}</p>
                    <p className="text-xs font-bold text-slate-500">{log.detail} • {log.at}</p>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
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