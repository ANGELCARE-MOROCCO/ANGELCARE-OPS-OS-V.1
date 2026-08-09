export type WindowsNodeHealthStatus = "healthy" | "degraded" | "critical" | "unknown"

export type WindowsNodeLogType =
  | "bridge"
  | "bridge-error"
  | "caddy"
  | "caddy-error"
  | "duckdns"
  | "audit"
  | "service"

export type WindowsNodeAuditSeverity = "info" | "low" | "medium" | "high" | "critical"

export interface WindowsNodeHealthDetail {
  status: WindowsNodeHealthStatus | "running" | "failed" | "unknown" | "degraded"
  message?: string
  error?: string
  raw?: string
  latencyMs?: number
  statusCode?: number
  payload?: unknown
}

export interface WindowsServiceStatus {
  serviceName: string
  role: string
  status: WindowsNodeHealthStatus
  serviceState: string
  startupType: string
  processStatus: string
  port: number | null
  endpoint: string
  logAvailability: string
  lastAction: string
  lastActionAt: string
  lastRestartAt: string
  detail: string
  recommendedAction: string
  lastCheckedAt: string
}

export interface WindowsNetworkTreeStep {
  step: string
  status: WindowsNodeHealthStatus
  message: string
  recommendedFix?: string
}

export interface WindowsNetworkDiagnostic {
  ipMatch?: boolean
  status: WindowsNodeHealthStatus
  classification: "operational" | "degraded" | "critical"
  recommendedAction: string
  lastCheckedAt: string
  lanIp: string
  publicIp: string
  duckDnsResolvedIp: string
  duckDnsMatch: boolean
  ports: Record<string, string>
  localHealth: WindowsNodeHealthDetail
  publicHealth: WindowsNodeHealthDetail
  caddyTlsStatus: WindowsNodeHealthDetail
  routerNatExpectedForwarding: string
  diagnosticTree: WindowsNetworkTreeStep[]
  localBridgeHealth?: WindowsNodeHealthDetail
  caddyLocalHttp?: WindowsNodeHealthDetail
  smtpHostResolution?: string
  smtpHostResolutionStatus?: WindowsNodeHealthStatus
  smtpPortStatus?: WindowsNodeHealthStatus
}

export interface WindowsSmtpDiagnostic {
  host: string
  port: number
  secure: boolean
  user: string
  dnsResolutionStatus: WindowsNodeHealthStatus
  tcpConnectivityStatus: WindowsNodeHealthStatus
  authStatus: {
    status: WindowsNodeHealthStatus | "running" | "failed" | "unknown"
    message?: string
    error?: string
    raw?: string
    latencyMs?: number
    verify?: boolean
  }
  lastTest?: Record<string, unknown> | null
  lastProofEmail?: Record<string, unknown> | null
  lastError: string
  recommendedAction?: string
  lastCheckedAt?: string
}

export interface WindowsBackupAssetStatus {
  name: string
  path: string
  present: boolean
}

export interface WindowsBackupStatus {
  directoryExists: boolean
  latestBackupAt: string
  latestBackupName: string
  latestBackupPath: string
  latestManifestPath: string
  backupCount: number
  folderSizeBytes: number
  latestManifestSummary: string
  protectedAssets: WindowsBackupAssetStatus[]
  warnings: string[]
  lastCheckedAt: string
}

export interface MaintenanceModeState {
  enabled: boolean
  reason: string
  expectedDuration: string
  startedAt: string
  startedBy: string
  message: string
}

export interface WindowsAuditEvent {
  timestamp: string
  actor: string
  action: string
  target: string
  result: string
  reason: string
  severity: WindowsNodeAuditSeverity
  metadataSummary: string
}

export interface WindowsNodeActionRequest {
  action: string
  target?: string
  reason?: string
  confirmation?: boolean
  confirmationText?: string
  serviceName?: string
  toEmail?: string
  subject?: string
  text?: string
  mode?: string
  duration?: string
}

export interface WindowsNodeActionResult {
  ok: boolean
  action: string
  target: string
  status: WindowsNodeHealthStatus | string
  message: string
  durationMs: number
  timestamp: string
  data?: Record<string, unknown>
}

export interface WindowsNodeStatus {
  ok: boolean
  status: WindowsNodeHealthStatus
  classification: "operational" | "degraded" | "critical"
  recommendedAction: string
  serviceName: string
  caddyServiceName: string
  version: string
  purpose: string
  hostname: string
  processId: number
  nodeVersion: string
  workingDirectory: string
  localTime: string
  uptimeSeconds: number
  bridgeService: WindowsServiceStatus
  caddyService: WindowsServiceStatus
  services: {
    bridge: WindowsServiceStatus
    caddy: WindowsServiceStatus
  }
  localHealth: WindowsNodeHealthStatus
  publicHealth: WindowsNodeHealthStatus
  publicDomain: string
  publicPurpose: string
  network: WindowsNetworkDiagnostic
  smtp: WindowsSmtpDiagnostic
  duckdns: {
    domain: string
    resolvedIp: string
    currentPublicIp: string
    syncStatus: string
    status: WindowsNodeHealthStatus
    error: string
    lastUpdatedAt: string
  }
  caddy: {
    configStatus: WindowsNodeHealthStatus
    configPreview: string
    certificateStatus: {
      status: WindowsNodeHealthStatus
      message: string
    }
  }
  bridgeFiles?: {
    serverJsModifiedAt: string
    packageJsonModifiedAt: string
  }
  updateReadiness?: {
    bridgeVersion: string
    serverJsModifiedAt: string
    packageJsonModifiedAt: string
    nodeVersion: string
    npmDependenciesStatus: string
    lastSyntaxCheck: string
    lastRestartAfterUpdate: string
  }
  cpuSnapshot: {
    model: string
    cores: number
    loadAverage: string
    processCpuUserMs: number
    processCpuSystemMs: number
  }
  memory: {
    rss: number
    heapUsed: number
    heapTotal: number
    external: number
    systemUsed: number
    systemTotal: number
  }
  disk: {
    availableBytes: number
    totalBytes: number
    usedBytes: number
    usedPercent: number
    rootPath: string
  }
  backups: WindowsBackupStatus
  maintenanceMode: MaintenanceModeState
  security: {
    adminTokenConfigured: boolean
    bridgeTokenConfigured: boolean
    envPresent: boolean
    maskedSecrets: boolean
    recentUnauthorizedAttempts: number
    recentTokenMismatchSuspicion: number
    recentFailedSmtpAuth: number
    recentFailedApiCalls: number
    lastAdminAction: string
  }
  auditSummary: {
    totalEvents: number
    recentEvents: number
    unauthorizedAttempts: number
    lastEventAt: string
    lastEventAction: string
  }
  lastSendSuccess: Record<string, unknown> | null
  lastProofEmail: Record<string, unknown> | null
  lastError: Record<string, unknown> | null
  lastAdminAction: Record<string, unknown> | null
  technical: {
    bridgeProcessStatus: string
    serviceName: string
    caddyServiceName: string
    hostname: string
    localTime: string
    nodeVersion: string
    workingDirectory: string
  }
}

export type WindowsStorageInventoryStatus = "ready" | "complete" | "partial" | "completed_with_warnings" | "unavailable" | "not_configured" | "unscanned" | "synced" | "not_in_phase_1" | "provider_limited"

export interface WindowsStorageInventoryCategory {
  id: string
  label: string
  kind: string
  status: string
  sizeBytes: number
  fileCount: number
  directoryCount: number
  detail: string
}

export interface WindowsStorageInventoryFile {
  fileId?: string | null
  sourceId: string
  sourceLabel: string
  rootAlias: string
  relativePath: string
  filename: string
  storedFilename?: string
  sizeBytes: number
  modifiedAt?: string | null
  createdAt?: string | null
  contentType?: string | null
  fileType: string
  direction?: string | null
  mailboxId?: string | null
  moduleKey?: string | null
  entityType?: string | null
  entityId?: string | null
  storageStatus?: string | null
  sha256Hash?: string | null
  classification: string
  referenceState?: string | null
}

export interface WindowsStorageInventoryAggregate {
  key: string
  label?: string
  sizeBytes: number
  fileCount: number
  mailboxId?: string
}

export interface WindowsStorageDuplicateGroup {
  sha256Hash: string
  sizeBytes: number
  totalBytes: number
  fileCount: number
  recoverableBytes: number
  files: WindowsStorageInventoryFile[]
}

export interface WindowsStorageOrphanCandidate {
  candidateType: string
  direction: string
  rootAlias: string
  relativePath: string
  filename: string
  sizeBytes: number
  mailboxId?: string | null
  entityType?: string | null
  entityId?: string | null
  reason: string
}

export interface WindowsStorageInventorySource {
  id: string
  label: string
  rootAlias: string
  kind: string
  status: string
  sizeBytes: number
  fileCount: number
  directoryCount: number
  fileTypes: WindowsStorageInventoryAggregate[]
  ageBuckets: WindowsStorageInventoryAggregate[]
  topFolders: WindowsStorageInventoryAggregate[]
  errors: string[]
}

export interface WindowsStorageInventoryFreshness {
  id: string
  label: string
  status: string
  lastSyncedAt: string | null
  detail: string
}

export interface WindowsStorageInventory {
  phase: 1
  readOnly: true
  scanMode: "summary" | "deep"
  scanStatus: string
  scanStartedAt: string
  scanCompletedAt: string
  scanDurationMs: number
  cached?: boolean
  cacheAgeMs?: number
  sharedScan?: boolean
  cacheTtlMs: number
  limits: {
    maxFiles: number
    maxDurationMs: number
    filesVisited: number
    directoriesVisited: number
    truncated: boolean
  }
  disk: {
    rootAlias: string
    totalBytes: number
    usedBytes: number
    freeBytes: number
    usedPercent: number
    warning: boolean
    critical: boolean
    warningThresholdBytes: number
    criticalThresholdBytes: number
  }
  summary: {
    classifiedBytes: number
    unclassifiedBytes: number
    attachmentBytes: number
    attachmentFileCount: number
    backupBytes: number
    logBytes: number
    temporaryBytes: number
    duplicateGroupCount: number
    duplicateRecoverableBytes: number
    orphanCandidateCount: number
    largestFileBytes: number
  }
  growth: {
    previousScanAt: string | null
    diskUsedDeltaBytes: number | null
    classifiedDeltaBytes: number | null
    attachmentDeltaBytes: number | null
  }
  categories: WindowsStorageInventoryCategory[]
  emailStorage: {
    totalBytes: number
    fileCount: number
    metadataCount: number
    metadataBytes: number
    directions: WindowsStorageInventoryAggregate[]
    mailboxes: WindowsStorageInventoryAggregate[]
    fileTypes: WindowsStorageInventoryAggregate[]
    ageBuckets: WindowsStorageInventoryAggregate[]
    largestFiles: WindowsStorageInventoryFile[]
    duplicateGroups: WindowsStorageDuplicateGroup[]
    orphanCandidates: WindowsStorageOrphanCandidate[]
  }
  sources: WindowsStorageInventorySource[]
  largestFiles: WindowsStorageInventoryFile[]
  warnings: string[]
  sourceFreshness: WindowsStorageInventoryFreshness[]
}

export interface WindowsNodeApiError {
  ok: false
  error: string
  errorName: string
  errorMessage: string
  cause?: {
    code?: string
    detail?: string
  }
  bridgeUrlHost?: string
  endpointPath?: string
  hasBridgeUrl?: boolean
  hasAdminToken?: boolean
  responseStatus?: number
  responseBodyPreview?: string
  recommendedAction?: string
}

export interface WindowsNodeApiResponse<T> {
  ok: true
  data: T
}

export type WindowsStorageExplorerEntryType = "file" | "directory"
export type WindowsStoragePreviewKind = "image" | "pdf" | "text" | "json" | "csv" | "unsupported" | "too_large" | "blocked"
export type WindowsStorageOrphanConfidence = "confirmed" | "probable" | "review_required" | "referenced"

export interface WindowsStorageExplorerSource {
  id: string
  label: string
  kind: string
  rootAlias: string
  status: string
  readOnly: true
  detail?: string
}

export interface WindowsStorageExplorerBreadcrumb {
  label: string
  relativePath: string
}

export interface WindowsStorageExplorerEntry {
  sourceId: string
  sourceLabel: string
  rootAlias: string
  relativePath: string
  parentRelativePath: string
  name: string
  entryType: WindowsStorageExplorerEntryType
  sizeBytes: number
  createdAt: string | null
  modifiedAt: string | null
  lastAccessedAt: string | null
  fileType: string
  contentType: string | null
  classification: string
  mailboxId: string | null
  fileId: string | null
  entityType: string | null
  entityId: string | null
  sha256Hash: string | null
  referenceState: string | null
  referenceCount: number
  previewKind: WindowsStoragePreviewKind
  previewable: boolean
  blockedReason: string | null
  safetyStatus: string
}

export interface WindowsStorageBrowseResult {
  phase: 2
  readOnly: true
  source: WindowsStorageExplorerSource
  sources: WindowsStorageExplorerSource[]
  currentRelativePath: string
  breadcrumbs: WindowsStorageExplorerBreadcrumb[]
  entries: WindowsStorageExplorerEntry[]
  query: string
  recursive: boolean
  totalMatched: number
  returned: number
  nextCursor: string | null
  truncated: boolean
  scannedAt: string
  scanDurationMs: number
  warnings: string[]
}

export interface WindowsStorageFileDossier extends WindowsStorageExplorerEntry {
  phase: 2
  readOnly: true
  metadata: Record<string, unknown>
  references: Array<{
    type: string
    id: string | null
    label: string
    detail: string
    mailboxId: string | null
  }>
  integrity: {
    sha256Hash: string | null
    hashSource: "metadata" | "computed" | "unavailable"
    physicalExists: boolean
    metadataExists: boolean
    sizeMatchesMetadata: boolean | null
  }
  preview: {
    kind: WindowsStoragePreviewKind
    supported: boolean
    maxBytes: number
    reason: string | null
  }
}

export interface WindowsStoragePreviewResult {
  phase: 2
  readOnly: true
  sourceId: string
  relativePath: string
  filename: string
  contentType: string
  sizeBytes: number
  kind: WindowsStoragePreviewKind
  encoding: "base64" | "utf8" | "none"
  content: string | null
  truncated: boolean
  safetyStatus: string
  reason: string | null
}

export interface WindowsStorageEmailReference {
  id: string
  fileId: string | null
  mailboxId: string | null
  direction: string
  messageType: string
  messageId: string | null
  threadId: string | null
  subject: string
  sender: string
  recipients: string
  messageStatus: string
  messageDate: string | null
  filename: string
  contentType: string | null
  sizeBytes: number
  storageBucket: string | null
  storageKey: string | null
  entityType: string | null
  entityId: string | null
  sha256Hash: string | null
  referenceState: string
  source: string
}

export interface WindowsStorageMessageRecord {
  id: string
  mailboxId: string | null
  messageType: string
  direction: string
  subject: string
  sender: string
  recipients: string
  status: string
  createdAt: string | null
  updatedAt: string | null
  sentAt: string | null
  bodySizeBytes: number
  attachmentCount: number
  attachmentBytes: number
  providerReference: string | null
  storageReferences: WindowsStorageEmailReference[]
}

export interface WindowsStorageEmailInvestigationResult {
  phase: 2
  readOnly: true
  mode: "attachments" | "messages" | "relationship"
  attachments: WindowsStorageEmailReference[]
  messages: WindowsStorageMessageRecord[]
  totalAttachments: number
  totalMessages: number
  warnings: string[]
  queriedAt: string
}

export interface WindowsStorageDuplicateInvestigation {
  phase: 2
  readOnly: true
  groups: WindowsStorageDuplicateGroup[]
  selectedGroup: WindowsStorageDuplicateGroup | null
  totalGroups: number
  totalPhysicalBytes: number
  totalRecoverableBytes: number
  scannedAt: string
}

export interface WindowsStorageOrphanInvestigationItem extends WindowsStorageOrphanCandidate {
  confidence: WindowsStorageOrphanConfidence
  referenceCount: number
  metadataExists: boolean
  physicalExists: boolean
  businessImpact: string
  recommendedReview: string
}

export interface WindowsStorageOrphanInvestigation {
  phase: 2
  readOnly: true
  candidates: WindowsStorageOrphanInvestigationItem[]
  totalCandidates: number
  confirmedCount: number
  probableCount: number
  reviewRequiredCount: number
  scannedAt: string
}

export type WindowsStorageQuarantineMode = "logical" | "physical"
export type WindowsStorageQuarantineRisk = "low" | "controlled" | "high" | "blocked"
export type WindowsStorageQuarantineStatus =
  | "draft"
  | "impact_pending"
  | "awaiting_approval"
  | "approved"
  | "executing"
  | "verifying"
  | "quarantined"
  | "restore_requested"
  | "restoring"
  | "restored"
  | "failed"
  | "cancelled"
  | "expired"
  | "eligible_for_future_purge"

export interface WindowsStorageQuarantineReference {
  type: string
  id: string
  label: string
  detail: string
  mailboxId: string | null
  active: boolean
}

export interface WindowsStorageQuarantineImpact {
  phase: 3
  reversible: true
  sourceId: string
  relativePath: string
  filename: string
  sizeBytes: number
  contentType: string | null
  sha256Hash: string | null
  objectType: string
  fileId: string | null
  mailboxId: string | null
  entityType: string | null
  entityId: string | null
  referenceState: string
  references: WindowsStorageQuarantineReference[]
  referenceCount: number
  activeReferenceCount: number
  riskLevel: WindowsStorageQuarantineRisk
  riskReasons: string[]
  blockedReasons: string[]
  allowedModes: WindowsStorageQuarantineMode[]
  recommendedMode: WindowsStorageQuarantineMode | null
  estimatedRecoverableBytes: number
  primaryStorageRecoveryByMode: Record<WindowsStorageQuarantineMode, number>
  userVisibleConsequence: string
  restoreReadiness: "complete" | "partial" | "blocked"
  restoreWarnings: string[]
  backupCopiesUnaffected: boolean
  providerCopyUnaffected: boolean
  legalHold: boolean
  originalLocationToken: string
  sourceDetails?: {
    rootAlias?: string
    sameVolumeQuarantine?: boolean
  }
  analyzedAt: string
}

export interface WindowsStorageQuarantineCase {
  id: string
  caseNumber: string
  sourceId: string
  objectType: string
  objectReference: string
  fileId: string | null
  mailboxId: string | null
  entityType: string | null
  entityId: string | null
  originalName: string
  originalSizeBytes: number
  originalSha256: string | null
  originalRelativePath: string
  originalLocationToken: string
  quarantineMode: WindowsStorageQuarantineMode
  quarantineLocationToken: string | null
  riskLevel: WindowsStorageQuarantineRisk
  status: WindowsStorageQuarantineStatus
  reason: string
  impactSnapshot: WindowsStorageQuarantineImpact
  referencesSnapshot: WindowsStorageQuarantineReference[]
  estimatedRecoverableBytes: number
  actualRecoveredBytes: number
  requestedBy: string
  approvedBy: string | null
  secondApprovedBy: string | null
  approvalCount: number
  approvalsRequired: number
  executedBy: string | null
  retentionUntil: string
  restoreReadiness: "complete" | "partial" | "blocked"
  restoredAt: string | null
  createdAt: string
  updatedAt: string
  lastError: string | null
}

export interface WindowsStorageQuarantineEvent {
  id: string
  caseId: string
  eventType: string
  status: string
  actor: string
  reason: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface WindowsStorageQuarantinePolicy {
  id: string
  defaultRetentionDays: number
  maximumRetentionDays: number
  requireApprovalForReferenced: boolean
  requireSecondApprovalAboveBytes: number
  allowSameVolumeQuarantine: boolean
  allowExternalVaultQuarantine: boolean
  allowMessageQuarantine: boolean
  allowActiveSendAttachmentQuarantine: boolean
  allowLegalHoldQuarantine: boolean
  active: boolean
  updatedAt: string
  updatedBy: string | null
}

export interface WindowsStorageQuarantineListResult {
  phase: 3
  reversible: true
  cases: WindowsStorageQuarantineCase[]
  totalCases: number
  quarantinedCount: number
  awaitingApprovalCount: number
  restoreRequestedCount: number
  eligibleForFuturePurgeCount: number
  totalPrimaryBytesRecovered: number
  totalVaultBytesOccupied: number
  policies: WindowsStorageQuarantinePolicy
  queriedAt: string
}

export interface WindowsStorageQuarantineJobResult {
  phase: 3
  reversible: true
  caseId: string
  caseNumber: string
  status: WindowsStorageQuarantineStatus
  step: string
  stepIndex: number
  stepCount: number
  originalSha256: string | null
  resultingSha256: string | null
  actualRecoveredBytes: number
  quarantineLocationToken: string | null
  restoredRelativePath: string | null
  warnings: string[]
  completedAt: string | null
}

export type WindowsStorageDestructionScope =
  | "physical_file"
  | "application_message"
  | "complete_local_message"
  | "technical_cleanup"
  | "backup_copy"

export type WindowsStorageDestructionRisk = "low" | "controlled" | "high" | "blocked"
export type WindowsStorageDestructionStatus =
  | "not_eligible"
  | "retention_active"
  | "impact_review_required"
  | "awaiting_approval"
  | "approved_for_destruction"
  | "destruction_scheduled"
  | "destroying"
  | "verifying"
  | "destroyed"
  | "partially_destroyed"
  | "failed"
  | "cancelled"
  | "blocked"

export interface WindowsStorageDestructionCopyState {
  label: string
  bytes: number
  targeted: boolean
  status: "present" | "unknown" | "not_applicable" | "scheduled" | "destroyed"
  detail: string
}

export interface WindowsStorageDestructionImpact {
  phase: 4
  permanent: true
  quarantineCaseId: string
  quarantineCaseNumber: string
  eligible: boolean
  blockedReasons: string[]
  sourceId: string
  objectReference: string
  fileId: string | null
  mailboxId: string | null
  entityType: string | null
  entityId: string | null
  originalName: string
  originalSizeBytes: number
  originalSha256: string | null
  quarantineLocationToken: string | null
  riskLevel: WindowsStorageDestructionRisk
  allowedScopes: WindowsStorageDestructionScope[]
  recommendedScope: WindowsStorageDestructionScope | null
  approvalsRequired: number
  coolingOffSeconds: number
  immediateRecoverableBytes: number
  estimatedTotalRecoverableBytes: number
  copies: WindowsStorageDestructionCopyState[]
  backupCopiesRemain: boolean
  providerCopyRemains: boolean
  legalHold: boolean
  userVisibleConsequence: string
  analyzedAt: string
}

export interface WindowsStorageDestructionRequest {
  id: string
  requestNumber: string
  quarantineCaseId: string
  quarantineCaseNumber: string
  scope: WindowsStorageDestructionScope
  riskLevel: WindowsStorageDestructionRisk
  status: WindowsStorageDestructionStatus
  reason: string
  sourceId: string
  objectReference: string
  fileId: string | null
  mailboxId: string | null
  entityType: string | null
  entityId: string | null
  originalName: string
  originalSizeBytes: number
  expectedSha256: string | null
  quarantineLocationToken: string | null
  impactSnapshot: WindowsStorageDestructionImpact
  requestedBy: string
  approvedBy: string | null
  secondApprovedBy: string | null
  approvalCount: number
  approvalsRequired: number
  scheduledFor: string | null
  coolingOffSeconds: number
  executedBy: string | null
  actualRecoveredBytes: number
  certificateId: string | null
  certificateNumber: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  lastError: string | null
}

export interface WindowsStorageDestructionEvent {
  id: string
  requestId: string
  eventType: string
  status: string
  actor: string
  reason: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface WindowsStorageDestructionPolicy {
  id: string
  lowRiskCoolingOffSeconds: number
  controlledRiskCoolingOffSeconds: number
  highRiskCoolingOffSeconds: number
  requireIndependentApproval: boolean
  requireTwoApprovalsForHighRisk: boolean
  requireTypedConfirmationForHighRisk: boolean
  requireRetentionCompletion: boolean
  allowPrimaryDestructionWhileBackupsExpire: boolean
  active: boolean
  updatedAt: string
  updatedBy: string | null
}

export interface WindowsStorageRetentionPolicy {
  id: string
  name: string
  category: string
  minimumAgeDays: number
  quarantineDays: number
  actionAfterRetention: "review" | "quarantine" | "destruction_review"
  enabled: boolean
  dryRunRequired: boolean
  exclusions: string[]
  updatedAt: string
  updatedBy: string | null
}

export interface WindowsStorageRetentionDryRun {
  phase: 4
  readOnly: true
  policyId: string
  policyName: string
  matchedCount: number
  matchedBytes: number
  immediatelyEligibleCount: number
  blockedCount: number
  legalHoldCount: number
  reviewRequiredCount: number
  sample: Array<{ id: string; label: string; bytes: number; reason: string; eligible: boolean }>
  simulatedAt: string
}

export interface WindowsStorageCleanupProfile {
  id: string
  name: string
  description: string
  sourceIds: string[]
  extensions: string[]
  minimumAgeDays: number
  maximumBatchSize: number
  riskLevel: "low" | "controlled"
  enabled: boolean
}

export interface WindowsStorageDestructionCertificate {
  id: string
  certificateNumber: string
  requestId: string
  requestNumber: string
  quarantineCaseId: string
  originalName: string
  originalSizeBytes: number
  originalSha256: string | null
  sourceId: string
  mailboxId: string | null
  scope: WindowsStorageDestructionScope
  requester: string
  approvers: string[]
  executedBy: string
  executedAt: string
  verificationResult: string
  actualRecoveredBytes: number
  remainingCopies: WindowsStorageDestructionCopyState[]
  createdAt: string
}

export interface WindowsStorageDestructionRegistry {
  phase: 4
  permanent: true
  requests: WindowsStorageDestructionRequest[]
  eligibleQuarantineCases: WindowsStorageQuarantineCase[]
  totalRequests: number
  awaitingApprovalCount: number
  scheduledCount: number
  destroyedCount: number
  failedCount: number
  totalRecoveredBytes: number
  policy: WindowsStorageDestructionPolicy
  retentionPolicies: WindowsStorageRetentionPolicy[]
  cleanupProfiles: WindowsStorageCleanupProfile[]
  legalHolds: WindowsStorageLegalHold[]
  queriedAt: string
}

export interface WindowsStorageDestructionJobResult {
  phase: 4
  permanent: true
  requestId: string
  requestNumber: string
  status: WindowsStorageDestructionStatus
  step: string
  stepIndex: number
  stepCount: number
  expectedSha256: string | null
  targetedHashPresentAfterExecution: boolean
  quarantinePathExistsAfterExecution: boolean
  originalPathExistsAfterExecution: boolean
  actualRecoveredBytes: number
  remainingCopies: WindowsStorageDestructionCopyState[]
  warnings: string[]
  completedAt: string
}

export interface WindowsStorageLegalHold {
  id: string
  sourceId: string
  objectReference: string
  fileId: string | null
  mailboxId: string | null
  reason: string
  status: "active" | "released"
  placedBy: string
  placedAt: string
  releasedBy: string | null
  releasedAt: string | null
  metadata: Record<string, unknown>
}

// OPSOS Storage & Data Phase 5 — automated lifecycle optimization, provider synchronization and intelligent deduplication
export type WindowsStorageLifecycleRunStatus = "queued" | "running" | "paused" | "completed" | "completed_with_warnings" | "failed" | "cancelled"
export type WindowsStorageLifecycleAction = "inventory" | "forecast" | "provider_sync" | "provider_reconcile" | "dedup_scan" | "retention_dry_run" | "cleanup_dry_run" | "quarantine_request" | "destruction_review"
export type WindowsStorageLifecycleSeverity = "info" | "low" | "medium" | "high" | "critical"
export type WindowsStorageDedupPlanStatus = "draft" | "analyzed" | "awaiting_approval" | "approved" | "executing" | "completed" | "completed_with_warnings" | "failed" | "cancelled" | "blocked"
export type WindowsStorageProviderSyncStatus = "queued" | "running" | "completed" | "completed_with_warnings" | "failed" | "cancelled"

export interface WindowsStorageLifecyclePolicy {
  id: string
  name: string
  enabled: boolean
  cadenceMinutes: number
  actions: WindowsStorageLifecycleAction[]
  providerSyncEnabled: boolean
  providerSyncLimitPerMailbox: number
  dedupScanEnabled: boolean
  autoCreateQuarantineRequests: boolean
  autoCreateDestructionReviews: boolean
  autoApproveLowRisk: boolean
  maximumCandidatesPerRun: number
  growthAlertBytesPerDay: number
  warningFreeBytes: number
  criticalFreeBytes: number
  staleProviderMinutes: number
  requireDryRun: boolean
  updatedAt: string
  updatedBy: string | null
}

export interface WindowsStorageLifecycleSnapshot {
  id: string
  totalBytes: number
  usedBytes: number
  freeBytes: number
  attachmentBytes: number
  duplicateBytes: number
  quarantineBytes: number
  recoverableBytes: number
  mailboxCount: number
  storageFileCount: number
  providerMessageCount: number
  capturedAt: string
}

export interface WindowsStorageForecastPoint {
  timestamp: string
  usedBytes: number
  freeBytes: number
}

export interface WindowsStorageForecast {
  phase: 5
  generatedAt: string
  sampleCount: number
  averageGrowthBytesPerDay: number
  projectedWarningAt: string | null
  projectedCriticalAt: string | null
  projectedFullAt: string | null
  daysToWarning: number | null
  daysToCritical: number | null
  daysToFull: number | null
  confidence: "insufficient" | "low" | "medium" | "high"
  trend: "growing" | "stable" | "shrinking" | "unknown"
  points: WindowsStorageForecastPoint[]
}

export interface WindowsStorageLifecycleAlert {
  id: string
  alertType: string
  severity: WindowsStorageLifecycleSeverity
  title: string
  message: string
  status: "open" | "acknowledged" | "resolved"
  source: string
  evidence: Record<string, unknown>
  createdAt: string
  acknowledgedAt: string | null
  acknowledgedBy: string | null
  resolvedAt: string | null
}

export interface WindowsStorageLifecycleRunItem {
  id: string
  runId: string
  action: WindowsStorageLifecycleAction
  status: string
  objectReference: string | null
  sourceId: string | null
  mailboxId: string | null
  sizeBytes: number
  recommendedAction: string | null
  riskLevel: "low" | "controlled" | "high" | "blocked" | null
  result: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface WindowsStorageLifecycleRun {
  id: string
  runNumber: string
  policyId: string | null
  trigger: "manual" | "scheduled" | "threshold" | "recovery"
  status: WindowsStorageLifecycleRunStatus
  actions: WindowsStorageLifecycleAction[]
  requestedBy: string
  startedAt: string | null
  completedAt: string | null
  pausedAt: string | null
  cancelledAt: string | null
  scannedCount: number
  candidateCount: number
  recommendedRecoveryBytes: number
  actualRecoveredBytes: number
  providerMailboxCount: number
  providerMessageCount: number
  warningCount: number
  errorCount: number
  summary: Record<string, unknown>
  lastError: string | null
  createdAt: string
  updatedAt: string
  items?: WindowsStorageLifecycleRunItem[]
}

export interface WindowsStorageDedupCopy {
  fileId: string | null
  sourceId: string
  relativePath: string
  filename: string
  mailboxId: string | null
  entityType: string | null
  entityId: string | null
  sizeBytes: number
  sha256: string
  canonical: boolean
  activeReferenceCount: number
  legalHold: boolean
  status: string
}

export interface WindowsStorageDedupGroup {
  sha256: string
  sizeBytes: number
  physicalCopies: number
  referenceCount: number
  potentialRecoverableBytes: number
  eligible: boolean
  blockedReasons: string[]
  copies: WindowsStorageDedupCopy[]
}

export interface WindowsStorageDedupScan {
  phase: 5
  readOnly: true
  groupCount: number
  physicalCopyCount: number
  potentialRecoverableBytes: number
  blockedGroupCount: number
  groups: WindowsStorageDedupGroup[]
  scannedAt: string
}

export interface WindowsStorageDedupPlan {
  id: string
  planNumber: string
  status: WindowsStorageDedupPlanStatus
  sha256: string
  canonicalFileId: string | null
  canonicalSourceId: string
  canonicalRelativePath: string
  sizeBytes: number
  physicalCopies: number
  referenceCount: number
  potentialRecoverableBytes: number
  actualRecoveredBytes: number
  riskLevel: "low" | "controlled" | "high" | "blocked"
  reason: string
  requestedBy: string
  approvedBy: string | null
  executedBy: string | null
  bridgePlanToken: string | null
  preflight: Record<string, unknown>
  result: Record<string, unknown>
  createdAt: string
  updatedAt: string
  completedAt: string | null
  copies: WindowsStorageDedupCopy[]
}

export interface WindowsStorageProviderCapabilities {
  phase: 5
  mailboxId: string
  email: string
  protocol: "pop3"
  host: string
  port: number
  secure: boolean
  authenticated: boolean
  uidlSupported: boolean
  listSupported: boolean
  capaSupported: boolean
  deleteCommandAdvertised: boolean
  remoteDeletionEnabled: boolean
  messageCount: number
  totalBytes: number
  capabilities: string[]
  checkedAt: string
  warning: string | null
}

export interface WindowsStorageProviderReconciliation {
  id: string
  mailboxId: string
  email: string
  providerMessageCount: number
  localMessageCount: number
  providerOnlyCount: number
  localOnlyCount: number
  matchedCount: number
  providerOnlyUids: string[]
  localOnlyUids: string[]
  status: "matched" | "drift" | "partial" | "failed"
  detail: string
  reconciledAt: string
}

export interface WindowsStorageProviderSyncRun {
  id: string
  runNumber: string
  mailboxId: string | null
  status: WindowsStorageProviderSyncStatus
  requestedBy: string
  mailboxCount: number
  fetchedCount: number
  insertedCount: number
  updatedCount: number
  skippedCount: number
  failedCount: number
  result: Record<string, unknown>
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  lastError: string | null
}

export interface WindowsStorageLifecycleRegistry {
  phase: 5
  automationSafe: true
  policy: WindowsStorageLifecyclePolicy
  latestSnapshot: WindowsStorageLifecycleSnapshot | null
  forecast: WindowsStorageForecast
  runs: WindowsStorageLifecycleRun[]
  alerts: WindowsStorageLifecycleAlert[]
  dedupPlans: WindowsStorageDedupPlan[]
  providerRuns: WindowsStorageProviderSyncRun[]
  reconciliations: WindowsStorageProviderReconciliation[]
  openAlertCount: number
  runningRunCount: number
  pendingDedupPlanCount: number
  potentialDedupRecoveryBytes: number
  queriedAt: string
}
