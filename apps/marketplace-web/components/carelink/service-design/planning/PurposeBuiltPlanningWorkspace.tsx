'use client'

import type { LucideIcon } from 'lucide-react'
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { Action, Empty, StageHeader, Surface } from './PlanningUI'

const gradients = {
  blue: 'from-blue-600 to-cyan-400',
  violet: 'from-violet-600 to-fuchsia-400',
  emerald: 'from-emerald-600 to-teal-400',
  amber: 'from-amber-500 to-orange-400',
  rose: 'from-rose-600 to-pink-400',
  slate: 'from-slate-700 to-slate-500',
}

type Tone = keyof typeof gradients

type Stage = { label: string; detail: string }

export function PurposeBuiltPlanningWorkspace({
  eyebrow,
  title,
  description,
  icon: Icon,
  tone = 'blue',
  stages,
  canvasTitle,
  canvasDetail,
  createHref = '/carelink-ops/service-design/factory',
  createLabel = 'Créer depuis une catégorie',
  principles,
}: {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  tone?: Tone
  stages: Stage[]
  canvasTitle: string
  canvasDetail: string
  createHref?: string
  createLabel?: string
  principles: Array<{ title: string; detail: string }>
}) {
  return <div className="space-y-6">
    <StageHeader eyebrow={eyebrow} title={title} description={description} actions={<><Action tone="slate" href="/carelink-ops/service-design/planning">Planning Command</Action><Action href={createHref}>{createLabel}</Action></>}/>

    <section className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_16px_46px_rgba(15,23,42,.06)] sm:p-6">
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${gradients[tone]}`}/>
      <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className={`grid h-12 w-12 place-items-center rounded-[20px] bg-gradient-to-br ${gradients[tone]} text-white shadow-lg`}><Icon size={20}/></div><div><p className="text-[9px] font-black uppercase tracking-[.19em] text-slate-400">Workflow purpose-built</p><h2 className="mt-1 text-xl font-black tracking-[-.04em] text-slate-950">Architecture de travail</h2></div></div><span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">Aucune donnée simulée</span></div>
      <div className="mt-6 grid gap-3 lg:grid-cols-5">{stages.map((stage,index)=><article key={stage.label} className="relative rounded-[22px] border border-slate-200 bg-slate-50 p-4"><span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">{String(index+1).padStart(2,'0')}</span><p className="mt-2 text-sm font-black text-slate-950">{stage.label}</p><p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{stage.detail}</p>{index<stages.length-1?<ArrowRight size={14} className="absolute -right-2.5 top-1/2 z-10 hidden text-blue-500 lg:block"/>:null}</article>)}</div>
    </section>

    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.38fr)_minmax(330px,.62fr)]">
      <Surface title={canvasTitle} subtitle={canvasDetail}>
        <Empty title="Aucun dossier réel ouvert dans cette vue" detail="Ouvrez ou créez un dossier depuis une catégorie. Le workspace affichera alors uniquement ses données, constats et décisions réelles." action={<Action href={createHref}>{createLabel}</Action>}/>
      </Surface>
      <Surface title="Principes d’autorité" subtitle="Ce workspace reste puissant sans inventer une vérité opérationnelle.">
        <div className="space-y-3">{principles.map((item,index)=><article key={item.title} className={index===0?'rounded-[22px] bg-slate-950 p-4 text-white':'rounded-[22px] border border-slate-200 bg-white p-4'}><div className="flex items-start gap-3">{index===0?<Sparkles size={17} className="mt-0.5 shrink-0 text-cyan-300"/>:index===principles.length-1?<ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-600"/>:<CheckCircle2 size={17} className="mt-0.5 shrink-0 text-blue-600"/>}<div><p className={index===0?'text-sm font-black text-white':'text-sm font-black text-slate-950'}>{item.title}</p><p className={index===0?'mt-1 text-xs font-semibold leading-5 text-slate-300':'mt-1 text-xs font-semibold leading-5 text-slate-500'}>{item.detail}</p></div></div></article>)}</div>
      </Surface>
    </section>
  </div>
}
