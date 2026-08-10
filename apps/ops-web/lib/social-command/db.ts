import { createServiceClient } from "@/lib/supabase/server"

export async function socialDb() {
  return createServiceClient()
}

export function nowIso() {
  return new Date().toISOString()
}

export function cleanString(value: unknown, max = 10000) {
  return String(value ?? "").trim().slice(0, max)
}

export function stringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((entry) => cleanString(entry, 200)).filter(Boolean))]
}

export function jsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
