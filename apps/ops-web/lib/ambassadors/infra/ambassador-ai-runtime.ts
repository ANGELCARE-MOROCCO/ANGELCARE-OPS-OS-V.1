export type AmbassadorAIAction = {
  agentName: string;
  actionType: string;
  recommendation: string;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  humanApprovalRequired: boolean;
};

export function requiresHumanApproval(action: AmbassadorAIAction): boolean {
  return (
    action.humanApprovalRequired ||
    action.riskLevel === 'high' ||
    action.riskLevel === 'critical' ||
    action.actionType.includes('payout') ||
    action.actionType.includes('compliance')
  );
}

export function createAIActionRecord(action: AmbassadorAIAction) {
  return {
    ...action,
    approvalStatus: requiresHumanApproval(action) ? 'pending' : 'auto_allowed',
    createdAt: new Date().toISOString()
  };
}
