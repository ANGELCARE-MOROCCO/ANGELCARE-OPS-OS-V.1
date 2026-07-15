"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type B2CStage =
  | "lead_intake"
  | "contact_verification"
  | "qualification"
  | "consultation_scheduled"
  | "consultation_completed"
  | "quote_prepared"
  | "family_decision"
  | "staff_matching"
  | "onboarding"
  | "care_started"
  | "active_client"
  | "renewal"
  | "at_risk"
  | "recovery"
  | "closed_won"
  | "closed_lost"

type CareCategory =
  | "postpartum"
  | "elderly_care"
  | "childcare"
  | "home_nursing"
  | "household_support"
  | "family_assistance"
  | "academy_consultation"
  | "other"

type B2CPriority = "critical" | "high" | "medium" | "low"
type B2CHealth = "excellent" | "good" | "watch" | "risk" | "lost"
type B2CPageMode =
  | "dashboard"
  | "pipeline"
  | "intake"
  | "qualification"
  | "consultation"
  | "quote"
  | "matching"
  | "onboarding"
  | "care-start"
  | "active-clients"
  | "retention"
  | "recovery"
  | "analytics"
  | "risk"
  | "executive"
  | "high-value"
  | "new"

type B2CRecord = {
  id: string
  familyName: string
  contactName: string
  phone: string
  email: string
  city: string
  address: string
  source: string
  category: CareCategory
  stage: B2CStage
  priority: B2CPriority
  health: B2CHealth
  owner: string
  closer: string
  careCoordinator: string
  valueMad: number
  monthlyValueMad: number
  urgencyScore: number
  fitScore: number
  conversionProbability: number
  satisfactionRisk: number
  decisionMaker: string
  decisionMakerConfirmed: boolean
  familyMembers: string[]
  needSummary: string
  careRequirements: string
  scheduleNeeds: string
  budgetContext: string
  trustConcerns: string
  objections: string
  quoteDetails: string
  recommendedPackage: string
  matchingCriteria: string
  assignedStaff: string
  onboardingChecklist: string[]
  careStartDate: string
  nextAction: string
  nextContactDate: string
  recoveryPlan: string
  executiveEscalation: string
  documents: string[]
  createdAt: string
  updatedAt: string
}

type B2CLog = {
  id: string
  recordId: string
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

type B2CStore = {
  records: B2CRecord[]
  logs: B2CLog[]
  automations: AutomationRule[]
}

const STORE_KEY = "revenue_b2c_workflow_v12_mega_store"

const stages: B2CStage[] = [
  "lead_intake",
  "contact_verification",
  "qualification",
  "consultation_scheduled",
  "consultation_completed",
  "quote_prepared",
  "family_decision",
  "staff_matching",
  "onboarding",
  "care_started",
  "active_client",
  "renewal",
  "at_risk",
  "recovery",
  "closed_won",
  "closed_lost",
]

const categories: CareCategory[] = [
  "postpartum",
  "elderly_care",
  "childcare",
  "home_nursing",
  "household_support",
  "family_assistance",
  "academy_consultation",
  "other",
]

const priorities: B2CPriority[] = ["critical", "high", "medium", "low"]
const healthOptions: B2CHealth[] = ["excellent", "good", "watch", "risk", "lost"]

const subpages: Array<{ mode: B2CPageMode; label: string; href: string; desc: string }> = [
  { mode: "dashboard", label: "Dashboard", href: "/revenue-command-center/b2c-workflow", desc: "Master B2C family/client command dashboard." },
  { mode: "pipeline", label: "Pipeline", href: "/revenue-command-center/b2c-workflow/pipeline", desc: "Full family journey stage board." },
  { mode: "new", label: "New B2C Case", href: "/revenue-command-center/b2c-workflow/new", desc: "Create a complete family/client workflow record." },
  { mode: "intake", label: "Intake", href: "/revenue-command-center/b2c-workflow/intake", desc: "Lead intake, contact verification and source control." },
  { mode: "qualification", label: "Qualification", href: "/revenue-command-center/b2c-workflow/qualification", desc: "Need, urgency, fit, budget and trust qualification." },
  { mode: "consultation", label: "Consultation", href: "/revenue-command-center/b2c-workflow/consultation", desc: "Consultation readiness, notes and family decision path." },
  { mode: "quote", label: "Quote", href: "/revenue-command-center/b2c-workflow/quote", desc: "Package, quote, pricing and objection control." },
  { mode: "matching", label: "Staff Matching", href: "/revenue-command-center/b2c-workflow/matching", desc: "Caregiver/staff matching and availability criteria." },
  { mode: "onboarding", label: "Onboarding", href: "/revenue-command-center/b2c-workflow/onboarding", desc: "Documents, confirmations and service preparation." },
  { mode: "care-start", label: "Care Start", href: "/revenue-command-center/b2c-workflow/care-start", desc: "First day, quality checks and start-of-care control." },
  { mode: "active-clients", label: "Active Clients", href: "/revenue-command-center/b2c-workflow/active-clients", desc: "Active families, monthly value and satisfaction risk." },
  { mode: "retention", label: "Retention", href: "/revenue-command-center/b2c-workflow/retention", desc: "Renewal, expansion, upsell and satisfaction control." },
  { mode: "recovery", label: "Recovery", href: "/revenue-command-center/b2c-workflow/recovery", desc: "Lost, stalled and at-risk family recovery." },
  { mode: "analytics", label: "Analytics", href: "/revenue-command-center/b2c-workflow/analytics", desc: "B2C conversion, revenue and operational metrics." },
  { mode: "risk", label: "Risk", href: "/revenue-command-center/b2c-workflow/risk", desc: "Satisfaction, no-response, trust and service risks." },
  { mode: "executive", label: "Executive", href: "/revenue-command-center/b2c-workflow/executive", desc: "Leadership queue for critical/high-value B2C cases." },
  { mode: "high-value", label: "High Value", href: "/revenue-command-center/b2c-workflow/high-value", desc: "High MAD family/client opportunities." },
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

function seedRecords(): B2CRecord[] {
  const now = new Date().toISOString()
  return [
    {
      id: "b2c-v12-postpartum-vip",
      familyName: "Family A — VIP postpartum support",
      contactName: "Spouse decision maker",
      phone: "+212600000501",
      email: "family-a@example.com",
      city: "Rabat",
      address: "Rabat Agdal",
      source: "Postpartum campaign",
      category: "postpartum",
      stage: "consultation_scheduled",
      priority: "critical",
      health: "watch",
      owner: "SDR Lead",
      closer: "Revenue Manager",
      careCoordinator: "Ops Coordinator",
      valueMad: 42000,
      monthlyValueMad: 18000,
      urgencyScore: 92,
      fitScore: 88,
      conversionProbability: 82,
      satisfactionRisk: 22,
      decisionMaker: "Spouse + grandmother",
      decisionMakerConfirmed: true,
      familyMembers: ["Mother", "Baby", "Spouse", "Grandmother"],
      needSummary: "Urgent postpartum home-care support after delivery.",
      careRequirements: "Supervised postpartum support, flexible schedule, reliable caregiver, quality check-ins.",
      scheduleNeeds: "Start quickly, afternoon/evening availability preferred.",
      budgetContext: "Family comparing options but willing to pay for trust and quality.",
      trustConcerns: "Caregiver reliability, supervision, response speed.",
      objections: "Price comparison and caregiver trust proof.",
      quoteDetails: "Postpartum supervised support package with quality check-in.",
      recommendedPackage: "Premium postpartum launch package, 2-week start, optional extension.",
      matchingCriteria: "Experienced postpartum caregiver, calm communication, Rabat availability.",
      assignedStaff: "",
      onboardingChecklist: ["Confirm decision maker", "Send quote", "Prepare service agreement", "Check caregiver availability"],
      careStartDate: today(2),
      nextAction: "Confirm consultation and prepare quote + staff availability.",
      nextContactDate: today(0),
      recoveryPlan: "",
      executiveEscalation: "High urgency and high value; manager should supervise conversion.",
      documents: ["Consultation sheet", "Quote", "Service agreement"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "b2c-v12-elderly-temara",
      familyName: "Family B — elderly care assessment",
      contactName: "Family contact",
      phone: "+212600000502",
      email: "family-b@example.com",
      city: "Temara",
      address: "Temara center",
      source: "Website form",
      category: "elderly_care",
      stage: "qualification",
      priority: "high",
      health: "watch",
      owner: "SDR Agent",
      closer: "SDR Lead",
      careCoordinator: "Care Coordinator",
      valueMad: 38000,
      monthlyValueMad: 12000,
      urgencyScore: 74,
      fitScore: 80,
      conversionProbability: 58,
      satisfactionRisk: 35,
      decisionMaker: "Adult child",
      decisionMakerConfirmed: false,
      familyMembers: ["Elderly parent", "Adult child"],
      needSummary: "Family needs evaluation for elderly care at home.",
      careRequirements: "Daily support, safety, medication reminders, family reassurance.",
      scheduleNeeds: "Morning and evening availability.",
      budgetContext: "Budget not confirmed.",
      trustConcerns: "Safety, experience, continuity.",
      objections: "Needs family discussion and price clarity.",
      quoteDetails: "",
      recommendedPackage: "Elderly care assessment + flexible daily care package.",
      matchingCriteria: "Experienced elderly care assistant, reliable, Temara proximity.",
      assignedStaff: "",
      onboardingChecklist: ["Confirm decision maker", "Schedule assessment", "Clarify budget", "Prepare care plan"],
      careStartDate: today(5),
      nextAction: "Confirm decision maker and schedule care assessment.",
      nextContactDate: today(1),
      recoveryPlan: "",
      executiveEscalation: "",
      documents: ["Assessment checklist"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "b2c-v12-childcare-casa",
      familyName: "Family C — childcare service inquiry",
      contactName: "Mother",
      phone: "+212600000503",
      email: "family-c@example.com",
      city: "Casablanca",
      address: "Maarif",
      source: "Referral",
      category: "childcare",
      stage: "quote_prepared",
      priority: "medium",
      health: "good",
      owner: "SDR Agent",
      closer: "Revenue Manager",
      careCoordinator: "Ops Coordinator",
      valueMad: 26000,
      monthlyValueMad: 9000,
      urgencyScore: 61,
      fitScore: 77,
      conversionProbability: 66,
      satisfactionRisk: 18,
      decisionMaker: "Mother + father",
      decisionMakerConfirmed: true,
      familyMembers: ["Mother", "Father", "Child"],
      needSummary: "Reliable childcare support during work hours.",
      careRequirements: "Trained childcare assistant, punctual, communication with parents.",
      scheduleNeeds: "Weekdays, daytime.",
      budgetContext: "Budget aligned if quality is guaranteed.",
      trustConcerns: "Background checks and child safety.",
      objections: "Wants references and clear contract.",
      quoteDetails: "Weekday childcare package quote prepared.",
      recommendedPackage: "Monthly childcare support with replacement guarantee.",
      matchingCriteria: "Childcare experience, Casablanca availability, strong references.",
      assignedStaff: "Candidate shortlist pending",
      onboardingChecklist: ["Send references", "Confirm quote", "Prepare contract", "Match caregiver"],
      careStartDate: today(7),
      nextAction: "Send references and finalize family decision.",
      nextContactDate: today(2),
      recoveryPlan: "",
      executiveEscalation: "",
      documents: ["Quote", "References", "Contract draft"],
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function seedAutomations(): AutomationRule[] {
  return [
    {
      id: "auto-b2c-vip-delay",
      name: "VIP family delay escalation",
      trigger: "Value > 30,000 MAD and next contact is overdue",
      action: "Escalate to manager, create recovery call and prepare WhatsApp message.",
      enabled: true,
    },
    {
      id: "auto-b2c-decision-missing",
      name: "Decision-maker missing control",
      trigger: "Decision maker not confirmed after qualification",
      action: "Create decision-maker confirmation task and block quote finalization.",
      enabled: true,
    },
    {
      id: "auto-b2c-care-start-risk",
      name: "Care start readiness risk",
      trigger: "Care start date near and no assigned staff",
      action: "Notify operations, prioritize matching and escalate if high value.",
      enabled: true,
    },
  ]
}

function defaultStore(): B2CStore {
  return {
    records: seedRecords(),
    logs: [{ id: uid(), recordId: "system", at: new Date().toLocaleString(), action: "B2C Workflow V12 initialized", note: "Deep family/client workflow engine seeded." }],
    automations: seedAutomations(),
  }
}

function readStore(): B2CStore {
  if (typeof window === "undefined") return defaultStore()
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) {
      const seeded = defaultStore()
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded))
      return seeded
    }
    const parsed = JSON.parse(raw) as B2CStore
    if (!Array.isArray(parsed.records)) return defaultStore()
    if (!Array.isArray(parsed.logs)) parsed.logs = []
    if (!Array.isArray(parsed.automations)) parsed.automations = seedAutomations()
    return parsed
  } catch {
    return defaultStore()
  }
}

function writeStore(store: B2CStore) {
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
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-700">{title}</p>
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
  return <input {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-orange-700 focus:ring-4 focus:ring-orange-100 ${props.className || ""}`} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-orange-700 focus:ring-4 focus:ring-orange-100 ${props.className || ""}`} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-orange-700 focus:ring-4 focus:ring-orange-100 ${props.className || ""}`} />
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "dark" | "primary" | "soft" | "danger" }) {
  const variant = props.variant || "dark"
  const variants = {
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    primary: "bg-orange-700 text-white hover:bg-orange-800",
    soft: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  }
  return <button {...props} className={`rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition ${variants[variant]} ${props.className || ""}`} />
}

function priorityTone(priority: B2CPriority) {
  if (priority === "critical") return "rose"
  if (priority === "high") return "amber"
  if (priority === "medium") return "blue"
  return "slate"
}

function healthTone(health: B2CHealth) {
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

function pageTitle(mode: B2CPageMode) {
  return subpages.find((page) => page.mode === mode)?.label || "B2C Workflow"
}

export default function RevenueB2CWorkflowV12MegaWorkspace({ mode = "dashboard" }: { mode?: B2CPageMode }) {
  const [store, setStore] = useState<B2CStore>(() => defaultStore())
  const [query, setQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<B2CStage | "all">("all")
  const [categoryFilter, setCategoryFilter] = useState<CareCategory | "all">("all")
  const [selectedId, setSelectedId] = useState("")
  const [createOpen, setCreateOpen] = useState(mode === "new")
  const [newFamilyMember, setNewFamilyMember] = useState("")
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [draft, setDraft] = useState({
    familyName: "",
    contactName: "",
    phone: "",
    email: "",
    city: "Rabat",
    address: "",
    source: "Manual",
    category: "postpartum" as CareCategory,
    stage: "lead_intake" as B2CStage,
    priority: "high" as B2CPriority,
    health: "good" as B2CHealth,
    owner: "SDR Agent",
    closer: "Revenue Manager",
    careCoordinator: "Ops Coordinator",
    valueMad: 25000,
    monthlyValueMad: 8000,
    urgencyScore: 60,
    fitScore: 65,
    conversionProbability: 55,
    satisfactionRisk: 25,
    decisionMaker: "",
    decisionMakerConfirmed: false,
    familyMembers: "Decision maker\nCare recipient",
    needSummary: "",
    careRequirements: "",
    scheduleNeeds: "",
    budgetContext: "",
    trustConcerns: "",
    objections: "",
    quoteDetails: "",
    recommendedPackage: "",
    matchingCriteria: "",
    assignedStaff: "",
    onboardingChecklist: "Confirm decision maker\nPrepare quote\nConfirm staff availability",
    careStartDate: today(3),
    nextAction: "",
    nextContactDate: today(1),
    recoveryPlan: "",
    executiveEscalation: "",
    documents: "Consultation sheet\nQuote\nService agreement",
  })

  useEffect(() => {
    const loaded = readStore()
    setStore(loaded)
    setSelectedId(loaded.records[0]?.id || "")
  }, [])

  function commit(next: B2CStore, action: string, note: string, recordId?: string) {
    const withLog = {
      ...next,
      logs: [{ id: uid(), recordId: recordId || selectedId || "system", at: new Date().toLocaleString(), action, note }, ...next.logs].slice(0, 150),
    }
    setStore(withLog)
    writeStore(withLog)
  }

  function restoreSeed() {
    const seeded = defaultStore()
    setStore(seeded)
    setSelectedId(seeded.records[0]?.id || "")
    writeStore(seeded)
  }

  const selected = store.records.find((record) => record.id === selectedId) || store.records[0]

  const filtered = useMemo(() => {
    return store.records.filter((record) => {
      const hay = `${record.familyName} ${record.contactName} ${record.phone} ${record.city} ${record.owner} ${record.category} ${record.needSummary} ${record.nextAction}`.toLowerCase()

      const modeMatch =
        mode === "intake" ? ["lead_intake", "contact_verification"].includes(record.stage) :
        mode === "qualification" ? ["qualification", "contact_verification"].includes(record.stage) :
        mode === "consultation" ? ["consultation_scheduled", "consultation_completed"].includes(record.stage) :
        mode === "quote" ? ["quote_prepared", "family_decision"].includes(record.stage) :
        mode === "matching" ? ["staff_matching", "onboarding"].includes(record.stage) :
        mode === "onboarding" ? ["onboarding", "staff_matching"].includes(record.stage) :
        mode === "care-start" ? ["care_started", "onboarding"].includes(record.stage) :
        mode === "active-clients" ? ["active_client", "renewal", "care_started"].includes(record.stage) :
        mode === "retention" ? ["renewal", "active_client", "at_risk"].includes(record.stage) :
        mode === "recovery" ? ["at_risk", "recovery", "closed_lost"].includes(record.stage) || record.health === "risk" :
        mode === "high-value" ? record.valueMad >= 30000 || record.monthlyValueMad >= 10000 || record.priority === "critical" :
        mode === "risk" ? record.health === "risk" || record.satisfactionRisk >= 60 || record.trustConcerns.trim() !== "" :
        true

      return modeMatch
        && (!query || hay.includes(query.toLowerCase()))
        && (stageFilter === "all" || record.stage === stageFilter)
        && (categoryFilter === "all" || record.category === categoryFilter)
    })
  }, [store.records, query, stageFilter, categoryFilter, mode])

  const stats = useMemo(() => {
    const active = store.records.filter((r) => !["closed_won", "closed_lost"].includes(r.stage)).length
    const critical = store.records.filter((r) => r.priority === "critical" || r.health === "risk").length
    const highValue = store.records.filter((r) => r.valueMad >= 30000 || r.monthlyValueMad >= 10000).length
    const decisionMissing = store.records.filter((r) => !r.decisionMakerConfirmed).length
    const careStarts = store.records.filter((r) => ["onboarding", "care_started"].includes(r.stage)).length
    const value = store.records.reduce((sum, r) => sum + Number(r.valueMad || 0), 0)
    const monthly = store.records.reduce((sum, r) => sum + Number(r.monthlyValueMad || 0), 0)
    const avgProbability = Math.round(store.records.reduce((sum, r) => sum + Number(r.conversionProbability || 0), 0) / Math.max(store.records.length, 1))
    const avgRisk = Math.round(store.records.reduce((sum, r) => sum + Number(r.satisfactionRisk || 0), 0) / Math.max(store.records.length, 1))
    return { active, critical, highValue, decisionMissing, careStarts, value, monthly, avgProbability, avgRisk, total: store.records.length }
  }, [store.records])

  function updateRecord(id: string, patch: Partial<B2CRecord>, action = "B2C record updated") {
    const target = store.records.find((r) => r.id === id)
    const records = store.records.map((r) => r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r)
    commit({ ...store, records }, action, target?.familyName || id, id)
  }

  function createRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.familyName.trim()) return

    const now = new Date().toISOString()
    const record: B2CRecord = {
      id: uid(),
      familyName: draft.familyName,
      contactName: draft.contactName,
      phone: draft.phone,
      email: draft.email,
      city: draft.city,
      address: draft.address,
      source: draft.source,
      category: draft.category,
      stage: draft.stage,
      priority: draft.priority,
      health: draft.health,
      owner: draft.owner,
      closer: draft.closer,
      careCoordinator: draft.careCoordinator,
      valueMad: Number(draft.valueMad) || 0,
      monthlyValueMad: Number(draft.monthlyValueMad) || 0,
      urgencyScore: clamp(draft.urgencyScore),
      fitScore: clamp(draft.fitScore),
      conversionProbability: clamp(draft.conversionProbability),
      satisfactionRisk: clamp(draft.satisfactionRisk),
      decisionMaker: draft.decisionMaker,
      decisionMakerConfirmed: Boolean(draft.decisionMakerConfirmed),
      familyMembers: draft.familyMembers.split("\n").map((item) => item.trim()).filter(Boolean),
      needSummary: draft.needSummary,
      careRequirements: draft.careRequirements,
      scheduleNeeds: draft.scheduleNeeds,
      budgetContext: draft.budgetContext,
      trustConcerns: draft.trustConcerns,
      objections: draft.objections,
      quoteDetails: draft.quoteDetails,
      recommendedPackage: draft.recommendedPackage,
      matchingCriteria: draft.matchingCriteria,
      assignedStaff: draft.assignedStaff,
      onboardingChecklist: draft.onboardingChecklist.split("\n").map((item) => item.trim()).filter(Boolean),
      careStartDate: draft.careStartDate,
      nextAction: draft.nextAction || "Verify contact, qualify needs and define next B2C step.",
      nextContactDate: draft.nextContactDate,
      recoveryPlan: draft.recoveryPlan,
      executiveEscalation: draft.executiveEscalation,
      documents: draft.documents.split("\n").map((item) => item.trim()).filter(Boolean),
      createdAt: now,
      updatedAt: now,
    }

    commit({ ...store, records: [record, ...store.records] }, "B2C case created", record.familyName, record.id)
    setSelectedId(record.id)
    setCreateOpen(false)
  }

  function deleteRecord(id: string) {
    const target = store.records.find((r) => r.id === id)
    const records = store.records.filter((r) => r.id !== id)
    commit({ ...store, records }, "B2C case deleted", target?.familyName || id, id)
    setSelectedId(records[0]?.id || "")
  }

  function autoScore(id: string) {
    const target = store.records.find((r) => r.id === id)
    if (!target) return
    let probability = Math.round((target.urgencyScore + target.fitScore) / 2)
    if (target.decisionMakerConfirmed) probability += 12
    if (target.stage === "quote_prepared" || target.stage === "family_decision") probability += 8
    if (target.assignedStaff.trim()) probability += 8
    if (target.trustConcerns.trim()) probability -= 8
    if (target.objections.trim()) probability -= 5
    const risk = clamp(35 + (target.trustConcerns ? 15 : 0) + (target.objections ? 10 : 0) + (!target.assignedStaff && ["onboarding", "care_started"].includes(target.stage) ? 20 : 0))
    updateRecord(id, {
      conversionProbability: clamp(probability),
      satisfactionRisk: risk,
      priority: target.valueMad >= 40000 || probability >= 85 ? "critical" : target.priority,
      health: risk >= 70 ? "risk" : risk >= 45 ? "watch" : target.health,
    }, "B2C auto-scored")
  }

  function advance(id: string) {
    const target = store.records.find((r) => r.id === id)
    if (!target) return
    const index = stages.indexOf(target.stage)
    const nextStage = stages[Math.min(index + 1, stages.length - 1)]
    updateRecord(id, { stage: nextStage, nextAction: `Execute B2C stage: ${label(nextStage)}.` }, `Advanced to ${label(nextStage)}`)
  }

  function confirmDecisionMaker(id: string) {
    updateRecord(id, { decisionMakerConfirmed: true, nextAction: "Prepare consultation/quote with confirmed decision path." }, "Decision maker confirmed")
  }

  function prepareQuote(id: string) {
    updateRecord(id, { stage: "quote_prepared", quoteDetails: selected?.quoteDetails || "Quote prepared. Send to family and track decision.", nextAction: "Send quote and manage objections." }, "Quote prepared")
  }

  function matchStaff(id: string) {
    updateRecord(id, { stage: "staff_matching", assignedStaff: selected?.assignedStaff || "Staff shortlist required", nextAction: "Confirm matching and caregiver availability." }, "Staff matching activated")
  }

  function startCare(id: string) {
    updateRecord(id, { stage: "care_started", health: "good", nextAction: "Monitor first-day quality and family satisfaction." }, "Care started")
  }

  function markWon(id: string) {
    updateRecord(id, { stage: "closed_won", health: "excellent", conversionProbability: 100, nextAction: "Create active client retention routine." }, "Marked won")
  }

  function moveRisk(id: string) {
    updateRecord(id, { stage: "at_risk", health: "risk", recoveryPlan: selected?.recoveryPlan || "Create manager recovery plan and contact family.", nextAction: "Execute recovery immediately." }, "Moved to risk")
  }

  function recover(id: string) {
    updateRecord(id, { stage: "recovery", health: "watch", recoveryPlan: selected?.recoveryPlan || "Send recovery message, call decision maker and rebuild trust.", nextAction: "Execute recovery workflow." }, "Recovery activated")
  }

  function markLost(id: string) {
    updateRecord(id, { stage: "closed_lost", health: "lost", recoveryPlan: selected?.recoveryPlan || "Review lost reason and schedule win-back if possible." }, "Marked lost")
  }

  function addFamilyMember() {
    if (!selected || !newFamilyMember.trim()) return
    updateRecord(selected.id, { familyMembers: [...selected.familyMembers, newFamilyMember.trim()] }, "Family member added")
    setNewFamilyMember("")
  }

  function removeFamilyMember(index: number) {
    if (!selected) return
    updateRecord(selected.id, { familyMembers: selected.familyMembers.filter((_, i) => i !== index) }, "Family member removed")
  }

  function toggleChecklist(index: number) {
    if (!selected) return
    const next = selected.onboardingChecklist.map((item, i) => {
      if (i !== index) return item
      return item.startsWith("✓") ? item.replace(/^✓\s*/, "") : `✓ ${item}`
    })
    updateRecord(selected.id, { onboardingChecklist: next }, "Onboarding checklist updated")
  }

  function addChecklistItem() {
    if (!selected || !newChecklistItem.trim()) return
    updateRecord(selected.id, { onboardingChecklist: [...selected.onboardingChecklist, newChecklistItem.trim()] }, "Checklist item added")
    setNewChecklistItem("")
  }

  function toggleAutomation(id: string) {
    const automations = store.automations.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)
    commit({ ...store, automations }, "Automation toggled", id)
  }

  const boardGroups = stages.map((stage) => ({
    stage,
    records: filtered.filter((r) => r.stage === stage),
  }))

  const completedChecklist = selected?.onboardingChecklist.filter((item) => item.startsWith("✓")).length || 0

  return (
    <main className="min-h-screen bg-orange-50/60 text-slate-950 selection:bg-orange-200 selection:text-slate-950">
      <div className="mx-auto max-w-[1900px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2.4rem] bg-gradient-to-br from-slate-950 via-orange-950 to-black p-7 text-white shadow-2xl lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.28fr_.72fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="amber">Revenue Command</Pill>
                <Pill tone="blue">B2C Workflow V12 Mega</Pill>
                <Pill tone="emerald">{pageTitle(mode)}</Pill>
              </div>
              <h1 className="mt-6 max-w-6xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                B2C workflow deep execution engine — family journey, conversion, care start and retention control.
              </h1>
              <p className="mt-5 max-w-5xl text-base font-semibold leading-8 text-orange-50/85 md:text-lg">
                A full AngelCare family/client operating system: lead intake, qualification, consultation, quote, staff matching, onboarding, care start, active client retention, recovery and executive escalation.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>+ Create B2C case</Button>
                <Button type="button" onClick={() => selected && autoScore(selected.id)}>Auto-score selected</Button>
                <Button type="button" variant="soft" onClick={restoreSeed}>Restore seed</Button>
                <Link href="/revenue-command-center" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">← Revenue HQ</Link>
                <Link href="/revenue-command-center/b2c-workflow/pipeline" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">Pipeline</Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Cases", stats.total, "Total records"],
                ["Active", stats.active, "Open family journeys"],
                ["Critical", stats.critical, "High pressure"],
                ["Value", mad(stats.value), "Total opportunity"],
                ["Monthly", mad(stats.monthly), "Recurring potential"],
                ["Conv.", `${stats.avgProbability}%`, "Avg probability"],
              ].map(([k, v, d]) => (
                <div key={String(k)} className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-100/70">{k}</p>
                  <p className="mt-3 text-3xl font-black text-white">{v}</p>
                  <p className="mt-2 text-sm font-bold text-white/75">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {subpages.map((page) => (
            <Link key={page.href} href={page.href} className={`rounded-3xl border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${mode === page.mode ? "border-orange-400 bg-orange-100" : "border-slate-200 bg-white"}`}>
              <p className="text-sm font-black text-slate-950">{page.label}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{page.desc}</p>
            </Link>
          ))}
        </section>

        {createOpen ? (
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-700">Create B2C case</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Create full-control family/client workflow record</h2>
              </div>
              <Button type="button" variant="soft" onClick={() => setCreateOpen(false)}>Close</Button>
            </div>
            <form onSubmit={createRecord} className="grid gap-4 xl:grid-cols-4">
              <Input value={draft.familyName} onChange={(e) => setDraft({ ...draft, familyName: e.target.value })} placeholder="Family/client name" />
              <Input value={draft.contactName} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} placeholder="Contact name" />
              <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Phone" />
              <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email" />
              <Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="City" />
              <Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Address" />
              <Input value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} placeholder="Source" />
              <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as CareCategory })}>
                {categories.map((c) => <option key={c} value={c}>{label(c)}</option>)}
              </Select>
              <Select value={draft.stage} onChange={(e) => setDraft({ ...draft, stage: e.target.value as B2CStage })}>
                {stages.map((s) => <option key={s} value={s}>{label(s)}</option>)}
              </Select>
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as B2CPriority })}>
                {priorities.map((p) => <option key={p} value={p}>{label(p)}</option>)}
              </Select>
              <Select value={draft.health} onChange={(e) => setDraft({ ...draft, health: e.target.value as B2CHealth })}>
                {healthOptions.map((h) => <option key={h} value={h}>{label(h)}</option>)}
              </Select>
              <Input type="date" value={draft.nextContactDate} onChange={(e) => setDraft({ ...draft, nextContactDate: e.target.value })} />
              <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Owner" />
              <Input value={draft.closer} onChange={(e) => setDraft({ ...draft, closer: e.target.value })} placeholder="Closer" />
              <Input value={draft.careCoordinator} onChange={(e) => setDraft({ ...draft, careCoordinator: e.target.value })} placeholder="Care coordinator" />
              <Input type="date" value={draft.careStartDate} onChange={(e) => setDraft({ ...draft, careStartDate: e.target.value })} />
              <Input type="number" value={draft.valueMad} onChange={(e) => setDraft({ ...draft, valueMad: Number(e.target.value) })} placeholder="Value MAD" />
              <Input type="number" value={draft.monthlyValueMad} onChange={(e) => setDraft({ ...draft, monthlyValueMad: Number(e.target.value) })} placeholder="Monthly MAD" />
              <Input type="number" value={draft.urgencyScore} onChange={(e) => setDraft({ ...draft, urgencyScore: Number(e.target.value) })} placeholder="Urgency %" />
              <Input type="number" value={draft.fitScore} onChange={(e) => setDraft({ ...draft, fitScore: Number(e.target.value) })} placeholder="Fit %" />
              <Input type="number" value={draft.conversionProbability} onChange={(e) => setDraft({ ...draft, conversionProbability: Number(e.target.value) })} placeholder="Conversion %" />
              <Input type="number" value={draft.satisfactionRisk} onChange={(e) => setDraft({ ...draft, satisfactionRisk: Number(e.target.value) })} placeholder="Satisfaction risk %" />
              <Input value={draft.decisionMaker} onChange={(e) => setDraft({ ...draft, decisionMaker: e.target.value })} placeholder="Decision maker" />
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800">
                <input type="checkbox" checked={draft.decisionMakerConfirmed} onChange={(e) => setDraft({ ...draft, decisionMakerConfirmed: e.target.checked })} />
                Decision maker confirmed
              </label>
              <Textarea value={draft.familyMembers} onChange={(e) => setDraft({ ...draft, familyMembers: e.target.value })} placeholder="Family members, one per line" className="xl:col-span-2" />
              <Textarea value={draft.needSummary} onChange={(e) => setDraft({ ...draft, needSummary: e.target.value })} placeholder="Need summary" className="xl:col-span-2" />
              <Textarea value={draft.careRequirements} onChange={(e) => setDraft({ ...draft, careRequirements: e.target.value })} placeholder="Care requirements" className="xl:col-span-2" />
              <Textarea value={draft.scheduleNeeds} onChange={(e) => setDraft({ ...draft, scheduleNeeds: e.target.value })} placeholder="Schedule needs" className="xl:col-span-2" />
              <Textarea value={draft.budgetContext} onChange={(e) => setDraft({ ...draft, budgetContext: e.target.value })} placeholder="Budget context" className="xl:col-span-2" />
              <Textarea value={draft.trustConcerns} onChange={(e) => setDraft({ ...draft, trustConcerns: e.target.value })} placeholder="Trust concerns" className="xl:col-span-2" />
              <Textarea value={draft.quoteDetails} onChange={(e) => setDraft({ ...draft, quoteDetails: e.target.value })} placeholder="Quote details" className="xl:col-span-2" />
              <Textarea value={draft.recommendedPackage} onChange={(e) => setDraft({ ...draft, recommendedPackage: e.target.value })} placeholder="Recommended package" className="xl:col-span-2" />
              <Textarea value={draft.matchingCriteria} onChange={(e) => setDraft({ ...draft, matchingCriteria: e.target.value })} placeholder="Matching criteria" className="xl:col-span-2" />
              <Textarea value={draft.onboardingChecklist} onChange={(e) => setDraft({ ...draft, onboardingChecklist: e.target.value })} placeholder="Onboarding checklist, one per line" className="xl:col-span-2" />
              <Button type="submit" variant="primary" className="xl:col-span-4">Create B2C case</Button>
            </form>
          </Card>
        ) : null}

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1fr_.45fr_.35fr_.35fr]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search family, phone, category, owner, need..." />
            <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as B2CStage | "all")}>
              <option value="all">All stages</option>
              {stages.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </Select>
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as CareCategory | "all")}>
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{label(c)}</option>)}
            </Select>
            <Button type="button" onClick={() => setCreateOpen(true)}>New B2C case</Button>
          </div>
        </Card>

        {mode === "pipeline" ? (
          <section className="grid gap-4 xl:grid-cols-4">
            {boardGroups.map((group) => (
              <Card key={group.stage} className="min-h-[230px]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-950">{label(group.stage)}</h3>
                  <Pill tone="blue">{group.records.length}</Pill>
                </div>
                <div className="space-y-3">
                  {group.records.map((record) => (
                    <button key={record.id} type="button" onClick={() => setSelectedId(record.id)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-white">
                      <p className="text-sm font-black text-slate-950">{record.familyName}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{record.owner} • {mad(record.valueMad)}</p>
                      <div className="mt-2 flex gap-2">
                        <Pill tone={scoreTone(record.conversionProbability)}>{record.conversionProbability}%</Pill>
                        <Pill tone={healthTone(record.health)}>{label(record.health)}</Pill>
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
            {filtered.map((record) => (
              <Card key={record.id} className={record.id === selected?.id ? "ring-4 ring-orange-100" : ""}>
                <div className="grid gap-5 xl:grid-cols-[1fr_.48fr_.65fr]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={priorityTone(record.priority)}>{label(record.priority)}</Pill>
                      <Pill tone={healthTone(record.health)}>{label(record.health)}</Pill>
                      <Pill tone="violet">{label(record.stage)}</Pill>
                    </div>
                    <button type="button" onClick={() => setSelectedId(record.id)} className="mt-3 text-left text-2xl font-black text-slate-950 hover:text-orange-800">{record.familyName}</button>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{record.needSummary || record.nextAction}</p>
                    <p className="mt-3 text-sm font-black text-slate-700">{record.contactName} • {record.phone} • {record.city}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Family revenue engine</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{record.conversionProbability}%</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">Risk {record.satisfactionRisk}% • Fit {record.fitScore}%</p>
                    <p className="mt-2 text-sm font-black text-orange-700">{mad(record.valueMad)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => setSelectedId(record.id)}>Select</Button>
                    <Button type="button" variant="soft" onClick={() => autoScore(record.id)}>Score</Button>
                    <Button type="button" variant="soft" onClick={() => advance(record.id)}>Advance</Button>
                    <Button type="button" variant="soft" onClick={() => confirmDecisionMaker(record.id)}>Decision</Button>
                    <Button type="button" variant="soft" onClick={() => prepareQuote(record.id)}>Quote</Button>
                    <Button type="button" variant="soft" onClick={() => matchStaff(record.id)}>Match</Button>
                    <Button type="button" variant="primary" onClick={() => startCare(record.id)}>Start Care</Button>
                    <Button type="button" variant="danger" onClick={() => moveRisk(record.id)}>Risk</Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <aside className="space-y-6">
            <Card className="bg-slate-950 text-white">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Selected B2C command room</p>
              <h2 className="mt-2 text-3xl font-black text-white">{selected?.familyName || "No B2C case selected"}</h2>

              {selected ? (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs font-black text-white/60">Conv.</p>
                      <p className="mt-1 text-2xl font-black">{selected.conversionProbability}%</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs font-black text-white/60">Risk</p>
                      <p className="mt-1 text-2xl font-black">{selected.satisfactionRisk}%</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs font-black text-white/60">Monthly</p>
                      <p className="mt-1 text-xl font-black">{mad(selected.monthlyValueMad)}</p>
                    </div>
                  </div>

                  <Textarea value={selected.needSummary} onChange={(e) => updateRecord(selected.id, { needSummary: e.target.value }, "Need updated")} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={selected.stage} onChange={(e) => updateRecord(selected.id, { stage: e.target.value as B2CStage }, "Stage updated")}>
                      {stages.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                    </Select>
                    <Select value={selected.health} onChange={(e) => updateRecord(selected.id, { health: e.target.value as B2CHealth }, "Health updated")}>
                      {healthOptions.map((h) => <option key={h} value={h}>{label(h)}</option>)}
                    </Select>
                    <Select value={selected.priority} onChange={(e) => updateRecord(selected.id, { priority: e.target.value as B2CPriority }, "Priority updated")}>
                      {priorities.map((p) => <option key={p} value={p}>{label(p)}</option>)}
                    </Select>
                    <Select value={selected.category} onChange={(e) => updateRecord(selected.id, { category: e.target.value as CareCategory }, "Category updated")}>
                      {categories.map((c) => <option key={c} value={c}>{label(c)}</option>)}
                    </Select>
                    <Input value={selected.owner} onChange={(e) => updateRecord(selected.id, { owner: e.target.value }, "Owner updated")} />
                    <Input value={selected.careCoordinator} onChange={(e) => updateRecord(selected.id, { careCoordinator: e.target.value }, "Coordinator updated")} />
                    <Input type="number" value={selected.valueMad} onChange={(e) => updateRecord(selected.id, { valueMad: Number(e.target.value) }, "Value updated")} />
                    <Input type="number" value={selected.monthlyValueMad} onChange={(e) => updateRecord(selected.id, { monthlyValueMad: Number(e.target.value) }, "Monthly value updated")} />
                    <Input type="number" value={selected.conversionProbability} onChange={(e) => updateRecord(selected.id, { conversionProbability: clamp(Number(e.target.value)) }, "Probability updated")} />
                    <Input type="number" value={selected.satisfactionRisk} onChange={(e) => updateRecord(selected.id, { satisfactionRisk: clamp(Number(e.target.value)) }, "Risk updated")} />
                  </div>

                  <Panel title="Family decision map" subtitle={selected.decisionMakerConfirmed ? "Decision maker confirmed" : "Decision maker not confirmed"}>
                    <div className="space-y-3">
                      <Input value={selected.decisionMaker} onChange={(e) => updateRecord(selected.id, { decisionMaker: e.target.value }, "Decision maker updated")} />
                      <Button type="button" variant="primary" onClick={() => confirmDecisionMaker(selected.id)}>Confirm decision maker</Button>
                      {selected.familyMembers.map((member, index) => (
                        <div key={`${member}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-100 p-3 text-sm font-black text-slate-900">
                          <span>{member}</span>
                          <button type="button" onClick={() => removeFamilyMember(index)} className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-black text-white">Remove</button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input value={newFamilyMember} onChange={(e) => setNewFamilyMember(e.target.value)} placeholder="Add family member" />
                        <Button type="button" variant="primary" onClick={addFamilyMember}>Add</Button>
                      </div>
                    </div>
                  </Panel>

                  <Panel title="Onboarding checklist" subtitle={`${completedChecklist}/${selected.onboardingChecklist.length} completed`}>
                    <div className="space-y-2">
                      {selected.onboardingChecklist.map((item, index) => (
                        <button key={`${item}-${index}`} type="button" onClick={() => toggleChecklist(index)} className="block w-full rounded-2xl bg-slate-100 p-3 text-left text-sm font-black text-slate-900">
                          {item.startsWith("✓") ? "✅" : "⬜"} {item.replace(/^✓\s*/, "")}
                        </button>
                      ))}
                      <div className="flex gap-2">
                        <Input value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} placeholder="Add checklist item" />
                        <Button type="button" variant="primary" onClick={addChecklistItem}>Add</Button>
                      </div>
                    </div>
                  </Panel>

                  <Textarea value={selected.careRequirements} onChange={(e) => updateRecord(selected.id, { careRequirements: e.target.value }, "Care requirements updated")} placeholder="Care requirements" />
                  <Textarea value={selected.scheduleNeeds} onChange={(e) => updateRecord(selected.id, { scheduleNeeds: e.target.value }, "Schedule updated")} placeholder="Schedule needs" />
                  <Textarea value={selected.budgetContext} onChange={(e) => updateRecord(selected.id, { budgetContext: e.target.value }, "Budget updated")} placeholder="Budget context" />
                  <Textarea value={selected.trustConcerns} onChange={(e) => updateRecord(selected.id, { trustConcerns: e.target.value, health: e.target.value.trim() ? "watch" : selected.health }, "Trust concerns updated")} placeholder="Trust concerns" />
                  <Textarea value={selected.objections} onChange={(e) => updateRecord(selected.id, { objections: e.target.value }, "Objections updated")} placeholder="Objections" />
                  <Textarea value={selected.quoteDetails} onChange={(e) => updateRecord(selected.id, { quoteDetails: e.target.value }, "Quote updated")} placeholder="Quote details" />
                  <Textarea value={selected.recommendedPackage} onChange={(e) => updateRecord(selected.id, { recommendedPackage: e.target.value }, "Package updated")} placeholder="Recommended package" />
                  <Textarea value={selected.matchingCriteria} onChange={(e) => updateRecord(selected.id, { matchingCriteria: e.target.value }, "Matching criteria updated")} placeholder="Matching criteria" />
                  <Input value={selected.assignedStaff} onChange={(e) => updateRecord(selected.id, { assignedStaff: e.target.value }, "Assigned staff updated")} placeholder="Assigned staff" />
                  <Textarea value={selected.recoveryPlan} onChange={(e) => updateRecord(selected.id, { recoveryPlan: e.target.value }, "Recovery updated")} placeholder="Recovery plan" />
                  <Textarea value={selected.nextAction} onChange={(e) => updateRecord(selected.id, { nextAction: e.target.value }, "Next action updated")} placeholder="Next action" />

                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => autoScore(selected.id)}>Auto-score</Button>
                    <Button type="button" variant="soft" onClick={() => advance(selected.id)}>Advance</Button>
                    <Button type="button" variant="soft" onClick={() => prepareQuote(selected.id)}>Quote</Button>
                    <Button type="button" variant="soft" onClick={() => matchStaff(selected.id)}>Match Staff</Button>
                    <Button type="button" variant="primary" onClick={() => startCare(selected.id)}>Start Care</Button>
                    <Button type="button" variant="primary" onClick={() => markWon(selected.id)}>Won</Button>
                    <Button type="button" variant="danger" onClick={() => recover(selected.id)}>Recover</Button>
                    <Button type="button" variant="danger" onClick={() => markLost(selected.id)}>Lost</Button>
                    <Button type="button" variant="danger" onClick={() => deleteRecord(selected.id)}>Delete</Button>
                  </div>
                </div>
              ) : null}
            </Card>

            <Panel title="Automation engine" subtitle="Operational watchdog rules for B2C family/client workflow.">
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

            <Panel title="AI B2C copilot" subtitle="Guidance for selected family/client journey.">
              {selected ? (
                <div className="space-y-3 text-sm font-bold leading-6 text-slate-700">
                  <div className="rounded-2xl bg-orange-50 p-4"><b>Need:</b> {selected.needSummary || "No need summary yet."}</div>
                  <div className="rounded-2xl bg-amber-50 p-4"><b>Trust:</b> {selected.trustConcerns || "No trust concern captured."}</div>
                  <div className="rounded-2xl bg-emerald-50 p-4"><b>Package:</b> {selected.recommendedPackage || "No package recommended."}</div>
                  <div className="rounded-2xl bg-rose-50 p-4"><b>Recovery:</b> {selected.recoveryPlan || "No recovery plan yet."}</div>
                </div>
              ) : null}
            </Panel>

            <Panel title="Activity stream" subtitle="Every B2C command action is logged locally.">
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
