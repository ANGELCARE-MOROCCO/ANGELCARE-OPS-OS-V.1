import type { ComponentType, ReactNode } from "react"
import Link from "next/link"
import {
  ChevronDown,
  ClipboardCheck,
  Info,
} from "lucide-react";
import { ambassadorDesignTokens } from "./ambassador-design-tokens"
import type { AmbassadorWorkspaceMode } from "@/lib/market-os/ambassadors/types"

type IconType = ComponentType<{ size?: number; className?: string }>

type Action = {
  label: string
  onClick?: () => void
  href?: string
  icon?: IconType
  variant?: "primary" | "secondary" | "ghost" | "danger"
  disabled?: boolean
}

type JourneyTab = {
  mode: AmbassadorWorkspaceMode
  label: string
  href: string
  helper: string
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

function ActionContent({ action }: { action: Action }) {
  const Icon = action.icon
  return (
    <>
      {Icon ? <Icon size={16} /> : null}
      <span>{action.label}</span>
      {action.label.toLowerCase().includes("export") ? <ChevronDown size={14} className="opacity-60" /> : null}
    </>
  )
}

export function AmbassadorEnterpriseButton({ action }: { action: Action }) {
  const variant = action.variant || "secondary"
  const className = cx(
    "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60",
    variant === "primary" && ambassadorDesignTokens.primaryButton,
    variant === "secondary" && ambassadorDesignTokens.secondaryButton,
    variant === "ghost" && ambassadorDesignTokens.ghostButton,
    variant === "danger" && ambassadorDesignTokens.dangerButton
  )
  if (action.href) {
    return <Link href={action.href} className={className} aria-disabled={action.disabled || undefined}><ActionContent action={action} /></Link>
  }
  return <button type="button" onClick={action.onClick} disabled={action.disabled} className={className}><ActionContent action={action} /></button>
}

export function AmbassadorRouteHeader({ eyebrow, title, description, icon: Icon, updatedAt, sourceLabel, statusLabel, actions }: { eyebrow: string; title: string; description: string; icon: IconType; updatedAt: string; sourceLabel: string; statusLabel: string; actions: Action[] }) {
  return (
    <header className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_20px_70px_-48px_rgba(15,23,42,0.5)] lg:px-7">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            <span>AngelCare Market OS</span><span className="h-1 w-1 rounded-full bg-slate-300" /><span>{eyebrow}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-blue-700"><Info size={12} /> UIX 14 routes</span>
          </div>
          <div className="mt-4 flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-blue-50 text-blue-700 ring-1 ring-blue-100"><Icon size={23} /></div>
            <div className="min-w-0"><h1 className={ambassadorDesignTokens.title}>{title}</h1><p className={cx("mt-2 max-w-4xl", ambassadorDesignTokens.subtitle)}>{description}</p></div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">{actions.map((action) => <AmbassadorEnterpriseButton key={action.label} action={action} />)}</div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">Mise à jour {updatedAt}</span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">Source {sourceLabel}</span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">{statusLabel}</span>
      </div>
    </header>
  )
}

export function AmbassadorMetricCard({ label, value, meta, icon: Icon, tone = "blue", onClick }: { label: string; value: string; meta: string; icon: IconType; tone?: "blue" | "green" | "amber" | "red" | "purple" | "cyan"; onClick?: () => void }) {
  const toneClass = { blue: ambassadorDesignTokens.blueIcon, green: ambassadorDesignTokens.greenIcon, amber: ambassadorDesignTokens.amberIcon, red: ambassadorDesignTokens.redIcon, purple: ambassadorDesignTokens.purpleIcon, cyan: ambassadorDesignTokens.cyanIcon }[tone]
  const content = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><div className="text-xs font-black text-slate-500">{label}</div><div className="mt-2 text-[26px] font-black tracking-[-0.04em] text-[#06143b]">{value}</div><div className="mt-2 text-xs font-bold text-emerald-600">{meta}</div></div>
      <div className={cx("grid h-12 w-12 shrink-0 place-items-center rounded-[16px]", toneClass)}><Icon size={20} /></div>
    </div>
  )
  const className = cx("rounded-[22px] border border-slate-200/80 bg-white p-4 text-left shadow-[0_18px_54px_-42px_rgba(15,23,42,0.45)]", onClick && "transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_24px_70px_-48px_rgba(37,99,235,0.55)]")
  if (onClick) return <button type="button" onClick={onClick} className={className}>{content}</button>
  return <div className={className}>{content}</div>
}

export function AmbassadorJourneyNav({ tabs, activeMode }: { tabs: JourneyTab[]; activeMode: AmbassadorWorkspaceMode }) {
  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white p-2 shadow-sm">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const active = tab.mode === activeMode
          return (
            <Link key={String(tab.mode)} href={tab.href} className={cx("min-w-[178px] rounded-[18px] border px-4 py-3 text-left transition", active ? "border-blue-600 bg-blue-600 text-white shadow-[0_16px_34px_-22px_rgba(37,99,235,0.95)]" : "border-transparent bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50")}>
              <div className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">{tab.helper}</div><div className="mt-1 text-sm font-black tracking-tight">{tab.label}</div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export function AmbassadorOperationalNotice({ children, tone = "amber" }: { children: ReactNode; tone?: "amber" | "red" | "green" | "blue" }) {
  const styles = { amber: "border-amber-200 bg-amber-50 text-amber-800", red: "border-rose-200 bg-rose-50 text-rose-700", green: "border-emerald-200 bg-emerald-50 text-emerald-700", blue: "border-blue-200 bg-blue-50 text-blue-700" }[tone]
  return <div className={cx("rounded-2xl border p-4 text-sm font-bold", styles)}>{children}</div>
}

export function AmbassadorFilterFrame({ children }: { children: ReactNode }) {
  return <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm">{children}</section>
}

export function AmbassadorSectionCard({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm"><div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-lg font-black tracking-[-0.02em] text-[#06143b]">{title}</h2>{description ? <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p> : null}</div>{action}</div>{children}</section>
}
