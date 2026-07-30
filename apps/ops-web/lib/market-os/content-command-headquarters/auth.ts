import { getCurrentAppUser } from '@/lib/auth/session'

export type ContentHeadquartersPermission = 'view' | 'operate' | 'review' | 'govern' | 'configure_ai' | 'manage_sources' | 'publish' | 'edit' | 'cancel' | 'archive' | 'restore' | 'delete' | 'purge' | 'reopen' | 'supersede'

const privilegedRoles = new Set(['ceo', 'owner', 'direction', 'admin', 'super_admin', 'root', 'root_admin'])
const marketingRoles = new Set(['marketing_director', 'marketing_manager', 'market_manager', 'brand_manager', 'content_manager', 'content_strategist', 'creative_director'])
const operatorRoles = new Set(['content_officer', 'copywriter', 'designer', 'video_producer', 'community_manager', 'publishing_officer'])

export async function requireContentHeadquartersUser(permission: ContentHeadquartersPermission) {
  const user = await getCurrentAppUser()
  if (!user) throw new Error('UNAUTHENTICATED')
  const record = user as Record<string, unknown>
  const role = String(record.role || record.role_key || '').trim().toLowerCase()
  const permissions = Array.isArray(record.permissions) ? (record.permissions as unknown[]).map(String) : []
  const explicit = permissions.includes('*') || permissions.includes(`content_headquarters.${permission}`) || permissions.includes('content_headquarters.manage')
  const allowed = privilegedRoles.has(role)
    || explicit
    || (permission === 'view' && (marketingRoles.has(role) || operatorRoles.has(role)))
    || (['operate'].includes(permission) && (marketingRoles.has(role) || operatorRoles.has(role)))
    || (permission === 'review' && marketingRoles.has(role))
    || (permission === 'configure_ai' && ['marketing_director', 'marketing_manager'].includes(role))
    || (permission === 'manage_sources' && ['marketing_director', 'marketing_manager', 'content_manager', 'brand_manager'].includes(role))
    || (permission === 'publish' && ['marketing_director', 'marketing_manager', 'content_manager', 'publishing_officer', 'community_manager'].includes(role))
    || (['edit', 'cancel', 'archive', 'restore', 'reopen'].includes(permission) && (marketingRoles.has(role) || operatorRoles.has(role)))
    || (permission === 'delete' && ['marketing_director', 'marketing_manager', 'content_manager'].includes(role))
    || (permission === 'supersede' && ['marketing_director', 'marketing_manager'].includes(role))
    || (permission === 'purge' && privilegedRoles.has(role))
  if (!allowed) throw new Error('FORBIDDEN')
  return {
    id: String(record.id || ''),
    name: String(record.full_name || record.name || 'Utilisateur ANGELCARE'),
    email: String(record.email || ''),
    role,
    permissions,
  }
}

export function contentHeadquartersApiError(error: unknown) {
  const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
  const status = message === 'UNAUTHENTICATED' ? 401
    : message === 'FORBIDDEN' ? 403
    : message.includes('NOT_FOUND') ? 404
    : message.includes('CONFLICT') || message.includes('ALREADY_') || message.includes('LIMIT_REACHED') || message.includes('INCOMPLETE') || message.includes('PENDING') || message.includes('IMMUTABLE') || message.includes('PURGE_BLOCKED') || message.startsWith('ACTION_BLOCKED') ? 409
    : message.includes('MISSING') || message.includes('UNAVAILABLE') || message.includes('NOT_INSTALLED') ? 503
    : message.startsWith('INVALID_') || message.endsWith('_REQUIRED') || message.includes('CONFIRMATION_MISMATCH') ? 400
    : 500
  return Response.json({ ok: false, error: message }, { status })
}
