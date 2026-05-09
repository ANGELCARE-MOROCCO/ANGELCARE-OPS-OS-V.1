"use client"

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  Edit3,
  FileText,
  Filter,
  Folder,
  MailCheck,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCw,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  Zap
} from "lucide-react"
import type { EmailOSClickAction, EmailOSActionPayload } from "@/lib/email-os/click-actions/action-types"

export type RunAction = (action: EmailOSClickAction, payload?: EmailOSActionPayload) => Promise<any>

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>
}

export function PanelHeader({
  icon,
  title,
  subtitle,
  action
}: {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 p-5">
      <div className="flex items-start gap-4">
        {icon ? <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">{icon}</div> : null}
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = "secondary",
  className = ""
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "ghost" | "danger"
  className?: string
}) {
  const styles = {
    primary: "bg-slate-950 text-white hover:bg-slate-800",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: "green" | "amber" | "red" | "blue" | "purple" | "neutral" }) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-rose-200 bg-rose-50 text-rose-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    purple: "border-violet-200 bg-violet-50 text-violet-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-600"
  }

  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${tones[tone]}`}>{label}</span>
}

export function MetricCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        {icon ? <div className="text-slate-400">{icon}</div> : null}
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-950">{value}</div>
    </div>
  )
}

export function RowActionMenu({
  run,
  payload
}: {
  run: RunAction
  payload: EmailOSActionPayload
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" className="px-2" onClick={() => run("audit.open", payload)}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      <Button variant="secondary" onClick={() => run("sync.mailbox", payload)}>
        <RefreshCw className="h-4 w-4" /> Sync
      </Button>
    </div>
  )
}

export const Icons = {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  Edit3,
  FileText,
  Filter,
  Folder,
  MailCheck,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCw,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  Zap
}
