'use client'

import Link from 'next/link'
import * as React from 'react'
import {
  Activity,
  Archive,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  FileSpreadsheet,
  Gauge,
  GraduationCap,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Upload,
  Workflow,
  X,
} from 'lucide-react'
import styles from './marketing-ai-director.module.css'
import {
  CONTENT_ASSETS_KEY,
  CONTENT_BRIEFS_KEY,
  CONTENT_ITEMS_KEY,
  CONTENT_LOGS_KEY,
  CONTENT_TASKS_KEY,
  type ContentAsset,
  type ContentBrief,
  type ContentItem,
  type ContentLog,
  type ContentTask,
  nowISO,
  readJson,
  todayISO,
  uid,
  writeJson,
} from '../content-command-system'

export type MarketingAiView = 'command' | 'commands' | 'skills' | 'schedules' | 'missions' | 'runs' | 'learning' | 'doctrine' | 'settings' | 'autopilot' | 'compiler' | 'queue' | 'decisions' | 'integrations' | 'repository' | 'recovery'

type ApiState<T> = { loading: boolean; error: string; data: T | null }
type DashboardSnapshot = {
  source: string
  provider: { enabled: boolean; configured: boolean; model: string; searchGrounding: boolean; externalActionsAllowed: false }
  totals: { skills: number; commands: number; activeCommands: number; schedules: number; dueSchedules: number; missions: number; runs: number; needsReview: number; learningEvents: number }
  recentRuns: RunRecord[]
  dueSchedules: ScheduleRecord[]
}
type CommandRecord = {
  id?: string; code: string; name: string; skillCode: string; skillName: string; category: string; objective: string; instruction: string
  defaultFrequency: string; authorityMode: string; riskLevel: string; requiresHumanReview: boolean; status: string; deployed: boolean; tags: string[]; source: string; version: string
}
type SkillRecord = { code: string; name: string; category: string; description: string; defaultFrequency: string; mode: string; riskLevel: string; progressiveLevels: string[]; monthlyResourceUpdate: boolean; status: string }
type ScheduleRecord = { id: string; name: string; commandCode: string; frequency: string; timezone: string; hour: number; minute: number; dayOfWeek?: number | null; dayOfMonth?: number | null; enabled: boolean; authorityMode: string; objective: string; lastRunAt?: string | null; nextRunAt?: string | null }
type MissionRecord = { id: string; title: string; objective: string; sponsor: string; authorityMode: string; status: string; priority: string; commandCodes: string[]; createdAt: string }
type RunRecord = { id: string; commandCode: string; status: string; authorityMode: string; model?: string | null; objective: string; output?: { executiveSummary?: string; recommendations?: string[]; findings?: string[]; confidence?: number; humanDecisionRequired?: boolean } | null; error?: string | null; inputTokens: number; outputTokens: number; totalTokens: number; latencyMs: number; grounded: boolean; createdAt: string }
type ActionRecord = { id: string; run_id: string; command_code: string; action_type: string; title: string; description: string; requires_approval: boolean; payload: Record<string, unknown>; status: string; created_at: string }
type DoctrineRecord = { id: string; code: string; title: string; category: string; authority_state: string; content: string; version: string; source?: string; updated_at?: string }
type LearningRecord = { id: string; title: string; evidence: string[]; recommendation: string; confidence: number; status: string; created_at: string }
type ResourceUpdate = { id: string; title: string; summary: string; domains: string[]; recommendations: string[]; sources: unknown[]; status: string; created_at: string }

const AI_BASE = '/market-os/content-command-center/ai-director'
const views: Array<{ key: MarketingAiView; label: string; description: string; href: string; icon: React.ReactNode }> = [
  { key: 'command', label: 'Commandement IA', description: 'Position exécutive et décisions', href: AI_BASE, icon: <Gauge /> },
  { key: 'commands', label: 'Commandes 3000', description: 'Registre, import CSV et déploiement', href: `${AI_BASE}/commands`, icon: <BrainCircuit /> },
  { key: 'skills', label: 'Compétences', description: '60 noyaux progressifs', href: `${AI_BASE}/skills`, icon: <GraduationCap /> },
  { key: 'schedules', label: 'Fréquences', description: 'Planification configurable', href: `${AI_BASE}/schedules`, icon: <CalendarClock /> },
  { key: 'missions', label: 'Missions', description: 'Mandats multidimensionnels', href: `${AI_BASE}/missions`, icon: <Workflow /> },
  { key: 'runs', label: 'Exécutions', description: 'Runs, décisions et actions internes', href: `${AI_BASE}/runs`, icon: <Activity /> },
  { key: 'learning', label: 'Apprentissage', description: 'Ressources mensuelles et mémoire', href: `${AI_BASE}/learning`, icon: <Sparkles /> },
  { key: 'doctrine', label: 'Doctrine', description: 'Autorité et vérité ANGELCARE', href: `${AI_BASE}/doctrine`, icon: <BookOpenCheck /> },
  { key: 'settings', label: 'Configuration', description: 'Gemini, sécurité et limites', href: `${AI_BASE}/settings`, icon: <Settings2 /> },
  { key: 'autopilot', label: 'Autopilot', description: 'Orchestration interne Phase 3', href: `${AI_BASE}/autopilot`, icon: <Rocket /> },
  { key: 'compiler', label: 'Compiler', description: 'Stratégie vers exécution', href: `${AI_BASE}/compiler`, icon: <Workflow /> },
  { key: 'queue', label: 'Live Queue', description: 'Jobs et récupération', href: `${AI_BASE}/queue`, icon: <Activity /> },
  { key: 'decisions', label: 'Décisions', description: 'Autorité humaine', href: `${AI_BASE}/decisions`, icon: <ShieldCheck /> },
  { key: 'integrations', label: 'Propagation', description: 'Liens et conflits', href: `${AI_BASE}/integrations`, icon: <RefreshCw /> },
  { key: 'repository', label: 'Repository', description: 'Bridge et versions', href: `${AI_BASE}/repository`, icon: <Archive /> },
  { key: 'recovery', label: 'Recovery', description: 'Dead letters et reprise', href: `${AI_BASE}/recovery`, icon: <CircleAlert /> },
]

const frequencyLabels: Record<string, string> = {
  manual: 'Manuelle', hourly: 'Chaque heure', every_4_hours: 'Toutes les 4 heures', daily: 'Quotidienne', weekdays: 'Jours ouvrés', weekly: 'Hebdomadaire', biweekly: 'Toutes les 2 semaines', monthly: 'Mensuelle', quarterly: 'Trimestrielle',
}
const authorityLabels: Record<string, string> = { observe: 'Observer', advise: 'Conseiller', prepare: 'Préparer', orchestrate_internal: 'Orchestrer en interne' }
const statusLabels: Record<string, string> = { active: 'Active', draft: 'Brouillon', paused: 'Suspendue', retired: 'Retirée', running: 'En cours', needs_review: 'Décision requise', completed: 'Terminée', failed: 'Échec', blocked: 'Bloquée', approved: 'Approuvée', awaiting_approval: 'Approbation requise', prepared: 'Préparée', executed: 'Matérialisée', rejected: 'Rejetée' }

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'include', ...init, headers: { Accept: 'application/json', ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(init?.headers || {}) } })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload.ok === false) throw new Error(payload.error || `HTTP_${response.status}`)
  return payload as T
}

function useApiState<T>(loader: () => Promise<T>, deps: React.DependencyList = []) {
  const [state, setState] = React.useState<ApiState<T>>({ loading: true, error: '', data: null })
  const refresh = React.useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }))
    try { setState({ loading: false, error: '', data: await loader() }) }
    catch (error) { setState({ loading: false, error: error instanceof Error ? error.message : 'Erreur inconnue', data: null }) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  React.useEffect(() => { void refresh() }, [refresh])
  return { ...state, refresh }
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  return <span className={`${styles.badge} ${styles[`badge_${tone}`]}`}>{children}</span>
}

function Spinner() { return <LoaderCircle className={styles.spinner} aria-label="Chargement" /> }

function PanelError({ error, retry }: { error: string; retry?: () => void }) {
  return <div className={styles.panelError}><CircleAlert /><div><strong>Zone indisponible</strong><p>{error}</p></div>{retry ? <button onClick={retry}><RefreshCw /> Réessayer</button> : null}</div>
}

function DirectorHeader({ snapshot, loading, onHealth }: { snapshot?: DashboardSnapshot; loading?: boolean; onHealth: () => void }) {
  const ready = snapshot?.provider.configured
  return (
    <section className={styles.hero}>
      <div className={styles.heroGlow} />
      <div className={styles.heroBrand}>
        <div className={styles.heroIcon}><BrainCircuit /></div>
        <div>
          <span className={styles.eyebrow}>SANILA MARKET OS · CONTENT COMMAND 360</span>
          <h1>Marketing Director AI</h1>
          <p>Direction marketing multidimensionnelle, 3 000 commandes gouvernées, 60 compétences progressives et orchestration interne sous autorité humaine.</p>
        </div>
      </div>
      <div className={styles.heroStatus}>
        <div><span>Gemini</span><strong>{loading ? 'Vérification…' : ready ? 'Configuré' : 'Configuration requise'}</strong></div>
        <div><span>Modèle</span><strong>{snapshot?.provider.model || 'Gemini via .env.local'}</strong></div>
        <div><span>Actions externes</span><strong className={styles.locked}><LockKeyhole /> Bloquées</strong></div>
        <button onClick={onHealth}><RefreshCw /> Test santé</button>
      </div>
    </section>
  )
}

function AiNav({ active }: { active: MarketingAiView }) {
  return <nav className={styles.aiNav} aria-label="Navigation Marketing Director AI"><div>{views.map((view) => <Link key={view.key} href={view.href} className={active === view.key ? styles.active : ''}><span>{view.icon}</span><span><strong>{view.label}</strong><small>{view.description}</small></span></Link>)}</div></nav>
}

function Kpi({ label, value, detail, icon, tone = 'default' }: { label: string; value: React.ReactNode; detail: string; icon: React.ReactNode; tone?: 'default' | 'warning' | 'success' }) {
  return <article className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}><div>{icon}</div><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function SourceNotice({ source }: { source?: string }) {
  return <div className={styles.sourceNotice}><ShieldCheck /><div><strong>Source opérationnelle</strong><p>{source === 'database' ? 'Supabase Marketing AI actif. Les commandes, missions, fréquences et exécutions sont persistées.' : 'Catalogue intégré de secours affiché. Appliquez la migration Phase 2 pour activer la persistance complète.'}</p></div><Badge tone={source === 'database' ? 'success' : 'warning'}>{source === 'database' ? 'Base active' : 'Catalogue de secours'}</Badge></div>
}

function DashboardView() {
  const dashboard = useApiState<{ snapshot: DashboardSnapshot }>(() => api('/api/market-os/content-command/marketing-ai/dashboard'), [])
  const actions = useApiState<{ actions: ActionRecord[] }>(() => api('/api/market-os/content-command/marketing-ai/actions'), [])
  const [healthMessage, setHealthMessage] = React.useState('')
  async function health() {
    setHealthMessage('Test Gemini en cours…')
    try { const result = await api<{ health: { available: boolean; message: string; model: string } }>('/api/market-os/content-command/marketing-ai/health?live=1'); setHealthMessage(`${result.health.available ? 'PASS' : 'ATTENTION'} · ${result.health.message}`) }
    catch (error) { setHealthMessage(error instanceof Error ? error.message : 'Échec du test') }
  }
  const snapshot = dashboard.data?.snapshot
  return <>
    <DirectorHeader snapshot={snapshot} loading={dashboard.loading} onHealth={() => void health()} />
    {healthMessage ? <div className={styles.toast}>{healthMessage}<button onClick={() => setHealthMessage('')}><X /></button></div> : null}
    <AiNav active="command" />
    <main className={styles.canvas}>
      {dashboard.error ? <PanelError error={dashboard.error} retry={dashboard.refresh} /> : null}
      {snapshot ? <>
        <SourceNotice source={snapshot.source} />
        <section className={styles.kpiGrid}>
          <Kpi label="Commandes cerveau" value={snapshot.totals.commands.toLocaleString('fr-FR')} detail={`${snapshot.totals.activeCommands.toLocaleString('fr-FR')} actives et déployées`} icon={<BrainCircuit />} tone="success" />
          <Kpi label="Compétences cœur" value={snapshot.totals.skills} detail="10 domaines · 5 niveaux progressifs" icon={<GraduationCap />} />
          <Kpi label="Fréquences actives" value={snapshot.totals.schedules} detail={`${snapshot.totals.dueSchedules} commande(s) arrivée(s) à échéance`} icon={<CalendarClock />} tone={snapshot.totals.dueSchedules ? 'warning' : 'default'} />
          <Kpi label="Missions exécutives" value={snapshot.totals.missions} detail={`${snapshot.totals.runs} runs audités`} icon={<Workflow />} />
          <Kpi label="Décisions requises" value={snapshot.totals.needsReview} detail="Aucune auto-approbation" icon={<ShieldCheck />} tone={snapshot.totals.needsReview ? 'warning' : 'success'} />
          <Kpi label="Apprentissages" value={snapshot.totals.learningEvents} detail="Propositions mensuelles gouvernées" icon={<Sparkles />} />
        </section>
        <section className={styles.executiveGrid}>
          <article className={styles.primaryPanel}>
            <div className={styles.sectionHeader}><div><span>POSITION DU DIRECTEUR IA</span><h2>Ce que l’organisation doit piloter maintenant</h2></div><Link href={`${AI_BASE}/missions`}><Plus /> Nouveau mandat</Link></div>
            <div className={styles.commandLanes}>
              <Link href={`${AI_BASE}/commands`}><BrainCircuit /><div><strong>3 000 commandes déployables</strong><p>Rechercher, filtrer, importer par CSV, suspendre ou exécuter chaque commandement.</p></div><ChevronRight /></Link>
              <Link href={`${AI_BASE}/schedules`}><CalendarClock /><div><strong>Fréquences gouvernées</strong><p>Configurer cadence, heure, fuseau, autorité, contexte et prochaine exécution.</p></div><ChevronRight /></Link>
              <Link href={`${AI_BASE}/learning`}><Sparkles /><div><strong>Développement mensuel</strong><p>Mettre à jour Gemini et les ressources marketing avec recherche sourcée et validation humaine.</p></div><ChevronRight /></Link>
              <Link href={`${AI_BASE}/runs`}><ListChecks /><div><strong>Actions internes préparées</strong><p>Approuver puis matérialiser briefs, contenus, tâches et besoins assets dans Content Command.</p></div><ChevronRight /></Link>
            </div>
          </article>
          <aside className={styles.decisionRail}>
            <div className={styles.railHeader}><ShieldCheck /><div><strong>Frontière d’autorité</strong><p>Invariable et auditable</p></div></div>
            <ul>
              <li><CheckCircle2 /> Observer, rechercher et analyser</li>
              <li><CheckCircle2 /> Préparer briefs, drafts, tâches et plans</li>
              <li><CheckCircle2 /> Orchestrer les flux internes approuvés</li>
              <li className={styles.prohibited}><LockKeyhole /> Aucun email, WhatsApp, post ou publicité externe</li>
              <li className={styles.prohibited}><LockKeyhole /> Aucune auto-approbation de doctrine ou de création finale</li>
            </ul>
          </aside>
        </section>
        <section className={styles.splitGrid}>
          <article className={styles.tablePanel}><div className={styles.sectionHeader}><div><span>RUNS RÉCENTS</span><h2>Exécution et décisions</h2></div><Link href={`${AI_BASE}/runs`}>Ouvrir le registre <ArrowRight /></Link></div>{snapshot.recentRuns.length ? <div className={styles.simpleList}>{snapshot.recentRuns.map((run) => <div key={run.id}><span className={styles.code}>{run.commandCode}</span><div><strong>{run.objective}</strong><small>{new Date(run.createdAt).toLocaleString('fr-FR')} · {run.model || 'modèle non enregistré'}</small></div><Badge tone={run.status === 'completed' ? 'success' : run.status === 'needs_review' ? 'warning' : run.status === 'failed' ? 'danger' : 'info'}>{statusLabels[run.status] || run.status}</Badge></div>)}</div> : <div className={styles.empty}><Activity /><strong>Aucune exécution</strong><p>Créez un mandat ou exécutez une commande du registre.</p></div>}</article>
          <article className={styles.tablePanel}><div className={styles.sectionHeader}><div><span>ACTIONS INTERNES</span><h2>À approuver ou matérialiser</h2></div><Link href={`${AI_BASE}/runs`}>Gérer <ArrowRight /></Link></div>{actions.loading ? <Spinner /> : actions.error ? <PanelError error={actions.error} retry={actions.refresh} /> : actions.data?.actions?.length ? <div className={styles.simpleList}>{actions.data.actions.slice(0, 6).map((action) => <div key={action.id}><span className={styles.actionIcon}><Rocket /></span><div><strong>{action.title}</strong><small>{action.action_type} · {action.command_code}</small></div><Badge tone={action.status === 'executed' ? 'success' : 'warning'}>{statusLabels[action.status] || action.status}</Badge></div>)}</div> : <div className={styles.empty}><ListChecks /><strong>Aucune action en attente</strong><p>Les actions proposées par Gemini apparaîtront ici.</p></div>}</article>
        </section>
      </> : dashboard.loading ? <div className={styles.loadingPage}><Spinner /><strong>Assemblage du cockpit Marketing Director AI…</strong></div> : null}
    </main>
  </>
}

function CommandsView() {
  const [search, setSearch] = React.useState('')
  const [category, setCategory] = React.useState('')
  const [status, setStatus] = React.useState('')
  const [page, setPage] = React.useState(1)
  const [notice, setNotice] = React.useState('')
  const [runCommand, setRunCommand] = React.useState<CommandRecord | null>(null)
  const [editCommand, setEditCommand] = React.useState<CommandRecord | null>(null)
  const [objective, setObjective] = React.useState('')
  const commands = useApiState<{ items: CommandRecord[]; total: number; page: number; pageSize: number; source: string; categories: string[] }>(() => api(`/api/market-os/content-command/marketing-ai/commands?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}&page=${page}&pageSize=50`), [search, category, status, page])
  const categories = commands.data?.categories || []
  async function patch(command: CommandRecord, patchValue: Partial<CommandRecord>) {
    setNotice('Mise à jour…')
    try { await api(`/api/market-os/content-command/marketing-ai/commands/${encodeURIComponent(command.code)}`, { method: 'PATCH', body: JSON.stringify(patchValue) }); setNotice('Commande mise à jour.'); await commands.refresh() }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Échec') }
  }
  async function importCsv(file: File) {
    const form = new FormData(); form.set('file', file); setNotice('Import et validation CSV…')
    try { const result = await api<{ accepted: number; rejected: number }>('/api/market-os/content-command/marketing-ai/commands/import', { method: 'POST', body: form }); setNotice(`${result.accepted} commande(s) importée(s), ${result.rejected} rejetée(s).`); await commands.refresh() }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Import impossible') }
  }
  async function execute() {
    if (!runCommand || objective.trim().length < 8) return
    setNotice('Gemini exécute la commande…')
    try { const result = await api<{ run: RunRecord }>('/api/market-os/content-command/marketing-ai/runs', { method: 'POST', body: JSON.stringify({ commandCode: runCommand.code, objective, authorityMode: runCommand.authorityMode, context: { source: 'command_registry_manual_run' } }) }); setNotice(`Run ${result.run.id.slice(0, 8)} créé · ${statusLabels[result.run.status] || result.run.status}`); setRunCommand(null); setObjective('') }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Exécution impossible') }
  }
  return <>
    <AiNav active="commands" />
    <main className={styles.canvas}>
      <section className={styles.pageIntro}><div><span>REGISTRE SOUVERAIN</span><h1>3 000 commandes cerveau</h1><p>Commandements stricts, progressifs et gouvernés. Importez vos propres commandes par CSV, déployez-les, planifiez-les et contrôlez chaque exécution.</p></div><div className={styles.pageActions}><a href="/api/market-os/content-command/marketing-ai/commands/template"><FileSpreadsheet /> Modèle CSV</a><a href="/api/market-os/content-command/marketing-ai/commands/export"><Download /> Export complet</a><label><Upload /> Importer CSV<input type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file) }} /></label></div></section>
      {notice ? <div className={styles.toast}>{notice}<button onClick={() => setNotice('')}><X /></button></div> : null}
      <section className={styles.filterBar}><label><Search /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Code, nom, objectif…" /></label><select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1) }}><option value="">Tous les domaines</option>{categories.map((value) => <option key={value}>{value}</option>)}</select><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="">Tous les statuts</option><option value="active">Actives</option><option value="draft">Brouillons</option><option value="paused">Suspendues</option><option value="retired">Retirées</option></select><div><strong>{commands.data?.total.toLocaleString('fr-FR') || '—'}</strong><span>résultats</span></div></section>
      {commands.error ? <PanelError error={commands.error} retry={commands.refresh} /> : commands.loading ? <div className={styles.loadingPage}><Spinner /><strong>Chargement du registre…</strong></div> : <section className={styles.commandTablePanel}><div className={styles.commandTableHeader}><span>Code</span><span>Commande et compétence</span><span>Autorité</span><span>Fréquence</span><span>Risque</span><span>Déploiement</span><span>Actions</span></div>{commands.data?.items.map((command) => <article key={command.code} className={styles.commandRow}><span className={styles.code}>{command.code}</span><div className={styles.commandIdentity}><strong>{command.name}</strong><small>{command.skillCode} · {command.category}</small><p>{command.objective}</p></div><Badge tone="info">{authorityLabels[command.authorityMode] || command.authorityMode}</Badge><span>{frequencyLabels[command.defaultFrequency] || command.defaultFrequency}</span><Badge tone={command.riskLevel === 'critical' ? 'danger' : command.riskLevel === 'high' ? 'warning' : 'neutral'}>{command.riskLevel}</Badge><Badge tone={command.deployed && command.status === 'active' ? 'success' : 'warning'}>{command.deployed && command.status === 'active' ? 'Déployée' : statusLabels[command.status] || command.status}</Badge><div className={styles.rowActions}><button onClick={() => { setRunCommand(command); setObjective(command.objective) }} disabled={!command.deployed || command.status !== 'active'} title="Exécuter"><Play /></button><button onClick={() => setEditCommand({ ...command })} title="Configurer"><Settings2 /></button><button onClick={() => void patch(command, command.deployed ? { deployed: false, status: 'paused' } : { deployed: true, status: 'active' })} title={command.deployed ? 'Suspendre' : 'Déployer'}>{command.deployed ? <Archive /> : <Rocket />}</button></div></article>)}</section>}
      <div className={styles.pagination}><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Précédent</button><span>Page {page} · {commands.data?.source === 'database' ? 'Supabase' : 'Catalogue intégré'}</span><button disabled={!commands.data || page * commands.data.pageSize >= commands.data.total} onClick={() => setPage((value) => value + 1)}>Suivant</button></div>
      {editCommand ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setEditCommand(null)}><section className={styles.modal} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><div className={styles.modalHeader}><div><span>{editCommand.code}</span><h2>Configurer la commande</h2></div><button onClick={() => setEditCommand(null)}><X /></button></div><p className={styles.modalLead}>Modifiez le cerveau opérationnel sans changer sa frontière d’autorité externe. Toute évolution reste auditée dans Supabase.</p><div className={styles.modalBody}><label className={styles.field}><span>Nom</span><input value={editCommand.name} onChange={(event) => setEditCommand({ ...editCommand, name: event.target.value })} /></label><label className={styles.field}><span>Objectif</span><textarea rows={4} value={editCommand.objective} onChange={(event) => setEditCommand({ ...editCommand, objective: event.target.value })} /></label><label className={styles.field}><span>Instruction stricte</span><textarea rows={8} value={editCommand.instruction} onChange={(event) => setEditCommand({ ...editCommand, instruction: event.target.value })} /></label><div className={styles.fieldGrid}><label className={styles.field}><span>Fréquence</span><select value={editCommand.defaultFrequency} onChange={(event) => setEditCommand({ ...editCommand, defaultFrequency: event.target.value })}>{Object.entries(frequencyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className={styles.field}><span>Autorité</span><select value={editCommand.authorityMode} onChange={(event) => setEditCommand({ ...editCommand, authorityMode: event.target.value })}>{Object.entries(authorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><div className={styles.fieldGrid}><label className={styles.field}><span>Risque</span><select value={editCommand.riskLevel} onChange={(event) => setEditCommand({ ...editCommand, riskLevel: event.target.value })}><option value="low">Faible</option><option value="medium">Moyen</option><option value="high">Élevé</option><option value="critical">Critique</option></select></label><label className={styles.checkField}><input type="checkbox" checked={editCommand.requiresHumanReview} onChange={(event) => setEditCommand({ ...editCommand, requiresHumanReview: event.target.checked })} /><span><strong>Validation humaine</strong><small>Requise avant matérialisation interne.</small></span></label></div></div><div className={styles.modalFooter}><button className={styles.secondaryButton} onClick={() => setEditCommand(null)}>Annuler</button><button className={styles.primaryButton} onClick={() => { void patch(editCommand, editCommand).then(() => setEditCommand(null)) }}><Settings2 /> Enregistrer</button></div></section></div> : null}
      {runCommand ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setRunCommand(null)}><section className={styles.modal} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><div className={styles.modalHeader}><div><span>{runCommand.code}</span><h2>{runCommand.name}</h2></div><button onClick={() => setRunCommand(null)}><X /></button></div><p className={styles.modalLead}>Cette exécution prépare uniquement des résultats et actions internes. Toute communication ou publication externe reste bloquée.</p><label className={styles.field}><span>Objectif du run</span><textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={7} /></label><div className={styles.modalMeta}><Badge tone="info">{authorityLabels[runCommand.authorityMode]}</Badge><Badge tone={runCommand.riskLevel === 'critical' ? 'danger' : 'warning'}>{runCommand.riskLevel}</Badge><Badge tone="warning">Validation humaine</Badge></div><div className={styles.modalFooter}><button className={styles.secondaryButton} onClick={() => setRunCommand(null)}>Annuler</button><button className={styles.primaryButton} onClick={() => void execute()}><Play /> Exécuter avec Gemini</button></div></section></div> : null}
    </main>
  </>
}

function SkillsView() {
  const skills = useApiState<{ skills: SkillRecord[]; source: string }>(() => api('/api/market-os/content-command/marketing-ai/skills'), [])
  const groups = React.useMemo(() => (skills.data?.skills || []).reduce<Record<string, SkillRecord[]>>((accumulator, skill) => { (accumulator[skill.category] ||= []).push(skill); return accumulator }, {}), [skills.data])
  return <><AiNav active="skills" /><main className={styles.canvas}><section className={styles.pageIntro}><div><span>CAPACITÉS PROGRESSIVES</span><h1>60 compétences cœur</h1><p>Dix domaines experts, cinq niveaux de maturité et une discipline mensuelle de développement guidée par Gemini et des ressources marketing configurables.</p></div><Badge tone={skills.data?.source === 'database' ? 'success' : 'warning'}>{skills.data?.source === 'database' ? 'Compétences persistées' : 'Catalogue intégré'}</Badge></section>{skills.error ? <PanelError error={skills.error} retry={skills.refresh} /> : skills.loading ? <div className={styles.loadingPage}><Spinner /></div> : <div className={styles.skillGroups}>{Object.entries(groups).map(([categoryName, items]) => <section key={categoryName}><div className={styles.groupHeader}><div><span>DOMAINE</span><h2>{categoryName}</h2></div><strong>{items?.length || 0} compétences</strong></div><div className={styles.skillGrid}>{items?.map((skill) => <article key={skill.code} className={styles.skillCard}><div className={styles.skillCardTop}><span className={styles.code}>{skill.code}</span><Badge tone={skill.riskLevel === 'critical' ? 'danger' : skill.riskLevel === 'high' ? 'warning' : 'neutral'}>{skill.riskLevel}</Badge></div><h3>{skill.name}</h3><p>{skill.description}</p><div className={styles.maturity}><span>Progression</span>{skill.progressiveLevels.map((level, index) => <b key={level} title={level}>{index + 1}</b>)}</div><div className={styles.skillFooter}><span><Clock3 /> {frequencyLabels[skill.defaultFrequency] || skill.defaultFrequency}</span><span><RefreshCw /> Mise à jour mensuelle</span></div></article>)}</div></section>)}</div>}</main></>
}

function SchedulesView() {
  const schedules = useApiState<{ schedules: ScheduleRecord[] }>(() => api('/api/market-os/content-command/marketing-ai/schedules'), [])
  const [notice, setNotice] = React.useState('')
  const [form, setForm] = React.useState({ name: '', commandCode: 'MKT-AI-0303', frequency: 'daily', timezone: 'Africa/Casablanca', hour: 8, minute: 0, dayOfWeek: 1, dayOfMonth: 1, enabled: true, authorityMode: 'observe', objective: 'Exécuter ce commandement et préparer un dossier interne gouverné.', context: {} })
  async function save() {
    setNotice('Enregistrement…')
    try { await api('/api/market-os/content-command/marketing-ai/schedules', { method: 'POST', body: JSON.stringify(form) }); setNotice('Fréquence enregistrée.'); setForm((current) => ({ ...current, name: '' })); await schedules.refresh() }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Échec') }
  }
  async function toggle(schedule: ScheduleRecord) {
    try { await api(`/api/market-os/content-command/marketing-ai/schedules/${schedule.id}`, { method: 'PATCH', body: JSON.stringify({ ...schedule, enabled: !schedule.enabled }) }); await schedules.refresh() }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Échec') }
  }
  return <><AiNav active="schedules" /><main className={styles.canvas}><section className={styles.pageIntro}><div><span>ORCHESTRATION TEMPORELLE</span><h1>Fréquences et autopilot interne</h1><p>Chaque commande peut être manuelle, horaire, quotidienne, hebdomadaire, mensuelle ou trimestrielle. Le scheduler prépare des actions internes et ne franchit jamais la frontière externe.</p></div><Badge tone="success">Fuseau par défaut · Africa/Casablanca</Badge></section>{notice ? <div className={styles.toast}>{notice}<button onClick={() => setNotice('')}><X /></button></div> : null}<section className={styles.executiveGrid}><article className={styles.primaryPanel}><div className={styles.sectionHeader}><div><span>PLANIFICATEUR</span><h2>Commandes configurées</h2></div></div>{schedules.error ? <PanelError error={schedules.error} retry={schedules.refresh} /> : schedules.loading ? <Spinner /> : schedules.data?.schedules.length ? <div className={styles.scheduleList}>{schedules.data.schedules.map((schedule) => <article key={schedule.id}><div className={styles.scheduleTime}><strong>{String(schedule.hour).padStart(2, '0')}:{String(schedule.minute).padStart(2, '0')}</strong><span>{frequencyLabels[schedule.frequency] || schedule.frequency}</span></div><div><h3>{schedule.name}</h3><p>{schedule.objective}</p><small>{schedule.commandCode} · {authorityLabels[schedule.authorityMode]} · Prochain run: {schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString('fr-FR') : 'manuel'}</small></div><button className={schedule.enabled ? styles.toggleOn : styles.toggleOff} onClick={() => void toggle(schedule)}>{schedule.enabled ? 'Active' : 'Suspendue'}</button></article>)}</div> : <div className={styles.empty}><CalendarClock /><strong>Aucune fréquence persistée</strong><p>Appliquez la migration puis créez votre première cadence.</p></div>}</article><aside className={styles.formPanel}><div className={styles.sectionHeader}><div><span>NOUVELLE FRÉQUENCE</span><h2>Planifier une commande</h2></div></div><label className={styles.field}><span>Nom</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Veille réputation quotidienne" /></label><label className={styles.field}><span>Code commande</span><input value={form.commandCode} onChange={(event) => setForm({ ...form, commandCode: event.target.value.toUpperCase() })} /></label><div className={styles.fieldGrid}><label className={styles.field}><span>Fréquence</span><select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })}>{Object.entries(frequencyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className={styles.field}><span>Autorité</span><select value={form.authorityMode} onChange={(event) => setForm({ ...form, authorityMode: event.target.value })}>{Object.entries(authorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><div className={styles.fieldGrid}><label className={styles.field}><span>Heure</span><input type="number" min="0" max="23" value={form.hour} onChange={(event) => setForm({ ...form, hour: Number(event.target.value) })} /></label><label className={styles.field}><span>Minute</span><input type="number" min="0" max="59" value={form.minute} onChange={(event) => setForm({ ...form, minute: Number(event.target.value) })} /></label></div><label className={styles.field}><span>Objectif</span><textarea value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} rows={5} /></label><button className={styles.primaryButton} disabled={!form.name || form.objective.length < 8} onClick={() => void save()}><CalendarClock /> Enregistrer la fréquence</button></aside></section></main></>
}

function MissionsView() {
  const missions = useApiState<{ missions: MissionRecord[] }>(() => api('/api/market-os/content-command/marketing-ai/missions'), [])
  const [notice, setNotice] = React.useState('')
  const [form, setForm] = React.useState({ title: '', objective: '', authorityMode: 'prepare', priority: 'high', commandCodes: 'MKT-AI-0002,MKT-AI-0303,MKT-AI-0705', restrictions: ['Aucune action externe'], expectedOutcomes: ['Plan interne complet'], context: {} })
  async function create() {
    setNotice('Compilation du mandat…')
    try { await api('/api/market-os/content-command/marketing-ai/missions', { method: 'POST', body: JSON.stringify({ ...form, commandCodes: form.commandCodes.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean) }) }); setNotice('Mandat créé et approuvé pour orchestration interne.'); setForm((current) => ({ ...current, title: '', objective: '' })); await missions.refresh() }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Échec') }
  }
  async function run(mission: MissionRecord) {
    setNotice(`Exécution de ${mission.title}…`)
    try { const result = await api<{ runs: RunRecord[] }>(`/api/market-os/content-command/marketing-ai/missions/${mission.id}/run`, { method: 'POST' }); setNotice(`${result.runs.length} run(s) exécuté(s). Les actions internes attendent votre décision.`); await missions.refresh() }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Échec') }
  }
  return <><AiNav active="missions" /><main className={styles.canvas}><section className={styles.pageIntro}><div><span>MANDATS MULTIDIMENSIONNELS</span><h1>Missions du Directeur Marketing IA</h1><p>Combinez plusieurs commandes cerveau dans un mandat unique. Gemini recherche, analyse, prépare et orchestre les actions internes selon l’autorité choisie.</p></div><Badge tone="warning">Maximum configurable · 12 commandes par mission</Badge></section>{notice ? <div className={styles.toast}>{notice}<button onClick={() => setNotice('')}><X /></button></div> : null}<section className={styles.executiveGrid}><article className={styles.primaryPanel}><div className={styles.sectionHeader}><div><span>PORTEFEUILLE DE MANDATS</span><h2>Missions existantes</h2></div></div>{missions.error ? <PanelError error={missions.error} retry={missions.refresh} /> : missions.loading ? <Spinner /> : missions.data?.missions.length ? <div className={styles.missionList}>{missions.data.missions.map((mission) => <article key={mission.id}><div className={styles.missionIdentity}><span className={styles.code}>{mission.id.slice(0, 8)}</span><div><h3>{mission.title}</h3><p>{mission.objective}</p><small>{mission.commandCodes.length} commandes · Sponsor: {mission.sponsor} · {authorityLabels[mission.authorityMode]}</small></div></div><div className={styles.missionActions}><Badge tone={mission.status === 'completed' ? 'success' : mission.status === 'failed' ? 'danger' : mission.status === 'needs_review' ? 'warning' : 'info'}>{statusLabels[mission.status] || mission.status}</Badge><button onClick={() => void run(mission)} disabled={mission.status === 'running'}><Play /> Exécuter</button></div></article>)}</div> : <div className={styles.empty}><Workflow /><strong>Aucun mandat</strong><p>Créez un mandat avec un objectif clair et une sélection de commandes.</p></div>}</article><aside className={styles.formPanel}><div className={styles.sectionHeader}><div><span>NOUVEAU MANDAT</span><h2>Compiler une mission</h2></div></div><label className={styles.field}><span>Titre</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Domination contenu rentrée Rabat" /></label><label className={styles.field}><span>Objectif exécutif</span><textarea value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} rows={6} placeholder="Analyser le marché, construire la stratégie, préparer les briefs et tâches internes…" /></label><div className={styles.fieldGrid}><label className={styles.field}><span>Autorité</span><select value={form.authorityMode} onChange={(event) => setForm({ ...form, authorityMode: event.target.value })}>{Object.entries(authorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className={styles.field}><span>Priorité</span><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="medium">Moyenne</option><option value="high">Haute</option><option value="critical">Critique</option></select></label></div><label className={styles.field}><span>Codes commandes, séparés par virgule</span><textarea value={form.commandCodes} onChange={(event) => setForm({ ...form, commandCodes: event.target.value })} rows={3} /></label><button className={styles.primaryButton} disabled={!form.title || form.objective.length < 12} onClick={() => void create()}><Rocket /> Créer le mandat</button></aside></section></main></>
}

function materializeAction(action: ActionRecord) {
  const payload = action.payload || {}
  const logs = readJson<ContentLog[]>(CONTENT_LOGS_KEY, [])
  const log: ContentLog = { id: uid('log'), timestamp: nowISO(), action: 'ai_materialized', entity: action.action_type, detail: `${action.title} · ${action.command_code}` }
  if (action.action_type === 'create_brief') {
    const records = readJson<ContentBrief[]>(CONTENT_BRIEFS_KEY, [])
    const record: ContentBrief = { id: uid('brief-ai'), title: String(payload.title || action.title), campaign: String(payload.campaign || 'Mission IA'), audience: String(payload.audience || 'Audience à confirmer'), objective: String(payload.objective || action.description), message: String(payload.message || action.description), channel: (payload.channel as ContentBrief['channel']) || 'LinkedIn', owner: String(payload.owner || 'Content Lead'), dueDate: String(payload.dueDate || todayISO(7)), status: 'draft' }
    writeJson(CONTENT_BRIEFS_KEY, [record, ...records])
  } else if (action.action_type === 'create_content_draft' || action.action_type === 'prepare_publishing_package') {
    const records = readJson<ContentItem[]>(CONTENT_ITEMS_KEY, [])
    const record: ContentItem = { id: uid('content-ai'), title: String(payload.title || action.title), type: String(payload.type || 'AI prepared draft'), channel: (payload.channel as ContentItem['channel']) || 'LinkedIn', campaign: String(payload.campaign || 'Mission IA'), owner: String(payload.owner || 'Content Lead'), reviewer: String(payload.reviewer || 'Brand Manager'), status: 'draft', priority: 'High', dueDate: String(payload.dueDate || todayISO(7)), scheduledDate: '', body: String(payload.body || action.description), objective: String(payload.objective || action.description), audience: String(payload.audience || 'À confirmer'), angle: String(payload.angle || ''), cta: String(payload.cta || ''), assets: [], brandScore: 0, seoKeyword: String(payload.seoKeyword || ''), notes: `Préparé par SANILA Marketing Director AI · ${action.command_code}`, createdAt: nowISO(), updatedAt: nowISO() }
    writeJson(CONTENT_ITEMS_KEY, [record, ...records])
  } else if (action.action_type === 'create_task_plan' || action.action_type === 'request_review' || action.action_type === 'propose_schedule') {
    const records = readJson<ContentTask[]>(CONTENT_TASKS_KEY, [])
    const record: ContentTask = { id: uid('task-ai'), contentId: String(payload.contentId || ''), title: String(payload.title || action.title), owner: String(payload.owner || 'Content Lead'), status: 'todo', dueDate: String(payload.dueDate || todayISO(5)), priority: action.requires_approval ? 'High' : 'Medium', notes: `${action.description}\nPréparé par ${action.command_code}` }
    writeJson(CONTENT_TASKS_KEY, [record, ...records])
  } else if (action.action_type === 'create_asset_requirement') {
    const records = readJson<ContentAsset[]>(CONTENT_ASSETS_KEY, [])
    const record: ContentAsset = { id: uid('asset-ai'), name: String(payload.name || action.title), type: (payload.type as ContentAsset['type']) || 'Other', channel: (payload.channel as ContentAsset['channel']) || 'LinkedIn', linkedContentId: String(payload.contentId || ''), owner: String(payload.owner || 'Creative Producer'), status: 'draft', url: '', notes: `${action.description}\nPréparé par ${action.command_code}` }
    writeJson(CONTENT_ASSETS_KEY, [record, ...records])
  }
  writeJson(CONTENT_LOGS_KEY, [log, ...logs].slice(0, 100))
}

function RunsView() {
  const runs = useApiState<{ runs: RunRecord[] }>(() => api('/api/market-os/content-command/marketing-ai/runs?limit=150'), [])
  const actions = useApiState<{ actions: ActionRecord[] }>(() => api('/api/market-os/content-command/marketing-ai/actions'), [])
  const [notice, setNotice] = React.useState('')
  async function decide(action: ActionRecord, status: 'approved' | 'rejected' | 'executed') {
    try {
      const result = await api<{ bridgeObject?: unknown; bridgeError?: string | null }>(`/api/market-os/content-command/marketing-ai/actions/${action.id}`, { method: 'PATCH', body: JSON.stringify({ status, executionResult: status === 'executed' ? { target: 'content_command_phase1_workspace', executedAt: nowISO() } : {} }) })
      if (status === 'executed') materializeAction(action)
      setNotice(status === 'executed'
        ? `Action matérialisée dans Content Command 360${result.bridgeObject ? ' et archivée dans le Bridge Windows' : result.bridgeError ? ` · Bridge: ${result.bridgeError}` : ''}.`
        : `Action ${status === 'approved' ? 'approuvée' : 'rejetée'}.`)
      await actions.refresh()
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Échec') }
  }
  return <><AiNav active="runs" /><main className={styles.canvas}><section className={styles.pageIntro}><div><span>AUDIT ET EXÉCUTION INTERNE</span><h1>Runs, décisions et actions</h1><p>Chaque appel Gemini, résultat, coût token, niveau de confiance et action proposée reste visible. Les actions internes ne sont matérialisées qu’après votre décision.</p></div><Badge tone="success">Aucune action externe disponible</Badge></section>{notice ? <div className={styles.toast}>{notice}<button onClick={() => setNotice('')}><X /></button></div> : null}<section className={styles.splitGrid}><article className={styles.tablePanel}><div className={styles.sectionHeader}><div><span>REGISTRE DES RUNS</span><h2>Exécutions Gemini</h2></div></div>{runs.error ? <PanelError error={runs.error} retry={runs.refresh} /> : runs.loading ? <Spinner /> : runs.data?.runs.length ? <div className={styles.runCards}>{runs.data.runs.map((run) => <article key={run.id}><div className={styles.runCardHeader}><span className={styles.code}>{run.commandCode}</span><Badge tone={run.status === 'completed' ? 'success' : run.status === 'needs_review' ? 'warning' : run.status === 'failed' ? 'danger' : 'info'}>{statusLabels[run.status] || run.status}</Badge></div><h3>{run.objective}</h3><p>{run.output?.executiveSummary || run.error || 'Exécution sans résumé disponible.'}</p><div className={styles.runMetrics}><span>Modèle <b>{run.model || '—'}</b></span><span>Tokens <b>{run.totalTokens.toLocaleString('fr-FR')}</b></span><span>Durée <b>{run.latencyMs ? `${(run.latencyMs / 1000).toFixed(1)}s` : '—'}</b></span><span>Grounding <b>{run.grounded ? 'Oui' : 'Non'}</b></span><span>Confiance <b>{run.output?.confidence != null ? `${Math.round(run.output.confidence * 100)}%` : '—'}</b></span></div>{run.output?.recommendations?.length ? <ul>{run.output.recommendations.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul> : null}</article>)}</div> : <div className={styles.empty}><Activity /><strong>Aucun run</strong></div>}</article><article className={styles.tablePanel}><div className={styles.sectionHeader}><div><span>QUEUE D’ACTIONS</span><h2>Approbation et matérialisation</h2></div></div>{actions.error ? <PanelError error={actions.error} retry={actions.refresh} /> : actions.loading ? <Spinner /> : actions.data?.actions.length ? <div className={styles.actionQueue}>{actions.data.actions.map((action) => <article key={action.id}><div className={styles.actionQueueTop}><span className={styles.actionIcon}><Rocket /></span><div><h3>{action.title}</h3><small>{action.action_type} · {action.command_code}</small></div><Badge tone={action.status === 'executed' ? 'success' : action.status === 'rejected' ? 'danger' : 'warning'}>{statusLabels[action.status] || action.status}</Badge></div><p>{action.description}</p><div className={styles.actionButtons}>{action.status === 'awaiting_approval' ? <><button onClick={() => void decide(action, 'approved')}><CheckCircle2 /> Approuver</button><button className={styles.dangerButton} onClick={() => void decide(action, 'rejected')}><X /> Rejeter</button></> : null}{['approved','prepared'].includes(action.status) ? <button className={styles.primaryButton} onClick={() => void decide(action, 'executed')}><Rocket /> Matérialiser dans Content Command</button> : null}</div></article>)}</div> : <div className={styles.empty}><ListChecks /><strong>Aucune action en attente</strong></div>}</article></section></main></>
}

function LearningView() {
  const learning = useApiState<{ events: LearningRecord[] }>(() => api('/api/market-os/content-command/marketing-ai/learning'), [])
  const resources = useApiState<{ updates: ResourceUpdate[] }>(() => api('/api/market-os/content-command/marketing-ai/resources'), [])
  const [notice, setNotice] = React.useState('')
  async function updateResources() {
    setNotice('Recherche Gemini et ressources marketing en cours…')
    try { await api('/api/market-os/content-command/marketing-ai/resources', { method: 'POST' }); setNotice('Mise à jour créée. Elle attend une validation humaine.'); await resources.refresh(); await learning.refresh() }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Échec') }
  }
  return <><AiNav active="learning" /><main className={styles.canvas}><section className={styles.pageIntro}><div><span>APPRENTISSAGE GOUVERNÉ</span><h1>Développement mensuel et mémoire</h1><p>Le système apprend uniquement depuis des résultats confirmés et des sources datées. Les mises à jour Gemini et marketing deviennent des propositions, jamais une doctrine automatique.</p></div><button className={styles.primaryButton} onClick={() => void updateResources()}><RefreshCw /> Lancer la mise à jour mensuelle</button></section>{notice ? <div className={styles.toast}>{notice}<button onClick={() => setNotice('')}><X /></button></div> : null}<section className={styles.splitGrid}><article className={styles.tablePanel}><div className={styles.sectionHeader}><div><span>RESSOURCES ACTUALISÉES</span><h2>Gemini & écosystème marketing</h2></div></div>{resources.error ? <PanelError error={resources.error} retry={resources.refresh} /> : resources.loading ? <Spinner /> : resources.data?.updates.length ? <div className={styles.learningList}>{resources.data.updates.map((update) => <article key={update.id}><div><Badge tone="warning">{update.status}</Badge><span>{new Date(update.created_at).toLocaleDateString('fr-FR')}</span></div><h3>{update.title}</h3><p>{update.summary}</p><ul>{update.recommendations.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul><small>Domaines: {update.domains.join(' · ')}</small></article>)}</div> : <div className={styles.empty}><RefreshCw /><strong>Aucune mise à jour mensuelle</strong><p>La cadence par défaut est créée par la migration Phase 2.</p></div>}</article><article className={styles.tablePanel}><div className={styles.sectionHeader}><div><span>MÉMOIRE D’APPRENTISSAGE</span><h2>Propositions issues des runs</h2></div></div>{learning.error ? <PanelError error={learning.error} retry={learning.refresh} /> : learning.loading ? <Spinner /> : learning.data?.events.length ? <div className={styles.learningList}>{learning.data.events.map((event) => <article key={event.id}><div><Badge tone={event.status === 'approved' ? 'success' : 'warning'}>{event.status}</Badge><span>Confiance {Math.round(event.confidence * 100)}%</span></div><h3>{event.title}</h3><p>{event.recommendation}</p><small>{event.evidence?.length || 0} preuve(s) · {new Date(event.created_at).toLocaleString('fr-FR')}</small></article>)}</div> : <div className={styles.empty}><Sparkles /><strong>Aucun apprentissage confirmé</strong></div>}</article></section></main></>
}

function DoctrineView() {
  const doctrine = useApiState<{ entries: DoctrineRecord[] }>(() => api('/api/market-os/content-command/marketing-ai/doctrine'), [])
  const [notice, setNotice] = React.useState('')
  const [form, setForm] = React.useState({ code: '', title: '', category: 'Marketing', authorityState: 'provisional', content: '', version: '1.0.0', source: 'Gouvernance manuelle' })
  async function save() {
    try { await api('/api/market-os/content-command/marketing-ai/doctrine', { method: 'POST', body: JSON.stringify(form) }); setNotice('Entrée de doctrine enregistrée comme proposition gouvernée.'); setForm((current) => ({ ...current, code: '', title: '', content: '' })); await doctrine.refresh() }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Échec') }
  }
  return <><AiNav active="doctrine" /><main className={styles.canvas}><section className={styles.pageIntro}><div><span>AUTORITÉ ANGELCARE</span><h1>Doctrine et vérité opérationnelle</h1><p>Gemini consomme une doctrine versionnée. Il peut proposer une amélioration, mais ne peut jamais promouvoir seul une proposition en doctrine canonique.</p></div><Badge tone="warning">Validation humaine obligatoire</Badge></section>{notice ? <div className={styles.toast}>{notice}<button onClick={() => setNotice('')}><X /></button></div> : null}<section className={styles.executiveGrid}><article className={styles.primaryPanel}>{doctrine.error ? <PanelError error={doctrine.error} retry={doctrine.refresh} /> : doctrine.loading ? <Spinner /> : <div className={styles.doctrineList}>{doctrine.data?.entries.map((entry) => <article key={entry.id}><div><span className={styles.code}>{entry.code}</span><Badge tone={entry.authority_state === 'canonical' ? 'success' : entry.authority_state === 'rejected' ? 'danger' : 'warning'}>{entry.authority_state}</Badge></div><h3>{entry.title}</h3><p>{entry.content}</p><small>{entry.category} · Version {entry.version} · {entry.source || 'Source non précisée'}</small></article>)}</div>}</article><aside className={styles.formPanel}><div className={styles.sectionHeader}><div><span>NOUVELLE PROPOSITION</span><h2>Ajouter une entrée</h2></div></div><div className={styles.fieldGrid}><label className={styles.field}><span>Code</span><input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} /></label><label className={styles.field}><span>Catégorie</span><input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label></div><label className={styles.field}><span>Titre</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label className={styles.field}><span>Autorité</span><select value={form.authorityState} onChange={(event) => setForm({ ...form, authorityState: event.target.value })}><option value="provisional">Provisoire</option><option value="approved">Approuvée</option><option value="canonical">Canonique</option><option value="external_evidence">Preuve externe</option><option value="historical">Historique</option><option value="rejected">Rejetée</option></select></label><label className={styles.field}><span>Contenu doctrinal</span><textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={8} /></label><button className={styles.primaryButton} disabled={!form.code || !form.title || form.content.length < 10} onClick={() => void save()}><BookOpenCheck /> Enregistrer</button></aside></section></main></>
}

function SettingsView() {
  const health = useApiState<{ health: { enabled: boolean; configured: boolean; available: boolean; model: string; message: string }; externalActionsAllowed: false }>(() => api('/api/market-os/content-command/marketing-ai/health'), [])
  const bridge = useApiState<{ enabled: boolean; available: boolean; message: string; health: unknown; usage: { usedBytes?: number; freeBytes?: number; totalBytes?: number } | null }>(() => api('/api/market-os/content-command/marketing-ai/bridge/health'), [])
  const bridgeObjects = useApiState<{ objects: Array<{ id: string; entity_type: string; original_filename: string; size_bytes: number; status: string; created_at: string }> }>(() => api('/api/market-os/content-command/marketing-ai/bridge/objects?limit=20'), [])
  const [live, setLive] = React.useState('')
  const [classification, setClassification] = React.useState('asset_type=marketing_source;audience=internal;retention=controlled')
  async function test() {
    setLive('Test live Gemini…')
    try {
      const result = await api<{ health: { available: boolean; message: string; model: string } }>('/api/market-os/content-command/marketing-ai/health?live=1')
      setLive(`${result.health.available ? 'PASS' : 'FAIL'} · ${result.health.model} · ${result.health.message}`)
    } catch (error) { setLive(error instanceof Error ? error.message : 'Échec') }
  }
  async function uploadBridge(file: File) {
    setLive('Archivage sécurisé dans le Bridge Windows…')
    const parsedClassification = Object.fromEntries(classification.split(';').map((entry) => entry.split('=').map((part) => part.trim())).filter((entry) => entry.length === 2 && entry[0]))
    const form = new FormData()
    form.set('file', file)
    form.set('entityType', 'marketing_ai_knowledge_source')
    form.set('classification', JSON.stringify(parsedClassification))
    try {
      await api('/api/market-os/content-command/marketing-ai/bridge/upload', { method: 'POST', body: form })
      setLive('PASS · Fichier classifié et archivé dans le namespace Market OS du Bridge Windows.')
      await Promise.all([bridge.refresh(), bridgeObjects.refresh()])
    } catch (error) { setLive(error instanceof Error ? error.message : 'Archivage Bridge impossible') }
  }
  const env = `MARKETING_AI_ENABLED=true
GEMINI_API_KEY=YOUR_SECRET
MARKETING_AI_PRIMARY_MODEL=gemini-2.5-flash
MARKETING_AI_FALLBACK_MODEL=gemini-2.5-flash-lite
MARKETING_AI_SEARCH_GROUNDING_ENABLED=true
MARKETING_AI_CRON_SECRET=GENERATE_A_LONG_RANDOM_SECRET
MARKETING_AI_MAX_OUTPUT_TOKENS=8192
MARKETING_AI_MAX_COMMANDS_PER_MISSION=12
MARKETING_AI_MAX_DUE_RUNS_PER_BATCH=8
MARKETING_AI_MAX_RUNS_PER_HOUR=30
MARKETING_AI_MAX_TOKENS_PER_DAY=500000
MARKETING_AI_TIMEOUT_MS=120000
MARKETING_AI_BRIDGE_STORAGE_ENABLED=true
MARKETING_AI_BRIDGE_MODULE_KEY=market_os_content_command
# Existing Email OS Bridge configuration is reused:
EMAIL_OS_STORAGE_BRIDGE_URL=https://YOUR_WINDOWS_BRIDGE
EMAIL_BRIDGE_ADMIN_TOKEN=YOUR_EXISTING_SECRET`
  return <><AiNav active="settings" /><main className={styles.canvas}>
    <section className={styles.pageIntro}><div><span>CONFIGURATION ET SÉCURITÉ</span><h1>Gemini & Bridge via .env.local</h1><p>Aucune clé n’est stockée dans l’interface ou la base. Gemini utilise votre configuration serveur; les fichiers et paquets IA peuvent être classifiés dans le namespace Market OS du Bridge Windows déjà utilisé par Email OS.</p></div><button className={styles.primaryButton} onClick={() => void test()}><RefreshCw /> Test Gemini live</button></section>
    {live ? <div className={styles.toast}>{live}<button onClick={() => setLive('')}><X /></button></div> : null}
    <section className={styles.executiveGrid}><article className={styles.primaryPanel}><div className={styles.sectionHeader}><div><span>ÉTAT RUNTIME</span><h2>Configuration détectée</h2></div></div>{health.error ? <PanelError error={health.error} retry={health.refresh} /> : health.loading ? <Spinner /> : <div className={styles.healthGrid}><div><span>Marketing AI</span><strong>{health.data?.health.enabled ? 'Activé' : 'Désactivé'}</strong></div><div><span>Clé Gemini</span><strong>{health.data?.health.configured ? 'Présente' : 'Absente'}</strong></div><div><span>Modèle</span><strong>{health.data?.health.model}</strong></div><div><span>Disponibilité</span><strong>{health.data?.health.available ? 'Prête' : 'Vérification requise'}</strong></div><div className={styles.guardrailBlock}><LockKeyhole /><span>Actions externes</span><strong>Bloquées dans tous les modes</strong></div></div>}<div className={styles.envBlock}><div><strong>.env.local</strong><button onClick={() => void navigator.clipboard.writeText(env)}>Copier</button></div><pre>{env}</pre></div></article><aside className={styles.formPanel}><div className={styles.sectionHeader}><div><span>CADENCE RECOMMANDÉE</span><h2>Fréquences par mission</h2></div></div><div className={styles.frequencyMatrix}>{Object.entries(frequencyLabels).map(([key, label]) => <div key={key}><strong>{label}</strong><p>{key === 'hourly' ? 'Alertes, SLA et signaux critiques.' : key === 'daily' ? 'Tendances, réputation, risques, priorités.' : key === 'weekly' ? 'Campagnes, contenu, concurrents, performance.' : key === 'monthly' ? 'Gemini, doctrine, personas, stratégie et apprentissage.' : key === 'quarterly' ? 'Positionnement, portefeuille et feuille de route.' : 'Exécution à la demande et décisions sensibles.'}</p></div>)}</div></aside></section>
    <section className={styles.splitGrid}><article className={styles.tablePanel}><div className={styles.sectionHeader}><div><span>BRIDGE WINDOWS</span><h2>Stockage et classification Market OS</h2></div><Badge tone={bridge.data?.available ? 'success' : 'warning'}>{bridge.loading ? 'Vérification' : bridge.data?.available ? 'Connecté' : 'Configuration requise'}</Badge></div>{bridge.error ? <PanelError error={bridge.error} retry={bridge.refresh} /> : <><div className={styles.sourceNotice}><Archive /><div><strong>{bridge.data?.message || 'État Bridge indisponible'}</strong><p>Namespace isolé: market_os_content_command. Les snapshots d’actions exécutées sont archivés automatiquement lorsque le Bridge est disponible.</p></div></div><label className={styles.field}><span>Classification (clé=valeur séparée par ;)</span><input value={classification} onChange={(event) => setClassification(event.target.value)} /></label><label className={styles.bridgeUpload}><Upload /><span><strong>Ajouter une ressource au cerveau marketing</strong><small>PDF, image, vidéo MP4, CSV, Markdown ou texte · 15 Mo maximum</small></span><input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.svg,.mp4,.mp3,.csv,.md,.txt,application/pdf,image/*,video/mp4,audio/mpeg,text/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadBridge(file) }} /></label></>}</article><article className={styles.tablePanel}><div className={styles.sectionHeader}><div><span>OBJETS ARCHIVÉS</span><h2>Dernières ressources classifiées</h2></div></div>{bridgeObjects.error ? <PanelError error={bridgeObjects.error} retry={bridgeObjects.refresh} /> : bridgeObjects.loading ? <Spinner /> : bridgeObjects.data?.objects.length ? <div className={styles.simpleList}>{bridgeObjects.data.objects.map((object) => <div key={object.id}><span className={styles.actionIcon}><Archive /></span><div><strong>{object.original_filename}</strong><small>{object.entity_type} · {(object.size_bytes / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Ko · {new Date(object.created_at).toLocaleString('fr-FR')}</small></div><Badge tone={object.status === 'active' ? 'success' : 'warning'}>{object.status}</Badge></div>)}</div> : <div className={styles.empty}><Archive /><strong>Aucun objet Market OS archivé</strong><p>Ajoutez une ressource ou matérialisez une action IA approuvée.</p></div>}</article></section>
  </main></>
}

export default function MarketingAiDirectorWorkspace({ view }: { view: MarketingAiView }) {
  if (view === 'commands') return <CommandsView />
  if (view === 'skills') return <SkillsView />
  if (view === 'schedules') return <SchedulesView />
  if (view === 'missions') return <MissionsView />
  if (view === 'runs') return <RunsView />
  if (view === 'learning') return <LearningView />
  if (view === 'doctrine') return <DoctrineView />
  if (view === 'settings') return <SettingsView />
  return <DashboardView />
}
