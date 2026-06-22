export type Phase24CommandRisk = 'low' | 'medium' | 'high' | 'critical';

export interface Phase24CommandKpi {
  id: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  risk: Phase24CommandRisk;
}

export interface Phase24CampaignCommandSummary {
  id: string;
  campaign: string;
  readiness: number;
  blockedItems: number;
  pendingApprovals: number;
  publishingRisk: Phase24CommandRisk;
  recommendation: string;
}

export interface Phase24ExecutiveDecisionItem {
  id: string;
  title: string;
  area: string;
  urgency: 'normal' | 'high' | 'urgent';
  requiredDecision: string;
  status: 'pending' | 'reviewing' | 'decided';
}

export interface Phase24EscalationBoardItem {
  id: string;
  title: string;
  owner: string;
  severity: Phase24CommandRisk;
  nextAction: string;
}