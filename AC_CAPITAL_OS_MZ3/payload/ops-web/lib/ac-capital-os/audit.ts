import type { AcCapitalOsAuditEvent } from './types';

export function createAcCapitalOsAuditEvent(event: Omit<AcCapitalOsAuditEvent, 'module' | 'createdAt'>): AcCapitalOsAuditEvent {
  return {
    ...event,
    module: 'AC CAPITAL OS',
    createdAt: new Date().toISOString(),
  };
}
