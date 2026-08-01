import { getCurrentAppUser } from '@/lib/auth/session'
import { serializeContentCommandError } from './runtime-errors'

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
  const serialized = serializeContentCommandError(error)
  return Response.json(serialized, { status: serialized.status })
}
