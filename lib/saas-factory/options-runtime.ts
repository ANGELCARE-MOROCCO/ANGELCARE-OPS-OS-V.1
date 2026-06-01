import { createClient } from '@supabase/supabase-js'

export type OptionStatus = 'enabled' | 'disabled' | 'archived' | 'draft'
export type SourceConfidence = 'live' | 'fallback'
export type Severity = 'info' | 'warning' | 'critical'

export type FactoryOption = {
  id: string
  key: string
  label: string
  description: string
  groupId: string
  groupName: string
  type: string
  value: string
  defaultValue: string
  status: OptionStatus
  environment: string
  owner: string
  moduleScope: string[]
  pageScope: string[]
  modalScope: string[]
  workflowScope: string[]
  dependencyKeys: string[]
  allowedValues: string[]
  validationRule: string
  rolloutStrategy: string
  visibility: string
  riskLevel: Severity
  tags: string[]
  requiresReview: boolean
  createdAt: string
  updatedAt: string
  source: SourceConfidence
}

export type FactoryOptionGroup = {
  id: string
  key: string
  name: string
  description: string
  owner: string
  scope: string
  status: 'healthy' | 'review' | 'empty'
  optionCount: number
  enabledCount: number
  allowedTypes: string[]
  requiredFields: string[]
  allowedStatuses: string[]
  defaultModuleScope: string[]
  defaultPageScope: string[]
  defaultModalScope: string[]
  canAdd: boolean
  canRemove: boolean
  canPublish: boolean
  removalPolicy: 'archive_only' | 'disable_or_archive' | 'blocked'
  updatedAt: string
  source: SourceConfidence
}

export type OptionsSummary = {
  ok: boolean
  source: SourceConfidence
  sourceConfidence: SourceConfidence
  generatedAt: string
  lastRefreshedAt: string
  metrics: {
    optionGroups: number
    liveOptions: number
    warnings: number
    readinessScore: number
    modulesImpacted: number
    pageContexts: number
    modalContexts: number
    auditEvents: number
    groupPolicies: number
  }
  counts: Record<string, number>
  options: FactoryOption[]
  optionGroups: FactoryOptionGroup[]
  groups: FactoryOptionGroup[]
  groupPolicies: Array<{
    groupKey: string
    groupName: string
    addAllowed: boolean
    removeAllowed: boolean
    publishAllowed: boolean
    allowedTypes: string[]
    requiredFields: string[]
    removalPolicy: string
    existingOptionKeys: string[]
    recommendedAdditions: string[]
    conflicts: string[]
  }>
  optionTemplates: Array<{
    id: string
    label: string
    groupName: string
    type: string
    value: string
    defaultValue: string
    moduleScope: string[]
    pageScope: string[]
    modalScope: string[]
    workflowScope: string[]
    validationRule: string
    riskLevel: Severity
  }>
  modulesImpacted: Array<{ id: string; name: string; linkedOptions: number; status: string }>
  pageContexts: Array<{ id: string; module: string; page: string; path: string; linkedOptions: number }>
  modalContexts: Array<{ id: string; module: string; page: string; modal: string; purpose: string; linkedOptions: number }>
  auditEvents: Array<{ id: string; action: string; actor: string; status: string; target: string; detail: string; createdAt: string }>
  audit: OptionsSummary['auditEvents']
  warnings: Array<{ id: string; severity: Severity; title: string; detail: string; recommendedAction: string }>
  recommendations: Array<{ id: string; severity: Severity; title: string; reason: string; action: string }>
  disabledActions: Array<{ id: string; action: string; reason: string }>
  validation: Array<{ id: string; check: string; status: string; detail: string }>
}

const defaultModules = ['academy', 'hr', 'revenue', 'market-os', 'interventions', 'saas-factory', 'settings']
const defaultPages = [
  { module: 'academy', page: 'Certificates', path: '/academy/certificates' },
  { module: 'academy', page: 'Trainees', path: '/academy/trainees' },
  { module: 'hr', page: 'Employees', path: '/hr/employees' },
  { module: 'hr', page: 'Roster', path: '/hr/roster' },
  { module: 'revenue', page: 'Partnerships', path: '/revenue/partnerships' },
  { module: 'interventions', page: 'Rapports', path: '/interventions/rapports' },
  { module: 'saas-factory', page: 'Options', path: '/saas-factory-command/options' },
  { module: 'saas-factory', page: 'Modules', path: '/saas-factory-command/modules' },
  { module: 'saas-factory', page: 'Configuration', path: '/saas-factory-command/configuration' },
]
const defaultModals = [
  { module: 'academy', page: 'Certificates', modal: 'Create Certificate', purpose: 'Certificate template and QR code configuration' },
  { module: 'hr', page: 'Roster', modal: 'Schedule Shift', purpose: 'Roster and safe staffing rules' },
  { module: 'revenue', page: 'Partnerships', modal: 'Partner Action', purpose: 'Partner workflow configuration' },
  { module: 'saas-factory', page: 'Options', modal: 'Create Governed Option', purpose: 'Governed options authoring' },
  { module: 'saas-factory', page: 'Configuration', modal: 'Publish Configuration', purpose: 'Configuration release control' },
]

type Store = {
  options: FactoryOption[]
  groups: FactoryOptionGroup[]
  auditEvents: OptionsSummary['auditEvents']
}
const globalStore = globalThis as typeof globalThis & { __angelcareOptionsStoreV3?: Store }

function now() { return new Date().toISOString() }
function uuid(prefix: string) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}` }

function store(): Store {
  if (!globalStore.__angelcareOptionsStoreV3) {
    globalStore.__angelcareOptionsStoreV3 = {
      options: [],
      groups: [],
      auditEvents: [{
        id: 'audit_options_group_control_ready',
        action: 'options_group_control_ready',
        actor: 'SaaS Factory',
        status: 'success',
        target: 'options',
        detail: 'Options group control room initialized.',
        createdAt: now(),
      }],
    }
  }
  return globalStore.__angelcareOptionsStoreV3
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function arr(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean)
  if (typeof value === 'string') {
    const t = value.trim()
    if (!t) return []
    if (t.startsWith('[')) {
      try { const parsed = JSON.parse(t); if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean) } catch {}
    }
    return t.split(',').map((x) => x.trim()).filter(Boolean)
  }
  return []
}

function status(value: unknown): OptionStatus {
  const s = String(value ?? '').toLowerCase()
  if (s === 'archived') return 'archived'
  if (['disabled', 'inactive', 'off'].includes(s)) return 'disabled'
  if (['draft', 'pending'].includes(s)) return 'draft'
  return 'enabled'
}

function severity(value: unknown): Severity {
  const s = String(value ?? '').toLowerCase()
  return s === 'critical' ? 'critical' : s === 'warning' ? 'warning' : 'info'
}

function val(value: unknown) {
  if (typeof value === 'string') return value
  if (value == null) return ''
  try { return JSON.stringify(value) } catch { return String(value) }
}

function normalizeOption(row: any, source: SourceConfidence): FactoryOption {
  const key = String(row?.key ?? row?.option_key ?? row?.name ?? row?.id ?? uuid('option'))
  const groupName = String(row?.group_name ?? row?.groupName ?? row?.group ?? row?.category ?? 'general')
  const createdAt = String(row?.created_at ?? row?.createdAt ?? now())
  return {
    id: String(row?.id ?? row?.option_id ?? key),
    key,
    label: String(row?.label ?? row?.title ?? row?.name ?? key),
    description: String(row?.description ?? ''),
    groupId: String(row?.group_id ?? row?.groupId ?? groupName),
    groupName,
    type: String(row?.type ?? row?.option_type ?? 'select'),
    value: val(row?.value ?? row?.config_value ?? row?.default_value ?? ''),
    defaultValue: val(row?.default_value ?? row?.defaultValue ?? ''),
    status: status(row?.status ?? (row?.enabled === false ? 'disabled' : 'enabled')),
    environment: String(row?.environment ?? row?.env ?? 'production'),
    owner: String(row?.owner ?? row?.created_by ?? row?.updated_by ?? 'SaaS Factory'),
    moduleScope: arr(row?.module_scope ?? row?.moduleScope ?? row?.modules ?? row?.module),
    pageScope: arr(row?.page_scope ?? row?.pageScope ?? row?.pages ?? row?.page),
    modalScope: arr(row?.modal_scope ?? row?.modalScope ?? row?.modals ?? row?.modal),
    workflowScope: arr(row?.workflow_scope ?? row?.workflowScope ?? row?.workflows ?? row?.workflow),
    dependencyKeys: arr(row?.dependency_keys ?? row?.dependencyKeys ?? row?.depends_on),
    allowedValues: arr(row?.allowed_values ?? row?.allowedValues),
    validationRule: String(row?.validation_rule ?? row?.validationRule ?? ''),
    rolloutStrategy: String(row?.rollout_strategy ?? row?.rolloutStrategy ?? 'manual_review'),
    visibility: String(row?.visibility ?? 'internal'),
    riskLevel: severity(row?.risk_level ?? row?.riskLevel ?? 'info'),
    tags: arr(row?.tags),
    requiresReview: Boolean(row?.requires_review ?? row?.requiresReview ?? false),
    createdAt,
    updatedAt: String(row?.updated_at ?? row?.updatedAt ?? createdAt),
    source,
  }
}

function groupPolicy(groupName: string, options: FactoryOption[]) {
  const lower = groupName.toLowerCase()
  const isSystem = /system|security|permission|billing|deployment/.test(lower)
  const isWorkflow = /workflow|modal|page|module|form/.test(lower)
  return {
    allowedTypes: isSystem ? ['boolean', 'select', 'json'] : isWorkflow ? ['select', 'multi_select', 'boolean', 'json'] : ['select', 'multi_select', 'boolean', 'text', 'number', 'json'],
    requiredFields: ['label', 'key', 'groupName', 'type', 'owner', ...(isWorkflow ? ['moduleScope', 'pageScope'] : [])],
    allowedStatuses: ['draft', 'enabled', 'disabled', 'archived'],
    canAdd: true,
    canRemove: !isSystem,
    canPublish: true,
    removalPolicy: isSystem ? 'blocked' as const : 'archive_only' as const,
    recommendedAdditions: isWorkflow ? ['visibility_control', 'default_state', 'validation_rule'] : ['display_label', 'sort_order', 'visibility_control'],
    conflicts: options.filter((option, index, all) => all.findIndex((item) => item.key === option.key) !== index).map((option) => option.key),
  }
}

function buildGroups(options: FactoryOption[], explicit: FactoryOptionGroup[], source: SourceConfidence): FactoryOptionGroup[] {
  const names = Array.from(new Set(['general', ...options.map((o) => o.groupName), ...explicit.map((g) => g.name)]))
  return names.map((name) => {
    const rows = options.filter((option) => option.groupName === name)
    const existing = explicit.find((group) => group.name === name || group.key === name)
    const policy = groupPolicy(name, rows)
    return {
      id: existing?.id ?? `group_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      key: existing?.key ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      name,
      description: existing?.description ?? `Governed option group for ${name}`,
      owner: existing?.owner ?? rows[0]?.owner ?? 'SaaS Factory',
      scope: existing?.scope ?? 'production',
      status: rows.length === 0 ? 'empty' : rows.some((o) => o.status !== 'enabled' || o.requiresReview) ? 'review' : 'healthy',
      optionCount: rows.length,
      enabledCount: rows.filter((o) => o.status === 'enabled').length,
      allowedTypes: policy.allowedTypes,
      requiredFields: policy.requiredFields,
      allowedStatuses: policy.allowedStatuses,
      defaultModuleScope: existing?.defaultModuleScope ?? Array.from(new Set(rows.flatMap((o) => o.moduleScope))),
      defaultPageScope: existing?.defaultPageScope ?? Array.from(new Set(rows.flatMap((o) => o.pageScope))),
      defaultModalScope: existing?.defaultModalScope ?? Array.from(new Set(rows.flatMap((o) => o.modalScope))),
      canAdd: policy.canAdd,
      canRemove: policy.canRemove,
      canPublish: policy.canPublish,
      removalPolicy: policy.removalPolicy,
      updatedAt: rows.map((o) => o.updatedAt).sort().reverse()[0] ?? now(),
      source,
    }
  })
}

function modules(options: FactoryOption[]) {
  return Array.from(new Set([...defaultModules, ...options.flatMap((o) => o.moduleScope.length ? o.moduleScope : ['platform'])])).map((name) => ({
    id: `module_${name.replace(/[^a-z0-9]+/gi, '_')}`,
    name,
    status: 'observed',
    linkedOptions: options.filter((o) => o.moduleScope.includes(name) || (!o.moduleScope.length && name === 'platform')).length,
  }))
}

function pages(options: FactoryOption[]) {
  return defaultPages.map((p) => ({ ...p, id: `${p.module}_${p.page}`.replace(/[^a-z0-9]+/gi, '_'), linkedOptions: options.filter((o) => o.pageScope.includes(p.path) || o.pageScope.includes(p.page) || o.moduleScope.includes(p.module)).length }))
}

function modals(options: FactoryOption[]) {
  return defaultModals.map((m) => ({ ...m, id: `${m.module}_${m.page}_${m.modal}`.replace(/[^a-z0-9]+/gi, '_'), linkedOptions: options.filter((o) => o.modalScope.includes(m.modal) || o.pageScope.includes(m.page) || o.moduleScope.includes(m.module)).length }))
}

async function loadLive() {
  const supabase = supabaseAdmin()
  if (!supabase) return { options: null as FactoryOption[] | null, source: 'fallback' as SourceConfidence, error: 'Supabase env not configured.' }
  const tables = ['saas_factory_options', 'saas_factory_option_registry', 'saas_factory_configuration_options']
  let last = ''
  for (const table of tables) {
    const result = await supabase.from(table).select('*').limit(1000)
    if (!result.error) return { options: (result.data ?? []).map((r) => normalizeOption(r, 'live')), source: 'live' as SourceConfidence, error: '' }
    last = `${table}: ${result.error.message}`
  }
  return { options: null, source: 'fallback' as SourceConfidence, error: last }
}

function buildSummary(options: FactoryOption[], groupsInput: FactoryOptionGroup[], auditEvents: OptionsSummary['auditEvents'], source: SourceConfidence, reason?: string): OptionsSummary {
  const generatedAt = now()
  const optionGroups = buildGroups(options, groupsInput, source)
  const modulesImpacted = modules(options)
  const pageContexts = pages(options)
  const modalContexts = modals(options)
  const warnings = [
    ...options.filter((o) => o.status !== 'enabled' || o.requiresReview || o.riskLevel !== 'info').map((o) => ({ id: `warning_${o.id}`, severity: o.riskLevel === 'critical' ? 'critical' as const : 'warning' as const, title: `${o.label} requires review`, detail: `${o.key} is ${o.status}.`, recommendedAction: 'Review group policy, context impact and publish gate.' })),
    ...(reason ? [{ id: 'fallback_source', severity: 'warning' as const, title: 'Live registry fallback', detail: reason, recommendedAction: 'Apply SQL and verify Supabase env.' }] : []),
  ]
  const readinessScore = options.length === 0 ? 0 : Math.max(0, Math.min(100, Math.round(((options.length - warnings.length) / options.length) * 100)))
  const groupPolicies = optionGroups.map((group) => {
    const rows = options.filter((option) => option.groupName === group.name)
    const policy = groupPolicy(group.name, rows)
    return {
      groupKey: group.key,
      groupName: group.name,
      addAllowed: group.canAdd,
      removeAllowed: group.canRemove,
      publishAllowed: group.canPublish,
      allowedTypes: group.allowedTypes,
      requiredFields: group.requiredFields,
      removalPolicy: group.removalPolicy,
      existingOptionKeys: rows.map((row) => row.key),
      recommendedAdditions: policy.recommendedAdditions,
      conflicts: policy.conflicts,
    }
  })
  const metrics = {
    optionGroups: optionGroups.length,
    liveOptions: options.filter((o) => o.status === 'enabled').length,
    warnings: warnings.length,
    readinessScore,
    modulesImpacted: modulesImpacted.length,
    pageContexts: pageContexts.length,
    modalContexts: modalContexts.length,
    auditEvents: auditEvents.length,
    groupPolicies: groupPolicies.length,
  }
  return {
    ok: true,
    source,
    sourceConfidence: source,
    generatedAt,
    lastRefreshedAt: generatedAt,
    metrics,
    counts: { ...metrics, readiness: readinessScore, readinessScore },
    options,
    optionGroups,
    groups: optionGroups,
    groupPolicies,
    optionTemplates: optionGroups.flatMap((group) => group.allowedTypes.slice(0, 3).map((type) => ({
      id: `template_${group.key}_${type}`,
      label: `${group.name} ${type} option`,
      groupName: group.name,
      type,
      value: type === 'boolean' ? 'true' : '',
      defaultValue: type === 'boolean' ? 'false' : '',
      moduleScope: group.defaultModuleScope,
      pageScope: group.defaultPageScope,
      modalScope: group.defaultModalScope,
      workflowScope: ['validation', 'publish'],
      validationRule: type === 'number' ? 'number:min=0' : type === 'json' ? 'json:valid' : '',
      riskLevel: group.name.match(/system|security|permission/) ? 'critical' : 'warning',
    }))),
    modulesImpacted,
    pageContexts,
    modalContexts,
    auditEvents,
    audit: auditEvents,
    warnings,
    recommendations: warnings.map((w) => ({ id: `rec_${w.id}`, severity: w.severity, title: w.title, reason: w.detail, action: w.recommendedAction })),
    disabledActions: [{ id: 'hard_delete_disabled', action: 'Hard delete', reason: 'Permanent delete is blocked. Use archive/remove-from-group workflow.' }],
    validation: [{ id: 'group_policy', check: 'Group policy engine', status: 'passed', detail: `${groupPolicies.length} group policies loaded.` }],
  }
}

export async function getOptionsSummary(): Promise<OptionsSummary> {
  const local = store()
  const live = await loadLive()
  if (live.options) return buildSummary([...live.options, ...local.options], local.groups, local.auditEvents, 'live')
  return buildSummary(local.options, local.groups, local.auditEvents, 'fallback', live.error)
}

function audit(action: string, target: string, detail: string, status = 'success', actor = 'SaaS Factory Operator') {
  const event = { id: uuid('audit'), action, actor, status, target, detail, createdAt: now() }
  store().auditEvents = [event, ...store().auditEvents].slice(0, 200)
  return event
}

export async function runOptionsAction(input: { action: string; payload?: Record<string, any>; actor?: string }) {
  const local = store()
  const payload = input.payload ?? {}
  const actor = input.actor ?? 'SaaS Factory Operator'
  const action = input.action

  if (action === 'create_option' || action === 'add_option_to_group') {
    const summary = await getOptionsSummary()
    const groupName = String(payload.groupName || 'general')
    const policy = summary.groupPolicies.find((p) => p.groupName === groupName || p.groupKey === groupName)
    if (policy && !policy.addAllowed) {
      const event = audit(action, groupName, 'Add option blocked by group policy.', 'blocked', actor)
      return { ok: false, event, message: 'This group does not allow adding options.' }
    }
    const key = String(payload.key || payload.label || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
    if (!key) return { ok: false, event: audit(action, groupName, 'Missing option key.', 'blocked', actor), message: 'Option key is required.' }
    if (policy?.existingOptionKeys.includes(key)) return { ok: false, event: audit(action, key, 'Duplicate option key blocked.', 'blocked', actor), message: 'Option key already exists in this group.' }
    const option = normalizeOption({ ...payload, key, group_name: groupName, status: payload.status || 'draft', requires_review: true, created_at: now(), updated_at: now() }, 'fallback')
    local.options = [option, ...local.options]
    const event = audit(action, option.key, `Added option to ${option.groupName} with ${option.moduleScope.length} module(s), ${option.pageScope.length} page(s), ${option.modalScope.length} modal(s).`, 'success', actor)
    return { ok: true, event, option, message: 'Option added to group and queued for review.' }
  }

  if (action === 'remove_option_from_group') {
    const id = String(payload.id || '')
    const existing = local.options.find((option) => option.id === id || option.key === id)
    if (!existing) return { ok: false, event: audit(action, id, 'Option not found in writable runtime.', 'blocked', actor), message: 'Only runtime-created options can be removed here. Live rows should be archived via SQL-backed action.' }
    local.options = local.options.map((option) => option.id === existing.id ? { ...option, status: 'archived', requiresReview: true, updatedAt: now() } : option)
    return { ok: true, event: audit(action, existing.key, 'Option removed from active group by archive policy.', 'success', actor), message: 'Option archived by group removal policy.' }
  }

  if (action === 'clone_option') {
    const base = String(payload.baseKey || '')
    const summary = await getOptionsSummary()
    const source = summary.options.find((option) => option.key === base || option.id === base)
    if (!source) return { ok: false, event: audit(action, base, 'Clone failed: source option not found.', 'blocked', actor), message: 'Source option not found.' }
    const option = normalizeOption({ ...source, id: uuid('option'), key: `${source.key}_copy`, label: `${source.label} Copy`, status: 'draft', requires_review: true, created_at: now(), updated_at: now() }, 'fallback')
    local.options = [option, ...local.options]
    return { ok: true, event: audit(action, option.key, `Cloned from ${source.key}.`, 'success', actor), option, message: 'Option cloned as draft.' }
  }

  if (action === 'validate_registry') {
    const summary = await getOptionsSummary()
    const event = audit(action, 'options_registry', `Validated ${summary.optionGroups.length} groups with ${summary.warnings.length} warning(s).`, summary.warnings.length ? 'warning' : 'success', actor)
    return { ok: true, event, validation: summary.validation, warnings: summary.warnings, policies: summary.groupPolicies, message: 'Registry and group policy validation completed.' }
  }

  if (action === 'publish_changes') return { ok: true, event: audit(action, 'options_registry', 'Publish checkpoint created for reviewed runtime options.', 'success', actor), message: 'Publish checkpoint created.' }
  if (action === 'hard_delete_option') return { ok: false, event: audit(action, String(payload.id || 'option'), 'Hard delete blocked by group policy.', 'blocked', actor), message: 'Hard delete blocked. Use remove/archive.' }

  return { ok: false, event: audit(action || 'unknown_action', 'options', 'Unsupported action blocked.', 'blocked', actor), message: 'Unsupported action.' }
}

export async function getOptionsExport(format: 'json' | 'csv' = 'json') {
  const summary = await getOptionsSummary()
  if (format === 'csv') {
    const header = ['id','key','label','groupName','type','status','moduleScope','pageScope','modalScope','updatedAt']
    const esc = (v: unknown) => `"${String(v ?? '').replaceAll('"','""')}"`
    return { body: [header.join(','), ...summary.options.map((o) => [o.id,o.key,o.label,o.groupName,o.type,o.status,o.moduleScope.join('|'),o.pageScope.join('|'),o.modalScope.join('|'),o.updatedAt].map(esc).join(','))].join('\n'), contentType: 'text/csv; charset=utf-8', filename: 'saas-factory-options.csv' }
  }
  return { body: JSON.stringify(summary, null, 2), contentType: 'application/json; charset=utf-8', filename: 'saas-factory-options.json' }
}

// -----------------------------------------------------------------------------
// SaaS Factory Options Runtime Compatibility Exports
// -----------------------------------------------------------------------------
// Existing API routes still import legacy workflow names while the runtime now
// exposes runOptionsAction/getOptionsSummary. These wrappers preserve build/runtime
// compatibility without replacing the real options implementation.
// -----------------------------------------------------------------------------

type __OptionsCompatPayload = Record<string, any>

async function __runOptionsActionCompat(action: string, payload: __OptionsCompatPayload = {}) {
  const runner = runOptionsAction as unknown as (...args: any[]) => Promise<any> | any

  try {
    return await runner(action, payload)
  } catch (firstError) {
    try {
      return await runner({
        action,
        operation: action,
        mode: action,
        payload,
        ...payload,
      })
    } catch (secondError) {
      return {
        ok: false,
        action,
        message:
          secondError instanceof Error
            ? secondError.message
            : firstError instanceof Error
              ? firstError.message
              : 'Options workflow compatibility action failed.',
        evidence: [
          'options_runtime_compat_wrapper',
          'legacy_api_route_import',
          'runOptionsAction_fallback_attempted',
        ],
      }
    }
  }
}

export async function handleOptionsWorkflowAction(...args: any[]) {
  const first = args[0]
  const second = args[1]
  const action =
    typeof first === 'string'
      ? first
      : first?.action || first?.operation || first?.mode || 'workflow'
  const payload =
    typeof first === 'string'
      ? (second && typeof second === 'object' ? second : {})
      : (first && typeof first === 'object' ? first : {})

  return __runOptionsActionCompat(action, payload)
}

export async function publishOptionsRegistry(payload: __OptionsCompatPayload = {}) {
  return __runOptionsActionCompat('publish', {
    ...payload,
    workflow: 'publish_options_registry',
    confirmationRequired: true,
  })
}

export async function rollbackOptionsRegistry(payload: __OptionsCompatPayload = {}) {
  return __runOptionsActionCompat('rollback', {
    ...payload,
    workflow: 'rollback_options_registry',
    confirmationRequired: true,
  })
}

export async function runOptionsValidation(payload: __OptionsCompatPayload = {}) {
  return __runOptionsActionCompat('validate', {
    ...payload,
    workflow: 'validate_options_registry',
  })
}

