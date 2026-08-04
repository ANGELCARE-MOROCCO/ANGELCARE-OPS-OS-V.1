'use client'

import {
  Activity,
  AlertTriangle,
  AppWindow,
  ArrowRight,
  Boxes,
  Braces,
  Check,
  ChevronRight,
  CirclePause,
  CirclePlay,
  Command,
  Database,
  FileCode2,
  Fingerprint,
  GitBranch,
  History,
  KeyRound,
  ListFilter,
  LoaderCircle,
  Network,
  PanelRightOpen,
  Play,
  RefreshCcw,
  RotateCcw,
  ScanSearch,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  TerminalSquare,
  UserRoundCheck,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import styles from './GlobalAuthorizationCommand.module.css'

type WorkspaceKey = 'overview' | 'classification' | 'topology' | 'operations' | 'reconciliation' | 'publication'

type Actor = { id: string; name: string; role: string }
type Capabilities = { canManage: boolean; canApprove: boolean; canExecute: boolean }

type Job = {
  id: string
  status: string
  stage: string
  mode: string
  totalWorkItems: number
  completedWorkItems: number
  failedWorkItems: number
  currentItem: string | null
  repositoryCommit: string | null
  scannerVersion: string
  elapsedMs: number
  warnings: string[]
  error: string | null
}

type Finding = {
  id: string
  finding_key: string
  reconciliation_state: string
  severity: string
  application_key: string | null
  module_key: string | null
  operation_key: string | null
  user_id: string | null
  title: string
  explanation: string
  expected_state: Record<string, unknown>
  effective_state: Record<string, unknown>
  evidence_keys: string[]
  confidence: string
  confidence_score: number
  execution_eligible: boolean
  blocked_reasons: string[]
  proposed_operations: string[]
}

type Manifest = {
  id: string
  scan_id: string
  manifest_key: string
  application_key: string
  module_key: string | null
  display_name: string
  authority_models: string[]
  validation_status: string
  executable: boolean
  confidence: string
  confidence_score: number
  unresolved: string[]
  evidence_keys: string[]
}


type EvidenceRow = {
  id: string
  evidence_key: string
  evidence_kind: string
  subject_key: string
  object_key: string | null
  file_path: string | null
  line_start: number | null
  line_end: number | null
  database_object: string | null
  summary: string
  excerpt: string | null
  confidence: string
  confidence_score: number
}

type TopologyNode = {
  id: string
  node_key: string
  node_type: string
  canonical_key: string
  display_name: string
  application_key: string | null
  module_key: string | null
  workspace_key: string | null
  authority_model: string | null
  risk_level: string
  confidence: string
  confidence_score: number
  metadata: Record<string, unknown>
}

type PlanOperation = {
  operationKey: string
  type: string
  sequence: number
  title: string
  executionEligible: boolean
  blockedReasons: string[]
}

type Plan = {
  id: string
  planKey: string
  title: string
  description: string
  status: string
  riskLevel: string
  sourceScanId: string
  findingKeys: string[]
  operations: PlanOperation[]
  simulation: Record<string, unknown>
  executionEligible: boolean
  blockedReasons: string[]
  expiresAt: string | null
  createdAt: string
}

type Overview = {
  generatedAt: string
  scannerVersion: string
  repositoryCommit: string | null
  capabilityStatus: 'ready' | 'degraded' | 'blocked'
  latestJob: Job | null
  counts: {
    applications: number
    modules: number
    workspaces: number
    pages: number
    apiOperations: number
    serverActions: number
    protectedOperations: number
    unprotectedOperations: number
    permissionNamespaces: number
    nativeAuthorities: number
    rlsPolicies: number
    unknownAuthorities: number
    findings: number
    criticalFindings: number
    openPlans: number
    runningExecutions: number
  }
  health: {
    repositoryDiscovery: number
    authorizationIntelligence: number
    scopeIntegrity: number
    reconciliationReadiness: number
    executionReadiness: number
  }
  riskDistribution: Record<string, number>
  driftDistribution: Record<string, number>
  authorityModels: Record<string, number>
  recentPlans: Plan[]
  capabilities: Array<{ key: string; label: string; status: string; detail: string }>
}


type ExecutionRow = {
  id: string
  plan_id: string
  status: string
  correlation_id: string
  actor_email: string | null
  started_at: string
  completed_at: string | null
  failure_stage: string | null
  error: string | null
  result: Record<string, unknown>
}

type RollbackPackage = {
  id: string
  execution_id: string
  status: string
  rollback_operations: Array<Record<string, unknown>>
  expires_at: string | null
  created_at: string
}

type Props = { actor: Actor; capabilities: Capabilities }

const WORKSPACES: Array<{ key: WorkspaceKey; label: string; eyebrow: string; icon: typeof Shield }> = [
  { key: 'overview', label: 'Scan Overview', eyebrow: 'Estate command', icon: Activity },
  { key: 'classification', label: 'Classification Studio', eyebrow: 'Authority inference', icon: Braces },
  { key: 'topology', label: 'Families & Groups', eyebrow: 'Topology intelligence', icon: Network },
  { key: 'operations', label: 'Pages & APIs', eyebrow: 'Operation control', icon: FileCode2 },
  { key: 'reconciliation', label: 'Reconciliation', eyebrow: 'Global ↔ native', icon: GitBranch },
  { key: 'publication', label: 'Publication & Recovery', eyebrow: 'Execution authority', icon: History },
]

const STAGE_LABELS: Record<string, string> = {
  repository_inventory: 'Repository inventory',
  application_discovery: 'Application-root discovery',
  source_analysis: 'AST and import-graph analysis',
  sql_analysis: 'SQL authority analysis',
  database_introspection: 'Live database introspection',
  topology_construction: 'Authorization topology construction',
  authority_inference: 'Authority-model inference',
  reconciliation: 'Global-to-native reconciliation',
  snapshot_publication: 'Snapshot publication',
  completed: 'Completed',
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 45_000)
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.ok === false) throw new Error(String(payload?.error ?? response.statusText ?? 'Request failed'))
    return payload as T
  } finally {
    window.clearTimeout(timeout)
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value)
}

function formatDuration(value: number) {
  if (!value) return '0s'
  const seconds = Math.round(value / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}

function percent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function tone(value: string) {
  const normalized = value.toLowerCase()
  if (['critical', 'blocked', 'failed', 'unprotected_operation', 'conflicting_authorities'].includes(normalized)) return 'critical'
  if (['high', 'review', 'review_required', 'unknown_authority', 'partial_synchronization'].includes(normalized)) return 'review'
  if (['completed', 'confirmed', 'ready', 'synchronized', 'active', 'approved'].includes(normalized)) return 'good'
  return 'neutral'
}

function downloadJson(name: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function GlobalAuthorizationCommandClient({ actor, capabilities }: Props) {
  const [workspace, setWorkspace] = useState<WorkspaceKey>('overview')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [findings, setFindings] = useState<Finding[]>([])
  const [manifests, setManifests] = useState<Manifest[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [executions, setExecutions] = useState<ExecutionRow[]>([])
  const [rollbackPackages, setRollbackPackages] = useState<RollbackPackage[]>([])
  const [nodes, setNodes] = useState<TopologyNode[]>([])
  const [selectedFindingIds, setSelectedFindingIds] = useState<Set<string>>(() => new Set())
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null)
  const [selectedManifest, setSelectedManifest] = useState<Manifest | null>(null)
  const [evidenceRows, setEvidenceRows] = useState<EvidenceRow[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [commandOpen, setCommandOpen] = useState(false)
  const pollingRef = useRef<number | null>(null)

  const latestScanId = overview?.latestJob?.status === 'completed' ? overview.latestJob.id : null

  useEffect(() => {
    let cancelled = false
    async function loadSelectedEvidence() {
      const scanId = selectedManifest?.scan_id ?? latestScanId
      if (!scanId) { setEvidenceRows([]); return }
      try {
        if (selectedNode) {
          const payload = await requestJson<{ ok: true; evidence: EvidenceRow[] }>(`/api/users/access-governance/command/evidence?scanId=${encodeURIComponent(scanId)}&subjectKey=${encodeURIComponent(selectedNode.node_key)}`)
          if (!cancelled) setEvidenceRows(payload.evidence.slice(0, 40))
          return
        }
        const keys = selectedManifest?.evidence_keys ?? selectedFinding?.evidence_keys ?? []
        if (!keys.length) { setEvidenceRows([]); return }
        const payloads = await Promise.all(keys.slice(0, 12).map((key) => requestJson<{ ok: true; evidence: EvidenceRow[] }>(`/api/users/access-governance/command/evidence?scanId=${encodeURIComponent(scanId)}&evidenceKey=${encodeURIComponent(key)}`)))
        if (!cancelled) setEvidenceRows(payloads.flatMap((payload) => payload.evidence).slice(0, 40))
      } catch {
        if (!cancelled) setEvidenceRows([])
      }
    }
    void loadSelectedEvidence()
    return () => { cancelled = true }
  }, [latestScanId, selectedFinding, selectedManifest, selectedNode])

  const loadOverview = useCallback(async () => {
    const payload = await requestJson<{ ok: true; overview: Overview }>('/api/users/access-governance/command/overview')
    setOverview(payload.overview)
    return payload.overview
  }, [])

  const loadGovernanceData = useCallback(async (scanId?: string | null) => {
    const [findingPayload, manifestPayload, planPayload, executionPayload] = await Promise.all([
      requestJson<{ ok: true; findings: Finding[] }>(`/api/users/access-governance/command/findings${scanId ? `?scanId=${encodeURIComponent(scanId)}` : ''}`),
      requestJson<{ ok: true; manifests: Manifest[] }>(`/api/users/access-governance/command/manifests${scanId ? `?scanId=${encodeURIComponent(scanId)}` : ''}`),
      requestJson<{ ok: true; plans: Plan[] }>('/api/users/access-governance/command/plans'),
      requestJson<{ ok: true; executions: ExecutionRow[]; rollbackPackages: RollbackPackage[] }>('/api/users/access-governance/command/executions'),
    ])
    setFindings(findingPayload.findings)
    setManifests(manifestPayload.manifests)
    setPlans(planPayload.plans)
    setExecutions(executionPayload.executions)
    setRollbackPackages(executionPayload.rollbackPackages)
  }, [])

  const loadTopology = useCallback(async (scanId: string) => {
    const payload = await requestJson<{ ok: true; nodes: TopologyNode[] }>(`/api/users/access-governance/command/topology?scanId=${encodeURIComponent(scanId)}&limit=1000`)
    setNodes(payload.nodes)
  }, [])

  const refreshAll = useCallback(async () => {
    setError(null)
    try {
      const current = await loadOverview()
      const scanId = current.latestJob?.status === 'completed' ? current.latestJob.id : null
      await loadGovernanceData(scanId)
      if (scanId) await loadTopology(scanId)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load authorization command data.')
    }
  }, [loadGovernanceData, loadOverview, loadTopology])

  useEffect(() => { void refreshAll() }, [refreshAll])

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen((value) => !value)
      }
      if (event.key === 'Escape') setCommandOpen(false)
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  useEffect(() => () => { if (pollingRef.current) window.clearTimeout(pollingRef.current) }, [])

  const continueScan = useCallback(async (jobId: string) => {
    const payload = await requestJson<{ ok: true; job: Job; completed: boolean }>(`/api/users/access-governance/command/scans/${jobId}`, {
      method: 'POST', body: JSON.stringify({ action: 'continue', chunkSize: 20 }),
    })
    setOverview((current) => current ? { ...current, latestJob: payload.job } : current)
    if (payload.completed) {
      setNotice('Repository-wide authorization scan completed. Topology, manifests, drift findings, and execution readiness are now available.')
      setBusy(null)
      await refreshAll()
      return
    }
    pollingRef.current = window.setTimeout(() => { void continueScan(jobId) }, 800)
  }, [refreshAll])

  async function startScan() {
    if (!capabilities.canManage || busy) return
    setBusy('scan')
    setError(null)
    setNotice(null)
    try {
      const payload = await requestJson<{ ok: true; job: Job }>('/api/users/access-governance/command/scans', {
        method: 'POST', body: JSON.stringify({ mode: 'full', chunkSize: 20 }),
      })
      setOverview((current) => current ? { ...current, latestJob: payload.job } : current)
      if (payload.job.status === 'completed') {
        setBusy(null)
        await refreshAll()
      } else {
        await continueScan(payload.job.id)
      }
    } catch (caught) {
      setBusy(null)
      setError(caught instanceof Error ? caught.message : 'Unable to start universal authorization scan.')
    }
  }

  async function controlScan(action: 'pause' | 'resume' | 'cancel') {
    const job = overview?.latestJob
    if (!job || !capabilities.canManage) return
    setError(null)
    try {
      const payload = await requestJson<{ ok: true; job: Job }>(`/api/users/access-governance/command/scans/${job.id}`, {
        method: 'POST', body: JSON.stringify({ action }),
      })
      setOverview((current) => current ? { ...current, latestJob: payload.job } : current)
      if (action === 'resume') {
        setBusy('scan')
        await continueScan(job.id)
      } else if (action === 'cancel') {
        setBusy(null)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable to ${action} scan.`)
    }
  }

  async function updateManifest(manifestId: string, decision: 'confirm' | 'invalidate', mutationAuthority: Record<string, string>) {
    if (!capabilities.canManage) return
    setBusy(`manifest:${manifestId}`)
    setError(null)
    try {
      const payload = await requestJson<{ ok: true; manifest: Manifest }>('/api/users/access-governance/command/manifests', {
        method: 'PATCH',
        body: JSON.stringify({ manifestId, decision, mutationAuthority }),
      })
      setManifests((current) => current.map((item) => item.id === manifestId ? payload.manifest : item))
      setSelectedManifest(payload.manifest)
      setNotice(decision === 'confirm'
        ? 'Authority manifest confirmed. Execution remains fail-closed until mutation and verification RPCs are both registered.'
        : 'Authority manifest invalidated and quarantined from execution.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update authority manifest.')
    } finally {
      setBusy(null)
    }
  }

  async function createPlan() {
    if (!selectedFindingIds.size || !capabilities.canManage) return
    setBusy('plan')
    setError(null)
    try {
      const payload = await requestJson<{ ok: true; plan: Plan }>('/api/users/access-governance/command/plans', {
        method: 'POST',
        body: JSON.stringify({
          findingIds: [...selectedFindingIds],
          title: `Authorization reconciliation · ${selectedFindingIds.size} finding${selectedFindingIds.size === 1 ? '' : 's'}`,
          description: 'Evidence-backed dry-run correction package generated by the universal reconciliation engine.',
        }),
      })
      setPlans((current) => [payload.plan, ...current])
      setSelectedFindingIds(new Set())
      setNotice(payload.plan.executionEligible
        ? 'Reconciliation plan generated and ready for sovereign approval.'
        : 'Dry-run plan generated. Unsafe operations remain blocked until authority manifests are confirmed.')
      setWorkspace('publication')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to generate reconciliation plan.')
    } finally {
      setBusy(null)
    }
  }

  async function approvePlan(planId: string) {
    if (!capabilities.canApprove) return
    setBusy(`approve:${planId}`)
    setError(null)
    try {
      await requestJson(`/api/users/access-governance/command/plans/${planId}/approve`, { method: 'POST', body: JSON.stringify({ comment: 'Reviewed and approved from Global Authorization Command.' }) })
      setNotice('Plan approved. Execution remains impossible unless every operation is evidence-backed and eligible.')
      await loadGovernanceData(latestScanId)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to approve plan.')
    } finally {
      setBusy(null)
    }
  }

  async function executePlan(planId: string) {
    if (!capabilities.canExecute) return
    setBusy(`execute:${planId}`)
    setError(null)
    try {
      const payload = await requestJson<{ ok: true; result: Record<string, unknown>; correlationId: string }>(`/api/users/access-governance/command/plans/${planId}/execute`, { method: 'POST' })
      setNotice(`Transactional execution completed and verified. Correlation: ${payload.correlationId}`)
      await refreshAll()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to execute plan.')
    } finally {
      setBusy(null)
    }
  }

  const filteredFindings = useMemo(() => findings.filter((finding) => {
    const matchesQuery = !query || `${finding.title} ${finding.explanation} ${finding.application_key ?? ''} ${finding.reconciliation_state}`.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = statusFilter === 'all' || finding.severity === statusFilter || finding.reconciliation_state === statusFilter
    return matchesQuery && matchesStatus
  }), [findings, query, statusFilter])

  const filteredNodes = useMemo(() => nodes.filter((node) => !query || `${node.display_name} ${node.canonical_key} ${node.node_type} ${node.authority_model ?? ''}`.toLowerCase().includes(query.toLowerCase())), [nodes, query])
  const operationNodes = useMemo(() => filteredNodes.filter((node) => ['page', 'api_operation', 'server_action'].includes(node.node_type)), [filteredNodes])
  const scanProgress = overview?.latestJob?.totalWorkItems
    ? percent(((overview.latestJob.completedWorkItems + overview.latestJob.failedWorkItems) / overview.latestJob.totalWorkItems) * 100)
    : 0

  async function executeRollback(packageId: string) {
    if (!capabilities.canExecute) return
    setBusy(`rollback:${packageId}`)
    setError(null)
    try {
      await requestJson<{ ok: true }>(`/api/users/access-governance/command/rollbacks/${packageId}/execute`, { method: 'POST' })
      setNotice('Rollback package completed transactionally. Execution, plan, and audit history were updated.')
      await refreshAll()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to execute rollback package.')
    } finally {
      setBusy(null)
    }
  }

  const currentWorkspace = WORKSPACES.find((item) => item.key === workspace) ?? WORKSPACES[0]

  return (
    <div className={styles.shell}>
      <header className={styles.commandHeader}>
        <div className={styles.identityBlock}>
          <div className={styles.brandMark}><ShieldCheck size={22} /></div>
          <div>
            <div className={styles.eyebrow}>Users Management · Sovereign Access Governance</div>
            <h1>Global Authorization Intelligence & Reconciliation Command</h1>
            <p>Discover the unknown, reconstruct every authority chain, reconcile global and native access, and execute only what can be proven safely.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.commandButton} onClick={() => setCommandOpen(true)}><Command size={16} /> Command <kbd>⌘K</kbd></button>
          <button className={styles.secondaryButton} onClick={() => void refreshAll()} disabled={Boolean(busy)}><RefreshCcw size={16} /> Refresh</button>
          <button className={styles.primaryButton} onClick={() => void startScan()} disabled={!capabilities.canManage || Boolean(busy)}>
            {busy === 'scan' ? <LoaderCircle className={styles.spin} size={17} /> : <ScanSearch size={17} />}
            {busy === 'scan' ? 'Scanning estate' : 'Run universal scan'}
          </button>
          <div className={styles.actorPill}><span>{actor.name.slice(0, 1).toUpperCase()}</span><div><strong>{actor.name}</strong><small>{actor.role || 'authorized actor'}</small></div></div>
        </div>
      </header>

      <section className={styles.integrityRibbon}>
        <RibbonItem icon={<Fingerprint size={15} />} label="Repository commit" value={overview?.repositoryCommit?.slice(0, 10) ?? 'Not scanned'} />
        <RibbonItem icon={<Sparkles size={15} />} label="Scanner" value={`v${overview?.scannerVersion ?? '4.0.0'}`} />
        <RibbonItem icon={<Database size={15} />} label="Native authorities" value={formatNumber(overview?.counts.nativeAuthorities ?? 0)} />
        <RibbonItem icon={<KeyRound size={15} />} label="Permission nodes" value={formatNumber(overview?.counts.permissionNamespaces ?? 0)} />
        <RibbonItem icon={<ShieldAlert size={15} />} label="Open findings" value={formatNumber(overview?.counts.findings ?? 0)} tone={(overview?.counts.criticalFindings ?? 0) > 0 ? 'critical' : 'good'} />
        <RibbonItem icon={<Activity size={15} />} label="Capability status" value={overview?.capabilityStatus ?? 'loading'} tone={tone(overview?.capabilityStatus ?? '')} />
      </section>

      <div className={styles.workspaceNav}>
        {WORKSPACES.map((item) => {
          const Icon = item.icon
          return <button key={item.key} onClick={() => setWorkspace(item.key)} className={workspace === item.key ? styles.workspaceActive : styles.workspaceButton}>
            <Icon size={19} /><span><small>{item.eyebrow}</small><strong>{item.label}</strong></span><ChevronRight size={15} />
          </button>
        })}
      </div>

      {(error || notice) && <div className={error ? styles.alertError : styles.alertNotice}>{error ? <AlertTriangle size={18} /> : <Check size={18} />}<span>{error ?? notice}</span><button onClick={() => { setError(null); setNotice(null) }}><X size={15} /></button></div>}

      <div className={styles.workspaceHeader}>
        <div><div className={styles.eyebrow}>{currentWorkspace.eyebrow}</div><h2>{currentWorkspace.label}</h2></div>
        <div className={styles.workspaceTools}>
          <div className={styles.searchBox}><Search size={16} /><input value={query} onChange={(event: { target: { value: string } }) => setQuery(event.target.value)} placeholder="Search topology, route, permission, user, evidence…" /></div>
          <select value={statusFilter} onChange={(event: { target: { value: string } }) => setStatusFilter(event.target.value)}><option value="all">All states</option><option value="critical">Critical</option><option value="high">High</option><option value="review">Review</option><option value="UNKNOWN_AUTHORITY">Unknown authority</option><option value="UNPROTECTED_OPERATION">Unprotected operation</option></select>
          <button className={styles.iconButton} onClick={() => downloadJson(`angelcare-authorization-${workspace}.json`, { overview, findings, manifests, plans, executions, rollbackPackages, nodes })} title="Export current workspace"><TerminalSquare size={17} /></button>
        </div>
      </div>

      <main className={styles.workspaceBody}>
        {workspace === 'overview' && <OverviewWorkspace overview={overview} scanProgress={scanProgress} onControl={controlScan} />}
        {workspace === 'classification' && <ClassificationWorkspace manifests={manifests} selected={selectedManifest} onSelect={setSelectedManifest} evidence={evidenceRows} canManage={capabilities.canManage} busy={busy} onUpdate={updateManifest} />}
        {workspace === 'topology' && <TopologyWorkspace nodes={filteredNodes} selected={selectedNode} onSelect={setSelectedNode} evidence={evidenceRows} />}
        {workspace === 'operations' && <OperationsWorkspace nodes={operationNodes} selected={selectedNode} onSelect={setSelectedNode} evidence={evidenceRows} />}
        {workspace === 'reconciliation' && <ReconciliationWorkspace findings={filteredFindings} selectedIds={selectedFindingIds} setSelectedIds={setSelectedFindingIds} selected={selectedFinding} onSelect={setSelectedFinding} onCreatePlan={createPlan} busy={busy === 'plan'} canManage={capabilities.canManage} evidence={evidenceRows} />}
        {workspace === 'publication' && <PublicationWorkspace plans={plans} executions={executions} rollbackPackages={rollbackPackages} onApprove={approvePlan} onExecute={executePlan} onRollback={executeRollback} busy={busy} capabilities={capabilities} />}
      </main>

      {commandOpen && <CommandPalette onClose={() => setCommandOpen(false)} onWorkspace={(key) => { setWorkspace(key); setCommandOpen(false) }} onScan={() => { setCommandOpen(false); void startScan() }} onRefresh={() => { setCommandOpen(false); void refreshAll() }} />}
    </div>
  )
}

function RibbonItem({ icon, label, value, tone: toneValue = 'neutral' }: { icon: ReactNode; label: string; value: string; tone?: string }) {
  return <div className={`${styles.ribbonItem} ${styles[`tone_${toneValue}`] ?? ''}`}>{icon}<span><small>{label}</small><strong>{value}</strong></span></div>
}

function OverviewWorkspace({ overview, scanProgress, onControl }: { overview: Overview | null; scanProgress: number; onControl: (action: 'pause' | 'resume' | 'cancel') => Promise<void> }) {
  if (!overview) return <EmptyState icon={<LoaderCircle className={styles.spin} />} title="Loading authorization estate" detail="Reading the latest stored snapshot without launching a filesystem scan." />
  const job = overview.latestJob
  const health = [
    ['Repository discovery', overview.health.repositoryDiscovery],
    ['Authorization intelligence', overview.health.authorizationIntelligence],
    ['Scope integrity', overview.health.scopeIntegrity],
    ['Reconciliation readiness', overview.health.reconciliationReadiness],
    ['Execution readiness', overview.health.executionReadiness],
  ] as const
  const metrics = [
    ['Applications', overview.counts.applications, AppWindow],
    ['Pages', overview.counts.pages, FileCode2],
    ['API operations', overview.counts.apiOperations, Braces],
    ['Server Actions', overview.counts.serverActions, Play],
    ['RLS policies', overview.counts.rlsPolicies, Database],
    ['Unknown authorities', overview.counts.unknownAuthorities, ShieldAlert],
    ['Critical findings', overview.counts.criticalFindings, AlertTriangle],
    ['Open plans', overview.counts.openPlans, GitBranch],
  ] as const
  return <div className={styles.stack}>
    <section className={styles.healthBoard}>
      <div className={styles.healthIntro}><div className={styles.eyebrow}>Estate health ribbon</div><h3>Authorization readiness across the complete application estate</h3><p>Five independent signals prevent route discovery success from being mistaken for effective access integrity.</p></div>
      <div className={styles.healthGrid}>{health.map(([label, value]) => <HealthGauge key={label} label={label} value={value} />)}</div>
    </section>
    <section className={styles.metricGrid}>{metrics.map(([label, value, Icon]) => <article key={label} className={styles.metricCard}><span><Icon size={18} /></span><div><small>{label}</small><strong>{formatNumber(value)}</strong></div></article>)}</section>
    <div className={styles.twoColumns}>
      <section className={styles.panel}>
        <PanelHeading icon={<Activity size={18} />} title="Live scan execution" subtitle="Real work-item progress with pause, resume, cancellation, and failure visibility." />
        {!job ? <EmptyInline text="No scanner job exists yet." /> : <div className={styles.jobCard}>
          <div className={styles.jobTop}><div><Badge value={job.status} /><h4>{STAGE_LABELS[job.stage] ?? job.stage}</h4><p>{job.currentItem ?? 'No source item currently active'}</p></div><strong>{scanProgress}%</strong></div>
          <div className={styles.progressTrack}><span style={{ width: `${scanProgress}%` }} /></div>
          <div className={styles.jobStats}><span>{formatNumber(job.completedWorkItems)} completed</span><span>{formatNumber(job.failedWorkItems)} failed</span><span>{formatNumber(job.totalWorkItems)} total</span><span>{formatDuration(job.elapsedMs)}</span></div>
          {job.error && <div className={styles.inlineCritical}>{job.error}</div>}
          <div className={styles.jobActions}>
            {job.status === 'running' && <button onClick={() => void onControl('pause')}><CirclePause size={15} /> Pause</button>}
            {job.status === 'paused' && <button onClick={() => void onControl('resume')}><CirclePlay size={15} /> Resume</button>}
            {['running', 'paused', 'inventorying'].includes(job.status) && <button onClick={() => void onControl('cancel')}><Square size={14} /> Cancel safely</button>}
          </div>
        </div>}
      </section>
      <section className={styles.panel}>
        <PanelHeading icon={<Shield size={18} />} title="Scanner capability matrix" subtitle="Unsupported constructs are surfaced as unknown and never silently accepted." />
        <div className={styles.capabilityList}>{overview.capabilities.map((capability) => <div key={capability.key} className={styles.capabilityRow}><Badge value={capability.status} /><div><strong>{capability.label}</strong><p>{capability.detail}</p></div></div>)}</div>
      </section>
    </div>
    <div className={styles.twoColumns}>
      <Distribution title="Drift distribution" values={overview.driftDistribution} empty="No reconciliation drift is stored for the latest snapshot." />
      <Distribution title="Authority-model distribution" values={overview.authorityModels} empty="No authority model has been inferred yet." />
    </div>
  </div>
}

function ClassificationWorkspace({ manifests, selected, onSelect, evidence, canManage, busy, onUpdate }: { manifests: Manifest[]; selected: Manifest | null; onSelect: (manifest: Manifest) => void; evidence: EvidenceRow[]; canManage: boolean; busy: string | null; onUpdate: (id: string, decision: 'confirm' | 'invalidate', mutationAuthority: Record<string, string>) => Promise<void> }) {
  const [rpc, setRpc] = useState('')
  const [verificationRpc, setVerificationRpc] = useState('')
  const [rollbackRpc, setRollbackRpc] = useState('')
  useEffect(() => {
    setRpc('')
    setVerificationRpc('')
    setRollbackRpc('')
  }, [selected?.id])
  return <div className={styles.inspectorLayout}>
    <section className={styles.panelFill}>
      <PanelHeading icon={<Braces size={18} />} title="Evidence-backed authority manifests" subtitle="Generated from source AST, SQL, live metadata, RLS, constraints, and permission intersections—not module-specific hooks." />
      <div className={styles.manifestGrid}>{manifests.map((manifest) => <button key={manifest.id} onClick={() => onSelect(manifest)} className={selected?.id === manifest.id ? styles.manifestSelected : styles.manifestCard}>
        <div className={styles.cardTop}><div><small>{manifest.application_key}</small><strong>{manifest.display_name}</strong></div><Confidence value={manifest.confidence_score} /></div>
        <div className={styles.chipRow}>{manifest.authority_models.slice(0, 5).map((model) => <span key={model}>{model}</span>)}</div>
        <div className={styles.cardFooter}><Badge value={manifest.validation_status} /><span>{manifest.evidence_keys.length} evidence links</span></div>
      </button>)}</div>
      {!manifests.length && <EmptyInline text="Run the universal scanner to generate authority manifests." />}
    </section>
    <EvidenceInspector title="Manifest evidence" empty="Select an authority manifest to inspect confidence, unresolved authority, and execution eligibility.">
      {selected && <div className={styles.inspectorStack}>
        <Badge value={selected.validation_status} />
        <h3>{selected.display_name}</h3>
        <KeyValue label="Application" value={selected.application_key} />
        <KeyValue label="Module" value={selected.module_key ?? 'No separate module key'} />
        <KeyValue label="Confidence" value={`${Math.round(selected.confidence_score * 100)}% · ${selected.confidence}`} />
        <KeyValue label="Executable" value={selected.executable ? 'Confirmed execution authority' : 'Blocked by design'} />
        <div><small className={styles.fieldLabel}>Authority models</small><div className={styles.chipRow}>{selected.authority_models.map((model) => <span key={model}>{model}</span>)}</div></div>
        <div><small className={styles.fieldLabel}>Unresolved authority</small>{selected.unresolved.length ? selected.unresolved.map((item) => <div key={item} className={styles.warningLine}><AlertTriangle size={14} />{item}</div>) : <div className={styles.successLine}><Check size={14} />No unresolved evidence remains.</div>}</div>
        <EvidenceList evidence={evidence} />
        {canManage && <div className={styles.manifestControl}>
          <small className={styles.fieldLabel}>Controlled mutation contract</small>
          <input value={rpc} onChange={(event: { target: { value: string } }) => setRpc(event.target.value)} placeholder="mutation_rpc(jsonb)" />
          <input value={verificationRpc} onChange={(event: { target: { value: string } }) => setVerificationRpc(event.target.value)} placeholder="verification_rpc(jsonb)" />
          <input value={rollbackRpc} onChange={(event: { target: { value: string } }) => setRollbackRpc(event.target.value)} placeholder="rollback_rpc(jsonb) · optional" />
          <p>Confirmation never invents authority. Register only database RPCs already reviewed and returning a verified <code>{'{ ok: true }'}</code> result.</p>
          <div className={styles.planActions}>
            <button className={styles.secondaryButton} onClick={() => void onUpdate(selected.id, 'invalidate', {})} disabled={busy === `manifest:${selected.id}`}><ShieldAlert size={15} /> Invalidate</button>
            <button className={styles.primaryButton} onClick={() => void onUpdate(selected.id, 'confirm', { rpc, verificationRpc, rollbackRpc })} disabled={!rpc.trim() || !verificationRpc.trim() || busy === `manifest:${selected.id}`}>{busy === `manifest:${selected.id}` ? <LoaderCircle className={styles.spin} size={15} /> : <ShieldCheck size={15} />} Confirm authority</button>
          </div>
        </div>}
      </div>}
    </EvidenceInspector>
  </div>
}

function TopologyWorkspace({ nodes, selected, onSelect, evidence }: { nodes: TopologyNode[]; selected: TopologyNode | null; onSelect: (node: TopologyNode) => void; evidence: EvidenceRow[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, TopologyNode[]>()
    for (const node of nodes) {
      const key = node.application_key ?? 'unclassified'
      const current = map.get(key) ?? []
      current.push(node)
      map.set(key, current)
    }
    return [...map.entries()].sort((left, right) => right[1].length - left[1].length).slice(0, 24)
  }, [nodes])
  return <div className={styles.inspectorLayout}>
    <section className={styles.topologyCanvas}>
      <div className={styles.canvasHeader}><PanelHeading icon={<Network size={18} />} title="Authorization topology canvas" subtitle="Progressively loaded application families, operations, guards, native authorities, permissions, and RLS nodes." /><div className={styles.canvasLegend}><span><i className={styles.dotBlue} /> Application</span><span><i className={styles.dotGreen} /> Confirmed authority</span><span><i className={styles.dotAmber} /> Review</span><span><i className={styles.dotRed} /> Critical</span></div></div>
      <div className={styles.familyLanes}>{groups.map(([application, children]) => <article key={application} className={styles.familyLane}>
        <header><div className={styles.familyIcon}><Boxes size={16} /></div><div><small>Application family</small><strong>{application}</strong></div><span>{children.length}</span></header>
        <div className={styles.nodeStrip}>{children.slice(0, 14).map((node) => <button key={node.id} onClick={() => onSelect(node)} className={`${styles.nodePill} ${styles[`risk_${node.risk_level}`] ?? ''}`} title={node.canonical_key}><i />{node.display_name}<small>{node.node_type}</small></button>)}{children.length > 14 && <span className={styles.moreNode}>+{children.length - 14}</span>}</div>
      </article>)}</div>
      {!nodes.length && <EmptyState icon={<Network />} title="No topology snapshot available" detail="Run a scan to reconstruct application families, guard chains, database authorities, and evidence relationships." />}
    </section>
    <EvidenceInspector title="Topology node" empty="Select any node to inspect its source, model, risk, scope, and evidence confidence.">
      {selected && <div className={styles.inspectorStack}><Badge value={selected.risk_level} /><h3>{selected.display_name}</h3><code>{selected.canonical_key}</code><KeyValue label="Type" value={selected.node_type} /><KeyValue label="Application" value={selected.application_key ?? 'Unclassified'} /><KeyValue label="Workspace" value={selected.workspace_key ?? '—'} /><KeyValue label="Authority model" value={selected.authority_model ?? 'Not inferred'} /><KeyValue label="Confidence" value={`${Math.round(selected.confidence_score * 100)}% · ${selected.confidence}`} /><pre>{JSON.stringify(selected.metadata, null, 2)}</pre><EvidenceList evidence={evidence} /></div>}
    </EvidenceInspector>
  </div>
}

function OperationsWorkspace({ nodes, selected, onSelect, evidence }: { nodes: TopologyNode[]; selected: TopologyNode | null; onSelect: (node: TopologyNode) => void; evidence: EvidenceRow[] }) {
  return <div className={styles.inspectorLayout}>
    <section className={styles.tablePanel}>
      <PanelHeading icon={<FileCode2 size={18} />} title="Operation-level authorization registry" subtitle="Pages, APIs, and Server Actions with inferred guard model, scope, risk, and confidence." />
      <div className={styles.tableScroller}><table><thead><tr><th>Operation</th><th>Type</th><th>Application</th><th>Workspace</th><th>Authority</th><th>Risk</th><th>Confidence</th></tr></thead><tbody>{nodes.map((node) => <tr key={node.id} onClick={() => onSelect(node)} className={selected?.id === node.id ? styles.rowSelected : ''}><td><strong>{node.display_name}</strong><small>{node.canonical_key}</small></td><td>{node.node_type}</td><td>{node.application_key ?? '—'}</td><td>{node.workspace_key ?? '—'}</td><td><Badge value={node.authority_model ?? 'unclassified'} /></td><td><Badge value={node.risk_level} /></td><td><Confidence value={node.confidence_score} /></td></tr>)}</tbody></table></div>
      {!nodes.length && <EmptyInline text="No operation nodes match the current filters." />}
    </section>
    <EvidenceInspector title="Authorization chain" empty="Select a page, API, or Server Action to inspect its reconstructed decision chain.">
      {selected && <div className={styles.chain}><ChainStep icon={<FileCode2 />} label="Operation" value={selected.display_name} /><ChainStep icon={<Fingerprint />} label="Identity" value="Resolved from discovered auth/session helpers" /><ChainStep icon={<Shield />} label="Authorization" value={selected.authority_model ?? 'Unverified'} /><ChainStep icon={<Database />} label="Data authority" value={String(selected.metadata.table ?? 'Database/RLS evidence loads on demand')} /><ChainStep icon={<ShieldCheck />} label="Decision readiness" value={`${Math.round(selected.confidence_score * 100)}% confidence`} /><EvidenceList evidence={evidence} /></div>}
    </EvidenceInspector>
  </div>
}

function ReconciliationWorkspace({ findings, selectedIds, setSelectedIds, selected, onSelect, onCreatePlan, busy, canManage, evidence }: { findings: Finding[]; selectedIds: Set<string>; setSelectedIds: (value: Set<string>) => void; selected: Finding | null; onSelect: (finding: Finding) => void; onCreatePlan: () => Promise<void>; busy: boolean; canManage: boolean; evidence: EvidenceRow[] }) {
  function toggle(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedIds(next)
  }
  return <div className={styles.reconciliationLayout}>
    <aside className={styles.scopeRail}><div className={styles.eyebrow}>Scope navigator</div><h3>Drift classes</h3>{Object.entries(findings.reduce<Record<string, number>>((acc, finding) => { acc[finding.reconciliation_state] = (acc[finding.reconciliation_state] ?? 0) + 1; return acc }, {})).map(([state, count]) => <div key={state} className={styles.scopeRow}><Badge value={state} /><strong>{count}</strong></div>)}</aside>
    <section className={styles.reconciliationCenter}>
      <div className={styles.reconciliationHeader}><PanelHeading icon={<GitBranch size={18} />} title="Expected versus effective authority" subtitle="Route visibility, native membership, roles, permissions, entitlements, scopes, RLS, revocation, and cache state." /><button className={styles.primaryButton} onClick={() => void onCreatePlan()} disabled={!canManage || !selectedIds.size || busy}>{busy ? <LoaderCircle className={styles.spin} size={16} /> : <GitBranch size={16} />} Generate dry-run plan ({selectedIds.size})</button></div>
      <div className={styles.findingList}>{findings.map((finding) => <article key={finding.id} className={selected?.id === finding.id ? styles.findingSelected : styles.findingCard} onClick={() => onSelect(finding)}>
        <input type="checkbox" checked={selectedIds.has(finding.id)} onChange={() => toggle(finding.id)} onClick={(event: { stopPropagation: () => void }) => event.stopPropagation()} />
        <div><div className={styles.findingTitle}><Badge value={finding.severity} /><Badge value={finding.reconciliation_state} /><Confidence value={finding.confidence_score} /></div><h4>{finding.title}</h4><p>{finding.explanation}</p><div className={styles.findingMeta}><span>{finding.application_key ?? 'Unclassified family'}</span><span>{finding.user_id ? `User ${finding.user_id.slice(0, 8)}` : 'Estate-level'}</span><span>{finding.evidence_keys.length} evidence</span></div></div>
        <ArrowRight size={18} />
      </article>)}</div>
      {!findings.length && <EmptyState icon={<ShieldCheck />} title="No open drift findings" detail="The current filtered snapshot contains no unresolved reconciliation cases." />}
    </section>
    <EvidenceInspector title="Reconciliation case" empty="Select a case to compare expected and effective authority and inspect blocked reasons.">
      {selected && <div className={styles.inspectorStack}><div className={styles.chipRow}><Badge value={selected.severity} /><Badge value={selected.reconciliation_state} /></div><h3>{selected.title}</h3><p>{selected.explanation}</p><StateCompare label="Expected" value={selected.expected_state} good /><StateCompare label="Effective" value={selected.effective_state} /><div><small className={styles.fieldLabel}>Proposed operations</small>{selected.proposed_operations.length ? selected.proposed_operations.map((item) => <div key={item} className={styles.operationLine}><ChevronRight size={13} />{item}</div>) : <EmptyInline text="No safe automatic operation is proposed." />}</div>{selected.blocked_reasons.map((reason) => <div key={reason} className={styles.warningLine}><AlertTriangle size={14} />{reason}</div>)}<EvidenceList evidence={evidence} /></div>}
    </EvidenceInspector>
  </div>
}

function PublicationWorkspace({ plans, executions, rollbackPackages, onApprove, onExecute, onRollback, busy, capabilities }: { plans: Plan[]; executions: ExecutionRow[]; rollbackPackages: RollbackPackage[]; onApprove: (id: string) => Promise<void>; onExecute: (id: string) => Promise<void>; onRollback: (id: string) => Promise<void>; busy: string | null; capabilities: Capabilities }) {
  return <div className={styles.stack}>
    <section className={styles.executionDoctrine}><div><div className={styles.eyebrow}>Transactional execution doctrine</div><h3>HTTP success is never treated as authorization success</h3><p>Every operation must pass manifest validation, scope verification, registered RPC execution, cache invalidation, effective-access verification, audit evidence, and checkpoint completion.</p></div><div className={styles.doctrineSteps}>{['Preflight', 'Approval', 'Transaction', 'Native authority', 'Verification', 'Audit', 'Recovery'].map((item, index) => <span key={item}><i>{index + 1}</i>{item}</span>)}</div></section>
    <section className={styles.planGrid}>{plans.map((plan) => <article key={plan.id} className={styles.planCard}>
      <div className={styles.cardTop}><div><div className={styles.chipRow}><Badge value={plan.status} /><Badge value={plan.riskLevel} /></div><h3>{plan.title}</h3><p>{plan.description}</p></div><strong>{plan.operations.length}</strong></div>
      <div className={styles.planStats}><span>{String(plan.simulation.affectedUsers ?? 0)} users</span><span>{String(plan.simulation.affectedApplications ?? 0)} applications</span><span>{String(plan.simulation.blockedOperationCount ?? 0)} blocked</span></div>
      <div className={styles.operationPreview}>{plan.operations.slice(0, 5).map((operation) => <div key={operation.operationKey}><span>{operation.sequence}</span><div><strong>{operation.title}</strong><small>{operation.executionEligible ? 'Execution eligible' : operation.blockedReasons[0] ?? 'Blocked'}</small></div></div>)}</div>
      {plan.blockedReasons.length > 0 && <div className={styles.inlineReview}><AlertTriangle size={15} />{plan.blockedReasons[0]}{plan.blockedReasons.length > 1 ? ` (+${plan.blockedReasons.length - 1})` : ''}</div>}
      <div className={styles.planActions}>
        {['draft', 'review_required'].includes(plan.status) && <button className={styles.secondaryButton} onClick={() => void onApprove(plan.id)} disabled={!capabilities.canApprove || !plan.executionEligible || busy === `approve:${plan.id}`}>{busy === `approve:${plan.id}` ? <LoaderCircle className={styles.spin} size={15} /> : <UserRoundCheck size={15} />} Approve</button>}
        {plan.status === 'approved' && <button className={styles.primaryButton} onClick={() => void onExecute(plan.id)} disabled={!capabilities.canExecute || !plan.executionEligible || busy === `execute:${plan.id}`}>{busy === `execute:${plan.id}` ? <LoaderCircle className={styles.spin} size={15} /> : <Play size={15} />} Execute transaction</button>}
        <button className={styles.iconButton} onClick={() => downloadJson(`authorization-plan-${plan.planKey}.json`, plan)}><TerminalSquare size={15} /></button>
      </div>
    </article>)}</section>
    {!plans.length && <EmptyState icon={<History />} title="No reconciliation plans" detail="Select evidence-backed findings in Reconciliation and generate a dry-run plan." />}
    <section className={styles.panel}>
      <PanelHeading icon={<RotateCcw size={18} />} title="Execution & recovery ledger" subtitle="Verified outcomes, failure checkpoints, correlation IDs, and rollback eligibility." />
      <div className={styles.executionLedger}>{executions.map((execution) => {
        const rollback = rollbackPackages.find((item) => item.execution_id === execution.id)
        return <article key={execution.id}><div><div className={styles.chipRow}><Badge value={execution.status} />{rollback && <Badge value={rollback.status} />}</div><strong>{execution.correlation_id}</strong><small>{execution.actor_email ?? 'sovereign actor'} · {new Date(execution.started_at).toLocaleString('fr-FR')}</small>{execution.error && <p>{execution.error}</p>}</div><div className={styles.planActions}>{rollback?.status === 'available' && <button className={styles.secondaryButton} onClick={() => void onRollback(rollback.id)} disabled={!capabilities.canExecute || busy === `rollback:${rollback.id}`}>{busy === `rollback:${rollback.id}` ? <LoaderCircle className={styles.spin} size={15} /> : <RotateCcw size={15} />} Execute rollback</button>}<button className={styles.iconButton} onClick={() => downloadJson(`authorization-execution-${execution.id}.json`, { execution, rollback })}><TerminalSquare size={15} /></button></div></article>
      })}</div>
      {!executions.length && <EmptyInline text="No authorization execution has been recorded yet." />}
    </section>
  </div>
}

function CommandPalette({ onClose, onWorkspace, onScan, onRefresh }: { onClose: () => void; onWorkspace: (key: WorkspaceKey) => void; onScan: () => void; onRefresh: () => void }) {
  return <div className={styles.commandBackdrop} onMouseDown={onClose}><div className={styles.commandPalette} onMouseDown={(event: { stopPropagation: () => void }) => event.stopPropagation()}><header><Command size={18} /><input autoFocus placeholder="Type a command…" /><button onClick={onClose}><X size={16} /></button></header><div className={styles.commandGroup}><small>Navigation</small>{WORKSPACES.map((item) => { const Icon = item.icon; return <button key={item.key} onClick={() => onWorkspace(item.key)}><Icon size={16} /><span>{item.label}<small>{item.eyebrow}</small></span><ChevronRight size={14} /></button> })}</div><div className={styles.commandGroup}><small>Operations</small><button onClick={onScan}><ScanSearch size={16} /><span>Run full universal scan<small>Repository, source AST, SQL, database, topology, reconciliation</small></span><ChevronRight size={14} /></button><button onClick={onRefresh}><RefreshCcw size={16} /><span>Refresh stored snapshot<small>No filesystem scan</small></span><ChevronRight size={14} /></button></div></div></div>
}


function EvidenceList({ evidence }: { evidence: EvidenceRow[] }) {
  return <div className={styles.evidenceList}><small className={styles.fieldLabel}>Evidence chain</small>{evidence.length ? evidence.map((item) => <article key={item.id}><div><Badge value={item.confidence} /><strong>{item.evidence_kind}</strong></div><p>{item.summary}</p>{item.file_path && <code>{item.file_path}{item.line_start ? `:${item.line_start}` : ''}</code>}{item.database_object && <code>{item.database_object}</code>}{item.excerpt && <pre>{item.excerpt}</pre>}</article>) : <EmptyInline text="No evidence rows were loaded for this selection." />}</div>
}

function PanelHeading({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) { return <div className={styles.panelHeading}><span>{icon}</span><div><h3>{title}</h3><p>{subtitle}</p></div></div> }
function Badge({ value }: { value: string }) { return <span className={`${styles.badge} ${styles[`tone_${tone(value)}`] ?? ''}`}>{value.replaceAll('_', ' ')}</span> }
function Confidence({ value }: { value: number }) { return <span className={styles.confidence}><i style={{ width: `${percent(value * 100)}%` }} />{percent(value * 100)}%</span> }
function HealthGauge({ label, value }: { label: string; value: number }) { return <div className={styles.healthGauge}><div className={styles.gaugeRing} style={{ '--gauge': `${percent(value) * 3.6}deg` } as CSSProperties}><strong>{percent(value)}%</strong></div><span>{label}</span></div> }
function EmptyInline({ text }: { text: string }) { return <div className={styles.emptyInline}>{text}</div> }
function EmptyState({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) { return <div className={styles.emptyState}><span>{icon}</span><h3>{title}</h3><p>{detail}</p></div> }
function EvidenceInspector({ title, empty, children }: { title: string; empty: string; children?: ReactNode }) { return <aside className={styles.evidenceInspector}><header><PanelRightOpen size={17} /><strong>{title}</strong></header>{children || <EmptyInline text={empty} />}</aside> }
function KeyValue({ label, value }: { label: string; value: string }) { return <div className={styles.keyValue}><span>{label}</span><strong>{value}</strong></div> }
function StateCompare({ label, value, good = false }: { label: string; value: Record<string, unknown>; good?: boolean }) { return <div className={good ? styles.stateGood : styles.stateCurrent}><small>{label}</small><pre>{JSON.stringify(value, null, 2)}</pre></div> }
function ChainStep({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className={styles.chainStep}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div><ChevronRight size={14} /></div> }
function Distribution({ title, values, empty }: { title: string; values: Record<string, number>; empty: string }) { const entries = Object.entries(values).sort((left, right) => right[1] - left[1]); const max = Math.max(1, ...entries.map((entry) => entry[1])); return <section className={styles.panel}><PanelHeading icon={<ListFilter size={18} />} title={title} subtitle="Latest completed topology snapshot" />{entries.length ? <div className={styles.distribution}>{entries.map(([key, value]) => <div key={key}><span>{key.replaceAll('_', ' ')}</span><div><i style={{ width: `${Math.max(4, (value / max) * 100)}%` }} /></div><strong>{value}</strong></div>)}</div> : <EmptyInline text={empty} />}</section> }
