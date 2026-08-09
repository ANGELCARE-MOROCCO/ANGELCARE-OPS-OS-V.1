export interface Phase13WorkloadMember {
  id: string;
  name: string;
  activeTasks: number;
  overdueTasks: number;
  capacityScore: number;
}

export interface Phase13CampaignHealth {
  id: string;
  campaign: string;
  readiness: number;
  blockedItems: number;
  overdueItems: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface Phase13OperationalAlert {
  id: string;
  title: string;
  severity: 'warning' | 'critical';
  area: string;
  recommendation: string;
}