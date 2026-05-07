export type AuditInput = { actor: string; action: string; targetType?: string; targetId?: string; result: string; details?: Record<string, unknown> };

const memoryAudit: AuditInput[] = [];

export async function writeAuditLog(input: AuditInput) {
  // Replace this with Supabase/Postgres insert after EMAIL_OS_DATABASE_URL is configured.
  memoryAudit.unshift({ ...input, details: input.details || {} });
  return { status: 'ok' as const, message: 'Audit log recorded in V15 audit boundary.', data: input };
}

export async function listAuditLogs() {
  return memoryAudit.slice(0, 100);
}
