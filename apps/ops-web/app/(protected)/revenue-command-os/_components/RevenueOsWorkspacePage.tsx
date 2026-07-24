'use client'

import Link from 'next/link'
import {
  Activity,
  AlertOctagon,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Command,
  FileCheck2,
  FileClock,
  FileLock2,
  Fingerprint,
  GitBranch,
  History,
  Layers3,
  ListChecks,
  Network,
  Orbit,
  PanelTop,
  Radar,
  Route,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TimerReset,
  UserRoundCheck,
  UsersRound,
  Workflow,
  XCircle,
} from 'lucide-react'
import type { RevenueOsWorkspaceKey } from '@/lib/revenue-command-os/types'
import { useRevenueOs } from './RevenueOsContext'
import { SChip, SDataTruth, SEmpty, SIcon, SMetric, STraceLink, sovereigntyStyles } from './visual-sovereignty/SovereignPrimitives'
import ApprovalCenterWorkspace from './approvals/ApprovalCenterWorkspace'
import ChannelGovernancePanel from './ChannelGovernancePanel'
import { AuditHero, ExceptionsHero, MissionsHero, ObjectivesHero, ProgramsHero, SettingsHero } from './hero-sovereignty/heroes'

export default function RevenueOsWorkspacePage({ workspaceKey }: { workspaceKey: RevenueOsWorkspaceKey }) {
  switch (workspaceKey) {
    case 'revenue-objectives': return <MandateLedger />
    case 'active-programs': return <ProgramTerrain />
    case 'compiled-missions': return <MissionBinders />
    case 'approvals': return <ApprovalCenterWorkspace />
    case 'exceptions': return <InterventionTower />
    case 'audit': return <ForensicLedger />
    case 'settings': return <GovernanceConstitution />
    default: return <UnsupportedWorkspace workspaceKey={workspaceKey} />
  }
}

function MandateLedger() {
  const { bootstrap } = useRevenueOs()
  const objectives = bootstrap.objectives
  const horizonOrder = ['Maintenant', '7 jours', '30 jours', 'Trimestre', 'Année']
  return <div className={`${sovereigntyStyles.canvas} min-h-screen px-4 py-7 sm:px-7 lg:px-10 xl:px-12`}>
    <section className="mx-auto max-w-[1740px]">
      <ObjectivesHero
        state={bootstrap.storageMode === 'supabase' ? (objectives.length ? 'LIVE' : 'EMPTY') : 'PREVIEW'}
        posture={`Mode ${bootstrap.executionMode}`}
        authority="Gouvernance Revenue · création contrôlée"
        summary={objectives[0]?.mandate || 'Aucun mandat revenu actif. La chaîne stratégique reste volontairement inactive jusqu’à la création d’un objectif gouverné.'}
        freshness={new Date(bootstrap.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Mandats actifs', value: objectives.filter((objective) => objective.status === 'active').length, note: `${objectives.length} au total`, tone: 'blue' },
          { label: 'Priorité', value: objectives[0]?.priority || 'Non calculé', note: objectives[0]?.title || 'Aucun mandat', tone: 'rose' },
          { label: 'Horizon', value: objectives[0]?.horizon || '—', note: objectives[0]?.targetMarket || 'Indisponible', tone: 'cyan' },
          { label: 'Préparation', value: objectives.length ? 'Mandat disponible' : 'En attente', note: `Mode ${bootstrap.executionMode}`, tone: objectives.length ? 'emerald' : 'amber' },
        ]}
        actions={[{ label: objectives.length ? 'Composer un mandat' : 'Créer le premier mandat', onClick: () => window.dispatchEvent(new CustomEvent('revenue-os:open-objective')), kind: 'primary' }]}
        warning={bootstrap.storageMode === 'foundation-fallback' ? 'PREVIEW — les objectifs affichés proviennent de la fondation contractuelle, pas d’une source persistée live.' : undefined}
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        {horizonOrder.map((horizon, index) => {
          const count = objectives.filter((objective) => objective.horizon.toLowerCase().includes(horizon.split(' ')[0].toLowerCase())).length
          return <div key={horizon} className={`rounded-[24px] border p-4 ${index === 0 ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white/80'}`}><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Horizon {String(index + 1).padStart(2, '0')}</p><div className="mt-2 flex items-end justify-between"><h3 className="text-sm font-black text-slate-900">{horizon}</h3><span className="text-2xl font-black text-slate-950">{count}</span></div><div className="mt-3 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(8, Math.min(100, count * 28))}%` }} /></div></div>
        })}
      </div>

      <div className="mt-8 overflow-x-auto pb-5">
        <div className="flex min-w-max gap-5">
          {objectives.map((objective, index) => <article key={objective.id} className={`relative w-[370px] overflow-hidden rounded-[32px] border bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,.07)] ${index === 0 ? 'border-blue-300' : 'border-slate-200'}`}>
            <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[70px] bg-gradient-to-br from-blue-50 to-cyan-50" />
            <div className="relative flex items-start justify-between"><SIcon icon={Target} tone={index === 0 ? 'blue' : 'navy'} /><SChip tone={objective.status === 'active' ? 'emerald' : 'amber'}>{objective.status}</SChip></div>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[.16em] text-blue-700">{objective.code}</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-slate-950">{objective.title}</h2>
            <p className="mt-3 min-h-24 text-sm leading-6 text-slate-600">{objective.mandate}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-[11px]"><MandateFact label="Unité" value={objective.businessUnit} /><MandateFact label="Marché" value={objective.targetMarket} /><MandateFact label="Horizon" value={objective.horizon} /><MandateFact label="Owner" value={objective.owner} /></div>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><SChip tone="violet">{objective.executionMode}</SChip><span className="inline-flex items-center gap-1 text-xs font-black text-slate-400">Dossier consolidé dans cette vue <BadgeCheck size={14} /></span></div>
          </article>)}
        </div>
      </div>

      {!objectives.length ? <SEmpty title="Aucun mandat revenu" description="La chaîne Revenue OS reste volontairement inactive tant qu’un objectif stratégique n’a pas été défini et validé." action={<button onClick={() => window.dispatchEvent(new CustomEvent('revenue-os:open-objective'))} className="rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white">Créer le premier mandat</button>} /> : null}
    </section>
  </div>
}

function MandateFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-1 truncate font-bold text-slate-800">{value || '—'}</p></div>
}

function ProgramTerrain() {
  const { bootstrap } = useRevenueOs()
  const objective = bootstrap.objectives[0]
  const programs = bootstrap.operations.programs
  const state = bootstrap.operations.sourceState === 'unavailable' ? 'DEGRADED' : programs.length ? 'LIVE' : 'EMPTY'
  return <div className="min-h-screen overflow-hidden bg-[#f4f8f5] px-4 py-7 sm:px-7 lg:px-10 xl:px-12">
    <section className="mx-auto max-w-[1740px]">
      <ProgramsHero
        state={state}
        posture="Portfolio opérationnel persisté"
        authority="Compilation approuvée · exécution approval-gated"
        summary={programs[0]
          ? `${programs[0].code} · ${programs[0].objective}`
          : objective ? `Le mandat ${objective.code} est disponible, mais aucun programme compilé n’a encore été publié.` : 'Aucun programme ni mandat source n’est disponible pour ce tenant.'}
        freshness={new Date(bootstrap.operations.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Programmes persistés', value: bootstrap.operations.counts.programs, note: `${bootstrap.operations.counts.activePrograms} actif(s)`, tone: 'emerald' },
          { label: 'Campagnes', value: programs.reduce((total, item) => total + item.campaigns, 0), note: 'Reliées aux programmes', tone: 'blue' },
          { label: 'Missions', value: programs.reduce((total, item) => total + item.missions, 0), note: `${bootstrap.operations.counts.blockedTasks} tâche(s) bloquée(s)`, tone: bootstrap.operations.counts.blockedTasks ? 'amber' : 'violet' },
          { label: 'Effets externes', value: 'Sur approbation', note: `Mode ${bootstrap.executionMode}`, tone: 'rose' },
        ]}
        actions={[{ label: 'Ouvrir la compilation', href: '/revenue-command-os/mission-compiler', kind: 'primary' }]}
        warning={bootstrap.operations.warnings.length ? `SOURCE PARTIELLE — ${bootstrap.operations.warnings.slice(0, 2).join(' · ')}` : undefined}
      />

      {programs.length ? <div className="relative mt-7 min-h-[660px] overflow-hidden rounded-[38px] border border-emerald-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.07)] sm:p-8">
        <div className={`absolute inset-0 opacity-55 ${sovereigntyStyles.dotField}`} />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1400 660" preserveAspectRatio="none"><path d="M140 530 C 310 380, 400 520, 580 330 S 920 230, 1110 360 S 1270 260, 1360 110" fill="none" stroke="rgba(16,185,129,.22)" strokeWidth="4" strokeDasharray="10 12" /></svg>
        <div className="relative flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.17em] text-emerald-700">Carte des opérations</p><h2 className="mt-2 text-2xl font-black text-slate-950">Programmes compilés et persistés</h2></div><SDataTruth mode={bootstrap.storageMode} /></div>
        <div className="relative mt-8 grid gap-6 lg:grid-cols-3">
          {programs.map((program, index) => <article key={program.id} className={`relative min-h-[440px] overflow-hidden rounded-[34px] border p-6 ${index % 3 === 0 ? 'border-blue-200 bg-gradient-to-b from-blue-50 to-white' : index % 3 === 1 ? 'border-emerald-200 bg-gradient-to-b from-emerald-50 to-white' : 'border-violet-200 bg-gradient-to-b from-violet-50 to-white'} ${index % 3 === 1 ? 'lg:mt-20' : index % 3 === 2 ? 'lg:mt-8' : ''}`}>
            <div className="flex items-start justify-between"><SIcon icon={index % 3 === 0 ? Radar : index % 3 === 1 ? Route : Orbit} tone={index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'emerald' : 'violet'} /><SChip tone={['active','ready','compiled','in_progress'].includes(program.status) ? 'emerald' : program.tasksBlocked ? 'amber' : 'blue'}>{program.status}</SChip></div>
            <p className="mt-5 font-mono text-[10px] font-black uppercase tracking-[.13em] text-blue-700">{program.code}</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{program.title}</h3>
            <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">{program.objective}</p>
            <div className="mt-6 grid grid-cols-2 gap-3"><MandateFact label="Campagnes" value={String(program.campaigns)} /><MandateFact label="Waves" value={String(program.waves)} /><MandateFact label="Missions" value={String(program.missions)} /><MandateFact label="Owner" value={program.owner} /></div>
            <div className="mt-6"><div className="flex justify-between text-[10px] font-black uppercase tracking-[.1em] text-slate-500"><span>Avancement réel</span><span>{program.progress}%</span></div><div className="mt-2 h-2 rounded-full bg-white"><div className={`h-full rounded-full ${index % 3 === 0 ? 'bg-blue-600' : index % 3 === 1 ? 'bg-emerald-500' : 'bg-violet-500'}`} style={{ width: `${program.progress}%` }} /></div></div>
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-500 shadow-sm"><span>{program.tasksOpen} tâche(s) ouverte(s) · {program.tasksBlocked} bloquée(s)</span><BadgeCheck size={16} className={program.tasksBlocked ? 'text-amber-600' : 'text-emerald-600'} /></div>
          </article>)}
        </div>
      </div> : <SEmpty title="Aucun programme compilé" description="La source est accessible, mais aucune stratégie approuvée n’a encore produit de programme persistant. Passez par le Strategy Studio puis le Mission Compiler." action={<Link href="/revenue-command-os/mission-compiler" className="rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white">Ouvrir le compilateur</Link>} />}
    </section>
  </div>
}

function MissionBinders() {
  const { bootstrap } = useRevenueOs()
  const missions = bootstrap.operations.missions
  const state = bootstrap.operations.sourceState === 'unavailable' ? 'DEGRADED' : missions.length ? 'LIVE' : 'EMPTY'
  return <div className="min-h-screen bg-[#f7f5f1] px-4 py-7 sm:px-7 lg:px-10 xl:px-12">
    <section className="mx-auto max-w-[1740px]">
      <MissionsHero
        state={state}
        posture="Dossiers compilés persistés"
        authority="Affectation, preuves et gates conservées"
        summary={missions[0] ? `${missions[0].code} · ${missions[0].purpose}` : 'Aucune mission persistée n’est encore disponible. Le système n’invente aucun dossier de démonstration.'}
        freshness={new Date(bootstrap.operations.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Missions persistées', value: bootstrap.operations.counts.missions, note: `${bootstrap.operations.counts.openMissions} ouverte(s)`, tone: 'blue' },
          { label: 'Tâches', value: missions.reduce((total, item) => total + item.taskCount, 0), note: `${missions.reduce((total, item) => total + item.completedTasks, 0)} terminée(s)`, tone: 'violet' },
          { label: 'Tâches bloquées', value: bootstrap.operations.counts.blockedTasks, note: bootstrap.operations.counts.blockedTasks ? 'Intervention requise' : 'Aucun blocage', tone: bootstrap.operations.counts.blockedTasks ? 'amber' : 'emerald' },
          { label: 'Preuves attendues', value: missions.reduce((total, item) => total + item.evidenceCount, 0), note: 'Exigences compilées', tone: 'slate' },
        ]}
        actions={[{ label: 'Ouvrir le compilateur', href: '/revenue-command-os/mission-compiler', kind: 'primary' }]}
        warning={bootstrap.operations.warnings.length ? `SOURCE PARTIELLE — ${bootstrap.operations.warnings.slice(0, 2).join(' · ')}` : undefined}
      />

      {missions.length ? <div className="mt-9 grid gap-6 xl:grid-cols-[1fr_410px]">
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {missions.map((mission, index) => {
            const completion = mission.taskCount ? Math.round((mission.completedTasks / mission.taskCount) * 100) : 0
            return <article key={mission.id} className="group relative min-h-[560px] overflow-hidden rounded-r-[34px] rounded-l-[12px] border border-slate-300 bg-white shadow-[12px_24px_70px_rgba(15,23,42,.1)] transition hover:-translate-y-1">
              <div className={`absolute inset-y-0 left-0 w-3 ${mission.blockedTasks ? 'bg-amber-500' : index % 3 === 0 ? 'bg-blue-700' : index % 3 === 1 ? 'bg-emerald-600' : 'bg-violet-600'}`} />
              <div className="absolute inset-x-8 top-0 h-4 rounded-b-xl bg-slate-100" />
              <div className="p-7 pl-9"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Mission Binder</p><p className="mt-1 font-mono text-xs font-bold text-blue-700">{mission.code}</p></div><SChip tone={mission.blockedTasks ? 'amber' : ['ready','active','compiled','in_progress'].includes(mission.status) ? 'emerald' : 'violet'}>{mission.status}</SChip></div>
              <h2 className="mt-8 text-2xl font-black tracking-tight text-slate-950">{mission.title}</h2><p className="mt-3 min-h-24 text-sm leading-6 text-slate-600">{mission.purpose}</p>
              <div className="mt-8 space-y-3"><BinderLine icon={Workflow} label="Stratégie" value={mission.strategyId ? mission.strategyId.slice(0, 12) : '—'} /><BinderLine icon={Layers3} label="Programme" value={mission.programId ? mission.programId.slice(0, 12) : '—'} /><BinderLine icon={UsersRound} label="Owner" value={mission.owner} /><BinderLine icon={ListChecks} label="Tâches" value={`${mission.completedTasks}/${mission.taskCount}`} /><BinderLine icon={FileCheck2} label="Preuves" value={String(mission.evidenceCount)} /></div>
              <div className="mt-8"><div className="flex justify-between text-[10px] font-black uppercase tracking-[.1em] text-slate-500"><span>Progression d’exécution</span><span>{completion}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-950" style={{ width: `${completion}%` }} /></div></div>
              <div className="mt-8 flex w-full items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white"><span>{mission.nextAction || 'Dossier compilé et traçable'}</span><BadgeCheck size={16} /></div></div>
            </article>
          })}
        </div>
        <aside className="rounded-[34px] border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,.2)]"><SIcon icon={GitBranch} tone="blue" /><p className="mt-6 text-[10px] font-black uppercase tracking-[.18em] text-blue-300">Chaîne de compilation</p><h2 className="mt-2 text-3xl font-black tracking-tight">Stratégie → Mission → Preuve → Résultat</h2><div className="mt-8 space-y-1">{['Stratégie approuvée', 'Plan de compilation', 'Programme', 'Campagne', 'Wave', 'Mission', 'Tâches', 'Étapes', 'Preuves', 'Escalades'].map((step, index) => <div key={step} className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-full text-[10px] font-black ${missions.length && index < 6 ? 'bg-emerald-400 text-emerald-950' : 'bg-white/10 text-slate-300'}`}>{index + 1}</span><span className={`flex-1 border-b py-4 text-sm font-bold ${missions.length && index < 6 ? 'border-emerald-400/20 text-white' : 'border-white/10 text-slate-400'}`}>{step}</span></div>)}</div></aside>
      </div> : <SEmpty title="Aucune mission compilée" description="La source est accessible et ne contient aucune mission. Une stratégie approuvée doit être compilée avant l’ouverture de l’exécution." action={<Link href="/revenue-command-os/mission-compiler" className="rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white">Ouvrir le compilateur</Link>} />}
    </section>
  </div>
}

function BinderLine({ icon: Icon, label, value }: { icon: typeof Workflow; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5"><Icon size={15} className="text-blue-700" /><span className="text-[10px] font-black uppercase tracking-[.08em] text-slate-400">{label}</span><span className="ml-auto text-xs font-black text-slate-800">{value}</span></div>
}

function InterventionTower() {
  const { bootstrap } = useRevenueOs()
  const checkIssues = bootstrap.systemChecks
    .filter((check) => check.status === 'attention' || check.status === 'degraded')
    .map((check) => ({
      key: check.key,
      title: check.label,
      detail: check.detail,
      action: check.action,
      severity: check.status === 'degraded' ? 'Critique' : 'Attention',
      tone: check.status === 'degraded' ? 'rose' as const : 'amber' as const,
    }))
  const operationalIssues = [
    ...(bootstrap.operations.counts.openContradictions ? [{ key: 'open-contradictions', title: 'Contradictions stratégiques ouvertes', detail: `${bootstrap.operations.counts.openContradictions} contradiction(s) persistée(s) exigent un arbitrage du Conseil.`, action: 'Ouvrir le Conseil de validation.', severity: 'Élevé', tone: 'amber' as const }] : []),
    ...(bootstrap.operations.counts.blockedTasks ? [{ key: 'blocked-tasks', title: 'Tâches de mission bloquées', detail: `${bootstrap.operations.counts.blockedTasks} tâche(s) compilée(s) sont actuellement bloquées.`, action: 'Ouvrir les missions compilées et identifier le gate concerné.', severity: 'Élevé', tone: 'amber' as const }] : []),
    ...bootstrap.operations.warnings.map((warning, index) => ({ key: `source-${index}`, title: 'Source opérationnelle partielle', detail: warning, action: 'Consulter le diagnostic de la source concernée.', severity: 'Attention', tone: 'amber' as const })),
  ]
  const issues = [...checkIssues, ...operationalIssues]
  const state = bootstrap.storageMode !== 'supabase' ? 'DEGRADED' : issues.length ? 'LIVE' : 'EMPTY'
  return <div className="min-h-screen bg-[#f7f8fa] px-4 py-7 sm:px-7 lg:px-10 xl:px-12">
    <section className="mx-auto max-w-[1740px]">
      <ExceptionsHero
        state={state}
        posture="Intervention contrôlée"
        authority="Diagnostic réel · aucune action externe implicite"
        summary={issues.length ? `${issues.length} point(s) d’attention réel(s) ont été détectés dans le périmètre actuellement lisible.` : 'Aucune exception ouverte n’est signalée par les contrôles et sources actuellement disponibles.'}
        freshness={new Date(bootstrap.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Points d’attention', value: issues.length, note: 'Contrôles et sources réels', tone: issues.length ? 'rose' : 'emerald' },
          { label: 'Contradictions', value: bootstrap.operations.counts.openContradictions, note: 'Dossiers stratégiques', tone: bootstrap.operations.counts.openContradictions ? 'amber' : 'emerald' },
          { label: 'Tâches bloquées', value: bootstrap.operations.counts.blockedTasks, note: 'Missions compilées', tone: bootstrap.operations.counts.blockedTasks ? 'amber' : 'emerald' },
          { label: 'Effets externes', value: 'Sur approbation', note: `Mode ${bootstrap.executionMode}`, tone: 'slate' },
        ]}
        actions={[]}
        warning={bootstrap.storageMode === 'foundation-fallback' ? 'SOURCE INDISPONIBLE — cette vue ne présente aucun scénario fictif; rétablissez la source avant toute décision.' : undefined}
      />

      {issues.length ? <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.07)]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-rose-700">Registre d’intervention réel</p><h2 className="mt-2 text-2xl font-black text-slate-950">Anomalies, blocages et sources partielles</h2></div><SIcon icon={Radar} tone="rose" /></div><div className="mt-6 space-y-3">{issues.map((item) => <article key={item.key} className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 md:grid-cols-[auto_1fr] md:items-start"><SIcon icon={item.tone === 'rose' ? AlertOctagon : ShieldAlert} tone={item.tone} /><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black text-slate-950">{item.title}</h3><SChip tone={item.tone}>{item.severity}</SChip></div><p className="mt-2 text-xs leading-5 text-slate-600">{item.detail}</p>{item.action ? <p className="mt-3 text-[10px] font-black uppercase tracking-[.1em] text-blue-700">Action recommandée · {item.action}</p> : null}</div></article>)}</div></section>
        <aside className="rounded-[34px] border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,.2)]"><SIcon icon={ShieldCheck} tone="emerald" /><p className="mt-6 text-[10px] font-black uppercase tracking-[.18em] text-blue-300">Doctrine de récupération</p><h2 className="mt-2 text-2xl font-black">Aucune récupération fictive</h2><p className="mt-3 text-sm leading-6 text-slate-300">Chaque point affiché provient d’un contrôle, d’une contradiction, d’une tâche bloquée ou d’un diagnostic de source persistant. Une action n’est proposée que lorsqu’un workflow réel existe.</p><div className="mt-6 space-y-3"><PolicyFact label="Runtime" value={bootstrap.moduleVersion} /><PolicyFact label="Mode" value={bootstrap.executionMode} /><PolicyFact label="Tenant" value={bootstrap.operations.tenantId} /><PolicyFact label="Dernière lecture" value={new Date(bootstrap.operations.generatedAt).toLocaleString('fr-FR')} /></div></aside>
      </div> : <div className="mt-7"><SEmpty title="Aucune exception réelle détectée" description="Les contrôles système, les sources opérationnelles, les contradictions et les tâches compilées ne remontent actuellement aucun blocage dans le périmètre autorisé." /></div>}
    </section>
  </div>
}

function ExceptionBay({ title, icon: Icon, tone, rows }: { title: string; icon: typeof Route; tone: 'amber' | 'rose'; rows: string[] }) { return <section className={`rounded-[30px] border p-5 ${tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-rose-200 bg-rose-50'}`}><SIcon icon={Icon} tone={tone} /><h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3><div className="mt-4 space-y-2">{rows.map((row) => <div key={row} className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-slate-700"><CircleDollarSign size={13} className={tone === 'amber' ? 'text-amber-600' : 'text-rose-600'} />{row}</div>)}</div></section> }
function InterventionFact({ label, value }: { label: string; value: string }) { return <div className="border-b border-slate-100 pb-3"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-slate-800">{value}</p></div> }

function ForensicLedger() {
  const { bootstrap } = useRevenueOs()
  const events = bootstrap.auditEvents
  return <div className="min-h-screen bg-[#f5f7fa] px-4 py-7 sm:px-7 lg:px-10 xl:px-12">
    <section className="mx-auto max-w-[1740px]">
      <AuditHero
        state={bootstrap.storageMode === 'supabase' ? (events.length ? 'LIVE' : 'EMPTY') : 'PREVIEW'}
        posture="Traçabilité immuable"
        authority="Lecture audit · autorité conservée"
        summary={events[0]?.summary || 'Aucun événement n’est disponible dans la fenêtre et le périmètre d’autorisation actuels.'}
        freshness={events[0]?.createdAt ? new Date(events[0].createdAt).toLocaleString('fr-FR') : new Date(bootstrap.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Événements visibles', value: events.length, note: bootstrap.storageMode === 'supabase' ? 'Fenêtre courante' : 'Fondation contractuelle', tone: 'blue' },
          { label: 'Événements critiques', value: events.filter((event) => event.outcome === 'failure' || event.outcome === 'blocked').length, note: 'Échecs et blocages', tone: 'rose' },
          { label: 'Chaîne causale', value: events.length ? 'Disponible' : '—', note: 'Trace consultable', tone: 'emerald' },
          { label: 'Dernière preuve', value: events[0]?.eventId || '—', note: events[0]?.actor || 'Indisponible', tone: 'slate' },
        ]}
        actions={[]}
        warning={bootstrap.storageMode === 'foundation-fallback' ? 'PREVIEW — les événements proviennent de la fondation contractuelle et ne sont pas étiquetés LIVE.' : undefined}
      />

      <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="relative rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.07)] sm:p-8">
          <div className="absolute bottom-8 left-[45px] top-8 w-px bg-gradient-to-b from-blue-500 via-slate-300 to-transparent" />
          <div className="space-y-4">{events.map((event, index) => <article key={event.id} className="relative pl-12"><span className={`absolute left-0 top-4 grid h-7 w-7 place-items-center rounded-full border-4 border-white shadow ${index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{index === 0 ? <Activity size={12} /> : <span className="h-2 w-2 rounded-full bg-slate-500" />}</span><div className={`w-full rounded-[24px] border p-5 text-left ${index === 0 ? 'border-blue-200 bg-blue-50/60 shadow-[0_12px_30px_rgba(37,99,235,.08)]' : 'border-slate-200 bg-white'}`}><div className="grid gap-4 md:grid-cols-[130px_1fr_auto] md:items-center"><div><p className="font-mono text-[10px] font-bold text-slate-500">{event.eventId}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(event.createdAt).toLocaleString('fr-FR')}</p></div><div><p className="text-sm font-black text-slate-950">{event.action}</p><p className="mt-1 text-xs text-slate-500">{event.actor} · {event.resourceType}</p></div><SChip tone={event.outcome === 'success' ? 'emerald' : 'amber'}>{event.outcome}</SChip></div></div></article>)}</div>
          {!events.length ? <SEmpty title="Aucun événement dans cette fenêtre" description="Le ledger est disponible, mais aucun événement ne correspond à la période ou aux permissions actives." /> : null}
        </div>
        <aside className="sticky top-6 self-start rounded-[34px] border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,.2)]"><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-300">Causal investigation</p><h2 className="mt-3 text-2xl font-black">Chaîne complète de l’événement</h2><div className="mt-7 space-y-1">{['Événement persisté', 'Acteur identifié', 'Ressource enregistrée', 'Résultat enregistré'].map((step, index) => <div key={step} className="flex gap-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-black ${events.length ? 'bg-emerald-400 text-emerald-950' : 'bg-white/10 text-slate-400'}`}>{index + 1}</span><div className="flex-1 border-b border-white/10 py-2.5"><p className="text-sm font-bold">{step}</p><p className="mt-1 font-mono text-[9px] text-slate-400">trace.segment.{index + 1}</p></div></div>)}</div><div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Trace sélectionnée</p><p className="mt-2 break-all font-mono text-xs text-blue-200">{events[0]?.eventId || 'Aucune trace sélectionnée'}</p></div></aside>
      </div>
    </section>
  </div>
}

function GovernanceConstitution() {
  const { bootstrap } = useRevenueOs()
  const chapters = [
    { number: 'I', title: 'Posture du runtime', summary: `Mode ${bootstrap.executionMode}`, icon: Command, tone: 'blue' as const },
    { number: 'II', title: 'Autorité & permissions', summary: 'Least privilege · rôles canoniques', icon: ShieldCheck, tone: 'emerald' as const },
    { number: 'III', title: 'Actions externes', summary: 'Canaux autorisés · approbation obligatoire', icon: FileLock2, tone: 'rose' as const },
    { number: 'IV', title: 'Confiance des données', summary: bootstrap.storageMode === 'supabase' ? 'Sources live' : 'Fondation contractuelle', icon: Fingerprint, tone: 'violet' as const },
    { number: 'V', title: 'Gouvernance des commandes', summary: '3 000 commandes canoniques', icon: Sparkles, tone: 'blue' as const },
    { number: 'VI', title: 'Kill switches', summary: 'Global · tenant · adapter · action', icon: AlertOctagon, tone: 'rose' as const },
    { number: 'VII', title: 'Environnements', summary: bootstrap.environment, icon: Layers3, tone: 'amber' as const },
    { number: 'VIII', title: 'Compatibilité runtime', summary: bootstrap.moduleVersion, icon: GitBranch, tone: 'slate' as const },
  ]
  return <div className="min-h-screen bg-[#f7f6f3] px-4 py-7 sm:px-7 lg:px-10 xl:px-12">
    <section className="mx-auto max-w-[1540px]">
      <SettingsHero
        state={bootstrap.storageMode === 'supabase' ? 'LIVE' : 'PREVIEW'}
        posture={`Constitution ${bootstrap.contractVersion}`}
        authority="Configuration protégée · least privilege"
        summary={`Le runtime ${bootstrap.moduleVersion} applique ${bootstrap.counters.enabledFeatureFlags} capacité(s) active(s), ${bootstrap.counters.lockedContractItems} élément(s) contractuellement protégés et une exécution externe strictement gouvernée par canal et approbation.`}
        freshness={new Date(bootstrap.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Contrat actif', value: bootstrap.contractVersion, note: bootstrap.releaseCode, tone: 'navy' },
          { label: 'Safety gates', value: bootstrap.counters.lockedContractItems, note: 'Éléments protégés', tone: 'rose' },
          { label: 'Compatibilité', value: bootstrap.moduleVersion, note: bootstrap.environment, tone: 'blue' },
          { label: 'Switches actifs', value: bootstrap.counters.enabledFeatureFlags, note: `${bootstrap.featureFlags.length} déclarés`, tone: 'emerald' },
        ]}
        actions={[{ label: 'Configuration protégée', disabled: true, reason: 'Les changements structurels exigent un workflow de gouvernance existant. Seul WhatsApp est contrôlable depuis la section Canaux ci-dessous.' }]}
        warning={bootstrap.storageMode === 'foundation-fallback' ? 'PREVIEW — posture fondation contractuelle; aucune configuration persistée n’est modifiée depuis ce hero.' : undefined}
      />

      <div className="mt-10 rounded-[40px] border border-stone-300 bg-[#fffefa] p-6 shadow-[0_30px_90px_rgba(41,37,36,.1)] sm:p-9"><div className="flex items-center justify-between border-b-2 border-slate-950 pb-5"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-blue-700">ANGELCARE Revenue Command OS</p><h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Constitution de gouvernance opérationnelle</h2></div><SIcon icon={BookOpenCheck} tone="navy" /></div>
        <div className="mt-7 grid gap-5 md:grid-cols-2">{chapters.map((chapter) => <article key={chapter.number} className="group relative overflow-hidden rounded-[28px] border border-stone-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(15,23,42,.07)]"><span className="absolute right-4 top-2 font-serif text-6xl font-black text-slate-50">{chapter.number}</span><div className="relative flex items-start gap-4"><SIcon icon={chapter.icon} tone={chapter.tone} /><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Chapitre {chapter.number}</p><h3 className="mt-1 text-lg font-black text-slate-950">{chapter.title}</h3><p className="mt-2 text-xs leading-5 text-slate-600">{chapter.summary}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-[9px] font-black uppercase tracking-[.1em] text-emerald-700">En vigueur</span><span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[.1em] text-slate-400">Résumé visible <BadgeCheck size={13} /></span></div></div></div></article>)}</div>
      </div>

      <ChannelGovernancePanel initialPolicies={bootstrap.operations.channels} />

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_380px]"><section className="rounded-[34px] border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-700">Feature flag articles</p><h2 className="mt-2 text-xl font-black text-slate-950">Capacités gouvernées</h2></div><SChip tone="emerald">{bootstrap.counters.enabledFeatureFlags} actives</SChip></div><div className="mt-5 grid gap-3 md:grid-cols-2">{bootstrap.featureFlags.map((flag) => <div key={flag.key} className="rounded-[22px] border border-slate-200 p-4"><div className="flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${flag.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} /><p className="min-w-0 flex-1 truncate text-xs font-black text-slate-900">{flag.label}</p>{flag.locked ? <FileLock2 size={14} className="text-amber-600" /> : null}</div><p className="mt-2 text-[10px] leading-4 text-slate-500">{flag.description}</p></div>)}</div></section><aside className="rounded-[34px] bg-slate-950 p-6 text-white"><SIcon icon={ShieldCheck} tone="emerald" /><h2 className="mt-5 text-2xl font-black">Contrat actif</h2><p className="mt-3 text-sm leading-6 text-slate-300">{bootstrap.contractVersion}</p><div className="mt-6 space-y-3"><PolicyFact label="Release" value={bootstrap.releaseCode} /><PolicyFact label="Environment" value={bootstrap.environment} /><PolicyFact label="Mode" value={bootstrap.executionMode} /><PolicyFact label="Storage" value={bootstrap.storageMode} /></div></aside></div>
    </section>
  </div>
}
function PolicyFact({ label, value }: { label: string; value: string }) { return <div className="border-b border-white/10 pb-3"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-1 break-words text-xs font-bold text-white">{value}</p></div> }

function UnsupportedWorkspace({ workspaceKey }: { workspaceKey: RevenueOsWorkspaceKey }) {
  return <div className="min-h-screen px-6 py-10"><SEmpty title="Expérience souveraine indisponible" description={`Le workspace ${workspaceKey} possède une route dédiée ou n'est pas enregistré dans ce renderer visuel.`} mode="unavailable" action={<Link href="/revenue-command-os/cockpit" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white">Retour au cockpit <ArrowRight size={15} /></Link>} /></div>
}
