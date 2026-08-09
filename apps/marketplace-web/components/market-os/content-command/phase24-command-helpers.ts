import type {
  Phase24CampaignCommandSummary,
  Phase24CommandKpi,
  Phase24EscalationBoardItem,
} from './phase24-command-types';

export function getPhase24CriticalKpis(kpis: Phase24CommandKpi[]): Phase24CommandKpi[] {
  return kpis.filter((kpi) => kpi.risk === 'critical' || kpi.risk === 'high');
}

export function getPhase24CampaignsAtRisk(campaigns: Phase24CampaignCommandSummary[]): Phase24CampaignCommandSummary[] {
  return campaigns.filter((campaign) => campaign.publishingRisk === 'high' || campaign.readiness < 60);
}

export function getPhase24EscalationsByRisk(items: Phase24EscalationBoardItem[]): Phase24EscalationBoardItem[] {
  return [...items].sort((a, b) => {
    const rank = { critical: 4, high: 3, medium: 2, low: 1 };
    return rank[b.severity] - rank[a.severity];
  });
}

export function getPhase24CommandConfidence(campaigns: Phase24CampaignCommandSummary[]): number {
  if (campaigns.length === 0) return 0;
  const total = campaigns.reduce((sum, campaign) => sum + campaign.readiness, 0);
  return Math.round(total / campaigns.length);
}