import type { SupabaseClient } from '@supabase/supabase-js'

export type AmbassadorAccessMode = 'full' | 'view_only' | 'custom' | 'none'

type SyncResult = {
  ok: boolean
  error?: string
  access_mode?: AmbassadorAccessMode
  grant_version?: number
  native_role_key?: string
}

export async function synchronizeAmbassadorAccess(
  supabase: SupabaseClient,
  input: {
    appUserId: string
    assignedBy: string
    accessMode: AmbassadorAccessMode
    customPermissions: string[]
    globalPermissions: string[]
    tenantId?: string | null
    organizationId?: string | null
  },
): Promise<SyncResult> {
  const { data, error } = await supabase.rpc('sync_market_os_ambassador_user_access', {
    p_app_user_id: input.appUserId,
    p_assigned_by: input.assignedBy,
    p_access_mode: input.accessMode,
    p_custom_permissions: input.customPermissions,
    p_global_permissions: input.globalPermissions,
    p_tenant_id: input.tenantId || null,
    p_organization_id: input.organizationId || null,
  })
  if (error) throw new Error(`Ambassador native authorization synchronization failed: ${error.message}`)
  const result = data as SyncResult | null
  if (!result?.ok) throw new Error(result?.error || 'Ambassador native authorization synchronization failed.')
  return result
}
