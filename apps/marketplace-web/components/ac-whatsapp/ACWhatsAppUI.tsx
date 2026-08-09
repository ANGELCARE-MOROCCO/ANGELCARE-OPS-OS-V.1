"use client"

import type { ComponentType, ReactNode } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  LoaderCircle,
  ShieldCheck,
  Wifi,
  WifiOff,
  X,
} from "lucide-react"

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ")
}

const LABELS: Record<string, string> = {
  active: "Actif", approved: "Approuvé", archived: "Archivé", assigned: "Attribuée",
  authenticating: "Authentification", cancelled: "Annulé", closed: "Clôturée",
  completed: "Terminée", connected: "Connecté", degraded: "Dégradé", delivered: "Livré",
  disconnected: "Déconnecté", draft: "Brouillon", error: "Erreur", escalated: "Escaladée",
  failed: "Échec", in_progress: "En traitement", new: "Nouvelle", offline: "Hors ligne",
  online: "En ligne", pairing_required: "Appairage requis", paused: "En pause",
  processing: "Traitement", qr_required: "QR requis", queued: "En file",
  rate_limited: "Rythme limité", read: "Lu", received: "Reçu", reconnecting: "Reconnexion",
  reopened: "Rouverte", resolved: "Résolue", running: "En cours", scheduled: "Programmée",
  scheduled_followup: "Relance programmée", sent: "Envoyé", starting: "Démarrage",
  suspended: "Suspendu", unassigned: "Non attribuée", waiting_customer: "Attente client",
  waiting_internal: "Attente interne", warning: "Attention", critical: "Critique",
  normal: "Normale", low: "Basse", high: "Élevée", urgent: "Urgente", vip: "VIP",
  customer: "Client", prospect: "Prospect", partner: "Partenaire", unqualified: "Contact non qualifié",
  muted: "Silencieuse", pinned: "Épinglée", restored: "Restaurée",
}

const GOOD = new Set(["active", "approved", "completed", "connected", "delivered", "online", "read", "received", "resolved", "running", "sent"])
const BAD = new Set(["authentication_lost", "cancelled", "critical", "urgent", "disconnected", "error", "failed", "offline", "suspended"])
const WARNING = new Set(["authenticating", "degraded", "escalated", "high", "pairing_required", "paused", "processing", "qr_required", "queued", "rate_limited", "reconnecting", "scheduled", "scheduled_followup", "starting", "waiting_customer", "waiting_internal", "warning"])

export function statusLabel(status?: string | null) {
  const key = String(status || "unknown").toLowerCase()
  if (["unknown", "undefined", "null", "n/a"].includes(key)) return "À confirmer"
  return LABELS[key] || key.replaceAll("_", " ")
}

export function statusTone(status?: string | null) {
  const key = String(status || "unknown").toLowerCase()
  if (GOOD.has(key)) return "good" as const
  if (BAD.has(key)) return "bad" as const
  if (WARNING.has(key)) return "warning" as const
  return "neutral" as const
}

export function StatusPill({ status, label, compact = false }: { status: string; label?: string; compact?: boolean }) {
  const tone = statusTone(status)
  const classes = tone === "good"
    ? "border-emerald-300 bg-emerald-100 text-emerald-950"
    : tone === "bad"
      ? "border-rose-300 bg-rose-100 text-rose-950"
      : tone === "warning"
        ? "border-amber-300 bg-amber-100 text-amber-950"
        : "border-slate-300 bg-white text-slate-950"
  return (
    <span className={cx("inline-flex shrink-0 items-center rounded-full border font-black uppercase tracking-[.11em] shadow-sm", compact ? "gap-1 px-2 py-1 text-[8px]" : "gap-1.5 px-2.5 py-1.5 text-[9px]", classes)}>
      {tone === "good" ? <CheckCircle2 className="h-3 w-3" /> : tone === "bad" ? <AlertTriangle className="h-3 w-3" /> : tone === "warning" ? <Clock3 className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5 fill-current opacity-45" />}
      {label || statusLabel(status)}
    </span>
  )
}

export function SectionTitle({ eyebrow, title, description, action, meta }: { eyebrow: string; title: string; description?: string; action?: ReactNode; meta?: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3"><p className="text-[9px] font-black uppercase tracking-[.22em] text-rose-600">{eyebrow}</p>{meta}</div>
        <h1 className="mt-2 max-w-5xl text-[clamp(1.75rem,3vw,3rem)] font-black leading-[.98] tracking-[-.055em] text-slate-950">{title}</h1>
        {description ? <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export type MetricTone = "slate" | "emerald" | "rose" | "blue" | "violet" | "amber"
export function Metric({ label, value, detail, icon: Icon, tone = "slate", trend }: { label: string; value: ReactNode; detail?: string; icon?: ComponentType<{ className?: string }>; tone?: MetricTone; trend?: ReactNode }) {
  const iconTone: Record<MetricTone, string> = { slate: "bg-slate-950 text-white", emerald: "bg-emerald-600 text-white", rose: "bg-rose-600 text-white", blue: "bg-blue-600 text-white", violet: "bg-violet-600 text-white", amber: "bg-amber-500 text-white" }
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,.045)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_45px_rgba(15,23,42,.075)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-[8px] font-black uppercase tracking-[.17em] text-slate-400">{label}</p><p className="mt-2 truncate text-2xl font-black tracking-[-.045em] text-slate-950">{value}</p>{detail ? <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{detail}</p> : null}{trend ? <div className="mt-2">{trend}</div> : null}</div>
        {Icon ? <div className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-2xl shadow-sm", iconTone[tone])}><Icon className="h-4 w-4" /></div> : null}
      </div>
    </div>
  )
}

export function EmptyState({ title, description, icon: Icon = WifiOff, action, compact = false }: { title: string; description: string; icon?: ComponentType<{ className?: string }>; action?: ReactNode; compact?: boolean }) {
  return (
    <div className={cx("grid place-items-center rounded-[26px] border border-dashed border-slate-300 bg-[radial-gradient(circle_at_50%_0%,#ffffff_0,#f8fafc_58%,#f1f5f9_100%)] p-8 text-center", compact ? "min-h-44" : "min-h-64")}> 
      <div><div className="mx-auto grid h-14 w-14 place-items-center rounded-[22px] border border-slate-200 bg-white text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,.08)]"><Icon className="h-6 w-6" /></div><p className="mt-4 text-base font-black tracking-[-.02em] text-slate-950">{title}</p><p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div>
    </div>
  )
}

export function LoadingPanel({ label = "Synchronisation AC WhatsApp Live" }: { label?: string }) {
  return <div className="grid min-h-[70vh] place-items-center rounded-[28px] border border-slate-200 bg-white"><div className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-[24px] bg-slate-950 text-white shadow-2xl shadow-slate-950/15"><LoaderCircle className="h-7 w-7 animate-spin" /></div><p className="mt-4 text-[10px] font-black uppercase tracking-[.2em] text-slate-400">{label}</p></div></div>
}

export function LiveDot({ online, label }: { online: boolean; label?: string }) {
  return <span className={cx("inline-flex items-center gap-1.5 text-[10px] font-black", online ? "text-emerald-600" : "text-rose-600")}>{online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}{label || (online ? "Temps réel actif" : "Runtime indisponible")}</span>
}

export function HealthBadge({ good, goodLabel, badLabel }: { good: boolean; goodLabel: string; badLabel: string }) {
  return <span className={cx("inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[9px] font-black uppercase tracking-[.1em]", good ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700")}>{good ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}{good ? goodLabel : badLabel}</span>
}

export function NoticeBanner({ tone = "info", title, description, action, onClose, reference }: { tone?: "info" | "success" | "warning" | "danger"; title: string; description?: string; action?: ReactNode; onClose?: () => void; reference?: string }) {
  const palette = tone === "info" ? "border-blue-200 bg-blue-50 text-blue-900" : tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-rose-200 bg-rose-50 text-rose-900"
  const Icon = tone === "success" ? CheckCircle2 : tone === "info" ? ShieldCheck : AlertTriangle
  return <div className={cx("flex items-start gap-3 rounded-2xl border px-4 py-3", palette)}><Icon className="mt-0.5 h-4 w-4 shrink-0" /><div className="min-w-0 flex-1"><p className="text-xs font-black">{title}</p>{description ? <p className="mt-1 text-[10px] font-semibold leading-5 opacity-75">{description}</p> : null}{reference ? <p className="mt-1 font-mono text-[8px] font-bold opacity-55">Référence : {reference}</p> : null}</div>{action}{onClose ? <button type="button" onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg hover:bg-white/60"><X className="h-3.5 w-3.5" /></button> : null}</div>
}

export function Surface({ children, className, padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return <section className={cx("overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,.05)]", padded && "p-5", className)}>{children}</section>
}

export function SurfaceHeader({ eyebrow, title, description, action, icon: Icon }: { eyebrow?: string; title: string; description?: string; action?: ReactNode; icon?: ComponentType<{ className?: string }> }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 items-start gap-3">{Icon ? <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white"><Icon className="h-4 w-4" /></div> : null}<div className="min-w-0">{eyebrow ? <p className="text-[8px] font-black uppercase tracking-[.18em] text-rose-600">{eyebrow}</p> : null}<h2 className="mt-1 text-lg font-black tracking-[-.035em] text-slate-950">{title}</h2>{description ? <p className="mt-1 max-w-2xl text-[10px] font-semibold leading-5 text-slate-500">{description}</p> : null}</div></div>{action ? <div className="shrink-0">{action}</div> : null}</div>
}

export function ProgressBar({ value, tone = "emerald", label }: { value: number; tone?: "emerald" | "rose" | "blue" | "amber" | "violet"; label?: string }) {
  const normalized = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  const bar = { emerald: "bg-emerald-500", rose: "bg-rose-500", blue: "bg-blue-500", amber: "bg-amber-500", violet: "bg-violet-500" }[tone]
  return <div>{label ? <div className="mb-1.5 flex items-center justify-between text-[9px] font-black text-slate-500"><span>{label}</span><span>{Math.round(normalized)}%</span></div> : null}<div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={cx("h-full rounded-full transition-all duration-500", bar)} style={{ width: `${normalized}%` }} /></div></div>
}

export function WorkspaceTabs({ tabs, active, onChange }: { tabs: Array<{ id: string; label: string; icon?: ComponentType<{ className?: string }>; count?: number }>; active: string; onChange: (id: string) => void }) {
  return <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1.5">{tabs.map((tab) => { const Icon = tab.icon; const selected = tab.id === active; return <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={cx("flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-black transition", selected ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-slate-900")}>{Icon ? <Icon className="h-3.5 w-3.5" /> : null}{tab.label}{typeof tab.count === "number" ? <span className={cx("rounded-full px-1.5 py-0.5 text-[8px]", selected ? "bg-white/15 text-white" : "bg-white text-slate-500")}>{tab.count}</span> : null}</button>})}</div>
}

export function ModalFrame({ title, eyebrow, description, children, footer, onClose, wide = false }: { title: string; eyebrow?: string; description?: string; children: ReactNode; footer?: ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"><button type="button" className="absolute inset-0" aria-label="Fermer" onClick={onClose} /><div className={cx("relative max-h-[92vh] w-full overflow-hidden rounded-[30px] border border-white/30 bg-white shadow-2xl", wide ? "max-w-5xl" : "max-w-2xl")}><div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5"><div>{eyebrow ? <p className="text-[8px] font-black uppercase tracking-[.18em] text-rose-600">{eyebrow}</p> : null}<h3 className="mt-1 text-xl font-black tracking-[-.04em] text-slate-950">{title}</h3>{description ? <p className="mt-1 text-[10px] font-semibold leading-5 text-slate-500">{description}</p> : null}</div><button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button></div><div className="max-h-[68vh] overflow-y-auto p-5">{children}</div>{footer ? <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">{footer}</div> : null}</div></div>
}

export function DetailRow({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0"><span className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{label}</span><span className={cx("max-w-[65%] text-right text-[10px] font-bold text-slate-700", mono && "font-mono")}>{value || "—"}</span></div>
}

export function ActionLink({ label, onClick, danger = false, disabled = false }: { label: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={cx("inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-[9px] font-black transition disabled:cursor-not-allowed disabled:opacity-45", danger ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50")}>{label}<ChevronRight className="h-3 w-3" /></button>
}
