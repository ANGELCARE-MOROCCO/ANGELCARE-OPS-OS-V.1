import { getAllowedAppRoutes, groupRoutesByModule } from '@/lib/auth/page-access'
import type { StaffPortalData, StaffPortalUser } from './phase1-data'
import { getStaffPortalPersona } from './phase3-personalization'

export function getMegaStaffPortalData(user: StaffPortalUser | null, data: StaffPortalData) {
  const persona = getStaffPortalPersona(user, data)
  const allowedRoutes = getAllowedAppRoutes(user)
  const routeGroups = groupRoutesByModule(allowedRoutes)

  const routeDensity = Object.entries(routeGroups).map(([module, routes]) => ({
    module,
    label: routes[0]?.moduleLabel || module,
    count: routes.length,
    href: routes[0]?.href || '/staff-home',
  }))

  const warningMemos = data.memos.filter((memo) => memo.severity === 'critical' || memo.severity === 'warning').length

  return {
    ...data,
    persona,
    routeDensity,
    executiveSignals: [
      { label: 'Today execution', value: data.tasksToday.length, detail: 'Immediate operating load', tone: data.tasksToday.length > 5 ? 'red' as const : data.tasksToday.length ? 'amber' as const : 'green' as const },
      { label: 'Weekly pressure', value: data.tasksWeek.length, detail: 'Seven-day workload horizon', tone: data.tasksWeek.length > 12 ? 'red' as const : data.tasksWeek.length > 5 ? 'amber' as const : 'blue' as const },
      { label: 'Monthly runway', value: data.tasksMonth.length, detail: 'Thirty-day execution visibility', tone: 'purple' as const },
      { label: 'Control memos', value: data.memos.length, detail: `${warningMemos} warning/critical`, tone: warningMemos ? 'red' as const : 'green' as const },
      { label: 'Authorized access', value: data.accessRoutes.length, detail: 'Permission-synced routes', tone: 'cyan' as const },
      { label: 'Module density', value: routeDensity.length, detail: 'Available operating areas', tone: 'blue' as const },
    ],
    commandZones: [
      { title: 'Staff Command', detail: 'Main master staff portal.', href: '/staff-home', tone: 'blue' as const },
      { title: 'Services Desk', detail: 'Staff requests and admin services.', href: '/staff-services', tone: 'green' as const },
      { title: 'Memo Broadcasts', detail: 'ATC memos and acknowledgements.', href: '/staff-memos', tone: 'red' as const },
      { title: 'Team Command', detail: 'Manager/team control page.', href: '/team-command', tone: 'purple' as const },
      { title: 'Portal Intelligence', detail: 'Department and persona logic.', href: '/staff-portal-intelligence', tone: 'cyan' as const },
    ],
  }
}
