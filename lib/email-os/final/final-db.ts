import { createEmailOSSupabaseClient } from "@/lib/email-os/production/supabase-server"

export function emailOSFinalDb() {
  return createEmailOSSupabaseClient()
}

export function nowIso() {
  return new Date().toISOString()
}

export function finalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
