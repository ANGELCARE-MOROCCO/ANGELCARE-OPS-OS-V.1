"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Activity,
  ArrowDownToLine,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Database,
  Edit3,
  Eye,
  FileText,
  Filter,
  Gauge,
  GraduationCap,
  Hotel,
  Link2,
  Mail,
  MapPin,
  MoreHorizontal,
  Network,
  Phone,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Trash2,
  TrendingUp,
  UsersRound,
  WalletCards,
  FileCheck2,
  Handshake,
  HeartPulse,
  Landmark,
  MessageCircle,
  PackageCheck,
  ReceiptText,
  School,
  Send,
  Settings2,
  UploadCloud,
  UserPlus,
  X,
} from "lucide-react"

type Partner = Record<string, any>
type ModalTab = "overview" | "programs" | "contracts" | "offers" | "performance" | "transactions" | "invoices" | "communications" | "documents" | "team" | "activities" | "history"

const typeTabs = ["All Partners", "Preschools & Kindergarten", "Maternity Clinics", "Orthophonistes", "Hotels", "Corporates", "Associations"]
const modalTabs: { key: ModalTab; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: Gauge },
  { key: "programs", label: "Programs", icon: ClipboardCheck },
  { key: "contracts", label: "Contracts", icon: FileText },
  { key: "offers", label: "Offers", icon: Target },
  { key: "performance", label: "Performance", icon: BarChart3 },
  { key: "transactions", label: "Transactions", icon: WalletCards },
  { key: "invoices", label: "Invoices", icon: FileText },
  { key: "communications", label: "Communications", icon: Mail },
  { key: "documents", label: "Documents", icon: Database },
  { key: "team", label: "Team", icon: UsersRound },
  { key: "activities", label: "Activities", icon: Activity },
  { key: "history", label: "History", icon: CalendarDays },
]

const statusOptions = ["target", "qualified", "meeting", "proposal", "agreement", "active", "growth", "risk", "recovery", "inactive", "lost"]
const categoryOptions = ["Education Partner", "Healthcare Partner", "Hospitality Partner", "Corporate Partner", "Association Partner", "Referral Partner", "Strategic Partner"]
const cityOptions = ["Rabat", "Temara", "Casablanca", "Marrakech", "Agadir", "Fes", "Tanger", "Kenitra", "Sale", "Other"]
const ownerOptions = ["BD Officer", "Partnership Manager", "Academy Manager", "Revenue Manager", "CEO", "Operations Lead"]
const contractStatusOptions = ["not_started", "drafting", "sent", "negotiation", "signed", "active", "renewal", "expired", "cancelled"]
const paymentTermsOptions = ["Due on receipt", "Net 7", "Net 15", "Net 30", "Monthly retainer", "Per student", "Per lead", "Revenue share", "Custom"]
const programStatusOptions = ["draft", "active", "paused", "full", "completed", "archived"]
const programPricingOptions = ["Fixed fee", "Per student", "Per session", "Monthly retainer", "Commission", "Revenue share", "Custom"]

const partnerTypeOptions = [
  { kind: "preschool", label: "Preschool & Kindergarten", category: "Education Partner", iconKey: "school", Icon: School, tone: "from-blue-500 to-violet-600" },
  { kind: "maternity", label: "Maternity Clinic", category: "Healthcare Partner", iconKey: "heart", Icon: HeartPulse, tone: "from-pink-500 to-rose-600" },
  { kind: "orthophoniste", label: "Orthophoniste", category: "Healthcare Partner", iconKey: "activity", Icon: Activity, tone: "from-rose-500 to-orange-500" },
  { kind: "hotel", label: "Hotel", category: "Hospitality Partner", iconKey: "hotel", Icon: Hotel, tone: "from-cyan-500 to-blue-600" },
  { kind: "corporate", label: "Corporate", category: "Corporate Partner", iconKey: "building", Icon: Building2, tone: "from-emerald-500 to-teal-600" },
  { kind: "association", label: "Association", category: "Association Partner", iconKey: "network", Icon: Network, tone: "from-violet-500 to-fuchsia-600" },
  { kind: "finance", label: "Finance / Sponsor", category: "Strategic Partner", iconKey: "landmark", Icon: Landmark, tone: "from-amber-500 to-orange-600" },
  { kind: "strategic", label: "Strategic Alliance", category: "Strategic Partner", iconKey: "handshake", Icon: Handshake, tone: "from-indigo-500 to-sky-600" },
]

const iconOptions = [
  { key: "school", label: "Academy", Icon: School, tone: "from-blue-500 to-violet-600" },
  { key: "graduation", label: "Training", Icon: GraduationCap, tone: "from-violet-500 to-blue-600" },
  { key: "heart", label: "Care", Icon: HeartPulse, tone: "from-pink-500 to-rose-600" },
  { key: "activity", label: "Therapy", Icon: Activity, tone: "from-rose-500 to-orange-500" },
  { key: "hotel", label: "Hotel", Icon: Hotel, tone: "from-cyan-500 to-blue-600" },
  { key: "building", label: "Corporate", Icon: Building2, tone: "from-emerald-500 to-teal-600" },
  { key: "network", label: "Network", Icon: Network, tone: "from-violet-500 to-fuchsia-600" },
  { key: "landmark", label: "Sponsor", Icon: Landmark, tone: "from-amber-500 to-orange-600" },
  { key: "handshake", label: "Alliance", Icon: Handshake, tone: "from-indigo-500 to-sky-600" },
  { key: "briefcase", label: "Business", Icon: BriefcaseBusiness, tone: "from-slate-500 to-slate-700" },
]

function money(value: unknown) {
  const n = Number(value || 0)
  if (n >= 1000000) return `MAD ${(n / 1000000).toFixed(2)}M`
  return `MAD ${n.toLocaleString("en-US")}`
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function textValue(value: unknown, fallback = "—") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function arrayValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  if (typeof value === "string" && value.trim()) return value.split(/[;,|]/).map((item) => item.trim()).filter(Boolean)
  return []
}

function formatDate(value: unknown) {
  if (!value) return "—"
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function kindLabel(kind: unknown) {
  const value = String(kind || "preschool").toLowerCase()
  if (value.includes("maternity")) return "Maternity Clinic"
  if (value.includes("ortho")) return "Orthophoniste"
  if (value.includes("hotel")) return "Hotel"
  if (value.includes("corporate")) return "Corporate"
  if (value.includes("association")) return "Association"
  if (value.includes("preschool") || value.includes("kindergarten") || value.includes("school")) return "Preschool & Kindergarten"
  return textValue(kind, "Preschool & Kindergarten")
}

function typeOption(kindOrLabel: unknown) {
  const value = String(kindOrLabel || "preschool").toLowerCase()
  return partnerTypeOptions.find((item) => value.includes(item.kind) || value.includes(item.label.toLowerCase().split(" ")[0])) || partnerTypeOptions[0]
}

function extractIconKey(row: Partner) {
  const raw = row.raw && typeof row.raw === "object" ? row.raw : row
  const fromDirect = textValue(row.type_icon || row.icon_key || raw.type_icon || raw.icon_key, "")
  if (fromDirect) return fromDirect
  const tagIcon = arrayValue(row.tags || raw.tags).find((tag) => tag.startsWith("icon:"))
  if (tagIcon) return tagIcon.replace("icon:", "")
  return typeOption(row.kind || row.type || raw.kind).iconKey
}

function iconOption(iconKey: unknown, fallbackKind?: unknown) {
  const key = String(iconKey || "").toLowerCase()
  return iconOptions.find((item) => item.key === key) || iconOptions.find((item) => item.key === typeOption(fallbackKind).iconKey) || iconOptions[0]
}

function safeJson(value: unknown, fallback: any) {
  if (Array.isArray(value) || (value && typeof value === "object")) return value
  if (typeof value === "string" && value.trim()) {
    try { return JSON.parse(value) } catch { return fallback }
  }
  return fallback
}

function defaultProgramDetails(programs: string[]) {
  const list = programs.length ? programs : ["AngelCare Partner Program"]
  return list.map((name, index) => ({
    name,
    status: index === 0 ? "active" : "draft",
    pricing_model: index === 0 ? "Per student" : "Fixed fee",
    price_mad: index === 0 ? 25000 : 0,
    participants_capacity: index === 0 ? 60 : 0,
    start_date: "",
    end_date: "",
    owner: "Academy Manager",
    offer_scope: "Training, sourcing, partnership activation and reporting",
    success_metric: "Enrollments, revenue, satisfaction and renewal potential",
  }))
}

function normalize(partner: Partner): Partner {
  const raw = partner.raw && typeof partner.raw === "object" ? partner.raw : partner
  const kind = textValue(partner.kind || raw.kind, "preschool").toLowerCase()
  const type = textValue(partner.type, kind.includes("maternity") ? "Maternity Clinic" : kind.includes("ortho") ? "Orthophoniste" : kind.includes("hotel") ? "Hotel" : kind.includes("corporate") ? "Corporate" : kind.includes("association") ? "Association" : "Preschool & Kindergarten")
  const value = numberValue(partner.value_mad ?? partner.revenueImpact ?? partner.pipeline_value ?? raw.value_mad ?? raw.pipeline_value, 0)
  return {
    ...partner,
    raw,
    id: String(partner.id || raw.id),
    source: partner.source || (String(partner.id || "").startsWith("prospect-") ? "prospect" : "partner"),
    source_id: partner.source_id || raw.id || String(partner.id || "").replace(/^prospect-/, ""),
    name: textValue(partner.name || raw.name || raw.company || raw.organization || raw.title, "Unnamed record"),
    organization: textValue(partner.organization || raw.organization || raw.company || raw.name, "—"),
    contact_name: textValue(partner.contact_name || raw.contact_name || raw.decision_maker || partner.contact, ""),
    email: textValue(partner.email || raw.email, ""),
    phone: textValue(partner.phone || raw.phone || raw.whatsapp, ""),
    website: textValue(partner.website || raw.website || raw.url, ""),
    type,
    kind,
    type_icon: extractIconKey(partner),
    category: textValue(partner.category || raw.category, type.includes("Preschool") ? "Education" : type.includes("Clinic") || type.includes("Ortho") ? "Healthcare" : type.includes("Hotel") ? "Hospitality" : "Partnership"),
    city: textValue(partner.city || raw.city || raw.location, "—"),
    district: textValue(partner.district || raw.district || raw.area || raw.neighborhood, ""),
    status: textValue(partner.status || raw.status || raw.stage, "target").toLowerCase(),
    owner: textValue(partner.owner || raw.owner || raw.assignee, "BD Officer"),
    programs: arrayValue(partner.programs || raw.programs || raw.assigned_programs || raw.program_names),
    program_details: safeJson(partner.program_details || raw.program_details || raw.offer_parameters || raw.program_settings, []),
    offer_parameters: safeJson(partner.offer_parameters || raw.offer_parameters, []),
    pricing_parameters: safeJson(partner.pricing_parameters || raw.pricing_parameters, {}),
    management_controls: safeJson(partner.management_controls || raw.management_controls, {}),
    value_mad: value,
    revenueImpact: value,
    probability: numberValue(partner.probability ?? raw.probability, 0),
    health_score: numberValue(partner.health_score ?? partner.engagement ?? raw.health_score ?? raw.score, 0),
    engagement: numberValue(partner.engagement ?? partner.health_score ?? raw.health_score ?? raw.score, 0),
    referral_potential: numberValue(partner.referral_potential ?? raw.referral_potential, 0),
    joinedOn: partner.joinedOn || raw.joined_on || raw.created_at,
    updated_at: partner.updated_at || raw.updated_at,
    summary: textValue(partner.summary || partner.context || raw.context || raw.notes || raw.description, "Synced live from Revenue Command Center source of truth."),
    next_action: textValue(partner.next_action || raw.next_action, "Review next partnership step."),
  }
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[28px] border border-white/15 bg-[linear-gradient(145deg,rgba(18,30,54,.98),rgba(7,13,28,.99))] text-white shadow-[0_24px_90px_rgba(0,0,0,.32)] ${className}`}>{children}</section>
}

function Kpi({ icon: Icon, label, value, delta, tone = "violet" }: { icon: any; label: string; value: string | number; delta: string; tone?: string }) {
  const tones: Record<string, string> = {
    violet: "from-violet-500 to-blue-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-500",
    cyan: "from-cyan-500 to-blue-500",
  }
  return (
    <Card className="min-h-[124px] p-5">
      <div className="flex items-center gap-4">
        <span className={`flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br ${tones[tone] || tones.violet} shadow-lg`}>
          <Icon className="h-7 w-7 text-white" />
        </span>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">{label}</p>
          <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-white">{value}</p>
          <p className="mt-2 text-xs font-black text-emerald-200">↑ {delta} live sync</p>
        </div>
      </div>
    </Card>
  )
}

function TypeBadge({ type }: { type: string }) {
  const palette: Record<string, string> = {
    "Preschool & Kindergarten": "bg-blue-500/20 text-blue-100 border-blue-300/25",
    "Maternity Clinic": "bg-pink-500/20 text-pink-100 border-pink-300/25",
    Orthophoniste: "bg-rose-500/20 text-rose-100 border-rose-300/25",
    Hotel: "bg-cyan-500/20 text-cyan-100 border-cyan-300/25",
    Corporate: "bg-emerald-500/20 text-emerald-100 border-emerald-300/25",
    Association: "bg-violet-500/20 text-violet-100 border-violet-300/25",
  }
  return <span className={`rounded-xl border px-3 py-1 text-xs font-black ${palette[type] || "bg-white/10 text-white border-white/15"}`}>{type}</span>
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const cls = normalized.includes("active") || normalized.includes("growth") ? "border-emerald-300/25 bg-emerald-500/20 text-emerald-100" : normalized.includes("risk") || normalized.includes("lost") || normalized.includes("inactive") ? "border-rose-300/25 bg-rose-500/20 text-rose-100" : normalized.includes("proposal") || normalized.includes("agreement") ? "border-cyan-300/25 bg-cyan-500/20 text-cyan-100" : "border-amber-300/25 bg-amber-500/20 text-amber-100"
  return <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black capitalize ${cls}`}><span className="h-2 w-2 rounded-full bg-current" />{status}</span>
}

function PartnerAvatar({ partner, size = "md" }: { partner: Partner; size?: "md" | "lg" }) {
  const picked = iconOption(partner.type_icon, partner.kind || partner.type)
  const Icon = picked.Icon
  const box = size === "lg" ? "h-28 w-28 rounded-[30px]" : "h-14 w-14 rounded-[24px]"
  const icon = size === "lg" ? "h-16 w-16" : "h-7 w-7"
  return <div className={`flex ${box} shrink-0 items-center justify-center bg-gradient-to-br ${picked.tone} shadow-lg`}><Icon className={`${icon} text-white`} /></div>
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"><p className="text-sm font-black text-white/70">{label}</p><div className="text-right text-sm font-black text-white">{value || "—"}</div></div>
}

function Input({ label, value, onChange, type = "text", placeholder = "" }: { label: string; value: any; onChange: (value: any) => void; type?: string; placeholder?: string }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/65">{label}</span><input type={type} value={value ?? ""} onChange={(event) => onChange(type === "number" ? Number(event.target.value) : event.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-violet-300/60 focus:ring-4 focus:ring-violet-500/10 placeholder:text-white/35" /></label>
}

function TextArea({ label, value, onChange, rows = 4 }: { label: string; value: any; onChange: (value: string) => void; rows?: number }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/65">{label}</span><textarea rows={rows} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="w-full resize-none rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-violet-300/60 focus:ring-4 focus:ring-violet-500/10" /></label>
}

function SelectField({ label, value, onChange, options, className = "" }: { label: string; value: any; onChange: (value: string) => void; options: string[] | { value: string; label: string }[]; className?: string }) {
  const normalized = options.map((option) => typeof option === "string" ? { value: option, label: option.replace(/_/g, " ") } : option)
  return (
    <label className={`block rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 ${className}`}>
      <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-white/45">{label}</span>
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full bg-transparent text-sm font-black capitalize text-white outline-none">
        {normalized.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>
  )
}

function TypeAndIconPicker({ kind, iconKey, onKind, onIcon }: { kind: string; iconKey: string; onKind: (value: string) => void; onIcon: (value: string) => void }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Partner type & icon</p>
          <p className="mt-1 text-sm font-bold text-white/45">Controls the visual identity everywhere in the Partnerships directory.</p>
        </div>
        <PartnerAvatar partner={{ kind, type_icon: iconKey, type: kindLabel(kind) }} size="md" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {partnerTypeOptions.map((option) => {
          const Icon = option.Icon
          const active = kind === option.kind
          return (
            <button key={option.kind} type="button" onClick={() => { onKind(option.kind); onIcon(option.iconKey) }} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${active ? "border-violet-300/60 bg-violet-500/20" : "border-white/10 bg-[#070d1c] hover:bg-white/[0.06]"}`}>
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${option.tone}`}><Icon className="h-5 w-5 text-white" /></span>
              <span><span className="block text-sm font-black text-white">{option.label}</span><span className="block text-xs font-bold text-white/45">{option.category}</span></span>
            </button>
          )
        })}
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {iconOptions.map((option) => {
          const Icon = option.Icon
          const active = iconKey === option.key
          return <button key={option.key} type="button" title={option.label} onClick={() => onIcon(option.key)} className={`flex h-12 items-center justify-center rounded-2xl border ${active ? "border-cyan-300/60 bg-cyan-500/20" : "border-white/10 bg-[#070d1c] hover:bg-white/[0.06]"}`}><Icon className="h-5 w-5 text-white" /></button>
        })}
      </div>
    </div>
  )
}

function EditableField({ label, value, onChange, type = "text", className = "" }: { label: string; value: any; onChange: (value: any) => void; type?: string; className?: string }) {
  return (
    <label className={`block rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 ${className}`}>
      <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-white/45">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(type === "number" ? Number(event.target.value) : event.target.value)}
        className="mt-1 w-full bg-transparent text-sm font-black text-white outline-none placeholder:text-white/25"
        placeholder="—"
      />
    </label>
  )
}

function MiniMetric({ icon: Icon, label, value, caption, tone = "violet" }: { icon: any; label: string; value: ReactNode; caption: string; tone?: string }) {
  const tones: Record<string, string> = {
    violet: "from-violet-500/25 to-blue-500/20 text-violet-100 border-violet-300/20",
    emerald: "from-emerald-500/20 to-teal-500/15 text-emerald-100 border-emerald-300/20",
    amber: "from-amber-500/20 to-orange-500/15 text-amber-100 border-amber-300/20",
    rose: "from-rose-500/20 to-pink-500/15 text-rose-100 border-rose-300/20",
    cyan: "from-cyan-500/20 to-blue-500/15 text-cyan-100 border-cyan-300/20",
  }
  return (
    <div className={`rounded-[24px] border bg-gradient-to-br p-5 shadow-[0_18px_60px_rgba(0,0,0,.18)] ${tones[tone] || tones.violet}`}>
      <div className="flex items-center justify-between gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><Icon className="h-5 w-5" /></span>
        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">{label}</span>
      </div>
      <div className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">{value}</div>
      <p className="mt-2 text-xs font-bold text-white/55">{caption}</p>
    </div>
  )
}

function PartnerEditModal({ partner, onClose, onSaved }: { partner: Partner; onClose: () => void; onSaved: (rows: Partner[]) => void }) {
  const [tab, setTab] = useState<ModalTab>("overview")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [programCatalog, setProgramCatalog] = useState<any[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const isNew = partner.id === "new"

  function initialForm(row: Partner) {
    const nextIsNew = row.id === "new"
    const basePrograms = arrayValue(row.programs)
    const baseContacts = safeJson(row.partner_contacts || row.raw?.partner_contacts, []) as any[]
    const contacts = baseContacts.length ? baseContacts : [
      { name: nextIsNew ? "" : row.contact_name || "", role: "Primary contact", email: row.email || "", phone: row.phone || "", access: "Partner admin" },
    ]
    return {
      ...row,
      name: nextIsNew ? "" : row.name,
      organization: nextIsNew ? "" : row.organization,
      contact_name: nextIsNew ? "" : row.contact_name,
      email: nextIsNew ? "" : row.email,
      phone: nextIsNew ? "" : row.phone,
      website: nextIsNew ? "" : row.website,
      city: nextIsNew ? "" : row.city,
      district: nextIsNew ? "" : row.district,
      owner: nextIsNew ? "" : row.owner,
      programs_text: basePrograms.join("\n"),
      documents_text: arrayValue(row.documents || row.raw?.documents).join("\n"),
      tags_text: arrayValue(row.tags || row.raw?.tags).filter((tag) => !String(tag).startsWith("icon:")).join(", "),
      type_icon: extractIconKey(row),
      partner_contacts: contacts,
      partner_contacts_text: JSON.stringify(contacts, null, 2),
      linked_programs: safeJson(row.linked_programs || row.raw?.linked_programs, basePrograms),
      linked_contracts: safeJson(row.linked_contracts || row.raw?.linked_contracts, []),
      linked_offers: safeJson(row.linked_offers || row.raw?.linked_offers, []),
      transactions: safeJson(row.transactions || row.raw?.transactions, []),
      invoices: safeJson(row.invoices || row.raw?.invoices, []),
      communications: safeJson(row.communications || row.raw?.communications, []),
      team_members: safeJson(row.team_members || row.raw?.team_members, contacts),
      activity_log: safeJson(row.activity_log || row.raw?.activity_log, []),
      contract_checklist: safeJson(row.contract_checklist || row.raw?.contract_checklist, ["Commercial offer approved", "Legal terms reviewed", "Partner contact validated", "Payment terms confirmed", "Signed PDF attached"]),
      contract_checklist_done: safeJson(row.contract_checklist_done || row.raw?.contract_checklist_done, []),
      program_details_text: JSON.stringify(safeJson(row.program_details || row.raw?.program_details, defaultProgramDetails(basePrograms)), null, 2),
      offer_parameters_text: JSON.stringify(safeJson(row.offer_parameters || row.raw?.offer_parameters, []), null, 2),
      pricing_parameters_text: JSON.stringify(safeJson(row.pricing_parameters || row.raw?.pricing_parameters, { model: "Per student", currency: "MAD", billing_cycle: "monthly" }), null, 2),
      management_controls_text: JSON.stringify(safeJson(row.management_controls || row.raw?.management_controls, { approval_required: true, documents_required: ["contract", "offer"], auto_review_days: 30 }), null, 2),
    }
  }

  const [form, setForm] = useState<Partner>(() => initialForm(partner))

  useEffect(() => { setForm(initialForm(partner)) }, [partner])

  useEffect(() => {
    let mounted = true
    async function loadPrograms() {
      setCatalogLoading(true)
      try {
        const res = await fetch("/api/revenue-command-center/partnership-programs", { cache: "no-store" })
        const json = await res.json().catch(() => ({}))
        const records = Array.isArray(json.programs) ? json.programs : Array.isArray(json.records) ? json.records : Array.isArray(json.data) ? json.data : Array.isArray(json.data?.programs) ? json.data.programs : []
        if (mounted) setProgramCatalog(records)
      } catch {
        if (mounted) setProgramCatalog([])
      } finally {
        if (mounted) setCatalogLoading(false)
      }
    }
    loadPrograms()
    return () => { mounted = false }
  }, [])

  function patch(key: string, value: any) { setForm((current) => ({ ...current, [key]: value })) }
  function jsonArray(key: string, fallback: any[] = []) { const value = safeJson(form[key], fallback); return Array.isArray(value) ? value : fallback }
  function jsonObject(key: string, fallback: Record<string, any> = {}) { const value = safeJson(form[key], fallback); return value && typeof value === "object" && !Array.isArray(value) ? value : fallback }
  function setJson(key: string, value: any) { patch(key, value) }
  function updateArray(key: string, updater: (rows: any[]) => any[]) { setForm((current) => ({ ...current, [key]: updater(Array.isArray(current[key]) ? current[key] : safeJson(current[key], [])) })) }
  function toggleArrayObject(key: string, item: any, idKey = "id") {
    updateArray(key, (rows) => rows.some((row) => String(row[idKey] || row.name || row.title) === String(item[idKey] || item.name || item.title)) ? rows.filter((row) => String(row[idKey] || row.name || row.title) !== String(item[idKey] || item.name || item.title)) : [...rows, item])
  }

  const catalogPrograms = programCatalog.map((program, index) => {
    const id = String(program.id || program.program_id || program.slug || program.name || program.title || `program-${index}`)
    const name = textValue(program.name || program.title || program.program_name, `Partnership Program ${index + 1}`)
    return { ...program, id, name, status: textValue(program.status || program.stage, "active"), price_mad: numberValue(program.price_mad || program.price || program.fee_mad || program.value_mad, 0), category: textValue(program.category || program.type, "Partnership Program") }
  })
  const selectedPrograms = jsonArray("linked_programs", []).map((row: any) => typeof row === "string" ? { id: row, name: row, status: "active", price_mad: 0 } : row)
  const selectedProgramNames = selectedPrograms.map((p: any) => textValue(p.name || p.title || p.id, "Program"))
  const syntheticPrograms = selectedPrograms.length ? selectedPrograms : (String(form.programs_text || "").split(/\n|,|;/).map((name) => name.trim()).filter(Boolean).map((name) => ({ id: name, name, status: "active", price_mad: 0 })))
  const contractCatalog = (catalogPrograms.length ? catalogPrograms : syntheticPrograms).flatMap((program: any, index: number) => {
    const contracts = safeJson(program.contracts || program.contract_details || program.contract_templates, []) as any[]
    if (contracts.length) return contracts.map((contract, cIndex) => ({ ...contract, id: String(contract.id || `${program.id}-contract-${cIndex}`), name: textValue(contract.name || contract.title, `${program.name} Contract`), program_name: program.name, value_mad: numberValue(contract.value_mad || contract.amount_mad || program.price_mad, 0), status: textValue(contract.status, "drafting") }))
    return [{ id: `${program.id || index}-master-contract`, name: `${program.name} Partnership Contract`, program_name: program.name, value_mad: numberValue(program.price_mad, 0), status: "drafting", payment_terms: form.payment_terms || "Net 15" }]
  })
  const offerCatalog = (catalogPrograms.length ? catalogPrograms : syntheticPrograms).flatMap((program: any, index: number) => {
    const offers = safeJson(program.offers || program.offer_parameters || program.products || program.product_offers, []) as any[]
    if (offers.length) return offers.map((offer, oIndex) => ({ ...offer, id: String(offer.id || `${program.id}-offer-${oIndex}`), name: textValue(offer.name || offer.title || offer.offer_name, `${program.name} Offer`), program_name: program.name, price_mad: numberValue(offer.price_mad || offer.price || program.price_mad, 0), scope: textValue(offer.scope || offer.description || offer.offer_scope, "Program offer") }))
    return [{ id: `${program.id || index}-core-offer`, name: `${program.name} Core Offer`, program_name: program.name, price_mad: numberValue(program.price_mad, 0), scope: "Training, sourcing, activation, partner reporting" }]
  })
  const selectedContracts = jsonArray("linked_contracts", [])
  const selectedOffers = jsonArray("linked_offers", [])
  const contacts = jsonArray("partner_contacts", [])
  const team = jsonArray("team_members", contacts)
  const docs = String(form.documents_text || "").split(/\n|;|\|/).map((item) => item.trim()).filter(Boolean)
  const tags = String(form.tags_text || "").split(/,|;/).map((item) => item.trim()).filter(Boolean)
  const programDetails = safeJson(form.program_details_text, defaultProgramDetails(selectedProgramNames)) as any[]
  const pricingParameters = safeJson(form.pricing_parameters_text, {}) as Record<string, any>
  const selectedType = typeOption(form.kind || partner.kind)
  const health = Math.max(0, Math.min(100, numberValue(form.health_score || form.engagement, isNew ? 0 : 72)))
  const engagement = Math.max(0, Math.min(100, numberValue(form.engagement || form.health_score, health)))
  const performance = Math.max(0, Math.min(100, numberValue(form.performance, Math.round((health + numberValue(form.probability, 45)) / 2))))
  const compliance = Math.max(0, Math.min(100, numberValue(form.compliance, isNew ? 0 : 90)))
  const satisfaction = Math.max(0, Math.min(100, numberValue(form.satisfaction, Math.max(0, health - 3))))
  const partnerName = textValue(form.name, isNew ? "New Partner" : partner.name)
  const partnerType = selectedType.label
  const checklistDone = jsonArray("contract_checklist_done", [])

  function saveContacts(next: any[]) { patch("partner_contacts", next); patch("partner_contacts_text", JSON.stringify(next, null, 2)); patch("team_members", next) }
  function addContact() { saveContacts([...contacts, { name: "", role: "New contact", email: "", phone: "", access: "Viewer" }]) }
  function removeContact(index: number) { saveContacts(contacts.filter((_, i) => i !== index)) }
  function updateContact(index: number, field: string, value: any) { saveContacts(contacts.map((contact, i) => i === index ? { ...contact, [field]: value } : contact)) }

  async function save() {
    setSaving(true); setError("")
    try {
      const payload = {
        ...form,
        name: textValue(form.name, "New AngelCare partnership"),
        organization: textValue(form.organization || form.name, "B2B Partner"),
        programs: selectedPrograms.length ? selectedPrograms.map((p: any) => textValue(p.name || p.title || p.id, "Program")) : String(form.programs_text || "").split(/\n|,|;/).map((item) => item.trim()).filter(Boolean),
        documents: docs,
        tags: [`icon:${String(form.type_icon || extractIconKey(form))}`, ...tags.filter((tag) => !tag.startsWith("icon:"))],
        type_icon: String(form.type_icon || extractIconKey(form)),
        partner_contacts: contacts,
        linked_programs: selectedPrograms,
        linked_contracts: selectedContracts,
        linked_offers: selectedOffers,
        transactions: jsonArray("transactions", []),
        invoices: jsonArray("invoices", []),
        communications: jsonArray("communications", []),
        team_members: team,
        activity_log: jsonArray("activity_log", []),
        contract_checklist: jsonArray("contract_checklist", []),
        contract_checklist_done: checklistDone,
        program_details: programDetails,
        offer_parameters: selectedOffers,
        pricing_parameters: pricingParameters,
        management_controls: safeJson(form.management_controls_text, {}),
        summary: form.summary || form.context,
        context: form.context || form.summary,
      }
      const res = await fetch("/api/revenue-command-center/partnerships/enterprise", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: isNew ? "create" : "save", partnerId: isNew ? "" : partner.id, source: isNew ? "partner" : partner.source, sourceId: isNew ? "" : partner.source_id, payload }) })
      const json = await res.json()
      if (!res.ok || json.ok === false) throw new Error(json.error || "Unable to save partner record")
      onSaved(Array.isArray(json.partners) ? json.partners : [])
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError))
    } finally { setSaving(false) }
  }

  const overviewActivities = [
    { title: "Live profile synced", detail: `${partnerName} refreshed from partnerships source of truth`, age: "now", tone: "emerald" },
    { title: "Programs mapped", detail: `${selectedPrograms.length || syntheticPrograms.length} linked program workspace item(s)`, age: "live", tone: "violet" },
    { title: "Contracts prepared", detail: `${selectedContracts.length} selected contract file(s) and checklist controls`, age: "live", tone: "cyan" },
    { title: "Offers available", detail: `${selectedOffers.length || offerCatalog.length} program offer/product card(s)`, age: "live", tone: "amber" },
  ]

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 p-0 text-white backdrop-blur-2xl">
      <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,.22),transparent_34%),linear-gradient(180deg,#0d1327,#050914)]">
        <header className="sticky top-0 z-[10000] border-b border-white/10 bg-[#070b16]/95 px-5 py-4 backdrop-blur-xl lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3 text-sm font-black text-white/70"><span>Partners</span><ChevronRight className="h-4 w-4" /><span className="truncate text-white">{partnerName}</span><StatusBadge status={String(form.status || "target")} /></div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setTab("team")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-white hover:bg-white/[0.1]"><UsersRound className="h-4 w-4" />Share Access</button>
              <button type="button" onClick={() => setTab("overview")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-white hover:bg-white/[0.1]"><Eye className="h-4 w-4" />Partner View</button>
              <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_18px_60px_rgba(79,70,229,.4)] disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "Saving Live..." : isNew ? "Save Partner" : "Save Changes"}</button>
              <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-white hover:bg-white/[0.1]"><X className="h-5 w-5" /></button>
            </div>
          </div>
          {error ? <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-100">{error}</div> : null}
        </header>

        <main className="mx-auto max-w-[1780px] space-y-5 p-5 lg:p-8">
          <section className="grid gap-5 xl:grid-cols-[1.55fr_.55fr]">
            <Card className="p-6"><div className="grid gap-6 lg:grid-cols-[140px_1fr_360px]"><div className="flex items-start justify-center lg:justify-start"><PartnerAvatar partner={{ ...form, type: partnerType }} size="lg" /></div><div className="space-y-4"><div className="grid gap-3 md:grid-cols-[1fr_220px]"><EditableField label="Partner name" value={form.name} onChange={(v) => patch("name", v)} /><SelectField label="Status" value={form.status || "target"} onChange={(v) => patch("status", v)} options={statusOptions} /></div><div className="grid gap-3 md:grid-cols-[1fr_220px]"><SelectField label="Category" value={form.category || selectedType.category} onChange={(v) => patch("category", v)} options={categoryOptions} /><SelectField label="Owner" value={form.owner || "BD Officer"} onChange={(v) => patch("owner", v)} options={ownerOptions} /></div><TypeAndIconPicker kind={form.kind || selectedType.kind} iconKey={form.type_icon || selectedType.iconKey} onKind={(v) => { const next = typeOption(v); patch("kind", v); patch("category", next.category); }} onIcon={(v) => patch("type_icon", v)} /><TextArea label="Partner positioning / business summary" value={form.summary || form.context} onChange={(v) => { patch("summary", v); patch("context", v) }} rows={3} /><div className="grid gap-3 md:grid-cols-5"><SelectField label="City" value={form.city || "Rabat"} onChange={(v) => patch("city", v)} options={cityOptions} /><EditableField label="District" value={form.district} onChange={(v) => patch("district", v)} /><EditableField label="Email" value={form.email} onChange={(v) => patch("email", v)} /><EditableField label="Phone" value={form.phone} onChange={(v) => patch("phone", v)} /><EditableField label="Website" value={form.website} onChange={(v) => patch("website", v)} /></div></div><div className="grid content-start gap-3"><InfoRow label="Partner Since" value={formatDate(form.joinedOn || form.created_at || new Date().toISOString())} /><InfoRow label="Partner ID" value={String(form.source_id || "NEW-PARTNER")} /><InfoRow label="Account Manager" value={form.owner || "BD Officer"} /><InfoRow label="Linked Programs" value={selectedPrograms.length || syntheticPrograms.length} /><InfoRow label="Contracts" value={selectedContracts.length} /></div></div></Card>
            <Card className="p-6"><div className="flex items-center justify-between"><h3 className="text-lg font-black text-white">Partner Health Score</h3><span className="rounded-xl border border-emerald-300/20 bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-100">{health >= 85 ? "Excellent" : health >= 65 ? "Good" : health >= 40 ? "Watch" : "Needs setup"}</span></div><div className="mt-6 grid gap-6 md:grid-cols-[170px_1fr] xl:grid-cols-1 2xl:grid-cols-[170px_1fr]"><div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full border-[10px] border-emerald-400/80 bg-emerald-500/5 shadow-[inset_0_0_50px_rgba(16,185,129,.12)]"><div className="text-center"><p className="text-5xl font-black text-emerald-200">{health}</p><p className="text-xs font-black text-white/55">/100</p></div></div><div className="space-y-3">{[["Engagement", engagement], ["Performance", performance], ["Compliance", compliance], ["Satisfaction", satisfaction]].map(([label, value]) => <div key={String(label)}><div className="flex justify-between text-xs font-black text-white/70"><span>{label}</span><span>{value}/100</span></div><div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-emerald-400" style={{ width: `${value}%` }} /></div></div>)}</div></div><button type="button" onClick={() => setTab("performance")} className="mt-5 text-sm font-black text-violet-200">View Health Details</button></Card>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6"><MiniMetric icon={WalletCards} label="Total Revenue" value={money(form.value_mad)} caption="live commercial impact" tone="violet" /><MiniMetric icon={ShieldCheck} label="Linked Programs" value={selectedPrograms.length || syntheticPrograms.length} caption="saved program mapping" tone="cyan" /><MiniMetric icon={FileCheck2} label="Contracts" value={selectedContracts.length} caption="selected contract layer" tone="emerald" /><MiniMetric icon={PackageCheck} label="Offers" value={selectedOffers.length} caption="product/offer cards" tone="amber" /><MiniMetric icon={UsersRound} label="Contacts" value={contacts.length} caption="free contact management" tone="emerald" /><MiniMetric icon={CalendarDays} label="Partner Since" value={formatDate(form.joinedOn || form.created_at || new Date().toISOString())} caption="source timestamp" tone="rose" /></section>

          <Card className="overflow-hidden p-0">
            <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-4 pt-3">{modalTabs.map((item) => { const Icon = item.icon; return <button key={item.key} onClick={() => setTab(item.key)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition ${tab === item.key ? "border-violet-400 text-violet-100" : "border-transparent text-white/55 hover:text-white"}`}><Icon className="h-4 w-4" />{item.label}</button> })}</div>
            <div className="p-5">
              {tab === "overview" ? <div className="grid gap-5 xl:grid-cols-[1fr_1fr_.85fr]"><section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><div className="flex items-center justify-between"><h3 className="text-lg font-black">Live Partner Snapshot</h3><button onClick={() => setTab("programs")} className="text-sm font-black text-violet-200">Manage programs <ChevronRight className="inline h-4 w-4" /></button></div><div className="mt-5 grid gap-3 md:grid-cols-2"><InfoRow label="Source" value={form.source === "prospect" ? "Revenue prospect" : "Active partner"} /><InfoRow label="Owner" value={form.owner || "BD Officer"} /><InfoRow label="Status" value={<StatusBadge status={String(form.status || "target")} />} /><InfoRow label="Next action" value={form.next_action || "Review next step"} /></div><TextArea label="Live notes / summary" value={form.notes || form.summary || form.context} onChange={(v) => { patch("notes", v); patch("summary", v); patch("context", v) }} rows={5} /></section><section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><h3 className="text-lg font-black">Recent Live Activities</h3><div className="mt-5 space-y-4">{overviewActivities.map((activity) => <div key={activity.title} className="flex gap-3"><span className={`mt-1 h-3 w-3 rounded-full ${activity.tone === "emerald" ? "bg-emerald-400" : activity.tone === "amber" ? "bg-amber-400" : activity.tone === "cyan" ? "bg-cyan-400" : "bg-violet-400"}`} /><div className="flex-1"><div className="flex justify-between gap-3"><p className="font-black text-white">{activity.title}</p><p className="text-xs font-bold text-white/45">{activity.age}</p></div><p className="mt-1 text-sm font-bold text-white/55">{activity.detail}</p></div></div>)}</div><button onClick={() => setTab("activities")} className="mt-5 text-sm font-black text-violet-200">Open activities <ChevronRight className="inline h-4 w-4" /></button></section><aside className="space-y-5"><section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><div className="flex items-center justify-between"><h3 className="text-lg font-black">Partner Contacts</h3><button type="button" onClick={addContact} className="rounded-xl border border-violet-300/30 bg-violet-600/20 px-3 py-2 text-xs font-black text-violet-100"><Plus className="mr-1 inline h-3 w-3" />Add</button></div><div className="mt-5 space-y-4">{contacts.map((contact: any, index: number) => <div key={index} className="rounded-2xl border border-white/10 bg-[#0b1224] p-4"><div className="flex items-center justify-between gap-3"><p className="font-black text-white">Contact {index + 1}</p><button type="button" onClick={() => removeContact(index)} className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs font-black text-rose-100"><Trash2 className="h-4 w-4" /></button></div><div className="mt-3 grid gap-3"><EditableField label="Name" value={contact.name || ""} onChange={(v) => updateContact(index, "name", v)} /><EditableField label="Role" value={contact.role || ""} onChange={(v) => updateContact(index, "role", v)} /><EditableField label="Email" value={contact.email || ""} onChange={(v) => updateContact(index, "email", v)} /><EditableField label="Phone" value={contact.phone || ""} onChange={(v) => updateContact(index, "phone", v)} /></div></div>)}</div></section></aside></div> : null}

              {tab === "programs" ? <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]"><section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-black">Saved Programs Library</h3><p className="mt-1 text-sm font-bold text-white/50">Select one or multiple programs already saved in the partnerships submodule.</p></div><span className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/65">{catalogLoading ? "Loading live..." : `${catalogPrograms.length} saved programs`}</span></div><div className="mt-5 grid gap-3">{(catalogPrograms.length ? catalogPrograms : defaultProgramDetails(["Little Learners Excellence Program", "Parent Engagement Workshops", "Partner Referral Sprint"])).map((program: any, index: number) => { const id = String(program.id || program.name || index); const active = selectedPrograms.some((p: any) => String(p.id || p.name) === id || String(p.name) === String(program.name)); return <button type="button" key={id} onClick={() => toggleArrayObject("linked_programs", { id, name: program.name, status: program.status || "active", price_mad: numberValue(program.price_mad, 0), category: program.category || "Program", raw: program })} className={`rounded-2xl border p-4 text-left transition ${active ? "border-emerald-300/50 bg-emerald-500/15" : "border-white/10 bg-[#0b1224] hover:bg-white/[0.06]"}`}><div className="flex items-center justify-between gap-3"><div><p className="font-black text-white">{program.name}</p><p className="mt-1 text-xs font-bold text-white/50">{program.category || "Program"} · {program.status || "active"}</p></div><span className="font-black text-white">{money(program.price_mad || 0)}</span></div></button> })}</div></section><section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><div className="flex items-center justify-between"><h3 className="text-xl font-black">Program Controls</h3><button type="button" onClick={() => patch("linked_programs", [])} className="text-xs font-black text-rose-200">Clear all</button></div><div className="mt-5 space-y-3">{selectedPrograms.length ? selectedPrograms.map((program: any, index: number) => <div key={`${program.name}-${index}`} className="rounded-2xl border border-violet-300/15 bg-violet-500/10 p-4"><div className="flex items-center justify-between"><p className="font-black text-white">{program.name}</p><button type="button" onClick={() => updateArray("linked_programs", (rows) => rows.filter((_, i) => i !== index))} className="text-rose-200"><Trash2 className="h-4 w-4" /></button></div><div className="mt-3 grid gap-3 md:grid-cols-2"><SelectField label="Status" value={program.status || "active"} onChange={(v) => updateArray("linked_programs", (rows) => rows.map((row, i) => i === index ? { ...row, status: v } : row))} options={programStatusOptions} /><EditableField label="Partner capacity" type="number" value={program.capacity || 0} onChange={(v) => updateArray("linked_programs", (rows) => rows.map((row, i) => i === index ? { ...row, capacity: v } : row))} /></div></div>) : <p className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm font-bold text-amber-100">No program linked yet. Select saved programs from the library.</p>}</div></section></div> : null}

              {tab === "contracts" ? <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]"><section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><h3 className="text-xl font-black">Live Contract Selector</h3><p className="mt-2 text-sm font-bold text-white/55">Contracts are generated from saved programs and their contract details, then linked to this partner.</p><div className="mt-5 grid gap-3">{contractCatalog.map((contract: any) => { const active = selectedContracts.some((row: any) => String(row.id || row.name) === String(contract.id || contract.name)); return <button type="button" key={String(contract.id || contract.name)} onClick={() => toggleArrayObject("linked_contracts", contract)} className={`rounded-2xl border p-4 text-left ${active ? "border-cyan-300/50 bg-cyan-500/15" : "border-white/10 bg-[#0b1224] hover:bg-white/[0.06]"}`}><div className="flex items-center justify-between gap-3"><div><p className="font-black text-white">{contract.name}</p><p className="text-xs font-bold text-white/45">{contract.program_name} · {contract.status}</p></div><span className="font-black text-white">{money(contract.value_mad || 0)}</span></div></button> })}</div></section><section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><h3 className="text-xl font-black">Contract Checklist</h3><div className="mt-5 space-y-3">{jsonArray("contract_checklist", []).map((item: string, index: number) => { const done = checklistDone.includes(item); return <button key={item} type="button" onClick={() => patch("contract_checklist_done", done ? checklistDone.filter((x: string) => x !== item) : [...checklistDone, item])} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${done ? "border-emerald-300/30 bg-emerald-500/15 text-emerald-100" : index < 2 ? "border-amber-300/25 bg-amber-500/10 text-amber-100" : "border-white/10 bg-[#0b1224] text-white"}`}><CheckCircle2 className="h-5 w-5" /><span className="font-black">{item}</span></button> })}</div><div className="mt-5 grid gap-3"><EditableField label="Contract value MAD" type="number" value={form.contract_value_mad || form.value_mad} onChange={(v) => patch("contract_value_mad", v)} /><SelectField label="Payment terms" value={form.payment_terms || "Net 15"} onChange={(v) => patch("payment_terms", v)} options={paymentTermsOptions} /></div></section></div> : null}

              {tab === "offers" ? <div className="grid gap-5 xl:grid-cols-[1fr_.9fr]"><section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><h3 className="text-xl font-black">Saved Offers & Products</h3><p className="mt-2 text-sm font-bold text-white/55">Select offer cards fetched from saved program products and pricing rules.</p><div className="mt-5 grid gap-3 md:grid-cols-2">{offerCatalog.map((offer: any) => { const active = selectedOffers.some((row: any) => String(row.id || row.name) === String(offer.id || offer.name)); return <button key={String(offer.id || offer.name)} type="button" onClick={() => toggleArrayObject("linked_offers", offer)} className={`rounded-[22px] border p-4 text-left ${active ? "border-violet-300/50 bg-violet-500/15" : "border-white/10 bg-[#0b1224] hover:bg-white/[0.06]"}`}><PackageCheck className="h-5 w-5 text-violet-200" /><p className="mt-3 font-black text-white">{offer.name}</p><p className="mt-1 text-xs font-bold text-white/50">{offer.program_name}</p><p className="mt-3 text-lg font-black text-white">{money(offer.price_mad || 0)}</p></button> })}</div></section><section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><h3 className="text-xl font-black">Elite Offer Preview</h3><div className="mt-5 space-y-3">{(selectedOffers.length ? selectedOffers : offerCatalog.slice(0, 3)).map((offer: any, index: number) => <div key={index} className="rounded-[24px] border border-violet-300/20 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,.28),transparent_40%),#0b1224] p-5"><div className="flex items-center justify-between"><p className="text-lg font-black text-white">{offer.name}</p><span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-100">Synced</span></div><p className="mt-2 text-sm font-bold text-white/60">{offer.scope || offer.description || "Saved product offer linked to partner program."}</p><p className="mt-4 text-2xl font-black text-white">{money(offer.price_mad || 0)}</p></div>)}</div><div className="mt-5 grid gap-3"><SelectField label="Pricing model" value={pricingParameters.model || "Per student"} onChange={(v) => patch("pricing_parameters_text", JSON.stringify({ ...pricingParameters, model: v }, null, 2))} options={programPricingOptions} /><SelectField label="Billing cycle" value={pricingParameters.billing_cycle || "monthly"} onChange={(v) => patch("pricing_parameters_text", JSON.stringify({ ...pricingParameters, billing_cycle: v }, null, 2))} options={["one_time", "weekly", "monthly", "quarterly", "yearly", "custom"]} /></div></section></div> : null}

              {tab === "performance" ? <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><h3 className="text-xl font-black">Performance Command Controls</h3><div className="mt-5 grid gap-3 md:grid-cols-2"><EditableField label="Health score" type="number" value={form.health_score} onChange={(v) => patch("health_score", v)} /><EditableField label="Engagement" type="number" value={form.engagement} onChange={(v) => patch("engagement", v)} /><EditableField label="Performance" type="number" value={form.performance} onChange={(v) => patch("performance", v)} /><EditableField label="Satisfaction" type="number" value={form.satisfaction} onChange={(v) => patch("satisfaction", v)} /><EditableField label="Compliance" type="number" value={form.compliance} onChange={(v) => patch("compliance", v)} /><EditableField label="Referral potential" type="number" value={form.referral_potential} onChange={(v) => patch("referral_potential", v)} /></div></section><section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><h3 className="text-xl font-black">Live Trend Board</h3><div className="mt-8 h-64 rounded-3xl border border-white/10 bg-white/[0.03] p-6"><div className="flex h-full items-end gap-4">{[62, 76, 68, 82, 75, 92, health].map((v, i) => <div key={i} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-2xl bg-gradient-to-t from-violet-600 to-blue-400" style={{ height: `${Math.max(8, v)}%` }} /><span className="text-xs font-bold text-white/45">M{i + 1}</span></div>)}</div></div></section></div> : null}

              {tab === "transactions" ? <ManagementList title="Transactions" icon={WalletCards} rows={jsonArray("transactions", [])} onRows={(rows) => patch("transactions", rows)} fields={["title", "amount_mad", "status", "date"]} defaults={{ title: "New transaction", amount_mad: 0, status: "pending", date: new Date().toISOString().slice(0, 10) }} /> : null}
              {tab === "invoices" ? <ManagementList title="Invoices" icon={ReceiptText} rows={jsonArray("invoices", [])} onRows={(rows) => patch("invoices", rows)} fields={["title", "amount_mad", "status", "due_date"]} defaults={{ title: "New invoice", amount_mad: 0, status: "draft", due_date: new Date().toISOString().slice(0, 10) }} /> : null}
              {tab === "communications" ? <ManagementList title="Communications" icon={MessageCircle} rows={jsonArray("communications", [])} onRows={(rows) => patch("communications", rows)} fields={["channel", "title", "status", "date"]} defaults={{ channel: "Email", title: "Partner follow-up", status: "planned", date: new Date().toISOString().slice(0, 10) }} /> : null}
              {tab === "documents" ? <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]"><section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><h3 className="text-xl font-black">Documents Control</h3><TextArea label="Document URLs / titles — one per line" value={form.documents_text} onChange={(v) => patch("documents_text", v)} rows={9} /><button type="button" onClick={() => patch("documents_text", `${form.documents_text || ""}\nNew partnership document.pdf`.trim())} className="mt-4 rounded-2xl bg-rose-500/20 px-4 py-3 font-black text-rose-100"><UploadCloud className="mr-2 inline h-4 w-4" />Register Document</button></section><section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><h3 className="text-xl font-black">Synced Files</h3><div className="mt-4 space-y-3">{(docs.length ? docs : ["Partnership Agreement 2025.pdf", "Program Report Q1 2025.pdf", "Certificate of Insurance.pdf"]).map((doc) => <div key={doc} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1224] p-4"><FileText className="h-5 w-5 text-rose-200" /><div><p className="font-black text-white">{doc}</p><p className="text-xs font-bold text-white/45">Live document record</p></div></div>)}</div></section></div> : null}
              {tab === "team" ? <ManagementList title="Team Access" icon={UsersRound} rows={team} onRows={(rows) => { patch("team_members", rows); patch("partner_contacts", rows) }} fields={["name", "role", "email", "access"]} defaults={{ name: "New member", role: "Partner coordinator", email: "", access: "Viewer" }} /> : null}
              {tab === "activities" ? <ManagementList title="Activities" icon={Activity} rows={jsonArray("activity_log", overviewActivities)} onRows={(rows) => patch("activity_log", rows)} fields={["title", "detail", "status", "date"]} defaults={{ title: "New activity", detail: "", status: "open", date: new Date().toISOString().slice(0, 10) }} /> : null}
              {tab === "history" ? <div className="grid gap-5 xl:grid-cols-[1fr_.75fr]"><section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><h3 className="text-xl font-black">History & Audit</h3><div className="mt-5 space-y-3">{["Created from source of truth", "Partner data normalized", "Programs / contracts / offers mapped", "Latest live save"].map((item,index) => <div key={item} className="rounded-2xl border border-white/10 bg-[#0b1224] p-4"><p className="font-black text-white">{item}</p><p className="text-xs font-bold text-white/45">{index === 0 ? formatDate(form.joinedOn || form.created_at) : index === 3 ? "On next save" : "Synced from partnerships submodule"}</p></div>)}</div></section><section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><h3 className="text-xl font-black">Management Controls</h3><TextArea label="Advanced controls" value={form.management_controls_text} onChange={(v) => patch("management_controls_text", v)} rows={12} /></section></div> : null}
            </div>
          </Card>

          <section className="grid gap-5 xl:grid-cols-[1fr_.75fr]"><Card className="p-5"><h3 className="text-xl font-black">Revenue Overview</h3><div className="mt-7 flex h-56 items-end gap-4">{[60, 118, 138, 110, 152, 126, 148, 132, 168, 151, 139, 180].map((v, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-2xl bg-gradient-to-t from-violet-600 to-violet-300" style={{ height: `${v / 2}%` }} /><span className="text-xs font-bold text-white/40">{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index]}</span></div>)}</div></Card><Card className="p-5"><div className="flex items-center justify-between"><h3 className="text-xl font-black">Tags & Files</h3><button onClick={() => setTab("documents")} className="text-sm font-black text-violet-200">Manage</button></div><div className="mt-4 flex flex-wrap gap-2">{(tags.length ? tags : ["High Performer", partnerType, String(form.status || "Active"), form.city || "Rabat"]).map((tag) => <span key={tag} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white/75">{tag}</span>)}</div><div className="mt-5"><EditableField label="Tags" value={form.tags_text} onChange={(v) => patch("tags_text", v)} /></div></Card></section>
        </main>
      </div>
    </div>
  )
}

function ManagementList({ title, icon: Icon, rows, onRows, fields, defaults }: { title: string; icon: any; rows: any[]; onRows: (rows: any[]) => void; fields: string[]; defaults: Record<string, any> }) {
  const list = Array.isArray(rows) ? rows : []
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_.7fr]">
      <section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-black"><Icon className="mr-2 inline h-5 w-5 text-violet-200" />{title}</h3><p className="mt-1 text-sm font-bold text-white/50">Add, edit, delete, then save partner to sync this control layer.</p></div><button type="button" onClick={() => onRows([...list, defaults])} className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white"><Plus className="mr-2 inline h-4 w-4" />Add</button></div>
        <div className="mt-5 space-y-4">{list.length ? list.map((row, index) => <div key={index} className="rounded-[22px] border border-white/10 bg-[#0b1224] p-4"><div className="flex items-center justify-between"><p className="font-black text-white">{row.title || row.name || `${title} ${index + 1}`}</p><button type="button" onClick={() => onRows(list.filter((_, i) => i !== index))} className="rounded-xl border border-rose-300/30 bg-rose-500/10 p-2 text-rose-100"><Trash2 className="h-4 w-4" /></button></div><div className="mt-3 grid gap-3 md:grid-cols-2">{fields.map((field) => <EditableField key={field} label={field.replace(/_/g, " ")} value={row[field] || ""} onChange={(v) => onRows(list.map((item, i) => i === index ? { ...item, [field]: v } : item))} />)}</div></div>) : <p className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm font-bold text-amber-100">No saved {title.toLowerCase()} yet. Add the first one and save.</p>}</div>
      </section>
      <section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><h3 className="text-xl font-black">Smart Preview</h3><div className="mt-5 space-y-3">{(list.length ? list : [defaults]).map((row, index) => <div key={index} className="rounded-[22px] border border-violet-300/20 bg-violet-500/10 p-4"><p className="font-black text-white">{row.title || row.name || `${title} preview`}</p><p className="mt-1 text-sm font-bold text-white/55">{fields.map((field) => row[field]).filter(Boolean).slice(0, 3).join(" · ") || "Ready to configure"}</p></div>)}</div></section>
    </div>
  )
}


function PartnerProfilePanel({ partner, onEdit, onDelete }: { partner: Partner; onEdit: () => void; onDelete: () => void }) {
  return (
    <aside className="sticky top-6 h-fit rounded-[34px] border border-white/15 bg-[linear-gradient(145deg,rgba(18,30,54,.98),rgba(8,16,31,.99))] p-6 text-white shadow-2xl">
      <div className="flex items-start gap-4">
        <PartnerAvatar partner={partner} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3"><h3 className="text-2xl font-black leading-7 text-white">{partner.name}</h3><StatusBadge status={partner.status} /></div>
          <p className="mt-2 text-sm font-bold text-white/80">{partner.type}</p>
          <p className="text-xs font-bold text-white/55">{partner.category} • {partner.source === "prospect" ? "Prospect source" : "Partner source"}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-5 gap-3">
        {[{ icon: Mail, value: partner.email }, { icon: Phone, value: partner.phone }, { icon: MapPin, value: partner.city }, { icon: Link2, value: partner.website }, { icon: MoreHorizontal, value: "" }].map(({ icon: Icon, value }, index) => (
          <button key={index} title={String(value || "Action")} className="rounded-2xl border border-white/15 bg-white/[0.07] p-3 hover:bg-violet-600/40"><Icon className="mx-auto h-5 w-5 text-white" /></button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"><p className="text-[10px] font-black uppercase tracking-[.18em] text-white/50">Impact</p><p className="mt-2 text-xl font-black">{money(partner.value_mad)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"><p className="text-[10px] font-black uppercase tracking-[.18em] text-white/50">Health</p><p className="mt-2 text-xl font-black">{partner.health_score}%</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"><p className="text-[10px] font-black uppercase tracking-[.18em] text-white/50">Programs</p><p className="mt-2 text-xl font-black">{partner.programs.length}</p></div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-white/15 pb-4 text-sm font-black text-white">
        {['Overview', 'Programs', 'Performance', 'Documents'].map((tab, index) => <span key={tab} className={`shrink-0 rounded-2xl px-4 py-2 ${index === 0 ? 'bg-violet-600 text-white' : 'bg-white/[0.06] text-white/70'}`}>{tab}</span>)}
      </div>

      <div className="mt-6 space-y-6">
        <section><h4 className="text-sm font-black uppercase tracking-[0.18em] text-white/80">Partner Information</h4><div className="mt-4 space-y-3"><InfoRow label="Contact" value={partner.contact_name || partner.owner} /><InfoRow label="Email" value={partner.email} /><InfoRow label="Phone" value={partner.phone} /><InfoRow label="Location" value={`${partner.city}${partner.district ? `, ${partner.district}` : ""}`} /><InfoRow label="Website" value={partner.website} /><InfoRow label="Joined" value={formatDate(partner.joinedOn)} /><InfoRow label="Owner" value={partner.owner} /></div></section>
        <section><h4 className="text-sm font-black uppercase tracking-[0.18em] text-white/80">Business Summary</h4><p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-bold leading-6 text-white/85">{partner.summary}</p></section>
        <section><h4 className="text-sm font-black uppercase tracking-[0.18em] text-white/80">Programs ({partner.programs.length})</h4><div className="mt-3 space-y-3">{partner.programs.length ? partner.programs.map((program: string, i: number) => <div key={`${program}-${i}`} className="rounded-2xl border border-white/15 bg-white/[0.07] p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-white">{program}</p><span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-100">Active</span></div><p className="mt-1 text-xs font-bold text-white/60">Synced program assignment</p></div>) : <p className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm font-bold text-amber-100">No program attached yet. Use Edit Partner to map offers.</p>}</div></section>
        <section><h4 className="text-sm font-black uppercase tracking-[0.18em] text-white/80">Next Action</h4><p className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4 text-sm font-bold leading-6 text-cyan-50">{partner.next_action}</p></section>
        <div className="grid grid-cols-2 gap-3"><button onClick={onEdit} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-300/30 bg-violet-600/35 px-4 py-4 text-sm font-black text-white hover:bg-violet-600"><Edit3 className="h-4 w-4" />Edit Partner</button><button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-4 text-sm font-black text-white hover:bg-white/[0.12]"><Eye className="h-4 w-4" />View Profile</button></div>
        <button onClick={onDelete} className="w-full rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-4 text-sm font-black text-red-100 hover:bg-red-500/20"><Trash2 className="mr-2 inline h-4 w-4" />Delete Partner</button>
      </div>
    </aside>
  )
}

type PartnersDirectoryWorkspaceProps = {
  partners?: Partner[]
  programs?: any[]
  onClose?: () => void
  onRefresh?: () => Promise<void> | void
}

export default function PartnersDirectoryWorkspace({ partners = [], programs = [], onClose, onRefresh }: PartnersDirectoryWorkspaceProps) {
  const [liveRows, setLiveRows] = useState<Partner[]>(() => partners.map(normalize))
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState("All Partners")
  const [statusFilter, setStatusFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [selectedId, setSelectedId] = useState("")
  const [editing, setEditing] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { setLiveRows(partners.map(normalize)) }, [partners])

  // Keep these optional page-level props accepted for the Partnerships page integration.
  // `programs` can be passed by the parent page without breaking TypeScript, while the
  // edit modal still refreshes the saved programs catalog live from the API.
  const syncedProgramsCount = Array.isArray(programs) ? programs.length : 0
  const hasPageCloseControl = typeof onClose === "function"


  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch("/api/revenue-command-center/partnerships/enterprise", { cache: "no-store" })
      const json = await res.json()
      setLiveRows(Array.isArray(json.partners) ? json.partners.map(normalize) : [])
      await onRefresh?.()
    } finally {
      setLoading(false)
    }
  }

  async function deleteSelected(partner: Partner) {
    if (partner.source === "prospect") return setEditing(partner)
    if (!window.confirm(`Delete ${partner.name}? This removes the active partnership record.`)) return
    const res = await fetch("/api/revenue-command-center/partnerships/enterprise", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", partnerId: partner.id, source: partner.source, sourceId: partner.source_id, payload: { name: partner.name } }) })
    const json = await res.json()
    if (json.ok) setLiveRows(Array.isArray(json.partners) ? json.partners.map(normalize) : [])
  }

  const rows = useMemo(() => liveRows.map(normalize), [liveRows])
  const cities = useMemo(() => Array.from(new Set(rows.map((p) => p.city).filter(Boolean))).sort(), [rows])

  const filtered = useMemo(() => {
    let next = rows
    if (activeTab !== "All Partners") next = next.filter((p) => activeTab.includes(p.type) || p.type.includes(activeTab.replace(/s$/, "")) || activeTab.includes(p.category))
    if (statusFilter !== "all") next = next.filter((p) => String(p.status).toLowerCase() === statusFilter)
    if (cityFilter !== "all") next = next.filter((p) => p.city === cityFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      next = next.filter((p) => [p.name, p.organization, p.contact_name, p.email, p.phone, p.type, p.category, p.city, p.owner, p.status].join(" ").toLowerCase().includes(q))
    }
    return next
  }, [rows, activeTab, statusFilter, cityFilter, query])

  const selected = useMemo(() => filtered.find((p) => p.id === selectedId) || rows.find((p) => p.id === selectedId) || filtered[0] || rows[0], [filtered, rows, selectedId])
  const totalRevenue = rows.reduce((sum, p) => sum + numberValue(p.value_mad), 0)
  const activePartners = rows.filter((p) => ["active", "growth"].includes(String(p.status))).length
  const avgEngagement = Math.round(rows.reduce((sum, p) => sum + numberValue(p.health_score), 0) / Math.max(1, rows.length))
  const totalPrograms = rows.reduce((sum, p) => sum + arrayValue(p.programs).length, 0)
  const riskCount = rows.filter((p) => ["risk", "recovery", "inactive", "lost"].includes(String(p.status)) || numberValue(p.health_score) < 45).length

  return (
    <div className="w-full space-y-7 text-white">
      {editing ? <PartnerEditModal partner={editing} onClose={() => setEditing(null)} onSaved={(newRows) => { setLiveRows(newRows.map(normalize)); void onRefresh?.() }} /> : null}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><h1 className="text-4xl font-black tracking-[-0.05em] text-white">Partners Directory</h1><p className="mt-2 text-sm font-bold text-white/75">Browse, manage, edit, and sync live prospects and active partners from Revenue Command Center.</p></div>
        <div className="flex flex-wrap gap-3"><span className="hidden rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white/50 lg:inline-flex">{syncedProgramsCount} synced programs</span><button onClick={refresh} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3 text-sm font-black text-white hover:bg-white/[0.12]"><RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh Live</button>{hasPageCloseControl ? <button onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3 text-sm font-black text-white hover:bg-white/[0.12]"><X className="h-4 w-4" />Close</button> : null}<button onClick={() => setEditing({ id: "new", source: "partner", source_id: "new", name: "", organization: "", contact_name: "", email: "", phone: "", website: "", city: "", district: "", owner: "", status: "target", kind: "preschool", category: "Education Partner", type: "Preschool & Kindergarten", programs: [], value_mad: 0, probability: 35, health_score: 70, referral_potential: 50, summary: "", next_action: "" })} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg"><Plus className="h-4 w-4" />New Partner</button></div>
      </div>

      <div className="grid gap-4 xl:grid-cols-6"><Kpi icon={FileText} label="Total Records" value={rows.length} delta="source" tone="violet" /><Kpi icon={ShieldCheck} label="Active Partners" value={activePartners} delta="status" tone="emerald" /><Kpi icon={ShieldAlert} label="Risk Records" value={riskCount} delta="watched" tone="rose" /><Kpi icon={Sparkles} label="Revenue Impact" value={money(totalRevenue)} delta="forecast" tone="cyan" /><Kpi icon={Gauge} label="Health Rate" value={`${avgEngagement}%`} delta="average" tone="amber" /><Kpi icon={TrendingUp} label="Programs" value={totalPrograms} delta="mapped" tone="violet" /></div>

      <div className="grid gap-7 xl:grid-cols-[1fr_430px]">
        <main className="space-y-6">
          <Card className="p-5"><div className="grid gap-4 xl:grid-cols-[1.6fr_repeat(4,1fr)_auto]"><label className="relative"><Search className="absolute left-4 top-3.5 h-5 w-5 text-white/55" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search partners by name, contact, phone, owner, city, or ID..." className="w-full rounded-2xl border border-white/15 bg-[#070d1c] py-3 pl-12 pr-4 text-sm font-bold text-white outline-none placeholder:text-white/40" /></label><select value={activeTab} onChange={(e) => setActiveTab(e.target.value)} className="rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-3 text-sm font-black text-white outline-none">{typeTabs.map((tab) => <option key={tab}>{tab}</option>)}</select><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-3 text-sm font-black text-white outline-none"><option value="all">All Statuses</option>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select><select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-3 text-sm font-black text-white outline-none"><option value="all">All Cities</option>{cities.map((city) => <option key={city}>{city}</option>)}</select><button className="rounded-2xl border border-violet-300/25 bg-violet-600/20 px-4 py-3 text-sm font-black text-white"><Filter className="mr-2 inline h-4 w-4" />More Filters</button></div></Card>
          <div className="flex gap-3 overflow-x-auto pb-1">{typeTabs.map((tab) => { const count = tab === "All Partners" ? rows.length : rows.filter((p) => tab.includes(p.type) || p.type.includes(tab.replace(/s$/, "")) || tab.includes(p.category)).length; return <button key={tab} onClick={() => setActiveTab(tab)} className={`shrink-0 rounded-2xl border px-5 py-3 text-sm font-black text-white ${activeTab === tab ? "border-violet-300 bg-violet-600" : "border-white/15 bg-white/[0.07]"}`}>{tab} ({count})</button> })}</div>

          <Card className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[1280px] text-left"><thead className="border-b border-white/15 text-xs uppercase tracking-[0.18em] text-white/65"><tr><th className="px-6 py-5"><input type="checkbox" className="h-4 w-4 accent-violet-500" /></th>{["Partner", "Type / Source", "Location", "Status", "Programs", "Revenue Impact", "Health", "Updated", "Actions"].map((h) => <th key={h} className="px-4 py-5">{h}</th>)}</tr></thead><tbody>{filtered.map((partner) => <tr key={partner.id} onClick={() => setSelectedId(partner.id)} className={`cursor-pointer border-b border-white/10 transition hover:bg-white/[0.05] ${selected?.id === partner.id ? "bg-violet-600/10" : ""}`}><td className="px-6 py-5"><input onClick={(e) => e.stopPropagation()} type="checkbox" className="h-4 w-4 accent-violet-500" /></td><td className="px-4 py-5"><div className="flex items-center gap-4"><PartnerAvatar partner={partner} /><div><p className="font-black text-white">{partner.name}</p><p className="text-xs font-bold text-white/75">{partner.contact_name || partner.owner}</p><p className="text-xs font-bold text-white/50">{partner.email || partner.phone || "No contact stored"}</p></div></div></td><td className="px-4 py-5"><TypeBadge type={partner.type} /><p className="mt-2 text-xs font-bold text-white/55">{partner.source === "prospect" ? "Revenue prospect" : "Active partner"}</p></td><td className="px-4 py-5"><p className="font-black text-white">{partner.city}</p><p className="text-xs font-bold text-white/55">{partner.district || partner.category}</p></td><td className="px-4 py-5"><StatusBadge status={partner.status} /></td><td className="px-4 py-5 text-sm font-black text-white">{partner.programs.length} Programs</td><td className="px-4 py-5"><p className="font-black text-white">{money(partner.value_mad)}</p><p className="text-xs font-black text-emerald-200">Forecast {money(numberValue(partner.value_mad) * (numberValue(partner.probability) / 100))}</p></td><td className="px-4 py-5"><div className="flex items-center gap-3"><span className="font-black text-white">{partner.health_score}%</span><div className="h-2 w-24 rounded-full bg-white/15"><div className="h-2 rounded-full bg-emerald-400" style={{ width: `${Math.max(0, Math.min(100, numberValue(partner.health_score)))}%` }} /></div></div></td><td className="px-4 py-5 text-sm font-bold text-white/70">{formatDate(partner.updated_at || partner.joinedOn)}</td><td className="px-4 py-5"><button onClick={(e) => { e.stopPropagation(); setEditing(partner) }} className="rounded-xl border border-white/15 bg-white/[0.07] p-3 hover:bg-violet-600"><Edit3 className="h-5 w-5 text-white" /></button></td></tr>)}</tbody></table>{!filtered.length ? <div className="p-10 text-center"><Database className="mx-auto h-10 w-10 text-white/35" /><p className="mt-3 text-lg font-black text-white">No live partner records found</p><p className="mt-1 text-sm font-bold text-white/55">Connect revenue_partnerships or revenue_prospects records, then refresh.</p></div> : null}</div><div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 text-sm font-bold text-white/70"><p>Showing {filtered.length ? 1 : 0} to {filtered.length} of {rows.length} live records</p><div className="flex items-center gap-3">{["‹", "1", "2", "3", "…", "29", "›"].map((x, i) => <button key={`${x}-${i}`} className={`rounded-xl px-3 py-2 ${x === "1" ? "bg-violet-600 text-white" : "bg-white/[0.07] text-white/70"}`}>{x}</button>)}</div><button onClick={() => { const csv = filtered.map((p) => [p.name, p.type, p.status, p.city, p.owner, p.value_mad].join(",")).join("\n"); const blob = new Blob([`name,type,status,city,owner,value_mad\n${csv}`], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "angelcare-partners-directory.csv"; a.click(); URL.revokeObjectURL(url) }} className="rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2 text-white"><ArrowDownToLine className="mr-2 inline h-4 w-4" />Export</button></div></Card>
        </main>
        {selected ? <PartnerProfilePanel partner={selected} onEdit={() => setEditing(selected)} onDelete={() => deleteSelected(selected)} /> : null}
      </div>
    </div>
  )
}
