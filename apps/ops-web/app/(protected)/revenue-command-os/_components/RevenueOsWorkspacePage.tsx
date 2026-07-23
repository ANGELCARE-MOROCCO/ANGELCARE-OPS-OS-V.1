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
  const regions = [
    { name: 'Capture B2B nationale', status: 'En conception', progress: 38, campaigns: 4, waves: 7, risk: 'Capacité commerciale', tone: 'blue' as const },
    { name: 'Croissance Home Service', status: 'Sous validation', progress: 61, campaigns: 3, waves: 5, risk: 'Saisonnalité', tone: 'emerald' as const },
    { name: 'Partenariats Academy', status: 'Shadow', progress: 24, campaigns: 2, waves: 3, risk: 'Preuves marché', tone: 'violet' as const },
  ]
  return <div className="min-h-screen overflow-hidden bg-[#f4f8f5] px-4 py-7 sm:px-7 lg:px-10 xl:px-12">
    <section className="mx-auto max-w-[1740px]">
      <ProgramsHero
        state="PREVIEW"
        posture="Portfolio contractuel"
        authority="Exécution externe verrouillée"
        summary={objective ? `Le mandat ${objective.code} fournit le contexte du portefeuille. Les territoires présentés sous le hero restent des compositions contractuelles jusqu’à publication de programmes persistés.` : 'Aucun mandat source disponible. Le portefeuille reste en attente de compilation et de publication persistée.'}
        freshness={new Date(bootstrap.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Mandat source', value: objective?.code || '—', note: objective?.title || 'Aucun objectif', tone: 'blue' },
          { label: 'Programmes live', value: 'Non calculé', note: 'Source persistée non exposée', tone: 'slate' },
          { label: 'Expansion', value: 'Indisponible', note: 'Compilation requise', tone: 'amber' },
          { label: 'Effets externes', value: 'Verrouillés', note: `Mode ${bootstrap.executionMode}`, tone: 'rose' },
        ]}
        actions={[{ label: 'Ouvrir la compilation', href: '/revenue-command-os/mission-compiler', kind: 'primary' }]}
        warning="PREVIEW — les cartes de programmes sous ce hero sont des représentations contractuelles et ne sont pas comptées comme données live."
      />

      <div className="relative mt-7 min-h-[660px] overflow-hidden rounded-[38px] border border-emerald-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.07)] sm:p-8">
        <div className={`absolute inset-0 opacity-55 ${sovereigntyStyles.dotField}`} />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1400 660" preserveAspectRatio="none"><path d="M140 530 C 310 380, 400 520, 580 330 S 920 230, 1110 360 S 1270 260, 1360 110" fill="none" stroke="rgba(16,185,129,.22)" strokeWidth="4" strokeDasharray="10 12" /></svg>
        <div className="relative flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.17em] text-emerald-700">Carte des opérations</p><h2 className="mt-2 text-2xl font-black text-slate-950">Portefeuille de programmes actifs</h2></div><SDataTruth mode={bootstrap.storageMode} /></div>
        <div className="relative mt-8 grid gap-6 lg:grid-cols-3">
          {regions.map((region, index) => <article key={region.name} className={`relative min-h-[440px] overflow-hidden rounded-[34px] border p-6 ${index === 0 ? 'border-blue-200 bg-gradient-to-b from-blue-50 to-white' : index === 1 ? 'border-emerald-200 bg-gradient-to-b from-emerald-50 to-white' : 'border-violet-200 bg-gradient-to-b from-violet-50 to-white'} ${index === 1 ? 'lg:mt-20' : index === 2 ? 'lg:mt-8' : ''}`}>
            <div className="flex items-start justify-between"><SIcon icon={index === 0 ? Radar : index === 1 ? Route : Orbit} tone={region.tone} /><SChip tone={region.tone}>{region.status}</SChip></div>
            <h3 className="mt-6 text-2xl font-black tracking-tight text-slate-950">{region.name}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">Programme relié au mandat {objective?.code || 'en attente'}, structuré en campagnes et vagues commerciales.</p>
            <div className="mt-6 grid grid-cols-2 gap-3"><MandateFact label="Campagnes" value={String(region.campaigns)} /><MandateFact label="Waves" value={String(region.waves)} /><MandateFact label="Progression" value={`${region.progress}%`} /><MandateFact label="Risque" value={region.risk} /></div>
            <div className="mt-6"><div className="flex justify-between text-[10px] font-black uppercase tracking-[.1em] text-slate-500"><span>Avancement terrain</span><span>{region.progress}%</span></div><div className="mt-2 h-2 rounded-full bg-white"><div className={`h-full rounded-full ${index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-emerald-500' : 'bg-violet-500'}`} style={{ width: `${region.progress}%` }} /></div></div>
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-500 shadow-sm"><span>Territoire en aperçu contractuel</span><BadgeCheck size={16} className="text-emerald-600" /></div>
          </article>)}
        </div>
      </div>
    </section>
  </div>
}

function MissionBinders() {
  const { bootstrap } = useRevenueOs()
  const binders = [
    { code: 'MIS-CAS-024', title: 'Dossier décideurs crèches privées', status: 'Prête', complexity: 84, tasks: 18, proof: 6, owner: 'Direction commerciale' },
    { code: 'MIS-RBT-011', title: 'Activation partenaires Rabat', status: 'Validation', complexity: 66, tasks: 12, proof: 4, owner: 'B2B Partnerships' },
    { code: 'MIS-HS-007', title: 'Conversion Home Service premium', status: 'Shadow', complexity: 48, tasks: 9, proof: 3, owner: 'Revenue Operations' },
  ]
  return <div className="min-h-screen bg-[#f7f5f1] px-4 py-7 sm:px-7 lg:px-10 xl:px-12">
    <section className="mx-auto max-w-[1740px]">
      <MissionsHero
        state="PREVIEW"
        posture="Archive contractuelle"
        authority="Dossiers non exécutables depuis cette vue"
        summary="Les classeurs ci-dessous illustrent l’organisation attendue des packages compilés. Aucun volume live n’est affirmé tant que la source de missions persistées n’est pas reliée à cette vue."
        freshness={new Date(bootstrap.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Missions actives', value: 'Non calculé', note: 'Source non exposée', tone: 'blue' },
          { label: 'Nouvelles compilations', value: 'Non calculé', note: 'Compilation requise', tone: 'violet' },
          { label: 'En validation', value: 'Non calculé', note: 'Source non exposée', tone: 'amber' },
          { label: 'Archivées', value: 'Non calculé', note: 'Source non exposée', tone: 'slate' },
        ]}
        actions={[{ label: 'Ouvrir le compilateur', href: '/revenue-command-os/mission-compiler', kind: 'primary' }]}
        warning="PREVIEW — aucun dossier illustratif n’est présenté comme une mission live."
      />

      <div className="mt-9 grid gap-6 xl:grid-cols-[1fr_410px]">
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {binders.map((binder, index) => <article key={binder.code} className="group relative min-h-[560px] overflow-hidden rounded-r-[34px] rounded-l-[12px] border border-slate-300 bg-white shadow-[12px_24px_70px_rgba(15,23,42,.1)] transition hover:-translate-y-1">
            <div className={`absolute inset-y-0 left-0 w-3 ${index === 0 ? 'bg-blue-700' : index === 1 ? 'bg-amber-500' : 'bg-violet-600'}`} />
            <div className="absolute inset-x-8 top-0 h-4 rounded-b-xl bg-slate-100" />
            <div className="p-7 pl-9"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Mission Binder</p><p className="mt-1 font-mono text-xs font-bold text-blue-700">{binder.code}</p></div><SChip tone={binder.status === 'Prête' ? 'emerald' : binder.status === 'Validation' ? 'amber' : 'violet'}>{binder.status}</SChip></div>
            <h2 className="mt-8 text-2xl font-black tracking-tight text-slate-950">{binder.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">Package déterministe contenant le plan de mission, les tâches, la preuve attendue, les garde-fous et le circuit de récupération.</p>
            <div className="mt-8 space-y-3"><BinderLine icon={Workflow} label="Stratégie source" value={`STR-${String(index + 11).padStart(3, '0')}`} /><BinderLine icon={Layers3} label="Programme" value={`Programme ${index + 1}`} /><BinderLine icon={UsersRound} label="Owner" value={binder.owner} /><BinderLine icon={ListChecks} label="Tâches" value={String(binder.tasks)} /><BinderLine icon={FileCheck2} label="Preuves" value={String(binder.proof)} /></div>
            <div className="mt-8"><div className="flex justify-between text-[10px] font-black uppercase tracking-[.1em] text-slate-500"><span>Complexité de compilation</span><span>{binder.complexity}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-950" style={{ width: `${binder.complexity}%` }} /></div></div>
            <div className="mt-8 flex w-full items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white"><span>Dossier visuel consolidé</span><BadgeCheck size={16} /></div></div>
          </article>)}
        </div>
        <aside className="rounded-[34px] border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,.2)]"><SIcon icon={GitBranch} tone="blue" /><p className="mt-6 text-[10px] font-black uppercase tracking-[.18em] text-blue-300">Chaîne de compilation</p><h2 className="mt-2 text-3xl font-black tracking-tight">Stratégie → Mission → Preuve → Résultat</h2><div className="mt-8 space-y-1">{['Stratégie approuvée', 'Plan de compilation', 'Programme', 'Campagne', 'Wave', 'Mission', 'Tâches', 'Étapes', 'Preuves', 'Escalades'].map((step, index) => <div key={step} className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-full text-[10px] font-black ${index < 4 ? 'bg-emerald-400 text-emerald-950' : 'bg-white/10 text-slate-300'}`}>{index + 1}</span><span className={`flex-1 border-b py-4 text-sm font-bold ${index < 4 ? 'border-emerald-400/20 text-white' : 'border-white/10 text-slate-400'}`}>{step}</span></div>)}</div></aside>
      </div>
    </section>
  </div>
}

function BinderLine({ icon: Icon, label, value }: { icon: typeof Workflow; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5"><Icon size={15} className="text-blue-700" /><span className="text-[10px] font-black uppercase tracking-[.08em] text-slate-400">{label}</span><span className="ml-auto text-xs font-black text-slate-800">{value}</span></div>
}

function InterventionTower() {
  const { bootstrap } = useRevenueOs()
  const lanes = [
    { title: 'Run campagne bloqué', severity: 'Critique', impact: '180 000 Dh exposés', timer: '01:42:18', route: 'Recovery route disponible', tone: 'rose' as const },
    { title: 'Contexte compte incomplet', severity: 'Élevé', impact: '12 comptes affectés', timer: '05:18:03', route: 'Enrichissement requis', tone: 'amber' as const },
    { title: 'Adapter Email en retry', severity: 'Moyen', impact: '7 actions différées', timer: '00:27:44', route: 'Retry automatique', tone: 'blue' as const },
  ]
  return <div className="min-h-screen bg-[#f7f8fa] px-4 py-7 sm:px-7 lg:px-10 xl:px-12">
    <section className="mx-auto max-w-[1740px]">
      <ExceptionsHero
        state={bootstrap.storageMode === 'supabase' ? (bootstrap.counters.openExceptions ? 'LIVE' : 'EMPTY') : 'PREVIEW'}
        posture="Intervention contrôlée"
        authority="Recovery interne · effets externes verrouillés"
        summary={bootstrap.counters.openExceptions ? `${bootstrap.counters.openExceptions} exception(s) ouverte(s) ont été détectées par les contrôles système disponibles.` : 'Aucune exception ouverte n’est signalée par la source actuellement disponible.'}
        freshness={new Date(bootstrap.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Exceptions ouvertes', value: bootstrap.storageMode === 'supabase' ? bootstrap.counters.openExceptions : '—', note: bootstrap.storageMode === 'supabase' ? 'Contrôles actifs' : 'Source contractuelle', tone: 'rose' },
          { label: 'Escalades critiques', value: 'Non calculé', note: 'Classification non exposée', tone: 'amber' },
          { label: 'Récupérables', value: 'Non calculé', note: 'Éligibilité backend requise', tone: 'blue' },
          { label: 'Effets externes', value: 'Bloqués', note: `Mode ${bootstrap.executionMode}`, tone: 'slate' },
        ]}
        actions={[{ label: 'Recovery indisponible ici', disabled: true, reason: 'Aucune action backend de récupération n’est exposée depuis cette vue.', kind: 'danger' }]}
        warning={bootstrap.storageMode === 'foundation-fallback' ? 'PREVIEW — les scénarios d’intervention sous ce hero sont contractuels et ne représentent pas des incidents live.' : 'Les exemples de voies d’intervention sous ce hero restent des compositions visuelles; seul le compteur système ci-dessus est présenté comme source live.'}
      />

      <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_390px]">
        <div className="space-y-5">
          <section className="rounded-[34px] border border-rose-200 bg-gradient-to-r from-rose-50 to-white p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-rose-700">Critical runway</p><h2 className="mt-2 text-2xl font-black text-slate-950">Interventions approchant leur seuil critique</h2></div><SIcon icon={Radar} tone="rose" /></div><div className="mt-6 space-y-3">{lanes.map((item, index) => <article key={item.title} className={`grid gap-4 rounded-[24px] border bg-white p-5 md:grid-cols-[auto_1fr_auto] md:items-center ${index === 0 ? 'border-rose-300 shadow-[0_16px_40px_rgba(225,29,72,.1)]' : 'border-slate-200'}`}><SIcon icon={index === 0 ? AlertOctagon : index === 1 ? ShieldAlert : TimerReset} tone={item.tone} /><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black text-slate-950">{item.title}</h3><SChip tone={item.tone}>{item.severity}</SChip></div><p className="mt-2 text-xs text-slate-500">{item.impact} · {item.route}</p></div><div className="text-right"><p className="font-mono text-lg font-black text-slate-950">{item.timer}</p><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[.1em] text-slate-400">Intervention via le dossier backend <ChevronRight size={13} /></span></div></article>)}</div></section>
          <div className="grid gap-5 lg:grid-cols-2"><ExceptionBay title="Recoverable field" icon={Route} tone="amber" rows={['Retry planifié', 'Fallback disponible', 'Owner assigné', 'SLA sous contrôle']} /><ExceptionBay title="Dead-letter chamber" icon={FileLock2} tone="rose" rows={['Échec permanent isolé', 'Cause racine requise', 'Intervention manuelle', 'Compensation à définir']} /></div>
        </div>
        <aside className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.07)]"><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-700">Intervention board</p><h2 className="mt-2 text-2xl font-black text-slate-950">Run campagne bloqué</h2><p className="mt-3 text-sm leading-6 text-slate-600">Une dépendance de contexte a empêché la génération d’un package conforme. Aucune action externe n’a été exécutée.</p><div className="mt-6 space-y-3"><InterventionFact label="Cause" value="Context snapshot incomplet" /><InterventionFact label="Impact" value="Wave Casablanca suspendue" /><InterventionFact label="Owner" value="Revenue Operations" /><InterventionFact label="Recovery" value="Rebuild du contexte puis retry" /><InterventionFact label="Escalade" value="Direction commerciale à T+4h" /></div><div className="mt-6 grid gap-2"><button type="button" disabled title="Action backend non exposée dans cet aperçu visuel" className="cursor-not-allowed rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white opacity-45">Récupération non disponible ici</button><button type="button" disabled title="Action backend non exposée dans cet aperçu visuel" className="cursor-not-allowed rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-black text-rose-700 opacity-50">Escalade non disponible ici</button></div><div className="mt-6 border-t border-slate-100 pt-5"><STraceLink traceId="trc_exc_9b3" label="Investigation" /></div></aside>
      </div>
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
        <aside className="sticky top-6 self-start rounded-[34px] border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,.2)]"><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-300">Causal investigation</p><h2 className="mt-3 text-2xl font-black">Chaîne complète de l’événement</h2><div className="mt-7 space-y-1">{['Requête reçue', 'Session résolue', 'Permission évaluée', 'Tenant lié', 'Lecture / écriture', 'Résultat produit', 'Événement audité'].map((step, index) => <div key={step} className="flex gap-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-black ${index < 6 ? 'bg-emerald-400 text-emerald-950' : 'bg-blue-500 text-white'}`}>{index + 1}</span><div className="flex-1 border-b border-white/10 py-2.5"><p className="text-sm font-bold">{step}</p><p className="mt-1 font-mono text-[9px] text-slate-400">trace.segment.{index + 1}</p></div></div>)}</div><div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Trace sélectionnée</p><p className="mt-2 font-mono text-xs text-blue-200">trc_rev_20260722_0701</p></div></aside>
      </div>
    </section>
  </div>
}

function GovernanceConstitution() {
  const { bootstrap } = useRevenueOs()
  const chapters = [
    { number: 'I', title: 'Posture du runtime', summary: `Mode ${bootstrap.executionMode}`, icon: Command, tone: 'blue' as const },
    { number: 'II', title: 'Autorité & permissions', summary: 'Least privilege · rôles canoniques', icon: ShieldCheck, tone: 'emerald' as const },
    { number: 'III', title: 'Actions externes', summary: 'Verrouillées par défaut', icon: FileLock2, tone: 'rose' as const },
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
        summary={`Le runtime ${bootstrap.moduleVersion} applique ${bootstrap.counters.enabledFeatureFlags} capacité(s) active(s), ${bootstrap.counters.lockedContractItems} élément(s) contractuellement protégés et des actions externes verrouillées par défaut.`}
        freshness={new Date(bootstrap.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Contrat actif', value: bootstrap.contractVersion, note: bootstrap.releaseCode, tone: 'navy' },
          { label: 'Safety gates', value: bootstrap.counters.lockedContractItems, note: 'Éléments protégés', tone: 'rose' },
          { label: 'Compatibilité', value: bootstrap.moduleVersion, note: bootstrap.environment, tone: 'blue' },
          { label: 'Switches actifs', value: bootstrap.counters.enabledFeatureFlags, note: `${bootstrap.featureFlags.length} déclarés`, tone: 'emerald' },
        ]}
        actions={[{ label: 'Configuration protégée', disabled: true, reason: 'Les changements de gouvernance exigent une autorité et un workflow existants; aucun nouveau workflow n’est ajouté par MZ22.' }]}
        warning={bootstrap.storageMode === 'foundation-fallback' ? 'PREVIEW — posture fondation contractuelle; aucune configuration persistée n’est modifiée depuis ce hero.' : undefined}
      />

      <div className="mt-10 rounded-[40px] border border-stone-300 bg-[#fffefa] p-6 shadow-[0_30px_90px_rgba(41,37,36,.1)] sm:p-9"><div className="flex items-center justify-between border-b-2 border-slate-950 pb-5"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-blue-700">ANGELCARE Revenue Command OS</p><h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Constitution de gouvernance opérationnelle</h2></div><SIcon icon={BookOpenCheck} tone="navy" /></div>
        <div className="mt-7 grid gap-5 md:grid-cols-2">{chapters.map((chapter) => <article key={chapter.number} className="group relative overflow-hidden rounded-[28px] border border-stone-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(15,23,42,.07)]"><span className="absolute right-4 top-2 font-serif text-6xl font-black text-slate-50">{chapter.number}</span><div className="relative flex items-start gap-4"><SIcon icon={chapter.icon} tone={chapter.tone} /><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Chapitre {chapter.number}</p><h3 className="mt-1 text-lg font-black text-slate-950">{chapter.title}</h3><p className="mt-2 text-xs leading-5 text-slate-600">{chapter.summary}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-[9px] font-black uppercase tracking-[.1em] text-emerald-700">En vigueur</span><span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[.1em] text-slate-400">Résumé visible <BadgeCheck size={13} /></span></div></div></div></article>)}</div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_380px]"><section className="rounded-[34px] border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-700">Feature flag articles</p><h2 className="mt-2 text-xl font-black text-slate-950">Capacités gouvernées</h2></div><SChip tone="emerald">{bootstrap.counters.enabledFeatureFlags} actives</SChip></div><div className="mt-5 grid gap-3 md:grid-cols-2">{bootstrap.featureFlags.map((flag) => <div key={flag.key} className="rounded-[22px] border border-slate-200 p-4"><div className="flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${flag.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} /><p className="min-w-0 flex-1 truncate text-xs font-black text-slate-900">{flag.label}</p>{flag.locked ? <FileLock2 size={14} className="text-amber-600" /> : null}</div><p className="mt-2 text-[10px] leading-4 text-slate-500">{flag.description}</p></div>)}</div></section><aside className="rounded-[34px] bg-slate-950 p-6 text-white"><SIcon icon={ShieldCheck} tone="emerald" /><h2 className="mt-5 text-2xl font-black">Contrat actif</h2><p className="mt-3 text-sm leading-6 text-slate-300">{bootstrap.contractVersion}</p><div className="mt-6 space-y-3"><PolicyFact label="Release" value={bootstrap.releaseCode} /><PolicyFact label="Environment" value={bootstrap.environment} /><PolicyFact label="Mode" value={bootstrap.executionMode} /><PolicyFact label="Storage" value={bootstrap.storageMode} /></div></aside></div>
    </section>
  </div>
}
function PolicyFact({ label, value }: { label: string; value: string }) { return <div className="border-b border-white/10 pb-3"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-1 break-words text-xs font-bold text-white">{value}</p></div> }

function UnsupportedWorkspace({ workspaceKey }: { workspaceKey: RevenueOsWorkspaceKey }) {
  return <div className="min-h-screen px-6 py-10"><SEmpty title="Expérience souveraine indisponible" description={`Le workspace ${workspaceKey} possède une route dédiée ou n'est pas enregistré dans ce renderer visuel.`} mode="unavailable" action={<Link href="/revenue-command-os/cockpit" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white">Retour au cockpit <ArrowRight size={15} /></Link>} /></div>
}
