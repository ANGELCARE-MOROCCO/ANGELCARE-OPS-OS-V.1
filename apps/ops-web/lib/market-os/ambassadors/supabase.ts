import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { AmbassadorServiceError } from "./errors"

let cachedClient: SupabaseClient | null = null

function requiredEnv(primary: string, fallback?: string): string {
  const value = process.env[primary] || (fallback ? process.env[fallback] : undefined)
  if (!value) {
    throw new AmbassadorServiceError(
      "CONFIGURATION_ERROR",
      `Missing required Ambassador production environment variable: ${primary}`,
      503,
    )
  }
  return value
}

export function getAmbassadorSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL")
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY")
  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return cachedClient
}
