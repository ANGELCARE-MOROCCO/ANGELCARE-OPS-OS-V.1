import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CircleDot,
  Clock3,
  Command,
  Layers3,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from 'lucide-react'

export const sd2030 = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

export type StudioTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate' | 'navy' | 'cyan'

const toneClasses: Record<StudioTone, { soft: string; strong: string; text: string; line: string }> = {
  blue: { soft: 'border-blue-200 bg-blue-50 text-blue-950', strong: 'bg-blue-600 text-white', text: 'text-blue-700', line: 'from-blue-600 to-cyan-400' },
  emerald: { soft: 'border-emerald-200 bg-emerald-50 text-emerald-950', strong: 'bg-emerald-600 text-white', text: 'text-emerald-700', line: 'from-emerald-600 to-teal-400' },
  amber: { soft: 'border-amber-200 bg-amber-50 text-amber-950', strong: 'bg-amber-500 text-slate-950', text: 'text-amber-700', line: 'from-amber-500 to-orange-400' },
  rose: { soft: 'border-rose-200 bg-rose-50 text-rose-950', strong: 'bg-rose-600 text-white', text: 'text-rose-700', line: 'from-rose-600 to-pink-400' },
  violet: { soft: 'border-violet-200 bg-violet-50 text-violet-950', strong: 'bg-violet-600 text-white', text: 'text-violet-700', line: 'from-violet-600 to-fuchsia-400' },
  cyan: { soft: 'border-cyan-200 bg-cyan-50 text-cyan-950', strong: 'bg-cyan-600 text-white', text: 'text-cyan-700', line: 'from-cyan-600 to-blue-400' },
  slate: { soft: 'border-slate-200 bg-slate-50 text-slate-950', strong: 'bg-slate-800 text-white', text: 'text-slate-600', line: 'from-slate-700 to-slate-400' },
  navy: { soft: 'border-slate-800 bg-slate-950 text-white', strong: 'bg-slate-950 text-white', text: 'text-white', line: 'from-blue-500 to-cyan-300' },
}

export function StudioHero({ eyebrow, title, description, actions, chips, tone = 'navy' }: { eyebrow: string; title: string; description: string; actions?: ReactNode; chips?: ReactNode; tone?: StudioTone }) {
  const dark = tone === 'navy'
  return (
    <section className={sd2030('sd2030-hero relative isolate overflow-hidden rounded-[36px] border px-6 py-7 shadow-[0_32px_90px_rgba(15,23,42,.18)] sm:px-8 sm:py-9 xl:px-10', dark ? 'border-slate-800 bg-slate-950 text-white' : toneClasses[tone].soft)}>
      <div className="pointer-events-none absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_85%_15%,rgba(59,130,246,.22),transparent_31%),radial-gradient(circle_at_8%_92%,rgba(34,211,238,.13),transparent_35%)]" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border-[44px] border-white/[0.035]" />
      <div className={sd2030('absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b', toneClasses[tone].line)} />
      <div className="relative flex flex-wrap items-start justify-between gap-7">
        <div className="max-w-5xl">
          <p className={sd2030('text-[10px] font-black uppercase tracking-[.34em]', dark ? 'text-blue-300' : toneClasses[tone].text)}>{eyebrow}</p>
          <h1 className="mt-3 max-w-5xl text-4xl font-black tracking-[-.058em] sm:text-5xl xl:text-[58px] xl:leading-[1.02]">{title}</h1>
          <p className={sd2030('mt-4 max-w-4xl text-sm font-semibold leading-7', dark ? 'text-slate-300' : 'text-slate-600')}>{description}</p>
          {chips ? <div className="mt-6 flex flex-wrap gap-2">{chips}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  )
}

export function StudioAction({ href, children, tone = 'blue', icon, compact = false }: { href?: string; children: ReactNode; tone?: StudioTone; icon?: ReactNode; compact?: boolean }) {
  const className = sd2030(
    'inline-flex items-center justify-center gap-2 rounded-2xl font-black transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
    compact ? 'min-h-9 px-3 text-[10px]' : 'min-h-11 px-4 text-xs',
    tone === 'slate' ? 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700' : tone === 'navy' ? 'border border-white/15 bg-white/10 text-white hover:bg-white/15' : toneClasses[tone].strong,
  )
  const content = <>{icon}{children}</>
  return href ? <Link href={href} className={className}>{content}</Link> : <button type="button" disabled title="Sélectionnez un dossier réel pour activer cette action." className={`${className} cursor-not-allowed opacity-45`}>{content}</button>
}

export function StudioChip({ children, tone = 'slate' }: { children: ReactNode; tone?: StudioTone }) {
  return <span className={sd2030('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[.15em]', toneClasses[tone].soft)}>{children}</span>
}

export function StudioSurface({ title, subtitle, action, children, className, tone = 'slate', chrome = true }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string; tone?: StudioTone; chrome?: boolean }) {
  return (
    <section className={sd2030('sd2030-surface overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_56px_rgba(15,23,42,.065)]', className)}>
      {chrome ? <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-white via-white to-slate-50/70 px-5 py-5 sm:px-6"><div><div className={sd2030('mb-2 h-1 w-12 rounded-full bg-gradient-to-r', toneClasses[tone].line)} /><h2 className="text-lg font-black tracking-[-.035em] text-slate-950">{title}</h2>{subtitle ? <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-500">{subtitle}</p> : null}</div>{action}</header> : null}
      <div className={chrome ? 'p-5 sm:p-6' : ''}>{children}</div>
    </section>
  )
}

export function StudioMetric({ label, value, detail, tone = 'blue', icon }: { label: string; value: ReactNode; detail: string; tone?: StudioTone; icon?: ReactNode }) {
  return <article className="group relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,.055)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_20px_52px_rgba(37,99,235,.10)]"><div className={sd2030('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', toneClasses[tone].line)} /><div className="flex items-start justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.22em] text-slate-400">{label}</p><div className="mt-2 text-3xl font-black tracking-[-.052em] text-slate-950">{value}</div></div><div className={sd2030('grid h-11 w-11 place-items-center rounded-2xl border', toneClasses[tone].soft)}>{icon || <CircleDot size={18} />}</div></div><p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{detail}</p></article>
}

export function StudioStageRail({ active, stages }: { active: number; stages: Array<{ label: string; detail: string }> }) {
  return <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_12px_38px_rgba(15,23,42,.05)]"><div className="grid gap-2 lg:grid-cols-5">{stages.map((stage, index) => { const done = index < active; const current = index === active; return <div key={stage.label} className={sd2030('relative rounded-2xl border p-3', current ? 'border-blue-300 bg-blue-50' : done ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-slate-50/70')}><div className="flex items-center gap-2"><span className={sd2030('grid h-7 w-7 place-items-center rounded-xl text-[10px] font-black', current ? 'bg-blue-600 text-white' : done ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 ring-1 ring-slate-200')}>{done ? <CheckCircle2 size={14} /> : index + 1}</span><p className="text-xs font-black text-slate-900">{stage.label}</p></div><p className="mt-2 text-[10px] font-semibold leading-4 text-slate-500">{stage.detail}</p></div> })}</div></section>
}

export function StudioSignal({ title, detail, tone = 'blue', action }: { title: string; detail: string; tone?: StudioTone; action?: ReactNode }) {
  const Icon = tone === 'emerald' ? CheckCircle2 : tone === 'amber' || tone === 'rose' ? CircleAlert : Sparkles
  return <div className={sd2030('flex flex-wrap items-start justify-between gap-4 rounded-[22px] border p-4', toneClasses[tone].soft)}><div className="flex min-w-0 items-start gap-3"><div className={sd2030('grid h-9 w-9 shrink-0 place-items-center rounded-2xl', toneClasses[tone].strong)}><Icon size={16} /></div><div><p className="text-sm font-black">{title}</p><p className="mt-1 text-xs font-semibold leading-5 opacity-75">{detail}</p></div></div>{action}</div>
}

export function StudioEmpty({ title, detail, action, icon }: { title: string; detail: string; action?: ReactNode; icon?: ReactNode }) {
  return <div className="relative overflow-hidden rounded-[28px] border border-dashed border-slate-300 bg-[linear-gradient(135deg,rgba(248,250,252,.96),rgba(239,246,255,.75))] p-8 text-center"><div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_1px_1px,rgba(59,130,246,.22)_1px,transparent_0)] [background-size:22px_22px]" /><div className="relative"><div className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] border border-blue-100 bg-white text-blue-600 shadow-sm">{icon || <WandSparkles size={22} />}</div><h3 className="mt-4 text-lg font-black tracking-[-.025em] text-slate-900">{title}</h3><p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">{detail}</p>{action ? <div className="mt-5 flex justify-center">{action}</div> : null}</div></div>
}

export function ExperienceCanvas({ promise, audience, objectives, routines, safeguards, activities, commercial }: { promise: string; audience: string; objectives: string[]; routines: string[]; safeguards: string[]; activities: string[]; commercial?: string }) {
  const blocks = [
    { label: 'Promesse', value: promise || 'À construire depuis le scénario sélectionné', icon: <Sparkles size={15} />, tone: 'blue' as StudioTone },
    { label: 'Audience', value: audience || 'Profil à confirmer', icon: <Layers3 size={15} />, tone: 'violet' as StudioTone },
    { label: 'Objectifs', value: objectives.length ? objectives.join(' · ') : 'Sélectionnez les objectifs', icon: <WandSparkles size={15} />, tone: 'cyan' as StudioTone },
    { label: 'Rythmes', value: routines.length ? routines.join(' · ') : 'Aucune routine activée', icon: <Clock3 size={15} />, tone: 'amber' as StudioTone },
    { label: 'Activités', value: activities.length ? activities.join(' · ') : 'La bibliothèque locale sera filtrée', icon: <Command size={15} />, tone: 'emerald' as StudioTone },
    { label: 'Sécurité', value: safeguards.length ? safeguards.join(' · ') : 'Contrôles du blueprint', icon: <ShieldCheck size={15} />, tone: 'rose' as StudioTone },
  ]
  return <div className="relative overflow-hidden rounded-[30px] border border-slate-800 bg-slate-950 p-5 text-white shadow-[0_28px_74px_rgba(15,23,42,.25)]"><div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border-[34px] border-blue-500/10" /><div className="relative"><div className="flex items-center justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.24em] text-blue-300">Mission Experience Canvas</p><h3 className="mt-2 text-xl font-black tracking-[-.035em]">Expérience en construction</h3></div><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-slate-300">Live</span></div><div className="mt-5 grid gap-3">{blocks.map((block) => <div key={block.label} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3"><div className="flex items-center gap-2"><span className={sd2030('grid h-7 w-7 place-items-center rounded-xl', toneClasses[block.tone].strong)}>{block.icon}</span><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">{block.label}</p></div><p className="mt-2 text-xs font-semibold leading-5 text-slate-200">{block.value}</p></div>)}{commercial ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3"><p className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-300">Positionnement</p><p className="mt-2 text-xs font-semibold text-emerald-50">{commercial}</p></div> : null}</div></div></div>
}

export function TimelinePreview({ start, end, blocks }: { start: string; end: string; blocks: Array<{ label: string; detail: string; tone?: StudioTone }> }) {
  return <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_46px_rgba(15,23,42,.06)]"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.22em] text-blue-600">Timeline opérationnelle</p><h3 className="mt-1 text-xl font-black tracking-[-.035em] text-slate-950">{start} → {end}</h3></div><StudioChip tone="emerald">Couverture déterministe</StudioChip></div><div className="relative mt-6"><div className="absolute bottom-0 left-[13px] top-0 w-px bg-gradient-to-b from-blue-500 via-cyan-400 to-emerald-500" /><div className="space-y-3">{blocks.map((block, index) => <div key={`${block.label}-${index}`} className="relative flex gap-4 pl-1"><span className={sd2030('relative z-10 mt-3 h-6 w-6 shrink-0 rounded-full border-4 border-white shadow-sm bg-gradient-to-br', toneClasses[block.tone || 'blue'].line)} /><div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/70 p-3"><p className="text-xs font-black text-slate-900">{block.label}</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{block.detail}</p></div></div>)}</div></div></div>
}

export function StudioLinkRow({ href, title, detail, status, tone = 'blue' }: { href: string; title: string; detail: string; status?: string; tone?: StudioTone }) {
  return <Link href={href} className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"><div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{title}</p><p className="mt-1 truncate text-xs font-semibold text-slate-500">{detail}</p></div><div className="flex shrink-0 items-center gap-2">{status ? <StudioChip tone={tone}>{status}</StudioChip> : null}<ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" /></div></Link>
}
