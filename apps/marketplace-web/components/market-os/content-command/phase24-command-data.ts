import type {
  Phase24CampaignCommandSummary,
  Phase24CommandKpi,
  Phase24EscalationBoardItem,
  Phase24ExecutiveDecisionItem,
} from './phase24-command-types';

export const phase24CommandKpis: Phase24CommandKpi[] = [
  {
    id: 'kpi-command-readiness',
    label: 'Command Readiness',
    value: '89%',
    trend: 'up',
    risk: 'low',
  },
  {
    id: 'kpi-publishing-confidence',
    label: 'Publishing Confidence',
    value: '78%',
    trend: 'stable',
    risk: 'medium',
  },
  {
    id: 'kpi-approval-pressure',
    label: 'Approval Pressure',
    value: '6 pending',
    trend: 'down',
    risk: 'medium',
  },
  {
    id: 'kpi-critical-blockers',
    label: 'Critical Blockers',
    value: '2',
    trend: 'stable',
    risk: 'high',
  },
];

export const phase24CampaignCommandSummaries: Phase24CampaignCommandSummary[] = [
  {
    id: 'campaign-command-001',
    campaign: 'Core Services',
    readiness: 92,
    blockedItems: 0,
    pendingApprovals: 1,
    publishingRisk: 'low',
    recommendation: 'Ready for controlled publishing handoff.',
  },
  {
    id: 'campaign-command-002',
    campaign: 'Trust Campaign',
    readiness: 71,
    blockedItems: 2,
    pendingApprovals: 3,
    publishingRisk: 'medium',
    recommendation: 'Resolve approval pressure before scheduling final release.',
  },
  {
    id: 'campaign-command-003',
    campaign: 'Partnership Push',
    readiness: 48,
    blockedItems: 5,
    pendingApprovals: 2,
    publishingRisk: 'high',
    recommendation: 'Escalate blocked deliverables and reassign production ownership.',
  },
];

export const phase24ExecutiveDecisionItems: Phase24ExecutiveDecisionItem[] = [
  {
    id: 'decision-001',
    title: 'Validate final campaign visual direction',
    area: 'Brand Governance',
    urgency: 'high',
    requiredDecision: 'Approve or request revision before publishing queue advances.',
    status: 'pending',
  },
  {
    id: 'decision-002',
    title: 'Confirm priority campaign sequence',
    area: 'Publishing',
    urgency: 'urgent',
    requiredDecision: 'Choose which campaign gets first release window.',
    status: 'reviewing',
  },
  {
    id: 'decision-003',
    title: 'Approve new product sheet positioning',
    area: 'Product Sheets',
    urgency: 'normal',
    requiredDecision: 'Validate service positioning and conversion CTA.',
    status: 'pending',
  },
];

export const phase24EscalationBoard: Phase24EscalationBoardItem[] = [
  {
    id: 'escalation-001',
    title: 'Partnership Push release blocked',
    owner: 'Marketing Ops',
    severity: 'high',
    nextAction: 'Resolve missing approvals and translation readiness.',
  },
  {
    id: 'escalation-002',
    title: 'Outdated brand template detected',
    owner: 'Brand Lead',
    severity: 'medium',
    nextAction: 'Replace template and revalidate affected assets.',
  },
];