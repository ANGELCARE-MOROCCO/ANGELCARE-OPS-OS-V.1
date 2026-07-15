import type { AccessGovernanceScanSummary, AccessRegistryEventRow, GovernanceUserRow } from './types'
import {
  buildModuleRegistrations,
  buildRouteRegistrations,
  canManageAccessGovernance,
  isMissingRegistryTableError,
  normalizeGeneratedRoutes,
  normalizeStatus,
} from './registry'
import { randomUUID } from 'crypto'

type SupabaseClient = any

function actorSnapshot(actor: GovernanceUserRow) {
  return {
    id: actor.id,
    email: actor.email || null,
    full_name: actor.full_name || null,
    role: actor.role || null,
    status: actor.status || null,
  }
}

function buildEvent(event_type: string, actor: GovernanceUserRow, message: string, payload: Record<string, unknown>, module_key: string | null = null, route_href: string | null = null): AccessRegistryEventRow {
  return {
    id: randomUUID(),
    event_type,
    module_key,
    route_href,
    actor_user_id: actor.id,
    actor_email: actor.email || null,
    message,
    payload,
    created_at: new Date().toISOString(),
  }
}

function buildMessage(label: string, items: Array<{ label?: string; href?: string; moduleKey?: string }>) {
  if (!items.length) return `${label} not detected.`
  const preview = items.slice(0, 8).map((item) => item.label || item.href || item.moduleKey || 'item')
  const suffix = items.length > preview.length ? ` and ${items.length - preview.length} more` : ''
  return `${label}: ${preview.join(', ')}${suffix}.`
}

async function readExistingRows(supabase: SupabaseClient, table: string, columns = '*') {
  const { data, error } = await supabase.from(table).select(columns)
  if (error) throw error
  return (data || []) as any[]
}

export async function runAccessGovernanceScan(supabase: SupabaseClient, actor: GovernanceUserRow) {
  if (!canManageAccessGovernance(actor)) {
    return { ok: false as const, status: 403, error: 'Access denied. This scan requires CEO, Admin, Manager, or users.manage.', missingMigration: false }
  }
  if (normalizeStatus(actor.status) !== 'active') {
    return { ok: false as const, status: 403, error: 'Access denied. Your account is not active.', missingMigration: false }
  }

  const timestamp = new Date().toISOString()
  const normalizedRoutes = normalizeGeneratedRoutes()
  const routeRegistrations = buildRouteRegistrations(normalizedRoutes as any)
  const moduleRegistrations = buildModuleRegistrations(normalizedRoutes as any)

  try {
    const [existingModules, existingRoutes] = await Promise.all([
      readExistingRows(supabase, 'access_module_registry', 'module_key,status,metadata,created_at,last_seen_at'),
      readExistingRows(supabase, 'access_route_registry', 'href,status,metadata,created_at,last_seen_at'),
    ])

    const existingModuleMap = new Map(existingModules.map((row) => [String(row.module_key), row]))
    const existingRouteMap = new Map(existingRoutes.map((row) => [String(row.href), row]))

    const detectedModuleKeys = new Set(moduleRegistrations.map((row) => row.module_key))
    const detectedRouteHrefs = new Set(routeRegistrations.map((row) => row.href))

    const newModules = moduleRegistrations.filter((row) => {
      const existing = existingModuleMap.get(row.module_key)
      return !existing || String(existing.status || '').toLowerCase() !== 'active'
    })

    const newRoutes = routeRegistrations.filter((row) => {
      const existing = existingRouteMap.get(row.href)
      return !existing || String(existing.status || '').toLowerCase() !== 'active'
    })

    const staleModules = existingModules.filter((row) => !detectedModuleKeys.has(String(row.module_key)) && String(row.status || '').toLowerCase() !== 'stale')
    const staleRoutes = existingRoutes.filter((row) => !detectedRouteHrefs.has(String(row.href)) && String(row.status || '').toLowerCase() !== 'stale')

    const modulePayloads = moduleRegistrations.map((row) => ({
      ...row,
      metadata: {
        ...(existingModuleMap.get(row.module_key)?.metadata || {}),
        ...row.metadata,
        detectedAt: timestamp,
        scanSource: 'lib/generated/app-routes.ts',
      },
      status: 'active',
      last_seen_at: timestamp,
    }))

    const routePayloads = routeRegistrations.map((row) => ({
      ...row,
      metadata: {
        ...(existingRouteMap.get(row.href)?.metadata || {}),
        ...row.metadata,
        detectedAt: timestamp,
        scanSource: 'lib/generated/app-routes.ts',
      },
      status: 'active',
      last_seen_at: timestamp,
    }))

    if (modulePayloads.length) {
      const { error } = await supabase.from('access_module_registry').upsert(modulePayloads, { onConflict: 'module_key' })
      if (error) throw error
    }

    if (routePayloads.length) {
      const { error } = await supabase.from('access_route_registry').upsert(routePayloads, { onConflict: 'href' })
      if (error) throw error
    }

    for (const row of staleModules) {
      const { error } = await supabase
        .from('access_module_registry')
        .update({
          status: 'stale',
          metadata: {
            ...(row.metadata || {}),
            staleAt: timestamp,
            staleReason: 'Missing from latest APP_ROUTES scan',
          },
        })
        .eq('module_key', row.module_key)
      if (error) throw error
    }

    for (const row of staleRoutes) {
      const { error } = await supabase
        .from('access_route_registry')
        .update({
          status: 'stale',
          metadata: {
            ...(row.metadata || {}),
            staleAt: timestamp,
            staleReason: 'Missing from latest APP_ROUTES scan',
          },
        })
        .eq('href', row.href)
      if (error) throw error
    }

    const latestScanPayload = {
      scanSource: 'lib/generated/app-routes.ts',
      actor: actorSnapshot(actor),
      routes: routeRegistrations.map((route) => ({
        href: route.href,
        label: route.label,
        moduleKey: route.module_key,
        moduleLabel: route.module_label,
        permissionKey: route.permission_key,
        modulePermissionKey: route.module_permission_key,
        routeType: route.route_type,
        workspaceKey: route.workspace_key,
        submoduleKey: route.submodule_key,
      })),
      modules: moduleRegistrations.map((module) => ({
        moduleKey: module.module_key,
        moduleLabel: module.module_label,
        routeCount: module.metadata.routeCount,
        permissionKey: module.permission_key,
        modulePermissionKey: module.module_permission_key,
      })),
      newModules: newModules.map((row) => row.module_key),
      newRoutes: newRoutes.map((row) => row.href),
      staleModules: staleModules.map((row) => row.module_key),
      staleRoutes: staleRoutes.map((row) => row.href),
    }

    const scanRow = {
      scan_type: 'app_routes_scan',
      status: 'completed',
      modules_detected: moduleRegistrations.length,
      routes_detected: routeRegistrations.length,
      new_modules: newModules.length,
      new_routes: newRoutes.length,
      stale_modules: staleModules.length,
      stale_routes: staleRoutes.length,
      source: 'lib/generated/app-routes.ts',
      payload: latestScanPayload,
      created_by: actor.id,
      actor_email: actor.email || null,
      created_at: timestamp,
    }

    const { data: insertedScan, error: scanError } = await supabase.from('access_scan_runs').insert([scanRow]).select('*').single()
    if (scanError) throw scanError

    const registryEvents: AccessRegistryEventRow[] = [
      buildEvent('scan.completed', actor, `App access scan completed with ${routeRegistrations.length} routes and ${moduleRegistrations.length} modules.`, {
        scanId: insertedScan?.id || null,
        modulesDetected: moduleRegistrations.length,
        routesDetected: routeRegistrations.length,
        newModules: newModules.length,
        newRoutes: newRoutes.length,
        staleModules: staleModules.length,
        staleRoutes: staleRoutes.length,
      }),
    ]

    if (newModules.length) {
      registryEvents.push(buildEvent('scan.new_modules', actor, buildMessage('New modules detected', newModules.map((row) => ({ moduleKey: row.module_key }))), { modules: newModules.map((row) => row.module_key) }))
    }
    if (newRoutes.length) {
      registryEvents.push(buildEvent('scan.new_routes', actor, buildMessage('New routes detected', newRoutes.map((row) => ({ label: row.label, href: row.href }))), { routes: newRoutes.map((row) => row.href) }))
    }
    if (staleModules.length) {
      registryEvents.push(buildEvent('scan.stale_modules', actor, buildMessage('Stale modules detected', staleModules.map((row) => ({ moduleKey: row.module_key }))), { modules: staleModules.map((row) => row.module_key) }))
    }
    if (staleRoutes.length) {
      registryEvents.push(buildEvent('scan.stale_routes', actor, buildMessage('Stale routes detected', staleRoutes.map((row) => ({ label: row.label, href: row.href }))), { routes: staleRoutes.map((row) => row.href) }))
    }

    if (registryEvents.length) {
      const { error: eventError } = await supabase.from('access_registry_events').insert(registryEvents)
      if (eventError) throw eventError
    }

    const summary: AccessGovernanceScanSummary = {
      modulesDetected: moduleRegistrations.length,
      routesDetected: routeRegistrations.length,
      newModules: newModules.length,
      newRoutes: newRoutes.length,
      staleModules: staleModules.length,
      staleRoutes: staleRoutes.length,
      latestScanAt: timestamp,
      latestScanId: insertedScan?.id || '',
      source: 'lib/generated/app-routes.ts',
      modules: moduleRegistrations.map((module) => ({
        moduleKey: module.module_key,
        moduleLabel: module.module_label,
        moduleGroup: module.module_group,
        permissionKey: module.permission_key,
        modulePermissionKey: module.module_permission_key,
        routeCount: Number(module.metadata.routeCount || 0),
        status: 'active',
      })),
      routes: routeRegistrations.map((route) => ({
        href: route.href,
        label: route.label,
        shortLabel: route.short_label,
        moduleKey: route.module_key,
        moduleLabel: route.module_label,
        permissionKey: route.permission_key,
        modulePermissionKey: route.module_permission_key,
        routeType: route.route_type,
        workspaceKey: route.workspace_key,
        submoduleKey: route.submodule_key,
        status: 'active',
      })),
    }

    return { ok: true as const, summary }
  } catch (error) {
    if (isMissingRegistryTableError(error)) {
      return { ok: false as const, status: 500, error: 'Access governance registry tables are missing. Apply the Phase 1 migration before scanning.', missingMigration: true }
    }

    return { ok: false as const, status: 500, error: error instanceof Error ? error.message : 'Access governance scan failed.', missingMigration: false }
  }
}
