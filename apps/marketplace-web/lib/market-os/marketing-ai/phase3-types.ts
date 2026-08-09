import type { MarketingAiAuthorityMode, MarketingAiRiskLevel } from './types'

export type Phase3CompilationStatus = 'draft' | 'awaiting_decision' | 'approved' | 'executing' | 'partially_executed' | 'completed' | 'blocked' | 'failed' | 'cancelled'
export type Phase3ItemStatus = 'proposed' | 'approved' | 'queued' | 'executing' | 'materialized' | 'linked' | 'skipped' | 'blocked' | 'failed' | 'rolled_back'
export type Phase3JobStatus = 'queued' | 'claimed' | 'running' | 'awaiting_approval' | 'retry_scheduled' | 'completed' | 'cancelled' | 'dead_letter' | 'blocked'
export type Phase3DecisionType = 'approve' | 'approve_with_conditions' | 'request_revision' | 'restrict_scope' | 'require_evidence' | 'pause' | 'reject' | 'escalate' | 'cancel'
export type Phase3ToolName =
  | 'campaign.prepare'
  | 'brief.create'
  | 'brief.update'
  | 'content.create_draft'
  | 'content.update_draft'
  | 'task.create'
  | 'task.assign'
  | 'task.link_dependency'
  | 'asset.requirement_create'
  | 'asset.classify'
  | 'asset.link'
  | 'review.request'
  | 'approval_package.prepare'
  | 'schedule.propose'
  | 'publishing_package.prepare'
  | 'bridge.store'
  | 'bridge.version'
  | 'bridge.archive'
  | 'learning.record'

export interface Phase3ContextSource {
  key: string
  label: string
  status: 'available' | 'partial' | 'unavailable'
  recordCount: number | null
  freshness?: string | null
  evidence: string[]
  warning?: string
}

export interface Phase3ContextPackage {
  assembledAt: string
  doctrineVersion: string
  sources: Phase3ContextSource[]
  facts: Record<string, unknown>
  missing: string[]
  restrictions: string[]
}

export interface Phase3Compilation {
  id: string
  compilationKey: string
  missionId: string
  strategyRunId?: string | null
  title: string
  objective: string
  status: Phase3CompilationStatus
  authorityMode: MarketingAiAuthorityMode
  riskLevel: MarketingAiRiskLevel
  contextSnapshot: Phase3ContextPackage
  summary: Record<string, unknown>
  createdBy: string
  approvedBy?: string | null
  approvedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface Phase3CompilationItem {
  id: string
  compilationId: string
  sequence: number
  itemType: 'campaign' | 'brief' | 'content' | 'task' | 'asset_requirement' | 'review' | 'schedule' | 'publishing_package' | 'learning'
  title: string
  description: string
  toolName: Phase3ToolName
  targetWorkspace: string
  payload: Record<string, unknown>
  dependencies: string[]
  requiresApproval: boolean
  status: Phase3ItemStatus
  canonicalRecordId?: string | null
  canonicalTable?: string | null
  mirrorState?: string | null
  error?: string | null
  createdAt: string
  updatedAt: string
}

export interface Phase3Decision {
  id: string
  compilationId?: string | null
  jobId?: string | null
  missionId?: string | null
  decisionType: Phase3DecisionType
  reason: string
  conditions: string[]
  status: 'pending' | 'effective' | 'superseded' | 'expired'
  decidedBy: string
  decidedByName: string
  decidedAt: string
}

export interface Phase3ExecutionJob {
  id: string
  compilationId?: string | null
  compilationItemId?: string | null
  missionId?: string | null
  commandCode?: string | null
  jobType: string
  toolName?: Phase3ToolName | null
  status: Phase3JobStatus
  priority: number
  idempotencyKey: string
  attemptCount: number
  maxAttempts: number
  scheduledAt: string
  claimedAt?: string | null
  heartbeatAt?: string | null
  completedAt?: string | null
  nextRetryAt?: string | null
  input: Record<string, unknown>
  output: Record<string, unknown>
  error?: string | null
  createdAt: string
}

export interface Phase3AutopilotSnapshot {
  source: 'database' | 'unavailable'
  totals: {
    compilations: number
    awaitingDecision: number
    queuedJobs: number
    runningJobs: number
    deadLetters: number
    pendingDecisions: number
    conflicts: number
    materializedRecords: number
  }
  contextSources: Phase3ContextSource[]
  recentCompilations: Phase3Compilation[]
  recentJobs: Phase3ExecutionJob[]
  decisions: Phase3Decision[]
  integrationHealth: Array<{ key: string; label: string; status: 'connected' | 'partial' | 'unavailable'; detail: string }>
}
