'use client'

import { useEffect, useState } from 'react'
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
import CanonicalCsvImportDock from './imports/CanonicalCsvImportDock'
import { AuditHero, ExceptionsHero, MissionsHero, ObjectivesHero, ProgramsHero, SettingsHero } from './hero-sovereignty/heroes'
import LiveEntityActions from './live-operations/LiveEntityActions'
import CreateExceptionButton from './live-operations/CreateExceptionButton'
import FeatureFlagControl from './live-operations/FeatureFlagControl'
import ObjectivePortfolioWorkspace from './operational-depth/ObjectivePortfolioWorkspace'
import ProgramsPortfolioWorkspace from './operational-depth/ProgramsPortfolioWorkspace'
import MissionsOperationsWorkspace from './operational-depth/MissionsOperationsWorkspace'
import ExceptionsRecoveryWorkspace from './operational-depth/ExceptionsRecoveryWorkspace'

export default function RevenueOsWorkspacePage({ workspaceKey }: { workspaceKey: RevenueOsWorkspaceKey }) {
  switch (workspaceKey) {
    case 'revenue-objectives': return <div data-revenue-workspace="revenue-objectives"><ObjectivePortfolioWorkspace /></div>
    case 'active-programs': return <div data-revenue-workspace="active-programs"><ProgramsPortfolioWorkspace /></div>
    case 'compiled-missions': return <div data-revenue-workspace="compiled-missions"><MissionsOperationsWorkspace /></div>
    case 'approvals': return <div data-revenue-workspace="approvals"><ApprovalCenterWorkspace /></div>
    case 'exceptions': return <div data-revenue-workspace="exceptions"><ExceptionsRecoveryWorkspace /></div>
    case 'audit': return <div data-revenue-workspace="audit"><ForensicLedger /></div>
    case 'settings': return <div data-revenue-workspace="settings"><GovernanceConstitution /></div>
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
        authority="Autorité opérateur complète · exécution live"
        summary={objectives[0]?.mandate || 'Aucun mandat revenu actif. Créez ou importez un objectif puis lancez immédiatement l’intelligence Revenue OS.'}
        freshness={new Date(bootstrap.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Mandats actifs', value: objectives.filter((objective) => objective.status === 'active').length, note: `${objectives.length} au total`, tone: 'blue' },
          { label: 'Priorité', value: objectives[0]?.priority || 'Non calculé', note: objectives[0]?.title || 'Aucun mandat', tone: 'rose' },
          { label: 'Horizon', value: objectives[0]?.horizon || '—', note: objectives[0]?.targetMarket || 'Indisponible', tone: 'cyan' },
          { label: 'Préparation', value: objectives.length ? 'Prêt à exécuter' : 'À créer', note: `Mode ${bootstrap.executionMode}`, tone: objectives.length ? 'emerald' : 'amber' },
        ]}
        actions={[{ label: objectives.length ? 'Composer un mandat' : 'Créer le premier mandat', onClick: () => window.dispatchEvent(new CustomEvent('revenue-os:open-objective')), kind: 'primary' }]}
        warning={bootstrap.storageMode === 'foundation-fallback' ? 'PREVIEW — les objectifs affichés proviennent de la fondation contractuelle, pas d’une source persistée live.' : undefined}
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        {horizonOrder.map((horizon, index) => {
          const count = objectives.filter((objective) => objective.horizon.toLowerCase().includes(horizon.split(' ')[0].toLowerCase())).length
          return <div key={horizon} className={`rounded-[24px] border p-4 ${index === 0 ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white/80'}`}><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Horizon {String(index + 1).padStart(2, '0')}</p><div className="mt-2 flex items-end justify-between"><h3 className="text-sm font-black text-slate-900">{horizon}</h3><span className="text-2xl font-black text-slate-950">{count}</span></div><div className="mt-3 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(8, Math.min(100, count * 28))}%` }} /></div></div>
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
            <LiveEntityActions entityType="objective" entityId={objective.id} compact /><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><SChip tone="emerald">LIVE</SChip><span className="inline-flex items-center gap-1 text-xs font-black text-slate-500">Contrôle opérateur complet <BadgeCheck size={14} /></span></div>
          </article>)}
        </div>
      </div>

      {!objectives.length ? <SEmpty title="Aucun mandat revenu" description="Créez ou importez un mandat; il devient immédiatement exploitable dans la chaîne Revenue OS." action={<button onClick={() => window.dispatchEvent(new CustomEvent('revenue-os:open-objective'))} className="rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white">Créer le premier mandat</button>} /> : null}
    </section>
  </div>
}

function MandateFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase tracking-[.1em] text-slate-500">{label}</p><p className="mt-1 truncate font-bold text-slate-800">{value || '—'}</p></div>
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
        authority="Compilation live · activation directe par l’opérateur"
        summary={programs[0]
          ? `${programs[0].code} · ${programs[0].objective}`
          : objective ? `Le mandat ${objective.code} est disponible, mais aucun programme compilé n’a encore été publié.` : 'Aucun programme ni mandat source n’est disponible pour ce tenant.'}
        freshness={new Date(bootstrap.operations.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Programmes persistés', value: bootstrap.operations.counts.programs, note: `${bootstrap.operations.counts.activePrograms} actif(s)`, tone: 'emerald' },
          { label: 'Campagnes', value: programs.reduce((total, item) => total + item.campaigns, 0), note: 'Reliées aux programmes', tone: 'blue' },
          { label: 'Missions', value: programs.reduce((total, item) => total + item.missions, 0), note: `${bootstrap.operations.counts.blockedTasks} tâche(s) bloquée(s)`, tone: bootstrap.operations.counts.blockedTasks ? 'amber' : 'violet' },
          { label: 'Mode opératoire', value: 'LIVE', note: 'Exécution directe', tone: 'emerald' },
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
            <div className="mb-20"><LiveEntityActions entityType="program" entityId={program.id} compact /></div><div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-500 shadow-sm"><span>{program.tasksOpen} tâche(s) ouverte(s) · {program.tasksBlocked} bloquée(s)</span><BadgeCheck size={16} className={program.tasksBlocked ? 'text-amber-600' : 'text-emerald-600'} /></div>
          </article>)}
        </div>
      </div> : <SEmpty title="Aucun programme compilé" description="Aucun programme persistant. Compilez une stratégie puis activez directement le programme créé." action={<Link href="/revenue-command-os/mission-compiler" className="rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white">Ouvrir le compilateur</Link>} />}
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
        authority="Affectation, exécution et résultats directs"
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
              <div className="p-7 pl-9"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-500">Mission Binder</p><p className="mt-1 font-mono text-xs font-bold text-blue-700">{mission.code}</p></div><SChip tone={mission.blockedTasks ? 'amber' : ['ready','active','compiled','in_progress'].includes(mission.status) ? 'emerald' : 'violet'}>{mission.status}</SChip></div>
              <h2 className="mt-8 text-2xl font-black tracking-tight text-slate-950">{mission.title}</h2><p className="mt-3 min-h-24 text-sm leading-6 text-slate-600">{mission.purpose}</p>
              <div className="mt-8 space-y-3"><BinderLine icon={Workflow} label="Stratégie" value={mission.strategyId ? mission.strategyId.slice(0, 12) : '—'} /><BinderLine icon={Layers3} label="Programme" value={mission.programId ? mission.programId.slice(0, 12) : '—'} /><BinderLine icon={UsersRound} label="Owner" value={mission.owner} /><BinderLine icon={ListChecks} label="Tâches" value={`${mission.completedTasks}/${mission.taskCount}`} /><BinderLine icon={FileCheck2} label="Preuves" value={String(mission.evidenceCount)} /></div>
              <div className="mt-8"><div className="flex justify-between text-[10px] font-black uppercase tracking-[.1em] text-slate-500"><span>Progression d’exécution</span><span>{completion}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-950" style={{ width: `${completion}%` }} /></div></div>
              <LiveEntityActions entityType="mission" entityId={mission.id} compact /><div className="mt-8 flex w-full items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white"><span>{mission.nextAction || 'Dossier compilé et traçable'}</span><BadgeCheck size={16} /></div></div>
            </article>
          })}
        </div>
        <aside className="rounded-[34px] border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,.2)]"><SIcon icon={GitBranch} tone="blue" /><p className="mt-6 text-[10px] font-black uppercase tracking-[.18em] text-blue-300">Chaîne de compilation</p><h2 className="mt-2 text-3xl font-black tracking-tight">Stratégie → Mission → Preuve → Résultat</h2><div className="mt-8 space-y-1">{['Stratégie sélectionnée', 'Plan de compilation', 'Programme', 'Campagne', 'Wave', 'Mission', 'Tâches', 'Étapes', 'Preuves', 'Escalades'].map((step, index) => <div key={step} className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-full text-[10px] font-black ${missions.length && index < 6 ? 'bg-emerald-400 text-emerald-950' : 'bg-white/10 text-slate-300'}`}>{index + 1}</span><span className={`flex-1 border-b py-4 text-sm font-bold ${missions.length && index < 6 ? 'border-emerald-400/20 text-white' : 'border-white/10 text-slate-500'}`}>{step}</span></div>)}</div></aside>
      </div> : <SEmpty title="Aucune mission compilée" description="La source est accessible et ne contient aucune mission. Compilez une stratégie pour créer immédiatement les missions et leurs tâches exécutables." action={<Link href="/revenue-command-os/mission-compiler" className="rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white">Ouvrir le compilateur</Link>} />}
    </section>
  </div>
}

function BinderLine({ icon: Icon, label, value }: { icon: typeof Workflow; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5"><Icon size={15} className="text-blue-700" /><span className="text-[10px] font-black uppercase tracking-[.08em] text-slate-500">{label}</span><span className="ml-auto text-xs font-black text-slate-800">{value}</span></div>
}

type PersistedException = { id:string; code?:string; title?:string; severity?:string; status?:string; owner_id?:string; due_at?:string; revenue_impact_dh?:number; payload?:Record<string,unknown>; updated_at?:string }
function InterventionTower() {
  const { bootstrap } = useRevenueOs()
  const [persisted, setPersisted] = useState<PersistedException[]>([])
  const [persistedError, setPersistedError] = useState('')
  useEffect(() => { void (async () => { try { const response = await fetch('/api/revenue-command-os/live-operations?entityType=exception&limit=150', { cache: 'no-store' }); const body = await response.json(); if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'Chargement impossible'); setPersisted(body.data?.rows || []) } catch (error) { setPersistedError(error instanceof Error ? error.message : String(error)) } })() }, [])
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
    ...(bootstrap.operations.counts.openContradictions ? [{ key: 'open-contradictions', title: 'Contradictions stratégiques ouvertes', detail: `${bootstrap.operations.counts.openContradictions} contradiction(s) persistée(s) sont disponibles comme conseils; elles ne bloquent pas l’exécution.`, action: 'Consulter le Conseil ou continuer directement.', severity: 'Élevé', tone: 'amber' as const }] : []),
    ...(bootstrap.operations.counts.blockedTasks ? [{ key: 'blocked-tasks', title: 'Tâches de mission bloquées', detail: `${bootstrap.operations.counts.blockedTasks} tâche(s) compilée(s) sont actuellement bloquées.`, action: 'Ouvrir les missions compilées et identifier la cause technique.', severity: 'Élevé', tone: 'amber' as const }] : []),
    ...bootstrap.operations.warnings.map((warning, index) => ({ key: `source-${index}`, title: 'Source opérationnelle partielle', detail: warning, action: 'Consulter le diagnostic de la source concernée.', severity: 'Attention', tone: 'amber' as const })),
  ]
  const issues = [...checkIssues, ...operationalIssues]
  const state = bootstrap.storageMode !== 'supabase' ? 'DEGRADED' : issues.length ? 'LIVE' : 'EMPTY'
  return <div className="min-h-screen bg-[#f7f8fa] px-4 py-7 sm:px-7 lg:px-10 xl:px-12">
    <section className="mx-auto max-w-[1740px]">
      <ExceptionsHero
        state={state}
        posture="Remédiation directe"
        authority="Diagnostic réel · aucune action externe implicite"
        summary={issues.length ? `${issues.length} point(s) d’attention réel(s) ont été détectés dans le périmètre actuellement lisible.` : 'Aucune exception ouverte n’est signalée par les contrôles et sources actuellement disponibles.'}
        freshness={new Date(bootstrap.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Points d’attention', value: issues.length, note: 'Contrôles et sources réels', tone: issues.length ? 'rose' : 'emerald' },
          { label: 'Contradictions', value: bootstrap.operations.counts.openContradictions, note: 'Dossiers stratégiques', tone: bootstrap.operations.counts.openContradictions ? 'amber' : 'emerald' },
          { label: 'Tâches bloquées', value: bootstrap.operations.counts.blockedTasks, note: 'Missions compilées', tone: bootstrap.operations.counts.blockedTasks ? 'amber' : 'emerald' },
          { label: 'Dossiers actifs', value: persisted.filter((item) => !['closed','archived','cancelled'].includes(String(item.status))).length, note: 'Remédiations persistées', tone: 'blue' },
        ]}
        actions={[]}
        warning={bootstrap.storageMode === 'foundation-fallback' ? 'SOURCE INDISPONIBLE — cette vue ne présente aucun scénario fictif; rétablissez la source avant toute décision.' : undefined}
      />

      {persistedError ? <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">Registre persistant indisponible: {persistedError}</div> : null}
      {persisted.length ? <section className="mt-7 rounded-[34px] border border-blue-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.07)]"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-700">Dossiers de remédiation</p><h2 className="mt-2 text-2xl font-black text-slate-950">Exceptions persistées et directement actionnables</h2></div><SChip tone="blue">{persisted.length} dossier(s)</SChip></div><div className="mt-6 grid gap-4 xl:grid-cols-2">{persisted.map((item) => { const payload = item.payload || {}; return <article key={item.id} className="rounded-[26px] border border-slate-200 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-black text-blue-700">{item.code || item.id}</p><h3 className="mt-2 text-base font-black text-slate-950">{item.title || String(payload.title || 'Exception Revenue OS')}</h3></div><SChip tone={['closed','completed'].includes(String(item.status)) ? 'emerald' : String(item.severity).toLowerCase().includes('crit') || item.severity === 'critical' ? 'rose' : 'amber'}>{item.status || 'active'}</SChip></div><p className="mt-3 text-xs leading-5 text-slate-600">{String(payload.description || payload.detail || 'Dossier de remédiation opérationnelle.')}</p><div className="mt-4 grid gap-2 sm:grid-cols-3"><InterventionFact label="Sévérité" value={item.severity || 'high'} /><InterventionFact label="Impact" value={`${Number(item.revenue_impact_dh || 0).toLocaleString('fr-FR')} Dh`} /><InterventionFact label="Échéance" value={item.due_at ? new Date(item.due_at).toLocaleDateString('fr-FR') : 'À définir'} /></div><LiveEntityActions entityType="exception" entityId={item.id} compact /></article> })}</div></section> : null}
      {issues.length ? <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.07)]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-rose-700">Registre d’intervention réel</p><h2 className="mt-2 text-2xl font-black text-slate-950">Anomalies, blocages et sources partielles</h2></div><SIcon icon={Radar} tone="rose" /></div><div className="mt-6 space-y-3">{issues.map((item) => <article key={item.key} className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 md:grid-cols-[auto_1fr] md:items-start"><SIcon icon={item.tone === 'rose' ? AlertOctagon : ShieldAlert} tone={item.tone} /><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black text-slate-950">{item.title}</h3><SChip tone={item.tone}>{item.severity}</SChip></div><p className="mt-2 text-xs leading-5 text-slate-600">{item.detail}</p>{item.action ? <p className="mt-3 text-[10px] font-black uppercase tracking-[.1em] text-blue-700">Action directe · {item.action}</p> : null}<CreateExceptionButton title={item.title} detail={item.detail} severity={item.severity} sourceId={item.key} /></div></article>)}</div></section>
        <aside className="rounded-[34px] border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,.2)]"><SIcon icon={ShieldCheck} tone="emerald" /><p className="mt-6 text-[10px] font-black uppercase tracking-[.18em] text-blue-300">Doctrine de récupération</p><h2 className="mt-2 text-2xl font-black">Aucune récupération fictive</h2><p className="mt-3 text-sm leading-6 text-slate-300">Chaque point affiché provient d’un contrôle, d’une contradiction, d’une tâche bloquée ou d’un diagnostic de source persistant. Une action n’est proposée que lorsqu’un workflow réel existe.</p><div className="mt-6 space-y-3"><PolicyFact label="Runtime" value={bootstrap.moduleVersion} /><PolicyFact label="Mode" value={bootstrap.executionMode} /><PolicyFact label="Tenant" value={bootstrap.operations.tenantId} /><PolicyFact label="Dernière lecture" value={new Date(bootstrap.operations.generatedAt).toLocaleString('fr-FR')} /></div></aside>
      </div> : <div className="mt-7"><SEmpty title="Aucune exception réelle détectée" description="Les contrôles système, les sources opérationnelles, les contradictions et les tâches compilées ne remontent actuellement aucun blocage dans le périmètre autorisé." /></div>}
    </section>
  </div>
}

function ExceptionBay({ title, icon: Icon, tone, rows }: { title: string; icon: typeof Route; tone: 'amber' | 'rose'; rows: string[] }) { return <section className={`rounded-[30px] border p-5 ${tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-rose-200 bg-rose-50'}`}><SIcon icon={Icon} tone={tone} /><h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3><div className="mt-4 space-y-2">{rows.map((row) => <div key={row} className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-slate-700"><CircleDollarSign size={13} className={tone === 'amber' ? 'text-amber-600' : 'text-rose-600'} />{row}</div>)}</div></section> }
function InterventionFact({ label, value }: { label: string; value: string }) { return <div className="border-b border-slate-100 pb-3"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-slate-800">{value}</p></div> }

function ForensicLedger() {
  const { bootstrap } = useRevenueOs()
  const [query, setQuery] = useState('')
  const [outcome, setOutcome] = useState('all')
  const [selectedId, setSelectedId] = useState('')
  const events = bootstrap.auditEvents.filter((event) => {
    const haystack = `${event.eventId} ${event.action} ${event.actor} ${event.resourceType} ${event.resourceId || ''} ${event.summary || ''}`.toLowerCase()
    return (!query.trim() || haystack.includes(query.trim().toLowerCase())) && (outcome === 'all' || event.outcome === outcome)
  })
  const selected = events.find((event) => event.id === selectedId) || events[0]
  function exportLedger() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), filters: { query, outcome }, events }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `revenue-os-audit-${new Date().toISOString().slice(0,10)}.json`; anchor.click(); URL.revokeObjectURL(url)
  }
  return <div className="min-h-screen bg-[#f5f7fa] px-4 py-7 sm:px-7 lg:px-10 xl:px-12" data-revenue-workspace="audit">
    <section className="mx-auto max-w-[1740px]">
      <AuditHero
        state={bootstrap.storageMode === 'supabase' ? (events.length ? 'LIVE' : 'EMPTY') : 'PREVIEW'}
        posture="Traçabilité exploitable"
        authority="Recherche, investigation et export directs"
        summary={selected?.summary || 'Aucun événement ne correspond aux filtres actifs.'}
        freshness={selected?.createdAt ? new Date(selected.createdAt).toLocaleString('fr-FR') : new Date(bootstrap.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Événements visibles', value: events.length, note: `${bootstrap.auditEvents.length} dans la fenêtre`, tone: 'blue' },
          { label: 'Échecs', value: events.filter((event) => event.outcome === 'failure').length, note: 'À investiguer', tone: 'rose' },
          { label: 'Succès', value: events.filter((event) => event.outcome === 'success').length, note: 'Confirmations persistées', tone: 'emerald' },
          { label: 'Acteurs', value: new Set(events.map(event => event.actor)).size, note: 'Identités distinctes', tone: 'slate' },
        ]}
        actions={[]}
        warning={bootstrap.storageMode === 'foundation-fallback' ? 'La base opérationnelle est indisponible; les événements visibles proviennent de la fondation embarquée.' : undefined}
      />
      <section className="mt-7 rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-[1fr_220px_auto]"><label className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Recherche<input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Action, acteur, ressource, trace…" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"/></label><label className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Résultat<select value={outcome} onChange={event=>setOutcome(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-800"><option value="all">Tous</option><option value="success">Succès</option><option value="failure">Échecs</option><option value="accepted">Acceptés</option><option value="blocked">Bloqués techniques</option></select></label><button onClick={exportLedger} className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-xs font-black text-white"><ScrollText size={16}/>Exporter JSON</button></div></section>
      <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_470px]">
        <div className="relative rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.07)] sm:p-8"><div className="absolute bottom-8 left-[45px] top-8 w-px bg-gradient-to-b from-blue-500 via-slate-300 to-transparent"/><div className="space-y-4">{events.map((event,index)=><button type="button" onClick={()=>setSelectedId(event.id)} key={event.id} className="relative block w-full pl-12 text-left"><span className={`absolute left-0 top-4 grid h-7 w-7 place-items-center rounded-full border-4 border-white shadow ${selected?.id===event.id?'bg-blue-600 text-white':'bg-slate-200 text-slate-500'}`}>{index===0?<Activity size={12}/>:<span className="h-2 w-2 rounded-full bg-current"/>}</span><div className={`rounded-[24px] border p-5 transition ${selected?.id===event.id?'border-blue-300 bg-blue-50/70 shadow-[0_12px_30px_rgba(37,99,235,.08)]':'border-slate-200 bg-white hover:border-blue-200'}`}><div className="grid gap-4 md:grid-cols-[150px_1fr_auto] md:items-center"><div><p className="break-all font-mono text-[10px] font-bold text-slate-500">{event.eventId}</p><p className="mt-1 text-[10px] text-slate-500">{new Date(event.createdAt).toLocaleString('fr-FR')}</p></div><div><p className="text-sm font-black text-slate-950">{event.action}</p><p className="mt-1 text-xs text-slate-500">{event.actor} · {event.resourceType}{event.resourceId?`/${event.resourceId}`:''}</p></div><SChip tone={event.outcome==='success'?'emerald':event.outcome==='failure'?'rose':'amber'}>{event.outcome}</SChip></div></div></button>)}</div>{!events.length?<SEmpty title="Aucun événement correspondant" description="Modifiez la recherche ou le filtre de résultat."/>:null}</div>
        <aside className="sticky top-6 self-start rounded-[34px] border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,.2)]"><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-300">Investigation causale</p><h2 className="mt-3 text-2xl font-black">{selected?.action || 'Aucune trace sélectionnée'}</h2>{selected?<><p className="mt-3 text-sm leading-6 text-slate-300">{selected.summary || 'Événement persistant sans résumé supplémentaire.'}</p><div className="mt-7 space-y-3"><PolicyFact label="Event ID" value={selected.eventId}/><PolicyFact label="Acteur" value={selected.actor}/><PolicyFact label="Ressource" value={`${selected.resourceType}${selected.resourceId?`/${selected.resourceId}`:''}`}/><PolicyFact label="Résultat" value={selected.outcome}/><PolicyFact label="Horodatage" value={new Date(selected.createdAt).toLocaleString('fr-FR')}/></div><div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Métadonnées</p><pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-all text-[10px] leading-5 text-blue-100">{JSON.stringify(selected.metadata || {},null,2)}</pre></div></>:<p className="mt-4 text-sm text-slate-400">Sélectionnez un événement dans le ledger.</p>}</aside>
      </div>
    </section>
  </div>
}

function GovernanceConstitution() {
  const { bootstrap } = useRevenueOs()
  const chapters = [
    { number: 'I', title: 'Posture du runtime', summary: `Mode ${bootstrap.executionMode}`, icon: Command, tone: 'blue' as const },
    { number: 'II', title: 'Autorité & permissions', summary: 'Tous les utilisateurs authentifiés sont pleinement autorisés', icon: ShieldCheck, tone: 'emerald' as const },
    { number: 'III', title: 'Actions externes', summary: 'Email OS et WhatsApp selon leur configuration actuelle', icon: FileLock2, tone: 'rose' as const },
    { number: 'IV', title: 'Confiance des données', summary: bootstrap.storageMode === 'supabase' ? 'Sources live' : 'Fondation contractuelle', icon: Fingerprint, tone: 'violet' as const },
    { number: 'V', title: 'Commandes live', summary: '3 000 commandes canoniques', icon: Sparkles, tone: 'blue' as const },
    { number: 'VI', title: 'Contrôles opérateur', summary: 'Pause, reprise, annulation et restauration directes', icon: AlertOctagon, tone: 'rose' as const },
    { number: 'VII', title: 'Environnements', summary: bootstrap.environment, icon: Layers3, tone: 'amber' as const },
    { number: 'VIII', title: 'Compatibilité runtime', summary: bootstrap.moduleVersion, icon: GitBranch, tone: 'slate' as const },
  ]
  return <div className="min-h-screen bg-[#f7f6f3] px-4 py-7 sm:px-7 lg:px-10 xl:px-12">
    <section className="mx-auto max-w-[1540px]">
      <SettingsHero
        state={bootstrap.storageMode === 'supabase' ? 'LIVE' : 'PREVIEW'}
        posture={`Constitution ${bootstrap.contractVersion}`}
        authority="Configuration ouverte aux opérateurs authentifiés"
        summary={`Le runtime ${bootstrap.moduleVersion} active ${bootstrap.counters.enabledFeatureFlags} capacité(s) et expose une exécution directe, traçable et pilotée par l’utilisateur.`}
        freshness={new Date(bootstrap.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Contrat actif', value: bootstrap.contractVersion, note: bootstrap.releaseCode, tone: 'navy' },
          { label: 'Mode', value: 'LIVE', note: 'Aucun gate organisationnel', tone: 'emerald' },
          { label: 'Compatibilité', value: bootstrap.moduleVersion, note: bootstrap.environment, tone: 'blue' },
          { label: 'Switches actifs', value: bootstrap.counters.enabledFeatureFlags, note: `${bootstrap.featureFlags.length} déclarés`, tone: 'emerald' },
        ]}
        actions={[]}
        warning={bootstrap.storageMode === 'foundation-fallback' ? 'PREVIEW — posture fondation contractuelle; aucune configuration persistée n’est modifiée depuis ce hero.' : undefined}
      />

      <div className="mt-10 rounded-[40px] border border-stone-300 bg-[#fffefa] p-6 shadow-[0_30px_90px_rgba(41,37,36,.1)] sm:p-9"><div className="flex items-center justify-between border-b-2 border-slate-950 pb-5"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-blue-700">ANGELCARE Revenue Command OS</p><h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Configuration opérationnelle live</h2></div><SIcon icon={BookOpenCheck} tone="navy" /></div>
        <div className="mt-7 grid gap-5 md:grid-cols-2">{chapters.map((chapter) => <article key={chapter.number} className="group relative overflow-hidden rounded-[28px] border border-stone-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(15,23,42,.07)]"><span className="absolute right-4 top-2 font-serif text-6xl font-black text-slate-50">{chapter.number}</span><div className="relative flex items-start gap-4"><SIcon icon={chapter.icon} tone={chapter.tone} /><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Chapitre {chapter.number}</p><h3 className="mt-1 text-lg font-black text-slate-950">{chapter.title}</h3><p className="mt-2 text-xs leading-5 text-slate-600">{chapter.summary}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-[9px] font-black uppercase tracking-[.1em] text-emerald-700">En vigueur</span><span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[.1em] text-slate-500">Résumé visible <BadgeCheck size={13} /></span></div></div></div></article>)}</div>
      </div>

      <ChannelGovernancePanel initialPolicies={bootstrap.operations.channels} />

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_380px]"><section className="rounded-[34px] border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-700">Contrôle des capacités</p><h2 className="mt-2 text-xl font-black text-slate-950">Capacités opérationnelles</h2></div><SChip tone="emerald">{bootstrap.counters.enabledFeatureFlags} actives</SChip></div><div className="mt-5 grid gap-3 md:grid-cols-2">{bootstrap.featureFlags.map((flag) => <div key={flag.key} className="rounded-[22px] border border-slate-200 p-4"><div className="flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${flag.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} /><p className="min-w-0 flex-1 truncate text-xs font-black text-slate-900">{flag.label}</p><SChip tone={flag.enabled ? 'emerald' : 'slate'}>{flag.enabled ? 'ACTIVE' : 'INACTIVE'}</SChip></div><p className="mt-2 text-[10px] leading-4 text-slate-500">{flag.description}</p><FeatureFlagControl flagKey={flag.key} enabled={flag.enabled} /></div>)}</div></section><aside className="rounded-[34px] bg-slate-950 p-6 text-white"><SIcon icon={ShieldCheck} tone="emerald" /><h2 className="mt-5 text-2xl font-black">Contrat actif</h2><p className="mt-3 text-sm leading-6 text-slate-300">{bootstrap.contractVersion}</p><div className="mt-6 space-y-3"><PolicyFact label="Release" value={bootstrap.releaseCode} /><PolicyFact label="Environment" value={bootstrap.environment} /><PolicyFact label="Mode" value={bootstrap.executionMode} /><PolicyFact label="Storage" value={bootstrap.storageMode} /></div></aside></div>
    </section>
  </div>
}
function PolicyFact({ label, value }: { label: string; value: string }) { return <div className="border-b border-white/10 pb-3"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-1 break-words text-xs font-bold text-white">{value}</p></div> }

function UnsupportedWorkspace({ workspaceKey }: { workspaceKey: RevenueOsWorkspaceKey }) {
  return <div className="min-h-screen px-6 py-10"><SEmpty title="Expérience souveraine indisponible" description={`Le workspace ${workspaceKey} possède une route dédiée ou n'est pas enregistré dans ce renderer visuel.`} mode="unavailable" action={<Link href="/revenue-command-os/cockpit" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white">Retour au cockpit <ArrowRight size={15} /></Link>} /></div>
}
