export type AmbassadorAuditPayload = {
  entity: string;
  entityId: string;
  action: string;
  actorId: string;
  actorRole: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

export function createAuditPayload(input: AmbassadorAuditPayload): AmbassadorAuditPayload & { createdAt: string } {
  return {
    ...input,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString()
  };
}
