'use client'

import Link from 'next/link'
import type { ElementType, ReactNode } from 'react'
import { ArrowRight, ChevronRight, CircleAlert, LockKeyhole, Network, ShieldCheck } from 'lucide-react'
import { SChip, SDataTruth, SIcon, type SovereignTone } from '../../../_components/visual-sovereignty/SovereignPrimitives'
import styles from './SovereignTwinExperience.module.css'

export type TwinRouteMastheadProps = {
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

export function TwinRouteMasthead({ eyebrow, title, subtitle, concept, icon, tone = 'cyan', mode, warnings = [], freshness, authority, primary, secondary, children }: TwinRouteMastheadProps) {
  const Icon = icon
  const primaryClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-[11px] font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45'
  return <section className={`${styles.routeBand} rounded-[38px] bg-[linear-gradient(135deg,#06162b_0%,#0d3150_52%,#143f63_100%)] p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,.2)] sm:p-8`} data-twin-route-concept={concept}>
    <div className={`absolute inset-0 opacity-20 ${styles.fineGrid}`} aria-hidden="true" />
    <div className="relative grid gap-7 xl:grid-cols-[1fr_390px] xl:items-end">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <SChip tone={tone}><Icon size={12} /> {eyebrow}</SChip>
          {authority ? <span className="rounded-full border border-white/15 bg-white/[.07] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-white">{authority}</span> : null}
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200">{concept}</p>
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

export function TwinPanel({ title, eyebrow, icon, tone = 'slate', children, className = '', action }: { title: string; eyebrow?: string; icon?: ElementType; tone?: SovereignTone; children: ReactNode; className?: string; action?: ReactNode }) {
  return <section className={`rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,.06)] sm:p-6 ${className}`}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">{icon ? <SIcon icon={icon} tone={tone} className="h-10 w-10 rounded-xl" /> : null}<div>{eyebrow ? <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-600">{eyebrow}</p> : null}<h2 className="mt-1 text-lg font-black tracking-[-.025em] text-slate-950">{title}</h2></div></div>
      {action}
    </div>
    <div className="mt-5">{children}</div>
  </section>
}

export function TwinStat({ label, value, note, tone = 'slate' }: { label: string; value: ReactNode; note?: string; tone?: SovereignTone }) {
  const border = tone === 'rose' ? 'border-rose-200 bg-rose-50/70' : tone === 'amber' ? 'border-amber-200 bg-amber-50/70' : tone === 'emerald' ? 'border-emerald-200 bg-emerald-50/70' : tone === 'violet' ? 'border-violet-200 bg-violet-50/70' : tone === 'cyan' ? 'border-cyan-200 bg-cyan-50/70' : tone === 'blue' ? 'border-blue-200 bg-blue-50/70' : 'border-slate-200 bg-slate-50'
  return <div className={`rounded-[22px] border p-4 ${border}`}><p className="text-[9px] font-black uppercase tracking-[.13em] text-slate-700">{label}</p><p className="mt-2 text-2xl font-black tracking-[-.04em] text-slate-950">{value}</p>{note ? <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-700">{note}</p> : null}</div>
}

export function TwinStatus({ status }: { status: string }) {
  const tone = status === 'active' || status === 'validated' || status === 'available' || status === 'resolved' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : status === 'needs-validation' || status === 'conditional' || status === 'acknowledged' || status === 'medium' ? 'border-amber-200 bg-amber-50 text-amber-800' : status === 'unavailable' || status === 'critical' || status === 'high' || status === 'retired' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-slate-200 bg-slate-100 text-slate-700'
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[.08em] ${tone}`}>{status}</span>
}

export function TwinTag({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'cyan' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' }) {
  const className = tone === 'cyan' ? 'bg-cyan-50 text-cyan-800' : tone === 'blue' ? 'bg-blue-50 text-blue-800' : tone === 'emerald' ? 'bg-emerald-50 text-emerald-800' : tone === 'amber' ? 'bg-amber-50 text-amber-800' : tone === 'rose' ? 'bg-rose-50 text-rose-800' : tone === 'violet' ? 'bg-violet-50 text-violet-800' : 'bg-slate-100 text-slate-700'
  return <span className={`inline-flex rounded-xl px-2.5 py-1.5 text-[9px] font-black ${className}`}>{children}</span>
}

export function TwinProgress({ value, label, tone = 'cyan' }: { value: number; label?: string; tone?: SovereignTone }) {
  const color = tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : tone === 'rose' ? 'bg-rose-500' : tone === 'blue' ? 'bg-blue-500' : tone === 'violet' ? 'bg-violet-500' : 'bg-cyan-500'
  return <div>{label ? <div className="mb-1.5 flex items-center justify-between text-[10px] font-black text-slate-700"><span>{label}</span><span>{value}%</span></div> : null}<div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>
}

export function TwinEmpty({ title, description, locked = false }: { title: string; description: string; locked?: boolean }) {
  const Icon = locked ? LockKeyhole : CircleAlert
  return <div className={`rounded-[26px] border p-7 text-center ${locked ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}><SIcon icon={Icon} tone={locked ? 'amber' : 'slate'} className="mx-auto" /><h3 className="mt-4 text-base font-black text-slate-950">{title}</h3><p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-700">{description}</p></div>
}

export function TwinSafetyBanner({ detail = 'Mode Shadow actif : le jumeau structure et valide le modèle commercial sans déclencher de communication, transaction ou engagement externe.' }: { detail?: string }) {
  return <div className="flex items-start gap-3 rounded-[24px] border border-cyan-200 bg-cyan-50 p-4 text-cyan-950"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-cyan-700" /><div><p className="text-xs font-black">World model protégé</p><p className="mt-1 text-[11px] font-semibold leading-5 text-cyan-900">{detail}</p></div></div>
}

export function TwinRelationship({ source, target, label }: { source: string; target: string; label: string }) {
  return <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-3"><div className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950 shadow-sm">{source}</div><div className="flex flex-col items-center text-cyan-700"><Network size={16}/><span className="mt-1 text-[8px] font-black uppercase">{label}</span></div><div className="rounded-xl bg-white px-3 py-2 text-right text-xs font-black text-slate-950 shadow-sm">{target}</div></div>
}

export function formatTwinDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

export { styles as twinExperienceStyles }
