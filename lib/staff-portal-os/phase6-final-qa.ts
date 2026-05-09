import { STAFF_PORTAL_ROUTES } from './phase5-routes'

export type StaffPortalQACheck = {
  key: string
  label: string
  status: 'ok' | 'review' | 'missing'
  detail: string
}

export function getStaffPortalFinalChecks(): StaffPortalQACheck[] {
  const duplicates = STAFF_PORTAL_ROUTES
    .map((route) => route.href)
    .filter((href, index, all) => all.indexOf(href) !== index)

  return [
    {
      key: 'route_manifest',
      label: 'Route manifest',
      status: STAFF_PORTAL_ROUTES.length >= 8 ? 'ok' : 'review',
      detail: `${STAFF_PORTAL_ROUTES.length} Staff Portal OS routes registered.`,
    },
    {
      key: 'duplicate_routes',
      label: 'Duplicate route check',
      status: duplicates.length === 0 ? 'ok' : 'review',
      detail: duplicates.length === 0 ? 'No duplicate routes detected.' : `${duplicates.length} duplicate route entries detected.`,
    },
    {
      key: 'core_landing',
      label: 'Staff landing route',
      status: STAFF_PORTAL_ROUTES.some((route) => route.href === '/staff-home') ? 'ok' : 'missing',
      detail: '/staff-home must exist as the post-login master staff portal.',
    },
    {
      key: 'services',
      label: 'Staff services',
      status: STAFF_PORTAL_ROUTES.some((route) => route.href === '/staff-services') ? 'ok' : 'missing',
      detail: 'Staff services must exist for admin/service requests.',
    },
    {
      key: 'memos',
      label: 'Memo broadcast control',
      status: STAFF_PORTAL_ROUTES.some((route) => route.href === '/staff-memos') ? 'ok' : 'missing',
      detail: 'Staff memos must exist for ATC control broadcasts.',
    },
    {
      key: 'manager_variant',
      label: 'Manager team command',
      status: STAFF_PORTAL_ROUTES.some((route) => route.href === '/team-command') ? 'ok' : 'missing',
      detail: 'Manager/team command route must exist for leadership variants.',
    },
  ]
}
