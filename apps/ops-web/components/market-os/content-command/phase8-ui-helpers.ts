import type { Phase8Priority, Phase8Status } from './phase8-workspace-data';

export function getStatusLabel(status: Phase8Status): string {
  const labels: Record<Phase8Status, string> = {
    draft: 'Draft',
    review: 'Review',
    approved: 'Approved',
    scheduled: 'Scheduled',
    published: 'Published',
    blocked: 'Blocked',
  };

  return labels[status];
}

export function getPriorityLabel(priority: Phase8Priority): string {
  const labels: Record<Phase8Priority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };

  return labels[priority];
}

export function getProgressLabel(value: number): string {
  if (value >= 85) return 'Strong';
  if (value >= 70) return 'Good';
  if (value >= 50) return 'Needs work';
  return 'At risk';
}