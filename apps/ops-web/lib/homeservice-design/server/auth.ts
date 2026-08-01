import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/getUser'
import type { HsdDecision } from '@/types/homeservice-design'

export type HomeServiceUser = Record<string, unknown> & {
  id?: string | number
  role?: string
  permissions?: string[]
  full_name?: string
  name?: string
  email?: string
}

function normalizedRole(user: HomeServiceUser) {
  return String(user.role || '').trim().toLowerCase()
}

function permissionList(user: HomeServiceUser) {
  return Array.isArray(user.permissions) ? user.permissions.map(String) : []
}

export function userLabel(user: HomeServiceUser) {
  return String(user.full_name || user.name || user.email || user.id || 'Utilisateur AngelCare')
}

export function userId(user: HomeServiceUser) {
  return String(user.id || user.email || 'unknown-user')
}

export function canHomeService(user: HomeServiceUser, permission: string | string[]) {
  const role = normalizedRole(user)
  if (['ceo', 'admin', 'super_admin', 'managing_director', 'managing director'].includes(role)) return true
  const required = Array.isArray(permission) ? permission : [permission]
  const owned = permissionList(user)
  return required.some((item) => owned.includes(item) || owned.includes('homeservice_design.admin'))
}

export async function requireHomeServiceAccess(permission: string | string[] = 'homeservice_design.view') {
  const user = (await getCurrentUser()) as HomeServiceUser | null
  if (!user) redirect('/login')
  if (!canHomeService(user, permission)) redirect('/unauthorized')
  return user
}

export async function requireHomeServiceApi(permission: string | string[] = 'homeservice_design.view') {
  const user = (await getCurrentUser()) as HomeServiceUser | null
  if (!user) throw Object.assign(new Error('Authentification requise.'), { status: 401, code: 'AUTH_REQUIRED' })
  if (!canHomeService(user, permission)) throw Object.assign(new Error('Autorité insuffisante pour cette action.'), { status: 403, code: 'PERMISSION_DENIED' })
  return user
}

export function decisionPermission(decision: HsdDecision) {
  if (decision === 'approve') return 'homeservice_design.approve'
  if (decision === 'suspend') return 'homeservice_design.publish'
  return 'homeservice_design.review'
}
