import type { ActorContext } from './types';

export function buildAuditLog(actor: ActorContext, input: { entity: string; entityId: string; action: string; summary: string; metadata?: Record<string, unknown> }) {
  return {
    entity: input.entity,
    entity_id: input.entityId,
    action: input.action,
    actor_id: actor.actorId,
    actor_role: actor.role,
    summary: input.summary,
    metadata: input.metadata ?? {}
  };
}
