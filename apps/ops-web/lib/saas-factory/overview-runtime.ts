import { DEFAULT_MODULES } from '@/lib/saas-factory/catalog'
import { actions as fallbackActions, auditEvents as fallbackAuditEvents, queues as fallbackQueues } from '@/lib/saas-factory/data'
import {
  getFactoryOverview,
  listFactoryApis,
  listFactoryAuditEvents,
  listFactoryIncidents,
  listFactoryModules,
  listFactoryOptions,
  logAudit,
  saveFactoryModule,
} from '@/lib/saas-factory/server'
import { DEFAULT_PHASE7_PROBES, audit, enqueueJob, rest, runLocalProbe } from '@/lib/saas-factory/phase7-ops-runtime'

type Tone = 'green' | 'yellow' | 'red' | 'blue' | 'purple'
type Json = Record<string, unknown>

function nowIso() { return new Date().toISOString() }
function safeNumber(value: unknown, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}
function statusOf(row: any) { return String(row?.status ?? row?.health_status ?? row?.state ?? '').toLowerCase() }
function isActiveModule(row: any) { return ['active', 'healthy', 'operational', 'live', 'enabled'].includes(statusOf(row)) || row?.environment === 'production' }
function isWarningModule(row: any) { return ['warning', 'maintenance', 'degraded'].includes(statusOf(row)) || safeNumber(row?.health, 100) < 95 }
function isOpenIncident(row: any) { return !['resolved', 'closed'].includes(statusOf(row)) }

async function safeRestRows(table: string, query: string) {
  try {
    const result = await rest(table, 'GET', undefined, query)
    const data = Array.isArray((result as any).data) ? (result as any).data : []
    return { rows: data, dryRun: Boolean((result as any).dryRun), error: null as string | null }
  } catch (error) {
    return { rows: [] as any[], dryRun: false, error: error instanceof Error ? error.message : String(error) }
  }
}

async function writeAudit(event: string, title: string, metadata: Json = {}, severity = 'info') {
  await logAudit({ event_type: event, title, module_key: 'saas_factory_command', severity, metadata_json: metadata }).catch(() => null)
  await audit(event, { message: title, severity, metadata_json: metadata }).catch(() => null)
}

export async function getSaasFactoryCommandOverview() {
  const [overview, modulesResult, optionsResult, incidentsResult, apisResult, auditResult, probeRows, queueRows] = await Promise.all([
    getFactoryOverview(),
    listFactoryModules(),
    listFactoryOptions(),
    listFactoryIncidents(),
    listFactoryApis(),
    listFactoryAuditEvents(),
    safeRestRows('saas_factory_probe_results', '?select=*&order=checked_at.desc&limit=50'),
    safeRestRows('saas_factory_queue_jobs', '?select=*&order=created_at.desc&limit=250'),
  ])

  const modules = modulesResult.data || overview.modules || []
  const options = optionsResult.data || overview.options || []
  const incidents = incidentsResult.data || overview.incidents || []
  const apis = apisResult.data || overview.apis || []
  const auditEvents = (auditResult.data || overview.auditEvents || []).slice(0, 12)
  const probes = probeRows.rows
  const queueJobs = queueRows.rows

  const activeModules = modules.filter(isActiveModule).length
  const warningModules = modules.filter(isWarningModule).length
  const openIncidents = incidents.filter(isOpenIncident).length
  const failedProbes = probes.length ? probes.filter((p: any) => ['critical', 'failed', 'unhealthy'].includes(statusOf(p))).length : fallbackActions.filter((a) => a.status === 'dead').length
  const warningProbes = probes.filter((p: any) => statusOf(p) === 'warning').length
  const queueBacklog = queueJobs.length
    ? queueJobs.filter((job: any) => ['queued', 'retry', 'failed'].includes(statusOf(job))).length
    : fallbackQueues.reduce((sum, q) => sum + q.backlog + q.failed, 0)
  const failedJobs = queueJobs.length ? queueJobs.filter((job: any) => statusOf(job) === 'failed').length : fallbackQueues.reduce((sum, q) => sum + q.failed, 0)

  const apiUnhealthy = apis.filter((api: any) => ['critical', 'failed', 'dead', 'unhealthy'].includes(statusOf(api))).length
  const apiHealth = apis.length ? Math.max(0, Math.round(((apis.length - apiUnhealthy) / apis.length) * 100)) : 100
  const supabaseHealth: Tone = overview.source === 'supabase' && !overview.warnings.length ? 'green' : overview.source === 'supabase' ? 'yellow' : 'blue'
  const optionHealth: Tone = options.length > 0 ? 'green' : 'yellow'
  const readinessScore = Math.max(0, Math.min(100, 100 - warningModules * 5 - openIncidents * 8 - failedProbes * 7 - Math.min(20, Math.floor(queueBacklog / 750)) - apiUnhealthy * 6))

  const recommendations = [
    failedProbes > 0 ? { title: 'Resolve failed probes', detail: `${failedProbes} probe(s) are failing or stale. Run diagnostics and create an incident from the failure when needed.`, severity: 'critical' } : null,
    queueBacklog > 0 ? { title: 'Reduce queue backlog', detail: `${queueBacklog.toLocaleString()} queued or failed job(s) need processing/retry review.`, severity: queueBacklog > 1000 ? 'warning' : 'info' } : null,
    warningModules > 0 ? { title: 'Review warning modules', detail: `${warningModules} module(s) are degraded, in maintenance, or below health threshold.`, severity: 'warning' } : null,
    options.length === 0 ? { title: 'Seed live options registry', detail: 'No options returned from the registry. Bootstrap/sync the factory catalog before release.', severity: 'warning' } : null,
    overview.warnings.length ? { title: 'Supabase schema compatibility', detail: overview.warnings[0], severity: 'warning' } : null,
  ].filter(Boolean)

  return {
    generated_at: nowIso(),
    source: overview.source,
    warnings: overview.warnings || [],
    metrics: {
      moduleCount: modules.length,
      activeModules,
      warningModules,
      incidents: openIncidents,
      failedProbes,
      warningProbes,
      queueBacklog,
      failedJobs,
      recentAuditActivity: auditEvents.length,
      optionRegistryHealth: optionHealth,
      supabaseHealth,
      apiHealth,
      deploymentReadinessScore: readinessScore,
    },
    health: {
      supabase: { status: supabaseHealth, label: overview.source === 'supabase' ? 'Supabase connected' : 'Fallback-safe mode', detail: overview.warnings[0] || 'Schema responded without blocking the page.' },
      api: { status: apiHealth >= 95 ? 'green' : apiHealth >= 80 ? 'yellow' : 'red', label: `${apiHealth}% API health`, detail: `${apis.length} registered endpoint(s), ${apiUnhealthy} unhealthy.` },
      options: { status: optionHealth, label: `${options.length} option record(s)`, detail: options.length ? 'Options registry has live/fallback records.' : 'No live options returned.' },
      readiness: { status: readinessScore >= 90 ? 'green' : readinessScore >= 75 ? 'yellow' : 'red', label: `${readinessScore}% deployment readiness`, detail: 'Score is derived from modules, incidents, probes, queues, APIs and options.' },
    },
    modules: modules.slice(0, 12),
    incidents: incidents.slice(0, 8),
    auditEvents: auditEvents.length ? auditEvents : fallbackAuditEvents,
    probes: probes.slice(0, 10),
    queues: queueJobs.slice(0, 10),
    fallbackQueues,
    recommendations,
  }
}

export async function refreshSaasFactoryCommandOverview() {
  await writeAudit('saas_factory.overview.refreshed', 'SaaS Factory overview refreshed from command page')
  return getSaasFactoryCommandOverview()
}

export async function scanSaasFactoryCommand(origin: string) {
  const extendedProbes = [
    ...DEFAULT_PHASE7_PROBES,
    { probe_type: 'api', target: '/api/saas-factory/audit/recent', method: 'GET', module_key: 'saas_factory_command' },
    { probe_type: 'api', target: '/api/saas-factory/overview/diagnostics', method: 'GET', module_key: 'saas_factory_command' },
    { probe_type: 'api', target: '/api/saas-factory/modules', method: 'GET', module_key: 'saas_factory_command' },
    { probe_type: 'api', target: '/api/saas-factory/queues', method: 'GET', module_key: 'saas_factory_command' },
    { probe_type: 'api', target: '/api/saas-factory/incidents', method: 'GET', module_key: 'saas_factory_command' },
  ]
  const results = await Promise.all(extendedProbes.map((probe) => runLocalProbe(origin, probe)))
  await writeAudit('saas_factory.overview.scan.completed', 'System scan completed from SaaS Factory overview', { results })
  return { generated_at: nowIso(), results, summary: { total: results.length, healthy: results.filter((r) => r.status === 'healthy').length, warnings: results.filter((r) => r.status === 'warning').length, failed: results.filter((r) => r.status === 'critical').length } }
}

export async function runSaasFactoryDiagnostics(origin: string) {
  const overview = await getSaasFactoryCommandOverview()
  const scan = await scanSaasFactoryCommand(origin)
  const checks = [
    { name: 'API availability', status: scan.summary.failed ? 'failed' : scan.summary.warnings ? 'warning' : 'passed', recommended_action: scan.summary.failed ? 'Open incident from failed probe and inspect endpoint response.' : 'Continue monitoring.' },
    { name: 'Supabase connection', status: overview.metrics.supabaseHealth === 'green' ? 'passed' : overview.metrics.supabaseHealth === 'yellow' ? 'warning' : 'failed', recommended_action: overview.source === 'supabase' ? 'Review schema warnings only if shown.' : 'Configure Supabase env keys or run included SQL migration.' },
    { name: 'Module registry', status: overview.metrics.moduleCount ? (overview.metrics.warningModules ? 'warning' : 'passed') : 'failed', recommended_action: overview.metrics.moduleCount ? 'Sync module registry after code changes.' : 'Run module sync to seed registry.' },
    { name: 'Queue state', status: overview.metrics.failedJobs ? 'warning' : 'passed', recommended_action: overview.metrics.failedJobs ? 'Retry failed jobs where safe; do not purge without confirmation.' : 'No queue intervention required.' },
    { name: 'Incident state', status: overview.metrics.incidents ? 'warning' : 'passed', recommended_action: overview.metrics.incidents ? 'Open incident summary and resolve only through endpoint.' : 'No open incidents detected.' },
    { name: 'Audit state', status: overview.metrics.recentAuditActivity ? 'passed' : 'warning', recommended_action: overview.metrics.recentAuditActivity ? 'Audit trail is readable.' : 'Ensure audit table exists and RLS allows service role writes.' },
    { name: 'Options registry', status: overview.metrics.optionRegistryHealth === 'green' ? 'passed' : 'warning', recommended_action: overview.metrics.optionRegistryHealth === 'green' ? 'Registry has records.' : 'Seed required global options.' },
  ]
  await writeAudit('saas_factory.overview.diagnostics.completed', 'Diagnostics completed from SaaS Factory overview', { checks })
  return { generated_at: nowIso(), checks, summary: { passed: checks.filter((c) => c.status === 'passed').length, warnings: checks.filter((c) => c.status === 'warning').length, failed: checks.filter((c) => c.status === 'failed').length } }
}

export async function syncSaasFactoryModules() {
  const results = []
  for (const module of DEFAULT_MODULES) {
    results.push(await saveFactoryModule({ ...module, status: (module as any).status || 'active' }).catch((error) => ({ ok: false, error: error instanceof Error ? error.message : String(error), module_key: module.key })))
  }
  await writeAudit('saas_factory.modules.synced_from_overview', 'Module registry sync completed from SaaS Factory overview', { count: results.length, results })
  return { generated_at: nowIso(), count: results.length, results }
}

export async function recentSaasFactoryAudit(limit = 25) {
  const auditRows = await listFactoryAuditEvents().catch(() => ({ data: [], source: 'fallback' as const }))
  const rows = (auditRows.data?.length ? auditRows.data : fallbackAuditEvents).slice(0, Math.max(1, Math.min(limit, 100)))
  return { generated_at: nowIso(), source: auditRows.source || 'fallback', rows }
}

export async function processSaasFactoryAction(action: string, payload: Json = {}, origin?: string) {
  const normalized = action.toLowerCase()
  if (normalized.includes('refresh')) return { action, result: await refreshSaasFactoryCommandOverview() }
  if (normalized.includes('scan')) return { action, result: await scanSaasFactoryCommand(origin || 'http://localhost:3000') }
  if (normalized.includes('diagnostic')) return { action, result: await runSaasFactoryDiagnostics(origin || 'http://localhost:3000') }
  if (normalized.includes('sync module')) return { action, result: await syncSaasFactoryModules() }
  if (normalized.includes('view queue') || normalized.includes('queue summary')) return { action, result: (await getSaasFactoryCommandOverview()).fallbackQueues }
  if (normalized.includes('process queued')) {
    const result = await enqueueJob({ queue_name: 'saas-factory-safe-processing', job_type: 'overview_safe_process_request', priority: 'normal', payload_json: payload })
    return { action, result, note: 'Safe processing request queued; destructive processing is not performed from overview.' }
  }
  if (normalized.includes('retry failed')) {
    const result = await enqueueJob({ queue_name: 'saas-factory-safe-retry', job_type: 'retry_failed_jobs_review', priority: 'high', payload_json: payload })
    return { action, result, note: 'Retry review job queued; failed jobs are not blindly retried from the browser.' }
  }
  if (normalized.includes('purge')) {
    await writeAudit('saas_factory.unsafe_action.blocked', 'Purge requested from overview but blocked pending explicit confirmation flow', { action, payload }, 'warning')
    return { action, disabled: true, reason: 'Purge is intentionally disabled on overview. Use queue page confirmation workflow.' }
  }
  if (normalized.includes('incident')) {
    const result = await createIncidentFromOverview(payload)
    return { action, result }
  }
  if (normalized.includes('maintenance') || normalized.includes('emergency') || normalized.includes('safe mode')) {
    await writeAudit('saas_factory.safety_mode.requested', `${action} requested from overview`, { action, payload }, 'warning')
    return { action, requiresConfirmation: true, reason: 'Safety-impacting command was audited. Confirm inside the modal before enabling in production.' }
  }
  if (normalized.includes('export')) return { action, result: await recentSaasFactoryAudit(100) }
  await writeAudit('saas_factory.overview.action', `Overview action executed: ${action}`, { action, payload })
  return { action, result: await getSaasFactoryCommandOverview() }
}

async function createIncidentFromOverview(payload: Json) {
  const title = String(payload.title || payload.message || 'SaaS Factory overview generated incident')
  const result = await rest('saas_factory_incidents', 'POST', [{ key: `overview_${Date.now()}`, title, severity: payload.severity || 'warning', status: 'investigating', module_key: 'saas_factory_command', source: 'overview_action', metadata_json: payload, created_at: nowIso(), updated_at: nowIso() }]).catch((error) => ({ ok: false, error: error instanceof Error ? error.message : String(error) }))
  await writeAudit('saas_factory.incident.created_from_overview', title, { payload, result }, String(payload.severity || 'warning'))
  return result
}
