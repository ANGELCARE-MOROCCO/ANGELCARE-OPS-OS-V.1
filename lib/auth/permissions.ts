export const MODULE_PERMISSIONS = {
  academy: ['academy.view', 'academy.manage'],
  admin: ['admin.view', 'admin.manage'],
  billing: ['billing.view', 'billing.manage'],
  caregivers: ['caregivers.view', 'caregivers.create', 'caregivers.edit', 'caregivers.delete'],
  contracts: ['contracts.view', 'contracts.create', 'contracts.edit', 'contracts.delete'],
  families: ['families.view', 'families.create', 'families.edit', 'families.delete'],
  incidents: ['incidents.view', 'incidents.create', 'incidents.edit', 'incidents.close'],
  leads: ['leads.view', 'leads.create', 'leads.edit', 'leads.delete'],
  locations: ['locations.view', 'locations.manage'],
  missions: ['missions.view', 'missions.create', 'missions.edit', 'missions.assign', 'missions.delete'],
  operations: ['operations.view', 'operations.manage'],
  pointage: ['pointage.view', 'pointage.manage'],
  print: ['print.view', 'print.create'],
  profile: ['profile.view'],
  reports: ['reports.view', 'reports.export'],
  'revenue-command-center': ['revenue.view', 'revenue.manage'],
  sales: ['sales.view', 'sales.manage'],
  services: ['services.view', 'services.create', 'services.edit', 'services.delete'],
  users: ['users.view', 'users.create', 'users.edit', 'users.delete'],
  hr: [
    'hr.view',
    'hr.dashboard',
    'hr.recruitment.view',
    'hr.recruitment.manage',
    'hr.staff.view',
    'hr.staff.manage',
    'hr.onboarding.manage',
    'hr.rosters.manage',
    'hr.attendance.manage',
    'hr.documents.manage',
    'hr.approvals.manage',
    'hr.analytics.view',
    'hr.executive.view',
    'hr.settings.manage',
    'hr.admin',
  ],
  'voice-center': ['voice.view', 'voice.call', 'voice.manage'],
  market_os: [
    'market_os.view',
    'market_os.campaigns.view',
    'market_os.content.view',
    'market_os.automation.view',
    'market_os.ambassadors.view',
    'market_os.partners.view',
    'market_os.admin',
    'marketing.home',
    'marketing.view',
  ],
  staff_portal: [
    'staff_portal.view',
    'staff_portal.manager',
    'staff_portal.intelligence',
    'staff_portal.admin',
    'staff_services.view',
    'staff_services.create',
    'staff_services.admin',
    'staff_memos.admin',
  ],
} as const

export const USER_ROLE_OPTIONS = [
  { label: 'CEO', value: 'ceo', department: 'Direction', defaultHome: '/command-center' },
  { label: 'Direction', value: 'direction', department: 'Direction', defaultHome: '/command-center' },
  { label: 'Admin', value: 'admin', department: 'Administration', defaultHome: '/command-center' },

  { label: 'Marketing', value: 'marketing', department: 'Marketing', defaultHome: '/market-os/marketing-home' },
  { label: 'C.S.A', value: 'csa', department: 'Customer Success', defaultHome: '/staff-home' },
  { label: 'Operations', value: 'operations', department: 'Operations', defaultHome: '/operations' },
  { label: 'HR', value: 'hr', department: 'Human Resources', defaultHome: '/hr' },
  { label: 'Session Leader', value: 'session_leader', department: 'Operations', defaultHome: '/team-command' },
  { label: 'Finance', value: 'finance', department: 'Finance', defaultHome: '/billing' },
  { label: 'Academy Admin', value: 'academy_admin', department: 'Academy', defaultHome: '/academy' },
  { label: 'Academy Trainer', value: 'academy_trainer', department: 'Academy', defaultHome: '/academy' },

  { label: 'Staff', value: 'staff', department: 'Staff Portal', defaultHome: '/staff-home' },
  { label: 'Caregiver', value: 'caregiver', department: 'Field Staff', defaultHome: '/staff-home' },
] as const

export type UserRoleKey = typeof USER_ROLE_OPTIONS[number]['value']

export const ROLE_HOME_ROUTES: Record<string, string> = {
  ceo: '/command-center',
  direction: '/command-center',
  admin: '/command-center',

  marketing: '/market-os/marketing-home',
  csa: '/staff-home',
  operations: '/operations',
  hr: '/hr',
  session_leader: '/team-command',
  finance: '/billing',
  academy_admin: '/academy',
  academy_trainer: '/academy',

  staff: '/staff-home',
  caregiver: '/staff-home',
  employee: '/staff-home',
}

export const ROLE_PERMISSION_TEMPLATES: Record<string, string[]> = {
  ceo: ['*'],
  direction: ['*'],
  admin: ['*'],

  marketing: [
    'profile.view',
    'reports.view',
    'market_os.view',
    'marketing.home',
    'marketing.view',
    'market_os.campaigns.view',
    'market_os.content.view',
    'market_os.automation.view',
    'market_os.ambassadors.view',
    'market_os.partners.view',
    'revenue.view',
    'leads.view',
    'sales.view',
    'voice.view',
    'staff_portal.view',
  ],

  csa: [
    'profile.view',
    'staff_portal.view',
    'staff_services.view',
    'families.view',
    'leads.view',
    'incidents.view',
    'services.view',
    'voice.view',
  ],

  operations: [
    'profile.view',
    'reports.view',
    'operations.view',
    'operations.manage',
    'missions.view',
    'missions.create',
    'missions.edit',
    'missions.assign',
    'pointage.view',
    'pointage.manage',
    'caregivers.view',
    'contracts.view',
    'services.view',
    'voice.view',
    'staff_portal.view',
  ],

  hr: [
    'profile.view',
    'reports.view',
    'hr.view',
    'hr.dashboard',
    'hr.recruitment.view',
    'hr.recruitment.manage',
    'hr.staff.view',
    'hr.staff.manage',
    'hr.onboarding.manage',
    'hr.rosters.manage',
    'hr.attendance.manage',
    'hr.documents.manage',
    'hr.approvals.manage',
    'hr.analytics.view',
    'hr.executive.view',
    'caregivers.view',
    'staff_portal.view',
  ],

  session_leader: [
    'profile.view',
    'staff_portal.view',
    'staff_portal.manager',
    'team_command.view',
    'operations.view',
    'missions.view',
    'missions.assign',
    'pointage.view',
    'caregivers.view',
    'incidents.view',
    'voice.view',
  ],

  finance: [
    'profile.view',
    'reports.view',
    'billing.view',
    'billing.manage',
    'contracts.view',
    'contracts.edit',
    'print.view',
    'print.create',
    'families.view',
    'revenue.view',
    'staff_portal.view',
  ],

  academy_admin: [
    'profile.view',
    'reports.view',
    'academy.view',
    'academy.manage',
    'hr.staff.view',
    'caregivers.view',
    'services.view',
    'staff_portal.view',
  ],

  academy_trainer: [
    'profile.view',
    'academy.view',
    'staff_portal.view',
    'staff_services.view',
    'caregivers.view',
  ],

  staff: [
    'profile.view',
    'staff_portal.view',
    'staff_services.view',
  ],

  caregiver: [
    'profile.view',
    'staff_portal.view',
    'staff_services.view',
    'pointage.view',
  ],
}

export const MODULE_ACCESS_LINKS = [
  { label: 'Executive Dashboard', href: '/', permission: 'profile.view', group: 'Control Center', icon: '📡', badge: 'Home', order: 1 },
  { label: 'Profile', href: '/profile', permission: 'profile.view', group: 'Control Center', icon: '👤', order: 2 },
  { label: 'Reports', href: '/reports', permission: 'reports.view', group: 'Control Center', icon: '📊', order: 3 },

  { label: 'Sales Cockpit', href: '/sales', permission: 'sales.view', group: 'Sales CRM', icon: '🚀', order: 10 },
  { label: 'Leads', href: '/leads', permission: 'leads.view', group: 'Sales CRM', icon: '📈', order: 11 },
  { label: 'Leads Command Center', href: '/leads/command-center', permission: 'leads.view', group: 'Sales CRM', icon: '🎯', order: 12 },
  { label: 'Familles', href: '/families', permission: 'families.view', group: 'Sales CRM', icon: '🏡', order: 13 },
  { label: 'Family Intelligence', href: '/families/intelligence', permission: 'families.view', group: 'Sales CRM', icon: '🧠', order: 14 },

  { label: 'Revenue Command Center', href: '/revenue-command-center', permission: 'revenue.view', group: 'Revenue Command', icon: '💎', badge: 'OS', order: 20 },
  { label: 'Revenue Cockpit', href: '/revenue-command-center/cockpit', permission: 'revenue.view', group: 'Revenue Command', icon: '🧭', order: 21 },
  { label: 'Prospects', href: '/revenue-command-center/prospects', permission: 'revenue.view', group: 'Revenue Command', icon: '🎯', order: 22 },
  { label: 'SDR Execution', href: '/revenue-command-center/sdr-execution', permission: 'revenue.view', group: 'Revenue Command', icon: '☎️', order: 23 },
  { label: 'Tasks Revenue', href: '/revenue-command-center/tasks', permission: 'revenue.view', group: 'Revenue Command', icon: '✅', order: 24 },
  { label: 'Campaigns', href: '/revenue-command-center/campaigns', permission: 'revenue.view', group: 'Revenue Command', icon: '📣', order: 25 },
  { label: 'Appointments', href: '/revenue-command-center/appointments', permission: 'revenue.view', group: 'Revenue Command', icon: '📅', order: 26 },
  { label: 'Business Development', href: '/revenue-command-center/business-development', permission: 'revenue.view', group: 'Revenue Command', icon: '🤝', order: 27 },
  { label: 'Strategy Room', href: '/revenue-command-center/strategy-room', permission: 'revenue.view', group: 'Revenue Command', icon: '🧬', order: 28 },
  { label: 'Market Mapping', href: '/revenue-command-center/market-mapping', permission: 'revenue.view', group: 'Revenue Command', icon: '🗺️', order: 29 },
  { label: 'Partnerships', href: '/revenue-command-center/partnerships', permission: 'revenue.view', group: 'Revenue Command', icon: '🏢', order: 30 },
  { label: 'B2C Workflow', href: '/revenue-command-center/b2c-workflow', permission: 'revenue.view', group: 'Revenue Command', icon: '🔁', order: 31 },
  { label: 'Leads Impact', href: '/revenue-command-center/leads-impact', permission: 'revenue.view', group: 'Revenue Command', icon: '⚡', order: 32 },

  { label: 'Marketing Department Home', href: '/market-os/marketing-home', permission: 'marketing.home', group: 'Market OS', icon: '🏢', badge: 'HOME', order: 39 },
  { label: 'Market OS Home', href: '/market-os', permission: 'market_os.view', group: 'Market OS', icon: '🌐', badge: 'MKT', order: 40 },
  { label: 'Campaign Lifecycle', href: '/market-os/campaign-lifecycle', permission: 'market_os.campaigns.view', group: 'Market OS', icon: '🎯', order: 41 },
  { label: 'SEO Blog Workspace', href: '/market-os/seo-blog-workspace', permission: 'market_os.content.view', group: 'Market OS', icon: '✍️', order: 42 },
  { label: 'Content Command', href: '/market-os/content-command-center', permission: 'market_os.content.view', group: 'Market OS', icon: '🧠', order: 43 },
  { label: 'Automation Control', href: '/market-os/automation-control', permission: 'market_os.automation.view', group: 'Market OS', icon: '⚙️', order: 44 },
  { label: 'Ambassadors', href: '/market-os/ambassador-program', permission: 'market_os.ambassadors.view', group: 'Market OS', icon: '🤝', order: 45 },
  { label: 'Partners Network', href: '/market-os/partners-network', permission: 'market_os.partners.view', group: 'Market OS', icon: '🏢', order: 46 },
  { label: 'Marketing Calendar', href: '/market-os/calendar', permission: 'market_os.view', group: 'Market OS', icon: '🗓️', order: 47 },
  { label: 'Config Admin', href: '/market-os/config-admin-control', permission: 'market_os.admin', group: 'Market OS', icon: '🧰', order: 48 },

  { label: 'Operations', href: '/operations', permission: 'operations.view', group: 'Operations', icon: '🧭', order: 50 },
  { label: 'Disponibilités', href: '/operations/availability', permission: 'operations.view', group: 'Operations', icon: '🟢', order: 51 },
  { label: 'Remplacements', href: '/operations/replacements', permission: 'operations.view', group: 'Operations', icon: '🔄', order: 52 },
  { label: 'Missions', href: '/missions', permission: 'missions.view', group: 'Operations', icon: '🛫', order: 53 },
  { label: 'Mission Command Center', href: '/missions/command-center', permission: 'missions.view', group: 'Operations', icon: '📍', order: 54 },
  { label: 'Pointage', href: '/pointage', permission: 'pointage.view', group: 'Operations', icon: '🕒', order: 55 },

  { label: 'Contrats', href: '/contracts', permission: 'contracts.view', group: 'Contracts & Billing', icon: '📦', order: 60 },
  { label: 'Contracts Command Center', href: '/contracts/command-center', permission: 'contracts.view', group: 'Contracts & Billing', icon: '🏛️', order: 61 },
  { label: 'Facturation', href: '/billing', permission: 'billing.view', group: 'Contracts & Billing', icon: '🧾', order: 62 },
  { label: 'Billing Overview', href: '/billing/overview', permission: 'billing.view', group: 'Contracts & Billing', icon: '📊', order: 63 },
  { label: 'Billing Activation', href: '/billing/activation', permission: 'billing.view', group: 'Contracts & Billing', icon: '⚡', order: 64 },
  { label: 'Print', href: '/print', permission: 'print.view', group: 'Contracts & Billing', icon: '🖨️', order: 65 },

  { label: 'HR MAX', href: '/hr', permission: 'hr.view', group: 'Workforce & HR', icon: '👥', badge: 'HR', order: 70 },
  { label: 'HR Operations', href: '/hr/operations-console', permission: 'hr.view', group: 'Workforce & HR', icon: '🧭', order: 71 },
  { label: 'HR Boardroom', href: '/hr/boardroom', permission: 'hr.executive.view', group: 'Workforce & HR', icon: '🏛️', order: 72 },
  { label: 'Recruitment', href: '/hr/recruitment', permission: 'hr.recruitment.view', group: 'Workforce & HR', icon: '🧲', order: 73 },
  { label: 'Staff 360', href: '/hr/staff', permission: 'hr.staff.view', group: 'Workforce & HR', icon: '🪪', order: 74 },
  { label: 'Intervenantes', href: '/caregivers', permission: 'caregivers.view', group: 'Workforce & HR', icon: '👩‍👧', order: 75 },
  { label: 'Workforce', href: '/caregivers/workforce', permission: 'caregivers.view', group: 'Workforce & HR', icon: '📋', order: 76 },
  { label: 'Academy', href: '/academy', permission: 'academy.view', group: 'Workforce & HR', icon: '🎓', order: 77 },

  { label: 'Services', href: '/services', permission: 'services.view', group: 'Products & Services', icon: '🧩', order: 80 },
  { label: 'Voice Center', href: '/voice-center', permission: 'voice.view', group: 'Products & Services', icon: '☎️', order: 81 },
  { label: 'AngelCare Connect', href: '/voice-center', permission: 'voice.view', group: 'Products & Services', icon: '💬', order: 82 },

  { label: 'Incidents', href: '/incidents', permission: 'incidents.view', group: 'Quality & Risk', icon: '🚨', order: 90 },
  { label: 'Admin Archive Center', href: '/admin/archive-center', permission: 'admin.view', group: 'Quality & Risk', icon: '🗄️', order: 91 },

  { label: 'Staff Portal', href: '/staff-home', permission: 'staff_portal.view', group: 'Staff Portal', icon: '🏠', order: 100 },
  { label: 'Staff Services', href: '/staff-services', permission: 'staff_services.view', group: 'Staff Portal', icon: '🧰', order: 101 },
  { label: 'Staff Services Admin', href: '/staff-services/admin', permission: 'staff_services.admin', group: 'Staff Portal', icon: '🔧', order: 102 },
  { label: 'Staff Memos', href: '/staff-memos', permission: 'staff_memos.admin', group: 'Staff Portal', icon: '📝', order: 103 },
  { label: 'Team Command', href: '/team-command', permission: 'staff_portal.manager', group: 'Staff Portal', icon: '🧑‍💼', order: 104 },
  { label: 'Staff Portal Intelligence', href: '/staff-portal-intelligence', permission: 'staff_portal.intelligence', group: 'Staff Portal', icon: '🧠', order: 105 },
  { label: 'Staff Portal Final QA', href: '/staff-portal-final-qa', permission: 'staff_portal.admin', group: 'Staff Portal', icon: '✅', order: 106 },
  { label: 'Staff Portal Access Check', href: '/staff-portal-access-check', permission: 'staff_portal.admin', group: 'Staff Portal', icon: '🔎', order: 107 },

  { label: 'Administration', href: '/users', permission: 'users.view', group: 'Administration', icon: '🔐', order: 120 },
  { label: 'Locations', href: '/locations', permission: 'locations.view', group: 'Administration', icon: '📍', order: 121 },
] as const

export type ModuleKey = keyof typeof MODULE_PERMISSIONS

export const MODULE_ACCESS = [
  { key: 'marketing.home', href: '/market-os/marketing-home' },
  { key: 'profile.view', href: '/profile' },
  { key: 'staff_portal.view', href: '/staff-home' },
  { key: 'market_os.view', href: '/market-os' },
  { key: 'hr.view', href: '/hr' },
  { key: 'operations.view', href: '/operations' },
  { key: 'voice.view', href: '/voice-center' },
  { key: 'revenue.view', href: '/revenue-command-center' },
  { key: 'billing.view', href: '/billing' },
  { key: 'academy.view', href: '/academy' },
  { key: 'users.view', href: '/users' },
  { key: 'staff_services.view', href: '/staff-services' },
  { key: 'staff_portal.manager', href: '/team-command' },
  { key: 'staff_memos.admin', href: '/staff-memos' },
] as const

function normalizeRole(userOrRole: any) {
  const value =
    typeof userOrRole === 'string'
      ? userOrRole
      : userOrRole?.role_key || userOrRole?.role || userOrRole?.roleKey || ''
  return String(value).trim().toLowerCase()
}

export function getRoleOption(role: string) {
  const normalized = normalizeRole(role)
  return USER_ROLE_OPTIONS.find((option) => option.value === normalized)
}

export function getRoleTemplatePermissions(role: string) {
  const normalized = normalizeRole(role)
  return ROLE_PERMISSION_TEMPLATES[normalized] || ROLE_PERMISSION_TEMPLATES.staff
}

export function buildUserPermissionsForRole(role: string, extraPermissions: string[] = []) {
  return Array.from(new Set([...getRoleTemplatePermissions(role), ...extraPermissions]))
}

export function hasPermission(user: any, permission: string) {
  if (!user) return false

  const role = normalizeRole(user)
  if (role === 'ceo' || role === 'admin' || role === 'direction') return true

  const permissions = Array.isArray(user.permissions) ? user.permissions : []
  return permissions.includes('*') || permissions.includes(permission)
}

export function getAllowedModuleLinks(user: any) {
  if (!user) return []

  const role = normalizeRole(user)
  const allowed =
    role === 'ceo' || role === 'admin' || role === 'direction' || (Array.isArray(user.permissions) && user.permissions.includes('*'))
      ? MODULE_ACCESS_LINKS
      : MODULE_ACCESS_LINKS.filter((link) => hasPermission(user, link.permission))

  return [...allowed].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

export function getDefaultHomeForRole(user: any) {
  const role = normalizeRole(user)
  return ROLE_HOME_ROUTES[role]
}

export function getFirstAllowedRoute(user: any) {
  if (!user) return '/login'

  const roleDefault = getDefaultHomeForRole(user)
  const allowedLinks = getAllowedModuleLinks(user)

  if (roleDefault) {
    const canOpenDefault =
      roleDefault === '/command-center' ||
      allowedLinks.some((link) => link.href === roleDefault || roleDefault.startsWith(`${link.href}/`))

    if (canOpenDefault) return roleDefault
  }

  const first = allowedLinks[0]
  return first?.href || '/staff-home'
}
