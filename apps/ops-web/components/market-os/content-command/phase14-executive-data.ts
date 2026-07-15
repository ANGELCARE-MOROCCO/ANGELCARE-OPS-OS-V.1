import type {
  Phase14DecisionQueueItem,
  Phase14ExecutiveKpi,
  Phase14RiskItem,
} from './phase14-executive-types';

export const phase14ExecutiveKpis: Phase14ExecutiveKpi[] = [
  { id: 'k1', label: 'Publishing Velocity', value: '84%', trend: 'up' },
  { id: 'k2', label: 'Campaign Readiness', value: '71%', trend: 'stable' },
  { id: 'k3', label: 'Approval Efficiency', value: '63%', trend: 'down' },
  { id: 'k4', label: 'Brand Compliance', value: '92%', trend: 'up' },
];

export const phase14RiskItems: Phase14RiskItem[] = [
  {
    id: 'r1',
    title: 'Delayed partnership campaign assets',
    severity: 'critical',
    owner: 'Marketing Ops',
    recommendation: 'Prioritize overdue deliverables and reassign blocked tasks.',
  },
  {
    id: 'r2',
    title: 'Approval bottleneck in social publishing',
    severity: 'high',
    owner: 'Brand Review',
    recommendation: 'Increase review bandwidth for scheduled content.',
  },
];

export const phase14DecisionQueue: Phase14DecisionQueueItem[] = [
  {
    id: 'd1',
    title: 'Approve Ramadan visual direction',
    area: 'Campaign Branding',
    urgency: 'high',
    status: 'pending',
  },
  {
    id: 'd2',
    title: 'Validate new brochure structure',
    area: 'Content Production',
    urgency: 'normal',
    status: 'reviewing',
  },
];