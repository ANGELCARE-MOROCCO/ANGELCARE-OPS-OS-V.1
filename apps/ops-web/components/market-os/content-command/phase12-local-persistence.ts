import type { Phase12ExportPayload } from './phase12-service-types';

let snapshot: Phase12ExportPayload | null = null;

/**
 * Compatibility name retained. Export snapshots are transient operator artifacts,
 * not authoritative Content Command business records.
 */
export function savePhase12PayloadToLocalStorage(payload: Phase12ExportPayload): boolean {
  snapshot = payload;
  return true;
}

export function readPhase12PayloadFromLocalStorage(): Phase12ExportPayload | null {
  return snapshot;
}

export function clearPhase12PayloadFromLocalStorage(): boolean {
  snapshot = null;
  return true;
}
