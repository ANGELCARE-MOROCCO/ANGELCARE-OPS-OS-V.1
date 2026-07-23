'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  ChevronRight,
  Command,
  FileClock,
  GitBranch,
  Layers3,
  ListChecks,
  Network,
  Orbit,
  RadioTower,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Workflow,
} from 'lucide-react'
import { useRevenueOs } from './RevenueOsContext'
import { SChip, SDataTruth, SIcon, SMetric, sovereigntyStyles } from './visual-sovereignty/SovereignPrimitives'

const orbitNodes = [
  { label: 'Signaux', href: '/revenue-command-os/signals', icon: RadioTower, tone: 'cyan', position: 'left-[5%] top-[17%]' },
  { label: 'Digital Twin', href: '/revenue-command-os/digital-twin', icon: Network, tone: 'blue', position: 'left-[7%] bottom-[16%]' },
  { label: 'Strategy Brain', href: '/revenue-command-os/strategy-engine', icon: BrainCircuit, tone: 'violet', position: 'left-[27%] top-[4%]' },
  { label: 'Conseil', href: '/revenue-command-os/validation-council', icon: ShieldCheck, tone: 'amber', position: 'right-[27%] top-[4%]' },
  { label: 'Commandes 3000', href: '/revenue-command-os/command-kernel', icon: Command, tone: 'blue', position: 'right-[5%] top-[17%]' },
  { label: 'Compiler', href: '/revenue-command-os/mission-compiler', icon: GitBranch, tone: 'violet', position: 'right-[7%] bottom-[16%]' },
  { label: 'Exécution', href: '/revenue-command-os/execution-autopilot', icon: Workflow, tone: 'emerald', position: 'right-[30%] bottom-[3%]' },
  { label: 'Learning', href: '/revenue-command-os/mega-production', icon: Sparkles, tone: 'violet', position: 'left-[30%] bottom-[3%]' },
] as const

export default function RevenueOsDashboard() {
  const { bootstrap } = useRevenueOs()
  const objective = bootstrap.objectives[0]
  const attention = [
    { title: 'Décisions humaines en attente', count: bootstrap.counters.pendingApprovals, href: '/revenue-command-os/approvals', icon: BadgeCheck, tone: 'amber' as const },
    { title: 'Exceptions ouvertes', count: bootstrap.counters.openExceptions, href: '/revenue-command-os/exceptions', icon: ShieldAlert, tone: 'rose' as const },
    { title: 'Événements audités aujourd’hui', count: bootstrap.counters.auditEventsToday, href: '/revenue-command-os/audit', icon: FileClock, tone: 'blue' as const },
  ]

  return <div className={`${sovereigntyStyles.canvas} min-h-screen px-4 py-7 sm:px-7 lg:px-10 xl:px-12`}>
    <section className="mx-auto max-w-[1800px]">
      <div className="grid gap-6 xl:grid-cols-[1fr_430px] xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2"><SChip tone="navy"><Orbit size={12} /> Revenue Constellation</SChip><SChip tone="emerald">Production gouvernée</SChip><SChip tone="violet">Shadow / approval-gated</SChip></div>
          <h1 className="mt-5 max-w-6xl text-4xl font-black tracking-[-.06em] text-slate-950 sm:text-6xl">Une vue vivante de tout ce que Revenue OS cherche à gagner, décider, exécuter et apprendre.</h1>
          <p className="mt-5 max-w-3xl text-[15px] leading-7 text-slate-600">L’objectif stratégique reste au centre. Les signaux, stratégies, commandes, programmes, missions, résultats et apprentissages orbitent autour de sa progression réelle.</p>
        </div>
        <div className="grid grid-cols-2 gap-3"><SMetric label="Workspaces" value={bootstrap.counters.workspaceCount} note="Capacités enregistrées" icon={Layers3} tone="blue" /><SMetric label="Contrats verrouillés" value={bootstrap.counters.lockedContractItems} note="Garde-fous actifs" icon={ShieldCheck} tone="emerald" /><div className="col-span-2"><SDataTruth mode={bootstrap.storageMode} /></div></div>
      </div>

      <div className="mt-8 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className={`relative min-h-[760px] overflow-hidden rounded-[46px] border border-slate-200 bg-white shadow-[0_32px_100px_rgba(15,23,42,.1)] ${sovereigntyStyles.gridFine}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,.08),transparent_24%,transparent_52%,rgba(14,165,233,.03)_72%,transparent)]" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1100 760" preserveAspectRatio="none" aria-hidden="true">
            <ellipse cx="550" cy="380" rx="215" ry="145" fill="none" stroke="rgba(37,99,235,.14)" strokeWidth="2" strokeDasharray="8 12" className={sovereigntyStyles.draw} />
            <ellipse cx="550" cy="380" rx="390" ry="270" fill="none" stroke="rgba(14,165,233,.12)" strokeWidth="2" strokeDasharray="10 14" className={sovereigntyStyles.draw} />
            {[[140,150],[145,610],[350,70],[750,70],[960,150],[955,610],[750,700],[350,700]].map(([x,y], index) => <line key={index} x1="550" y1="380" x2={x} y2={y} stroke="rgba(100,116,139,.13)" strokeWidth="1.5" />)}
          </svg>

          <div className="absolute left-1/2 top-1/2 z-10 w-[390px] max-w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-[38px] border border-blue-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-7 text-white shadow-[0_35px_90px_rgba(30,64,175,.3)]">
            <div className="flex items-start justify-between"><SIcon icon={Target} tone="blue" /><SChip tone="emerald">{objective?.status || 'En attente'}</SChip></div>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[.18em] text-blue-300">Objective nucleus · {objective?.code || 'Aucun code'}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{objective?.title || 'Définir le mandat revenu central'}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{objective?.mandate || 'La constellation reste en observation tant qu’aucun objectif n’a été enregistré.'}</p>
            <div className="mt-6 grid grid-cols-2 gap-3"><NucleusFact label="Horizon" value={objective?.horizon || '—'} /><NucleusFact label="Marché" value={objective?.targetMarket || '—'} /><NucleusFact label="Owner" value={objective?.owner || '—'} /><NucleusFact label="Mode" value={objective?.executionMode || bootstrap.executionMode} /></div>
            <button onClick={() => window.dispatchEvent(new CustomEvent('revenue-os:open-objective'))} className="mt-6 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-950">{objective ? 'Ouvrir le mandat' : 'Composer le mandat'} <ArrowRight size={16} /></button>
          </div>

          {orbitNodes.map((node) => <Link key={node.label} href={node.href} className={`absolute z-20 hidden w-[150px] rounded-[26px] border border-slate-200 bg-white/88 p-4 text-center shadow-[0_18px_50px_rgba(15,23,42,.1)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-blue-300 lg:block ${node.position} ${sovereigntyStyles.floatSlow}`}>
            <SIcon icon={node.icon} tone={node.tone} className="mx-auto" /><p className="mt-3 text-xs font-black text-slate-900">{node.label}</p><span className="mt-2 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[.1em] text-blue-700">Explorer <ChevronRight size={12} /></span>
          </Link>)}

          <div className="absolute inset-x-4 bottom-4 z-20 grid gap-2 sm:grid-cols-2 lg:hidden">{orbitNodes.map((node) => <Link key={node.label} href={node.href} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 backdrop-blur"><SIcon icon={node.icon} tone={node.tone} className="h-9 w-9 rounded-xl" /><span className="text-xs font-black">{node.label}</span><ChevronRight size={14} className="ml-auto text-slate-400" /></Link>)}</div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_22px_65px_rgba(15,23,42,.07)]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.17em] text-rose-700">Executive intervention</p><h2 className="mt-2 text-xl font-black text-slate-950">Attention requise</h2></div><SIcon icon={AlertTriangle} tone="rose" /></div><div className="mt-5 space-y-3">{attention.map((item) => <Link key={item.title} href={item.href} className="flex items-center gap-3 rounded-[22px] border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"><SIcon icon={item.icon} tone={item.tone} className="h-10 w-10 rounded-xl" /><div className="min-w-0 flex-1"><p className="text-xs font-black text-slate-900">{item.title}</p><p className="mt-1 text-[10px] text-slate-500">Ouvrir le centre concerné</p></div><span className="text-2xl font-black text-slate-950">{item.count}</span></Link>)}</div></section>

          <section className="overflow-hidden rounded-[34px] border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6"><SIcon icon={TrendingUp} tone="violet" /><p className="mt-5 text-[10px] font-black uppercase tracking-[.17em] text-violet-700">Revenue operating map</p><h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Objectif → Intelligence → Décision → Production → Learning</h2><div className="mt-6 space-y-3">{['Objectif défini', 'Contexte commercial disponible', 'Stratégie gouvernée', 'Commandes déterministes', 'Compilation contrôlée', 'Exécution approval-gated', 'Apprentissage mesuré'].map((label, index) => <div key={label} className="flex items-center gap-3"><span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-black ${index < 3 ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>{index + 1}</span><span className="text-xs font-bold text-slate-700">{label}</span></div>)}</div></section>

          <Link href="/revenue-command-os/cockpit" className="flex items-center justify-between rounded-[30px] bg-slate-950 p-6 text-white shadow-[0_24px_65px_rgba(15,23,42,.2)]"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-300">Executive view</p><p className="mt-2 text-lg font-black">Entrer dans le Flight Deck</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600"><Command size={20} /></span></Link>
        </aside>
      </div>
    </section>
  </div>
}

function NucleusFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-black text-white">{value}</p></div>
}
