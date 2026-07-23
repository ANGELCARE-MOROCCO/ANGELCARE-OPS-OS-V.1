'use client'

import Link from 'next/link'
import type { ElementType, ReactNode } from 'react'
import { ArrowRight, ChevronRight, CircleAlert, LockKeyhole, ShieldCheck } from 'lucide-react'
import { SChip, SDataTruth, SIcon, type SovereignTone } from '../../../_components/visual-sovereignty/SovereignPrimitives'
import styles from './SovereignCommandExperience.module.css'

export type RouteMastheadProps = {
  eyebrow: string
  title: string
  subtitle: string
  concept: string
  icon: ElementType
  tone?: SovereignTone
  mode?: string
  warnings?: string[]
  freshness?: string
  authority?: string
  primary?: { label: string; href?: string; onClick?: () => void; disabled?: boolean; reason?: string }
  secondary?: { label: string; href: string }
  children?: ReactNode
}

export function CommandRouteMasthead({ eyebrow, title, subtitle, concept, icon, tone = 'violet', mode, warnings = [], freshness, authority, primary, secondary, children }: RouteMastheadProps) {
  const Icon = icon
  const primaryClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-[11px] font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45'
  return <section className={`${styles.routeBand} rounded-[38px] bg-[linear-gradient(135deg,#081225_0%,#142754_54%,#34215e_100%)] p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,.2)] sm:p-8`} data-command-route-concept={concept}>
    <div className={`absolute inset-0 opacity-20 ${styles.fineGrid}`} aria-hidden="true" />
    <div className="relative grid gap-7 xl:grid-cols-[1fr_390px] xl:items-end">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <SChip tone={tone}><Icon size={12} /> {eyebrow}</SChip>
          {authority ? <span className="rounded-full border border-white/15 bg-white/[.07] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-white">{authority}</span> : null}
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[.2em] text-violet-200">{concept}</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.055em] text-white sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-200">{subtitle}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {primary?.href ? <Link href={primary.href} className={primaryClass}>{primary.label}<ArrowRight size={15} /></Link> : primary ? <button type="button" onClick={primary.onClick} disabled={primary.disabled} title={primary.disabled ? primary.reason : undefined} className={primaryClass}>{primary.label}<ArrowRight size={15} /></button> : null}
          {secondary ? <Link href={secondary.href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[.07] px-4 py-2.5 text-[11px] font-black text-white transition hover:bg-white/[.12]">{secondary.label}<ChevronRight size={15} /></Link> : null}
        </div>
      </div>
      <div className="space-y-3">
        <SDataTruth mode={mode} warnings={warnings} freshness={freshness} />
        {children}
      </div>
    </div>
  </section>
}

export function CommandPanel({ title, eyebrow, icon, tone = 'slate', children, className = '', action }: { title: string; eyebrow?: string; icon?: ElementType; tone?: SovereignTone; children: ReactNode; className?: string; action?: ReactNode }) {
  return <section className={`rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,.06)] sm:p-6 ${className}`}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">{icon ? <SIcon icon={icon} tone={tone} className="h-10 w-10 rounded-xl" /> : null}<div>{eyebrow ? <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">{eyebrow}</p> : null}<h2 className="mt-1 text-lg font-black tracking-[-.025em] text-slate-950">{title}</h2></div></div>
      {action}
    </div>
    <div className="mt-5">{children}</div>
  </section>
}

export function CommandStat({ label, value, note, tone = 'slate' }: { label: string; value: ReactNode; note?: string; tone?: SovereignTone }) {
  const border = tone === 'rose' ? 'border-rose-200 bg-rose-50/70' : tone === 'amber' ? 'border-amber-200 bg-amber-50/70' : tone === 'emerald' ? 'border-emerald-200 bg-emerald-50/70' : tone === 'violet' ? 'border-violet-200 bg-violet-50/70' : tone === 'cyan' ? 'border-cyan-200 bg-cyan-50/70' : tone === 'blue' ? 'border-blue-200 bg-blue-50/70' : 'border-slate-200 bg-slate-50'
  return <div className={`rounded-[22px] border p-4 ${border}`}><p className="text-[9px] font-black uppercase tracking-[.13em] text-slate-600">{label}</p><p className="mt-2 text-2xl font-black tracking-[-.04em] text-slate-950">{value}</p>{note ? <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-600">{note}</p> : null}</div>
}

export function CommandEmpty({ title, description, locked = false }: { title: string; description: string; locked?: boolean }) {
  const Icon = locked ? LockKeyhole : CircleAlert
  return <div className={`rounded-[26px] border p-7 text-center ${locked ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}><SIcon icon={Icon} tone={locked ? 'amber' : 'slate'} className="mx-auto" /><h3 className="mt-4 text-base font-black text-slate-950">{title}</h3><p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">{description}</p></div>
}

export function SafetyLockBanner({ detail = 'Mode Shadow actif : aucune communication, transaction, engagement contractuel ou autre effet externe ne peut être exécuté.' }: { detail?: string }) {
  return <div className="flex items-start gap-3 rounded-[24px] border border-cyan-200 bg-cyan-50 p-4 text-cyan-950"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-cyan-700" /><div><p className="text-xs font-black">Périmètre d’exécution protégé</p><p className="mt-1 text-[11px] font-semibold leading-5 text-cyan-900">{detail}</p></div></div>
}

export function ProgressBar({ value, tone = 'violet' }: { value: number; tone?: SovereignTone }) {
  const color = tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : tone === 'rose' ? 'bg-rose-500' : tone === 'blue' ? 'bg-blue-500' : tone === 'cyan' ? 'bg-cyan-500' : 'bg-violet-500'
  return <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
}

export function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

export function commandName(code: string, commands: Array<{ commandCode: string; name: string }>) {
  return commands.find((command) => command.commandCode === code)?.name || code
}
