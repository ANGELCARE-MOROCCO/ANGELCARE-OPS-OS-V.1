import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { APP_ROUTES } from '@/lib/generated/app-routes'
import { createClient } from '@/lib/supabase/server'

type AppRoute = {
  label: string
  href: string
  module: string
  permissionKey: string
  shortLabel?: string
  modulePermissionKey?: string
  moduleLabel?: string
}


const B2B_ROUTES: AppRoute[] = [
  { label: 'B2B Partnerships', shortLabel: 'B2B', href: '/b2b-partnerships', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships', modulePermissionKey: 'b2b_partnerships.access' },
  { label: 'B2B / Prospects', shortLabel: 'Prospects', href: '/b2b-partnerships/prospects', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships/prospects', modulePermissionKey: 'b2b_partnerships.read' },
  { label: 'B2B / Pipeline', shortLabel: 'Pipeline', href: '/b2b-partnerships/pipeline', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships/pipeline', modulePermissionKey: 'b2b_partnerships.read' },
  { label: 'B2B / Outreach', shortLabel: 'Outreach', href: '/b2b-partnerships/outreach', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships/outreach', modulePermissionKey: 'b2b_partnerships.read' },
  { label: 'B2B / Templates', shortLabel: 'Templates', href: '/b2b-partnerships/templates', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships/templates', modulePermissionKey: 'b2b_partnerships.manage_templates' },
  { label: 'B2B / Campaigns', shortLabel: 'Campaigns', href: '/b2b-partnerships/campaigns', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships/campaigns', modulePermissionKey: 'b2b_partnerships.manage_campaigns' },
  { label: 'B2B / Imports', shortLabel: 'Imports', href: '/b2b-partnerships/imports', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships/imports', modulePermissionKey: 'b2b_partnerships.create' },
  { label: 'B2B / Automation', shortLabel: 'Automation', href: '/b2b-partnerships/automation', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships/automation', modulePermissionKey: 'b2b_partnerships.manage_automation' },
  { label: 'B2B / Meetings', shortLabel: 'Meetings', href: '/b2b-partnerships/meetings', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships/meetings', modulePermissionKey: 'b2b_partnerships.read' },
  { label: 'B2B / Tasks', shortLabel: 'Tasks', href: '/b2b-partnerships/tasks', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships/tasks', modulePermissionKey: 'b2b_partnerships.read' },
  { label: 'B2B / Execution', shortLabel: 'Execution', href: '/b2b-partnerships/execution', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships/execution', modulePermissionKey: 'b2b_partnerships.read' },
  { label: 'B2B / Proposals', shortLabel: 'Proposals', href: '/b2b-partnerships/proposals', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships/proposals', modulePermissionKey: 'b2b_partnerships.read' },
  { label: 'B2B / Programs', shortLabel: 'Programs', href: '/b2b-partnerships/programs', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships/programs', modulePermissionKey: 'b2b_partnerships.read' },
  { label: 'B2B / Reports', shortLabel: 'Reports', href: '/b2b-partnerships/reports', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships/reports', modulePermissionKey: 'b2b_partnerships.manage_reports' },
  { label: 'B2B / KPIs', shortLabel: 'KPIs', href: '/b2b-partnerships/kpis', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships/kpis', modulePermissionKey: 'b2b_partnerships.manage_reports' },
  { label: 'B2B / Settings', shortLabel: 'Settings', href: '/b2b-partnerships/settings', module: 'b2b_partnerships', moduleLabel: 'B2B Partnerships', permissionKey: 'page:/b2b-partnerships/settings', modulePermissionKey: 'b2b_partnerships.manage_settings' },
]

const ROUTES = [...(APP_ROUTES as unknown as AppRoute[]), ...B2B_ROUTES]

function normalizeRole(user: any) {
  return String(user?.role || user?.role_key || '').toLowerCase()
}

function getUserPermissions(user: any): string[] {
  return Array.isArray(user?.permissions) ? user.permissions.map(String) : []
}

function hasFullApplicationAccess(user: any) {
  const role = normalizeRole(user)
  const permissions = getUserPermissions(user)
  return ['ceo', 'owner', 'super_admin'].includes(role) || permissions.includes('*')
}


function slugResourceSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'root'
}

function inheritedResourcePermissions(route: AppRoute) {
  const segments = String(route.href || '').split('/').filter(Boolean)
  const candidates: string[] = []
  if (segments[0]) candidates.push(`resource:family:${slugResourceSegment(segments[0])}`)
  if (segments[0] && segments[1]) candidates.push(`resource:group:${slugResourceSegment(segments[0])}:${slugResourceSegment(segments[1])}`)
  return candidates
}

function isRouteAllowed(route: AppRoute, permissions: string[]) {
  return (
    permissions.includes(route.permissionKey) ||
    Boolean(route.modulePermissionKey && permissions.includes(route.modulePermissionKey)) ||
    permissions.includes(`${route.module}.view`) ||
    inheritedResourcePermissions(route).some((permission) => permissions.includes(permission))
  )
}

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ routes: [] })
    }

    const permissions = getUserPermissions(user)
    const supabase = await createClient()
    const { data: resourceRows } = await supabase
      .from('access_resource_registry')
      .select('resource_key,resource_type,display_name,canonical_route,permission_key,module_key,family_key,parent_resource_key,navigation_visible,status,assignable')
      .eq('status', 'active')
      .eq('assignable', true)
      .eq('navigation_visible', true)
      .not('canonical_route', 'is', null)
      .limit(20000)

    const registryRoutes: AppRoute[] = (resourceRows || []).map((resource: any) => ({
      label: String(resource.display_name || resource.canonical_route),
      shortLabel: String(resource.display_name || resource.canonical_route).split(' / ').pop(),
      href: String(resource.canonical_route),
      module: String(resource.module_key || (resource.family_key ? `family__${resource.family_key}` : resource.resource_key)),
      moduleLabel: String(resource.display_name || resource.module_key || resource.family_key || 'Independent workspace'),
      permissionKey: String(resource.permission_key),
      modulePermissionKey: String(resource.permission_key),
    }))

    const combined = [...ROUTES, ...registryRoutes]
    const deduped = [...new Map(combined.map((route) => [route.href, route])).values()]

    if (hasFullApplicationAccess(user)) {
      return NextResponse.json({ routes: deduped })
    }

    const routes = deduped.filter((route) => isRouteAllowed(route, permissions))

    return NextResponse.json({ routes })
  } catch (error) {
    console.error('app-routes/allowed error:', error)
    return NextResponse.json({ routes: [] }, { status: 200 })
  }
}