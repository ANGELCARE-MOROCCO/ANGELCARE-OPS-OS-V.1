// PATCH GUIDE FOR lib/auth/permissions.ts
// Add these items to your existing file if they are not already present.

// 1) Add to MODULE_PERMISSIONS:
export const CSA_PERMISSIONS = [
  'csa.home',
  'csa.view',
  'csa.leads.followup',
  'csa.families.manage',
  'csa.services.activate',
  'csa.revenue.recover',
  'csa.escalations.manage',
]

// 2) Add to ROLE_HOME_ROUTES:
export const CSA_ROLE_HOME_ROUTE = {
  csa: '/csa-home',
}

// 3) Add to ROLE_PERMISSION_TEMPLATES.csa:
export const CSA_ROLE_TEMPLATE = [
  'profile.view',
  'staff_portal.view',
  'families.view',
  'leads.view',
  'sales.view',
  'services.view',
  'revenue.view',
  'voice.view',
  'incidents.view',
  'csa.home',
  'csa.view',
  'csa.leads.followup',
  'csa.families.manage',
  'csa.services.activate',
  'csa.revenue.recover',
  'csa.escalations.manage',
]

// 4) Add to MODULE_ACCESS_LINKS:
export const CSA_MODULE_LINK = {
  label: 'C.S.A Command Home',
  href: '/csa-home',
  permission: 'csa.home',
  group: 'C.S.A Command',
  icon: '🎧',
  badge: 'CSA',
  order: 34,
}

// 5) Add high in MODULE_ACCESS:
export const CSA_MODULE_ACCESS = {
  key: 'csa.home',
  href: '/csa-home',
}
