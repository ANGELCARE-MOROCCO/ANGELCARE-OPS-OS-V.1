export type FinalAIAction = {
  agentName: string;
  actionType: string;
  recommendation: string;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
};

export function isHighRiskAIAction(action: FinalAIAction): boolean {
  return (
    action.riskLevel === 'high' ||
    action.riskLevel === 'critical' ||
    action.actionType.includes('payout') ||
    action.actionType.includes('compliance') ||
    action.actionType.includes('approval')
  );
}

export function buildAIActionRecord(action: FinalAIAction) {
  const humanApprovalRequired = isHighRiskAIAction(action);
  return {
    agent_name: action.agentName,
    action_type: action.actionType,
    recommendation: action.recommendation,
    confidence_score: action.confidenceScore,
    risk_level: action.riskLevel,
    human_approval_required: humanApprovalRequired,
    approval_status: humanApprovalRequired ? 'pending' : 'auto_allowed',
    metadata: action.metadata ?? {}
  };
}
