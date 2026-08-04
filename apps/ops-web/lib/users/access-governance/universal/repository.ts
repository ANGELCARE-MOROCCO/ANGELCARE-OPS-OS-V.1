import 'server-only'

import type { createAccessGovernanceAdminClient } from '../admin-client'
import type {
  JsonObject,
  UniversalAuthorityManifest,
  UniversalCommandOverview,
  UniversalEvidence,
  UniversalPlanOperation,
  UniversalReconciliationFinding,
  UniversalReconciliationPlan,
  UniversalScanJob,
  UniversalSourceFile,
  UniversalTopologyEdge,
  UniversalTopologyNode,
} from './types'
import { redactSensitiveMetadata } from './security'

type AdminClient = ReturnType<typeof createAccessGovernanceAdminClient>

type ClaimedInventoryItem = {
  id: string
  job_id: string
  relative_directory: string
}

type ClaimedWorkItem = {
  id: string
  job_id: string
  relative_path: string
  absolute_path: string
  file_kind: UniversalSourceFile['kind']
  extension: string
  size_bytes: number
  checksum: string
  modified_at: string
}

function text(value: unknown) {
  return String(value ?? '').trim()
}

function object(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonObject
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : []
}

function numberValue(value: unknown) {
  const result = Number(value ?? 0)
  return Number.isFinite(result) ? result : 0
}

function jobFromRow(rowValue: Record<string, unknown>): UniversalScanJob {
  return {
    id: text(rowValue.id),
    status: text(rowValue.status) as UniversalScanJob['status'],
    stage: text(rowValue.stage) as UniversalScanJob['stage'],
    mode: text(rowValue.mode) as UniversalScanJob['mode'],
    sourceRoot: text(rowValue.source_root),
    scope: object(rowValue.scope),
    repositoryCommit: text(rowValue.repository_commit) || null,
    scannerVersion: text(rowValue.scanner_version),
    totalWorkItems: numberValue(rowValue.total_work_items),
    completedWorkItems: numberValue(rowValue.completed_work_items),
    failedWorkItems: numberValue(rowValue.failed_work_items),
    currentItem: text(rowValue.current_item) || null,
    startedAt: text(rowValue.started_at) || null,
    completedAt: text(rowValue.completed_at) || null,
    cancelledAt: text(rowValue.cancelled_at) || null,
    pausedAt: text(rowValue.paused_at) || null,
    lastHeartbeatAt: text(rowValue.last_heartbeat_at) || null,
    elapsedMs: numberValue(rowValue.elapsed_ms),
    warnings: strings(rowValue.warnings),
    error: text(rowValue.error) || null,
    metadata: object(rowValue.metadata),
  }
}

async function insertBatches(client: AdminClient, table: string, rows: Array<Record<string, unknown>>, batchSize = 250) {
  for (let index = 0; index < rows.length; index += batchSize) {
    const { error } = await client.from(table).insert(rows.slice(index, index + batchSize))
    if (error) throw new Error(`${table} insert failed: ${error.message}`)
  }
}

async function upsertBatches(client: AdminClient, table: string, rows: Array<Record<string, unknown>>, conflict: string, batchSize = 250) {
  for (let index = 0; index < rows.length; index += batchSize) {
    const { error } = await client.from(table).upsert(rows.slice(index, index + batchSize), { onConflict: conflict })
    if (error) throw new Error(`${table} upsert failed: ${error.message}`)
  }
}

export async function createUniversalJob(
  client: AdminClient,
  input: {
    mode: UniversalScanJob['mode']
    sourceRoot: string
    scope: JsonObject
    repositoryCommit: string | null
    scannerVersion: string
    actorId: string
    actorEmail: string | null
    correlationId: string
  },
) {
  const now = new Date().toISOString()
  const { data, error } = await client.from('access_scanner_jobs').insert({
    status: 'inventorying',
    stage: 'repository_inventory',
    mode: input.mode,
    source_root: input.sourceRoot,
    scope: redactSensitiveMetadata(input.scope),
    repository_commit: input.repositoryCommit,
    scanner_version: input.scannerVersion,
    total_work_items: 0,
    completed_work_items: 0,
    failed_work_items: 0,
    current_item: null,
    warnings: [],
    metadata: { correlationId: input.correlationId },
    created_by: input.actorId,
    actor_email: input.actorEmail,
    started_at: now,
    last_heartbeat_at: now,
  }).select('*').single()
  if (error) throw new Error(`Unable to create scanner job: ${error.message}`)
  return jobFromRow(data)
}

export async function initializeUniversalInventory(client: AdminClient, jobId: string) {
  const { error } = await client.from('access_scan_inventory_items').upsert({
    job_id: jobId,
    relative_directory: '',
    status: 'pending',
    attempt_count: 0,
    metadata: {},
  }, { onConflict: 'job_id,relative_directory' })
  if (error) throw new Error(`Unable to initialize scanner inventory: ${error.message}`)
}

export async function enqueueUniversalInventoryDirectories(client: AdminClient, jobId: string, directories: string[]) {
  if (!directories.length) return
  await upsertBatches(client, 'access_scan_inventory_items', directories.map((relativeDirectory) => ({
    job_id: jobId,
    relative_directory: relativeDirectory,
    status: 'pending',
    attempt_count: 0,
    metadata: {},
  })), 'job_id,relative_directory')
}

export async function claimUniversalInventoryItems(client: AdminClient, jobId: string, workerToken: string, limit: number) {
  const { data, error } = await client.rpc('access_governance_claim_inventory_items', {
    p_job_id: jobId,
    p_worker_token: workerToken,
    p_limit: Math.max(1, Math.min(limit, 100)),
  })
  if (error) throw new Error(`Unable to claim scanner inventory work: ${error.message}`)
  return (Array.isArray(data) ? data : []).map((rowValue) => rowValue as ClaimedInventoryItem)
}

export async function completeUniversalInventoryItem(client: AdminClient, itemId: string, metadata: JsonObject) {
  const { error } = await client.from('access_scan_inventory_items').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    metadata,
    error: null,
  }).eq('id', itemId)
  if (error) throw new Error(`Unable to complete scanner inventory item: ${error.message}`)
}

export async function failUniversalInventoryItem(client: AdminClient, itemId: string, errorMessage: string) {
  const { error } = await client.from('access_scan_inventory_items').update({
    status: 'failed',
    completed_at: new Date().toISOString(),
    error: errorMessage.slice(0, 2000),
  }).eq('id', itemId)
  if (error) throw new Error(`Unable to record scanner inventory failure: ${error.message}`)
}

export async function universalInventoryProgress(client: AdminClient, jobId: string) {
  const [{ count: pending }, { count: claimed }, { count: completed }, { count: failed }] = await Promise.all([
    client.from('access_scan_inventory_items').select('id', { count: 'exact', head: true }).eq('job_id', jobId).eq('status', 'pending'),
    client.from('access_scan_inventory_items').select('id', { count: 'exact', head: true }).eq('job_id', jobId).eq('status', 'claimed'),
    client.from('access_scan_inventory_items').select('id', { count: 'exact', head: true }).eq('job_id', jobId).eq('status', 'completed'),
    client.from('access_scan_inventory_items').select('id', { count: 'exact', head: true }).eq('job_id', jobId).eq('status', 'failed'),
  ])
  return { pending: pending ?? 0, claimed: claimed ?? 0, completed: completed ?? 0, failed: failed ?? 0 }
}

export async function storeUniversalWorkItems(client: AdminClient, jobId: string, files: UniversalSourceFile[]) {
  const rows = files.map((file, index) => ({
    job_id: jobId,
    sequence_number: index + 1,
    status: 'pending',
    relative_path: file.relativePath,
    absolute_path: file.absolutePath,
    file_kind: file.kind,
    extension: file.extension,
    size_bytes: file.sizeBytes,
    checksum: file.checksum,
    modified_at: file.modifiedAt,
    attempt_count: 0,
    metadata: {},
  }))
  if (rows.length) await upsertBatches(client, 'access_scan_work_items', rows, 'job_id,relative_path')
  const { count, error: countError } = await client.from('access_scan_work_items').select('id', { count: 'exact', head: true }).eq('job_id', jobId)
  if (countError) throw new Error(`Unable to count scanner source work: ${countError.message}`)
  const { error } = await client.from('access_scanner_jobs').update({
    total_work_items: count ?? 0,
    last_heartbeat_at: new Date().toISOString(),
  }).eq('id', jobId)
  if (error) throw new Error(`Unable to refresh scanner source inventory: ${error.message}`)
}

export async function activateUniversalSourceAnalysis(client: AdminClient, jobId: string) {
  const { count, error: countError } = await client.from('access_scan_work_items').select('id', { count: 'exact', head: true }).eq('job_id', jobId)
  if (countError) throw new Error(`Unable to count scanner source work: ${countError.message}`)
  const { data, error } = await client.from('access_scanner_jobs').update({
    status: 'running',
    stage: 'source_analysis',
    total_work_items: count ?? 0,
    current_item: null,
    last_heartbeat_at: new Date().toISOString(),
  }).eq('id', jobId).select('*').single()
  if (error) throw new Error(`Unable to activate scanner source analysis: ${error.message}`)
  return jobFromRow(data)
}

export async function claimUniversalWorkItems(client: AdminClient, jobId: string, workerToken: string, limit: number) {
  const { data, error } = await client.rpc('access_governance_claim_scan_work_items', {
    p_job_id: jobId,
    p_worker_token: workerToken,
    p_limit: Math.max(1, Math.min(limit, 100)),
  })
  if (error) throw new Error(`Unable to claim scanner work: ${error.message}`)
  const rows = Array.isArray(data) ? data : []
  return rows.map((rowValue) => rowValue as ClaimedWorkItem)
}

export function sourceFileFromWorkItem(item: ClaimedWorkItem): UniversalSourceFile {
  return {
    absolutePath: item.absolute_path,
    relativePath: item.relative_path,
    extension: item.extension,
    sizeBytes: numberValue(item.size_bytes),
    modifiedAt: item.modified_at,
    checksum: item.checksum,
    kind: item.file_kind,
  }
}

export async function completeUniversalWorkItem(client: AdminClient, itemId: string, outputCounts: JsonObject) {
  const { error } = await client.from('access_scan_work_items').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    metadata: outputCounts,
    error: null,
  }).eq('id', itemId)
  if (error) throw new Error(`Unable to complete scanner work item: ${error.message}`)
}

export async function failUniversalWorkItem(client: AdminClient, itemId: string, errorMessage: string) {
  const { error } = await client.from('access_scan_work_items').update({
    status: 'failed',
    completed_at: new Date().toISOString(),
    error: errorMessage.slice(0, 2000),
  }).eq('id', itemId)
  if (error) throw new Error(`Unable to record scanner work failure: ${error.message}`)
}

export async function persistUniversalAnalysis(
  client: AdminClient,
  input: {
    evidence: UniversalEvidence[]
    nodes: UniversalTopologyNode[]
    edges: UniversalTopologyEdge[]
  },
) {
  if (input.evidence.length) {
    await upsertBatches(client, 'access_authorization_evidence', input.evidence.map((item) => ({
      evidence_key: item.evidenceKey,
      scan_id: item.scanId,
      evidence_kind: item.kind,
      subject_key: item.subjectKey,
      object_key: item.objectKey,
      file_path: item.filePath,
      line_start: item.lineStart,
      line_end: item.lineEnd,
      database_object: item.databaseObject,
      summary: item.summary,
      excerpt: item.excerpt,
      confidence: item.confidence,
      confidence_score: item.confidenceScore,
      metadata: redactSensitiveMetadata(item.metadata),
    })), 'scan_id,evidence_key')
  }
  if (input.nodes.length) {
    await upsertBatches(client, 'access_topology_nodes', input.nodes.map((item) => ({
      node_key: item.nodeKey,
      scan_id: item.scanId,
      node_type: item.nodeType,
      canonical_key: item.canonicalKey,
      display_name: item.displayName,
      application_key: item.applicationKey,
      module_key: item.moduleKey,
      workspace_key: item.workspaceKey,
      authority_model: item.authorityModel,
      risk_level: item.riskLevel,
      confidence: item.confidence,
      confidence_score: item.confidenceScore,
      metadata: redactSensitiveMetadata(item.metadata),
    })), 'scan_id,node_key')
  }
  if (input.edges.length) {
    await upsertBatches(client, 'access_topology_edges', input.edges.map((item) => ({
      edge_key: item.edgeKey,
      scan_id: item.scanId,
      source_node_key: item.sourceNodeKey,
      target_node_key: item.targetNodeKey,
      edge_type: item.edgeType,
      confidence: item.confidence,
      confidence_score: item.confidenceScore,
      metadata: redactSensitiveMetadata(item.metadata),
    })), 'scan_id,edge_key')
  }
}

export async function refreshUniversalJobProgress(client: AdminClient, jobId: string, currentItem: string | null = null) {
  const [{ count: completed }, { count: failed }, { data: jobRows, error: jobError }] = await Promise.all([
    client.from('access_scan_work_items').select('id', { count: 'exact', head: true }).eq('job_id', jobId).eq('status', 'completed'),
    client.from('access_scan_work_items').select('id', { count: 'exact', head: true }).eq('job_id', jobId).eq('status', 'failed'),
    client.from('access_scanner_jobs').select('*').eq('id', jobId).limit(1),
  ])
  if (jobError) throw new Error(`Unable to load scanner job: ${jobError.message}`)
  const current = jobRows?.[0]
  if (!current) throw new Error('Scanner job was not found.')
  const startedAt = new Date(String(current.started_at ?? new Date().toISOString())).getTime()
  const elapsedMs = Math.max(0, Date.now() - startedAt)
  const { data, error } = await client.from('access_scanner_jobs').update({
    completed_work_items: completed ?? 0,
    failed_work_items: failed ?? 0,
    current_item: currentItem,
    elapsed_ms: elapsedMs,
    last_heartbeat_at: new Date().toISOString(),
  }).eq('id', jobId).select('*').single()
  if (error) throw new Error(`Unable to update scanner progress: ${error.message}`)
  return jobFromRow(data)
}

export async function loadUniversalJob(client: AdminClient, jobId: string) {
  const { data, error } = await client.from('access_scanner_jobs').select('*').eq('id', jobId).maybeSingle()
  if (error) throw new Error(`Unable to load scanner job: ${error.message}`)
  return data ? jobFromRow(data) : null
}

export async function updateUniversalJobState(
  client: AdminClient,
  jobId: string,
  patch: Partial<{
    status: UniversalScanJob['status']
    stage: UniversalScanJob['stage']
    currentItem: string | null
    completedAt: string | null
    cancelledAt: string | null
    pausedAt: string | null
    warnings: string[]
    error: string | null
  }>,
) {
  const row: Record<string, unknown> = { last_heartbeat_at: new Date().toISOString() }
  if (patch.status !== undefined) row.status = patch.status
  if (patch.stage !== undefined) row.stage = patch.stage
  if (patch.currentItem !== undefined) row.current_item = patch.currentItem
  if (patch.completedAt !== undefined) row.completed_at = patch.completedAt
  if (patch.cancelledAt !== undefined) row.cancelled_at = patch.cancelledAt
  if (patch.pausedAt !== undefined) row.paused_at = patch.pausedAt
  if (patch.warnings !== undefined) row.warnings = patch.warnings
  if (patch.error !== undefined) row.error = patch.error
  const { data, error } = await client.from('access_scanner_jobs').update(row).eq('id', jobId).select('*').single()
  if (error) throw new Error(`Unable to update scanner job: ${error.message}`)
  return jobFromRow(data)
}

export async function loadUniversalScanGraph(client: AdminClient, scanId: string) {
  const [nodesResult, edgesResult, evidenceResult] = await Promise.all([
    client.from('access_topology_nodes').select('*').eq('scan_id', scanId).limit(50000),
    client.from('access_topology_edges').select('*').eq('scan_id', scanId).limit(100000),
    client.from('access_authorization_evidence').select('*').eq('scan_id', scanId).limit(100000),
  ])
  if (nodesResult.error) throw new Error(`Unable to load topology nodes: ${nodesResult.error.message}`)
  if (edgesResult.error) throw new Error(`Unable to load topology edges: ${edgesResult.error.message}`)
  if (evidenceResult.error) throw new Error(`Unable to load authorization evidence: ${evidenceResult.error.message}`)
  return {
    nodes: nodesResult.data ?? [],
    edges: edgesResult.data ?? [],
    evidence: evidenceResult.data ?? [],
  }
}

export async function replaceUniversalManifests(client: AdminClient, scanId: string, manifests: UniversalAuthorityManifest[]) {
  const { error: deleteError } = await client.from('access_authority_manifests').delete().eq('scan_id', scanId).eq('validation_status', 'generated')
  if (deleteError) throw new Error(`Unable to refresh generated manifests: ${deleteError.message}`)
  if (!manifests.length) return
  await upsertBatches(client, 'access_authority_manifests', manifests.map((item) => ({
    manifest_key: item.manifestKey,
    scan_id: item.scanId,
    application_key: item.applicationKey,
    module_key: item.moduleKey,
    display_name: item.displayName,
    authority_models: item.authorityModels,
    identity_authority: item.identityAuthority,
    global_authority: item.globalAuthority,
    membership_authority: item.membershipAuthority,
    role_authority: item.roleAuthority,
    permission_authority: item.permissionAuthority,
    tenant_authority: item.tenantAuthority,
    organization_authority: item.organizationAuthority,
    workspace_authority: item.workspaceAuthority,
    entitlement_authority: item.entitlementAuthority,
    rls_authority: item.rlsAuthority,
    revocation_authority: item.revocationAuthority,
    audit_authority: item.auditAuthority,
    cache_authority: item.cacheAuthority,
    mutation_authority: item.mutationAuthority,
    evidence_keys: item.evidenceKeys,
    confidence: item.confidence,
    confidence_score: item.confidenceScore,
    validation_status: item.validationStatus,
    executable: item.executable,
    unresolved: item.unresolved,
    metadata: item.metadata,
  })), 'scan_id,manifest_key')
}

export async function replaceUniversalFindings(client: AdminClient, scanId: string, findings: UniversalReconciliationFinding[]) {
  const { error: deleteError } = await client.from('access_reconciliation_findings').delete().eq('scan_id', scanId).eq('status', 'open')
  if (deleteError) throw new Error(`Unable to refresh reconciliation findings: ${deleteError.message}`)
  if (!findings.length) return
  await upsertBatches(client, 'access_reconciliation_findings', findings.map((item) => ({
    finding_key: item.findingKey,
    scan_id: item.scanId,
    reconciliation_state: item.state,
    severity: item.severity,
    application_key: item.applicationKey,
    module_key: item.moduleKey,
    workspace_key: item.workspaceKey,
    operation_key: item.operationKey,
    user_id: item.userId,
    tenant_id: item.tenantId,
    organization_id: item.organizationId,
    title: item.title,
    explanation: item.explanation,
    expected_state: item.expectedState,
    effective_state: item.effectiveState,
    evidence_keys: item.evidenceKeys,
    confidence: item.confidence,
    confidence_score: item.confidenceScore,
    execution_eligible: item.executionEligible,
    blocked_reasons: item.blockedReasons,
    proposed_operations: item.proposedOperations,
    status: item.status,
    metadata: item.metadata,
  })), 'scan_id,finding_key')
}

function planOperationFromRow(row: Record<string, unknown>): UniversalPlanOperation {
  return {
    operationKey: text(row.operation_key),
    type: text(row.operation_type) as UniversalPlanOperation['type'],
    sequence: numberValue(row.sequence_number),
    title: text(row.title),
    explanation: text(row.explanation),
    riskLevel: text(row.risk_level) as UniversalPlanOperation['riskLevel'],
    beforeState: object(row.before_state),
    proposedState: object(row.proposed_state),
    target: object(row.target),
    authorityManifestKey: text(row.authority_manifest_key) || null,
    mutationRpc: text(row.mutation_rpc) || null,
    mutationArguments: object(row.mutation_arguments),
    verificationRpc: text(row.verification_rpc) || null,
    verificationArguments: object(row.verification_arguments),
    rollbackRpc: text(row.rollback_rpc) || null,
    rollbackArguments: object(row.rollback_arguments),
    evidenceKeys: strings(row.evidence_keys),
    executionEligible: Boolean(row.execution_eligible),
    blockedReasons: strings(row.blocked_reasons),
  }
}

function planFromRow(row: Record<string, unknown>, operations: UniversalPlanOperation[]): UniversalReconciliationPlan {
  return {
    id: text(row.id),
    planKey: text(row.plan_key),
    title: text(row.title),
    description: text(row.description),
    status: text(row.status) as UniversalReconciliationPlan['status'],
    riskLevel: text(row.risk_level) as UniversalReconciliationPlan['riskLevel'],
    sourceScanId: text(row.source_scan_id),
    findingKeys: strings(row.finding_keys),
    operations,
    simulation: object(row.simulation),
    executionEligible: Boolean(row.execution_eligible),
    blockedReasons: strings(row.blocked_reasons),
    expiresAt: text(row.expires_at) || null,
    approvedAt: text(row.approved_at) || null,
    approvedBy: text(row.approved_by) || null,
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  }
}

export async function loadUniversalPlans(client: AdminClient, limit = 50) {
  const { data: planRows, error } = await client.from('access_reconciliation_plans').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`Unable to load reconciliation plans: ${error.message}`)
  const plans: UniversalReconciliationPlan[] = []
  for (const rowValue of planRows ?? []) {
    const row = rowValue as Record<string, unknown>
    const { data: operationRows, error: operationError } = await client.from('access_plan_operations').select('*').eq('plan_id', row.id).order('sequence_number', { ascending: true })
    if (operationError) throw new Error(`Unable to load plan operations: ${operationError.message}`)
    plans.push(planFromRow(row, (operationRows ?? []).map((item: Record<string, unknown>) => planOperationFromRow(item))))
  }
  return plans
}

export async function loadUniversalOverview(client: AdminClient): Promise<UniversalCommandOverview> {
  const { data, error } = await client.rpc('access_governance_command_overview')
  if (error) throw new Error(`Unable to load authorization command overview: ${error.message}`)
  const row = object(data)
  return {
    generatedAt: text(row.generatedAt ?? row.generated_at) || new Date().toISOString(),
    scannerVersion: text(row.scannerVersion ?? row.scanner_version) || '4.0.0',
    repositoryCommit: text(row.repositoryCommit ?? row.repository_commit) || null,
    capabilityStatus: (text(row.capabilityStatus ?? row.capability_status) || 'degraded') as UniversalCommandOverview['capabilityStatus'],
    latestJob: row.latestJob || row.latest_job ? jobFromRow(object(row.latestJob ?? row.latest_job)) : null,
    counts: {
      applications: numberValue(object(row.counts).applications),
      modules: numberValue(object(row.counts).modules),
      workspaces: numberValue(object(row.counts).workspaces),
      pages: numberValue(object(row.counts).pages),
      apiOperations: numberValue(object(row.counts).apiOperations ?? object(row.counts).api_operations),
      serverActions: numberValue(object(row.counts).serverActions ?? object(row.counts).server_actions),
      protectedOperations: numberValue(object(row.counts).protectedOperations ?? object(row.counts).protected_operations),
      unprotectedOperations: numberValue(object(row.counts).unprotectedOperations ?? object(row.counts).unprotected_operations),
      permissionNamespaces: numberValue(object(row.counts).permissionNamespaces ?? object(row.counts).permission_namespaces),
      nativeAuthorities: numberValue(object(row.counts).nativeAuthorities ?? object(row.counts).native_authorities),
      rlsPolicies: numberValue(object(row.counts).rlsPolicies ?? object(row.counts).rls_policies),
      unknownAuthorities: numberValue(object(row.counts).unknownAuthorities ?? object(row.counts).unknown_authorities),
      findings: numberValue(object(row.counts).findings),
      criticalFindings: numberValue(object(row.counts).criticalFindings ?? object(row.counts).critical_findings),
      openPlans: numberValue(object(row.counts).openPlans ?? object(row.counts).open_plans),
      runningExecutions: numberValue(object(row.counts).runningExecutions ?? object(row.counts).running_executions),
    },
    health: {
      repositoryDiscovery: numberValue(object(row.health).repositoryDiscovery ?? object(row.health).repository_discovery),
      authorizationIntelligence: numberValue(object(row.health).authorizationIntelligence ?? object(row.health).authorization_intelligence),
      scopeIntegrity: numberValue(object(row.health).scopeIntegrity ?? object(row.health).scope_integrity),
      reconciliationReadiness: numberValue(object(row.health).reconciliationReadiness ?? object(row.health).reconciliation_readiness),
      executionReadiness: numberValue(object(row.health).executionReadiness ?? object(row.health).execution_readiness),
    },
    riskDistribution: object(row.riskDistribution ?? row.risk_distribution) as Record<string, number>,
    driftDistribution: object(row.driftDistribution ?? row.drift_distribution) as Record<string, number>,
    authorityModels: object(row.authorityModels ?? row.authority_models) as Record<string, number>,
    recentFindings: [],
    recentPlans: await loadUniversalPlans(client, 10),
    capabilities: Array.isArray(row.capabilities) ? row.capabilities.map((item) => {
      const capability = object(item)
      return {
        key: text(capability.key),
        label: text(capability.label),
        status: text(capability.status) as 'ready' | 'degraded' | 'blocked',
        detail: text(capability.detail),
      }
    }) : [],
  }
}
