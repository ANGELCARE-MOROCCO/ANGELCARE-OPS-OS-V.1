import { listPhase12Activity, listPhase12Entities } from './phase12-repository';
import type { Phase12ExportPayload } from './phase12-service-types';

export function buildPhase12ExportPayload(): Phase12ExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    source: 'content_command_center',
    entities: listPhase12Entities(),
    activity: listPhase12Activity(),
  };
}

export function validatePhase12ImportPayload(payload: unknown): payload is Phase12ExportPayload {
  if (!payload || typeof payload !== 'object') return false;

  const candidate = payload as Partial<Phase12ExportPayload>;

  return (
    candidate.source === 'content_command_center' &&
    Array.isArray(candidate.entities) &&
    Array.isArray(candidate.activity) &&
    typeof candidate.exportedAt === 'string'
  );
}