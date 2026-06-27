export type StaffPortalRoute = {
  href: string
  label: string
  area: string
  permission: string
  description: string
  criticality: 'core' | 'high' | 'medium' | 'support'
}

export const STAFF_PORTAL_ROUTES: StaffPortalRoute[] = [
  {
    href: '/staff-home',
    label: 'Staff Portal Home',
    area: 'Core',
    permission: 'staff_portal.view',
    description: 'Personalized master staff landing page after sign-in.',
    criticality: 'core',
  },
  {
    href: '/staff-services',
    label: 'Staff Services',
    area: 'Services',
    permission: 'staff_services.view',
    description: 'Personal staff requests, services and persistent memos.',
    criticality: 'high',
  },
  {
    href: '/staff-services/new',
    label: 'New Staff Service Request',
    area: 'Services',
    permission: 'staff_services.create',
    description: 'Create HR, admin, roster, document, IT or training request.',
    criticality: 'medium',
  },
  {
    href: '/staff-services/admin',
    label: 'Staff Services Admin',
    area: 'Admin',
    permission: 'staff_services.admin',
    description: 'Admin command desk for staff service requests.',
    criticality: 'high',
  },
  {
    href: '/staff-memos',
    label: 'Staff Memos',
    area: 'Memos',
    permission: 'staff_memos.admin',
    description: 'Control tower memo broadcast center and acknowledgements.',
    criticality: 'high',
  },
  {
    href: '/staff-memos/new',
    label: 'New Staff Memo',
    area: 'Memos',
    permission: 'staff_memos.admin',
    description: 'Push ATC-style memos, warnings and daily briefings.',
    criticality: 'medium',
  },
  {
    href: '/staff-portal-intelligence',
    label: 'Staff Portal Intelligence',
    area: 'Intelligence',
    permission: 'staff_portal.intelligence',
    description: 'Department and position personalization overview.',
    criticality: 'medium',
  },
  {
    href: '/team-command',
    label: 'Team Command',
    area: 'Manager',
    permission: 'staff_portal.manager',
    description: 'Manager-oriented staff portal variant and team signals.',
    criticality: 'medium',
  },
  
  
]

export const STAFF_PORTAL_AREAS = Array.from(new Set(STAFF_PORTAL_ROUTES.map((route) => route.area)))
