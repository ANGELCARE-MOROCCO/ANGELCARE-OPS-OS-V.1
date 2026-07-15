"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type ProspectStage =
  | "new_lead"
  | "discovery"
  | "qualification"
  | "decision_map"
  | "appointment_ready"
  | "proposal"
  | "negotiation"
  | "contracting"
  | "closed_won"
  | "closed_lost"
  | "recovery"

type ProspectPriority = "critical" | "high" | "medium" | "low"
type ProspectHealth = "on_track" | "risk" | "recovery" | "stalled"
type ProspectType = "family" | "clinic" | "corporate" | "academy" | "partner" | "institution" | "website" | "campaign"
type ProspectPageMode =
  | "dashboard"
  | "pipeline"
  | "qualification"
  | "decision-map"
  | "appointments"
  | "proposals"
  | "negotiation"
  | "recovery"
  | "analytics"
  | "performance"
  | "risk"
  | "executive"
  | "high-value"
  | "new"

type ProspectRecord = {
  id: string
  name: string
  company: string
  contactName: string
  phone: string
  email: string
  city: string
  source: string
  type: ProspectType
  owner: string
  closer: string
  stage: ProspectStage
  priority: ProspectPriority
  health: ProspectHealth
  valueMad: number
  score: number
  probability: number
  urgency: number
  fitScore: number
  decisionMaker: string
  decisionMakerConfirmed: boolean
  stakeholders: string[]
  needSummary: string
  painPoints: string
  budgetContext: string
  competitorRisk: string
  objection: string
  nextAction: string
  nextContactDate: string
  qualificationNotes: string
  proposedOffer: string
  negotiationTerms: string
  recoveryPlan: string
  documents: string[]
  createdAt: string
  updatedAt: string
}

type ProspectLog = {
  id: string
  prospectId: string
  at: string
  action: string
  note: string
}

type AutomationRule = {
  id: string
  name: string
  trigger: string
  action: string
  enabled: boolean
}

type ProspectStore = {
  prospects: ProspectRecord[]
  logs: ProspectLog[]
  automations: AutomationRule[]
}

const STORE_KEY = "revenue_prospects_v12_mega_store"

const stages: ProspectStage[] = [
  "new_lead",
  "discovery",
  "qualification",
  "decision_map",
  "appointment_ready",
  "proposal",
  "negotiation",
  "contracting",
  "closed_won",
  "closed_lost",
  "recovery",
]

const priorities: ProspectPriority[] = ["critical", "high", "medium", "low"]
const healthOptions: ProspectHealth[] = ["on_track", "risk", "recovery", "stalled"]
const types: ProspectType[] = ["family", "clinic", "corporate", "academy", "partner", "institution", "website", "campaign"]

const subpages: Array<{ mode: ProspectPageMode; label: string; href: string; desc: string }> = [
  { mode: "dashboard", label: "Dashboard", href: "/revenue-command-center/prospects", desc: "Master prospects command dashboard." },
  { mode: "pipeline", label: "Pipeline", href: "/revenue-command-center/prospects/pipeline", desc: "Stage board and opportunity movement." },
  { mode: "new", label: "New Prospect", href: "/revenue-command-center/prospects/new", desc: "Create a fully qualified prospect record." },
  { mode: "qualification", label: "Qualification", href: "/revenue-command-center/prospects/qualification", desc: "Need, fit, urgency, budget and quality control." },
  { mode: "decision-map", label: "Decision Map", href: "/revenue-command-center/prospects/decision-map", desc: "Stakeholders, blockers and decision path." },
  { mode: "appointments", label: "Appointments", href: "/revenue-command-center/prospects/appointments", desc: "Appointment readiness and conversion handoff." },
  { mode: "proposals", label: "Proposals", href: "/revenue-command-center/prospects/proposals", desc: "Offer, pricing and proposal control." },
  { mode: "negotiation", label: "Negotiation", href: "/revenue-command-center/prospects/negotiation", desc: "Terms, objections and closing control." },
  { mode: "recovery", label: "Recovery", href: "/revenue-command-center/prospects/recovery", desc: "Stalled/lost opportunity recovery." },
  { mode: "analytics", label: "Analytics", href: "/revenue-command-center/prospects/analytics", desc: "Pipeline metrics and revenue intelligence." },
  { mode: "performance", label: "Performance", href: "/revenue-command-center/prospects/performance", desc: "Owner and closer production performance." },
  { mode: "risk", label: "Risk", href: "/revenue-command-center/prospects/risk", desc: "At-risk prospects, competitor risk and stalled deals." },
  { mode: "executive", label: "Executive", href: "/revenue-command-center/prospects/executive", desc: "High-value decision queue for leaders." },
  { mode: "high-value", label: "High Value", href: "/revenue-command-center/prospects/high-value", desc: "Large MAD opportunities requiring control." },
]

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
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(value || 0)
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function seedProspects(): ProspectRecord[] {
  const now = new Date().toISOString()
  return [
    {
      id: "pros-v12-clinic-rabat",
      name: "Clinic maternity referral partnership",
      company: "Clinique Maternité Rabat Premium",
      contactName: "Dr. Nadia Benali",
      phone: "+212600000301",
      email: "direction@clinique-rabat.ma",
      city: "Rabat",
      source: "Partnership outreach",
      type: "clinic",
      owner: "BD Officer",
      closer: "Revenue Manager",
      stage: "decision_map",
      priority: "critical",
      health: "risk",
      valueMad: 420000,
      score: 92,
      probability: 71,
      urgency: 78,
      fitScore: 89,
      decisionMaker: "Medical Director + Operations Director",
      decisionMakerConfirmed: false,
      stakeholders: ["Medical Director", "Operations Director", "Referral Coordinator"],
      needSummary: "Recurring referral channel for postpartum and family care services.",
      painPoints: "Patient trust, referral flow, quality control and economics.",
      budgetContext: "Partnership economics under review.",
      competitorRisk: "Other home-care providers may attempt clinic relationship.",
      objection: "Needs proof of referral quality and patient experience.",
      nextAction: "Confirm decision-maker map and book partnership presentation.",
      nextContactDate: today(1),
      qualificationNotes: "High strategic fit and high recurring potential.",
      proposedOffer: "Referral pilot with co-branded activation and monthly review.",
      negotiationTerms: "Referral economics, activation responsibilities, quality SLA.",
      recoveryPlan: "",
      documents: ["Partner one-pager", "Referral flow", "Activation checklist"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "pros-v12-corporate-casa",
      name: "Corporate family-care benefits opportunity",
      company: "Casablanca Corporate HR Group",
      contactName: "Meriem A.",
      phone: "+212600000302",
      email: "hr@corporate-casa.ma",
      city: "Casablanca",
      source: "LinkedIn outreach",
      type: "corporate",
      owner: "Revenue Manager",
      closer: "CEO / Revenue Manager",
      stage: "qualification",
      priority: "high",
      health: "on_track",
      valueMad: 280000,
      score: 78,
      probability: 63,
      urgency: 55,
      fitScore: 82,
      decisionMaker: "HR Director",
      decisionMakerConfirmed: true,
      stakeholders: ["HR Director", "Finance", "Employee Benefits Manager"],
      needSummary: "Potential B2B employee family-care support package.",
      painPoints: "Retention, employee support, trusted providers.",
      budgetContext: "Budget timing unclear.",
      competitorRisk: "Corporate wellness platforms.",
      objection: "Needs business case and employee demand proof.",
      nextAction: "Qualify budget cycle and prepare business case.",
      nextContactDate: today(3),
      qualificationNotes: "Strong fit if budget cycle confirmed.",
      proposedOffer: "Corporate employee care support package.",
      negotiationTerms: "Monthly retainer or usage-based model.",
      recoveryPlan: "",
      documents: ["Business case", "Corporate offer"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "pros-v12-family-elderly",
      name: "Elderly care family inquiry recovery",
      company: "Family B",
      contactName: "Family decision maker",
      phone: "+212600000303",
      email: "family-b@example.com",
      city: "Temara",
      source: "Website form",
      type: "family",
      owner: "SDR Agent",
      closer: "SDR Lead",
      stage: "recovery",
      priority: "medium",
      health: "recovery",
      valueMad: 38000,
      score: 58,
      probability: 39,
      urgency: 64,
      fitScore: 72,
      decisionMaker: "Unknown",
      decisionMakerConfirmed: false,
      stakeholders: ["Family contact"],
      needSummary: "Elderly care assessment requested but missed call sequence.",
      painPoints: "Trust, caregiver reliability, availability.",
      budgetContext: "Unknown.",
      competitorRisk: "Family may compare providers.",
      objection: "No response after initial inquiry.",
      nextAction: "Send recovery WhatsApp and offer two assessment slots.",
      nextContactDate: today(0),
      qualificationNotes: "Needs recovery and decision maker confirmation.",
      proposedOffer: "Free short phone assessment + care assessment slot.",
      negotiationTerms: "",
      recoveryPlan: "Empathy message, two time windows, next-day callback.",
      documents: ["Recovery note"],
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function seedAutomations(): AutomationRule[] {
  return [
    {
      id: "auto-high-value-no-decision",
      name: "High-value no decision-maker escalation",
      trigger: "Value > 100,000 MAD and decision maker not confirmed",
      action: "Escalate to owner and create decision-map task.",
      enabled: true,
    },
    {
      id: "auto-stalled-prospect",
      name: "Stalled prospect recovery",
      trigger: "Stage unchanged and next contact overdue",
      action: "Move to recovery, create SDR callback and notify manager.",
      enabled: true,
    },
    {
      id: "auto-proposal-risk",
      name: "Proposal stage risk control",
      trigger: "Proposal/negotiation with competitor risk",
      action: "Create objection handling plan and executive review.",
      enabled: true,
    },
  ]
}

function defaultStore(): ProspectStore {
  return {
    prospects: seedProspects(),
    logs: [{ id: uid(), prospectId: "system", at: new Date().toLocaleString(), action: "Prospects V12 initialized", note: "Deep prospect execution engine seeded." }],
    automations: seedAutomations(),
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
    if (!Array.isArray(parsed.prospects)) return defaultStore()
    if (!Array.isArray(parsed.logs)) parsed.logs = []
    if (!Array.isArray(parsed.automations)) parsed.automations = seedAutomations()
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

function Panel({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <Card>
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">{title}</p>
        {subtitle ? <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </Card>
  )
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

function priorityTone(priority: ProspectPriority) {
  if (priority === "critical") return "rose"
  if (priority === "high") return "amber"
  if (priority === "medium") return "blue"
  return "slate"
}

function healthTone(health: ProspectHealth) {
  if (health === "risk" || health === "stalled") return "rose"
  if (health === "recovery") return "amber"
  return "emerald"
}

function scoreTone(score: number) {
  if (score >= 85) return "rose"
  if (score >= 70) return "amber"
  if (score >= 55) return "blue"
  return "slate"
}

function pageTitle(mode: ProspectPageMode) {
  return subpages.find((page) => page.mode === mode)?.label || "Prospects"
}

function pageSubtitle(mode: ProspectPageMode) {
  return subpages.find((page) => page.mode === mode)?.desc || "Deep prospect execution layer."
}

export default function RevenueProspectsV12MegaWorkspace({ mode = "dashboard" }: { mode?: ProspectPageMode }) {
  const [store, setStore] = useState<ProspectStore>(() => defaultStore())
  const [query, setQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<ProspectStage | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<ProspectPriority | "all">("all")
  const [selectedId, setSelectedId] = useState("")
  const [createOpen, setCreateOpen] = useState(mode === "new")
  const [newStakeholder, setNewStakeholder] = useState("")
  const [draft, setDraft] = useState({
    name: "",
    company: "",
    contactName: "",
    phone: "",
    email: "",
    city: "Rabat",
    source: "Manual",
    type: "family" as ProspectType,
    owner: "BD Officer",
    closer: "Revenue Manager",
    stage: "new_lead" as ProspectStage,
    priority: "high" as ProspectPriority,
    health: "on_track" as ProspectHealth,
    valueMad: 50000,
    score: 65,
    probability: 55,
    urgency: 50,
    fitScore: 60,
    decisionMaker: "",
    decisionMakerConfirmed: false,
    stakeholders: "Decision maker\nInfluencer",
    needSummary: "",
    painPoints: "",
    budgetContext: "",
    competitorRisk: "",
    objection: "",
    nextAction: "",
    nextContactDate: today(2),
    qualificationNotes: "",
    proposedOffer: "",
    negotiationTerms: "",
    recoveryPlan: "",
    documents: "Qualification summary\nProposal",
  })

  useEffect(() => {
    const loaded = readStore()
    setStore(loaded)
    setSelectedId(loaded.prospects[0]?.id || "")
  }, [])

  function commit(next: ProspectStore, action: string, note: string, prospectId?: string) {
    const withLog = {
      ...next,
      logs: [{ id: uid(), prospectId: prospectId || selectedId || "system", at: new Date().toLocaleString(), action, note }, ...next.logs].slice(0, 150),
    }
    setStore(withLog)
    writeStore(withLog)
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
      const hay = `${prospect.name} ${prospect.company} ${prospect.contactName} ${prospect.city} ${prospect.owner} ${prospect.closer} ${prospect.needSummary} ${prospect.nextAction} ${prospect.decisionMaker}`.toLowerCase()

      const modeMatch =
        mode === "qualification" ? ["new_lead", "discovery", "qualification"].includes(prospect.stage) :
        mode === "decision-map" ? ["decision_map", "qualification", "proposal", "negotiation"].includes(prospect.stage) :
        mode === "appointments" ? ["appointment_ready", "proposal", "negotiation"].includes(prospect.stage) :
        mode === "proposals" ? ["proposal", "negotiation", "contracting"].includes(prospect.stage) :
        mode === "negotiation" ? ["negotiation", "contracting"].includes(prospect.stage) :
        mode === "recovery" ? ["recovery", "closed_lost"].includes(prospect.stage) || prospect.health === "recovery" :
        mode === "high-value" ? prospect.valueMad >= 100000 || prospect.priority === "critical" :
        mode === "risk" ? prospect.health === "risk" || prospect.health === "stalled" || prospect.competitorRisk.trim() !== "" :
        true

      return modeMatch
        && (!query || hay.includes(query.toLowerCase()))
        && (stageFilter === "all" || prospect.stage === stageFilter)
        && (priorityFilter === "all" || prospect.priority === priorityFilter)
    })
  }, [store.prospects, query, stageFilter, priorityFilter, mode])

  const stats = useMemo(() => {
    const active = store.prospects.filter((p) => !["closed_won", "closed_lost"].includes(p.stage)).length
    const critical = store.prospects.filter((p) => p.priority === "critical" || p.health === "risk").length
    const highValue = store.prospects.filter((p) => p.valueMad >= 100000).length
    const decisionMissing = store.prospects.filter((p) => !p.decisionMakerConfirmed).length
    const recovery = store.prospects.filter((p) => p.stage === "recovery" || p.health === "recovery").length
    const value = store.prospects.reduce((sum, p) => sum + Number(p.valueMad || 0), 0)
    const avgScore = Math.round(store.prospects.reduce((sum, p) => sum + Number(p.score || 0), 0) / Math.max(store.prospects.length, 1))
    const avgProb = Math.round(store.prospects.reduce((sum, p) => sum + Number(p.probability || 0), 0) / Math.max(store.prospects.length, 1))
    return { active, critical, highValue, decisionMissing, recovery, value, avgScore, avgProb, total: store.prospects.length }
  }, [store.prospects])

  function updateProspect(id: string, patch: Partial<ProspectRecord>, action = "Prospect updated") {
    const target = store.prospects.find((p) => p.id === id)
    const prospects = store.prospects.map((p) => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)
    commit({ ...store, prospects }, action, target?.name || id, id)
  }

  function createProspect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.name.trim()) return

    const now = new Date().toISOString()
    const prospect: ProspectRecord = {
      id: uid(),
      name: draft.name,
      company: draft.company,
      contactName: draft.contactName,
      phone: draft.phone,
      email: draft.email,
      city: draft.city,
      source: draft.source,
      type: draft.type,
      owner: draft.owner,
      closer: draft.closer,
      stage: draft.stage,
      priority: draft.priority,
      health: draft.health,
      valueMad: Number(draft.valueMad) || 0,
      score: clamp(draft.score),
      probability: clamp(draft.probability),
      urgency: clamp(draft.urgency),
      fitScore: clamp(draft.fitScore),
      decisionMaker: draft.decisionMaker,
      decisionMakerConfirmed: Boolean(draft.decisionMakerConfirmed),
      stakeholders: draft.stakeholders.split("\n").map((item) => item.trim()).filter(Boolean),
      needSummary: draft.needSummary,
      painPoints: draft.painPoints,
      budgetContext: draft.budgetContext,
      competitorRisk: draft.competitorRisk,
      objection: draft.objection,
      nextAction: draft.nextAction || "Qualify prospect and define next commercial step.",
      nextContactDate: draft.nextContactDate,
      qualificationNotes: draft.qualificationNotes,
      proposedOffer: draft.proposedOffer,
      negotiationTerms: draft.negotiationTerms,
      recoveryPlan: draft.recoveryPlan,
      documents: draft.documents.split("\n").map((item) => item.trim()).filter(Boolean),
      createdAt: now,
      updatedAt: now,
    }

    commit({ ...store, prospects: [prospect, ...store.prospects] }, "Prospect created", prospect.name, prospect.id)
    setSelectedId(prospect.id)
    setCreateOpen(false)
  }

  function deleteProspect(id: string) {
    const target = store.prospects.find((p) => p.id === id)
    const prospects = store.prospects.filter((p) => p.id !== id)
    commit({ ...store, prospects }, "Prospect deleted", target?.name || id, id)
    setSelectedId(prospects[0]?.id || "")
  }

  function autoScore(id: string) {
    const target = store.prospects.find((p) => p.id === id)
    if (!target) return
    let score = 35
    if (target.valueMad >= 100000) score += 18
    if (target.decisionMakerConfirmed) score += 15
    if (target.fitScore >= 75) score += 12
    if (target.urgency >= 70) score += 10
    if (target.competitorRisk.trim()) score -= 8
    if (target.objection.trim()) score -= 4
    const probability = clamp((score + target.fitScore + target.urgency) / 3)
    updateProspect(id, {
      score: clamp(score),
      probability,
      health: score >= 80 ? "on_track" : target.competitorRisk || target.objection ? "risk" : target.health,
      priority: score >= 85 || target.valueMad >= 200000 ? "critical" : target.priority,
    }, "Prospect auto-scored")
  }

  function advance(id: string) {
    const target = store.prospects.find((p) => p.id === id)
    if (!target) return
    const index = stages.indexOf(target.stage)
    const nextStage = stages[Math.min(index + 1, stages.length - 1)]
    updateProspect(id, { stage: nextStage, nextAction: `Execute next stage: ${label(nextStage)}.` }, `Advanced to ${label(nextStage)}`)
  }

  function moveRecovery(id: string) {
    updateProspect(id, {
      stage: "recovery",
      health: "recovery",
      recoveryPlan: selected?.recoveryPlan || "Create recovery call, send WhatsApp and re-open decision path.",
      nextAction: "Execute recovery workflow.",
    }, "Recovery activated")
  }

  function markWon(id: string) {
    updateProspect(id, { stage: "closed_won", health: "on_track", probability: 100, nextAction: "Create onboarding/order handoff." }, "Marked won")
  }

  function markLost(id: string) {
    updateProspect(id, { stage: "closed_lost", health: "stalled", recoveryPlan: selected?.recoveryPlan || "Review lost reason and decide win-back plan." }, "Marked lost")
  }

  function confirmDecisionMaker(id: string) {
    updateProspect(id, { decisionMakerConfirmed: true, stage: "decision_map", nextAction: "Book appointment or prepare proposal with decision maker." }, "Decision maker confirmed")
  }

  function addStakeholder() {
    if (!selected || !newStakeholder.trim()) return
    updateProspect(selected.id, { stakeholders: [...selected.stakeholders, newStakeholder.trim()] }, "Stakeholder added")
    setNewStakeholder("")
  }

  function removeStakeholder(index: number) {
    if (!selected) return
    updateProspect(selected.id, { stakeholders: selected.stakeholders.filter((_, i) => i !== index) }, "Stakeholder removed")
  }

  function toggleAutomation(id: string) {
    const automations = store.automations.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)
    commit({ ...store, automations }, "Automation toggled", id)
  }

  const boardGroups = stages.map((stage) => ({
    stage,
    prospects: filtered.filter((p) => p.stage === stage),
  }))

  return (
    <main className="min-h-screen bg-emerald-50/60 text-slate-950 selection:bg-emerald-200 selection:text-slate-950">
      <div className="mx-auto max-w-[1900px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2.4rem] bg-gradient-to-br from-slate-950 via-emerald-950 to-black p-7 text-white shadow-2xl lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.28fr_.72fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="emerald">Revenue Command</Pill>
                <Pill tone="blue">Prospects V12 Mega</Pill>
                <Pill tone="amber">{pageTitle(mode)}</Pill>
              </div>
              <h1 className="mt-6 max-w-6xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                Prospects deep execution engine — qualification, decision maps, pipeline control and revenue conversion.
              </h1>
              <p className="mt-5 max-w-5xl text-base font-semibold leading-8 text-emerald-50/85 md:text-lg">
                A full commercial control system for AngelCare prospects: sourcing, qualification, decision-maker mapping, appointment readiness, proposal control, negotiation, recovery, risk intelligence and executive high-value oversight.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>+ Create prospect</Button>
                <Button type="button" onClick={() => selected && autoScore(selected.id)}>Auto-score selected</Button>
                <Button type="button" variant="soft" onClick={restoreSeed}>Restore seed</Button>
                <Link href="/revenue-command-center" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">← Revenue HQ</Link>
                <Link href="/revenue-command-center/prospects/pipeline" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">Pipeline</Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Active", stats.active, "Open prospects"],
                ["Critical", stats.critical, "Risk/high pressure"],
                ["Value", mad(stats.value), "Pipeline exposure"],
                ["Decision", stats.decisionMissing, "Missing decision-maker"],
                ["Score", `${stats.avgScore}`, "Avg score"],
                ["Probability", `${stats.avgProb}%`, "Avg conversion"],
              ].map(([k, v, d]) => (
                <div key={String(k)} className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100/70">{k}</p>
                  <p className="mt-3 text-3xl font-black text-white">{v}</p>
                  <p className="mt-2 text-sm font-bold text-white/75">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {subpages.map((page) => (
            <Link key={page.href} href={page.href} className={`rounded-3xl border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${mode === page.mode ? "border-emerald-400 bg-emerald-100" : "border-slate-200 bg-white"}`}>
              <p className="text-sm font-black text-slate-950">{page.label}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{page.desc}</p>
            </Link>
          ))}
        </section>

        {createOpen ? (
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Create prospect</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Create fully controlled prospect record</h2>
              </div>
              <Button type="button" variant="soft" onClick={() => setCreateOpen(false)}>Close</Button>
            </div>
            <form onSubmit={createProspect} className="grid gap-4 xl:grid-cols-4">
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Prospect name" />
              <Input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder="Company / family" />
              <Input value={draft.contactName} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} placeholder="Contact name" />
              <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Phone" />
              <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email" />
              <Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="City" />
              <Input value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} placeholder="Source" />
              <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as ProspectType })}>
                {types.map((t) => <option key={t} value={t}>{label(t)}</option>)}
              </Select>
              <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Owner" />
              <Input value={draft.closer} onChange={(e) => setDraft({ ...draft, closer: e.target.value })} placeholder="Closer" />
              <Select value={draft.stage} onChange={(e) => setDraft({ ...draft, stage: e.target.value as ProspectStage })}>
                {stages.map((s) => <option key={s} value={s}>{label(s)}</option>)}
              </Select>
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as ProspectPriority })}>
                {priorities.map((p) => <option key={p} value={p}>{label(p)}</option>)}
              </Select>
              <Select value={draft.health} onChange={(e) => setDraft({ ...draft, health: e.target.value as ProspectHealth })}>
                {healthOptions.map((h) => <option key={h} value={h}>{label(h)}</option>)}
              </Select>
              <Input type="date" value={draft.nextContactDate} onChange={(e) => setDraft({ ...draft, nextContactDate: e.target.value })} />
              <Input type="number" value={draft.valueMad} onChange={(e) => setDraft({ ...draft, valueMad: Number(e.target.value) })} placeholder="Value MAD" />
              <Input type="number" value={draft.score} onChange={(e) => setDraft({ ...draft, score: Number(e.target.value) })} placeholder="Score" />
              <Input type="number" value={draft.probability} onChange={(e) => setDraft({ ...draft, probability: Number(e.target.value) })} placeholder="Probability %" />
              <Input type="number" value={draft.urgency} onChange={(e) => setDraft({ ...draft, urgency: Number(e.target.value) })} placeholder="Urgency %" />
              <Input type="number" value={draft.fitScore} onChange={(e) => setDraft({ ...draft, fitScore: Number(e.target.value) })} placeholder="Fit %" />
              <Input value={draft.decisionMaker} onChange={(e) => setDraft({ ...draft, decisionMaker: e.target.value })} placeholder="Decision maker" />
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800">
                <input type="checkbox" checked={draft.decisionMakerConfirmed} onChange={(e) => setDraft({ ...draft, decisionMakerConfirmed: e.target.checked })} />
                Decision maker confirmed
              </label>
              <Textarea value={draft.stakeholders} onChange={(e) => setDraft({ ...draft, stakeholders: e.target.value })} placeholder="Stakeholders, one per line" className="xl:col-span-2" />
              <Textarea value={draft.needSummary} onChange={(e) => setDraft({ ...draft, needSummary: e.target.value })} placeholder="Need summary" className="xl:col-span-2" />
              <Textarea value={draft.painPoints} onChange={(e) => setDraft({ ...draft, painPoints: e.target.value })} placeholder="Pain points" className="xl:col-span-2" />
              <Textarea value={draft.budgetContext} onChange={(e) => setDraft({ ...draft, budgetContext: e.target.value })} placeholder="Budget context" className="xl:col-span-2" />
              <Textarea value={draft.competitorRisk} onChange={(e) => setDraft({ ...draft, competitorRisk: e.target.value })} placeholder="Competitor risk" className="xl:col-span-2" />
              <Textarea value={draft.objection} onChange={(e) => setDraft({ ...draft, objection: e.target.value })} placeholder="Objection" className="xl:col-span-2" />
              <Textarea value={draft.nextAction} onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })} placeholder="Next action" className="xl:col-span-2" />
              <Textarea value={draft.proposedOffer} onChange={(e) => setDraft({ ...draft, proposedOffer: e.target.value })} placeholder="Proposed offer" className="xl:col-span-2" />
              <Button type="submit" variant="primary" className="xl:col-span-4">Create prospect</Button>
            </form>
          </Card>
        ) : null}

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1fr_.45fr_.35fr_.35fr]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prospects, company, decision maker, next action..." />
            <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as ProspectStage | "all")}>
              <option value="all">All stages</option>
              {stages.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </Select>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as ProspectPriority | "all")}>
              <option value="all">All priorities</option>
              {priorities.map((p) => <option key={p} value={p}>{label(p)}</option>)}
            </Select>
            <Button type="button" onClick={() => setCreateOpen(true)}>New prospect</Button>
          </div>
        </Card>

        {mode === "pipeline" ? (
          <section className="grid gap-4 xl:grid-cols-4">
            {boardGroups.map((group) => (
              <Card key={group.stage} className="min-h-[230px]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-950">{label(group.stage)}</h3>
                  <Pill tone="blue">{group.prospects.length}</Pill>
                </div>
                <div className="space-y-3">
                  {group.prospects.map((prospect) => (
                    <button key={prospect.id} type="button" onClick={() => setSelectedId(prospect.id)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-white">
                      <p className="text-sm font-black text-slate-950">{prospect.name}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{prospect.owner} • {mad(prospect.valueMad)}</p>
                      <div className="mt-2 flex gap-2">
                        <Pill tone={scoreTone(prospect.score)}>{prospect.score}</Pill>
                        <Pill tone={healthTone(prospect.health)}>{label(prospect.health)}</Pill>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.12fr_.88fr]">
          <section className="space-y-4">
            {filtered.map((prospect) => (
              <Card key={prospect.id} className={prospect.id === selected?.id ? "ring-4 ring-emerald-100" : ""}>
                <div className="grid gap-5 xl:grid-cols-[1fr_.48fr_.65fr]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={priorityTone(prospect.priority)}>{label(prospect.priority)}</Pill>
                      <Pill tone={healthTone(prospect.health)}>{label(prospect.health)}</Pill>
                      <Pill tone="violet">{label(prospect.stage)}</Pill>
                    </div>
                    <button type="button" onClick={() => setSelectedId(prospect.id)} className="mt-3 text-left text-2xl font-black text-slate-950 hover:text-emerald-800">{prospect.name}</button>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{prospect.needSummary || prospect.nextAction}</p>
                    <p className="mt-3 text-sm font-black text-slate-700">{prospect.company} • {prospect.contactName} • {prospect.city}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Revenue engine</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{prospect.score}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">Probability {prospect.probability}% • Fit {prospect.fitScore}%</p>
                    <p className="mt-2 text-sm font-black text-emerald-700">{mad(prospect.valueMad)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => setSelectedId(prospect.id)}>Select</Button>
                    <Button type="button" variant="soft" onClick={() => autoScore(prospect.id)}>Score</Button>
                    <Button type="button" variant="soft" onClick={() => advance(prospect.id)}>Advance</Button>
                    <Button type="button" variant="soft" onClick={() => confirmDecisionMaker(prospect.id)}>Decision</Button>
                    <Button type="button" variant="soft" onClick={() => moveRecovery(prospect.id)}>Recover</Button>
                    <Button type="button" variant="primary" onClick={() => markWon(prospect.id)}>Won</Button>
                    <Button type="button" variant="danger" onClick={() => markLost(prospect.id)}>Lost</Button>
                    <Button type="button" variant="danger" onClick={() => deleteProspect(prospect.id)}>Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <aside className="space-y-6">
            <Card className="bg-slate-950 text-white">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Selected prospect command room</p>
              <h2 className="mt-2 text-3xl font-black text-white">{selected?.name || "No prospect selected"}</h2>

              {selected ? (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs font-black text-white/60">Score</p>
                      <p className="mt-1 text-2xl font-black">{selected.score}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs font-black text-white/60">Prob.</p>
                      <p className="mt-1 text-2xl font-black">{selected.probability}%</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs font-black text-white/60">Value</p>
                      <p className="mt-1 text-xl font-black">{mad(selected.valueMad)}</p>
                    </div>
                  </div>

                  <Textarea value={selected.qualificationNotes} onChange={(e) => updateProspect(selected.id, { qualificationNotes: e.target.value }, "Qualification updated")} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={selected.stage} onChange={(e) => updateProspect(selected.id, { stage: e.target.value as ProspectStage }, "Stage updated")}>
                      {stages.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                    </Select>
                    <Select value={selected.priority} onChange={(e) => updateProspect(selected.id, { priority: e.target.value as ProspectPriority }, "Priority updated")}>
                      {priorities.map((p) => <option key={p} value={p}>{label(p)}</option>)}
                    </Select>
                    <Select value={selected.health} onChange={(e) => updateProspect(selected.id, { health: e.target.value as ProspectHealth }, "Health updated")}>
                      {healthOptions.map((h) => <option key={h} value={h}>{label(h)}</option>)}
                    </Select>
                    <Input value={selected.owner} onChange={(e) => updateProspect(selected.id, { owner: e.target.value }, "Owner updated")} />
                    <Input value={selected.closer} onChange={(e) => updateProspect(selected.id, { closer: e.target.value }, "Closer updated")} />
                    <Input type="number" value={selected.valueMad} onChange={(e) => updateProspect(selected.id, { valueMad: Number(e.target.value) }, "Value updated")} />
                    <Input type="number" value={selected.score} onChange={(e) => updateProspect(selected.id, { score: clamp(Number(e.target.value)) }, "Score updated")} />
                    <Input type="number" value={selected.probability} onChange={(e) => updateProspect(selected.id, { probability: clamp(Number(e.target.value)) }, "Probability updated")} />
                  </div>

                  <Panel title="Decision map" subtitle={selected.decisionMakerConfirmed ? "Decision maker confirmed" : "Decision maker not confirmed"}>
                    <div className="space-y-3">
                      <Input value={selected.decisionMaker} onChange={(e) => updateProspect(selected.id, { decisionMaker: e.target.value }, "Decision maker updated")} />
                      <Button type="button" variant="primary" onClick={() => confirmDecisionMaker(selected.id)}>Confirm decision maker</Button>
                      {selected.stakeholders.map((stakeholder, index) => (
                        <div key={`${stakeholder}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-100 p-3 text-sm font-black text-slate-900">
                          <span>{stakeholder}</span>
                          <button type="button" onClick={() => removeStakeholder(index)} className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-black text-white">Remove</button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input value={newStakeholder} onChange={(e) => setNewStakeholder(e.target.value)} placeholder="Add stakeholder" />
                        <Button type="button" variant="primary" onClick={addStakeholder}>Add</Button>
                      </div>
                    </div>
                  </Panel>

                  <Textarea value={selected.needSummary} onChange={(e) => updateProspect(selected.id, { needSummary: e.target.value }, "Need updated")} placeholder="Need summary" />
                  <Textarea value={selected.painPoints} onChange={(e) => updateProspect(selected.id, { painPoints: e.target.value }, "Pain points updated")} placeholder="Pain points" />
                  <Textarea value={selected.budgetContext} onChange={(e) => updateProspect(selected.id, { budgetContext: e.target.value }, "Budget updated")} placeholder="Budget context" />
                  <Textarea value={selected.competitorRisk} onChange={(e) => updateProspect(selected.id, { competitorRisk: e.target.value, health: e.target.value.trim() ? "risk" : selected.health }, "Competitor risk updated")} placeholder="Competitor risk" />
                  <Textarea value={selected.objection} onChange={(e) => updateProspect(selected.id, { objection: e.target.value }, "Objection updated")} placeholder="Objection" />
                  <Textarea value={selected.proposedOffer} onChange={(e) => updateProspect(selected.id, { proposedOffer: e.target.value }, "Offer updated")} placeholder="Proposed offer" />
                  <Textarea value={selected.negotiationTerms} onChange={(e) => updateProspect(selected.id, { negotiationTerms: e.target.value }, "Negotiation updated")} placeholder="Negotiation terms" />
                  <Textarea value={selected.recoveryPlan} onChange={(e) => updateProspect(selected.id, { recoveryPlan: e.target.value }, "Recovery updated")} placeholder="Recovery plan" />
                  <Textarea value={selected.nextAction} onChange={(e) => updateProspect(selected.id, { nextAction: e.target.value }, "Next action updated")} placeholder="Next action" />

                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => autoScore(selected.id)}>Auto-score</Button>
                    <Button type="button" variant="soft" onClick={() => advance(selected.id)}>Advance</Button>
                    <Button type="button" variant="soft" onClick={() => confirmDecisionMaker(selected.id)}>Decision</Button>
                    <Button type="button" variant="soft" onClick={() => moveRecovery(selected.id)}>Recover</Button>
                    <Button type="button" variant="primary" onClick={() => markWon(selected.id)}>Won</Button>
                    <Button type="button" variant="danger" onClick={() => markLost(selected.id)}>Lost</Button>
                  </div>
                </div>
              ) : null}
            </Card>

            <Panel title="Automation engine" subtitle="Operational watchdog rules for prospects.">
              <div className="space-y-3">
                {store.automations.map((rule) => (
                  <button key={rule.id} type="button" onClick={() => toggleAutomation(rule.id)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-slate-950">{rule.name}</p>
                      <Pill tone={rule.enabled ? "emerald" : "slate"}>{rule.enabled ? "Enabled" : "Disabled"}</Pill>
                    </div>
                    <p className="mt-2 text-xs font-bold leading-5 text-slate-500">IF {rule.trigger}</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">THEN {rule.action}</p>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="AI commercial copilot" subtitle="Guidance for selected prospect.">
              {selected ? (
                <div className="space-y-3 text-sm font-bold leading-6 text-slate-700">
                  <div className="rounded-2xl bg-emerald-50 p-4"><b>Qualification:</b> {selected.qualificationNotes || selected.needSummary || "No qualification note yet."}</div>
                  <div className="rounded-2xl bg-amber-50 p-4"><b>Objection:</b> {selected.objection || "No objection captured."}</div>
                  <div className="rounded-2xl bg-blue-50 p-4"><b>Offer:</b> {selected.proposedOffer || "No offer prepared."}</div>
                  <div className="rounded-2xl bg-rose-50 p-4"><b>Recovery:</b> {selected.recoveryPlan || "No recovery plan yet."}</div>
                </div>
              ) : null}
            </Panel>

            <Panel title="Activity stream" subtitle="Every prospect command action is logged locally.">
              <div className="space-y-2">
                {store.logs.slice(0, 12).map((log) => (
                  <div key={log.id} className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-sm font-black text-slate-950">{log.action}</p>
                    <p className="text-xs font-bold text-slate-500">{log.note} • {log.at}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </main>
  )
}
