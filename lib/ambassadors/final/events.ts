import type { ActorContext } from './types';

export function buildAmbassadorEvent(actor: ActorContext | null, input: { eventName: string; entityType: string; entityId: string; payload?: Record<string, unknown> }) {
  return {
    event_name: input.eventName,
    entity_type: input.entityType,
    entity_id: input.entityId,
    actor_id: actor?.actorId ?? null,
    actor_role: actor?.role ?? null,
    payload: input.payload ?? {}
  };
}
