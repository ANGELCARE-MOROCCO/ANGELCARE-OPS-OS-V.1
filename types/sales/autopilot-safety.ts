export type AutopilotActionRisk = 'low' | 'medium' | 'high' | 'critical'
export type AutopilotActionStatus = 'queued' | 'needs_approval' | 'approved' | 'rejected' | 'paused' | 'executed'

export interface AutopilotSafetyAction {
  id: string
  dealId: string
  clientName: string
  actionType: string
  recommendation: string
  risk: AutopilotActionRisk
  status: AutopilotActionStatus
  reason: string
  createdAt: string
}

export interface SafetyDecision {
  actionId: string
  decision: 'approve' | 'reject' | 'pause'
  managerNote?: string
}
