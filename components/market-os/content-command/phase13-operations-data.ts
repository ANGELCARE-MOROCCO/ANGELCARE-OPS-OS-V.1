import type {
  Phase13CampaignHealth,
  Phase13OperationalAlert,
  Phase13WorkloadMember,
} from './phase13-operations-types';

export const phase13WorkloadMembers: Phase13WorkloadMember[] = [
  {
    id: 'member-1',
    name: 'Content Lead',
    activeTasks: 12,
    overdueTasks: 1,
    capacityScore: 82,
  },
  {
    id: 'member-2',
    name: 'Designer',
    activeTasks: 18,
    overdueTasks: 4,
    capacityScore: 61,
  },
  {
    id: 'member-3',
    name: 'Marketing',
    activeTasks: 7,
    overdueTasks: 0,
    capacityScore: 91,
  },
];

export const phase13CampaignHealth: Phase13CampaignHealth[] = [
  {
    id: 'camp-1',
    campaign: 'Core Services',
    readiness: 88,
    blockedItems: 1,
    overdueItems: 0,
    status: 'healthy',
  },
  {
    id: 'camp-2',
    campaign: 'Trust Campaign',
    readiness: 54,
    blockedItems: 3,
    overdueItems: 2,
    status: 'warning',
  },
  {
    id: 'camp-3',
    campaign: 'Partnership Push',
    readiness: 32,
    blockedItems: 5,
    overdueItems: 4,
    status: 'critical',
  },
];

export const phase13OperationalAlerts: Phase13OperationalAlert[] = [
  {
    id: 'alert-1',
    title: 'Design bottleneck detected',
    severity: 'warning',
    area: 'Creative Production',
    recommendation: 'Redistribute active design tasks before campaign delays increase.',
  },
  {
    id: 'alert-2',
    title: 'Campaign readiness at risk',
    severity: 'critical',
    area: 'Partnership Push',
    recommendation: 'Resolve blocked deliverables before launch scheduling.',
  },
];