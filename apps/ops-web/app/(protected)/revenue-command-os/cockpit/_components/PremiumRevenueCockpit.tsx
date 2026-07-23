'use client'

import Link from 'next/link'

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BellRing,
  BookOpen,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Command,
  Download,
  Eye,
  FlaskConical,
  Fingerprint,
  GitBranch,
  Layers3,
  LineChart,
  ListChecks,
  Network,
  Orbit,
  RefreshCw,
  Rocket,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { fetchRevenueOsJson } from '@/lib/revenue-command-os/client-http'
import CockpitHero from '../../_components/hero-sovereignty/heroes/CockpitHero'
import {
  DrawerActionFooter, DrawerBadge, DrawerCloseButton, DrawerExecutiveBrief, DrawerMetric,
  DrawerPrimaryAction, DrawerSection as SovereignDrawerSection, SovereignDrawerOverlay,
  SovereignDrawerPanel, drawerStyles,
} from '../../_components/drawer-sovereignty/DrawerPrimitives'
import type {
  ApprovalGovernanceSummary,
  CampaignWaveSummary,
  CockpitDashboard,
  CockpitRoleView,
  CockpitZoneKey,
  CommandRunSummary,
  ExperimentSummary,
  LearningMemorySummary,
  LiveSignalSummary,
  RevenueException,
  RevenueProgramSummary,
  StrategyAssemblySummary,
} from '@/lib/revenue-command-os/cockpit/types'

const zones: Array<{ key: CockpitZoneKey | 'overview'; label: string; short: string; icon: ReactNode }> = [
  { key: 'overview', label: 'Vue de commandement', short: 'Commandement', icon: <Command size={17} /> },
  { key: 'objective-command', label: 'Objectif revenu', short: 'Objectif', icon: <Target size={17} /> },
  { key: 'live-signals', label: 'Signaux live', short: 'Signaux', icon: <BellRing size={17} /> },
  { key: 'strategy-assembly', label: 'Assemblage stratégique', short: 'Stratégie', icon: <Sparkles size={17} /> },
  { key: 'validation-council', label: 'Conseil de validation', short: 'Conseil', icon: <ShieldCheck size={17} /> },
  { key: 'active-programs', label: 'Programmes actifs', short: 'Programmes', icon: <Layers3 size={17} /> },
  { key: 'command-runs', label: 'Runs & planifications', short: 'Runs', icon: <CalendarClock size={17} /> },
  { key: 'campaign-waves', label: 'Campagnes & waves', short: 'Waves', icon: <Network size={17} /> },
  { key: 'mission-compiler', label: 'Mission Compiler', short: 'Compiler', icon: <GitBranch size={17} /> },
  { key: 'execution-progress', label: 'Progression exécution', short: 'Exécution', icon: <Rocket size={17} /> },
  { key: 'revenue-exceptions', label: 'Exceptions revenus', short: 'Exceptions', icon: <ShieldAlert size={17} /> },
  { key: 'experiments-winning-plays', label: 'Expériences & winning plays', short: 'Expériences', icon: <FlaskConical size={17} /> },
  { key: 'revenue-learning-memory', label: 'Mémoire d’apprentissage', short: 'Mémoire', icon: <BrainCircuit size={17} /> },
  { key: 'approvals-governance', label: 'Approbations & gouvernance', short: 'Gouvernance', icon: <BadgeCheck size={17} /> },
]

const roleViews: Array<{ key: CockpitRoleView; label: string }> = [
  { key: 'executive', label: 'Direction générale' },
  { key: 'commercial', label: 'Direction commerciale' },
  { key: 'operations', label: 'Direction opérations' },
  { key: 'finance', label: 'Finance & marge' },
  { key: 'agent', label: 'Exécution terrain' },
]

export default function PremiumRevenueCockpit() {
  const [dashboard, setDashboard] = useState<CockpitDashboard | null>(null)
  const [activeZone, setActiveZone] = useState<CockpitZoneKey | 'overview'>('overview')
  const [roleView, setRoleView] = useState<CockpitRoleView>('executive')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedException, setSelectedException] = useState<RevenueException | null>(null)
  const [actionBusy, setActionBusy] = useState(false)

  const load = useCallback(async (force = false) => {
    setBusy(true)
    setError('')
    try {
      const payload = await fetchRevenueOsJson<CockpitDashboard>(
        `/api/revenue-command-os/cockpit?view=${roleView}&refresh=${force ? 'true' : 'false'}`,
        { cache: 'no-store' },
        { timeoutMs: 25000, fallbackMessage: 'Chargement du cockpit impossible.' },
      )
      if (!payload.data) throw new Error('Le cockpit n’a retourné aucune situation exploitable.')
      setDashboard(payload.data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }, [roleView])

  useEffect(() => { void load(true) }, [load])

  const filteredSignals = useMemo(() => filterText(dashboard?.signals || [], query, (item) => `${item.title} ${item.summary} ${item.category} ${item.source}`), [dashboard, query])
  const filteredPrograms = useMemo(() => filterText(dashboard?.programs || [], query, (item) => `${item.title} ${item.code} ${item.owner} ${item.territories.join(' ')}`), [dashboard, query])
  const filteredWaves = useMemo(() => filterText(dashboard?.waves || [], query, (item) => `${item.campaignTitle} ${item.waveCode} ${item.territory} ${item.segment}`), [dashboard, query])
  const filteredExceptions = useMemo(() => filterText(dashboard?.exceptions || [], query, (item) => `${item.title} ${item.summary} ${item.rootCause} ${item.priority}`), [dashboard, query])

  async function exportBrief() {
    setActionBusy(true)
    try {
      const response = await fetch('/api/revenue-command-os/cockpit/export-brief', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ format: 'html', includeTimeline: true, includeEvidence: true, roleView }) })
      if (!response.ok) throw new Error('Export impossible.')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `revenue-command-brief-${new Date().toISOString().slice(0, 10)}.html`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setActionBusy(false)
    }
  }

  async function acknowledge(exception: RevenueException) {
    setActionBusy(true)
    try {
      await fetchRevenueOsJson('/api/revenue-command-os/cockpit/acknowledge', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
        body: JSON.stringify({ exceptionId: exception.id }),
      }, { fallbackMessage: 'Accusé de réception impossible.' })
      await load(true)
      setSelectedException(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <div className="space-y-5 pb-12">
      <CommandHeader dashboard={dashboard} busy={busy} actionBusy={actionBusy} roleView={roleView} setRoleView={setRoleView} onRefresh={() => load(true)} onExport={exportBrief} />
      {error ? <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800"><AlertTriangle size={18} />{error}<button onClick={() => setError('')} className="ml-auto rounded-lg p-1 hover:bg-red-100"><X size={16} /></button></div> : null}

      <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="h-fit overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,.06)] xl:sticky xl:top-[170px]">
          <div className="border-b border-slate-100 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Filtrer le cockpit..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-semibold outline-none focus:border-blue-300 focus:bg-white" />
            </div>
          </div>
          <nav className="max-h-[68vh] overflow-y-auto p-2">
            {zones.map((zone) => {
              const active = activeZone === zone.key
              const health = zone.key === 'overview' ? null : dashboard?.zoneHealth.find((item) => item.zone === zone.key)
              return <button key={zone.key} onClick={() => setActiveZone(zone.key)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>
                <span className={active ? 'text-blue-200' : 'text-blue-700'}>{zone.icon}</span>
                <span className="min-w-0 flex-1 truncate text-[12px] font-black">{zone.short}</span>
                {health ? <span className={`h-2 w-2 rounded-full ${health.status === 'healthy' ? 'bg-emerald-500' : health.status === 'blocked' ? 'bg-red-500' : health.status === 'stale' ? 'bg-amber-500' : 'bg-slate-300'}`} /> : null}
              </button>
            })}
          </nav>
          <div className="border-t border-slate-100 p-4">
            <div className="rounded-2xl bg-blue-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-700">Posture active</p>
              <p className="mt-1 text-sm font-black text-slate-950">{dashboard?.executionMode || 'shadow'}</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">Toutes les décisions restent soumises aux validations, permissions et approbations applicables.</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          {!dashboard ? <LoadingCockpit /> : activeZone === 'overview' ? <Overview dashboard={dashboard} onOpenZone={setActiveZone} onSelectException={setSelectedException} /> : activeZone === 'objective-command' ? <ObjectiveZone dashboard={dashboard} /> : activeZone === 'live-signals' ? <SignalsZone signals={filteredSignals} /> : activeZone === 'strategy-assembly' ? <StrategyZone strategies={dashboard.strategies} /> : activeZone === 'validation-council' ? <CouncilZone dashboard={dashboard} /> : activeZone === 'active-programs' ? <ProgramsZone programs={filteredPrograms} /> : activeZone === 'command-runs' ? <RunsZone runs={dashboard.runs} /> : activeZone === 'campaign-waves' ? <WavesZone waves={filteredWaves} /> : activeZone === 'mission-compiler' ? <CompilerZone dashboard={dashboard} /> : activeZone === 'execution-progress' ? <ExecutionZone dashboard={dashboard} /> : activeZone === 'revenue-exceptions' ? <ExceptionsZone exceptions={filteredExceptions} onSelect={setSelectedException} /> : activeZone === 'experiments-winning-plays' ? <ExperimentsZone experiments={dashboard.experiments} /> : activeZone === 'revenue-learning-memory' ? <LearningZone rows={dashboard.learning} /> : <ApprovalsZone approvals={dashboard.approvals} />}
        </main>
      </div>

      {selectedException ? <ExceptionDrawer exception={selectedException} busy={actionBusy} onClose={() => setSelectedException(null)} onAcknowledge={() => acknowledge(selectedException)} /> : null}
    </div>
  )
}

function CommandHeader({ dashboard, busy, actionBusy, roleView, setRoleView, onRefresh, onExport }: { dashboard: CockpitDashboard | null; busy: boolean; actionBusy: boolean; roleView: CockpitRoleView; setRoleView: (value: CockpitRoleView) => void; onRefresh: () => void; onExport: () => void }) {
  const brief = dashboard?.executiveBrief
  return <>
    <CockpitHero
      state={busy && !dashboard ? 'INITIALIZING' : !dashboard ? 'OFFLINE' : dashboard.zoneHealth.some((zone) => ['degraded', 'blocked', 'stale'].includes(zone.status)) ? 'DEGRADED' : 'LIVE'}
      posture={`Mode ${dashboard?.executionMode || 'shadow'}`}
      authority={dashboard ? `Direction générale · effets externes exécutés: ${dashboard.counts.externalActionsExecuted}` : 'Autorité en attente de résolution'}
      summary={brief?.currentPosition || 'Le système consolide la situation revenue AngelCare, ses priorités, exceptions et décisions requises.'}
      freshness={dashboard?.generatedAt ? new Date(dashboard.generatedAt).toLocaleString('fr-FR') : undefined}
      metrics={[
        { label: 'Objectif', value: dashboard?.objective ? formatDh(dashboard.objective.revenueTarget) : '—', note: dashboard?.objective ? `${dashboard.objective.progressPercent}% réalisé` : 'Non calculé', tone: 'blue' },
        { label: 'Pipeline qualifié', value: dashboard?.objective ? formatDh(dashboard.objective.qualifiedPipeline) : '—', note: dashboard?.objective ? `${dashboard.objective.forecastPercent}% couverture` : 'Non calculé', tone: 'cyan' },
        { label: 'Revenu exposé', value: dashboard ? formatDh(dashboard.counts.revenueAtRisk) : '—', note: dashboard ? `${dashboard.counts.criticalExceptions} exception(s) critique(s)` : 'Indisponible', tone: dashboard?.counts.revenueAtRisk ? 'rose' : 'emerald' },
        { label: 'Approbations', value: dashboard ? dashboard.counts.approvalsRequired : '—', note: 'Décisions humaines requises', tone: dashboard?.counts.approvalsRequired ? 'amber' : 'emerald' },
      ]}
      actions={[
        { label: busy ? 'Actualisation…' : 'Actualiser', onClick: onRefresh, disabled: busy, reason: busy ? 'Le cockpit est déjà en cours d’actualisation.' : undefined, kind: 'secondary', icon: RefreshCw },
        { label: actionBusy ? 'Export…' : 'Brief exécutif', onClick: onExport, disabled: actionBusy || !dashboard, reason: actionBusy ? 'Un export est déjà en cours.' : !dashboard ? 'Le cockpit doit être disponible avant export.' : undefined, kind: 'primary', icon: Download },
      ]}
      warning={dashboard?.counts.externalActionsExecuted ? 'Attention — le compteur signale des effets externes exécutés dans la source actuelle; MZ22 ne modifie pas cette posture.' : 'Shadow control — aucune action externe n’est activée par le hero.'}
    />
    <div className="mt-3 flex justify-end">
      <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[.12em] text-slate-500 shadow-sm">
        Perspective
        <select value={roleView} onChange={(event: ChangeEvent<HTMLSelectElement>) => setRoleView(event.target.value as CockpitRoleView)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black normal-case tracking-normal text-slate-900 outline-none focus:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-300">
          {roleViews.map((view) => <option key={view.key} value={view.key}>{view.label}</option>)}
        </select>
      </label>
    </div>
  </>
}

function Overview({ dashboard, onOpenZone, onSelectException }: { dashboard: CockpitDashboard; onOpenZone: (zone: CockpitZoneKey) => void; onSelectException: (exception: RevenueException) => void }) {
  return <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CommandMetric label="Forecast" value={formatDh(dashboard.objective?.forecastRevenue || 0)} detail={`${dashboard.objective?.forecastPercent || 0}% de la cible`} progress={dashboard.objective?.forecastPercent || 0} tone="blue" icon={<LineChart />} />
      <CommandMetric label="Programmes actifs" value={String(dashboard.counts.activePrograms)} detail={`${dashboard.counts.activeCampaigns} campagnes · ${dashboard.counts.activeWaves} waves`} progress={Math.min(100, dashboard.counts.activePrograms * 12)} tone="green" icon={<Layers3 />} />
      <CommandMetric label="Exécution réussie" value={String(dashboard.execution.succeeded)} detail={`${dashboard.execution.awaitingApproval} en attente · ${dashboard.execution.failed} échec(s)`} progress={ratio(dashboard.execution.succeeded, dashboard.execution.succeeded + dashboard.execution.failed + dashboard.execution.queued)} tone="violet" icon={<Rocket />} />
      <CommandMetric label="Confiance stratégie" value={`${dashboard.strategies[0]?.confidence || 0}%`} detail={`${dashboard.council?.blockingFindings || 0} blocage(s) Conseil`} progress={dashboard.strategies[0]?.confidence || 0} tone="amber" icon={<ShieldCheck />} />
    </div>

    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.3fr)_minmax(420px,.7fr)]">
      <Panel title="Ce qui a changé" eyebrow="Causalité live" action={<button onClick={() => onOpenZone('command-runs')} className="text-xs font-black text-blue-700">Chronologie complète <ChevronRight className="inline" size={14} /></button>}>
        <div className="space-y-2">
          {dashboard.timeline.slice(0, 8).map((event, index) => <div key={event.id} className="grid grid-cols-[36px_minmax(0,1fr)_auto] gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${event.severity === 'critical' || event.severity === 'high' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{index === 0 ? <Activity size={16} /> : <Clock3 size={16} />}</span>
            <div className="min-w-0"><p className="truncate text-sm font-black text-slate-950">{event.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{event.summary}</p></div>
            <span className="text-[10px] font-bold text-slate-400">{timeAgo(event.occurredAt)}</span>
          </div>)}
          {!dashboard.timeline.length ? <EmptyState icon={<Activity />} title="Aucun événement récent" text="Les changements importants apparaîtront ici avec leur causalité." /> : null}
        </div>
      </Panel>

      <Panel title="Interventions prioritaires" eyebrow="Revenue exceptions" action={<button onClick={() => onOpenZone('revenue-exceptions')} className="text-xs font-black text-red-700">Toutes les exceptions <ChevronRight className="inline" size={14} /></button>}>
        <div className="space-y-3">
          {dashboard.exceptions.slice(0, 6).map((exception) => <button key={exception.id} onClick={() => onSelectException(exception)} className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-red-200 hover:bg-red-50/30">
            <div className="flex items-start gap-3"><PriorityBadge value={exception.priority} /><div className="min-w-0 flex-1"><p className="text-sm font-black text-slate-950">{exception.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{exception.summary}</p><div className="mt-3 flex items-center justify-between"><span className="text-xs font-black text-red-700">{formatDh(exception.revenueAtRisk)} exposés</span><span className="text-[10px] font-bold uppercase text-slate-400">{exception.status}</span></div></div></div>
          </button>)}
          {!dashboard.exceptions.length ? <EmptyState icon={<CheckCircle2 />} title="Aucune exception critique" text="Le moteur ne détecte actuellement aucun blocage nécessitant une intervention." positive /> : null}
        </div>
      </Panel>
    </div>

    <div className="grid gap-5 xl:grid-cols-3">
      <Panel title="Stratégie active" eyebrow="Strategy lineage · Council · Decision">
        {dashboard.strategies[0] ? <StrategyCompact strategy={dashboard.strategies[0]} council={dashboard.council} /> : <EmptyState icon={<Sparkles />} title="Aucune stratégie active" text="Assemblez puis validez une stratégie depuis le Strategy Brain." />}
      </Panel>
      <Panel title="Programmes revenus" eyebrow="Strategy → Program → Campaign → Mission">
        <div className="space-y-3">{dashboard.programs.slice(0, 5).map((program) => <ProgramCompact key={program.id} program={program} />)}{!dashboard.programs.length ? <EmptyState icon={<Layers3 />} title="Aucun programme actif" text="Une stratégie approuvée doit être compilée en travail opérationnel." /> : null}</div>
      </Panel>
      <Panel title="Exécution contrôlée" eyebrow="Execution governance · Adapters · Outcomes">
        <ExecutionMini dashboard={dashboard} />
      </Panel>
    </div>

    <Panel title="Santé des treize zones" eyebrow="Operating system integrity">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{dashboard.zoneHealth.map((health) => <button key={health.zone} onClick={() => onOpenZone(health.zone)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg">
        <div className="flex items-center justify-between"><span className={`h-2.5 w-2.5 rounded-full ${health.status === 'healthy' ? 'bg-emerald-500' : health.status === 'blocked' ? 'bg-red-500' : health.status === 'stale' ? 'bg-amber-500' : 'bg-slate-300'}`} /><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">{health.status}</span></div><p className="mt-4 text-sm font-black text-slate-950">{zoneLabel(health.zone)}</p><p className="mt-1 text-xs text-slate-500">{health.records} objet(s) · {health.criticalItems} critique(s)</p><p className="mt-3 line-clamp-2 text-[11px] leading-5 text-slate-500">{health.message}</p>
      </button>)}</div>
    </Panel>
  </div>
}

function ObjectiveZone({ dashboard }: { dashboard: CockpitDashboard }) {
  const objective = dashboard.objective
  if (!objective) return <Panel title="Commandement objectif"><EmptyState icon={<Target />} title="Aucun objectif actif" text="Créez ou activez un objectif revenu gouverné." /></Panel>
  return <div className="space-y-5">
    <Panel title={objective.title} eyebrow={`${objective.code} · version ${objective.version}`} action={<Freshness value={objective.freshness.state} text={objective.freshness.message} />}>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
        <div><p className="text-3xl font-black tracking-tight text-slate-950">{formatDh(objective.revenueTarget)}</p><p className="mt-2 text-sm text-slate-500">Objectif approuvé · marge minimale {objective.marginTarget}%</p><div className="mt-6 grid gap-3 sm:grid-cols-3"><SmallMetric label="Réalisé" value={formatDh(objective.actualRevenue)} /><SmallMetric label="Pipeline qualifié" value={formatDh(objective.qualifiedPipeline)} /><SmallMetric label="Forecast" value={formatDh(objective.forecastRevenue)} /></div><div className="mt-6"><ProgressBar label="Progression réelle" value={objective.progressPercent} /><ProgressBar label="Couverture forecast" value={objective.forecastPercent} tone="green" /><ProgressBar label="Confiance" value={objective.confidence} tone="amber" /></div></div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-[.14em] text-slate-500">Périmètre d’exécution</p><Definition label="Business units" value={objective.businessUnits.join(', ') || 'Non défini'} /><Definition label="Territoires" value={objective.territories.join(', ') || 'Non défini'} /><Definition label="Segments" value={objective.segments.join(', ') || 'Non défini'} /><Definition label="Approbation" value={objective.approvalStatus} /><Definition label="Prochain jalon" value={objective.nextMilestone || 'À déterminer'} /></div>
      </div>
    </Panel>
    <div className="grid gap-5 lg:grid-cols-2"><Panel title="Blocages actuels" eyebrow="Intervention required">{objective.currentBlockers.length ? <ul className="space-y-2">{objective.currentBlockers.map((blocker) => <li key={blocker} className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-900"><AlertTriangle className="shrink-0" size={17} />{blocker}</li>)}</ul> : <EmptyState icon={<CheckCircle2 />} title="Aucun blocage déclaré" text="Le système surveille les signaux, la capacité et la trajectoire." positive />}</Panel><Panel title="Ce que le moteur cherche à gagner" eyebrow="Executive mandate"><p className="text-lg font-black leading-8 text-slate-950">Atteindre {formatDh(objective.revenueTarget)} avec une marge ≥ {objective.marginTarget}% sur {objective.territories.join(', ') || 'les territoires approuvés'}.</p><p className="mt-4 text-sm leading-7 text-slate-500">La progression est mesurée contre les revenus réalisés, le pipeline qualifié, la capacité et les conditions d’approbation.</p></Panel></div>
  </div>
}

function SignalsZone({ signals }: { signals: LiveSignalSummary[] }) {
  return <Panel title={`Signaux marché & activité · ${signals.length}`} eyebrow="Live Market and Business Signals">
    <div className="grid gap-3 lg:grid-cols-2">{signals.map((signal) => <div key={signal.id} className={`rounded-3xl border p-5 ${signal.severity === 'critical' ? 'border-red-200 bg-red-50/50' : signal.severity === 'high' ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-white'}`}><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><SeverityBadge value={signal.severity} /><span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase text-slate-500">{signal.category}</span></div><h3 className="mt-3 text-base font-black text-slate-950">{signal.title}</h3></div><Freshness value={signal.freshness.state} text={timeAgo(signal.occurredAt)} /></div><p className="mt-3 text-sm leading-6 text-slate-600">{signal.summary}</p><div className="mt-4 grid grid-cols-3 gap-2"><ScoreMini label="Priorité" value={signal.priorityScore} /><ScoreMini label="Opportunité" value={signal.opportunityScore} /><ScoreMini label="Risque" value={signal.riskScore} /></div><div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3"><span className="text-[11px] font-bold text-slate-500">{signal.source} · {signal.confidence}</span><Link href="/revenue-command-os/signals/live-stream" className="text-xs font-black text-blue-700">Inspecter dans Signaux <ChevronRight className="inline" size={14} /></Link></div></div>)}{!signals.length ? <div className="lg:col-span-2"><EmptyState icon={<BellRing />} title="Aucun signal correspondant" text="Ajustez le filtre ou vérifiez la santé du Signal Fabric." /></div> : null}</div>
  </Panel>
}

function StrategyZone({ strategies }: { strategies: StrategyAssemblySummary[] }) {
  return <div className="space-y-5"><Panel title="Stratégie recommandée" eyebrow="Gemini Strategy Assembly">{strategies[0] ? <StrategyHero strategy={strategies[0]} /> : <EmptyState icon={<Sparkles />} title="Aucune stratégie" text="Le Strategy Brain n’a pas encore produit de stratégie disponible." />}</Panel><Panel title={`Alternatives stratégiques · ${strategies.length}`} eyebrow="Compare trade-offs"><div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{strategies.map((strategy) => <StrategyCard key={strategy.id} strategy={strategy} />)}</div></Panel></div>
}

function CouncilZone({ dashboard }: { dashboard: CockpitDashboard }) {
  const council = dashboard.council
  if (!council) return <Panel title="Conseil de validation"><EmptyState icon={<ShieldCheck />} title="Aucun run du Conseil" text="Sélectionnez une stratégie puis lancez sa validation gouvernée." /></Panel>
  const scores = Object.entries(council.scores)
  return <div className="space-y-5"><Panel title={`Classification · ${council.classification}`} eyebrow={`Run ${shortId(council.runId)}`} action={<StatusPill value={council.readyForExecutiveReview ? 'ready' : 'blocked'} />}><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{scores.map(([label, value]) => <ScoreCard key={label} label={label} value={value} />)}</div><div className="mt-5 grid gap-3 md:grid-cols-4"><SmallMetric label="Agents terminés" value={`${council.completedAgents}/${Math.max(10, council.reviewCount)}`} /><SmallMetric label="Findings bloquants" value={String(council.blockingFindings)} alert={council.blockingFindings > 0} /><SmallMetric label="Contradictions" value={String(council.contradictions)} alert={council.contradictions > 0} /><SmallMetric label="Red Team survécue" value={`${council.survivedAttacks}/${council.redTeamAttacks}`} /></div></div><div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-[.14em] text-slate-500">Findings prioritaires</p><div className="mt-4 space-y-2">{council.topFindings.slice(0, 6).map((finding) => <div key={finding} className="rounded-xl bg-white p-3 text-xs font-semibold leading-5 text-slate-700 shadow-sm">{finding}</div>)}{!council.topFindings.length ? <p className="text-sm text-slate-500">Aucun finding textuel disponible.</p> : null}</div></div></div></Panel></div>
}

function ProgramsZone({ programs }: { programs: RevenueProgramSummary[] }) {
  return <Panel title={`Programmes revenus actifs · ${programs.length}`} eyebrow="Strategy → Program → Campaign → Mission"><div className="grid gap-4 xl:grid-cols-2">{programs.map((program) => <div key={program.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-blue-700">{program.code}</p><h3 className="mt-2 text-lg font-black text-slate-950">{program.title}</h3><p className="mt-1 text-xs text-slate-500">{program.owner} · {program.territories.join(', ')}</p></div><StatusPill value={program.status} /></div><div className="mt-5 grid grid-cols-3 gap-2"><SmallMetric label="Forecast" value={formatDh(program.forecastRevenue)} /><SmallMetric label="Pipeline" value={formatDh(program.pipelineContribution)} /><SmallMetric label="Capacité" value={`${program.capacityUtilization}%`} alert={program.capacityUtilization >= 90} /></div><div className="mt-5"><ProgressBar label="Progression" value={program.progressPercent} tone="green" /></div><div className="mt-4 grid grid-cols-4 gap-2 text-center"><TinyCount label="Campagnes" value={program.activeCampaigns} /><TinyCount label="Waves" value={program.activeWaves} /><TinyCount label="Missions" value={program.missions} /><TinyCount label="Bloquées" value={program.tasksBlocked} alert={program.tasksBlocked > 0} /></div><div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black text-slate-600"><span>Dossier consolidé dans cette vue</span><BadgeCheck size={14} className="text-emerald-600" /></div></div>)}{!programs.length ? <div className="xl:col-span-2"><EmptyState icon={<Layers3 />} title="Aucun programme" text="Compilez une stratégie approuvée dans le Mission Compiler." /></div> : null}</div></Panel>
}

function RunsZone({ runs }: { runs: CommandRunSummary[] }) {
  return <Panel title={`Runs & planifications · ${runs.length}`} eyebrow="AI, Council, Compiler, Propagation, Adapters"><div className="space-y-2">{runs.map((run) => <div key={`${run.kind}-${run.id}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[160px_minmax(0,1fr)_150px_120px]"><div><span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-700">{run.kind}</span><p className="mt-2 text-[11px] font-bold text-slate-400">{run.startedAt ? timeAgo(run.startedAt) : 'Planifié'}</p></div><div><p className="text-sm font-black text-slate-950">{run.title}</p><p className={`mt-1 text-xs ${run.lastError ? 'text-red-700' : 'text-slate-500'}`}>{run.lastError || run.nextAction || 'Traçabilité disponible.'}</p></div><div className="flex items-center"><StatusPill value={run.status} /></div><div className="flex items-center justify-end text-xs font-bold text-slate-500">{run.durationMs ? `${Math.round(run.durationMs / 1000)}s` : `${run.attempts} tentative(s)`}</div></div>)}{!runs.length ? <EmptyState icon={<CalendarClock />} title="Aucun run" text="Les exécutions et planifications apparaîtront ici." /> : null}</div></Panel>
}

function WavesZone({ waves }: { waves: CampaignWaveSummary[] }) {
  return <Panel title={`Campagnes & waves de comptes · ${waves.length}`} eyebrow="Portfolio → Campaign → Wave → Account"><div className="overflow-x-auto"><table className="min-w-[1100px] w-full"><thead><tr className="border-b border-slate-200 text-left text-[10px] font-black uppercase tracking-[.12em] text-slate-400"><th className="px-3 py-3">Campaign / Wave</th><th className="px-3 py-3">Territoire</th><th className="px-3 py-3">Comptes</th><th className="px-3 py-3">Contactés</th><th className="px-3 py-3">Meetings</th><th className="px-3 py-3">Proposals</th><th className="px-3 py-3">Conversions</th><th className="px-3 py-3">Taux</th><th className="px-3 py-3">Status</th></tr></thead><tbody>{waves.map((wave) => <tr key={wave.id} className="border-b border-slate-100 text-sm"><td className="px-3 py-4"><p className="font-black text-slate-950">{wave.campaignTitle}</p><p className="mt-1 text-xs text-slate-500">{wave.waveCode} · {wave.segment}</p></td><td className="px-3 py-4 font-semibold text-slate-600">{wave.territory}</td><td className="px-3 py-4 font-black">{wave.accountCount}</td><td className="px-3 py-4">{wave.contacted}</td><td className="px-3 py-4">{wave.meetings}</td><td className="px-3 py-4">{wave.proposals}</td><td className="px-3 py-4 font-black text-emerald-700">{wave.conversions}</td><td className="px-3 py-4"><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-black text-blue-700">{wave.conversionRate}%</span></td><td className="px-3 py-4"><StatusPill value={wave.status} /></td></tr>)}</tbody></table></div>{!waves.length ? <EmptyState icon={<Network />} title="Aucune wave" text="Les waves compilées et propagées apparaîtront ici." /> : null}</Panel>
}

function CompilerZone({ dashboard }: { dashboard: CockpitDashboard }) {
  const compiler = dashboard.compiler
  return <div className="space-y-5"><Panel title="Mission Compiler · état global" eyebrow="Deterministic mission manufacturing"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><CommandMetric label="Éligibles" value={String(compiler.eligibleStrategies)} detail="Stratégies approuvées" progress={Math.min(100, compiler.eligibleStrategies * 20)} tone="blue" icon={<BadgeCheck />} /><CommandMetric label="Compilées" value={String(compiler.compiled)} detail={`${compiler.readyForPropagation} prêtes pour exécution`} progress={Math.min(100, compiler.compiled * 15)} tone="green" icon={<GitBranch />} /><CommandMetric label="Objets générés" value={String(compiler.generatedObjects)} detail="Programs à tasks" progress={Math.min(100, compiler.generatedObjects / 10)} tone="violet" icon={<ListChecks />} /><CommandMetric label="Conflits" value={String(compiler.blockingConflicts)} detail="Bloquants ouverts" progress={Math.min(100, compiler.blockingConflicts * 20)} tone="red" icon={<AlertTriangle />} /><CommandMetric label="Rollback" value={String(compiler.rolledBack)} detail={`${compiler.superseded} superseded`} progress={0} tone="amber" icon={<TimerReset />} /></div></Panel><Panel title="Chaîne de compilation" eyebrow="No manual reconstruction"><div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">{['Strategy','Revenue Play','Program','Campaign','Wave','Mission','Task','Evidence'].map((label, index) => <div key={label} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center"><span className="text-[10px] font-black text-blue-700">{String(index + 1).padStart(2, '0')}</span><p className="mt-2 text-xs font-black text-slate-900">{label}</p>{index < 7 ? <ChevronRight className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-slate-300 xl:block" size={18} /> : null}</div>)}</div></Panel></div>
}

function ExecutionZone({ dashboard }: { dashboard: CockpitDashboard }) {
  const execution = dashboard.execution
  const stages = [['Préparées', execution.prepared], ['Approbation', execution.awaitingApproval], ['Queued', execution.queued], ['Executing', execution.executing], ['Succeeded', execution.succeeded], ['Failed', execution.failed], ['Retries', execution.retries], ['Dead letters', execution.deadLetters]] as const
  return <div className="space-y-5"><Panel title="Progression de l’exécution" eyebrow={`Mode ${execution.executionMode}`}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stages.map(([label, value]) => <SmallMetric key={label} label={label} value={String(value)} alert={label === 'Failed' || label === 'Dead letters' ? value > 0 : false} />)}</div><div className="mt-6 grid gap-4 lg:grid-cols-2"><div className="rounded-3xl border border-slate-200 p-5"><p className="text-xs font-black uppercase tracking-[.14em] text-slate-500">États de livraison</p><div className="mt-4 space-y-3">{Object.entries(execution.deliveryStates).map(([state, count]) => <div key={state} className="flex items-center gap-3"><span className="w-28 truncate text-xs font-bold text-slate-600">{state}</span><div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(100, count * 8)}%` }} /></div><span className="w-8 text-right text-xs font-black">{count}</span></div>)}</div></div><div className="rounded-3xl border border-slate-200 p-5"><p className="text-xs font-black uppercase tracking-[.14em] text-slate-500">Santé adaptateurs</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(execution.adapterHealth).map(([adapter, status]) => <div key={adapter} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="truncate text-xs font-bold">{adapter}</span><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${status === 'healthy' ? 'bg-emerald-50 text-emerald-700' : status === 'credentials_missing' ? 'bg-amber-50 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>{status}</span></div>)}</div></div></div></Panel></div>
}

function ExceptionsZone({ exceptions, onSelect }: { exceptions: RevenueException[]; onSelect: (exception: RevenueException) => void }) {
  return <Panel title={`Revenue exceptions · ${exceptions.length}`} eyebrow="Intervention engine"><div className="grid gap-3 xl:grid-cols-2">{exceptions.map((exception) => <button key={exception.id} onClick={() => onSelect(exception)} className="rounded-3xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-xl"><div className="flex items-start gap-3"><PriorityBadge value={exception.priority} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="text-base font-black text-slate-950">{exception.title}</h3><StatusPill value={exception.status} /></div><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{exception.summary}</p><div className="mt-4 grid grid-cols-2 gap-2"><SmallMetric label="Revenu exposé" value={formatDh(exception.revenueAtRisk)} alert={exception.revenueAtRisk > 0} /><SmallMetric label="Escalade" value={exception.escalationRole || 'Revenue Ops'} /></div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-[11px] font-bold text-slate-500">{exception.affectedEntityLabel || exception.affectedEntityType}</span><span className="text-xs font-black text-red-700">Intervenir <ChevronRight className="inline" size={14} /></span></div></div></div></button>)}{!exceptions.length ? <div className="xl:col-span-2"><EmptyState icon={<CheckCircle2 />} title="Aucune exception ouverte" text="Le système n’identifie aucun blocage dans la sélection actuelle." positive /></div> : null}</div></Panel>
}

function ExperimentsZone({ experiments }: { experiments: ExperimentSummary[] }) {
  return <Panel title={`Expériences & winning plays · ${experiments.length}`} eyebrow="Evidence now · Learning governed"><div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{experiments.map((experiment) => <div key={experiment.id} className="rounded-3xl border border-slate-200 p-5"><div className="flex items-center justify-between"><span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-black uppercase text-violet-700">{experiment.dimension}</span><span className="text-[10px] font-black uppercase text-slate-400">{experiment.evidenceStatus}</span></div><h3 className="mt-4 text-base font-black text-slate-950">{experiment.title}</h3><div className="mt-5 grid grid-cols-2 gap-3"><SmallMetric label={experiment.baselineLabel} value={String(experiment.baselineMetric)} /><SmallMetric label={experiment.challengerLabel} value={String(experiment.challengerMetric)} /></div><div className="mt-5 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase text-slate-400">Lift observé</p><p className={`mt-1 text-3xl font-black ${experiment.liftPercent >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{experiment.liftPercent >= 0 ? '+' : ''}{experiment.liftPercent}%</p></div><div className="text-right"><p className="text-xs font-bold text-slate-500">n={experiment.sampleSize}</p><p className="mt-1 text-xs font-black text-blue-700">Confiance {experiment.confidence}%</p></div></div>{experiment.winningVariant ? <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-black text-emerald-800"><CheckCircle2 className="mr-2 inline" size={15} />Winning: {experiment.winningVariant}</div> : null}</div>)}{!experiments.length ? <div className="lg:col-span-2 xl:col-span-3"><EmptyState icon={<FlaskConical />} title="Aucune expérience exploitable" text="Les comparaisons observées apparaîtront ici lorsque les échantillons seront suffisants." /></div> : null}</div></Panel>
}

function LearningZone({ rows }: { rows: LearningMemorySummary[] }) {
  return <Panel title={`Mémoire d’apprentissage Revenue · ${rows.length}`} eyebrow="What worked, where, why"><div className="grid gap-3 lg:grid-cols-2">{rows.map((row) => <div key={row.id} className="rounded-3xl border border-slate-200 p-5"><div className="flex items-center justify-between"><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-700">{row.memoryType}</span><span className="text-xs font-black text-slate-500">{row.confidence}% confiance</span></div><h3 className="mt-4 text-base font-black text-slate-950">{row.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{row.outcome}</p><div className="mt-4 flex flex-wrap gap-2">{row.segment ? <Tag text={row.segment} /> : null}{row.territory ? <Tag text={row.territory} /> : null}<Tag text={`${row.evidenceCount} preuve(s)`} /><Tag text={row.reusable ? 'Réutilisable' : 'Observation'} /></div></div>)}{!rows.length ? <div className="lg:col-span-2"><EmptyState icon={<BookOpen />} title="Mémoire non disponible" text="Les résultats historiques et patterns seront consolidés ici." /></div> : null}</div></Panel>
}

function ApprovalsZone({ approvals }: { approvals: ApprovalGovernanceSummary[] }) {
  return <Panel title={`Approbations & gouvernance · ${approvals.length}`} eyebrow="No opaque approvals"><div className="space-y-3">{approvals.map((approval) => <div key={approval.id} className="grid gap-4 rounded-3xl border border-slate-200 p-5 lg:grid-cols-[minmax(0,1fr)_220px_160px]"><div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black uppercase text-amber-700">{approval.approvalType}</span>{approval.reversible ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase text-emerald-700">Réversible</span> : <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black uppercase text-red-700">Irréversible</span>}</div><h3 className="mt-3 text-base font-black text-slate-950">{approval.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{approval.businessConsequence}</p>{approval.conditions.length ? <div className="mt-3 flex flex-wrap gap-2">{approval.conditions.map((condition) => <Tag key={condition} text={condition} />)}</div> : null}</div><div className="rounded-2xl bg-slate-50 p-4"><Definition label="Rôle requis" value={approval.requiredRole} /><Definition label="Demandé par" value={approval.requestedBy} /><Definition label="Expiration" value={approval.expiresAt ? new Date(approval.expiresAt).toLocaleDateString('fr-FR') : 'Non définie'} /></div><div className="flex flex-col items-stretch justify-center gap-2"><StatusPill value={approval.status} /><Link href="/revenue-command-os/approvals" className="rounded-xl bg-slate-950 px-4 py-2.5 text-center text-xs font-black text-white">Ouvrir Approval Center</Link></div></div>)}{!approvals.length ? <EmptyState icon={<BadgeCheck />} title="Aucune approbation" text="Les décisions stratégiques et actions sensibles apparaîtront ici." /> : null}</div></Panel>
}

function ExceptionDrawer({ exception, busy, onClose, onAcknowledge }: { exception: RevenueException; busy: boolean; onClose: () => void; onAcknowledge: () => void }) {
  const critical = exception.severity === 'critical' || exception.priority === 'P0'
  const dueLabel = exception.dueAt ? new Date(exception.dueAt).toLocaleString('fr-FR') : 'Aucune échéance déclarée'
  const owner = exception.ownerLabel || exception.escalationRole || 'Revenue Operations'
  const acknowledged = Boolean(exception.acknowledgedAt)

  return <SovereignDrawerOverlay onClose={onClose} label={`Executive Intervention Dossier — ${exception.code}`}>
    <SovereignDrawerPanel width="max-w-[900px]" dataId="MZ23-DRAWER-01-EXCEPTION">
      <header className="relative overflow-hidden bg-[linear-gradient(135deg,#1b0b0d_0%,#4c1018_48%,#111827_100%)] px-5 py-6 text-white sm:px-7 sm:py-7">
        <div className={`absolute inset-0 opacity-35 ${drawerStyles.fineGrid}`} />
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_290px] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2"><DrawerBadge inverted>ANGELCARE · REVENUE COMMAND OS</DrawerBadge><DrawerBadge inverted>Executive Intervention Dossier</DrawerBadge></div>
            <div className="mt-5 flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[22px] border border-white/15 bg-white/10 text-white shadow-xl"><ShieldAlert size={25} /></span>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2"><DrawerBadge inverted>{exception.priority}</DrawerBadge><DrawerBadge inverted>{exception.severity}</DrawerBadge><DrawerBadge inverted>{exception.status}</DrawerBadge></div>
                <p className="mt-4 text-[9px] font-black uppercase tracking-[.2em] text-rose-200">{exception.code} · {exception.exceptionType}</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-.045em] text-white sm:text-4xl">{exception.title}</h2>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-200">{exception.summary}</p>
              </div>
            </div>
            <div className="mt-5"><DrawerExecutiveBrief dark tone="rose">{exception.businessImpact}</DrawerExecutiveBrief></div>
            <div className="mt-4 flex flex-wrap gap-2"><DrawerBadge inverted>Responsable · {owner}</DrawerBadge><DrawerBadge inverted>Source · {zoneLabel(exception.sourceZone)}</DrawerBadge><DrawerBadge inverted>{acknowledged ? 'Réception confirmée' : 'Réception requise'}</DrawerBadge></div>
          </div>
          <div className="relative h-52 overflow-hidden rounded-[32px] border border-white/10 bg-white/[.06] p-5 backdrop-blur-xl">
            <span className="absolute left-1/2 top-[42%] grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/10 text-white"><Zap size={31} /></span>
            <div className="absolute inset-x-5 bottom-5 grid grid-cols-2 gap-2"><div className="rounded-2xl border border-white/10 bg-white/[.07] p-3 text-center"><p className="text-2xl font-black text-white">{formatDh(exception.revenueAtRisk)}</p><p className="mt-1 text-[8px] font-black uppercase text-rose-200">Revenu exposé</p></div><div className="rounded-2xl border border-white/10 bg-white/[.07] p-3 text-center"><p className="text-2xl font-black text-white">{exception.evidence.length}</p><p className="mt-1 text-[8px] font-black uppercase text-rose-200">Preuves</p></div></div>
            <span className="absolute left-5 top-5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black text-white">CAUSE</span>
            <span className="absolute right-5 top-5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black text-white">RECOVERY</span>
          </div>
        </div>
        <div className="absolute right-5 top-5"><DrawerCloseButton onClose={onClose} inverted /></div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/75 px-5 py-6 sm:px-7 sm:py-7">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DrawerMetric label="Revenu exposé" value={formatDh(exception.revenueAtRisk)} note="Impact financier déclaré" icon={LineChart} tone="rose" />
          <DrawerMetric label="Sévérité" value={exception.severity} note={critical ? 'Intervention prioritaire' : 'Surveillance gouvernée'} icon={AlertTriangle} tone={critical ? 'rose' : 'amber'} />
          <DrawerMetric label="Échéance" value={exception.dueAt ? new Date(exception.dueAt).toLocaleDateString('fr-FR') : '—'} note={dueLabel} icon={Clock3} tone={exception.dueAt ? 'amber' : 'slate'} />
          <DrawerMetric label="Actions autorisées" value={exception.allowedActions.length} note="Périmètre gouverné" icon={ShieldCheck} tone="blue" />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <SovereignDrawerSection eyebrow="01 · Impact" title="Conséquence business" icon={LineChart} tone="rose"><p className="font-semibold leading-6 text-slate-800">{exception.businessImpact}</p></SovereignDrawerSection>
          <SovereignDrawerSection eyebrow="02 · Diagnostic" title="Cause racine" icon={GitBranch} tone="amber"><p className="font-semibold leading-6 text-slate-800">{exception.rootCause}</p></SovereignDrawerSection>
        </div>

        <div className="mt-5"><SovereignDrawerSection eyebrow="03 · Recovery" title="Action recommandée" icon={Rocket} tone="blue"><div className="rounded-[22px] border border-blue-200 bg-blue-50 p-4"><p className="text-sm font-black leading-6 text-blue-950">{exception.recommendedAction}</p></div></SovereignDrawerSection></div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
          <SovereignDrawerSection eyebrow="04 · Evidence" title="Preuves disponibles" icon={BookOpen} tone="emerald">
            <div className="space-y-2">{exception.evidence.length ? exception.evidence.map((evidence, index) => <div key={`${evidence}-${index}`} className="grid grid-cols-[36px_1fr] items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-[10px] font-black text-emerald-800">{index + 1}</span><p className="pt-1 text-xs font-bold leading-5 text-slate-800">{evidence}</p></div>) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs font-semibold text-slate-600">Preuve à compléter avant toute décision irréversible.</div>}</div>
          </SovereignDrawerSection>
          <SovereignDrawerSection eyebrow="05 · Périmètre" title="Entité, propriétaire et trace" icon={Fingerprint} tone="violet">
            <dl className="space-y-3">{[
              ['Entité affectée', exception.affectedEntityLabel || exception.affectedEntityType],
              ['Type d’entité', exception.affectedEntityType],
              ['Identifiant', exception.affectedEntityId || 'Indisponible'],
              ['Responsable', owner],
              ['Créée', new Date(exception.createdAt).toLocaleString('fr-FR')],
              ['Réception', exception.acknowledgedAt ? new Date(exception.acknowledgedAt).toLocaleString('fr-FR') : 'En attente'],
              ['Résolution', exception.resolvedAt ? new Date(exception.resolvedAt).toLocaleString('fr-FR') : 'Non résolue'],
            ].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-5 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><dt className="text-[10px] font-black uppercase tracking-[.1em] text-slate-500">{label}</dt><dd className="max-w-[62%] text-right text-xs font-black text-slate-900">{value}</dd></div>)}</dl>
          </SovereignDrawerSection>
        </div>

        <div className="mt-5"><SovereignDrawerSection eyebrow="06 · Gouvernance" title="Actions autorisées par le dossier" icon={ShieldCheck} tone="blue"><div className="flex flex-wrap gap-2">{exception.allowedActions.length ? exception.allowedActions.map((action) => <DrawerBadge key={action} tone="blue">{action}</DrawerBadge>) : <span className="text-xs font-semibold text-slate-600">Aucune action gouvernée n’est déclarée.</span>}</div></SovereignDrawerSection></div>
      </div>

      <DrawerActionFooter note={exception.status !== 'open' ? `Accusé de réception indisponible : statut actuel ${exception.status}.` : 'L’accusé de réception conserve la trace interne. L’intervention complète reste dans Intervention Control.'}>
        <DrawerPrimaryAction onClick={onAcknowledge} disabled={busy || exception.status !== 'open'} tone="emerald"><Eye size={16} />{busy ? 'Traitement…' : 'Accuser réception'}</DrawerPrimaryAction>
        <Link href="/revenue-command-os/exceptions" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-rose-700 px-5 py-3 text-xs font-black text-white shadow-lg transition hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"><Zap size={16} />Ouvrir Intervention Control<ArrowRight size={15} /></Link>
      </DrawerActionFooter>
    </SovereignDrawerPanel>
  </SovereignDrawerOverlay>
}

function StrategyHero({ strategy }: { strategy: StrategyAssemblySummary }) { return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div><div className="flex flex-wrap gap-2"><StatusPill value={strategy.status} /><Tag text={strategy.archetype} /><Tag text={`${strategy.provider} · ${strategy.model}`} /></div><h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950">{strategy.title}</h2><p className="mt-4 text-base leading-8 text-slate-600">{strategy.thesis}</p><div className="mt-6 grid gap-3 sm:grid-cols-3"><SmallMetric label="Confiance" value={`${strategy.confidence}%`} /><SmallMetric label="Hypothèses ouvertes" value={String(strategy.assumptionsOpen)} alert={strategy.assumptionsOpen > 0} /><SmallMetric label="Risques élevés" value={String(strategy.risksHigh)} alert={strategy.risksHigh > 0} /></div></div><div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><Definition label="Offre" value={strategy.offer} /><Definition label="Value proposition" value={strategy.valueProposition || 'Non renseignée'} /><Definition label="Pricing posture" value={strategy.pricingPosture} /><Definition label="Segments" value={strategy.targetSegments.join(', ') || 'Non défini'} /><Definition label="Territoires" value={strategy.territories.join(', ') || 'Non défini'} /></div></div> }
function StrategyCard({ strategy }: { strategy: StrategyAssemblySummary }) { return <div className="rounded-3xl border border-slate-200 p-5"><div className="flex items-center justify-between"><Tag text={strategy.archetype} /><span className="text-xl font-black text-blue-700">{strategy.confidence}%</span></div><h3 className="mt-4 line-clamp-2 text-base font-black text-slate-950">{strategy.title}</h3><p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{strategy.thesis}</p><div className="mt-4 grid grid-cols-3 gap-2 text-center"><TinyCount label="Evidence" value={strategy.evidenceCount} /><TinyCount label="Risques" value={strategy.risksHigh} alert={strategy.risksHigh > 0} /><TinyCount label="Stops" value={strategy.stopConditions} /></div></div> }
function StrategyCompact({ strategy, council }: { strategy: StrategyAssemblySummary; council: CockpitDashboard['council'] }) { return <div><div className="flex items-center justify-between"><Tag text={strategy.archetype} /><span className="text-2xl font-black text-blue-700">{strategy.confidence}%</span></div><h3 className="mt-4 text-lg font-black text-slate-950">{strategy.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{strategy.thesis}</p><div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Council classification</p><p className="mt-2 text-sm font-black text-slate-950">{council?.classification || 'Non évaluée'}</p><p className="mt-1 text-xs text-slate-500">{council?.blockingFindings || 0} blocage(s) · {council?.contradictions || 0} contradiction(s)</p></div></div> }
function ProgramCompact({ program }: { program: RevenueProgramSummary }) { return <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between"><div><p className="text-sm font-black text-slate-950">{program.title}</p><p className="mt-1 text-xs text-slate-500">{formatDh(program.pipelineContribution)} pipeline</p></div><span className="text-xl font-black text-emerald-700">{program.progressPercent}%</span></div><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, program.progressPercent)}%` }} /></div><div className="mt-3 flex justify-between text-[10px] font-bold text-slate-400"><span>{program.activeCampaigns} campagnes</span><span>{program.tasksBlocked} bloquées</span></div></div> }
function ExecutionMini({ dashboard }: { dashboard: CockpitDashboard }) { const execution = dashboard.execution; return <div><div className="grid grid-cols-3 gap-2"><TinyCount label="Queued" value={execution.queued} /><TinyCount label="Success" value={execution.succeeded} /><TinyCount label="Failed" value={execution.failed} alert={execution.failed > 0} /></div><div className="mt-4 space-y-2">{Object.entries(execution.adapterHealth).slice(0, 7).map(([adapter, status]) => <div key={adapter} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="truncate text-xs font-bold text-slate-600">{adapter}</span><span className={`h-2 w-2 rounded-full ${status === 'healthy' ? 'bg-emerald-500' : status === 'credentials_missing' ? 'bg-amber-500' : 'bg-slate-400'}`} /></div>)}</div><div className="mt-4 rounded-2xl border border-slate-200 p-3 text-xs font-bold text-slate-600">External actions executed: <span className="float-right font-black text-slate-950">{execution.externalActionsExecuted}</span></div></div> }

function Panel({ title, eyebrow, action, children }: { title: string; eyebrow?: string; action?: ReactNode; children: ReactNode }) { return <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_44px_rgba(15,23,42,.055)] lg:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div>{eyebrow ? <p className="text-[10px] font-black uppercase tracking-[.17em] text-blue-700">{eyebrow}</p> : null}<h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">{title}</h2></div>{action}</div>{children}</section> }
function BriefStrip({ label, value, icon }: { label: string; value: string; icon: ReactNode }) { return <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"><div className="flex items-center gap-2 text-blue-200">{icon}<span className="text-[10px] font-black uppercase tracking-[.13em]">{label}</span></div><p className="mt-3 line-clamp-3 text-xs font-semibold leading-5 text-slate-200">{value}</p></div> }
function HeroMetric({ label, value, sub, icon, alert }: { label: string; value: string; sub: string; icon: ReactNode; alert?: boolean }) { return <div className={`rounded-2xl border p-4 backdrop-blur ${alert ? 'border-red-300/20 bg-red-500/10' : 'border-white/10 bg-white/5'}`}><div className={alert ? 'text-red-200' : 'text-blue-200'}>{icon}</div><p className="mt-3 text-2xl font-black tracking-tight">{value}</p><p className="mt-1 text-xs text-slate-400">{label} · {sub}</p></div> }
function CommandMetric({ label, value, detail, progress, tone, icon }: { label: string; value: string; detail: string; progress: number; tone: 'blue' | 'green' | 'violet' | 'amber' | 'red'; icon: ReactNode }) { const styles = { blue: ['bg-blue-50 text-blue-700','bg-blue-600'], green: ['bg-emerald-50 text-emerald-700','bg-emerald-500'], violet: ['bg-violet-50 text-violet-700','bg-violet-600'], amber: ['bg-amber-50 text-amber-700','bg-amber-500'], red: ['bg-red-50 text-red-700','bg-red-600'] }[tone]; return <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-2xl ${styles[0]}`}>{icon}</span><span className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">{label}</span></div><p className="mt-5 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p><div className="mt-4 h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${styles[1]}`} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></div></div> }
function SmallMetric({ label, value, alert }: { label: string; value: string; alert?: boolean }) { return <div className={`rounded-2xl border p-3.5 ${alert ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}><p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p><p className={`mt-2 text-lg font-black ${alert ? 'text-red-800' : 'text-slate-950'}`}>{value}</p></div> }
function TinyCount({ label, value, alert }: { label: string; value: number; alert?: boolean }) { return <div className={`rounded-xl p-2.5 ${alert ? 'bg-red-50 text-red-800' : 'bg-slate-50 text-slate-700'}`}><p className="text-lg font-black">{value}</p><p className="text-[9px] font-black uppercase tracking-[.1em] opacity-70">{label}</p></div> }
function ScoreCard({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase text-slate-400">{label}</span><span className={`text-xl font-black ${value >= 70 ? 'text-emerald-700' : value >= 50 ? 'text-amber-700' : 'text-red-700'}`}>{value}</span></div><div className="mt-3 h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${value >= 70 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${value}%` }} /></div></div> }
function ScoreMini({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-white p-3 text-center shadow-sm"><p className="text-lg font-black text-slate-950">{value}</p><p className="text-[9px] font-black uppercase text-slate-400">{label}</p></div> }
function ProgressBar({ label, value, tone = 'blue' }: { label: string; value: number; tone?: 'blue' | 'green' | 'amber' }) { const color = tone === 'green' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-blue-600'; return <div className="mb-4"><div className="mb-2 flex justify-between text-xs font-bold text-slate-600"><span>{label}</span><span>{value}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div> }
function Definition({ label, value }: { label: string; value: string }) { return <div className="border-b border-slate-200 py-3 last:border-0"><p className="text-[9px] font-black uppercase tracking-[.13em] text-slate-400">{label}</p><p className="mt-1 text-sm font-bold leading-6 text-slate-800">{value}</p></div> }
function PriorityBadge({ value }: { value: string }) { const style = value === 'P0' ? 'bg-red-700 text-white' : value === 'P1' ? 'bg-red-50 text-red-800' : value === 'P2' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-700'; return <span className={`grid h-10 min-w-10 place-items-center rounded-xl px-2 text-xs font-black ${style}`}>{value}</span> }
function SeverityBadge({ value }: { value: string }) { const style = value === 'critical' ? 'bg-red-700 text-white' : value === 'high' ? 'bg-amber-100 text-amber-900' : value === 'medium' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'; return <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${style}`}>{value}</span> }
function StatusPill({ value }: { value: string }) { const normalized = value.toLowerCase(); const style = ['approved','ready','healthy','succeeded','completed','active','resolved'].some((term) => normalized.includes(term)) ? 'bg-emerald-50 text-emerald-700' : ['blocked','failed','rejected','expired','dead'].some((term) => normalized.includes(term)) ? 'bg-red-50 text-red-700' : ['pending','awaiting','retry','conditional'].some((term) => normalized.includes(term)) ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'; return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${style}`}>{value}</span> }
function Freshness({ value, text }: { value: string; text: string }) { const color = value === 'live' || value === 'fresh' ? 'bg-emerald-500' : value === 'stale' ? 'bg-red-500' : 'bg-amber-500'; return <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-slate-400"><span className={`h-2 w-2 rounded-full ${color}`} />{text}</span> }
function Tag({ text }: { text: string }) { return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{text}</span> }
function Badge({ label, tone }: { label: string; tone: 'blue' | 'slate' | 'red' | 'green' }) { const style = tone === 'blue' ? 'bg-blue-400/15 text-blue-100' : tone === 'red' ? 'bg-red-400/15 text-red-100' : tone === 'green' ? 'bg-emerald-400/15 text-emerald-100' : 'bg-white/10 text-slate-200'; return <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] ${style}`}>{label}</span> }
function EmptyState({ icon, title, text, positive }: { icon: ReactNode; title: string; text: string; positive?: boolean }) { return <div className="grid place-items-center rounded-3xl border border-dashed border-slate-200 py-12 text-center"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{icon}</span><p className="mt-4 text-sm font-black text-slate-800">{title}</p><p className="mt-1 max-w-md text-xs leading-5 text-slate-500">{text}</p></div> }
function LoadingCockpit() { return <div className="grid min-h-[520px] place-items-center rounded-[30px] border border-slate-200 bg-white"><div className="text-center"><Orbit className="mx-auto animate-spin text-blue-600" size={48} /><p className="mt-4 text-lg font-black text-slate-950">Construction du Revenue Situation Brief...</p><p className="mt-2 text-sm text-slate-500">Agrégation des objectifs, signaux, stratégies, exécutions et preuves.</p></div></div> }

function filterText<T>(rows: T[], query: string, getter: (row: T) => string): T[] { const normalized = query.trim().toLowerCase(); return normalized ? rows.filter((row) => getter(row).toLowerCase().includes(normalized)) : rows }
function formatDh(value: number): string { return `${Math.round(value).toLocaleString('fr-FR')} Dh` }
function ratio(a: number, b: number): number { return b > 0 ? Math.round((a / b) * 100) : 0 }
function shortId(value: string): string { return value ? `${value.slice(0, 8)}…` : '—' }
function timeAgo(value: string): string { const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000)); if (minutes < 2) return 'À l’instant'; if (minutes < 60) return `${minutes} min`; const hours = Math.round(minutes / 60); if (hours < 24) return `${hours} h`; return `${Math.round(hours / 24)} j` }
function zoneLabel(zone: CockpitZoneKey): string { return zones.find((item) => item.key === zone)?.label || zone }
