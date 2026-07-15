"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ComponentType, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  Filter,
  Gift,
  GraduationCap,
  Loader2,
  MapPinned,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Target,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react"
import AmbassadorMarketSidebar from "./ambassador-market-sidebar"
import {
  AmbassadorFilterFrame,
  AmbassadorJourneyNav,
  AmbassadorMetricCard,
  AmbassadorOperationalNotice,
  AmbassadorRouteHeader,
} from "./design/ambassador-enterprise-primitives"
import { getAmbassadorRouteDefinition } from "./design/ambassador-design-tokens"
import type {
  Ambassador,
  AmbassadorAuditLog,
  AmbassadorChecklistItem,
  AmbassadorEntityRecord,
  AmbassadorIncentive,
  AmbassadorKpiGoal,
  AmbassadorMission,
  AmbassadorModuleSettings,
  AmbassadorOnboardingRecord,
  AmbassadorRecruitmentRecord,
  AmbassadorReport,
  AmbassadorTerritory,
  AmbassadorTrainingCertification,
  AmbassadorWorkspaceMode,
  AmbassadorWorkspaceSnapshot,
} from "@/lib/market-os/ambassadors/types"
import {
  ambassadorApi,
  archiveAmbassadorRecord,
  createAmbassadorRecord,
  downloadAmbassadorCsv,
  loadAmbassadorSnapshot,
  updateAmbassadorRecord,
} from "@/lib/market-os/ambassadors/client"
import { deriveAmbassadorKpis } from "@/lib/market-os/ambassadors/validation"

type IconType = ComponentType<{ size?: number; className?: string }>
type FormState = Record<string, string>
type ModalKind =
  | "ambassador"
  | "territory"
  | "assignTerritory"
  | "mission"
  | "recruitment"
  | "moveRecruitment"
  | "onboarding"
  | "checklist"
  | "training"
  | "goal"
  | "incentive"
  | "report"
  | "settings"
type ConfirmKind = "archive" | "approveIncentive" | "rejectIncentive" | "payIncentive" | "completeMission" | "archiveMission"

type ModalState = {
  kind: ModalKind
  record?: AmbassadorEntityRecord | null
}

type ConfirmState = {
  kind: ConfirmKind
  title: string
  body: string
  endpoint?: string
  method?: "PATCH" | "DELETE"
  payload?: Record<string, unknown>
  record?: AmbassadorEntityRecord | null
}

type PageConfig = {
  title: string
  description: string
  primary: string
  primaryModal: ModalKind
  exportType: string
  icon: IconType
}

type JourneyTab = {
  mode: AmbassadorWorkspaceMode
  label: string
  href: string
  helper: string
}

type ResourceTemplate = {
  id: string
  title: string
  channel: string
  version: string
  status: string
  audience: string
  copyText: string
  guidance: string
}

const emptySnapshot: AmbassadorWorkspaceSnapshot = {
  records: [],
  ambassadors: [],
  archivedRecords: [],
  territories: [],
  missions: [],
  recruitment: [],
  onboarding: [],
  training: [],
  goals: [],
  incentives: [],
  reports: [],
  settings: {},
  stats: {},
  kpis: {},
  activity: [],
  audit: [],
  diagnostics: [],
  updatedAt: new Date().toISOString(),
}

const pageConfig: Record<AmbassadorWorkspaceMode, PageConfig> = {
  overview: {
    title: "Ambassador Operations Cockpit",
    description: "Daily command center for recruitment, activation, field execution, payout control, and governance.",
    primary: "Add Ambassador",
    primaryModal: "ambassador",
    exportType: "ambassador-cockpit",
    icon: ShieldCheck,
  },
  directory: {
    title: "Ambassadors Directory",
    description: "Search, filter, edit, assign, archive and open dossier views from live ambassador records.",
    primary: "Add Ambassador",
    primaryModal: "ambassador",
    exportType: "ambassadors-directory",
    icon: Users,
  },
  territories: {
    title: "Territories",
    description: "Manage territory coverage, assignment, ownership and active ambassador counts.",
    primary: "Create Territory",
    primaryModal: "territory",
    exportType: "territories",
    icon: MapPinned,
  },
  performance: {
    title: "Performance",
    description: "Review performance scores, KPI progress and coaching priorities from live data.",
    primary: "Create KPI Goal",
    primaryModal: "goal",
    exportType: "performance",
    icon: BarChart3,
  },
  reports: {
    title: "Reports",
    description: "Generate persisted reports and export current filtered Ambassador datasets.",
    primary: "Generate Report",
    primaryModal: "report",
    exportType: "reports",
    icon: FileText,
  },
  recruitment: {
    title: "Recruitment",
    description: "Run candidate creation, scoring, stage movement and conversion handoff.",
    primary: "Add Candidate",
    primaryModal: "recruitment",
    exportType: "recruitment",
    icon: UserPlus,
  },
  leads: {
    title: "Leads & Referrals",
    description: "Track lead intake, attribution quality, qualification, and conversion potential across the funnel.",
    primary: "Add Candidate",
    primaryModal: "recruitment",
    exportType: "leads",
    icon: Target,
  },
  conversions: {
    title: "Conversions",
    description: "Validate, accept, or reject candidate conversions and keep the audit trail clean.",
    primary: "Add Candidate",
    primaryModal: "recruitment",
    exportType: "conversions",
    icon: BadgeCheck,
  },
  onboarding: {
    title: "Onboarding",
    description: "Create onboarding plans, update stages and complete checklist steps with completion recalculation.",
    primary: "Create Plan",
    primaryModal: "onboarding",
    exportType: "onboarding",
    icon: ClipboardCheck,
  },
  training: {
    title: "Training & Certification",
    description: "Assign training, update certification status, scores and validity windows.",
    primary: "Assign Training",
    primaryModal: "training",
    exportType: "training",
    icon: GraduationCap,
  },
  goals: {
    title: "Goals & KPIs",
    description: "Create measurable goals, update progress and recalculate completion rates.",
    primary: "Create KPI Goal",
    primaryModal: "goal",
    exportType: "goals",
    icon: Target,
  },
  incentives: {
    title: "Incentives",
    description: "Create incentives, approve or reject payouts, and mark payments as paid with confirmation.",
    primary: "Create Incentive",
    primaryModal: "incentive",
    exportType: "incentives",
    icon: Gift,
  },
  payouts: {
    title: "Incentives & Payouts",
    description: "Finance-led payout control with approvals, payment state changes, and suspicious payout review.",
    primary: "Create Incentive",
    primaryModal: "incentive",
    exportType: "payouts",
    icon: Wallet,
  },
  missions: {
    title: "Missions",
    description: "Create, assign, update, complete and archive field missions.",
    primary: "Create Mission",
    primaryModal: "mission",
    exportType: "missions",
    icon: MapPinned,
  },
  resources: {
    title: "Resources & Scripts",
    description: "Approved WhatsApp, call, and DM scripts with operational copy actions and version control.",
    primary: "Generate Report",
    primaryModal: "report",
    exportType: "resources",
    icon: FileText,
  },
  governance: {
    title: "Settings & Governance",
    description: "Policy control for approval rules, payout policies, onboarding guardrails, and audit posture.",
    primary: "Edit Settings",
    primaryModal: "settings",
    exportType: "governance",
    icon: Settings,
  },
  settings: {
    title: "Settings",
    description: "Persist approval, onboarding, training, KPI, incentive and notification rules.",
    primary: "Edit Settings",
    primaryModal: "settings",
    exportType: "settings",
    icon: Settings,
  },
  detail: {
    title: "Ambassador 360",
    description: "Live ambassador profile with related missions, onboarding, training, KPIs, incentives and audit activity.",
    primary: "Edit Ambassador",
    primaryModal: "ambassador",
    exportType: "ambassador-360",
    icon: Eye,
  },
  create: {
    title: "Create Ambassador",
    description: "Create a live Ambassador record in the Ambassador workspace.",
    primary: "Add Ambassador",
    primaryModal: "ambassador",
    exportType: "ambassadors-create",
    icon: Plus,
  },
  edit: {
    title: "Edit Ambassador",
    description: "Update a live Ambassador record and refresh every affected view.",
    primary: "Edit Ambassador",
    primaryModal: "ambassador",
    exportType: "ambassadors-edit",
    icon: Pencil,
  },
  delete: {
    title: "Archive Ambassador",
    description: "Archive Ambassador records only after explicit confirmation.",
    primary: "Archive Ambassador",
    primaryModal: "ambassador",
    exportType: "ambassadors-archive",
    icon: Archive,
  },
}

const statusOptions = ["all", "active", "candidate", "screening", "interview", "offer", "onboarding", "converted", "rejected", "inactive", "suspended", "pending", "assigned", "in_progress", "completed", "approved", "paid", "archived"]
const recruitmentStages = ["sourced", "screening", "interview", "offer", "onboarding", "converted", "rejected"]
const onboardingStages = ["not_started", "documents", "orientation", "field_shadowing", "ready", "completed", "blocked"]
const trainingStatuses = ["assigned", "in_progress", "completed", "expired", "failed"]
const certificationStatuses = ["pending", "certified", "expired", "revoked"]
const incentiveStatuses = ["pending", "approved", "rejected", "paid"]
const missionStatuses = ["draft", "assigned", "in_progress", "completed", "blocked", "cancelled"]
const journeyTabs: JourneyTab[] = [
  { mode: "overview", label: "Cockpit de pilotage", href: "/market-os/ambassadors", helper: "Daily command center" },
  { mode: "directory", label: "Ambassadeurs", href: "/market-os/ambassadors/directory", helper: "Ambassador dossiers" },
  { mode: "recruitment", label: "Recrutement", href: "/market-os/ambassadors/recruitment", helper: "Candidate pipeline" },
  { mode: "leads", label: "Leads & referrals", href: "/market-os/ambassadors/leads", helper: "Qualification flow" },
  { mode: "conversions", label: "Conversions", href: "/market-os/ambassadors/conversions", helper: "Validation cockpit" },
  { mode: "onboarding", label: "Onboarding", href: "/market-os/ambassadors/onboarding", helper: "Readiness & training" },
  { mode: "missions", label: "Missions terrain", href: "/market-os/ambassadors/missions", helper: "Field execution" },
  { mode: "territories", label: "Territoires", href: "/market-os/ambassadors/territories", helper: "Coverage planning" },
  { mode: "incentives", label: "Incentives", href: "/market-os/ambassadors/incentives", helper: "Approval queue" },
  { mode: "payouts", label: "Payouts", href: "/market-os/ambassadors/payouts", helper: "Finance control" },
  { mode: "reports", label: "Rapports", href: "/market-os/ambassadors/reports", helper: "Export & reporting" },
  { mode: "resources", label: "Ressources", href: "/market-os/ambassadors/resources", helper: "Scripts & templates" },
  { mode: "governance", label: "Gouvernance", href: "/market-os/ambassadors/governance", helper: "Rules & audit" },
  { mode: "settings", label: "Paramètres", href: "/market-os/ambassadors/settings", helper: "Program controls" },
]

const resourceTemplates: ResourceTemplate[] = [
  {
    id: "script-whatsapp-qualification",
    title: "Qualification WhatsApp",
    channel: "WhatsApp",
    version: "v4.2",
    status: "approved",
    audience: "Lead qualification",
    copyText: "Bonjour, merci pour votre message. Je peux vous aider à qualifier votre besoin et vous partager la bonne offre AngelCare. Quel est votre contexte aujourd’hui ?",
    guidance: "Use for first reply and lead qualification within 15 minutes.",
  },
  {
    id: "script-call-followup",
    title: "Call follow-up",
    channel: "Call",
    version: "v3.6",
    status: "approved",
    audience: "Interview & activation",
    copyText: "Bonjour, je vous appelle pour confirmer votre intérêt, votre zone d’action et votre disponibilité pour la prochaine étape d’activation.",
    guidance: "Use after screening or when a lead needs human confirmation.",
  },
  {
    id: "script-dm-referral",
    title: "Referral DM",
    channel: "Direct message",
    version: "v2.8",
    status: "approved",
    audience: "Referral generation",
    copyText: "Nous lançons une campagne locale de recommandation. Si vous connaissez des parents ou partenaires intéressés, je peux vous transmettre le kit de partage.",
    guidance: "Use for trusted partners and community ambassadors.",
  },
  {
    id: "script-proof-reminder",
    title: "Proof reminder",
    channel: "Field mission",
    version: "v1.9",
    status: "locked",
    audience: "Mission evidence",
    copyText: "Merci de soumettre la preuve requise, les leads collectés et les notes d’exécution avant validation finale de la mission.",
    guidance: "Use before mission validation and payout eligibility review.",
  },
]

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-MA").format(Math.round(value || 0))
}

function formatMoney(value: number, currency = "MAD") {
  return `${formatNumber(value)} ${currency || "MAD"}`
}

function shortDate(value?: string | null) {
  if (!value) return "Not set"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "A"
}

function statusTone(status?: string | null) {
  const value = (status || "").toLowerCase()
  if (["active", "completed", "achieved", "paid", "certified", "approved", "converted", "ready"].includes(value)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  if (["pending", "assigned", "tracking", "in_progress", "candidate", "screening", "interview", "offer", "review", "qualified"].includes(value)) {
    return "border-sky-200 bg-sky-50 text-sky-700"
  }
  if (["blocked", "at_risk", "suspended", "rejected", "failed", "expired", "cancelled", "archived"].includes(value)) {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }
  if (["watch", "warning", "needs_review", "draft"].includes(value)) {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }
  return "border-slate-200 bg-slate-50 text-slate-600"
}

function StatusBadge({ status }: { status?: string | null }) {
  return (
    <span className={classNames("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black capitalize", statusTone(status))}>
      {(status || "unknown").replaceAll("_", " ")}
    </span>
  )
}

function FieldLabel({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-9500">{label}</span>
      <div className="mt-2">{children}</div>
      {error ? <div className="mt-1 text-xs font-bold text-rose-600">{error}</div> : null}
    </label>
  )
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={classNames(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50",
        props.className
      )}
    />
  )
}

function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={classNames(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50",
        props.className
      )}
    />
  )
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={classNames(
        "min-h-[112px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50",
        props.className
      )}
    />
  )
}

function ActionButton({
  children,
  onClick,
  icon: Icon,
  variant = "secondary",
  disabled,
  type = "button",
}: {
  children: ReactNode
  onClick?: () => void
  icon?: IconType
  variant?: "primary" | "secondary" | "danger" | "ghost"
  disabled?: boolean
  type?: "button" | "submit"
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classNames(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50",
        variant === "danger" && "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100"
      )}
    >
      {Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  )
}

function KpiCard({ label, value, meta, icon: Icon, tone, onClick }: { label: string; value: string; meta: string; icon: IconType; tone: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[22px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className={classNames("grid h-12 w-12 place-items-center rounded-2xl shadow-inner", tone)}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-9500">{label}</div>
          <div className="mt-1 text-2xl font-black tracking-tight text-slate-950">{value}</div>
          <div className="mt-1 text-[11px] font-black text-sky-700">{meta}</div>
        </div>
      </div>
    </button>
  )
}

function SummaryTile({
  label,
  value,
  helper,
  tone,
  onClick,
}: {
  label: string
  value: string
  helper: string
  tone: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[22px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
    >
      <div className={classNames("inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em]", tone)}>
        {label}
      </div>
      <div className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</div>
      <div className="mt-2 text-xs font-medium leading-5 text-slate-500">{helper}</div>
    </button>
  )
}

function TableShell({
  title,
  description,
  children,
  empty,
  loading,
}: {
  title: string
  description: string
  children: ReactNode
  empty: boolean
  loading: boolean
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.45)]">
      <div className="flex items-start justify-between border-b border-slate-100 p-5">
        <div>
          <h2 className="text-[15px] font-black tracking-tight text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {loading ? (
        <div className="space-y-3 p-5">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : empty ? (
        <div className="grid min-h-[220px] place-items-center p-8 text-center">
          <div>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100">
              <Search size={20} className="text-slate-9500" />
            </div>
            <div className="mt-3 text-sm font-black text-slate-950">No records found</div>
            <div className="mt-1 max-w-sm text-xs font-medium leading-6 text-slate-500">Adjust filters or open the relevant workflow to create a live record.</div>
          </div>
        </div>
      ) : (
        children
      )}
    </section>
  )
}

function ModalShell({
  title,
  description,
  icon: Icon,
  children,
  onClose,
  onSave,
  saving,
  error,
  success,
  saveLabel = "Save",
  tone = "slate",
}: {
  title: string
  description: string
  icon: IconType
  children: ReactNode
  onClose: () => void
  onSave: () => void
  saving: boolean
  error?: string | null
  success?: string | null
  saveLabel?: string
  tone?: "slate" | "blue" | "emerald" | "amber" | "rose" | "violet"
}) {
  const toneClasses = {
    slate: "from-slate-950 via-slate-900 to-slate-800",
    blue: "from-slate-950 via-blue-900 to-sky-700",
    emerald: "from-slate-950 via-emerald-900 to-emerald-700",
    amber: "from-slate-950 via-amber-900 to-orange-700",
    rose: "from-slate-950 via-rose-900 to-rose-700",
    violet: "from-slate-950 via-violet-900 to-indigo-700",
  } as const

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <header className={classNames("relative overflow-hidden bg-gradient-to-r p-6 text-white", toneClasses[tone])}>
          <Icon className="absolute -right-10 -top-10 opacity-10" size={190} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 shadow-inner">
                <Icon size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">{title}</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/80">{description}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 hover:bg-white/25">
              <X size={18} />
            </button>
          </div>
        </header>
        <div className="max-h-[calc(92vh-176px)] overflow-y-auto bg-slate-50 p-6">
          {error ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div> : null}
          {success ? <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{success}</div> : null}
          {children}
        </div>
        <footer className="flex items-center justify-end gap-3 border-t border-slate-100 bg-white p-5">
          <ActionButton onClick={onClose} disabled={saving}>Cancel</ActionButton>
          <ActionButton onClick={onSave} icon={saving ? Loader2 : CheckCircle2} variant="primary" disabled={saving}>
            {saving ? "Saving" : saveLabel}
          </ActionButton>
        </footer>
      </div>
    </div>
  )
}

function ConfirmModal({ state, saving, error, onClose, onConfirm }: { state: ConfirmState; saving: boolean; error?: string | null; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-white/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950">{state.title}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">{state.body}</p>
          </div>
        </div>
        {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div> : null}
        <div className="mt-6 flex justify-end gap-3">
          <ActionButton onClick={onClose} disabled={saving}>Cancel</ActionButton>
          <ActionButton onClick={onConfirm} icon={saving ? Loader2 : ShieldCheck} variant="danger" disabled={saving}>
            {saving ? "Processing" : "Confirm"}
          </ActionButton>
        </div>
      </div>
    </div>
  )
}

function DetailDrawer({
  ambassador,
  snapshot,
  onClose,
  onEdit,
  onAssign,
  onMission,
  onArchive,
}: {
  ambassador: Ambassador
  snapshot: AmbassadorWorkspaceSnapshot
  onClose: () => void
  onEdit: () => void
  onAssign: () => void
  onMission: () => void
  onArchive: () => void
}) {
  const missions = snapshot.missions.filter((item) => item.ambassador_id === ambassador.id)
  const onboarding = snapshot.onboarding.filter((item) => item.ambassador_id === ambassador.id)
  const training = snapshot.training.filter((item) => item.ambassador_id === ambassador.id)
  const goals = snapshot.goals.filter((item) => item.ambassador_id === ambassador.id)
  const incentives = snapshot.incentives.filter((item) => item.ambassador_id === ambassador.id)
  const audit = snapshot.audit.filter((item) => item.entity_id === ambassador.id).slice(0, 8)
  const readinessScore = Math.round(
    [ambassador.performance_score || 0, ambassador.kpi_score || 0, ambassador.missions_completed || 0, ambassador.incentives_balance ? 100 - Math.min(100, Number(ambassador.incentives_balance || 0) / 10) : 100]
      .reduce((sum, value) => sum + Number(value || 0), 0) / 4,
  )
  const actionSummary = [
    `${missions.length} mission${missions.length === 1 ? "" : "s"}`,
    `${onboarding.length} onboarding plan${onboarding.length === 1 ? "" : "s"}`,
    `${training.length} training item${training.length === 1 ? "" : "s"}`,
    `${incentives.length} incentive${incentives.length === 1 ? "" : "s"}`,
  ]

  return (
    <div className="fixed inset-0 z-[85] bg-slate-950/30 backdrop-blur-sm">
      <aside className="ml-auto h-full w-full max-w-5xl overflow-y-auto bg-white shadow-[0_40px_120px_-40px_rgba(15,23,42,0.75)]">
        <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 p-6 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-lg font-black text-white shadow-lg shadow-slate-950/20">{initials(ambassador.full_name)}</div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">{ambassador.full_name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={ambassador.status} />
                  <StatusBadge status={ambassador.lifecycle_stage} />
                  <span className="text-sm font-semibold text-slate-500">{ambassador.city || "No city"} · {ambassador.region || "No region"}</span>
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50">
              <X size={18} />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {actionSummary.map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-slate-600">
                {item}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <ActionButton onClick={onEdit} icon={Pencil} variant="primary">Edit</ActionButton>
            <ActionButton onClick={onAssign} icon={MapPinned}>Assign Territory</ActionButton>
            <ActionButton onClick={onMission} icon={Plus}>Create Mission</ActionButton>
            <ActionButton onClick={onArchive} icon={Trash2} variant="danger">Archive</ActionButton>
          </div>
        </header>
        <div className="grid gap-5 bg-slate-50 p-6">
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Performance", `${ambassador.performance_score}/100`, BarChart3],
              ["KPI", `${ambassador.kpi_score}/100`, Target],
              ["Missions", `${ambassador.missions_completed}/${ambassador.missions_assigned}`, ClipboardCheck],
              ["Incentives", formatMoney(ambassador.incentives_balance), Wallet],
            ].map(([label, value, Icon]) => {
              const CardIcon = Icon as IconType
              return (
                <div key={String(label)} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                  <CardIcon className="text-sky-700" size={18} />
                  <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{String(value)}</div>
                  <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">{String(label)}</div>
                </div>
              )
            })}
            <div className="rounded-[22px] border border-slate-200 bg-slate-950 p-4 text-white shadow-sm xl:col-span-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.12em] text-white/60">Readiness</div>
                  <div className="mt-2 text-3xl font-black tracking-tight">{readinessScore}%</div>
                </div>
                <div className="max-w-md text-sm font-medium leading-6 text-white/75">
                  Premium dossier summary with current mission load, onboarding status, incentive exposure and recent audit activity.
                </div>
              </div>
            </div>
          </section>
          <section className="grid gap-5 xl:grid-cols-2">
            <InfoPanel title="Profile" accent="blue" rows={[
              ["Email", ambassador.email || "Not set"],
              ["Phone", ambassador.phone || "Not set"],
              ["Territory", ambassador.territory_name || "Unassigned"],
              ["Manager", ambassador.manager_name || "Not set"],
              ["Joined", shortDate(ambassador.joined_at)],
              ["Last Activity", shortDate(ambassador.last_activity_at)],
            ]} />
            <InfoPanel title="Readiness" accent="emerald" rows={[
              ["Recruitment", ambassador.recruitment_stage || "Not set"],
              ["Onboarding", ambassador.onboarding_stage || "Not set"],
              ["Training", ambassador.training_status || "Not set"],
              ["Certification", ambassador.certification_status || "Not set"],
              ["Role", ambassador.role || ambassador.title || "Not set"],
            ]} />
          </section>
          <section className="grid gap-5 xl:grid-cols-2">
            <RelatedList title="Missions" empty="No missions assigned" tone="sky" items={missions.map((item) => `${item.title} · ${item.status} · ${shortDate(item.due_date)}`)} />
            <RelatedList title="Onboarding" empty="No onboarding plan" tone="emerald" items={onboarding.map((item) => `${item.stage.replaceAll("_", " ")} · ${item.completion_rate}% complete`)} />
          </section>
          <section className="grid gap-5 xl:grid-cols-2">
            <RelatedList title="Training & Certification" empty="No training assigned" tone="sky" items={training.map((item) => `${item.training_name} · ${item.status} · ${item.score}/100`)} />
            <RelatedList title="Goals & KPIs" empty="No KPI goals" tone="amber" items={goals.map((item) => `${item.goal_type} · ${item.completion_rate}% · ${item.status}`)} />
          </section>
          <section className="grid gap-5 xl:grid-cols-2">
            <RelatedList title="Incentives" empty="No incentives" tone="amber" items={incentives.map((item) => `${item.incentive_type} · ${formatMoney(item.amount, item.currency)} · ${item.status}`)} />
            <RelatedList title="Recent Audit Activity" empty="No audit activity" tone="slate" items={audit.map((item) => `${item.action} · ${item.summary || "No summary"} · ${shortDate(item.created_at)}`)} />
          </section>
        </div>
      </aside>
    </div>
  )
}

function InfoPanel({ title, rows, accent = "slate" }: { title: string; rows: string[][]; accent?: "slate" | "blue" | "emerald" | "amber" | "violet" }) {
  const accentStyles = {
    slate: "border-slate-200 bg-white",
    blue: "border-sky-200 bg-sky-50/40",
    emerald: "border-emerald-200 bg-emerald-50/40",
    amber: "border-amber-200 bg-amber-50/40",
    violet: "border-violet-200 bg-violet-50/40",
  } as const
  return (
    <div className={classNames("rounded-[22px] border p-5 shadow-sm", accentStyles[accent])}>
      <h3 className="text-[15px] font-black tracking-tight text-slate-950">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 rounded-2xl bg-white/80 px-4 py-3 text-sm">
            <span className="font-semibold text-slate-500">{label}</span>
            <span className="max-w-[60%] text-right font-black text-slate-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RelatedList({ title, items, empty, tone = "slate" }: { title: string; items: string[]; empty: string; tone?: "slate" | "sky" | "emerald" | "amber" | "violet" }) {
  const accentStyles = {
    slate: "border-slate-200 bg-white",
    sky: "border-sky-200 bg-sky-50/30",
    emerald: "border-emerald-200 bg-emerald-50/30",
    amber: "border-amber-200 bg-amber-50/30",
    violet: "border-violet-200 bg-violet-50/30",
  } as const
  return (
    <section className={classNames("rounded-[22px] border p-5 shadow-sm", accentStyles[tone])}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-black tracking-tight text-slate-950">{title}</h3>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">{items.length}</span>
      </div>
      <div className="mt-4 grid gap-2">
        {items.length ? items.map((item) => <div key={item} className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700">{item}</div>) : <div className="rounded-2xl bg-white px-3 py-2 text-sm font-medium text-slate-500">{empty}</div>}
      </div>
    </section>
  )
}

export default function AmbassadorProductionWorkspace({ mode = "overview", id }: { mode?: AmbassadorWorkspaceMode; id?: string }) {
  const safeMode = (pageConfig[mode] ? mode : "overview") as AmbassadorWorkspaceMode
  const config = pageConfig[safeMode] || pageConfig.overview
  const routeDefinition = getAmbassadorRouteDefinition(safeMode)
  const [snapshot, setSnapshot] = useState<AmbassadorWorkspaceSnapshot>(emptySnapshot)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [territoryFilter, setTerritoryFilter] = useState("all")
  const [sortKey, setSortKey] = useState("updated")
  const [modal, setModal] = useState<ModalState | null>(null)
  const [detail, setDetail] = useState<Ambassador | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [form, setForm] = useState<FormState>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const load = useCallback(async (background = false) => {
    if (background) setRefreshing(true)
    else setLoading(true)
    const response = await loadAmbassadorSnapshot()
    const nextSnapshot = ((response as any)?.data && Array.isArray((response as any).data.ambassadors))
      ? (response as any).data
      : response
    setSnapshot({ ...emptySnapshot, ...nextSnapshot })
    setError(
      (response as any)?.ok === false
        ? ((response as any)?.error || "Ambassador workspace failed to load")
        : null,
    )
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!loading && id) {
      const ambassador = snapshot.ambassadors.find((item) => item.id === id)
      if (mode === "detail" && ambassador) setDetail(ambassador)
      if (mode === "edit" && ambassador) openModal("ambassador", ambassador)
      if (mode === "delete" && ambassador) openArchiveConfirm("ambassadors", ambassador.id, ambassador.full_name)
    }
    if (!loading && mode === "create") openModal("ambassador")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, id, mode, snapshot.ambassadors])

  const kpis = useMemo(() => deriveAmbassadorKpis(snapshot), [snapshot])
  const PageIcon = routeDefinition.icon || config.icon
  const regions = useMemo(() => Array.from(new Set(snapshot.ambassadors.map((item) => item.region).filter(Boolean) as string[])).sort(), [snapshot.ambassadors])
  const territories = useMemo(() => snapshot.territories.filter((item) => item.status !== "archived"), [snapshot.territories])
  const activeAmbassadors = useMemo(() => snapshot.ambassadors.filter((item) => item.status !== "archived"), [snapshot.ambassadors])

  function searchable(value: string) {
    return value.toLowerCase().includes(query.trim().toLowerCase())
  }

  function sortRecords<T extends object>(items: T[]): T[] {
    const sortValue = (item: T, key: string) => String((item as Record<string, unknown>)[key] ?? "")
    return [...items].sort((a, b) => {
      if (sortKey === "name") return [sortValue(a, "full_name"), sortValue(a, "name"), sortValue(a, "title"), sortValue(a, "candidate_name")].join(" ").localeCompare([sortValue(b, "full_name"), sortValue(b, "name"), sortValue(b, "title"), sortValue(b, "candidate_name")].join(" "))
      if (sortKey === "status") return sortValue(a, "status").localeCompare(sortValue(b, "status"))
      return sortValue(b, "updated_at").localeCompare(sortValue(a, "updated_at"))
    })
  }

  const filteredAmbassadors = useMemo(() => sortRecords(activeAmbassadors.filter((item) => {
    const matchesQuery = !query || searchable(`${item.full_name} ${item.email || ""} ${item.phone || ""} ${item.city || ""} ${item.region || ""} ${item.territory_name || ""}`)
    const matchesStatus = statusFilter === "all" || item.status === statusFilter || item.lifecycle_stage === statusFilter
    const matchesRegion = regionFilter === "all" || item.region === regionFilter
    const matchesTerritory = territoryFilter === "all" || item.territory_id === territoryFilter
    return matchesQuery && matchesStatus && matchesRegion && matchesTerritory
  })), [activeAmbassadors, query, regionFilter, sortKey, statusFilter, territoryFilter])

  const filteredTerritories = useMemo(() => sortRecords(territories.filter((item) => {
    const matchesQuery = !query || searchable(`${item.name} ${item.city || ""} ${item.region || ""} ${item.manager_name || ""}`)
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesRegion = regionFilter === "all" || item.region === regionFilter
    return matchesQuery && matchesStatus && matchesRegion
  })), [query, regionFilter, sortKey, statusFilter, territories])

  const filteredMissions = useMemo(() => sortRecords(snapshot.missions.filter((item) => {
    if (item.archived_at) return false
    const ambassador = activeAmbassadors.find((candidate) => candidate.id === item.ambassador_id)
    const matchesQuery = !query || searchable(`${item.title} ${item.city || ""} ${item.region || ""} ${ambassador?.full_name || ""}`)
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesRegion = regionFilter === "all" || item.region === regionFilter
    const matchesTerritory = territoryFilter === "all" || item.territory_id === territoryFilter
    return matchesQuery && matchesStatus && matchesRegion && matchesTerritory
  })), [activeAmbassadors, query, regionFilter, snapshot.missions, sortKey, statusFilter, territoryFilter])

  const filteredRecruitment = useMemo(() => sortRecords(snapshot.recruitment.filter((item) => {
    if (item.stage === "archived") return false
    const matchesQuery = !query || searchable(`${item.candidate_name} ${item.email || ""} ${item.phone || ""} ${item.city || ""} ${item.source || ""}`)
    const matchesStatus = statusFilter === "all" || item.stage === statusFilter
    const matchesRegion = regionFilter === "all" || item.region === regionFilter
    return matchesQuery && matchesStatus && matchesRegion
  })), [query, regionFilter, snapshot.recruitment, sortKey, statusFilter])

  const filteredOnboarding = useMemo(() => sortRecords(snapshot.onboarding.filter((item) => {
    const ambassador = activeAmbassadors.find((candidate) => candidate.id === item.ambassador_id)
    const matchesQuery = !query || searchable(`${ambassador?.full_name || ""} ${item.stage} ${item.assigned_owner || ""}`)
    const matchesStatus = statusFilter === "all" || item.stage === statusFilter
    return matchesQuery && matchesStatus
  })), [activeAmbassadors, query, snapshot.onboarding, sortKey, statusFilter])

  const filteredTraining = useMemo(() => sortRecords(snapshot.training.filter((item) => {
    if (item.archived_at) return false
    const ambassador = activeAmbassadors.find((candidate) => candidate.id === item.ambassador_id)
    const matchesQuery = !query || searchable(`${item.training_name} ${item.certification_name || ""} ${ambassador?.full_name || ""}`)
    const matchesStatus = statusFilter === "all" || item.status === statusFilter || item.certification_status === statusFilter
    return matchesQuery && matchesStatus
  })), [activeAmbassadors, query, snapshot.training, sortKey, statusFilter])

  const filteredGoals = useMemo(() => sortRecords(snapshot.goals.filter((item) => {
    if (item.status === "archived") return false
    const ambassador = activeAmbassadors.find((candidate) => candidate.id === item.ambassador_id)
    const matchesQuery = !query || searchable(`${item.goal_type} ${item.period} ${ambassador?.full_name || ""}`)
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesQuery && matchesStatus
  })), [activeAmbassadors, query, snapshot.goals, sortKey, statusFilter])

  const filteredIncentives = useMemo(() => sortRecords(snapshot.incentives.filter((item) => {
    if (item.status === "archived") return false
    const ambassador = activeAmbassadors.find((candidate) => candidate.id === item.ambassador_id)
    const matchesQuery = !query || searchable(`${item.incentive_type} ${item.reason || ""} ${ambassador?.full_name || ""}`)
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesQuery && matchesStatus
  })), [activeAmbassadors, query, snapshot.incentives, sortKey, statusFilter])

  const filteredReports = useMemo(() => sortRecords(snapshot.reports.filter((item) => {
    if (item.status === "archived") return false
    const matchesQuery = !query || searchable(`${item.title} ${item.report_type} ${item.generated_by || ""}`)
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesQuery && matchesStatus
  })), [query, snapshot.reports, sortKey, statusFilter])

  const activeMissions = useMemo(() => snapshot.missions.filter((item) => !item.archived_at && item.status !== "archived"), [snapshot.missions])
  const activeIncentives = useMemo(() => snapshot.incentives.filter((item) => item.status !== "archived"), [snapshot.incentives])
  const leadRecords = useMemo(() => snapshot.recruitment.filter((item) => item.stage !== "archived"), [snapshot.recruitment])
  const conversionReadyRecords = useMemo(() => leadRecords.filter((item) => ["offer", "onboarding", "converted"].includes(item.stage)), [leadRecords])
  const reviewableConversions = useMemo(() => leadRecords.filter((item) => ["offer", "onboarding"].includes(item.stage)), [leadRecords])
  const operationalHealth = useMemo(() => {
    const missionProgress = activeMissions.length ? Math.round((activeMissions.filter((item) => item.status === "completed").length / activeMissions.length) * 100) : 100
    const incentivePressure = activeIncentives.length
      ? Math.round((activeIncentives.filter((item) => item.status === "pending" || item.status === "approved").length / activeIncentives.length) * 100)
      : 0
    const score = Math.max(0, Math.min(100, Math.round((kpis.activeAmbassadors * 100 + kpis.territoryCoverage + kpis.missionsCompleted + kpis.onboardingCompletion + kpis.trainingCompletion + kpis.kpiCompletion + missionProgress) / 7 - incentivePressure / 2)))
    const risk = score >= 80 ? "low" : score >= 60 ? "medium" : "high"
    return { score, risk, missionProgress, incentivePressure }
  }, [activeIncentives, activeMissions, kpis.activeAmbassadors, kpis.kpiCompletion, kpis.missionsCompleted, kpis.onboardingCompletion, kpis.territoryCoverage, kpis.trainingCompletion])

  const recommendedActions = useMemo(() => {
    const actions: Array<{ label: string; description: string; mode: AmbassadorWorkspaceMode; tone?: "primary" | "secondary" | "danger" }> = []
    if (leadRecords.length) actions.push({ label: "Review recruitment pipeline", description: `${leadRecords.length} candidate${leadRecords.length === 1 ? "" : "s"} in motion`, mode: "recruitment" })
    if (reviewableConversions.length) actions.push({ label: "Validate conversions", description: `${reviewableConversions.length} conversion${reviewableConversions.length === 1 ? "" : "s"} waiting`, mode: "conversions" })
    if (activeMissions.some((item) => item.status !== "completed")) actions.push({ label: "Check field missions", description: `${activeMissions.filter((item) => item.status !== "completed").length} open mission${activeMissions.filter((item) => item.status !== "completed").length === 1 ? "" : "s"}`, mode: "missions" })
    if (activeIncentives.some((item) => item.status === "pending" || item.status === "approved")) actions.push({ label: "Approve payouts", description: `${activeIncentives.filter((item) => item.status === "pending" || item.status === "approved").length} incentive${activeIncentives.filter((item) => item.status === "pending" || item.status === "approved").length === 1 ? "" : "s"} pending`, mode: "payouts" })
    if (!actions.length) actions.push({ label: "Export daily report", description: "No blocking backlog detected", mode: "reports" })
    return actions.slice(0, 4)
  }, [activeIncentives, activeMissions, leadRecords.length, reviewableConversions.length])

  function setFormValue(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
    setFormErrors((current) => ({ ...current, [key]: "" }))
  }

  function ambassadorName(idValue?: string | null) {
    return activeAmbassadors.find((item) => item.id === idValue)?.full_name || "Unassigned"
  }

  function openModal(kind: ModalKind, record?: AmbassadorEntityRecord | null) {
    setError(null)
    setSuccess(null)
    setFormErrors({})
    setModal({ kind, record: record || null })
    setForm(initialForm(kind, record || null))
  }

  function initialForm(kind: ModalKind, record: AmbassadorEntityRecord | null): FormState {
    if (kind === "ambassador") {
      const item = record as Ambassador | null
      return {
        id: item?.id || "",
        full_name: item?.full_name || "",
        email: item?.email || "",
        phone: item?.phone || "",
        city: item?.city || "",
        region: item?.region || "",
        role: item?.role || item?.title || "",
        status: item?.status || "active",
        lifecycle_stage: item?.lifecycle_stage || "active",
        manager_name: item?.manager_name || "",
        performance_score: String(item?.performance_score ?? 0),
        kpi_score: String(item?.kpi_score ?? 0),
      }
    }
    if (kind === "territory") {
      const item = record as AmbassadorTerritory | null
      return {
        id: item?.id || "",
        name: item?.name || "",
        city: item?.city || "",
        region: item?.region || "",
        zone: item?.zone || "",
        manager_name: item?.manager_name || "",
        coverage_goal: String(item?.coverage_goal ?? 0),
        status: item?.status || "active",
      }
    }
    if (kind === "assignTerritory") {
      const item = record as Ambassador | null
      return { ambassador_id: item?.id || activeAmbassadors[0]?.id || "", territory_id: item?.territory_id || territories[0]?.id || "" }
    }
    if (kind === "mission") {
      const item = record as AmbassadorMission | null
      return {
        id: item?.id || "",
        ambassador_id: item?.ambassador_id || (record && "full_name" in record ? record.id : "") || activeAmbassadors[0]?.id || "",
        title: item?.title || "",
        mission_type: item?.mission_type || "field_activation",
        priority: item?.priority || "normal",
        status: item?.status || "assigned",
        city: item?.city || "",
        region: item?.region || "",
        territory_id: item?.territory_id || territories[0]?.id || "",
        due_date: item?.due_date?.slice(0, 10) || "",
        description: item?.description || "",
        instructions: item?.instructions || "",
      }
    }
    if (kind === "recruitment" || kind === "moveRecruitment") {
      const item = record as AmbassadorRecruitmentRecord | null
      return {
        id: item?.id || "",
        candidate_name: item?.candidate_name || "",
        email: item?.email || "",
        phone: item?.phone || "",
        city: item?.city || "",
        region: item?.region || "",
        source: item?.source || "referral",
        stage: item?.stage || "sourced",
        evaluation_score: String(item?.evaluation_score ?? 0),
        interviewer: item?.interviewer || "",
        next_step: item?.next_step || "",
        notes: item?.notes || "",
      }
    }
    if (kind === "onboarding" || kind === "checklist") {
      const item = record as AmbassadorOnboardingRecord | null
      return {
        id: item?.id || "",
        ambassador_id: item?.ambassador_id || activeAmbassadors[0]?.id || "",
        stage: item?.stage || "not_started",
        assigned_owner: item?.assigned_owner || "",
        due_date: item?.due_date?.slice(0, 10) || "",
        notes: item?.notes || "",
        checklist: item?.checklist?.map((step: AmbassadorChecklistItem) => step.label).join("\n") || "Profile verified\nFiles collected\nOrientation completed\nTraining assigned\nTerritory confirmed",
      }
    }
    if (kind === "training") {
      const item = record as AmbassadorTrainingCertification | null
      return {
        id: item?.id || "",
        ambassador_id: item?.ambassador_id || activeAmbassadors[0]?.id || "",
        training_name: item?.training_name || "",
        certification_name: item?.certification_name || "",
        status: item?.status || "assigned",
        certification_status: item?.certification_status || "pending",
        score: String(item?.score ?? 0),
        valid_until: item?.valid_until?.slice(0, 10) || "",
        issued_by: item?.issued_by || "",
      }
    }
    if (kind === "goal") {
      const item = record as AmbassadorKpiGoal | null
      return {
        id: item?.id || "",
        ambassador_id: item?.ambassador_id || activeAmbassadors[0]?.id || "",
        period: item?.period || "current",
        goal_type: item?.goal_type || "",
        target_value: String(item?.target_value ?? 100),
        current_value: String(item?.current_value ?? 0),
        status: item?.status || "tracking",
        manager_notes: item?.manager_notes || "",
      }
    }
    if (kind === "incentive") {
      const item = record as AmbassadorIncentive | null
      return {
        id: item?.id || "",
        ambassador_id: item?.ambassador_id || activeAmbassadors[0]?.id || "",
        incentive_type: item?.incentive_type || "performance_bonus",
        amount: String(item?.amount ?? 0),
        currency: item?.currency || "MAD",
        status: item?.status || "pending",
        reason: item?.reason || "",
      }
    }
    if (kind === "report") {
      const item = record as AmbassadorReport | null
      return {
        id: item?.id || "",
        report_type: item?.report_type || config.exportType,
        title: item?.title || `${config.title} report`,
        period_start: item?.period_start?.slice(0, 10) || "",
        period_end: item?.period_end?.slice(0, 10) || "",
        generated_by: item?.generated_by || "AngelCare Operator",
        status: item?.status || "generated",
      }
    }
    if (kind === "settings") {
      const item = snapshot.settings
      return {
        id: item?.id || "",
        default_region: item?.default_region || "",
        approval_rules: stringifyJson(item?.approval_rules),
        incentive_rules: stringifyJson(item?.incentive_rules),
        onboarding_rules: stringifyJson(item?.onboarding_rules),
        training_rules: stringifyJson(item?.training_rules),
        kpi_rules: stringifyJson(item?.kpi_rules),
        notification_rules: stringifyJson(item?.notification_rules),
      }
    }
    return {}
  }

  function stringifyJson(value: unknown) {
    if (!value || (typeof value === "object" && Object.keys(value as Record<string, unknown>).length === 0)) return "{}"
    return JSON.stringify(value, null, 2)
  }

  function validateForm(kind: ModalKind) {
    const errors: Record<string, string> = {}
    if (kind === "ambassador" && !form.full_name?.trim()) errors.full_name = "Full name is required"
    if (kind === "territory" && !form.name?.trim()) errors.name = "Territory name is required"
    if (kind === "assignTerritory") {
      if (!form.ambassador_id) errors.ambassador_id = "Choose an ambassador"
      if (!form.territory_id) errors.territory_id = "Choose a territory"
    }
    if (kind === "mission" && !form.title?.trim()) errors.title = "Mission title is required"
    if ((kind === "recruitment" || kind === "moveRecruitment") && !form.candidate_name?.trim()) errors.candidate_name = "Candidate name is required"
    if (kind === "onboarding" && !form.ambassador_id) errors.ambassador_id = "Choose an ambassador"
    if (kind === "training") {
      if (!form.ambassador_id) errors.ambassador_id = "Choose an ambassador"
      if (!form.training_name?.trim()) errors.training_name = "Training name is required"
    }
    if (kind === "goal") {
      if (!form.goal_type?.trim()) errors.goal_type = "Goal type is required"
      if (Number(form.target_value || 0) <= 0) errors.target_value = "Target must be greater than zero"
    }
    if (kind === "incentive") {
      if (!form.ambassador_id) errors.ambassador_id = "Choose an ambassador"
      if (Number(form.amount || 0) <= 0) errors.amount = "Amount must be greater than zero"
    }
    if (kind === "report" && !form.report_type?.trim()) errors.report_type = "Report type is required"
    if (kind === "settings") {
      for (const key of ["approval_rules", "incentive_rules", "onboarding_rules", "training_rules", "kpi_rules", "notification_rules"]) {
        try {
          JSON.parse(form[key] || "{}")
        } catch {
          errors[key] = "Configuration invalide"
        }
      }
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function saveModal() {
    if (!modal || !validateForm(modal.kind)) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    const isEdit = Boolean(form.id)
    const payload = payloadForModal(modal.kind)
    let response
    if (modal.kind === "assignTerritory") {
      response = await ambassadorApi<Ambassador>("/territories/assign", { method: "POST", body: JSON.stringify(payload) })
    } else if (modal.kind === "moveRecruitment") {
      response = await ambassadorApi<AmbassadorRecruitmentRecord>("/recruitment/stage", { method: "PATCH", body: JSON.stringify(payload) })
    } else if (modal.kind === "settings") {
      response = await ambassadorApi<AmbassadorModuleSettings>("/settings", { method: "PATCH", body: JSON.stringify(payload) })
    } else {
      const path = endpointForModal(modal.kind)
      response = isEdit
        ? await updateAmbassadorRecord(`${path}/${form.id}`, payload)
        : await createAmbassadorRecord(path, payload)
    }

    if (!response.ok) {
      setError(response.error || "Save failed")
      setSaving(false)
      return
    }
    setSuccess("Saved and synced")
    await load(true)
    if (modal.kind === "ambassador" && response.data && "full_name" in response.data) {
      setDetail(response.data as Ambassador)
    }
    setSaving(false)
    setModal(null)
  }

  function payloadForModal(kind: ModalKind): Record<string, unknown> {
    if (kind === "settings") {
      return {
        id: form.id || undefined,
        default_region: form.default_region,
        approval_rules: JSON.parse(form.approval_rules || "{}"),
        incentive_rules: JSON.parse(form.incentive_rules || "{}"),
        onboarding_rules: JSON.parse(form.onboarding_rules || "{}"),
        training_rules: JSON.parse(form.training_rules || "{}"),
        kpi_rules: JSON.parse(form.kpi_rules || "{}"),
        notification_rules: JSON.parse(form.notification_rules || "{}"),
      }
    }
    if (kind === "onboarding" || kind === "checklist") {
      return {
        ...form,
        checklist: (form.checklist || "").split("\n").map((label, index) => ({ id: `step-${index + 1}`, label: label.trim(), done: false })).filter((item) => item.label),
      }
    }
    if (kind === "goal") {
      return {
        ...form,
        target_value: Number(form.target_value || 0),
        current_value: Number(form.current_value || 0),
      }
    }
    if (kind === "incentive") return { ...form, amount: Number(form.amount || 0) }
    if (kind === "ambassador") {
      return {
        ...form,
        performance_score: Number(form.performance_score || 0),
        kpi_score: Number(form.kpi_score || 0),
      }
    }
    if (kind === "territory") return { ...form, coverage_goal: Number(form.coverage_goal || 0) }
    if (kind === "training") return { ...form, score: Number(form.score || 0) }
    if (kind === "recruitment" || kind === "moveRecruitment") return { ...form, evaluation_score: Number(form.evaluation_score || 0) }
    return { ...form }
  }

  function endpointForModal(kind: ModalKind) {
    if (kind === "ambassador") return "/ambassadors"
    if (kind === "territory") return "/territories"
    if (kind === "mission") return "/missions"
    if (kind === "recruitment" || kind === "moveRecruitment") return "/recruitment"
    if (kind === "onboarding" || kind === "checklist") return "/onboarding"
    if (kind === "training") return "/training"
    if (kind === "goal") return "/goals"
    if (kind === "incentive") return "/incentives"
    if (kind === "report") return "/reports"
    return "/settings"
  }

  function openArchiveConfirm(entity: string, recordId: string, label: string) {
    setConfirm({
      kind: entity === "missions" ? "archiveMission" : "archive",
      title: `Archive ${label}`,
      body: "This will archive the record and refresh the Ambassador workspace after the change completes.",
      endpoint: `/${entity}/${recordId}`,
      method: "DELETE",
    })
  }

  async function runConfirm() {
    if (!confirm?.endpoint) return
    setSaving(true)
    setConfirmError(null)
    const response = confirm.method === "DELETE"
      ? await archiveAmbassadorRecord(confirm.endpoint)
      : await ambassadorApi(confirm.endpoint, { method: confirm.method || "PATCH", body: JSON.stringify(confirm.payload || {}) })
    if (!response.ok) {
      setConfirmError(response.error || "Action failed")
      setSaving(false)
      return
    }
    setConfirm(null)
    setDetail(null)
    setSaving(false)
    setSuccess("Action completed and synced")
    await load(true)
  }

  async function completeOnboardingStep(record: AmbassadorOnboardingRecord, step: AmbassadorChecklistItem) {
    setSaving(true)
    const response = await ambassadorApi<AmbassadorOnboardingRecord>("/onboarding/complete-step", {
      method: "PATCH",
      body: JSON.stringify({ id: record.id, step_id: step.id, done: !step.done }),
    })
    if (!response.ok) setError(response.error || "Checklist update failed")
    else {
      setSuccess("Checklist updated")
      await load(true)
    }
    setSaving(false)
  }

  async function recalculateGoal(record: AmbassadorKpiGoal) {
    setSaving(true)
    const response = await ambassadorApi<AmbassadorKpiGoal>("/goals/recalculate", {
      method: "PATCH",
      body: JSON.stringify({ id: record.id }),
    })
    if (!response.ok) setError(response.error || "KPI recalculation failed")
    else {
      setSuccess("KPI recalculated")
      await load(true)
    }
    setSaving(false)
  }

  function confirmIncentive(record: AmbassadorIncentive, kind: "approveIncentive" | "rejectIncentive" | "payIncentive") {
    const endpoint = kind === "approveIncentive" ? "/incentives/approve" : kind === "rejectIncentive" ? "/incentives/reject" : "/incentives/pay"
    setConfirm({
      kind,
      title: kind === "payIncentive" ? "Confirm incentive payment" : kind === "rejectIncentive" ? "Reject incentive" : "Approve incentive",
      body: `${ambassadorName(record.ambassador_id)} · ${formatMoney(record.amount, record.currency)}. This action writes to the incentive record and audit log.`,
      endpoint,
      method: "PATCH",
      payload: { id: record.id, reason: record.reason || "Manager decision" },
      record,
    })
  }

  function confirmCompleteMission(record: AmbassadorMission) {
    setConfirm({
      kind: "completeMission",
      title: "Complete mission",
      body: `${record.title} will be marked completed and the ambassador mission counters will refresh.`,
      endpoint: "/missions/status",
      method: "PATCH",
      payload: { id: record.id, status: "completed" },
      record,
    })
  }

  function exportCurrentView(reportType = config.exportType) {
    const { headers, rows } = exportRowsForMode(safeMode)
    downloadAmbassadorCsv(reportType, headers, rows)
  }

  async function generateReportAndExport() {
    if (!validateForm("report")) return
    setSaving(true)
    const exportResponse = await ambassadorApi<{ filename: string; csv: string; report: AmbassadorReport | null }>("/reports/export", {
      method: "POST",
      body: JSON.stringify({
        report_type: form.report_type,
        title: form.title,
        period_start: form.period_start,
        period_end: form.period_end,
        generated_by: form.generated_by,
        filters: { query, status: statusFilter, region: regionFilter, territory: territoryFilter },
      }),
    })
    if (!exportResponse.ok || !exportResponse.data) {
      setError(exportResponse.error || "Report export failed")
      setSaving(false)
      return
    }
    const blob = new Blob([exportResponse.data.csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = exportResponse.data.filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    setModal(null)
    setSuccess("Report generated and exported")
    await load(true)
    setSaving(false)
  }

  function exportRowsForMode(currentMode: AmbassadorWorkspaceMode): { headers: string[]; rows: unknown[][] } {
    if (currentMode === "territories") {
      return {
        headers: ["Territory", "City", "Region", "Zone", "Coverage Goal", "Active Ambassadors", "Manager", "Status"],
        rows: filteredTerritories.map((item) => [item.name, item.city, item.region, item.zone, item.coverage_goal, item.active_ambassadors_count, item.manager_name, item.status]),
      }
    }
    if (currentMode === "missions") {
      return {
        headers: ["Mission", "Ambassador", "Priority", "Status", "City", "Region", "Due", "Completed"],
        rows: filteredMissions.map((item) => [item.title, ambassadorName(item.ambassador_id), item.priority, item.status, item.city, item.region, item.due_date, item.completed_at]),
      }
    }
    if (currentMode === "recruitment") {
      return {
        headers: ["Candidate", "Email", "Phone", "City", "Region", "Source", "Stage", "Score", "Next Step"],
        rows: filteredRecruitment.map((item) => [item.candidate_name, item.email, item.phone, item.city, item.region, item.source, item.stage, item.evaluation_score, item.next_step]),
      }
    }
    if (currentMode === "onboarding") {
      return {
        headers: ["Ambassador", "Stage", "Completion", "Owner", "Due", "Completed", "Notes"],
        rows: filteredOnboarding.map((item) => [ambassadorName(item.ambassador_id), item.stage, item.completion_rate, item.assigned_owner, item.due_date, item.completed_at, item.notes]),
      }
    }
    if (currentMode === "training") {
      return {
        headers: ["Ambassador", "Training", "Certification", "Status", "Certification Status", "Score", "Valid Until"],
        rows: filteredTraining.map((item) => [ambassadorName(item.ambassador_id), item.training_name, item.certification_name, item.status, item.certification_status, item.score, item.valid_until]),
      }
    }
    if (currentMode === "goals" || currentMode === "performance") {
      return {
        headers: ["Ambassador", "Goal", "Period", "Target", "Current", "Completion", "Status", "Notes"],
        rows: filteredGoals.map((item) => [ambassadorName(item.ambassador_id), item.goal_type, item.period, item.target_value, item.current_value, item.completion_rate, item.status, item.manager_notes]),
      }
    }
    if (currentMode === "incentives") {
      return {
        headers: ["Ambassador", "Type", "Amount", "Currency", "Status", "Reason", "Approved By", "Approved At", "Paid At"],
        rows: filteredIncentives.map((item) => [ambassadorName(item.ambassador_id), item.incentive_type, item.amount, item.currency, item.status, item.reason, item.approved_by, item.approved_at, item.paid_at]),
      }
    }
    if (currentMode === "reports") {
      return {
        headers: ["Title", "Type", "Status", "Generated By", "Period Start", "Period End", "Created"],
        rows: filteredReports.map((item) => [item.title, item.report_type, item.status, item.generated_by, item.period_start, item.period_end, item.created_at]),
      }
    }
    return {
      headers: ["Name", "Email", "Phone", "City", "Region", "Territory", "Status", "Lifecycle", "Performance", "KPI", "Missions", "Incentives"],
      rows: filteredAmbassadors.map((item) => [item.full_name, item.email, item.phone, item.city, item.region, item.territory_name, item.status, item.lifecycle_stage, item.performance_score, item.kpi_score, `${item.missions_completed}/${item.missions_assigned}`, item.incentives_balance]),
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f6f8fb] text-slate-950">
      <AmbassadorMarketSidebar />
      <main data-market-os-root className="min-w-0 flex-1 px-4 py-4 lg:px-6 xl:px-8">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5">
          <AmbassadorRouteHeader
            eyebrow={routeDefinition.eyebrow}
            title={routeDefinition.title}
            description={routeDefinition.description}
            icon={PageIcon}
            updatedAt={new Date(snapshot.updatedAt).toLocaleString("fr-MA")}
            sourceLabel={snapshot.diagnostics.length ? "source de secours" : "source opérationnelle"}
            statusLabel={loading ? "Synchronisation" : snapshot.diagnostics.length ? "À contrôler" : "Opérationnel"}
            actions={[
              { label: refreshing ? "Actualisation" : "Actualiser", icon: refreshing ? Loader2 : RefreshCw, onClick: () => void load(true), disabled: refreshing },
              { label: routeDefinition.secondary[0] || "Exporter", icon: routeDefinition.secondary[0]?.toLowerCase().includes("export") ? Download : Plus, onClick: () => routeDefinition.secondary[0]?.toLowerCase().includes("export") ? exportCurrentView(routeDefinition.exportType) : openModal(config.primaryModal) },
              { label: routeDefinition.secondary[1] || "Rapport", icon: FileText, onClick: () => openModal("report") },
              { label: routeDefinition.primary, icon: Plus, variant: "primary", onClick: () => openModal(config.primaryModal) },
            ]}
          />

          {error ? <AmbassadorOperationalNotice tone="red">{error}</AmbassadorOperationalNotice> : null}
          {snapshot.diagnostics.length ? (
            <AmbassadorOperationalNotice tone="amber">
              Source opérationnelle indisponible : {snapshot.diagnostics[0]?.reason || "un contrôle de source est requis."}
            </AmbassadorOperationalNotice>
          ) : null}
          {success ? <AmbassadorOperationalNotice tone="green">{success}</AmbassadorOperationalNotice> : null}

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <AmbassadorMetricCard label="Ambassadeurs actifs" value={formatNumber(kpis.activeAmbassadors)} meta={`${formatNumber(kpis.totalAmbassadors)} au total`} icon={Users} tone="blue" onClick={() => setStatusFilter("active")} />
            <AmbassadorMetricCard label="Candidats en cours" value={formatNumber(kpis.recruitmentPipeline)} meta="Pipeline recrutement" icon={UserPlus} tone="purple" onClick={() => openModal("recruitment")} />
            <AmbassadorMetricCard label="Missions en cours" value={formatNumber(kpis.missionsAssigned)} meta={`${kpis.missionsCompleted} terminées`} icon={ClipboardCheck} tone="cyan" onClick={() => openModal("mission")} />
            <AmbassadorMetricCard label="Couverture territoires" value={`${kpis.territoryCoverage}%`} meta={`${kpis.assignedTerritories} territoires affectés`} icon={MapPinned} tone="green" onClick={() => openModal("assignTerritory")} />
            <AmbassadorMetricCard label="Readiness onboarding" value={`${kpis.onboardingCompletion}%`} meta="Activation moyenne" icon={GraduationCap} tone="amber" onClick={() => openModal("onboarding")} />
            <AmbassadorMetricCard label="Incentives payés" value={formatMoney(kpis.incentivesPaid)} meta={`${kpis.incentivesPending} en attente`} icon={Wallet} tone="red" onClick={() => openModal("incentive")} />
          </section>

          <AmbassadorJourneyNav tabs={journeyTabs} activeMode={safeMode} />

          <section className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
            <div className="min-w-0 space-y-5">
              {safeMode === "overview" ? renderCockpit() : null}
              {safeMode !== "overview" ? (
                <>
                  <AmbassadorFilterFrame>
                    <div className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_0.6fr]">
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                        <Search size={17} />
                        <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent outline-none text-slate-900" placeholder="Rechercher ambassadeur, ville, mission, lead..." />
                      </label>
                      <SelectInput value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtre statut">
                        {statusOptions.map((item) => <option key={item} value={item}>{item === "all" ? "Tous les statuts" : item.replaceAll("_", " ")}</option>)}
                      </SelectInput>
                      <SelectInput value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} aria-label="Filtre région">
                        <option value="all">Toutes les régions</option>
                        {regions.map((item) => <option key={item} value={item}>{item}</option>)}
                      </SelectInput>
                      <SelectInput value={territoryFilter} onChange={(event) => setTerritoryFilter(event.target.value)} aria-label="Filtre territoire">
                        <option value="all">Tous les territoires</option>
                        {territories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </SelectInput>
                      <SelectInput value={sortKey} onChange={(event) => setSortKey(event.target.value)} aria-label="Tri">
                        <option value="updated">Tri mise à jour</option>
                        <option value="name">Tri nom</option>
                        <option value="status">Tri statut</option>
                      </SelectInput>
                    </div>
                  </AmbassadorFilterFrame>
                  <section>{renderModeContent()}</section>
                </>
              ) : null}
            </div>
            <aside className="space-y-5">
              {renderIntelligencePanel()}
            </aside>
          </section>

          {modal ? renderModal() : null}
          {detail ? (
            <DetailDrawer
              ambassador={snapshot.ambassadors.find((item) => item.id === detail.id) || detail}
              snapshot={snapshot}
              onClose={() => setDetail(null)}
              onEdit={() => openModal("ambassador", snapshot.ambassadors.find((item) => item.id === detail.id) || detail)}
              onAssign={() => openModal("assignTerritory", snapshot.ambassadors.find((item) => item.id === detail.id) || detail)}
              onMission={() => openModal("mission", snapshot.ambassadors.find((item) => item.id === detail.id) || detail)}
              onArchive={() => openArchiveConfirm("ambassadors", detail.id, detail.full_name)}
            />
          ) : null}
          {confirm ? <ConfirmModal state={confirm} saving={saving} error={confirmError} onClose={() => setConfirm(null)} onConfirm={() => void runConfirm()} /> : null}
        </div>
      </main>
    </div>
  )

  function renderCockpit() {
    const activeRecruitment = leadRecords.filter((item) => ["screening", "interview", "offer", "onboarding"].includes(item.stage))
    const activeTerritories = territories.filter((item) => item.status !== "archived")
    const openMissions = activeMissions.filter((item) => item.status !== "completed")
    const latestReports = filteredReports.slice(0, 3)

    return (
      <div className="grid gap-5">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                <span>Daily command center</span>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700">{operationalHealth.score}% health</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">Risk {operationalHealth.risk}</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Run the ambassador network from one premium cockpit.</h2>
              <p className="max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Recruitment, activation, field execution, referrals, conversions, payouts, and governance are visible at a glance with real actions attached to every queue.
              </p>
              <div className="flex flex-wrap gap-2">
                <ActionButton onClick={() => openModal("recruitment")} icon={UserPlus} variant="primary">Add candidate</ActionButton>
                <ActionButton onClick={() => openModal("mission")} icon={MapPinned}>Create mission</ActionButton>
                <ActionButton onClick={() => openModal("incentive")} icon={Wallet}>Review payout</ActionButton>
                <ActionButton onClick={() => openModal("report")} icon={FileText}>Export report</ActionButton>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:w-[430px]">
              <div className="rounded-[22px] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                <div className="text-[11px] font-black uppercase tracking-[0.12em] text-white/60">Operational health</div>
                <div className="mt-2 text-4xl font-black tracking-tight">{operationalHealth.score}%</div>
                <div className="mt-2 text-sm font-medium text-white/75">Balanced across recruitment, missions, onboarding, and incentive pressure.</div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Field pressure</div>
                <div className="mt-2 text-4xl font-black tracking-tight text-slate-950">{openMissions.length}</div>
                <div className="mt-2 text-sm font-medium text-slate-500">Open missions need proof, validation, or completion review.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="Recruitment pipeline" value={formatNumber(leadRecords.length)} helper={`${activeRecruitment.length} active funnel items`} tone="bg-sky-100 text-sky-700" onClick={() => setStatusFilter("screening")} />
          <SummaryTile label="Active territories" value={formatNumber(activeTerritories.length)} helper={`${kpis.territoryCoverage}% coverage`} tone="bg-emerald-100 text-emerald-700" onClick={() => setQuery("")} />
          <SummaryTile label="Pending payout exposure" value={formatMoney(kpis.incentivesPending)} helper={`${activeIncentives.filter((item) => item.status === "pending" || item.status === "approved").length} records`} tone="bg-amber-100 text-amber-700" onClick={() => openModal("incentive")} />
          <SummaryTile label="Conversion ready" value={formatNumber(conversionReadyRecords.length)} helper={`${reviewableConversions.length} need validation`} tone="bg-sky-100 text-sky-700" onClick={() => setStatusFilter("offer")} />
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <TableShell title="Lead qualification lane" description="Live candidate and referral intake with the next stage of work." loading={loading} empty={!leadRecords.length}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.12em] text-slate-9500">
                  <tr><th className="px-5 py-3">Lead</th><th>Source</th><th>Stage</th><th>Score</th><th>Next step</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {leadRecords.slice(0, 6).map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-sky-50/40">
                      <td className="px-5 py-4 font-black text-slate-950">{item.candidate_name}<div className="text-xs font-medium text-slate-500">{item.city || "Not set"} · {item.region || "No region"}</div></td>
                      <td className="font-semibold text-slate-600">{item.source || "Not set"}</td>
                      <td><StatusBadge status={item.stage} /></td>
                      <td className="font-black text-slate-950">{item.evaluation_score}/100</td>
                      <td className="font-semibold text-slate-600">{item.next_step || "Not set"}</td>
                      <td><RowActions actions={[["Open", Eye, () => openModal("recruitment", item)], ["Qualify", BadgeCheck, () => openModal("moveRecruitment", item)], ["Archive", Trash2, () => openArchiveConfirm("recruitment", item.id, item.candidate_name)]]} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableShell>

          <TableShell title="Field missions" description="Execution queue for live territory work, proof, and completion." loading={loading} empty={!openMissions.length}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.12em] text-slate-9500">
                  <tr><th className="px-5 py-3">Mission</th><th>Ambassador</th><th>Status</th><th>Due</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {openMissions.slice(0, 6).map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-sky-50/40">
                      <td className="px-5 py-4 font-black text-slate-950">{item.title}<div className="text-xs font-medium text-slate-500">{item.mission_type || "Field mission"} · {item.city || "No city"}</div></td>
                      <td className="font-semibold text-slate-600">{ambassadorName(item.ambassador_id)}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td className="font-semibold text-slate-600">{shortDate(item.due_date)}</td>
                      <td><RowActions actions={[["Edit", Pencil, () => openModal("mission", item)], ["Complete", CheckCircle2, () => confirmCompleteMission(item)], ["Archive", Trash2, () => openArchiveConfirm("missions", item.id, item.title)]]} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableShell>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <TableShell title="Territory coverage" description="High-level city coverage and assignment density." loading={loading} empty={!activeTerritories.length}>
            <div className="grid gap-3 p-5 md:grid-cols-2">
              {activeTerritories.slice(0, 4).map((item) => (
                <button key={item.id} type="button" onClick={() => openModal("territory", item)} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-sky-300 hover:bg-sky-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-950">{item.name}</div>
                      <div className="mt-1 text-xs font-medium text-slate-500">{item.city || "No city"} · {item.region || "No region"}</div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-white px-3 py-2">
                      <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Active</div>
                      <div className="mt-1 font-black text-slate-950">{item.active_ambassadors_count}</div>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2">
                      <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Goal</div>
                      <div className="mt-1 font-black text-slate-950">{item.coverage_goal}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </TableShell>

          <TableShell title="Recent reports" description="Latest operating exports and governance-ready reporting artifacts." loading={loading} empty={!latestReports.length}>
            <div className="grid gap-3 p-5">
              {latestReports.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-950">{item.title}</div>
                      <div className="mt-1 text-xs font-medium text-slate-500">{item.report_type} · {item.generated_by || "Not set"}</div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ActionButton onClick={() => openModal("report", item)} icon={Eye}>Open</ActionButton>
                    <ActionButton onClick={() => exportCurrentView(item.report_type)} icon={Download}>Export</ActionButton>
                  </div>
                </div>
              ))}
            </div>
          </TableShell>
        </section>
      </div>
    )
  }

  function renderIntelligencePanel() {
    return (
      <div className="sticky top-4 space-y-5">
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Operational intelligence</div>
              <h3 className="mt-2 text-lg font-black tracking-tight text-slate-950">What needs attention now</h3>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white">
              <ShieldCheck size={22} />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-center">
            <div className="grid h-40 w-40 place-items-center rounded-full bg-[conic-gradient(#0f172a_0_72%,#e2e8f0_72%_100%)]">
              <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center shadow-inner">
                <div>
                  <div className="text-3xl font-black tracking-tight text-slate-950">{operationalHealth.score}</div>
                  <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">health</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-2 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="font-semibold text-slate-500">Mission progress</span>
              <span className="font-black text-slate-950">{operationalHealth.missionProgress}%</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="font-semibold text-slate-500">Payout pressure</span>
              <span className="font-black text-slate-950">{operationalHealth.incentivePressure}%</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="font-semibold text-slate-500">Recruitment queue</span>
              <span className="font-black text-slate-950">{leadRecords.length}</span>
            </div>
          </div>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Recommended next actions</div>
          <div className="mt-4 space-y-3">
            {recommendedActions.map((action) => (
              <Link key={action.label} href={journeyTabs.find((tab) => tab.mode === action.mode)?.href || "/market-os/ambassadors"} className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-sky-50">
                <div className="text-sm font-black text-slate-950">{action.label}</div>
                <div className="mt-1 text-xs font-medium leading-5 text-slate-500">{action.description}</div>
              </Link>
            ))}
          </div>
        </section>

        <AuditPanel audit={snapshot.audit} />

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Operating context</div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Current source</div>
              <div className="mt-1 text-sm font-black text-slate-950">{snapshot.diagnostics.length ? "Source de secours" : "Live source"}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Open missions</div>
              <div className="mt-1 text-sm font-black text-slate-950">{activeMissions.filter((item) => item.status !== "completed").length}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Conversion ready</div>
              <div className="mt-1 text-sm font-black text-slate-950">{conversionReadyRecords.length}</div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  function renderModeContent() {
    if (safeMode === "leads") return renderLeads()
    if (safeMode === "conversions") return renderConversions()
    if (safeMode === "resources") return renderResources()
    if (safeMode === "payouts") return renderPayouts()
    if (safeMode === "governance") return renderGovernance()
    if (safeMode === "territories") return renderTerritories()
    if (safeMode === "missions") return renderMissions()
    if (safeMode === "recruitment") return renderRecruitment()
    if (safeMode === "onboarding") return renderOnboarding()
    if (safeMode === "training") return renderTraining()
    if (safeMode === "goals") return renderGoals()
    if (safeMode === "performance") return renderPerformance()
    if (safeMode === "incentives") return renderIncentives()
    if (safeMode === "reports") return renderReports()
    if (safeMode === "settings") return renderSettings()
    return renderAmbassadors()
  }

  function renderLeads() {
    return (
      <div className="grid gap-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="Open leads" value={formatNumber(leadRecords.length)} helper="All live candidate and referral records" tone="bg-sky-100 text-sky-700" onClick={() => setStatusFilter("screening")} />
          <SummaryTile label="Qualified" value={formatNumber(leadRecords.filter((item) => item.stage === "interview" || item.stage === "offer").length)} helper="High-intent leads in motion" tone="bg-emerald-100 text-emerald-700" onClick={() => setStatusFilter("interview")} />
          <SummaryTile label="Conversion ready" value={formatNumber(conversionReadyRecords.length)} helper="Ready for validation or conversion" tone="bg-sky-100 text-sky-700" onClick={() => setStatusFilter("offer")} />
          <SummaryTile label="Rejected" value={formatNumber(leadRecords.filter((item) => item.stage === "rejected").length)} helper="Closed non-fit records" tone="bg-rose-100 text-rose-700" onClick={() => setStatusFilter("rejected")} />
        </section>
        <TableShell title="Lead qualification" description="Candidate and referral pipeline with operational follow-up actions." loading={loading} empty={!leadRecords.length}>
          <DataTable headers={["Lead", "Source", "Stage", "Score", "Next step", "Actions"]}>
            {leadRecords.map((item) => (
              <tr key={item.id} className="border-t border-slate-100 hover:bg-sky-50/40">
                <td className="px-5 py-4 font-black">{item.candidate_name}<div className="text-xs font-medium text-slate-500">{item.city || "Not set"} · {item.region || "No region"}</div></td>
                <td className="font-semibold text-slate-600">{item.source || "Not set"}</td>
                <td><StatusBadge status={item.stage} /></td>
                <td className="font-black">{item.evaluation_score}/100</td>
                <td className="font-semibold text-slate-600">{item.next_step || "Not set"}</td>
                <td><RowActions actions={[["Open", Eye, () => openModal("recruitment", item)], ["Qualify", BadgeCheck, () => openModal("moveRecruitment", item)], ["Archive", Trash2, () => openArchiveConfirm("recruitment", item.id, item.candidate_name)]]} /></td>
              </tr>
            ))}
          </DataTable>
        </TableShell>
      </div>
    )
  }

  function renderConversions() {
    return (
      <div className="grid gap-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="Pending validation" value={formatNumber(reviewableConversions.length)} helper="Lead handoff waiting on approval" tone="bg-amber-100 text-amber-700" onClick={() => setStatusFilter("offer")} />
          <SummaryTile label="Accepted" value={formatNumber(conversionReadyRecords.filter((item) => item.stage === "converted").length)} helper="Validated conversions" tone="bg-emerald-100 text-emerald-700" onClick={() => setStatusFilter("converted")} />
          <SummaryTile label="Rejected" value={formatNumber(leadRecords.filter((item) => item.stage === "rejected").length)} helper="Rejected conversions" tone="bg-rose-100 text-rose-700" onClick={() => setStatusFilter("rejected")} />
          <SummaryTile label="Eligible for incentive" value={formatNumber(conversionReadyRecords.length)} helper="Can be reviewed for payout eligibility" tone="bg-sky-100 text-sky-700" onClick={() => openModal("incentive")} />
        </section>
        <TableShell title="Conversion validation" description="Accept or reject conversions and keep the audit trail clean." loading={loading} empty={!conversionReadyRecords.length}>
          <DataTable headers={["Conversion", "Lead", "Stage", "Score", "Actions"]}>
            {conversionReadyRecords.map((item) => (
              <tr key={item.id} className="border-t border-slate-100 hover:bg-emerald-50/40">
                <td className="px-5 py-4 font-black">{item.candidate_name}<div className="text-xs font-medium text-slate-500">{item.city || "Not set"}</div></td>
                <td className="font-semibold text-slate-600">{item.source || "Not set"}</td>
                <td><StatusBadge status={item.stage} /></td>
                <td className="font-black">{item.evaluation_score}/100</td>
                <td><RowActions actions={[["Validate", CheckCircle2, () => openModal("moveRecruitment", item)], ["Reject", X, () => openModal("moveRecruitment", item)], ["Archive", Trash2, () => openArchiveConfirm("recruitment", item.id, item.candidate_name)]]} /></td>
              </tr>
            ))}
          </DataTable>
        </TableShell>
      </div>
    )
  }

  function renderResources() {
    return (
      <div className="grid gap-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="Approved templates" value={formatNumber(resourceTemplates.filter((item) => item.status === "approved").length)} helper="Operational copy assets ready to use" tone="bg-emerald-100 text-emerald-700" onClick={() => void navigator?.clipboard?.writeText(resourceTemplates[0]?.copyText || "")} />
          <SummaryTile label="Channels covered" value={formatNumber(new Set(resourceTemplates.map((item) => item.channel)).size)} helper="WhatsApp, call, DM and mission proof" tone="bg-sky-100 text-sky-700" onClick={() => openModal("report")} />
          <SummaryTile label="Locked templates" value={formatNumber(resourceTemplates.filter((item) => item.status !== "approved").length)} helper="Need governance review before use" tone="bg-amber-100 text-amber-700" onClick={() => openModal("settings")} />
          <SummaryTile label="Latest version" value="v4.2" helper="Most recent approved operational script" tone="bg-amber-100 text-amber-700" onClick={() => openModal("report")} />
        </section>
        <section className="grid gap-5 xl:grid-cols-2">
          {resourceTemplates.map((template) => (
            <article key={template.id} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{template.channel}</div>
                  <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">{template.title}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">{template.audience}</p>
                </div>
                <StatusBadge status={template.status} />
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">{template.copyText}</div>
              <p className="mt-3 text-xs font-medium leading-5 text-slate-500">{template.guidance}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton onClick={() => void navigator?.clipboard?.writeText(template.copyText)} icon={ClipboardCheck}>Copy text</ActionButton>
                <ActionButton onClick={() => openModal("report")} icon={FileText}>Version log</ActionButton>
              </div>
            </article>
          ))}
        </section>
      </div>
    )
  }

  function renderPayouts() {
    return (
      <div className="grid gap-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="Pending payouts" value={formatNumber(activeIncentives.filter((item) => item.status === "pending" || item.status === "approved").length)} helper="Awaiting finance decision" tone="bg-amber-100 text-amber-700" onClick={() => setStatusFilter("pending")} />
          <SummaryTile label="Paid" value={formatMoney(kpis.incentivesPaid)} helper="Already released to ambassadors" tone="bg-emerald-100 text-emerald-700" onClick={() => setStatusFilter("paid")} />
          <SummaryTile label="Blocked" value={formatNumber(activeIncentives.filter((item) => item.status === "rejected").length)} helper="Suspicious or rejected payouts" tone="bg-rose-100 text-rose-700" onClick={() => setStatusFilter("rejected")} />
          <SummaryTile label="Approval queue" value={formatNumber(activeIncentives.length)} helper="All live incentive records" tone="bg-sky-100 text-sky-700" onClick={() => openModal("incentive")} />
        </section>
        <TableShell title="Payout control" description="Approval, rejection, and payment actions for live incentives." loading={loading} empty={!activeIncentives.length}>
          <DataTable headers={["Ambassador", "Type", "Amount", "Status", "Approved", "Paid", "Actions"]}>
            {activeIncentives.map((item) => (
              <tr key={item.id} className="border-t border-slate-100 hover:bg-amber-50/40">
                <td className="px-5 py-4 font-black">{ambassadorName(item.ambassador_id)}<div className="text-xs font-medium text-slate-500">{item.reason || "No reason"}</div></td>
                <td className="font-semibold text-slate-600">{item.incentive_type.replaceAll("_", " ")}</td>
                <td className="font-black">{formatMoney(item.amount, item.currency)}</td>
                <td><StatusBadge status={item.status} /></td>
                <td className="font-semibold text-slate-600">{item.approved_by || "Not approved"}</td>
                <td className="font-semibold text-slate-600">{shortDate(item.paid_at)}</td>
                <td><RowActions actions={[
                  ["Edit", Pencil, () => openModal("incentive", item)],
                  ["Approve", CheckCircle2, () => confirmIncentive(item, "approveIncentive")],
                  ["Reject", X, () => confirmIncentive(item, "rejectIncentive")],
                  ["Pay", Wallet, () => confirmIncentive(item, "payIncentive")],
                ]} /></td>
              </tr>
            ))}
          </DataTable>
        </TableShell>
      </div>
    )
  }

  function renderGovernance() {
    return (
      <section className="grid gap-5 xl:grid-cols-[1fr_0.7fr]">
        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-black tracking-tight text-slate-950">Module governance</h2>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">Policies, approval rules, and notification controls that keep the ambassador network safe.</p>
            </div>
            <ActionButton onClick={() => openModal("settings")} icon={Settings} variant="primary">Edit settings</ActionButton>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              ["Default region", snapshot.settings?.default_region || "Not set"],
              ["Approval rules", stringifyJson(snapshot.settings?.approval_rules)],
              ["Incentive rules", stringifyJson(snapshot.settings?.incentive_rules)],
              ["Onboarding rules", stringifyJson(snapshot.settings?.onboarding_rules)],
              ["Training rules", stringifyJson(snapshot.settings?.training_rules)],
              ["KPI rules", stringifyJson(snapshot.settings?.kpi_rules)],
              ["Notification rules", stringifyJson(snapshot.settings?.notification_rules)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">{label}</div>
                <pre className="mt-2 whitespace-pre-wrap text-xs font-medium leading-6 text-slate-700">{value}</pre>
              </div>
            ))}
          </div>
        </div>
        <AuditPanel audit={snapshot.audit} />
      </section>
    )
  }

  function renderAmbassadors() {
    return (
      <TableShell title="Ambassadors" description="Live directory records with profile, assignment, edit and archive actions." loading={loading} empty={!filteredAmbassadors.length}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.12em] text-slate-9500">
              <tr><th className="px-5 py-3">Ambassador</th><th>City / Region</th><th>Territory</th><th>Status</th><th>Scores</th><th>Missions</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredAmbassadors.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 hover:bg-sky-50/40">
                  <td className="px-5 py-4"><button type="button" onClick={() => setDetail(item)} className="flex items-center gap-3 text-left"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-xs font-black text-sky-700">{initials(item.full_name)}</span><span><b className="block text-slate-950">{item.full_name}</b><span className="text-xs font-semibold text-slate-9500">{item.email || item.phone || "No contact"}</span></span></button></td>
                  <td className="font-bold text-slate-700">{item.city || "Not set"}<div className="text-xs text-slate-9500">{item.region || "No region"}</div></td>
                  <td className="font-bold text-slate-700">{item.territory_name || "Unassigned"}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td className="font-black">{item.performance_score}/100<div className="text-xs text-slate-9500">KPI {item.kpi_score}/100</div></td>
                  <td className="font-black">{item.missions_completed}/{item.missions_assigned}</td>
                  <td><RowActions actions={[
                    ["View", Eye, () => setDetail(item)],
                    ["Edit", Pencil, () => openModal("ambassador", item)],
                    ["Assign", MapPinned, () => openModal("assignTerritory", item)],
                    ["Archive", Trash2, () => openArchiveConfirm("ambassadors", item.id, item.full_name)],
                  ]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>
    )
  }

  function renderTerritories() {
    return (
      <div className="grid gap-5">
        <div className="grid gap-3 md:grid-cols-3">
          {filteredTerritories.slice(0, 6).map((item) => (
            <button type="button" key={item.id} onClick={() => openModal("territory", item)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-sky-300">
              <div className="flex items-start justify-between"><div><h3 className="font-black">{item.name}</h3><p className="text-sm font-semibold text-slate-9500">{item.city || "No city"} · {item.region || "No region"}</p></div><StatusBadge status={item.status} /></div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-slate-50 p-3"><b>{item.active_ambassadors_count}</b><div className="text-xs font-bold text-slate-9500">Active</div></div><div className="rounded-xl bg-slate-50 p-3"><b>{item.coverage_goal}</b><div className="text-xs font-bold text-slate-9500">Goal</div></div></div>
            </button>
          ))}
        </div>
        <TableShell title="Territory Matrix" description="Coverage, manager and row actions for each live territory." loading={loading} empty={!filteredTerritories.length}>
          <DataTable headers={["Territory", "Region", "Coverage", "Manager", "Status", "Actions"]}>
            {filteredTerritories.map((item) => (
            <tr key={item.id} className="border-t border-slate-100 hover:bg-sky-50/40">
                <td className="px-5 py-4 font-black">{item.name}<div className="text-xs font-semibold text-slate-9500">{item.city || "No city"} · {item.zone || "No zone"}</div></td>
                <td className="font-bold">{item.region || "Not set"}</td>
                <td className="font-black">{item.active_ambassadors_count}/{item.coverage_goal}</td>
                <td className="font-bold">{item.manager_name || "Not set"}</td>
                <td><StatusBadge status={item.status} /></td>
                <td><RowActions actions={[["Edit", Pencil, () => openModal("territory", item)], ["Assign", MapPinned, () => openModal("assignTerritory")], ["Archive", Trash2, () => openArchiveConfirm("territories", item.id, item.name)]]} /></td>
              </tr>
            ))}
          </DataTable>
        </TableShell>
      </div>
    )
  }

  function renderMissions() {
    return (
      <TableShell title="Missions" description="Create, assign, complete and archive field missions." loading={loading} empty={!filteredMissions.length}>
        <DataTable headers={["Mission", "Ambassador", "Priority", "Status", "Due", "Actions"]}>
          {filteredMissions.map((item) => (
            <tr key={item.id} className="border-t border-slate-100 hover:bg-sky-50/40">
              <td className="px-5 py-4 font-black">{item.title}<div className="text-xs font-semibold text-slate-9500">{item.mission_type || "field mission"} · {item.city || "No city"}</div></td>
              <td className="font-bold">{ambassadorName(item.ambassador_id)}</td>
              <td><StatusBadge status={item.priority} /></td>
              <td><StatusBadge status={item.status} /></td>
              <td className="font-bold">{shortDate(item.due_date)}</td>
              <td><RowActions actions={[["Edit", Pencil, () => openModal("mission", item)], ["Complete", CheckCircle2, () => confirmCompleteMission(item)], ["Archive", Trash2, () => openArchiveConfirm("missions", item.id, item.title)]]} /></td>
            </tr>
          ))}
        </DataTable>
      </TableShell>
    )
  }

  function renderRecruitment() {
    return (
      <div className="grid gap-5">
        <section className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
          {recruitmentStages.map((stage) => {
            const count = snapshot.recruitment.filter((item) => item.stage === stage).length
            return <button type="button" key={stage} onClick={() => setStatusFilter(stage)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-sky-300"><div className="text-xl font-black">{count}</div><div className="text-xs font-black capitalize text-slate-9500">{stage.replaceAll("_", " ")}</div></button>
          })}
        </section>
        <TableShell title="Recruitment Pipeline" description="Candidate records with stage movement, edit and archive actions." loading={loading} empty={!filteredRecruitment.length}>
          <DataTable headers={["Candidate", "City", "Source", "Stage", "Score", "Next Step", "Actions"]}>
            {filteredRecruitment.map((item) => (
            <tr key={item.id} className="border-t border-slate-100 hover:bg-sky-50/40">
                <td className="px-5 py-4 font-black">{item.candidate_name}<div className="text-xs font-semibold text-slate-9500">{item.email || item.phone || "No contact"}</div></td>
                <td className="font-bold">{item.city || "Not set"}<div className="text-xs text-slate-9500">{item.region || "No region"}</div></td>
                <td className="font-bold">{item.source || "Not set"}</td>
                <td><StatusBadge status={item.stage} /></td>
                <td className="font-black">{item.evaluation_score}/100</td>
                <td className="font-bold">{item.next_step || "Not set"}</td>
                <td><RowActions actions={[["Edit", Pencil, () => openModal("recruitment", item)], ["Move", ChevronDown, () => openModal("moveRecruitment", item)], ["Archive", Trash2, () => openArchiveConfirm("recruitment", item.id, item.candidate_name)]]} /></td>
              </tr>
            ))}
          </DataTable>
        </TableShell>
      </div>
    )
  }

  function renderOnboarding() {
    return (
      <TableShell title="Onboarding Plans" description="Stage, checklist completion and owner controls." loading={loading} empty={!filteredOnboarding.length}>
        <DataTable headers={["Ambassador", "Stage", "Completion", "Owner", "Due", "Actions"]}>
          {filteredOnboarding.map((item) => (
            <tr key={item.id} className="border-t border-slate-100 hover:bg-sky-50/40">
              <td className="px-5 py-4 font-black">{ambassadorName(item.ambassador_id)}</td>
              <td><StatusBadge status={item.stage} /></td>
              <td className="font-black">{item.completion_rate}%<Progress value={item.completion_rate} /></td>
              <td className="font-bold">{item.assigned_owner || "Not set"}</td>
              <td className="font-bold">{shortDate(item.due_date)}</td>
              <td><RowActions actions={[["Checklist", ClipboardCheck, () => openModal("checklist", item)], ["Edit", Pencil, () => openModal("onboarding", item)], ["Archive", Trash2, () => openArchiveConfirm("onboarding", item.id, ambassadorName(item.ambassador_id))]]} /></td>
            </tr>
          ))}
        </DataTable>
      </TableShell>
    )
  }

  function renderTraining() {
    return (
      <TableShell title="Training & Certification" description="Training assignment, status, scores and validity controls." loading={loading} empty={!filteredTraining.length}>
        <DataTable headers={["Ambassador", "Training", "Status", "Certification", "Score", "Valid Until", "Actions"]}>
          {filteredTraining.map((item) => (
            <tr key={item.id} className="border-t border-slate-100 hover:bg-sky-50/40">
              <td className="px-5 py-4 font-black">{ambassadorName(item.ambassador_id)}</td>
              <td className="font-bold">{item.training_name}<div className="text-xs text-slate-9500">{item.certification_name || "No certification"}</div></td>
              <td><StatusBadge status={item.status} /></td>
              <td><StatusBadge status={item.certification_status || "pending"} /></td>
              <td className="font-black">{item.score}/100</td>
              <td className="font-bold">{shortDate(item.valid_until)}</td>
              <td><RowActions actions={[["Edit", Pencil, () => openModal("training", item)], ["Archive", Trash2, () => openArchiveConfirm("training", item.id, item.training_name)]]} /></td>
            </tr>
          ))}
        </DataTable>
      </TableShell>
    )
  }

  function renderGoals() {
    return (
      <TableShell title="Goals & KPIs" description="Progress tracking, recalculation and archive controls." loading={loading} empty={!filteredGoals.length}>
        <DataTable headers={["Goal", "Ambassador", "Period", "Progress", "Status", "Actions"]}>
          {filteredGoals.map((item) => (
            <tr key={item.id} className="border-t border-slate-100 hover:bg-sky-50/40">
              <td className="px-5 py-4 font-black">{item.goal_type}<div className="text-xs font-semibold text-slate-9500">{item.manager_notes || "No manager note"}</div></td>
              <td className="font-bold">{ambassadorName(item.ambassador_id)}</td>
              <td className="font-bold">{item.period}</td>
              <td className="font-black">{item.current_value}/{item.target_value}<Progress value={item.completion_rate} /></td>
              <td><StatusBadge status={item.status} /></td>
              <td><RowActions actions={[["Edit", Pencil, () => openModal("goal", item)], ["Recalc", RefreshCw, () => void recalculateGoal(item)], ["Archive", Trash2, () => openArchiveConfirm("goals", item.id, item.goal_type)]]} /></td>
            </tr>
          ))}
        </DataTable>
      </TableShell>
    )
  }

  function renderPerformance() {
    return (
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-black">Score Distribution</h2>
          <div className="mt-5 grid place-items-center">
            <div className="grid h-56 w-56 place-items-center rounded-full bg-[conic-gradient(#10b981_0_45%,#3b82f6_45%_78%,#f59e0b_78%_92%,#fb7185_92%_100%)]">
              <div className="grid h-32 w-32 place-items-center rounded-full bg-white text-center"><div><div className="text-4xl font-black">{kpis.kpiCompletion}</div><div className="text-xs font-bold">avg KPI</div></div></div>
            </div>
          </div>
        </section>
        {renderGoals()}
      </div>
    )
  }

  function renderIncentives() {
    return (
      <TableShell title="Incentives" description="Create incentives and control approval, rejection and payment states." loading={loading} empty={!filteredIncentives.length}>
        <DataTable headers={["Ambassador", "Type", "Amount", "Status", "Approved", "Paid", "Actions"]}>
          {filteredIncentives.map((item) => (
            <tr key={item.id} className="border-t border-slate-100 hover:bg-sky-50/40">
              <td className="px-5 py-4 font-black">{ambassadorName(item.ambassador_id)}<div className="text-xs font-semibold text-slate-9500">{item.reason || "No reason"}</div></td>
              <td className="font-bold">{item.incentive_type.replaceAll("_", " ")}</td>
              <td className="font-black">{formatMoney(item.amount, item.currency)}</td>
              <td><StatusBadge status={item.status} /></td>
              <td className="font-bold">{item.approved_by || "Not approved"}</td>
              <td className="font-bold">{shortDate(item.paid_at)}</td>
              <td><RowActions actions={[
                ["Edit", Pencil, () => openModal("incentive", item)],
                ["Approve", CheckCircle2, () => confirmIncentive(item, "approveIncentive")],
                ["Reject", X, () => confirmIncentive(item, "rejectIncentive")],
                ["Pay", Wallet, () => confirmIncentive(item, "payIncentive")],
              ]} /></td>
            </tr>
          ))}
        </DataTable>
      </TableShell>
    )
  }

  function renderReports() {
    return (
      <TableShell title="Reports" description="Persisted report generation history and export actions." loading={loading} empty={!filteredReports.length}>
        <DataTable headers={["Report", "Type", "Status", "Generated By", "Period", "Actions"]}>
          {filteredReports.map((item) => (
            <tr key={item.id} className="border-t border-slate-100 hover:bg-sky-50/40">
              <td className="px-5 py-4 font-black">{item.title}</td>
              <td className="font-bold">{item.report_type}</td>
              <td><StatusBadge status={item.status} /></td>
              <td className="font-bold">{item.generated_by || "Not set"}</td>
              <td className="font-bold">{shortDate(item.period_start)} - {shortDate(item.period_end)}</td>
              <td><RowActions actions={[["Open", Eye, () => openModal("report", item)], ["Export", Download, () => exportCurrentView(item.report_type)], ["Archive", Trash2, () => openArchiveConfirm("reports", item.id, item.title)]]} /></td>
            </tr>
          ))}
        </DataTable>
      </TableShell>
    )
  }

  function renderSettings() {
    const settings = snapshot.settings
    return (
      <section className="grid gap-5 xl:grid-cols-[1fr_0.7fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div><h2 className="font-black">Module Settings</h2><p className="mt-1 text-sm font-semibold text-slate-9500">Persist rules that drive Ambassador module behavior.</p></div>
            <ActionButton onClick={() => openModal("settings")} icon={Settings} variant="primary">Edit Settings</ActionButton>
          </div>
          <div className="mt-5 grid gap-3">
            {[
              ["Default region", settings?.default_region || "Not set"],
              ["Approval rules", stringifyJson(settings?.approval_rules)],
              ["Incentive rules", stringifyJson(settings?.incentive_rules)],
              ["Onboarding rules", stringifyJson(settings?.onboarding_rules)],
              ["Training rules", stringifyJson(settings?.training_rules)],
              ["KPI rules", stringifyJson(settings?.kpi_rules)],
              ["Notification rules", stringifyJson(settings?.notification_rules)],
            ].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-black uppercase text-slate-9500">{label}</div><pre className="mt-2 whitespace-pre-wrap text-xs font-bold text-slate-800">{value}</pre></div>)}
          </div>
        </div>
        <AuditPanel audit={snapshot.audit} />
      </section>
    )
  }

  function renderModal() {
    if (!modal) return null
    const title = modalTitle(modal.kind, Boolean(form.id))
    const saveLabel = modal.kind === "report" ? "Generate & Export" : modal.kind === "assignTerritory" ? "Assign Territory" : "Save"
    const tone = modal.kind === "incentive" || modal.kind === "report" ? "amber" : modal.kind === "settings" || modal.kind === "checklist" || modal.kind === "onboarding" ? "emerald" : modal.kind === "territory" ? "blue" : "slate"
    return (
      <ModalShell
        title={title}
        description={modalDescription(modal.kind)}
        icon={modalIcon(modal.kind)}
        onClose={() => setModal(null)}
        onSave={modal.kind === "report" ? () => void generateReportAndExport() : modal.kind === "checklist" ? () => setModal(null) : () => void saveModal()}
        saving={saving}
        error={error}
        success={success}
        saveLabel={modal.kind === "checklist" ? "Done" : saveLabel}
        tone={tone}
      >
        {modal.kind === "ambassador" ? ambassadorForm() : null}
        {modal.kind === "territory" ? territoryForm() : null}
        {modal.kind === "assignTerritory" ? assignTerritoryForm() : null}
        {modal.kind === "mission" ? missionForm() : null}
        {modal.kind === "recruitment" || modal.kind === "moveRecruitment" ? recruitmentForm(modal.kind === "moveRecruitment") : null}
        {modal.kind === "onboarding" ? onboardingForm() : null}
        {modal.kind === "checklist" ? checklistForm(modal.record as AmbassadorOnboardingRecord) : null}
        {modal.kind === "training" ? trainingForm() : null}
        {modal.kind === "goal" ? goalForm() : null}
        {modal.kind === "incentive" ? incentiveForm() : null}
        {modal.kind === "report" ? reportForm() : null}
        {modal.kind === "settings" ? settingsForm() : null}
      </ModalShell>
    )
  }

  function ambassadorForm() {
    return <div className="grid gap-5"><section className="grid gap-4 md:grid-cols-3"><FieldLabel label="Full name" error={formErrors.full_name}><TextInput value={form.full_name || ""} onChange={(event) => setFormValue("full_name", event.target.value)} placeholder="Ambassador full name" /></FieldLabel><FieldLabel label="Email"><TextInput value={form.email || ""} onChange={(event) => setFormValue("email", event.target.value)} placeholder="name@company.com" /></FieldLabel><FieldLabel label="Phone"><TextInput value={form.phone || ""} onChange={(event) => setFormValue("phone", event.target.value)} placeholder="+212 ..." /></FieldLabel><FieldLabel label="City"><TextInput value={form.city || ""} onChange={(event) => setFormValue("city", event.target.value)} placeholder="Casablanca" /></FieldLabel><FieldLabel label="Region"><TextInput value={form.region || ""} onChange={(event) => setFormValue("region", event.target.value)} placeholder="Casablanca-Settat" /></FieldLabel><FieldLabel label="Role / title"><TextInput value={form.role || ""} onChange={(event) => setFormValue("role", event.target.value)} placeholder="Field ambassador" /></FieldLabel><FieldLabel label="Status"><SelectInput value={form.status || "active"} onChange={(event) => setFormValue("status", event.target.value)}>{["active", "candidate", "inactive", "suspended"].map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></FieldLabel><FieldLabel label="Lifecycle"><SelectInput value={form.lifecycle_stage || "active"} onChange={(event) => setFormValue("lifecycle_stage", event.target.value)}>{["candidate", "onboarding", "trained", "certified", "active", "alumni"].map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></FieldLabel><FieldLabel label="Manager"><TextInput value={form.manager_name || ""} onChange={(event) => setFormValue("manager_name", event.target.value)} placeholder="Regional manager" /></FieldLabel><FieldLabel label="Performance score"><TextInput type="number" value={form.performance_score || "0"} onChange={(event) => setFormValue("performance_score", event.target.value)} /></FieldLabel><FieldLabel label="KPI score"><TextInput type="number" value={form.kpi_score || "0"} onChange={(event) => setFormValue("kpi_score", event.target.value)} /></FieldLabel></section></div>
  }

  function territoryForm() {
    return <section className="grid gap-4 md:grid-cols-3"><FieldLabel label="Name" error={formErrors.name}><TextInput value={form.name || ""} onChange={(event) => setFormValue("name", event.target.value)} placeholder="Central Casablanca" /></FieldLabel><FieldLabel label="City"><TextInput value={form.city || ""} onChange={(event) => setFormValue("city", event.target.value)} /></FieldLabel><FieldLabel label="Region"><TextInput value={form.region || ""} onChange={(event) => setFormValue("region", event.target.value)} /></FieldLabel><FieldLabel label="Zone"><TextInput value={form.zone || ""} onChange={(event) => setFormValue("zone", event.target.value)} /></FieldLabel><FieldLabel label="Coverage goal"><TextInput type="number" value={form.coverage_goal || "0"} onChange={(event) => setFormValue("coverage_goal", event.target.value)} /></FieldLabel><FieldLabel label="Manager"><TextInput value={form.manager_name || ""} onChange={(event) => setFormValue("manager_name", event.target.value)} /></FieldLabel><FieldLabel label="Status"><SelectInput value={form.status || "active"} onChange={(event) => setFormValue("status", event.target.value)}>{["active", "paused", "at_risk"].map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></FieldLabel></section>
  }

  function assignTerritoryForm() {
    return <section className="grid gap-4 md:grid-cols-2"><FieldLabel label="Ambassador" error={formErrors.ambassador_id}><SelectInput value={form.ambassador_id || ""} onChange={(event) => setFormValue("ambassador_id", event.target.value)}><option value="">Choose ambassador</option>{activeAmbassadors.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</SelectInput></FieldLabel><FieldLabel label="Territory" error={formErrors.territory_id}><SelectInput value={form.territory_id || ""} onChange={(event) => setFormValue("territory_id", event.target.value)}><option value="">Choose territory</option>{territories.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.region || "No region"}</option>)}</SelectInput></FieldLabel></section>
  }

  function missionForm() {
    return <section className="grid gap-4 md:grid-cols-3"><FieldLabel label="Mission title" error={formErrors.title}><TextInput value={form.title || ""} onChange={(event) => setFormValue("title", event.target.value)} placeholder="Partner activation sprint" /></FieldLabel><FieldLabel label="Ambassador"><SelectInput value={form.ambassador_id || ""} onChange={(event) => setFormValue("ambassador_id", event.target.value)}><option value="">Unassigned</option>{activeAmbassadors.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</SelectInput></FieldLabel><FieldLabel label="Territory"><SelectInput value={form.territory_id || ""} onChange={(event) => setFormValue("territory_id", event.target.value)}><option value="">No territory</option>{territories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectInput></FieldLabel><FieldLabel label="Type"><TextInput value={form.mission_type || ""} onChange={(event) => setFormValue("mission_type", event.target.value)} /></FieldLabel><FieldLabel label="Priority"><SelectInput value={form.priority || "normal"} onChange={(event) => setFormValue("priority", event.target.value)}>{["low", "normal", "high", "critical"].map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></FieldLabel><FieldLabel label="Status"><SelectInput value={form.status || "assigned"} onChange={(event) => setFormValue("status", event.target.value)}>{missionStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></FieldLabel><FieldLabel label="City"><TextInput value={form.city || ""} onChange={(event) => setFormValue("city", event.target.value)} /></FieldLabel><FieldLabel label="Region"><TextInput value={form.region || ""} onChange={(event) => setFormValue("region", event.target.value)} /></FieldLabel><FieldLabel label="Due date"><TextInput type="date" value={form.due_date || ""} onChange={(event) => setFormValue("due_date", event.target.value)} /></FieldLabel><div className="md:col-span-3"><FieldLabel label="Description"><TextArea value={form.description || ""} onChange={(event) => setFormValue("description", event.target.value)} /></FieldLabel></div><div className="md:col-span-3"><FieldLabel label="Instructions"><TextArea value={form.instructions || ""} onChange={(event) => setFormValue("instructions", event.target.value)} /></FieldLabel></div></section>
  }

  function recruitmentForm(stageOnly: boolean) {
    return <section className="grid gap-4 md:grid-cols-3"><FieldLabel label="Candidate name" error={formErrors.candidate_name}><TextInput disabled={stageOnly} value={form.candidate_name || ""} onChange={(event) => setFormValue("candidate_name", event.target.value)} /></FieldLabel><FieldLabel label="Email"><TextInput disabled={stageOnly} value={form.email || ""} onChange={(event) => setFormValue("email", event.target.value)} /></FieldLabel><FieldLabel label="Phone"><TextInput disabled={stageOnly} value={form.phone || ""} onChange={(event) => setFormValue("phone", event.target.value)} /></FieldLabel><FieldLabel label="City"><TextInput disabled={stageOnly} value={form.city || ""} onChange={(event) => setFormValue("city", event.target.value)} /></FieldLabel><FieldLabel label="Region"><TextInput disabled={stageOnly} value={form.region || ""} onChange={(event) => setFormValue("region", event.target.value)} /></FieldLabel><FieldLabel label="Source"><TextInput disabled={stageOnly} value={form.source || ""} onChange={(event) => setFormValue("source", event.target.value)} /></FieldLabel><FieldLabel label="Stage"><SelectInput value={form.stage || "sourced"} onChange={(event) => setFormValue("stage", event.target.value)}>{recruitmentStages.map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></FieldLabel><FieldLabel label="Evaluation score"><TextInput type="number" disabled={stageOnly} value={form.evaluation_score || "0"} onChange={(event) => setFormValue("evaluation_score", event.target.value)} /></FieldLabel><FieldLabel label="Interviewer"><TextInput disabled={stageOnly} value={form.interviewer || ""} onChange={(event) => setFormValue("interviewer", event.target.value)} /></FieldLabel><div className="md:col-span-3"><FieldLabel label="Next step"><TextInput value={form.next_step || ""} onChange={(event) => setFormValue("next_step", event.target.value)} /></FieldLabel></div><div className="md:col-span-3"><FieldLabel label="Notes"><TextArea value={form.notes || ""} onChange={(event) => setFormValue("notes", event.target.value)} /></FieldLabel></div></section>
  }

  function onboardingForm() {
    return <section className="grid gap-4 md:grid-cols-2"><FieldLabel label="Ambassador" error={formErrors.ambassador_id}><SelectInput value={form.ambassador_id || ""} onChange={(event) => setFormValue("ambassador_id", event.target.value)}><option value="">Choose ambassador</option>{activeAmbassadors.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</SelectInput></FieldLabel><FieldLabel label="Stage"><SelectInput value={form.stage || "not_started"} onChange={(event) => setFormValue("stage", event.target.value)}>{onboardingStages.map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></FieldLabel><FieldLabel label="Owner"><TextInput value={form.assigned_owner || ""} onChange={(event) => setFormValue("assigned_owner", event.target.value)} /></FieldLabel><FieldLabel label="Due date"><TextInput type="date" value={form.due_date || ""} onChange={(event) => setFormValue("due_date", event.target.value)} /></FieldLabel><div className="md:col-span-2"><FieldLabel label="Checklist items"><TextArea value={form.checklist || ""} onChange={(event) => setFormValue("checklist", event.target.value)} /></FieldLabel></div><div className="md:col-span-2"><FieldLabel label="Notes"><TextArea value={form.notes || ""} onChange={(event) => setFormValue("notes", event.target.value)} /></FieldLabel></div></section>
  }

  function checklistForm(record: AmbassadorOnboardingRecord) {
    return <section className="grid gap-3">{record.checklist.length ? record.checklist.map((step: AmbassadorChecklistItem) => <button type="button" key={step.id} disabled={saving} onClick={() => void completeOnboardingStep(record, step)} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-left font-bold hover:border-sky-300"><span>{step.label}</span><StatusBadge status={step.done ? "completed" : "pending"} /></button>) : <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-9500">No checklist items yet. Edit this onboarding plan to add checklist items.</div>}</section>
  }

  function trainingForm() {
    return <section className="grid gap-4 md:grid-cols-3"><FieldLabel label="Ambassador" error={formErrors.ambassador_id}><SelectInput value={form.ambassador_id || ""} onChange={(event) => setFormValue("ambassador_id", event.target.value)}><option value="">Choose ambassador</option>{activeAmbassadors.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</SelectInput></FieldLabel><FieldLabel label="Training name" error={formErrors.training_name}><TextInput value={form.training_name || ""} onChange={(event) => setFormValue("training_name", event.target.value)} /></FieldLabel><FieldLabel label="Certification"><TextInput value={form.certification_name || ""} onChange={(event) => setFormValue("certification_name", event.target.value)} /></FieldLabel><FieldLabel label="Training status"><SelectInput value={form.status || "assigned"} onChange={(event) => setFormValue("status", event.target.value)}>{trainingStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></FieldLabel><FieldLabel label="Certification status"><SelectInput value={form.certification_status || "pending"} onChange={(event) => setFormValue("certification_status", event.target.value)}>{certificationStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></FieldLabel><FieldLabel label="Score"><TextInput type="number" value={form.score || "0"} onChange={(event) => setFormValue("score", event.target.value)} /></FieldLabel><FieldLabel label="Valid until"><TextInput type="date" value={form.valid_until || ""} onChange={(event) => setFormValue("valid_until", event.target.value)} /></FieldLabel><FieldLabel label="Issued by"><TextInput value={form.issued_by || ""} onChange={(event) => setFormValue("issued_by", event.target.value)} /></FieldLabel></section>
  }

  function goalForm() {
    return <section className="grid gap-4 md:grid-cols-3"><FieldLabel label="Ambassador"><SelectInput value={form.ambassador_id || ""} onChange={(event) => setFormValue("ambassador_id", event.target.value)}><option value="">Network goal</option>{activeAmbassadors.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</SelectInput></FieldLabel><FieldLabel label="Period"><TextInput value={form.period || "current"} onChange={(event) => setFormValue("period", event.target.value)} /></FieldLabel><FieldLabel label="Goal type" error={formErrors.goal_type}><TextInput value={form.goal_type || ""} onChange={(event) => setFormValue("goal_type", event.target.value)} /></FieldLabel><FieldLabel label="Target" error={formErrors.target_value}><TextInput type="number" value={form.target_value || "0"} onChange={(event) => setFormValue("target_value", event.target.value)} /></FieldLabel><FieldLabel label="Current"><TextInput type="number" value={form.current_value || "0"} onChange={(event) => setFormValue("current_value", event.target.value)} /></FieldLabel><FieldLabel label="Status"><SelectInput value={form.status || "tracking"} onChange={(event) => setFormValue("status", event.target.value)}>{["tracking", "at_risk", "achieved", "missed"].map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></FieldLabel><div className="md:col-span-3"><FieldLabel label="Manager notes"><TextArea value={form.manager_notes || ""} onChange={(event) => setFormValue("manager_notes", event.target.value)} /></FieldLabel></div></section>
  }

  function incentiveForm() {
    return <section className="grid gap-4 md:grid-cols-3"><FieldLabel label="Ambassador" error={formErrors.ambassador_id}><SelectInput value={form.ambassador_id || ""} onChange={(event) => setFormValue("ambassador_id", event.target.value)}><option value="">Choose ambassador</option>{activeAmbassadors.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</SelectInput></FieldLabel><FieldLabel label="Type"><TextInput value={form.incentive_type || ""} onChange={(event) => setFormValue("incentive_type", event.target.value)} /></FieldLabel><FieldLabel label="Amount" error={formErrors.amount}><TextInput type="number" value={form.amount || "0"} onChange={(event) => setFormValue("amount", event.target.value)} /></FieldLabel><FieldLabel label="Currency"><TextInput value={form.currency || "MAD"} onChange={(event) => setFormValue("currency", event.target.value)} /></FieldLabel><FieldLabel label="Status"><SelectInput value={form.status || "pending"} onChange={(event) => setFormValue("status", event.target.value)}>{incentiveStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></FieldLabel><div className="md:col-span-3"><FieldLabel label="Reason"><TextArea value={form.reason || ""} onChange={(event) => setFormValue("reason", event.target.value)} /></FieldLabel></div></section>
  }

  function reportForm() {
    return <section className="grid gap-4 md:grid-cols-2"><FieldLabel label="Report type" error={formErrors.report_type}><SelectInput value={form.report_type || config.exportType} onChange={(event) => setFormValue("report_type", event.target.value)}>{["ambassadors", "territories", "recruitment", "missions", "goals", "incentives", "performance"].map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></FieldLabel><FieldLabel label="Title"><TextInput value={form.title || ""} onChange={(event) => setFormValue("title", event.target.value)} /></FieldLabel><FieldLabel label="Period start"><TextInput type="date" value={form.period_start || ""} onChange={(event) => setFormValue("period_start", event.target.value)} /></FieldLabel><FieldLabel label="Period end"><TextInput type="date" value={form.period_end || ""} onChange={(event) => setFormValue("period_end", event.target.value)} /></FieldLabel><FieldLabel label="Generated by"><TextInput value={form.generated_by || ""} onChange={(event) => setFormValue("generated_by", event.target.value)} /></FieldLabel></section>
  }

  function settingsForm() {
    return <section className="grid gap-4 md:grid-cols-2"><FieldLabel label="Default region"><TextInput value={form.default_region || ""} onChange={(event) => setFormValue("default_region", event.target.value)} /></FieldLabel>{["approval_rules", "incentive_rules", "onboarding_rules", "training_rules", "kpi_rules", "notification_rules"].map((key) => <FieldLabel key={key} label={key.replaceAll("_", " ")} error={formErrors[key]}><TextArea value={form[key] || "{}"} onChange={(event) => setFormValue(key, event.target.value)} className="min-h-[160px] font-mono text-xs" /></FieldLabel>)}</section>
  }
}

function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.12em] text-slate-9500">
          <tr>{headers.map((header, index) => <th key={header} className={index === 0 ? "px-5 py-3" : "py-3"}>{header}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function RowActions({ actions }: { actions: Array<[string, IconType, () => void]> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(([label, Icon, action]) => (
        <button key={label} type="button" title={label} onClick={action} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black hover:border-sky-300 hover:bg-sky-50">
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  )
}

function Progress({ value }: { value: number }) {
  return (
    <div className="mt-1 h-2 w-28 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-sky-600" style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} />
    </div>
  )
}

function AuditPanel({ audit }: { audit: AmbassadorAuditLog[] }) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-black">Recent Audit Log</h2>
      <div className="mt-4 space-y-3">
        {audit.slice(0, 10).map((item) => (
          <div key={item.id} className="rounded-2xl bg-slate-50 p-3">
            <div className="text-xs font-black text-slate-950">{item.action}</div>
            <div className="mt-1 text-xs font-semibold text-slate-9500">{item.summary || item.entity_type}</div>
          </div>
        ))}
        {!audit.length ? <div className="text-sm font-semibold text-slate-9500">No audit events yet.</div> : null}
      </div>
    </aside>
  )
}

function modalTitle(kind: ModalKind, edit: boolean) {
  const action = edit ? "Edit" : "Create"
  const titles: Record<ModalKind, string> = {
    ambassador: `${action} Ambassador`,
    territory: `${action} Territory`,
    assignTerritory: "Assign Territory",
    mission: `${action} Mission`,
    recruitment: `${action} Recruitment Candidate`,
    moveRecruitment: "Move Recruitment Stage",
    onboarding: `${action} Onboarding Plan`,
    checklist: "Onboarding Checklist",
    training: `${action} Training & Certification`,
    goal: `${action} KPI Goal`,
    incentive: `${action} Incentive`,
    report: "Report Generator",
    settings: "Ambassador Settings",
  }
  return titles[kind]
}

function modalDescription(kind: ModalKind) {
  const descriptions: Record<ModalKind, string> = {
    ambassador: "Create or update the live Ambassador profile.",
    territory: "Configure coverage goals, region ownership and territory status.",
    assignTerritory: "Select one ambassador and one territory. Saving updates the ambassador profile and territory counts.",
    mission: "Create or update mission assignment, priority, due date, status and execution instructions.",
    recruitment: "Create or update candidate contact, source, evaluation and pipeline stage.",
    moveRecruitment: "Move a candidate to the next recruitment stage with notes and next step.",
    onboarding: "Create or update an onboarding plan with owner, due date and checklist.",
    checklist: "Complete or reopen checklist items. Completion updates automatically.",
    training: "Assign training and update certification status, score, validity and issuer.",
    goal: "Create or update measurable KPI goals and current progress.",
    incentive: "Create or update incentive records. Approval and payment require confirmation actions.",
    report: "Generate a report record and export a CSV built from current Ambassador data.",
    settings: "Save module rules for the Ambassador workspace.",
  }
  return descriptions[kind]
}

function modalIcon(kind: ModalKind): IconType {
  const icons: Record<ModalKind, IconType> = {
    ambassador: Users,
    territory: MapPinned,
    assignTerritory: MapPinned,
    mission: ClipboardCheck,
    recruitment: UserPlus,
    moveRecruitment: UserPlus,
    onboarding: ClipboardCheck,
    checklist: CheckCircle2,
    training: GraduationCap,
    goal: Target,
    incentive: Gift,
    report: FileText,
    settings: Settings,
  }
  return icons[kind]
}
