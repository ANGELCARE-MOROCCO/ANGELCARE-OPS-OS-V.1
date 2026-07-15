export const ACCESS_CONTROL: Record<string, string[]> = {
  '/users': ['users.manage', 'users.view'],
  '/leads': ['leads.view'],
  '/missions': ['missions.view'],
  '/revenue-command-center': ['revenue_center.access', 'revenue.view'],
  '/voice-center': ['voice_center.access', 'voice.view'],
}

export function routeToPagePermission(pathname: string) {
  const cleanPath = pathname.split('?')[0].replace(/\/$/, '') || '/'
  return `page:${cleanPath}`
}

export function getRouteRequirements(pathname: string) {
  const cleanPath = pathname.split('?')[0].replace(/\/$/, '') || '/'
  const staticRequirements = Object.entries(ACCESS_CONTROL)
    .filter(([prefix]) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`))
    .flatMap(([, permissions]) => permissions)

  return Array.from(new Set([routeToPagePermission(cleanPath), ...staticRequirements]))
}
