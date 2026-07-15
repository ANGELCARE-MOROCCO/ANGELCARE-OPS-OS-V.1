export const HR_PRODUCTION_NAV = [
  { href: '/hr', label: 'Dashboard', group: 'Overview' },
  { href: '/hr/employees', label: 'Employees', group: 'People' },
  { href: '/hr/departments', label: 'Teams & Departments', group: 'People' },
  { href: '/hr/recruitment', label: 'Recruitment', group: 'People' },
  { href: '/hr/onboarding', label: 'Onboarding', group: 'People' },
  { href: '/hr/performance-matrix', label: 'Performance', group: 'People' },
  { href: '/hr/training', label: 'Learning & Development', group: 'People' },
  { href: '/hr/attendance', label: 'Attendance', group: 'Operations' },
  { href: '/hr/leave', label: 'Leave Management', group: 'Operations' },
  { href: '/hr/work-schedules', label: 'Work Schedules', group: 'Operations' },
  { href: '/hr/time-tracking', label: 'Time Tracking', group: 'Operations' },
  { href: '/hr/documents', label: 'Documents', group: 'Compliance & Documents' },
  { href: '/hr/templates', label: 'Templates', group: 'Compliance & Documents' },
  { href: '/hr/policies', label: 'Policies', group: 'Compliance & Documents' },
  { href: '/hr/compliance', label: 'Compliance Dashboard', group: 'Compliance & Documents' },
  { href: '/hr/integrations', label: 'Integrations', group: 'System' },
  { href: '/hr/settings', label: 'Settings', group: 'System' },
] as const

export function getHRRouteByHref(href: string) { return HR_PRODUCTION_NAV.find(x => x.href === href) }
