export type HRRole = 'hr_admin' | 'hr_manager' | 'operations_manager' | 'finance' | 'compliance' | 'team_lead' | 'staff'
export type HRNavItem = { label: string; href: string; area: string; roles: HRRole[]; priority: number }

export const HR_ROLE_LABELS: Record<HRRole, string> = {
  hr_admin: 'HR Admin', hr_manager: 'HR Manager', operations_manager: 'Operations Manager', finance: 'Finance', compliance: 'Compliance', team_lead: 'Team Lead', staff: 'Staff',
}

const all: HRRole[] = ['hr_admin','hr_manager','operations_manager','finance','compliance','team_lead','staff']
const hrCore: HRRole[] = ['hr_admin','hr_manager']
const ops: HRRole[] = ['hr_admin','hr_manager','operations_manager']

export const HR_NAVIGATION_REGISTRY: HRNavItem[] = [
  { label: 'HR Command Center', href: '/hr', area: 'command', roles: ['hr_admin','hr_manager','operations_manager'], priority: 1 },
  { label: 'Employees', href: '/hr/employees', area: 'staff', roles: [...hrCore,'operations_manager','finance','compliance'], priority: 2 },
  { label: 'Recruitment', href: '/hr/recruitment', area: 'recruitment', roles: hrCore, priority: 3 },
  { label: 'Openings', href: '/hr/openings', area: 'recruitment', roles: hrCore, priority: 4 },
  { label: 'Onboarding', href: '/hr/onboarding', area: 'onboarding', roles: hrCore, priority: 5 },
  { label: 'Rosters', href: '/hr/rosters', area: 'operations', roles: ops, priority: 6 },
  { label: 'Attendance', href: '/hr/attendance', area: 'operations', roles: [...ops,'finance','team_lead'], priority: 7 },
  { label: 'Contracts', href: '/hr/contracts', area: 'legal', roles: ['hr_admin','hr_manager','finance'], priority: 8 },
  { label: 'Documents', href: '/hr/documents', area: 'compliance', roles: ['hr_admin','hr_manager','compliance'], priority: 9 },
  { label: 'Training', href: '/hr/training', area: 'academy', roles: [...hrCore,'operations_manager','team_lead'], priority: 10 },
  { label: 'Compliance', href: '/hr/compliance', area: 'compliance', roles: ['hr_admin','hr_manager','compliance'], priority: 11 },
  { label: 'Payroll', href: '/hr/payroll', area: 'finance', roles: ['hr_admin','finance'], priority: 12 },
  { label: 'Reports', href: '/hr/reports', area: 'analytics', roles: ['hr_admin','hr_manager','finance','compliance'], priority: 13 },
  { label: 'Sync Center', href: '/hr/sync-center', area: 'system', roles: ['hr_admin'], priority: 14 },
  { label: 'System Health', href: '/hr/system-health', area: 'system', roles: ['hr_admin'], priority: 15 },
]

export function getHRNavigationForRole(role: HRRole = 'hr_admin') { return HR_NAVIGATION_REGISTRY.filter(i => i.roles.includes(role)).sort((a,b) => a.priority - b.priority) }
export function canAccessHRPath(role: HRRole, href: string) { if (role === 'hr_admin') return true; const exact = HR_NAVIGATION_REGISTRY.find(i => href === i.href || href.startsWith(`${i.href}/`)); return exact ? exact.roles.includes(role) : all.includes(role) }
