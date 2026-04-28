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
  { label: 'Operations', href: '/operations', permission: 'operations.view' },
  { label: 'Voice Center', href: '/voice-center', permission: 'voice.view' },
  { label: 'Revenue Command Center', href: '/revenue-command-center', permission: 'revenue.view' },
  { label: 'Leads', href: '/leads', permission: 'leads.view' },
  { label: 'Familles', href: '/families', permission: 'families.view' },
  { label: 'Intervenantes', href: '/caregivers', permission: 'caregivers.view' },
  { label: 'Missions', href: '/missions', permission: 'missions.view' },
  { label: 'Facturation', href: '/billing', permission: 'billing.view' },
  { label: 'Rapports', href: '/reports', permission: 'reports.view' },
  { label: 'Academy', href: '/academy', permission: 'academy.view' },
  { label: 'Services', href: '/services', permission: 'services.view' },
  { label: 'Contrats', href: '/contracts', permission: 'contracts.view' },
  { label: 'RH', href: '/hr', permission: 'hr.view' },
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

