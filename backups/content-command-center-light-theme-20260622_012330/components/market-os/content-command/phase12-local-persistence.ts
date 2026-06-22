import type { Phase12ExportPayload } from './phase12-service-types';

const STORAGE_KEY = 'angelcare.contentCommand.phase12.exportPayload';

export function savePhase12PayloadToLocalStorage(payload: Phase12ExportPayload): boolean {
  if (typeof window === 'undefined') return false;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return true;
}

export function readPhase12PayloadFromLocalStorage(): Phase12ExportPayload | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Phase12ExportPayload;
  } catch {
    return null;
  }
}

export function clearPhase12PayloadFromLocalStorage(): boolean {
  if (typeof window === 'undefined') return false;

  window.localStorage.removeItem(STORAGE_KEY);
  return true;
}