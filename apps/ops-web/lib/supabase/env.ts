export function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  }
}

export function isSupabaseServerConfigured() {
  const env = getSupabaseEnv()
  return Boolean(env.url && env.serviceRoleKey)
}

export function getMissingSupabaseServerEnv() {
  const env = getSupabaseEnv()
  return [
    env.url ? "" : "NEXT_PUBLIC_SUPABASE_URL",
    env.serviceRoleKey ? "" : "SUPABASE_SERVICE_ROLE_KEY",
  ].filter((key): key is string => Boolean(key))
}
