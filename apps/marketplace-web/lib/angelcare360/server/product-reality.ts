import { createHash, randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { generateAngelcare360A4PdfBytes } from '@/lib/angelcare360/documents/pdf'
import { buildStudentReportCardA4Model } from '@/lib/angelcare360/documents/report-card'
import { compileTenantEntitlements } from '@/lib/angelcare360/operator/product-kernel'
import { requireAngelcare360OperatorPermission } from '@/lib/angelcare360/operator/access'
import { loadAngelcare360RuntimeEntitlements } from '@/lib/angelcare360/server/entitlements'
import { ANGELCARE360_PRODUCT_REALITY_OPERATIONS, ANGELCARE360_REALITY_POLICY_DEFAULTS, getProductRealityOperation } from '@/data/angelcare360/product-reality'
import { getAngelcare360RouteBinding } from '@/data/angelcare360/product-constitution'
import { isAngelcare360CapabilityEnabled, isAngelcare360FeatureEnabled, isAngelcare360ModuleEnabled, isAngelcare360OperationEnabled } from '@/lib/angelcare360/entitlements'
import { Angelcare360AccessError, getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server/context'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import type {
  ProductRealityCommandRequest,
  ProductRealityCommandResult,
  ProductRealityExecutionState,
  ProductRealityRuntimeGate,
  ProductRealitySnapshot,
  ProductRealityWorkerResult,
} from '@/types/angelcare360/product-reality'

export type ProductRealityRow = Record<string, unknown>
type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>

const REPORT_CARD_STORAGE_BUCKET = 'angelcare360-report-cards'

type ExecutionContext = {
  client: ServiceClient
  schoolId: string
  userId: string
  operationKey: string
  executionId: string
  request: ProductRealityCommandRequest
}

const DOMAIN_LABELS: Record<string, string> = {
  product: 'Produit & entitlements',
  institution: 'Établissements',
  academic_year: 'Années scolaires',
  people: 'Identité & personnes',
  guardian: 'Autorités guardians',
  student: 'Lifecycle élève',
  admissions: 'Admissions',
  attendance: 'Présence',
  timetable: 'Emploi du temps',
  curriculum: 'Programme & progression',
  homework: 'Devoirs & soumissions',
  assessment: 'Notes & moyennes',
  report_cards: 'Bulletins',
  capacity: 'Capacités',
}

function row(value: unknown): ProductRealityRow {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as ProductRealityRow : {}
}
function string(value: unknown, fallback = ''): string {
  return value === null || value === undefined ? fallback : String(value)
}
function optionalString(value: unknown): string | null {
  const valueString = string(value).trim()
  return valueString || null
}
function number(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
function boolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === 1 || value === '1') return true
  if (value === 'false' || value === 0 || value === '0') return false
  return fallback
}
function object(value: unknown): ProductRealityRow {
  return row(value)
}
function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}
function required(payload: ProductRealityRow, key: string, label: string): string {
  const value = optionalString(payload[key])
  if (!value) throw new Error(`${label} est requis.`)
  return value
}
function now() { return new Date().toISOString() }
function dateOnly(value = new Date()) { return value.toISOString().slice(0, 10) }
function stableHash(value: unknown) { return createHash('sha256').update(JSON.stringify(value)).digest('hex') }
function code(prefix: string) { return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}` }

async function safeCount(client: ServiceClient, table: string, schoolId: string, filters: Array<[string, unknown]> = []) {
  let query = client.from(table).select('id', { count: 'exact', head: true }).eq('school_id', schoolId)
  for (const [column, value] of filters) query = query.eq(column, value as never)
  const { count, error } = await query
  if (error) return 0
  return count || 0
}

async function safeRows(client: ServiceClient, table: string, schoolId: string, limit = 40) {
  const { data, error } = await client.from(table).select('*').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(limit)
  if (error) return [] as ProductRealityRow[]
  return (data || []) as ProductRealityRow[]
}

export async function requireProductRealityOperation(operationKey: string, options?: { entityId?: string | null; payload?: ProductRealityRow; allowApprovalRequired?: boolean }): Promise<ProductRealityRuntimeGate & { context: NonNullable<Awaited<ReturnType<typeof getAngelcare360AccessContext>>> }> {
  const definition = getProductRealityOperation(operationKey)
  if (!definition) throw new Angelcare360AccessError(`Opération produit inconnue: ${operationKey}.`, 400)
  const context = await requireAngelcare360Permission(definition.permissionKey)
  if (definition.operatorOnly) await requireAngelcare360OperatorPermission('operator.features.update')
  if (!context.school) throw new Angelcare360AccessError('Établissement actif introuvable.', 403)
  const runtime = context.runtimeEntitlements
  const moduleAllowed = isAngelcare360ModuleEnabled(runtime, definition.moduleKey)
  const capabilityAllowed = isAngelcare360CapabilityEnabled(runtime, definition.capabilityKey)
  const featureAllowed = isAngelcare360FeatureEnabled(runtime, definition.featureKey)
  const operationAllowed = isAngelcare360OperationEnabled(runtime, operationKey)
  let allowed = moduleAllowed && capabilityAllowed && featureAllowed && operationAllowed
  let reason: string | null = null
  if (!moduleAllowed) reason = runtime.restrictedModules.find((item) => item.key === definition.moduleKey)?.reason || `Le module ${definition.moduleKey} n’est pas actif.`
  else if (!capabilityAllowed) reason = runtime.restrictedCapabilities.find((item) => item.key === definition.capabilityKey)?.reason || `La capability ${definition.capabilityKey} n’est pas active.`
  else if (!featureAllowed) reason = runtime.restrictedFeatures.find((item) => item.key === definition.featureKey)?.reason || `La feature ${definition.featureKey} n’est pas active.`
  else if (!operationAllowed) reason = runtime.restrictedOperations.find((item) => item.key === operationKey)?.reason || `L’opération ${operationKey} est verrouillée.`

  const client = await createServiceClient()
  const { data: overrideGate } = await client
    .from('angelcare360_product_runtime_operation_gates')
    .select('state, reason, effective_from, effective_to')
    .eq('school_id', context.school.id)
    .eq('operation_key', operationKey)
    .eq('status', 'active')
    .order('priority', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (overrideGate) {
    const gate = row(overrideGate)
    const from = optionalString(gate.effective_from)
    const to = optionalString(gate.effective_to)
    const timestamp = Date.now()
    const effective = (!from || Date.parse(from) <= timestamp) && (!to || Date.parse(to) >= timestamp)
    if (effective && ['blocked', 'suspended'].includes(string(gate.state))) {
      allowed = false
      reason = optionalString(gate.reason) || `L’opération ${operationKey} est ${string(gate.state)}.`
    }
    if (effective && string(gate.state) === 'approval_required' && !options?.allowApprovalRequired) {
      allowed = false
      reason = optionalString(gate.reason) || `L’opération ${operationKey} exige une approbation.`
    }
  }

  let capacityState: ProductRealityRuntimeGate['capacityState'] = 'not_applicable'
  let allowance: number | null = null
  let usage: number | null = null
  let unit: string | null = null
  const payload = options?.payload || {}
  const meterKey = optionalString(payload.meterKey)
  if (meterKey) {
    const limit = runtime.limits.find((item) => item.key === meterKey)
    allowance = limit?.allowed ?? null
    usage = limit?.current ?? null
    unit = limit?.unit ?? null
    if (allowance === null || usage === null) capacityState = 'unknown'
    else if (usage >= allowance) capacityState = 'reached'
    else if (usage >= allowance * 0.8) capacityState = 'warning'
    else capacityState = 'available'
    if (capacityState === 'reached') {
      allowed = false
      reason = `Capacité ${meterKey} atteinte (${usage}/${allowance} ${unit || ''}).`
    }
  }

  if (!allowed) throw new Angelcare360AccessError(reason || 'Cette opération n’est pas autorisée pour ce tenant.', 403)
  return {
    allowed,
    operationKey,
    permissionKey: definition.permissionKey,
    moduleKey: definition.moduleKey,
    capabilityKey: definition.capabilityKey,
    featureKey: definition.featureKey,
    entitlementState: runtime.state,
    capacityState,
    reason,
    allowance,
    usage,
    unit,
    context,
  }
}

async function beginExecution(client: ServiceClient, schoolId: string, userId: string, request: ProductRealityCommandRequest) {
  const idempotencyKey = optionalString(request.idempotencyKey) || stableHash({ schoolId, operationKey: request.operationKey, entityId: request.entityId || null, payload: request.payload || {}, effectiveAt: request.effectiveAt || null })
  const { data: existing, error: existingError } = await client
    .from('angelcare360_product_reality_executions')
    .select('*')
    .eq('school_id', schoolId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  if (existingError) throw new Error(existingError.message)
  if (existing && ['completed', 'partially_failed'].includes(string((existing as ProductRealityRow).state))) {
    return { execution: existing as ProductRealityRow, replay: true }
  }
  if (existing) {
    const { data, error } = await client
      .from('angelcare360_product_reality_executions')
      .update({ state: 'validating', retry_count: number((existing as ProductRealityRow).retry_count) + 1, last_error: null, updated_at: now() })
      .eq('id', string((existing as ProductRealityRow).id))
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return { execution: data as ProductRealityRow, replay: false }
  }
  const { data, error } = await client
    .from('angelcare360_product_reality_executions')
    .insert({
      school_id: schoolId,
      operation_key: request.operationKey,
      entity_id: request.entityId || null,
      idempotency_key: idempotencyKey,
      state: 'validating',
      request_payload: request.payload || {},
      reason: request.reason || null,
      effective_at: request.effectiveAt || null,
      requested_by: userId,
      requested_at: now(),
      created_by: userId,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return { execution: data as ProductRealityRow, replay: false }
}

async function queueProductRealityApproval(input: {
  client: ServiceClient
  schoolId: string
  userId: string
  request: ProductRealityCommandRequest
}): Promise<ProductRealityCommandResult> {
  const definition = getProductRealityOperation(input.request.operationKey)
  if (!definition) throw new Error(`Opération produit inconnue: ${input.request.operationKey}.`)
  const idempotencyKey = optionalString(input.request.idempotencyKey) || stableHash({ schoolId: input.schoolId, operationKey: input.request.operationKey, entityId: input.request.entityId || null, payload: input.request.payload || {}, effectiveAt: input.request.effectiveAt || null })
  const { data: existingApproval, error: existingApprovalError } = await input.client
    .from('angelcare360_product_reality_approvals')
    .select('*')
    .eq('school_id', input.schoolId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  if (existingApprovalError) throw new Error(existingApprovalError.message)
  if (existingApproval) {
    const approval = existingApproval as ProductRealityRow
    const state = string(approval.decision) === 'rejected' ? 'cancelled' : string(approval.status) === 'resolved' ? 'completed' : 'requested'
    return {
      ok: state === 'completed',
      operationKey: input.request.operationKey,
      executionId: optionalString(approval.requested_execution_id),
      state: state as ProductRealityExecutionState,
      message: state === 'requested' ? 'Opération transmise pour approbation.' : `Approbation déjà ${string(approval.decision)}.`,
      record: approval,
      idempotentReplay: true,
    }
  }
  const { execution, replay } = await beginExecution(input.client, input.schoolId, input.userId, { ...input.request, idempotencyKey })
  const executionId = string(execution.id)
  if (replay) {
    const result = object(execution.result_payload)
    return { ok: true, operationKey: input.request.operationKey, executionId, state: string(execution.state, 'completed') as ProductRealityExecutionState, message: string(result.message, 'Opération déjà exécutée.'), record: row(result.record), records: array(result.records).map(row), idempotentReplay: true }
  }
  const requestPayload = {
    operationKey: input.request.operationKey,
    entityId: input.request.entityId || null,
    reason: input.request.reason || null,
    effectiveAt: input.request.effectiveAt || null,
    payload: input.request.payload || {},
  }
  const { data: approval, error: approvalError } = await input.client
    .from('angelcare360_product_reality_approvals')
    .insert({
      school_id: input.schoolId,
      operation_key: input.request.operationKey,
      entity_type: definition.domain,
      entity_id: input.request.entityId || null,
      decision: 'pending',
      reason: input.request.reason || null,
      request_payload: requestPayload,
      idempotency_key: idempotencyKey,
      requested_execution_id: executionId,
      requested_by: input.userId,
      requested_at: now(),
      status: 'open',
    })
    .select('*')
    .single()
  if (approvalError) {
    await completeExecution(input.client, executionId, 'failed', { message: approvalError.message }, approvalError.message)
    throw new Error(approvalError.message)
  }
  const approvalRow = approval as ProductRealityRow
  const result = { message: 'Opération transmise pour approbation.', approval_id: approvalRow.id, operation_key: input.request.operationKey }
  await input.client.from('angelcare360_product_reality_executions').update({ state: 'requested', result_payload: result, updated_at: now() }).eq('id', executionId)
  await recordAngelcare360AuditEventServer({
    category: 'product_reality',
    module: definition.moduleKey || definition.domain,
    action: 'product.approval.requested',
    schoolId: input.schoolId,
    entityType: 'angelcare360_product_reality_approvals',
    entityId: string(approvalRow.id),
    actorUserId: input.userId,
    metadata: { operation_key: input.request.operationKey, requested_execution_id: executionId },
  })
  return { ok: false, operationKey: input.request.operationKey, executionId, state: 'requested', message: 'Opération transmise pour approbation.', record: approvalRow }
}

async function completeExecution(client: ServiceClient, executionId: string, state: ProductRealityExecutionState, result: ProductRealityRow, errorMessage?: string | null) {
  const { error } = await client
    .from('angelcare360_product_reality_executions')
    .update({ state, result_payload: result, last_error: errorMessage || null, completed_at: ['completed', 'partially_failed', 'failed', 'compensated'].includes(state) ? now() : null, updated_at: now() })
    .eq('id', executionId)
  if (error) throw new Error(error.message)
}

async function audit(context: ExecutionContext, input: { entityType: string; entityId?: string | null; before?: ProductRealityRow; after?: ProductRealityRow; severity?: 'info' | 'warning' | 'critical'; metadata?: ProductRealityRow }) {
  const definition = getProductRealityOperation(context.operationKey)
  return recordAngelcare360AuditEventServer({
    category: 'product_reality',
    module: definition?.moduleKey || definition?.domain || 'administration',
    action: definition?.auditEvent || context.operationKey,
    schoolId: context.schoolId,
    entityType: input.entityType,
    entityId: input.entityId || null,
    severity: input.severity || 'info',
    beforeData: input.before || {},
    afterData: input.after || {},
    metadata: { execution_id: context.executionId, operation_key: context.operationKey, ...(input.metadata || {}) },
  })
}

async function getPolicy(client: ServiceClient, schoolId: string, key: string) {
  const { data } = await client
    .from('angelcare360_product_reality_policy_versions')
    .select('*')
    .eq('school_id', schoolId)
    .eq('policy_key', key)
    .eq('status', 'published')
    .lte('effective_from', now())
    .or(`effective_to.is.null,effective_to.gte.${now()}`)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (data) return data as ProductRealityRow
  const fallback = ANGELCARE360_REALITY_POLICY_DEFAULTS.find((item) => item.key === key)
  return fallback ? { policy_key: fallback.key, name: fallback.name, version_number: fallback.version, configuration: fallback.configuration, status: 'published', source: 'code_default' } : null
}

function assertTransition(policy: ProductRealityRow | null, from: string, to: string) {
  if (!policy) return
  const configuration = object(policy.configuration)
  const transitions = object(configuration.transitions)
  const allowed = array(transitions[from]).map(String)
  if (allowed.length && !allowed.includes(to)) throw new Error(`Transition interdite par ${string(policy.policy_key)}: ${from} → ${to}.`)
}


async function upsertStudentEnrollment(context: ExecutionContext, input: {
  studentId: string
  academicYearId: string
  classId?: unknown
  sectionId?: unknown
  lifecycleState: string
  sourceType: string
  sourceId?: string | null
  effectiveAt?: string | null
}) {
  const effectiveAt = input.effectiveAt || context.request.effectiveAt || now()
  const enrollmentCode = `ENR-${input.academicYearId.slice(0, 8)}-${input.studentId.slice(0, 8)}`
  const activeStatus = ['transferred', 'withdrawn', 'graduated', 'archived'].includes(input.lifecycleState)
    ? input.lifecycleState === 'archived' ? 'archived' : input.lifecycleState
    : 'active'
  const payload = {
    school_id: context.schoolId,
    student_id: input.studentId,
    academic_year_id: input.academicYearId,
    class_id: input.classId || null,
    section_id: input.sectionId || null,
    enrollment_code: enrollmentCode,
    lifecycle_state: input.lifecycleState,
    starts_on: effectiveAt.slice(0, 10),
    ends_on: activeStatus === 'active' ? null : effectiveAt.slice(0, 10),
    effective_from: effectiveAt,
    effective_to: activeStatus === 'active' ? null : effectiveAt,
    source_type: input.sourceType,
    source_id: input.sourceId || null,
    status: activeStatus,
    updated_by: context.userId,
    updated_at: now(),
    metadata_json: { execution_id: context.executionId },
  }
  const { data, error } = await context.client
    .from('angelcare360_student_enrollments')
    .upsert({ ...payload, created_by: context.userId }, { onConflict: 'school_id,student_id,academic_year_id' })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as ProductRealityRow
}

async function executePolicyPublish(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const policyKey = required(payload, 'policyKey', 'La policy')
  const domainKey = required(payload, 'domainKey', 'Le domaine')
  const configuration = object(payload.configuration)
  if (!Object.keys(configuration).length) throw new Error('La configuration de la policy est requise.')
  const { data: previous, error: readError } = await context.client
    .from('angelcare360_product_reality_policy_versions')
    .select('*')
    .eq('school_id', context.schoolId)
    .eq('policy_key', policyKey)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (readError) throw new Error(readError.message)
  const versionNumber = number((previous as ProductRealityRow | null)?.version_number) + 1
  if (previous && string((previous as ProductRealityRow).status) === 'published') {
    const { error } = await context.client.from('angelcare360_product_reality_policy_versions').update({ status: 'superseded', effective_to: context.request.effectiveAt || now(), updated_by: context.userId, updated_at: now() }).eq('id', string((previous as ProductRealityRow).id))
    if (error) throw new Error(error.message)
  }
  const { data, error } = await context.client.from('angelcare360_product_reality_policy_versions').insert({
    school_id: context.schoolId,
    policy_key: policyKey,
    domain_key: domainKey,
    name: string(payload.name, policyKey),
    version_number: versionNumber,
    configuration,
    status: 'published',
    effective_from: context.request.effectiveAt || now(),
    supersedes_policy_version_id: (previous as ProductRealityRow | null)?.id || null,
    published_by: context.userId,
    published_at: now(),
    created_by: context.userId,
    updated_by: context.userId,
  }).select('*').single()
  if (error) throw new Error(error.message)
  await audit(context, { entityType: 'angelcare360_product_reality_policy_versions', entityId: string((data as ProductRealityRow).id), before: row(previous), after: data as ProductRealityRow })
  return { message: `Policy ${policyKey} V${versionNumber} publiée.`, record: data as ProductRealityRow }
}

async function executeOperationGate(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const operationKey = required(payload, 'operationKey', 'L’opération')
  if (!getProductRealityOperation(operationKey)) throw new Error(`Opération inconnue: ${operationKey}.`)
  const state = string(payload.state, 'enabled')
  if (!['enabled', 'blocked', 'suspended', 'approval_required'].includes(state)) throw new Error(`État de gate invalide: ${state}.`)
  const effectiveFrom = string(payload.effectiveFrom, context.request.effectiveAt || now())
  const priority = number(payload.priority, 100)
  const { data, error } = await context.client.from('angelcare360_product_runtime_operation_gates').upsert({
    school_id: context.schoolId,
    operation_key: operationKey,
    state,
    reason: context.request.reason || optionalString(payload.reason),
    priority,
    effective_from: effectiveFrom,
    effective_to: payload.effectiveTo || null,
    status: string(payload.status, 'active'),
    created_by: context.userId,
    updated_by: context.userId,
    updated_at: now(),
  }, { onConflict: 'school_id,operation_key,priority,effective_from' }).select('*').single()
  if (error) throw new Error(error.message)
  await audit(context, { entityType: 'angelcare360_product_runtime_operation_gates', entityId: string((data as ProductRealityRow).id), after: data as ProductRealityRow })
  return { message: `Gate ${operationKey} configurée: ${state}.`, record: data as ProductRealityRow }
}

async function executeInstitutionTransition(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const schoolId = context.request.entityId || context.schoolId
  const target = required(payload, 'targetState', 'Le nouvel état')
  const { data: current, error } = await context.client.from('angelcare360_schools').select('*').eq('id', schoolId).single()
  if (error) throw new Error(error.message)
  const before = current as ProductRealityRow
  const from = string(before.metadata_json && object(before.metadata_json).reality_state, string(before.status, 'draft'))
  const policy = await getPolicy(context.client, context.schoolId, 'institution_lifecycle')
  assertTransition(policy, from, target)
  const blockers: string[] = []
  if (target === 'active') {
    const [years, classes, roles] = await Promise.all([
      safeCount(context.client, 'angelcare360_academic_years', context.schoolId, [['status', 'active']]),
      safeCount(context.client, 'angelcare360_classes', context.schoolId, [['status', 'active']]),
      safeCount(context.client, 'angelcare360_user_roles', context.schoolId, [['status', 'active']]),
    ])
    if (!years) blockers.push('Aucune année scolaire active.')
    if (!classes) blockers.push('Aucune classe active.')
    if (!roles) blockers.push('Aucun rôle utilisateur actif.')
  }
  if (blockers.length) return { message: 'Transition bloquée par la readiness.', record: before, blockers }
  const operationalStatus = target === 'active' ? 'active' : target === 'suspended' ? 'suspended' : target === 'archived' ? 'archived' : string(before.status)
  const metadata = { ...object(before.metadata_json), reality_state: target, reality_policy_version: number(policy?.version_number, 1), reality_effective_at: context.request.effectiveAt || now() }
  const { data, error: updateError } = await context.client.from('angelcare360_schools').update({ status: operationalStatus, metadata_json: metadata, updated_by: context.userId, updated_at: now() }).eq('id', schoolId).select('*').single()
  if (updateError) throw new Error(updateError.message)
  await context.client.from('angelcare360_institution_lifecycle_events').insert({ school_id: context.schoolId, institution_id: schoolId, from_state: from, to_state: target, reason: context.request.reason, policy_version: number(policy?.version_number, 1), effective_at: context.request.effectiveAt || now(), execution_id: context.executionId, actor_user_id: context.userId })
  await audit(context, { entityType: 'angelcare360_schools', entityId: schoolId, before, after: data as ProductRealityRow })
  return { message: `Établissement transitionné vers ${target}.`, record: data as ProductRealityRow, blockers: [] }
}

async function executeAcademicYearTransition(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const id = context.request.entityId || required(payload, 'academicYearId', "L'année scolaire")
  const target = required(payload, 'targetState', 'Le nouvel état')
  const { data: current, error } = await context.client.from('angelcare360_academic_years').select('*').eq('school_id', context.schoolId).eq('id', id).single()
  if (error) throw new Error(error.message)
  const before = current as ProductRealityRow
  const from = string(object(before.metadata_json).reality_state, string(before.status, 'draft'))
  const policy = await getPolicy(context.client, context.schoolId, 'academic_year_lifecycle')
  assertTransition(policy, from, target)
  if (target === 'active') {
    await context.client.from('angelcare360_academic_years').update({ is_current: false, updated_at: now() }).eq('school_id', context.schoolId).neq('id', id)
  }
  const operationalStatus = target === 'active' ? 'active' : target === 'closed' ? 'closed' : target === 'archived' ? 'archived' : target === 'published' ? 'planned' : string(before.status)
  const metadata = { ...object(before.metadata_json), reality_state: target, reality_policy_version: number(policy?.version_number, 1), reality_effective_at: context.request.effectiveAt || now() }
  const { data, error: updateError } = await context.client.from('angelcare360_academic_years').update({ status: operationalStatus, is_current: target === 'active', metadata_json: metadata, updated_by: context.userId, updated_at: now() }).eq('id', id).select('*').single()
  if (updateError) throw new Error(updateError.message)
  await context.client.from('angelcare360_academic_year_lifecycle_events').insert({ school_id: context.schoolId, academic_year_id: id, from_state: from, to_state: target, reason: context.request.reason, policy_version: number(policy?.version_number, 1), effective_at: context.request.effectiveAt || now(), execution_id: context.executionId, actor_user_id: context.userId })
  await audit(context, { entityType: 'angelcare360_academic_years', entityId: id, before, after: data as ProductRealityRow })
  return { message: `Année scolaire transitionnée vers ${target}.`, record: data as ProductRealityRow }
}

async function executeRolloverPreview(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const sourceYearId = required(payload, 'sourceAcademicYearId', "L'année source")
  const targetYearId = required(payload, 'targetAcademicYearId', "L'année cible")
  const { data: students, error } = await context.client.from('angelcare360_students').select('id,student_code,full_name,current_class_id,current_section_id,admission_status,status').eq('school_id', context.schoolId).eq('status', 'active').order('full_name')
  if (error) throw new Error(error.message)
  const { data: run, error: runError } = await context.client.from('angelcare360_academic_year_rollover_runs').upsert({ school_id: context.schoolId, source_academic_year_id: sourceYearId, target_academic_year_id: targetYearId, run_code: required(payload, 'runCode', 'Le code de rollover'), status: 'previewed', idempotency_key: string(context.request.idempotencyKey), requested_by: context.userId, requested_at: now(), execution_id: context.executionId, summary_json: { population: (students || []).length } }, { onConflict: 'school_id,run_code' }).select('*').single()
  if (runError) throw new Error(runError.message)
  const runId = string((run as ProductRealityRow).id)
  const defaultDecision = string(payload.defaultDecision, 'promote')
  const items = ((students || []) as ProductRealityRow[]).map((student) => ({ school_id: context.schoolId, rollover_run_id: runId, student_id: student.id, source_class_id: student.current_class_id, source_section_id: student.current_section_id, decision: defaultDecision, target_class_id: object(payload.classMap)[string(student.current_class_id)] || null, target_section_id: object(payload.sectionMap)[string(student.current_section_id)] || null, status: 'proposed', metadata_json: { student_code: student.student_code, student_name: student.full_name } }))
  if (items.length) {
    const proposals = items.map((item) => ({ ...item, updated_at: now() }))
    const { error: itemsError } = await context.client
      .from('angelcare360_academic_year_rollover_items')
      .upsert(proposals, { onConflict: 'rollover_run_id,student_id' })
    if (itemsError) throw new Error(itemsError.message)
  }
  await audit(context, { entityType: 'angelcare360_academic_year_rollover_runs', entityId: runId, after: { ...row(run), item_count: items.length } })
  return { message: `${items.length} proposition(s) de rollover préparée(s).`, record: row(run), records: items }
}

async function executeRollover(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const runId = context.request.entityId || required(payload, 'runId', 'Le rollover')
  const { data: run, error } = await context.client.from('angelcare360_academic_year_rollover_runs').select('*').eq('school_id', context.schoolId).eq('id', runId).single()
  if (error) throw new Error(error.message)
  const { data: items, error: itemsError } = await context.client.from('angelcare360_academic_year_rollover_items').select('*').eq('rollover_run_id', runId).in('status', ['proposed', 'approved'])
  if (itemsError) throw new Error(itemsError.message)
  const results: ProductRealityRow[] = []
  for (const item of (items || []) as ProductRealityRow[]) {
    const decision = string(item.decision)
    const update: ProductRealityRow = { updated_by: context.userId, updated_at: now() }
    if (['promote', 'repeat', 'transfer_class'].includes(decision)) {
      update.current_class_id = item.target_class_id || item.source_class_id
      update.current_section_id = item.target_section_id || item.source_section_id
      update.admission_status = 'enrolled'
      update.status = 'active'
    } else if (decision === 'withdraw') {
      update.admission_status = 'withdrawn'; update.status = 'inactive'; update.exit_date = dateOnly()
    } else if (decision === 'graduate') {
      update.admission_status = 'graduated'; update.status = 'inactive'; update.exit_date = dateOnly()
    } else if (decision === 'transfer_institution') {
      update.admission_status = 'transferred'; update.status = 'inactive'; update.exit_date = dateOnly()
    } else if (decision === 'suspend') {
      update.status = 'inactive'
    }
    const { data: student, error: updateError } = await context.client.from('angelcare360_students').update(update).eq('school_id', context.schoolId).eq('id', string(item.student_id)).select('*').single()
    if (updateError) {
      await context.client.from('angelcare360_academic_year_rollover_items').update({ status: 'failed', result_json: { error: updateError.message } }).eq('id', string(item.id))
      results.push({ id: item.id, status: 'failed', error: updateError.message })
      continue
    }
    const enrollment = await upsertStudentEnrollment(context, {
      studentId: string(item.student_id),
      academicYearId: string((run as ProductRealityRow).target_academic_year_id),
      classId: update.current_class_id,
      sectionId: update.current_section_id,
      lifecycleState: decision,
      sourceType: 'academic_year_rollover',
      sourceId: runId,
      effectiveAt: context.request.effectiveAt,
    })
    await context.client.from('angelcare360_student_lifecycle_events').insert({ school_id: context.schoolId, student_id: item.student_id, from_state: null, to_state: decision, reason: context.request.reason, effective_at: context.request.effectiveAt || now(), source_type: 'academic_year_rollover', source_id: runId, execution_id: context.executionId, actor_user_id: context.userId, after_snapshot: { student, enrollment } })
    await context.client.from('angelcare360_academic_year_rollover_items').update({ status: 'completed', result_json: student }).eq('id', string(item.id))
    results.push({ id: item.id, status: 'completed', student_id: item.student_id })
  }
  const failed = results.filter((item) => item.status === 'failed').length
  await context.client.from('angelcare360_academic_year_rollover_runs').update({ status: failed ? 'partially_failed' : 'completed', executed_by: context.userId, executed_at: now(), summary_json: { total: results.length, failed, completed: results.length - failed } }).eq('id', runId)
  await audit(context, { entityType: 'angelcare360_academic_year_rollover_runs', entityId: runId, before: row(run), after: { results } })
  return { message: failed ? `Rollover exécuté avec ${failed} échec(s).` : 'Rollover exécuté avec succès.', record: row(run), records: results, warnings: failed ? [`${failed} élément(s) nécessitent une réparation.`] : [] }
}

function normalizeIdentity(value: unknown) {
  return string(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

async function synchronizePersonMasters(context: ExecutionContext) {
  const [students, parents, staff] = await Promise.all([
    context.client.from('angelcare360_students').select('*').eq('school_id', context.schoolId),
    context.client.from('angelcare360_parents').select('*').eq('school_id', context.schoolId),
    context.client.from('angelcare360_staff').select('*').eq('school_id', context.schoolId),
  ])
  for (const result of [students, parents, staff]) if (result.error) throw new Error(result.error.message)
  const sources: Array<{ type: string; record: ProductRealityRow }> = [
    ...((students.data || []) as ProductRealityRow[]).map((record) => ({ type: 'student', record })),
    ...((parents.data || []) as ProductRealityRow[]).map((record) => ({ type: 'parent', record })),
    ...((staff.data || []) as ProductRealityRow[]).map((record) => ({ type: 'staff', record })),
  ]
  const records: ProductRealityRow[] = []
  for (const source of sources) {
    const sourceId = string(source.record.id)
    const { data: existing } = await context.client.from('angelcare360_people_master').select('*').eq('school_id', context.schoolId).eq('source_type', source.type).eq('source_id', sourceId).maybeSingle()
    const identity = {
      school_id: context.schoolId,
      person_code: string(source.record.student_code || source.record.parent_code || source.record.staff_code || sourceId),
      full_name: string(source.record.full_name),
      first_name: optionalString(source.record.first_name),
      last_name: optionalString(source.record.last_name),
      date_of_birth: source.record.date_of_birth || null,
      national_id: optionalString(source.record.national_id),
      email: optionalString(source.record.email),
      phone: optionalString(source.record.phone),
      normalized_name: normalizeIdentity(source.record.full_name),
      normalized_email: normalizeIdentity(source.record.email),
      normalized_phone: string(source.record.phone).replace(/\D+/g, ''),
      source_type: source.type,
      source_id: sourceId,
      status: string(source.record.status, 'active') === 'archived' ? 'archived' : 'active',
      updated_by: context.userId,
      updated_at: now(),
    }
    let master: ProductRealityRow
    if (existing) {
      const { data, error } = await context.client.from('angelcare360_people_master').update(identity).eq('id', string((existing as ProductRealityRow).id)).select('*').single()
      if (error) throw new Error(error.message)
      master = data as ProductRealityRow
    } else {
      const { data, error } = await context.client.from('angelcare360_people_master').insert({ ...identity, created_by: context.userId }).select('*').single()
      if (error) throw new Error(error.message)
      master = data as ProductRealityRow
    }
    const { error: linkError } = await context.client.from('angelcare360_person_role_links').upsert({ school_id: context.schoolId, person_id: master.id, role_type: source.type, role_record_id: sourceId, status: 'active', effective_from: source.record.created_at || now(), updated_by: context.userId, updated_at: now() }, { onConflict: 'school_id,role_type,role_record_id' })
    if (linkError) throw new Error(linkError.message)
    records.push(master)
  }
  await audit(context, { entityType: 'angelcare360_people_master', after: { synchronized: records.length } })
  return { message: `${records.length} identité(s) canonique(s) synchronisée(s).`, records }
}

async function scanDuplicates(context: ExecutionContext) {
  await synchronizePersonMasters(context)
  const { data: people, error } = await context.client.from('angelcare360_people_master').select('*').eq('school_id', context.schoolId).eq('status', 'active').order('created_at')
  if (error) throw new Error(error.message)
  const items = (people || []) as ProductRealityRow[]
  const cases: ProductRealityRow[] = []
  for (let leftIndex = 0; leftIndex < items.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < items.length; rightIndex += 1) {
      const left = items[leftIndex]
      const right = items[rightIndex]
      let score = 0
      const evidence: ProductRealityRow = {}
      if (left.national_id && right.national_id && normalizeIdentity(left.national_id) === normalizeIdentity(right.national_id)) { score += 70; evidence.national_id = left.national_id }
      if (left.normalized_email && right.normalized_email && left.normalized_email === right.normalized_email) { score += 35; evidence.email = left.email }
      if (left.normalized_phone && right.normalized_phone && left.normalized_phone === right.normalized_phone) { score += 25; evidence.phone = left.phone }
      if (left.normalized_name && right.normalized_name && left.normalized_name === right.normalized_name) { score += 30; evidence.full_name = left.full_name }
      if (left.date_of_birth && right.date_of_birth && left.date_of_birth === right.date_of_birth) { score += 20; evidence.date_of_birth = left.date_of_birth }
      if (score < 50) continue
      const pairKey = [string(left.id), string(right.id)].sort().join(':')
      const record = { school_id: context.schoolId, pair_key: pairKey, left_person_id: left.id, right_person_id: right.id, confidence_score: Math.min(score, 100), matching_evidence: evidence, conflicting_fields: {}, status: 'open', severity: score >= 90 ? 'critical' : 'warning', title: `Doublon potentiel · ${string(left.full_name)}`, detail: `${string(left.source_type)} ↔ ${string(right.source_type)}`, metadata_json: { scanner: 'product_reality_v1' }, created_by: context.userId }
      const { data, error: caseError } = await context.client.from('angelcare360_people_duplicate_cases').upsert(record, { onConflict: 'school_id,pair_key' }).select('*').single()
      if (caseError) throw new Error(caseError.message)
      cases.push(data as ProductRealityRow)
    }
  }
  await audit(context, { entityType: 'angelcare360_people_duplicate_cases', after: { scanned: items.length, cases: cases.length } })
  return { message: `${cases.length} cas de doublon documenté(s).`, records: cases }
}

async function executePersonMerge(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const survivorId = required(payload, 'survivorPersonId', 'La personne survivante')
  const sourceId = required(payload, 'sourcePersonId', 'La personne source')
  if (survivorId === sourceId) throw new Error('La personne source et la survivante doivent être différentes.')
  const { data: people, error } = await context.client.from('angelcare360_people_master').select('*').eq('school_id', context.schoolId).in('id', [survivorId, sourceId])
  if (error) throw new Error(error.message)
  const personRows = (people || []) as ProductRealityRow[]
  if (personRows.length !== 2) throw new Error('Les deux identités doivent appartenir au tenant actif.')
  const source = personRows.find((item) => string(item.id) === sourceId) as ProductRealityRow
  const survivor = personRows.find((item) => string(item.id) === survivorId) as ProductRealityRow
  const { data: sourceLinks, error: linksError } = await context.client.from('angelcare360_person_role_links').select('*').eq('school_id', context.schoolId).eq('person_id', sourceId).eq('status', 'active')
  if (linksError) throw new Error(linksError.message)
  const impact: ProductRealityRow[] = []
  for (const link of (sourceLinks || []) as ProductRealityRow[]) {
    const { error: upsertError } = await context.client.from('angelcare360_person_role_links').upsert({ school_id: context.schoolId, person_id: survivorId, role_type: link.role_type, role_record_id: link.role_record_id, status: 'active', effective_from: link.effective_from, metadata_json: { merged_from_person_id: sourceId }, updated_by: context.userId, updated_at: now() }, { onConflict: 'school_id,role_type,role_record_id' })
    if (upsertError) throw new Error(upsertError.message)
    impact.push({ role_type: link.role_type, role_record_id: link.role_record_id })
  }
  const { data: plan, error: planError } = await context.client.from('angelcare360_person_merge_plans').insert({ school_id: context.schoolId, survivor_person_id: survivorId, source_person_id: sourceId, reason: context.request.reason, impact_json: { role_links: impact }, status: 'executed', approved_by: context.userId, approved_at: now(), executed_by: context.userId, executed_at: now(), execution_id: context.executionId, created_by: context.userId }).select('*').single()
  if (planError) throw new Error(planError.message)
  await context.client.from('angelcare360_person_role_links').update({ status: 'merged', effective_to: now(), updated_by: context.userId, updated_at: now() }).eq('school_id', context.schoolId).eq('person_id', sourceId)
  await context.client.from('angelcare360_people_master').update({ status: 'merged', merged_into_person_id: survivorId, metadata_json: { ...object(source.metadata_json), merge_plan_id: (plan as ProductRealityRow).id }, updated_by: context.userId, updated_at: now() }).eq('id', sourceId)
  await context.client.from('angelcare360_people_duplicate_cases').update({ status: 'resolved', resolution: 'merged', resolution_reason: context.request.reason, resolved_at: now(), resolved_by: context.userId }).eq('school_id', context.schoolId).or(`left_person_id.eq.${sourceId},right_person_id.eq.${sourceId}`)
  await audit(context, { entityType: 'angelcare360_people_master', entityId: survivorId, before: source, after: survivor, metadata: { source_person_id: sourceId, merge_plan_id: (plan as ProductRealityRow).id } })
  return { message: 'Fusion canonique exécutée; rôles et historique préservés.', record: row(plan), records: impact }
}

async function executeGuardianAuthority(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const studentId = required(payload, 'studentId', "L'élève")
  const parentId = required(payload, 'parentId', 'Le parent ou guardian')
  const authorityType = required(payload, 'authorityType', "Le type d'autorité")
  const authority = {
    school_id: context.schoolId,
    student_id: studentId,
    parent_id: parentId,
    authority_type: authorityType,
    relationship_type: optionalString(payload.relationshipType),
    legal_guardian: boolean(payload.legalGuardian),
    custody_authority: boolean(payload.custodyAuthority),
    financial_responsibility: boolean(payload.financialResponsibility),
    communication_priority: number(payload.communicationPriority, 0),
    emergency_priority: number(payload.emergencyPriority, 0),
    pickup_authorized: boolean(payload.pickupAuthorized),
    restricted_contact: boolean(payload.restrictedContact),
    effective_from: payload.effectiveFrom || dateOnly(),
    effective_to: payload.effectiveTo || null,
    evidence_document_id: payload.evidenceDocumentId || null,
    restrictions_json: object(payload.restrictions),
    status: string(payload.status, 'active'),
    updated_by: context.userId,
    updated_at: now(),
  }
  const { data, error } = await context.client.from('angelcare360_guardian_authorities').upsert({ ...authority, created_by: context.userId }, { onConflict: 'school_id,student_id,parent_id,authority_type,effective_from' }).select('*').single()
  if (error) throw new Error(error.message)
  const { error: linkError } = await context.client.from('angelcare360_student_parent_links').upsert({ school_id: context.schoolId, student_id: studentId, parent_id: parentId, relationship_type: string(payload.relationshipType, 'guardian'), is_primary: number(payload.communicationPriority) === 1, is_guardian: boolean(payload.legalGuardian, true), can_pickup: boolean(payload.pickupAuthorized), can_receive_messages: !boolean(payload.restrictedContact), can_pay_fees: boolean(payload.financialResponsibility), status: string(payload.status, 'active'), updated_by: context.userId, updated_at: now() }, { onConflict: 'student_id,parent_id' })
  if (linkError) throw new Error(linkError.message)
  await audit(context, { entityType: 'angelcare360_guardian_authorities', entityId: string((data as ProductRealityRow).id), after: data as ProductRealityRow })
  return { message: 'Autorité guardian enregistrée et synchronisée.', record: data as ProductRealityRow }
}

async function executeStudentTransition(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const studentId = context.request.entityId || required(payload, 'studentId', "L'élève")
  const target = required(payload, 'targetState', 'Le nouvel état')
  const { data: current, error } = await context.client.from('angelcare360_students').select('*').eq('school_id', context.schoolId).eq('id', studentId).single()
  if (error) throw new Error(error.message)
  const before = current as ProductRealityRow
  const from = string(object(before.metadata_json).reality_state, string(before.admission_status, 'candidate'))
  const policy = await getPolicy(context.client, context.schoolId, 'student_lifecycle')
  const configuredStates = array(object(policy?.configuration).states).map(String)
  if (configuredStates.length && !configuredStates.includes(target)) throw new Error(`État élève non autorisé: ${target}.`)
  const update: ProductRealityRow = { metadata_json: { ...object(before.metadata_json), reality_state: target, reality_effective_at: context.request.effectiveAt || now() }, updated_by: context.userId, updated_at: now() }
  if (['candidate', 'pre_enrolled'].includes(target)) { update.admission_status = 'pending'; update.status = 'active' }
  if (['enrolled', 'active', 'promoted', 'repeating'].includes(target)) { update.admission_status = 'enrolled'; update.status = 'active'; update.current_class_id = payload.classId || before.current_class_id; update.current_section_id = payload.sectionId || before.current_section_id }
  if (target === 'transferred') { update.admission_status = 'transferred'; update.status = 'inactive'; update.exit_date = payload.effectiveDate || dateOnly() }
  if (target === 'withdrawn') { update.admission_status = 'withdrawn'; update.status = 'inactive'; update.exit_date = payload.effectiveDate || dateOnly() }
  if (target === 'graduated' || target === 'alumni') { update.admission_status = 'graduated'; update.status = target === 'alumni' ? 'archived' : 'inactive'; update.exit_date = payload.effectiveDate || dateOnly() }
  if (target === 'archived') update.status = 'archived'
  if (target === 'suspended') update.status = 'inactive'
  const { data, error: updateError } = await context.client.from('angelcare360_students').update(update).eq('id', studentId).select('*').single()
  if (updateError) throw new Error(updateError.message)
  let enrollment: ProductRealityRow | null = null
  const academicYearId = optionalString(payload.academicYearId)
  if (academicYearId) {
    enrollment = await upsertStudentEnrollment(context, {
      studentId,
      academicYearId,
      classId: update.current_class_id || before.current_class_id,
      sectionId: update.current_section_id || before.current_section_id,
      lifecycleState: target,
      sourceType: 'student_transition',
      sourceId: context.executionId,
      effectiveAt: context.request.effectiveAt,
    })
  } else if (['transferred','withdrawn','graduated','alumni','archived'].includes(target)) {
    await context.client.from('angelcare360_student_enrollments').update({ status: target === 'alumni' || target === 'archived' ? 'archived' : target, lifecycle_state: target, ends_on: dateOnly(), effective_to: context.request.effectiveAt || now(), updated_by: context.userId, updated_at: now() }).eq('school_id', context.schoolId).eq('student_id', studentId).eq('status', 'active')
  }
  await context.client.from('angelcare360_student_lifecycle_events').insert({ school_id: context.schoolId, student_id: studentId, from_state: from, to_state: target, reason: context.request.reason, effective_at: context.request.effectiveAt || now(), source_type: 'direct_transition', source_id: context.executionId, execution_id: context.executionId, actor_user_id: context.userId, before_snapshot: before, after_snapshot: { student: data, enrollment } })
  await audit(context, { entityType: 'angelcare360_students', entityId: studentId, before, after: data as ProductRealityRow })
  return { message: `Lifecycle élève transitionné vers ${target}.`, record: data as ProductRealityRow }
}

async function executeAdmissionTransition(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const applicationId = context.request.entityId || required(payload, 'applicationId', 'La candidature')
  const targetStage = required(payload, 'targetStage', "L'étape cible")
  const { data: current, error } = await context.client.from('angelcare360_admission_applications').select('*').eq('school_id', context.schoolId).eq('id', applicationId).single()
  if (error) throw new Error(error.message)
  const before = current as ProductRealityRow
  const policy = await getPolicy(context.client, context.schoolId, 'admission_workflow')
  const stages = array(object(policy?.configuration).stages).map(String)
  if (stages.length && !stages.includes(targetStage)) throw new Error(`Étape admission non autorisée: ${targetStage}.`)
  const statusMap: Record<string, string> = { accepted: 'approved', conditional_acceptance: 'in_review', waitlisted: 'waitlisted', rejected: 'rejected', converted: 'approved', closed: 'archived' }
  const nextStatus = statusMap[targetStage] || 'in_review'
  const { data, error: updateError } = await context.client.from('angelcare360_admission_applications').update({ application_stage: targetStage, status: nextStatus, decision_date: ['accepted', 'waitlisted', 'rejected', 'conditional_acceptance'].includes(targetStage) ? dateOnly() : before.decision_date, decision_reason: context.request.reason || before.decision_reason, updated_by: context.userId, updated_at: now(), metadata_json: { ...object(before.metadata_json), workflow_policy_version: number(policy?.version_number, 1) } }).eq('id', applicationId).select('*').single()
  if (updateError) throw new Error(updateError.message)
  await context.client.from('angelcare360_admission_status_history').insert({ school_id: context.schoolId, application_id: applicationId, from_status: before.application_stage || before.status, to_status: targetStage, note: context.request.reason, changed_by: context.userId, metadata_json: { execution_id: context.executionId, policy_version: number(policy?.version_number, 1) } })
  await context.client.from('angelcare360_admission_workflow_events').insert({ school_id: context.schoolId, application_id: applicationId, from_stage: before.application_stage, to_stage: targetStage, reason: context.request.reason, policy_version: number(policy?.version_number, 1), execution_id: context.executionId, actor_user_id: context.userId })
  await audit(context, { entityType: 'angelcare360_admission_applications', entityId: applicationId, before, after: data as ProductRealityRow })
  return { message: `Admission avancée vers ${targetStage}.`, record: data as ProductRealityRow }
}

async function executeAdmissionInterview(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const applicationId = context.request.entityId || required(payload, 'applicationId', 'La candidature')
  const interview = {
    school_id: context.schoolId,
    application_id: applicationId,
    interview_code: string(payload.interviewCode, code('INT')),
    scheduled_at: payload.scheduledAt || null,
    completed_at: payload.completedAt || null,
    interviewer_user_id: payload.interviewerUserId || context.userId,
    format: string(payload.format, 'in_person'),
    location: optionalString(payload.location),
    template_version_id: payload.templateVersionId || null,
    criteria_json: object(payload.criteria),
    outcome: optionalString(payload.outcome),
    recommendation: optionalString(payload.recommendation),
    notes: optionalString(payload.notes),
    status: string(payload.status, payload.completedAt ? 'completed' : 'scheduled'),
    updated_by: context.userId,
    updated_at: now(),
  }
  const { data, error } = await context.client.from('angelcare360_admission_interviews').upsert({ ...interview, created_by: context.userId }, { onConflict: 'school_id,interview_code' }).select('*').single()
  if (error) throw new Error(error.message)
  await audit(context, { entityType: 'angelcare360_admission_interviews', entityId: string((data as ProductRealityRow).id), after: data as ProductRealityRow })
  return { message: 'Entretien admission enregistré.', record: data as ProductRealityRow }
}

async function executeAdmissionDecision(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const applicationId = context.request.entityId || required(payload, 'applicationId', 'La candidature')
  const decision = required(payload, 'decision', 'La décision')
  const { data: application, error } = await context.client.from('angelcare360_admission_applications').select('*').eq('school_id', context.schoolId).eq('id', applicationId).single()
  if (error) throw new Error(error.message)
  const app = application as ProductRealityRow
  if (['accepted', 'conditional_acceptance'].includes(decision) && app.class_id) {
    const [{ count: enrolled }, { data: classRecord }] = await Promise.all([
      context.client.from('angelcare360_students').select('id', { count: 'exact', head: true }).eq('school_id', context.schoolId).eq('current_class_id', app.class_id).eq('status', 'active'),
      context.client.from('angelcare360_classes').select('capacity').eq('school_id', context.schoolId).eq('id', app.class_id).maybeSingle(),
    ])
    const capacity = number((classRecord as ProductRealityRow | null)?.capacity)
    if (capacity > 0 && number(enrolled) >= capacity) throw new Error('La classe demandée a atteint sa capacité opérationnelle.')
  }
  const { data, error: decisionError } = await context.client.from('angelcare360_admission_decisions').upsert({ school_id: context.schoolId, application_id: applicationId, decision, reason: context.request.reason, conditions_json: object(payload.conditions), evidence_json: object(payload.evidence), authority_user_id: context.userId, decision_at: now(), status: 'final', execution_id: context.executionId, updated_by: context.userId, updated_at: now(), created_by: context.userId }, { onConflict: 'school_id,application_id' }).select('*').single()
  if (decisionError) throw new Error(decisionError.message)
  await executeAdmissionTransition({ ...context, request: { ...context.request, entityId: applicationId, payload: { targetStage: decision } } })
  await createNotificationIntent(context, { intentType: 'admission_decision', entityType: 'admission_application', entityId: applicationId, recipientId: app.parent_id, templatePurpose: `admission.${decision}`, deduplicationKey: `admission:${applicationId}:decision:${decision}` })
  return { message: `Décision admission enregistrée: ${decision}.`, record: data as ProductRealityRow }
}

async function collectParentCandidates(context: ExecutionContext, input: { fullName: string; email: string | null; phone: string | null }) {
  const candidates = new Map<string, ProductRealityRow>()
  const collect = (rows: unknown) => {
    for (const candidate of (rows || []) as ProductRealityRow[]) candidates.set(string(candidate.id), candidate)
  }
  if (input.email) {
    const { data, error } = await context.client.from('angelcare360_parents').select('*').eq('school_id', context.schoolId).ilike('email', input.email).neq('status', 'archived').limit(10)
    if (error) throw new Error(error.message)
    collect(data)
  }
  if (input.phone) {
    const { data, error } = await context.client.from('angelcare360_parents').select('*').eq('school_id', context.schoolId).eq('phone', input.phone).neq('status', 'archived').limit(10)
    if (error) throw new Error(error.message)
    collect(data)
  }
  if (input.fullName) {
    const { data, error } = await context.client.from('angelcare360_parents').select('*').eq('school_id', context.schoolId).ilike('full_name', input.fullName).neq('status', 'archived').limit(10)
    if (error) throw new Error(error.message)
    collect(data)
  }
  return [...candidates.values()]
}

async function collectStudentCandidates(context: ExecutionContext, input: { fullName: string; dateOfBirth: string | null; nationalId: string | null }) {
  const candidates = new Map<string, ProductRealityRow>()
  const collect = (rows: unknown) => {
    for (const candidate of (rows || []) as ProductRealityRow[]) candidates.set(string(candidate.id), candidate)
  }
  if (input.nationalId) {
    const { data, error } = await context.client.from('angelcare360_students').select('*').eq('school_id', context.schoolId).eq('national_id', input.nationalId).neq('status', 'archived').limit(10)
    if (error) throw new Error(error.message)
    collect(data)
  }
  if (input.fullName) {
    let query = context.client.from('angelcare360_students').select('*').eq('school_id', context.schoolId).ilike('full_name', input.fullName).neq('status', 'archived')
    if (input.dateOfBirth) query = query.eq('date_of_birth', input.dateOfBirth)
    const { data, error } = await query.limit(10)
    if (error) throw new Error(error.message)
    collect(data)
  }
  return [...candidates.values()]
}

async function executeAdmissionConversion(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const applicationId = context.request.entityId || required(payload, 'applicationId', 'La candidature')
  const conversionIdempotencyKey = optionalString(context.request.idempotencyKey) || stableHash({ schoolId: context.schoolId, operation: context.operationKey, applicationId, payload })
  const { data: application, error } = await context.client.from('angelcare360_admission_applications').select('*,lead:angelcare360_admission_leads(*)').eq('school_id', context.schoolId).eq('id', applicationId).single()
  if (error) throw new Error(error.message)
  const app = application as ProductRealityRow
  const lead = Array.isArray(app.lead) ? row(app.lead[0]) : row(app.lead)

  const { data: existingRun, error: existingRunError } = await context.client
    .from('angelcare360_admission_conversion_runs')
    .select('*')
    .eq('school_id', context.schoolId)
    .eq('idempotency_key', conversionIdempotencyKey)
    .maybeSingle()
  if (existingRunError) throw new Error(existingRunError.message)
  if (existingRun && ['completed', 'succeeded'].includes(string((existingRun as ProductRealityRow).status))) {
    return { message: 'Conversion déjà exécutée; résultat précédent réutilisé.', record: existingRun as ProductRealityRow, replay: true }
  }

  let run: ProductRealityRow
  if (existingRun) {
    const { data, error: updateError } = await context.client.from('angelcare360_admission_conversion_runs').update({ status: 'running', severity: 'info', failure_json: null, requested_by: context.userId, started_at: now(), metadata_json: { ...object((existingRun as ProductRealityRow).metadata_json), execution_id: context.executionId, retry_at: now() }, updated_at: now() }).eq('id', string((existingRun as ProductRealityRow).id)).select('*').single()
    if (updateError) throw new Error(updateError.message)
    run = data as ProductRealityRow
  } else {
    const { data, error: runError } = await context.client.from('angelcare360_admission_conversion_runs').insert({ school_id: context.schoolId, application_id: applicationId, title: `Conversion ${string(app.application_code)}`, detail: 'Conversion admission vers élève, guardian et inscription.', status: 'running', severity: 'info', idempotency_key: conversionIdempotencyKey, started_at: now(), requested_by: context.userId, created_by: context.userId, result_json: {}, metadata_json: { execution_id: context.executionId }, updated_at: now() }).select('*').single()
    if (runError) throw new Error(runError.message)
    run = data as ProductRealityRow
  }

  const runId = string(run.id)
  const previousResult = object(run.result_json)
  let currentResult: ProductRealityRow = { ...previousResult }
  const createdRecords = object(run.created_records_json)
  const reusedRecords = object(run.reused_records_json)
  const updatedRecords = object(run.updated_records_json)
  const warnings = array(run.warnings_json).map(String)
  const checkpoint = async (result: ProductRealityRow) => {
    currentResult = { ...result }
    const { error: checkpointError } = await context.client.from('angelcare360_admission_conversion_runs').update({ result_json: result, created_records_json: createdRecords, reused_records_json: reusedRecords, updated_records_json: updatedRecords, warnings_json: warnings, metadata_json: { ...object(run.metadata_json), execution_id: context.executionId, last_checkpoint_at: now() }, updated_at: now() }).eq('id', runId)
    if (checkpointError) throw new Error(checkpointError.message)
  }

  try {
    let parentId = optionalString(previousResult.parent_id) || optionalString(app.parent_id) || optionalString(payload.parentId)
    if (parentId) {
      const { data: parent, error: parentError } = await context.client.from('angelcare360_parents').select('id').eq('school_id', context.schoolId).eq('id', parentId).maybeSingle()
      if (parentError) throw new Error(parentError.message)
      if (!parent) throw new Error('Le parent/guardian sélectionné n’appartient pas à ce tenant.')
      reusedRecords.parent_id = parentId
    } else {
      const parentName = string(payload.parentFullName || lead.parent_name).trim()
      if (!parentName) throw new Error('Le nom du guardian est requis pour créer le parent.')
      const parentEmail = optionalString(payload.parentEmail || lead.parent_email)
      const parentPhone = optionalString(payload.parentPhone || lead.parent_phone)
      const parentCandidates = await collectParentCandidates(context, { fullName: parentName, email: parentEmail, phone: parentPhone })
      if (parentCandidates.length > 1) throw new Error(`Conversion bloquée: ${parentCandidates.length} parents/guardians possibles. Résolvez le doublon avant conversion.`)
      if (parentCandidates.length === 1) {
        parentId = string(parentCandidates[0].id)
        reusedRecords.parent_id = parentId
        warnings.push('Parent/guardian existant réutilisé après contrôle d’identité.')
      } else {
        const parts = parentName.split(/\s+/)
        const { data: parent, error: parentError } = await context.client.from('angelcare360_parents').insert({ school_id: context.schoolId, parent_code: string(payload.parentCode, code('PAR')), first_name: string(payload.parentFirstName, parts[0] || parentName), last_name: string(payload.parentLastName, parts.slice(1).join(' ') || '-'), full_name: parentName, email: parentEmail, phone: parentPhone, status: 'active', created_by: context.userId, updated_by: context.userId }).select('*').single()
        if (parentError) throw new Error(parentError.message)
        parentId = string((parent as ProductRealityRow).id)
        createdRecords.parent_id = parentId
      }
    }
    await checkpoint({ ...previousResult, parent_id: parentId })

    let studentId = optionalString(previousResult.student_id) || optionalString(app.student_id) || optionalString(payload.studentId)
    if (studentId) {
      const { data: student, error: studentError } = await context.client.from('angelcare360_students').select('id').eq('school_id', context.schoolId).eq('id', studentId).maybeSingle()
      if (studentError) throw new Error(studentError.message)
      if (!student) throw new Error('L’élève sélectionné n’appartient pas à ce tenant.')
      reusedRecords.student_id = studentId
    } else {
      const studentName = string(payload.studentFullName || lead.student_full_name).trim()
      if (!studentName) throw new Error("Le nom de l'élève est requis pour la conversion.")
      const dateOfBirth = optionalString(payload.dateOfBirth)
      const nationalId = optionalString(payload.nationalId)
      const studentCandidates = await collectStudentCandidates(context, { fullName: studentName, dateOfBirth, nationalId })
      if (studentCandidates.length > 1) throw new Error(`Conversion bloquée: ${studentCandidates.length} élèves possibles. Résolvez le doublon avant conversion.`)
      if (studentCandidates.length === 1) {
        studentId = string(studentCandidates[0].id)
        reusedRecords.student_id = studentId
        warnings.push('Élève existant réutilisé après contrôle d’identité.')
      } else {
        const parts = studentName.split(/\s+/)
        const { data: student, error: studentError } = await context.client.from('angelcare360_students').insert({ school_id: context.schoolId, student_code: string(payload.studentCode, code('STU')), first_name: string(payload.studentFirstName, parts[0] || studentName), last_name: string(payload.studentLastName, parts.slice(1).join(' ') || '-'), full_name: studentName, date_of_birth: dateOfBirth, national_id: nationalId, current_class_id: payload.classId || app.class_id || null, current_section_id: payload.sectionId || app.section_id || null, admission_status: 'enrolled', status: 'active', admission_date: payload.admissionDate || dateOnly(), created_by: context.userId, updated_by: context.userId }).select('*').single()
        if (studentError) throw new Error(studentError.message)
        studentId = string((student as ProductRealityRow).id)
        createdRecords.student_id = studentId
      }
    }
    await checkpoint({ ...previousResult, parent_id: parentId, student_id: studentId })

    const { error: linkError } = await context.client.from('angelcare360_student_parent_links').upsert({ school_id: context.schoolId, student_id: studentId, parent_id: parentId, relationship_type: string(payload.relationshipType, 'guardian'), is_primary: true, is_guardian: true, can_pickup: boolean(payload.canPickup, true), can_receive_messages: boolean(payload.canReceiveMessages, true), can_pay_fees: boolean(payload.canPayFees, true), status: 'active', created_by: context.userId, updated_by: context.userId, updated_at: now() }, { onConflict: 'student_id,parent_id' })
    if (linkError) throw new Error(linkError.message)
    updatedRecords.relationship = `${studentId}:${parentId}`

    const { error: appError } = await context.client.from('angelcare360_admission_applications').update({ student_id: studentId, parent_id: parentId, class_id: payload.classId || app.class_id, section_id: payload.sectionId || app.section_id, application_stage: 'converted', status: 'approved', decision_date: app.decision_date || dateOnly(), updated_by: context.userId, updated_at: now() }).eq('school_id', context.schoolId).eq('id', applicationId)
    if (appError) throw new Error(appError.message)
    updatedRecords.application_id = applicationId

    const academicYearId = string(payload.academicYearId || app.academic_year_id)
    if (!academicYearId) throw new Error("L’année scolaire est requise pour créer l’inscription.")
    const enrollment = await upsertStudentEnrollment(context, { studentId, academicYearId, classId: payload.classId || app.class_id || null, sectionId: payload.sectionId || app.section_id || null, lifecycleState: 'enrolled', sourceType: 'admission_conversion', sourceId: applicationId, effectiveAt: context.request.effectiveAt })
    const result = { application_id: applicationId, student_id: studentId, parent_id: parentId, academic_year_id: academicYearId, class_id: payload.classId || app.class_id || null, section_id: payload.sectionId || app.section_id || null, enrollment_id: enrollment.id }
    await checkpoint(result)

    const { data: completedRun, error: completionError } = await context.client.from('angelcare360_admission_conversion_runs').update({ status: 'completed', severity: warnings.length ? 'warning' : 'success', completed_at: now(), resolved_by: context.userId, resolved_at: now(), result_json: result, created_records_json: createdRecords, reused_records_json: reusedRecords, updated_records_json: updatedRecords, warnings_json: warnings, failure_json: null, metadata_json: { ...object(run.metadata_json), execution_id: context.executionId, recoverable: true }, updated_at: now() }).eq('id', runId).select('*').single()
    if (completionError) throw new Error(completionError.message)
    await synchronizePersonMasters(context)
    await createNotificationIntent(context, { intentType: 'enrollment_confirmation', entityType: 'student', entityId: studentId, recipientId: parentId, templatePurpose: 'admission.converted', deduplicationKey: `admission:${applicationId}:converted` })
    await audit(context, { entityType: 'angelcare360_admission_conversion_runs', entityId: runId, after: result, metadata: { createdRecords, reusedRecords, updatedRecords, warnings } })
    return { message: 'Admission convertie en élève, guardian et inscription sans duplication.', record: completedRun as ProductRealityRow, records: [result], warnings }
  } catch (conversionError) {
    const message = conversionError instanceof Error ? conversionError.message : 'Échec de conversion admission.'
    await context.client.from('angelcare360_admission_conversion_runs').update({ status: 'failed', severity: 'critical', failure_json: { message, failed_at: now(), execution_id: context.executionId }, result_json: currentResult, created_records_json: createdRecords, reused_records_json: reusedRecords, updated_records_json: updatedRecords, warnings_json: warnings, metadata_json: { ...object(run.metadata_json), recoverable: true, last_failure_at: now() }, updated_at: now() }).eq('id', runId)
    throw conversionError
  }
}

async function isOperationalSchoolDay(client: ServiceClient, schoolId: string, academicYearId: string, sessionDate: string) {
  const day = new Date(`${sessionDate}T12:00:00Z`).getUTCDay() || 7
  const [{ data: dayRule }, { data: event }] = await Promise.all([
    client.from('angelcare360_school_day_rules').select('*').eq('school_id', schoolId).eq('academic_year_id', academicYearId).eq('day_of_week', day).eq('status', 'active').maybeSingle(),
    client.from('angelcare360_school_calendar_events').select('*').eq('school_id', schoolId).lte('starts_on', sessionDate).gte('ends_on', sessionDate).in('event_type', ['holiday', 'closure']).in('status', ['planned', 'published']).limit(1).maybeSingle(),
  ])
  if (event) return false
  if (!dayRule) return day <= 5
  return boolean((dayRule as ProductRealityRow).is_operational, true)
}

async function recalculateAttendanceSession(client: ServiceClient, sessionId: string, userId: string) {
  const { data: records, error } = await client.from('angelcare360_attendance_records').select('attendance_status').eq('attendance_session_id', sessionId).eq('status', 'active')
  if (error) throw new Error(error.message)
  const values = (records || []) as ProductRealityRow[]
  const counts = { total_present: 0, total_absent: 0, total_late: 0, total_excused: 0 }
  for (const item of values) {
    const status = string(item.attendance_status)
    if (status === 'present') counts.total_present += 1
    else if (status === 'late') counts.total_late += 1
    else if (['excused', 'authorized_absence', 'medical_absence'].includes(status)) counts.total_excused += 1
    else counts.total_absent += 1
  }
  await client.from('angelcare360_attendance_sessions').update({ ...counts, updated_by: userId, updated_at: now() }).eq('id', sessionId)
}

async function executePlannedAbsence(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const id = context.request.entityId || optionalString(payload.id)
  const studentId = required(payload, 'studentId', "L’élève")
  const academicYearId = required(payload, 'academicYearId', "L’année scolaire")
  const startsOn = required(payload, 'startsOn', 'La date de début')
  const endsOn = string(payload.endsOn, startsOn)
  if (endsOn < startsOn) throw new Error('La date de fin doit être postérieure à la date de début.')
  const record: ProductRealityRow = {
    school_id: context.schoolId,
    student_id: studentId,
    academic_year_id: academicYearId,
    starts_on: startsOn,
    ends_on: endsOn,
    reason: required(payload, 'reason', 'Le motif'),
    evidence_document_id: payload.evidenceDocumentId || null,
    approval_state: string(payload.approvalState, 'approved'),
    approved_by: string(payload.approvalState, 'approved') === 'approved' ? context.userId : null,
    approved_at: string(payload.approvalState, 'approved') === 'approved' ? now() : null,
    reconciliation_state: 'scheduled',
    requested_by: context.userId,
    execution_id: context.executionId,
    status: string(payload.status, 'active'),
    metadata_json: object(payload.metadata),
    updated_at: now(),
  }
  const result = id
    ? await context.client.from('angelcare360_planned_absences').update(record).eq('school_id', context.schoolId).eq('id', id).select('*').single()
    : await context.client.from('angelcare360_planned_absences').insert(record).select('*').single()
  if (result.error) throw new Error(result.error.message)
  if (string(record.approval_state) === 'approved') {
    const { data: sessions, error } = await context.client.from('angelcare360_attendance_sessions').select('id,status,session_date').eq('school_id', context.schoolId).eq('academic_year_id', academicYearId).gte('session_date', startsOn).lte('session_date', endsOn).in('status', ['open'])
    if (error) throw new Error(error.message)
    for (const session of (sessions || []) as ProductRealityRow[]) {
      const { data: attendance } = await context.client.from('angelcare360_attendance_records').select('*').eq('attendance_session_id', session.id).eq('student_id', studentId).maybeSingle()
      if (attendance) {
        const before = attendance as ProductRealityRow
        const { data: updated, error: updateError } = await context.client.from('angelcare360_attendance_records').update({ attendance_status: 'authorized_absence', justification_required: false, note: string(payload.note, 'Absence planifiée approuvée.'), updated_by: context.userId, updated_at: now(), metadata_json: { ...object(before.metadata_json), planned_absence_id: (result.data as ProductRealityRow).id } }).eq('id', before.id).select('*').single()
        if (updateError) throw new Error(updateError.message)
        await context.client.from('angelcare360_attendance_status_history').insert({ school_id: context.schoolId, attendance_record_id: before.id, from_status: before.attendance_status, to_status: 'authorized_absence', changed_by: context.userId, note: 'Réconciliation absence planifiée.', metadata_json: { planned_absence_id: (result.data as ProductRealityRow).id, execution_id: context.executionId } })
        await recalculateAttendanceSession(context.client, string(session.id), context.userId)
        void updated
      }
    }
    await context.client.from('angelcare360_planned_absences').update({ reconciliation_state: 'reconciled', updated_at: now() }).eq('id', string((result.data as ProductRealityRow).id))
  }
  await audit(context, { entityType: 'angelcare360_planned_absences', entityId: string((result.data as ProductRealityRow).id), after: result.data as ProductRealityRow })
  return { message: 'Absence planifiée enregistrée et réconciliée avec les sessions ouvertes.', record: result.data as ProductRealityRow }
}

async function executeAttendanceMark(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const academicYearId = required(payload, 'academicYearId', "L'année scolaire")
  const classId = required(payload, 'classId', 'La classe')
  const studentId = required(payload, 'studentId', "L'élève")
  const sessionDate = string(payload.sessionDate, dateOnly())
  let status = optionalString(payload.attendanceStatus)
  if (!status) {
    const { data: planned } = await context.client.from('angelcare360_planned_absences').select('id').eq('school_id', context.schoolId).eq('student_id', studentId).eq('academic_year_id', academicYearId).eq('approval_state', 'approved').eq('status', 'active').lte('starts_on', sessionDate).gte('ends_on', sessionDate).limit(1).maybeSingle()
    if (planned) status = 'authorized_absence'
  }
  if (!status) throw new Error('Le statut de présence est requis.')
  const policy = await getPolicy(context.client, context.schoolId, 'attendance_calendar')
  const states = array(object(policy?.configuration).states).map(String)
  if (states.length && !states.includes(status)) throw new Error(`Statut de présence non configuré: ${status}.`)
  if (!(await isOperationalSchoolDay(context.client, context.schoolId, academicYearId, sessionDate))) throw new Error('Cette date n’est pas un jour scolaire opérationnel.')
  const { data: student, error: studentError } = await context.client.from('angelcare360_students').select('id,status,current_class_id,current_section_id').eq('school_id', context.schoolId).eq('id', studentId).single()
  if (studentError) throw new Error(studentError.message)
  if (string((student as ProductRealityRow).status) !== 'active') throw new Error("L'élève n'est pas actif.")
  let { data: session, error: sessionError } = await context.client.from('angelcare360_attendance_sessions').select('*').eq('school_id', context.schoolId).eq('academic_year_id', academicYearId).eq('class_id', classId).eq('section_id', payload.sectionId || null).eq('session_date', sessionDate).eq('session_type', string(payload.sessionType, 'daily')).maybeSingle()
  if (sessionError) throw new Error(sessionError.message)
  if (!session) {
    const { count: expected } = await context.client.from('angelcare360_students').select('id', { count: 'exact', head: true }).eq('school_id', context.schoolId).eq('current_class_id', classId).eq('status', 'active')
    const created = await context.client.from('angelcare360_attendance_sessions').insert({ school_id: context.schoolId, academic_year_id: academicYearId, class_id: classId, section_id: payload.sectionId || null, session_date: sessionDate, session_type: string(payload.sessionType, 'daily'), taken_by: context.userId, source: 'product_reality', total_expected: expected || 0, status: 'open', created_by: context.userId, updated_by: context.userId }).select('*').single()
    if (created.error) throw new Error(created.error.message)
    session = created.data
  }
  const sessionRow = session as ProductRealityRow
  if (['closed', 'locked'].includes(string(sessionRow.status))) throw new Error('La session est clôturée; une réouverture gouvernée est requise.')
  const recordPayload = { school_id: context.schoolId, attendance_session_id: sessionRow.id, student_id: studentId, attendance_status: status, check_in_at: payload.checkInAt || null, check_out_at: payload.checkOutAt || null, minutes_late: payload.minutesLate == null ? null : number(payload.minutesLate), marked_by: context.userId, mark_source: 'product_reality', note: optionalString(payload.note), justification_required: boolean(payload.justificationRequired, ['absent', 'late'].includes(status)), status: 'active', updated_by: context.userId, updated_at: now() }
  const { data: before } = await context.client.from('angelcare360_attendance_records').select('*').eq('attendance_session_id', sessionRow.id).eq('student_id', studentId).maybeSingle()
  const { data, error } = await context.client.from('angelcare360_attendance_records').upsert({ ...recordPayload, created_by: context.userId }, { onConflict: 'attendance_session_id,student_id' }).select('*').single()
  if (error) throw new Error(error.message)
  await context.client.from('angelcare360_attendance_status_history').insert({ school_id: context.schoolId, attendance_record_id: (data as ProductRealityRow).id, from_status: (before as ProductRealityRow | null)?.attendance_status || null, to_status: status, changed_by: context.userId, note: optionalString(payload.note), metadata_json: { execution_id: context.executionId } })
  await recalculateAttendanceSession(context.client, string(sessionRow.id), context.userId)
  await audit(context, { entityType: 'angelcare360_attendance_records', entityId: string((data as ProductRealityRow).id), before: row(before), after: data as ProductRealityRow })
  return { message: 'Présence enregistrée sur le record autoritaire.', record: data as ProductRealityRow }
}

async function executeAttendanceCorrectionRequest(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const recordId = context.request.entityId || required(payload, 'attendanceRecordId', 'Le record de présence')
  const { data: record, error } = await context.client.from('angelcare360_attendance_records').select('*').eq('school_id', context.schoolId).eq('id', recordId).single()
  if (error) throw new Error(error.message)
  const requestedState = object(payload.requestedState)
  if (!optionalString(requestedState.attendance_status)) throw new Error('Le statut corrigé est requis.')
  const { data, error: insertError } = await context.client.from('angelcare360_attendance_correction_requests').insert({ school_id: context.schoolId, title: string(payload.title, `Correction présence ${recordId}`), detail: optionalString(payload.detail), attendance_record_id: recordId, original_state: record, requested_state: requestedState, reason: context.request.reason || optionalString(payload.reason), evidence_json: object(payload.evidence), status: 'open', severity: string(payload.severity, 'info'), requested_by: context.userId, created_by: context.userId, metadata_json: { execution_id: context.executionId } }).select('*').single()
  if (insertError) throw new Error(insertError.message)
  await audit(context, { entityType: 'angelcare360_attendance_correction_requests', entityId: string((data as ProductRealityRow).id), after: data as ProductRealityRow })
  return { message: 'Demande de correction créée avec état avant/après.', record: data as ProductRealityRow }
}

async function executeAttendanceCorrectionApproval(context: ExecutionContext) {
  const requestId = context.request.entityId || required(object(context.request.payload), 'requestId', 'La correction')
  const { data: request, error } = await context.client.from('angelcare360_attendance_correction_requests').select('*').eq('school_id', context.schoolId).eq('id', requestId).single()
  if (error) throw new Error(error.message)
  const correction = request as ProductRealityRow
  if (string(correction.status) === 'applied') return { message: 'Correction déjà appliquée.', record: correction, replay: true }
  const recordId = required(correction, 'attendance_record_id', 'Le record de présence')
  const { data: before, error: readError } = await context.client.from('angelcare360_attendance_records').select('*').eq('school_id', context.schoolId).eq('id', recordId).single()
  if (readError) throw new Error(readError.message)
  const next = object(correction.requested_state)
  const allowed = ['attendance_status', 'check_in_at', 'check_out_at', 'minutes_late', 'note', 'justification_required']
  const update: ProductRealityRow = { updated_by: context.userId, updated_at: now(), status: 'active' }
  for (const key of allowed) if (next[key] !== undefined) update[key] = next[key]
  const { data, error: updateError } = await context.client.from('angelcare360_attendance_records').update(update).eq('id', recordId).select('*').single()
  if (updateError) throw new Error(updateError.message)
  await context.client.from('angelcare360_attendance_status_history').insert({ school_id: context.schoolId, attendance_record_id: recordId, from_status: (before as ProductRealityRow).attendance_status, to_status: (data as ProductRealityRow).attendance_status, changed_by: context.userId, note: correction.reason, metadata_json: { correction_request_id: requestId, execution_id: context.executionId } })
  await context.client.from('angelcare360_attendance_correction_requests').update({ status: 'applied', approved_by: context.userId, approved_at: now(), resolved_by: context.userId, resolved_at: now(), metadata_json: { ...object(correction.metadata_json), execution_id: context.executionId, applied_record_id: recordId }, updated_at: now() }).eq('id', requestId)
  const { data: recordSession } = await context.client.from('angelcare360_attendance_records').select('attendance_session_id').eq('id', recordId).single()
  if (recordSession) await recalculateAttendanceSession(context.client, string((recordSession as ProductRealityRow).attendance_session_id), context.userId)
  await audit(context, { entityType: 'angelcare360_attendance_records', entityId: recordId, before: before as ProductRealityRow, after: data as ProductRealityRow, metadata: { correction_request_id: requestId } })
  return { message: 'Correction approuvée et appliquée au record réel.', record: data as ProductRealityRow }
}

async function executeAttendanceClosure(context: ExecutionContext, reopen = false) {
  const payload = object(context.request.payload)
  const sessionDate = string(payload.sessionDate, dateOnly())
  const classId = optionalString(payload.classId)
  let query = context.client.from('angelcare360_attendance_sessions').select('*').eq('school_id', context.schoolId).eq('session_date', sessionDate)
  if (classId) query = query.eq('class_id', classId)
  const { data: sessions, error } = await query
  if (error) throw new Error(error.message)
  const rows = (sessions || []) as ProductRealityRow[]
  if (!rows.length) throw new Error('Aucune session de présence ne correspond à cette clôture.')
  if (!reopen) {
    const blockers: string[] = []
    for (const session of rows) {
      const { count } = await context.client.from('angelcare360_attendance_records').select('id', { count: 'exact', head: true }).eq('attendance_session_id', session.id).eq('status', 'active')
      if (number(count) < number(session.total_expected)) blockers.push(`${string(session.id)}: ${number(session.total_expected) - number(count)} élève(s) non marqué(s).`)
    }
    if (blockers.length) return { message: 'Clôture bloquée.', records: rows, blockers }
  }
  const target = reopen ? 'open' : 'locked'
  const { error: updateError } = await context.client.from('angelcare360_attendance_sessions').update({ status: target, updated_by: context.userId, updated_at: now(), metadata_json: { reality_execution_id: context.executionId, reality_reason: context.request.reason } }).in('id', rows.map((item) => item.id))
  if (updateError) throw new Error(updateError.message)
  const closureCode = string(payload.closureCode, `${sessionDate}:${classId || 'all'}`)
  const { data: closure, error: closureError } = await context.client.from('angelcare360_attendance_day_closures').upsert({ school_id: context.schoolId, closure_code: closureCode, closure_date: sessionDate, class_id: classId, title: reopen ? `Réouverture ${sessionDate}` : `Clôture ${sessionDate}`, detail: context.request.reason, status: reopen ? 'reopened' : 'closed', severity: 'success', blocker_count: 0, readiness_json: { sessions: rows.length }, requested_by: context.userId, requested_at: now(), approved_by: context.userId, approved_at: now(), reopened_by: reopen ? context.userId : null, reopened_at: reopen ? now() : null, reopen_reason: reopen ? context.request.reason : null, resolved_by: context.userId, resolved_at: now(), created_by: context.userId, metadata_json: { execution_id: context.executionId } }, { onConflict: 'school_id,closure_code' }).select('*').single()
  if (closureError) throw new Error(closureError.message)
  await audit(context, { entityType: 'angelcare360_attendance_day_closures', entityId: string((closure as ProductRealityRow).id), before: { sessions: rows }, after: { target } })
  return { message: reopen ? 'Présence rouverte avec audit.' : 'Présence clôturée et verrouillée côté serveur.', record: closure as ProductRealityRow, records: rows }
}

async function detectTimetableConflicts(client: ServiceClient, schoolId: string, candidate: ProductRealityRow, excludeId?: string | null) {
  let query = client.from('angelcare360_timetable_slots').select('*').eq('school_id', schoolId).eq('academic_year_id', candidate.academic_year_id).eq('day_of_week', candidate.day_of_week).neq('status', 'archived').lt('start_time', candidate.end_time as never).gt('end_time', candidate.start_time as never)
  if (excludeId) query = query.neq('id', excludeId)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return ((data || []) as ProductRealityRow[]).filter((slot) => slot.class_id === candidate.class_id || (candidate.staff_id && slot.staff_id === candidate.staff_id) || (candidate.room && slot.room === candidate.room))
}

async function executeTimetableSlot(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const id = context.request.entityId || optionalString(payload.id)
  const candidate: ProductRealityRow = {
    school_id: context.schoolId,
    academic_year_id: required(payload, 'academicYearId', "L'année scolaire"),
    class_id: required(payload, 'classId', 'La classe'),
    section_id: payload.sectionId || null,
    subject_id: required(payload, 'subjectId', 'La matière'),
    staff_id: payload.staffId || null,
    day_of_week: number(payload.dayOfWeek),
    start_time: required(payload, 'startTime', "L'heure de début"),
    end_time: required(payload, 'endTime', "L'heure de fin"),
    room: optionalString(payload.room),
    slot_type: string(payload.slotType, 'regular'),
    status: string(payload.status, 'active'),
    updated_by: context.userId,
    updated_at: now(),
  }
  if (number(candidate.day_of_week) < 1 || number(candidate.day_of_week) > 7) throw new Error('Le jour doit être compris entre 1 et 7.')
  if (string(candidate.start_time) >= string(candidate.end_time)) throw new Error("L'heure de fin doit être postérieure à l'heure de début.")
  const conflicts = await detectTimetableConflicts(context.client, context.schoolId, candidate, id)
  if (conflicts.length) {
    for (const conflict of conflicts) {
      await context.client.from('angelcare360_timetable_conflict_findings').insert({ school_id: context.schoolId, slot_id: id || null, conflict_type: conflict.class_id === candidate.class_id ? 'class_overlap' : conflict.staff_id === candidate.staff_id ? 'teacher_overlap' : 'room_overlap', title: 'Conflit emploi du temps', detail: `${candidate.start_time}-${candidate.end_time}`, status: 'open', severity: 'critical', related_slot_ids: [conflict.id], metadata_json: { candidate, execution_id: context.executionId } })
    }
    return { message: `${conflicts.length} conflit(s) bloquent le créneau.`, records: conflicts, blockers: conflicts.map((item) => `Conflit avec ${string(item.id)}.`) }
  }
  const result = id
    ? await context.client.from('angelcare360_timetable_slots').update(candidate).eq('school_id', context.schoolId).eq('id', id).select('*').single()
    : await context.client.from('angelcare360_timetable_slots').insert({ ...candidate, created_by: context.userId }).select('*').single()
  if (result.error) throw new Error(result.error.message)
  await audit(context, { entityType: 'angelcare360_timetable_slots', entityId: string((result.data as ProductRealityRow).id), after: result.data as ProductRealityRow })
  return { message: 'Créneau enregistré après résolution des contraintes.', record: result.data as ProductRealityRow }
}

async function executeTimetableArchive(context: ExecutionContext) {
  const id = context.request.entityId || required(object(context.request.payload), 'slotId', 'Le créneau')
  const { data: before, error } = await context.client.from('angelcare360_timetable_slots').select('*').eq('school_id', context.schoolId).eq('id', id).single()
  if (error) throw new Error(error.message)
  const { data, error: updateError } = await context.client.from('angelcare360_timetable_slots').update({ status: 'archived', updated_by: context.userId, updated_at: now(), metadata_json: { ...object((before as ProductRealityRow).metadata_json), archived_reason: context.request.reason, execution_id: context.executionId } }).eq('id', id).select('*').single()
  if (updateError) throw new Error(updateError.message)
  await audit(context, { entityType: 'angelcare360_timetable_slots', entityId: id, before: before as ProductRealityRow, after: data as ProductRealityRow })
  return { message: 'Créneau archivé avec historique.', record: data as ProductRealityRow }
}

async function executeTimetableSubstitute(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const slotId = context.request.entityId || required(payload, 'slotId', 'Le créneau')
  const substituteStaffId = required(payload, 'substituteStaffId', 'Le remplaçant')
  const effectiveFrom = required(payload, 'effectiveFrom', 'La date de début')
  const effectiveTo = string(payload.effectiveTo, effectiveFrom)
  const [{ data: slot, error: slotError }, { data: substitute, error: staffError }] = await Promise.all([
    context.client.from('angelcare360_timetable_slots').select('*').eq('school_id', context.schoolId).eq('id', slotId).single(),
    context.client.from('angelcare360_staff').select('id,status,staff_type,full_name').eq('school_id', context.schoolId).eq('id', substituteStaffId).single(),
  ])
  if (slotError) throw new Error(slotError.message)
  if (staffError) throw new Error(staffError.message)
  if (string((substitute as ProductRealityRow).status) !== 'active') throw new Error('Le remplaçant doit être actif.')
  const { data, error } = await context.client.from('angelcare360_timetable_substitute_assignments').upsert({
    school_id: context.schoolId,
    timetable_slot_id: slotId,
    original_staff_id: (slot as ProductRealityRow).staff_id || null,
    substitute_staff_id: substituteStaffId,
    effective_from: effectiveFrom,
    effective_to: effectiveTo,
    reason: context.request.reason || required(payload, 'reason', 'Le motif'),
    approval_state: 'approved',
    approved_by: context.userId,
    approved_at: now(),
    execution_id: context.executionId,
    status: 'active',
    created_by: context.userId,
    updated_by: context.userId,
    metadata_json: { substitute_name: (substitute as ProductRealityRow).full_name },
    updated_at: now(),
  }, { onConflict: 'school_id,timetable_slot_id,effective_from,effective_to' }).select('*').single()
  if (error) throw new Error(error.message)
  await audit(context, { entityType: 'angelcare360_timetable_substitute_assignments', entityId: string((data as ProductRealityRow).id), after: data as ProductRealityRow })
  return { message: 'Remplacement enseignant affecté sans altérer le planning historique.', record: data as ProductRealityRow }
}

async function executeTimetablePublication(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const academicYearId = required(payload, 'academicYearId', "L'année scolaire")
  const conflicts = await context.client.from('angelcare360_timetable_conflict_findings').select('id').eq('school_id', context.schoolId).eq('status', 'open')
  if (conflicts.error) throw new Error(conflicts.error.message)
  if ((conflicts.data || []).length) return { message: 'Publication bloquée par des conflits non résolus.', blockers: [`${(conflicts.data || []).length} conflit(s) ouvert(s).`] }
  const { data: slots, error } = await context.client.from('angelcare360_timetable_slots').select('*').eq('school_id', context.schoolId).eq('academic_year_id', academicYearId).eq('status', 'active').order('day_of_week').order('start_time')
  if (error) throw new Error(error.message)
  const snapshot = slots || []
  const signature = stableHash(snapshot)
  const { data: existing } = await context.client.from('angelcare360_timetable_publication_versions').select('*').eq('school_id', context.schoolId).eq('academic_year_id', academicYearId).eq('source_signature', signature).eq('status', 'published').maybeSingle()
  if (existing) return { message: 'Cette version d’emploi du temps est déjà publiée.', record: existing as ProductRealityRow, replay: true }
  const { data: previous } = await context.client.from('angelcare360_timetable_publication_versions').select('*').eq('school_id', context.schoolId).eq('academic_year_id', academicYearId).eq('status', 'published').order('version_number', { ascending: false }).limit(1).maybeSingle()
  const versionNumber = number((previous as ProductRealityRow | null)?.version_number) + 1
  const { data: version, error: versionError } = await context.client.from('angelcare360_timetable_publication_versions').insert({ school_id: context.schoolId, academic_year_id: academicYearId, version_number: versionNumber, version_code: `TT-${academicYearId.slice(0, 8)}-V${versionNumber}`, status: 'published', effective_from: context.request.effectiveAt || now(), source_signature: signature, slot_snapshot: snapshot, supersedes_version_id: (previous as ProductRealityRow | null)?.id || null, published_by: context.userId, published_at: now(), execution_id: context.executionId, created_by: context.userId }).select('*').single()
  if (versionError) throw new Error(versionError.message)
  if (previous) await context.client.from('angelcare360_timetable_publication_versions').update({ status: 'superseded', superseded_at: now() }).eq('id', string((previous as ProductRealityRow).id))
  const { data: run, error: runError } = await context.client.from('angelcare360_timetable_publication_runs').insert({ school_id: context.schoolId, title: `Publication emploi du temps V${versionNumber}`, academic_year_id: academicYearId, revision_code: string((version as ProductRealityRow).version_code), effective_at: context.request.effectiveAt || now(), status: 'published', severity: 'success', impact_json: { slots: snapshot.length }, conflict_count: 0, requested_by: context.userId, approved_by: context.userId, published_by: context.userId, published_at: now(), resolved_by: context.userId, resolved_at: now(), created_by: context.userId, metadata_json: { publication_version_id: (version as ProductRealityRow).id, execution_id: context.executionId } }).select('*').single()
  if (runError) throw new Error(runError.message)
  await audit(context, { entityType: 'angelcare360_timetable_publication_versions', entityId: string((version as ProductRealityRow).id), before: row(previous), after: version as ProductRealityRow })
  await createNotificationIntent(context, { intentType: 'timetable_publication', entityType: 'academic_year', entityId: academicYearId, recipientId: null, templatePurpose: 'timetable.published', deduplicationKey: `timetable:${academicYearId}:${signature}` })
  return { message: `Emploi du temps V${versionNumber} publié avec ${snapshot.length} créneau(x).`, record: version as ProductRealityRow, records: [run as ProductRealityRow] }
}

async function executeCurriculumUnit(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const id = context.request.entityId || optionalString(payload.id)
  const unit: ProductRealityRow = {
    school_id: context.schoolId,
    curriculum_version_id: required(payload, 'curriculumVersionId', 'La version curriculum'),
    unit_code: required(payload, 'unitCode', 'Le code unité'),
    title: required(payload, 'title', 'Le titre'),
    objective: optionalString(payload.objective),
    planned_order: number(payload.plannedOrder, 1),
    planned_hours: payload.plannedHours == null ? null : number(payload.plannedHours),
    status: string(payload.status, 'active'),
    metadata_json: { outcomes: array(payload.outcomes), sequence: object(payload.sequence), progression_weight: number(payload.progressionWeight, 1) },
    updated_by: context.userId,
    updated_at: now(),
  }
  const result = id
    ? await context.client.from('angelcare360_curriculum_units').update(unit).eq('school_id', context.schoolId).eq('id', id).select('*').single()
    : await context.client.from('angelcare360_curriculum_units').upsert({ ...unit, created_by: context.userId }, { onConflict: 'curriculum_version_id,unit_code' }).select('*').single()
  if (result.error) throw new Error(result.error.message)
  await audit(context, { entityType: 'angelcare360_curriculum_units', entityId: string((result.data as ProductRealityRow).id), after: result.data as ProductRealityRow })
  return { message: 'Unité curriculum enregistrée avec outcomes et poids de progression.', record: result.data as ProductRealityRow }
}

async function executeCurriculumPublication(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const id = context.request.entityId || required(payload, 'curriculumVersionId', 'La version programme')
  const { data: current, error } = await context.client.from('angelcare360_curriculum_versions').select('*').eq('school_id', context.schoolId).eq('id', id).single()
  if (error) throw new Error(error.message)
  const { data, error: updateError } = await context.client.from('angelcare360_curriculum_versions').update({ status: 'published', published_by: context.userId, published_at: now(), effective_from: context.request.effectiveAt || dateOnly(), updated_by: context.userId, updated_at: now() }).eq('id', id).select('*').single()
  if (updateError) throw new Error(updateError.message)
  await audit(context, { entityType: 'angelcare360_curriculum_versions', entityId: id, before: current as ProductRealityRow, after: data as ProductRealityRow })
  return { message: 'Version curriculum publiée.', record: data as ProductRealityRow }
}

async function executeSimpleTransition(context: ExecutionContext, table: string, allowedStates: string[], idLabel: string) {
  const payload = object(context.request.payload)
  const id = context.request.entityId || required(payload, 'id', idLabel)
  const target = required(payload, 'targetState', 'Le nouvel état')
  if (!allowedStates.includes(target)) throw new Error(`État non autorisé: ${target}.`)
  const { data: before, error } = await context.client.from(table).select('*').eq('school_id', context.schoolId).eq('id', id).single()
  if (error) throw new Error(error.message)
  const { data, error: updateError } = await context.client.from(table).update({ status: target, updated_by: context.userId, updated_at: now(), metadata_json: { ...object((before as ProductRealityRow).metadata_json), reality_execution_id: context.executionId, transition_reason: context.request.reason } }).eq('id', id).select('*').single()
  if (updateError) throw new Error(updateError.message)
  await audit(context, { entityType: table, entityId: id, before: before as ProductRealityRow, after: data as ProductRealityRow })
  return { message: `${idLabel} transitionné vers ${target}.`, record: data as ProductRealityRow }
}

async function getGradingPolicy(context: ExecutionContext, payload: ProductRealityRow) {
  const { data } = await context.client.from('angelcare360_grading_policy_versions').select('*').eq('school_id', context.schoolId).eq('status', 'published').or(`academic_year_id.is.null,academic_year_id.eq.${string(payload.academicYearId)}`).or(`subject_id.is.null,subject_id.eq.${string(payload.subjectId)}`).order('specificity', { ascending: false }).order('version_number', { ascending: false }).limit(1).maybeSingle()
  if (data) return data as ProductRealityRow
  const fallback = await getPolicy(context.client, context.schoolId, 'grading_policy')
  return { id: null, version_number: number(fallback?.version_number, 1), ...object(fallback?.configuration) }
}

async function executeGradeRecord(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const academicYearId = required(payload, 'academicYearId', "L'année scolaire")
  const studentId = required(payload, 'studentId', "L'élève")
  const subjectId = required(payload, 'subjectId', 'La matière')
  const score = number(payload.score, Number.NaN)
  const maxScore = number(payload.maxScore, 20)
  if (!Number.isFinite(score)) throw new Error('La note est invalide.')
  const policy = await getGradingPolicy(context, payload)
  const minimum = number(policy.minimum_score ?? policy.minimum, 0)
  const maximum = number(policy.maximum_score ?? policy.maximum, maxScore)
  if (score < minimum || score > maximum || score > maxScore) throw new Error(`La note doit être comprise entre ${minimum} et ${Math.min(maximum, maxScore)}.`)
  const uniqueFields = payload.examId ? { exam_id: payload.examId, assignment_id: null } : { assignment_id: payload.assignmentId || null, exam_id: null }
  let query = context.client.from('angelcare360_marks').select('*').eq('school_id', context.schoolId).eq('academic_year_id', academicYearId).eq('student_id', studentId).eq('subject_id', subjectId).eq('assessment_type', string(payload.assessmentType, payload.examId ? 'exam' : 'assignment'))
  if (payload.examId) query = query.eq('exam_id', payload.examId as never)
  else if (payload.assignmentId) query = query.eq('assignment_id', payload.assignmentId as never)
  const { data: before } = await query.maybeSingle()
  const mark = { school_id: context.schoolId, academic_year_id: academicYearId, student_id: studentId, subject_id: subjectId, ...uniqueFields, assessment_type: string(payload.assessmentType, payload.examId ? 'exam' : 'assignment'), score, max_score: maxScore, grade: optionalString(payload.grade), recorded_by_staff_id: payload.recordedByStaffId || null, recorded_at: now(), status: 'active', mark_state: string(payload.markState, 'entered'), updated_by: context.userId, updated_at: now(), metadata_json: { ...object((before as ProductRealityRow | null)?.metadata_json), grading_policy_id: policy.id || null, grading_policy_version: number(policy.version_number, 1), reality_execution_id: context.executionId } }
  const result = before
    ? await context.client.from('angelcare360_marks').update(mark).eq('id', string((before as ProductRealityRow).id)).select('*').single()
    : await context.client.from('angelcare360_marks').insert({ ...mark, created_by: context.userId }).select('*').single()
  if (result.error) throw new Error(result.error.message)
  await context.client.from('angelcare360_grade_revisions').insert({ school_id: context.schoolId, mark_id: (result.data as ProductRealityRow).id, revision_number: number((before as ProductRealityRow | null)?.metadata_json && object((before as ProductRealityRow).metadata_json).revision_number) + 1, before_snapshot: before || {}, after_snapshot: result.data, reason: context.request.reason || 'grade_record', policy_version_id: policy.id || null, execution_id: context.executionId, changed_by: context.userId })
  await audit(context, { entityType: 'angelcare360_marks', entityId: string((result.data as ProductRealityRow).id), before: row(before), after: result.data as ProductRealityRow })
  return { message: 'Note validée et enregistrée avec version de policy.', record: result.data as ProductRealityRow }
}

async function executeGradeCorrectionRequest(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const markId = context.request.entityId || required(payload, 'markId', 'La note')
  const { data: mark, error } = await context.client.from('angelcare360_marks').select('*').eq('school_id', context.schoolId).eq('id', markId).single()
  if (error) throw new Error(error.message)
  const requestedValue = number(payload.requestedValue, Number.NaN)
  if (!Number.isFinite(requestedValue)) throw new Error('La nouvelle note est invalide.')
  const { data, error: insertError } = await context.client.from('angelcare360_grade_correction_requests').insert({ school_id: context.schoolId, title: string(payload.title, `Correction note ${markId}`), detail: optionalString(payload.detail), mark_id: markId, student_id: (mark as ProductRealityRow).student_id, exam_id: (mark as ProductRealityRow).exam_id, original_value: (mark as ProductRealityRow).score, requested_value: requestedValue, reason: context.request.reason || optionalString(payload.reason), evidence_json: object(payload.evidence), status: 'open', severity: string(payload.severity, 'info'), requested_by: context.userId, created_by: context.userId, metadata_json: { execution_id: context.executionId } }).select('*').single()
  if (insertError) throw new Error(insertError.message)
  await audit(context, { entityType: 'angelcare360_grade_correction_requests', entityId: string((data as ProductRealityRow).id), after: data as ProductRealityRow })
  return { message: 'Demande de correction de note enregistrée.', record: data as ProductRealityRow }
}

async function recomputeAverages(context: ExecutionContext, payload: ProductRealityRow) {
  const academicYearId = required(payload, 'academicYearId', "L'année scolaire")
  const studentId = required(payload, 'studentId', "L'élève")
  let query = context.client.from('angelcare360_marks').select('*').eq('school_id', context.schoolId).eq('academic_year_id', academicYearId).eq('student_id', studentId).neq('status', 'archived')
  if (payload.subjectId) query = query.eq('subject_id', payload.subjectId as never)
  const { data: marks, error } = await query
  if (error) throw new Error(error.message)
  const markRows = (marks || []) as ProductRealityRow[]
  const bySubject = new Map<string, ProductRealityRow[]>()
  for (const mark of markRows) {
    const key = string(mark.subject_id)
    bySubject.set(key, [...(bySubject.get(key) || []), mark])
  }
  const results: ProductRealityRow[] = []
  for (const [subjectId, subjectMarks] of bySubject) {
    const inputs = subjectMarks.map((mark) => ({ id: mark.id, score: number(mark.score), max_score: number(mark.max_score, 20), normalized: number(mark.max_score, 20) ? number(mark.score) * 20 / number(mark.max_score, 20) : 0, coefficient: number(object(mark.metadata_json).coefficient, 1) }))
    const totalWeight = inputs.reduce((sum, item) => sum + item.coefficient, 0)
    const average = totalWeight ? inputs.reduce((sum, item) => sum + item.normalized * item.coefficient, 0) / totalWeight : 0
    const rounded = Math.round(average * 100) / 100
    const signature = stableHash(inputs)
    const { data: revision, error: revisionError } = await context.client.from('angelcare360_average_computation_revisions').insert({ school_id: context.schoolId, academic_year_id: academicYearId, term_id: payload.termId || null, class_id: payload.classId || null, student_id: studentId, subject_id: subjectId, formula_code: 'weighted_normalized_20', formula_version: 1, input_snapshot: { marks: inputs, total_weight: totalWeight }, result_snapshot: { average: rounded, provisional: boolean(payload.provisional, true), source_signature: signature }, rounding_rule: '2_decimals_half_up', status: boolean(payload.provisional, true) ? 'computed' : 'final', created_by: context.userId, execution_id: context.executionId }).select('*').single()
    if (revisionError) throw new Error(revisionError.message)
    results.push({ subject_id: subjectId, average: rounded, revision_id: (revision as ProductRealityRow).id, source_signature: signature })
  }
  await audit(context, { entityType: 'angelcare360_average_computation_revisions', entityId: null, after: { student_id: studentId, results } })
  return results
}

async function executeGradeCorrectionApproval(context: ExecutionContext) {
  const requestId = context.request.entityId || required(object(context.request.payload), 'requestId', 'La correction')
  const { data: request, error } = await context.client.from('angelcare360_grade_correction_requests').select('*').eq('school_id', context.schoolId).eq('id', requestId).single()
  if (error) throw new Error(error.message)
  const correction = request as ProductRealityRow
  if (string(correction.status) === 'applied') return { message: 'Correction de note déjà appliquée.', record: correction, replay: true }
  const markId = required(correction, 'mark_id', 'La note')
  const { data: before, error: markError } = await context.client.from('angelcare360_marks').select('*').eq('school_id', context.schoolId).eq('id', markId).single()
  if (markError) throw new Error(markError.message)
  const requestedValue = number(correction.requested_value, Number.NaN)
  const policy = await getGradingPolicy(context, { academicYearId: (before as ProductRealityRow).academic_year_id, subjectId: (before as ProductRealityRow).subject_id })
  const minimum = number(policy.minimum_score ?? policy.minimum, 0)
  const maximum = number(policy.maximum_score ?? policy.maximum, number((before as ProductRealityRow).max_score, 20))
  if (requestedValue < minimum || requestedValue > maximum) throw new Error(`Correction hors échelle ${minimum}-${maximum}.`)
  const { data, error: updateError } = await context.client.from('angelcare360_marks').update({ score: requestedValue, status: 'adjusted', mark_state: 'corrected', updated_by: context.userId, updated_at: now(), metadata_json: { ...object((before as ProductRealityRow).metadata_json), correction_request_id: requestId, reality_execution_id: context.executionId } }).eq('id', markId).select('*').single()
  if (updateError) throw new Error(updateError.message)
  await context.client.from('angelcare360_grade_revisions').insert({ school_id: context.schoolId, mark_id: markId, before_snapshot: before, after_snapshot: data, reason: correction.reason, policy_version_id: policy.id || null, correction_request_id: requestId, execution_id: context.executionId, changed_by: context.userId })
  const averages = await recomputeAverages(context, { academicYearId: (data as ProductRealityRow).academic_year_id, studentId: (data as ProductRealityRow).student_id, subjectId: (data as ProductRealityRow).subject_id, provisional: true })
  await context.client.from('angelcare360_report_cards').update({ status: 'draft', metadata_json: { stale_reason: 'grade_correction', correction_request_id: requestId, stale_at: now() }, updated_by: context.userId, updated_at: now() }).eq('school_id', context.schoolId).eq('academic_year_id', (data as ProductRealityRow).academic_year_id).eq('student_id', (data as ProductRealityRow).student_id).eq('status', 'published')
  await context.client.from('angelcare360_grade_correction_requests').update({ status: 'applied', approved_by: context.userId, approved_at: now(), resolved_by: context.userId, resolved_at: now(), metadata_json: { ...object(correction.metadata_json), execution_id: context.executionId, average_revisions: averages }, updated_at: now() }).eq('id', requestId)
  await audit(context, { entityType: 'angelcare360_marks', entityId: markId, before: before as ProductRealityRow, after: data as ProductRealityRow, metadata: { correction_request_id: requestId, average_revisions: averages } })
  return { message: 'Correction appliquée; moyennes recalculées et bulletins invalidés.', record: data as ProductRealityRow, records: averages }
}

async function executeAcademicValidation(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const batchId = context.request.entityId || required(payload, 'batchId', 'Le lot de validation')
  const { data: batch, error } = await context.client.from('angelcare360_academic_validation_batches').select('*').eq('school_id', context.schoolId).eq('id', batchId).single()
  if (error) throw new Error(error.message)
  const scope = batch as ProductRealityRow
  let marksQuery = context.client.from('angelcare360_marks').select('id,mark_state,status').eq('school_id', context.schoolId)
  if (scope.academic_year_id) marksQuery = marksQuery.eq('academic_year_id', scope.academic_year_id as never)
  const { data: marks, error: marksError } = await marksQuery
  if (marksError) throw new Error(marksError.message)
  const blockers = ((marks || []) as ProductRealityRow[]).filter((mark) => ['missing', 'correction_requested'].includes(string(mark.mark_state)))
  if (blockers.length) return { message: 'Validation bloquée par des notes incomplètes.', blockers: [`${blockers.length} note(s) bloquante(s).`] }
  const { data, error: updateError } = await context.client.from('angelcare360_academic_validation_batches').update({ status: 'approved', approved_by: context.userId, approved_at: now(), resolved_by: context.userId, resolved_at: now(), readiness_json: { marks: (marks || []).length, blockers: 0 }, updated_at: now() }).eq('id', batchId).select('*').single()
  if (updateError) throw new Error(updateError.message)
  await audit(context, { entityType: 'angelcare360_academic_validation_batches', entityId: batchId, before: scope, after: data as ProductRealityRow })
  return { message: 'Lot académique validé.', record: data as ProductRealityRow }
}

async function executeReportCardTemplateAssign(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const templateKey = required(payload, 'templateKey', 'Le template')
  const academicYearId = optionalString(payload.academicYearId)
  const classId = optionalString(payload.classId)
  let previousQuery = context.client
    .from('angelcare360_report_card_template_assignments')
    .select('*')
    .eq('school_id', context.schoolId)
    .eq('template_key', templateKey)
    .eq('status', 'published')
  previousQuery = academicYearId ? previousQuery.eq('academic_year_id', academicYearId) : previousQuery.is('academic_year_id', null)
  previousQuery = classId ? previousQuery.eq('class_id', classId) : previousQuery.is('class_id', null)
  const { data: previous, error: previousError } = await previousQuery
    .order('template_version', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (previousError) throw new Error(previousError.message)
  const version = number((previous as ProductRealityRow | null)?.template_version) + 1
  if (previous) await context.client.from('angelcare360_report_card_template_assignments').update({ status: 'superseded', effective_to: context.request.effectiveAt || now(), updated_by: context.userId, updated_at: now() }).eq('id', string((previous as ProductRealityRow).id))
  const { data, error } = await context.client.from('angelcare360_report_card_template_assignments').insert({
    school_id: context.schoolId,
    academic_year_id: academicYearId,
    class_id: classId,
    template_key: templateKey,
    template_version: version,
    configuration: object(payload.configuration),
    effective_from: context.request.effectiveAt || now(),
    status: 'published',
    published_by: context.userId,
    published_at: now(),
    created_by: context.userId,
    updated_by: context.userId,
  }).select('*').single()
  if (error) throw new Error(error.message)
  await audit(context, { entityType: 'angelcare360_report_card_template_assignments', entityId: string((data as ProductRealityRow).id), before: row(previous), after: data as ProductRealityRow })
  return { message: `Template bulletin ${templateKey} V${version} affecté.`, record: data as ProductRealityRow }
}

async function resolveReportCardTemplate(context: ExecutionContext, input: { academicYearId: string; classId: string }) {
  const { data, error } = await context.client
    .from('angelcare360_report_card_template_assignments')
    .select('*')
    .eq('school_id', context.schoolId)
    .eq('status', 'published')
    .order('template_version', { ascending: false })
  if (error) throw new Error(error.message)
  const timestamp = Date.now()
  const candidates = ((data || []) as ProductRealityRow[])
    .filter((item) => {
      const from = optionalString(item.effective_from)
      const to = optionalString(item.effective_to)
      return (!from || Date.parse(from) <= timestamp) && (!to || Date.parse(to) >= timestamp)
    })
    .filter((item) => !item.academic_year_id || string(item.academic_year_id) === input.academicYearId)
    .filter((item) => !item.class_id || string(item.class_id) === input.classId)
    .sort((left, right) => {
      const specificity = (item: ProductRealityRow) => (item.academic_year_id ? 2 : 0) + (item.class_id ? 4 : 0) + number(item.template_version) / 1000
      return specificity(right) - specificity(left)
    })
  return candidates[0] || null
}

async function storeReportCardPdf(context: ExecutionContext, input: { reportCardId: string; versionCode: string; bytes: Uint8Array }) {
  const storagePath = `${context.schoolId}/report-cards/${input.reportCardId}/${input.versionCode}.pdf`
  const { error } = await context.client.storage.from(REPORT_CARD_STORAGE_BUCKET).upload(storagePath, input.bytes, {
    contentType: 'application/pdf',
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) throw new Error(`Stockage immutable du bulletin impossible: ${error.message}`)
  return storagePath
}

async function removeStoredReportCardPdf(context: ExecutionContext, storagePath: string) {
  try {
    await context.client.storage.from(REPORT_CARD_STORAGE_BUCKET).remove([storagePath])
  } catch {
    // Best-effort compensation only; the original domain failure remains authoritative.
  }
}

async function buildReportCard(context: ExecutionContext, payload: ProductRealityRow) {
  const academicYearId = required(payload, 'academicYearId', "L'année scolaire")
  const studentId = required(payload, 'studentId', "L'élève")
  const classId = required(payload, 'classId', 'La classe')
  const termId = optionalString(payload.termId)
  const readinessPolicy = await getPolicy(context.client, context.schoolId, 'report_card_readiness')
  const readiness = object(readinessPolicy?.configuration)
  const template = await resolveReportCardTemplate(context, { academicYearId, classId })
  if (boolean(readiness.requireTemplate, true) && !template) throw new Error('Aucun template de bulletin publié ne couvre cette classe et cette année scolaire.')

  if (boolean(readiness.requireValidation, true)) {
    let validationQuery = context.client
      .from('angelcare360_academic_validation_batches')
      .select('id,status,approved_at,readiness_json')
      .eq('school_id', context.schoolId)
      .eq('academic_year_id', academicYearId)
      .eq('class_id', classId)
      .eq('status', 'approved')
    if (termId) validationQuery = validationQuery.eq('term_id', termId)
    else validationQuery = validationQuery.is('term_id', null)
    const { data: validation, error: validationError } = await validationQuery.order('approved_at', { ascending: false }).limit(1).maybeSingle()
    if (validationError) throw new Error(validationError.message)
    if (!validation) throw new Error('La validation académique requise n’est pas approuvée pour ce bulletin.')
  }

  if (boolean(readiness.requireAppreciations, false)) {
    let appreciationQuery = context.client
      .from('angelcare360_teacher_comments')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', context.schoolId)
      .eq('academic_year_id', academicYearId)
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('status', 'active')
    if (termId) appreciationQuery = appreciationQuery.eq('term_id', termId)
    else appreciationQuery = appreciationQuery.is('term_id', null)
    const { count, error: appreciationError } = await appreciationQuery
    if (appreciationError) throw new Error(appreciationError.message)
    if (!count) throw new Error('Les appréciations requises ne sont pas complètes.')
  }

  const averages = await recomputeAverages(context, { academicYearId, studentId, termId, classId, provisional: false })
  if (!averages.length) throw new Error('Aucune note ne permet de générer le bulletin.')
  const overall = Math.round((averages.reduce((sum, item) => sum + number(item.average), 0) / averages.length) * 100) / 100
  const reportCode = string(payload.reportCardCode, `BUL-${academicYearId.slice(0, 4)}-${studentId.slice(0, 8)}-${termId?.slice(0, 4) || 'AN'}`)
  const sourceSignature = stableHash({ averages, template: template ? { id: template.id, key: template.template_key, version: template.template_version, configuration: template.configuration } : null, readinessPolicy: readinessPolicy ? { id: readinessPolicy.id, version: readinessPolicy.version_number } : null })
  const { data: existing, error: existingError } = await context.client.from('angelcare360_report_cards').select('*').eq('school_id', context.schoolId).eq('report_card_code', reportCode).maybeSingle()
  if (existingError) throw new Error(existingError.message)
  const reportPayload = {
    school_id: context.schoolId,
    academic_year_id: academicYearId,
    student_id: studentId,
    class_id: classId,
    section_id: payload.sectionId || null,
    term_id: termId,
    report_card_code: reportCode,
    generated_on: dateOnly(),
    overall_average: overall,
    rank_position: payload.rankPosition || null,
    attendance_summary: optionalString(payload.attendanceSummary),
    status: 'draft',
    updated_by: context.userId,
    updated_at: now(),
    metadata_json: {
      source_signature: sourceSignature,
      average_revisions: averages,
      template_assignment_id: template?.id || null,
      template_key: template?.template_key || null,
      template_version: template?.template_version || null,
      readiness_policy_version_id: readinessPolicy?.id || null,
      reality_execution_id: context.executionId,
    },
  }
  const reportResult = existing
    ? await context.client.from('angelcare360_report_cards').update(reportPayload).eq('id', string((existing as ProductRealityRow).id)).select('*').single()
    : await context.client.from('angelcare360_report_cards').insert({ ...reportPayload, created_by: context.userId }).select('*').single()
  if (reportResult.error) throw new Error(reportResult.error.message)
  const report = reportResult.data as ProductRealityRow

  const { error: archiveLinesError } = await context.client
    .from('angelcare360_report_card_lines')
    .update({ status: 'archived', updated_by: context.userId, updated_at: now() })
    .eq('school_id', context.schoolId)
    .eq('report_card_id', report.id)
    .eq('status', 'active')
  if (archiveLinesError) throw new Error(archiveLinesError.message)
  const lines = averages.map((item) => ({ school_id: context.schoolId, report_card_id: report.id, subject_id: item.subject_id, mark_average: item.average, coefficient: 1, status: 'active', created_by: context.userId, updated_by: context.userId, metadata_json: { average_revision_id: item.revision_id, source_signature: sourceSignature } }))
  if (lines.length) {
    const { error: lineError } = await context.client.from('angelcare360_report_card_lines').insert(lines)
    if (lineError) throw new Error(lineError.message)
  }
  const { data: details, error: detailError } = await context.client.from('angelcare360_report_cards').select('*,student:angelcare360_students(*),class:angelcare360_classes(*),section:angelcare360_sections(*),term:angelcare360_terms(*),academic_year:angelcare360_academic_years(*)').eq('id', report.id).single()
  if (detailError) throw new Error(detailError.message)
  const model = buildStudentReportCardA4Model({ reportCard: { ...row(details), template_assignment: template }, lines, school: { id: context.schoolId } })
  const pdfBytes = await generateAngelcare360A4PdfBytes(model)
  const documentSignature = createHash('sha256').update(pdfBytes).digest('hex')

  const { data: identical, error: identicalError } = await context.client
    .from('angelcare360_report_card_document_versions')
    .select('*,document:angelcare360_documents(*)')
    .eq('school_id', context.schoolId)
    .eq('report_card_id', report.id)
    .eq('document_sha256', documentSignature)
    .in('status', ['generated', 'reviewed', 'approved', 'published'])
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (identicalError) throw new Error(identicalError.message)
  if (identical) return { report, lines, document: row((identical as ProductRealityRow).document), version: identical as ProductRealityRow, bytes: pdfBytes.length, replay: true }

  const { data: latestVersion, error: latestVersionError } = await context.client
    .from('angelcare360_report_card_document_versions')
    .select('id,version_number,status')
    .eq('school_id', context.schoolId)
    .eq('report_card_id', report.id)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (latestVersionError) throw new Error(latestVersionError.message)
  const versionNumber = number((latestVersion as ProductRealityRow | null)?.version_number) + 1
  const documentCode = `${reportCode}-V${versionNumber}`
  const storagePath = await storeReportCardPdf(context, { reportCardId: string(report.id), versionCode: documentCode, bytes: pdfBytes })
  const apiPath = `/api/angelcare360/product-reality/report-cards/${report.id}/pdf?version=${versionNumber}`
  const { data: document, error: documentError } = await context.client.from('angelcare360_documents').upsert({
    school_id: context.schoolId,
    document_code: documentCode,
    documentable_type: 'report_card',
    documentable_id: report.id,
    category: 'bulletin',
    title: `Bulletin ${string(row(details).student && row(row(details).student).full_name, reportCode)}`,
    file_name: `${documentCode}.pdf`,
    file_path: storagePath,
    storage_provider: `supabase_storage:${REPORT_CARD_STORAGE_BUCKET}`,
    mime_type: 'application/pdf',
    file_size_bytes: pdfBytes.length,
    visibility: 'restricted',
    status: 'active',
    uploaded_by: context.userId,
    created_by: context.userId,
    updated_by: context.userId,
    metadata_json: { sha256: documentSignature, source_signature: sourceSignature, version_number: versionNumber, api_path: apiPath, template_assignment_id: template?.id || null },
  }, { onConflict: 'school_id,document_code' }).select('*').single()
  if (documentError) {
    await removeStoredReportCardPdf(context, storagePath)
    throw new Error(documentError.message)
  }
  const { data: version, error: versionError } = await context.client.from('angelcare360_report_card_document_versions').insert({
    school_id: context.schoolId,
    report_card_id: report.id,
    document_id: (document as ProductRealityRow).id,
    version_number: versionNumber,
    version_code: documentCode,
    source_signature: sourceSignature,
    document_sha256: documentSignature,
    file_path: storagePath,
    storage_bucket: REPORT_CARD_STORAGE_BUCKET,
    file_size_bytes: pdfBytes.length,
    template_assignment_id: template?.id || null,
    template_version: template?.template_version || null,
    status: 'generated',
    supersedes_version_id: (latestVersion as ProductRealityRow | null)?.id || null,
    generated_by: context.userId,
    generated_at: now(),
    execution_id: context.executionId,
    created_by: context.userId,
  }).select('*').single()
  if (versionError) {
    await removeStoredReportCardPdf(context, storagePath)
    await context.client.from('angelcare360_documents').update({ status: 'archived', updated_by: context.userId, updated_at: now() }).eq('id', string((document as ProductRealityRow).id))
    throw new Error(versionError.message)
  }
  return { report, lines, document: document as ProductRealityRow, version: version as ProductRealityRow, bytes: pdfBytes.length, replay: false }
}

async function executeReportCardGenerate(context: ExecutionContext) {
  const generated = await buildReportCard(context, object(context.request.payload))
  await audit(context, { entityType: 'angelcare360_report_cards', entityId: string(generated.report.id), after: { report: generated.report, document_version: generated.version } })
  return { message: `Bulletin généré en PDF réel (${generated.bytes} octets).`, record: generated.report, records: [generated.document, generated.version] }
}

async function executeReportCardPublish(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const reportCardId = context.request.entityId || optionalString(payload.reportCardId)
  let report: ProductRealityRow
  let versions: ProductRealityRow[] = []
  if (reportCardId) {
    const { data, error } = await context.client.from('angelcare360_report_cards').select('*').eq('school_id', context.schoolId).eq('id', reportCardId).single()
    if (error) throw new Error(error.message)
    report = data as ProductRealityRow
  } else {
    const generated = await buildReportCard(context, payload)
    report = generated.report
    versions = [generated.version]
  }
  const { data: version, error: versionError } = await context.client.from('angelcare360_report_card_document_versions').select('*').eq('school_id', context.schoolId).eq('report_card_id', report.id).in('status', ['generated', 'reviewed', 'approved']).order('version_number', { ascending: false }).limit(1).maybeSingle()
  if (versionError) throw new Error(versionError.message)
  if (!version) throw new Error('Aucune version de document générée ne peut être publiée.')
  const currentVersion = version as ProductRealityRow
  const { data: publishedExisting } = await context.client.from('angelcare360_report_card_document_versions').select('*').eq('school_id', context.schoolId).eq('report_card_id', report.id).eq('document_sha256', currentVersion.document_sha256).eq('status', 'published').maybeSingle()
  if (publishedExisting) return { message: 'Ce bulletin identique est déjà publié.', record: publishedExisting as ProductRealityRow, replay: true }
  const { data: previous } = await context.client.from('angelcare360_report_card_document_versions').select('*').eq('school_id', context.schoolId).eq('report_card_id', report.id).eq('status', 'published').order('version_number', { ascending: false }).limit(1).maybeSingle()
  if (previous) await context.client.from('angelcare360_report_card_document_versions').update({ status: 'superseded', superseded_at: now() }).eq('id', string((previous as ProductRealityRow).id))
  const { data: published, error: publishError } = await context.client.from('angelcare360_report_card_document_versions').update({ status: 'published', approved_by: context.userId, approved_at: now(), published_by: context.userId, published_at: now(), supersedes_version_id: (previous as ProductRealityRow | null)?.id || currentVersion.supersedes_version_id }).eq('id', string(currentVersion.id)).select('*').single()
  if (publishError) throw new Error(publishError.message)
  const { data: updatedReport, error: reportError } = await context.client.from('angelcare360_report_cards').update({ status: 'published', updated_by: context.userId, updated_at: now(), metadata_json: { ...object(report.metadata_json), published_document_version_id: (published as ProductRealityRow).id, published_at: now() } }).eq('id', report.id).select('*').single()
  if (reportError) throw new Error(reportError.message)
  const runCode = string(payload.publicationCode, `PUB-${string(report.id).slice(0, 8)}-${string((published as ProductRealityRow).version_number)}`)
  const { data: run, error: runError } = await context.client.from('angelcare360_report_card_publication_runs').upsert({ school_id: context.schoolId, publication_code: runCode, title: `Publication ${string(report.report_card_code)}`, academic_year_id: report.academic_year_id, term_id: report.term_id, class_id: report.class_id, effective_at: context.request.effectiveAt || now(), status: 'published', severity: 'success', readiness_json: { report_card_id: report.id, document_version_id: (published as ProductRealityRow).id }, published_count: 1, blocked_count: 0, skipped_count: 0, requested_by: context.userId, approved_by: context.userId, published_by: context.userId, published_at: now(), resolved_by: context.userId, resolved_at: now(), created_by: context.userId, metadata_json: { execution_id: context.executionId } }, { onConflict: 'school_id,publication_code' }).select('*').single()
  if (runError) throw new Error(runError.message)
  await createNotificationIntent(context, { intentType: 'report_card_availability', entityType: 'report_card', entityId: string(report.id), recipientId: string(report.student_id), templatePurpose: 'report_card.published', deduplicationKey: `report_card:${report.id}:${(published as ProductRealityRow).document_sha256}` })
  await audit(context, { entityType: 'angelcare360_report_cards', entityId: string(report.id), before: report, after: updatedReport as ProductRealityRow, metadata: { document_version_id: (published as ProductRealityRow).id } })
  return { message: 'Bulletin publié avec version immutable et supersession historique.', record: updatedReport as ProductRealityRow, records: [...versions, published as ProductRealityRow, run as ProductRealityRow] }
}

async function createNotificationIntent(context: ExecutionContext, input: { intentType: string; entityType: string; entityId: string; recipientId: unknown; templatePurpose: string; deduplicationKey: string }) {
  const { error } = await context.client.from('angelcare360_notification_intents').upsert({ school_id: context.schoolId, intent_type: input.intentType, source_entity_type: input.entityType, source_entity_id: input.entityId, recipient_id: input.recipientId || null, template_purpose: input.templatePurpose, deduplication_key: input.deduplicationKey, status: 'pending', entitlement_state: 'eligible', requested_by: context.userId, requested_at: now(), metadata_json: { execution_id: context.executionId } }, { onConflict: 'school_id,deduplication_key' })
  if (error) throw new Error(error.message)
}

async function executeCapacityConsume(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const meterKey = required(payload, 'meterKey', 'Le meter')
  const quantity = number(payload.quantity, 1)
  const runtime = await loadAngelcare360RuntimeEntitlements({ userId: context.userId, schoolId: context.schoolId })
  const limit = runtime?.limits.find((item) => item.key === meterKey)
  if (!limit) throw new Error(`Meter ${meterKey} absent du snapshot effectif.`)
  const current = number(limit.current)
  const allowed = limit.allowed
  if (allowed !== null && current + quantity > allowed) throw new Error(`Capacité ${meterKey} dépassée: ${current + quantity}/${allowed}.`)
  const usage = current + quantity
  const { data, error } = await context.client.from('angelcare360_product_meter_consumption').upsert({ school_id: context.schoolId, tenant_id: runtime?.tenantId, meter_key: meterKey, current_value: usage, allowed_value: allowed, unit: limit.unit, status: allowed !== null && usage >= allowed ? 'reached' : allowed !== null && usage >= allowed * 0.8 ? 'warning' : 'active', measured_at: now(), source_entity_type: string(payload.sourceEntityType), source_entity_id: payload.sourceEntityId || null, updated_by: context.userId, updated_at: now() }, { onConflict: 'school_id,meter_key' }).select('*').single()
  if (error) throw new Error(error.message)
  await audit(context, { entityType: 'angelcare360_product_meter_consumption', entityId: string((data as ProductRealityRow).id), after: data as ProductRealityRow })
  return { message: `Capacité ${meterKey} consommée: ${usage}/${allowed ?? '∞'}.`, record: data as ProductRealityRow }
}

async function executeCapacityTopup(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const topupCode = required(payload, 'topupCode', 'Le top-up')
  const { data: tenant } = await context.client.from('angelcare360_operator_tenants').select('id,client_id').eq('school_id', context.schoolId).neq('status', 'archived').order('updated_at', { ascending: false }).limit(1).maybeSingle()
  if (!tenant) throw new Error('Tenant Operator lié introuvable.')
  const tenantRow = tenant as ProductRealityRow
  const { data: subscription } = await context.client.from('angelcare360_operator_subscriptions').select('*').eq('tenant_id', tenantRow.id).in('status', ['trial', 'active', 'past_due']).order('updated_at', { ascending: false }).limit(1).maybeSingle()
  if (!subscription) throw new Error('Abonnement actif introuvable.')
  const { data: offer, error: offerError } = await context.client.from('angelcare360_operator_topup_offers').select('*,meter:angelcare360_operator_product_meters(*)').eq('topup_code', topupCode).eq('status', 'published').single()
  if (offerError) throw new Error(offerError.message)
  const offerRow = offer as ProductRealityRow
  const meter = Array.isArray(offerRow.meter) ? row(offerRow.meter[0]) : row(offerRow.meter)
  const quantity = number(offerRow.increment) * Math.max(1, number(payload.multiplier, 1))
  const { data: assignment, error: assignmentError } = await context.client.from('angelcare360_operator_capacity_topups').insert({ tenant_id: tenantRow.id, subscription_id: (subscription as ProductRealityRow).id, meter_id: meter.id, quantity, starts_at: context.request.effectiveAt || now(), expires_at: payload.expiresAt || null, status: 'active', reason: context.request.reason }).select('*').single()
  if (assignmentError) throw new Error(assignmentError.message)
  const compilation = await compileTenantEntitlements(
    { clientId: tenantRow.client_id, tenantId: tenantRow.id, subscriptionId: (subscription as ProductRealityRow).id, packageVersionId: (subscription as ProductRealityRow).package_version_id },
    { actorUserId: context.userId, client: context.client, skipOperatorAudit: true },
  )
  await context.client.from('angelcare360_product_reality_provisioning_events').insert({ school_id: context.schoolId, tenant_id: tenantRow.id, operation_key: 'capacity.topup.activate', item_type: 'meter', item_key: string(meter.meter_key), requested_quantity: quantity, state: 'verified', source_assignment_id: (assignment as ProductRealityRow).id, entitlement_snapshot_id: row(compilation.snapshot).id, execution_id: context.executionId, requested_by: context.userId, verified_at: now() })
  await audit(context, { entityType: 'angelcare360_operator_capacity_topups', entityId: string((assignment as ProductRealityRow).id), after: { assignment, compilation } })
  return { message: `Top-up ${topupCode} activé et entitlement recompilé.`, record: assignment as ProductRealityRow, records: [row(compilation.snapshot)] }
}

async function executeApprovalDecision(context: ExecutionContext) {
  const payload = object(context.request.payload)
  const approvalId = context.request.entityId || required(payload, 'approvalId', "L’approbation")
  const decision = required(payload, 'decision', 'La décision')
  if (!['approved', 'rejected'].includes(decision)) throw new Error('La décision doit être approved ou rejected.')
  const { data: approvalValue, error: approvalError } = await context.client
    .from('angelcare360_product_reality_approvals')
    .select('*')
    .eq('school_id', context.schoolId)
    .eq('id', approvalId)
    .single()
  if (approvalError) throw new Error(approvalError.message)
  const approval = approvalValue as ProductRealityRow
  if (string(approval.status) === 'resolved') {
    return { message: `Approbation déjà ${string(approval.decision)}.`, record: approval, replay: true }
  }
  const originalOperation = required(approval, 'operation_key', "L’opération demandée")
  const definition = getProductRealityOperation(originalOperation)
  if (!definition || definition.operatorOnly || originalOperation === 'product.approval.decide') throw new Error('L’opération demandée ne peut pas être exécutée par ce flux d’approbation.')
  const requestedExecutionId = required(approval, 'requested_execution_id', "L’exécution demandée")
  const requestPayload = object(approval.request_payload)
  if (decision === 'rejected') {
    const decisionResult = { message: context.request.reason || 'Opération rejetée.', rejected_at: now(), rejected_by: context.userId }
    const { data, error } = await context.client.from('angelcare360_product_reality_approvals').update({ decision: 'rejected', reason: context.request.reason || approval.reason, decision_result: decisionResult, decided_by: context.userId, decided_at: now(), execution_id: context.executionId, status: 'resolved', updated_at: now() }).eq('id', approvalId).select('*').single()
    if (error) throw new Error(error.message)
    await completeExecution(context.client, requestedExecutionId, 'cancelled', decisionResult, string(decisionResult.message))
    await audit(context, { entityType: 'angelcare360_product_reality_approvals', entityId: approvalId, before: approval, after: data as ProductRealityRow, metadata: { requested_execution_id: requestedExecutionId, original_operation: originalOperation } })
    return { message: 'Opération rejetée et exécution annulée.', record: data as ProductRealityRow }
  }

  const originalRequest: ProductRealityCommandRequest = {
    operationKey: originalOperation,
    entityId: optionalString(requestPayload.entityId),
    idempotencyKey: optionalString(approval.idempotency_key),
    reason: optionalString(requestPayload.reason),
    effectiveAt: optionalString(requestPayload.effectiveAt),
    payload: object(requestPayload.payload),
  }
  await requireQueuedProductRealityOperation(context.client, originalOperation, context.schoolId, context.userId, object(originalRequest.payload), { approved: true })
  const { error: approveError } = await context.client.from('angelcare360_product_reality_approvals').update({ decision: 'approved', reason: context.request.reason || approval.reason, decided_by: context.userId, decided_at: now(), execution_id: context.executionId, status: 'approved', updated_at: now() }).eq('id', approvalId)
  if (approveError) throw new Error(approveError.message)
  await context.client.from('angelcare360_product_reality_executions').update({ state: 'approved', updated_at: now() }).eq('id', requestedExecutionId)
  try {
    await context.client.from('angelcare360_product_reality_executions').update({ state: 'executing', started_at: now(), updated_at: now() }).eq('id', requestedExecutionId)
    const originalContext: ExecutionContext = { client: context.client, schoolId: context.schoolId, userId: context.userId, operationKey: originalOperation, executionId: requestedExecutionId, request: originalRequest }
    const executed = object(await dispatch(originalContext))
    const blockers = array(executed.blockers).map(String)
    const warnings = array(executed.warnings).map(String)
    const state: ProductRealityExecutionState = blockers.length ? 'partially_failed' : 'completed'
    const resultPayload: ProductRealityRow = { message: string(executed.message), record: row(executed.record), records: array(executed.records), warnings, blockers, approved_by: context.userId, approval_id: approvalId }
    await completeExecution(context.client, requestedExecutionId, state, resultPayload)
    const { data: resolvedApproval, error: resolveError } = await context.client.from('angelcare360_product_reality_approvals').update({ status: 'resolved', decision_result: resultPayload, updated_at: now() }).eq('id', approvalId).select('*').single()
    if (resolveError) throw new Error(resolveError.message)
    await audit(context, { entityType: 'angelcare360_product_reality_approvals', entityId: approvalId, before: approval, after: resolvedApproval as ProductRealityRow, metadata: { requested_execution_id: requestedExecutionId, original_operation: originalOperation, result_state: state } })
    return { message: `Approbation exécutée: ${string(resultPayload.message)}`, record: resolvedApproval as ProductRealityRow, records: [row(resultPayload.record), ...array(resultPayload.records).map(row)], warnings, blockers }
  } catch (executionError) {
    const message = executionError instanceof Error ? executionError.message : 'Échec de l’opération approuvée.'
    await completeExecution(context.client, requestedExecutionId, 'failed', { message, approval_id: approvalId }, message).catch(() => undefined)
    await context.client.from('angelcare360_product_reality_approvals').update({ status: 'resolved', decision_result: { message, state: 'failed' }, updated_at: now() }).eq('id', approvalId)
    throw executionError
  }
}

async function dispatch(context: ExecutionContext) {
  switch (context.operationKey) {
    case 'product.policy.publish': return executePolicyPublish(context)
    case 'product.operation_gate.upsert': return executeOperationGate(context)
    case 'product.approval.decide': return executeApprovalDecision(context)
    case 'institution.transition': return executeInstitutionTransition(context)
    case 'academic_year.transition': return executeAcademicYearTransition(context)
    case 'academic_year.rollover.preview': return executeRolloverPreview(context)
    case 'academic_year.rollover.execute': return executeRollover(context)
    case 'person.identity.synchronize': return synchronizePersonMasters(context)
    case 'person.duplicates.scan': return scanDuplicates(context)
    case 'person.merge.execute': return executePersonMerge(context)
    case 'guardian.authority.upsert': return executeGuardianAuthority(context)
    case 'student.transition': return executeStudentTransition(context)
    case 'admission.transition': return executeAdmissionTransition(context)
    case 'admission.interview.record': return executeAdmissionInterview(context)
    case 'admission.decision.record': return executeAdmissionDecision(context)
    case 'admission.convert': return executeAdmissionConversion(context)
    case 'attendance.mark': return executeAttendanceMark(context)
    case 'attendance.planned_absence.upsert': return executePlannedAbsence(context)
    case 'attendance.correction.request': return executeAttendanceCorrectionRequest(context)
    case 'attendance.correction.approve': return executeAttendanceCorrectionApproval(context)
    case 'attendance.close': return executeAttendanceClosure(context, false)
    case 'attendance.reopen': return executeAttendanceClosure(context, true)
    case 'timetable.slot.upsert': return executeTimetableSlot(context)
    case 'timetable.slot.archive': return executeTimetableArchive(context)
    case 'timetable.publish': return executeTimetablePublication(context)
    case 'timetable.substitute.assign': return executeTimetableSubstitute(context)
    case 'curriculum.version.publish': return executeCurriculumPublication(context)
    case 'curriculum.unit.upsert': return executeCurriculumUnit(context)
    case 'lesson.transition': return executeSimpleTransition(context, 'angelcare360_lessons', ['planned', 'scheduled', 'delivered', 'partially_delivered', 'rescheduled', 'cancelled', 'completed', 'archived'], 'Le cours')
    case 'homework.transition': return executeSimpleTransition(context, 'angelcare360_assignments', ['draft', 'review', 'published', 'active', 'due', 'closed', 'review_in_progress', 'completed', 'archived'], 'Le devoir')
    case 'submission.transition': return executeSimpleTransition(context, 'angelcare360_assignment_submissions', ['expected', 'draft', 'not_submitted', 'submitted', 'late', 'returned', 'resubmission_requested', 'resubmitted', 'reviewed', 'completed', 'archived'], 'La soumission')
    case 'grade.record': return executeGradeRecord(context)
    case 'grade.correction.request': return executeGradeCorrectionRequest(context)
    case 'grade.correction.approve': return executeGradeCorrectionApproval(context)
    case 'average.recompute': return { message: 'Moyennes recalculées.', records: await recomputeAverages(context, object(context.request.payload)) }
    case 'academic.validation.complete': return executeAcademicValidation(context)
    case 'report_card.template.assign': return executeReportCardTemplateAssign(context)
    case 'report_card.generate': return executeReportCardGenerate(context)
    case 'report_card.publish': return executeReportCardPublish(context)
    case 'capacity.consume': return executeCapacityConsume(context)
    case 'capacity.topup.activate': return executeCapacityTopup(context)
    case 'product.entitlement.assert': return { message: 'Entitlement runtime validé.', record: { operation_key: context.operationKey } }
    default: throw new Error(`Opération non implémentée: ${context.operationKey}.`)
  }
}

async function executeResolvedProductRealityCommand(input: {
  request: ProductRealityCommandRequest
  client: ServiceClient
  schoolId: string
  userId: string
}): Promise<ProductRealityCommandResult> {
  const { request, client, schoolId, userId } = input
  const { execution, replay } = await beginExecution(client, schoolId, userId, request)
  const executionId = string(execution.id)
  if (replay) {
    const result = object(execution.result_payload)
    return { ok: true, operationKey: request.operationKey, executionId, state: string(execution.state, 'completed') as ProductRealityExecutionState, message: string(result.message, 'Opération déjà exécutée.'), record: row(result.record), records: array(result.records).map(row), warnings: array(result.warnings).map(String), blockers: array(result.blockers).map(String), idempotentReplay: true }
  }
  const executionContext: ExecutionContext = { client, schoolId, userId, operationKey: request.operationKey, executionId, request }
  try {
    await client.from('angelcare360_product_reality_executions').update({ state: 'executing', started_at: now(), updated_at: now() }).eq('id', executionId)
    const result = await dispatch(executionContext)
    const normalizedResult = object(result)
    const blockers = array(normalizedResult.blockers).map(String)
    const warnings = array(normalizedResult.warnings).map(String)
    const state: ProductRealityExecutionState = blockers.length ? 'partially_failed' : 'completed'
    const resultPayload: ProductRealityRow = { message: string(normalizedResult.message), record: row(normalizedResult.record), records: array(normalizedResult.records), warnings, blockers }
    await completeExecution(client, executionId, state, resultPayload)
    return { ok: !blockers.length, operationKey: request.operationKey, executionId, state, message: string(resultPayload.message), record: row(resultPayload.record), records: array(resultPayload.records).map(row), warnings, blockers, idempotentReplay: boolean(normalizedResult.replay) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Échec inattendu de l’exécution.'
    await completeExecution(client, executionId, 'failed', { message }, message).catch(() => undefined)
    throw error
  }
}

export async function executeProductRealityCommand(request: ProductRealityCommandRequest): Promise<ProductRealityCommandResult> {
  const definition = getProductRealityOperation(request.operationKey)
  if (!definition) throw new Angelcare360AccessError(`Opération produit inconnue: ${request.operationKey}.`, 400)
  if (request.authority === 'operator') {
    const session = await requireAngelcare360OperatorPermission('operator.features.update')
    const schoolId = optionalString(request.schoolId) || optionalString(object(request.payload).schoolId)
    if (!schoolId) throw new Angelcare360AccessError('schoolId est requis pour une exécution Operator.', 422)
    const client = await createServiceClient()
    const { data: school, error: schoolError } = await client.from('angelcare360_schools').select('id,name,status').eq('id', schoolId).maybeSingle()
    if (schoolError) throw new Error(schoolError.message)
    if (!school) throw new Angelcare360AccessError('Établissement cible introuvable.', 404)
    if (!definition.operatorOnly) {
      await requireQueuedProductRealityOperation(client, request.operationKey, schoolId, session.user.id, object(request.payload), { allowApprovalRequired: definition.requiresApproval })
      if (definition.requiresApproval) return queueProductRealityApproval({ client, schoolId, userId: session.user.id, request })
    }
    return executeResolvedProductRealityCommand({ request, client, schoolId, userId: session.user.id })
  }
  if (definition.operatorOnly) throw new Angelcare360AccessError('Cette opération exige l’autorité Operator.', 403)
  const gate = await requireProductRealityOperation(request.operationKey, { entityId: request.entityId, payload: object(request.payload), allowApprovalRequired: definition.requiresApproval })
  const client = await createServiceClient()
  if (definition.requiresApproval) return queueProductRealityApproval({ client, schoolId: gate.context.school!.id, userId: gate.context.user.id, request })
  return executeResolvedProductRealityCommand({ request, client, schoolId: gate.context.school!.id, userId: gate.context.user.id })
}

export async function getProductRealitySnapshot(input: { authority?: 'customer' | 'operator'; schoolId?: string | null } = {}): Promise<ProductRealitySnapshot> {
  const client = await createServiceClient()
  let schoolId: string | null = null
  let runtime: Awaited<ReturnType<typeof loadAngelcare360RuntimeEntitlements>>
  let operatorTenants: NonNullable<ProductRealitySnapshot['operatorTenants']> = []
  if (input.authority === 'operator') {
    const session = await requireAngelcare360OperatorPermission('operator.features.view')
    const { data: tenants, error: tenantError } = await client
      .from('angelcare360_operator_tenants')
      .select('id,school_id,tenant_slug,status,client:angelcare360_operator_clients(display_name,legal_name)')
      .not('school_id', 'is', null)
      .neq('status', 'archived')
      .order('tenant_slug')
    if (tenantError) throw new Error(tenantError.message)
    operatorTenants = ((tenants || []) as ProductRealityRow[]).map((tenant) => {
      const clientRow = Array.isArray(tenant.client) ? row(tenant.client[0]) : row(tenant.client)
      return { tenantId: string(tenant.id), schoolId: string(tenant.school_id), label: string(clientRow.display_name || clientRow.legal_name || tenant.tenant_slug, string(tenant.school_id)), status: string(tenant.status) }
    })
    schoolId = optionalString(input.schoolId) || operatorTenants[0]?.schoolId || null
    runtime = await loadAngelcare360RuntimeEntitlements({ userId: session.user.id, schoolId })
  } else {
    const context = await getAngelcare360AccessContext()
    schoolId = context?.school?.id || null
    runtime = context?.runtimeEntitlements || await loadAngelcare360RuntimeEntitlements({ userId: context?.user?.id || '', schoolId })
  }
  if (!schoolId) {
    return { generatedAt: now(), schoolId: null, tenantId: null, entitlementState: 'unavailable', productRuntimeAuthority: { enforced: false, packageVersion: null, snapshotVersion: null, enabledModules: 0, enabledCapabilities: 0, enabledFeatures: 0, enabledOperations: 0, meteredLimits: 0 }, domainMaturity: [], metrics: [], queues: [], recentExecutions: [], policyVersions: [], operationDefinitions: ANGELCARE360_PRODUCT_REALITY_OPERATIONS, warnings: ['Établissement actif introuvable.'], operatorTenants, selectedSchoolId: null }
  }
  const [executions, policies, exceptions, approvals, decisions, duplicates, corrections, gradeCorrections, conflicts, notifications] = await Promise.all([
    safeRows(client, 'angelcare360_product_reality_executions', schoolId, 20),
    safeRows(client, 'angelcare360_product_reality_policy_versions', schoolId, 80),
    safeRows(client, 'angelcare360_product_reality_exceptions', schoolId, 40),
    safeRows(client, 'angelcare360_product_reality_approvals', schoolId, 40),
    safeRows(client, 'angelcare360_customer_management_decisions', schoolId, 20),
    safeRows(client, 'angelcare360_people_duplicate_cases', schoolId, 20),
    safeRows(client, 'angelcare360_attendance_correction_requests', schoolId, 20),
    safeRows(client, 'angelcare360_grade_correction_requests', schoolId, 20),
    safeRows(client, 'angelcare360_timetable_conflict_findings', schoolId, 20),
    safeRows(client, 'angelcare360_notification_intents', schoolId, 20),
  ])
  const queues = [
    ...exceptions.map((item) => ({ id: string(item.id), domain: string(item.domain, 'product') as ProductRealitySnapshot['queues'][number]['domain'], title: string(item.title, 'Exception'), detail: optionalString(item.detail), status: string(item.status), severity: string(item.severity, 'warning') as ProductRealitySnapshot['queues'][number]['severity'], operationKey: optionalString(item.operation_key), entityType: optionalString(item.entity_type), entityId: optionalString(item.entity_id), dueAt: optionalString(item.due_at), createdAt: string(item.created_at) })),
    ...approvals.filter((item) => string(item.status) === 'open').map((item) => ({ id: string(item.id), domain: 'product' as const, title: `Approbation · ${string(item.operation_key)}`, detail: optionalString(item.reason), status: string(item.decision, 'pending'), severity: 'warning' as const, operationKey: 'product.approval.decide', entityType: 'product_reality_approval', entityId: string(item.id), dueAt: null, createdAt: string(item.created_at || item.requested_at) })),
    ...decisions.filter((item) => !['resolved', 'archived'].includes(string(item.status))).map((item) => ({ id: string(item.id), domain: 'institution' as const, title: string(item.title), detail: optionalString(item.detail), status: string(item.status), severity: string(item.severity, 'info') as ProductRealitySnapshot['queues'][number]['severity'], operationKey: optionalString(item.operation_key), entityType: optionalString(item.related_entity_type), entityId: optionalString(item.related_entity_id), dueAt: optionalString(item.due_at), createdAt: string(item.created_at) })),
    ...duplicates.filter((item) => string(item.status) === 'open').map((item) => ({ id: string(item.id), domain: 'people' as const, title: string(item.title, 'Doublon potentiel'), detail: optionalString(item.detail), status: string(item.status), severity: string(item.severity, 'warning') as ProductRealitySnapshot['queues'][number]['severity'], operationKey: 'person.merge.execute', entityType: 'person_duplicate_case', entityId: string(item.id), dueAt: null, createdAt: string(item.created_at) })),
    ...corrections.filter((item) => string(item.status) === 'open').map((item) => ({ id: string(item.id), domain: 'attendance' as const, title: string(item.title), detail: optionalString(item.detail), status: string(item.status), severity: string(item.severity, 'info') as ProductRealitySnapshot['queues'][number]['severity'], operationKey: 'attendance.correction.approve', entityType: 'attendance_correction', entityId: string(item.id), dueAt: null, createdAt: string(item.created_at) })),
    ...gradeCorrections.filter((item) => string(item.status) === 'open').map((item) => ({ id: string(item.id), domain: 'assessment' as const, title: string(item.title), detail: optionalString(item.detail), status: string(item.status), severity: string(item.severity, 'info') as ProductRealitySnapshot['queues'][number]['severity'], operationKey: 'grade.correction.approve', entityType: 'grade_correction', entityId: string(item.id), dueAt: null, createdAt: string(item.created_at) })),
    ...conflicts.filter((item) => string(item.status) === 'open').map((item) => ({ id: string(item.id), domain: 'timetable' as const, title: string(item.title), detail: optionalString(item.detail), status: string(item.status), severity: string(item.severity, 'critical') as ProductRealitySnapshot['queues'][number]['severity'], operationKey: 'timetable.slot.upsert', entityType: 'timetable_conflict', entityId: string(item.id), dueAt: null, createdAt: string(item.created_at) })),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  const domainMaturity = await Promise.all(Object.entries(DOMAIN_LABELS).map(async ([key, label]) => {
    const configuredPolicies = policies.filter((item) => string(item.domain_key) === key && string(item.status) === 'published').length
    const activeWorkflows = await safeCount(client, 'angelcare360_product_reality_workflow_instances', schoolId, [['domain_key', key], ['status', 'active']])
    const openExceptions = exceptions.filter((item) => string(item.domain_key || item.domain) === key && !['resolved', 'closed'].includes(string(item.status))).length
    const pendingExecutions = executions.filter((item) => string(item.operation_key).startsWith(key) && ['requested', 'validating', 'executing'].includes(string(item.state))).length
    return { key: key as ProductRealitySnapshot['domainMaturity'][number]['key'], label, configuredPolicies, activeWorkflows, openExceptions, pendingExecutions, state: openExceptions || pendingExecutions ? 'attention' as const : configuredPolicies ? 'operational' as const : 'unconfigured' as const }
  }))
  return {
    generatedAt: now(), schoolId, tenantId: runtime.tenantId, entitlementState: runtime.state,
    productRuntimeAuthority: { enforced: runtime.enforced, packageVersion: runtime.packageVersionName, snapshotVersion: runtime.snapshotVersion, enabledModules: runtime.enabledModules.length, enabledCapabilities: runtime.enabledCapabilities.length, enabledFeatures: runtime.enabledFeatures.length, enabledOperations: runtime.enabledOperations.length, meteredLimits: runtime.limits.length },
    domainMaturity,
    metrics: [
      { key: 'open_queue', label: 'Interventions ouvertes', value: queues.length, severity: queues.some((item) => item.severity === 'critical') ? 'critical' : queues.length ? 'warning' : 'success', href: '/angelcare-360-operator/tenants-product/reality' },
      { key: 'executions', label: 'Exécutions récentes', value: executions.length, severity: executions.some((item) => item.state === 'failed') ? 'critical' : 'info' },
      { key: 'policies', label: 'Policies versionnées', value: policies.filter((item) => item.status === 'published').length, severity: 'info' },
      { key: 'notifications', label: 'Intents communication', value: notifications.filter((item) => item.status === 'pending').length, severity: notifications.some((item) => item.status === 'failed') ? 'warning' : 'info' },
    ],
    queues,
    recentExecutions: executions,
    policyVersions: policies,
    operationDefinitions: ANGELCARE360_PRODUCT_REALITY_OPERATIONS,
    warnings: runtime.warning ? [runtime.warning] : [],
    operatorTenants,
    selectedSchoolId: schoolId,
  }
}

async function requireQueuedProductRealityOperation(
  client: ServiceClient,
  operationKey: string,
  schoolId: string,
  userId: string,
  payload: ProductRealityRow,
  options: { approved?: boolean; allowApprovalRequired?: boolean } = {},
) {
  const definition = getProductRealityOperation(operationKey)
  if (!definition) throw new Error(`Opération produit inconnue: ${operationKey}.`)
  if (definition.operatorOnly) throw new Error(`L’opération ${operationKey} exige une exécution directe par un Operator authentifié.`)
  const runtime = await loadAngelcare360RuntimeEntitlements({ userId, schoolId })
  const allowed = isAngelcare360ModuleEnabled(runtime, definition.moduleKey)
    && isAngelcare360CapabilityEnabled(runtime, definition.capabilityKey)
    && isAngelcare360FeatureEnabled(runtime, definition.featureKey)
    && isAngelcare360OperationEnabled(runtime, operationKey)
  if (!allowed) throw new Error(`Entitlement runtime refusé pour ${operationKey}.`)
  const { data: overrideGate, error: gateError } = await client
    .from('angelcare360_product_runtime_operation_gates')
    .select('state,reason,effective_from,effective_to')
    .eq('school_id', schoolId)
    .eq('operation_key', operationKey)
    .eq('status', 'active')
    .order('priority', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (gateError) throw new Error(gateError.message)
  if (overrideGate) {
    const gate = row(overrideGate)
    const from = optionalString(gate.effective_from)
    const to = optionalString(gate.effective_to)
    const timestamp = Date.now()
    const effective = (!from || Date.parse(from) <= timestamp) && (!to || Date.parse(to) >= timestamp)
    if (effective && ['blocked', 'suspended'].includes(string(gate.state))) {
      throw new Error(optionalString(gate.reason) || `L’opération ${operationKey} est ${string(gate.state)}.`)
    }
    if (effective && string(gate.state) === 'approval_required' && !options.approved && !options.allowApprovalRequired) {
      throw new Error(optionalString(gate.reason) || `L’opération ${operationKey} exige une approbation.`)
    }
  }
  const meterKey = optionalString(payload.meterKey)
  if (meterKey) {
    const limit = runtime.limits.find((item) => item.key === meterKey)
    const quantity = number(payload.quantity, 1)
    if (!limit) throw new Error(`Meter ${meterKey} absent du snapshot effectif.`)
    if (limit.allowed !== null && number(limit.current) + quantity > limit.allowed) {
      throw new Error(`Capacité ${meterKey} dépassée: ${number(limit.current) + quantity}/${limit.allowed}.`)
    }
  }
  return definition
}

export async function processProductRealityQueue(limit = 10): Promise<ProductRealityWorkerResult> {
  const client = await createServiceClient()
  const { data: jobs, error } = await client
    .from('angelcare360_product_reality_executions')
    .select('*')
    .eq('state', 'approved')
    .order('requested_at', { ascending: true })
    .limit(Math.max(1, Math.min(limit, 50)))
  if (error) throw new Error(error.message)
  const results: ProductRealityWorkerResult['results'] = []
  let completed = 0
  let failed = 0
  for (const jobValue of (jobs || []) as ProductRealityRow[]) {
    const executionId = string(jobValue.id)
    const operationKey = string(jobValue.operation_key)
    const schoolId = string(jobValue.school_id)
    const userId = string(jobValue.requested_by || jobValue.created_by)
    const request: ProductRealityCommandRequest = {
      operationKey,
      entityId: optionalString(jobValue.entity_id),
      idempotencyKey: string(jobValue.idempotency_key),
      reason: optionalString(jobValue.reason),
      effectiveAt: optionalString(jobValue.effective_at),
      payload: object(jobValue.request_payload),
    }
    try {
      if (!schoolId || !userId || !operationKey) throw new Error('Job incomplet: school_id, requested_by et operation_key sont requis.')
      await client.from('angelcare360_product_reality_executions').update({ state: 'validating', started_at: now(), updated_at: now() }).eq('id', executionId)
      await requireQueuedProductRealityOperation(client, operationKey, schoolId, userId, object(request.payload), { approved: true })
      await client.from('angelcare360_product_reality_executions').update({ state: 'executing', updated_at: now() }).eq('id', executionId)
      const executionContext: ExecutionContext = { client, schoolId, userId, operationKey, executionId, request }
      const result = object(await dispatch(executionContext))
      const blockers = array(result.blockers).map(String)
      const warnings = array(result.warnings).map(String)
      const state: ProductRealityExecutionState = blockers.length ? 'partially_failed' : 'completed'
      const payload: ProductRealityRow = {
        message: string(result.message),
        record: row(result.record),
        records: array(result.records),
        warnings,
        blockers,
      }
      await completeExecution(client, executionId, state, payload)
      await client.from('angelcare360_product_reality_approvals').update({ status: 'resolved', decision_result: payload, updated_at: now() }).eq('requested_execution_id', executionId).eq('decision', 'approved')
      results.push({ executionId, operationKey, state, message: string(payload.message) })
      if (state === 'completed') completed += 1
      else failed += 1
    } catch (problem) {
      failed += 1
      const message = problem instanceof Error ? problem.message : 'Échec.'
      await completeExecution(client, executionId, 'failed', { message }, message).catch(() => undefined)
      await client.from('angelcare360_product_reality_approvals').update({ status: 'resolved', decision_result: { message, state: 'failed' }, updated_at: now() }).eq('requested_execution_id', executionId).eq('decision', 'approved')
      results.push({ executionId, operationKey, state: 'failed', message })
    }
  }
  return { ok: failed === 0, processed: results.length, completed, failed, results }
}

export async function loadReportCardPdf(reportCardId: string, versionSelector?: string | null) {
  const context = await requireAngelcare360Permission('academics.view')
  if (!context.school) throw new Angelcare360AccessError('Établissement actif introuvable.', 403)
  const client = await createServiceClient()
  let query = client
    .from('angelcare360_report_card_document_versions')
    .select('*,document:angelcare360_documents(id,file_name,file_path,storage_provider,status)')
    .eq('school_id', context.school.id)
    .eq('report_card_id', reportCardId)
  const selector = optionalString(versionSelector)
  if (selector) {
    if (/^[0-9]+$/.test(selector)) query = query.eq('version_number', Number(selector))
    else query = query.eq('id', selector)
  } else {
    query = query.in('status', ['published', 'approved', 'reviewed', 'generated']).order('published_at', { ascending: false, nullsFirst: false }).order('version_number', { ascending: false })
  }
  const { data: version, error: versionError } = await query.limit(1).maybeSingle()
  if (versionError) throw new Error(versionError.message)
  if (!version) throw new Error('La version demandée du bulletin est introuvable.')
  const versionRow = version as ProductRealityRow
  const bucket = string(versionRow.storage_bucket, REPORT_CARD_STORAGE_BUCKET)
  const storagePath = required(versionRow, 'file_path', 'Le chemin immutable du bulletin')
  const { data: artifact, error: downloadError } = await client.storage.from(bucket).download(storagePath)
  if (downloadError || !artifact) throw new Error(`Le fichier immutable du bulletin est indisponible: ${downloadError?.message || 'artifact absent'}`)
  const bytes = new Uint8Array(await artifact.arrayBuffer())
  const actualHash = createHash('sha256').update(bytes).digest('hex')
  if (actualHash !== string(versionRow.document_sha256)) throw new Error('L’intégrité SHA-256 du bulletin ne correspond pas à la version publiée.')
  const document = row(versionRow.document)
  return {
    bytes,
    fileName: string(document.file_name, `${string(versionRow.version_code, reportCardId)}.pdf`),
    version: versionRow,
  }
}

export function resolveProductRealityRouteOperation(pathname: string, operationName: string) {
  const binding = getAngelcare360RouteBinding(pathname)
  if (!binding) return null
  return ANGELCARE360_PRODUCT_REALITY_OPERATIONS.find((item) => item.capabilityKey === binding.capabilityKey && item.operationKey.endsWith(operationName)) || null
}
