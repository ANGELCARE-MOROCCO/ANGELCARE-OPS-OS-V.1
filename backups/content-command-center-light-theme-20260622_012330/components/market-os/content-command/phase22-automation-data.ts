import type {
  Phase22AutomationRule,
  Phase22ExecutionLog,
} from './phase22-automation-types';

export const phase22AutomationRules: Phase22AutomationRule[] = [
  {
    id: 'rule-001',
    title: 'Notify reviewers after upload',
    trigger: 'asset_uploaded',
    action: 'assign_review',
    enabled: true,
    owner: 'Marketing Ops',
  },
  {
    id: 'rule-002',
    title: 'Queue publication after approval',
    trigger: 'approval_completed',
    action: 'queue_publication',
    enabled: true,
    owner: 'Publishing Team',
  },
];

export const phase22ExecutionLogs: Phase22ExecutionLog[] = [
  {
    id: 'log-001',
    ruleId: 'rule-001',
    status: 'success',
    executedAt: 'Recent',
    notes: 'Reviewers assigned successfully.',
  },
];