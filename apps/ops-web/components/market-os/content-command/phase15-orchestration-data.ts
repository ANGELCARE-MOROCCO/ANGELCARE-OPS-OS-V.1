import type {
  Phase15EscalationRoute,
  Phase15PipelineStep,
  Phase15ReleaseGate,
} from './phase15-orchestration-types';

export const phase15PipelineSteps: Phase15PipelineStep[] = [
  {
    id: 'step-1',
    title: 'Campaign asset preparation',
    owner: 'Content Team',
    status: 'completed',
    dependencyCount: 0,
  },
  {
    id: 'step-2',
    title: 'Brand validation review',
    owner: 'Brand Reviewer',
    status: 'active',
    dependencyCount: 2,
  },
  {
    id: 'step-3',
    title: 'Publishing orchestration',
    owner: 'Marketing Ops',
    status: 'blocked',
    dependencyCount: 3,
  },
];

export const phase15ReleaseGates: Phase15ReleaseGate[] = [
  {
    id: 'gate-1',
    title: 'SEO completeness',
    passed: true,
    severity: 'medium',
  },
  {
    id: 'gate-2',
    title: 'Translation coverage',
    passed: false,
    severity: 'high',
  },
  {
    id: 'gate-3',
    title: 'Brand compliance',
    passed: true,
    severity: 'high',
  },
];

export const phase15EscalationRoutes: Phase15EscalationRoute[] = [
  {
    id: 'route-1',
    area: 'Publishing',
    escalationOwner: 'Marketing Director',
    trigger: 'Blocked release pipeline',
  },
  {
    id: 'route-2',
    area: 'Brand Governance',
    escalationOwner: 'Brand Lead',
    trigger: 'Critical compliance issue',
  },
];