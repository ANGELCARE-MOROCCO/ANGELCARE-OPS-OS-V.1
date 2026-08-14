"use client"

import React, { type ComponentType, type ReactNode } from "react"
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
  muted: "Silencieuse", pinned: "Épinglée", restored: "Restaurée", removed: "Retiré",
  revoked: "Révoqué", test: "Test", review: "À valider", in_review: "À valider",
}

const GOOD = new Set(["active", "approved", "completed", "connected", "delivered", "online", "read", "received", "resolved", "running", "sent"])
const BAD = new Set(["authentication_lost", "cancelled", "critical", "urgent", "disconnected", "error", "failed", "offline", "suspended", "revoked", "removed"])
const WARNING = new Set(["authenticating", "degraded", "escalated", "high", "pairing_required", "paused", "processing", "qr_required", "queued", "rate_limited", "reconnecting", "scheduled", "scheduled_followup", "starting", "waiting_customer", "waiting_internal", "warning", "review", "in_review"])

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
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : tone === "bad"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-slate-200 bg-slate-50 text-slate-700"
  return (
    <span className={cx("inline-flex shrink-0 items-center rounded-full border font-black tracking-[-.01em] shadow-[0_1px_1px_rgba(7,20,38,.025)]", compact ? "gap-1 px-2 py-1 text-[9px]" : "gap-1.5 px-2.5 py-1.5 text-[10px]", classes)}>
      {tone === "good" ? <CheckCircle2 className="h-3 w-3" /> : tone === "bad" ? <AlertTriangle className="h-3 w-3" /> : tone === "warning" ? <Clock3 className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5 fill-current opacity-45" />}
      {label || statusLabel(status)}
    </span>
  )
}

export function SectionTitle({ eyebrow, title, description, action, meta }: { eyebrow: string; title: string; description?: string; action?: ReactNode; meta?: ReactNode }) {
  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-[18px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#fbfdff_68%,#f5f9ff_100%)] px-5 py-4 shadow-[0_1px_2px_rgba(7,20,38,.02),0_12px_34px_rgba(7,20,38,.045)] xl:flex-row xl:items-end xl:justify-between"><span className="absolute inset-y-0 left-0 w-1 bg-[linear-gradient(180deg,#0ea5e9,#2563eb,#7c3aed)]" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5"><p className="text-[9px] font-black uppercase tracking-[.18em] text-slate-500">{eyebrow}</p>{meta}</div>
        <h1 className="mt-1.5 max-w-5xl text-[clamp(1.45rem,2.1vw,2.15rem)] font-black leading-[1.04] tracking-[-.048em] text-slate-950">{title}</h1>
        {description ? <p className="mt-2 max-w-4xl text-[12px] font-semibold leading-5 text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export type MetricTone = "slate" | "emerald" | "rose" | "blue" | "violet" | "amber"
export function Metric({ label, value, detail, icon: Icon, tone = "slate", trend }: { label: string; value: ReactNode; detail?: string; icon?: ComponentType<{ className?: string }>; tone?: MetricTone; trend?: ReactNode }) {
  const iconTone: Record<MetricTone, string> = { slate: "bg-slate-950 text-white", emerald: "bg-emerald-50 text-emerald-700", rose: "bg-rose-50 text-rose-700", blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700", amber: "bg-amber-50 text-amber-700" }
  return (
    <div className="group relative min-w-0 bg-white px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[.15em] text-slate-500">{label}</p>
          <div className="mt-1 flex min-w-0 items-baseline gap-2"><p className="truncate text-[22px] font-black leading-none tracking-[-.04em] text-slate-950 tabular-nums">{value}</p>{trend ? <div>{trend}</div> : null}</div>
          {detail ? <p className="mt-1.5 truncate text-[9px] font-semibold text-slate-500">{detail}</p> : null}
        </div>
        {Icon ? <div className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-xl", iconTone[tone])}><Icon className="h-4 w-4" /></div> : null}
      </div>
    </div>
  )
}

export function EmptyState({ title, description, icon: Icon = WifiOff, action, compact = false }: { title: string; description: string; icon?: ComponentType<{ className?: string }>; action?: ReactNode; compact?: boolean }) {
  return (
    <div className={cx("grid place-items-center border border-dashed border-slate-300 bg-slate-50/70 px-8 text-center", compact ? "min-h-36 rounded-2xl py-6" : "min-h-56 rounded-[20px] py-10")}>
      <div><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm"><Icon className="h-5 w-5" /></div><p className="mt-3 text-[14px] font-black tracking-[-.02em] text-slate-950">{title}</p><p className="mx-auto mt-1.5 max-w-md text-[11px] font-semibold leading-5 text-slate-500">{description}</p>{action ? <div className="mt-4">{action}</div> : null}</div>
    </div>
  )
}

export function LoadingPanel({ label = "Synchronisation AC WhatsApp Live" }: { label?: string }) {
  return <div className="grid min-h-[62vh] place-items-center rounded-[18px] border border-slate-200 bg-white"><div className="text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg"><LoaderCircle className="h-5 w-5 animate-spin" /></div><p className="mt-3 text-[9px] font-black uppercase tracking-[.18em] text-slate-500">{label}</p></div></div>
}

export function LiveDot({ online, label }: { online: boolean; label?: string }) {
  return <span className={cx("inline-flex items-center gap-1.5 text-[9px] font-extrabold", online ? "text-emerald-700" : "text-rose-700")}>{online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}{label || (online ? "Temps réel actif" : "Runtime indisponible")}</span>
}

export function HealthBadge({ good, goodLabel, badLabel }: { good: boolean; goodLabel: string; badLabel: string }) {
  return <span className={cx("inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[.08em]", good ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800")}>{good ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}{good ? goodLabel : badLabel}</span>
}

export function NoticeBanner({ tone = "info", title, description, action, onClose, reference }: { tone?: "info" | "success" | "warning" | "danger"; title: string; description?: string; action?: ReactNode; onClose?: () => void; reference?: string }) {
  const palette = tone === "info" ? "border-blue-200 bg-blue-50 text-blue-950" : tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-950" : tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-rose-200 bg-rose-50 text-rose-950"
  const Icon = tone === "success" ? CheckCircle2 : tone === "info" ? ShieldCheck : AlertTriangle
  return <div className={cx("flex items-start gap-3 rounded-xl border px-3.5 py-3", palette)}><Icon className="mt-0.5 h-4 w-4 shrink-0" /><div className="min-w-0 flex-1"><p className="text-[11px] font-black">{title}</p>{description ? <p className="mt-1 text-[10px] font-semibold leading-4 opacity-80">{description}</p> : null}{reference ? <p className="mt-1 font-mono text-[10px] font-bold opacity-55">Référence : {reference}</p> : null}</div>{action}{onClose ? <button type="button" onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg hover:bg-white/60"><X className="h-3.5 w-3.5" /></button> : null}</div>
}

export function Surface({ children, className, padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return <section className={cx("overflow-hidden rounded-[20px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fdfefe_100%)] shadow-[0_1px_2px_rgba(7,20,38,.025),0_14px_38px_rgba(7,20,38,.05)]", padded && "p-4", className)}>{children}</section>
}

export function SurfaceHeader({ eyebrow, title, description, action, icon: Icon }: { eyebrow?: string; title: string; description?: string; action?: ReactNode; icon?: ComponentType<{ className?: string }> }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 items-start gap-3">{Icon ? <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[linear-gradient(145deg,#071426,#102442)] text-white shadow-[0_8px_18px_rgba(7,20,38,.13)]"><Icon className="h-4 w-4" /></div> : null}<div className="min-w-0">{eyebrow ? <p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{eyebrow}</p> : null}<h2 className="mt-0.5 text-[15px] font-black tracking-[-.03em] text-slate-950">{title}</h2>{description ? <p className="mt-1 max-w-2xl text-[10px] font-semibold leading-4 text-slate-500">{description}</p> : null}</div></div>{action ? <div className="shrink-0">{action}</div> : null}</div>
}

export function ProgressBar({ value, tone = "emerald", label }: { value: number; tone?: "emerald" | "rose" | "blue" | "amber" | "violet"; label?: string }) {
  const normalized = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  const bar = { emerald: "bg-emerald-500", rose: "bg-rose-500", blue: "bg-blue-500", amber: "bg-amber-500", violet: "bg-violet-500" }[tone]
  return <div>{label ? <div className="mb-1.5 flex items-center justify-between text-[9px] font-bold text-slate-600"><span>{label}</span><span className="tabular-nums">{Math.round(normalized)}%</span></div> : null}<div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={cx("h-full rounded-full transition-all duration-300", bar)} style={{ width: `${normalized}%` }} /></div></div>
}

export function WorkspaceTabs({ tabs, active, onChange }: { tabs: Array<{ id: string; label: string; icon?: ComponentType<{ className?: string }>; count?: number }>; active: string; onChange: (id: string) => void }) {
  return <div className="flex gap-0.5 overflow-x-auto border-b border-slate-200 bg-white px-1">{tabs.map((tab) => { const Icon = tab.icon; const selected = tab.id === active; return <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={cx("relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-[10px] font-extrabold transition", selected ? "text-slate-950" : "text-slate-500 hover:text-slate-900")}>{Icon ? <Icon className="h-3.5 w-3.5" /> : null}{tab.label}{typeof tab.count === "number" ? <span className={cx("rounded-full px-1.5 py-0.5 text-[10px]", selected ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600")}>{tab.count}</span> : null}{selected ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-slate-950" /> : null}</button>})}</div>
}

export function ModalFrame({ title, eyebrow, description, children, footer, onClose, wide = false }: { title: string; eyebrow?: string; description?: string; children: ReactNode; footer?: ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="fixed inset-x-0 bottom-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" style={{ top: "var(--acw-shell-top, 52px)" }}><button type="button" className="absolute inset-0" aria-label="Fermer" onClick={onClose} /><div role="dialog" aria-modal="true" className={cx("acw-apex-floating-surface relative max-h-[92vh] w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(7,20,38,.26)]", wide ? "max-w-5xl" : "max-w-2xl")}><div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[linear-gradient(145deg,#ffffff,#f7faff)] px-5 py-4"><div>{eyebrow ? <p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{eyebrow}</p> : null}<h3 className="mt-0.5 text-[19px] font-black tracking-[-.035em] text-slate-950">{title}</h3>{description ? <p className="mt-1 max-w-3xl text-[10px] font-semibold leading-4 text-slate-500">{description}</p> : null}</div><button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><X className="h-4 w-4" /></button></div><div className="max-h-[68vh] overflow-y-auto p-5">{children}</div>{footer ? <div className="border-t border-slate-200 bg-slate-50/80 px-5 py-3.5">{footer}</div> : null}</div></div>
}

export function DrawerFrame({ title, eyebrow, description, children, footer, onClose, wide = false }: { title: string; eyebrow?: string; description?: string; children: ReactNode; footer?: ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="fixed inset-x-0 bottom-0 z-[105] bg-slate-950/35 backdrop-blur-[2px]" style={{ top: "var(--acw-shell-top, 52px)" }}><button type="button" aria-label="Fermer" className="absolute inset-0" onClick={onClose} /><aside data-apex-drawer role="dialog" aria-modal="true" className={cx("acw-apex-floating-surface absolute inset-y-0 right-0 flex w-full flex-col border-l border-slate-200 bg-white shadow-[0_0_90px_rgba(7,20,38,.24)]", wide ? "max-w-3xl" : "max-w-xl")}><header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4"><div>{eyebrow ? <p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{eyebrow}</p> : null}<h3 className="mt-0.5 text-[20px] font-black tracking-[-.035em] text-slate-950">{title}</h3>{description ? <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{description}</p> : null}</div><button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><X className="h-4 w-4" /></button></header><div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>{footer ? <footer className="border-t border-slate-200 bg-slate-50/80 px-5 py-3.5">{footer}</footer> : null}</aside></div>
}

export function DetailRow({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0"><span className="text-[10px] font-black uppercase tracking-[.11em] text-slate-500">{label}</span><span className={cx("max-w-[68%] text-right text-[10px] font-bold text-slate-800", mono && "font-mono")}>{value || "—"}</span></div>
}

export function ActionLink({ label, onClick, danger = false, disabled = false }: { label: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={cx("inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-[9px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-45", danger ? "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50")}>{label}<ChevronRight className="h-3 w-3" /></button>
}
export function ReasonConfirmDialog({ title, description, confirmLabel, onClose, onConfirm, danger = false, confirmationText }: { title: string; description: string; confirmLabel: string; onClose: () => void; onConfirm: (reason: string) => Promise<void> | void; danger?: boolean; confirmationText?: string }) {
  const [reason, setReason] = React.useState("")
  const [typed, setTyped] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const allowed = Boolean(reason.trim()) && (!confirmationText || typed.trim() === confirmationText)
  return <ModalFrame title={title} eyebrow={danger ? "Action sensible" : "Confirmation opérationnelle"} description={description} onClose={onClose} footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[9px] font-black text-slate-700 hover:bg-slate-50">Annuler</button><button type="button" disabled={!allowed || busy} onClick={async () => { setBusy(true); try { await onConfirm(reason.trim()) } finally { setBusy(false) } }} className={cx("rounded-lg px-3.5 py-2.5 text-[9px] font-black text-white disabled:opacity-40", danger ? "bg-rose-600" : "bg-slate-950")}>{busy ? "Exécution…" : confirmLabel}</button></div>}>
    <div className="space-y-4"><label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[.13em] text-slate-500">Motif obligatoire</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} autoFocus placeholder="Expliquez la raison de cette action…" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[11px] font-semibold text-slate-950 outline-none focus:border-slate-600" /></label>{confirmationText ? <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[.13em] text-slate-500">Confirmation</span><p className="mb-2 text-[9px] font-semibold text-slate-500">Saisissez <strong className="font-mono text-slate-950">{confirmationText}</strong> pour continuer.</p><input value={typed} onChange={(event) => setTyped(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono text-[10px] font-bold text-slate-950 outline-none focus:border-slate-600" /></label> : null}</div>
  </ModalFrame>
}
