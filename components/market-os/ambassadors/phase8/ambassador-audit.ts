import type {
  AmbassadorAuditAction,
  AmbassadorAuditLog,
  AmbassadorBackendEntity,
  AmbassadorRole,
} from "./ambassador-backend-types";

export function createAmbassadorAuditLog(params: {
  entity: AmbassadorBackendEntity;
  entityId: string;
  action: AmbassadorAuditAction;
  actorId: string;
  actorRole: AmbassadorRole;
  summary: string;
  metadata?: Record<string, string | number | boolean | null>;
}): AmbassadorAuditLog {
  return {
    id: `audit-${params.entity}-${params.entityId}-${Date.now()}`,
    entity: params.entity,
    entityId: params.entityId,
    action: params.action,
    actorId: params.actorId,
    actorRole: params.actorRole,
    summary: params.summary,
    metadata: params.metadata ?? {},
    createdAt: new Date().toISOString(),
  };
}

export function formatAuditSummary(log: AmbassadorAuditLog): string {
  return `${log.actorRole} performed ${log.action} on ${log.entity}:${log.entityId}`;
}
