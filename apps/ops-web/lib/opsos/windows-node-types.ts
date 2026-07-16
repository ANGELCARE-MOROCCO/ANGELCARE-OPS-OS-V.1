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
