export const MODULE_PERMISSIONS = {
  academy: ['academy.view', 'academy.manage'],
  admin: ['admin.view', 'admin.manage'],
  billing: ['billing.view', 'billing.manage'],
  caregivers: ['caregivers.view', 'caregivers.create', 'caregivers.edit', 'caregivers.delete'],
  contracts: ['contracts.view', 'contracts.create', 'contracts.edit', 'contracts.delete'],
  families: ['families.view', 'families.create', 'families.edit', 'families.delete'],
  hr: ['hr.view', 'hr.manage'],
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
  'voice-center': ['voice.view', 'voice.call', 'voice.manage'],
} as const

export const MODULE_ACCESS_LINKS = [
  { label: 'Profile', href: '/profile', permission: 'profile.view' },

  { label: 'Administration', href: '/users', permission: 'users.view' },
  { label: 'Admin Archive Center', href: '/admin/archive-center', permission: 'admin.view' },

  { label: 'Operations', href: '/operations', permission: 'operations.view' },
  { label: 'Disponibilités', href: '/operations/availability', permission: 'operations.view' },
  { label: 'Remplacements', href: '/operations/replacements', permission: 'operations.view' },

  { label: 'Voice Center', href: '/voice-center', permission: 'voice.view' },
  { label: 'AngelCare Connect', href: '/voice-center', permission: 'voice.view' },

  
  { label: 'Revenue Command Center', href: '/revenue-command-center', permission: 'revenue.view' },
  { label: 'Revenue Cockpit', href: '/revenue-command-center/cockpit', permission: 'revenue.view' },
  { label: 'Prospects', href: '/revenue-command-center/prospects', permission: 'revenue.view' },
  { label: 'SDR Execution', href: '/revenue-command-center/sdr-execution', permission: 'revenue.view' },
  { label: 'Tasks Revenue', href: '/revenue-command-center/tasks', permission: 'revenue.view' },
  { label: 'Campaigns', href: '/revenue-command-center/campaigns', permission: 'revenue.view' },
  { label: 'Appointments', href: '/revenue-command-center/appointments', permission: 'revenue.view' },
  { label: 'Business Development', href: '/revenue-command-center/business-development', permission: 'revenue.view' },
  { label: 'Strategy Room', href: '/revenue-command-center/strategy-room', permission: 'revenue.view' },
  { label: 'Market Mapping', href: '/revenue-command-center/market-mapping', permission: 'revenue.view' },
  { label: 'Partnerships', href: '/revenue-command-center/partnerships', permission: 'revenue.view' },
  { label: 'B2C Workflow', href: '/revenue-command-center/b2c-workflow', permission: 'revenue.view' },
  { label: 'Leads Impact', href: '/revenue-command-center/leads-impact', permission: 'revenue.view' },

  { label: 'Leads', href: '/leads', permission: 'leads.view' },
  { label: 'Leads Command Center', href: '/leads/command-center', permission: 'leads.view' },

  { label: 'Familles', href: '/families', permission: 'families.view' },
  { label: 'Family Intelligence', href: '/families/intelligence', permission: 'families.view' },

  { label: 'Intervenantes', href: '/caregivers', permission: 'caregivers.view' },
  { label: 'Workforce', href: '/caregivers/workforce', permission: 'caregivers.view' },

  { label: 'Missions', href: '/missions', permission: 'missions.view' },
  { label: 'Mission Command Center', href: '/missions/command-center', permission: 'missions.view' },

  { label: 'Contrats', href: '/contracts', permission: 'contracts.view' },
  { label: 'Contracts Command Center', href: '/contracts/command-center', permission: 'contracts.view' },

  { label: 'Facturation', href: '/billing', permission: 'billing.view' },
  { label: 'Billing Overview', href: '/billing/overview', permission: 'billing.view' },
  { label: 'Billing Activation', href: '/billing/activation', permission: 'billing.view' },

  { label: 'Incidents', href: '/incidents', permission: 'incidents.view' },
  { label: 'Locations', href: '/locations', permission: 'locations.view' },
  { label: 'Pointage', href: '/pointage', permission: 'pointage.view' },
  { label: 'Print', href: '/print', permission: 'print.view' },
  { label: 'Rapports', href: '/reports', permission: 'reports.view' },
  { label: 'Academy', href: '/academy', permission: 'academy.view' },
  { label: 'Services', href: '/services', permission: 'services.view' },
  { label: 'Sales', href: '/sales', permission: 'sales.view' },
  { label: 'RH', href: '/hr', permission: 'hr.view' },
  { label: 'RH Overview', href: '/hr/overview', permission: 'hr.view' },
] as const

export type ModuleKey = keyof typeof MODULE_PERMISSIONS

export const MODULE_ACCESS = [
  {
    key: "profile.view",
    href: "/profile",
  },
  {
    key: "operations.view",
    href: "/operations",
  },
  {
    key: "voice.view",
    href: "/voice-center",
  },
  {
    key: "revenue.view",
    href: "/revenue-command-center",
  },
  {
    key: "users.view",
    href: "/users",
  },
] as const;

export function hasPermission(user: any, permission: string) {
  if (!user) return false;

  if (user.role === "ceo" || user.role_key === "ceo") {
    return true;
  }

  const permissions = user.permissions ?? [];

  return Array.isArray(permissions) && permissions.includes(permission);
}

export function getFirstAllowedRoute(user: any) {
  if (!user) return "/login";

  if (user.role === "ceo" || user.role_key === "ceo") {
    return "/profile";
  }

  for (const module of MODULE_ACCESS) {
    if (hasPermission(user, module.key)) {
      return module.href;
    }
  }

  return "/profile";
}

