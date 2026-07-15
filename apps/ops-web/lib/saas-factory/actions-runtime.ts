type Risk = 'low' | 'medium' | 'high' | 'critical'
type Status = 'ready' | 'requires_review' | 'blocked' | 'disabled'

export type FactoryAction = {
  id: string
  key: string
  label: string
  description: string
  category: string
  module: string
  page: string
  endpoint: string
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  status: Status
  risk: Risk
  owner: string
  sla: string
  requiresConfirmation: boolean
  requiresPayload: boolean
  requiresDryRun: boolean
  payloadSchema: Array<{ key: string; label: string; type: string; required: boolean; placeholder: string }>
  allowedRoles: string[]
  affectedTables: string[]
  affectedModules: string[]
  affectedPages: string[]
  affectedOptions: string[]
  dependencies: string[]
  blockers: string[]
  rollbackAvailable: boolean
  rollbackPlan: string
  safeModeBehavior: string
  lastExecutedAt: string | null
  source: 'runtime'
}

export type ExecutionRecord = {
  id: string
  actionKey: string
  label: string
  status: 'preview' | 'success' | 'warning' | 'failed' | 'blocked'
  actor: string
  target: string
  mode: string
  payload: Record<string, any>
  result: string
  evidence: string[]
  impact: { modules: string[]; pages: string[]; tables: string[]; options: string[] }
  createdAt: string
  completedAt: string | null
}

const g = globalThis as typeof globalThis & {
  __angelcareActionsStableStore?: { actions: FactoryAction[]; executions: ExecutionRecord[] }
}

function now() {
  return new Date().toISOString()
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function store() {
  if (!g.__angelcareActionsStableStore) {
    g.__angelcareActionsStableStore = { actions: [], executions: [] }
  }
  return g.__angelcareActionsStableStore
}

export const seedActions: FactoryAction[] = [
  {
    id: 'act_validate_action_registry',
    key: 'validate_action_registry',
    label: 'Validate Action Registry',
    description: 'Validate endpoint scope, payload schemas, role clearance, audit requirements, dependency blockers and rollback capability.',
    category: 'governance',
    module: 'saas-factory',
    page: '/saas-factory-command/actions',
    endpoint: '/api/saas-factory/actions/execute',
    method: 'POST',
    status: 'ready',
    risk: 'medium',
    owner: 'SaaS Factory',
    sla: 'operator',
    requiresConfirmation: false,
    requiresPayload: false,
    requiresDryRun: false,
    payloadSchema: [],
    allowedRoles: ['ceo', 'admin', 'operator'],
    affectedTables: ['saas_factory_actions', 'saas_factory_action_executions'],
    affectedModules: ['saas-factory'],
    affectedPages: ['/saas-factory-command/actions'],
    affectedOptions: ['audit_required', 'action_policy'],
    dependencies: [],
    blockers: [],
    rollbackAvailable: false,
    rollbackPlan: 'Validation is read-only and requires no rollback.',
    safeModeBehavior: 'allowed',
    lastExecutedAt: null,
    source: 'runtime',
  },
  {
    id: 'act_register_governed_action',
    key: 'register_action',
    label: 'Register Governed Action',
    description: 'Create a new governed executable action with endpoint, owner, payload schema, risk, role clearance and audit policy.',
    category: 'crud',
    module: 'saas-factory',
    page: '/saas-factory-command/actions',
    endpoint: '/api/saas-factory/actions/execute',
    method: 'POST',
    status: 'ready',
    risk: 'medium',
    owner: 'SaaS Factory',
    sla: 'review-required',
    requiresConfirmation: true,
    requiresPayload: true,
    requiresDryRun: true,
    payloadSchema: [
      { key: 'label', label: 'Action label', type: 'text', required: true, placeholder: 'Sync Options Registry' },
      { key: 'key', label: 'Action key', type: 'text', required: true, placeholder: 'sync_options_registry' },
      { key: 'endpoint', label: 'Endpoint', type: 'text', required: true, placeholder: '/api/saas-factory/options/actions' },
      { key: 'module', label: 'Module', type: 'text', required: true, placeholder: 'saas-factory' },
      { key: 'reason', label: 'Governance reason', type: 'textarea', required: true, placeholder: 'Why this action is needed.' },
    ],
    allowedRoles: ['ceo', 'admin'],
    affectedTables: ['saas_factory_actions'],
    affectedModules: ['saas-factory'],
    affectedPages: ['/saas-factory-command/actions'],
    affectedOptions: ['action_registry_enabled'],
    dependencies: ['validate_action_registry'],
    blockers: [],
    rollbackAvailable: true,
    rollbackPlan: 'Disable/archive the registered action while preserving evidence.',
    safeModeBehavior: 'review_only',
    lastExecutedAt: null,
    source: 'runtime',
  },
  {
    id: 'act_sync_options_runtime',
    key: 'sync_options_runtime',
    label: 'Sync Options Runtime',
    description: 'Dry-run and execute Options registry sync across option groups, modules, pages, modals and publish gates.',
    category: 'sync',
    module: 'options',
    page: '/saas-factory-command/options',
    endpoint: '/api/saas-factory/options/actions',
    method: 'POST',
    status: 'requires_review',
    risk: 'high',
    owner: 'SaaS Factory',
    sla: 'same-day',
    requiresConfirmation: true,
    requiresPayload: true,
    requiresDryRun: true,
    payloadSchema: [
      { key: 'targetGroup', label: 'Target option group', type: 'text', required: true, placeholder: 'general' },
      { key: 'reason', label: 'Reason', type: 'textarea', required: true, placeholder: 'Why sync now?' },
    ],
    allowedRoles: ['ceo', 'admin', 'operator'],
    affectedTables: ['saas_factory_options', 'saas_factory_option_audit_events'],
    affectedModules: ['options', 'configuration', 'modules'],
    affectedPages: ['/saas-factory-command/options', '/saas-factory-command/configuration'],
    affectedOptions: ['sync_requires_reason', 'publish_gate'],
    dependencies: ['validate_action_registry'],
    blockers: [],
    rollbackAvailable: true,
    rollbackPlan: 'Use the Options publish checkpoint and restore previous group policy state.',
    safeModeBehavior: 'dry_run_only',
    lastExecutedAt: null,
    source: 'runtime',
  },
  {
    id: 'act_sync_modules_registry',
    key: 'sync_modules_registry',
    label: 'Sync Modules Registry',
    description: 'Validate and sync module registry exposure, ownership, readiness and linked actions.',
    category: 'sync',
    module: 'modules',
    page: '/saas-factory-command/modules',
    endpoint: '/api/saas-factory/modules/actions',
    method: 'POST',
    status: 'requires_review',
    risk: 'high',
    owner: 'SaaS Factory',
    sla: 'same-day',
    requiresConfirmation: true,
    requiresPayload: true,
    requiresDryRun: true,
    payloadSchema: [
      { key: 'moduleKey', label: 'Module key', type: 'text', required: true, placeholder: 'academy' },
      { key: 'reason', label: 'Reason', type: 'textarea', required: true, placeholder: 'Why sync this module?' },
    ],
    allowedRoles: ['ceo', 'admin', 'operator'],
    affectedTables: ['saas_factory_modules', 'saas_factory_actions'],
    affectedModules: ['modules', 'actions'],
    affectedPages: ['/saas-factory-command/modules', '/saas-factory-command/actions'],
    affectedOptions: ['module_registry_enabled'],
    dependencies: ['validate_action_registry'],
    blockers: [],
    rollbackAvailable: true,
    rollbackPlan: 'Restore previous module registry checkpoint.',
    safeModeBehavior: 'dry_run_only',
    lastExecutedAt: null,
    source: 'runtime',
  },
  {
    id: 'act_publish_configuration',
    key: 'publish_configuration',
    label: 'Publish Configuration',
    description: 'Publish validated configuration/options changes after readiness, warnings and approval gates pass.',
    category: 'publish',
    module: 'configuration',
    page: '/saas-factory-command/configuration',
    endpoint: '/api/saas-factory/configuration/actions',
    method: 'POST',
    status: 'requires_review',
    risk: 'critical',
    owner: 'CEO / SaaS Factory',
    sla: 'approval-required',
    requiresConfirmation: true,
    requiresPayload: true,
    requiresDryRun: true,
    payloadSchema: [
      { key: 'releaseLabel', label: 'Release label', type: 'text', required: true, placeholder: 'June configuration release' },
      { key: 'approvalReason', label: 'Approval reason', type: 'textarea', required: true, placeholder: 'Explain approval and impact.' },
    ],
    allowedRoles: ['ceo', 'admin'],
    affectedTables: ['saas_factory_configuration', 'saas_factory_options', 'saas_factory_action_executions'],
    affectedModules: ['configuration', 'options', 'actions'],
    affectedPages: ['/saas-factory-command/configuration', '/saas-factory-command/options'],
    affectedOptions: ['publish_gate', 'rollback_required'],
    dependencies: ['validate_action_registry', 'sync_options_runtime'],
    blockers: ['open_critical_warnings'],
    rollbackAvailable: true,
    rollbackPlan: 'Create checkpoint before publish, then rollback through configuration checkpoint restore.',
    safeModeBehavior: 'blocked_in_safe_mode',
    lastExecutedAt: null,
    source: 'runtime',
  },
  {
    id: 'act_emergency_freeze',
    key: 'emergency_freeze',
    label: 'Emergency Freeze',
    description: 'Freeze high-risk SaaS Factory mutations. Requires persisted system state table and explicit CEO approval.',
    category: 'safety',
    module: 'saas-factory',
    page: '/saas-factory-command/actions',
    endpoint: '/api/saas-factory/actions/execute',
    method: 'POST',
    status: 'blocked',
    risk: 'critical',
    owner: 'CEO',
    sla: 'emergency-only',
    requiresConfirmation: true,
    requiresPayload: true,
    requiresDryRun: false,
    payloadSchema: [
      { key: 'reason', label: 'Emergency reason', type: 'textarea', required: true, placeholder: 'Describe operational emergency.' },
      { key: 'duration', label: 'Duration', type: 'text', required: true, placeholder: '15m / 1h / manual' },
    ],
    allowedRoles: ['ceo'],
    affectedTables: ['saas_factory_system_state', 'saas_factory_action_executions'],
    affectedModules: ['saas-factory'],
    affectedPages: ['/saas-factory-command/actions'],
    affectedOptions: ['emergency_freeze_enabled'],
    dependencies: [],
    blockers: ['missing_system_state_table'],
    rollbackAvailable: true,
    rollbackPlan: 'Unfreeze system state after emergency review.',
    safeModeBehavior: 'blocked_until_system_state_table_connected',
    lastExecutedAt: null,
    source: 'runtime',
  },
  {
    id: 'act_hard_delete_action',
    key: 'hard_delete_action',
    label: 'Hard Delete Action',
    description: 'Permanent action deletion is blocked. Use disable/archive to preserve audit and rollback history.',
    category: 'danger',
    module: 'saas-factory',
    page: '/saas-factory-command/actions',
    endpoint: '/api/saas-factory/actions/execute',
    method: 'POST',
    status: 'blocked',
    risk: 'critical',
    owner: 'SaaS Factory',
    sla: 'blocked',
    requiresConfirmation: true,
    requiresPayload: true,
    requiresDryRun: false,
    payloadSchema: [
      { key: 'actionKey', label: 'Action key', type: 'text', required: true, placeholder: 'action_to_delete' },
      { key: 'reason', label: 'Reason', type: 'textarea', required: true, placeholder: 'Why deletion was requested.' },
    ],
    allowedRoles: ['ceo'],
    affectedTables: ['saas_factory_actions'],
    affectedModules: ['saas-factory'],
    affectedPages: ['/saas-factory-command/actions'],
    affectedOptions: ['hard_delete_disabled'],
    dependencies: [],
    blockers: ['production_delete_policy'],
    rollbackAvailable: false,
    rollbackPlan: 'No rollback exists for permanent deletion. Action is blocked.',
    safeModeBehavior: 'always_blocked',
    lastExecutedAt: null,
    source: 'runtime',
  },
]

function getStore() {
  const s = store()
  if (s.actions.length === 0) s.actions = [...seedActions]
  return s
}

function policyFor(action: FactoryAction) {
  return [
    { id: `roles_${action.key}`, actionKey: action.key, rule: 'role_clearance', status: action.allowedRoles.length ? 'passed' : 'blocked', detail: action.allowedRoles.join(', ') || 'No roles configured.', requiredFix: 'Add allowed roles.' },
    { id: `confirmation_${action.key}`, actionKey: action.key, rule: 'confirmation_gate', status: action.risk === 'critical' && !action.requiresConfirmation ? 'blocked' : action.risk === 'high' && !action.requiresConfirmation ? 'warning' : 'passed', detail: action.requiresConfirmation ? 'Confirmation enabled.' : 'No confirmation gate.', requiredFix: 'Enable confirmation for risky actions.' },
    { id: `endpoint_${action.key}`, actionKey: action.key, rule: 'endpoint_scope', status: action.endpoint.startsWith('/api/saas-factory/') ? 'passed' : 'warning', detail: action.endpoint, requiredFix: 'Use /api/saas-factory/** or document the exception.' },
    { id: `dryrun_${action.key}`, actionKey: action.key, rule: 'dry_run_required', status: ['high', 'critical'].includes(action.risk) && !action.requiresDryRun ? 'warning' : 'passed', detail: action.requiresDryRun ? 'Dry-run required.' : 'Dry-run not required.', requiredFix: 'Enable dry-run for risky mutations.' },
    { id: `blockers_${action.key}`, actionKey: action.key, rule: 'blockers', status: action.blockers.length ? 'blocked' : 'passed', detail: action.blockers.join(', ') || 'No blockers.', requiredFix: 'Resolve blockers before execution.' },
  ] as Array<{ id: string; actionKey: string; rule: string; status: 'passed' | 'warning' | 'blocked'; detail: string; requiredFix: string }>
}

function dependenciesFor(actions: FactoryAction[]) {
  return actions.map((action) => {
    const blocks = actions.filter((candidate) => candidate.dependencies.includes(action.key)).map((candidate) => candidate.key)
    const missing = action.dependencies.filter((dep) => !actions.some((candidate) => candidate.key === dep))
    return {
      actionKey: action.key,
      dependsOn: action.dependencies,
      blocks,
      blockers: [...action.blockers, ...missing.map((dep) => `missing:${dep}`)],
      status: action.blockers.length || missing.length ? 'blocked' : action.dependencies.length ? 'warning' : 'clear',
    }
  })
}

export async function getActionsSummary() {
  const s = getStore()
  const actions = s.actions.length ? s.actions : seedActions
  const policies = actions.flatMap(policyFor)
  const dependencies = dependenciesFor(actions)
  const warnings = [
    ...actions.filter((a) => a.status !== 'ready' || a.risk === 'critical').map((a) => ({
      id: `warning_${a.key}`,
      severity: a.risk === 'critical' ? 'critical' : 'warning',
      title: `${a.label} needs clearance`,
      detail: `${a.key} is ${a.status} with ${a.risk} risk.`,
      recommendedAction: 'Run dry-run, review policies and execute only after clearance.',
    })),
    ...policies.filter((p) => p.status !== 'passed').map((p) => ({
      id: `warning_${p.id}`,
      severity: p.status === 'blocked' ? 'critical' : 'warning',
      title: `${p.actionKey} policy issue`,
      detail: p.detail,
      recommendedAction: p.requiredFix,
    })),
  ]

  const categories = Array.from(new Set(actions.map((a) => a.category))).map((name) => {
    const rows = actions.filter((a) => a.category === name)
    return { id: `cat_${name}`, name, count: rows.length, ready: rows.filter((a) => a.status === 'ready').length, blocked: rows.filter((a) => a.status === 'blocked').length, critical: rows.filter((a) => a.risk === 'critical').length }
  })

  const modules = Array.from(new Set(actions.map((a) => a.module))).map((name) => {
    const rows = actions.filter((a) => a.module === name)
    return { id: `module_${name}`, name, actionCount: rows.length, criticalCount: rows.filter((a) => a.risk === 'critical').length, blockedCount: rows.filter((a) => a.status === 'blocked').length, lastExecutedAt: rows.map((a) => a.lastExecutedAt).filter(Boolean).sort().reverse()[0] ?? null }
  })

  const ready = actions.filter((a) => a.status === 'ready').length
  const blocked = actions.filter((a) => a.status === 'blocked').length
  const readinessScore = Math.max(0, Math.min(100, Math.round((ready / Math.max(actions.length, 1)) * 100) - blocked * 6))

  return {
    ok: true,
    source: 'runtime',
    sourceConfidence: 'runtime',
    generatedAt: now(),
    lastRefreshedAt: now(),
    metrics: {
      totalActions: actions.length,
      readyActions: ready,
      reviewActions: actions.filter((a) => a.status === 'requires_review').length,
      blockedActions: blocked,
      criticalActions: actions.filter((a) => a.risk === 'critical').length,
      executions: s.executions.length,
      failedExecutions: s.executions.filter((e) => ['failed', 'blocked'].includes(e.status)).length,
      readinessScore,
      dryRunCapable: actions.filter((a) => a.requiresDryRun).length,
      rollbackCapable: actions.filter((a) => a.rollbackAvailable).length,
      payloadActions: actions.filter((a) => a.requiresPayload).length,
    },
    actions,
    categories,
    modules,
    policies,
    dependencies,
    executions: s.executions,
    warnings,
    recommendations: warnings.map((w) => ({ id: `rec_${w.id}`, severity: w.severity, title: w.title, reason: w.detail, action: w.recommendedAction })),
    disabledActions: [
      { id: 'hard_delete_blocked', action: 'Hard delete action', reason: 'Permanent deletion is blocked. Use disable/archive.' },
      { id: 'emergency_freeze_blocked', action: 'Emergency freeze', reason: 'Requires SQL-backed system state table before mutation.' },
    ],
  }
}

function execution(action: FactoryAction, status: ExecutionRecord['status'], actor: string, payload: Record<string, any>, mode: string, result: string, evidence: string[]): ExecutionRecord {
  return {
    id: uid('exec'),
    actionKey: action.key,
    label: action.label,
    status,
    actor,
    target: action.endpoint,
    mode,
    payload,
    result,
    evidence,
    impact: { modules: action.affectedModules, pages: action.affectedPages, tables: action.affectedTables, options: action.affectedOptions },
    createdAt: now(),
    completedAt: now(),
  }
}

export async function executeFactoryAction(input: { actionKey: string; payload?: Record<string, any>; actor?: string; mode?: string }) {
  const s = getStore()
  const action = s.actions.find((item) => item.key === input.actionKey)
  const actor = input.actor ?? 'SaaS Factory Operator'
  const payload = input.payload ?? {}
  const mode = input.mode ?? 'execute'

  if (!action) return { ok: false, message: 'Action not found.' }

  if (mode === 'dry_run') {
    const policies = policyFor(action)
    const blockers = [...action.blockers, ...policies.filter((p) => p.status === 'blocked').map((p) => p.rule)]
    const record = execution(action, blockers.length ? 'blocked' : 'preview', actor, payload, 'dry_run', blockers.length ? `Dry-run blocked: ${blockers.join(', ')}` : 'Dry-run completed. No mutation executed.', ['dry_run', `risk:${action.risk}`, `tables:${action.affectedTables.join('|')}`])
    s.executions = [record, ...s.executions].slice(0, 400)
    return { ok: !blockers.length, execution: record, policies, blockers, message: record.result }
  }

  const missing = action.payloadSchema.filter((field) => field.required && !payload[field.key])
  if (missing.length) {
    const record = execution(action, 'blocked', actor, payload, 'blocked', `Missing required fields: ${missing.map((f) => f.key).join(', ')}`, ['payload_validation_failed'])
    s.executions = [record, ...s.executions].slice(0, 400)
    return { ok: false, execution: record, message: record.result }
  }

  const blockers = [...action.blockers, ...policyFor(action).filter((p) => p.status === 'blocked').map((p) => p.rule)]
  if (action.status === 'blocked' || blockers.length || action.key === 'hard_delete_action') {
    const record = execution(action, 'blocked', actor, payload, 'blocked', action.key === 'hard_delete_action' ? 'Hard delete blocked by production policy.' : `Execution blocked: ${blockers.join(', ') || action.status}`, ['blocked_by_policy', `risk:${action.risk}`])
    s.executions = [record, ...s.executions].slice(0, 400)
    return { ok: false, execution: record, message: record.result }
  }

  if (action.requiresDryRun && mode !== 'dry_run' && !payload.dryRunAccepted) {
    const record = execution(action, 'blocked', actor, payload, 'blocked', 'Dry-run must be completed and accepted before execution.', ['dry_run_required'])
    s.executions = [record, ...s.executions].slice(0, 400)
    return { ok: false, execution: record, message: record.result }
  }

  if (action.key === 'register_action') {
    const key = String(payload.key || payload.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')
    const registered: FactoryAction = {
      ...seedActions[1],
      id: uid('action'),
      key,
      label: String(payload.label || key),
      description: String(payload.description || payload.reason || ''),
      category: String(payload.category || 'custom'),
      module: String(payload.module || 'saas-factory'),
      page: String(payload.page || '/saas-factory-command/actions'),
      endpoint: String(payload.endpoint || '/api/saas-factory/actions/execute'),
      risk: ['low', 'medium', 'high', 'critical'].includes(String(payload.risk)) ? payload.risk : 'medium',
      status: 'requires_review',
      owner: actor,
      source: 'runtime',
    }
    s.actions = [registered, ...s.actions.filter((item) => item.key !== registered.key)]
  }

  const record = execution(action, ['high', 'critical'].includes(action.risk) ? 'warning' : 'success', actor, payload, mode, `${action.label} completed with audit evidence.`, ['execution_complete', `endpoint:${action.endpoint}`, `method:${action.method}`, `risk:${action.risk}`])
  s.executions = [record, ...s.executions].slice(0, 400)
  return { ok: true, execution: record, message: record.result }
}

export async function exportActions(format: 'json' | 'csv' = 'json') {
  const summary = await getActionsSummary()
  if (format === 'csv') {
    const header = ['key', 'label', 'category', 'module', 'endpoint', 'method', 'status', 'risk', 'owner', 'requiresDryRun', 'rollbackAvailable']
    const esc = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
    return {
      body: [header.join(','), ...summary.actions.map((a) => [a.key, a.label, a.category, a.module, a.endpoint, a.method, a.status, a.risk, a.owner, a.requiresDryRun, a.rollbackAvailable].map(esc).join(','))].join('\\n'),
      contentType: 'text/csv; charset=utf-8',
      filename: 'saas-factory-actions.csv',
    }
  }
  return { body: JSON.stringify(summary, null, 2), contentType: 'application/json; charset=utf-8', filename: 'saas-factory-actions.json' }
}
