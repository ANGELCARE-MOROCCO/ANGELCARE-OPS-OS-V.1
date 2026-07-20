'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Command,
  Database,
  ExternalLink,
  FileLock2,
  Gauge,
  GitBranch,
  Layers3,
  LockKeyhole,
  Plus,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
  Workflow,
} from 'lucide-react'
import { useRevenueOs } from './RevenueOsContext'
import RevenueOsIcon from './RevenueOsIcon'

const stageItems = [
  { label: 'Objectif', detail: 'Mandat exécutif', icon: Target, status: 'active' },
  { label: 'Signaux', detail: 'Contexte live', icon: RadioTower, status: 'foundation' },
  { label: 'Commandes', detail: 'Routage intelligent', icon: Command, status: 'foundation' },
  { label: 'Stratégies', detail: 'Options concurrentes', icon: GitBranch, status: 'planned' },
  { label: 'Validation', detail: 'Conseil & red-team', icon: BadgeCheck, status: 'planned' },
  { label: 'Compilation', detail: 'Programmes & missions', icon: Workflow, status: 'planned' },
  { label: 'Propagation', detail: 'Exécution contrôlée', icon: Layers3, status: 'locked' },
]

function healthTone(status: string) {
  if (status === 'operational') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'attention') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'degraded') return 'border-orange-200 bg-orange-50 text-orange-700'
  return 'border-rose-200 bg-rose-50 text-rose-700'
}

function maturityTone(status: string) {
  if (status === 'ready') return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (status === 'foundation') return 'bg-blue-50 text-blue-700 ring-blue-100'
  if (status === 'locked') return 'bg-slate-100 text-slate-600 ring-slate-200'
  return 'bg-violet-50 text-violet-700 ring-violet-100'
}

function objectiveTone(status: string) {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700'
  if (status === 'submitted') return 'bg-blue-50 text-blue-700'
  if (status === 'validated') return 'bg-cyan-50 text-cyan-700'
  return 'bg-slate-100 text-slate-600'
}

export default function RevenueOsDashboard() {
  const { bootstrap, busy, refresh } = useRevenueOs()

  function openObjective() {
    window.dispatchEvent(new CustomEvent('revenue-os:open-objective'))
  }

  const operationalChecks = bootstrap.systemChecks.filter((item) => item.status === 'operational').length
  const readiness = Math.round((operationalChecks / Math.max(bootstrap.systemChecks.length, 1)) * 100)

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,.06)]">
        <div className="absolute right-0 top-0 h-full w-[45%] bg-[radial-gradient(circle_at_70%_25%,rgba(59,130,246,.12),transparent_37%),radial-gradient(circle_at_85%_85%,rgba(16,185,129,.10),transparent_30%)]" />
        <div className="relative grid gap-7 p-6 sm:p-8 xl:grid-cols-[1.35fr_.65fr] xl:p-9">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.15em] text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Fondation active</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.15em] text-blue-700"><LockKeyhole size={13} /> Shadow mode</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[.15em] text-slate-500">{bootstrap.moduleVersion}</span>
            </div>
            <h2 className="mt-6 max-w-4xl text-3xl font-black leading-[1.08] tracking-[-.035em] text-slate-950 sm:text-4xl xl:text-[44px]">Le système stratégique qui transforme une ambition commerciale en exécution gouvernée.</h2>
            <p className="mt-4 max-w-3xl text-[15px] leading-7 text-slate-600">Mega ZIP 2 active le Revenue Digital Twin: une représentation structurée des unités commerciales, offres, segments, décideurs, territoires, prix, capacités, parcours, dépendances et leviers d’expansion qui alimentera les futures 3 000 commandes et le Strategy Brain.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={openObjective} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/15"><Plus size={17} /> Composer un objectif</button>
              <Link href="/revenue-command-os/digital-twin" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-800 shadow-lg shadow-blue-950/10 transition hover:-translate-y-0.5">Ouvrir le Revenue Digital Twin <ArrowRight size={17} /></Link><Link href="/revenue-command-os/settings" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"><ShieldCheck size={17} /> Inspecter la gouvernance</Link>
              <button onClick={refresh} disabled={busy} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={busy ? 'animate-spin' : ''} /> Actualiser</button>
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-300">Posture système</p><h3 className="mt-1 text-xl font-black text-white">Contrôle avant autonomie</h3></div>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><FileLock2 size={21} /></span>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ['Contrat canonique', 'Verrouillé', Check],
                ['Actions externes', 'Désactivées', LockKeyhole],
                ['Persistance', bootstrap.storageMode === 'supabase' ? 'Supabase' : 'Fondation', Database],
                ['Traçabilité', 'Event IDs v1', CircleDot],
              ].map(([label, value, Icon]) => {
                const TypedIcon = Icon as typeof Check
                return <div key={String(label)} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.06] px-3.5 py-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-blue-200"><TypedIcon size={16} /></span><span className="min-w-0 flex-1 text-xs font-semibold text-slate-300">{String(label)}</span><span className="text-xs font-black text-white">{String(value)}</span></div>
              })}
            </div>
            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-400">Readiness fondation</span><span className="font-black text-white">{readiness}%</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-emerald-400" style={{ width: `${readiness}%` }} /></div>
              <p className="mt-3 text-[11px] leading-5 text-slate-400">La persistance devient complète après application cumulative des migrations Phase 1 et Phase 2.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          ['Workspaces contractés', bootstrap.counters.workspaceCount, 'Routes isolées', Command, 'blue'],
          ['Éléments verrouillés', bootstrap.counters.lockedContractItems, 'Portée canonique', FileLock2, 'navy'],
          ['Feature flags actifs', bootstrap.counters.enabledFeatureFlags, 'Contrôle runtime', Gauge, 'green'],
          ['Contrôles système', `${operationalChecks}/${bootstrap.systemChecks.length}`, 'Opérationnels', ShieldCheck, 'green'],
          ['Exceptions ouvertes', bootstrap.counters.openExceptions, 'À traiter', TriangleAlert, bootstrap.counters.openExceptions ? 'amber' : 'green'],
          ['Audit aujourd’hui', bootstrap.counters.auditEventsToday, 'Événements tracés', Clock3, 'violet'],
        ].map(([label, value, detail, Icon, tone]) => {
          const TypedIcon = Icon as typeof Command
          const color = tone === 'green' ? 'bg-emerald-50 text-emerald-700' : tone === 'amber' ? 'bg-amber-50 text-amber-700' : tone === 'violet' ? 'bg-violet-50 text-violet-700' : tone === 'navy' ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-700'
          return <div key={String(label)} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,.035)]"><div className="flex items-start justify-between"><span className={`grid h-9 w-9 place-items-center rounded-xl ${color}`}><TypedIcon size={17} /></span><span className="h-2 w-2 rounded-full bg-emerald-400" /></div><p className="mt-4 text-[11px] font-black uppercase tracking-[.12em] text-slate-400">{String(label)}</p><p className="mt-1 text-2xl font-black tracking-tight text-slate-950">{String(value)}</p><p className="mt-1 text-xs font-semibold text-slate-500">{String(detail)}</p></div>
        })}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,.045)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[10px] font-black uppercase tracking-[.17em] text-blue-700">Architecture contractuelle</p><h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">De l’objectif à la propagation</h3><p className="mt-1 text-sm text-slate-500">La fondation et le Revenue Digital Twin sont actifs; les commandes intelligentes et le Strategy Brain restent volontairement verrouillés.</p></div>
          <Link href="/revenue-command-os/audit" className="inline-flex items-center gap-2 text-xs font-black text-blue-700">Voir la traçabilité <ArrowRight size={15} /></Link>
        </div>
        <div className="mt-6 grid gap-2 xl:grid-cols-7">
          {stageItems.map((item, index) => {
            const Icon = item.icon
            const active = item.status === 'active' || item.status === 'foundation'
            return <div key={item.label} className="relative rounded-2xl border border-slate-200 bg-slate-50/70 p-4 xl:min-h-[138px]">
              {index < stageItems.length - 1 ? <ChevronRight className="absolute -right-[13px] top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1 text-slate-300 xl:block" size={25} /> : null}
              <div className="flex items-center justify-between"><span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-400'}`}><Icon size={17} /></span><span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase ring-1 ${maturityTone(item.status === 'active' ? 'ready' : item.status)}`}>{item.status === 'active' ? 'Active' : item.status === 'foundation' ? 'P1' : item.status === 'locked' ? 'Verrouillé' : 'À venir'}</span></div>
              <p className="mt-4 text-sm font-black text-slate-900">{item.label}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{item.detail}</p>
            </div>
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_.75fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,.045)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
            <div><p className="text-[10px] font-black uppercase tracking-[.17em] text-blue-700">Objective Registry</p><h3 className="mt-1 text-lg font-black text-slate-950">Mandats sous gouvernance</h3></div>
            <button onClick={openObjective} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"><Plus size={15} /> Ajouter</button>
          </div>
          <div className="divide-y divide-slate-100">
            {bootstrap.objectives.map((objective) => (
              <div key={objective.id} className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase ${objectiveTone(objective.status)}`}>{objective.status}</span><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">{objective.code}</span></div>
                  <h4 className="mt-2 text-base font-black text-slate-950">{objective.title}</h4>
                  <p className="mt-1 line-clamp-2 max-w-3xl text-xs leading-5 text-slate-500">{objective.mandate}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500"><span>{objective.businessUnit}</span><span>•</span><span>{objective.targetMarket}</span><span>•</span><span>{objective.horizon}</span></div>
                </div>
                <div className="flex items-center gap-3 lg:flex-col lg:items-end"><span className="rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black uppercase text-slate-600">{objective.executionMode}</span><Link href="/revenue-command-os/revenue-objectives" className="inline-flex items-center gap-1 text-xs font-black text-blue-700">Inspecter <ChevronRight size={14} /></Link></div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,.045)]">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.17em] text-blue-700">System checks</p><h3 className="mt-1 text-lg font-black text-slate-950">État de la fondation</h3></div><ShieldCheck className="text-emerald-600" size={22} /></div>
            <div className="mt-4 space-y-2.5">
              {bootstrap.systemChecks.map((check) => <div key={check.key} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${check.status === 'operational' ? 'bg-emerald-500' : check.status === 'attention' ? 'bg-amber-500' : 'bg-rose-500'}`} /><p className="min-w-0 flex-1 truncate text-xs font-black text-slate-800">{check.label}</p><span className={`rounded-lg border px-2 py-1 text-[8px] font-black uppercase ${healthTone(check.status)}`}>{check.status}</span></div><p className="mt-2 text-[11px] leading-5 text-slate-500">{check.detail}</p>{check.action ? <p className="mt-2 rounded-xl bg-amber-50 px-2.5 py-2 text-[10px] font-bold text-amber-700">{check.action}</p> : null}</div>)}
            </div>
          </section>
        </aside>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,.045)] sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.17em] text-blue-700">Workspace Registry</p><h3 className="mt-1 text-lg font-black text-slate-950">Surfaces contractées</h3></div><span className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">{bootstrap.workspaces.length} workspaces</span></div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {bootstrap.workspaces.slice(0, 10).map((workspace) => <Link key={workspace.key} href={workspace.href} className="group rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm"><RevenueOsIcon name={workspace.icon} size={18} /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-black text-slate-900">{workspace.label}</p><span className={`rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase ring-1 ${maturityTone(workspace.status)}`}>{workspace.status}</span></div><p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{workspace.description}</p></div><ChevronRight size={16} className="mt-1 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" /></div></Link>)}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,.045)] sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.17em] text-blue-700">Immutable audit</p><h3 className="mt-1 text-lg font-black text-slate-950">Dernières traces</h3></div><Link href="/revenue-command-os/audit" className="text-xs font-black text-blue-700">Tout voir</Link></div>
          <div className="mt-5 space-y-3">
            {bootstrap.auditEvents.slice(0, 5).map((event) => <div key={event.id} className="flex gap-3"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${event.outcome === 'success' ? 'bg-emerald-500' : event.outcome === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`} /><div className="min-w-0 flex-1 border-b border-slate-100 pb-3"><p className="text-xs font-black text-slate-800">{event.summary}</p><p className="mt-1 truncate text-[10px] font-semibold text-slate-400">{event.eventId}</p><div className="mt-1 flex justify-between text-[10px] text-slate-500"><span>{event.actor}</span><span>{new Date(event.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></div></div></div>)}
          </div>
          <Link href="/revenue-command-os/audit" className="mt-4 inline-flex items-center gap-2 text-xs font-black text-blue-700">Ouvrir le registre d’audit <ExternalLink size={14} /></Link>
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: BrainCircuit, title: 'Intelligence gouvernée', text: 'Le Digital Twin structure la vérité commerciale sans prétendre exécuter les futures commandes ou stratégies avant leurs phases contractuelles.' },
          { icon: ShieldCheck, title: 'Gouvernance native', text: 'Les actions externes, réductions, propositions et engagements resteront bloqués sans autorité explicite.' },
          { icon: Sparkles, title: 'UX prête à évoluer', text: 'Le shell et les workspaces sont conçus pour accueillir la complexité sans devenir un dashboard financier ou un gestionnaire de tâches.' },
        ].map((item) => <div key={item.title} className="rounded-[24px] border border-slate-200 bg-white p-5"><item.icon className="text-blue-700" size={22} /><h4 className="mt-4 text-sm font-black text-slate-900">{item.title}</h4><p className="mt-2 text-xs leading-6 text-slate-500">{item.text}</p></div>)}
      </section>
    </div>
  )
}
