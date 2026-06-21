"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"


function CampaignLifecycleSidebarV2CSS() {
  return (
    <style
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `
          [data-old-campaign-action-strip="true"] {
            display: none !important;
          }
        `,
      }}
    />
  )
}



function CampaignLifecycleSidebarV2({ selectedId }: { selectedId?: string | null }) {
  const selectedBase = selectedId ? `/market-os/campaign-lifecycle/${selectedId}` : "/market-os/campaign-lifecycle"

  const items = [
    {
      label: "Command board",
      eyebrow: "Control",
      href: "/market-os/campaign-lifecycle",
      icon: "◎",
      description: "Inspect campaigns, lifecycle state and operational readiness.",
      enabled: true,
    },
    {
      label: "Create campaign",
      eyebrow: "Creation",
      href: "/market-os/campaign-lifecycle/create",
      icon: "+",
      description: "Open the campaign creation studio and register a new campaign.",
      enabled: true,
    },
    {
      label: "Launch control",
      eyebrow: "Readiness",
      href: `${selectedBase}/launch-control`,
      icon: "↗",
      description: "Move the selected campaign through approval, readiness and launch control.",
      enabled: Boolean(selectedId),
    },
    {
      label: "Budget cockpit",
      eyebrow: "Finance",
      href: `${selectedBase}/budget`,
      icon: "MAD",
      description: "Control spend, budget pressure, ROI signals and campaign economics.",
      enabled: Boolean(selectedId),
    },
    {
      label: "Risk center",
      eyebrow: "Protection",
      href: `${selectedBase}/risks`,
      icon: "!",
      description: "Surface blockers, high-risk campaigns and escalation actions.",
      enabled: Boolean(selectedId),
    },
    {
      label: "Execution tasks",
      eyebrow: "Operations",
      href: `${selectedBase}/tasks`,
      icon: "✓",
      description: "Create, complete, block and delete operational campaign tasks.",
      enabled: Boolean(selectedId),
    },
    {
      label: "Performance pulse",
      eyebrow: "Signals",
      href: `${selectedBase}/performance`,
      icon: "↗",
      description: "Update leads, conversions, revenue and campaign readiness KPIs.",
      enabled: Boolean(selectedId),
    },
    {
      label: "Calendar",
      eyebrow: "Planning",
      href: `${selectedBase}/calendar`,
      icon: "□",
      description: "Review campaign dates, sequencing and launch windows.",
      enabled: Boolean(selectedId),
    },
  ]

  return (
    <aside className="mb-8 rounded-[34px] border border-slate-200 bg-white/95 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-white to-slate-50 p-6">
          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Live operational menu
          </div>

          <h2 className="mt-5 text-4xl font-black leading-none tracking-[-0.06em] text-slate-950">
            Campaign
            <br />
            Lifecycle
          </h2>

          <p className="mt-4 text-sm font-bold leading-6 text-slate-500">
            Fully wired ANGELCARE campaign command menu for creation, launch, budget, risk,
            tasks, calendar and performance pages.
          </p>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Selected campaign
            </p>
            <p className="mt-2 text-sm font-black text-slate-950">
              {selectedId ? "Controls unlocked" : "Select a campaign to unlock controls"}
            </p>
          </div>
        </div>

        <nav className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => {
            const content = (
              <>
                <span className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-xs font-black text-slate-950 shadow-sm">
                    {item.icon}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                    item.enabled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {item.enabled ? "Open" : "Locked"}
                  </span>
                </span>

                <span>
                  <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {item.eyebrow}
                  </span>
                  <span className="mt-1 block text-base font-black text-slate-950">
                    {item.label}
                  </span>
                  <span className="mt-2 block text-xs font-bold leading-5 text-slate-500">
                    {item.description}
                  </span>
                </span>
              </>
            )

            if (!item.enabled) {
              return (
                <div
                  key={item.label}
                  className="grid min-h-[170px] content-between rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 p-4 opacity-80"
                  title="Select a campaign first."
                >
                  {content}
                </div>
              )
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className="grid min-h-[170px] content-between rounded-[24px] border border-slate-200 bg-white p-4 text-slate-950 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_48px_rgba(15,23,42,0.08)]"
              >
                {content}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}



function CampaignLifecycleOperationalSidebar() {
  const commandItems = [
    {
      label: "Command board",
      tag: "Control",
      href: "/market-os/campaign-lifecycle",
      icon: "◎",
      description: "Inspect campaigns, lifecycle state and operational readiness.",
      active: true,
    },
    {
      label: "Create campaign",
      tag: "Creation",
      href: "/market-os/campaign-lifecycle/create",
      icon: "+",
      description: "Open the campaign creation studio and register a new campaign.",
      active: true,
    },
    {
      label: "Launch control",
      tag: "Readiness",
      href: "/market-os/campaign-lifecycle",
      icon: "↗",
      description: "Select a campaign, then open its launch-control command page.",
      active: false,
    },
    {
      label: "Budget cockpit",
      tag: "Finance",
      href: "/market-os/campaign-lifecycle",
      icon: "MAD",
      description: "Select a campaign to control budget, spend and ROI pressure.",
      active: false,
    },
    {
      label: "Risk center",
      tag: "Protection",
      href: "/market-os/campaign-lifecycle",
      icon: "!",
      description: "Select a campaign to review blockers and escalation actions.",
      active: false,
    },
    {
      label: "Execution tasks",
      tag: "Operations",
      href: "/market-os/campaign-lifecycle",
      icon: "✓",
      description: "Select a campaign to manage tasks, blockers and completion.",
      active: false,
    },
    {
      label: "Performance pulse",
      tag: "Signals",
      href: "/market-os/campaign-lifecycle",
      icon: "↗",
      description: "Select a campaign to update leads, conversions and revenue KPIs.",
      active: false,
    },
  ]

  return (
    <aside className="sticky top-28 z-20 self-start rounded-[32px] border border-slate-200 bg-white/95 p-4 shadow-[0_28px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
      <div className="rounded-[26px] border border-blue-100 bg-gradient-to-br from-white to-slate-50 p-5">
        <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
          Live command menu
        </div>

        <h2 className="mt-4 text-3xl font-black leading-none tracking-[-0.05em] text-slate-950">
          Campaign
          <br />
          Lifecycle
        </h2>

        <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
          Operational navigation for ANGELCARE campaign creation, launch, budget, risks, execution and performance.
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        {commandItems.map((item) => {
          const card = (
            <>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-950 shadow-sm">
                {item.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {item.tag}
                </span>
                <span className="mt-1 block text-sm font-black text-slate-950">
                  {item.label}
                </span>
                <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">
                  {item.description}
                </span>
              </span>
            </>
          )

          if (!item.active) {
            return (
              <div
                key={item.label}
                className="flex gap-3 rounded-[22px] border border-dashed border-slate-200 bg-slate-50/80 p-4 opacity-75"
                title="Select a campaign first."
              >
                {card}
              </div>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="group flex gap-3 rounded-[22px] border border-slate-200 bg-white p-4 text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)]"
            >
              {card}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}



function CampaignLifecycleStaticShellCSS() {
  return (
    <style
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `
          [data-campaign-lifecycle-shell] {
            min-height: 100vh;
            background:
              radial-gradient(circle at 12% 0%, rgba(14,165,233,.08), transparent 28%),
              radial-gradient(circle at 88% 0%, rgba(124,58,237,.08), transparent 30%),
              linear-gradient(135deg,#ffffff 0%,#f8fafc 56%,#eef6ff 100%);
            color: #020617;
            color-scheme: light;
          }

          [data-campaign-lifecycle-shell] input,
          [data-campaign-lifecycle-shell] textarea,
          [data-campaign-lifecycle-shell] select {
            background: #ffffff !important;
            color: #020617 !important;
            border-color: #e2e8f0 !important;
          }

          [data-campaign-lifecycle-shell] input::placeholder,
          [data-campaign-lifecycle-shell] textarea::placeholder {
            color: #94a3b8 !important;
          }

          [data-campaign-lifecycle-shell] a,
          [data-campaign-lifecycle-shell] button {
            transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease;
          }

          [data-campaign-lifecycle-shell] a:hover,
          [data-campaign-lifecycle-shell] button:hover {
            transform: translateY(-1px);
          }
        `,
      }}
    />
  )
}



function CampaignLifecycleMegaHero() {
  return (
    <section className="relative overflow-hidden rounded-[34px] border border-blue-100 bg-white px-8 py-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(14,165,233,0.10),transparent_30%),radial-gradient(circle_at_74%_0%,rgba(124,58,237,0.10),transparent_32%)]" />

      <div className="relative grid gap-8 xl:grid-cols-[1fr_390px]">
        <div className="grid gap-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-sky-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            ANGELCARE Campaign Lifecycle
          </div>

          <div>
            <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-slate-950 md:text-7xl">
              Campaign command,
              <br />
              launch control &
              <br />
              <span className="bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent">
                growth execution.
              </span>
            </h1>

            <p className="mt-5 max-w-4xl text-lg font-bold leading-8 text-slate-600">
              Enterprise lifecycle cockpit for ANGELCARE campaign strategy, creative production,
              approvals, budgets, launch readiness, performance monitoring and operational risks.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              'Strategy pipeline',
              'Creative production',
              'Approval control',
              'Budget readiness',
              'Launch checklist',
              'Performance signals',
            ].map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm">
                {item}
              </span>
            ))}
          </div>
        </div>

        <aside className="grid gap-4 rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_22px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Production status
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                Lifecycle ready
              </h2>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
              Live
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ['Pipeline', 'Controlled'],
              ['Approvals', 'Tracked'],
              ['Risks', 'Monitored'],
              ['Launch', 'Prepared'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
                <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2 flex justify-between text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              <span>Launch readiness</span>
              <span>Synced</span>
            </div>
            <div className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-sky-400 to-violet-500" />
          </div>
        </aside>
      </div>
    </section>
  )
}


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
    logs: [{ id: uid(), at: 'Live sync', action: "Workspace initialized", detail: "Campaign cockpit seed data loaded." }],
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
      logs: [{ id: uid(), at: 'Live sync', action, detail }, ...next.logs].slice(0, 60),
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
      <CampaignLifecycleSidebarV2CSS />
      <CampaignLifecycleMegaHero />

      <CampaignLifecycleSidebarV2 selectedId={selected?.id} />
      <div className="mx-auto max-w-[1800px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-white via-emerald-950 to-white p-7 text-slate-950 shadow-2xl lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.3fr_.7fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="emerald">Market-OS</Pill>
                <Pill tone="blue">Campaign Lifecycle</Pill>
                <Pill tone="amber">Real Cockpit</Pill>
              </div>
              <h1 className="mt-6 max-w-6xl text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                Campaign lifecycle operations cockpit.
              </h1>
              <p className="mt-5 max-w-5xl text-base font-semibold leading-8 text-emerald-50/85 md:text-lg">
                A structured campaign backoffice for AngelCare marketing teams: create campaigns, select records, control tasks, launch gates, budget, risks, performance and logs from one synchronized workspace.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/market-os" className="rounded-2xl border border-slate-200 bg-white/10 px-5 py-3 text-sm font-black text-slate-950">← Market-OS</Link>
                <button onClick={restoreSeed} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-950 shadow-lg">Restore seed data</button>
                <button onClick={() => setActivePanel("create")} className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg">+ Create campaign</button>
                <button onClick={() => selected && updateCampaign(selected.id, { stage: "live", readiness: 100 }, "Campaign launched")} className="rounded-2xl border border-slate-200 bg-white/10 px-5 py-3 text-sm font-black text-slate-950">Launch selected</button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="Campaigns" value={store.campaigns.length} note="Stored locally" tone="bg-emerald-900" />
              <StatCard label="Ready" value={readyCount} note="Readiness above 75%" tone="bg-blue-900" />
              <StatCard label="Budget" value={`${totalBudget.toLocaleString()} MAD`} note={`${totalSpent.toLocaleString()} MAD spent`} tone="bg-amber-800" />
              <StatCard label="Risk" value={riskCount + blockedTasks} note="High risk + blocked tasks" tone="bg-rose-900" />
            </div>
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
                <p className="mt-2 text-sm font-semibold text-slate-9500">Restore seed data or create a campaign.</p>
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
                {selectedTasks.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-9500">No tasks yet. Click + Task to create one.</p> : null}
              </div>
            </Card>

            <Card>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Audit log</p>
              <div className="mt-4 space-y-2">
                {store.logs.slice(0, 8).map(log => (
                  <div key={log.id} className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-sm font-black text-slate-950">{log.action}</p>
                    <p className="text-xs font-bold text-slate-9500">{log.detail} • {log.at}</p>
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
