"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type ProspectStage =
  | "discovery"
  | "qualification"
  | "decision_map"
  | "appointment"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost"

type ProspectPriority = "critical" | "high" | "medium" | "low"
type ProspectHealth = "on_track" | "risk" | "recovery" | "stalled"

type ProspectRecord = {
  id: string
  company: string
  contactName: string
  phone: string
  email: string
  segment: string
  city: string
  source: string
  owner: string
  stage: ProspectStage
  priority: ProspectPriority
  health: ProspectHealth
  valueMad: number
  score: number
  nextAction: string
  nextContactDate: string
  decisionMaker: string
  blocker: string
  notes: string
  createdAt: string
  updatedAt: string
}

type ProspectActivity = {
  id: string
  prospectId: string
  at: string
  action: string
  note: string
}

type ProspectStore = {
  prospects: ProspectRecord[]
  activities: ProspectActivity[]
}

const STORE_KEY = "revenue_prospects_v11_store"

const stages: ProspectStage[] = [
  "discovery",
  "qualification",
  "decision_map",
  "appointment",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
]

const priorities: ProspectPriority[] = ["critical", "high", "medium", "low"]
const healthOptions: ProspectHealth[] = ["on_track", "risk", "recovery", "stalled"]

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2, 10)
}

function today(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function label(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (x) => x.toUpperCase())
}

function mad(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function seedProspects(): ProspectRecord[] {
  const now = new Date().toISOString()
  return [
    {
      id: "pros-clinic-rabat-01",
      company: "Clinique Maternité Rabat Premium",
      contactName: "Dr. Nadia Benali",
      phone: "+212600000001",
      email: "direction@clinique-rabat.ma",
      segment: "Clinic partner",
      city: "Rabat",
      source: "Partnership outreach",
      owner: "BD Officer",
      stage: "decision_map",
      priority: "critical",
      health: "risk",
      valueMad: 420000,
      score: 91,
      nextAction: "Confirm decision-maker map and book partnership presentation.",
      nextContactDate: today(1),
      decisionMaker: "Medical Director + Operations Director",
      blocker: "Referral economics not approved yet.",
      notes: "High strategic value: maternity referrals + postpartum packages.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "pros-corporate-casa-02",
      company: "Casablanca Corporate HR Group",
      contactName: "Meriem A.",
      phone: "+212600000002",
      email: "hr@corporate-casa.ma",
      segment: "Corporate benefits",
      city: "Casablanca",
      source: "LinkedIn",
      owner: "Revenue Manager",
      stage: "qualification",
      priority: "high",
      health: "on_track",
      valueMad: 280000,
      score: 78,
      nextAction: "Qualify employee-family care needs and budget cycle.",
      nextContactDate: today(3),
      decisionMaker: "HR Director",
      blocker: "Budget timing unclear.",
      notes: "Potential B2B care benefit program.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "pros-academy-partner-03",
      company: "Training Institution Partner",
      contactName: "Youssef K.",
      phone: "+212600000003",
      email: "contact@training.ma",
      segment: "Academy partner",
      city: "Temara",
      source: "Referral",
      owner: "Academy Lead",
      stage: "appointment",
      priority: "medium",
      health: "recovery",
      valueMad: 110000,
      score: 66,
      nextAction: "Prepare academy co-marketing proposal.",
      nextContactDate: today(2),
      decisionMaker: "General Manager",
      blocker: "Needs proof of demand.",
      notes: "Can support academy lead generation.",
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function defaultStore(): ProspectStore {
  return {
    prospects: seedProspects(),
    activities: [
      {
        id: uid(),
        prospectId: "pros-clinic-rabat-01",
        at: new Date().toLocaleString(),
        action: "Prospects initialized",
        note: "Revenue prospects V11 workspace seeded.",
      },
    ],
  }
}

function readStore(): ProspectStore {
  if (typeof window === "undefined") return defaultStore()

  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) {
      const seeded = defaultStore()
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded))
      return seeded
    }

    const parsed = JSON.parse(raw) as ProspectStore
    if (!parsed.prospects || !Array.isArray(parsed.prospects)) return defaultStore()

    return parsed
  } catch {
    return defaultStore()
  }
}

function writeStore(store: ProspectStore) {
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

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 ${props.className || ""}`} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 ${props.className || ""}`} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 ${props.className || ""}`} />
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "dark" | "primary" | "soft" | "danger" }) {
  const variant = props.variant || "dark"
  const variants = {
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    primary: "bg-emerald-700 text-white hover:bg-emerald-800",
    soft: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  }

  return <button {...props} className={`rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition ${variants[variant]} ${props.className || ""}`} />
}

function scoreTone(score: number) {
  if (score >= 85) return "rose"
  if (score >= 70) return "amber"
  if (score >= 55) return "blue"
  return "slate"
}

export default function RevenueProspectsV11Workspace({ mode = "workspace" }: { mode?: "workspace" | "pipeline" }) {
  const [store, setStore] = useState<ProspectStore>(() => defaultStore())
  const [query, setQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<ProspectStage | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<ProspectPriority | "all">("all")
  const [selectedId, setSelectedId] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState({
    company: "",
    contactName: "",
    phone: "",
    email: "",
    segment: "Clinic partner",
    city: "Rabat",
    source: "Manual",
    owner: "BD Officer",
    stage: "discovery" as ProspectStage,
    priority: "high" as ProspectPriority,
    health: "on_track" as ProspectHealth,
    valueMad: 50000,
    score: 65,
    nextAction: "",
    nextContactDate: today(2),
    decisionMaker: "",
    blocker: "",
    notes: "",
  })

  useEffect(() => {
    const loaded = readStore()
    setStore(loaded)
    setSelectedId(loaded.prospects[0]?.id || "")
  }, [])

  function commit(next: ProspectStore, action: string, note: string, prospectId?: string) {
    const withActivity = {
      ...next,
      activities: [
        {
          id: uid(),
          prospectId: prospectId || selectedId || next.prospects[0]?.id || "system",
          at: new Date().toLocaleString(),
          action,
          note,
        },
        ...next.activities,
      ].slice(0, 100),
    }

    setStore(withActivity)
    writeStore(withActivity)
  }

  function restoreSeed() {
    const seeded = defaultStore()
    setStore(seeded)
    setSelectedId(seeded.prospects[0]?.id || "")
    writeStore(seeded)
  }

  const selected = store.prospects.find((prospect) => prospect.id === selectedId) || store.prospects[0]

  const filtered = useMemo(() => {
    return store.prospects.filter((prospect) => {
      const hay = `${prospect.company} ${prospect.contactName} ${prospect.segment} ${prospect.city} ${prospect.owner} ${prospect.nextAction} ${prospect.notes}`.toLowerCase()

      return (!query || hay.includes(query.toLowerCase()))
        && (stageFilter === "all" || prospect.stage === stageFilter)
        && (priorityFilter === "all" || prospect.priority === priorityFilter)
    })
  }, [store.prospects, query, stageFilter, priorityFilter])

  const stats = useMemo(() => {
    const totalValue = store.prospects.reduce((sum, prospect) => sum + Number(prospect.valueMad || 0), 0)
    const critical = store.prospects.filter((prospect) => prospect.priority === "critical" || prospect.health === "risk").length
    const appointments = store.prospects.filter((prospect) => prospect.stage === "appointment" || prospect.stage === "proposal" || prospect.stage === "negotiation").length
    const won = store.prospects.filter((prospect) => prospect.stage === "closed_won").length
    const avgScore = Math.round(store.prospects.reduce((sum, prospect) => sum + Number(prospect.score || 0), 0) / Math.max(store.prospects.length, 1))

    return { totalValue, critical, appointments, won, avgScore, total: store.prospects.length }
  }, [store.prospects])

  function updateProspect(id: string, patch: Partial<ProspectRecord>, action = "Prospect updated") {
    const target = store.prospects.find((prospect) => prospect.id === id)
    const prospects = store.prospects.map((prospect) => prospect.id === id ? { ...prospect, ...patch, updatedAt: new Date().toISOString() } : prospect)

    commit({ ...store, prospects }, action, target?.company || id, id)
  }

  function createProspect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.company.trim()) return

    const now = new Date().toISOString()
    const prospect: ProspectRecord = {
      id: uid(),
      company: draft.company,
      contactName: draft.contactName,
      phone: draft.phone,
      email: draft.email,
      segment: draft.segment,
      city: draft.city,
      source: draft.source,
      owner: draft.owner,
      stage: draft.stage,
      priority: draft.priority,
      health: draft.health,
      valueMad: Number(draft.valueMad) || 0,
      score: Number(draft.score) || 0,
      nextAction: draft.nextAction || "Define next commercial action.",
      nextContactDate: draft.nextContactDate,
      decisionMaker: draft.decisionMaker,
      blocker: draft.blocker,
      notes: draft.notes,
      createdAt: now,
      updatedAt: now,
    }

    commit({ ...store, prospects: [prospect, ...store.prospects] }, "Prospect created", prospect.company, prospect.id)
    setSelectedId(prospect.id)
    setCreateOpen(false)
    setDraft({
      company: "",
      contactName: "",
      phone: "",
      email: "",
      segment: "Clinic partner",
      city: "Rabat",
      source: "Manual",
      owner: "BD Officer",
      stage: "discovery",
      priority: "high",
      health: "on_track",
      valueMad: 50000,
      score: 65,
      nextAction: "",
      nextContactDate: today(2),
      decisionMaker: "",
      blocker: "",
      notes: "",
    })
  }

  function deleteProspect(id: string) {
    const target = store.prospects.find((prospect) => prospect.id === id)
    const prospects = store.prospects.filter((prospect) => prospect.id !== id)

    commit({ ...store, prospects }, "Prospect deleted", target?.company || id, id)
    setSelectedId(prospects[0]?.id || "")
  }

  function advanceProspect(id: string) {
    const target = store.prospects.find((prospect) => prospect.id === id)
    if (!target) return

    const index = stages.indexOf(target.stage)
    const nextStage = stages[Math.min(index + 1, stages.length - 1)]
    updateProspect(id, { stage: nextStage }, `Advanced to ${label(nextStage)}`)
  }

  function scoreProspect(id: string) {
    const target = store.prospects.find((prospect) => prospect.id === id)
    if (!target) return

    let score = 40
    if (target.valueMad >= 250000) score += 20
    if (target.decisionMaker.trim()) score += 12
    if (target.stage === "proposal" || target.stage === "negotiation") score += 12
    if (target.priority === "critical") score += 10
    if (target.blocker.trim()) score -= 8

    updateProspect(id, { score: Math.max(0, Math.min(100, score)) }, "Score recalculated")
  }

  const pipelineGroups = stages.map((stage) => ({
    stage,
    prospects: filtered.filter((prospect) => prospect.stage === stage),
  }))

  return (
    <main className="min-h-screen bg-emerald-50/50 text-slate-950 selection:bg-emerald-200 selection:text-slate-950">
      <div className="mx-auto max-w-[1900px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2.4rem] bg-gradient-to-br from-emerald-950 via-teal-950 to-black p-7 text-white shadow-2xl lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.35fr_.65fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="emerald">Revenue Command</Pill>
                <Pill tone="blue">Prospects V11</Pill>
                <Pill tone="amber">{mode === "pipeline" ? "Pipeline Board" : "Commercial Workspace"}</Pill>
              </div>
              <h1 className="mt-6 max-w-6xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                Prospects command — qualification, decision-map and conversion control.
              </h1>
              <p className="mt-5 max-w-5xl text-base font-semibold leading-8 text-emerald-50/85 md:text-lg">
                A focused business development cockpit for AngelCare revenue expansion: qualify opportunities, map decision makers, control next actions, score commercial potential and prevent pipeline decay.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>+ Create prospect</Button>
                <Button type="button" onClick={() => selected && advanceProspect(selected.id)}>Advance selected</Button>
                <Button type="button" variant="soft" onClick={restoreSeed}>Restore seed</Button>
                <Link href="/revenue-command-center" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">← Revenue HQ</Link>
                <Link href="/revenue-command-center/prospects/pipeline" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">Pipeline board</Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100/70">Prospects</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.total}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Active records</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100/70">Value</p>
                <p className="mt-3 text-3xl font-black text-white">{mad(stats.totalValue)}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Opportunity exposure</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100/70">Critical</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.critical}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Risk / high pressure</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100/70">Avg score</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.avgScore}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Commercial priority</p>
              </div>
            </div>
          </div>
        </section>

        {createOpen ? (
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Create prospect</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Create qualified commercial opportunity</h2>
              </div>
              <Button type="button" variant="soft" onClick={() => setCreateOpen(false)}>Close</Button>
            </div>
            <form onSubmit={createProspect} className="grid gap-4 xl:grid-cols-4">
              <Input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder="Company / prospect name" />
              <Input value={draft.contactName} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} placeholder="Contact name" />
              <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Phone" />
              <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email" />
              <Input value={draft.segment} onChange={(e) => setDraft({ ...draft, segment: e.target.value })} placeholder="Segment" />
              <Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="City" />
              <Input value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} placeholder="Source" />
              <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Owner" />
              <Select value={draft.stage} onChange={(e) => setDraft({ ...draft, stage: e.target.value as ProspectStage })}>
                {stages.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}
              </Select>
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as ProspectPriority })}>
                {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
              </Select>
              <Select value={draft.health} onChange={(e) => setDraft({ ...draft, health: e.target.value as ProspectHealth })}>
                {healthOptions.map((health) => <option key={health} value={health}>{label(health)}</option>)}
              </Select>
              <Input type="date" value={draft.nextContactDate} onChange={(e) => setDraft({ ...draft, nextContactDate: e.target.value })} />
              <Input type="number" value={draft.valueMad} onChange={(e) => setDraft({ ...draft, valueMad: Number(e.target.value) })} placeholder="Value MAD" />
              <Input type="number" value={draft.score} onChange={(e) => setDraft({ ...draft, score: Number(e.target.value) })} placeholder="Score" />
              <Input value={draft.decisionMaker} onChange={(e) => setDraft({ ...draft, decisionMaker: e.target.value })} placeholder="Decision maker" />
              <Input value={draft.nextAction} onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })} placeholder="Next action" />
              <Textarea value={draft.blocker} onChange={(e) => setDraft({ ...draft, blocker: e.target.value })} placeholder="Blocker" className="xl:col-span-2" />
              <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Notes" className="xl:col-span-2" />
              <Button type="submit" variant="primary" className="xl:col-span-4">Create prospect</Button>
            </form>
          </Card>
        ) : null}

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1fr_.45fr_.35fr_.35fr]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prospects, city, segment, owner, next action..." />
            <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as ProspectStage | "all")}>
              <option value="all">All stages</option>
              {stages.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}
            </Select>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as ProspectPriority | "all")}>
              <option value="all">All priorities</option>
              {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
            </Select>
            <Button type="button" onClick={() => setCreateOpen(true)}>New prospect</Button>
          </div>
        </Card>

        {mode === "pipeline" ? (
          <section className="grid gap-4 xl:grid-cols-4">
            {pipelineGroups.map((group) => (
              <Card key={group.stage} className="min-h-[240px]">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-black text-slate-950">{label(group.stage)}</h2>
                  <Pill tone="blue">{group.prospects.length}</Pill>
                </div>
                <div className="space-y-3">
                  {group.prospects.map((prospect) => (
                    <button key={prospect.id} type="button" onClick={() => setSelectedId(prospect.id)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-white">
                      <p className="text-sm font-black text-slate-950">{prospect.company}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{prospect.owner} • {mad(prospect.valueMad)}</p>
                      <div className="mt-2 flex gap-2">
                        <Pill tone={scoreTone(prospect.score)}>{prospect.score}</Pill>
                        <Pill tone={prospect.health === "risk" ? "rose" : "emerald"}>{label(prospect.health)}</Pill>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </section>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
            <section className="space-y-4">
              {filtered.map((prospect) => (
                <Card key={prospect.id} className={prospect.id === selected?.id ? "ring-4 ring-emerald-100" : ""}>
                  <div className="grid gap-5 xl:grid-cols-[1fr_.5fr_.55fr]">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Pill tone={prospect.priority === "critical" ? "rose" : prospect.priority === "high" ? "amber" : "blue"}>{label(prospect.priority)}</Pill>
                        <Pill tone={prospect.health === "risk" || prospect.health === "stalled" ? "rose" : "emerald"}>{label(prospect.health)}</Pill>
                        <Pill tone="violet">{label(prospect.stage)}</Pill>
                      </div>
                      <button type="button" onClick={() => setSelectedId(prospect.id)} className="mt-3 text-left text-2xl font-black text-slate-950 hover:text-emerald-800">{prospect.company}</button>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{prospect.nextAction}</p>
                      <p className="mt-3 text-sm font-black text-slate-700">Owner: {prospect.owner} • Contact: {prospect.contactName || "No contact"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Commercial score</p>
                      <p className="mt-2 text-4xl font-black text-slate-950">{prospect.score}</p>
                      <p className="mt-2 text-xs font-bold text-slate-500">{mad(prospect.valueMad)} • {prospect.city}</p>
                    </div>
                    <div className="grid gap-2">
                      <Button type="button" variant="soft" onClick={() => setSelectedId(prospect.id)}>Select</Button>
                      <Button type="button" variant="soft" onClick={() => advanceProspect(prospect.id)}>Advance</Button>
                      <Button type="button" variant="soft" onClick={() => scoreProspect(prospect.id)}>Re-score</Button>
                      <Button type="button" variant="danger" onClick={() => deleteProspect(prospect.id)}>Delete</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </section>

            <aside className="space-y-6">
              <Card className="bg-slate-950 text-white">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Selected prospect</p>
                <h2 className="mt-2 text-3xl font-black text-white">{selected?.company || "No prospect selected"}</h2>

                {selected ? (
                  <div className="mt-5 space-y-4">
                    <Textarea value={selected.notes} onChange={(e) => updateProspect(selected.id, { notes: e.target.value }, "Notes updated")} />
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={selected.stage} onChange={(e) => updateProspect(selected.id, { stage: e.target.value as ProspectStage }, "Stage updated")}>
                        {stages.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}
                      </Select>
                      <Select value={selected.priority} onChange={(e) => updateProspect(selected.id, { priority: e.target.value as ProspectPriority }, "Priority updated")}>
                        {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
                      </Select>
                      <Input value={selected.owner} onChange={(e) => updateProspect(selected.id, { owner: e.target.value }, "Owner updated")} />
                      <Input type="number" value={selected.valueMad} onChange={(e) => updateProspect(selected.id, { valueMad: Number(e.target.value) }, "Value updated")} />
                    </div>
                    <Textarea value={selected.nextAction} onChange={(e) => updateProspect(selected.id, { nextAction: e.target.value }, "Next action updated")} />
                    <Textarea value={selected.blocker} onChange={(e) => updateProspect(selected.id, { blocker: e.target.value }, "Blocker updated")} />
                    <div className="grid grid-cols-2 gap-2">
                      <Button type="button" variant="soft" onClick={() => advanceProspect(selected.id)}>Advance</Button>
                      <Button type="button" variant="soft" onClick={() => scoreProspect(selected.id)}>Score</Button>
                      <Button type="button" variant="danger" onClick={() => updateProspect(selected.id, { health: "risk", priority: "critical" }, "Risk escalated")}>Escalate</Button>
                      <Button type="button" variant="primary" onClick={() => updateProspect(selected.id, { stage: "closed_won", health: "on_track" }, "Closed won")}>Won</Button>
                    </div>
                  </div>
                ) : null}
              </Card>

              <Card>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Activity log</p>
                <div className="mt-4 space-y-2">
                  {store.activities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-sm font-black text-slate-950">{activity.action}</p>
                      <p className="text-xs font-bold text-slate-500">{activity.note} • {activity.at}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
