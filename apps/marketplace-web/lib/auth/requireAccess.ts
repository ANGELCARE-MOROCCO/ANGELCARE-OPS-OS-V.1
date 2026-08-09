import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/getUser'
import { normalizeRevenueOsRole } from '@/lib/revenue-command-os/access'

const privilegedRoles = new Set(['ceo', 'direction', 'admin', 'super_admin'])

export async function requireAccess(required: string | string[]) {
  const user = await getCurrentUser()

  if (!user) redirect('/login')

  const role = normalizeRevenueOsRole((user as any).role ?? (user as any).role_key)
  const userPermissions = Array.isArray((user as any).permissions)
    ? (user as any).permissions.map(String)
    : []

  if (privilegedRoles.has(role) || userPermissions.includes('*')) return user

  const requiredList = Array.isArray(required) ? required : [required]
  const allowed = requiredList.some((permission) => userPermissions.includes(permission))

  if (!allowed) redirect('/unauthorized')

  return user
}
