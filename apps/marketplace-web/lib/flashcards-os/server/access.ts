import 'server-only'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/getUser'

const privilegedRoles = new Set([
  'ceo',
  'direction',
  'managing_director',
  'director_general',
  'dg',
  'admin',
  'super_admin',
  'owner',
  'root',
  'root_admin',
])

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function userPermissions(user: any): string[] {
  return Array.isArray(user?.permissions) ? user.permissions.map(String) : []
}

function hasPermission(user: any, permission: string) {
  const role = normalize(user?.role ?? user?.role_key)
  const permissions = userPermissions(user)
  return privilegedRoles.has(role) || permissions.includes('*') || permissions.includes(permission)
}

export async function requireFlashcardsPageAccess(permission = 'flashcards_os.view') {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!hasPermission(user, permission)) redirect('/unauthorized')
  return user
}

export async function assertFlashcardsApiAccess(permission: string) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, status: 401, message: 'Authentication required.' }
  if (hasPermission(user, permission)) return { ok: true as const, user }
  return { ok: false as const, status: 403, message: `Missing permission: ${permission}` }
}
