export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
export type JsonObject = { [key: string]: JsonValue }

export type AuthorityModel =
  | 'PUBLIC'
  | 'AUTHENTICATION_ONLY'
  | 'ROUTE_ONLY'
  | 'DIRECT_PERMISSION_ARRAY'
  | 'NATIVE_RBAC'
  | 'NATIVE_ABAC'
  | 'MEMBERSHIP_AND_ROLE'
  | 'TENANT_MEMBERSHIP'
  | 'ORGANIZATION_MEMBERSHIP'
  | 'WORKSPACE_MEMBERSHIP'
  | 'ENTITLEMENT_BASED'
  | 'RESOURCE_ACL'
  | 'OWNERSHIP_BASED'
  | 'RLS_ENFORCED'
  | 'FEATURE_FLAG_GATED'
  | 'SOVEREIGN_OVERRIDE'
  | 'HYBRID'
  | 'LEGACY'
  | 'UNKNOWN'

export type EvidenceConfidence =
  | 'confirmed'
  | 'high'
  | 'probable'
  | 'ambiguous'
  | 'unresolved'
  | 'contradictory'

export type EvidenceKind =
  | 'source_ast'
  | 'source_import'
  | 'source_literal'
  | 'sql_migration'
  | 'database_metadata'
  | 'database_policy'
  | 'database_function'
  | 'runtime_verification'
  | 'manual_mapping'
  | 'registry_assignment'
  | 'native_authority'

export type TopologyNodeType =
  | 'application'
  | 'module'
  | 'workspace'
  | 'route_family'
  | 'page'
  | 'api_operation'
  | 'server_action'
  | 'source_file'
  | 'authentication_guard'
  | 'authorization_guard'
  | 'permission'
  | 'role'
  | 'membership_authority'
  | 'entitlement'
  | 'feature_flag'
  | 'tenant'
  | 'organization'
  | 'identity'
  | 'database_table'
  | 'database_function'
  | 'rls_policy'
  | 'audit_authority'
  | 'cache_authority'
  | 'unknown_authority'

export type TopologyEdgeType =
  | 'contains'
  | 'imports'
  | 'calls'
  | 'protects'
  | 'requires'
  | 'grants'
  | 'inherits'
  | 'scopes'
  | 'enforces'
  | 'reads_from'
  | 'writes_to'
  | 'audits'
  | 'invalidates'
  | 'conflicts_with'
  | 'evidenced_by'
  | 'maps_to'

export type ReconciliationState =
  | 'SYNCHRONIZED'
  | 'ROUTE_ONLY'
  | 'NATIVE_ONLY'
  | 'MEMBERSHIP_MISSING'
  | 'ROLE_MISSING'
  | 'PERMISSION_MISSING'
  | 'ENTITLEMENT_MISSING'
  | 'SCOPE_MISMATCH'
  | 'RLS_MISMATCH'
  | 'REVOCATION_DRIFT'
  | 'STALE_GRANT'
  | 'CACHE_DRIFT'
  | 'LEGACY_ONLY'
  | 'UNPROTECTED_OPERATION'
  | 'CONFLICTING_AUTHORITIES'
  | 'UNKNOWN_AUTHORITY'
  | 'ORPHAN_AUTHORITY'
  | 'DUPLICATE_AUTHORITY'
  | 'EXCESS_AUTHORITY'
  | 'PARTIAL_SYNCHRONIZATION'

export type PlanOperationType =
  | 'CREATE_MEMBERSHIP'
  | 'UPDATE_MEMBERSHIP'
  | 'DEACTIVATE_MEMBERSHIP'
  | 'ASSIGN_ROLE'
  | 'UPDATE_ROLE'
  | 'REVOKE_ROLE'
  | 'ADD_PERMISSION'
  | 'REMOVE_PERMISSION'
  | 'ADD_ENTITLEMENT'
  | 'REVOKE_ENTITLEMENT'
  | 'NORMALIZE_TENANT_SCOPE'
  | 'NORMALIZE_ORGANIZATION_SCOPE'
  | 'NORMALIZE_WORKSPACE_SCOPE'
  | 'INCREMENT_GRANT_VERSION'
  | 'INCREMENT_SESSION_VERSION'
  | 'INVALIDATE_AUTHORIZATION_CACHE'
  | 'NORMALIZE_GLOBAL_REGISTRY'
  | 'SUPERSEDE_LEGACY_ASSIGNMENT'
  | 'WRITE_AUDIT_EVENT'
  | 'VERIFY_EFFECTIVE_ACCESS'

export type ScannerJobStatus =
  | 'queued'
  | 'inventorying'
  | 'running'
  | 'paused'
  | 'cancelled'
  | 'finalizing'
  | 'completed'
  | 'failed'

export type ScannerStage =
  | 'repository_inventory'
  | 'application_discovery'
  | 'source_analysis'
  | 'sql_analysis'
  | 'database_introspection'
  | 'topology_construction'
  | 'authority_inference'
  | 'reconciliation'
  | 'snapshot_publication'
  | 'completed'

export type UniversalSourceFile = {
  absolutePath: string
  relativePath: string
  extension: string
  sizeBytes: number
  modifiedAt: string
  checksum: string
  kind: 'typescript' | 'javascript' | 'sql' | 'json' | 'configuration' | 'other'
}

export type UniversalEvidence = {
  evidenceKey: string
  scanId: string
  kind: EvidenceKind
  subjectKey: string
  objectKey: string | null
  filePath: string | null
  lineStart: number | null
  lineEnd: number | null
  databaseObject: string | null
  summary: string
  excerpt: string | null
  confidence: EvidenceConfidence
  confidenceScore: number
  metadata: JsonObject
}

export type UniversalTopologyNode = {
  nodeKey: string
  scanId: string
  nodeType: TopologyNodeType
  canonicalKey: string
  displayName: string
  applicationKey: string | null
  moduleKey: string | null
  workspaceKey: string | null
  authorityModel: AuthorityModel | null
  riskLevel: 'low' | 'controlled' | 'high' | 'critical'
  confidence: EvidenceConfidence
  confidenceScore: number
  metadata: JsonObject
}

export type UniversalTopologyEdge = {
  edgeKey: string
  scanId: string
  sourceNodeKey: string
  targetNodeKey: string
  edgeType: TopologyEdgeType
  confidence: EvidenceConfidence
  confidenceScore: number
  metadata: JsonObject
}

export type UniversalAuthorityManifest = {
  manifestKey: string
  scanId: string
  applicationKey: string
  moduleKey: string | null
  displayName: string
  authorityModels: AuthorityModel[]
  identityAuthority: JsonObject
  globalAuthority: JsonObject
  membershipAuthority: JsonObject
  roleAuthority: JsonObject
  permissionAuthority: JsonObject
  tenantAuthority: JsonObject
  organizationAuthority: JsonObject
  workspaceAuthority: JsonObject
  entitlementAuthority: JsonObject
  rlsAuthority: JsonObject
  revocationAuthority: JsonObject
  auditAuthority: JsonObject
  cacheAuthority: JsonObject
  mutationAuthority: JsonObject
  evidenceKeys: string[]
  confidence: EvidenceConfidence
  confidenceScore: number
  validationStatus: 'generated' | 'review_required' | 'confirmed' | 'invalidated' | 'retired'
  executable: boolean
  unresolved: string[]
  metadata: JsonObject
}

export type UniversalReconciliationFinding = {
  findingKey: string
  scanId: string
  state: ReconciliationState
  severity: 'info' | 'review' | 'high' | 'critical'
  applicationKey: string | null
  moduleKey: string | null
  workspaceKey: string | null
  operationKey: string | null
  userId: string | null
  tenantId: string | null
  organizationId: string | null
  title: string
  explanation: string
  expectedState: JsonObject
  effectiveState: JsonObject
  evidenceKeys: string[]
  confidence: EvidenceConfidence
  confidenceScore: number
  executionEligible: boolean
  blockedReasons: string[]
  proposedOperations: PlanOperationType[]
  status: 'open' | 'accepted' | 'planned' | 'resolved' | 'dismissed'
  metadata: JsonObject
}

export type UniversalPlanOperation = {
  operationKey: string
  type: PlanOperationType
  sequence: number
  title: string
  explanation: string
  riskLevel: 'low' | 'controlled' | 'high' | 'critical'
  beforeState: JsonObject
  proposedState: JsonObject
  target: JsonObject
  authorityManifestKey: string | null
  mutationRpc: string | null
  mutationArguments: JsonObject
  verificationRpc: string | null
  verificationArguments: JsonObject
  rollbackRpc: string | null
  rollbackArguments: JsonObject
  evidenceKeys: string[]
  executionEligible: boolean
  blockedReasons: string[]
}

export type UniversalReconciliationPlan = {
  id: string
  planKey: string
  title: string
  description: string
  status: 'draft' | 'review_required' | 'approved' | 'executing' | 'completed' | 'failed' | 'rolled_back' | 'expired'
  riskLevel: 'low' | 'controlled' | 'high' | 'critical'
  sourceScanId: string
  findingKeys: string[]
  operations: UniversalPlanOperation[]
  simulation: JsonObject
  executionEligible: boolean
  blockedReasons: string[]
  expiresAt: string | null
  approvedAt: string | null
  approvedBy: string | null
  createdAt: string
  updatedAt: string
}

export type UniversalScanJob = {
  id: string
  status: ScannerJobStatus
  stage: ScannerStage
  mode: 'full' | 'scoped' | 'verification'
  sourceRoot: string
  scope: JsonObject
  repositoryCommit: string | null
  scannerVersion: string
  totalWorkItems: number
  completedWorkItems: number
  failedWorkItems: number
  currentItem: string | null
  startedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  pausedAt: string | null
  lastHeartbeatAt: string | null
  elapsedMs: number
  warnings: string[]
  error: string | null
  metadata: JsonObject
}

export type UniversalCommandOverview = {
  generatedAt: string
  scannerVersion: string
  repositoryCommit: string | null
  capabilityStatus: 'ready' | 'degraded' | 'blocked'
  latestJob: UniversalScanJob | null
  counts: {
    applications: number
    modules: number
    workspaces: number
    pages: number
    apiOperations: number
    serverActions: number
    protectedOperations: number
    unprotectedOperations: number
    permissionNamespaces: number
    nativeAuthorities: number
    rlsPolicies: number
    unknownAuthorities: number
    findings: number
    criticalFindings: number
    openPlans: number
    runningExecutions: number
  }
  health: {
    repositoryDiscovery: number
    authorizationIntelligence: number
    scopeIntegrity: number
    reconciliationReadiness: number
    executionReadiness: number
  }
  riskDistribution: Record<string, number>
  driftDistribution: Record<string, number>
  authorityModels: Record<string, number>
  recentFindings: UniversalReconciliationFinding[]
  recentPlans: UniversalReconciliationPlan[]
  capabilities: Array<{
    key: string
    label: string
    status: 'ready' | 'degraded' | 'blocked'
    detail: string
  }>
}

export type UniversalScanChunkResult = {
  job: UniversalScanJob
  processed: number
  remaining: number
  completed: boolean
}
