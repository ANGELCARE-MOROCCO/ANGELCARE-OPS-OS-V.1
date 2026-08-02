import { createHash, randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { compileTenantEntitlements } from './product-kernel'
import type {
  AutonomyKernelOperation,
  AutonomyKernelSnapshot,
  KernelCapacitySnapshot,
  KernelCertificationControl,
  KernelChangeset,
  KernelExtensionManifest,
  KernelMetadataDefinition,
  KernelMetadataVersion,
  KernelMeterDefinition,
  KernelPolicyDefinition,
  KernelPolicyVersion,
  KernelProvisioningJob,
  KernelRecoveryRehearsal,
  KernelWorkflowDefinition,
  KernelWorkflowVersion,
} from '@/types/angelcare360/operator/autonomy-kernel'

type JsonRecord = Record<string, unknown>
type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>

const TABLES = {
  metadataDefinitions: 'angelcare360_operator_autonomy_metadata_definitions',
  metadataVersions: 'angelcare360_operator_autonomy_metadata_versions',
  workflowDefinitions: 'angelcare360_operator_autonomy_workflow_definitions',
  workflowVersions: 'angelcare360_operator_autonomy_workflow_versions',
  workflowInstances: 'angelcare360_operator_autonomy_workflow_instances',
  workflowEvents: 'angelcare360_operator_autonomy_workflow_events',
  policyDefinitions: 'angelcare360_operator_autonomy_policy_definitions',
  policyVersions: 'angelcare360_operator_autonomy_policy_versions',
  policyEvaluations: 'angelcare360_operator_autonomy_policy_evaluations',
  changesets: 'angelcare360_operator_autonomy_changesets',
  changesetApprovals: 'angelcare360_operator_autonomy_changeset_approvals',
  compilerRuns: 'angelcare360_operator_autonomy_entitlement_compiler_runs',
  provisioningJobs: 'angelcare360_operator_autonomy_provisioning_jobs',
  provisioningSteps: 'angelcare360_operator_autonomy_provisioning_steps',
  deadLetters: 'angelcare360_operator_autonomy_dead_letters',
  outbox: 'angelcare360_operator_autonomy_event_outbox',
  meterDefinitions: 'angelcare360_operator_autonomy_meter_definitions',
  meterSamples: 'angelcare360_operator_autonomy_meter_samples',
  capacitySnapshots: 'angelcare360_operator_autonomy_capacity_snapshots',
  thresholdEvents: 'angelcare360_operator_autonomy_threshold_events',
  extensions: 'angelcare360_operator_autonomy_extension_manifests',
  extensionVersions: 'angelcare360_operator_autonomy_extension_versions',
  releaseCandidates: 'angelcare360_operator_autonomy_release_candidates',
  releaseAssignments: 'angelcare360_operator_autonomy_release_assignments',
  runbooks: 'angelcare360_operator_autonomy_runbooks',
  certificationControls: 'angelcare360_operator_autonomy_certification_controls',
  certificationEvidence: 'angelcare360_operator_autonomy_certification_evidence',
  recoveryRehearsals: 'angelcare360_operator_autonomy_recovery_rehearsals',
} as const

function text(value: unknown, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function requiredText(payload: JsonRecord, key: string, label = key) {
  const value = text(payload[key])
  if (!value) throw new Error(`${label} est obligatoire.`)
  return value
}

function object(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function array(value: unknown): Array<JsonRecord> {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as Array<JsonRecord> : []
}

function integer(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback
}

function numeric(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function bool(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  return fallback
}

function checksum(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function code(prefix: string) {
  return `${prefix}-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${randomUUID().slice(0, 8).toUpperCase()}`
}

async function list<T>(client: ServiceClient, table: string, limit = 100): Promise<T[]> {
  const { data, error } = await client.from(table).select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(error.message)
  return (data || []) as T[]
}

async function insertOne<T>(client: ServiceClient, table: string, payload: JsonRecord): Promise<T> {
  const { data, error } = await client.from(table).insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return data as T
}

async function updateOne<T>(client: ServiceClient, table: string, id: string, payload: JsonRecord): Promise<T> {
  const { data, error } = await client.from(table).update(payload).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as T
}

async function getOne<T>(client: ServiceClient, table: string, id: string): Promise<T> {
  const { data, error } = await client.from(table).select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data as T
}

async function audit(action: string, entityType: string, entityId: string | null, afterData: JsonRecord, metadata?: JsonRecord) {
  await writeOperatorAuditLog({
    module: 'autonomy-kernel',
    action,
    entityType,
    entityId,
    severity: action.includes('failed') || action.includes('rejected') ? 'warning' : 'info',
    afterData,
    metadata: metadata || null,
  })
}

function sourceFreshness<T extends { created_at?: string; updated_at?: string }>(source: string, rows: T[]) {
  const latest = rows
    .map((row) => row.updated_at || row.created_at || '')
    .filter(Boolean)
    .sort()
    .at(-1) || null
  if (!latest) return { source, latest_at: null, state: 'empty' as const }
  const age = Date.now() - new Date(latest).getTime()
  return { source, latest_at: latest, state: age > 1000 * 60 * 60 * 24 * 7 ? 'stale' as const : 'fresh' as const }
}

export async function getAutonomyKernelSnapshot(): Promise<AutonomyKernelSnapshot> {
  await requireAngelcare360OperatorPermission()
  const client = await createServiceClient()

  const [
    metadataDefinitions,
    metadataVersions,
    workflowDefinitions,
    workflowVersions,
    policyDefinitions,
    policyVersions,
    changesets,
    provisioningJobs,
    meterDefinitions,
    capacitySnapshots,
    extensions,
    certificationControls,
    recoveryRehearsals,
  ] = await Promise.all([
    list<KernelMetadataDefinition>(client, TABLES.metadataDefinitions),
    list<KernelMetadataVersion>(client, TABLES.metadataVersions),
    list<KernelWorkflowDefinition>(client, TABLES.workflowDefinitions),
    list<KernelWorkflowVersion>(client, TABLES.workflowVersions),
    list<KernelPolicyDefinition>(client, TABLES.policyDefinitions),
    list<KernelPolicyVersion>(client, TABLES.policyVersions),
    list<KernelChangeset>(client, TABLES.changesets),
    list<KernelProvisioningJob>(client, TABLES.provisioningJobs),
    list<KernelMeterDefinition>(client, TABLES.meterDefinitions),
    list<KernelCapacitySnapshot>(client, TABLES.capacitySnapshots),
    list<KernelExtensionManifest>(client, TABLES.extensions),
    list<KernelCertificationControl>(client, TABLES.certificationControls),
    list<KernelRecoveryRehearsal>(client, TABLES.recoveryRehearsals),
  ])

  const mandatoryControls = certificationControls.filter((item) => item.criticality === 'mandatory')
  const failedControls = mandatoryControls.filter((item) => item.status === 'failed')
  const pendingControls = mandatoryControls.filter((item) => item.status !== 'passed')
  const productionCertified = mandatoryControls.length > 0 && pendingControls.length === 0
  const certificationReason = productionCertified
    ? 'Tous les contrôles obligatoires disposent d’une preuve valide.'
    : failedControls.length > 0
      ? `${failedControls.length} contrôle(s) obligatoire(s) sont en échec.`
      : `${pendingControls.length} contrôle(s) obligatoire(s) restent à vérifier.`

  const queuedJobs = provisioningJobs.filter((item) => ['queued', 'running', 'verification'].includes(item.status))
  const failedJobs = provisioningJobs.filter((item) => ['failed', 'dead_letter'].includes(item.status))
  const capacityPressure = capacitySnapshots.filter((item) => Number(item.pressure_pct || 0) >= 90)
  const draftChanges = changesets.filter((item) => !['verified', 'rolled_back', 'rejected'].includes(item.status))

  return {
    generated_at: new Date().toISOString(),
    production_certified: productionCertified,
    certification_reason: certificationReason,
    metrics: [
      { key: 'definitions', label: 'Définitions gouvernées', value: String(metadataDefinitions.length + workflowDefinitions.length + policyDefinitions.length), detail: 'Métadonnées, workflows et politiques versionnés.', tone: 'neutral' },
      { key: 'changes', label: 'Changesets actifs', value: String(draftChanges.length), detail: 'Changements en validation, approbation ou exécution.', tone: draftChanges.length ? 'warning' : 'positive' },
      { key: 'jobs', label: 'Provisioning en cours', value: String(queuedJobs.length), detail: `${failedJobs.length} échec(s) ou dead-letter.`, tone: failedJobs.length ? 'critical' : queuedJobs.length ? 'warning' : 'positive' },
      { key: 'capacity', label: 'Pression capacité', value: String(capacityPressure.length), detail: 'Snapshots au-dessus de 90%.', tone: capacityPressure.length ? 'critical' : 'positive' },
      { key: 'certification', label: 'Production certifiée', value: productionCertified ? 'OUI' : 'NON', detail: certificationReason, tone: productionCertified ? 'positive' : 'warning' },
    ],
    metadata_definitions: metadataDefinitions,
    metadata_versions: metadataVersions,
    workflow_definitions: workflowDefinitions,
    workflow_versions: workflowVersions,
    policy_definitions: policyDefinitions,
    policy_versions: policyVersions,
    changesets,
    provisioning_jobs: provisioningJobs,
    meter_definitions: meterDefinitions,
    capacity_snapshots: capacitySnapshots,
    extensions,
    certification_controls: certificationControls,
    recovery_rehearsals: recoveryRehearsals,
    freshness: [
      sourceFreshness('metadata', metadataVersions),
      sourceFreshness('workflows', workflowVersions),
      sourceFreshness('policies', policyVersions),
      sourceFreshness('provisioning', provisioningJobs),
      sourceFreshness('capacity', capacitySnapshots),
      sourceFreshness('certification', certificationControls),
    ],
  }
}

async function createMetadataDefinition(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const client = await createServiceClient()
  const record = await insertOne<KernelMetadataDefinition>(client, TABLES.metadataDefinitions, {
    key: requiredText(payload, 'key', 'Code canonique').toLowerCase(),
    name: requiredText(payload, 'name', 'Nom'),
    description: text(payload.description) || null,
    domain: requiredText(payload, 'domain', 'Domaine'),
    entity_type: requiredText(payload, 'entity_type', 'Type d’entité'),
    owner_role: text(payload.owner_role) || null,
    lifecycle_status: 'draft',
    current_version: 0,
  })
  await audit('metadata.definition.created', 'autonomy_metadata_definition', record.id, record as unknown as JsonRecord)
  return { ok: true, definition: record }
}

async function publishMetadataVersion(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const client = await createServiceClient()
  const definitionId = requiredText(payload, 'definition_id', 'Définition')
  const definition = await getOne<KernelMetadataDefinition>(client, TABLES.metadataDefinitions, definitionId)
  const schemaJson = object(payload.schema_json)
  if (!Object.keys(schemaJson).length) throw new Error('Le schéma JSON ne peut pas être vide.')
  const versionNumber = definition.current_version + 1
  const signature = checksum({ schemaJson, ui: object(payload.ui_schema_json), validation: object(payload.validation_json), compatibility: object(payload.compatibility_json) })
  const version = await insertOne<KernelMetadataVersion>(client, TABLES.metadataVersions, {
    definition_id: definitionId,
    version_number: versionNumber,
    schema_json: schemaJson,
    ui_schema_json: object(payload.ui_schema_json),
    validation_json: object(payload.validation_json),
    compatibility_json: object(payload.compatibility_json),
    checksum: signature,
    status: bool(payload.publish_now, true) ? 'published' : 'review',
    effective_from: text(payload.effective_from) || new Date().toISOString(),
    effective_to: text(payload.effective_to) || null,
  })
  await updateOne(client, TABLES.metadataDefinitions, definitionId, {
    current_version: versionNumber,
    lifecycle_status: version.status,
    updated_at: new Date().toISOString(),
  })
  await audit('metadata.version.published', 'autonomy_metadata_version', version.id, version as unknown as JsonRecord, { definition_id: definitionId })
  return { ok: true, version }
}

function validatePrimitive(expected: unknown, value: unknown) {
  if (!expected || expected === 'any') return true
  if (expected === 'array') return Array.isArray(value)
  if (expected === 'integer') return Number.isInteger(Number(value))
  if (expected === 'number') return Number.isFinite(Number(value))
  if (expected === 'boolean') return typeof value === 'boolean'
  if (expected === 'object') return Boolean(value && typeof value === 'object' && !Array.isArray(value))
  if (expected === 'string') return typeof value === 'string'
  return true
}

async function validateMetadataRecord(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission()
  const client = await createServiceClient()
  const versionId = requiredText(payload, 'version_id', 'Version de schéma')
  const version = await getOne<KernelMetadataVersion>(client, TABLES.metadataVersions, versionId)
  const record = object(payload.record)
  const schema = object(version.schema_json)
  const required = Array.isArray(schema.required) ? schema.required.map(String) : []
  const properties = object(schema.properties)
  const errors: Array<{ path: string; message: string }> = []
  for (const key of required) {
    if (!(key in record) || record[key] === null || record[key] === '') errors.push({ path: key, message: 'Champ obligatoire absent.' })
  }
  for (const [key, config] of Object.entries(properties)) {
    if (!(key in record)) continue
    const property = object(config)
    if (!validatePrimitive(property.type, record[key])) errors.push({ path: key, message: `Type attendu: ${String(property.type || 'any')}.` })
    if (Array.isArray(property.enum) && !property.enum.includes(record[key])) errors.push({ path: key, message: 'Valeur hors référentiel autorisé.' })
  }
  return { ok: errors.length === 0, valid: errors.length === 0, errors, checksum: checksum(record), schema_checksum: version.checksum }
}

async function createWorkflowDefinition(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const client = await createServiceClient()
  const definition = await insertOne<KernelWorkflowDefinition>(client, TABLES.workflowDefinitions, {
    key: requiredText(payload, 'key', 'Code workflow').toLowerCase(),
    name: requiredText(payload, 'name', 'Nom workflow'),
    domain: requiredText(payload, 'domain', 'Domaine'),
    entity_type: requiredText(payload, 'entity_type', 'Type d’entité'),
    current_version: 0,
    lifecycle_status: 'draft',
  })
  await audit('workflow.definition.created', 'autonomy_workflow_definition', definition.id, definition as unknown as JsonRecord)
  return { ok: true, definition }
}

async function publishWorkflowVersion(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const client = await createServiceClient()
  const definitionId = requiredText(payload, 'definition_id', 'Définition workflow')
  const definition = await getOne<KernelWorkflowDefinition>(client, TABLES.workflowDefinitions, definitionId)
  const states = array(payload.states_json)
  const transitions = array(payload.transitions_json)
  if (states.length < 2) throw new Error('Un workflow doit définir au moins deux états.')
  if (!transitions.length) throw new Error('Un workflow doit définir au moins une transition.')
  const versionNumber = definition.current_version + 1
  const signature = checksum({ states, transitions, sla: object(payload.sla_json), automation: array(payload.automation_json) })
  const version = await insertOne<KernelWorkflowVersion>(client, TABLES.workflowVersions, {
    definition_id: definitionId,
    version_number: versionNumber,
    states_json: states,
    transitions_json: transitions,
    sla_json: object(payload.sla_json),
    automation_json: array(payload.automation_json),
    checksum: signature,
    status: bool(payload.publish_now, true) ? 'published' : 'review',
  })
  await updateOne(client, TABLES.workflowDefinitions, definitionId, { current_version: versionNumber, lifecycle_status: version.status, updated_at: new Date().toISOString() })
  await audit('workflow.version.published', 'autonomy_workflow_version', version.id, version as unknown as JsonRecord)
  return { ok: true, version }
}

function resolvePath(input: JsonRecord, path: string) {
  return path.split('.').reduce<unknown>((value, part) => object(value)[part], input)
}

function evaluateCondition(condition: JsonRecord, input: JsonRecord): boolean {
  const operator = text(condition.operator, 'eq')
  if (operator === 'and') return array(condition.conditions).every((item) => evaluateCondition(item, input))
  if (operator === 'or') return array(condition.conditions).some((item) => evaluateCondition(item, input))
  if (operator === 'not') return !evaluateCondition(object(condition.condition), input)
  const actual = resolvePath(input, text(condition.path))
  const expected = condition.value
  if (operator === 'exists') return actual !== undefined && actual !== null
  if (operator === 'eq') return actual === expected
  if (operator === 'neq') return actual !== expected
  if (operator === 'gt') return Number(actual) > Number(expected)
  if (operator === 'gte') return Number(actual) >= Number(expected)
  if (operator === 'lt') return Number(actual) < Number(expected)
  if (operator === 'lte') return Number(actual) <= Number(expected)
  if (operator === 'in') return Array.isArray(expected) && expected.includes(actual)
  if (operator === 'contains') return Array.isArray(actual) ? actual.includes(expected) : String(actual ?? '').includes(String(expected ?? ''))
  return false
}

async function startWorkflowInstance(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const client = await createServiceClient()
  const versionId = requiredText(payload, 'workflow_version_id', 'Version workflow')
  const version = await getOne<KernelWorkflowVersion>(client, TABLES.workflowVersions, versionId)
  const states = version.states_json
  const requestedInitial = text(payload.initial_state)
  const initialState = requestedInitial || text(states.find((item) => bool(item.initial))?.key) || text(states[0]?.key)
  if (!initialState) throw new Error('La version de workflow ne définit aucun état initial.')
  const instance = await insertOne<JsonRecord>(client, TABLES.workflowInstances, {
    workflow_version_id: versionId,
    subject_type: requiredText(payload, 'subject_type', 'Type de sujet'),
    subject_id: requiredText(payload, 'subject_id', 'Identifiant du sujet'),
    current_state: initialState,
    context_json: object(payload.context_json),
  })
  const event = await insertOne<JsonRecord>(client, TABLES.workflowEvents, {
    workflow_instance_id: instance.id,
    event_type: 'started',
    from_state: null,
    to_state: initialState,
    transition_key: null,
    payload_json: object(payload),
  })
  await audit('workflow.instance.started', 'autonomy_workflow_instance', String(instance.id), instance, { event_id: event.id })
  return { ok: true, instance, event }
}

async function transitionWorkflowInstance(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const client = await createServiceClient()
  const instanceId = requiredText(payload, 'instance_id', 'Instance workflow')
  const { data: instance, error } = await client.from(TABLES.workflowInstances).select('*').eq('id', instanceId).single()
  if (error) throw new Error(error.message)
  const version = await getOne<KernelWorkflowVersion>(client, TABLES.workflowVersions, String(instance.workflow_version_id))
  const transitionKey = requiredText(payload, 'transition_key', 'Transition')
  const transition = version.transitions_json.find((item) => text(item.key) === transitionKey)
  if (!transition) throw new Error('Transition inconnue pour cette version de workflow.')
  if (text(transition.from) !== String(instance.current_state)) throw new Error('La transition ne correspond pas à l’état courant.')
  const input = { ...object(instance.context_json), ...object(payload.context_json) }
  if (transition.guard && !evaluateCondition(object(transition.guard), input)) throw new Error('Les conditions de transition ne sont pas satisfaites.')
  const nextState = requiredText(transition, 'to', 'État cible')
  const updated = await updateOne<JsonRecord>(client, TABLES.workflowInstances, instanceId, { current_state: nextState, context_json: input, updated_at: new Date().toISOString() })
  const event = await insertOne<JsonRecord>(client, TABLES.workflowEvents, {
    workflow_instance_id: instanceId,
    event_type: 'transition',
    from_state: instance.current_state,
    to_state: nextState,
    transition_key: transitionKey,
    payload_json: object(payload),
  })
  const automations = version.automation_json.filter((item) => {
    const onTransition = text(item.transition_key)
    const onState = text(item.to_state)
    return (!onTransition || onTransition === transitionKey) && (!onState || onState === nextState)
  })
  for (const [index, automation] of automations.entries()) {
    await insertOne(client, TABLES.outbox, {
      aggregate_type: 'workflow_instance', aggregate_id: instanceId,
      event_type: 'autonomy.workflow.automation_requested',
      payload_json: { workflow_event_id: event.id, automation },
      idempotency_key: `workflow:${event.id}:automation:${index}`,
      status: 'pending',
    })
  }
  await audit('workflow.transition.executed', 'autonomy_workflow_instance', instanceId, updated, { event_id: event.id, automations_requested: automations.length })
  return { ok: true, instance: updated, event }
}

async function createPolicyDefinition(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const client = await createServiceClient()
  const definition = await insertOne<KernelPolicyDefinition>(client, TABLES.policyDefinitions, {
    key: requiredText(payload, 'key', 'Code politique').toLowerCase(),
    name: requiredText(payload, 'name', 'Nom politique'),
    domain: requiredText(payload, 'domain', 'Domaine'),
    scope_type: requiredText(payload, 'scope_type', 'Périmètre'),
    current_version: 0,
    lifecycle_status: 'draft',
  })
  await audit('policy.definition.created', 'autonomy_policy_definition', definition.id, definition as unknown as JsonRecord)
  return { ok: true, definition }
}

async function publishPolicyVersion(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const client = await createServiceClient()
  const definitionId = requiredText(payload, 'definition_id', 'Définition politique')
  const definition = await getOne<KernelPolicyDefinition>(client, TABLES.policyDefinitions, definitionId)
  const condition = object(payload.condition_json)
  const actions = array(payload.actions_json)
  if (!Object.keys(condition).length) throw new Error('La condition de politique ne peut pas être vide.')
  if (!actions.length) throw new Error('Une politique doit produire au moins une action.')
  const versionNumber = definition.current_version + 1
  const signature = checksum({ condition, actions, authority: object(payload.authority_json), exceptions: object(payload.exception_json) })
  const version = await insertOne<KernelPolicyVersion>(client, TABLES.policyVersions, {
    definition_id: definitionId,
    version_number: versionNumber,
    condition_json: condition,
    actions_json: actions,
    authority_json: object(payload.authority_json),
    exception_json: object(payload.exception_json),
    checksum: signature,
    status: bool(payload.publish_now, true) ? 'published' : 'review',
  })
  await updateOne(client, TABLES.policyDefinitions, definitionId, { current_version: versionNumber, lifecycle_status: version.status, updated_at: new Date().toISOString() })
  await audit('policy.version.published', 'autonomy_policy_version', version.id, version as unknown as JsonRecord)
  return { ok: true, version }
}

async function evaluatePolicy(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission()
  const client = await createServiceClient()
  const versionId = requiredText(payload, 'version_id', 'Version de politique')
  const version = await getOne<KernelPolicyVersion>(client, TABLES.policyVersions, versionId)
  const input = object(payload.input_json)
  const matched = evaluateCondition(version.condition_json, input)
  const actions = matched ? version.actions_json : []
  const evaluation = await insertOne<JsonRecord>(client, TABLES.policyEvaluations, {
    policy_version_id: versionId,
    subject_type: text(payload.subject_type, 'generic'),
    subject_id: text(payload.subject_id) || null,
    matched,
    input_json: input,
    output_json: { actions },
    evidence_json: object(payload.evidence_json),
    evaluator_version: 'autonomy-kernel-v1',
  })
  for (const [index, action] of actions.entries()) {
    await insertOne(client, TABLES.outbox, {
      aggregate_type: 'policy_evaluation', aggregate_id: evaluation.id,
      event_type: 'autonomy.policy.action_requested',
      payload_json: { evaluation_id: evaluation.id, action },
      idempotency_key: `policy:${evaluation.id}:action:${index}`,
      status: 'pending',
    })
  }
  await audit('policy.evaluated', 'autonomy_policy_evaluation', String(evaluation.id), evaluation, { actions_requested: actions.length })
  return { ok: true, matched, actions, evaluation }
}

async function createChangeset(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const session = await requireAngelcare360OperatorPermission()
  const client = await createServiceClient()
  const changeset = await insertOne<KernelChangeset>(client, TABLES.changesets, {
    changeset_code: code('AK-CS'),
    title: requiredText(payload, 'title', 'Titre du changeset'),
    domain: requiredText(payload, 'domain', 'Domaine'),
    status: 'draft',
    requested_by: session.user.id,
    change_json: object(payload.change_json),
    impact_json: object(payload.impact_json),
    rollback_json: object(payload.rollback_json),
    validation_json: object(payload.validation_json),
    effective_at: text(payload.effective_at) || null,
  })
  await audit('changeset.created', 'autonomy_changeset', changeset.id, changeset as unknown as JsonRecord)
  return { ok: true, changeset }
}

async function submitChangeset(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const client = await createServiceClient()
  const id = requiredText(payload, 'changeset_id', 'Changeset')
  const current = await getOne<KernelChangeset & { change_json?: JsonRecord }>(client, TABLES.changesets, id)
  if (current.status !== 'draft') throw new Error('Seul un changeset en brouillon peut être soumis.')
  if (!Object.keys(object(current.impact_json)).length) throw new Error('L’analyse d’impact est obligatoire avant soumission.')
  if (!Object.keys(object(current.rollback_json)).length) throw new Error('Le plan de rollback est obligatoire avant soumission.')
  const updated = await updateOne<KernelChangeset>(client, TABLES.changesets, id, { status: 'submitted', submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  await audit('changeset.submitted', 'autonomy_changeset', id, updated as unknown as JsonRecord)
  return { ok: true, changeset: updated }
}

async function decideChangeset(payload: JsonRecord, decision: 'approved' | 'rejected') {
  await requireAngelcare360OperatorPermission('operator.plans.approve')
  const session = await requireAngelcare360OperatorPermission()
  const client = await createServiceClient()
  const id = requiredText(payload, 'changeset_id', 'Changeset')
  const current = await getOne<KernelChangeset>(client, TABLES.changesets, id)
  if (current.status !== 'submitted') throw new Error('Le changeset doit être soumis avant décision.')
  const reason = requiredText(payload, 'reason', 'Motif de décision')
  const approval = await insertOne<JsonRecord>(client, TABLES.changesetApprovals, {
    changeset_id: id,
    decision,
    reason,
    decided_by: session.user.id,
    authority_role: session.operatorRole,
  })
  const updated = await updateOne<KernelChangeset>(client, TABLES.changesets, id, { status: decision, updated_at: new Date().toISOString() })
  await audit(`changeset.${decision}`, 'autonomy_changeset', id, updated as unknown as JsonRecord, { approval_id: approval.id, reason })
  return { ok: true, changeset: updated, approval }
}

async function advanceChangeset(payload: JsonRecord, target: 'scheduled' | 'executing' | 'verified' | 'rolled_back') {
  const permission = target === 'scheduled' || target === 'executing' ? 'operator.plans.update' : 'operator.plans.approve'
  await requireAngelcare360OperatorPermission(permission)
  const client = await createServiceClient()
  const id = requiredText(payload, 'changeset_id', 'Changeset')
  const current = await getOne<KernelChangeset>(client, TABLES.changesets, id)
  const allowed: Record<typeof target, string[]> = {
    scheduled: ['approved'],
    executing: ['scheduled'],
    verified: ['executing'],
    rolled_back: ['approved', 'scheduled', 'executing', 'verified'],
  }
  if (!allowed[target].includes(current.status)) throw new Error(`Transition changeset ${current.status} → ${target} interdite.`)
  const patch: JsonRecord = { status: target, updated_at: new Date().toISOString() }
  if (target === 'scheduled') patch.effective_at = requiredText(payload, 'effective_at', 'Date effective')
  if (target === 'executing') patch.execution_started_at = new Date().toISOString()
  if (target === 'verified') {
    const evidence = object(payload.verification_json)
    if (!Object.keys(evidence).length) throw new Error('La preuve de vérification est obligatoire.')
    patch.verification_json = { ...object(current.validation_json), execution_evidence: evidence }
    patch.verified_at = new Date().toISOString()
  }
  if (target === 'rolled_back') {
    patch.rollback_evidence_json = object(payload.rollback_evidence_json)
    patch.rollback_reason = requiredText(payload, 'reason', 'Motif de rollback')
    patch.rolled_back_at = new Date().toISOString()
  }
  const updated = await updateOne<KernelChangeset>(client, TABLES.changesets, id, patch)
  await insertOne(client, TABLES.outbox, {
    aggregate_type: 'changeset', aggregate_id: id,
    event_type: `autonomy.changeset.${target}`,
    payload_json: { changeset: updated, command: payload },
    idempotency_key: `changeset:${id}:${target}:${checksum(payload).slice(0, 16)}`,
    status: 'pending',
  })
  await audit(`changeset.${target}`, 'autonomy_changeset', id, updated as unknown as JsonRecord)
  return { ok: true, changeset: updated }
}

async function compileEntitlements(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.subscriptions.update')
  const client = await createServiceClient()
  const runCode = code('AK-COMP')
  const run = await insertOne<JsonRecord>(client, TABLES.compilerRuns, {
    run_code: runCode,
    tenant_id: text(payload.tenant_id) || null,
    client_id: text(payload.client_id) || null,
    subscription_id: text(payload.subscription_id) || null,
    status: 'running',
    input_json: payload,
    compiler_version: 'product-kernel-adapter-v1',
    started_at: new Date().toISOString(),
  })
  try {
    const result = await compileTenantEntitlements(payload)
    const resultRecord = object(result)
    const snapshotId = text(resultRecord.snapshot_id || object(resultRecord.snapshot).id) || null
    await updateOne(client, TABLES.compilerRuns, String(run.id), {
      status: 'completed',
      entitlement_snapshot_id: snapshotId,
      result_json: resultRecord,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    const job = await queueProvisioningJob({
      tenant_id: payload.tenant_id,
      client_id: payload.client_id,
      subscription_id: payload.subscription_id,
      entitlement_snapshot_id: snapshotId,
      operation: 'verify_compiled_entitlements',
      idempotency_key: `verify:${snapshotId || run.id}`,
      payload_json: { compiler_run_id: run.id, canonical_result: resultRecord },
    }, true)
    await audit('entitlement.compiled', 'autonomy_entitlement_compiler_run', String(run.id), resultRecord, { provisioning_job_id: object(job).job ? object(object(job).job).id : null })
    return { ok: true, compiler_run_id: run.id, canonical_result: result, provisioning: job }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Compilation inconnue en échec.'
    await updateOne(client, TABLES.compilerRuns, String(run.id), { status: 'failed', error_json: { message }, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    await audit('entitlement.compile_failed', 'autonomy_entitlement_compiler_run', String(run.id), { message })
    throw error
  }
}

async function queueProvisioningJob(payload: JsonRecord, internal = false) {
  if (!internal) await requireAngelcare360OperatorPermission('operator.subscriptions.update')
  const client = await createServiceClient()
  const idempotencyKey = requiredText(payload, 'idempotency_key', 'Clé d’idempotence')
  const { data: existing } = await client.from(TABLES.provisioningJobs).select('*').eq('idempotency_key', idempotencyKey).maybeSingle()
  if (existing) return { ok: true, reused: true, job: existing as KernelProvisioningJob }
  const job = await insertOne<KernelProvisioningJob>(client, TABLES.provisioningJobs, {
    job_code: code('AK-JOB'),
    tenant_id: text(payload.tenant_id) || null,
    client_id: text(payload.client_id) || null,
    subscription_id: text(payload.subscription_id) || null,
    entitlement_snapshot_id: text(payload.entitlement_snapshot_id) || null,
    operation: text(payload.operation, 'verify_compiled_entitlements'),
    idempotency_key: idempotencyKey,
    status: 'queued',
    attempts: 0,
    max_attempts: Math.max(1, integer(payload.max_attempts, 5)),
    next_attempt_at: new Date().toISOString(),
    payload_json: object(payload.payload_json),
  })
  await insertOne<JsonRecord>(client, TABLES.outbox, {
    aggregate_type: 'provisioning_job',
    aggregate_id: job.id,
    event_type: 'autonomy.provisioning.queued',
    payload_json: { job_id: job.id, operation: job.operation },
    idempotency_key: `outbox:${job.id}:queued`,
    status: 'pending',
  })
  if (!internal) await audit('provisioning.job.queued', 'autonomy_provisioning_job', job.id, job as unknown as JsonRecord)
  return { ok: true, reused: false, job }
}

async function retryProvisioningJob(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.subscriptions.update')
  const client = await createServiceClient()
  const id = requiredText(payload, 'job_id', 'Job provisioning')
  const job = await getOne<KernelProvisioningJob>(client, TABLES.provisioningJobs, id)
  if (!['failed', 'dead_letter'].includes(job.status)) throw new Error('Seuls les jobs en échec ou dead-letter peuvent être relancés.')
  const updated = await updateOne<KernelProvisioningJob>(client, TABLES.provisioningJobs, id, {
    status: 'queued',
    attempts: 0,
    next_attempt_at: new Date().toISOString(),
    error_json: null,
    updated_at: new Date().toISOString(),
  })
  await audit('provisioning.job.retried', 'autonomy_provisioning_job', id, updated as unknown as JsonRecord)
  return { ok: true, job: updated }
}

async function createMeterDefinition(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const client = await createServiceClient()
  const meter = await insertOne<KernelMeterDefinition>(client, TABLES.meterDefinitions, {
    meter_key: requiredText(payload, 'meter_key', 'Code compteur').toLowerCase(),
    name: requiredText(payload, 'name', 'Nom compteur'),
    unit: requiredText(payload, 'unit', 'Unité'),
    aggregation_method: text(payload.aggregation_method, 'sum'),
    reset_schedule: text(payload.reset_schedule) || null,
    measurement_source: requiredText(payload, 'measurement_source', 'Source de mesure'),
    default_included_quantity: numeric(payload.default_included_quantity, 0),
    soft_limit_pct: numeric(payload.soft_limit_pct, 70),
    warning_limit_pct: numeric(payload.warning_limit_pct, 90),
    critical_limit_pct: numeric(payload.critical_limit_pct, 95),
    hard_limit_pct: numeric(payload.hard_limit_pct, 100),
    lifecycle_status: 'published',
  })
  await audit('meter.definition.created', 'autonomy_meter_definition', meter.id, meter as unknown as JsonRecord)
  return { ok: true, meter }
}

async function recordMeterSample(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const client = await createServiceClient()
  const meterKey = requiredText(payload, 'meter_key', 'Compteur')
  const tenantId = requiredText(payload, 'tenant_id', 'Tenant')
  const quantity = numeric(payload.quantity)
  const sourceEventId = text(payload.source_event_id) || `manual:${tenantId}:${meterKey}:${Date.now()}:${randomUUID()}`
  const sample = await insertOne<JsonRecord>(client, TABLES.meterSamples, {
    tenant_id: tenantId,
    meter_key: meterKey,
    measured_at: text(payload.measured_at) || new Date().toISOString(),
    quantity,
    source: text(payload.source, 'operator_manual'),
    source_event_id: sourceEventId,
    dimensions_json: object(payload.dimensions_json),
    confidence_pct: Math.min(100, Math.max(0, numeric(payload.confidence_pct, 100))),
  })
  const snapshot = await refreshCapacitySnapshot({ tenant_id: tenantId, meter_key: meterKey }, true)
  await audit('meter.sample.recorded', 'autonomy_meter_sample', String(sample.id), sample, { capacity_snapshot: snapshot })
  return { ok: true, sample, snapshot }
}

async function refreshCapacitySnapshot(payload: JsonRecord, internal = false) {
  if (!internal) await requireAngelcare360OperatorPermission('operator.plans.update')
  const client = await createServiceClient()
  const meterKey = requiredText(payload, 'meter_key', 'Compteur')
  const tenantId = requiredText(payload, 'tenant_id', 'Tenant')
  const { data: meter, error: meterError } = await client.from(TABLES.meterDefinitions).select('*').eq('meter_key', meterKey).single()
  if (meterError) throw new Error(meterError.message)
  const { data: samples, error: sampleError } = await client.from(TABLES.meterSamples).select('*').eq('meter_key', meterKey).eq('tenant_id', tenantId).order('measured_at', { ascending: false }).limit(500)
  if (sampleError) throw new Error(sampleError.message)
  const sampleRows = (samples || []) as Array<Record<string, unknown>>
  const consumed = sampleRows.reduce((sum: number, item: Record<string, unknown>) => sum + numeric(item.quantity), 0)
  const included = Math.max(0, numeric(payload.included_quantity || meter.default_included_quantity, 0))
  const reserved = Math.max(0, numeric(payload.reserved_quantity, 0))
  const forecast = Math.max(consumed, numeric(payload.forecast_quantity, consumed))
  const pressure = included > 0 ? (Math.max(consumed, forecast) / included) * 100 : consumed > 0 ? 100 : 0
  const latestAt = text(sampleRows[0]?.measured_at) || null
  const stale = latestAt ? Date.now() - new Date(latestAt).getTime() > 1000 * 60 * 60 * 24 * 2 : true
  const state = stale ? 'stale' : pressure >= numeric(meter.hard_limit_pct, 100) ? 'blocked' : pressure >= numeric(meter.critical_limit_pct, 95) ? 'critical' : pressure >= numeric(meter.warning_limit_pct, 90) ? 'warning' : pressure >= numeric(meter.soft_limit_pct, 70) ? 'watch' : 'healthy'
  const snapshot = await insertOne<KernelCapacitySnapshot>(client, TABLES.capacitySnapshots, {
    tenant_id: tenantId,
    meter_key: meterKey,
    measured_at: new Date().toISOString(),
    included_quantity: included,
    reserved_quantity: reserved,
    consumed_quantity: consumed,
    forecast_quantity: forecast,
    pressure_pct: Number(pressure.toFixed(2)),
    confidence_pct: sampleRows.length ? Math.min(...sampleRows.map((item: Record<string, unknown>) => numeric(item.confidence_pct, 100))) : 0,
    source_freshness_at: latestAt,
    state,
  })
  const thresholds = [70, 90, 95, 100].filter((threshold) => pressure >= threshold)
  for (const threshold of thresholds) {
    const eventKey = `${tenantId}:${meterKey}:${threshold}:${new Date().toISOString().slice(0, 10)}`
    const { data: existing } = await client.from(TABLES.thresholdEvents).select('id').eq('event_key', eventKey).maybeSingle()
    if (!existing) {
      await insertOne(client, TABLES.thresholdEvents, {
        event_key: eventKey,
        tenant_id: tenantId,
        meter_key: meterKey,
        threshold_pct: threshold,
        pressure_pct: pressure,
        severity: threshold >= 100 ? 'critical' : threshold >= 95 ? 'critical' : threshold >= 90 ? 'warning' : 'info',
        snapshot_id: snapshot.id,
        status: 'open',
      })
    }
  }
  if (!internal) await audit('capacity.snapshot.refreshed', 'autonomy_capacity_snapshot', snapshot.id, snapshot as unknown as JsonRecord)
  return { ok: true, snapshot }
}

async function registerExtension(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const client = await createServiceClient()
  const manifest = object(payload.manifest_json)
  const extensionKey = requiredText(payload, 'extension_key', 'Code extension').toLowerCase()
  const compatibility = evaluateExtensionCompatibility(manifest, object(payload.platform_context_json))
  const extension = await insertOne<KernelExtensionManifest>(client, TABLES.extensions, {
    extension_key: extensionKey,
    name: requiredText(payload, 'name', 'Nom extension'),
    description: text(payload.description) || null,
    current_version: text(payload.current_version, '0.0.0'),
    lifecycle_status: 'draft',
    compatibility_status: compatibility.status,
    manifest_json: manifest,
  })
  await audit('extension.registered', 'autonomy_extension', extension.id, extension as unknown as JsonRecord, { compatibility })
  return { ok: true, extension, compatibility }
}

function evaluateExtensionCompatibility(manifest: JsonRecord, context: JsonRecord) {
  const requiredCore = text(manifest.minimum_core_version)
  const currentCore = text(context.core_version)
  const requiredPermissions = Array.isArray(manifest.permissions) ? manifest.permissions.map(String) : []
  const providedPermissions = Array.isArray(context.permissions) ? context.permissions.map(String) : []
  const missingPermissions = requiredPermissions.filter((item) => !providedPermissions.includes(item))
  const routes = Array.isArray(manifest.routes) ? manifest.routes : []
  const jobs = Array.isArray(manifest.jobs) ? manifest.jobs : []
  const reasons: string[] = []
  if (requiredCore && currentCore && requiredCore > currentCore) reasons.push(`Core ${requiredCore} requis; ${currentCore} disponible.`)
  if (missingPermissions.length) reasons.push(`Permissions absentes: ${missingPermissions.join(', ')}.`)
  if (!routes.length && !jobs.length) reasons.push('Aucune route ni aucun job déclaré.')
  return { status: reasons.length ? 'conditional' as const : 'compatible' as const, reasons, missing_permissions: missingPermissions }
}

async function publishExtensionVersion(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.approve')
  const client = await createServiceClient()
  const extensionId = requiredText(payload, 'extension_id', 'Extension')
  const extension = await getOne<KernelExtensionManifest>(client, TABLES.extensions, extensionId)
  const version = requiredText(payload, 'version', 'Version')
  const manifest = object(payload.manifest_json)
  const compatibility = evaluateExtensionCompatibility(manifest, object(payload.platform_context_json))
  if (compatibility.status !== 'compatible' && !bool(payload.accept_conditional)) throw new Error('La compatibilité n’est pas entièrement validée.')
  const versionRecord = await insertOne<JsonRecord>(client, TABLES.extensionVersions, {
    extension_id: extensionId,
    version,
    manifest_json: manifest,
    checksum: checksum(manifest),
    compatibility_json: compatibility,
    status: bool(payload.publish_now, true) ? 'published' : 'review',
  })
  await updateOne(client, TABLES.extensions, extensionId, { current_version: version, lifecycle_status: versionRecord.status, compatibility_status: compatibility.status, manifest_json: manifest, updated_at: new Date().toISOString() })
  await audit('extension.version.published', 'autonomy_extension_version', String(versionRecord.id), versionRecord, { extension_key: extension.extension_key })
  return { ok: true, version: versionRecord, compatibility }
}

async function createReleaseCandidate(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const client = await createServiceClient()
  const candidate = await insertOne<JsonRecord>(client, TABLES.releaseCandidates, {
    release_code: code('AK-REL'),
    name: requiredText(payload, 'name', 'Nom release'),
    version: requiredText(payload, 'version', 'Version'),
    channel: text(payload.channel, 'internal'),
    status: 'draft',
    changeset_id: text(payload.changeset_id) || null,
    scope_json: object(payload.scope_json),
    rollout_json: object(payload.rollout_json),
    rollback_json: object(payload.rollback_json),
    verification_json: object(payload.verification_json),
  })
  await audit('release.candidate.created', 'autonomy_release_candidate', String(candidate.id), candidate)
  return { ok: true, release_candidate: candidate }
}

async function assignReleaseTarget(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.approve')
  const client = await createServiceClient()
  const candidateId = requiredText(payload, 'release_candidate_id', 'Release candidate')
  const assignment = await insertOne<JsonRecord>(client, TABLES.releaseAssignments, {
    release_candidate_id: candidateId,
    target_type: requiredText(payload, 'target_type', 'Type de cible'),
    target_id: requiredText(payload, 'target_id', 'Cible'),
    status: 'pending',
    result_json: null,
  })
  await audit('release.target.assigned', 'autonomy_release_assignment', String(assignment.id), assignment)
  return { ok: true, assignment }
}

async function createRunbook(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.plans.update')
  const client = await createServiceClient()
  const steps = array(payload.steps_json)
  if (!steps.length) throw new Error('Un runbook doit définir au moins une étape.')
  const runbook = await insertOne<JsonRecord>(client, TABLES.runbooks, {
    runbook_key: requiredText(payload, 'runbook_key', 'Code runbook').toLowerCase(),
    name: requiredText(payload, 'name', 'Nom runbook'),
    domain: requiredText(payload, 'domain', 'Domaine'),
    version: 1,
    lifecycle_status: 'published',
    steps_json: steps,
    rollback_json: object(payload.rollback_json),
    owner_role: text(payload.owner_role) || null,
  })
  await audit('runbook.created', 'autonomy_runbook', String(runbook.id), runbook)
  return { ok: true, runbook }
}

async function recordControlEvidence(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.audit.view')
  const session = await requireAngelcare360OperatorPermission()
  const client = await createServiceClient()
  const controlId = requiredText(payload, 'control_id', 'Contrôle')
  const status = text(payload.status, 'in_progress')
  if (!['not_verified', 'in_progress', 'passed', 'failed', 'waived'].includes(status)) throw new Error('Statut de certification invalide.')
  const evidence = await insertOne<JsonRecord>(client, TABLES.certificationEvidence, {
    control_id: controlId,
    status,
    evidence_json: object(payload.evidence_json),
    evidence_uri: text(payload.evidence_uri) || null,
    verified_by: session.user.id,
    expires_at: text(payload.expires_at) || null,
  })
  const control = await updateOne<KernelCertificationControl>(client, TABLES.certificationControls, controlId, {
    status,
    last_verified_at: ['passed', 'failed', 'waived'].includes(status) ? new Date().toISOString() : null,
    expires_at: text(payload.expires_at) || null,
    updated_at: new Date().toISOString(),
  })
  await audit('certification.evidence.recorded', 'autonomy_certification_control', controlId, control as unknown as JsonRecord, { evidence_id: evidence.id })
  return { ok: true, control, evidence }
}

async function createRecoveryRehearsal(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.audit.view')
  const client = await createServiceClient()
  const rehearsal = await insertOne<KernelRecoveryRehearsal>(client, TABLES.recoveryRehearsals, {
    rehearsal_code: code('AK-DR'),
    scope: requiredText(payload, 'scope', 'Périmètre'),
    status: 'planned',
    target_rpo_minutes: payload.target_rpo_minutes === undefined ? null : integer(payload.target_rpo_minutes),
    actual_rpo_minutes: null,
    target_rto_minutes: payload.target_rto_minutes === undefined ? null : integer(payload.target_rto_minutes),
    actual_rto_minutes: null,
    evidence_json: object(payload.evidence_json),
    executed_at: null,
  })
  await audit('recovery.rehearsal.created', 'autonomy_recovery_rehearsal', rehearsal.id, rehearsal as unknown as JsonRecord)
  return { ok: true, rehearsal }
}

async function updateRecoveryRehearsal(payload: JsonRecord) {
  await requireAngelcare360OperatorPermission('operator.audit.view')
  const client = await createServiceClient()
  const id = requiredText(payload, 'rehearsal_id', 'Répétition')
  const status = text(payload.status, 'running')
  if (!['planned', 'running', 'passed', 'failed'].includes(status)) throw new Error('Statut de répétition invalide.')
  const rehearsal = await updateOne<KernelRecoveryRehearsal>(client, TABLES.recoveryRehearsals, id, {
    status,
    actual_rpo_minutes: payload.actual_rpo_minutes === undefined ? null : integer(payload.actual_rpo_minutes),
    actual_rto_minutes: payload.actual_rto_minutes === undefined ? null : integer(payload.actual_rto_minutes),
    evidence_json: object(payload.evidence_json),
    executed_at: ['passed', 'failed'].includes(status) ? new Date().toISOString() : null,
  })
  await audit('recovery.rehearsal.updated', 'autonomy_recovery_rehearsal', id, rehearsal as unknown as JsonRecord)
  return { ok: true, rehearsal }
}

export async function executeAutonomyKernelOperation(operation: AutonomyKernelOperation, payload: JsonRecord) {
  switch (operation) {
    case 'create_metadata_definition': return createMetadataDefinition(payload)
    case 'publish_metadata_version': return publishMetadataVersion(payload)
    case 'validate_metadata_record': return validateMetadataRecord(payload)
    case 'create_workflow_definition': return createWorkflowDefinition(payload)
    case 'publish_workflow_version': return publishWorkflowVersion(payload)
    case 'start_workflow_instance': return startWorkflowInstance(payload)
    case 'transition_workflow_instance': return transitionWorkflowInstance(payload)
    case 'create_policy_definition': return createPolicyDefinition(payload)
    case 'publish_policy_version': return publishPolicyVersion(payload)
    case 'evaluate_policy': return evaluatePolicy(payload)
    case 'create_changeset': return createChangeset(payload)
    case 'submit_changeset': return submitChangeset(payload)
    case 'approve_changeset': return decideChangeset(payload, 'approved')
    case 'reject_changeset': return decideChangeset(payload, 'rejected')
    case 'schedule_changeset': return advanceChangeset(payload, 'scheduled')
    case 'start_changeset_execution': return advanceChangeset(payload, 'executing')
    case 'verify_changeset': return advanceChangeset(payload, 'verified')
    case 'rollback_changeset': return advanceChangeset(payload, 'rolled_back')
    case 'compile_tenant_entitlements': return compileEntitlements(payload)
    case 'queue_provisioning_job': return queueProvisioningJob(payload)
    case 'retry_provisioning_job': return retryProvisioningJob(payload)
    case 'create_meter_definition': return createMeterDefinition(payload)
    case 'record_meter_sample': return recordMeterSample(payload)
    case 'refresh_capacity_snapshot': return refreshCapacitySnapshot(payload)
    case 'register_extension': return registerExtension(payload)
    case 'publish_extension_version': return publishExtensionVersion(payload)
    case 'create_release_candidate': return createReleaseCandidate(payload)
    case 'assign_release_target': return assignReleaseTarget(payload)
    case 'create_runbook': return createRunbook(payload)
    case 'record_control_evidence': return recordControlEvidence(payload)
    case 'create_recovery_rehearsal': return createRecoveryRehearsal(payload)
    case 'update_recovery_rehearsal': return updateRecoveryRehearsal(payload)
    default: throw new Error('Opération Autonomy Kernel inconnue.')
  }
}

async function executeProvisioningJob(client: ServiceClient, job: KernelProvisioningJob) {
  const attempts = Number(job.attempts || 0) + 1
  await updateOne(client, TABLES.provisioningJobs, job.id, { status: 'running', attempts, locked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  await insertOne(client, TABLES.provisioningSteps, { job_id: job.id, step_key: 'verify_payload', status: 'running', started_at: new Date().toISOString(), input_json: job.payload_json })
  try {
    if (job.operation !== 'verify_compiled_entitlements') throw new Error(`Opération provisioning non supportée par le worker v1: ${job.operation}`)
    const payload = object(job.payload_json)
    const canonicalResult = object(payload.canonical_result)
    const hasSnapshot = Boolean(job.entitlement_snapshot_id || canonicalResult.snapshot_id || object(canonicalResult.snapshot).id)
    if (!hasSnapshot) throw new Error('Aucun entitlement snapshot vérifiable n’est associé au job.')
    await insertOne(client, TABLES.provisioningSteps, { job_id: job.id, step_key: 'verify_runtime_contract', status: 'completed', started_at: new Date().toISOString(), completed_at: new Date().toISOString(), input_json: payload, output_json: { snapshot_present: true } })
    const result = { verified: true, entitlement_snapshot_id: job.entitlement_snapshot_id, verified_at: new Date().toISOString() }
    const completed = await updateOne<KernelProvisioningJob>(client, TABLES.provisioningJobs, job.id, { status: 'completed', result_json: result, error_json: null, completed_at: new Date().toISOString(), locked_at: null, updated_at: new Date().toISOString() })
    await insertOne(client, TABLES.outbox, { aggregate_type: 'provisioning_job', aggregate_id: job.id, event_type: 'autonomy.provisioning.completed', payload_json: result, idempotency_key: `outbox:${job.id}:completed`, status: 'pending' })
    return { ok: true, job: completed }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur provisioning inconnue.'
    const terminal = attempts >= Number(job.max_attempts || 5)
    const status = terminal ? 'dead_letter' : 'failed'
    const failed = await updateOne<KernelProvisioningJob>(client, TABLES.provisioningJobs, job.id, { status, error_json: { message }, next_attempt_at: terminal ? null : new Date(Date.now() + Math.min(attempts * 5, 60) * 60_000).toISOString(), locked_at: null, updated_at: new Date().toISOString() })
    if (terminal) await insertOne(client, TABLES.deadLetters, { source_type: 'provisioning_job', source_id: job.id, payload_json: job.payload_json, error_json: { message }, status: 'open' })
    return { ok: false, job: failed, error: message }
  }
}

export async function processAutonomyKernelProvisioningBatch(limit = 10) {
  const client = await createServiceClient()
  const now = new Date().toISOString()
  const { data, error } = await client
    .from(TABLES.provisioningJobs)
    .select('*')
    .in('status', ['queued', 'failed'])
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${now}`)
    .order('created_at', { ascending: true })
    .limit(Math.max(1, Math.min(50, limit)))
  if (error) throw new Error(error.message)
  const results = []
  for (const job of (data || []) as KernelProvisioningJob[]) results.push(await executeProvisioningJob(client, job))
  return { ok: true, processed: results.length, results }
}
