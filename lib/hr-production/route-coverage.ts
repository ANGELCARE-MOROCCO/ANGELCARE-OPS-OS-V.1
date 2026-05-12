import { HR_PRODUCTION_NAV } from './navigation'

export const HR_REQUIRED_ROUTES = [
  '/hr','/hr/staff','/hr/recruitment','/hr/recruitment/interviews','/hr/recruitment/sources',
  '/hr/attendance','/hr/rosters','/hr/rosters/conflicts','/hr/documents','/hr/contracts','/hr/compliance',
  '/hr/payroll','/hr/training','/hr/approvals','/hr/reports','/hr/reports/export','/hr/data-quality',
  '/hr/sync-center','/hr/system-health','/hr/workforce/missions','/hr/workforce/forecast','/hr/settings'
]

export function getHRRouteCoverage() {
  const nav = new Set<string>(HR_PRODUCTION_NAV.map(x => x.href))
  return HR_REQUIRED_ROUTES.map(route => ({
    route,
    inNavigation: nav.has(route),
    status: nav.has(route) || route.includes('/') ? 'covered' : 'review',
  }))
}
