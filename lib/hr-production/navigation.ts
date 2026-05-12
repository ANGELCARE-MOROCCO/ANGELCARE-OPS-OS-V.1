export const HR_PRODUCTION_NAV = [
  { href: '/hr', label: 'HR Command Center', group: 'Core' },
  { href: '/hr/staff', label: 'Staff 360', group: 'Core' },
  { href: '/hr/recruitment', label: 'Recruitment', group: 'Core' },
  { href: '/hr/attendance', label: 'Attendance', group: 'Core' },
  { href: '/hr/rosters', label: 'Rosters', group: 'Core' },
  { href: '/hr/documents', label: 'Documents', group: 'Compliance' },
  { href: '/hr/contracts', label: 'Contracts', group: 'Compliance' },
  { href: '/hr/approvals', label: 'Approvals', group: 'Execution' },
  { href: '/hr/payroll', label: 'Payroll Readiness', group: 'Execution' },
  { href: '/hr/training', label: 'Training', group: 'Execution' },
  { href: '/hr/data-quality', label: 'Data Quality', group: 'Control' },
  { href: '/hr/sync-center', label: 'Sync Center', group: 'Control' },
  { href: '/hr/system-health', label: 'System Health', group: 'Control' },
  { href: '/hr/reports', label: 'Reports', group: 'Reporting' },
  { href: '/hr/settings', label: 'Settings', group: 'Admin' },
] as const

export function getHRRouteByHref(href: string) { return HR_PRODUCTION_NAV.find(x => x.href === href) }
