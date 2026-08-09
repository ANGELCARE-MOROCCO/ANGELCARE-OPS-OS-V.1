'use client'

import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Database,
  FileSearch,
  Gauge,
  GitBranch,
  Globe2,
  History,
  KeyRound,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Network,
  Pause,
  Play,
  Plus,
  Radar,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ServerCog,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TimerReset,
  TriangleAlert,
  Workflow,
  X,
  Zap,
} from 'lucide-react'
import type {
  JsonRecord,
  ResearchAgent,
  ResearchAlert,
  ResearchControlSnapshot,
  ResearchFinding,
  ResearchProviderPolicy,
  ResearchRun,
  ResearchRunEvent,
} from '@/lib/market-os/content-research/types'
import styles from './research-control.module.css'
import { contentCommandRequest } from '@/components/market-os/content-command/runtime/content-command-runtime'

type TabKey = 'cockpit' | 'chain' | 'agents' | 'providers' | 'frequency' | 'quotas' | 'policies' | 'materialization' | 'runs' | 'alerts' | 'audit'
type ApiPayload = { ok: boolean; snapshot?: ResearchControlSnapshot & { audit?: Array<Record<string, unknown>> }; runtimeDefaults?: JsonRecord; result?: unknown; health?: JsonRecord; error?: string }


type ProviderDraft = {
  enabled: boolean
  status: string
  maxRequestsPerDay: string
  maxRequestsPerMonth: string
  maxResultsPerCall: string
  maxOutputTokens: string
}

type AgentForm = {
  name: string
  purpose: string
  ownerName: string
  status: string
  priority: string
  workspaceScopes: string
  contentFamilies: string
  services: string
  audiences: string
  cities: string
  languages: string
  topics: string
  excludedTopics: string
  frequency: string
  timezone: string
  hour: string
  minute: string
  intervalMinutes: string
  skipWhenNoMeaningfulChange: boolean
  maxSearchCallsPerDay: string
  maxSearchCallsPerMonth: string
  maxAnalysesPerDay: string
  maxAnalysesPerMonth: string
  searchDepth: string
  maxResults: string
  timeRange: string
  country: string
  allowedDomains: string
  blockedDomains: string
  model: string
  maxSources: string
  maxSourceCharacters: string
  maxOutputTokens: string
  schemaRepairAttempts: string
  minimumEvidenceConfidence: string
  minimumRelevance: string
  minimumBusinessFit: string
  minimumOpportunityScore: string
  createCanonicalSources: boolean
  createSignals: boolean
  createContentOpportunities: boolean
  createStrategicCandidates: boolean
  createBriefEnrichment: boolean
  createEditorialSuggestions: boolean
  createInternalTasks: boolean
  createEvidenceRequests: boolean
  createReviewObservations: boolean
  updateDossier360: boolean
  alertCommandement: boolean
}

const tabs: Array<{ key: TabKey; label: string; hint: string; icon: React.ReactNode }> = [
  { key: 'cockpit', label: 'Cockpit', hint: 'Position runtime', icon: <Gauge /> },
  { key: 'chain', label: 'Chaîne', hint: 'Flux de recherche', icon: <GitBranch /> },
  { key: 'agents', label: 'Agents', hint: 'Flotte Content Command', icon: <Bot /> },
  { key: 'providers', label: 'Fournisseurs', hint: 'Tavily & OpenRouter', icon: <ServerCog /> },
  { key: 'frequency', label: 'Fréquences', hint: 'Cadences et fenêtres', icon: <CalendarClock /> },
  { key: 'quotas', label: 'Quotas', hint: 'Capacité gouvernée', icon: <BarChart3 /> },
  { key: 'policies', label: 'Politiques', hint: 'Recherche & analyse', icon: <SlidersHorizontal /> },
  { key: 'materialization', label: 'Création interne', hint: 'Actions Content Command', icon: <Workflow /> },
  { key: 'runs', label: 'Runs', hint: 'Exécutions & résultats', icon: <Activity /> },
  { key: 'alerts', label: 'Alertes', hint: 'Interventions', icon: <TriangleAlert /> },
  { key: 'audit', label: 'Audit', hint: 'Versions & décisions', icon: <History /> },
]

const agentTypeLabels: Record<string, string> = {
  observatory_intelligence: 'Intelligence Observatoire',
  strategic_research: 'Recherche stratégique',
  brief_enrichment: 'Enrichissement Brief',
  editorial_intelligence: 'Intelligence éditoriale',
  brand_claims_research: 'Marque & Claims',
  creative_research: 'Recherche créative',
  source_integrity: 'Intégrité sources',
  evidence_research: 'Recherche preuves',
  review_assistance: 'Assistance révision',
  publication_readiness: 'Readiness publication',
}

const runStatusLabels: Record<string, string> = {
  queued: 'En attente', searching_tavily: 'Recherche Tavily', searching_searxng_fallback: 'Fallback SearXNG', sources_normalized: 'Sources normalisées', sources_persisted: 'Sources persistées', analyzing_openrouter: 'Analyse OpenRouter', validating_findings: 'Validation constats', materializing_internal: 'Création interne', completed: 'Terminé', completed_without_opportunities: 'Terminé sans constat', partially_completed: 'Partiel', blocked_no_search_provider: 'Recherche bloquée', failed_source_persistence: 'Échec sources', failed_analysis_provider: 'Échec analyse', failed_schema_validation: 'Schéma invalide', failed: 'Échec', cancelled: 'Annulé',
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function list(value: unknown) {
  return Array.isArray(value) ? value.map(String) : []
}

function csv(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function formatDate(value: string | null | undefined, withTime = true) {
  if (!value) return 'Non planifié'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(date)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value)
}

function statusTone(status: string) {
  if (['active', 'completed', 'evidence_backed', 'qualified', 'materialized'].includes(status)) return styles.statusSuccess
  if (['paused', 'queued', 'not_configured', 'completed_without_opportunities', 'draft'].includes(status)) return styles.statusWarning
  if (['degraded', 'failed', 'blocked_no_search_provider', 'failed_source_persistence', 'failed_analysis_provider', 'critical'].includes(status)) return styles.statusDanger
  return styles.statusInfo
}

const api=(path:string,init?:RequestInit)=>contentCommandRequest<ApiPayload>(path,init)

function agentToForm(agent: ResearchAgent): AgentForm {
  const schedule = asRecord(agent.schedule_policy)
  const quota = asRecord(agent.quota_policy)
  const research = asRecord(agent.research_policy)
  const analysis = asRecord(agent.analysis_policy)
  const materialization = asRecord(agent.materialization_policy)
  return {
    name: agent.name,
    purpose: agent.purpose,
    ownerName: agent.owner_name || '',
    status: agent.status,
    priority: agent.priority,
    workspaceScopes: agent.workspace_scopes.join(', '),
    contentFamilies: agent.content_families.join(', '),
    services: agent.services.join(', '),
    audiences: agent.audiences.join(', '),
    cities: agent.cities.join(', '),
    languages: agent.languages.join(', '),
    topics: agent.topics.join(', '),
    excludedTopics: agent.excluded_topics.join(', '),
    frequency: text(schedule.frequency, 'manual'),
    timezone: text(schedule.timezone, 'Africa/Casablanca'),
    hour: String(number(schedule.hour, 8)),
    minute: String(number(schedule.minute, 0)),
    intervalMinutes: String(number(schedule.intervalMinutes, 60)),
    skipWhenNoMeaningfulChange: schedule.skipWhenNoMeaningfulChange !== false,
    maxSearchCallsPerDay: String(number(quota.maxSearchCallsPerDay, 5)),
    maxSearchCallsPerMonth: String(number(quota.maxSearchCallsPerMonth, 80)),
    maxAnalysesPerDay: String(number(quota.maxAnalysesPerDay, 4)),
    maxAnalysesPerMonth: String(number(quota.maxAnalysesPerMonth, 60)),
    searchDepth: text(research.searchDepth, 'basic'),
    maxResults: String(number(research.maxResults, 10)),
    timeRange: text(research.timeRange, 'month'),
    country: text(research.country, 'morocco'),
    allowedDomains: list(research.allowedDomains).join(', '),
    blockedDomains: list(research.blockedDomains).join(', '),
    model: text(analysis.model, 'openrouter/free'),
    maxSources: String(number(analysis.maxSources, 10)),
    maxSourceCharacters: String(number(analysis.maxSourceCharacters, 6000)),
    maxOutputTokens: String(number(analysis.maxOutputTokens, 5000)),
    schemaRepairAttempts: String(number(analysis.schemaRepairAttempts, 1)),
    minimumEvidenceConfidence: String(number(analysis.minimumEvidenceConfidence, 65)),
    minimumRelevance: String(number(analysis.minimumRelevance, 70)),
    minimumBusinessFit: String(number(analysis.minimumBusinessFit, 70)),
    minimumOpportunityScore: String(number(analysis.minimumOpportunityScore, 72)),
    createCanonicalSources: materialization.createCanonicalSources !== false,
    createSignals: materialization.createSignals !== false,
    createContentOpportunities: materialization.createContentOpportunities !== false,
    createStrategicCandidates: materialization.createStrategicCandidates === true,
    createBriefEnrichment: materialization.createBriefEnrichment === true,
    createEditorialSuggestions: materialization.createEditorialSuggestions === true,
    createInternalTasks: materialization.createInternalTasks !== false,
    createEvidenceRequests: materialization.createEvidenceRequests === true,
    createReviewObservations: materialization.createReviewObservations === true,
    updateDossier360: materialization.updateDossier360 === true,
    alertCommandement: materialization.alertCommandement !== false,
  }
}

function formPatch(form: AgentForm): JsonRecord {
  return {
    name: form.name,
    purpose: form.purpose,
    owner_name: form.ownerName || null,
    status: form.status,
    priority: form.priority,
    workspace_scopes: csv(form.workspaceScopes),
    content_families: csv(form.contentFamilies),
    services: csv(form.services),
    audiences: csv(form.audiences),
    cities: csv(form.cities),
    languages: csv(form.languages),
    topics: csv(form.topics),
    excluded_topics: csv(form.excludedTopics),
    schedule_policy: {
      frequency: form.frequency,
      timezone: form.timezone,
      hour: Number(form.hour),
      minute: Number(form.minute),
      intervalMinutes: Number(form.intervalMinutes),
      skipWhenNoMeaningfulChange: form.skipWhenNoMeaningfulChange,
    },
    quota_policy: {
      maxSearchCallsPerDay: Number(form.maxSearchCallsPerDay),
      maxSearchCallsPerMonth: Number(form.maxSearchCallsPerMonth),
      maxAnalysesPerDay: Number(form.maxAnalysesPerDay),
      maxAnalysesPerMonth: Number(form.maxAnalysesPerMonth),
    },
    research_policy: {
      searchDepth: form.searchDepth,
      maxResults: Number(form.maxResults),
      timeRange: form.timeRange,
      country: form.country,
      allowedDomains: csv(form.allowedDomains),
      blockedDomains: csv(form.blockedDomains),
    },
    analysis_policy: {
      model: form.model,
      maxSources: Number(form.maxSources),
      maxSourceCharacters: Number(form.maxSourceCharacters),
      maxOutputTokens: Number(form.maxOutputTokens),
      schemaRepairAttempts: Number(form.schemaRepairAttempts),
      minimumEvidenceConfidence: Number(form.minimumEvidenceConfidence),
      minimumRelevance: Number(form.minimumRelevance),
      minimumBusinessFit: Number(form.minimumBusinessFit),
      minimumOpportunityScore: Number(form.minimumOpportunityScore),
    },
    materialization_policy: {
      createCanonicalSources: form.createCanonicalSources,
      createSignals: form.createSignals,
      createContentOpportunities: form.createContentOpportunities,
      createStrategicCandidates: form.createStrategicCandidates,
      createBriefEnrichment: form.createBriefEnrichment,
      createEditorialSuggestions: form.createEditorialSuggestions,
      createInternalTasks: form.createInternalTasks,
      createEvidenceRequests: form.createEvidenceRequests,
      createReviewObservations: form.createReviewObservations,
      updateDossier360: form.updateDossier360,
      alertCommandement: form.alertCommandement,
    },
    approval_boundary: 'external_only',
  }
}

function StatusPill({ status, label }: { status: string; label?: string }) {
  return <span className={`${styles.statusPill} ${statusTone(status)}`}>{label || runStatusLabels[status] || status}</span>
}

function Toggle({ checked, onChange, label, detail }: { checked: boolean; onChange: (value: boolean) => void; label: string; detail: string }) {
  return (
    <button type="button" className={`${styles.toggleRow} ${checked ? styles.toggleRowActive : ''}`} onClick={() => onChange(!checked)} aria-pressed={checked}>
      <span className={styles.toggleTrack}><span /></span>
      <span><strong>{label}</strong><small>{detail}</small></span>
    </button>
  )
}

function Field({ label, hint, children, wide = false }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`${styles.field} ${wide ? styles.fieldWide : ''}`}><span>{label}</span>{hint ? <small>{hint}</small> : null}{children}</label>
}

function EmptyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className={styles.emptyState}><span>{icon}</span><strong>{title}</strong><p>{detail}</p></div>
}

function Metric({ icon, label, value, detail, tone = 'neutral' }: { icon: React.ReactNode; label: string; value: React.ReactNode; detail: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  const toneClass = tone === 'success' ? styles.metricSuccess : tone === 'warning' ? styles.metricWarning : tone === 'danger' ? styles.metricDanger : tone === 'info' ? styles.metricInfo : styles.metricNeutral
  return <article className={`${styles.metric} ${toneClass}`}><span className={styles.metricIcon}>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>
}

export default function ContentResearchControlWorkspace() {
  const [tab, setTab] = React.useState<TabKey>('cockpit')
  const [snapshot, setSnapshot] = React.useState<(ResearchControlSnapshot & { audit?: Array<Record<string, unknown>> }) | null>(null)
  const [runtimeDefaults, setRuntimeDefaults] = React.useState<JsonRecord>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [notice, setNotice] = React.useState<{ tone: 'success' | 'warning' | 'danger'; text: string } | null>(null)
  const [selectedAgentId, setSelectedAgentId] = React.useState('')
  const [agentForm, setAgentForm] = React.useState<AgentForm | null>(null)
  const [selectedRunId, setSelectedRunId] = React.useState('')
  const [busy, setBusy] = React.useState('')
  const [runOpen, setRunOpen] = React.useState(false)
  const [runForm, setRunForm] = React.useState({ objective: '', query: '', priority: 'normal', searchDepth: 'basic', maxResults: '10', maxSources: '10', minimumOpportunityScore: '72' })
  const [providerDrafts, setProviderDrafts] = React.useState<Record<string, ProviderDraft>>({})

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const payload = await api('/api/market-os/content-command/research-control/snapshot')
      const next = payload.snapshot || null
      setSnapshot(next)
      setRuntimeDefaults(payload.runtimeDefaults || {})
      if (next?.agents.length) {
        setSelectedAgentId((current) => current && next.agents.some((agent) => agent.id === current) ? current : next.agents[0].id)
      }
      if (next?.runs.length) {
        setSelectedRunId((current) => current && next.runs.some((run) => run.id === current) ? current : next.runs[0].id)
      }
      const drafts: typeof providerDrafts = {}
      for (const provider of next?.providers || []) {
        const limits = asRecord(provider.limits)
        drafts[provider.provider_key] = {
          enabled: provider.enabled,
          status: provider.status,
          maxRequestsPerDay: String(number(limits.maxRequestsPerDay, 0)),
          maxRequestsPerMonth: String(number(limits.maxRequestsPerMonth, 0)),
          maxResultsPerCall: String(number(limits.maxResultsPerCall, 10)),
          maxOutputTokens: String(number(limits.maxOutputTokens, 5000)),
        }
      }
      setProviderDrafts(drafts)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'RESEARCH_CONTROL_LOAD_FAILED')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => { void refresh() }, [refresh])

  const selectedAgent = React.useMemo(() => snapshot?.agents.find((agent) => agent.id === selectedAgentId) || null, [snapshot, selectedAgentId])
  const selectedRun = React.useMemo(() => snapshot?.runs.find((run) => run.id === selectedRunId) || null, [snapshot, selectedRunId])
  const selectedRunEvents = React.useMemo(() => snapshot?.runEvents.filter((event) => event.run_id === selectedRunId).sort((a, b) => a.created_at.localeCompare(b.created_at)) || [], [snapshot, selectedRunId])

  React.useEffect(() => {
    if (selectedAgent) {
      setAgentForm(agentToForm(selectedAgent))
      setRunForm((current) => ({ ...current, objective: selectedAgent.purpose, query: text(asRecord(selectedAgent.research_policy).defaultQuery, selectedAgent.topics.join(' ')) }))
    }
  }, [selectedAgent])

  async function action(name: string, payload: JsonRecord, successText: string) {
    setBusy(name)
    setNotice(null)
    try {
      await api('/api/market-os/content-command/research-control/action', { method: 'POST', body: JSON.stringify({ action: name, payload }) })
      setNotice({ tone: 'success', text: successText })
      await refresh()
    } catch (reason) {
      setNotice({ tone: 'danger', text: reason instanceof Error ? reason.message : 'ACTION_FAILED' })
      throw reason
    } finally {
      setBusy('')
    }
  }

  async function saveAgent(section: string) {
    if (!selectedAgent || !agentForm) return
    await action('save_agent_policy', { agentId: selectedAgent.id, patch: formPatch(agentForm), reason: `Mise à jour ${section} depuis Contrôle Recherche IA.` }, `Politique ${section} enregistrée en version ${selectedAgent.policy_version + 1}.`)
  }

  async function runNow() {
    if (!selectedAgent) return
    await action('run_now', {
      agentId: selectedAgent.id,
      objective: runForm.objective,
      query: runForm.query,
      priority: runForm.priority,
      overridePolicy: {
        searchDepth: runForm.searchDepth,
        maxResults: Number(runForm.maxResults),
        maxSources: Number(runForm.maxSources),
        minimumOpportunityScore: Number(runForm.minimumOpportunityScore),
      },
    }, 'Commande de recherche exécutée. Les résultats et créations internes sont disponibles dans Runs.')
    setRunOpen(false)
    setTab('runs')
  }

  async function saveProvider(provider: ResearchProviderPolicy) {
    const draft = providerDrafts[provider.provider_key]
    if (!draft) return
    await action('save_provider_policy', {
      providerKey: provider.provider_key,
      enabled: draft.enabled,
      status: draft.status,
      limits: {
        maxRequestsPerDay: Number(draft.maxRequestsPerDay),
        maxRequestsPerMonth: Number(draft.maxRequestsPerMonth),
        maxResultsPerCall: Number(draft.maxResultsPerCall),
        maxOutputTokens: Number(draft.maxOutputTokens),
      },
    }, `Politique ${provider.display_name} enregistrée.`)
  }

  if (loading && !snapshot) {
    return <main className={styles.loadingCanvas}><LoaderCircle className={styles.spinner} /><strong>Chargement du contrôle de recherche…</strong><p>Lecture des agents, fournisseurs, quotas, runs et politiques persistées.</p></main>
  }

  return (
    <main className={styles.canvas}>
      <section className={styles.hero}>
        <div className={styles.heroIdentity}>
          <div className={styles.logoPlate}><Image src="/logo.png" alt="ANGELCARE" width={132} height={46} style={{ width: 132, height: 'auto' }} priority /></div>
          <div><span className={styles.eyebrow}>SANILA MARKET OS · CONTENT COMMAND CENTER 360</span><h1>Contrôle Recherche IA</h1><p>Gouvernez chaque recherche Tavily, chaque analyse OpenRouter, chaque agent Content Command, chaque fréquence, quota et création interne.</p></div>
        </div>
        <div className={styles.heroCommand}>
          <div className={styles.authoritySeal}><ShieldCheck /><span><small>Frontière d’autorité</small><strong>Approbation humaine externe uniquement</strong></span></div>
          <button className={styles.secondaryButton} type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw className={loading ? styles.spinner : ''} /> Actualiser</button>
          <button className={styles.primaryButton} type="button" onClick={() => setRunOpen(true)} disabled={!selectedAgent || !snapshot?.migrationReady}><Play /> Exécuter maintenant</button>
        </div>
      </section>

      {notice ? <div className={`${styles.notice} ${notice.tone === 'success' ? styles.noticeSuccess : notice.tone === 'warning' ? styles.noticeWarning : styles.noticeDanger}`} role="status"><span>{notice.tone === 'success' ? <CheckCircle2 /> : <CircleAlert />}</span><p>{notice.text}</p><button type="button" onClick={() => setNotice(null)} aria-label="Fermer"><X /></button></div> : null}
      {error ? <div className={`${styles.notice} ${styles.noticeDanger}`} role="alert"><CircleAlert /><p>{error}</p><button type="button" onClick={() => void refresh()}><RefreshCw /> Réessayer</button></div> : null}

      {!snapshot?.migrationReady ? (
        <section className={styles.migrationGate}>
          <Database /><div><span>Persistance non installée</span><h2>Appliquez la migration Research Runtime Control</h2><p>La page ne simule aucune configuration. Les agents, quotas, runs et politiques apparaîtront après l’exécution du SQL livré.</p></div><code>20260728_2200_content_command_research_runtime_control.sql</code>
        </section>
      ) : null}

      <nav className={styles.tabBar} aria-label="Contrôle Recherche IA">
        {tabs.map((item) => <button key={item.key} type="button" className={tab === item.key ? styles.tabActive : styles.tab} onClick={() => setTab(item.key)}>{item.icon}<span><strong>{item.label}</strong><small>{item.hint}</small></span></button>)}
      </nav>

      {snapshot?.migrationReady ? (
        <>
          {tab === 'cockpit' ? <Cockpit snapshot={snapshot} runtimeDefaults={runtimeDefaults} selectedAgent={selectedAgent} setSelectedAgentId={setSelectedAgentId} openRun={() => setRunOpen(true)} openTab={setTab} /> : null}
          {tab === 'chain' ? <ResearchChain snapshot={snapshot} openTab={setTab} /> : null}
          {tab === 'agents' && agentForm ? <AgentControl snapshot={snapshot} selectedAgent={selectedAgent} selectedAgentId={selectedAgentId} setSelectedAgentId={setSelectedAgentId} form={agentForm} setForm={setAgentForm} save={() => void saveAgent('constitution')} busy={busy} openRun={() => setRunOpen(true)} /> : null}
          {tab === 'providers' ? <ProviderControl snapshot={snapshot} drafts={providerDrafts} setDrafts={setProviderDrafts} saveProvider={saveProvider} testProvider={(provider) => void action('test_provider', { providerKey: provider.provider_key }, `Test ${provider.display_name} terminé.`)} busy={busy} /> : null}
          {tab === 'frequency' && agentForm ? <FrequencyControl snapshot={snapshot} selectedAgent={selectedAgent} selectedAgentId={selectedAgentId} setSelectedAgentId={setSelectedAgentId} form={agentForm} setForm={setAgentForm} save={() => void saveAgent('fréquence')} busy={busy} /> : null}
          {tab === 'quotas' && agentForm ? <QuotaControl snapshot={snapshot} selectedAgent={selectedAgent} selectedAgentId={selectedAgentId} setSelectedAgentId={setSelectedAgentId} form={agentForm} setForm={setAgentForm} save={() => void saveAgent('quotas')} busy={busy} /> : null}
          {tab === 'policies' && agentForm ? <PolicyControl selectedAgent={selectedAgent} form={agentForm} setForm={setAgentForm} save={() => void saveAgent('recherche et analyse')} busy={busy} /> : null}
          {tab === 'materialization' && agentForm ? <MaterializationControl selectedAgent={selectedAgent} form={agentForm} setForm={setAgentForm} save={() => void saveAgent('création interne')} busy={busy} /> : null}
          {tab === 'runs' ? <RunsControl snapshot={snapshot} selectedRun={selectedRun} selectedRunId={selectedRunId} setSelectedRunId={setSelectedRunId} events={selectedRunEvents} /> : null}
          {tab === 'alerts' ? <AlertsControl alerts={snapshot.alerts} acknowledge={(alert) => void action('acknowledge_alert', { alertId: alert.id }, 'Alerte reconnue et conservée dans l’audit.')} busy={busy} /> : null}
          {tab === 'audit' ? <AuditControl snapshot={snapshot} /> : null}
        </>
      ) : null}

      {runOpen && selectedAgent ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setRunOpen(false) }}>
          <section className={styles.runChamber} role="dialog" aria-modal="true" aria-labelledby="run-title">
            <header><div><span className={styles.eyebrow}>ONE-TIME RESEARCH OVERRIDE</span><h2 id="run-title">Exécuter {selectedAgent.name}</h2><p>Cette configuration vaut uniquement pour ce run. La politique permanente reste inchangée.</p></div><button type="button" className={styles.iconButton} onClick={() => setRunOpen(false)} aria-label="Fermer"><X /></button></header>
            <div className={styles.runIdentity}><span><Bot /><small>Agent</small><strong>{selectedAgent.code}</strong></span><span><KeyRound /><small>Recherche</small><strong>Tavily Free</strong></span><span><BrainCircuit /><small>Analyse</small><strong>OpenRouter Free</strong></span><span><LockKeyhole /><small>Externe</small><strong>Validation humaine</strong></span></div>
            <div className={styles.formGrid}>
              <Field label="Objectif de recherche" wide><textarea rows={3} value={runForm.objective} onChange={(event) => setRunForm({ ...runForm, objective: event.target.value })} /></Field>
              <Field label="Commande / requête publique" wide><textarea rows={4} value={runForm.query} onChange={(event) => setRunForm({ ...runForm, query: event.target.value })} /></Field>
              <Field label="Priorité"><select value={runForm.priority} onChange={(event) => setRunForm({ ...runForm, priority: event.target.value })}><option value="critical">Critique</option><option value="executive">Exécutive</option><option value="high">Haute</option><option value="normal">Normale</option><option value="low">Basse</option></select></Field>
              <Field label="Profondeur Tavily"><select value={runForm.searchDepth} onChange={(event) => setRunForm({ ...runForm, searchDepth: event.target.value })}><option value="basic">Basic · 1 crédit</option><option value="advanced">Advanced · 2 crédits</option></select></Field>
              <Field label="Résultats maximum"><input type="number" min="1" max="20" value={runForm.maxResults} onChange={(event) => setRunForm({ ...runForm, maxResults: event.target.value })} /></Field>
              <Field label="Sources OpenRouter"><input type="number" min="1" max="30" value={runForm.maxSources} onChange={(event) => setRunForm({ ...runForm, maxSources: event.target.value })} /></Field>
              <Field label="Seuil opportunité"><input type="number" min="0" max="100" value={runForm.minimumOpportunityScore} onChange={(event) => setRunForm({ ...runForm, minimumOpportunityScore: event.target.value })} /></Field>
            </div>
            <div className={styles.runBoundary}><ShieldCheck /><div><strong>Autorité automatique interne</strong><p>Sources AC Capital, constats, signaux et actions Content Command peuvent être créés automatiquement. Aucun email, WhatsApp, publication, publicité ou soumission externe ne sera exécuté.</p></div></div>
            <footer><button type="button" className={styles.secondaryButton} onClick={() => setRunOpen(false)}>Annuler</button><button type="button" className={styles.primaryButton} disabled={busy === 'run_now' || !runForm.objective.trim() || !runForm.query.trim()} onClick={() => void runNow()}>{busy === 'run_now' ? <LoaderCircle className={styles.spinner} /> : <Play />} Exécuter la chaîne</button></footer>
          </section>
        </div>
      ) : null}
    </main>
  )
}

function Cockpit({ snapshot, runtimeDefaults, selectedAgent, setSelectedAgentId, openRun, openTab }: { snapshot: ResearchControlSnapshot; runtimeDefaults: JsonRecord; selectedAgent: ResearchAgent | null; setSelectedAgentId: (id: string) => void; openRun: () => void; openTab: (tab: TabKey) => void }) {
  const recentRuns = snapshot.runs.slice(0, 6)
  return <section className={styles.workspace}>
    <div className={styles.metricsGrid}>
      <Metric icon={<Bot />} label="Agents actifs" value={snapshot.rollups.activeAgents} detail={`${snapshot.rollups.pausedAgents} agent(s) suspendu(s)`} tone="success" />
      <Metric icon={<FileSearch />} label="Sources ce mois" value={formatNumber(snapshot.rollups.sourcesThisMonth)} detail="Autorité canonique AC Capital" tone="info" />
      <Metric icon={<Sparkles />} label="Opportunités contenu" value={snapshot.rollups.opportunitiesThisMonth} detail="Signaux et angles éditoriaux qualifiés" tone="success" />
      <Metric icon={<Zap />} label="Crédits Tavily" value={snapshot.rollups.tavilyCreditsThisMonth} detail="Consommation interne enregistrée" tone={snapshot.rollups.tavilyCreditsThisMonth > 700 ? 'warning' : 'neutral'} />
      <Metric icon={<BrainCircuit />} label="Analyses OpenRouter" value={snapshot.rollups.openrouterRequestsThisMonth} detail="Modèle résolu audité par run" tone="info" />
      <Metric icon={<AlertTriangle />} label="Interventions" value={snapshot.rollups.pendingAlerts} detail="Alertes ouvertes" tone={snapshot.rollups.pendingAlerts ? 'danger' : 'success'} />
    </div>

    <div className={styles.commandGrid}>
      <article className={styles.chainCard}>
        <header><div><span className={styles.eyebrow}>LIVE RESEARCH CHAIN</span><h2>Chaîne d’intelligence Content Command</h2></div><button type="button" className={styles.quietButton} onClick={() => openTab('chain')}>Inspecter <ArrowRight /></button></header>
        <div className={styles.chainFlow}>
          <ChainNode icon={<Search />} title="Tavily Free" detail="Recherche publique primaire" status={snapshot.credentials.tavilyPresent ? 'active' : 'degraded'} />
          <ChevronRight />
          <ChainNode icon={<Database />} title="AC Capital" detail="Sources publiques canoniques" status="active" />
          <ChevronRight />
          <ChainNode icon={<BrainCircuit />} title="OpenRouter Free" detail="Analyse structurée" status={snapshot.credentials.openrouterPresent ? 'active' : 'degraded'} />
          <ChevronRight />
          <ChainNode icon={<Radar />} title="Content Command" detail="Signaux, constats, tâches" status="active" />
          <ChevronRight />
          <ChainNode icon={<ShieldCheck />} title="Human Gate" detail="Externe uniquement" status="active" />
        </div>
        <div className={styles.chainTruth}><LockKeyhole /><p><strong>Aucun Gemini dans cette chaîne.</strong> {text(runtimeDefaults.searchPrimary, 'Tavily')} → {text(runtimeDefaults.sourceAuthority, 'AC Capital')} → {text(runtimeDefaults.analysisProvider, 'OpenRouter')} · actions externes bloquées.</p></div>
      </article>

      <aside className={styles.focusCard}>
        <span className={styles.eyebrow}>AGENT FOCUS</span>
        <select value={selectedAgent?.id || ''} onChange={(event) => setSelectedAgentId(event.target.value)}>{snapshot.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select>
        {selectedAgent ? <><div className={styles.focusAgent}><span><Bot /></span><div><small>{selectedAgent.code}</small><strong>{selectedAgent.name}</strong><p>{selectedAgent.purpose}</p></div></div><div className={styles.focusFacts}><span><small>État</small><StatusPill status={selectedAgent.status} /></span><span><small>Fréquence</small><strong>{text(asRecord(selectedAgent.schedule_policy).frequency, 'manual')}</strong></span><span><small>Version</small><strong>v{selectedAgent.policy_version}</strong></span><span><small>Prochain run</small><strong>{formatDate(selectedAgent.next_run_at)}</strong></span></div><button type="button" className={styles.primaryButton} onClick={openRun}><Play /> Exécuter cet agent</button></> : null}
      </aside>
    </div>

    <div className={styles.twoColumn}>
      <section className={styles.panel}><header><div><span className={styles.eyebrow}>ACTIVE FLEET</span><h2>Flotte Content Command</h2></div><button type="button" className={styles.quietButton} onClick={() => openTab('agents')}>Gouverner <ArrowRight /></button></header><div className={styles.agentMiniGrid}>{snapshot.agents.slice(0, 8).map((agent) => <button type="button" key={agent.id} onClick={() => { setSelectedAgentId(agent.id); openTab('agents') }}><span className={styles.agentGlyph}><Bot /></span><span><small>{agentTypeLabels[agent.agent_type] || agent.agent_type}</small><strong>{agent.name}</strong><em>{text(asRecord(agent.schedule_policy).frequency, 'manual')} · v{agent.policy_version}</em></span><StatusPill status={agent.status} /></button>)}</div></section>
      <section className={styles.panel}><header><div><span className={styles.eyebrow}>LATEST EXECUTIONS</span><h2>Runs récents</h2></div><button type="button" className={styles.quietButton} onClick={() => openTab('runs')}>Ouvrir Runs <ArrowRight /></button></header><div className={styles.runList}>{recentRuns.map((run) => <article key={run.id}><span className={styles.runIcon}><Activity /></span><div><small>{run.agent_code} · {formatDate(run.created_at)}</small><strong>{run.research_command}</strong><p>{run.result_summary || run.objective}</p></div><div className={styles.runStats}><StatusPill status={run.status} /><small>{run.accepted_source_count} sources · {run.finding_count} constats</small></div></article>)}{!recentRuns.length ? <EmptyState icon={<Activity />} title="Aucun run" detail="Exécutez un agent pour ouvrir la première chaîne de recherche auditée." /> : null}</div></section>
    </div>
  </section>
}

function ChainNode({ icon, title, detail, status }: { icon: React.ReactNode; title: string; detail: string; status: string }) {
  return <article className={styles.chainNode}><span>{icon}</span><div><StatusPill status={status} label={status === 'active' ? 'Disponible' : 'À configurer'} /><strong>{title}</strong><small>{detail}</small></div></article>
}

function ResearchChain({ snapshot, openTab }: { snapshot: ResearchControlSnapshot; openTab: (tab: TabKey) => void }) {
  const tavily = snapshot.providers.find((provider) => provider.provider_key === 'tavily')
  const openrouter = snapshot.providers.find((provider) => provider.provider_key === 'openrouter')
  const searxng = snapshot.providers.find((provider) => provider.provider_key === 'searxng')
  return <section className={styles.workspace}>
    <section className={styles.chainTheatre}>
      <header><div><span className={styles.eyebrow}>CONTENT INTELLIGENCE FLOW</span><h2>Chaîne de recherche gouvernée</h2><p>Chaque étape est observable, configurable et auditée. Aucune étape ne fabrique une source ou un résultat.</p></div><StatusPill status="active" label="Interne automatique · Externe humain" /></header>
      <div className={styles.verticalChain}>
        <ChainStage index="01" icon={<Target />} title="Commande de recherche Content Command" state="active" detail="Objectif, portée, fréquence, quota et override d’un agent spécialisé." action={() => openTab('agents')} actionLabel="Gouverner agents" />
        <ChainStage index="02" icon={<Search />} title="Tavily Free — recherche primaire" state={tavily?.status || 'not_configured'} detail="Recherche web publique avec profondeur, résultats, domaines, fraîcheur et crédits contrôlés." action={() => openTab('providers')} actionLabel="Configurer Tavily" />
        <ChainStage index="03" icon={<Network />} title="SearXNG — fallback réservé" state={searxng?.status || 'not_configured'} detail="Présent dans l’architecture mais désactivé tant que le serveur n’est pas opérationnel. Aucune substitution Gemini." action={() => openTab('providers')} actionLabel="Voir le fallback" />
        <ChainStage index="04" icon={<Database />} title="AC Capital — autorité source canonique" state="active" detail="Normalisation URL, hash, déduplication, provenance, première et dernière détection." action={() => openTab('runs')} actionLabel="Inspecter sources" />
        <ChainStage index="05" icon={<BrainCircuit />} title="OpenRouter Free — analyse structurée" state={openrouter?.status || 'not_configured'} detail="JSON Schema, citations source, modèle réellement résolu, tokens et erreurs enregistrés." action={() => openTab('policies')} actionLabel="Configurer analyse" />
        <ChainStage index="06" icon={<Radar />} title="Matérialisation Content Command" state="active" detail="Constats, opportunités de contenu, signaux, suggestions éditoriales et actions internes selon la politique de l’agent." action={() => openTab('materialization')} actionLabel="Gouverner créations" />
        <ChainStage index="07" icon={<ShieldCheck />} title="Frontière humaine externe" state="active" detail="Email, WhatsApp, publication, publicité, contact tiers et soumission formelle restent bloqués jusqu’à décision humaine." action={() => openTab('audit')} actionLabel="Voir l’audit" />
      </div>
    </section>
  </section>
}

function ChainStage({ index, icon, title, state, detail, action, actionLabel }: { index: string; icon: React.ReactNode; title: string; state: string; detail: string; action: () => void; actionLabel: string }) {
  return <article className={styles.chainStage}><span className={styles.chainIndex}>{index}</span><span className={styles.chainStageIcon}>{icon}</span><div><div><h3>{title}</h3><StatusPill status={state} /></div><p>{detail}</p></div><button type="button" className={styles.quietButton} onClick={action}>{actionLabel}<ArrowRight /></button></article>
}

function AgentControl({ snapshot, selectedAgent, selectedAgentId, setSelectedAgentId, form, setForm, save, busy, openRun }: { snapshot: ResearchControlSnapshot; selectedAgent: ResearchAgent | null; selectedAgentId: string; setSelectedAgentId: (id: string) => void; form: AgentForm; setForm: (value: AgentForm) => void; save: () => void; busy: string; openRun: () => void }) {
  return <section className={styles.workspace}>
    <div className={styles.agentWorkbench}>
      <aside className={styles.agentRail}><header><span className={styles.eyebrow}>CONTENT COMMAND AGENT FLEET</span><h2>{snapshot.agents.length} agents spécialisés</h2><p>Agents dédiés aux signaux, preuves, stratégie, briefs, création et readiness.</p></header><div>{snapshot.agents.map((agent) => <button type="button" key={agent.id} className={agent.id === selectedAgentId ? styles.agentRailActive : styles.agentRailButton} onClick={() => setSelectedAgentId(agent.id)}><span className={styles.agentGlyph}><Bot /></span><span><small>{agentTypeLabels[agent.agent_type] || agent.agent_type}</small><strong>{agent.name}</strong><em>{text(asRecord(agent.schedule_policy).frequency, 'manual')} · {agent.priority}</em></span><StatusPill status={agent.status} /></button>)}</div></aside>
      <section className={styles.policyDesk}>
        <header><div><span className={styles.eyebrow}>{selectedAgent?.code}</span><h2>Constitution de l’agent</h2><p>Définissez son rôle Content Command, ses domaines et ses exclusions sans modifier les fournisseurs globaux.</p></div><div className={styles.headerActions}><button type="button" className={styles.secondaryButton} onClick={openRun}><Play /> Run ponctuel</button><button type="button" className={styles.primaryButton} onClick={save} disabled={busy === 'save_agent_policy'}>{busy === 'save_agent_policy' ? <LoaderCircle className={styles.spinner} /> : <Save />} Enregistrer v{(selectedAgent?.policy_version || 0) + 1}</button></div></header>
        <div className={styles.formGrid}>
          <Field label="Nom de l’agent"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
          <Field label="Owner interne"><input value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} placeholder="Direction Marketing / Content Strategy" /></Field>
          <Field label="État"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">Brouillon</option><option value="active">Actif</option><option value="paused">Suspendu</option><option value="retired">Retiré</option></select></Field>
          <Field label="Priorité"><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="critical">Critique</option><option value="executive">Exécutive</option><option value="high">Haute</option><option value="normal">Normale</option><option value="low">Basse</option><option value="background">Background</option></select></Field>
          <Field label="Mandat" wide><textarea rows={4} value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} /></Field>
          <Field label="Workspaces Content Command" hint="Ex. signals, strategies, briefs, calendar" wide><input value={form.workspaceScopes} onChange={(event) => setForm({ ...form, workspaceScopes: event.target.value })} /></Field>
          <Field label="Familles de contenu"><input value={form.contentFamilies} onChange={(event) => setForm({ ...form, contentFamilies: event.target.value })} /></Field>
          <Field label="Services ANGELCARE"><input value={form.services} onChange={(event) => setForm({ ...form, services: event.target.value })} /></Field>
          <Field label="Audiences à comprendre"><input value={form.audiences} onChange={(event) => setForm({ ...form, audiences: event.target.value })} /></Field>
          <Field label="Villes / zones"><input value={form.cities} onChange={(event) => setForm({ ...form, cities: event.target.value })} /></Field>
          <Field label="Langues"><input value={form.languages} onChange={(event) => setForm({ ...form, languages: event.target.value })} /></Field>
          <Field label="Sujets autorisés" wide><textarea rows={3} value={form.topics} onChange={(event) => setForm({ ...form, topics: event.target.value })} /></Field>
          <Field label="Sujets explicitement exclus" hint="Définissez les thèmes hors mandat pour préserver la précision de l’agent." wide><textarea rows={3} value={form.excludedTopics} onChange={(event) => setForm({ ...form, excludedTopics: event.target.value })} /></Field>
        </div>
        <div className={styles.boundaryBanner}><LockKeyhole /><div><strong>Frontière immuable</strong><p>Approbation humaine seulement avant communication, publication, publicité, contact tiers ou soumission externe. Toutes les créations internes restent gouvernables par politique.</p></div><StatusPill status="active" label="external_only" /></div>
      </section>
    </div>
  </section>
}

function ProviderControl({ snapshot, drafts, setDrafts, saveProvider, testProvider, busy }: { snapshot: ResearchControlSnapshot; drafts: Record<string, ProviderDraft>; setDrafts: React.Dispatch<React.SetStateAction<Record<string, ProviderDraft>>>; saveProvider: (provider: ResearchProviderPolicy) => Promise<void>; testProvider: (provider: ResearchProviderPolicy) => void; busy: string }) {
  return <section className={styles.workspace}><div className={styles.providerGrid}>{snapshot.providers.map((provider) => {
    const draft = drafts[provider.provider_key]
    const health = asRecord(provider.health)
    const configured = provider.provider_key === 'tavily' ? snapshot.credentials.tavilyPresent : provider.provider_key === 'openrouter' ? snapshot.credentials.openrouterPresent : snapshot.credentials.searxngConfigured
    return <article key={provider.id} className={`${styles.providerCard} ${provider.provider_key === 'searxng' ? styles.providerMuted : ''}`}>
      <header><span className={styles.providerIcon}>{provider.provider_key === 'tavily' ? <Search /> : provider.provider_key === 'openrouter' ? <BrainCircuit /> : <Network />}</span><div><small>{provider.provider_role}</small><h2>{provider.display_name}</h2><p>{provider.provider_key === 'tavily' ? 'Recherche publique primaire et crédits par profondeur.' : provider.provider_key === 'openrouter' ? 'Analyse structurée avec modèle free résolu par run.' : 'Fallback futur, désactivé tant que le serveur n’est pas installé.'}</p></div><StatusPill status={provider.status} /></header>
      <div className={styles.providerFacts}><span><small>Credential serveur</small><strong>{configured ? 'Présent' : 'Absent / non configuré'}</strong></span><span><small>Dernier test</small><strong>{formatDate(provider.last_tested_at)}</strong></span><span><small>Dernier résultat</small><strong>{text(health.lastOutcome, text(health.error, 'Non testé'))}</strong></span><span><small>Version politique</small><strong>v{provider.version_number}</strong></span></div>
      {draft ? <div className={styles.formGrid}>
        <Field label="État"><select value={draft.status} onChange={(event) => setDrafts((current) => ({ ...current, [provider.provider_key]: { ...draft, status: event.target.value } }))}><option value="active">Actif</option><option value="paused">Suspendu</option><option value="degraded">Dégradé</option><option value="not_configured">Non configuré</option></select></Field>
        <Field label="Requêtes / jour"><input type="number" min="0" value={draft.maxRequestsPerDay} onChange={(event) => setDrafts((current) => ({ ...current, [provider.provider_key]: { ...draft, maxRequestsPerDay: event.target.value } }))} /></Field>
        <Field label="Requêtes / mois"><input type="number" min="0" value={draft.maxRequestsPerMonth} onChange={(event) => setDrafts((current) => ({ ...current, [provider.provider_key]: { ...draft, maxRequestsPerMonth: event.target.value } }))} /></Field>
        {provider.provider_key === 'tavily' ? <Field label="Résultats / appel"><input type="number" min="1" max="20" value={draft.maxResultsPerCall} onChange={(event) => setDrafts((current) => ({ ...current, [provider.provider_key]: { ...draft, maxResultsPerCall: event.target.value } }))} /></Field> : null}
        {provider.provider_key === 'openrouter' ? <Field label="Tokens sortie max"><input type="number" min="512" value={draft.maxOutputTokens} onChange={(event) => setDrafts((current) => ({ ...current, [provider.provider_key]: { ...draft, maxOutputTokens: event.target.value } }))} /></Field> : null}
      </div> : null}
      <div className={styles.providerActions}><button type="button" className={styles.secondaryButton} disabled={busy === 'test_provider' || provider.provider_key === 'searxng'} onClick={() => testProvider(provider)}>{busy === 'test_provider' ? <LoaderCircle className={styles.spinner} /> : <RefreshCw />} Tester</button><button type="button" className={styles.primaryButton} disabled={busy === 'save_provider_policy' || !draft} onClick={() => void saveProvider(provider)}><Save /> Enregistrer</button></div>
      <div className={styles.secretBoundary}><KeyRound /><p>La clé n’est jamais affichée ni renvoyée au navigateur. Cette section contrôle l’usage, pas le secret.</p></div>
    </article>
  })}</div></section>
}

function FrequencyControl({ snapshot, selectedAgent, selectedAgentId, setSelectedAgentId, form, setForm, save, busy }: { snapshot: ResearchControlSnapshot; selectedAgent: ResearchAgent | null; selectedAgentId: string; setSelectedAgentId: (id: string) => void; form: AgentForm; setForm: (value: AgentForm) => void; save: () => void; busy: string }) {
  return <section className={styles.workspace}><div className={styles.controlHeader}><div><span className={styles.eyebrow}>SCHEDULE CONSTITUTION</span><h2>Fréquences & déclencheurs</h2><p>Cadences Content Command, fenêtres d’exécution, runs ponctuels et retour automatique à la politique standard.</p></div><select value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)}>{snapshot.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></div>
    <div className={styles.scheduleGrid}><section className={styles.panel}><header><div><span className={styles.eyebrow}>{selectedAgent?.code}</span><h3>Politique permanente</h3></div><StatusPill status={selectedAgent?.status || 'draft'} /></header><div className={styles.formGrid}>
      <Field label="Mode"><select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })}><option value="manual">Manuel</option><option value="hourly">Chaque heure</option><option value="daily">Quotidien</option><option value="weekdays">Jours ouvrés</option><option value="weekly">Hebdomadaire</option><option value="monthly">Mensuel</option><option value="custom">Intervalle personnalisé</option></select></Field>
      <Field label="Fuseau horaire"><input value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} /></Field>
      <Field label="Heure"><input type="number" min="0" max="23" value={form.hour} onChange={(event) => setForm({ ...form, hour: event.target.value })} /></Field>
      <Field label="Minute"><input type="number" min="0" max="59" value={form.minute} onChange={(event) => setForm({ ...form, minute: event.target.value })} /></Field>
      <Field label="Intervalle custom (min)"><input type="number" min="60" value={form.intervalMinutes} onChange={(event) => setForm({ ...form, intervalMinutes: event.target.value })} /></Field>
    </div><Toggle checked={form.skipWhenNoMeaningfulChange} onChange={(value) => setForm({ ...form, skipWhenNoMeaningfulChange: value })} label="Ignorer quand aucun changement significatif" detail="Évite de consommer inutilement Tavily et OpenRouter lorsque la politique de détection conclut à l’absence de nouveauté." /><button type="button" className={styles.primaryButton} onClick={save} disabled={busy === 'save_agent_policy'}><Save /> Enregistrer la fréquence</button></section>
      <section className={styles.panel}><header><div><span className={styles.eyebrow}>OPERATIONAL CALENDAR</span><h3>Prochaines exécutions</h3></div><CalendarClock /></header><div className={styles.scheduleTimeline}>{snapshot.agents.filter((agent) => agent.status === 'active').map((agent) => <article key={agent.id}><span><Clock3 /></span><div><small>{text(asRecord(agent.schedule_policy).frequency, 'manual')}</small><strong>{agent.name}</strong><p>Dernier: {formatDate(agent.last_run_at)} · Prochain: {formatDate(agent.next_run_at)}</p></div><StatusPill status={agent.next_run_at ? 'active' : 'draft'} label={agent.next_run_at ? 'Planifié' : 'Manuel'} /></article>)}</div></section>
    </div></section>
}

function QuotaControl({ snapshot, selectedAgent, selectedAgentId, setSelectedAgentId, form, setForm, save, busy }: { snapshot: ResearchControlSnapshot; selectedAgent: ResearchAgent | null; selectedAgentId: string; setSelectedAgentId: (id: string) => void; form: AgentForm; setForm: (value: AgentForm) => void; save: () => void; busy: string }) {
  const agentTavily = snapshot.usage.filter((row) => row.agent_id === selectedAgentId && row.provider_key === 'tavily' && row.metric_type === 'requests').reduce((sum, row) => sum + Number(row.quantity), 0)
  const agentOpenRouter = snapshot.usage.filter((row) => row.agent_id === selectedAgentId && row.provider_key === 'openrouter' && row.metric_type === 'requests').reduce((sum, row) => sum + Number(row.quantity), 0)
  return <section className={styles.workspace}><div className={styles.controlHeader}><div><span className={styles.eyebrow}>THREE-LAYER CAPACITY</span><h2>Budgets & quotas</h2><p>Le plafond effectif est toujours le minimum entre la limite fournisseur, la limite Market OS et la limite de l’agent.</p></div><select value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)}>{snapshot.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></div>
    <div className={styles.quotaEquation}><span><ServerCog /><small>Fournisseur</small><strong>Limite réelle externe</strong></span><em>∩</em><span><Gauge /><small>Market OS</small><strong>Politique globale</strong></span><em>∩</em><span><Bot /><small>Agent</small><strong>Allocation spécifique</strong></span><ArrowRight /><span className={styles.quotaEffective}><ShieldCheck /><small>Allowance effectif</small><strong>Le plus restrictif</strong></span></div>
    <div className={styles.twoColumn}><section className={styles.panel}><header><div><span className={styles.eyebrow}>{selectedAgent?.code}</span><h3>Allocation agent</h3></div><StatusPill status={selectedAgent?.status || 'draft'} /></header><div className={styles.formGrid}>
      <Field label="Tavily / jour"><input type="number" min="1" value={form.maxSearchCallsPerDay} onChange={(event) => setForm({ ...form, maxSearchCallsPerDay: event.target.value })} /></Field>
      <Field label="Tavily / mois"><input type="number" min="1" value={form.maxSearchCallsPerMonth} onChange={(event) => setForm({ ...form, maxSearchCallsPerMonth: event.target.value })} /></Field>
      <Field label="OpenRouter / jour"><input type="number" min="1" value={form.maxAnalysesPerDay} onChange={(event) => setForm({ ...form, maxAnalysesPerDay: event.target.value })} /></Field>
      <Field label="OpenRouter / mois"><input type="number" min="1" value={form.maxAnalysesPerMonth} onChange={(event) => setForm({ ...form, maxAnalysesPerMonth: event.target.value })} /></Field>
    </div><button type="button" className={styles.primaryButton} onClick={save} disabled={busy === 'save_agent_policy'}><Save /> Enregistrer l’allocation</button></section>
      <section className={styles.panel}><header><div><span className={styles.eyebrow}>CURRENT CYCLE</span><h3>Usage observé</h3></div><BarChart3 /></header><div className={styles.usageBars}><UsageBar label="Tavily agent" used={agentTavily} limit={Number(form.maxSearchCallsPerMonth)} /><UsageBar label="OpenRouter agent" used={agentOpenRouter} limit={Number(form.maxAnalysesPerMonth)} /><UsageBar label="Tavily Market OS" used={snapshot.rollups.tavilyCreditsThisMonth} limit={number(asRecord(snapshot.providers.find((provider) => provider.provider_key === 'tavily')?.limits).maxRequestsPerMonth, 800)} /><UsageBar label="OpenRouter Market OS" used={snapshot.rollups.openrouterRequestsThisMonth} limit={number(asRecord(snapshot.providers.find((provider) => provider.provider_key === 'openrouter')?.limits).maxRequestsPerMonth, 700)} /></div><div className={styles.quotaTruth}><CircleAlert /><p>Les plafonds internes ne créent jamais de capacité externe. Le fournisseur peut bloquer avant la limite configurée ici.</p></div></section>
    </div></section>
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  return <div className={styles.usageBar}><div><strong>{label}</strong><span>{formatNumber(used)} / {formatNumber(limit)} · {percent}%</span></div><div><span style={{ width: `${percent}%` }} /></div></div>
}

function PolicyControl({ selectedAgent, form, setForm, save, busy }: { selectedAgent: ResearchAgent | null; form: AgentForm; setForm: (value: AgentForm) => void; save: () => void; busy: string }) {
  return <section className={styles.workspace}><div className={styles.policyColumns}>
    <section className={styles.panel}><header><div><span className={styles.eyebrow}>TAVILY RESEARCH POLICY</span><h2>Recherche publique</h2><p>{selectedAgent?.name}</p></div><Search /></header><div className={styles.formGrid}>
      <Field label="Profondeur"><select value={form.searchDepth} onChange={(event) => setForm({ ...form, searchDepth: event.target.value })}><option value="basic">Basic · 1 crédit</option><option value="advanced">Advanced · 2 crédits</option></select></Field>
      <Field label="Résultats maximum"><input type="number" min="1" max="20" value={form.maxResults} onChange={(event) => setForm({ ...form, maxResults: event.target.value })} /></Field>
      <Field label="Fenêtre de fraîcheur"><select value={form.timeRange} onChange={(event) => setForm({ ...form, timeRange: event.target.value })}><option value="day">24 heures</option><option value="week">7 jours</option><option value="month">30 jours</option><option value="year">12 mois</option></select></Field>
      <Field label="Pays"><input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} /></Field>
      <Field label="Domaines autorisés" wide><textarea rows={3} value={form.allowedDomains} onChange={(event) => setForm({ ...form, allowedDomains: event.target.value })} placeholder="gov.ma, hcp.ma…" /></Field>
      <Field label="Domaines bloqués" wide><textarea rows={3} value={form.blockedDomains} onChange={(event) => setForm({ ...form, blockedDomains: event.target.value })} /></Field>
    </div></section>
    <section className={styles.panel}><header><div><span className={styles.eyebrow}>OPENROUTER ANALYSIS POLICY</span><h2>Analyse structurée</h2><p>Chaque run enregistre le modèle réellement sélectionné.</p></div><BrainCircuit /></header><div className={styles.formGrid}>
      <Field label="Modèle demandé"><input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} /></Field>
      <Field label="Sources maximum"><input type="number" min="1" max="30" value={form.maxSources} onChange={(event) => setForm({ ...form, maxSources: event.target.value })} /></Field>
      <Field label="Caractères / source"><input type="number" min="500" value={form.maxSourceCharacters} onChange={(event) => setForm({ ...form, maxSourceCharacters: event.target.value })} /></Field>
      <Field label="Tokens sortie max"><input type="number" min="512" value={form.maxOutputTokens} onChange={(event) => setForm({ ...form, maxOutputTokens: event.target.value })} /></Field>
      <Field label="Tentatives réparation schéma"><input type="number" min="0" max="2" value={form.schemaRepairAttempts} onChange={(event) => setForm({ ...form, schemaRepairAttempts: event.target.value })} /></Field>
      <Field label="Confiance preuve min"><input type="number" min="0" max="100" value={form.minimumEvidenceConfidence} onChange={(event) => setForm({ ...form, minimumEvidenceConfidence: event.target.value })} /></Field>
      <Field label="Pertinence min"><input type="number" min="0" max="100" value={form.minimumRelevance} onChange={(event) => setForm({ ...form, minimumRelevance: event.target.value })} /></Field>
      <Field label="Fit ANGELCARE min"><input type="number" min="0" max="100" value={form.minimumBusinessFit} onChange={(event) => setForm({ ...form, minimumBusinessFit: event.target.value })} /></Field>
      <Field label="Score opportunité min"><input type="number" min="0" max="100" value={form.minimumOpportunityScore} onChange={(event) => setForm({ ...form, minimumOpportunityScore: event.target.value })} /></Field>
    </div></section>
  </div><div className={styles.footerCommand}><div><ShieldCheck /><span><strong>Validation déterministe obligatoire</strong><small>Source IDs, plages numériques, schéma JSON et déduplication sont vérifiés avant création interne.</small></span></div><button type="button" className={styles.primaryButton} onClick={save} disabled={busy === 'save_agent_policy'}><Save /> Enregistrer les politiques</button></div></section>
}

function MaterializationControl({ selectedAgent, form, setForm, save, busy }: { selectedAgent: ResearchAgent | null; form: AgentForm; setForm: (value: AgentForm) => void; save: () => void; busy: string }) {
  const controls: Array<{ key: keyof AgentForm; label: string; detail: string }> = [
    { key: 'createCanonicalSources', label: 'Créer / mettre à jour les sources canoniques', detail: 'Registre AC Capital, URL normalisée, hash et provenance.' },
    { key: 'createSignals', label: 'Créer des signaux Observatoire', detail: 'Uniquement lorsque les seuils de preuve et pertinence sont atteints.' },
    { key: 'createContentOpportunities', label: 'Créer des opportunités de contenu', detail: 'Angles éditoriaux, fenêtres de communication et besoins Content Command.' },
    { key: 'createStrategicCandidates', label: 'Créer des candidats stratégiques', detail: 'Prépare des constats pour Fabrique stratégique sans les approuver.' },
    { key: 'createBriefEnrichment', label: 'Enrichir les briefs', detail: 'Ajoute des suggestions et lacunes sourcées; ne réécrit pas le brief.' },
    { key: 'createEditorialSuggestions', label: 'Créer des suggestions éditoriales', detail: 'Fenêtres, thèmes et rafraîchissements pour Planning éditorial.' },
    { key: 'createInternalTasks', label: 'Créer des actions internes', detail: 'Prépare des plans de tâches dans la queue interne Content Command.' },
    { key: 'createEvidenceRequests', label: 'Créer des demandes de preuve', detail: 'Alimente Evidence Lab sans accepter les preuves.' },
    { key: 'createReviewObservations', label: 'Créer des observations de révision', detail: 'Conseils consultatifs; ne clôture aucun finding.' },
    { key: 'updateDossier360', label: 'Mettre à jour Dossier 360', detail: 'Seulement lorsque le contexte dossier est explicitement présent.' },
    { key: 'alertCommandement', label: 'Alerter Commandement 360', detail: 'Risques de communication, urgence élevée ou blocage fournisseur.' },
  ]
  return <section className={styles.workspace}><section className={styles.materializationTheatre}><header><div><span className={styles.eyebrow}>INTERNAL AUTHORITY MATRIX</span><h2>Création automatique interne</h2><p>{selectedAgent?.name} · politique v{selectedAgent?.policy_version}</p></div><StatusPill status="active" label="internal_autopilot" /></header><div className={styles.toggleGrid}>{controls.map((control) => <Toggle key={String(control.key)} checked={Boolean(form[control.key])} onChange={(value) => setForm({ ...form, [control.key]: value })} label={control.label} detail={control.detail} />)}</div><div className={styles.externalWall}><LockKeyhole /><div><span>WALL OF HUMAN AUTHORITY</span><h3>Actions externes toujours bloquées</h3><p>Email · WhatsApp · publication · publicité · contact tiers · déclaration publique · soumission formelle.</p></div><strong>HUMAN APPROVAL REQUIRED</strong></div><footer><button type="button" className={styles.primaryButton} onClick={save} disabled={busy === 'save_agent_policy'}><Save /> Enregistrer l’autorité interne</button></footer></section></section>
}

function RunsControl({ snapshot, selectedRun, selectedRunId, setSelectedRunId, events }: { snapshot: ResearchControlSnapshot; selectedRun: ResearchRun | null; selectedRunId: string; setSelectedRunId: (id: string) => void; events: ResearchRunEvent[] }) {
  const findings = snapshot.findings.filter((finding) => finding.run_id === selectedRunId)
  const sources = snapshot.sources.filter((source) => source.research_run_id === selectedRunId || list(selectedRun?.materialization_result && asRecord(selectedRun.materialization_result).canonicalSourceIds).includes(source.id))
  return <section className={styles.workspace}><div className={styles.runWorkbench}>
    <aside className={styles.runRail}><header><span className={styles.eyebrow}>RESEARCH RUNS</span><h2>{snapshot.runs.length} exécutions</h2></header><div>{snapshot.runs.map((run) => <button type="button" key={run.id} className={run.id === selectedRunId ? styles.runRailActive : styles.runRailButton} onClick={() => setSelectedRunId(run.id)}><span><Activity /></span><div><small>{run.agent_code} · {formatDate(run.created_at)}</small><strong>{run.research_command}</strong><em>{run.accepted_source_count} sources · {run.finding_count} constats</em></div><StatusPill status={run.status} /></button>)}</div></aside>
    <section className={styles.runInspector}>{selectedRun ? <><header><div><span className={styles.eyebrow}>RUN {selectedRun.id.slice(0, 8).toUpperCase()}</span><h2>{selectedRun.research_command}</h2><p>{selectedRun.objective}</p></div><StatusPill status={selectedRun.status} /></header><div className={styles.runIdentity}><span><Search /><small>Search</small><strong>{selectedRun.search_provider || '—'}</strong></span><span><BrainCircuit /><small>Modèle résolu</small><strong>{selectedRun.resolved_model || selectedRun.requested_model || '—'}</strong></span><span><Database /><small>Sources</small><strong>{selectedRun.accepted_source_count}</strong></span><span><Sparkles /><small>Constats</small><strong>{selectedRun.finding_count}</strong></span><span><Zap /><small>Crédits</small><strong>{selectedRun.search_credits}</strong></span><span><Clock3 /><small>Latence</small><strong>{selectedRun.latency_ms ? `${selectedRun.latency_ms} ms` : '—'}</strong></span></div><section className={styles.runSummary}><h3>Résumé institutionnel</h3><p>{selectedRun.result_summary || selectedRun.error_message || 'Le run ne possède pas encore de conclusion.'}</p><div><code>{selectedRun.query}</code></div></section>
      <div className={styles.runDetailGrid}><section><header><h3>Chronologie</h3><span>{events.length} événements</span></header><div className={styles.eventTimeline}>{events.map((event) => <article key={event.id}><span /><div><small>{formatDate(event.created_at)} · {event.stage}</small><strong>{event.message}</strong><code>{event.event_type}</code></div></article>)}{!events.length ? <EmptyState icon={<History />} title="Aucun événement" detail="Le run n’a pas encore produit de chronologie persistée." /> : null}</div></section><section><header><h3>Constats structurés</h3><span>{findings.length}</span></header><div className={styles.findingList}>{findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)}{!findings.length ? <EmptyState icon={<Sparkles />} title="Aucun constat" detail="Aucun résultat n’a franchi la validation de schéma et de preuve." /> : null}</div></section></div>
      <section className={styles.sourceRegister}><header><div><h3>Sources canoniques AC Capital</h3><p>Registre public partagé; aucune source n’est automatiquement considérée comme approuvée.</p></div><span>{sources.length} source(s)</span></header><div>{sources.map((source) => <article key={source.id}><span><Globe2 /></span><div><small>{source.publisher || 'Source publique'} · rang {source.provider_rank || '—'}</small><strong>{source.title}</strong><p>{source.snippet}</p><a href={source.canonical_url} target="_blank" rel="noreferrer">Ouvrir la source <ArrowRight /></a></div><div><StatusPill status={source.credibility_state} /><small>{formatDate(source.retrieved_at)}</small></div></article>)}</div></section></> : <EmptyState icon={<Activity />} title="Sélectionnez un run" detail="Inspectez ses fournisseurs, modèle résolu, sources, constats et événements." />}</section>
  </div></section>
}

function FindingCard({ finding }: { finding: ResearchFinding }) {
  return <article><div><StatusPill status={finding.status} /><small>{finding.finding_type}</small></div><h4>{finding.title}</h4><p>{finding.description}</p><div className={styles.scoreStrip}><span><small>Pertinence</small><strong>{finding.relevance_score}</strong></span><span><small>Fit</small><strong>{finding.business_fit_score}</strong></span><span><small>Urgence</small><strong>{finding.urgency_score}</strong></span><span><small>Preuve</small><strong>{finding.evidence_confidence}</strong></span><span><small>Combiné</small><strong>{finding.combined_score}</strong></span></div><footer><small>{finding.source_ids.length} source(s) AC Capital</small><strong>{finding.recommended_internal_action || 'Aucune action interne recommandée'}</strong></footer></article>
}

function AlertsControl({ alerts, acknowledge, busy }: { alerts: ResearchAlert[]; acknowledge: (alert: ResearchAlert) => void; busy: string }) {
  return <section className={styles.workspace}><section className={styles.alertCommand}><header><div><span className={styles.eyebrow}>INTERVENTION QUEUE</span><h2>Alertes Recherche IA</h2><p>Quotas, credentials, fournisseurs, persistance, schéma et risques Content Command.</p></div><StatusPill status={alerts.some((alert) => alert.status === 'open') ? 'degraded' : 'active'} label={`${alerts.filter((alert) => alert.status === 'open').length} ouverte(s)`} /></header><div className={styles.alertList}>{alerts.map((alert) => <article key={alert.id} className={alert.severity === 'critical' ? styles.alertCritical : alert.severity === 'high' ? styles.alertHigh : styles.alertNormal}><span>{alert.severity === 'critical' ? <CircleAlert /> : <AlertTriangle />}</span><div><small>{alert.provider_key || 'Content Command'} · {formatDate(alert.created_at)}</small><strong>{alert.title}</strong><p>{alert.message}</p><code>{alert.alert_type}</code></div><div><StatusPill status={alert.status} /><button type="button" className={styles.secondaryButton} disabled={alert.status !== 'open' || busy === 'acknowledge_alert'} onClick={() => acknowledge(alert)}><Check /> Reconnaître</button></div></article>)}{!alerts.length ? <EmptyState icon={<CheckCircle2 />} title="Aucune alerte" detail="La chaîne n’a enregistré aucun incident ou seuil nécessitant une intervention." /> : null}</div></section></section>
}

function AuditControl({ snapshot }: { snapshot: ResearchControlSnapshot & { audit?: Array<Record<string, unknown>> } }) {
  const audit = snapshot.audit || []
  return <section className={styles.workspace}><div className={styles.auditGrid}><section className={styles.panel}><header><div><span className={styles.eyebrow}>POLICY LINEAGE</span><h2>Historique institutionnel</h2><p>Chaque mutation de fournisseur, agent ou alerte reste visible.</p></div><History /></header><div className={styles.auditTimeline}>{audit.map((entry, index) => <article key={String(entry.id || index)}><span /><div><small>{formatDate(String(entry.created_at || ''))} · {String(entry.actor_name || 'Système')}</small><strong>{String(entry.action || 'research.audit')}</strong><p>{String(entry.reason || `${entry.entity_type || 'objet'} ${entry.entity_id || ''}`)}</p></div></article>)}{!audit.length ? <EmptyState icon={<Archive />} title="Audit vide" detail="Les premières mutations persistées apparaîtront ici." /> : null}</div></section><section className={styles.panel}><header><div><span className={styles.eyebrow}>NON-NEGOTIABLE BOUNDARIES</span><h2>Garanties runtime</h2></div><ShieldCheck /></header><div className={styles.guaranteeList}><Guarantee text="Aucune clé Tavily ou OpenRouter renvoyée au navigateur." /><Guarantee text="Aucune dépendance Gemini dans la chaîne Research Control." /><Guarantee text="Aucune analyse OpenRouter avant persistance des sources AC Capital." /><Guarantee text="Aucun finding sans source ID valide du run." /><Guarantee text="Aucune opportunité de contenu sous les seuils configurés." /><Guarantee text="Aucun email, WhatsApp, contact tiers, publication ou soumission automatique." /><Guarantee text="Toutes les politiques agents sont versionnées." /><Guarantee text="Tous les runs, usages, erreurs et créations internes sont auditables." /></div><Link className={styles.primaryButton} href="/market-os/content-command-center/signals"><Radar /> Ouvrir Observatoire</Link></section></div></section>
}

function Guarantee({ text: value }: { text: string }) {
  return <div><CheckCircle2 /><p>{value}</p></div>
}
