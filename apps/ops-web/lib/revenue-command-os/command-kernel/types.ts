export type RevenueCommandStatus = 'draft'|'proposed'|'under-review'|'needs-evidence'|'needs-approval'|'approved'|'rejected'|'scheduled'|'running'|'paused'|'blocked'|'failed'|'retrying'|'completed'|'superseded'|'retired'|'rolled-back'|'audited'
export type RevenueCommandTriggerType = 'manual'|'scheduled'|'event'|'condition'|'chained'|'dependency'|'simulation'
export type RevenueCommandApprovalClass = 'none'|'recommendation'|'internal-generation'|'supervisor'|'department'|'director'|'executive'|'prohibited'
export type RevenueCommandRunMode = 'shadow'|'simulation'|'recommend'|'approval-gated'
export type RevenueCommandRunStatus = 'planned'|'scheduled'|'running'|'awaiting-approval'|'blocked'|'failed'|'retrying'|'completed'|'rejected'|'cancelled'|'rolled-back'|'simulated'
export type RevenueCommandContextState = 'available'|'missing'|'stale'|'contradictory'|'unvalidated'|'restricted'|'not-applicable'
export type RevenueCommandFailureKind = 'transient'|'permanent'|'validation'|'permission'|'missing-context'|'approval'|'dependency'|'tool'|'timeout'|'cancelled'
export type RevenueCommandToolRisk = 'read'|'internal-write'|'external-draft'|'external-action'|'financial'|'contractual'|'sensitive'
export type RevenueCommandFamilyCode =
  | 'market-sensing'|'segmentation-account-discovery'|'offer-pricing'|'campaign-go-to-market'
  | 'outreach-channel'|'qualification-progression'|'meetings-diagnostics'|'proposal-negotiation-closing'
  | 'pipeline-rescue'|'renewal-expansion-referral'|'executive-forecasting'|'audit-optimization'

export type RevenueCommandFamily = { id:string; code:RevenueCommandFamilyCode; name:string; description:string; targetCount:number; order:number; ownerRole:string; active:boolean }
export type RevenueCommandContextRequirement = { key:string; label:string; required:boolean; freshnessMinutes?:number; allowedStates:RevenueCommandContextState[]; sourceDomains:string[]; confidentiality:'public'|'internal'|'confidential'|'restricted' }
export type RevenueCommandToolPermission = { toolCode:string; label:string; risk:RevenueCommandToolRisk; allowed:boolean; approvalClass?:RevenueCommandApprovalClass; reason:string }
export type RevenueCommandEligibilityRule = { id:string; field:string; operator:'equals'|'not-equals'|'in'|'not-in'|'contains'|'exists'|'gte'|'lte'|'before'|'after'; value:unknown; weight:number; hardBlock:boolean; reason:string }
export type RevenueCommandRetryPolicy = { enabled:boolean; maxAttempts:number; strategy:'fixed'|'linear'|'exponential'; delaySeconds:number; retryableKinds:RevenueCommandFailureKind[]; escalateAfterExhaustion:boolean }
export type RevenueCommandFailurePolicy = { onFailure:'stop'|'block'|'request-context'|'downgrade-recommendation'|'switch-simulation'|'fallback'|'escalate'|'reschedule'|'quarantine'; fallbackCommandCodes:string[]; escalationRole?:string; quarantineVersion?:boolean }
export type RevenueCommandCooldownPolicy = { scope:'command'|'account'|'opportunity'|'signal'|'tenant'; durationMinutes:number; ignoreForSimulation:boolean }
export type RevenueCommandSchemaField = { key:string; type:'string'|'number'|'boolean'|'array'|'object'|'enum'|'date'; required:boolean; description:string; enumValues?:string[]; sensitive?:boolean }
export type RevenueCommandVersion = { id:string; commandCode:string; version:string; status:RevenueCommandStatus; effectiveAt:string; approvedAt?:string; approvedBy?:string; changeSummary:string; schemaHash:string; createdAt:string; retiredAt?:string }
export type RevenueCommandDefinition = {
  id:string; commandCode:string; name:string; family:RevenueCommandFamilyCode; purpose:string; ownerRole:string; status:RevenueCommandStatus; activeVersion:string;
  businessUnits:string[]; segments:string[]; territories:string[]; commercialStages:string[]; triggerTypes:RevenueCommandTriggerType[];
  eligibilityRules:RevenueCommandEligibilityRule[]; requiredContext:RevenueCommandContextRequirement[]; optionalContext:RevenueCommandContextRequirement[];
  toolPermissions:RevenueCommandToolPermission[]; inputSchema:RevenueCommandSchemaField[]; outputSchema:RevenueCommandSchemaField[];
  validatorChain:string[]; approvalClass:RevenueCommandApprovalClass; downstreamCompiler?:string; cooldown:RevenueCommandCooldownPolicy;
  retryPolicy:RevenueCommandRetryPolicy; failurePolicy:RevenueCommandFailurePolicy; fallbackCommandCodes:string[]; performanceMetrics:string[];
  prohibitedCases:string[]; expectedOutcomes:string[]; tags:string[]; createdAt:string; updatedAt:string
}
export type RevenueCommandContextValue = { key:string; state:RevenueCommandContextState; value?:unknown; observedAt?:string; source?:string; confidentiality?:string; reasons:string[] }
export type RevenueCommandSituation = { id:string; tenantId:string; organizationId:string; businessUnit:string; segment?:string; territory?:string; commercialStage?:string; signalType?:string; urgency:number; opportunityValueDh?:number; accountPriority?:number; actorId:string; actorRole:string; permissions:string[]; executionMode:RevenueCommandRunMode; context:RevenueCommandContextValue[]; metadata:Record<string,unknown> }
export type RevenueCommandEligibilityDecision = { commandCode:string; eligible:boolean; hardBlocked:boolean; score:number; reasons:string[]; blockers:string[]; missingContext:string[]; staleContext:string[]; requiredApproval:RevenueCommandApprovalClass; permittedTools:string[]; forbiddenTools:string[] }
export type RevenueCommandPlanStep = { order:number; commandCode:string; version:string; mode:RevenueCommandRunMode; status:'ready'|'blocked'|'awaiting-approval'|'simulation-only'; dependsOn:string[]; intendedTools:string[]; expectedOutput:string[]; reasons:string[] }
export type RevenueCommandRunPlan = { id:string; situationId:string; idempotencyKey:string; createdAt:string; mode:RevenueCommandRunMode; eligible:RevenueCommandEligibilityDecision[]; excluded:RevenueCommandEligibilityDecision[]; blocked:RevenueCommandEligibilityDecision[]; steps:RevenueCommandPlanStep[]; approvalClasses:RevenueCommandApprovalClass[]; prohibitedActions:string[]; deterministicHash:string }
export type RevenueCommandRun = { id:string; planId:string; commandCode:string; commandVersion:string; status:RevenueCommandRunStatus; attempt:number; startedAt?:string; completedAt?:string; output?:Record<string,unknown>; validationErrors:string[]; failureKind?:RevenueCommandFailureKind; failureMessage?:string; fallbackRunId?:string; approvalId?:string; traceReference:string; rollbackReference?:string }
export type RevenueCommandSchedule = { id:string; code:string; commandCode:string; label:string; enabled:boolean; timezone:string; cadence:string; businessHoursOnly:boolean; nextRunAt?:string; lastRunAt?:string; missedRunPolicy:'skip'|'run-once'|'reschedule'; ownerRole:string; executionMode:RevenueCommandRunMode }
export type RevenueCommandTrigger = { id:string; code:string; commandCode:string; type:RevenueCommandTriggerType; source:string; eventType?:string; conditionExpression?:string; active:boolean; replayWindowMinutes:number; priority:number }
export type RevenueCommandGraphNode = { id:string; commandCode:string; version:string; order:number; required:boolean; onSuccess:string[]; onFailure:string[]; approvalInterrupt:boolean }
export type RevenueCommandGraph = { id:string; code:string; name:string; description:string; status:'draft'|'approved'|'retired'; version:string; entryNodeIds:string[]; nodes:RevenueCommandGraphNode[]; createdAt:string; updatedAt:string }
export type RevenueCommandKernelIssue = { id:string; code:string; severity:'critical'|'high'|'medium'|'low'; category:string; title:string; detail:string; status:'open'|'acknowledged'|'resolved'|'waived'; resourceType:string; resourceId?:string; remediation:string }
export type RevenueCommandKernelReadiness = { schemaIntegrity:number; registryIntegrity:number; eligibilityCoverage:number; routingDeterminism:number; graphSafety:number; permissionSafety:number; shadowSafety:number; rollbackReadiness:number; testCoverage:number; overall:number }
export type RevenueCommandKernelBootstrap = { contractVersion:string; releaseCode:string; moduleVersion:string; executionPosture:'shadow'; externalActionsEnabled:false; generatedAt:string; storageMode:'supabase-overlay'|'canonical-only'|'degraded'; dataMode:'live'|'degraded'|'canonical-fallback'; expectedCount:number; persistedCount:number; missingCount:number; driftCount:number; families:RevenueCommandFamily[]; commands:RevenueCommandDefinition[]; versions:RevenueCommandVersion[]; triggers:RevenueCommandTrigger[]; schedules:RevenueCommandSchedule[]; graphs:RevenueCommandGraph[]; runs:RevenueCommandRun[]; issues:RevenueCommandKernelIssue[]; readiness:RevenueCommandKernelReadiness; counters:Record<string,number> }
