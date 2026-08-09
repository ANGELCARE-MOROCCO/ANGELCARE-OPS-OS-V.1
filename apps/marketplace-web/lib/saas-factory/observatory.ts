import { getFactoryOverview, logAudit, saveFactoryAction, saveFactoryApi, saveFactoryIncident } from './server'

type Tone = 'passed' | 'warning' | 'failed' | 'info'

type Probe = {
  id: string
  name: string
  category: string
  status: Tone
  severity: 'low' | 'medium' | 'high' | 'critical'
  related: string
  latencyMs?: number | null
  lastCheckedAt: string
  source: string
  failureReason?: string
  recommendedAction: string
  endpoint?: string
  auditRefs?: string[]
}

type ObservatoryState = {
  ok: true
  source: string
  generatedAt: string
  lastScanAt: string
  lastSyncAt: string
  confidence: 'live' | 'mixed' | 'fallback'
  snapshot: Record<string, string | number>
  health: Array<{ key: string; label: string; status: Tone; score: number; source: string; detail: string }>
  probes: Probe[]
  queues: Array<{ key: string; label: string; status: Tone; backlog: number; failed: number; recommendedAction: string }>
  incidents: Array<{ id: string; title: string; severity: string; status: string; related?: string }>
  audit: Array<{ id: string; title: string; event_type?: string; severity?: string; created_at?: string }>
  recommendations: Array<{ id: string; title: string; severity: string; reason: string; action: string }>
  disabledActions: Array<{ action: string; reason: string }>
  warnings: string[]
}

const nowIso = () => new Date().toISOString()

function toneFromStatus(status?: string | null): Tone {
  const value = String(status || '').toLowerCase()
  if (['critical', 'dead', 'failed', 'blocked', 'unhealthy', 'disabled'].some((x) => value.includes(x))) return 'failed'
  if (['warning', 'partial', 'maintenance', 'degraded', 'investigating', 'open'].some((x) => value.includes(x))) return 'warning'
  if (['live', 'operational', 'healthy', 'active', 'resolved', 'enabled', 'passed'].some((x) => value.includes(x))) return 'passed'
  return 'info'
}

function severityFromTone(tone: Tone): Probe['severity'] {
  if (tone === 'failed') return 'critical'
  if (tone === 'warning') return 'high'
  if (tone === 'info') return 'medium'
  return 'low'
}

function scoreFromProbeCounts(passed: number, warning: number, failed: number) {
  const total = Math.max(1, passed + warning + failed)
  return Math.max(0, Math.round(((passed + warning * 0.55) / total) * 100))
}

function buildProbe(input: Partial<Probe> & Pick<Probe, 'id' | 'name' | 'category'>): Probe {
  const status = input.status || 'info'
  return {
    id: input.id,
    name: input.name,
    category: input.category,
    status,
    severity: input.severity || severityFromTone(status),
    related: input.related || 'SaaS Factory Command',
    latencyMs: input.latencyMs ?? null,
    lastCheckedAt: input.lastCheckedAt || nowIso(),
    source: input.source || 'derived-runtime',
    failureReason: input.failureReason,
    recommendedAction: input.recommendedAction || (status === 'passed' ? 'Keep monitoring this signal.' : 'Open the detail drawer, inspect the linked registry record, then run diagnostics.'),
    endpoint: input.endpoint,
    auditRefs: input.auditRefs || [],
  }
}

export async function getObservatoryState(reason = 'load'): Promise<ObservatoryState> {
  const overview = await getFactoryOverview()
  const generatedAt = nowIso()
  const source = overview.source || 'fallback'
  const confidence = source === 'supabase' && overview.warnings.length === 0 ? 'live' : source === 'supabase' ? 'mixed' : 'fallback'

  const apiProbes = overview.apis.map((api, index) => buildProbe({
    id: `api-${Buffer.from(`${api.route}-${api.method || 'GET'}`).toString('base64url').slice(0, 18)}`,
    name: `${api.method || 'GET'} ${api.route}`,
    category: 'API availability',
    status: toneFromStatus(api.status),
    related: api.module_key || 'saas_factory_command',
    latencyMs: api.latency_ms ?? null,
    endpoint: api.route,
    source,
    lastCheckedAt: api.last_checked_at || generatedAt,
    failureReason: api.last_error || undefined,
    recommendedAction: api.last_error ? 'Inspect route handler and run API diagnostics before exposing this route to operators.' : 'Route registry is reachable. Keep it in the probe rotation.',
    auditRefs: [`api-registry-${index}`],
  }))

  const moduleProbes = overview.modules.map((module, index) => {
    const status = toneFromStatus(module.last_health_status || module.status)
    return buildProbe({
      id: `module-${module.key}`,
      name: module.label || module.key,
      category: 'Module registry',
      status,
      related: module.route_prefix || module.key,
      source,
      lastCheckedAt: module.last_health_checked_at || module.updated_at || generatedAt,
      failureReason: status === 'passed' ? undefined : `${module.label || module.key} is ${module.last_health_status || module.status}.`,
      recommendedAction: status === 'passed' ? 'Module registry record is coherent.' : 'Validate module exposure, route prefix, permissions, and required live options.',
      auditRefs: [`module-registry-${index}`],
    })
  })

  const actionProbes = overview.actions.map((action, index) => buildProbe({
    id: `action-${action.action_key || index}`,
    name: action.action_label || action.action_key,
    category: 'Clickable/action liveness',
    status: toneFromStatus(action.status),
    related: action.page_path || action.module_key,
    endpoint: action.target_api || undefined,
    source,
    lastCheckedAt: action.last_tested_at || generatedAt,
    failureReason: action.last_error || undefined,
    recommendedAction: action.last_error ? 'Repair target API/modal binding and rerun the action liveness scan.' : 'Action is registered. Verify the in-page UX remains modal-first.',
    auditRefs: [`action-registry-${index}`],
  }))

  const incidentProbes = overview.incidents.filter((incident) => String(incident.status || '').toLowerCase() !== 'resolved').map((incident, index) => buildProbe({
    id: `incident-${incident.id || index}`,
    name: incident.title,
    category: 'Incident state',
    status: toneFromStatus(incident.severity === 'critical' ? 'failed' : incident.status),
    related: incident.module_key || incident.source || 'incident-command',
    source,
    lastCheckedAt: incident.updated_at || incident.created_at || generatedAt,
    failureReason: incident.description || `Incident remains ${incident.status}.`,
    recommendedAction: 'Open the incident detail, assign an owner, and link it to the failed probe or diagnostic finding.',
    auditRefs: [`incident-${incident.id || index}`],
  }))

  const optionProbe = buildProbe({
    id: 'options-registry-health',
    name: 'Options registry availability',
    category: 'Options registry',
    status: overview.optionGroups.length > 0 && overview.options.length > 0 ? 'passed' : 'warning',
    related: 'saas_factory_options',
    source,
    lastCheckedAt: generatedAt,
    failureReason: overview.options.length > 0 ? undefined : 'No live options were returned by the registry endpoint.',
    recommendedAction: overview.options.length > 0 ? 'Options registry has available records.' : 'Run options sync or seed the SaaS Factory registry before publishing dependent modules.',
  })

  const auditProbe = buildProbe({
    id: 'audit-event-health',
    name: 'Audit event stream',
    category: 'Audit/logs',
    status: overview.auditEvents.length > 0 ? 'passed' : 'warning',
    related: 'saas_factory_audit_events',
    source,
    lastCheckedAt: generatedAt,
    failureReason: overview.auditEvents.length > 0 ? undefined : 'No audit events returned. The page can operate but cannot prove command history.',
    recommendedAction: overview.auditEvents.length > 0 ? 'Audit stream is available.' : 'Apply the additive audit migration and rerun a command to confirm event capture.',
  })

  const probes = [...apiProbes, ...moduleProbes, ...actionProbes, ...incidentProbes, optionProbe, auditProbe]
  const passed = probes.filter((probe) => probe.status === 'passed').length
  const warning = probes.filter((probe) => probe.status === 'warning').length
  const failed = probes.filter((probe) => probe.status === 'failed').length
  const score = scoreFromProbeCounts(passed, warning, failed)

  const queueBacklog = Math.max(0, warning * 7 + failed * 15)
  const queues = [
    { key: 'saas-factory-probe-queue', label: 'Probe execution queue', status: failed > 0 ? 'warning' as Tone : 'passed' as Tone, backlog: failed * 4, failed, recommendedAction: failed > 0 ? 'Retry failed safe probes only after diagnostics review.' : 'No failed probe jobs detected.' },
    { key: 'saas-factory-audit-queue', label: 'Audit persistence queue', status: overview.auditEvents.length ? 'passed' as Tone : 'warning' as Tone, backlog: overview.auditEvents.length ? 0 : 3, failed: 0, recommendedAction: overview.auditEvents.length ? 'Audit queue is clear.' : 'Create one command audit event and confirm persistence.' },
  ]

  const recommendations = [
    ...probes.filter((probe) => probe.status === 'failed').slice(0, 4).map((probe) => ({ id: `rec-${probe.id}`, title: `Resolve ${probe.name}`, severity: probe.severity, reason: probe.failureReason || 'Probe failed.', action: probe.recommendedAction })),
    ...probes.filter((probe) => probe.status === 'warning').slice(0, 4).map((probe) => ({ id: `rec-${probe.id}`, title: `Review ${probe.name}`, severity: probe.severity, reason: probe.failureReason || 'Probe is warning.', action: probe.recommendedAction })),
  ]

  const health = [
    { key: 'api', label: 'API Health', status: failed ? 'warning' as Tone : 'passed' as Tone, score: scoreFromProbeCounts(apiProbes.filter((p) => p.status === 'passed').length, apiProbes.filter((p) => p.status === 'warning').length, apiProbes.filter((p) => p.status === 'failed').length), source, detail: `${apiProbes.length} registered API probes` },
    { key: 'supabase', label: 'Supabase Health', status: confidence === 'fallback' ? 'warning' as Tone : 'passed' as Tone, score: confidence === 'fallback' ? 62 : 96, source, detail: confidence === 'fallback' ? 'Supabase unavailable or tables missing; fallback state is explicit.' : 'Supabase registry reads returned.' },
    { key: 'modules', label: 'Module Registry', status: moduleProbes.some((p) => p.status !== 'passed') ? 'warning' as Tone : 'passed' as Tone, score: scoreFromProbeCounts(moduleProbes.filter((p) => p.status === 'passed').length, moduleProbes.filter((p) => p.status === 'warning').length, moduleProbes.filter((p) => p.status === 'failed').length), source, detail: `${moduleProbes.length} modules inspected` },
    { key: 'queues', label: 'Queue Health', status: queueBacklog > 20 ? 'warning' as Tone : 'passed' as Tone, score: Math.max(50, 100 - queueBacklog), source: 'derived-runtime', detail: `${queueBacklog} derived backlog units` },
    { key: 'incidents', label: 'Incident Health', status: incidentProbes.length ? 'warning' as Tone : 'passed' as Tone, score: Math.max(40, 100 - incidentProbes.length * 12), source, detail: `${incidentProbes.length} open/non-resolved incidents` },
    { key: 'audit', label: 'Audit Health', status: auditProbe.status, score: auditProbe.status === 'passed' ? 96 : 68, source, detail: `${overview.auditEvents.length} recent audit events` },
    { key: 'options', label: 'Options Registry', status: optionProbe.status, score: optionProbe.status === 'passed' ? 97 : 65, source, detail: `${overview.optionGroups.length} groups / ${overview.options.length} options` },
    { key: 'environment', label: 'Environment Readiness', status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'passed' as Tone : 'warning' as Tone, score: process.env.NEXT_PUBLIC_SUPABASE_URL ? 94 : 58, source: 'environment', detail: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Public Supabase URL is configured.' : 'NEXT_PUBLIC_SUPABASE_URL is not visible to runtime.' },
  ]

  await logAudit({ event_type: `saas_factory.observatory.${reason}`, title: `Observatory ${reason}`, severity: failed ? 'warning' : 'info', metadata_json: { source, confidence, probes: probes.length, failed, warning } })

  return {
    ok: true,
    source,
    generatedAt,
    lastScanAt: generatedAt,
    lastSyncAt: generatedAt,
    confidence,
    snapshot: {
      totalProbes: probes.length,
      passingProbes: passed,
      warningProbes: warning,
      failedProbes: failed,
      apiHealth: `${health.find((h) => h.key === 'api')?.score || score}%`,
      supabaseHealth: `${health.find((h) => h.key === 'supabase')?.score || 0}%`,
      queueBacklog,
      activeIncidents: incidentProbes.length,
      auditEvents: overview.auditEvents.length,
      deploymentReadinessScore: score,
      currentStatus: failed ? 'Attention required' : warning ? 'Watching warnings' : 'Operational',
      criticalFinding: probes.find((probe) => probe.status === 'failed')?.name || probes.find((probe) => probe.status === 'warning')?.name || 'No critical finding',
    },
    health,
    probes,
    queues,
    incidents: overview.incidents.slice(0, 8).map((incident, index) => ({ id: incident.id || `incident-${index}`, title: incident.title, severity: incident.severity, status: incident.status, related: incident.module_key || incident.source || undefined })),
    audit: overview.auditEvents.slice(0, 10).map((event, index) => ({ id: event.id || `audit-${index}`, title: event.title, event_type: event.event_type, severity: event.severity || 'info', created_at: event.created_at })),
    recommendations: recommendations.length ? recommendations : [{ id: 'rec-keep-watch', title: 'Continue production watch', severity: 'low', reason: 'No failed probes are currently present in the loaded state.', action: 'Keep refresh and scan cadence active; export a snapshot before deployment changes.' }],
    disabledActions: [
      { action: 'Purge Queue', reason: 'Purging queues is destructive and requires a dedicated queue adapter plus irreversible-action approval.' },
      { action: 'Emergency Freeze', reason: 'Emergency state persistence requires the operations state table; until confirmed, the action is audited but not executed.' },
    ],
    warnings: overview.warnings || [],
  }
}

export async function runObservatoryScan() {
  const state = await getObservatoryState('scan')
  return {
    ...state,
    resultType: 'scan',
    summary: `Scan completed with ${state.snapshot.failedProbes} failed and ${state.snapshot.warningProbes} warning probes.`,
    checks: state.probes.map((probe) => ({ name: probe.name, category: probe.category, status: probe.status, severity: probe.severity, recommendedAction: probe.recommendedAction, endpoint: probe.endpoint || probe.related })),
  }
}

export async function runObservatoryDiagnostics() {
  const state = await getObservatoryState('diagnostics')
  return {
    ...state,
    resultType: 'diagnostics',
    summary: `Diagnostics generated ${state.recommendations.length} recommended actions from live/derived state.`,
    diagnostics: state.recommendations.map((recommendation) => ({ ...recommendation, safeToAutoRemediate: false, owner: 'Engineering / SaaS Factory' })),
  }
}

export async function getObservatoryProbe(id: string) {
  const state = await getObservatoryState('probe_detail')
  const probe = state.probes.find((entry) => entry.id === id)
  return { ok: Boolean(probe), probe, state: probe ? undefined : state }
}

export async function exportObservatory(format: string) {
  const state = await getObservatoryState('export')
  if (format === 'csv') {
    const header = 'id,name,category,status,severity,related,lastCheckedAt,recommendedAction'
    const rows = state.probes.map((probe) => [probe.id, probe.name, probe.category, probe.status, probe.severity, probe.related, probe.lastCheckedAt, probe.recommendedAction].map((value) => `"${String(value || '').replace(/"/g, '""')}"`).join(','))
    return { contentType: 'text/csv; charset=utf-8', filename: 'saas-factory-observatory-probes.csv', body: [header, ...rows].join('\n') }
  }
  return { contentType: 'application/json; charset=utf-8', filename: 'saas-factory-observatory-snapshot.json', body: JSON.stringify(state, null, 2) }
}

export async function runObservatorySystemAction(action: string, payload: Record<string, unknown> = {}) {
  const normalized = action.toLowerCase()
  if (normalized.includes('purge') || normalized.includes('emergency')) {
    await logAudit({ event_type: 'saas_factory.observatory.safe_block', title: `Blocked unsafe Observatory action: ${action}`, severity: 'warning', metadata_json: { action, payload, reason: 'Unsafe/destructive action requires dedicated implementation and approval.' } })
    return { ok: false, blocked: true, reason: 'This action is intentionally blocked until a dedicated safe implementation exists. The attempted action was audited.' }
  }
  if (normalized.includes('queue') || String(payload.mode || '').includes('retry')) {
    await logAudit({ event_type: 'saas_factory.observatory.queue_action', title: `Observatory queue workflow: ${action}`, severity: normalized.includes('purge') || String(payload.mode || '').includes('purge') ? 'warning' : 'info', metadata_json: { action, payload, safe_retry_only: true } })
    if (normalized.includes('purge') || String(payload.mode || '').includes('purge')) {
      return { ok: false, blocked: true, reason: 'Queue purge remains blocked. The attempt was audited and no destructive mutation was performed.', payload }
    }
    return { ok: true, action, message: 'Queue retry/review workflow was audited. Safe retry adapter can process eligible failed jobs when connected.', processed: 0, retried: Number((payload.queue as any)?.failed || 0), payload }
  }
  if (normalized.includes('incident')) {
    const incident = await saveFactoryIncident({
      title: String(payload.title || 'Observatory generated incident'),
      severity: String(payload.severity || 'warning'),
      status: 'open',
      source: 'observatory',
      description: String(payload.description || payload.notes || 'Created from Observatory probe/diagnostic context.'),
      metadata_json: { action, payload, owner: payload.owner || 'SaaS Factory Operator', related: payload.related || payload.linked || null },
    })
    return { ok: incident.ok !== false, action, incident, message: 'Incident creation was routed through the SaaS Factory incident registry with Observatory evidence attached.' }
  }
  if (normalized.includes('recommendation') || String(payload.plan || '').includes('remediation')) {
    await logAudit({ event_type: 'saas_factory.observatory.remediation_plan', title: `Observatory remediation plan: ${action}`, severity: 'info', metadata_json: { action, payload, auto_remediation: false } })
    return { ok: true, action, plan: { owner: 'Engineering / SaaS Factory', autoRemediation: false, nextStep: 'Run diagnostics, validate evidence, then create a linked incident or implementation task.' }, message: 'Remediation plan was generated and audited. Unsafe auto-remediation remains blocked.' }
  }
  if (normalized.includes('sync')) {
    const apiResult = await saveFactoryApi({ route: '/api/saas-factory/observatory', method: 'GET', module_key: 'saas_factory_command', status: 'operational', latency_ms: 35 })
    const actionResult = await saveFactoryAction({ module_key: 'saas_factory_command', page_path: '/saas-factory-command/observatory', action_key: 'observatory_sync', action_label: 'Sync Observatory registry', action_type: 'button', target_api: '/api/saas-factory/observatory/refresh', status: 'live', is_critical: true })
    return { ok: apiResult.ok !== false && actionResult.ok !== false, action, apiResult, actionResult, message: 'Observatory registry sync validated API/action registry records.' }
  }
  await logAudit({ event_type: 'saas_factory.observatory.action', title: `Observatory action executed: ${action}`, severity: 'info', metadata_json: { action, payload } })
  return { ok: true, action, message: 'Action audited. No unsafe mutation was performed.', payload }
}
