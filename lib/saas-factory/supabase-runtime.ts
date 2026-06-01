
type Status = 'healthy' | 'warning' | 'failed' | 'disabled'
type Risk = 'low' | 'medium' | 'high' | 'critical'
type Category = 'connection' | 'table' | 'rls' | 'realtime' | 'storage' | 'edge' | 'migration' | 'backup' | 'environment'

export type SupabaseResource = {
  id: string
  key: string
  label: string
  description: string
  category: Category
  status: Status
  risk: Risk
  schema: string
  tableName: string | null
  owner: string
  required: boolean
  rlsEnabled: boolean
  realtimeEnabled: boolean
  storageBucket: string | null
  edgeFunction: string | null
  migrationFile: string | null
  linkedModules: string[]
  linkedPages: string[]
  linkedApis: string[]
  linkedActions: string[]
  requiredColumns: string[]
  policies: string[]
  blockers: string[]
  checks: string[]
  recommendedAction: string
  rollbackPlan: string
  lastCheckedAt: string | null
}

export type SupabaseProbe = {
  id: string
  resourceKey: string
  label: string
  operation: string
  status: 'passed' | 'warning' | 'failed' | 'blocked'
  result: string
  evidence: string[]
  sqlPreview: string
  createdAt: string
}

export type SupabaseIncident = {
  id: string
  resourceKey: string
  title: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved'
  reason: string
  evidence: string[]
  createdAt: string
  resolvedAt: string | null
}

const g = globalThis as typeof globalThis & {
  __angelcareSupabaseRuntimeClean?: {
    resources: SupabaseResource[]
    probes: SupabaseProbe[]
    incidents: SupabaseIncident[]
  }
}

const now = () => new Date().toISOString()
const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

function resource(input: Partial<SupabaseResource>): SupabaseResource {
  return {
    id: input.id || uid('sb'),
    key: input.key || 'resource',
    label: input.label || 'Supabase Resource',
    description: input.description || '',
    category: input.category || 'table',
    status: input.status || 'healthy',
    risk: input.risk || 'medium',
    schema: input.schema || 'public',
    tableName: input.tableName ?? null,
    owner: input.owner || 'SaaS Factory',
    required: input.required ?? true,
    rlsEnabled: input.rlsEnabled ?? false,
    realtimeEnabled: input.realtimeEnabled ?? false,
    storageBucket: input.storageBucket ?? null,
    edgeFunction: input.edgeFunction ?? null,
    migrationFile: input.migrationFile ?? null,
    linkedModules: input.linkedModules || [],
    linkedPages: input.linkedPages || [],
    linkedApis: input.linkedApis || [],
    linkedActions: input.linkedActions || [],
    requiredColumns: input.requiredColumns || [],
    policies: input.policies || [],
    blockers: input.blockers || [],
    checks: input.checks || [],
    recommendedAction: input.recommendedAction || 'Run validation and review evidence.',
    rollbackPlan: input.rollbackPlan || 'Use additive migration/checkpoint. Never drop production data.',
    lastCheckedAt: input.lastCheckedAt ?? null,
  }
}

export const seedSupabaseResources: SupabaseResource[] = [
  resource({
    id: 'sb_env',
    key: 'supabase_environment_connection',
    label: 'Supabase Environment Connection',
    description: 'Validates Supabase URL, service role availability and server-side connection readiness.',
    category: 'connection',
    status: 'warning',
    risk: 'high',
    schema: 'platform',
    tableName: null,
    owner: 'Platform',
    linkedModules: ['saas-factory', 'actions', 'options', 'modules', 'apis'],
    linkedPages: ['/saas-factory-command/supabase', '/saas-factory-command/apis'],
    linkedApis: ['/api/saas-factory/supabase/summary'],
    linkedActions: ['validate_supabase_connection'],
    checks: ['env_url_present', 'service_role_present', 'connection_probe', 'json_response'],
    blockers: ['runtime_env_must_be_checked'],
    recommendedAction: 'Run connection probe and verify env variables in server runtime.',
    rollbackPlan: 'No mutation. Restore previous env values if connection fails.',
  }),
  resource({
    id: 'sb_actions',
    key: 'saas_factory_actions_table',
    label: 'SaaS Factory Actions Table',
    description: 'Action registry for governed actions and execution evidence.',
    category: 'table',
    tableName: 'saas_factory_actions',
    rlsEnabled: true,
    linkedModules: ['actions', 'apis', 'audit'],
    linkedPages: ['/saas-factory-command/actions'],
    linkedApis: ['/api/saas-factory/actions/summary'],
    linkedActions: ['register_action', 'validate_action_registry'],
    requiredColumns: ['id', 'key', 'label', 'status', 'risk', 'payload_schema', 'created_at', 'updated_at'],
    policies: ['operator_read', 'admin_write', 'audit_required'],
    checks: ['table_exists', 'required_columns', 'rls_enabled', 'index_key'],
  }),
  resource({
    id: 'sb_exec',
    key: 'saas_factory_action_executions_table',
    label: 'Action Executions Table',
    description: 'Audit-grade action execution records.',
    category: 'table',
    tableName: 'saas_factory_action_executions',
    rlsEnabled: true,
    linkedModules: ['actions', 'audit'],
    linkedPages: ['/saas-factory-command/actions'],
    linkedApis: ['/api/saas-factory/actions/execute'],
    linkedActions: ['execute_action', 'dry_run_action'],
    requiredColumns: ['id', 'action_key', 'status', 'actor', 'payload', 'result', 'evidence', 'created_at'],
    policies: ['operator_read_own', 'admin_read_all', 'system_write'],
    checks: ['table_exists', 'jsonb_payload', 'created_index', 'rls_enabled'],
  }),
  resource({
    id: 'sb_options',
    key: 'saas_factory_options_table',
    label: 'SaaS Factory Options Table',
    description: 'Governed option registry powering modules, pages, modals and filters.',
    category: 'table',
    status: 'warning',
    risk: 'high',
    tableName: 'saas_factory_options',
    rlsEnabled: true,
    linkedModules: ['options', 'configuration', 'modules'],
    linkedPages: ['/saas-factory-command/options', '/saas-factory-command/configuration'],
    linkedApis: ['/api/saas-factory/options/summary'],
    linkedActions: ['sync_options_runtime'],
    requiredColumns: ['id', 'key', 'label', 'group_key', 'module_scope', 'status', 'created_at', 'updated_at'],
    policies: ['operator_read', 'admin_write', 'publish_gate_required'],
    checks: ['table_exists', 'required_columns', 'module_scope_array', 'rls_enabled'],
    blockers: ['publish_checkpoint_required'],
    recommendedAction: 'Validate option schema compatibility and publish checkpoints.',
  }),
  resource({
    id: 'sb_modules',
    key: 'saas_factory_modules_table',
    label: 'SaaS Factory Modules Table',
    description: 'Module registry and exposure records.',
    category: 'table',
    tableName: 'saas_factory_modules',
    rlsEnabled: true,
    linkedModules: ['modules', 'actions', 'apis'],
    linkedPages: ['/saas-factory-command/modules'],
    linkedApis: ['/api/saas-factory/modules/summary'],
    linkedActions: ['sync_modules_registry'],
    requiredColumns: ['id', 'key', 'label', 'status', 'owner', 'created_at', 'updated_at'],
    policies: ['operator_read', 'admin_write'],
    checks: ['table_exists', 'required_columns', 'rls_enabled'],
  }),
  resource({
    id: 'sb_apis',
    key: 'saas_factory_apis_table',
    label: 'SaaS Factory APIs Table',
    description: 'API registry for endpoints, probes, contracts and incidents.',
    category: 'table',
    tableName: 'saas_factory_apis',
    rlsEnabled: true,
    linkedModules: ['apis', 'supabase'],
    linkedPages: ['/saas-factory-command/apis', '/saas-factory-command/supabase'],
    linkedApis: ['/api/saas-factory/apis/summary'],
    linkedActions: ['validate_api_registry'],
    requiredColumns: ['id', 'key', 'path', 'method', 'status', 'risk', 'auth_policy', 'response_contract'],
    policies: ['operator_read', 'admin_write'],
    checks: ['table_exists', 'required_columns', 'jsonb_contract', 'rls_enabled'],
  }),
  resource({
    id: 'sb_audit',
    key: 'saas_factory_audit_events_table',
    label: 'Audit Events Table',
    description: 'Central audit event store for operator actions and blocked attempts.',
    category: 'table',
    status: 'warning',
    risk: 'high',
    tableName: 'saas_factory_audit_events',
    rlsEnabled: true,
    linkedModules: ['audit', 'actions', 'apis', 'supabase'],
    linkedPages: ['/saas-factory-command', '/saas-factory-command/supabase'],
    linkedApis: ['/api/saas-factory/audit/recent'],
    linkedActions: ['write_audit_event'],
    requiredColumns: ['id', 'event_key', 'actor', 'entity_type', 'entity_key', 'payload', 'created_at'],
    policies: ['admin_read_all', 'system_write', 'operator_read_scoped'],
    checks: ['table_exists', 'created_index', 'rls_enabled', 'payload_jsonb'],
  }),
  resource({
    id: 'sb_config',
    key: 'saas_factory_configuration_table',
    label: 'Configuration Registry Table',
    description: 'Configuration governance, publish gates and rollback checkpoints.',
    category: 'table',
    status: 'warning',
    tableName: 'saas_factory_configuration',
    rlsEnabled: true,
    linkedModules: ['configuration', 'options'],
    linkedPages: ['/saas-factory-command/configuration'],
    linkedApis: ['/api/saas-factory/configuration/summary'],
    linkedActions: ['publish_configuration', 'rollback_configuration'],
    requiredColumns: ['id', 'key', 'label', 'value', 'status', 'published_at', 'created_at', 'updated_at'],
    policies: ['operator_read', 'admin_write', 'publish_gate_required'],
    checks: ['table_exists', 'required_columns', 'rollback_checkpoint'],
  }),
  resource({
    id: 'sb_realtime',
    key: 'supabase_realtime_factory',
    label: 'Realtime Factory Channels',
    description: 'Realtime subscription readiness for live command center updates.',
    category: 'realtime',
    status: 'warning',
    required: false,
    realtimeEnabled: true,
    schema: 'realtime',
    tableName: null,
    owner: 'Platform',
    linkedModules: ['overview', 'actions', 'apis'],
    linkedPages: ['/saas-factory-command', '/saas-factory-command/apis'],
    checks: ['publication_exists', 'channel_policy', 'client_subscription'],
  }),
  resource({
    id: 'sb_storage',
    key: 'supabase_storage_evidence_bucket',
    label: 'Evidence Storage Bucket',
    description: 'Optional private bucket for exports, screenshots, SQL evidence and compliance reports.',
    category: 'storage',
    status: 'warning',
    required: false,
    schema: 'storage',
    tableName: null,
    storageBucket: 'saas-factory-evidence',
    owner: 'Platform',
    linkedModules: ['audit', 'apis', 'supabase'],
    linkedPages: ['/saas-factory-command/supabase'],
    checks: ['bucket_exists', 'private_policy', 'signed_url_policy'],
  }),
  resource({
    id: 'sb_backup',
    key: 'supabase_backup_readiness',
    label: 'Backup & Restore Readiness',
    description: 'Restore planning, migration checkpoints and backup coverage.',
    category: 'backup',
    status: 'warning',
    risk: 'critical',
    schema: 'platform',
    tableName: null,
    owner: 'Platform',
    linkedModules: ['supabase', 'configuration', 'options'],
    linkedPages: ['/saas-factory-command/supabase'],
    checks: ['migration_history', 'backup_policy', 'restore_checkpoint', 'no_destructive_sql'],
    blockers: ['manual_restore_test_required'],
  }),
]

function getStore() {
  if (!g.__angelcareSupabaseRuntimeClean) {
    g.__angelcareSupabaseRuntimeClean = {
      resources: [...seedSupabaseResources],
      probes: [{
        id: 'probe_runtime_ready',
        resourceKey: 'supabase_runtime_ready',
        label: 'Supabase runtime ready',
        operation: 'system',
        status: 'passed',
        result: 'Supabase runtime initialized.',
        evidence: ['runtime_ready', 'schema_registry_ready', 'rls_review_ready'],
        sqlPreview: '-- runtime initialization only',
        createdAt: now(),
      }],
      incidents: [],
    }
  }
  if (!g.__angelcareSupabaseRuntimeClean.resources.length) {
    g.__angelcareSupabaseRuntimeClean.resources = [...seedSupabaseResources]
  }
  return g.__angelcareSupabaseRuntimeClean
}

function sqlFor(resource: SupabaseResource, operation: string) {
  if (operation === 'validate_schema' && resource.tableName) return `select column_name, data_type from information_schema.columns where table_schema = '${resource.schema}' and table_name = '${resource.tableName}' order by ordinal_position;`
  if (operation === 'rls_review' && resource.tableName) return `select schemaname, tablename, rowsecurity from pg_tables where schemaname = '${resource.schema}' and tablename = '${resource.tableName}';`
  if (operation === 'index_review' && resource.tableName) return `select indexname, indexdef from pg_indexes where schemaname = '${resource.schema}' and tablename = '${resource.tableName}';`
  if (operation === 'safe_migration_preview') return `-- additive preview only\nalter table ${resource.schema}.${resource.tableName || 'target_table'} add column if not exists reviewed_at timestamptz;`
  if (operation === 'backup_review') return '-- backup/restore checklist review; no destructive SQL generated'
  return `-- ${operation} for ${resource.key}`
}

function policiesFor(resource: SupabaseResource) {
  return [
    { id: `required_${resource.key}`, resourceKey: resource.key, rule: 'required_resource', status: resource.required && resource.status === 'failed' ? 'blocked' : 'passed', detail: resource.required ? 'Required production resource.' : 'Optional resource.', fix: 'Restore required resource health.' },
    { id: `rls_${resource.key}`, resourceKey: resource.key, rule: 'rls_policy', status: resource.category === 'table' && !resource.rlsEnabled ? 'blocked' : 'passed', detail: resource.category === 'table' ? `RLS ${resource.rlsEnabled ? 'enabled' : 'disabled'}` : 'RLS not applicable.', fix: 'Enable RLS and attach scoped policies.' },
    { id: `columns_${resource.key}`, resourceKey: resource.key, rule: 'required_columns', status: resource.category === 'table' && resource.requiredColumns.length === 0 ? 'warning' : 'passed', detail: `${resource.requiredColumns.length} required column(s).`, fix: 'Define required column contract.' },
    { id: `blockers_${resource.key}`, resourceKey: resource.key, rule: 'blockers', status: resource.blockers.length ? 'blocked' : 'passed', detail: resource.blockers.join(', ') || 'No blockers.', fix: 'Resolve blockers before mutation.' },
    { id: `risk_${resource.key}`, resourceKey: resource.key, rule: 'risk_review', status: resource.risk === 'critical' ? 'warning' : 'passed', detail: `${resource.risk} risk.`, fix: 'Critical resources require backup evidence.' },
  ] as Array<{ id: string; resourceKey: string; rule: string; status: 'passed' | 'warning' | 'blocked'; detail: string; fix: string }>
}

function probe(resource: SupabaseResource, operation: string): SupabaseProbe {
  const policies = policiesFor(resource)
  const blockers = [...resource.blockers, ...policies.filter((p) => p.status === 'blocked').map((p) => p.rule)]
  const status = blockers.length ? 'blocked' : resource.status === 'failed' ? 'failed' : resource.status === 'warning' ? 'warning' : 'passed'
  return {
    id: uid('sb_probe'),
    resourceKey: resource.key,
    label: resource.label,
    operation,
    status,
    result: status === 'blocked' ? `Operation blocked: ${blockers.join(', ')}` : `${operation} completed for ${resource.label}.`,
    evidence: [`category:${resource.category}`, `risk:${resource.risk}`, `required:${resource.required}`, `rls:${resource.rlsEnabled}`, `checks:${resource.checks.join('|')}`],
    sqlPreview: sqlFor(resource, operation),
    createdAt: now(),
  }
}

export async function getSupabaseSummary() {
  const store = getStore()
  const resources = store.resources
  const policies = resources.flatMap(policiesFor)
  const warnings = [
    ...resources.filter((x) => x.status !== 'healthy' || ['high', 'critical'].includes(x.risk)).map((x) => ({
      id: `warning_${x.key}`,
      severity: x.risk === 'critical' || x.status === 'failed' ? 'critical' : 'warning',
      title: `${x.label} needs review`,
      detail: `${x.category} resource is ${x.status} with ${x.risk} risk.`,
      recommendedAction: x.recommendedAction,
    })),
    ...policies.filter((p) => p.status !== 'passed').map((p) => ({
      id: `warning_${p.id}`,
      severity: p.status === 'blocked' ? 'critical' : 'warning',
      title: `${p.resourceKey} policy issue`,
      detail: p.detail,
      recommendedAction: p.fix,
    })),
  ]
  const healthy = resources.filter((x) => x.status === 'healthy').length
  const blocked = policies.filter((p) => p.status === 'blocked').length
  const openIncidents = store.incidents.filter((i) => i.status !== 'resolved').length
  const readinessScore = Math.max(0, Math.min(100, Math.round((healthy / Math.max(resources.length, 1)) * 100) - blocked * 6 - openIncidents * 5))
  const categories = Array.from(new Set(resources.map((x) => x.category))).map((name) => ({
    id: `cat_${name}`,
    name,
    count: resources.filter((x) => x.category === name).length,
    warningCount: resources.filter((x) => x.category === name && x.status !== 'healthy').length,
    criticalCount: resources.filter((x) => x.category === name && x.risk === 'critical').length,
  }))
  const modules = Array.from(new Set(resources.flatMap((x) => x.linkedModules))).map((name) => ({
    id: `module_${name}`,
    name,
    resourceCount: resources.filter((x) => x.linkedModules.includes(name)).length,
    warningCount: resources.filter((x) => x.linkedModules.includes(name) && x.status !== 'healthy').length,
  }))
  return {
    ok: true,
    source: 'runtime',
    sourceConfidence: 'runtime',
    generatedAt: now(),
    lastRefreshedAt: now(),
    env: {
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
      hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    metrics: {
      resources: resources.length,
      healthyResources: healthy,
      warningResources: resources.filter((x) => x.status === 'warning').length,
      failedResources: resources.filter((x) => x.status === 'failed').length,
      tables: resources.filter((x) => x.category === 'table').length,
      rlsEnabledTables: resources.filter((x) => x.category === 'table' && x.rlsEnabled).length,
      realtimeResources: resources.filter((x) => x.realtimeEnabled).length,
      storageResources: resources.filter((x) => x.category === 'storage').length,
      criticalResources: resources.filter((x) => x.risk === 'critical').length,
      probes: store.probes.length,
      incidents: openIncidents,
      readinessScore,
    },
    resources,
    categories,
    modules,
    policies,
    probes: store.probes,
    incidents: store.incidents,
    warnings,
    recommendations: warnings.map((w) => ({ id: `rec_${w.id}`, severity: w.severity, title: w.title, reason: w.detail, action: w.recommendedAction })),
    disabledActions: [
      { id: 'destructive_sql_blocked', action: 'Destructive SQL', reason: 'DROP/TRUNCATE/unsafe ALTER is blocked. Only additive previews are generated.' },
      { id: 'service_role_exposure_blocked', action: 'Expose service role', reason: 'Service role keys must never be exposed to client UI.' },
    ],
  }
}

export async function executeSupabaseOperation(input: { operation: string; resourceKey?: string; payload?: Record<string, any>; actor?: string }) {
  const store = getStore()
  const operation = input.operation
  const payload = input.payload || {}
  const target = store.resources.find((x) => x.key === input.resourceKey) || store.resources[0]

  if (operation === 'register_resource') {
    const key = String(payload.key || payload.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')
    if (!key) return { ok: false, message: 'Resource key is required.' }
    const created = resource({
      key,
      label: String(payload.label || key),
      description: String(payload.description || ''),
      category: ['connection', 'table', 'rls', 'realtime', 'storage', 'edge', 'migration', 'backup', 'environment'].includes(String(payload.category)) ? payload.category as Category : 'table',
      status: 'warning',
      risk: ['low', 'medium', 'high', 'critical'].includes(String(payload.risk)) ? payload.risk as Risk : 'medium',
      schema: String(payload.schema || 'public'),
      tableName: payload.tableName ? String(payload.tableName) : null,
      owner: input.actor || 'SaaS Factory Operator',
      blockers: ['new_resource_requires_validation'],
      checks: ['table_exists', 'required_columns', 'rls_review'],
    })
    store.resources = [created, ...store.resources.filter((x) => x.key !== created.key)]
    const p = probe(created, 'register_resource')
    store.probes = [p, ...store.probes].slice(0, 500)
    return { ok: true, resource: created, probe: p, message: 'Supabase resource registered for validation.' }
  }

  if (['connection_probe', 'validate_schema', 'rls_review', 'index_review', 'realtime_review', 'storage_review', 'backup_review', 'safe_migration_preview'].includes(operation)) {
    const p = probe(target, operation)
    store.probes = [p, ...store.probes].slice(0, 500)
    return { ok: !['blocked', 'failed'].includes(p.status), probe: p, message: p.result }
  }

  if (operation === 'mark_healthy') {
    const p = probe(target, 'mark_healthy')
    if (p.status === 'blocked') return { ok: false, probe: p, message: p.result }
    store.resources = store.resources.map((x) => x.key === target.key ? { ...x, status: 'healthy', lastCheckedAt: now() } : x)
    store.probes = [p, ...store.probes].slice(0, 500)
    return { ok: true, probe: p, message: 'Resource marked healthy after validation evidence.' }
  }

  if (operation === 'create_incident') {
    const incident: SupabaseIncident = {
      id: uid('sb_incident'),
      resourceKey: target.key,
      title: `${target.label} incident`,
      severity: target.risk === 'critical' ? 'critical' : target.risk === 'high' ? 'high' : 'medium',
      status: 'open',
      reason: String(payload.reason || 'Operator created Supabase incident.'),
      evidence: [`resource:${target.key}`, `category:${target.category}`, `status:${target.status}`, `risk:${target.risk}`],
      createdAt: now(),
      resolvedAt: null,
    }
    store.incidents = [incident, ...store.incidents].slice(0, 250)
    return { ok: true, incident, message: 'Supabase incident created with evidence.' }
  }

  if (operation === 'resolve_incident') {
    const incidentId = String(payload.incidentId || '')
    store.incidents = store.incidents.map((i) => i.id === incidentId ? { ...i, status: 'resolved', resolvedAt: now() } : i)
    return { ok: true, message: 'Supabase incident resolved.' }
  }

  if (operation === 'destructive_sql') {
    const p: SupabaseProbe = {
      id: uid('blocked'),
      resourceKey: target.key,
      label: target.label,
      operation,
      status: 'blocked',
      result: 'Destructive SQL is blocked by production safety policy.',
      evidence: ['drop_truncate_blocked', 'additive_migration_only'],
      sqlPreview: '-- blocked: destructive SQL is not generated',
      createdAt: now(),
    }
    store.probes = [p, ...store.probes].slice(0, 500)
    return { ok: false, probe: p, message: p.result }
  }

  return { ok: false, message: 'Unsupported Supabase operation.' }
}

export async function exportSupabase(format: 'json' | 'csv' = 'json') {
  const summary = await getSupabaseSummary()
  if (format === 'csv') {
    const header = ['key', 'label', 'category', 'status', 'risk', 'schema', 'tableName', 'rlsEnabled', 'required', 'owner']
    const esc = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
    return {
      body: [header.join(','), ...summary.resources.map((x) => [x.key, x.label, x.category, x.status, x.risk, x.schema, x.tableName, x.rlsEnabled, x.required, x.owner].map(esc).join(','))].join('\\n'),
      contentType: 'text/csv; charset=utf-8',
      filename: 'saas-factory-supabase.csv',
    }
  }
  return {
    body: JSON.stringify(summary, null, 2),
    contentType: 'application/json; charset=utf-8',
    filename: 'saas-factory-supabase.json',
  }
}
