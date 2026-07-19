"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { AlertTriangle, CheckCircle2, ChevronRight, Info, ShieldCheck, Sparkles, X } from "lucide-react"

export type EnterpriseDrawerTone = "sky" | "indigo" | "violet" | "emerald" | "amber" | "rose" | "slate"
export type EnterpriseDrawerWidth = "compact" | "standard" | "wide" | "studio"
export type EnterpriseDrawerPerformanceMode = "standard" | "gpu-safe"

export type EnterpriseMessageContext = {
  subject: string
  sender?: string
  recipient?: string
  owner?: string
  status?: string
  priority?: string
  timestamp?: string
  mailbox?: string
}

const toneMap: Record<EnterpriseDrawerTone, {
  header: string
  icon: string
  badge: string
  line: string
  primary: string
  soft: string
}> = {
  sky: { header: "from-sky-50 via-white to-blue-50", icon: "bg-sky-600 text-white shadow-sky-200", badge: "border-sky-200 bg-sky-50 text-sky-700", line: "from-sky-500 to-blue-600", primary: "bg-sky-600 hover:bg-sky-700 focus:ring-sky-200", soft: "border-sky-100 bg-sky-50/70" },
  indigo: { header: "from-indigo-50 via-white to-blue-50", icon: "bg-indigo-600 text-white shadow-indigo-200", badge: "border-indigo-200 bg-indigo-50 text-indigo-700", line: "from-indigo-500 to-blue-600", primary: "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-200", soft: "border-indigo-100 bg-indigo-50/70" },
  violet: { header: "from-violet-50 via-white to-fuchsia-50", icon: "bg-violet-600 text-white shadow-violet-200", badge: "border-violet-200 bg-violet-50 text-violet-700", line: "from-violet-500 to-fuchsia-600", primary: "bg-violet-600 hover:bg-violet-700 focus:ring-violet-200", soft: "border-violet-100 bg-violet-50/70" },
  emerald: { header: "from-emerald-50 via-white to-teal-50", icon: "bg-emerald-600 text-white shadow-emerald-200", badge: "border-emerald-200 bg-emerald-50 text-emerald-700", line: "from-emerald-500 to-teal-600", primary: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-200", soft: "border-emerald-100 bg-emerald-50/70" },
  amber: { header: "from-amber-50 via-white to-orange-50", icon: "bg-amber-500 text-white shadow-amber-200", badge: "border-amber-200 bg-amber-50 text-amber-700", line: "from-amber-400 to-orange-500", primary: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-200", soft: "border-amber-100 bg-amber-50/70" },
  rose: { header: "from-rose-50 via-white to-red-50", icon: "bg-rose-600 text-white shadow-rose-200", badge: "border-rose-200 bg-rose-50 text-rose-700", line: "from-rose-500 to-red-600", primary: "bg-rose-600 hover:bg-rose-700 focus:ring-rose-200", soft: "border-rose-100 bg-rose-50/70" },
  slate: { header: "from-slate-100 via-white to-slate-50", icon: "bg-slate-800 text-white shadow-slate-200", badge: "border-slate-200 bg-slate-100 text-slate-700", line: "from-slate-500 to-slate-800", primary: "bg-slate-900 hover:bg-slate-800 focus:ring-slate-200", soft: "border-slate-200 bg-slate-50/80" }
}

const widthMap: Record<EnterpriseDrawerWidth, string> = {
  compact: "max-w-[560px]",
  standard: "max-w-[680px]",
  wide: "max-w-[800px]",
  studio: "max-w-[980px]"
}

const strongTextPaint = {
  color: "#020617",
  WebkitTextFillColor: "#020617",
  opacity: 1
} as const

const bodyTextPaint = {
  color: "#334155",
  WebkitTextFillColor: "#334155",
  opacity: 1
} as const

const mutedTextPaint = {
  color: "#475569",
  WebkitTextFillColor: "#475569",
  opacity: 1
} as const

export function EnterpriseDrawer({
  title,
  eyebrow,
  description,
  icon: Icon,
  tone = "sky",
  width = "standard",
  performanceMode = "standard",
  status,
  progress,
  messageContext,
  dirty = false,
  children,
  footer,
  onClose
}: {
  title: string
  eyebrow: string
  description: string
  icon: any
  tone?: EnterpriseDrawerTone
  width?: EnterpriseDrawerWidth
  performanceMode?: EnterpriseDrawerPerformanceMode
  status?: string
  progress?: number
  messageContext?: EnterpriseMessageContext
  dirty?: boolean
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  const dirtyRef = useRef(dirty)
  onCloseRef.current = onClose
  dirtyRef.current = dirty
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const styles = toneMap[tone]
  const gpuSafe = performanceMode === "gpu-safe"

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const timer = window.setTimeout(() => {
      const candidate = panelRef.current?.querySelector<HTMLElement>("button, input, select, textarea, [tabindex]:not([tabindex='-1'])")
      candidate?.focus()
    }, 30)

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        dirtyRef.current ? setConfirmDiscard(true) : onCloseRef.current()
        return
      }
      if (event.key !== "Tab" || !panelRef.current) return
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocusRef.current?.focus?.()
    }
  }, [])

  function requestClose() {
    if (dirtyRef.current) setConfirmDiscard(true)
    else onCloseRef.current()
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex justify-end ${gpuSafe ? "bg-slate-950/58" : "bg-slate-950/60 backdrop-blur-[5px]"}`}
      onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose() }}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-emailos-enterprise-drawer="true"
        className={`relative flex h-full w-full flex-col overflow-hidden border-l border-white/20 bg-slate-50 ${gpuSafe ? "shadow-[-16px_0_46px_rgba(2,8,23,.24)]" : "shadow-[-30px_0_90px_rgba(2,8,23,.32)]"} ${widthMap[width]}`}
      >
        <header className={`relative shrink-0 select-none overflow-hidden border-b border-slate-200 bg-gradient-to-br ${styles.header}`}>
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${styles.line}`} />
          {!gpuSafe ? <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/70 blur-3xl" /> : null}
          <div className="relative select-none px-5 pb-4 pt-5 sm:px-6">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] shadow-lg ${styles.icon}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">{eyebrow}</span>
                  {status ? <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${styles.badge}`}>{status}</span> : null}
                </div>
                <h2
                  data-emailos-strong-text="true"
                  className="mt-1.5 select-none text-[26px] font-black leading-tight tracking-[-0.045em] !text-slate-950 selection:bg-sky-100 selection:text-slate-950"
                  style={strongTextPaint}
                >
                  {title}
                </h2>
                <p data-emailos-support-text="true" className="mt-1 max-w-3xl text-[12px] font-bold leading-5 !text-slate-700" style={bodyTextPaint}>{description}</p>
              </div>
              <button type="button" onClick={requestClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/85 text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-4 focus:ring-sky-100" aria-label="Close drawer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {typeof progress === "number" ? (
              <div className="mt-4 grid grid-cols-4 gap-1.5">
                {["Context", "Decision", "Evidence", "Execute"].map((label, index) => (
                  <div key={label} className="min-w-0">
                    <div className={`h-1.5 rounded-full ${index + 1 <= progress ? `bg-gradient-to-r ${styles.line}` : "bg-slate-200"}`} />
                    <div className={`mt-1 truncate text-[8px] font-black uppercase tracking-[0.12em] ${index + 1 <= progress ? "text-slate-700" : "text-slate-400"}`}>{label}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        {messageContext ? <DrawerMessageContext context={messageContext} tone={tone} /> : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {children}
          <div className="h-8" />
        </div>

        {footer ? <div className={`shrink-0 border-t border-slate-200 px-5 py-4 shadow-[0_-14px_35px_rgba(15,23,42,.07)] sm:px-6 ${gpuSafe ? "bg-white" : "bg-white/95 backdrop-blur"}`}>{footer}</div> : null}

        {confirmDiscard ? (
          <div className={`absolute inset-0 z-30 flex items-end justify-center p-5 sm:items-center ${gpuSafe ? "bg-slate-950/60" : "bg-slate-950/45 backdrop-blur-sm"}`}>
            <div className="w-full max-w-md rounded-[26px] border border-amber-200 bg-white p-5 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><AlertTriangle className="h-5 w-5" /></div>
                <div><div className="text-lg font-black text-slate-950">Discard unsaved changes?</div><div className="mt-1 text-sm font-semibold leading-5 text-slate-600">This operational form contains information that has not been committed.</div></div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmDiscard(false)} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">Keep editing</button>
                <button type="button" onClick={() => onCloseRef.current()} className="h-11 rounded-2xl bg-rose-600 px-4 text-sm font-black text-white">Discard and close</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DrawerMessageContext({ context, tone }: { context: EnterpriseMessageContext; tone: EnterpriseDrawerTone }) {
  const styles = toneMap[tone]
  const facts = [
    ["Status", context.status || "—"],
    ["Priority", context.priority || "—"],
    ["Owner", context.owner || "Unassigned"],
    ["Activity", context.timestamp || "—"]
  ]
  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-3 sm:px-6">
      <div className={`rounded-[20px] border p-3 ${styles.soft}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border border-white bg-white text-slate-700 shadow-sm"><ShieldCheck className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <div className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-500">Authoritative selected message</div>
            <div data-emailos-strong-text="true" className="mt-1 truncate text-sm font-black !text-slate-950" style={strongTextPaint}>{context.subject}</div>
            <div data-emailos-support-text="true" className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold !text-slate-700" style={bodyTextPaint}>
              {context.sender ? <span>From: {context.sender}</span> : null}
              {context.recipient ? <span>To: {context.recipient}</span> : null}
              {context.mailbox ? <span>Mailbox: {context.mailbox}</span> : null}
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {facts.map(([label, value]) => <div key={label} data-emailos-white-surface="true" className="rounded-xl border border-white bg-white/80 px-2.5 py-2"><div data-emailos-label-text="true" className="text-[7px] font-black uppercase tracking-[0.13em] !text-slate-600" style={mutedTextPaint}>{label}</div><div data-emailos-strong-text="true" className="mt-0.5 truncate text-[10px] font-black capitalize !text-slate-950" style={strongTextPaint}>{value}</div></div>)}
        </div>
      </div>
    </div>
  )
}

export function DrawerSection({ eyebrow, title, description, icon: Icon, tone = "slate", children }: { eyebrow?: string; title: string; description?: string; icon?: any; tone?: EnterpriseDrawerTone; children: ReactNode }) {
  const styles = toneMap[tone]
  return (
    <section data-emailos-white-surface="true" className="rounded-[24px] border border-slate-200 bg-white p-4 text-slate-950 shadow-[0_12px_35px_rgba(15,23,42,.05)] sm:p-5">
      <div className="flex items-start gap-3">
        {Icon ? <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-md ${styles.icon}`}><Icon className="h-4 w-4" /></div> : null}
        <div className="min-w-0 flex-1">
          {eyebrow ? <div data-emailos-label-text="true" className="text-[8px] font-black uppercase tracking-[0.18em] !text-slate-600" style={mutedTextPaint}>{eyebrow}</div> : null}
          <h3 data-emailos-strong-text="true" className="mt-0.5 text-base font-black tracking-[-0.025em] !text-slate-950 selection:bg-sky-100 selection:text-slate-950" style={strongTextPaint}>{title}</h3>
          {description ? <p data-emailos-support-text="true" className="mt-1 text-[11px] font-bold leading-5 !text-slate-700" style={bodyTextPaint}>{description}</p> : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function DrawerField({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return <label data-emailos-white-surface="true" className="grid gap-1.5"><span data-emailos-label-text="true" className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.14em] !text-slate-700" style={bodyTextPaint}>{label}{required ? <span className="text-rose-600">*</span> : null}</span>{children}{hint ? <span data-emailos-support-text="true" className="text-[10px] font-bold leading-4 !text-slate-600" style={mutedTextPaint}>{hint}</span> : null}</label>
}

export function DrawerMetric({ label, value, helper, tone = "slate", icon: Icon }: { label: string; value: string | number; helper?: string; tone?: EnterpriseDrawerTone; icon?: any }) {
  const styles = toneMap[tone]
  return <div data-emailos-white-surface="true" className={`rounded-[19px] border p-3 text-slate-950 ${styles.soft}`}><div className="flex items-start justify-between gap-2"><div><div data-emailos-label-text="true" className="text-[8px] font-black uppercase tracking-[0.15em] !text-slate-700" style={bodyTextPaint}>{label}</div><div data-emailos-strong-text="true" className="mt-1 text-2xl font-black tracking-[-0.05em] !text-slate-950" style={strongTextPaint}>{value}</div></div>{Icon ? <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${styles.icon}`}><Icon className="h-3.5 w-3.5" /></div> : null}</div>{helper ? <div data-emailos-support-text="true" className="mt-1 text-[9px] font-bold leading-4 !text-slate-700" style={bodyTextPaint}>{helper}</div> : null}</div>
}

export function DrawerOption({ title, description, icon: Icon, selected, badge, tone = "sky", onClick, disabled }: { title: string; description: string; icon?: any; selected?: boolean; badge?: string; tone?: EnterpriseDrawerTone; onClick: () => void; disabled?: boolean }) {
  const styles = toneMap[tone]
  return (
    <button type="button" data-emailos-white-surface="true" onClick={onClick} disabled={disabled} className={`group flex min-h-[82px] w-full items-start gap-3 rounded-[20px] border p-3 text-left text-slate-950 transition focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-45 ${selected ? `${styles.soft} border-current shadow-[0_12px_30px_rgba(15,23,42,.08)]` : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_30px_rgba(15,23,42,.07)]"}`}>
      {Icon ? <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-md ${selected ? styles.icon : "border border-slate-200 bg-slate-50 text-slate-600"}`}><Icon className="h-4 w-4" /></div> : null}
      <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><div data-emailos-strong-text="true" className="text-sm font-black !text-slate-950" style={strongTextPaint}>{title}</div>{badge ? <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${styles.badge}`}>{badge}</span> : <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" />}</div><div data-emailos-support-text="true" className="mt-1 text-[10px] font-bold leading-4 !text-slate-700" style={bodyTextPaint}>{description}</div></div>
    </button>
  )
}

export function DrawerCallout({ title, description, tone = "sky", icon: Icon = Info }: { title: string; description: string; tone?: EnterpriseDrawerTone; icon?: any }) {
  const styles = toneMap[tone]
  return <div data-emailos-white-surface="true" className={`flex items-start gap-3 rounded-[20px] border p-3.5 text-slate-950 ${styles.soft}`}><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] ${styles.icon}`}><Icon className="h-4 w-4" /></div><div><div data-emailos-strong-text="true" className="text-sm font-black !text-slate-950" style={strongTextPaint}>{title}</div><div data-emailos-support-text="true" className="mt-1 text-[10px] font-bold leading-5 !text-slate-700" style={bodyTextPaint}>{description}</div></div></div>
}

export function DrawerTimelineItem({ title, description, meta, tone = "violet", onClick }: { title: string; description: string; meta?: string; tone?: EnterpriseDrawerTone; onClick?: () => void }) {
  const styles = toneMap[tone]
  const content = <><div className="absolute bottom-0 left-[18px] top-0 w-px bg-slate-200" /><div className={`relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ring-white bg-gradient-to-r ${styles.line}`} /><div data-emailos-white-surface="true" className="min-w-0 flex-1 rounded-[18px] border border-slate-200 bg-white p-3 text-slate-950 shadow-sm"><div data-emailos-strong-text="true" className="text-sm font-black !text-slate-950" style={strongTextPaint}>{title}</div><div data-emailos-support-text="true" className="mt-1 text-[10px] font-bold leading-5 !text-slate-700" style={bodyTextPaint}>{description}</div>{meta ? <div data-emailos-label-text="true" className="mt-2 text-[8px] font-black uppercase tracking-[0.12em] !text-slate-600" style={mutedTextPaint}>{meta}</div> : null}</div></>
  return onClick ? <button type="button" onClick={onClick} className="relative flex w-full items-start gap-3 pb-3 text-left">{content}</button> : <div className="relative flex items-start gap-3 pb-3">{content}</div>
}

export function DrawerFooter({ primaryLabel, onPrimary, primaryIcon: PrimaryIcon = CheckCircle2, primaryTone = "sky", secondaryLabel = "Cancel", onSecondary, tertiaryLabel, onTertiary, helper, disabled, busy, destructive }: { primaryLabel: string; onPrimary: () => void; primaryIcon?: any; primaryTone?: EnterpriseDrawerTone; secondaryLabel?: string; onSecondary?: () => void; tertiaryLabel?: string; onTertiary?: () => void; helper?: string; disabled?: boolean; busy?: boolean; destructive?: boolean }) {
  const styles = toneMap[destructive ? "rose" : primaryTone]
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0">{helper ? <div data-emailos-support-text="true" className="flex items-start gap-2 text-[10px] font-bold leading-4 !text-slate-700" style={bodyTextPaint}><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{helper}</div> : null}</div><div className="flex shrink-0 flex-wrap justify-end gap-2">{tertiaryLabel && onTertiary ? <button type="button" onClick={onTertiary} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-600 hover:bg-slate-100">{tertiaryLabel}</button> : null}{onSecondary ? <button type="button" onClick={onSecondary} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50">{secondaryLabel}</button> : null}<button type="button" onClick={onPrimary} disabled={disabled || busy} className={`inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-black text-white shadow-lg transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${styles.primary}`}><PrimaryIcon className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} />{busy ? "Processing…" : primaryLabel}</button></div></div>
}

export function DrawerEvidenceBadge({ label, tone = "slate", icon: Icon = CheckCircle2 }: { label: string; tone?: EnterpriseDrawerTone; icon?: any }) {
  const styles = toneMap[tone]
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black ${styles.badge}`}><Icon className="h-3 w-3" />{label}</span>
}

export function DrawerEmptyState({ title, description }: { title: string; description: string }) {
  return <div data-emailos-white-surface="true" className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-950"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm"><Sparkles className="h-4 w-4" /></div><div data-emailos-strong-text="true" className="mt-3 text-sm font-black !text-slate-950" style={strongTextPaint}>{title}</div><div data-emailos-support-text="true" className="mt-1 text-[11px] font-bold leading-5 !text-slate-700" style={bodyTextPaint}>{description}</div></div>
}
