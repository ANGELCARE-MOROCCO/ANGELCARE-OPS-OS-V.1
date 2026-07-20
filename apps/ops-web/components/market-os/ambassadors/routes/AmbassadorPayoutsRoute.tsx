"use client"

import {
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react"
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Download,
  Eye,
  FileCheck2,
  Filter,
  History,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react"
import type { AmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/types"

type AnyRow = Record<string, any>
type IconType = ComponentType<{ className?: string; size?: number }>
type PayoutRow = AnyRow & { id: string; paid_at?: string; reason?: string; meta: PayoutMeta }
type ModalKind = "create" | "approve" | "payment" | "export" | "reconcile" | null

type Props = {
  snapshot: AmbassadorWorkspaceSnapshot
  loading: boolean
  refreshing: boolean
  error?: string | null
  success?: string | null
  onRefresh: () => void
}

type PayoutMeta = {
  source?: {
    entityType?: "lead" | "conversion" | "manual"
    entityId?: string
    label?: string
    serviceLine?: string
    collectedAmount?: number
    eligibilityEvidence?: string
    attributionChain?: string
  }
  calculation?: {
    eligibleBase?: number
    commissionRate?: number
    grossCommission?: number
    adjustment?: number
    netDue?: number
    adjustmentReason?: string
  }
  period?: string
  payment?: {
    cycle?: string
    method?: string
    beneficiaryReference?: string
    dueDate?: string
    batchId?: string
    batchPreparedAt?: string
    preparedBy?: string
    paymentReference?: string
    valueDate?: string
    actualPaid?: number
    reconciledAt?: string
    reconciledBy?: string
    difference?: number
  }
  approval?: {
    decisionNote?: string
    reviewer?: string
    reviewedAt?: string
    correctionRequested?: string
  }
  exception?: {
    type?: string
    severity?: string
    owner?: string
    dueDate?: string
    note?: string
  }
  history?: Array<{ at: string; action: string; actor?: string; note?: string }>
}

type CreateDraft = {
  ambassadorId: string
  sourceKey: string
  serviceLine: string
  collectedAmount: string
  adjustment: string
  adjustmentReason: string
  period: string
  payoutCycle: string
  paymentMethod: string
  beneficiaryReference: string
  dueDate: string
  eligibilityEvidence: string
  attributionChain: string
  note: string
}

type ApprovalDraft = {
  ids: string[]
  decision: "approved" | "rejected" | "correction"
  reviewer: string
  note: string
  correctionRequested: string
}

type PaymentDraft = {
  ids: string[]
  batchId: string
  paymentMethod: string
  executionDate: string
  preparedBy: string
  controlOwner: string
  bankReference: string
  note: string
}

type ReconcileDraft = {
  ids: string[]
  paymentReference: string
  valueDate: string
  actualPaid: string
  reconciledBy: string
  decision: "matched" | "difference" | "disputed"
  note: string
}

type ExportDraft = {
  format: "csv" | "json"
  status: string
  period: string
  city: string
  columns: string[]
}

const META_START = "<!-- ANGELCARE_PAYOUT_META_START"
const META_END = "ANGELCARE_PAYOUT_META_END -->"
const COMMISSION_RATE = 10

const statusOrder = ["pending", "approved", "payment_prepared", "paid", "reconciled", "rejected", "blocked", "disputed"]
const statusLabels: Record<string, string> = {
  pending: "En attente",
  draft: "Brouillon",
  submitted: "À approuver",
  approved: "Approuvé",
  payment_prepared: "Paiement préparé",
  to_pay: "À payer",
  paid: "Payé",
  reconciled: "Rapproché",
  rejected: "Rejeté",
  blocked: "Bloqué",
  disputed: "Contesté",
  correction: "À corriger",
  archived: "Archivé",
}

function text(value: unknown, fallback = "—") {
  const output = String(value ?? "").trim()
  return output || fallback
}

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function dateValue(value: unknown) {
  const raw = String(value || "")
  if (!raw) return ""
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

function humanDate(value: unknown) {
  const raw = String(value || "")
  if (!raw) return "—"
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date)
}

function money(value: unknown) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(number(value))} Dh`
}

function normalizeStatus(value: unknown) {
  return String(value || "pending").trim().toLowerCase().replace(/\s+/g, "_")
}

function statusTone(status: string) {
  if (["paid", "reconciled"].includes(status)) return "bg-emerald-50 text-emerald-800 border-emerald-200"
  if (["approved", "payment_prepared", "to_pay"].includes(status)) return "bg-blue-50 text-blue-800 border-blue-200"
  if (["rejected", "blocked", "disputed"].includes(status)) return "bg-rose-50 text-rose-800 border-rose-200"
  if (["correction"].includes(status)) return "bg-amber-50 text-amber-900 border-amber-200"
  return "bg-orange-50 text-orange-800 border-orange-200"
}

function parseMeta(reason: unknown): PayoutMeta {
  const source = String(reason || "")
  const start = source.indexOf(META_START)
  const end = source.indexOf(META_END)
  if (start < 0 || end < 0 || end <= start) return {}
  const payloadStart = source.indexOf("\n", start)
  if (payloadStart < 0) return {}
  const raw = source.slice(payloadStart + 1, end).trim()
  try {
    return JSON.parse(raw) as PayoutMeta
  } catch {
    return {}
  }
}

function mergeReason(note: string, meta: PayoutMeta) {
  const clean = note.replace(new RegExp(`${META_START}[\\s\\S]*?${META_END.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}`, "g"), "").trim()
  return `${clean}${clean ? "\n\n" : ""}${META_START}\n${JSON.stringify(meta)}\n${META_END}`
}

function appendHistory(meta: PayoutMeta, action: string, actor: string, note?: string): PayoutMeta {
  return {
    ...meta,
    history: [...(meta.history || []), { at: new Date().toISOString(), action, actor, note }].slice(-50),
  }
}

async function apiJson(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `Erreur HTTP ${response.status}`)
  return payload
}

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function escapeCsv(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-950">{children}</div>
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>
}

function MetricCard({ label, value, helper, icon: Icon, tone = "blue" }: { label: string; value: ReactNode; helper: string; icon: IconType; tone?: string }) {
  const tones: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
  }
  return (
    <Panel className="min-h-[126px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-600">{label}</div>
          <div className="mt-3 text-[27px] font-black tracking-tight text-slate-950">{value}</div>
          <div className="mt-2 text-xs font-bold text-slate-600">{helper}</div>
        </div>
        <div className={`rounded-2xl p-3 ${tones[tone] || tones.blue}`}><Icon size={21} /></div>
      </div>
    </Panel>
  )
}

function ModalFrame({ title, subtitle, icon: Icon, onClose, children, footer, width = "max-w-[1760px]" }: { title: string; subtitle: string; icon: IconType; onClose: () => void; children: ReactNode; footer: ReactNode; width?: string }) {
  return (
    <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm">
      <div data-payout-modal className={`flex h-[calc(100vh-24px)] w-full ${width} flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-slate-50 shadow-2xl`}>
        <style>{`[data-payout-modal], [data-payout-modal] * { color: #0f172a; } [data-payout-modal] h1,[data-payout-modal] h2,[data-payout-modal] h3,[data-payout-modal] h4,[data-payout-modal] h5,[data-payout-modal] h6 { color:#020617 !important; -webkit-text-fill-color:#020617 !important; font-weight:900 !important; } [data-payout-modal] input,[data-payout-modal] select,[data-payout-modal] textarea,[data-payout-modal] option { color:#020617 !important; -webkit-text-fill-color:#020617 !important; font-weight:700 !important; } [data-payout-modal] ::placeholder { color:#64748b !important; opacity:1; }`}</style>
        <header className="flex shrink-0 items-center justify-between gap-5 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-blue-700"><Icon size={21} /></div>
            <div className="min-w-0">
              <h2 className="text-xl font-black tracking-tight">{title}</h2>
              <p className="mt-1 text-sm font-bold text-slate-600">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-950 hover:bg-slate-100" aria-label="Fermer"><X size={19} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">{footer}</footer>
      </div>
    </div>
  )
}

function ReadinessList({ items }: { items: Array<{ label: string; ok: boolean }> }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-extrabold">
          {item.ok ? <CheckCircle2 className="text-emerald-600" size={17} /> : <AlertTriangle className="text-amber-600" size={17} />}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function AmbassadorPayoutsRoute({ snapshot, loading, refreshing, error, success, onRefresh }: Props) {
  const incentives = useMemo(() => Array.isArray(snapshot.incentives) ? snapshot.incentives : [], [snapshot.incentives])
  const ambassadors = useMemo(() => Array.isArray(snapshot.ambassadors) ? snapshot.ambassadors : [], [snapshot.ambassadors])
  const leads = useMemo(() => Array.isArray((snapshot as AnyRow).leads) ? (snapshot as AnyRow).leads : [], [snapshot])
  const conversions = useMemo(() => Array.isArray((snapshot as AnyRow).conversions) ? (snapshot as AnyRow).conversions : [], [snapshot])

  const [modal, setModal] = useState<ModalKind>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [detailId, setDetailId] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const currentPeriod = new Date().toISOString().slice(0, 7)

  const [createDraft, setCreateDraft] = useState<CreateDraft>({ ambassadorId: "", sourceKey: "", serviceLine: "Home Service", collectedAmount: "", adjustment: "0", adjustmentReason: "", period: currentPeriod, payoutCycle: "Mensuel", paymentMethod: "Virement bancaire", beneficiaryReference: "", dueDate: "", eligibilityEvidence: "", attributionChain: "", note: "" })
  const [approvalDraft, setApprovalDraft] = useState<ApprovalDraft>({ ids: [], decision: "approved", reviewer: "AngelCare Finance", note: "", correctionRequested: "" })
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>({ ids: [], batchId: `LOT-${today.replace(/-/g, "")}-01`, paymentMethod: "Virement bancaire", executionDate: "", preparedBy: "AngelCare Finance", controlOwner: "Direction / Finance", bankReference: "", note: "" })
  const [reconcileDraft, setReconcileDraft] = useState<ReconcileDraft>({ ids: [], paymentReference: "", valueDate: "", actualPaid: "", reconciledBy: "AngelCare Finance", decision: "matched", note: "" })
  const [exportDraft, setExportDraft] = useState<ExportDraft>({ format: "csv", status: "all", period: "all", city: "all", columns: ["reference", "ambassador", "city", "period", "source", "base", "rate", "net", "status", "method", "due", "batch"] })

  const ambassadorById = useMemo(() => new Map(ambassadors.map((item: AnyRow) => [String(item.id), item])), [ambassadors])
  const getAmbassador = (id: unknown) => ambassadorById.get(String(id || "")) || null
  const getAmbassadorName = (id: unknown) => text(getAmbassador(id)?.full_name || getAmbassador(id)?.name, "Ambassadeur non affecté")
  const getAmbassadorCity = (id: unknown) => text(getAmbassador(id)?.city, "Non renseignée")

  const eligibleSources = useMemo(() => {
    const conversionRows = conversions.filter((item: AnyRow) => ["validated", "approved", "completed", "converted", "won"].includes(normalizeStatus(item.status))).map((item: AnyRow) => ({ key: `conversion:${item.id}`, entityType: "conversion" as const, entityId: String(item.id), label: `Conversion · ${text(item.lead_name || item.parent_name || item.offer_name)}`, ambassadorId: String(item.ambassador_id || ""), serviceLine: text(item.service_line || item.offer_name, "Service AngelCare"), amount: number(item.collected_amount || item.value || item.amount || 0) }))
    const leadRows = leads.filter((item: AnyRow) => ["qualified", "ready_to_convert", "converted"].includes(normalizeStatus(item.status))).map((item: AnyRow) => ({ key: `lead:${item.id}`, entityType: "lead" as const, entityId: String(item.id), label: `Lead · ${text(item.lead_name || item.parent_name)}`, ambassadorId: String(item.ambassador_id || ""), serviceLine: text(item.service_line || item.lead_type, "Service AngelCare"), amount: number(item.collected_amount || item.order_value || item.value || 0) }))
    return [...conversionRows, ...leadRows]
  }, [conversions, leads])

  const enriched = useMemo<PayoutRow[]>(() => incentives.map((item: AnyRow): PayoutRow => {
    const meta = parseMeta(item.reason)
    const status = normalizeStatus(item.status)
    const amount = number(item.amount)
    const ambassador = getAmbassador(item.ambassador_id)
    return {
      ...item,
      id: item.id,
      paid_at: item.paid_at,
      reason: item.reason,
      meta,
      status,
      amount,
      ambassadorName: text(ambassador?.full_name || ambassador?.name, "Ambassadeur non affecté"),
      city: text(ambassador?.city, "Non renseignée"),
      period: meta.period || String(item.created_at || "").slice(0, 7),
      sourceLabel: meta.source?.label || text(item.incentive_type, "Commission"),
      eligibleBase: number(meta.calculation?.eligibleBase),
      commissionRate: number(meta.calculation?.commissionRate || COMMISSION_RATE),
      adjustment: number(meta.calculation?.adjustment),
      paymentMethod: meta.payment?.method || "À définir",
      dueDate: meta.payment?.dueDate || "",
      batchId: meta.payment?.batchId || "",
    }
  }), [incentives, ambassadorById])

  const cities = useMemo(() => Array.from(new Set(enriched.map((item) => item.city).filter(Boolean))).sort(), [enriched])
  const periods = useMemo(() => Array.from(new Set(enriched.map((item) => item.period).filter(Boolean))).sort().reverse(), [enriched])

  const filtered = useMemo(() => enriched.filter((item) => {
    const haystack = `${item.ambassadorName} ${item.city} ${item.sourceLabel} ${item.id} ${item.batchId}`.toLowerCase()
    return (!search || haystack.includes(search.toLowerCase())) && (statusFilter === "all" || item.status === statusFilter) && (periodFilter === "all" || item.period === periodFilter) && (cityFilter === "all" || item.city === cityFilter)
  }), [enriched, search, statusFilter, periodFilter, cityFilter])

  const pending = enriched.filter((item) => ["pending", "draft", "submitted", "correction"].includes(item.status))
  const toPay = enriched.filter((item) => ["approved", "payment_prepared", "to_pay"].includes(item.status))
  const paid = enriched.filter((item) => ["paid", "reconciled"].includes(item.status) && (item.period === currentPeriod || String(item.paid_at || "").startsWith(currentPeriod)))
  const exceptions = enriched.filter((item) => ["rejected", "blocked", "disputed", "correction"].includes(item.status) || Boolean(item.meta.exception?.type))
  const exposure = enriched.filter((item) => !["rejected", "archived"].includes(item.status)).reduce((sum, item) => sum + item.amount, 0)

  const topEarner = useMemo(() => {
    const totals = new Map<string, number>()
    enriched.filter((item) => item.period === currentPeriod).forEach((item) => totals.set(item.ambassadorName, (totals.get(item.ambassadorName) || 0) + item.amount))
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1])[0] || null
  }, [enriched, currentPeriod])

  const batches = useMemo(() => {
    const map = new Map<string, AnyRow[]>()
    enriched.filter((item) => item.batchId).forEach((item) => map.set(item.batchId, [...(map.get(item.batchId) || []), item]))
    return Array.from(map.entries()).map(([id, rows]) => ({ id, rows, total: rows.reduce((sum, row) => sum + row.amount, 0), status: rows.every((row) => row.status === "reconciled") ? "reconciled" : rows.some((row) => row.status === "paid") ? "paid" : "payment_prepared", date: rows[0]?.meta.payment?.batchPreparedAt || rows[0]?.updated_at }))
  }, [enriched])

  const selectedSource = eligibleSources.find((item) => item.key === createDraft.sourceKey)
  const eligibleBase = number(createDraft.collectedAmount)
  const adjustment = number(createDraft.adjustment)
  const grossCommission = eligibleBase * (COMMISSION_RATE / 100)
  const netDue = Math.max(0, grossCommission + adjustment)
  const duplicateRisk = selectedSource ? enriched.some((item) => item.meta.source?.entityType === selectedSource.entityType && item.meta.source?.entityId === selectedSource.entityId && !["rejected", "archived"].includes(item.status)) : false

  const createReadiness = [
    { label: "Ambassadeur sélectionné", ok: Boolean(createDraft.ambassadorId) },
    { label: "Origine de revenu réelle", ok: Boolean(selectedSource) },
    { label: "Base éligible renseignée", ok: eligibleBase > 0 },
    { label: "Taux verrouillé à 10%", ok: true },
    { label: "Preuve d’éligibilité", ok: Boolean(createDraft.eligibilityEvidence.trim()) },
    { label: "Aucun doublon actif", ok: !duplicateRisk },
  ]
  const createScore = Math.round((createReadiness.filter((item) => item.ok).length / createReadiness.length) * 100)

  const openModal = (kind: Exclude<ModalKind, null>) => {
    setFeedback(null)
    if (kind === "approve") setApprovalDraft((draft) => ({ ...draft, ids: selectedIds.length ? selectedIds : pending.map((item) => String(item.id)) }))
    if (kind === "payment") setPaymentDraft((draft) => ({ ...draft, ids: selectedIds.length ? selectedIds.filter((id) => toPay.some((item) => String(item.id) === id)) : toPay.map((item) => String(item.id)) }))
    if (kind === "reconcile") setReconcileDraft((draft) => ({ ...draft, ids: selectedIds.length ? selectedIds : enriched.filter((item) => ["paid", "payment_prepared"].includes(item.status)).map((item) => String(item.id)) }))
    setModal(kind)
  }

  const toggleSelection = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const toggleDraftId = (kind: "approve" | "payment" | "reconcile", id: string) => {
    if (kind === "approve") setApprovalDraft((draft) => ({ ...draft, ids: draft.ids.includes(id) ? draft.ids.filter((item) => item !== id) : [...draft.ids, id] }))
    if (kind === "payment") setPaymentDraft((draft) => ({ ...draft, ids: draft.ids.includes(id) ? draft.ids.filter((item) => item !== id) : [...draft.ids, id] }))
    if (kind === "reconcile") setReconcileDraft((draft) => ({ ...draft, ids: draft.ids.includes(id) ? draft.ids.filter((item) => item !== id) : [...draft.ids, id] }))
  }

  const submitCreate = async (status: "draft" | "pending") => {
    if (createScore < 100) return setFeedback({ type: "error", text: "Complétez tous les contrôles d’éligibilité avant création." })
    setBusy(true)
    setFeedback(null)
    try {
      const source = selectedSource!
      const meta = appendHistory({
        source: { entityType: source.entityType, entityId: source.entityId, label: source.label, serviceLine: createDraft.serviceLine, collectedAmount: eligibleBase, eligibilityEvidence: createDraft.eligibilityEvidence, attributionChain: createDraft.attributionChain },
        calculation: { eligibleBase, commissionRate: COMMISSION_RATE, grossCommission, adjustment, netDue, adjustmentReason: createDraft.adjustmentReason },
        period: createDraft.period,
        payment: { cycle: createDraft.payoutCycle, method: createDraft.paymentMethod, beneficiaryReference: createDraft.beneficiaryReference, dueDate: createDraft.dueDate },
      }, status === "draft" ? "Brouillon incentive créé" : "Incentive soumis pour approbation", "AngelCare OPS", createDraft.note)
      await apiJson("/api/market-os/ambassadors/incentives", { method: "POST", body: JSON.stringify({ ambassador_id: createDraft.ambassadorId, incentive_type: `Commission 10% · ${createDraft.serviceLine}`, amount: netDue, currency: "MAD", status, reason: mergeReason(createDraft.note, meta) }) })
      setFeedback({ type: "success", text: status === "draft" ? "Brouillon enregistré." : "Incentive créé et soumis au contrôle financier." })
      onRefresh()
    } catch (submitError) {
      setFeedback({ type: "error", text: submitError instanceof Error ? submitError.message : "Création impossible." })
    } finally { setBusy(false) }
  }

  const submitApproval = async () => {
    if (!approvalDraft.ids.length || !approvalDraft.reviewer.trim() || !approvalDraft.note.trim()) return setFeedback({ type: "error", text: "Sélection, approbateur et note de décision sont obligatoires." })
    setBusy(true)
    setFeedback(null)
    try {
      for (const id of approvalDraft.ids) {
        const row = enriched.find((item) => String(item.id) === id)
        if (!row) continue
        const decisionStatus = approvalDraft.decision === "correction" ? "correction" : approvalDraft.decision
        const meta = appendHistory({ ...row.meta, approval: { decisionNote: approvalDraft.note, reviewer: approvalDraft.reviewer, reviewedAt: new Date().toISOString(), correctionRequested: approvalDraft.correctionRequested } }, `Décision financière: ${decisionStatus}`, approvalDraft.reviewer, approvalDraft.note)
        if (approvalDraft.decision === "approved") await apiJson("/api/market-os/ambassadors/incentives/approve", { method: "PATCH", body: JSON.stringify({ id, approved_by: approvalDraft.reviewer, reason: mergeReason(approvalDraft.note, meta) }) })
        else if (approvalDraft.decision === "rejected") await apiJson("/api/market-os/ambassadors/incentives/reject", { method: "PATCH", body: JSON.stringify({ id, approved_by: approvalDraft.reviewer, reason: mergeReason(approvalDraft.note, meta) }) })
        else await apiJson(`/api/market-os/ambassadors/incentives/${id}`, { method: "PATCH", body: JSON.stringify({ status: "correction", reason: mergeReason(approvalDraft.note, meta) }) })
      }
      setFeedback({ type: "success", text: `${approvalDraft.ids.length} dossier(s) traité(s) et journalisé(s).` })
      setSelectedIds([])
      onRefresh()
    } catch (submitError) { setFeedback({ type: "error", text: submitError instanceof Error ? submitError.message : "Décision impossible." }) } finally { setBusy(false) }
  }

  const submitPaymentPreparation = async () => {
    if (!paymentDraft.ids.length || !paymentDraft.batchId.trim() || !paymentDraft.executionDate || !paymentDraft.preparedBy.trim() || !paymentDraft.controlOwner.trim()) return setFeedback({ type: "error", text: "Lot, échéance, préparateur et double contrôle sont obligatoires." })
    setBusy(true)
    setFeedback(null)
    try {
      for (const id of paymentDraft.ids) {
        const row = enriched.find((item) => String(item.id) === id)
        if (!row || !["approved", "payment_prepared", "to_pay"].includes(row.status)) continue
        const meta = appendHistory({ ...row.meta, payment: { ...(row.meta.payment || {}), batchId: paymentDraft.batchId, method: paymentDraft.paymentMethod, dueDate: paymentDraft.executionDate, batchPreparedAt: new Date().toISOString(), preparedBy: paymentDraft.preparedBy, paymentReference: paymentDraft.bankReference } }, "Paiement préparé", paymentDraft.preparedBy, paymentDraft.note)
        await apiJson(`/api/market-os/ambassadors/incentives/${id}`, { method: "PATCH", body: JSON.stringify({ status: "payment_prepared", reason: mergeReason(paymentDraft.note, meta) }) })
      }
      setFeedback({ type: "success", text: `Lot ${paymentDraft.batchId} préparé sans marquer les paiements comme exécutés.` })
      onRefresh()
    } catch (submitError) { setFeedback({ type: "error", text: submitError instanceof Error ? submitError.message : "Préparation impossible." }) } finally { setBusy(false) }
  }

  const submitReconciliation = async () => {
    if (!reconcileDraft.ids.length || !reconcileDraft.paymentReference.trim() || !reconcileDraft.valueDate || !reconcileDraft.reconciledBy.trim()) return setFeedback({ type: "error", text: "Sélection, référence, date de valeur et responsable sont obligatoires." })
    setBusy(true)
    setFeedback(null)
    try {
      const expected = reconcileDraft.ids.reduce((sum, id) => sum + number(enriched.find((item) => String(item.id) === id)?.amount), 0)
      const actual = number(reconcileDraft.actualPaid || expected)
      const difference = actual - expected
      const perRowActual = reconcileDraft.ids.length ? actual / reconcileDraft.ids.length : 0
      for (const id of reconcileDraft.ids) {
        const row = enriched.find((item) => String(item.id) === id)
        if (!row) continue
        const nextStatus = reconcileDraft.decision === "matched" && Math.abs(difference) < 0.01 ? "reconciled" : "disputed"
        const meta = appendHistory({ ...row.meta, payment: { ...(row.meta.payment || {}), paymentReference: reconcileDraft.paymentReference, valueDate: reconcileDraft.valueDate, actualPaid: perRowActual, reconciledAt: new Date().toISOString(), reconciledBy: reconcileDraft.reconciledBy, difference }, exception: nextStatus === "disputed" ? { type: "Écart de rapprochement", severity: "Haute", owner: reconcileDraft.reconciledBy, note: reconcileDraft.note } : row.meta.exception }, nextStatus === "reconciled" ? "Paiement rapproché" : "Écart ouvert", reconcileDraft.reconciledBy, reconcileDraft.note)
        await apiJson(`/api/market-os/ambassadors/incentives/${id}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus, reason: mergeReason(reconcileDraft.note, meta) }) })
      }
      setFeedback({ type: "success", text: Math.abs(difference) < 0.01 ? "Rapprochement équilibré et journalisé." : `Écart de ${money(difference)} ouvert en litige.` })
      onRefresh()
    } catch (submitError) { setFeedback({ type: "error", text: submitError instanceof Error ? submitError.message : "Rapprochement impossible." }) } finally { setBusy(false) }
  }

  const generateExport = () => {
    const exportRows = enriched.filter((item) => (exportDraft.status === "all" || item.status === exportDraft.status) && (exportDraft.period === "all" || item.period === exportDraft.period) && (exportDraft.city === "all" || item.city === exportDraft.city))
    const columnMap: Record<string, { label: string; value: (item: AnyRow) => unknown }> = {
      reference: { label: "Référence", value: (item) => item.id }, ambassador: { label: "Ambassadeur", value: (item) => item.ambassadorName }, city: { label: "Ville", value: (item) => item.city }, period: { label: "Période", value: (item) => item.period }, source: { label: "Origine", value: (item) => item.sourceLabel }, base: { label: "Base éligible", value: (item) => item.eligibleBase }, rate: { label: "Taux", value: (item) => `${item.commissionRate}%` }, net: { label: "Net dû", value: (item) => item.amount }, status: { label: "Statut", value: (item) => statusLabels[item.status] || item.status }, method: { label: "Méthode", value: (item) => item.paymentMethod }, due: { label: "Échéance", value: (item) => item.dueDate }, batch: { label: "Lot", value: (item) => item.batchId },
    }
    const selected = exportDraft.columns.map((key) => ({ key, ...columnMap[key] })).filter((item) => item.value)
    if (exportDraft.format === "json") return downloadFile(`angelcare-incentives-${today}.json`, JSON.stringify(exportRows.map((item) => Object.fromEntries(selected.map((column) => [column.label, column.value(item)]))), null, 2), "application/json")
    const csv = [selected.map((column) => escapeCsv(column.label)).join(","), ...exportRows.map((item) => selected.map((column) => escapeCsv(column.value(item))).join(","))].join("\n")
    downloadFile(`angelcare-incentives-${today}.csv`, csv, "text/csv;charset=utf-8")
  }

  const detail: (PayoutRow & { meta: PayoutMeta }) | null = detailId ? enriched.find((item) => String(item.id) === detailId) || null : null
  const selectedPaymentRows = enriched.filter((item) => paymentDraft.ids.includes(String(item.id)))
  const selectedPaymentTotal = selectedPaymentRows.reduce((sum, item) => sum + item.amount, 0)
  const selectedReconcileRows = enriched.filter((item) => reconcileDraft.ids.includes(String(item.id)))
  const expectedReconcile = selectedReconcileRows.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-5 text-slate-950 xl:px-7">
      <div className="mx-auto w-full max-w-none space-y-5">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-blue-800"><WalletCards size={14} /> Finance ambassadeurs · Commission 10% gouvernée</div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Incentives & Payouts</h1>
              <p className="mt-2 max-w-3xl text-sm font-bold text-slate-600">Contrôlez l’éligibilité, le calcul fixe à 10%, les approbations, lots de paiement, preuves et rapprochements sans double commission.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => openModal("create")} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700"><Plus size={17} /> Créer incentive</button>
              <button onClick={() => openModal("approve")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black"><Check size={17} /> Approuver</button>
              <button onClick={() => openModal("payment")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black"><Banknote size={17} /> Préparer paiement</button>
              <button onClick={() => openModal("export")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black"><Download size={17} /> Exporter état</button>
              <button onClick={() => openModal("reconcile")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black"><FileCheck2 size={17} /> Rapprocher</button>
              <button onClick={onRefresh} disabled={refreshing} className="rounded-xl border border-slate-200 bg-white p-3"><RefreshCw className={refreshing ? "animate-spin" : ""} size={18} /></button>
            </div>
          </div>
          {(error || success) && <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-extrabold ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>{error || success}</div>}
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="En attente d’approbation" value={pending.length} helper={money(pending.reduce((sum, item) => sum + item.amount, 0))} icon={Users} tone="blue" />
          <MetricCard label="À payer" value={money(toPay.reduce((sum, item) => sum + item.amount, 0))} helper={`${toPay.length} dossier(s)`} icon={WalletCards} tone="orange" />
          <MetricCard label="Payés sur la période" value={money(paid.reduce((sum, item) => sum + item.amount, 0))} helper={`${paid.length} paiement(s)`} icon={BadgeCheck} tone="green" />
          <MetricCard label="Litiges / exceptions" value={exceptions.length} helper={money(exceptions.reduce((sum, item) => sum + item.amount, 0))} icon={ShieldAlert} tone="red" />
          <MetricCard label="Exposition totale" value={money(exposure)} helper="Hors dossiers rejetés" icon={CircleDollarSign} tone="blue" />
          <MetricCard label="Top ambassadeur" value={topEarner ? topEarner[0] : "—"} helper={topEarner ? money(topEarner[1]) : "Aucune donnée réelle"} icon={Trophy} tone="violet" />
        </div>

        <Panel>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-black">Paiements & commissions</h2>
              <p className="mt-1 text-sm font-bold text-slate-600">Registre transparent: source, base éligible, 10%, ajustement, net dû et cycle financier.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher ambassadeur, source, lot..." className="w-[270px] rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-bold outline-none focus:border-blue-400" /></label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold"><option value="all">Tous les statuts</option>{statusOrder.map((status) => <option key={status} value={status}>{statusLabels[status] || status}</option>)}</select>
              <select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold"><option value="all">Toutes les périodes</option>{periods.map((period) => <option key={period} value={period}>{period}</option>)}</select>
              <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold"><option value="all">Toutes les villes</option>{cities.map((city) => <option key={city} value={city}>{city}</option>)}</select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] border-collapse text-left">
              <thead><tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600"><th className="px-3 py-3"><input type="checkbox" checked={filtered.length > 0 && filtered.every((item) => selectedIds.includes(String(item.id)))} onChange={() => setSelectedIds(filtered.every((item) => selectedIds.includes(String(item.id))) ? [] : filtered.map((item) => String(item.id)))} /></th><th className="px-3 py-3">Ambassadeur</th><th className="px-3 py-3">Période</th><th className="px-3 py-3">Origine</th><th className="px-3 py-3">Base</th><th className="px-3 py-3">Taux</th><th className="px-3 py-3">Ajustement</th><th className="px-3 py-3">Net dû</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3">Méthode</th><th className="px-3 py-3">Échéance</th><th className="px-3 py-3">Lot</th><th className="px-3 py-3">Actions</th></tr></thead>
              <tbody>{filtered.map((item) => <tr key={String(item.id)} className="border-b border-slate-100 text-sm font-bold hover:bg-slate-50"><td className="px-3 py-3"><input type="checkbox" checked={selectedIds.includes(String(item.id))} onChange={() => toggleSelection(String(item.id))} /></td><td className="px-3 py-3"><div className="font-black">{item.ambassadorName}</div><div className="text-xs text-slate-500">{item.city} · {String(item.id).slice(0, 10)}</div></td><td className="px-3 py-3">{item.period || "—"}</td><td className="max-w-[220px] px-3 py-3"><div className="truncate">{item.sourceLabel}</div></td><td className="px-3 py-3">{money(item.eligibleBase)}</td><td className="px-3 py-3"><span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-800">{item.commissionRate}% fixe</span></td><td className={`px-3 py-3 ${item.adjustment < 0 ? "text-rose-700" : item.adjustment > 0 ? "text-emerald-700" : ""}`}>{money(item.adjustment)}</td><td className="px-3 py-3 font-black">{money(item.amount)}</td><td className="px-3 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${statusTone(item.status)}`}>{statusLabels[item.status] || item.status}</span></td><td className="px-3 py-3">{item.paymentMethod}</td><td className="px-3 py-3">{humanDate(item.dueDate)}</td><td className="px-3 py-3">{item.batchId || "—"}</td><td className="px-3 py-3"><button onClick={() => setDetailId(String(item.id))} className="rounded-lg border border-slate-200 bg-white p-2"><Eye size={16} /></button></td></tr>)}</tbody>
            </table>
            {!loading && filtered.length === 0 && <div className="flex min-h-[180px] items-center justify-center rounded-2xl bg-slate-50 text-sm font-black text-slate-600">Aucun dossier financier réel pour ce périmètre.</div>}
            {loading && <div className="flex min-h-[180px] items-center justify-center gap-2 text-sm font-black"><Loader2 className="animate-spin" size={18} /> Chargement des incentives réels...</div>}
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr_1.2fr]">
          <Panel><h3 className="text-lg font-black">Workflow d’approbation</h3><div className="mt-4 space-y-3">{[{ label: "À contrôler", statuses: ["pending", "submitted", "correction"] }, { label: "Approuvés", statuses: ["approved"] }, { label: "Paiements préparés", statuses: ["payment_prepared", "to_pay"] }, { label: "Payés", statuses: ["paid"] }, { label: "Rapprochés", statuses: ["reconciled"] }].map((step, index) => { const rows = enriched.filter((item) => step.statuses.includes(item.status)); return <div key={step.label} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-3"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{index + 1}</div><div><div className="font-black">{step.label}</div><div className="text-xs font-bold text-slate-500">{rows.length} élément(s)</div></div></div><div className="font-black">{money(rows.reduce((sum, item) => sum + item.amount, 0))}</div></div>})}</div></Panel>
          <Panel><div className="flex items-center justify-between"><h3 className="text-lg font-black">Lots de paiement</h3><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-800">{batches.length} lot(s)</span></div><div className="mt-4 space-y-3">{batches.slice(0, 6).map((batch) => <button key={batch.id} onClick={() => { setReconcileDraft((draft) => ({ ...draft, ids: batch.rows.map((row) => String(row.id)), actualPaid: String(batch.total) })); setModal("reconcile") }} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-blue-300"><div><div className="font-black">{batch.id}</div><div className="text-xs font-bold text-slate-500">{batch.rows.length} ambassadeur(s) · {humanDate(batch.date)}</div></div><div className="text-right"><div className="font-black">{money(batch.total)}</div><div className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${statusTone(batch.status)}`}>{statusLabels[batch.status] || batch.status}</div></div></button>)}{batches.length === 0 && <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-black text-slate-500">Aucun lot réel préparé.</div>}</div></Panel>
          <Panel><h3 className="text-lg font-black">Statut financier de la période</h3><div className="mt-5 space-y-4">{statusOrder.map((status) => { const rows = enriched.filter((item) => item.status === status); const total = rows.reduce((sum, item) => sum + item.amount, 0); const pct = exposure > 0 ? Math.min(100, (total / exposure) * 100) : 0; return <div key={status}><div className="mb-2 flex items-center justify-between text-sm font-black"><span>{statusLabels[status] || status}</span><span>{money(total)} · {rows.length}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} /></div></div>})}</div></Panel>
        </div>

        <Panel><div className="flex items-center justify-between"><div><h3 className="text-lg font-black">Cas exceptionnels & litiges</h3><p className="mt-1 text-sm font-bold text-slate-600">Écarts, rejets, corrections, remboursements et décisions traçables.</p></div><span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-800">{exceptions.length}</span></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1000px] text-left"><thead><tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600"><th className="px-3 py-3">Ambassadeur</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Montant</th><th className="px-3 py-3">Motif</th><th className="px-3 py-3">Responsable</th><th className="px-3 py-3">SLA</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3">Action</th></tr></thead><tbody>{exceptions.map((item) => <tr key={String(item.id)} className="border-b border-slate-100 text-sm font-bold"><td className="px-3 py-3">{item.ambassadorName}</td><td className="px-3 py-3">{item.meta.exception?.type || statusLabels[item.status] || item.status}</td><td className="px-3 py-3 font-black">{money(item.amount)}</td><td className="max-w-[320px] px-3 py-3">{item.meta.exception?.note || item.meta.approval?.decisionNote || text(item.reason)}</td><td className="px-3 py-3">{item.meta.exception?.owner || item.meta.approval?.reviewer || "Finance OPS"}</td><td className="px-3 py-3">{humanDate(item.meta.exception?.dueDate)}</td><td className="px-3 py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-black ${statusTone(item.status)}`}>{statusLabels[item.status] || item.status}</span></td><td className="px-3 py-3"><button onClick={() => setDetailId(String(item.id))} className="font-black text-blue-700">Ouvrir</button></td></tr>)}</tbody></table>{exceptions.length === 0 && <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-black text-slate-500">Aucun litige réel ouvert.</div>}</div></Panel>
      </div>

      {modal === "create" && <ModalFrame title="Créer un incentive contrôlé" subtitle="Source de revenu réelle, attribution, base éligible, taux fixe 10%, ajustements et preuve avant approbation." icon={Sparkles} onClose={() => setModal(null)} footer={<div className="flex items-center justify-between gap-4"><div className="text-sm font-black">Readiness {createScore}% · Commission nette {money(netDue)}{duplicateRisk ? " · Doublon détecté" : ""}</div><div className="flex gap-2"><button onClick={() => setModal(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">Annuler</button><button disabled={busy || createScore < 100} onClick={() => submitCreate("draft")} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black disabled:opacity-40">Enregistrer brouillon</button><button disabled={busy || createScore < 100} onClick={() => submitCreate("pending")} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40">{busy ? "Synchronisation..." : "Créer & soumettre"}</button></div></div>}>
        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.15fr_0.9fr]">
          <div className="space-y-5"><Panel><h3 className="text-lg font-black">1. Attribution & revenu</h3><div className="mt-5 grid gap-4"><label><FieldLabel>Origine éligible *</FieldLabel><select value={createDraft.sourceKey} onChange={(event) => { const source = eligibleSources.find((item) => item.key === event.target.value); setCreateDraft((draft) => ({ ...draft, sourceKey: event.target.value, ambassadorId: source?.ambassadorId || draft.ambassadorId, serviceLine: source?.serviceLine || draft.serviceLine, collectedAmount: source?.amount ? String(source.amount) : draft.collectedAmount })) }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3"><option value="">Choisir lead / conversion validé(e)</option>{eligibleSources.map((source) => <option key={source.key} value={source.key}>{source.label} · {money(source.amount)}</option>)}</select></label><label><FieldLabel>Ambassadeur bénéficiaire *</FieldLabel><select value={createDraft.ambassadorId} onChange={(event) => setCreateDraft((draft) => ({ ...draft, ambassadorId: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3"><option value="">Choisir</option>{ambassadors.map((item: AnyRow) => <option key={String(item.id)} value={String(item.id)}>{text(item.full_name)} · {text(item.city)}</option>)}</select></label><label><FieldLabel>Ligne de service</FieldLabel><select value={createDraft.serviceLine} onChange={(event) => setCreateDraft((draft) => ({ ...draft, serviceLine: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3"><option>Home Service</option><option>Kindergarten & Preschool</option><option>Academy</option><option>Hospitality Kids Friendly</option><option>Corporates Liner</option></select></label><label><FieldLabel>Chaîne d’attribution</FieldLabel><textarea value={createDraft.attributionChain} onChange={(event) => setCreateDraft((draft) => ({ ...draft, attributionChain: event.target.value }))} rows={3} placeholder="Code promo, referral, mission, lead, conversion..." className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label></div></Panel><Panel><h3 className="text-lg font-black">2. Période & paiement</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><FieldLabel>Période</FieldLabel><input type="month" value={createDraft.period} onChange={(event) => setCreateDraft((draft) => ({ ...draft, period: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label><label><FieldLabel>Cycle payout</FieldLabel><select value={createDraft.payoutCycle} onChange={(event) => setCreateDraft((draft) => ({ ...draft, payoutCycle: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3"><option>Mensuel</option><option>Bimensuel</option><option>Hebdomadaire</option></select></label><label><FieldLabel>Méthode</FieldLabel><select value={createDraft.paymentMethod} onChange={(event) => setCreateDraft((draft) => ({ ...draft, paymentMethod: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3"><option>Virement bancaire</option><option>Mobile Money</option><option>Espèces contrôlées</option></select></label><label><FieldLabel>Référence bénéficiaire</FieldLabel><input value={createDraft.beneficiaryReference} onChange={(event) => setCreateDraft((draft) => ({ ...draft, beneficiaryReference: event.target.value }))} placeholder="RIB / compte" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label><label className="sm:col-span-2"><FieldLabel>Échéance</FieldLabel><input type="date" value={createDraft.dueDate} onChange={(event) => setCreateDraft((draft) => ({ ...draft, dueDate: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label></div></Panel></div>
          <div className="space-y-5"><Panel><h3 className="text-lg font-black">3. Calcul verrouillé</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><FieldLabel>Montant client collecté *</FieldLabel><input type="number" min="0" step="0.01" value={createDraft.collectedAmount} onChange={(event) => setCreateDraft((draft) => ({ ...draft, collectedAmount: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label><label><FieldLabel>Taux contractuel</FieldLabel><div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 font-black text-blue-900">10% fixe · non modifiable</div></label><div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Commission brute</div><div className="mt-2 text-2xl font-black">{money(grossCommission)}</div></div><label><FieldLabel>Ajustement validé</FieldLabel><input type="number" step="0.01" value={createDraft.adjustment} onChange={(event) => setCreateDraft((draft) => ({ ...draft, adjustment: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label><label className="sm:col-span-2"><FieldLabel>Motif ajustement</FieldLabel><input value={createDraft.adjustmentReason} onChange={(event) => setCreateDraft((draft) => ({ ...draft, adjustmentReason: event.target.value }))} placeholder="Obligatoire si ajustement différent de 0" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label><div className="sm:col-span-2 rounded-2xl border border-blue-200 bg-blue-50 p-5"><div className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">Montant net dû</div><div className="mt-2 text-4xl font-black text-slate-950">{money(netDue)}</div><div className="mt-2 text-sm font-bold text-slate-600">Base {money(eligibleBase)} × 10% {adjustment ? `${adjustment > 0 ? "+" : "−"} ${money(Math.abs(adjustment))}` : ""}</div></div></div></Panel><Panel><h3 className="text-lg font-black">4. Preuves & note</h3><div className="mt-5 space-y-4"><label><FieldLabel>Preuve d’éligibilité *</FieldLabel><input value={createDraft.eligibilityEvidence} onChange={(event) => setCreateDraft((draft) => ({ ...draft, eligibilityEvidence: event.target.value }))} placeholder="Référence facture, paiement, validation conversion..." className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label><label><FieldLabel>Note financière</FieldLabel><textarea value={createDraft.note} onChange={(event) => setCreateDraft((draft) => ({ ...draft, note: event.target.value }))} rows={4} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label></div></Panel></div>
          <div className="space-y-5"><Panel><div className="flex items-center justify-between"><h3 className="text-lg font-black">Readiness incentive</h3><div className="text-3xl font-black">{createScore}%</div></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${createScore === 100 ? "bg-emerald-500" : "bg-blue-600"}`} style={{ width: `${createScore}%` }} /></div><div className="mt-5"><ReadinessList items={createReadiness} /></div></Panel><Panel><h3 className="text-lg font-black">Contrôle anti-doublon</h3><div className={`mt-4 rounded-2xl p-4 text-sm font-black ${duplicateRisk ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>{duplicateRisk ? "Un incentive actif existe déjà pour cette source. Création bloquée." : "Aucun incentive actif détecté sur cette source."}</div></Panel>{feedback && <div className={`rounded-2xl p-4 text-sm font-black ${feedback.type === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>{feedback.text}</div>}</div>
        </div>
      </ModalFrame>}

      {modal === "approve" && <ModalFrame title="Approbation financière contrôlée" subtitle="Contrôlez attribution, preuves, calcul 10%, risques et décision pour un ou plusieurs incentives." icon={ShieldCheck} onClose={() => setModal(null)} footer={<div className="flex items-center justify-between gap-4"><div className="text-sm font-black">{approvalDraft.ids.length} dossier(s) · {money(enriched.filter((item) => approvalDraft.ids.includes(String(item.id))).reduce((sum, item) => sum + item.amount, 0))}</div><div className="flex gap-2"><button onClick={() => setModal(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">Fermer</button><button disabled={busy || !approvalDraft.ids.length || !approvalDraft.note.trim()} onClick={submitApproval} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40">{busy ? "Traitement..." : "Décider & journaliser"}</button></div></div>}>
        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.1fr_0.85fr]">
          <Panel><h3 className="text-lg font-black">1. Dossiers à contrôler</h3><div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto">{pending.map((item) => <label key={String(item.id)} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${approvalDraft.ids.includes(String(item.id)) ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}><input type="checkbox" checked={approvalDraft.ids.includes(String(item.id))} onChange={() => toggleDraftId("approve", String(item.id))} /><div className="min-w-0 flex-1"><div className="truncate font-black">{item.ambassadorName}</div><div className="truncate text-xs font-bold text-slate-500">{item.sourceLabel}</div></div><div className="font-black">{money(item.amount)}</div></label>)}{pending.length === 0 && <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-black text-slate-500">Aucun dossier en attente.</div>}</div></Panel>
          <Panel><h3 className="text-lg font-black">2. Décision & gouvernance</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><FieldLabel>Décision *</FieldLabel><select value={approvalDraft.decision} onChange={(event) => setApprovalDraft((draft) => ({ ...draft, decision: event.target.value as ApprovalDraft["decision"] }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3"><option value="approved">Approuver</option><option value="correction">Retourner en correction</option><option value="rejected">Rejeter</option></select></label><label><FieldLabel>Approbateur *</FieldLabel><input value={approvalDraft.reviewer} onChange={(event) => setApprovalDraft((draft) => ({ ...draft, reviewer: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label>{approvalDraft.decision === "correction" && <label className="sm:col-span-2"><FieldLabel>Correction demandée</FieldLabel><textarea value={approvalDraft.correctionRequested} onChange={(event) => setApprovalDraft((draft) => ({ ...draft, correctionRequested: event.target.value }))} rows={3} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label>}<label className="sm:col-span-2"><FieldLabel>Note de décision obligatoire *</FieldLabel><textarea value={approvalDraft.note} onChange={(event) => setApprovalDraft((draft) => ({ ...draft, note: event.target.value }))} rows={5} placeholder="Justifiez la décision, les contrôles réalisés et les éventuelles réserves." className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label></div><div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-bold">La décision est appliquée ligne par ligne et conservée dans l’historique du dossier financier.</div></Panel>
          <div className="space-y-5"><Panel><h3 className="text-lg font-black">Contrôles de validation</h3><div className="mt-4"><ReadinessList items={[{ label: "Dossier(s) sélectionné(s)", ok: approvalDraft.ids.length > 0 }, { label: "Approbateur identifié", ok: Boolean(approvalDraft.reviewer.trim()) }, { label: "Note de décision", ok: Boolean(approvalDraft.note.trim()) }, { label: "Taux fixe 10% contrôlé", ok: approvalDraft.ids.every((id) => number(enriched.find((item) => String(item.id) === id)?.commissionRate) === COMMISSION_RATE) }, { label: "Aucun dossier déjà payé", ok: approvalDraft.ids.every((id) => !["paid", "reconciled"].includes(enriched.find((item) => String(item.id) === id)?.status || "")) }]} /></div></Panel>{feedback && <div className={`rounded-2xl p-4 text-sm font-black ${feedback.type === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>{feedback.text}</div>}</div>
        </div>
      </ModalFrame>}

      {modal === "payment" && <ModalFrame title="Préparer un lot de paiement" subtitle="Sélectionnez uniquement les incentives approuvés, contrôlez bénéficiaires, méthode, date et double validation avant exécution." icon={Banknote} onClose={() => setModal(null)} footer={<div className="flex items-center justify-between gap-4"><div className="text-sm font-black">{paymentDraft.ids.length} ligne(s) · Lot {paymentDraft.batchId} · {money(selectedPaymentTotal)}</div><div className="flex gap-2"><button onClick={() => setModal(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">Fermer</button><button disabled={busy || !paymentDraft.ids.length || !paymentDraft.executionDate || !paymentDraft.controlOwner.trim()} onClick={submitPaymentPreparation} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40">{busy ? "Préparation..." : "Créer le lot sans marquer payé"}</button></div></div>}>
        <div className="grid gap-5 xl:grid-cols-[1fr_1.05fr_0.85fr]">
          <Panel><h3 className="text-lg font-black">1. Incentives approuvés</h3><div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto">{toPay.map((item) => <label key={String(item.id)} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${paymentDraft.ids.includes(String(item.id)) ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}><input type="checkbox" checked={paymentDraft.ids.includes(String(item.id))} onChange={() => toggleDraftId("payment", String(item.id))} /><div className="min-w-0 flex-1"><div className="truncate font-black">{item.ambassadorName}</div><div className="truncate text-xs font-bold text-slate-500">{item.paymentMethod} · {item.period}</div></div><div className="font-black">{money(item.amount)}</div></label>)}{toPay.length === 0 && <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-black text-slate-500">Aucun incentive approuvé à préparer.</div>}</div></Panel>
          <Panel><h3 className="text-lg font-black">2. Configuration du lot</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><FieldLabel>Référence lot *</FieldLabel><input value={paymentDraft.batchId} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, batchId: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label><label><FieldLabel>Méthode</FieldLabel><select value={paymentDraft.paymentMethod} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, paymentMethod: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3"><option>Virement bancaire</option><option>Mobile Money</option><option>Espèces contrôlées</option></select></label><label><FieldLabel>Date d’exécution prévue *</FieldLabel><input type="date" value={paymentDraft.executionDate} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, executionDate: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label><label><FieldLabel>Référence bancaire préparatoire</FieldLabel><input value={paymentDraft.bankReference} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, bankReference: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label><label><FieldLabel>Préparé par *</FieldLabel><input value={paymentDraft.preparedBy} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, preparedBy: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label><label><FieldLabel>Double contrôle *</FieldLabel><input value={paymentDraft.controlOwner} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, controlOwner: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label><label className="sm:col-span-2"><FieldLabel>Note de préparation</FieldLabel><textarea value={paymentDraft.note} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, note: event.target.value }))} rows={4} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label></div></Panel>
          <div className="space-y-5"><Panel><h3 className="text-lg font-black">Résumé du lot</h3><div className="mt-5 space-y-3"><div className="flex justify-between rounded-2xl bg-slate-50 p-4 font-black"><span>Bénéficiaires</span><span>{paymentDraft.ids.length}</span></div><div className="flex justify-between rounded-2xl bg-slate-50 p-4 font-black"><span>Total net</span><span>{money(selectedPaymentTotal)}</span></div><div className="flex justify-between rounded-2xl bg-slate-50 p-4 font-black"><span>Statut créé</span><span>Paiement préparé</span></div></div><div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-black text-amber-900">Aucun paiement ne sera marqué « Payé » avant confirmation réelle et rapprochement.</div></Panel>{feedback && <div className={`rounded-2xl p-4 text-sm font-black ${feedback.type === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>{feedback.text}</div>}</div>
        </div>
      </ModalFrame>}

      {modal === "reconcile" && <ModalFrame title="Rapprocher les paiements" subtitle="Comparez montant attendu et réellement payé, référence bancaire, date de valeur et écarts avant clôture financière." icon={FileCheck2} onClose={() => setModal(null)} footer={<div className="flex items-center justify-between gap-4"><div className="text-sm font-black">Attendu {money(expectedReconcile)} · Réel {money(reconcileDraft.actualPaid || expectedReconcile)} · Écart {money(number(reconcileDraft.actualPaid || expectedReconcile) - expectedReconcile)}</div><div className="flex gap-2"><button onClick={() => setModal(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">Fermer</button><button disabled={busy || !reconcileDraft.ids.length || !reconcileDraft.paymentReference.trim() || !reconcileDraft.valueDate} onClick={submitReconciliation} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40">{busy ? "Rapprochement..." : "Rapprocher & journaliser"}</button></div></div>}>
        <div className="grid gap-5 xl:grid-cols-[1fr_1.05fr_0.85fr]">
          <Panel><h3 className="text-lg font-black">1. Lignes à rapprocher</h3><div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto">{enriched.filter((item) => ["payment_prepared", "paid", "disputed"].includes(item.status)).map((item) => <label key={String(item.id)} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${reconcileDraft.ids.includes(String(item.id)) ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}><input type="checkbox" checked={reconcileDraft.ids.includes(String(item.id))} onChange={() => toggleDraftId("reconcile", String(item.id))} /><div className="min-w-0 flex-1"><div className="truncate font-black">{item.ambassadorName}</div><div className="truncate text-xs font-bold text-slate-500">{item.batchId || "Sans lot"} · {statusLabels[item.status]}</div></div><div className="font-black">{money(item.amount)}</div></label>)}</div></Panel>
          <Panel><h3 className="text-lg font-black">2. Preuve de règlement</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><FieldLabel>Référence paiement *</FieldLabel><input value={reconcileDraft.paymentReference} onChange={(event) => setReconcileDraft((draft) => ({ ...draft, paymentReference: event.target.value }))} placeholder="Référence banque / mobile money" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label><label><FieldLabel>Date de valeur *</FieldLabel><input type="date" value={reconcileDraft.valueDate} onChange={(event) => setReconcileDraft((draft) => ({ ...draft, valueDate: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label><label><FieldLabel>Montant réellement payé</FieldLabel><input type="number" min="0" step="0.01" value={reconcileDraft.actualPaid} onChange={(event) => setReconcileDraft((draft) => ({ ...draft, actualPaid: event.target.value }))} placeholder={String(expectedReconcile)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label><label><FieldLabel>Responsable *</FieldLabel><input value={reconcileDraft.reconciledBy} onChange={(event) => setReconcileDraft((draft) => ({ ...draft, reconciledBy: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label><label><FieldLabel>Décision</FieldLabel><select value={reconcileDraft.decision} onChange={(event) => setReconcileDraft((draft) => ({ ...draft, decision: event.target.value as ReconcileDraft["decision"] }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3"><option value="matched">Correspondance complète</option><option value="difference">Écart à corriger</option><option value="disputed">Ouvrir litige</option></select></label><label className="sm:col-span-2"><FieldLabel>Note de rapprochement</FieldLabel><textarea value={reconcileDraft.note} onChange={(event) => setReconcileDraft((draft) => ({ ...draft, note: event.target.value }))} rows={4} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" /></label></div></Panel>
          <div className="space-y-5"><Panel><h3 className="text-lg font-black">Contrôle d’équilibre</h3><div className="mt-5 space-y-3"><div className="flex justify-between rounded-2xl bg-slate-50 p-4 font-black"><span>Montant attendu</span><span>{money(expectedReconcile)}</span></div><div className="flex justify-between rounded-2xl bg-slate-50 p-4 font-black"><span>Montant réel</span><span>{money(reconcileDraft.actualPaid || expectedReconcile)}</span></div><div className={`flex justify-between rounded-2xl p-4 font-black ${Math.abs(number(reconcileDraft.actualPaid || expectedReconcile) - expectedReconcile) < 0.01 ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}><span>Écart</span><span>{money(number(reconcileDraft.actualPaid || expectedReconcile) - expectedReconcile)}</span></div></div></Panel>{feedback && <div className={`rounded-2xl p-4 text-sm font-black ${feedback.type === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>{feedback.text}</div>}</div>
        </div>
      </ModalFrame>}

      {modal === "export" && <ModalFrame title="Exporter l’état financier" subtitle="Composez un export CSV opérationnel ou JSON structuré à partir des seuls dossiers réels du périmètre choisi." icon={Download} onClose={() => setModal(null)} width="max-w-[1180px]" footer={<div className="flex items-center justify-between gap-4"><div className="text-sm font-black">{exportDraft.columns.length} colonne(s) sélectionnée(s)</div><div className="flex gap-2"><button onClick={() => setModal(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">Annuler</button><button disabled={!exportDraft.columns.length} onClick={generateExport} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40"><Download size={16} className="mr-2 inline" />Générer l’export</button></div></div>}>
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><Panel><h3 className="text-lg font-black">Périmètre</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><FieldLabel>Format</FieldLabel><select value={exportDraft.format} onChange={(event) => setExportDraft((draft) => ({ ...draft, format: event.target.value as ExportDraft["format"] }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3"><option value="csv">CSV opérationnel</option><option value="json">JSON structuré</option></select></label><label><FieldLabel>Statut</FieldLabel><select value={exportDraft.status} onChange={(event) => setExportDraft((draft) => ({ ...draft, status: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3"><option value="all">Tous</option>{statusOrder.map((status) => <option key={status} value={status}>{statusLabels[status] || status}</option>)}</select></label><label><FieldLabel>Période</FieldLabel><select value={exportDraft.period} onChange={(event) => setExportDraft((draft) => ({ ...draft, period: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3"><option value="all">Toutes</option>{periods.map((period) => <option key={period} value={period}>{period}</option>)}</select></label><label><FieldLabel>Ville</FieldLabel><select value={exportDraft.city} onChange={(event) => setExportDraft((draft) => ({ ...draft, city: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3"><option value="all">Toutes</option>{cities.map((city) => <option key={city} value={city}>{city}</option>)}</select></label></div></Panel><Panel><h3 className="text-lg font-black">Colonnes du rapport</h3><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[{ key: "reference", label: "Référence" }, { key: "ambassador", label: "Ambassadeur" }, { key: "city", label: "Ville" }, { key: "period", label: "Période" }, { key: "source", label: "Origine" }, { key: "base", label: "Base éligible" }, { key: "rate", label: "Taux" }, { key: "net", label: "Net dû" }, { key: "status", label: "Statut" }, { key: "method", label: "Méthode" }, { key: "due", label: "Échéance" }, { key: "batch", label: "Lot" }].map((column) => <label key={column.key} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 font-black ${exportDraft.columns.includes(column.key) ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}><input type="checkbox" checked={exportDraft.columns.includes(column.key)} onChange={() => setExportDraft((draft) => ({ ...draft, columns: draft.columns.includes(column.key) ? draft.columns.filter((item) => item !== column.key) : [...draft.columns, column.key] }))} />{column.label}</label>)}</div></Panel></div>
      </ModalFrame>}

      {detail && <div className="fixed inset-0 z-[10055] bg-slate-950/30 backdrop-blur-sm" onClick={() => setDetailId(null)}><aside className="absolute right-0 top-0 h-full w-full max-w-[680px] overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><div className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">Dossier financier</div><h2 className="mt-2 text-2xl font-black">{detail.ambassadorName}</h2><p className="mt-1 text-sm font-bold text-slate-600">{detail.sourceLabel} · {detail.period}</p></div><button onClick={() => setDetailId(null)} className="rounded-xl border border-slate-200 p-3"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><MetricCard label="Base éligible" value={money(detail.eligibleBase)} helper="Montant client retenu" icon={ReceiptText} /><MetricCard label="Commission" value={money(detail.amount)} helper={`${detail.commissionRate}% fixe`} icon={CircleDollarSign} tone="green" /></div><div className="mt-5 space-y-5"><Panel><h3 className="text-lg font-black">Calcul</h3><div className="mt-4 space-y-3 text-sm font-bold"><div className="flex justify-between"><span>Base éligible</span><span>{money(detail.eligibleBase)}</span></div><div className="flex justify-between"><span>Taux</span><span>{detail.commissionRate}%</span></div><div className="flex justify-between"><span>Commission brute</span><span>{money(detail.meta.calculation?.grossCommission)}</span></div><div className="flex justify-between"><span>Ajustement</span><span>{money(detail.adjustment)}</span></div><div className="flex justify-between border-t border-slate-200 pt-3 text-base font-black"><span>Net dû</span><span>{money(detail.amount)}</span></div></div></Panel><Panel><h3 className="text-lg font-black">Paiement & gouvernance</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{[["Statut", statusLabels[detail.status] || detail.status], ["Méthode", detail.paymentMethod], ["Échéance", humanDate(detail.dueDate)], ["Lot", detail.batchId || "—"], ["Référence", detail.meta.payment?.paymentReference || "—"], ["Date de valeur", humanDate(detail.meta.payment?.valueDate)]].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</div><div className="mt-2 font-black">{value}</div></div>)}</div></Panel><Panel><h3 className="text-lg font-black">Historique auditable</h3><div className="mt-4 space-y-3">{(detail.meta.history || []).slice().reverse().map((entry, index) => <div key={`${entry.at}-${index}`} className="border-l-2 border-blue-200 pl-4"><div className="font-black">{entry.action}</div><div className="text-xs font-bold text-slate-500">{humanDate(entry.at)} · {entry.actor || "AngelCare OPS"}</div>{entry.note && <div className="mt-1 text-sm font-bold text-slate-600">{entry.note}</div>}</div>)}{!(detail.meta.history || []).length && <div className="rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-500">Aucun historique enrichi disponible.</div>}</div></Panel></div></aside></div>}
    </div>
  )
}
