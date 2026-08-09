export type AmbassadorEventName =
  | 'ambassador.profile.created'
  | 'ambassador.mission.assigned'
  | 'ambassador.proof.reviewed'
  | 'ambassador.payout.approved'
  | 'ambassador.ai.recommended'
  | 'ambassador.notification.queued';

export type AmbassadorEvent = {
  eventName: AmbassadorEventName;
  entityType: string;
  entityId: string;
  actorId?: string;
  actorRole?: string;
  payload: Record<string, unknown>;
};

export function createAmbassadorEvent(event: AmbassadorEvent): AmbassadorEvent & { createdAt: string } {
  return {
    ...event,
    createdAt: new Date().toISOString()
  };
}
