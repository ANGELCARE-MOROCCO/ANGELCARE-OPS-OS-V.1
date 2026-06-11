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

const ROUTES = APP_ROUTES as unknown as AppRoute[]

function normalizeRole(user: any) {
  return String(user?.role || user?.role_key || '').toLowerCase()
}

function getUserPermissions(user: any): string[] {
  return Array.isArray(user?.permissions) ? user.permissions.map(String) : []
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

    const role = normalizeRole(user)

    if (role === 'ceo') {
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