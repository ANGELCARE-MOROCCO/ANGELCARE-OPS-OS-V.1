'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Command,
  Database,
  FileCheck2,
  FileText,
  GitBranch,
  Layers3,
  Loader2,
  Network,
  Play,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type {
  RevenueOperatingSpineSnapshot,
  RevenueOperatingStage,
  RevenueOperatingStrategy,
  RevenueOperationLaunchInput,
} from '@/lib/revenue-command-os/operating-spine/types'
import styles from './RevenueOperatingSpine.module.css'

type SpineView = 'command' | 'intelligence' | 'strategies' | 'decision' | 'execution' | 'learning' | 'audit'
type SpineFocus =
  | 'cockpit'
  | 'strategy'
  | 'council'
  | 'decision'
  | 'compilation'
  | 'execution'
  | 'programs'
  | 'missions'
  | 'approvals'
  | 'exceptions'
  | 'learning'
  | 'audit'

interface Props {
  focus?: SpineFocus
}

interface ApiEnvelope<T> {
  ok?: boolean
  data?: T
  error?: { message?: string; code?: string }
}

type ExecutionActionItem = RevenueOperatingSpineSnapshot['execution']['latestActions'][number]

const VIEW_BY_FOCUS: Record<SpineFocus, SpineView> = {
  cockpit: 'command',
  strategy: 'strategies',
  council: 'decision',
  decision: 'decision',
  compilation: 'decision',
  execution: 'execution',
  programs: 'execution',
  missions: 'execution',
  approvals: 'decision',
  exceptions: 'audit',
  learning: 'learning',
  audit: 'audit',
}

const viewTabs: Array<{ key: SpineView; label: string; icon: typeof Target }> = [
  { key: 'command', label: 'Commandement', icon: Target },
  { key: 'intelligence', label: 'Gemini & ressources', icon: Bot },
  { key: 'strategies', label: 'Stratégies', icon: Sparkles },
  { key: 'decision', label: 'Conseil & décision', icon: ShieldCheck },
  { key: 'execution', label: 'Programmes & exécution', icon: Rocket },
  { key: 'learning', label: 'Résultats & apprentissage', icon: BarChart3 },
  { key: 'audit', label: 'Risques & sources', icon: Database },
]

const initialLaunch: RevenueOperationLaunchInput = {
  title: '',
  mandate: '',
  businessUnit: 'ANGELCARE',
  targetMarket: 'Maroc',
  targetSegments: ['Établissements privés'],
  territories: ['Rabat'],
  targetAccounts: [],
  revenueTarget: undefined,
  marginTarget: undefined,
  horizon: '90 jours',
  deadline: undefined,
  priority: 'high',
  budgetLimit: undefined,
  capacityLimit: undefined,
  approvedOffers: [],
  approvedChannels: ['email_os', 'internal_tasks', 'meetings', 'proposals'],
  constraints: ['Aucun effet externe sans approbation humaine'],
  successDefinition: ['Pipeline qualifié et décisions commerciales mesurables dans l’horizon défini'],
  failureDefinition: ['Aucune progression commerciale mesurable dans l’horizon défini'],
  riskAppetite: 'balanced',
  authorityLevel: 'Direction générale',
}

export default function RevenueOperatingSpine({ focus = 'cockpit' }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [snapshot, setSnapshot] = useState<RevenueOperatingSpineSnapshot | null>(null)
  const [activeView, setActiveView] = useState<SpineView>(VIEW_BY_FOCUS[focus])
  const [selectedStrategyId, setSelectedStrategyId] = useState('')
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [launchOpen, setLaunchOpen] = useState(false)
  const [decisionReason, setDecisionReason] = useState('Décision exécutive documentée depuis le Revenue Operating Spine.')
  const [launch, setLaunch] = useState<RevenueOperationLaunchInput>(initialLaunch)
  const [reviewedAction, setReviewedAction] = useState<ExecutionActionItem | null>(null)
  const [actionReason, setActionReason] = useState('Décision opérationnelle documentée depuis le Revenue Operating Spine.')

  useEffect(() => setActiveView(VIEW_BY_FOCUS[focus]), [focus])

  useEffect(() => {
    if (searchParams.get('launch') !== '1') return
    setLaunchOpen(true)
    router.replace('/revenue-command-os', { scroll: false })
  }, [router, searchParams])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const envelope = await request<ApiEnvelope<RevenueOperatingSpineSnapshot>>('/api/revenue-command-os/operating-spine')
      if (!envelope.data) throw new Error(envelope.error?.message || 'Le Revenue Operating Spine n’a retourné aucune donnée.')
      setSnapshot(envelope.data)
      setSelectedStrategyId((current) => {
        if (current && envelope.data?.strategies.some((strategy) => strategy.id === current)) return current
        return envelope.data?.strategies.find((strategy) => strategy.recommended)?.id || envelope.data?.strategies[0]?.id || ''
      })
    } catch (caught) {
      setError(messageOf(caught))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const selectedStrategy = useMemo(
    () => snapshot?.strategies.find((strategy) => strategy.id === selectedStrategyId) || snapshot?.strategies[0],
    [snapshot, selectedStrategyId],
  )

  async function perform(label: string, work: () => Promise<unknown>, confirmation?: string) {
    if (confirmation && !window.confirm(confirmation)) return
    setAction(label)
    setError('')
    setSuccess('')
    try {
      await work()
      setSuccess(`${label} terminé avec succès. Le registre opérationnel a été actualisé.`)
      await load()
    } catch (caught) {
      setError(messageOf(caught))
    } finally {
      setAction('')
    }
  }

  async function launchOperation(event: FormEvent) {
    event.preventDefault()
    await perform('Assemblage stratégique Gemini', async () => {
      const envelope = await request<ApiEnvelope<unknown>>('/api/revenue-command-os/operating-spine', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
        body: JSON.stringify({ action: 'launch_operation', payload: launch }),
      })
      if (!envelope.ok) throw new Error(envelope.error?.message || 'Le lancement de l’opération a échoué.')
      setLaunchOpen(false)
      setActiveView('intelligence')
    }, 'Lancer maintenant l’assemblage stratégique gouverné ? Aucune action commerciale externe ne sera exécutée.')
  }

  async function runCouncil() {
    if (!selectedStrategy || !snapshot?.context) {
      setError('Une stratégie et son contexte gouverné sont requis.')
      return
    }
    await perform('Conseil de validation', async () => {
      const envelope = await request<ApiEnvelope<unknown>>('/api/revenue-command-os/validation-council/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
        body: JSON.stringify({
          strategyId: selectedStrategy.id,
          strategy: selectedStrategy.raw,
          context: snapshot.context,
        }),
      })
      if (!envelope.ok) throw new Error(envelope.error?.message || 'Le Conseil n’a pas pu délibérer.')
      setActiveView('decision')
    }, `Soumettre ${selectedStrategy.code} au Conseil indépendant ?`)
  }

  async function approveStrategy() {
    if (!selectedStrategy) {
      setError('Sélectionnez une stratégie.')
      return
    }
    if (decisionReason.trim().length < 3) {
      setError('Le motif de décision est requis.')
      return
    }
    await perform('Approbation exécutive', async () => {
      const envelope = await request<ApiEnvelope<unknown>>('/api/revenue-command-os/strategy-studio/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
        body: JSON.stringify({
          strategyId: selectedStrategy.id,
          strategyVersion: selectedStrategy.version,
          reason: decisionReason,
          approvalClass: 'standard',
          conditions: [],
        }),
      })
      if (!envelope.ok) throw new Error(envelope.error?.message || 'La stratégie n’a pas pu être approuvée.')
    }, `Approuver formellement ${selectedStrategy.code} ? Cette décision reste interne, auditée et réversible selon les règles applicables.`)
  }

  async function compileStrategy() {
    if (!selectedStrategy) {
      setError('Sélectionnez une stratégie.')
      return
    }
    await perform('Compilation opérationnelle', async () => {
      const envelope = await request<ApiEnvelope<unknown>>('/api/revenue-command-os/mission-compiler/compile', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
        body: JSON.stringify({
          strategyId: selectedStrategy.id,
          strategyVersion: selectedStrategy.version,
          approvalRequestId: snapshot?.decision.requestId,
          approvalDecisionId: snapshot?.decision.decisionId,
          scope: 'full',
          dryRun: false,
        }),
      })
      if (!envelope.ok) throw new Error(envelope.error?.message || 'La compilation a échoué.')
      setActiveView('execution')
    }, `Compiler ${selectedStrategy.code} en programmes, missions, tâches, preuves et gates ?`)
  }

  async function prepareExecution() {
    const packageId = snapshot?.compilation.packageId
    if (!packageId) {
      setError('Aucun package de propagation n’est disponible.')
      return
    }
    await perform('Préparation de l’exécution', async () => {
      const envelope = await request<ApiEnvelope<unknown>>('/api/revenue-command-os/propagation/prepare', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
        body: JSON.stringify({ packageId, executionMode: 'live', dryRun: false }),
      })
      if (!envelope.ok) throw new Error(envelope.error?.message || 'La propagation n’a pas pu être préparée.')
    }, 'Préparer et activer immédiatement la propagation live ?')
  }

  async function activateExecution() {
    const runId = snapshot?.execution.propagationRunId
    if (!runId) {
      setError('Aucun run de propagation préparé n’est disponible.')
      return
    }
    await perform('Activation live', async () => {
      const envelope = await request<ApiEnvelope<unknown>>('/api/revenue-command-os/propagation/activate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ runId, acknowledgeControls: true }),
      })
      if (!envelope.ok) throw new Error(envelope.error?.message || 'Le run n’a pas pu être activé.')
    }, 'Activer immédiatement le run live et exécuter toutes les actions techniquement disponibles ?')
  }

  async function decideExecutionAction(decision: 'approve' | 'reject' | 'retry') {
    if (!reviewedAction) return
    const reason = actionReason.trim()
    if (reason.length < 3) {
      setError('Un motif opérationnel documenté est requis.')
      return
    }
    const endpoint = decision === 'approve'
      ? '/api/revenue-command-os/execution/approve'
      : decision === 'reject'
        ? '/api/revenue-command-os/execution/reject'
        : '/api/revenue-command-os/execution/retry'
    const label = decision === 'approve' ? 'Exécution de l’action' : decision === 'reject' ? 'Annulation de l’action' : 'Relance de l’action'
    await perform(label, async () => {
      const body = decision === 'approve'
        ? { actionId: reviewedAction.id, reason, conditions: [] }
        : { actionId: reviewedAction.id, reason }
      const envelope = await request<ApiEnvelope<unknown>>(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!envelope.ok) throw new Error(envelope.error?.message || `${label} impossible.`)
      setReviewedAction(null)
    }, `${label} ${reviewedAction.type} ?`)
  }

  return (
    <main className={styles.page} data-revenue-operating-spine="v1">
      <section className={styles.shell}>
        <header className={styles.commandHeader}>
          <div className={styles.commandIdentity}>
            <div className={styles.commandMark}><Command size={22} /></div>
            <div>
              <p className={styles.eyebrow}>ANGELCARE · REVENUE OPERATING SPINE</p>
              <h1>Du mandat au résultat, dans une seule chaîne de commandement.</h1>
              <p className={styles.commandSubtitle}>
                Une vue exécutive reliée aux runs Gemini, aux ressources consultées, aux stratégies, aux décisions,
                aux programmes, aux missions, aux actions et aux résultats.
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <StatusPill tone={snapshot?.externalActionsEnabled ? 'danger' : 'safe'}>
              {snapshot?.externalActionsEnabled ? 'Effets externes ouverts' : 'Effets externes sur approbation'}
            </StatusPill>
            <button className={styles.secondaryButton} onClick={() => load()} disabled={loading}>
              <RefreshCw size={16} className={loading ? styles.spin : ''} />
              Actualiser
            </button>
            <button className={styles.primaryButton} onClick={() => setLaunchOpen(true)}>
              <Sparkles size={16} />
              Lancer une opération revenu
            </button>
          </div>
        </header>

        {error ? <Notice tone="danger" onClose={() => setError('')}>{error}</Notice> : null}
        {success ? <Notice tone="success" onClose={() => setSuccess('')}>{success}</Notice> : null}

        <nav className={styles.viewTabs} aria-label="Vues du Revenue Operating Spine">
          {viewTabs.map(({ key, label, icon: Icon }) => (
            <button key={key} className={activeView === key ? styles.activeTab : styles.tab} onClick={() => setActiveView(key)}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {loading && !snapshot ? <LoadingState /> : snapshot ? (
          <>
            <StageRail stages={snapshot.stages} onSelect={selectStageView(setActiveView)} />
            <BoardBrief snapshot={snapshot} />
            <section className={styles.workspace}>
              {activeView === 'command' ? (
                <CommandView
                  snapshot={snapshot}
                  selectedStrategy={selectedStrategy}
                  onLaunch={() => setLaunchOpen(true)}
                  onSelectView={setActiveView}
                />
              ) : activeView === 'intelligence' ? (
                <IntelligenceView snapshot={snapshot} onLaunch={() => setLaunchOpen(true)} />
              ) : activeView === 'strategies' ? (
                <StrategiesView
                  snapshot={snapshot}
                  selectedStrategyId={selectedStrategyId}
                  onSelectStrategy={setSelectedStrategyId}
                  onLaunch={() => setLaunchOpen(true)}
                  onRunCouncil={runCouncil}
                  busy={Boolean(action)}
                />
              ) : activeView === 'decision' ? (
                <DecisionView
                  snapshot={snapshot}
                  selectedStrategy={selectedStrategy}
                  selectedStrategyId={selectedStrategyId}
                  onSelectStrategy={setSelectedStrategyId}
                  reason={decisionReason}
                  onReasonChange={setDecisionReason}
                  onRunCouncil={runCouncil}
                  onApprove={approveStrategy}
                  onCompile={compileStrategy}
                  busy={Boolean(action)}
                />
              ) : activeView === 'execution' ? (
                <ExecutionView
                  snapshot={snapshot}
                  onPrepare={prepareExecution}
                  onActivate={activateExecution}
                  onReviewAction={setReviewedAction}
                  busy={Boolean(action)}
                />
              ) : activeView === 'learning' ? (
                <LearningView snapshot={snapshot} />
              ) : (
                <AuditView snapshot={snapshot} />
              )}
            </section>
          </>
        ) : <LoadingState />}

        {launchOpen ? (
          <LaunchOperationModal
            value={launch}
            onChange={setLaunch}
            onClose={() => setLaunchOpen(false)}
            onSubmit={launchOperation}
            busy={Boolean(action)}
          />
        ) : null}
        {reviewedAction ? (
          <ExecutionActionModal
            action={reviewedAction}
            reason={actionReason}
            onReasonChange={setActionReason}
            onClose={() => setReviewedAction(null)}
            onDecision={decideExecutionAction}
            busy={Boolean(action)}
          />
        ) : null}
      </section>
    </main>
  )
}

function StageRail({ stages, onSelect }: { stages: RevenueOperatingStage[]; onSelect: (stage: RevenueOperatingStage) => void }) {
  return (
    <section className={styles.stageRail} aria-label="Chaîne stratégique">
      {stages.map((stage, index) => (
        <button key={stage.key} className={styles.stageCard} data-state={stage.state} onClick={() => onSelect(stage)}>
          <span className={styles.stageNumber}>{String(index + 1).padStart(2, '0')}</span>
          <span className={styles.stageBody}>
            <strong>{stage.label}</strong>
            <small>{stage.summary}</small>
          </span>
          <span className={styles.stageCount}>{stage.count}</span>
          {index < stages.length - 1 ? <ChevronRight className={styles.stageArrow} size={15} /> : null}
        </button>
      ))}
    </section>
  )
}

function BoardBrief({ snapshot }: { snapshot: RevenueOperatingSpineSnapshot }) {
  const brief = snapshot.boardBrief
  const facts = [
    ['Ce que nous cherchons à gagner', brief.tryingToWin, Target],
    ['Ce que le moteur a réellement fait', brief.engineWork, Bot],
    ['Recommandation actuelle', brief.recommendation, Sparkles],
    ['Bénéfice attendu', brief.expectedBenefit, CircleDollarSign],
    ['Position de preuve', brief.evidencePosition, FileCheck2],
    ['Blocage ou risque', brief.blockedOrAtRisk, AlertTriangle],
    ['Décision attendue', brief.decisionRequired, ShieldCheck],
    ['Prochaine action', brief.nextAction, ArrowRight],
  ] as const
  return (
    <section className={styles.boardBrief}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>BOARD COMMAND BRIEF</p>
          <h2>Ce que la Direction doit comprendre maintenant</h2>
        </div>
        <span className={styles.timestamp}>Actualisé {new Date(snapshot.generatedAt).toLocaleString('fr-FR')}</span>
      </div>
      <div className={styles.briefGrid}>
        {facts.map(([label, value, Icon], index) => (
          <article className={styles.briefCard} data-critical={index === 5 || index === 6 ? 'true' : 'false'} key={label}>
            <div className={styles.briefIcon}><Icon size={17} /></div>
            <div><p>{label}</p><strong>{value}</strong></div>
          </article>
        ))}
      </div>
    </section>
  )
}

function CommandView({
  snapshot,
  selectedStrategy,
  onLaunch,
  onSelectView,
}: {
  snapshot: RevenueOperatingSpineSnapshot
  selectedStrategy?: RevenueOperatingStrategy
  onLaunch: () => void
  onSelectView: (view: SpineView) => void
}) {
  return (
    <div className={styles.twoColumn}>
      <section className={styles.panel}>
        <SectionTitle eyebrow="MANDAT ACTIF" title={snapshot.objective?.title || 'Aucun mandat revenu actif'} icon={<Target size={18} />} />
        {snapshot.objective ? (
          <>
            <p className={styles.lead}>{snapshot.objective.mandate}</p>
            <div className={styles.metricGrid}>
              <Metric label="Business unit" value={snapshot.objective.businessUnit} />
              <Metric label="Marché" value={snapshot.objective.targetMarket} />
              <Metric label="Horizon" value={snapshot.objective.horizon} />
              <Metric label="Priorité" value={snapshot.objective.priority} />
              <Metric label="Cible revenu" value={money(snapshot.objective.revenueTarget)} />
              <Metric label="Marge minimale" value={percent(snapshot.objective.marginTarget)} />
            </div>
          </>
        ) : (
          <Empty title="Le système attend un mandat précis" description="Formalisez le résultat commercial, les segments, les territoires, les contraintes et les critères de succès, puis lancez Gemini." action={<button className={styles.primaryButton} onClick={onLaunch}>Créer et lancer le mandat</button>} />
        )}
      </section>
      <section className={styles.panel}>
        <SectionTitle eyebrow="POSITION STRATÉGIQUE" title={selectedStrategy ? selectedStrategy.code : 'Aucune recommandation'} icon={<Sparkles size={18} />} />
        {selectedStrategy ? (
          <>
            <p className={styles.lead}>{selectedStrategy.thesis}</p>
            <div className={styles.inlineFacts}>
              <StatusPill tone="info">Confiance {selectedStrategy.confidence}%</StatusPill>
              <StatusPill tone="neutral">{selectedStrategy.commandPortfolio.length} commandes</StatusPill>
              <StatusPill tone={selectedStrategy.risks.length ? 'warning' : 'safe'}>{selectedStrategy.risks.length} risques</StatusPill>
            </div>
            <div className={styles.actionRow}>
              <button className={styles.primaryButton} onClick={() => onSelectView('strategies')}>Comparer les stratégies <ArrowRight size={15} /></button>
              <button className={styles.secondaryButton} onClick={() => onSelectView('decision')}>Ouvrir la décision</button>
            </div>
          </>
        ) : (
          <Empty title="Aucune stratégie persistée" description="Le mandat existe, mais aucun run gouverné n’a encore produit d’alternatives stratégiques." action={<button className={styles.primaryButton} onClick={onLaunch}>Lancer Gemini</button>} />
        )}
      </section>
      <section className={`${styles.panel} ${styles.fullSpan}`}>
        <SectionTitle eyebrow="COMMANDES DE DIRECTION" title="Ce qui demande une action humaine" icon={<UsersRound size={18} />} />
        <div className={styles.managementGrid}>
          {snapshot.stages.filter((stage) => ['active', 'ready', 'blocked'].includes(stage.state)).map((stage) => (
            <article key={stage.key} className={styles.managementCard} data-state={stage.state}>
              <div>
                <p>{stage.label}</p>
                <strong>{stage.nextAction || stage.summary}</strong>
                {stage.blocker ? <small>{stage.blocker}</small> : null}
              </div>
              <Link href={stage.href} className={styles.iconButton} aria-label={`Ouvrir ${stage.label}`}><ArrowRight size={16} /></Link>
            </article>
          ))}
          {!snapshot.stages.some((stage) => ['active', 'ready', 'blocked'].includes(stage.state)) ? (
            <Empty title="Aucune intervention immédiate" description="La chaîne ne remonte actuellement aucun gate actif ou bloqué." />
          ) : null}
        </div>
      </section>
    </div>
  )
}

function IntelligenceView({ snapshot, onLaunch }: { snapshot: RevenueOperatingSpineSnapshot; onLaunch: () => void }) {
  return (
    <div className={styles.stack}>
      <section className={styles.panel}>
        <div className={styles.sectionHeading}>
          <SectionTitle eyebrow="AI ORCHESTRATION LEDGER" title="Ce que Gemini et les ressources AngelCare ont réellement fait" icon={<Bot size={18} />} />
          <button className={styles.primaryButton} onClick={onLaunch}><Play size={15} /> Nouveau run gouverné</button>
        </div>
        <p className={styles.explainer}>
          Les données AngelCare sont d’abord lues par les adaptateurs de contexte internes. Gemini reçoit ensuite ce contexte gouverné et les commandes éligibles.
          Le nombre d’appels d’outils natifs Gemini reste affiché séparément pour ne jamais confondre lecture interne et tool-calling fournisseur.
        </p>
        {snapshot.aiRuns.length ? (
          <div className={styles.ledger}>
            {snapshot.aiRuns.map((run) => (
              <article key={run.id} className={styles.runCard} data-status={run.status}>
                <div className={styles.runHeader}>
                  <div>
                    <p className={styles.mono}>RUN {run.id}</p>
                    <h3>{run.provider} · {run.model}</h3>
                  </div>
                  <StatusPill tone={run.status === 'completed' ? 'safe' : run.status === 'failed' ? 'danger' : 'warning'}>{run.status}</StatusPill>
                </div>
                <div className={styles.runMetrics}>
                  <Metric label="Stratégies" value={String(run.strategyCount)} />
                  <Metric label="Commandes sélectionnées" value={String(run.selectedCommandCount)} />
                  <Metric label="Faits de contexte" value={String(run.contextFactCount)} />
                  <Metric label="Hypothèses" value={String(run.hypothesisCount)} />
                  <Metric label="Inconnues" value={String(run.unknownCount)} />
                  <Metric label="Contradictions" value={String(run.contradictionCount)} />
                  <Metric label="Tool calls Gemini" value={String(run.providerNativeToolCalls)} />
                  <Metric label="Effets externes" value={String(run.externalActions)} />
                </div>
                <div className={styles.resourceLine}>
                  <strong>Ressources consultées</strong>
                  <div>{run.localResources.length ? run.localResources.map((resource) => <span key={resource}>{resource}</span>) : <em>Aucune trace ressource persistée pour ce run historique.</em>}</div>
                </div>
                <div className={styles.runFooter}>
                  <span>{run.promptCode || 'Prompt'} · v{run.promptVersion || '—'}</span>
                  <span>{run.inputTokens + run.outputTokens} tokens · {duration(run.durationMs)}</span>
                  <span>{run.fallbackUsed ? 'Fallback utilisé' : 'Provider principal'}</span>
                </div>
                {run.error ? <p className={styles.errorText}>{run.error}</p> : null}
              </article>
            ))}
          </div>
        ) : <Empty title="Aucun run Gemini gouverné" description="Lancez une opération revenu pour produire un run traçable avec contexte, commandes, stratégies, usage et résultats." action={<button className={styles.primaryButton} onClick={onLaunch}>Lancer le premier run</button>} />}
      </section>
    </div>
  )
}

function StrategiesView({
  snapshot,
  selectedStrategyId,
  onSelectStrategy,
  onLaunch,
  onRunCouncil,
  busy,
}: {
  snapshot: RevenueOperatingSpineSnapshot
  selectedStrategyId: string
  onSelectStrategy: (id: string) => void
  onLaunch: () => void
  onRunCouncil: () => void
  busy: boolean
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeading}>
        <SectionTitle eyebrow="STRATEGY PORTFOLIO" title="Alternatives réelles, comparables et reliées au mandat" icon={<Sparkles size={18} />} />
        <div className={styles.actionRow}>
          <button className={styles.secondaryButton} onClick={onLaunch}><RefreshCw size={15} /> Réassembler</button>
          <button className={styles.primaryButton} disabled={!selectedStrategyId || busy} onClick={onRunCouncil}><ShieldCheck size={15} /> Soumettre au Conseil</button>
        </div>
      </div>
      {snapshot.strategies.length ? (
        <div className={styles.strategyGrid}>
          {snapshot.strategies.map((strategy) => (
            <button key={strategy.id} className={selectedStrategyId === strategy.id ? styles.selectedStrategy : styles.strategyCard} onClick={() => onSelectStrategy(strategy.id)}>
              <div className={styles.strategyHeader}>
                <div><p>{strategy.code}</p><h3>{strategy.archetype}</h3></div>
                <div className={styles.confidence}>{strategy.confidence}%</div>
              </div>
              <p className={styles.strategyThesis}>{strategy.thesis}</p>
              <div className={styles.inlineFacts}>
                {strategy.recommended ? <StatusPill tone="info">Recommandée</StatusPill> : null}
                <StatusPill tone="neutral">{strategy.status}</StatusPill>
                <StatusPill tone={strategy.risks.length ? 'warning' : 'safe'}>{strategy.risks.length} risques</StatusPill>
              </div>
              <dl className={styles.strategyFacts}>
                <div><dt>Segments</dt><dd>{strategy.targetSegments.join(', ') || 'Non renseignés'}</dd></div>
                <div><dt>Valeur</dt><dd>{strategy.valueProposition}</dd></div>
                <div><dt>Commandes</dt><dd>{strategy.commandPortfolio.length}</dd></div>
                <div><dt>Scénarios</dt><dd>{strategy.scenarios.length}</dd></div>
              </dl>
            </button>
          ))}
        </div>
      ) : <Empty title="Aucune alternative stratégique" description="Cette vue ne montre plus une architecture vide. Elle attend un vrai run Gemini persisté et propose de le lancer immédiatement." action={<button className={styles.primaryButton} onClick={onLaunch}>Créer le mandat et lancer Gemini</button>} />}
    </section>
  )
}

function DecisionView({
  snapshot,
  selectedStrategy,
  selectedStrategyId,
  onSelectStrategy,
  reason,
  onReasonChange,
  onRunCouncil,
  onApprove,
  onCompile,
  busy,
}: {
  snapshot: RevenueOperatingSpineSnapshot
  selectedStrategy?: RevenueOperatingStrategy
  selectedStrategyId: string
  onSelectStrategy: (id: string) => void
  reason: string
  onReasonChange: (value: string) => void
  onRunCouncil: () => void
  onApprove: () => void
  onCompile: () => void
  busy: boolean
}) {
  return (
    <div className={styles.twoColumn}>
      <section className={styles.panel}>
        <SectionTitle eyebrow="DOSSIER À ARBITRER" title={selectedStrategy?.code || 'Sélectionnez une stratégie'} icon={<ShieldCheck size={18} />} />
        {snapshot.strategies.length ? (
          <>
            <label className={styles.fieldLabel}>Stratégie active
              <select className={styles.input} value={selectedStrategyId} onChange={(event) => onSelectStrategy(event.target.value)}>
                {snapshot.strategies.map((strategy) => <option key={strategy.id} value={strategy.id}>{strategy.code} · {strategy.archetype}</option>)}
              </select>
            </label>
            <p className={styles.lead}>{selectedStrategy?.thesis}</p>
          </>
        ) : <Empty title="Aucun dossier stratégique" description="Le Conseil ne peut pas délibérer sans stratégie persistée." />}
      </section>
      <section className={styles.panel}>
        <SectionTitle eyebrow="CONSEIL INDÉPENDANT" title={snapshot.council.runId ? `Run ${snapshot.council.runId.slice(0, 8)}` : 'Aucune délibération'} icon={<UsersRound size={18} />} />
        <div className={styles.metricGrid}>
          <Metric label="Statut" value={snapshot.council.status} />
          <Metric label="Classification" value={snapshot.council.classification || '—'} />
          <Metric label="Agents terminés" value={String(snapshot.council.completedAgents)} />
          <Metric label="Constats bloquants" value={String(snapshot.council.blockingFindings)} />
        </div>
        {snapshot.council.topFindings.length ? <ul className={styles.findingList}>{snapshot.council.topFindings.map((finding) => <li key={finding}>{finding}</li>)}</ul> : null}
        <button className={styles.primaryButton} disabled={!selectedStrategy || busy} onClick={onRunCouncil}><ShieldCheck size={15} /> {snapshot.council.runId ? 'Relancer le Conseil' : 'Lancer le Conseil'}</button>
      </section>
      <section className={styles.panel}>
        <SectionTitle eyebrow="DÉCISION EXÉCUTIVE" title={snapshot.decision.decisionId ? `Décision ${snapshot.decision.status}` : 'Décision humaine requise'} icon={<BadgeCheck size={18} />} />
        <label className={styles.fieldLabel}>Motif et instruction
          <textarea className={styles.textarea} value={reason} onChange={(event) => onReasonChange(event.target.value)} />
        </label>
        <div className={styles.metricGrid}>
          <Metric label="Classe" value={snapshot.decision.approvalClass || 'standard'} />
          <Metric label="Conditions" value={String(snapshot.decision.conditions.length)} />
        </div>
        <button className={styles.successButton} disabled={!selectedStrategy || !snapshot.council.runId || busy} onClick={onApprove}><CheckCircle2 size={15} /> Approuver avec trace</button>
        {!snapshot.council.runId ? <p className={styles.helper}>Le Conseil doit d’abord produire un dossier de délibération.</p> : null}
      </section>
      <section className={styles.panel}>
        <SectionTitle eyebrow="COMPILATION" title={snapshot.compilation.runId ? `Run ${snapshot.compilation.runId.slice(0, 8)}` : 'Transformer la décision en travail'} icon={<GitBranch size={18} />} />
        <div className={styles.metricGrid}>
          <Metric label="Programmes" value={String(snapshot.compilation.programs)} />
          <Metric label="Campagnes" value={String(snapshot.compilation.campaigns)} />
          <Metric label="Waves" value={String(snapshot.compilation.waves)} />
          <Metric label="Missions" value={String(snapshot.compilation.missions)} />
          <Metric label="Tâches" value={String(snapshot.compilation.tasks)} />
          <Metric label="Conflits" value={String(snapshot.compilation.conflicts)} />
        </div>
        <button className={styles.primaryButton} disabled={!selectedStrategy || !snapshot.decision.decisionId || busy} onClick={onCompile}><GitBranch size={15} /> Compiler le dossier approuvé</button>
        {!snapshot.decision.decisionId ? <p className={styles.helper}>Une décision formelle est requise avant compilation.</p> : null}
      </section>
    </div>
  )
}

function ExecutionView({
  snapshot,
  onPrepare,
  onActivate,
  onReviewAction,
  busy,
}: {
  snapshot: RevenueOperatingSpineSnapshot
  onPrepare: () => void
  onActivate: () => void
  onReviewAction: (action: ExecutionActionItem) => void
  busy: boolean
}) {
  const programs = snapshot.programs
  const missions = snapshot.missions
  return (
    <div className={styles.stack}>
      <section className={styles.panel}>
        <div className={styles.sectionHeading}>
          <SectionTitle eyebrow="EXECUTION CONTROL" title="Du package compilé aux actions gouvernées" icon={<Rocket size={18} />} />
          <div className={styles.actionRow}>
            <button className={styles.secondaryButton} disabled={!snapshot.compilation.packageId || busy} onClick={onPrepare}>
              <Rocket size={15} /> Préparer
            </button>
            <button className={styles.primaryButton} disabled={!snapshot.execution.propagationRunId || busy} onClick={onActivate}>
              <Play size={15} /> Activer sous contrôle
            </button>
          </div>
        </div>
        <div className={styles.metricGridWide}>
          <Metric label="Package" value={snapshot.compilation.packageId ? snapshot.compilation.packageId.slice(0, 8) : '—'} />
          <Metric label="Propagation" value={snapshot.execution.status} />
          <Metric label="Adaptateurs sains" value={`${snapshot.execution.adaptersHealthy}/${snapshot.execution.adaptersDeclared}`} />
          <Metric label="Approbations" value={String(snapshot.execution.awaitingApproval)} />
          <Metric label="Réussies" value={String(snapshot.execution.succeeded)} />
          <Metric label="Échecs" value={String(snapshot.execution.failed)} />
          <Metric label="Dead letters" value={String(snapshot.execution.deadLetters)} />
          <Metric label="Effets externes" value={String(snapshot.execution.externalActions)} />
        </div>
        <p className={styles.helper}>
          L’activation lance immédiatement les actions disponibles; seules les erreurs techniques réelles peuvent interrompre le flux.
        </p>
      </section>
      <div className={styles.twoColumn}>
        <section className={styles.panel}>
          <SectionTitle eyebrow="PROGRAMMES" title={`${programs.length} programme(s) persisté(s)`} icon={<Layers3 size={18} />} />
          <EntityTable rows={programs} emptyTitle="Aucun programme compilé" />
        </section>
        <section className={styles.panel}>
          <SectionTitle eyebrow="MISSIONS" title={`${missions.length} mission(s) persistée(s)`} icon={<Network size={18} />} />
          <EntityTable rows={missions} emptyTitle="Aucune mission compilée" />
        </section>
      </div>
      <section className={styles.panel}>
        <SectionTitle eyebrow="ACTION LEDGER" title="Actions préparées, approuvées, exécutées et échouées" icon={<Zap size={18} />} />
        {snapshot.execution.latestActions.length ? (
          <div className={styles.actionLedger}>
            {snapshot.execution.latestActions.map((item) => (
              <article key={item.id}>
                <div>
                  <p>{item.type}</p>
                  <strong>{item.target}</strong>
                  {item.lastError ? <small className={styles.errorText}>{item.lastError}</small> : null}
                </div>
                <span>{item.adapter}</span>
                <StatusPill tone={item.status.includes('fail') || item.status === 'dead_letter' ? 'danger' : item.status.includes('success') ? 'safe' : 'warning'}>
                  {item.status}
                </StatusPill>
                <small>{item.externalAction ? 'Externe · approbation stricte' : 'Interne gouvernée'}</small>
                <button className={styles.secondaryButton} onClick={() => onReviewAction(item)}>
                  <FileCheck2 size={14} /> Examiner
                </button>
              </article>
            ))}
          </div>
        ) : <Empty title="Aucune action gouvernée" description="Le ledger restera vide tant qu’un package approuvé n’aura pas été préparé pour propagation." />}
      </section>
    </div>
  )
}

function LearningView({ snapshot }: { snapshot: RevenueOperatingSpineSnapshot }) {
  const outcome = snapshot.outcomes
  return (
    <div className={styles.twoColumn}>
      <section className={styles.panel}>
        <SectionTitle eyebrow="OUTCOME LEDGER" title="Ce que l’organisation a réellement obtenu" icon={<BarChart3 size={18} />} />
        <div className={styles.metricGrid}>
          <Metric label="Résultats stratégie" value={String(outcome.outcomes)} />
          <Metric label="Expériences" value={String(outcome.experiments)} />
          <Metric label="Attributions" value={String(outcome.attributionEvents)} />
          <Metric label="Feedbacks" value={String(outcome.feedbackRecords)} />
          <Metric label="Winning plays" value={String(outcome.winningPlays)} />
        </div>
        <p className={styles.lead}>{outcome.latestOutcome || 'Aucun résultat mesuré n’est encore persisté.'}</p>
      </section>
      <section className={styles.panel}>
        <SectionTitle eyebrow="LEARNING DECISION" title="Ce qui doit être renforcé, corrigé ou arrêté" icon={<BrainCircuit size={18} />} />
        <p className={styles.lead}>{outcome.latestLearning || 'L’apprentissage commencera lorsque des résultats attribuables seront enregistrés.'}</p>
        {!outcome.outcomes ? <Empty title="Aucune preuve de résultat" description="Le système ne présentera pas de winning play fictif. Les résultats doivent provenir de l’exécution et de l’attribution." /> : null}
      </section>
    </div>
  )
}

function AuditView({ snapshot }: { snapshot: RevenueOperatingSpineSnapshot }) {
  const health = Object.entries(snapshot.sourceHealth)
  return (
    <div className={styles.twoColumn}>
      <section className={styles.panel}>
        <SectionTitle eyebrow="SOURCE HEALTH" title="Sources utilisées par la chaîne de commandement" icon={<Database size={18} />} />
        <div className={styles.healthList}>
          {health.map(([name, state]) => (
            <div key={name}><span className={state.ok ? styles.healthOk : styles.healthFail} /><strong>{name}</strong><small>{state.ok ? 'Disponible' : state.message || 'Indisponible'}</small></div>
          ))}
        </div>
      </section>
      <section className={styles.panel}>
        <SectionTitle eyebrow="EXCEPTIONS & RISKS" title={`${snapshot.exceptions.length} exception(s) visible(s)`} icon={<AlertTriangle size={18} />} />
        {snapshot.exceptions.length ? (
          <div className={styles.exceptionList}>
            {snapshot.exceptions.map((item) => (
              <article key={item.id}>
                <div><p>{item.title}</p><small>{item.impact}</small></div>
                <StatusPill tone={item.severity === 'critical' ? 'danger' : 'warning'}>{item.status}</StatusPill>
                <strong>{item.recommendedAction}</strong>
              </article>
            ))}
          </div>
        ) : <Empty title="Aucune exception persistée" description="Les sources chargées ne remontent actuellement aucune exception dans le périmètre autorisé." />}
        {snapshot.warnings.length ? <div className={styles.warningBox}>{snapshot.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div> : null}
      </section>
    </div>
  )
}

function ExecutionActionModal({
  action,
  reason,
  onReasonChange,
  onClose,
  onDecision,
  busy,
}: {
  action: ExecutionActionItem
  reason: string
  onReasonChange: (value: string) => void
  onClose: () => void
  onDecision: (decision: 'approve' | 'reject' | 'retry') => void
  busy: boolean
}) {
  const retryable = ['failed', 'retry_scheduled', 'dead_letter'].includes(action.status)
  const approvable = ['awaiting_approval', 'approval_required', 'pending_approval', 'prepared', 'draft', 'validated', 'ready'].includes(action.status)
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Piloter une action live">
      <section className={styles.actionModal}>
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>LIVE ACTION CONTROL</p>
            <h2>{action.type}</h2>
            <p>{action.target}</p>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        </header>
        <div className={styles.modalBody}>
          <div className={styles.actionReviewGrid}>
            <Metric label="Statut" value={action.status} />
            <Metric label="Adaptateur" value={action.adapter} />
            <Metric label="Périmètre" value={action.externalAction ? 'Action externe' : 'Action interne'} />
            <Metric label="Autorité" value="Complète" />
          </div>
          {action.lastError ? <Notice tone="danger">{action.lastError}</Notice> : null}
          <Field label="Motif et instruction" span>
            <textarea
              className={styles.textarea}
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Documenter la décision, les conditions et le résultat attendu."
              required
            />
          </Field>
          <p className={styles.helper}>
            L’opérateur peut exécuter, relancer ou annuler immédiatement cette action. Email OS et WhatsApp conservent leur fonctionnement actuel.
          </p>
        </div>
        <footer className={styles.modalFooter}>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>Fermer</button>
          {retryable ? (
            <button type="button" className={styles.primaryButton} onClick={() => onDecision('retry')} disabled={busy}>
              <RefreshCw size={15} /> Relancer
            </button>
          ) : null}
          {approvable ? (
            <>
              <button type="button" className={styles.dangerButton} onClick={() => onDecision('reject')} disabled={busy}>
                <X size={15} /> Annuler
              </button>
              <button type="button" className={styles.successButton} onClick={() => onDecision('approve')} disabled={busy}>
                <BadgeCheck size={15} /> Exécuter maintenant
              </button>
            </>
          ) : null}
        </footer>
      </section>
    </div>
  )
}

function LaunchOperationModal({
  value,
  onChange,
  onClose,
  onSubmit,
  busy,
}: {
  value: RevenueOperationLaunchInput
  onChange: (value: RevenueOperationLaunchInput) => void
  onClose: () => void
  onSubmit: (event: FormEvent) => void
  busy: boolean
}) {
  const update = <K extends keyof RevenueOperationLaunchInput,>(key: K, next: RevenueOperationLaunchInput[K]) => onChange({ ...value, [key]: next })
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Lancer une opération revenu">
      <form className={styles.modal} onSubmit={onSubmit}>
        <header className={styles.modalHeader}>
          <div><p className={styles.eyebrow}>LIVE REVENUE OPERATION</p><h2>Définir le mandat et lancer Gemini</h2><p>Le run assemble le contexte AngelCare, exécute les commandes et rend immédiatement les résultats disponibles.</p></div>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        </header>
        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <Field label="Objectif revenu" span><input className={styles.input} value={value.title} onChange={(event) => update('title', event.target.value)} placeholder="Ex. Générer 1 500 000 Dh de pipeline B2B qualifié" required /></Field>
            <Field label="Mandat exécutif" span><textarea className={styles.textarea} value={value.mandate} onChange={(event) => update('mandate', event.target.value)} placeholder="Pourquoi ce résultat est prioritaire, ce qui doit changer et ce qui est exclu." required /></Field>
            <Field label="Business unit"><input className={styles.input} value={value.businessUnit} onChange={(event) => update('businessUnit', event.target.value)} required /></Field>
            <Field label="Marché cible"><input className={styles.input} value={value.targetMarket} onChange={(event) => update('targetMarket', event.target.value)} required /></Field>
            <Field label="Segments cibles"><input className={styles.input} value={value.targetSegments.join(', ')} onChange={(event) => update('targetSegments', split(event.target.value))} required /></Field>
            <Field label="Territoires"><input className={styles.input} value={value.territories.join(', ')} onChange={(event) => update('territories', split(event.target.value))} required /></Field>
            <Field label="Comptes nommés"><input className={styles.input} value={value.targetAccounts.join(', ')} onChange={(event) => update('targetAccounts', split(event.target.value))} placeholder="Optionnel" /></Field>
            <Field label="Offres autorisées"><input className={styles.input} value={value.approvedOffers.join(', ')} onChange={(event) => update('approvedOffers', split(event.target.value))} placeholder="Optionnel; le Digital Twin reste source de vérité" /></Field>
            <Field label="Cible revenu (Dh)"><input className={styles.input} type="number" min="0" value={value.revenueTarget ?? ''} onChange={(event) => update('revenueTarget', numberOrUndefined(event.target.value))} /></Field>
            <Field label="Marge minimale (%)"><input className={styles.input} type="number" min="0" max="100" value={value.marginTarget ?? ''} onChange={(event) => update('marginTarget', numberOrUndefined(event.target.value))} /></Field>
            <Field label="Horizon"><input className={styles.input} value={value.horizon} onChange={(event) => update('horizon', event.target.value)} required /></Field>
            <Field label="Échéance"><input className={styles.input} type="datetime-local" value={value.deadline || ''} onChange={(event) => update('deadline', event.target.value || undefined)} /></Field>
            <Field label="Priorité"><select className={styles.input} value={value.priority} onChange={(event) => update('priority', event.target.value as RevenueOperationLaunchInput['priority'])}><option value="normal">Normale</option><option value="high">Haute</option><option value="critical">Critique</option><option value="low">Basse</option></select></Field>
            <Field label="Appétit de risque"><select className={styles.input} value={value.riskAppetite} onChange={(event) => update('riskAppetite', event.target.value as RevenueOperationLaunchInput['riskAppetite'])}><option value="conservative">Conservateur</option><option value="balanced">Équilibré</option><option value="aggressive">Agressif</option></select></Field>
            <Field label="Canaux autorisés" span><input className={styles.input} value={value.approvedChannels.join(', ')} onChange={(event) => update('approvedChannels', split(event.target.value))} required /></Field>
            <Field label="Contraintes" span><textarea className={styles.textarea} value={value.constraints.join('\n')} onChange={(event) => update('constraints', lines(event.target.value))} /></Field>
            <Field label="Critères de succès" span><textarea className={styles.textarea} value={value.successDefinition.join('\n')} onChange={(event) => update('successDefinition', lines(event.target.value))} required /></Field>
            <Field label="Conditions d’échec / stop" span><textarea className={styles.textarea} value={value.failureDefinition.join('\n')} onChange={(event) => update('failureDefinition', lines(event.target.value))} required /></Field>
          </div>
        </div>
        <footer className={styles.modalFooter}>
          <div><ShieldCheck size={16} /><span>LIVE · autorité complète · Email OS actuel · WhatsApp actuel · Calendar désactivé</span></div>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>Annuler</button>
          <button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? <Loader2 className={styles.spin} size={16} /> : <Sparkles size={16} />} Lancer le run live</button>
        </footer>
      </form>
    </div>
  )
}

function Field({ label, span, children }: { label: string; span?: boolean; children: ReactNode }) {
  return <label className={`${styles.fieldLabel} ${span ? styles.formSpan : ''}`}>{label}{children}</label>
}

function SectionTitle({ eyebrow, title, icon }: { eyebrow: string; title: string; icon: ReactNode }) {
  return <div className={styles.titleBlock}><div className={styles.titleIcon}>{icon}</div><div><p className={styles.eyebrow}>{eyebrow}</p><h2>{title}</h2></div></div>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className={styles.metric}><span>{label}</span><strong>{value || '—'}</strong></div>
}

function StatusPill({ tone, children }: { tone: 'safe' | 'warning' | 'danger' | 'info' | 'neutral'; children: ReactNode }) {
  return <span className={styles.statusPill} data-tone={tone}>{children}</span>
}

function Notice({ tone, children, onClose }: { tone: 'danger' | 'success'; children: ReactNode; onClose?: () => void }) {
  return (
    <div className={styles.notice} data-tone={tone}>
      {tone === 'danger' ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
      <span>{children}</span>
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="Fermer la notification">
          <X size={15} />
        </button>
      ) : null}
    </div>
  )
}

function Empty({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className={styles.empty}><div className={styles.emptyIcon}><Activity size={18} /></div><h3>{title}</h3><p>{description}</p>{action ? <div className={styles.emptyAction}>{action}</div> : null}</div>
}

function LoadingState() {
  return <div className={styles.loading}><Loader2 className={styles.spin} size={28} /><strong>Construction de la situation revenue gouvernée…</strong><span>Lecture du mandat, des runs Gemini, des stratégies, des décisions, de l’exécution et des résultats.</span></div>
}

function EntityTable({ rows, emptyTitle }: { rows: Array<Record<string, unknown>>; emptyTitle: string }) {
  if (!rows.length) return <Empty title={emptyTitle} description="Aucun objet persistant n’est disponible. Le système ne remplace pas cette absence par une démonstration fictive." />
  return <div className={styles.entityTable}>{rows.slice(0, 12).map((row, index) => {
    const title = String(row.title || row.name || row.code || `Objet ${index + 1}`)
    const code = String(row.code || row.id || '')
    const status = String(row.status || 'unknown')
    const owner = String(row.owner || row.ownerRole || row.owner_role || 'Non affecté')
    return <article key={String(row.id || code || index)}><div><p>{title}</p><small>{code}</small></div><span>{owner}</span><StatusPill tone={status.includes('block') || status.includes('fail') ? 'danger' : status.includes('active') || status.includes('complete') ? 'safe' : 'neutral'}>{status}</StatusPill></article>
  })}</div>
}

function selectStageView(setView: (view: SpineView) => void) {
  return (stage: RevenueOperatingStage) => {
    if (stage.key === 'objective') setView('command')
    else if (stage.key === 'intelligence') setView('intelligence')
    else if (stage.key === 'strategy') setView('strategies')
    else if (['council', 'decision', 'compilation'].includes(stage.key)) setView('decision')
    else if (stage.key === 'execution') setView('execution')
    else setView('learning')
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store' })
  const text = await response.text()
  let payload: any = {}
  try { payload = text ? JSON.parse(text) : {} } catch { payload = { error: { message: text || `Erreur HTTP ${response.status}` } } }
  if (!response.ok) throw new Error(payload?.error?.message || payload?.message || `Erreur HTTP ${response.status}`)
  return payload as T
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function split(value: string): string[] {
  return value.split(/[,;]/).map((item) => item.trim()).filter(Boolean)
}

function lines(value: string): string[] {
  return value.split(/\n/).map((item) => item.trim()).filter(Boolean)
}

function numberOrUndefined(value: string): number | undefined {
  if (!value) return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function money(value?: number): string {
  if (value == null) return 'Non renseignée'
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} Dh`
}

function percent(value?: number): string {
  if (value == null) return 'Non renseignée'
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value <= 1 ? value * 100 : value)} %`
}

function duration(value?: number): string {
  if (!value) return 'Durée non renseignée'
  return value < 1000 ? `${value} ms` : `${(value / 1000).toFixed(1)} s`
}
