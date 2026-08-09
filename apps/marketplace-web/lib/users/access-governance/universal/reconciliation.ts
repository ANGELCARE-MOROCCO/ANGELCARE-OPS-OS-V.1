import 'server-only'

import { createHash, randomUUID } from 'node:crypto'
import type { createAccessGovernanceAdminClient } from '../admin-client'
import type {
  JsonObject,
  PlanOperationType,
  UniversalAuthorityManifest,
  UniversalEvidence,
  UniversalPlanOperation,
  UniversalReconciliationFinding,
  UniversalReconciliationPlan,
  UniversalTopologyNode,
} from './types'

type AdminClient = ReturnType<typeof createAccessGovernanceAdminClient>

type RegistryResource = {
  resource_key: string
  module_key: string | null
  permission_key: string
  resource_type: string
  protected: boolean
  status: string
}

type AppUser = {
  id: string
  permissions: unknown
  tenant_id?: unknown
  organization_id?: unknown
  status?: unknown
}

function stableKey(prefix: string, ...parts: string[]) {
  return `${prefix}:${createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 24)}`
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : []
}

function severityForState(state: UniversalReconciliationFinding['state']): UniversalReconciliationFinding['severity'] {
  if (['UNPROTECTED_OPERATION', 'CONFLICTING_AUTHORITIES', 'SCOPE_MISMATCH', 'RLS_MISMATCH', 'REVOCATION_DRIFT', 'EXCESS_AUTHORITY'].includes(state)) return 'critical'
  if (['ROLE_MISSING', 'PERMISSION_MISSING', 'MEMBERSHIP_MISSING', 'NATIVE_ONLY', 'DUPLICATE_AUTHORITY', 'ORPHAN_AUTHORITY'].includes(state)) return 'high'
  if (['UNKNOWN_AUTHORITY', 'PARTIAL_SYNCHRONIZATION', 'CACHE_DRIFT', 'STALE_GRANT', 'LEGACY_ONLY', 'ROUTE_ONLY'].includes(state)) return 'review'
  return 'info'
}

function proposedOperationsForState(state: UniversalReconciliationFinding['state']): PlanOperationType[] {
  const mapping: Partial<Record<UniversalReconciliationFinding['state'], PlanOperationType[]>> = {
    ROUTE_ONLY: ['CREATE_MEMBERSHIP', 'ASSIGN_ROLE', 'INCREMENT_GRANT_VERSION', 'INVALIDATE_AUTHORIZATION_CACHE', 'WRITE_AUDIT_EVENT', 'VERIFY_EFFECTIVE_ACCESS'],
    MEMBERSHIP_MISSING: ['CREATE_MEMBERSHIP', 'INCREMENT_GRANT_VERSION', 'INVALIDATE_AUTHORIZATION_CACHE', 'WRITE_AUDIT_EVENT', 'VERIFY_EFFECTIVE_ACCESS'],
    ROLE_MISSING: ['ASSIGN_ROLE', 'INCREMENT_GRANT_VERSION', 'INVALIDATE_AUTHORIZATION_CACHE', 'WRITE_AUDIT_EVENT', 'VERIFY_EFFECTIVE_ACCESS'],
    PERMISSION_MISSING: ['ADD_PERMISSION', 'INCREMENT_GRANT_VERSION', 'INVALIDATE_AUTHORIZATION_CACHE', 'WRITE_AUDIT_EVENT', 'VERIFY_EFFECTIVE_ACCESS'],
    ENTITLEMENT_MISSING: ['ADD_ENTITLEMENT', 'INCREMENT_GRANT_VERSION', 'INVALIDATE_AUTHORIZATION_CACHE', 'WRITE_AUDIT_EVENT', 'VERIFY_EFFECTIVE_ACCESS'],
    REVOCATION_DRIFT: ['DEACTIVATE_MEMBERSHIP', 'REVOKE_ROLE', 'REVOKE_ENTITLEMENT', 'INCREMENT_GRANT_VERSION', 'INVALIDATE_AUTHORIZATION_CACHE', 'WRITE_AUDIT_EVENT', 'VERIFY_EFFECTIVE_ACCESS'],
    SCOPE_MISMATCH: ['NORMALIZE_TENANT_SCOPE', 'NORMALIZE_ORGANIZATION_SCOPE', 'NORMALIZE_WORKSPACE_SCOPE', 'INCREMENT_GRANT_VERSION', 'INVALIDATE_AUTHORIZATION_CACHE', 'WRITE_AUDIT_EVENT', 'VERIFY_EFFECTIVE_ACCESS'],
    LEGACY_ONLY: ['SUPERSEDE_LEGACY_ASSIGNMENT', 'NORMALIZE_GLOBAL_REGISTRY', 'WRITE_AUDIT_EVENT', 'VERIFY_EFFECTIVE_ACCESS'],
    STALE_GRANT: ['INCREMENT_GRANT_VERSION', 'INVALIDATE_AUTHORIZATION_CACHE', 'WRITE_AUDIT_EVENT', 'VERIFY_EFFECTIVE_ACCESS'],
    CACHE_DRIFT: ['INVALIDATE_AUTHORIZATION_CACHE', 'VERIFY_EFFECTIVE_ACCESS'],
  }
  return mapping[state] ?? []
}

function evidenceKeysForNode(nodeKey: string, evidence: UniversalEvidence[]) {
  return evidence.filter((item) => item.subjectKey === nodeKey || item.objectKey === nodeKey).map((item) => item.evidenceKey).slice(0, 100)
}

function manifestForApplication(applicationKey: string | null, manifests: UniversalAuthorityManifest[]) {
  return applicationKey ? manifests.find((manifest) => manifest.applicationKey === applicationKey) ?? null : null
}

function finding(input: Omit<UniversalReconciliationFinding, 'severity' | 'proposedOperations' | 'status'>): UniversalReconciliationFinding {
  return {
    ...input,
    severity: severityForState(input.state),
    proposedOperations: proposedOperationsForState(input.state),
    status: 'open',
  }
}

export async function buildUniversalReconciliationFindings(
  client: AdminClient,
  scanId: string,
  nodes: UniversalTopologyNode[],
  evidence: UniversalEvidence[],
  manifests: UniversalAuthorityManifest[],
) {
  const findings: UniversalReconciliationFinding[] = []
  const [resourceResult, usersResult] = await Promise.all([
    client.from('access_resource_registry').select('resource_key,module_key,permission_key,resource_type,protected,status').eq('status', 'active').limit(50000),
    client.from('app_users').select('id,permissions,tenant_id,organization_id,status').limit(10000),
  ])
  if (resourceResult.error) throw new Error(`Unable to read global resource assignments: ${resourceResult.error.message}`)
  if (usersResult.error) throw new Error(`Unable to read company users for reconciliation: ${usersResult.error.message}`)

  const resources = (resourceResult.data ?? []) as RegistryResource[]
  const users = (usersResult.data ?? []) as AppUser[]

  for (const node of nodes.filter((item) => ['api_operation', 'server_action'].includes(item.nodeType))) {
    const relatedEvidence = evidence.filter((item) => item.subjectKey === node.nodeKey)
    const unprotected = relatedEvidence.find((item) => item.metadata.category === 'unprotected_candidate')
    if (!unprotected) continue
    findings.push(finding({
      findingKey: stableKey('finding', scanId, 'UNPROTECTED_OPERATION', node.nodeKey),
      scanId,
      state: 'UNPROTECTED_OPERATION',
      applicationKey: node.applicationKey,
      moduleKey: node.moduleKey,
      workspaceKey: node.workspaceKey,
      operationKey: node.canonicalKey,
      userId: null,
      tenantId: null,
      organizationId: null,
      title: `Authorization guard requires review: ${node.displayName}`,
      explanation: 'The syntax-aware scan did not reconstruct a reliable authentication or authorization guard for this operation. It is quarantined until evidence confirms protection or an explicit public classification is approved.',
      expectedState: { protection: 'confirmed_guard_or_explicit_public' },
      effectiveState: { protection: 'unverified', sourcePath: String(node.metadata.sourcePath ?? '') },
      evidenceKeys: evidenceKeysForNode(node.nodeKey, evidence),
      confidence: unprotected.confidence,
      confidenceScore: unprotected.confidenceScore,
      executionEligible: false,
      blockedReasons: ['Source protection must be reviewed; the scanner never auto-adds authorization code.'],
      metadata: { riskLevel: node.riskLevel },
    }))
  }

  for (const manifest of manifests) {
    if (manifest.authorityModels.includes('UNKNOWN') || manifest.unresolved.length) {
      findings.push(finding({
        findingKey: stableKey('finding', scanId, 'UNKNOWN_AUTHORITY', manifest.manifestKey),
        scanId,
        state: 'UNKNOWN_AUTHORITY',
        applicationKey: manifest.applicationKey,
        moduleKey: manifest.moduleKey,
        workspaceKey: null,
        operationKey: null,
        userId: null,
        tenantId: null,
        organizationId: null,
        title: `Authority topology needs confirmation: ${manifest.displayName}`,
        explanation: 'The engine discovered the application family but cannot yet prove every membership, role, permission, scope, revocation, audit, cache, and verification authority required for safe execution.',
        expectedState: { manifest: 'confirmed', executable: true },
        effectiveState: { manifest: manifest.validationStatus, executable: manifest.executable, unresolved: manifest.unresolved },
        evidenceKeys: manifest.evidenceKeys,
        confidence: manifest.confidence,
        confidenceScore: manifest.confidenceScore,
        executionEligible: false,
        blockedReasons: manifest.unresolved,
        metadata: { authorityModels: manifest.authorityModels },
      }))
    }
  }

  const resourcesByModule = new Map<string, RegistryResource[]>()
  for (const resource of resources) {
    const moduleKey = resource.module_key
    if (!moduleKey) continue
    const current = resourcesByModule.get(moduleKey) ?? []
    current.push(resource)
    resourcesByModule.set(moduleKey, current)
  }

  for (const user of users) {
    if (String(user.status ?? 'active').toLowerCase() !== 'active') continue
    const assigned = new Set(stringArray(user.permissions))
    if (!assigned.size) continue
    for (const [moduleKey, moduleResources] of resourcesByModule) {
      const globallyAssigned = assigned.has('*') || moduleResources.some((resource) => assigned.has(resource.permission_key))
      if (!globallyAssigned) continue
      const manifest = manifestForApplication(moduleKey, manifests)
      if (!manifest) {
        findings.push(finding({
          findingKey: stableKey('finding', scanId, 'ROUTE_ONLY', user.id, moduleKey),
          scanId,
          state: 'ROUTE_ONLY',
          applicationKey: moduleKey,
          moduleKey,
          workspaceKey: null,
          operationKey: null,
          userId: user.id,
          tenantId: String(user.tenant_id ?? '') || null,
          organizationId: String(user.organization_id ?? '') || null,
          title: 'Global access exists without a reconstructed native authority',
          explanation: 'Users Management grants at least one route or module permission, but the scanner has not reconstructed a native membership, role, entitlement, or database authority for this family. Visibility cannot be treated as proof of effective operational access.',
          expectedState: { globalAssignment: true, nativeAuthority: 'verified_or_explicitly_not_required' },
          effectiveState: { globalAssignment: true, nativeAuthority: 'not_reconstructed' },
          evidenceKeys: [],
          confidence: 'probable',
          confidenceScore: 0.7,
          executionEligible: false,
          blockedReasons: ['A confirmed authority manifest is required before any synchronization operation can be generated.'],
          metadata: { resourceCount: moduleResources.length },
        }))
        continue
      }
      const nativeExpected = manifest.authorityModels.some((model) => ['NATIVE_RBAC', 'MEMBERSHIP_AND_ROLE', 'ENTITLEMENT_BASED', 'TENANT_MEMBERSHIP', 'WORKSPACE_MEMBERSHIP', 'RLS_ENFORCED'].includes(model))
      if (nativeExpected && manifest.validationStatus !== 'confirmed') {
        findings.push(finding({
          findingKey: stableKey('finding', scanId, 'PARTIAL_SYNCHRONIZATION', user.id, moduleKey),
          scanId,
          state: 'PARTIAL_SYNCHRONIZATION',
          applicationKey: manifest.applicationKey,
          moduleKey,
          workspaceKey: null,
          operationKey: null,
          userId: user.id,
          tenantId: String(user.tenant_id ?? '') || null,
          organizationId: String(user.organization_id ?? '') || null,
          title: 'Global assignment cannot yet be proven against native authority',
          explanation: 'The user has global module access and the application appears to use native authority, but the evidence-backed manifest is not confirmed. The engine refuses to claim synchronization or execute a backfill until the authority model is verified.',
          expectedState: { globalAssignment: true, nativeAuthority: 'confirmed_and_reconciled' },
          effectiveState: { globalAssignment: true, manifestStatus: manifest.validationStatus, manifestConfidence: manifest.confidenceScore },
          evidenceKeys: manifest.evidenceKeys,
          confidence: manifest.confidence,
          confidenceScore: manifest.confidenceScore,
          executionEligible: false,
          blockedReasons: manifest.unresolved,
          metadata: { authorityModels: manifest.authorityModels },
        }))
      }
    }
  }

  const unique = new Map(findings.map((item) => [item.findingKey, item]))
  return [...unique.values()].sort((left, right) => {
    const rank = { critical: 0, high: 1, review: 2, info: 3 }
    return rank[left.severity] - rank[right.severity] || left.title.localeCompare(right.title)
  })
}

function operationForFinding(
  findingValue: UniversalReconciliationFinding,
  operationType: PlanOperationType,
  sequence: number,
  manifest: UniversalAuthorityManifest | null,
): UniversalPlanOperation {
  const mutationRpc = manifest && typeof manifest.mutationAuthority.rpc === 'string' ? manifest.mutationAuthority.rpc : null
  const verificationRpc = manifest && typeof manifest.mutationAuthority.verificationRpc === 'string' ? manifest.mutationAuthority.verificationRpc : null
  const rollbackRpc = manifest && typeof manifest.mutationAuthority.rollbackRpc === 'string' ? manifest.mutationAuthority.rollbackRpc : null
  const nativeOperation = !['NORMALIZE_GLOBAL_REGISTRY', 'WRITE_AUDIT_EVENT', 'VERIFY_EFFECTIVE_ACCESS', 'INVALIDATE_AUTHORIZATION_CACHE'].includes(operationType)
  const blockedReasons: string[] = []
  if (!manifest || manifest.validationStatus !== 'confirmed') blockedReasons.push('Authority manifest is not confirmed.')
  if (nativeOperation && !mutationRpc) blockedReasons.push('No evidence-backed mutation RPC is registered for this authority.')
  if (operationType === 'VERIFY_EFFECTIVE_ACCESS' && !verificationRpc) blockedReasons.push('No evidence-backed verification RPC is registered for this authority.')
  return {
    operationKey: stableKey('operation', findingValue.findingKey, operationType),
    type: operationType,
    sequence,
    title: operationType.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase()),
    explanation: `Proposed from ${findingValue.state}: ${findingValue.explanation}`,
    riskLevel: findingValue.severity === 'critical' ? 'critical' : findingValue.severity === 'high' ? 'high' : 'controlled',
    beforeState: findingValue.effectiveState,
    proposedState: findingValue.expectedState,
    target: {
      userId: findingValue.userId,
      applicationKey: findingValue.applicationKey,
      moduleKey: findingValue.moduleKey,
      workspaceKey: findingValue.workspaceKey,
      tenantId: findingValue.tenantId,
      organizationId: findingValue.organizationId,
    },
    authorityManifestKey: manifest?.manifestKey ?? null,
    mutationRpc: operationType === 'VERIFY_EFFECTIVE_ACCESS' ? verificationRpc : mutationRpc,
    mutationArguments: {
      operationType,
      findingKey: findingValue.findingKey,
      userId: findingValue.userId,
      tenantId: findingValue.tenantId,
      organizationId: findingValue.organizationId,
      moduleKey: findingValue.moduleKey,
    },
    verificationRpc,
    verificationArguments: { findingKey: findingValue.findingKey, userId: findingValue.userId, moduleKey: findingValue.moduleKey },
    rollbackRpc,
    rollbackArguments: { findingKey: findingValue.findingKey, userId: findingValue.userId, moduleKey: findingValue.moduleKey },
    evidenceKeys: findingValue.evidenceKeys,
    executionEligible: blockedReasons.length === 0,
    blockedReasons,
  }
}

export function buildUniversalReconciliationPlan(
  sourceScanId: string,
  title: string,
  description: string,
  findings: UniversalReconciliationFinding[],
  manifests: UniversalAuthorityManifest[],
): UniversalReconciliationPlan {
  const operations: UniversalPlanOperation[] = []
  let sequence = 1
  for (const findingValue of findings) {
    const manifest = manifestForApplication(findingValue.applicationKey, manifests)
    for (const operationType of findingValue.proposedOperations) {
      operations.push(operationForFinding(findingValue, operationType, sequence, manifest))
      sequence += 1
    }
  }
  const blockedReasons = [...new Set(operations.flatMap((operation) => operation.blockedReasons))]
  const riskLevel = operations.some((operation) => operation.riskLevel === 'critical')
    ? 'critical'
    : operations.some((operation) => operation.riskLevel === 'high') ? 'high' : 'controlled'
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  return {
    id: randomUUID(),
    planKey: stableKey('plan', sourceScanId, ...findings.map((item) => item.findingKey)),
    title,
    description,
    status: blockedReasons.length ? 'review_required' : 'draft',
    riskLevel,
    sourceScanId,
    findingKeys: findings.map((item) => item.findingKey),
    operations,
    simulation: {
      operationCount: operations.length,
      eligibleOperationCount: operations.filter((operation) => operation.executionEligible).length,
      blockedOperationCount: operations.filter((operation) => !operation.executionEligible).length,
      affectedUsers: [...new Set(findings.map((item) => item.userId).filter(Boolean))].length,
      affectedApplications: [...new Set(findings.map((item) => item.applicationKey).filter(Boolean))].length,
    },
    executionEligible: operations.length > 0 && blockedReasons.length === 0,
    blockedReasons,
    expiresAt,
    approvedAt: null,
    approvedBy: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

export async function persistUniversalPlan(client: AdminClient, plan: UniversalReconciliationPlan, actorId: string, actorEmail: string | null) {
  const { data, error } = await client.from('access_reconciliation_plans').insert({
    id: plan.id,
    plan_key: plan.planKey,
    title: plan.title,
    description: plan.description,
    status: plan.status,
    risk_level: plan.riskLevel,
    source_scan_id: plan.sourceScanId,
    finding_keys: plan.findingKeys,
    simulation: plan.simulation,
    execution_eligible: plan.executionEligible,
    blocked_reasons: plan.blockedReasons,
    expires_at: plan.expiresAt,
    created_by: actorId,
    actor_email: actorEmail,
  }).select('*').single()
  if (error) throw new Error(`Unable to create reconciliation plan: ${error.message}`)
  if (plan.operations.length) {
    const { error: operationError } = await client.from('access_plan_operations').insert(plan.operations.map((operation) => ({
      plan_id: plan.id,
      operation_key: operation.operationKey,
      operation_type: operation.type,
      sequence_number: operation.sequence,
      title: operation.title,
      explanation: operation.explanation,
      risk_level: operation.riskLevel,
      before_state: operation.beforeState,
      proposed_state: operation.proposedState,
      target: operation.target,
      authority_manifest_key: operation.authorityManifestKey,
      mutation_rpc: operation.mutationRpc,
      mutation_arguments: operation.mutationArguments,
      verification_rpc: operation.verificationRpc,
      verification_arguments: operation.verificationArguments,
      rollback_rpc: operation.rollbackRpc,
      rollback_arguments: operation.rollbackArguments,
      evidence_keys: operation.evidenceKeys,
      execution_eligible: operation.executionEligible,
      blocked_reasons: operation.blockedReasons,
      status: 'pending',
    })))
    if (operationError) throw new Error(`Unable to store reconciliation operations: ${operationError.message}`)
  }
  return data
}
