import type { ApiEnvelope, Row } from "./types";

export function asRow(value: unknown): Row {
  return value && typeof value === "object" ? value as Row : {};
}

export function rowsFrom(envelope: ApiEnvelope | null, group: string): Row[] {
  const data = asRow(envelope?.data);
  const groups = asRow(data.groups);
  const bucket = asRow(groups[group]);
  const rows = bucket.rows;
  return Array.isArray(rows) ? rows.filter((item): item is Row => Boolean(item && typeof item === "object")) : [];
}

export function firstRows(envelope: ApiEnvelope | null): Row[] {
  const data = asRow(envelope?.data);
  const groups = asRow(data.groups);
  for (const value of Object.values(groups)) {
    const rows = asRow(value).rows;
    if (Array.isArray(rows) && rows.length) return rows as Row[];
  }
  return [];
}

export function text(row: Row, keys: string[], fallback = "—") {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return fallback;
}

export function number(row: Row, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = Number(row[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

export function bool(row: Row, keys: string[], fallback = false) {
  for (const key of keys) {
    if (typeof row[key] === "boolean") return Boolean(row[key]);
  }
  return fallback;
}

export function list(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string" && value.trim()) return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function formatDh(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(numeric)} Dh`;
}

export function shortDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

export function modeLabel(envelope: ApiEnvelope | null) {
  if (!envelope) return "Checking";
  if (envelope.dataMode === "supabase-live") return "Supabase Live";
  if (envelope.dataMode === "disabled") return "Disabled for Safety";
  return "Seeded Fallback";
}
