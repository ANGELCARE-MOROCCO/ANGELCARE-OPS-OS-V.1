import { createClient } from '@supabase/supabase-js'

export function createAccessGovernanceAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase service-role configuration is required for access registry mutation.')
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { 'X-Client-Info': 'angelcare-access-governance' } },
  })
}
