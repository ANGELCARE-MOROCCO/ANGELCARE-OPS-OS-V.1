import type {
  Phase34DependencyBlocker,
  Phase34EscalationTrigger,
  Phase34ExecutionHealth,
  Phase34ExecutionTask,
  Phase34OperatorLoad,
} from './phase34-execution-types';

export const phase34ExecutionTasks: Phase34ExecutionTask[] = [
  {
    id: 'exec-001',
    title: 'Finalize core services brochure',
    campaign: 'Core Services',
    owner: 'Content Lead',
    state: 'review',
    priority: 'high',
    dueLabel: 'Today',
    slaHours: 24,
    elapsedHours: 18,
    dependencies: ['brand approval'],
  },
  {
    id: 'exec-002',
    title: 'Prepare trust campaign carousel',
    campaign: 'Trust Campaign',
    owner: 'Designer',
    state: 'blocked',
    priority: 'urgent',
    dueLabel: 'Overdue',
    slaHours: 12,
    elapsedHours: 20,
    dependencies: ['final copy', 'brand validation'],
  },
  {
    id: 'exec-003',
    title: 'Queue LinkedIn partnership post',
    campaign: 'Partnership Push',
    owner: 'Marketing Ops',
    state: 'assigned',
    priority: 'medium',
    dueLabel: 'Tomorrow',
    slaHours: 36,
    elapsedHours: 8,
    dependencies: ['executive validation'],
  },
  {
    id: 'exec-004',
    title: 'Create family support product sheet',
    campaign: 'Family Care',
    owner: 'Marketing',
    state: 'in_progress',
    priority: 'high',
    dueLabel: 'This week',
    slaHours: 48,
    elapsedHours: 14,
    dependencies: [],
  },
];

export const phase34DependencyBlockers: Phase34DependencyBlocker[] = [
  {
    id: 'blocker-001',
    taskId: 'exec-002',
    blocker: 'Final copy is missing.',
    severity: 'high',
    blockingSince: 'Recent',
    recommendedAction: 'Assign copy owner and escalate if not completed today.',
  },
  {
    id: 'blocker-002',
    taskId: 'exec-002',
    blocker: 'Brand validation not completed.',
    severity: 'critical',
    blockingSince: 'Recent',
    recommendedAction: 'Send to brand manager for immediate decision.',
  },
  {
    id: 'blocker-003',
    taskId: 'exec-003',
    blocker: 'Executive validation pending.',
    severity: 'medium',
    blockingSince: 'Recent',
    recommendedAction: 'Add decision item to executive queue.',
  },
];

export const phase34EscalationTriggers: Phase34EscalationTrigger[] = [
  {
    id: 'trigger-sla-breach',
    trigger: 'SLA breach',
    condition: 'Elapsed hours exceed SLA hours.',
    escalateTo: 'Marketing Director',
    enabled: true,
  },
  {
    id: 'trigger-critical-blocker',
    trigger: 'Critical blocker',
    condition: 'A task has a critical blocker.',
    escalateTo: 'Brand Manager',
    enabled: true,
  },
  {
    id: 'trigger-urgent-overload',
    trigger: 'Operator overload',
    condition: 'Operator capacity exceeds 90% with urgent tasks.',
    escalateTo: 'Marketing Ops',
    enabled: true,
  },
];

export const phase34OperatorLoads: Phase34OperatorLoad[] = [
  {
    id: 'load-content',
    operator: 'Content Lead',
    activeTasks: 9,
    urgentTasks: 1,
    capacityPercent: 76,
  },
  {
    id: 'load-designer',
    operator: 'Designer',
    activeTasks: 14,
    urgentTasks: 3,
    capacityPercent: 94,
  },
  {
    id: 'load-marketing',
    operator: 'Marketing',
    activeTasks: 7,
    urgentTasks: 1,
    capacityPercent: 66,
  },
  {
    id: 'load-ops',
    operator: 'Marketing Ops',
    activeTasks: 11,
    urgentTasks: 2,
    capacityPercent: 83,
  },
];

export const phase34ExecutionHealth: Phase34ExecutionHealth[] = [
  {
    label: 'Execution Flow',
    score: 82,
    risk: 'medium',
    recommendation: 'Resolve blocked design tasks before publishing dates compress.',
  },
  {
    label: 'SLA Discipline',
    score: 74,
    risk: 'high',
    recommendation: 'Escalate overdue urgent tasks and rebalance workload.',
  },
  {
    label: 'Workload Balance',
    score: 69,
    risk: 'high',
    recommendation: 'Designer workload is above healthy capacity.',
  },
  {
    label: 'Campaign Readiness',
    score: 86,
    risk: 'medium',
    recommendation: 'Core Services is strong; Trust Campaign needs attention.',
  },
];