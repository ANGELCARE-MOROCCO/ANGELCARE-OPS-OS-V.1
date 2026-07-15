import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { APP_ROUTES } from '@/lib/generated/app-routes'

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

function isRouteAllowed(route: AppRoute, permissions: string[]) {
  return (
    permissions.includes(route.permissionKey) ||
    Boolean(route.modulePermissionKey && permissions.includes(route.modulePermissionKey)) ||
    permissions.includes(`${route.module}.view`)
  )
}

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ routes: [] })
    }

    if (hasFullApplicationAccess(user)) {
      return NextResponse.json({ routes: ROUTES })
    }

    const permissions = getUserPermissions(user)
    const routes = ROUTES.filter((route) => isRouteAllowed(route, permissions))

    return NextResponse.json({ routes })
  } catch (error) {
    console.error('app-routes/allowed error:', error)
    return NextResponse.json({ routes: [] }, { status: 200 })
  }
}