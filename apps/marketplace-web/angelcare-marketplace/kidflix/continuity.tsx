"use client";
import { PersonalProvider, usePersonal } from "./journey/store";
import { parsePersonal } from "./journey/contract";
export const GuestProvider = PersonalProvider;
export function parseStore(raw: string | null, now = Date.now()) {
  let value;
  try {
    value = JSON.parse(raw || "null");
  } catch {
    value = null;
  }
  const p = parsePersonal(value, now);
  return { version: 1, saved: p.saved, recent: p.recent };
}
export function useGuest() {
  const p = usePersonal();
  return {
    saved: p.data.saved.map((v) => v.key),
    recent: p.data.recent.map((v) => v.key),
    ready: p.ready,
    toggle: p.toggle,
    visit: p.visit,
    clear: p.clear,
  };
}
