import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { createServiceClient } from '@/lib/supabase/server'
import { resolveRevenueOsActor, requireRevenueOsPermission } from '@/lib/revenue-command-os/access'
import { normalizeRevenueOsError, RevenueOsError } from '@/lib/revenue-command-os/errors'
import { writeRevenueOsAuditEvent } from '@/lib/revenue-command-os/repository'
import { runGeminiStrategyAssembly } from '@/lib/revenue-command-os/strategy-brain/ai-orchestration'
import { simulateRevenueCommandSituation } from '@/lib/revenue-command-os/command-kernel/repository'
import type { RevenueCommandSituation } from '@/lib/revenue-command-os/command-kernel/types'
import type { RevenueObjective } from '@/lib/revenue-command-os/strategy-brain/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

type ImportKind = 'mandates' | 'commands' | 'doctrines' | 'gemini-resources'
type Row = Record<string, string>
type Actor = Awaited<ReturnType<typeof resolveRevenueOsActor>>

const MAX_ROWS = 1000

const requiredHeaders: Record<ImportKind, string[]> = {
  mandates: ['mandate_code','title','description','business_unit','market','horizon_days'],
  commands: ['command_code','name','family_code','purpose','owner_role','active_version'],
  doctrines: ['doctrine_code','title','category','statement','authority_role'],
  'gemini-resources': ['resource_code','name','resource_type','description','version'],
}

const permissionByKind: Record<ImportKind, { permission: string; aliases: string[] }> = {
  mandates: { permission: 'revenue_os.objectives.manage', aliases: ['revenue_os.manage'] },
  commands: { permission: 'revenue_os.commands.manage', aliases: ['revenue_os.manage'] },
  doctrines: { permission: 'revenue_os.knowledge.manage', aliases: ['revenue_os.manage'] },
  'gemini-resources': { permission: 'revenue_os.strategy.manage', aliases: ['revenue_os.manage', 'revenue_os.ai.generate'] },
}

function asKind(value: unknown): ImportKind {
  const kind = String(value || '')
  if (!['mandates','commands','doctrines','gemini-resources'].includes(kind)) {
    throw new RevenueOsError('REVENUE_OS_IMPORT_KIND_INVALID', 'Type d’import Revenue OS non supporté.', { status: 400 })
  }
  return kind as ImportKind
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : value == null ? fallback : String(value).trim()
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  const raw = text(value)
  if (!raw) return []
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean)
    } catch {}
  }
  return raw.split(/[|;\n]/).map((item) => item.trim()).filter(Boolean)
}

function jsonValue(value: unknown, fallback: unknown) {
  const raw = text(value)
  if (!raw) return fallback
  try { return JSON.parse(raw) } catch { return raw }
}

function integer(value: unknown, fallback: number) {
  const result = Number.parseInt(text(value), 10)
  return Number.isFinite(result) ? result : fallback
}

function numberValue(value: unknown): number | undefined {
  const raw = text(value)
  if (!raw) return undefined
  const result = Number(raw.replace(',', '.'))
  return Number.isFinite(result) ? result : undefined
}

function booleanValue(value: unknown, fallback = true) {
  const raw = text(value).toLowerCase()
  if (!raw) return fallback
  return ['true','1','yes','oui','enabled','active'].includes(raw)
}

function code(value: unknown) {
  return text(value).toUpperCase().replace(/[^A-Z0-9._:-]+/g, '-').replace(/^-+|-+$/g, '')
}

function uuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function safeStatus(kind: ImportKind, value: unknown) {
  const raw = text(value).toLowerCase().replaceAll('_', '-')
  if (kind === 'mandates') {
    return ['draft','submitted','validated','active','paused','completed','cancelled'].includes(raw) ? raw : 'draft'
  }
  if (kind === 'commands') {
    return ['draft','proposed','under-review','needs-evidence','needs-approval','approved','rejected','scheduled','running','paused','blocked','failed','retrying','completed','superseded','retired','rolled-back','audited'].includes(raw) ? raw : 'draft'
  }
  if (kind === 'doctrines') {
    return ['draft','in-review','approved','effective','suspended','retired','rejected'].includes(raw) ? raw : 'draft'
  }
  return ['draft','validated','approved','active','restricted','deprecated','retired'].includes(raw) ? raw : 'draft'
}

function executionMode(value: unknown) {
  const raw = text(value).toLowerCase().replaceAll('_', '-')
  return ['shadow','recommend','approval-gated','limited-autonomy'].includes(raw) ? raw : 'approval-gated'
}

function priority(value: unknown) {
  const raw = text(value).toLowerCase()
  return ['critical','high','medium','low'].includes(raw) ? raw : 'high'
}

function approvalClass(value: unknown) {
  const raw = text(value).toLowerCase()
  return ['none','recommendation','internal-generation','supervisor','department','director','executive','prohibited'].includes(raw)
    ? raw
    : 'recommendation'
}

function issue(row: number, field: string, message: string) {
  return { row, field, message }
}

async function actorFor(kind: ImportKind, payload?: unknown): Promise<Actor> {
  const config = permissionByKind[kind]
  return resolveRevenueOsActor(config.permission, {
    aliases: config.aliases,
    payload,
    message: `Permission requise pour ${kind}.`,
  })
}

async function listItems(kind: ImportKind, actor: Actor) {
  const supabase = await createServiceClient()
  if (kind === 'mandates') {
    const result = await (supabase as any).from('revenue_os_objectives')
      .select('id,code,title,status,updated_at')
      .order('updated_at', { ascending: false })
      .limit(500)
    if (result.error) throw result.error
    return (result.data || []).map((row: any) => ({ code: row.code, title: row.title, status: row.status, subtitle: row.id }))
  }
  if (kind === 'commands') {
    const result = await (supabase as any).from('revenue_os_command_definitions')
      .select('command_code,name,status,active_version,family_code')
      .order('command_code')
      .limit(1000)
    if (result.error) throw result.error
    return (result.data || []).map((row: any) => ({ code: row.command_code, title: row.name, status: row.status, version: row.active_version, subtitle: row.family_code }))
  }
  if (kind === 'doctrines') {
    const result = await (supabase as any).from('revenue_os_doctrines')
      .select('code,title,status,version,knowledge_type')
      .order('updated_at', { ascending: false })
      .limit(1000)
    if (result.error) throw result.error
    return (result.data || []).map((row: any) => ({ code: row.code, title: row.title, status: row.status, version: row.version, subtitle: row.knowledge_type }))
  }
  if (!uuid(actor.tenantId)) {
    throw new RevenueOsError('REVENUE_OS_TENANT_INVALID', 'Le tenant actif ne peut pas utiliser le registre de ressources versionné.', { status: 409 })
  }
  const result = await (supabase as any).from('revenue_os_registry_entries')
    .select('code,purpose,status,version,content')
    .eq('tenant_id', actor.tenantId)
    .eq('registry', 'gemini-resource')
    .order('updated_at', { ascending: false })
    .limit(1000)
  if (result.error) throw result.error
  return (result.data || []).map((row: any) => ({
    code: row.code,
    title: row.content?.name || row.purpose,
    status: row.status,
    version: row.version,
    subtitle: row.content?.resourceType || 'gemini-resource',
  }))
}

async function validateRows(kind: ImportKind, rows: Row[]) {
  const issues: Array<{ row: number; field: string; message: string }> = []
  const seen = new Set<string>()
  let familyCodes = new Set<string>()
  if (kind === 'commands') {
    const supabase = await createServiceClient()
    const result = await (supabase as any).from('revenue_os_command_families').select('code')
    if (!result.error) familyCodes = new Set((result.data || []).map((row: any) => String(row.code)))
  }

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    for (const header of requiredHeaders[kind]) {
      if (!text(row[header])) issues.push(issue(rowNumber, header, 'Champ obligatoire vide.'))
    }
    const identity = code(row[kind === 'mandates' ? 'mandate_code' : kind === 'commands' ? 'command_code' : kind === 'doctrines' ? 'doctrine_code' : 'resource_code'])
    if (!identity) issues.push(issue(rowNumber, 'code', 'Code canonique invalide.'))
    if (seen.has(identity)) issues.push(issue(rowNumber, 'code', `Code dupliqué dans le fichier: ${identity}`))
    seen.add(identity)

    if (kind === 'mandates') {
      if (text(row.title).length < 8) issues.push(issue(rowNumber, 'title', 'Le titre doit contenir au moins 8 caractères.'))
      if (text(row.description).length < 20) issues.push(issue(rowNumber, 'description', 'Le mandat doit contenir au moins 20 caractères.'))
      const margin = numberValue(row.minimum_margin_percent)
      if (margin != null && (margin < 0 || margin > 100)) issues.push(issue(rowNumber, 'minimum_margin_percent', 'La marge doit être comprise entre 0 et 100.'))
    }
    if (kind === 'commands' && familyCodes.size && !familyCodes.has(text(row.family_code))) {
      issues.push(issue(rowNumber, 'family_code', `Famille inconnue: ${text(row.family_code)}`))
    }
    if (kind === 'gemini-resources') {
      const forbidden = Object.keys(row).filter((key) => /(api.?key|password|secret|token|connection.?string)/i.test(key) && text(row[key]))
      forbidden.forEach((field) => issues.push(issue(rowNumber, field, 'Les secrets ne peuvent pas être importés par CSV.')))
    }
  })

  const rejectedRows = new Set(issues.map((entry) => entry.row)).size
  return {
    summary: { total: rows.length, created: 0, updated: 0, skipped: rows.length - rejectedRows, rejected: rejectedRows },
    issues,
  }
}

function mandatePayload(row: Row, actor: Actor) {
  const margin = numberValue(row.minimum_margin_percent)
  return {
    code: code(row.mandate_code),
    title: text(row.title),
    mandate: text(row.description),
    business_unit: text(row.business_unit),
    target_market: text(row.market),
    horizon: text(row.horizon_days),
    priority: priority(row.priority),
    status: safeStatus('mandates', row.status),
    execution_mode: executionMode((row as any).execution_mode),
    owner_id: null,
    owner_label: text(row.owner_email) || actor.displayName,
    source: 'import',
    metadata: {
      targetSegments: list(row.segments),
      territories: list(row.territories),
      targetAccounts: list(row.named_accounts),
      revenueTargetDh: numberValue(row.revenue_target_dh),
      minimumMarginPercent: margin,
      dueDate: text(row.due_date) || null,
      budgetLimitDh: numberValue(row.budget_limit_dh),
      capacityConstraints: list(row.capacity_constraints),
      approvedOffers: list(row.approved_offers),
      approvedChannels: list(row.approved_channels),
      riskAppetite: text(row.risk_appetite) || 'balanced',
      successCriteria: list(row.success_criteria),
      failureConditions: list(row.failure_conditions),
      authorityLevel: text(row.authority_level) || 'Direction générale',
      tags: list(row.tags),
      importedAt: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  }
}

function commandPayload(row: Row, actor: Actor) {
  const resources = list(row.required_resources)
  const doctrines = list(row.required_doctrines)
  const requiredContext = list(row.required_context).map((key) => ({ key, required: true }))
  requiredContext.push(...resources.map((key) => ({ key: `resource:${key}`, required: true })))
  requiredContext.push(...doctrines.map((key) => ({ key: `doctrine:${key}`, required: true })))
  return {
    organization_id: uuid(actor.tenantId) ? actor.tenantId : null,
    tenant_id: uuid(actor.tenantId) ? actor.tenantId : null,
    command_code: code(row.command_code),
    name: text(row.name),
    family_code: text(row.family_code),
    purpose: text(row.purpose),
    owner_role: text(row.owner_role),
    status: safeStatus('commands', row.status),
    active_version: text(row.active_version) || '1.0.0',
    business_units: list(row.business_units),
    segments: list(row.segments),
    territories: list(row.territories),
    commercial_stages: list(row.commercial_stages),
    trigger_types: list(row.trigger_types),
    eligibility_rules: jsonValue(row.eligibility_rules, []),
    required_context: requiredContext,
    optional_context: list(row.optional_context).map((key) => ({ key, required: false })),
    tool_permissions: jsonValue(row.tool_permissions, []),
    input_schema: jsonValue(row.input_schema, {}),
    output_schema: jsonValue(row.output_schema, {}),
    validator_chain: list(row.validator_chain),
    approval_class: approvalClass(row.approval_class),
    downstream_compiler: text(row.downstream_compiler) || null,
    cooldown_policy: jsonValue(row.cooldown_policy, { seconds: 0 }),
    retry_policy: jsonValue(row.retry_policy, { maxAttempts: 1 }),
    failure_policy: jsonValue(row.failure_policy, { mode: 'stop' }),
    fallback_command_codes: list(row.fallback_command_codes),
    performance_metrics: list(row.performance_metrics),
    prohibited_cases: list(row.prohibited_cases),
    expected_outcomes: list(row.expected_outcomes),
    tags: [...list(row.tags), ...resources.map((item) => `resource:${item}`), ...doctrines.map((item) => `doctrine:${item}`), 'csv-import'],
    updated_by: uuid(actor.id) ? actor.id : null,
    updated_at: new Date().toISOString(),
  }
}

function doctrinePayload(row: Row, actor: Actor) {
  const statement = text(row.statement)
  return {
    code: code(row.doctrine_code),
    title: text(row.title),
    summary: statement,
    knowledge_type: text(row.category) || 'doctrine',
    owner_role: text(row.authority_role),
    department: text(row.department) || text(row.domain) || 'Revenue',
    business_unit_codes: list(row.business_units),
    status: safeStatus('doctrines', row.status),
    confidentiality: ['public','internal','confidential','restricted'].includes(text(row.confidentiality)) ? text(row.confidentiality) : 'internal',
    version: text(row.version) || '1.0',
    effective_from: text(row.effective_from) || null,
    effective_to: text(row.effective_until) || null,
    next_review_at: null,
    review_cycle_days: integer(row.review_cycle_days, 90),
    applicable_command_families: list(row.applicable_command_families),
    applicable_segment_codes: list(row.applicable_segments),
    applicable_offer_codes: list(row.applicable_offers),
    tags: list(row.tags),
    source_authority: text(row.authority_role),
    content_blocks: [
      { type: 'statement', content: statement },
      { type: 'rationale', content: text(row.rationale) },
    ],
    rules: [
      {
        code: `${code(row.doctrine_code)}-RULE-01`,
        statement,
        prohibitedActions: list(row.prohibited_actions),
        requiredApprovals: list(row.required_approvals),
        evidenceRequirements: list(row.evidence_requirements),
      },
    ],
    evidence_refs: list(row.evidence_requirements),
    source: 'import',
    created_by: uuid(actor.id) ? actor.id : null,
    created_by_label: actor.displayName,
    metadata: {
      domain: text(row.domain),
      conflictCodes: list(row.conflict_codes),
      prohibitedActions: list(row.prohibited_actions),
      requiredApprovals: list(row.required_approvals),
      rationale: text(row.rationale),
      importedAt: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  }
}

function resourcePayload(row: Row, actor: Actor) {
  const content = {
    name: text(row.name),
    resourceType: text(row.resource_type),
    description: text(row.description),
    domain: text(row.domain),
    provider: text(row.provider) || 'gemini',
    modelName: text(row.model_name),
    promptVersion: text(row.prompt_version),
    contentReference: text(row.content_reference),
    contextAdapter: text(row.context_adapter),
    toolName: text(row.tool_name),
    inputSchema: jsonValue(row.input_schema, {}),
    outputSchema: jsonValue(row.output_schema, {}),
    permissionKey: text(row.permission_key),
    approvalClass: text(row.approval_class),
    timeoutSeconds: integer(row.timeout_seconds, 240),
    maxTokens: integer(row.max_tokens, 12000),
    temperature: numberValue(row.temperature) ?? 0.2,
    enabled: booleanValue(row.enabled, true),
    tags: list(row.tags),
  }
  return {
    tenant_id: actor.tenantId,
    registry: 'gemini-resource',
    code: code(row.resource_code),
    version: text(row.version) || '1.0',
    status: safeStatus('gemini-resources', row.status),
    purpose: text(row.description),
    content_hash: crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex'),
    content,
    cost_profile: {},
    allowed_data_class: 'internal',
    activated_at: safeStatus('gemini-resources', row.status) === 'active' ? new Date().toISOString() : null,
    metadata: { importedBy: actor.displayName, importedAt: new Date().toISOString() },
    updated_at: new Date().toISOString(),
  }
}

async function importRows(kind: ImportKind, rows: Row[], actor: Actor) {
  const validation = await validateRows(kind, rows)
  const invalid = new Set(validation.issues.map((entry) => entry.row - 2))
  const accepted = rows.filter((_, index) => !invalid.has(index))
  const supabase = await createServiceClient()
  const table = kind === 'mandates'
    ? 'revenue_os_objectives'
    : kind === 'commands'
      ? 'revenue_os_command_definitions'
      : kind === 'doctrines'
        ? 'revenue_os_doctrines'
        : 'revenue_os_registry_entries'
  const conflict = kind === 'mandates'
    ? 'code'
    : kind === 'commands'
      ? 'command_code'
      : kind === 'doctrines'
        ? 'code'
        : 'tenant_id,registry,code,version'
  const identityColumn = kind === 'commands' ? 'command_code' : 'code'
  const identities = accepted.map((row) => code(row[kind === 'mandates' ? 'mandate_code' : kind === 'commands' ? 'command_code' : kind === 'doctrines' ? 'doctrine_code' : 'resource_code']))
  let existing = new Set<string>()
  if (identities.length) {
    let query = (supabase as any).from(table).select(identityColumn).in(identityColumn, identities)
    if (kind === 'gemini-resources') query = query.eq('tenant_id', actor.tenantId).eq('registry', 'gemini-resource')
    const current = await query
    if (!current.error) existing = new Set((current.data || []).map((row: any) => String(row[identityColumn])))
  }

  const payloads = accepted.map((row) =>
    kind === 'mandates' ? mandatePayload(row, actor)
      : kind === 'commands' ? commandPayload(row, actor)
        : kind === 'doctrines' ? doctrinePayload(row, actor)
          : resourcePayload(row, actor),
  )
  if (payloads.length) {
    const result = await (supabase as any).from(table).upsert(payloads, { onConflict: conflict }).select('*')
    if (result.error) throw result.error
  }

  const created = identities.filter((identity) => !existing.has(identity)).length
  const updated = identities.length - created
  const summary = {
    total: rows.length,
    created,
    updated,
    skipped: 0,
    rejected: invalid.size,
  }

  await writeRevenueOsAuditEvent({
    action: `canonical_import.${kind}`,
    actorId: actor.id,
    actorLabel: actor.displayName,
    actorType: 'user',
    resourceType: `revenue_os_${kind}`,
    outcome: invalid.size ? 'pending' : 'success',
    summary: `${summary.created} création(s), ${summary.updated} mise(s) à jour et ${summary.rejected} rejet(s) pour ${kind}.`,
    metadata: { summary, importedCodes: identities.slice(0, 100), externalActions: 0 },
  }, supabase)

  return { summary, issues: validation.issues, importedCodes: identities }
}

async function objectiveByCode(supabase: any, mandateCode: string) {
  const query = uuid(mandateCode)
    ? supabase.from('revenue_os_objectives').select('*').eq('id', mandateCode).maybeSingle()
    : supabase.from('revenue_os_objectives').select('*').eq('code', mandateCode).maybeSingle()
  const result = await query
  if (result.error) throw result.error
  if (!result.data) throw new RevenueOsError('REVENUE_OS_MANDATE_NOT_FOUND', 'Mandat Revenue OS introuvable.', { status: 404 })
  return result.data
}

function objectiveForRun(row: any, actor: Actor, resourceManifest: string[] = []): RevenueObjective {
  const metadata = row.metadata || {}
  const margin = numberValue(metadata.minimumMarginPercent)
  const constraints = [
    ...list(metadata.capacityConstraints),
    ...resourceManifest.map((entry) => `Ressource Gemini gouvernée: ${entry}`),
    'Aucun effet externe sans approbation humaine.',
  ]
  return {
    id: String(row.id),
    tenantId: actor.tenantId,
    title: String(row.title),
    objectiveType: 'revenue_growth',
    businessReason: String(row.mandate),
    businessUnits: [String(row.business_unit || 'ANGELCARE')],
    targetMarkets: [String(row.target_market || 'Maroc')],
    targetSegments: list(metadata.targetSegments).length ? list(metadata.targetSegments) : ['Compte cible AngelCare'],
    territories: list(metadata.territories).length ? list(metadata.territories) : [String(row.target_market || 'Maroc')],
    targetAccounts: list(metadata.targetAccounts),
    revenueTarget: numberValue(metadata.revenueTargetDh),
    marginTarget: margin == null ? undefined : Math.min(1, margin > 1 ? margin / 100 : margin),
    timeHorizon: String(row.horizon || '90 jours'),
    deadline: text(metadata.dueDate) || undefined,
    priority: row.priority === 'medium' ? 'normal' : ['low','high','critical'].includes(row.priority) ? row.priority : 'high',
    budgetLimit: numberValue(metadata.budgetLimitDh),
    capacityLimit: undefined,
    approvedOffers: list(metadata.approvedOffers),
    excludedOffers: [],
    approvedChannels: list(metadata.approvedChannels).length ? list(metadata.approvedChannels) : ['email_os','internal_tasks','meetings','proposals'],
    excludedChannels: ['calendar'],
    riskAppetite: ['conservative','balanced','aggressive'].includes(metadata.riskAppetite) ? metadata.riskAppetite : 'balanced',
    authorityLevel: text(metadata.authorityLevel) || 'Direction générale',
    constraints,
    successDefinition: list(metadata.successCriteria).length ? list(metadata.successCriteria) : [`Résultat mesurable pour ${row.title}.`],
    failureDefinition: list(metadata.failureConditions).length ? list(metadata.failureConditions) : ['Aucune progression mesurable dans l’horizon défini.'],
    requestedBy: actor.id || actor.displayName,
    status: 'ready_for_assembly',
  }
}

async function runMandateOrResources(kind: ImportKind, body: any, actor: Actor, request: NextRequest) {
  const supabase = await createServiceClient()
  const objectiveRow = await objectiveByCode(supabase, text(body.mandateCode))
  let resourceManifest: string[] = []
  if (kind === 'gemini-resources') {
    const codes = Array.isArray(body.codes) ? body.codes.map(code) : []
    if (!codes.length) throw new RevenueOsError('REVENUE_OS_RESOURCE_REQUIRED', 'Sélectionnez au moins une ressource Gemini.', { status: 422 })
    const result = await (supabase as any).from('revenue_os_registry_entries')
      .select('code,version,purpose,content,status')
      .eq('tenant_id', actor.tenantId)
      .eq('registry', 'gemini-resource')
      .in('code', codes)
    if (result.error) throw result.error
    resourceManifest = (result.data || []).map((row: any) =>
      `${row.code}@${row.version} — ${row.content?.name || row.purpose}: ${row.content?.description || row.purpose}`,
    )
    if (!resourceManifest.length) throw new RevenueOsError('REVENUE_OS_RESOURCE_NOT_FOUND', 'Aucune ressource sélectionnée n’est disponible.', { status: 404 })
  }
  const objective = objectiveForRun(objectiveRow, actor, resourceManifest)
  const data = await runGeminiStrategyAssembly({
    objective,
    userId: actor.id || actor.displayName,
    idempotencyKey: request.headers.get('idempotency-key') || crypto.randomUUID(),
  })
  await writeRevenueOsAuditEvent({
    action: kind === 'mandates' ? 'mandate.gemini_run' : 'gemini_resource.run',
    actorId: actor.id,
    actorLabel: actor.displayName,
    actorType: 'user',
    resourceType: kind === 'mandates' ? 'revenue_os_objective' : 'revenue_os_gemini_resource',
    resourceId: String(objectiveRow.id),
    outcome: 'success',
    summary: `Run Gemini ${data.runId} lancé pour ${objectiveRow.code}.`,
    metadata: { runId: data.runId, resources: resourceManifest, strategyCount: data.strategies.length, externalActions: 0 },
  }, supabase)
  return data
}

async function runCommand(body: any, actor: Actor) {
  const commandCode = code(Array.isArray(body.codes) ? body.codes[0] : '')
  if (!commandCode) throw new RevenueOsError('REVENUE_OS_COMMAND_REQUIRED', 'Sélectionnez une commande.', { status: 422 })
  const context = body.context || {}
  const situation: RevenueCommandSituation = {
    id: `canonical-${Date.now()}`,
    tenantId: actor.tenantId,
    organizationId: actor.tenantId,
    businessUnit: text(context.businessUnit) || 'ANGELCARE',
    segment: text(context.segment) || undefined,
    territory: text(context.territory) || 'MA',
    commercialStage: text(context.commercialStage) || 'qualification',
    signalType: text(context.signalType) || 'manual.canonical.run',
    urgency: 7,
    opportunityValueDh: numberValue(context.opportunityValueDh) || 0,
    accountPriority: 5,
    actorId: actor.id,
    actorRole: actor.role,
    permissions: actor.permissions,
    executionMode: 'simulation',
    context: [
      { key: 'account', state: 'available', value: { code: 'MANUAL-ACCOUNT' }, observedAt: new Date().toISOString(), source: 'canonical-run-studio', reasons: ['Contexte manuel gouverné'] },
      { key: 'signal', state: 'available', value: { type: text(context.signalType) || 'manual' }, observedAt: new Date().toISOString(), source: 'canonical-run-studio', reasons: ['Signal manuel'] },
      { key: 'pipeline', state: 'available', value: { stage: text(context.commercialStage) || 'qualification' }, observedAt: new Date().toISOString(), source: 'canonical-run-studio', reasons: ['Étape fournie'] },
      { key: 'lastInteraction', state: 'available', value: { days: 7 }, observedAt: new Date().toISOString(), source: 'canonical-run-studio', reasons: ['Valeur de test'] },
      { key: 'offerCatalogue', state: 'available', value: { offers: 1 }, observedAt: new Date().toISOString(), source: 'digital-twin', reasons: ['Catalogue requis'] },
      { key: 'pricingRules', state: 'available', value: { status: 'approved' }, observedAt: new Date().toISOString(), source: 'doctrine-memory', reasons: ['Règles approuvées'] },
      { key: 'capacity', state: 'available', value: { status: 'conditional' }, observedAt: new Date().toISOString(), source: 'digital-twin', reasons: ['Capacité contrôlée'] },
      { key: 'margin', state: 'available', value: { status: 'protected' }, observedAt: new Date().toISOString(), source: 'digital-twin', reasons: ['Marge protégée'] },
      { key: 'authority', state: 'available', value: { level: 'director' }, observedAt: new Date().toISOString(), source: 'doctrine-memory', reasons: ['Autorité connue'] },
      { key: 'qualification', state: 'available', value: { score: 72 }, observedAt: new Date().toISOString(), source: 'kernel', reasons: ['Qualification contrôlée'] },
      { key: 'runPlan', state: 'available', value: { requestedCommandCode: commandCode }, observedAt: new Date().toISOString(), source: 'kernel', reasons: ['Commande explicitement demandée'] },
    ],
    metadata: { requestedCommandCode: commandCode, decisionMakerConfirmed: false },
  }
  const simulation = await simulateRevenueCommandSituation(situation)
  const supabase = await createServiceClient()
  await writeRevenueOsAuditEvent({
    action: 'command.shadow_run',
    actorId: actor.id,
    actorLabel: actor.displayName,
    actorType: 'user',
    resourceType: 'revenue_os_command',
    resourceId: commandCode,
    outcome: 'success',
    summary: `Simulation Shadow de ${commandCode} terminée.`,
    metadata: { commandCode, posture: simulation.posture, externalActions: 0 },
  }, supabase)
  return { requestedCommandCode: commandCode, simulation }
}

async function runDoctrine(body: any, actor: Actor) {
  const doctrineCode = code(Array.isArray(body.codes) ? body.codes[0] : '')
  const targetType = body.targetType === 'command' ? 'command' : 'mandate'
  const targetCode = code(body.targetCode)
  if (!doctrineCode || !targetCode) throw new RevenueOsError('REVENUE_OS_DOCTRINE_TARGET_REQUIRED', 'Doctrine et objet évalué requis.', { status: 422 })
  const supabase = await createServiceClient()
  const doctrineResult = await (supabase as any).from('revenue_os_doctrines').select('*').eq('code', doctrineCode).maybeSingle()
  if (doctrineResult.error) throw doctrineResult.error
  if (!doctrineResult.data) throw new RevenueOsError('REVENUE_OS_DOCTRINE_NOT_FOUND', 'Doctrine introuvable.', { status: 404 })

  const targetResult = targetType === 'command'
    ? await (supabase as any).from('revenue_os_command_definitions').select('*').eq('command_code', targetCode).maybeSingle()
    : await (supabase as any).from('revenue_os_objectives').select('*').eq('code', targetCode).maybeSingle()
  if (targetResult.error) throw targetResult.error
  if (!targetResult.data) throw new RevenueOsError('REVENUE_OS_DOCTRINE_TARGET_NOT_FOUND', 'Objet à évaluer introuvable.', { status: 404 })

  const doctrine = doctrineResult.data
  const target = targetResult.data
  const families = Array.isArray(doctrine.applicable_command_families) ? doctrine.applicable_command_families : []
  const businessUnits = Array.isArray(doctrine.business_unit_codes) ? doctrine.business_unit_codes : []
  const applicable = targetType === 'command'
    ? !families.length || families.includes(target.family_code)
    : !businessUnits.length || businessUnits.includes(target.business_unit)
  const authoritative = ['approved','effective'].includes(doctrine.status)
  const rules = Array.isArray(doctrine.rules) ? doctrine.rules : []
  const evaluation = {
    id: crypto.randomUUID(),
    doctrineCode,
    doctrineVersion: doctrine.version,
    doctrineStatus: doctrine.status,
    targetType,
    targetCode,
    applicable,
    authoritative,
    status: !applicable ? 'not-applicable' : authoritative ? 'eligible' : 'advisory-draft',
    appliedRules: applicable ? rules.length : 0,
    rules,
    prohibitedActions: doctrine.metadata?.prohibitedActions || [],
    requiredApprovals: doctrine.metadata?.requiredApprovals || [],
    evidenceRequirements: doctrine.evidence_refs || [],
    evaluatedAt: new Date().toISOString(),
    externalActions: 0,
  }
  await writeRevenueOsAuditEvent({
    action: 'doctrine.evaluated',
    actorId: actor.id,
    actorLabel: actor.displayName,
    actorType: 'user',
    resourceType: 'revenue_os_doctrine',
    resourceId: String(doctrine.id),
    outcome: applicable ? 'success' : 'blocked',
    summary: `${doctrineCode} évaluée contre ${targetType}:${targetCode}.`,
    metadata: evaluation,
  }, supabase)
  return { evaluation }
}

export async function GET(request: NextRequest) {
  try {
    const kind = asKind(request.nextUrl.searchParams.get('kind'))
    const actor = await actorFor(kind)
    return NextResponse.json({ ok: true, data: { kind, items: await listItems(kind, actor) } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Authentification requise.' } }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    const kind = asKind(body.kind)
    const actor = await actorFor(kind, body)
    const action = text(body.action)

    if (action === 'validate') {
      const rows = Array.isArray(body.rows) ? body.rows.slice(0, MAX_ROWS) : []
      if (!rows.length) throw new RevenueOsError('REVENUE_OS_IMPORT_EMPTY', 'Aucune ligne à valider.', { status: 422 })
      return NextResponse.json({ ok: true, data: await validateRows(kind, rows) })
    }

    if (action === 'import') {
      const rows = Array.isArray(body.rows) ? body.rows.slice(0, MAX_ROWS) : []
      if (!rows.length) throw new RevenueOsError('REVENUE_OS_IMPORT_EMPTY', 'Aucune ligne à importer.', { status: 422 })
      return NextResponse.json({ ok: true, data: await importRows(kind, rows, actor) }, { status: 201 })
    }

    if (action === 'run') {
      if (kind === 'mandates' || kind === 'gemini-resources') {
        requireRevenueOsPermission(actor, 'revenue_os.strategy.manage', 'Permission de génération stratégique requise.', ['revenue_os.manage', 'revenue_os.ai.generate'])
        return NextResponse.json({ ok: true, data: await runMandateOrResources(kind, body, actor, request) }, { status: 201 })
      }
      if (kind === 'commands') {
        requireRevenueOsPermission(actor, 'revenue_os.commands.simulate', 'Permission de simulation requise.', ['revenue_os.commands.manage', 'revenue_os.manage'])
        return NextResponse.json({ ok: true, data: await runCommand(body, actor) }, { status: 201 })
      }
      requireRevenueOsPermission(actor, 'revenue_os.knowledge.manage', 'Permission d’évaluation doctrinale requise.', ['revenue_os.manage'])
      return NextResponse.json({ ok: true, data: await runDoctrine(body, actor) }, { status: 201 })
    }

    throw new RevenueOsError('REVENUE_OS_CANONICAL_ACTION_INVALID', 'Action canonique non supportée.', { status: 400 })
  } catch (error) {
    return errorResponse(error)
  }
}

function errorResponse(error: unknown) {
  const normalized = normalizeRevenueOsError(error)
  return NextResponse.json({
    ok: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      recoverable: normalized.recoverable,
    },
  }, { status: normalized.status })
}
