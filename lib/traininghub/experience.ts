import type { TrainingHubContext, TrainingHubEntitlement, TrainingHubRole } from './types'
import { TrainingHubHttpError } from './auth'

export type TrainingHubExperience = 'admin' | 'partner' | 'trainer' | 'learner'

const ADMIN_ROLE_CODES = new Set([
  'super_admin',
  'academy_director',
  'academy_ops',
  'sales_manager',
  'sales_agent',
  'finance_manager',
  'trainer_manager',
  'support_agent',
  'aftersales_manager',
  'auditor',
])

const PARTNER_ROLE_CODES = new Set([
  'partner_owner',
  'partner_director',
  'partner_admin',
  'partner_finance',
  'partner_training_manager',
  'partner_viewer',
])

const TRAINER_ROLE_CODES = new Set(['trainer'])
const LEARNER_ROLE_CODES = new Set(['staff_participant'])

function roleCodes(context: TrainingHubContext) {
  return new Set(context.roles.map((role: TrainingHubRole) => String(role.code || '').trim()).filter(Boolean))
}

function hasAnyRole(context: TrainingHubContext, allowed: Set<string>) {
  const roles = roleCodes(context)
  return Array.from(allowed).some((code) => roles.has(code))
}

function hasEntitlement(context: TrainingHubContext, code: string) {
  return context.entitlements.some((entitlement: TrainingHubEntitlement) => entitlement.code === code && ['active', 'pending', 'unlocked'].includes(String(entitlement.status || '')))
}

export function isTrainingHubAdmin(context: TrainingHubContext) {
  return context.isSuperAdmin || context.isInternal || hasAnyRole(context, ADMIN_ROLE_CODES)
}

export function isTrainingHubPartnerUser(context: TrainingHubContext) {
  if (isTrainingHubAdmin(context)) return false
  return (
    context.organizations.some((org) => org.organization_type === 'partner_school') ||
    context.memberships.some((membership) => String(membership.membership_type || '').startsWith('partner_')) ||
    hasAnyRole(context, PARTNER_ROLE_CODES) ||
    hasEntitlement(context, 'can_access_training_portal')
  )
}

export function isTrainingHubTrainerUser(context: TrainingHubContext) {
  if (isTrainingHubAdmin(context)) return false
  return hasAnyRole(context, TRAINER_ROLE_CODES) || context.memberships.some((membership) => membership.membership_type === 'trainer')
}

export function isTrainingHubLearnerUser(context: TrainingHubContext) {
  if (isTrainingHubAdmin(context)) return false
  return hasAnyRole(context, LEARNER_ROLE_CODES) || context.memberships.some((membership) => membership.membership_type === 'partner_staff')
}

export function getTrainingHubPrimaryExperience(context: TrainingHubContext): TrainingHubExperience {
  if (isTrainingHubAdmin(context)) return 'admin'
  if (isTrainingHubPartnerUser(context)) return 'partner'
  if (isTrainingHubTrainerUser(context)) return 'trainer'
  return 'learner'
}

export function getTrainingHubHomeHref(context: TrainingHubContext) {
  const experience = getTrainingHubPrimaryExperience(context)
  if (experience === 'admin') return '/traininghub'
  if (experience === 'partner') return '/traininghub/partner'
  if (experience === 'trainer') return '/traininghub/trainer'
  return '/traininghub/learn'
}

export function getTrainingHubAllowedExperiences(context: TrainingHubContext): TrainingHubExperience[] {
  const allowed = new Set<TrainingHubExperience>()

  // AngelCare internal admins must be able to preview all separated experiences
  // while partner/trainer/learner users remain restricted to their own spaces.
  if (isTrainingHubAdmin(context)) {
    allowed.add('admin')
    allowed.add('partner')
    allowed.add('trainer')
    allowed.add('learner')
    return Array.from(allowed)
  }

  if (isTrainingHubPartnerUser(context)) allowed.add('partner')
  if (isTrainingHubTrainerUser(context)) allowed.add('trainer')
  if (isTrainingHubLearnerUser(context)) allowed.add('learner')
  if (!allowed.size) allowed.add(getTrainingHubPrimaryExperience(context))
  return Array.from(allowed)
}

export function requireTrainingHubExperience(context: TrainingHubContext, required: TrainingHubExperience | TrainingHubExperience[]) {
  const requiredList = Array.isArray(required) ? required : [required]
  const allowed = getTrainingHubAllowedExperiences(context)
  const ok = requiredList.some((experience) => allowed.includes(experience))
  if (!ok) {
    throw new TrainingHubHttpError('Forbidden TrainingHub experience.', 403, 'TRAININGHUB_EXPERIENCE_FORBIDDEN', {
      required: requiredList,
      allowed,
      home: getTrainingHubHomeHref(context),
    })
  }
}

export function serializeTrainingHubExperience(context: TrainingHubContext) {
  return {
    primaryExperience: getTrainingHubPrimaryExperience(context),
    homeHref: getTrainingHubHomeHref(context),
    allowedExperiences: getTrainingHubAllowedExperiences(context),
    routeModel: {
      admin: '/traininghub',
      partner: '/traininghub/partner',
      trainer: '/traininghub/trainer',
      learner: '/traininghub/learn',
    },
    separation: {
      opsosLoginMixed: false,
      authBackbone: 'supabase_auth_traininghub',
      adminBackoffice: 'angelcare_internal_only',
      partnerPortal: 'partner_school_scope_only',
      trainerCockpit: 'assigned_sessions_only',
      learnerSpace: 'own_learning_only',
    },
  }
}
