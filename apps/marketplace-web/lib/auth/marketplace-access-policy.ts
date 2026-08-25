type DbClient = {
  from: (table: string) => any
}

export type MarketplaceAccessPolicy = {
  status: 'active' | 'suspended' | 'revoked'
  accessStartsAt: string | null
  accessExpiresAt: string | null
  requireMfa: boolean
  sessionDurationHours: number
  allowedOrigins: string[]
  metadata: Record<string, unknown>
  configured: boolean
}

const DEFAULT_SESSION_HOURS = 12
const MAX_SESSION_HOURS = 168

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export async function getMarketplaceAccessPolicy(
  db: DbClient,
  appUserId: string,
): Promise<MarketplaceAccessPolicy> {
  const defaults: MarketplaceAccessPolicy = {
    status: 'active',
    accessStartsAt: null,
    accessExpiresAt: null,
    requireMfa: false,
    sessionDurationHours: DEFAULT_SESSION_HOURS,
    allowedOrigins: [],
    metadata: {},
    configured: false,
  }

  try {
    const { data, error } = await db
      .from('angelcare_marketplace_admin_access_policies')
      .select('status,access_starts_at,access_expires_at,require_mfa,session_duration_hours,allowed_origins,policy_metadata')
      .eq('app_user_id', appUserId)
      .maybeSingle()

    // Compatibility until the additive MZ1 migration is applied. No cross-product
    // table is consulted: Marketplace owns its access policy from this point on.
    if (error || !data) return defaults

    return {
      status: data.status === 'suspended' || data.status === 'revoked' ? data.status : 'active',
      accessStartsAt: data.access_starts_at ? String(data.access_starts_at) : null,
      accessExpiresAt: data.access_expires_at ? String(data.access_expires_at) : null,
      requireMfa: Boolean(data.require_mfa),
      sessionDurationHours: Math.max(
        1,
        Math.min(MAX_SESSION_HOURS, Number(data.session_duration_hours || DEFAULT_SESSION_HOURS)),
      ),
      allowedOrigins: Array.isArray(data.allowed_origins) ? data.allowed_origins.map(String) : [],
      metadata: asObject(data.policy_metadata),
      configured: true,
    }
  } catch {
    return defaults
  }
}

export function marketplacePolicyAllowsSession(
  policy: MarketplaceAccessPolicy,
  now = Date.now(),
): { ok: true } | { ok: false; reason: 'status' | 'not_started' | 'expired' } {
  if (policy.status !== 'active') return { ok: false, reason: 'status' }
  const startsAt = policy.accessStartsAt ? new Date(policy.accessStartsAt).getTime() : null
  const expiresAt = policy.accessExpiresAt ? new Date(policy.accessExpiresAt).getTime() : null
  if (startsAt && startsAt > now) return { ok: false, reason: 'not_started' }
  if (expiresAt && expiresAt <= now) return { ok: false, reason: 'expired' }
  return { ok: true }
}
