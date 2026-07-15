import type { TrainingHubContext } from './types'
import {
  getTrainingHubAllowedExperiences,
  getTrainingHubPrimaryExperience,
  type TrainingHubExperience,
} from './experience'

export type TrainingHubNavGroup = 'admin' | 'execution' | 'governance' | 'experience'

export type TrainingHubNavItem = {
  href: string
  label: string
  detail: string
  key: string
  group: TrainingHubNavGroup
  icon: string
  permissionAny?: string[]
  adminOnly?: boolean
  experience?: TrainingHubExperience
}

export const trainingHubAdminNavItems: TrainingHubNavItem[] = [
  {
    href: '/traininghub',
    label: 'Command Center',
    detail: 'Vue globale',
    key: 'dashboard',
    group: 'admin',
    icon: '01',
    adminOnly: true,
  },
  {
    href: '/traininghub/catalogue',
    label: 'Catalogue',
    detail: 'Formations & catégories',
    key: 'catalogue',
    group: 'admin',
    icon: '02',
    permissionAny: ['training.catalogue.view', 'training.catalogue.manage', 'training.course.manage'],
    adminOnly: true,
  },
  {
    href: '/traininghub/commercial',
    label: 'Commercial',
    detail: 'Prix, devis & billing',
    key: 'commercial',
    group: 'execution',
    icon: '03',
    permissionAny: ['training.pricing.preview', 'training.proposal.manage', 'training.order.manage', 'training.invoice.manage'],
    adminOnly: true,
  },
  {
    href: '/traininghub/delivery',
    label: 'Delivery',
    detail: 'Sessions terrain',
    key: 'delivery',
    group: 'execution',
    icon: '04',
    permissionAny: ['training.session.schedule', 'training.attendance.validate', 'training.certificate.issue'],
    adminOnly: true,
  },
  {
    href: '/traininghub/learning',
    label: 'E-learning',
    detail: 'Refresh & progression',
    key: 'learning',
    group: 'execution',
    icon: '05',
    permissionAny: ['learning.module.manage', 'learning.assignment.manage', 'learning.progress.view'],
    adminOnly: true,
  },
  {
    href: '/traininghub/resources',
    label: 'Resources',
    detail: 'Kits & supports',
    key: 'resources',
    group: 'execution',
    icon: '06',
    permissionAny: ['training.resource.manage', 'training.catalogue.view', 'learning.module.manage'],
    adminOnly: true,
  },
  {
    href: '/traininghub/settings/access',
    label: 'Access Control',
    detail: 'RBAC & organisations',
    key: 'access',
    group: 'governance',
    icon: '07',
    permissionAny: ['training.access.manage', 'training.rbac.manage', 'training.audit.view'],
    adminOnly: true,
  },
]

export const trainingHubExperienceNavItems: TrainingHubNavItem[] = [
  {
    href: '/traininghub/partner',
    label: 'Partner Portal',
    detail: 'Preview école',
    key: 'partner',
    group: 'experience',
    icon: 'P',
    experience: 'partner',
  },
  {
    href: '/traininghub/trainer',
    label: 'Trainer Cockpit',
    detail: 'Preview trainer',
    key: 'trainer',
    group: 'experience',
    icon: 'T',
    experience: 'trainer',
  },
  {
    href: '/traininghub/learn',
    label: 'Learning Space',
    detail: 'Preview staff',
    key: 'learn',
    group: 'experience',
    icon: 'L',
    experience: 'learner',
  },
]

function hasAnyPermission(context: TrainingHubContext, permissions?: string[]) {
  if (!permissions?.length) return true
  if (context.isSuperAdmin) return true
  const owned = new Set((context.permissions || []).map((permission) => String(permission || '').trim()).filter(Boolean))
  return permissions.some((permission) => owned.has(permission))
}

export function canAccessTrainingHubNavItem(context: TrainingHubContext, item: TrainingHubNavItem) {
  if (context.isSuperAdmin) return true

  if (item.adminOnly && !context.isInternal) return false

  if (item.experience) {
    return getTrainingHubAllowedExperiences(context).includes(item.experience)
  }

  return hasAnyPermission(context, item.permissionAny)
}

export function getTrainingHubNavigation(context: TrainingHubContext) {
  const adminItems = trainingHubAdminNavItems.filter((item) => canAccessTrainingHubNavItem(context, item))
  const experienceItems = trainingHubExperienceNavItems.filter((item) => canAccessTrainingHubNavItem(context, item))
  const primaryExperience = getTrainingHubPrimaryExperience(context)

  return {
    primaryExperience,
    groups: {
      admin: adminItems.filter((item) => item.group === 'admin'),
      execution: adminItems.filter((item) => item.group === 'execution'),
      governance: adminItems.filter((item) => item.group === 'governance'),
      experience: experienceItems,
    },
    items: [...adminItems, ...experienceItems],
  }
}

export function serializeTrainingHubNavigation(context: TrainingHubContext) {
  const navigation = getTrainingHubNavigation(context)
  return {
    primaryExperience: navigation.primaryExperience,
    groups: navigation.groups,
    items: navigation.items,
    permissionAware: true,
    separatedAuth: true,
    opsosMixed: false,
  }
}
