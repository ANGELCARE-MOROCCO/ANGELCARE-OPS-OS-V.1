import type {
  Phase21ComplianceCheck,
  Phase21PublicationQueueItem,
  Phase21PublicationStatus,
} from './phase21-publishing-types';

export function getPhase21StatusLabel(status: Phase21PublicationStatus): string {
  const labels: Record<Phase21PublicationStatus, string> = {
    draft: 'Draft',
    approved: 'Approved',
    queued: 'Queued',
    scheduled: 'Scheduled',
    published: 'Published',
    blocked: 'Blocked',
    archived: 'Archived',
  };
  return labels[status];
}

export function getBlockedPhase21Publications(items: Phase21PublicationQueueItem[]): Phase21PublicationQueueItem[] {
  return items.filter((item) => item.status === 'blocked');
}

export function getReadyPhase21Publications(items: Phase21PublicationQueueItem[]): Phase21PublicationQueueItem[] {
  return items.filter((item) => item.readiness >= 80 && item.status !== 'blocked');
}

export function getFailedPhase21Checks(checks: Phase21ComplianceCheck[]): Phase21ComplianceCheck[] {
  return checks.filter((check) => !check.passed);
}

export function getPhase21PublicationRisk(item: Phase21PublicationQueueItem): 'low' | 'medium' | 'high' {
  if (item.status === 'blocked' || item.readiness < 60) return 'high';
  if (item.readiness < 80) return 'medium';
  return 'low';
}