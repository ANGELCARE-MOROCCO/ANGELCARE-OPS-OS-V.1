import { ZodError } from 'zod'
import { getCurrentAppUser } from '@/lib/auth/session'

export type MarketingAiPermission = 'view' | 'manage' | 'review' | 'run' | 'import' | 'schedule' | 'govern' | 'override' | 'purge'

const privilegedRoles = new Set(['ceo', 'owner', 'direction', 'admin', 'super_admin', 'root', 'root_admin'])
const marketingRoles = new Set(['marketing_director', 'marketing_manager', 'market_manager', 'brand_manager', 'content_manager'])

export async function requireMarketingAiUser(permission: MarketingAiPermission) {
  const user = await getCurrentAppUser()
  if (!user) throw new Error('UNAUTHENTICATED')
  const role = String((user as Record<string, unknown>).role || (user as Record<string, unknown>).role_key || '').trim().toLowerCase()
  const permissions = Array.isArray((user as Record<string, unknown>).permissions)
    ? ((user as Record<string, unknown>).permissions as unknown[]).map(String)
    : []
  const explicit = permissions.includes('*') || permissions.includes(`market_ai.${permission}`) || permissions.includes('market_ai.manage')
  const allowed = privilegedRoles.has(role) || explicit
    || (permission === 'view' && marketingRoles.has(role))
    || (permission === 'review' && ['marketing_director', 'marketing_manager', 'brand_manager'].includes(role))
    || (['run', 'schedule', 'override'].includes(permission) && role === 'marketing_director')
    || (permission === 'govern' && ['marketing_director', 'marketing_manager'].includes(role))
  if (!allowed) throw new Error('FORBIDDEN')
  return {
    id: String((user as Record<string, unknown>).id || ''),
    name: String((user as Record<string, unknown>).full_name || (user as Record<string, unknown>).name || 'Utilisateur ANGELCARE'),
    email: String((user as Record<string, unknown>).email || ''),
    role,
    permissions,
  }
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ZodError) return Response.json({ ok: false, error: 'INVALID_REQUEST', issues: error.issues }, { status: 400 })
  const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
  const status = message === 'UNAUTHENTICATED' ? 401
    : message === 'FORBIDDEN' || message === 'EXTERNAL_ACTION_BLOCKED' ? 403
    : message.includes('NOT_FOUND') ? 404
    : message.includes('NOT_DEPLOYED') || message.includes('LIMIT_REACHED') ? 409
    : message.includes('CONFIRMATION_REQUIRED') || message.includes('MUST_BE_') || message.includes('HAS_ACTIVE') || message.includes('HAS_ASSIGNMENTS') ? 409
    : message.includes('MISSING') || message.includes('DISABLED') || message.includes('UNAVAILABLE') || message.includes('PROVIDER_RETIRED') ? 503
    : message.startsWith('CSV_') || message.startsWith('INVALID_') || message.endsWith('_REQUIRED') ? 400
    : 500
  return Response.json({ ok: false, error: message }, { status })
}
