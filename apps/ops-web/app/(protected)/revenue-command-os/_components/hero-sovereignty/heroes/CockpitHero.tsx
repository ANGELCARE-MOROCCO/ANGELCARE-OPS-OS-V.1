'use client'
import { Activity, Download, Radar, RefreshCw, ShieldAlert, Target } from 'lucide-react'
import type { SovereignHeroProps } from '../hero-types'
import { AngelCareHeroBrand, HeroActionRail, HeroAuthorityBadge, HeroExecutiveBrief, HeroMetricGrid, HeroTruthBadge, HeroWarning } from '../HeroPrimitives'
import styles from '../SovereignHeroes.module.css'

export default function CockpitHero({ state, posture, authority, summary, metrics = [], actions = [], freshness, warning }: SovereignHeroProps) {
  return <section className={`${styles.hero} min-h-[430px] bg-[linear-gradient(118deg,#061226_0%,#0b2850_52%,#0c4d75_100%)] p-6 text-white sm:p-8 xl:p-10`} data-hero-surface="dark" data-hero-id="MZ22-HERO-01-COCKPIT">
    <div className={`absolute inset-0 opacity-35 ${styles.fineGrid}`} />
    <div className="absolute -right-24 -top-28 h-[420px] w-[420px] rounded-full border border-white/10" />
    <div className="absolute right-10 top-12 h-[250px] w-[250px] rounded-full border border-blue-300/15" />
    <div className={`${styles.redTriangle} -right-4 bottom-10`} />
    <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 1500 480" preserveAspectRatio="none"><path d="M20 390 C 260 210, 420 430, 660 205 S 1010 100, 1470 260" fill="none" stroke="rgba(125,211,252,.48)" strokeWidth="2" className={styles.flowLine}/><circle cx="1070" cy="185" r="74" fill="none" stroke="rgba(255,255,255,.13)"/><circle cx="1070" cy="185" r="120" fill="none" stroke="rgba(255,255,255,.08)"/></svg>
    <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_440px] xl:items-stretch">
      <div className="flex flex-col justify-between">
        <div><div className="flex flex-wrap items-center gap-2"><HeroTruthBadge state={state}/><HeroAuthorityBadge inverted>{authority}</HeroAuthorityBadge><span className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-blue-100">{posture}</span></div><div className="mt-6"><AngelCareHeroBrand inverted /></div><p className="mt-8 text-[10px] font-black uppercase tracking-[.24em] text-blue-200">AngelCare Executive Bridge</p><h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-.065em] sm:text-5xl xl:text-6xl">Cockpit</h1><p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-300 sm:text-base">Pont central de commandement pour comprendre la posture revenue, décider de la priorité du jour et isoler immédiatement les exceptions critiques.</p></div>
        <div className="mt-7"><HeroExecutiveBrief dark>{summary}</HeroExecutiveBrief>{freshness ? <p className="mt-3 text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">Dernière synchronisation réussie · {freshness}</p> : null}<HeroWarning dark>{warning}</HeroWarning><div className="mt-5"><HeroActionRail actions={actions} dark /></div></div>
      </div>
      <aside className="relative overflow-hidden rounded-[30px] border border-white/12 bg-white/[.065] p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-blue-200">Command horizon</p><p className="mt-2 text-xl font-black">Situation revenue du jour</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-400/15 text-blue-200"><Radar size={23}/></span></div>
        <div className="relative mt-5 h-32 overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/30"><div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300/30"/><div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/25"/><span className="absolute left-[24%] top-[34%] h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_18px_rgba(251,113,133,.9)]"/><span className="absolute right-[18%] top-[28%] h-2 w-2 rounded-full bg-emerald-300"/><span className="absolute bottom-[22%] left-[52%] h-2 w-2 rounded-full bg-blue-300"/><div className="absolute inset-x-5 bottom-4 flex items-center justify-between text-[8px] font-black uppercase tracking-[.12em] text-slate-400"><span className="inline-flex items-center gap-1"><Target size={11}/> priorité</span><span className="inline-flex items-center gap-1"><ShieldAlert size={11}/> exceptions</span><span className="inline-flex items-center gap-1"><Activity size={11}/> readiness</span></div></div>
        <div className="mt-4"><HeroMetricGrid metrics={metrics.slice(0,4)} dark /></div>
      </aside>
    </div>
  </section>
}
