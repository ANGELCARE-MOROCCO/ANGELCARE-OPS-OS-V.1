import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/getUser'

export async function requireAccess(required: string | string[]) {
  const user = await getCurrentUser()

  if (!user) redirect('/login')

  const role = String((user as any).role || '').toLowerCase()

  if (role === 'ceo') return user

  const userPermissions = Array.isArray((user as any).permissions)
    ? (user as any).permissions
    : []

  const requiredList = Array.isArray(required) ? required : [required]

  const allowed = requiredList.some((permission) =>
    userPermissions.includes(permission)
  )

  if (!allowed) redirect('/unauthorized')

  return user
}