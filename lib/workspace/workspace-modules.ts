import { hasPermission } from '@/lib/auth/permissions'

export type WorkspaceFilterKey =
  | 'all'
  | 'operations'
  | 'hr'
  | 'revenue'
  | 'sales'
  | 'marketing'
  | 'admin'

export type WorkspaceAccent =
  | 'teal'
  | 'violet'
  | 'green'
  | 'blue'
  | 'purple'
  | 'orange'
  | 'sky'

export type WorkspaceIconName =
  | 'activity'
  | 'arrowRightLeft'
  | 'barChart'
  | 'boxes'
  | 'calendar'
  | 'clipboard'
  | 'clock'
  | 'cog'
  | 'fileText'
  | 'filter'
  | 'flag'
  | 'gauge'
  | 'globe'
  | 'graduationCap'
  | 'handshake'
  | 'heart'
  | 'link'
  | 'lock'
  | 'map'
  | 'mapPin'
  | 'megaphone'
  | 'monitor'
  | 'package'
  | 'receipt'
  | 'settings'
  | 'shield'
  | 'target'
  | 'trendingUp'
  | 'triangleAlert'
  | 'userPlus'
  | 'users'

type WorkspaceAccess = {
  permissions?: string[]
  roles?: string[]
  requiresElevated?: boolean
}

export type WorkspaceModule = WorkspaceAccess & {
  id: string
  title: string
  href: string
  description?: string
  icon: WorkspaceIconName
  categories: Exclude<WorkspaceFilterKey, 'all'>[]
}

export type WorkspaceGroup = WorkspaceAccess & {
  id: string
  order: number
  title: string
  description: string
  href?: string
  icon: WorkspaceIconName
  accent: WorkspaceAccent
  categories: Exclude<WorkspaceFilterKey, 'all'>[]
  wide?: boolean
  modules: WorkspaceModule[]
}

export const WORKSPACE_FILTER_CHIPS: { key: WorkspaceFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'operations', label: 'Operations' },
  { key: 'hr', label: 'HR' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'sales', label: 'Sales' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'admin', label: 'Admin' },
]

export const WORKSPACE_MODULE_GROUPS: WorkspaceGroup[] = [
  {
    id: 'executive-strategy',
    order: 1,
    title: 'Executive & Strategy',
    description: 'Strategic oversight, analytics, reporting, executive planning.',
    href: '/executive-cockpit',
    icon: 'shield',
    accent: 'teal',
    categories: ['admin'],
    requiresElevated: true,
    modules: [
      {
        id: 'executive-overview',
        title: 'Executive Overview',
        href: '/executive-cockpit',
        icon: 'shield',
        categories: ['admin'],
        requiresElevated: true,
      },
      {
        id: 'analytics',
        title: 'Analytics',
        href: '/revenue-command-center/revenue-analytics',
        icon: 'barChart',
        categories: ['revenue'],
        permissions: ['revenue.view', 'reports.view'],
      },
      {
        id: 'reports',
        title: 'Reports',
        href: '/reports',
        icon: 'fileText',
        categories: ['admin', 'operations', 'hr', 'revenue', 'sales', 'marketing'],
        permissions: ['reports.view'],
      },
      {
        id: 'strategy-okrs',
        title: 'Strategy & OKRs',
        href: '/enterprise-command',
        icon: 'target',
        categories: ['admin'],
        requiresElevated: true,
      },
    ],
  },
  {
    id: 'revenue-sales-crm',
    order: 2,
    title: 'Revenue, Sales & CRM',
    description: 'Growth, commercial execution, clients and monetization.',
    href: '/revenue-command-center',
    icon: 'trendingUp',
    accent: 'violet',
    categories: ['revenue', 'sales'],
    permissions: ['revenue.view'],
    modules: [
      {
        id: 'sales-cockpit',
        title: 'Sales Cockpit',
        href: '/sales',
        icon: 'gauge',
        categories: ['sales'],
        permissions: ['sales.view'],
      },
      {
        id: 'revenue-command-center',
        title: 'Revenue Command Center',
        href: '/revenue-command-center',
        icon: 'monitor',
        categories: ['revenue'],
        permissions: ['revenue.view'],
      },
      {
        id: 'families',
        title: 'Families',
        href: '/families',
        icon: 'users',
        categories: ['sales'],
        permissions: ['families.view'],
      },
      {
        id: 'leads',
        title: 'Leads',
        href: '/leads',
        icon: 'userPlus',
        categories: ['sales'],
        permissions: ['leads.view'],
      },
      {
        id: 'contracts',
        title: 'Contracts',
        href: '/contracts',
        icon: 'fileText',
        categories: ['revenue'],
        permissions: ['contracts.view'],
      },
      {
        id: 'billing',
        title: 'Billing',
        href: '/billing',
        icon: 'receipt',
        categories: ['revenue'],
        permissions: ['billing.view'],
      },
    ],
  },
  {
    id: 'capital-command-center',
    order: 2.5,
    title: 'Capital Command Center',
    description: 'Fundraising, investors, deal flow, commitments, payments and investment operations.',
    href: '/capital-command-center',
    icon: 'barChart',
    accent: 'blue',
    categories: ['admin', 'revenue'],
    requiresElevated: false,
    modules: [
      {
        id: 'capital-command-overview',
        title: 'Capital Command Center',
        href: '/capital-command-center',
        icon: 'barChart',
        categories: ['admin', 'revenue'],
        requiresElevated: false,
      },
      {
        id: 'capital-investor-crm',
        title: 'Investor CRM',
        href: '/capital-command-center?workspace=investors',
        icon: 'users',
        categories: ['admin', 'revenue'],
        requiresElevated: false,
      },
      {
        id: 'capital-fundraising-pipeline',
        title: 'Fundraising Pipeline',
        href: '/capital-command-center?workspace=fundraising',
        icon: 'trendingUp',
        categories: ['admin', 'revenue'],
        requiresElevated: false,
      },
      {
        id: 'capital-deal-room',
        title: 'Deal Room',
        href: '/capital-command-center?workspace=deals',
        icon: 'handshake',
        categories: ['admin', 'revenue'],
        requiresElevated: false,
      },
      {
        id: 'capital-commitments',
        title: 'Commitments',
        href: '/capital-command-center?workspace=commitments',
        icon: 'receipt',
        categories: ['admin', 'revenue'],
        requiresElevated: false,
      },
      {
        id: 'capital-training',
        title: 'Training',
        href: '/capital-command-center?workspace=training',
        icon: 'fileText',
        categories: ['admin', 'revenue'],
        requiresElevated: false,
      },
      {
        id: 'capital-tasks-command',
        title: 'Tasks Command',
        href: '/capital-command-center?workspace=tasks-command',
        icon: 'clipboard',
        categories: ['admin', 'revenue'],
        requiresElevated: false,
        description: 'Enterprise execution, tasks, projects, cycles, modules, fundraising follow-ups, accountability, and daily operational control.',
      },
      {
        id: 'capital-payments',
        title: 'Capital Payments',
        href: '/capital-command-center?workspace=payments',
        icon: 'fileText',
        categories: ['admin', 'revenue'],
        requiresElevated: false,
      },
    ],
  },

  {
    id: 'market-os-growth',
    order: 3,
    title: 'Market OS & Growth',
    description: 'Marketing intelligence, campaigns, territories and partner growth.',
    href: '/market-os',
    icon: 'target',
    accent: 'green',
    categories: ['marketing'],
    permissions: ['market_os.view'],
    modules: [
      {
        id: 'market-os',
        title: 'Market OS',
        href: '/market-os',
        icon: 'globe',
        categories: ['marketing'],
        permissions: ['market_os.view'],
      },
      {
        id: 'campaigns',
        title: 'Campaigns',
        href: '/market-os/campaign-lifecycle',
        icon: 'megaphone',
        categories: ['marketing'],
        permissions: ['market_os.campaigns.view', 'marketing.view'],
      },
      {
        id: 'ambassadors',
        title: 'Ambassadors',
        href: '/market-os/ambassadors',
        icon: 'userPlus',
        categories: ['marketing'],
        permissions: ['market_os.ambassadors.view'],
      },
      {
        id: 'pipeline',
        title: 'Pipeline',
        href: '/revenue-command-center/prospects/pipeline',
        icon: 'filter',
        categories: ['marketing', 'revenue', 'sales'],
        permissions: ['revenue.view', 'market_os.view'],
      },
      {
        id: 'territories',
        title: 'Territories',
        href: '/market-os/ambassadors/territories',
        icon: 'map',
        categories: ['marketing'],
        permissions: ['market_os.ambassadors.view'],
      },
      {
        id: 'partner-network',
        title: 'Partner Network',
        href: '/revenue-command-center/partnerships',
        icon: 'handshake',
        categories: ['marketing', 'revenue'],
        permissions: ['market_os.partners.view', 'revenue.view'],
      },

      {
        id: 'b2b-partnerships',
        title: 'B2B Partnerships',
        href: '/b2b-partnerships',
        icon: 'handshake',
        categories: ['marketing', 'revenue', 'sales', 'operations'],
        permissions: ['b2b_partnerships.access', 'b2b_partnerships.read'],
      },

    ],
  },
  {
    id: 'operations-service-control',
    order: 4,
    title: 'Operations & Service Control',
    description: 'Daily operations, delivery command and operational supervision.',
    href: '/operations-war-room',
    icon: 'cog',
    accent: 'blue',
    categories: ['operations'],
    permissions: ['operations.view'],
    modules: [
      {
        id: 'operations-war-room',
        title: 'Operations War Room',
        href: '/operations-war-room',
        icon: 'monitor',
        categories: ['operations'],
        permissions: ['operations.view'],
      },
      {
        id: 'missions',
        title: 'Missions',
        href: '/missions',
        icon: 'flag',
        categories: ['operations'],
        permissions: ['missions.view'],
      },
      {
        id: 'interventions',
        title: 'Interventions',
        href: '/interventions',
        icon: 'clipboard',
        categories: ['operations'],
        permissions: ['interventions.view'],
      },
      {
        id: 'services',
        title: 'Services',
        href: '/services',
        icon: 'package',
        categories: ['operations'],
        permissions: ['services.view'],
      },
      {
        id: 'incidents',
        title: 'Incidents',
        href: '/services/incidents',
        icon: 'triangleAlert',
        categories: ['operations'],
        permissions: ['incidents.view', 'services.view'],
      },
      {
        id: 'capacity',
        title: 'Capacity',
        href: '/services/capacity',
        icon: 'gauge',
        categories: ['operations'],
        permissions: ['services.view'],
      },
    ],
  },
  {
    id: 'care-delivery-field-workforce',
    order: 5,
    title: 'Care Delivery & Field Workforce',
    description: 'Field teams, assignments, attendance and care execution.',
    href: '/caregivers',
    icon: 'users',
    accent: 'purple',
    categories: ['operations', 'hr'],
    permissions: ['caregivers.view'],
    modules: [
      {
        id: 'caregivers',
        title: 'Caregivers',
        href: '/caregivers',
        icon: 'users',
        categories: ['operations', 'hr'],
        permissions: ['caregivers.view'],
      },
      {
        id: 'pointage',
        title: 'Pointage',
        href: '/pointage',
        icon: 'clock',
        categories: ['operations'],
        permissions: ['pointage.view'],
      },
      {
        id: 'scheduling',
        title: 'Scheduling',
        href: '/hr/rosters',
        icon: 'calendar',
        categories: ['hr', 'operations'],
        permissions: ['hr.rosters.manage'],
      },
      {
        id: 'availability',
        title: 'Availability',
        href: '/operations/availability',
        icon: 'clock',
        categories: ['operations'],
        permissions: ['operations.view'],
      },
      {
        id: 'replacements',
        title: 'Replacements',
        href: '/operations/replacements',
        icon: 'arrowRightLeft',
        categories: ['operations'],
        permissions: ['operations.view'],
      },
      {
        id: 'patients',
        title: 'Patients',
        href: '/interventions/patients',
        icon: 'heart',
        categories: ['operations'],
        permissions: ['interventions.view'],
      },
    ],
  },
  {
    id: 'workforce-hr-academy',
    order: 6,
    title: 'Workforce, HR & Academy',
    description: 'People operations, talent development and HR execution.',
    href: '/hr',
    icon: 'userPlus',
    accent: 'orange',
    categories: ['hr'],
    permissions: ['hr.view'],
    modules: [
      {
        id: 'hr',
        title: 'HR',
        href: '/hr',
        icon: 'users',
        categories: ['hr'],
        permissions: ['hr.view'],
      },
      {
        id: 'academy',
        title: 'Academy',
        href: '/academy',
        icon: 'graduationCap',
        categories: ['hr'],
        permissions: ['academy.view'],
      },
      {
        id: 'recruiting',
        title: 'Recruiting',
        href: '/hr/recruitment',
        icon: 'userPlus',
        categories: ['hr'],
        permissions: ['hr.recruitment.view'],
      },
      {
        id: 'performance',
        title: 'Performance',
        href: '/hr/performance-matrix',
        icon: 'trendingUp',
        categories: ['hr'],
        permissions: ['hr.staff.view', 'hr.executive.view'],
      },
      {
        id: 'documents',
        title: 'Documents',
        href: '/hr/documents',
        icon: 'fileText',
        categories: ['hr'],
        permissions: ['hr.documents.manage'],
      },
      {
        id: 'compliance',
        title: 'Compliance',
        href: '/hr/compliance',
        icon: 'shield',
        categories: ['hr'],
        permissions: ['hr.view', 'hr.documents.manage'],
      },
    ],
  },
  {
    id: 'platform-admin-saas-factory',
    order: 7,
    title: 'Platform, Admin & SaaS Factory',
    description: 'System administration, access control and platform management.',
    href: '/saas-factory-command',
    icon: 'shield',
    accent: 'sky',
    categories: ['admin'],
    requiresElevated: true,
    wide: true,
    modules: [
      {
        id: 'users',
        title: 'Users',
        href: '/users',
        icon: 'users',
        categories: ['admin'],
        permissions: ['users.view'],
      },
      {
        id: 'locations',
        title: 'Locations',
        href: '/locations',
        icon: 'mapPin',
        categories: ['admin'],
        permissions: ['locations.view'],
      },
      {
        id: 'roles-permissions',
        title: 'Roles & Permissions',
        href: '/saas-factory-command/permissions',
        icon: 'lock',
        categories: ['admin'],
        permissions: ['users.view', 'admin.view'],
      },
      {
        id: 'integrations',
        title: 'Integrations',
        href: '/saas-factory-command/apis',
        icon: 'link',
        categories: ['admin'],
        permissions: ['admin.view'],
        requiresElevated: true,
      },
      {
        id: 'saas-factory',
        title: 'SaaS Factory',
        href: '/saas-factory-command',
        icon: 'boxes',
        categories: ['admin'],
        requiresElevated: true,
      },
      {
        id: 'system-settings',
        title: 'System Settings',
        href: '/saas-factory-command/configuration',
        icon: 'settings',
        categories: ['admin'],
        permissions: ['admin.view'],
        requiresElevated: true,
      },
    ],
  },
]

function normalizeRole(user: any) {
  return String(user?.role_key || user?.role || user?.roleKey || '').trim().toLowerCase()
}

function userPermissions(user: any) {
  return Array.isArray(user?.permissions) ? user.permissions.map(String) : []
}

function isElevatedUser(user: any) {
  const role = normalizeRole(user)
  return ['ceo', 'owner', 'super_admin'].includes(role) || userPermissions(user).includes('*')
}

function hasWorkspaceItemAccess(user: any, item: WorkspaceAccess) {
  if (!user) return false

  const role = normalizeRole(user)
  const elevated = isElevatedUser(user)

  if (item.requiresElevated && !elevated) return false

  const roles = item.roles || []
  const permissions = item.permissions || []

  if (roles.length && (elevated || roles.includes(role))) return true
  if (permissions.length && permissions.some((permission) => hasPermission(user, permission))) return true

  return elevated && !roles.length && !permissions.length
}

export function getWorkspaceGroupsForUser(user: any): WorkspaceGroup[] {
  const allowedGroups: WorkspaceGroup[] = []

  for (const group of WORKSPACE_MODULE_GROUPS) {
    const modules = group.modules.filter((module) => hasWorkspaceItemAccess(user, module))
    if (!modules.length) continue

    allowedGroups.push({
      ...group,
      href: group.href && hasWorkspaceItemAccess(user, group) ? group.href : undefined,
      modules,
    })
  }

  return allowedGroups.sort((a, b) => a.order - b.order)
}
