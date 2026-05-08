"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type PartnerStage =
  | "identified"
  | "qualified"
  | "decision_map"
  | "meeting_scheduled"
  | "proposal_sent"
  | "negotiation"
  | "pilot"
  | "active"
  | "growth"
  | "at_risk"
  | "paused"
  | "lost"

type PartnerType =
  | "clinic"
  | "hospital"
  | "pharmacy"
  | "corporate"
  | "academy"
  | "school"
  | "ngo"
  | "ambassador"
  | "referral_partner"
  | "institution"
  | "supplier"
  | "media"

type PartnerPriority = "critical" | "high" | "medium" | "low"
type PartnerHealth = "excellent" | "good" | "watch" | "risk" | "inactive"
type AgreementStatus = "none" | "drafting" | "sent" | "under_review" | "signed" | "renewal" | "terminated"

type PartnershipPageMode =
  | "dashboard"
  | "pipeline"
  | "new"
  | "qualification"
  | "decision-map"
  | "meetings"
  | "proposals"
  | "agreements"
  | "activation"
  | "referrals"
  | "performance"
  | "risk"
  | "executive"
  | "high-value"
  | "growth"
  | "recovery"

type PartnerRecord = {
  id: string
  name: string
  organization: string
  contactName: string
  role: string
  phone: string
  email: string
  city: string
  address: string
  type: PartnerType
  stage: PartnerStage
  priority: PartnerPriority
  health: PartnerHealth
  agreementStatus: AgreementStatus
  owner: string
  executiveSponsor: string
  valueMad: number
  referralPotential: number
  strategicFit: number
  activationScore: number
  trustScore: number
  decisionMaker: string
  decisionMakerConfirmed: boolean
  stakeholders: string[]
  partnershipContext: string
  partnerNeeds: string
  angelcareValue: string
  offerStructure: string
  referralFlow: string
  activationPlan: string
  meetingObjective: string
  nextAction: string
  nextReviewDate: string
  blockers: string
  risks: string
  obligations: string
  documents: string[]
  referralsThisMonth: number
  revenueThisMonth: number
  createdAt: string
  updatedAt: string
}

type PartnerLog = {
  id: string
  partnerId: string
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

type PartnershipStore = {
  partners: PartnerRecord[]
  logs: PartnerLog[]
  automations: AutomationRule[]
}

const STORE_KEY = "revenue_partnerships_v12_mega_store"

const stages: PartnerStage[] = [
  "identified",
  "qualified",
  "decision_map",
  "meeting_scheduled",
  "proposal_sent",
  "negotiation",
  "pilot",
  "active",
  "growth",
  "at_risk",
  "paused",
  "lost",
]

const partnerTypes: PartnerType[] = [
  "clinic",
  "hospital",
  "pharmacy",
  "corporate",
  "academy",
  "school",
  "ngo",
  "ambassador",
  "referral_partner",
  "institution",
  "supplier",
  "media",
]

const priorities: PartnerPriority[] = ["critical", "high", "medium", "low"]
const healthOptions: PartnerHealth[] = ["excellent", "good", "watch", "risk", "inactive"]
const agreementStatuses: AgreementStatus[] = ["none", "drafting", "sent", "under_review", "signed", "renewal", "terminated"]

const subpages: Array<{ mode: PartnershipPageMode; label: string; href: string; desc: string }> = [
  { mode: "dashboard", label: "Dashboard", href: "/revenue-command-center/partnerships", desc: "Master partnership command dashboard." },
  { mode: "pipeline", label: "Pipeline", href: "/revenue-command-center/partnerships/pipeline", desc: "Stage board and partnership movement." },
  { mode: "new", label: "New Partner", href: "/revenue-command-center/partnerships/new", desc: "Create a full partner profile." },
  { mode: "qualification", label: "Qualification", href: "/revenue-command-center/partnerships/qualification", desc: "Fit, value, referral potential and quality control." },
  { mode: "decision-map", label: "Decision Map", href: "/revenue-command-center/partnerships/decision-map", desc: "Stakeholders, decision makers and influence mapping." },
  { mode: "meetings", label: "Meetings", href: "/revenue-command-center/partnerships/meetings", desc: "Meeting readiness and partnership agenda." },
  { mode: "proposals", label: "Proposals", href: "/revenue-command-center/partnerships/proposals", desc: "Offer, proposal and referral economics." },
  { mode: "agreements", label: "Agreements", href: "/revenue-command-center/partnerships/agreements", desc: "Contract, SLA and obligation control." },
  { mode: "activation", label: "Activation", href: "/revenue-command-center/partnerships/activation", desc: "Launch plans, co-marketing and operating rhythm." },
  { mode: "referrals", label: "Referrals", href: "/revenue-command-center/partnerships/referrals", desc: "Referral flow, revenue and conversion control." },
  { mode: "performance", label: "Performance", href: "/revenue-command-center/partnerships/performance", desc: "Partner contribution and owner performance." },
  { mode: "risk", label: "Risk", href: "/revenue-command-center/partnerships/risk", desc: "At-risk partners, blockers and inactivity." },
  { mode: "executive", label: "Executive", href: "/revenue-command-center/partnerships/executive", desc: "Leadership decision queue." },
  { mode: "high-value", label: "High Value", href: "/revenue-command-center/partnerships/high-value", desc: "Strategic partner opportunities." },
  { mode: "growth", label: "Growth", href: "/revenue-command-center/partnerships/growth", desc: "Expansion, upsell and joint activation." },
  { mode: "recovery", label: "Recovery", href: "/revenue-command-center/partnerships/recovery", desc: "Recover stalled or inactive partners." },
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

function seedPartners(): PartnerRecord[] {
  const now = new Date().toISOString()

  return [
    {
      id: "partner-v12-clinic-rabat",
      name: "Maternity referral partnership",
      organization: "Clinique Maternité Rabat Premium",
      contactName: "Dr. Nadia Benali",
      role: "Medical Director",
      phone: "+212600000401",
      email: "direction@clinique-rabat.ma",
      city: "Rabat",
      address: "Rabat Agdal",
      type: "clinic",
      stage: "decision_map",
      priority: "critical",
      health: "watch",
      agreementStatus: "drafting",
      owner: "BD Officer",
      executiveSponsor: "CEO / Revenue Manager",
      valueMad: 420000,
      referralPotential: 91,
      strategicFit: 94,
      activationScore: 55,
      trustScore: 82,
      decisionMaker: "Medical Director + Operations Director",
      decisionMakerConfirmed: false,
      stakeholders: ["Medical Director", "Operations Director", "Referral Coordinator"],
      partnershipContext: "Potential recurring postpartum and family-care referral source.",
      partnerNeeds: "Reliable supervised home-care provider, patient trust, clear referral flow.",
      angelcareValue: "Quality-controlled care, fast family response, supervised caregivers and operational reporting.",
      offerStructure: "Referral pilot with co-branded activation and monthly performance review.",
      referralFlow: "Clinic identifies family need → referral coordinator sends lead → AngelCare SDR confirms → appointment booked → outcome reported.",
      activationPlan: "Meeting, signed pilot, staff briefing, referral materials, monthly review.",
      meetingObjective: "Validate referral economics, decision process and activation pilot.",
      nextAction: "Confirm decision-maker map and schedule partnership presentation.",
      nextReviewDate: today(3),
      blockers: "Decision-maker group not fully confirmed.",
      risks: "Competitor providers may approach clinic first.",
      obligations: "Quality SLA, reporting, referral response time, patient experience.",
      documents: ["Partner one-pager", "Referral flow", "Pilot agreement"],
      referralsThisMonth: 0,
      revenueThisMonth: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "partner-v12-corporate-casa",
      name: "Corporate employee family-care benefits",
      organization: "Casablanca Corporate HR Group",
      contactName: "Meriem A.",
      role: "HR Director",
      phone: "+212600000402",
      email: "hr@corporate-casa.ma",
      city: "Casablanca",
      address: "Casablanca",
      type: "corporate",
      stage: "qualified",
      priority: "high",
      health: "good",
      agreementStatus: "none",
      owner: "Revenue Manager",
      executiveSponsor: "CEO",
      valueMad: 280000,
      referralPotential: 72,
      strategicFit: 83,
      activationScore: 42,
      trustScore: 76,
      decisionMaker: "HR Director + Finance",
      decisionMakerConfirmed: true,
      stakeholders: ["HR Director", "Finance", "Employee Benefits Manager"],
      partnershipContext: "Corporate family-care benefit for employees needing elderly, childcare or postpartum care.",
      partnerNeeds: "Reliable employee support, simple request path, reporting and budget clarity.",
      angelcareValue: "Trusted family-care partner with managed operations and employee support pathway.",
      offerStructure: "Corporate package: preferred pricing + dedicated intake + quarterly reporting.",
      referralFlow: "Employee asks HR → HR refers to AngelCare → AngelCare qualifies → service proposal.",
      activationPlan: "Business case, internal HR communication, benefits launch, monthly reporting.",
      meetingObjective: "Validate budget timing and employee demand.",
      nextAction: "Prepare business case and pricing structure.",
      nextReviewDate: today(7),
      blockers: "Budget cycle unclear.",
      risks: "May be deprioritized if no internal champion.",
      obligations: "Response SLA, reporting, confidentiality, employee support flow.",
      documents: ["Corporate offer", "Business case", "FAQ"],
      referralsThisMonth: 0,
      revenueThisMonth: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "partner-v12-academy-temara",
      name: "Academy training and recruitment channel",
      organization: "Temara Training Institute",
      contactName: "Youssef K.",
      role: "General Manager",
      phone: "+212600000403",
      email: "contact@training.ma",
      city: "Temara",
      address: "Temara center",
      type: "academy",
      stage: "pilot",
      priority: "medium",
      health: "good",
      agreementStatus: "sent",
      owner: "Academy Lead",
      executiveSponsor: "Operations Director",
      valueMad: 110000,
      referralPotential: 64,
      strategicFit: 80,
      activationScore: 68,
      trustScore: 70,
      decisionMaker: "General Manager",
      decisionMakerConfirmed: true,
      stakeholders: ["General Manager", "Training Coordinator"],
      partnershipContext: "Training channel for caregiver recruitment and academy visibility.",
      partnerNeeds: "Professional curriculum, placement opportunities, credibility.",
      angelcareValue: "Real care-business pathway, certification, recruitment and service integration.",
      offerStructure: "Co-branded training pilot and recruitment funnel.",
      referralFlow: "Training institute sources trainees → AngelCare evaluates → Academy trains → HR/onboarding.",
      activationPlan: "Pilot cohort, evaluation criteria, certification, placement path.",
      meetingObjective: "Finalize pilot cohort and responsibilities.",
      nextAction: "Confirm pilot calendar and trainee selection criteria.",
      nextReviewDate: today(5),
      blockers: "Needs proof of demand and placement pathway.",
      risks: "Pilot may stay academic without operational recruitment integration.",
      obligations: "Training quality, trainee evaluation, recruitment transparency.",
      documents: ["Pilot agreement", "Training outline", "Recruitment criteria"],
      referralsThisMonth: 6,
      revenueThisMonth: 18000,
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function seedAutomations(): AutomationRule[] {
  return [
    {
      id: "auto-partner-high-value-decision",
      name: "High-value partner decision-map escalation",
      trigger: "Value > 200,000 MAD and decision maker not confirmed",
      action: "Escalate to executive sponsor and create decision-map task.",
      enabled: true,
    },
    {
      id: "auto-inactive-active-partner",
      name: "Active partner inactivity recovery",
      trigger: "Active partner has zero referrals this month",
      action: "Move to recovery, assign owner callback and schedule review.",
      enabled: true,
    },
    {
      id: "auto-agreement-stalled",
      name: "Agreement stalled control",
      trigger: "Agreement under review and no next review date within 7 days",
      action: "Notify owner, create agreement follow-up and escalate if high value.",
      enabled: true,
    },
  ]
}

function defaultStore(): PartnershipStore {
  return {
    partners: seedPartners(),
    logs: [{ id: uid(), partnerId: "system", at: new Date().toLocaleString(), action: "Partnerships V12 initialized", note: "Deep partnership execution engine seeded." }],
    automations: seedAutomations(),
  }
}

function readStore(): PartnershipStore {
  if (typeof window === "undefined") return defaultStore()

  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) {
      const seeded = defaultStore()
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded))
      return seeded
    }

    const parsed = JSON.parse(raw) as PartnershipStore
    if (!Array.isArray(parsed.partners)) return defaultStore()
    if (!Array.isArray(parsed.logs)) parsed.logs = []
    if (!Array.isArray(parsed.automations)) parsed.automations = seedAutomations()

    return parsed
  } catch {
    return defaultStore()
  }
}

function writeStore(store: PartnershipStore) {
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
        <p className="text-xs font-black uppercase tracking-[0.22em] text-pink-700">{title}</p>
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
  return <input {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-pink-700 focus:ring-4 focus:ring-pink-100 ${props.className || ""}`} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-pink-700 focus:ring-4 focus:ring-pink-100 ${props.className || ""}`} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-pink-700 focus:ring-4 focus:ring-pink-100 ${props.className || ""}`} />
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "dark" | "primary" | "soft" | "danger" }) {
  const variant = props.variant || "dark"
  const variants = {
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    primary: "bg-pink-700 text-white hover:bg-pink-800",
    soft: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  }
  return <button {...props} className={`rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition ${variants[variant]} ${props.className || ""}`} />
}

function priorityTone(priority: PartnerPriority) {
  if (priority === "critical") return "rose"
  if (priority === "high") return "amber"
  if (priority === "medium") return "blue"
  return "slate"
}

function healthTone(health: PartnerHealth) {
  if (health === "excellent" || health === "good") return "emerald"
  if (health === "watch") return "amber"
  return "rose"
}

function scoreTone(score: number) {
  if (score >= 85) return "rose"
  if (score >= 70) return "amber"
  if (score >= 55) return "blue"
  return "slate"
}

function pageTitle(mode: PartnershipPageMode) {
  return subpages.find((page) => page.mode === mode)?.label || "Partnerships"
}

function pageSubtitle(mode: PartnershipPageMode) {
  return subpages.find((page) => page.mode === mode)?.desc || "Deep partnership execution layer."
}

export default function RevenuePartnershipsV12MegaWorkspace({ mode = "dashboard" }: { mode?: PartnershipPageMode }) {
  const [store, setStore] = useState<PartnershipStore>(() => defaultStore())
  const [query, setQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<PartnerStage | "all">("all")
  const [typeFilter, setTypeFilter] = useState<PartnerType | "all">("all")
  const [selectedId, setSelectedId] = useState("")
  const [createOpen, setCreateOpen] = useState(mode === "new")
  const [newStakeholder, setNewStakeholder] = useState("")
  const [draft, setDraft] = useState({
    name: "",
    organization: "",
    contactName: "",
    role: "",
    phone: "",
    email: "",
    city: "Rabat",
    address: "",
    type: "clinic" as PartnerType,
    stage: "identified" as PartnerStage,
    priority: "high" as PartnerPriority,
    health: "good" as PartnerHealth,
    agreementStatus: "none" as AgreementStatus,
    owner: "BD Officer",
    executiveSponsor: "Revenue Manager",
    valueMad: 100000,
    referralPotential: 60,
    strategicFit: 70,
    activationScore: 40,
    trustScore: 65,
    decisionMaker: "",
    decisionMakerConfirmed: false,
    stakeholders: "Decision maker\nInfluencer",
    partnershipContext: "",
    partnerNeeds: "",
    angelcareValue: "",
    offerStructure: "",
    referralFlow: "",
    activationPlan: "",
    meetingObjective: "",
    nextAction: "",
    nextReviewDate: today(3),
    blockers: "",
    risks: "",
    obligations: "",
    documents: "Partner one-pager\nAgreement draft",
    referralsThisMonth: 0,
    revenueThisMonth: 0,
  })

  useEffect(() => {
    const loaded = readStore()
    setStore(loaded)
    setSelectedId(loaded.partners[0]?.id || "")
  }, [])

  function commit(next: PartnershipStore, action: string, note: string, partnerId?: string) {
    const withLog = {
      ...next,
      logs: [{ id: uid(), partnerId: partnerId || selectedId || "system", at: new Date().toLocaleString(), action, note }, ...next.logs].slice(0, 150),
    }
    setStore(withLog)
    writeStore(withLog)
  }

  function restoreSeed() {
    const seeded = defaultStore()
    setStore(seeded)
    setSelectedId(seeded.partners[0]?.id || "")
    writeStore(seeded)
  }

  const selected = store.partners.find((partner) => partner.id === selectedId) || store.partners[0]

  const filtered = useMemo(() => {
    return store.partners.filter((partner) => {
      const hay = `${partner.name} ${partner.organization} ${partner.contactName} ${partner.city} ${partner.owner} ${partner.executiveSponsor} ${partner.partnershipContext} ${partner.nextAction} ${partner.decisionMaker}`.toLowerCase()

      const modeMatch =
        mode === "qualification" ? ["identified", "qualified"].includes(partner.stage) :
        mode === "decision-map" ? ["decision_map", "qualified", "proposal_sent", "negotiation"].includes(partner.stage) :
        mode === "meetings" ? ["meeting_scheduled", "decision_map", "qualified"].includes(partner.stage) :
        mode === "proposals" ? ["proposal_sent", "negotiation"].includes(partner.stage) :
        mode === "agreements" ? partner.agreementStatus !== "none" :
        mode === "activation" ? ["pilot", "active", "growth"].includes(partner.stage) :
        mode === "referrals" ? ["active", "growth", "pilot"].includes(partner.stage) :
        mode === "growth" ? ["active", "growth"].includes(partner.stage) :
        mode === "recovery" ? ["at_risk", "paused", "lost"].includes(partner.stage) || partner.health === "risk" || partner.health === "inactive" :
        mode === "high-value" ? partner.valueMad >= 200000 || partner.priority === "critical" :
        mode === "risk" ? partner.health === "risk" || partner.health === "watch" || partner.risks.trim() !== "" :
        true

      return modeMatch
        && (!query || hay.includes(query.toLowerCase()))
        && (stageFilter === "all" || partner.stage === stageFilter)
        && (typeFilter === "all" || partner.type === typeFilter)
    })
  }, [store.partners, query, stageFilter, typeFilter, mode])

  const stats = useMemo(() => {
    const active = store.partners.filter((p) => ["pilot", "active", "growth"].includes(p.stage)).length
    const critical = store.partners.filter((p) => p.priority === "critical" || p.health === "risk").length
    const highValue = store.partners.filter((p) => p.valueMad >= 200000).length
    const decisionMissing = store.partners.filter((p) => !p.decisionMakerConfirmed).length
    const agreementOpen = store.partners.filter((p) => !["none", "signed", "terminated"].includes(p.agreementStatus)).length
    const value = store.partners.reduce((sum, p) => sum + Number(p.valueMad || 0), 0)
    const revenue = store.partners.reduce((sum, p) => sum + Number(p.revenueThisMonth || 0), 0)
    const referrals = store.partners.reduce((sum, p) => sum + Number(p.referralsThisMonth || 0), 0)
    const avgFit = Math.round(store.partners.reduce((sum, p) => sum + Number(p.strategicFit || 0), 0) / Math.max(store.partners.length, 1))
    const avgActivation = Math.round(store.partners.reduce((sum, p) => sum + Number(p.activationScore || 0), 0) / Math.max(store.partners.length, 1))

    return { active, critical, highValue, decisionMissing, agreementOpen, value, revenue, referrals, avgFit, avgActivation, total: store.partners.length }
  }, [store.partners])

  function updatePartner(id: string, patch: Partial<PartnerRecord>, action = "Partner updated") {
    const target = store.partners.find((p) => p.id === id)
    const partners = store.partners.map((p) => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)
    commit({ ...store, partners }, action, target?.name || id, id)
  }

  function createPartner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.name.trim()) return

    const now = new Date().toISOString()
    const partner: PartnerRecord = {
      id: uid(),
      name: draft.name,
      organization: draft.organization,
      contactName: draft.contactName,
      role: draft.role,
      phone: draft.phone,
      email: draft.email,
      city: draft.city,
      address: draft.address,
      type: draft.type,
      stage: draft.stage,
      priority: draft.priority,
      health: draft.health,
      agreementStatus: draft.agreementStatus,
      owner: draft.owner,
      executiveSponsor: draft.executiveSponsor,
      valueMad: Number(draft.valueMad) || 0,
      referralPotential: clamp(draft.referralPotential),
      strategicFit: clamp(draft.strategicFit),
      activationScore: clamp(draft.activationScore),
      trustScore: clamp(draft.trustScore),
      decisionMaker: draft.decisionMaker,
      decisionMakerConfirmed: Boolean(draft.decisionMakerConfirmed),
      stakeholders: draft.stakeholders.split("\n").map((item) => item.trim()).filter(Boolean),
      partnershipContext: draft.partnershipContext,
      partnerNeeds: draft.partnerNeeds,
      angelcareValue: draft.angelcareValue,
      offerStructure: draft.offerStructure,
      referralFlow: draft.referralFlow,
      activationPlan: draft.activationPlan,
      meetingObjective: draft.meetingObjective,
      nextAction: draft.nextAction || "Qualify partner and define next partnership step.",
      nextReviewDate: draft.nextReviewDate,
      blockers: draft.blockers,
      risks: draft.risks,
      obligations: draft.obligations,
      documents: draft.documents.split("\n").map((item) => item.trim()).filter(Boolean),
      referralsThisMonth: Number(draft.referralsThisMonth) || 0,
      revenueThisMonth: Number(draft.revenueThisMonth) || 0,
      createdAt: now,
      updatedAt: now,
    }

    commit({ ...store, partners: [partner, ...store.partners] }, "Partner created", partner.name, partner.id)
    setSelectedId(partner.id)
    setCreateOpen(false)
  }

  function deletePartner(id: string) {
    const target = store.partners.find((p) => p.id === id)
    const partners = store.partners.filter((p) => p.id !== id)
    commit({ ...store, partners }, "Partner deleted", target?.name || id, id)
    setSelectedId(partners[0]?.id || "")
  }

  function autoScore(id: string) {
    const target = store.partners.find((p) => p.id === id)
    if (!target) return

    let activation = Math.round((target.referralPotential + target.strategicFit + target.trustScore) / 3)
    if (target.decisionMakerConfirmed) activation += 8
    if (target.agreementStatus === "signed") activation += 10
    if (target.stage === "active" || target.stage === "growth") activation += 10
    if (target.blockers.trim() || target.risks.trim()) activation -= 10

    activation = clamp(activation)

    updatePartner(id, {
      activationScore: activation,
      health: activation >= 80 ? "excellent" : activation >= 65 ? "good" : activation >= 45 ? "watch" : "risk",
      priority: target.valueMad >= 300000 || activation >= 85 ? "critical" : target.priority,
    }, "Partner auto-scored")
  }

  function advance(id: string) {
    const target = store.partners.find((p) => p.id === id)
    if (!target) return
    const index = stages.indexOf(target.stage)
    const nextStage = stages[Math.min(index + 1, stages.length - 1)]
    updatePartner(id, { stage: nextStage, nextAction: `Execute partnership stage: ${label(nextStage)}.` }, `Advanced to ${label(nextStage)}`)
  }

  function confirmDecisionMaker(id: string) {
    updatePartner(id, { decisionMakerConfirmed: true, stage: "decision_map", nextAction: "Prepare meeting/proposal with confirmed decision path." }, "Decision maker confirmed")
  }

  function activatePartner(id: string) {
    updatePartner(id, {
      stage: "active",
      health: "good",
      agreementStatus: selected?.agreementStatus === "none" ? "drafting" : selected?.agreementStatus || "drafting",
      nextAction: "Launch activation plan and monitor referrals.",
    }, "Partner activated")
  }

  function markGrowth(id: string) {
    updatePartner(id, {
      stage: "growth",
      health: "excellent",
      nextAction: "Expand referral flow, co-marketing and monthly review.",
    }, "Partner moved to growth")
  }

  function moveRisk(id: string) {
    updatePartner(id, {
      stage: "at_risk",
      health: "risk",
      risks: selected?.risks || "Partner requires intervention.",
      nextAction: "Schedule recovery review and assign owner intervention.",
    }, "Partner moved to risk")
  }

  function recoverPartner(id: string) {
    updatePartner(id, {
      stage: "qualified",
      health: "watch",
      nextAction: "Rebuild contact, clarify value and restart activation path.",
    }, "Partner recovery activated")
  }

  function addStakeholder() {
    if (!selected || !newStakeholder.trim()) return
    updatePartner(selected.id, { stakeholders: [...selected.stakeholders, newStakeholder.trim()] }, "Stakeholder added")
    setNewStakeholder("")
  }

  function removeStakeholder(index: number) {
    if (!selected) return
    updatePartner(selected.id, { stakeholders: selected.stakeholders.filter((_, i) => i !== index) }, "Stakeholder removed")
  }

  function toggleAutomation(id: string) {
    const automations = store.automations.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)
    commit({ ...store, automations }, "Automation toggled", id)
  }

  const boardGroups = stages.map((stage) => ({
    stage,
    partners: filtered.filter((p) => p.stage === stage),
  }))

  return (
    <main className="min-h-screen bg-pink-50/60 text-slate-950 selection:bg-pink-200 selection:text-slate-950">
      <div className="mx-auto max-w-[1900px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2.4rem] bg-gradient-to-br from-slate-950 via-pink-950 to-black p-7 text-white shadow-2xl lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.28fr_.72fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="violet">Revenue Command</Pill>
                <Pill tone="blue">Partnerships V12 Mega</Pill>
                <Pill tone="amber">{pageTitle(mode)}</Pill>
              </div>
              <h1 className="mt-6 max-w-6xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                Partnerships deep execution engine — referrals, agreements, activation, growth and strategic control.
              </h1>
              <p className="mt-5 max-w-5xl text-base font-semibold leading-8 text-pink-50/85 md:text-lg">
                A full partnership operating system for AngelCare: clinics, hospitals, corporates, academies, NGOs, ambassadors, referral partners and institutions — all controlled from qualification to activation, referral revenue, risk, growth and executive decisions.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>+ Create partner</Button>
                <Button type="button" onClick={() => selected && autoScore(selected.id)}>Auto-score selected</Button>
                <Button type="button" variant="soft" onClick={restoreSeed}>Restore seed</Button>
                <Link href="/revenue-command-center" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">← Revenue HQ</Link>
                <Link href="/revenue-command-center/partnerships/pipeline" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">Pipeline</Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Partners", stats.total, "Total records"],
                ["Active", stats.active, "Pilot/active/growth"],
                ["Critical", stats.critical, "Risk or priority"],
                ["Value", mad(stats.value), "Strategic exposure"],
                ["Referrals", stats.referrals, "This month"],
                ["Revenue", mad(stats.revenue), "This month"],
              ].map(([k, v, d]) => (
                <div key={String(k)} className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-pink-100/70">{k}</p>
                  <p className="mt-3 text-3xl font-black text-white">{v}</p>
                  <p className="mt-2 text-sm font-bold text-white/75">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {subpages.map((page) => (
            <Link key={page.href} href={page.href} className={`rounded-3xl border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${mode === page.mode ? "border-pink-400 bg-pink-100" : "border-slate-200 bg-white"}`}>
              <p className="text-sm font-black text-slate-950">{page.label}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{page.desc}</p>
            </Link>
          ))}
        </section>

        {createOpen ? (
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-pink-700">Create partner</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Create full-control partnership record</h2>
              </div>
              <Button type="button" variant="soft" onClick={() => setCreateOpen(false)}>Close</Button>
            </div>
            <form onSubmit={createPartner} className="grid gap-4 xl:grid-cols-4">
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Partnership name" />
              <Input value={draft.organization} onChange={(e) => setDraft({ ...draft, organization: e.target.value })} placeholder="Organization" />
              <Input value={draft.contactName} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} placeholder="Contact name" />
              <Input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder="Role" />
              <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Phone" />
              <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email" />
              <Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="City" />
              <Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Address" />
              <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as PartnerType })}>
                {partnerTypes.map((t) => <option key={t} value={t}>{label(t)}</option>)}
              </Select>
              <Select value={draft.stage} onChange={(e) => setDraft({ ...draft, stage: e.target.value as PartnerStage })}>
                {stages.map((s) => <option key={s} value={s}>{label(s)}</option>)}
              </Select>
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as PartnerPriority })}>
                {priorities.map((p) => <option key={p} value={p}>{label(p)}</option>)}
              </Select>
              <Select value={draft.health} onChange={(e) => setDraft({ ...draft, health: e.target.value as PartnerHealth })}>
                {healthOptions.map((h) => <option key={h} value={h}>{label(h)}</option>)}
              </Select>
              <Select value={draft.agreementStatus} onChange={(e) => setDraft({ ...draft, agreementStatus: e.target.value as AgreementStatus })}>
                {agreementStatuses.map((s) => <option key={s} value={s}>{label(s)}</option>)}
              </Select>
              <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Owner" />
              <Input value={draft.executiveSponsor} onChange={(e) => setDraft({ ...draft, executiveSponsor: e.target.value })} placeholder="Executive sponsor" />
              <Input type="date" value={draft.nextReviewDate} onChange={(e) => setDraft({ ...draft, nextReviewDate: e.target.value })} />
              <Input type="number" value={draft.valueMad} onChange={(e) => setDraft({ ...draft, valueMad: Number(e.target.value) })} placeholder="Value MAD" />
              <Input type="number" value={draft.referralPotential} onChange={(e) => setDraft({ ...draft, referralPotential: Number(e.target.value) })} placeholder="Referral potential %" />
              <Input type="number" value={draft.strategicFit} onChange={(e) => setDraft({ ...draft, strategicFit: Number(e.target.value) })} placeholder="Strategic fit %" />
              <Input type="number" value={draft.activationScore} onChange={(e) => setDraft({ ...draft, activationScore: Number(e.target.value) })} placeholder="Activation %" />
              <Input type="number" value={draft.trustScore} onChange={(e) => setDraft({ ...draft, trustScore: Number(e.target.value) })} placeholder="Trust %" />
              <Input type="number" value={draft.referralsThisMonth} onChange={(e) => setDraft({ ...draft, referralsThisMonth: Number(e.target.value) })} placeholder="Referrals this month" />
              <Input type="number" value={draft.revenueThisMonth} onChange={(e) => setDraft({ ...draft, revenueThisMonth: Number(e.target.value) })} placeholder="Revenue this month" />
              <Input value={draft.decisionMaker} onChange={(e) => setDraft({ ...draft, decisionMaker: e.target.value })} placeholder="Decision maker" />
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800">
                <input type="checkbox" checked={draft.decisionMakerConfirmed} onChange={(e) => setDraft({ ...draft, decisionMakerConfirmed: e.target.checked })} />
                Decision maker confirmed
              </label>
              <Textarea value={draft.stakeholders} onChange={(e) => setDraft({ ...draft, stakeholders: e.target.value })} placeholder="Stakeholders, one per line" className="xl:col-span-2" />
              <Textarea value={draft.partnershipContext} onChange={(e) => setDraft({ ...draft, partnershipContext: e.target.value })} placeholder="Partnership context" className="xl:col-span-2" />
              <Textarea value={draft.partnerNeeds} onChange={(e) => setDraft({ ...draft, partnerNeeds: e.target.value })} placeholder="Partner needs" className="xl:col-span-2" />
              <Textarea value={draft.angelcareValue} onChange={(e) => setDraft({ ...draft, angelcareValue: e.target.value })} placeholder="AngelCare value" className="xl:col-span-2" />
              <Textarea value={draft.offerStructure} onChange={(e) => setDraft({ ...draft, offerStructure: e.target.value })} placeholder="Offer structure" className="xl:col-span-2" />
              <Textarea value={draft.referralFlow} onChange={(e) => setDraft({ ...draft, referralFlow: e.target.value })} placeholder="Referral flow" className="xl:col-span-2" />
              <Textarea value={draft.activationPlan} onChange={(e) => setDraft({ ...draft, activationPlan: e.target.value })} placeholder="Activation plan" className="xl:col-span-2" />
              <Textarea value={draft.obligations} onChange={(e) => setDraft({ ...draft, obligations: e.target.value })} placeholder="Obligations / SLA" className="xl:col-span-2" />
              <Textarea value={draft.nextAction} onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })} placeholder="Next action" className="xl:col-span-2" />
              <Button type="submit" variant="primary" className="xl:col-span-4">Create partner</Button>
            </form>
          </Card>
        ) : null}

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1fr_.45fr_.35fr_.35fr]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search partner, organization, decision maker, city, owner..." />
            <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as PartnerStage | "all")}>
              <option value="all">All stages</option>
              {stages.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </Select>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as PartnerType | "all")}>
              <option value="all">All types</option>
              {partnerTypes.map((t) => <option key={t} value={t}>{label(t)}</option>)}
            </Select>
            <Button type="button" onClick={() => setCreateOpen(true)}>New partner</Button>
          </div>
        </Card>

        {mode === "pipeline" ? (
          <section className="grid gap-4 xl:grid-cols-4">
            {boardGroups.map((group) => (
              <Card key={group.stage} className="min-h-[230px]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-950">{label(group.stage)}</h3>
                  <Pill tone="blue">{group.partners.length}</Pill>
                </div>
                <div className="space-y-3">
                  {group.partners.map((partner) => (
                    <button key={partner.id} type="button" onClick={() => setSelectedId(partner.id)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-white">
                      <p className="text-sm font-black text-slate-950">{partner.name}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{partner.owner} • {mad(partner.valueMad)}</p>
                      <div className="mt-2 flex gap-2">
                        <Pill tone={scoreTone(partner.activationScore)}>{partner.activationScore}</Pill>
                        <Pill tone={healthTone(partner.health)}>{label(partner.health)}</Pill>
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
            {filtered.map((partner) => (
              <Card key={partner.id} className={partner.id === selected?.id ? "ring-4 ring-pink-100" : ""}>
                <div className="grid gap-5 xl:grid-cols-[1fr_.48fr_.65fr]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={priorityTone(partner.priority)}>{label(partner.priority)}</Pill>
                      <Pill tone={healthTone(partner.health)}>{label(partner.health)}</Pill>
                      <Pill tone="violet">{label(partner.stage)}</Pill>
                    </div>
                    <button type="button" onClick={() => setSelectedId(partner.id)} className="mt-3 text-left text-2xl font-black text-slate-950 hover:text-pink-800">{partner.name}</button>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{partner.partnershipContext || partner.nextAction}</p>
                    <p className="mt-3 text-sm font-black text-slate-700">{partner.organization} • {partner.contactName} • {partner.city}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Partnership engine</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{partner.activationScore}%</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">Fit {partner.strategicFit}% • Referral {partner.referralPotential}%</p>
                    <p className="mt-2 text-sm font-black text-pink-700">{mad(partner.valueMad)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => setSelectedId(partner.id)}>Select</Button>
                    <Button type="button" variant="soft" onClick={() => autoScore(partner.id)}>Score</Button>
                    <Button type="button" variant="soft" onClick={() => advance(partner.id)}>Advance</Button>
                    <Button type="button" variant="soft" onClick={() => confirmDecisionMaker(partner.id)}>Decision</Button>
                    <Button type="button" variant="soft" onClick={() => activatePartner(partner.id)}>Activate</Button>
                    <Button type="button" variant="primary" onClick={() => markGrowth(partner.id)}>Growth</Button>
                    <Button type="button" variant="danger" onClick={() => moveRisk(partner.id)}>Risk</Button>
                    <Button type="button" variant="danger" onClick={() => deletePartner(partner.id)}>Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <aside className="space-y-6">
            <Card className="bg-slate-950 text-white">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-pink-300">Selected partnership command room</p>
              <h2 className="mt-2 text-3xl font-black text-white">{selected?.name || "No partner selected"}</h2>

              {selected ? (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs font-black text-white/60">Activation</p>
                      <p className="mt-1 text-2xl font-black">{selected.activationScore}%</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs font-black text-white/60">Referral</p>
                      <p className="mt-1 text-2xl font-black">{selected.referralPotential}%</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs font-black text-white/60">Revenue</p>
                      <p className="mt-1 text-xl font-black">{mad(selected.revenueThisMonth)}</p>
                    </div>
                  </div>

                  <Textarea value={selected.partnershipContext} onChange={(e) => updatePartner(selected.id, { partnershipContext: e.target.value }, "Context updated")} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={selected.stage} onChange={(e) => updatePartner(selected.id, { stage: e.target.value as PartnerStage }, "Stage updated")}>
                      {stages.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                    </Select>
                    <Select value={selected.health} onChange={(e) => updatePartner(selected.id, { health: e.target.value as PartnerHealth }, "Health updated")}>
                      {healthOptions.map((h) => <option key={h} value={h}>{label(h)}</option>)}
                    </Select>
                    <Select value={selected.priority} onChange={(e) => updatePartner(selected.id, { priority: e.target.value as PartnerPriority }, "Priority updated")}>
                      {priorities.map((p) => <option key={p} value={p}>{label(p)}</option>)}
                    </Select>
                    <Select value={selected.agreementStatus} onChange={(e) => updatePartner(selected.id, { agreementStatus: e.target.value as AgreementStatus }, "Agreement updated")}>
                      {agreementStatuses.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                    </Select>
                    <Input value={selected.owner} onChange={(e) => updatePartner(selected.id, { owner: e.target.value }, "Owner updated")} />
                    <Input value={selected.executiveSponsor} onChange={(e) => updatePartner(selected.id, { executiveSponsor: e.target.value }, "Sponsor updated")} />
                    <Input type="number" value={selected.valueMad} onChange={(e) => updatePartner(selected.id, { valueMad: Number(e.target.value) }, "Value updated")} />
                    <Input type="number" value={selected.activationScore} onChange={(e) => updatePartner(selected.id, { activationScore: clamp(Number(e.target.value)) }, "Activation updated")} />
                    <Input type="number" value={selected.referralsThisMonth} onChange={(e) => updatePartner(selected.id, { referralsThisMonth: Number(e.target.value) }, "Referrals updated")} />
                    <Input type="number" value={selected.revenueThisMonth} onChange={(e) => updatePartner(selected.id, { revenueThisMonth: Number(e.target.value) }, "Revenue updated")} />
                  </div>

                  <Panel title="Decision map" subtitle={selected.decisionMakerConfirmed ? "Decision maker confirmed" : "Decision maker not confirmed"}>
                    <div className="space-y-3">
                      <Input value={selected.decisionMaker} onChange={(e) => updatePartner(selected.id, { decisionMaker: e.target.value }, "Decision maker updated")} />
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

                  <Textarea value={selected.partnerNeeds} onChange={(e) => updatePartner(selected.id, { partnerNeeds: e.target.value }, "Needs updated")} placeholder="Partner needs" />
                  <Textarea value={selected.angelcareValue} onChange={(e) => updatePartner(selected.id, { angelcareValue: e.target.value }, "AngelCare value updated")} placeholder="AngelCare value" />
                  <Textarea value={selected.offerStructure} onChange={(e) => updatePartner(selected.id, { offerStructure: e.target.value }, "Offer updated")} placeholder="Offer structure" />
                  <Textarea value={selected.referralFlow} onChange={(e) => updatePartner(selected.id, { referralFlow: e.target.value }, "Referral flow updated")} placeholder="Referral flow" />
                  <Textarea value={selected.activationPlan} onChange={(e) => updatePartner(selected.id, { activationPlan: e.target.value }, "Activation updated")} placeholder="Activation plan" />
                  <Textarea value={selected.obligations} onChange={(e) => updatePartner(selected.id, { obligations: e.target.value }, "Obligations updated")} placeholder="Obligations / SLA" />
                  <Textarea value={selected.blockers} onChange={(e) => updatePartner(selected.id, { blockers: e.target.value, health: e.target.value.trim() ? "watch" : selected.health }, "Blockers updated")} placeholder="Blockers" />
                  <Textarea value={selected.risks} onChange={(e) => updatePartner(selected.id, { risks: e.target.value, health: e.target.value.trim() ? "risk" : selected.health }, "Risks updated")} placeholder="Risks" />
                  <Textarea value={selected.nextAction} onChange={(e) => updatePartner(selected.id, { nextAction: e.target.value }, "Next action updated")} placeholder="Next action" />

                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => autoScore(selected.id)}>Auto-score</Button>
                    <Button type="button" variant="soft" onClick={() => advance(selected.id)}>Advance</Button>
                    <Button type="button" variant="soft" onClick={() => confirmDecisionMaker(selected.id)}>Decision</Button>
                    <Button type="button" variant="soft" onClick={() => activatePartner(selected.id)}>Activate</Button>
                    <Button type="button" variant="primary" onClick={() => markGrowth(selected.id)}>Growth</Button>
                    <Button type="button" variant="danger" onClick={() => moveRisk(selected.id)}>Risk</Button>
                    <Button type="button" variant="soft" onClick={() => recoverPartner(selected.id)}>Recover</Button>
                  </div>
                </div>
              ) : null}
            </Card>

            <Panel title="Automation engine" subtitle="Operational watchdog rules for partnerships.">
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

            <Panel title="AI partnership copilot" subtitle="Guidance for selected partner.">
              {selected ? (
                <div className="space-y-3 text-sm font-bold leading-6 text-slate-700">
                  <div className="rounded-2xl bg-pink-50 p-4"><b>Partner context:</b> {selected.partnershipContext || "No context captured."}</div>
                  <div className="rounded-2xl bg-emerald-50 p-4"><b>AngelCare value:</b> {selected.angelcareValue || "No value statement yet."}</div>
                  <div className="rounded-2xl bg-blue-50 p-4"><b>Referral flow:</b> {selected.referralFlow || "No referral flow defined."}</div>
                  <div className="rounded-2xl bg-rose-50 p-4"><b>Risk:</b> {selected.risks || selected.blockers || "No major risk captured."}</div>
                </div>
              ) : null}
            </Panel>

            <Panel title="Activity stream" subtitle="Every partnership command action is logged locally.">
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
