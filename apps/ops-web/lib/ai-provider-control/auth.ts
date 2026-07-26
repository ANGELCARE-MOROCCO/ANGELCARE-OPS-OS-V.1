import { getCurrentAppUser } from '@/lib/auth/session'

export type AiProviderPermission = 'view' | 'manage' | 'credentials' | 'routing' | 'quota' | 'emergency' | 'audit'

const privilegedRoles = new Set([
  'ceo', 'owner', 'direction', 'admin', 'super_admin', 'root', 'root_admin',
  'ai_governance_admin', 'ai_provider_admin', 'it_admin', 'technology_director',
])

export async function requireAiProviderUser(permission: AiProviderPermission) {
  const user = await getCurrentAppUser()
  if (!user) throw new Error('UNAUTHENTICATED')
  const raw = user as Record<string, unknown>
  const role = String(raw.role || raw.role_key || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  const permissions = Array.isArray(raw.permissions) ? (raw.permissions as unknown[]).map(String) : []
  const explicit = permissions.includes('*')
    || permissions.includes(`ai_provider_control.${permission}`)
    || permissions.includes('ai_provider_control.manage')
  if (!privilegedRoles.has(role) && !explicit) throw new Error('FORBIDDEN')
  return {
    id: String(raw.id || ''),
    name: String(raw.full_name || raw.name || 'Administrateur ANGELCARE'),
    email: String(raw.email || ''),
    role,
    permissions,
  }
}

export function aiProviderApiError(error: unknown) {
  const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
  const status = message === 'UNAUTHENTICATED' ? 401
    : message === 'FORBIDDEN' ? 403
    : message.includes('NOT_FOUND') ? 404
    : message.includes('CONFLICT') || message.includes('BUDGET') || message.includes('COOLDOWN') ? 409
    : message.includes('REQUIRED') || message.includes('INVALID') || message.includes('EMPTY') ? 400
    : message.includes('MIGRATION') || message.includes('VAULT') ? 503
    : 500
  return Response.json({ ok: false, error: message }, { status })
}
