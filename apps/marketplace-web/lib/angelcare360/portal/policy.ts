import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type PortalDatabaseClient = Awaited<ReturnType<typeof createClient>>
export type ParentCapability = 'view' | 'guardian' | 'finance' | 'pickup' | 'messages'

export type ParentRelationshipPolicy = {
  id: string
  studentId: string
  relationshipType: string
  isGuardian: boolean
  isPrimary: boolean
  canPayFees: boolean
  canPickup: boolean
  canReceiveMessages: boolean
}

function bool(value: unknown) { return value === true || value === 1 || value === 'true' }
function text(value: unknown) { return String(value ?? '').trim() }

export async function loadParentRelationshipPolicies(client: PortalDatabaseClient, schoolId: string, parentId: string) {
  const { data, error } = await client
    .from('angelcare360_student_parent_links')
    .select('id,student_id,relationship_type,is_guardian,is_primary,can_pay_fees,can_pickup,can_receive_messages,status')
    .eq('school_id', schoolId)
    .eq('parent_id', parentId)
    .eq('status', 'active')
    .limit(200)
  if (error) throw new Error(`Relations famille indisponibles: ${error.message}`)
  return (data || []).map((row) => ({
    id: text(row.id),
    studentId: text(row.student_id),
    relationshipType: text(row.relationship_type),
    isGuardian: bool(row.is_guardian),
    isPrimary: bool(row.is_primary),
    canPayFees: bool(row.can_pay_fees),
    canPickup: bool(row.can_pickup),
    canReceiveMessages: bool(row.can_receive_messages),
  } satisfies ParentRelationshipPolicy))
}

export function parentPolicyAllows(policy: ParentRelationshipPolicy, capability: ParentCapability) {
  if (capability === 'view') return true
  if (capability === 'guardian') return policy.isGuardian || policy.isPrimary
  if (capability === 'finance') return policy.canPayFees
  if (capability === 'pickup') return policy.canPickup
  if (capability === 'messages') return policy.canReceiveMessages
  return false
}

export async function requireParentChildCapability(
  client: PortalDatabaseClient,
  schoolId: string,
  parentId: string,
  studentId: string,
  capability: ParentCapability,
) {
  const policies = await loadParentRelationshipPolicies(client, schoolId, parentId)
  const policy = policies.find((item) => item.studentId === studentId)
  if (!policy) throw new Error('Cet enfant ne fait pas partie de votre périmètre familial actif.')
  if (!parentPolicyAllows(policy, capability)) {
    const labels: Record<ParentCapability, string> = {
      view: 'consulter ce dossier',
      guardian: 'agir comme responsable légal',
      finance: 'accéder aux données financières',
      pickup: 'gérer les autorisations de sortie',
      messages: 'utiliser la messagerie liée à cet enfant',
    }
    throw new Error(`Votre relation familiale ne vous autorise pas à ${labels[capability]}.`)
  }
  return policy
}

export async function portalPermissionSet(client: PortalDatabaseClient, schoolId: string, appUserId: string) {
  const { data: assignments, error: assignmentError } = await client
    .from('angelcare360_user_roles')
    .select('role_id,status,starts_at,ends_at')
    .eq('school_id', schoolId)
    .eq('app_user_id', appUserId)
    .eq('status', 'active')
  if (assignmentError) throw new Error(`Rôles portail indisponibles: ${assignmentError.message}`)
  const now = Date.now()
  const roleIds = (assignments || [])
    .filter((row) => {
      const starts = row.starts_at ? new Date(String(row.starts_at)).getTime() : null
      const ends = row.ends_at ? new Date(String(row.ends_at)).getTime() : null
      return (!starts || starts <= now) && (!ends || ends >= now)
    })
    .map((row) => text(row.role_id))
    .filter(Boolean)
  if (!roleIds.length) return new Set<string>()
  const { data, error } = await client
    .from('angelcare360_role_permissions')
    .select('permission_key,effect,role_id')
    .in('role_id', roleIds)
  if (error) throw new Error(`Permissions portail indisponibles: ${error.message}`)
  const denied = new Set((data || []).filter((row) => text(row.effect) === 'deny').map((row) => text(row.permission_key)))
  const allowed = new Set((data || []).filter((row) => text(row.effect || 'allow') !== 'deny').map((row) => text(row.permission_key)))
  for (const key of denied) allowed.delete(key)
  return allowed
}
