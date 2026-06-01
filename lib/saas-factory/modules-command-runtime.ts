
import { actions as seededActions, auditEvents as seededAuditEvents, incidents as seededIncidents, modules as seededModules, queues as seededQueues } from '@/lib/saas-factory/data'
import { listFactoryActions, listFactoryApis, listFactoryAuditEvents, listFactoryIncidents, listFactoryModules, logAudit, saveFactoryModule } from '@/lib/saas-factory/server'

type AnyRecord = Record<string, any>

export type ModuleCommandRecord = {
  key: string; label: string; description: string; route: string; status: string; health: number; visibility: string; access: string; environment: string; version: string; apiCount: number; pageCount: number; tables: string[]; dependencies: string[]; rollout: string; owner: string; source: 'supabase' | 'fallback' | 'hybrid'; lastCheckedAt: string; riskLevel: 'low' | 'medium' | 'high' | 'critical'; readiness: number; exposureScore: number; incidents: number; actions: number; failedActions: number; apis: number; failedApis: number; auditEvents: number; recommendations: string[]; metadata: AnyRecord
}

export type ModuleCommandState = {
  ok: true; source: 'supabase' | 'fallback' | 'hybrid'; generatedAt: string; warnings: string[];
  metrics: { totalModules: number; activeModules: number; hiddenModules: number; restrictedModules: number; maintenanceModules: number; disabledModules: number; warningModules: number; criticalModules: number; averageHealth: number; averageReadiness: number; totalApis: number; totalActions: number; failedActions: number; openIncidents: number; staleModules: number; deploymentReady: number };
  modules: ModuleCommandRecord[]; recommendations: Array<{ id: string; severity: string; moduleKey: string; title: string; action: string }>; recentAudit: AnyRecord[]; queueSummary: { totalQueues: number; backlog: number; failed: number; warningQueues: number }
}

function asArray(value: any): string[] { if (Array.isArray(value)) return value.map(String).filter(Boolean); if (typeof value === 'string' && value.trim()) return value.split(',').map((x) => x.trim()).filter(Boolean); return [] }
function num(value: any, fallback = 0): number { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
function normalizeStatus(status: any): string { const value = String(status || 'operational').toLowerCase(); if (value === 'healthy' || value === 'released') return 'operational'; return value }
function statusToHealth(status: string, fallback = 98): number { if (['operational','active','live'].includes(status)) return fallback; if (['warning','maintenance','rolling_out','partial'].includes(status)) return Math.min(fallback, 88); if (['critical','dead','blocked','unhealthy'].includes(status)) return Math.min(fallback, 54); if (['disabled','inactive','hidden'].includes(status)) return Math.min(fallback, 70); return fallback }
function seededFor(key: string): AnyRecord | undefined { return (seededModules as AnyRecord[]).find((module) => module.key === key) }

function normalizeModule(row: AnyRecord, related: { actions: AnyRecord[]; apis: AnyRecord[]; incidents: AnyRecord[]; audit: AnyRecord[] }, source: 'supabase' | 'fallback' | 'hybrid'): ModuleCommandRecord {
  const seed = seededFor(String(row.key || row.module_key || row.id || 'module')) || {}
  const key = String(row.key || row.module_key || seed.key || `module_${Date.now()}`)
  const status = normalizeStatus(row.status || row.last_health_status || seed.status)
  const visibility = String(row.visibility || seed.visibility || (status === 'disabled' ? 'hidden' : 'visible'))
  const access = String(row.access || seed.access || (visibility === 'hidden' ? 'restricted' : 'full'))
  const rollout = String(row.rollout || row.rollout_stage || seed.rollout || 'production')
  const health = Math.max(0, Math.min(100, num(row.health ?? row.health_score ?? seed.health, statusToHealth(status))))
  const moduleActions = related.actions.filter((action) => String(action.module_key || action.module || '').toLowerCase().includes(key.toLowerCase()) || String(action.module || '').toLowerCase().includes(String(row.label || seed.label || key).toLowerCase()))
  const moduleApis = related.apis.filter((api) => String(api.module_key || api.module || '').toLowerCase().includes(key.toLowerCase()))
  const moduleIncidents = related.incidents.filter((incident) => String(incident.module_key || incident.service || '').toLowerCase().includes(key.toLowerCase()) && !['resolved','closed'].includes(String(incident.status || '').toLowerCase()))
  const failedActions = moduleActions.filter((action) => !['live','operational','healthy','success'].includes(String(action.status || '').toLowerCase())).length
  const failedApis = moduleApis.filter((api) => !['live','operational','healthy','success'].includes(String(api.status || '').toLowerCase())).length
  const exposureScore = Math.max(0, Math.min(100, (visibility === 'visible' ? 38 : 12) + (access === 'full' ? 28 : access === 'restricted' ? 16 : 6) + (rollout === 'released' || rollout === 'production' ? 22 : 12) - moduleIncidents.length * 4))
  const readiness = Math.max(0, Math.min(100, Math.round((health * 0.52) + (exposureScore * 0.18) + (failedActions === 0 ? 15 : Math.max(0, 15 - failedActions * 4)) + (failedApis === 0 ? 15 : Math.max(0, 15 - failedApis * 5)))))
  const riskLevel = readiness < 60 || status === 'critical' ? 'critical' : readiness < 76 || failedApis > 0 ? 'high' : readiness < 90 || status === 'warning' || status === 'maintenance' ? 'medium' : 'low'
  const recommendations = [status === 'maintenance' ? 'Review maintenance window and publish operational owner note.' : '', visibility === 'hidden' && status !== 'disabled' ? 'Validate hidden visibility before production rollout.' : '', failedActions > 0 ? `Repair ${failedActions} action registry item(s) before exposing module broadly.` : '', failedApis > 0 ? `Run API diagnostics on ${failedApis} unhealthy route(s).` : '', moduleIncidents.length > 0 ? `Link ${moduleIncidents.length} open incident(s) to remediation plan.` : '', readiness < 90 ? 'Run readiness sync and export sign-off evidence.' : ''].filter(Boolean)
  return { key, label: String(row.label || row.name || seed.label || key.replace(/_/g, ' ')), description: String(row.description || seed.description || 'AngelCare operational module'), route: String(row.route || row.route_prefix || seed.route || `/saas-factory-command/modules/${key}`), status, health, visibility, access, environment: String(row.environment || seed.environment || (status === 'maintenance' ? 'maintenance' : 'production')), version: String(row.version || seed.version || 'v1.0.0'), apiCount: num(row.apiCount ?? row.api_count ?? seed.apiCount ?? moduleApis.length, moduleApis.length), pageCount: num(row.pageCount ?? row.page_count ?? seed.pageCount, 0), tables: asArray(row.tables || row.table_names || seed.tables), dependencies: asArray(row.dependencies || seed.dependencies), rollout, owner: String(row.owner || row.owner_team || seed.owner || 'SaaS Factory Ops'), source, lastCheckedAt: String(row.last_health_checked_at || row.updated_at || row.created_at || new Date().toISOString()), riskLevel, readiness, exposureScore, incidents: moduleIncidents.length, actions: moduleActions.length || num(seed.actions, 0), failedActions, apis: moduleApis.length || num(row.apiCount ?? row.api_count ?? seed.apiCount, 0), failedApis, auditEvents: related.audit.filter((event) => String(event.module_key || '').toLowerCase().includes(key.toLowerCase())).length, recommendations, metadata: { original: row, seeded: Boolean(seed?.key) } }
}

async function readRelated() {
  const [actions, apis, incidents, audit] = await Promise.all([listFactoryActions(), listFactoryApis(), listFactoryIncidents(), listFactoryAuditEvents()])
  return { actions, apis, incidents, audit }
}

export async function getModulesCommandState(): Promise<ModuleCommandState> {
  const modulesResult = await listFactoryModules()
  const related = await readRelated()
  const warnings = [modulesResult.error, related.actions.error, related.apis.error, related.incidents.error, related.audit.error].filter(Boolean) as string[]
  const source: 'supabase' | 'fallback' | 'hybrid' = modulesResult.source === 'supabase' ? (warnings.length ? 'hybrid' : 'supabase') : 'fallback'
  const relationData = { actions: related.actions.data as AnyRecord[], apis: related.apis.data as AnyRecord[], incidents: related.incidents.data as AnyRecord[], audit: related.audit.data as AnyRecord[] }
  const normalized = (modulesResult.data as AnyRecord[]).map((module) => normalizeModule(module, relationData, source))
  const modules = normalized.length ? normalized : (seededModules as AnyRecord[]).map((module) => normalizeModule(module, relationData, 'fallback'))
  const metrics = { totalModules: modules.length, activeModules: modules.filter((module) => ['operational','active','healthy','live'].includes(module.status)).length, hiddenModules: modules.filter((module) => module.visibility === 'hidden').length, restrictedModules: modules.filter((module) => module.access !== 'full').length, maintenanceModules: modules.filter((module) => module.status === 'maintenance' || module.environment === 'maintenance').length, disabledModules: modules.filter((module) => module.status === 'disabled').length, warningModules: modules.filter((module) => module.status === 'warning' || module.riskLevel === 'medium').length, criticalModules: modules.filter((module) => module.status === 'critical' || module.riskLevel === 'critical').length, averageHealth: Math.round(modules.reduce((sum, module) => sum + module.health, 0) / Math.max(1, modules.length)), averageReadiness: Math.round(modules.reduce((sum, module) => sum + module.readiness, 0) / Math.max(1, modules.length)), totalApis: modules.reduce((sum, module) => sum + module.apiCount, 0), totalActions: modules.reduce((sum, module) => sum + module.actions, 0), failedActions: modules.reduce((sum, module) => sum + module.failedActions, 0), openIncidents: modules.reduce((sum, module) => sum + module.incidents, 0), staleModules: modules.filter((module) => Date.now() - new Date(module.lastCheckedAt).getTime() > 1000 * 60 * 60 * 24 * 7).length, deploymentReady: Math.round(modules.filter((module) => module.readiness >= 90 && ['operational','active','healthy','live'].includes(module.status)).length / Math.max(1, modules.length) * 100) }
  const recommendations = modules.flatMap((module) => module.recommendations.slice(0, 2).map((title, index) => ({ id: `${module.key}-${index}`, severity: module.riskLevel, moduleKey: module.key, title, action: module.riskLevel === 'critical' ? 'Create incident and restrict exposure' : module.riskLevel === 'high' ? 'Run diagnostics and validate registry' : 'Review module readiness evidence' }))).slice(0, 10)
  const queueSummary = { totalQueues: seededQueues.length, backlog: (seededQueues as AnyRecord[]).reduce((sum, queue) => sum + num(queue.backlog, 0), 0), failed: (seededQueues as AnyRecord[]).reduce((sum, queue) => sum + num(queue.failed, 0), 0), warningQueues: (seededQueues as AnyRecord[]).filter((queue) => queue.status === 'warning').length }
  return { ok: true, source, generatedAt: new Date().toISOString(), warnings, metrics, modules, recommendations, recentAudit: ((related.audit.data as AnyRecord[]).length ? related.audit.data as AnyRecord[] : seededAuditEvents as AnyRecord[]).slice(0, 12), queueSummary }
}

export async function getModuleDetail(key: string) {
  const state = await getModulesCommandState()
  const module = state.modules.find((item) => item.key === key)
  if (!module) return { ok: false, error: `Module ${key} not found`, source: state.source }
  return { ok: true, source: state.source, generatedAt: new Date().toISOString(), module, related: { recommendations: state.recommendations.filter((item) => item.moduleKey === key), audit: state.recentAudit.filter((event) => String(event.module_key || event.resource || '').toLowerCase().includes(key.toLowerCase())).slice(0, 8), incidents: (seededIncidents as AnyRecord[]).filter((incident) => String(incident.service || incident.module_key || '').toLowerCase().includes(key.toLowerCase())) } }
}

export async function runModulesSync(scope: 'all' | 'selected' = 'all', moduleKeys: string[] = []) {
  const state = await getModulesCommandState()
  const selected = scope === 'selected' && moduleKeys.length ? state.modules.filter((module) => moduleKeys.includes(module.key)) : state.modules
  const results = []
  for (const module of selected) {
    const result = await saveFactoryModule({ key: module.key, label: module.label, description: module.description, route_prefix: module.route, status: module.status === 'healthy' ? 'operational' : module.status, visibility: module.visibility, rollout_stage: module.rollout, owner_team: module.owner, last_health_status: module.riskLevel, last_health_checked_at: new Date().toISOString(), metadata_json: { ...module.metadata, readiness: module.readiness, exposureScore: module.exposureScore, synced_by: 'modules_command_center' } })
    results.push({ key: module.key, label: module.label, ok: result.ok !== false, source: result.source, warning: (result as AnyRecord).warning, error: (result as AnyRecord).error })
  }
  await logAudit({ event_type: 'saas_factory.modules.sync', title: `Synced ${results.length} module registry record(s)`, module_key: 'saas_factory_modules', severity: results.some((result) => !result.ok) ? 'warning' : 'info', metadata_json: { scope, moduleKeys, results } })
  return { ok: results.every((result) => result.ok), generatedAt: new Date().toISOString(), source: state.source, results, summary: { requested: selected.length, succeeded: results.filter((result) => result.ok).length, failed: results.filter((result) => !result.ok).length } }
}

export async function runModulesDiagnostics(moduleKeys: string[] = []) {
  const state = await getModulesCommandState()
  const selected = moduleKeys.length ? state.modules.filter((module) => moduleKeys.includes(module.key)) : state.modules
  const checks = selected.flatMap((module) => [
    { id: `${module.key}-health`, moduleKey: module.key, category: 'health', status: module.health >= 97 ? 'passed' : module.health >= 85 ? 'warning' : 'failed', severity: module.riskLevel, title: `${module.label} health score`, finding: `${module.health}% health`, recommendation: module.health >= 97 ? 'No action required.' : 'Run module health check and inspect failed APIs/actions.', owner: module.owner },
    { id: `${module.key}-exposure`, moduleKey: module.key, category: 'exposure', status: module.exposureScore >= 80 ? 'passed' : module.exposureScore >= 60 ? 'warning' : 'failed', severity: module.exposureScore < 60 ? 'high' : 'medium', title: `${module.label} exposure posture`, finding: `${module.visibility} / ${module.access} / ${module.rollout}`, recommendation: 'Validate visibility, access profile, and rollout gate before production exposure.', owner: module.owner },
    { id: `${module.key}-dependencies`, moduleKey: module.key, category: 'dependencies', status: module.dependencies.length ? 'passed' : 'warning', severity: module.dependencies.length ? 'low' : 'medium', title: `${module.label} dependency map`, finding: module.dependencies.length ? module.dependencies.join(', ') : 'No dependencies registered', recommendation: 'Register required services and table dependencies.', owner: module.owner },
    { id: `${module.key}-actions`, moduleKey: module.key, category: 'actions', status: module.failedActions === 0 ? 'passed' : module.failedActions < 3 ? 'warning' : 'failed', severity: module.failedActions > 2 ? 'high' : 'medium', title: `${module.label} action liveness`, finding: `${module.failedActions} failed action(s)`, recommendation: module.failedActions ? 'Open action matrix and repair dead handlers.' : 'No action required.', owner: module.owner },
  ])
  await logAudit({ event_type: 'saas_factory.modules.diagnostics', title: `Ran module diagnostics for ${selected.length} module(s)`, module_key: 'saas_factory_modules', severity: checks.some((check) => check.status === 'failed') ? 'warning' : 'info', metadata_json: { moduleKeys, checks: checks.length } })
  return { ok: true, generatedAt: new Date().toISOString(), source: state.source, summary: { passed: checks.filter((check) => check.status === 'passed').length, warnings: checks.filter((check) => check.status === 'warning').length, failed: checks.filter((check) => check.status === 'failed').length }, checks }
}

export async function executeModuleAction(action: string, payload: AnyRecord = {}) {
  const key = String(payload.key || payload.moduleKey || '')
  const detail = key ? await getModuleDetail(key) : null
  const module = detail?.ok ? (detail as AnyRecord).module as ModuleCommandRecord : null
  if (['delete','hard-delete','purge'].includes(action)) {
    await logAudit({ event_type: 'saas_factory.modules.blocked_action', title: `Blocked unsafe module action: ${action}`, module_key: key || 'saas_factory_modules', severity: 'warning', metadata_json: payload })
    return { ok: false, blocked: true, action, reason: 'Hard delete/purge is blocked from the Modules command page. Retire or disable the module instead, with audit evidence.', module }
  }
  let updatePayload: AnyRecord | null = null
  if (['create','update','edit'].includes(action)) updatePayload = payload.module || payload
  if (action === 'enable') updatePayload = { key, status: 'operational', visibility: payload.visibility || 'visible', metadata_json: { reason: payload.reason || 'Enabled from Modules command center' } }
  if (action === 'disable') updatePayload = { key, status: 'disabled', visibility: 'hidden', metadata_json: { reason: payload.reason || 'Disabled from Modules command center', disabled_at: new Date().toISOString() } }
  if (action === 'maintenance') updatePayload = { key, status: 'maintenance', rollout_stage: 'maintenance', metadata_json: { window: payload.window, owner: payload.owner, reason: payload.reason } }
  if (action === 'visibility') updatePayload = { key, visibility: payload.visibility, metadata_json: { access: payload.access, reason: payload.reason } }
  if (action === 'validate' || action === 'health-check') return { ok: true, action, module, diagnostics: await runModulesDiagnostics(key ? [key] : []) }
  if (action === 'sync-one') return { ok: true, action, module, sync: await runModulesSync('selected', key ? [key] : []) }
  if (action === 'clear-cache') { await logAudit({ event_type: 'saas_factory.modules.cache_clear_requested', title: `Requested safe cache refresh for ${key || 'modules'}`, module_key: key || 'saas_factory_modules', severity: 'info', metadata_json: payload }); return { ok: true, action, module, result: 'Cache refresh request recorded. Runtime caches must be invalidated by the deployment/cache layer if configured.' } }
  if (action === 'snapshot') { await logAudit({ event_type: 'saas_factory.modules.snapshot', title: `Generated module snapshot for ${key || 'all modules'}`, module_key: key || 'saas_factory_modules', severity: 'info', metadata_json: { module } }); return { ok: true, action, module, snapshot: module || (await getModulesCommandState()).modules } }
  if (updatePayload) { const result = await saveFactoryModule({ ...updatePayload, key: updatePayload.key || key }); await logAudit({ event_type: `saas_factory.modules.${action}`, title: `Module action executed: ${action}`, module_key: updatePayload.key || key || 'saas_factory_modules', severity: result.ok === false ? 'warning' : 'info', metadata_json: { payload, result } }); return { ok: result.ok !== false, action, module, result } }
  await logAudit({ event_type: 'saas_factory.modules.unsupported_action', title: `Unsupported module action attempted: ${action}`, module_key: key || 'saas_factory_modules', severity: 'warning', metadata_json: payload })
  return { ok: false, action, module, reason: `Action ${action} is not implemented for safe execution yet.` }
}

export async function exportModulesCommand(format: 'json' | 'csv' = 'json') {
  const state = await getModulesCommandState()
  await logAudit({ event_type: 'saas_factory.modules.export', title: `Exported modules command data as ${format}`, module_key: 'saas_factory_modules', severity: 'info', metadata_json: { format, generatedAt: state.generatedAt } })
  if (format === 'csv') { const header = ['key','label','status','health','visibility','access','environment','version','readiness','riskLevel','owner']; const rows = state.modules.map((module) => header.map((column) => JSON.stringify((module as AnyRecord)[column] ?? '')).join(',')); return { body: [header.join(','), ...rows].join('\n'), contentType: 'text/csv; charset=utf-8', filename: `saas-factory-modules-${Date.now()}.csv` } }
  return { body: JSON.stringify(state, null, 2), contentType: 'application/json; charset=utf-8', filename: `saas-factory-modules-${Date.now()}.json` }
}
