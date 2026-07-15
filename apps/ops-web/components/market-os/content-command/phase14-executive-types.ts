export interface Phase14ExecutiveKpi {
  id: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
}

export interface Phase14RiskItem {
  id: string;
  title: string;
  severity: 'medium' | 'high' | 'critical';
  owner: string;
  recommendation: string;
}

export interface Phase14DecisionQueueItem {
  id: string;
  title: string;
  area: string;
  urgency: 'normal' | 'high';
  status: 'pending' | 'reviewing';
}