'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import type { UserStaffRecord } from './UsersEmployeeCommandClient'
import type {
  AccessGovernancePreview,
  AccessGovernanceRegistrySnapshot,
  AccessGovernanceScanSummary,
  AccessRegistryEventRow,
  AccessRouteRegistryRow,
  AccessModuleRegistryRow,
} from '@/lib/users/access-governance/types'
import { routePermissionMatches } from '@/lib/users/access-governance/registry'

type Props = {
  initialUsers: UserStaffRecord[]
  currentUserId: string
  currentUserRole: string
  canCreateUser: boolean
  canEditUser: boolean
  canOpenProfile: boolean
  canDeleteUsers: boolean
  canManageGovernance: boolean
  canPreviewGovernance: boolean
  registry: AccessGovernanceRegistrySnapshot
  registryError: string | null
  events: AccessRegistryEventRow[]
  scans: Array<Record<string, unknown>>
  loadedAt: string
}

type StatusTone = 'green' | 'amber' | 'red' | 'blue' | 'slate'

function formatDate(value?: string | null) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  } catch {
    return value
  }
}

function formatShortDate(value?: string | null) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

function statusTone(status?: string | null): StatusTone {
  const value = String(status || '').toLowerCase()
  if (['active', 'healthy', 'completed', 'synced'].includes(value)) return 'green'
  if (['stale', 'inactive', 'suspended', 'warning', 'pending'].includes(value)) return 'amber'
  if (['error', 'failed', 'critical'].includes(value)) return 'red'
  return 'slate'
}

function permissionCount(user: UserStaffRecord) {
  const permissions = Array.isArray(user.rawUser?.permissions) ? user.rawUser?.permissions : []
  return Array.from(new Set(permissions.map(String).filter(Boolean)))
}

function userPermissions(user: UserStaffRecord) {
  return permissionCount(user)
}

function canRender(actionAllowed: boolean, fallbackReason: string) {
  return actionAllowed ? undefined : fallbackReason
}

function coverageForUser(user: UserStaffRecord, routes: AccessRouteRegistryRow[]) {
  const permissions = userPermissions(user)
  const activeRoutes = routes.filter((route) => route.status === 'active')
  const matchedRoutes = activeRoutes.filter((route) => routePermissionMatches(permissions, route))
  const modules = new Set(matchedRoutes.map((route) => route.module_key))
  const totalModules = new Set(activeRoutes.map((route) => route.module_key)).size
  return {
    routeCount: matchedRoutes.length,
    moduleCount: modules.size,
    moduleTotal: totalModules,
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.ok === false) {
      return { ok: false, error: String(payload?.error || response.statusText || 'Request failed'), status: response.status }
    }
    return { ok: true, data: payload as T }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Request failed', status: 500 }
  }
}

export default function UserAccessGovernanceCenter({
  initialUsers,
  currentUserId,
  currentUserRole,
  canCreateUser,
  canEditUser,
  canOpenProfile,
  canDeleteUsers,
  canManageGovernance,
  canPreviewGovernance,
  registry: initialRegistry,
  registryError,
  events: initialEvents,
  scans: initialScans,
  loadedAt,
}: Props) {
  const [users] = useState(initialUsers)
  const [registry, setRegistry] = useState(initialRegistry)
  const [registryMessage, setRegistryMessage] = useState<string | null>(registryError)
  const [events, setEvents] = useState(initialEvents)
  const [scans, setScans] = useState(initialScans)
  const [query, setQuery] = useState('')
  const [moduleQuery, setModuleQuery] = useState('')
  const [routeQuery, setRouteQuery] = useState('')
  const [templateQuery, setTemplateQuery] = useState('')
  const [selectedPreview, setSelectedPreview] = useState<AccessGovernancePreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [scanBusy, setScanBusy] = useState(false)
  const [refreshBusy, setRefreshBusy] = useState(false)
  const [previewBusy, setPreviewBusy] = useState(false)
  const [scanSummary, setScanSummary] = useState<AccessGovernanceScanSummary | null>(null)

  useEffect(() => {
    setRegistry(initialRegistry)
    setRegistryMessage(registryError)
    setEvents(initialEvents)
    setScans(initialScans)
  }, [initialRegistry, registryError, initialEvents, initialScans])

  const activeUsers = useMemo(() => users.filter((user) => String(user.status || user.rawUser?.status || '').toLowerCase() === 'active').length, [users])
  const inactiveUsers = useMemo(() => users.filter((user) => String(user.status || user.rawUser?.status || '').toLowerCase() !== 'active').length, [users])

  const activeRegistryModules = registry.modules.filter((module) => module.status === 'active')
  const activeRegistryRoutes = registry.routes.filter((route) => route.status === 'active')
  const staleRegistryRoutes = registry.routes.filter((route) => route.status === 'stale')
  const latestScan = registry.latestScan

  const healthLabel = registryMessage
    ? 'Migration required'
    : latestScan
      ? staleRegistryRoutes.length
        ? 'Review stale routes'
        : 'Healthy'
      : 'Ready to scan'

  const healthTone: StatusTone = registryMessage ? 'red' : latestScan ? (staleRegistryRoutes.length ? 'amber' : 'green') : 'blue'

  const scanPayload = scanSummary || (latestScan?.payload as unknown as AccessGovernanceScanSummary | undefined) || null

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((user) => {
      const haystack = [
        user.fullName,
        user.username,
        user.email,
        user.role,
        user.department,
        user.position,
        String(user.rawUser?.status || user.status || ''),
      ].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [users, query])

  const filteredModules = useMemo(() => {
    const q = moduleQuery.trim().toLowerCase()
    if (!q) return registry.modules
    return registry.modules.filter((module) => {
      const haystack = [module.module_key, module.module_label, module.module_group, module.permission_key, module.module_permission_key, module.status, module.risk_level].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [moduleQuery, registry.modules])

  const filteredRoutes = useMemo(() => {
    const q = routeQuery.trim().toLowerCase()
    if (!q) return registry.routes
    return registry.routes.filter((route) => {
      const haystack = [route.label, route.href, route.module_key, route.module_label, route.permission_key, route.module_permission_key, route.status, route.workspace_key, route.submodule_key].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [registry.routes, routeQuery])

  const filteredTemplates = useMemo(() => {
    const q = templateQuery.trim().toLowerCase()
    if (!q) return registry.templates
    return registry.templates.filter((template) => {
      const haystack = [template.template_key, template.template_label, template.role, template.status, template.description].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [registry.templates, templateQuery])

  async function refreshRegistry(message?: string) {
    setRefreshBusy(true)
    setRegistryMessage(message || null)
    const [registryResult, eventsResult] = await Promise.all([
      fetchJson<{ ok: boolean; modules: AccessModuleRegistryRow[]; routes: AccessRouteRegistryRow[]; templates: AccessGovernanceRegistrySnapshot['templates']; latestScan: AccessGovernanceRegistrySnapshot['latestScan']; stats: AccessGovernanceRegistrySnapshot['stats'] }>('/api/users/access-governance/registry'),
      fetchJson<{ ok: boolean; events: AccessRegistryEventRow[]; scans: Array<Record<string, unknown>> }>('/api/users/access-governance/events'),
    ])

    if (registryResult.ok) {
      setRegistry({
        modules: registryResult.data.modules,
        routes: registryResult.data.routes,
        templates: registryResult.data.templates,
        latestScan: registryResult.data.latestScan,
        stats: registryResult.data.stats,
      })
      setRegistryMessage(null)
    } else {
      setRegistryMessage(registryResult.error)
    }

    if (eventsResult.ok) {
      setEvents(eventsResult.data.events)
      setScans(eventsResult.data.scans)
    }

    setRefreshBusy(false)
  }

  async function runScan() {
    if (!canManageGovernance || scanBusy) return
    setScanBusy(true)
    setRegistryMessage(null)
    const result = await fetchJson<AccessGovernanceScanSummary>('/api/users/access-governance/scan', { method: 'POST' })
    if (result.ok) {
      setScanSummary(result.data)
      await refreshRegistry('Scan completed. Registry refreshed from APP_ROUTES.')
    } else {
      setRegistryMessage(result.error)
    }
    setScanBusy(false)
  }

  async function openPreview(user: UserStaffRecord) {
    if (!canPreviewGovernance) {
      setPreviewError('Access preview requires CEO, Admin, Manager, or users.view/users.manage.')
      return
    }

    setPreviewBusy(true)
    setPreviewError(null)
    const result = await fetchJson<AccessGovernancePreview>(`/api/users/access-governance/users/${user.id}/preview`)
    if (result.ok) {
      setSelectedPreview(result.data)
    } else {
      setPreviewError(result.error)
    }
    setPreviewBusy(false)
  }

  const scanHeadline = scanPayload?.latestScanAt || latestScan?.created_at || null
  const scanModules = scanPayload?.modules || []
  const scanRoutes = scanPayload?.routes || []

  return (
    <div style={rootStyle}>
      {registryMessage ? <div style={errorBannerStyle}>{registryMessage}</div> : null}

      <section style={heroStyle} className="uag-hero">
        <div style={{ minWidth: 0 }}>
          <div style={eyebrowStyle}>User Access Governance Center</div>
          <h1 style={titleStyle}>Users & Access Control</h1>
          <p style={subtitleStyle}>Scan, organize and govern workspace access across ANGELCARE OpsOS.</p>
          <div style={metaRowStyle}>
            <MetaChip tone="blue" label="Loaded" value={formatDate(loadedAt)} />
            <MetaChip tone={healthTone} label="Registry health" value={healthLabel} />
            <MetaChip tone="slate" label="Current role" value={currentUserRole || '—'} />
          </div>
        </div>

        <div style={actionsStyle}>
          <ActionButton onClick={runScan} disabled={!canManageGovernance || scanBusy} tone="primary" reason={canRender(canManageGovernance, 'Requires CEO, Admin, Manager, or users.manage.')}>
            {scanBusy ? 'Scanning App...' : 'Run App Access Scan'}
          </ActionButton>
          <ActionButton onClick={() => refreshRegistry()} disabled={refreshBusy} tone="secondary">
            {refreshBusy ? 'Refreshing...' : 'Refresh Registry'}
          </ActionButton>
          {canCreateUser ? (
            <Link href="/users/new" style={linkButtonStyle}>New User</Link>
          ) : (
            <button type="button" style={disabledButtonStyle} disabled title="Requires CEO, Manager, or Admin.">New User</button>
          )}
          <button type="button" style={disabledButtonStyle} disabled title="Role template editing ships in Phase 2.">
            Role Templates
          </button>
        </div>
      </section>

      <section style={panelStyle}>
        <SectionHeader eyebrow="Overview" title="Operational KPIs" subtitle="Real registry and user data from the current app state." />
        <div className="uag-kpi" style={kpiGridStyle}>
          <MetricCard label="Total users" value={String(users.length)} tone="blue" />
          <MetricCard label="Active users" value={String(activeUsers)} tone="green" />
          <MetricCard label="Suspended / inactive" value={String(inactiveUsers)} tone="amber" />
          <MetricCard label="Modules detected" value={String(registry.stats.totalModules)} tone="slate" />
          <MetricCard label="Routes detected" value={String(registry.stats.totalRoutes)} tone="slate" />
          <MetricCard label="Stale routes" value={String(registry.stats.staleRoutes)} tone={registry.stats.staleRoutes ? 'amber' : 'green'} />
          <MetricCard label="Latest scan" value={scanHeadline ? formatDate(scanHeadline) : 'No scan yet'} tone={scanHeadline ? 'green' : 'slate'} />
          <MetricCard label="Permission registry health" value={healthLabel} tone={healthTone} />
        </div>
      </section>

      <section style={panelStyle}>
        <SectionHeader eyebrow="Directory" title="Users Directory" subtitle="Open access previews, review permissions and jump to the existing edit flow." />

        <div className="uag-toolbar" style={toolbarStyle}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users, roles, departments, email..." style={searchStyle} />
          <div style={toolbarMetaStyle}>
            <SmallStat label="Visible" value={String(filteredUsers.length)} />
            <SmallStat label="Preview" value={canPreviewGovernance ? 'Enabled' : 'Disabled'} tone={canPreviewGovernance ? 'green' : 'amber'} />
          </div>
        </div>

        <div className="desktop-only">
          <div style={tableShellStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <Th>User</Th>
                  <Th>Username</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Department</Th>
                  <Th>Permissions</Th>
                  <Th>Module coverage</Th>
                  <Th>Last updated</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const permissions = userPermissions(user)
                  const coverage = coverageForUser(user, registry.routes)
                  const updatedAt = String(user.rawUser?.updated_at || user.createdAt || user.startDate || '')
                  const isCurrent = user.id === currentUserId
                  return (
                    <tr key={user.id} style={isCurrent ? currentUserRowStyle : undefined}>
                      <Td>
                        <div style={userCellStyle}>
                          <div style={avatarStyle}>{user.initials}</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={userNameStyle}>{user.fullName}{isCurrent ? <span style={selfBadgeStyle}>You</span> : null}</div>
                            <div style={userSubStyle}>{user.email || '—'}</div>
                          </div>
                        </div>
                      </Td>
                      <Td>{user.username || '—'}</Td>
                      <Td><Badge tone={statusTone(user.role)}>{user.role || '—'}</Badge></Td>
                      <Td><Badge tone={statusTone(user.status)}>{user.status || '—'}</Badge></Td>
                      <Td>{user.department || '—'}</Td>
                      <Td>{permissions.length}</Td>
                      <Td>{coverage.moduleCount}/{coverage.moduleTotal}</Td>
                      <Td>{formatShortDate(updatedAt)}</Td>
                      <Td>
                        <div style={actionGroupStyle}>
                          <ActionButton onClick={() => openPreview(user)} disabled={!canPreviewGovernance || previewBusy} tone="ghost" reason={canRender(canPreviewGovernance, 'Requires users.view or users.manage.')}>
                            Access Preview
                          </ActionButton>
                          {canEditUser ? <Link href={`/users/${user.id}/edit`} style={miniLinkStyle}>Edit</Link> : <button type="button" style={miniDisabledButtonStyle} disabled title="Requires CEO or Manager.">Edit</button>}
                          {canOpenProfile ? <Link href={`/users/${user.id}`} style={miniLinkStyle}>Profile</Link> : <button type="button" style={miniDisabledButtonStyle} disabled title="Requires CEO or Manager.">Profile</button>}
                          {canDeleteUsers ? <Link href={`/users/${user.id}/delete`} style={miniDangerLinkStyle}>Delete</Link> : <button type="button" style={miniDisabledButtonStyle} disabled title="Requires delete permission or protected admin access.">Delete</button>}
                        </div>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mobile-only" style={{ display: 'none' }}>
          <div style={mobileListStyle}>
            {filteredUsers.map((user) => {
              const permissions = userPermissions(user)
              const coverage = coverageForUser(user, registry.routes)
              return (
                <article key={user.id} style={mobileCardStyle}>
                  <div style={mobileCardTopStyle}>
                    <div style={userCellStyle}>
                      <div style={avatarStyle}>{user.initials}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={userNameStyle}>{user.fullName}</div>
                        <div style={userSubStyle}>{user.email || '—'}</div>
                      </div>
                    </div>
                    <Badge tone={statusTone(user.status)}>{user.status || '—'}</Badge>
                  </div>
                  <div style={mobileMetaGridStyle}>
                    <MetaLine label="Username" value={user.username || '—'} />
                    <MetaLine label="Role" value={user.role || '—'} />
                    <MetaLine label="Department" value={user.department || '—'} />
                    <MetaLine label="Permissions" value={String(permissions.length)} />
                    <MetaLine label="Module coverage" value={`${coverage.moduleCount}/${coverage.moduleTotal}`} />
                    <MetaLine label="Updated" value={formatShortDate(String(user.rawUser?.updated_at || user.createdAt || ''))} />
                  </div>
                  <div style={mobileActionStyle}>
                    <ActionButton onClick={() => openPreview(user)} disabled={!canPreviewGovernance || previewBusy} tone="ghost" reason={canRender(canPreviewGovernance, 'Requires users.view or users.manage.')}>
                      Access Preview
                    </ActionButton>
                    {canEditUser ? <Link href={`/users/${user.id}/edit`} style={miniLinkStyle}>Edit</Link> : <button type="button" style={miniDisabledButtonStyle} disabled title="Requires CEO or Manager.">Edit</button>}
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        {!filteredUsers.length ? <EmptyState text="No users match the current filter." /> : null}
      </section>

      <div className="uag-two" style={twoColumnStyle}>
        <section style={panelStyle}>
          <SectionHeader eyebrow="App Scan" title="App Access Scan Center" subtitle="Detects access surfaces only. It does not grant access automatically." />

          <div className="scan-summary" style={scanSummaryStyle}>
            <StatBlock label="Scan source" value="lib/generated/app-routes.ts" />
            <StatBlock label="Modules detected" value={String(latestScan?.modules_detected || scanPayload?.modulesDetected || 0)} />
            <StatBlock label="Routes detected" value={String(latestScan?.routes_detected || scanPayload?.routesDetected || 0)} />
            <StatBlock label="New modules" value={String(latestScan?.new_modules || scanPayload?.newModules || 0)} />
            <StatBlock label="New routes" value={String(latestScan?.new_routes || scanPayload?.newRoutes || 0)} />
            <StatBlock label="Stale routes" value={String(latestScan?.stale_routes || scanPayload?.staleRoutes || 0)} />
          </div>

          <div className="scan-dual" style={listGridStyle}>
            <div>
              <SubHeader title="Discovered Modules" detail={`Detected in the latest scan ${latestScan ? formatDate(latestScan.created_at) : '—'}`} />
              <div style={scrollBoxStyle}>
                {(scanModules.length ? scanModules : registry.modules).map((module) => (
                  <div key={String((module as any).moduleKey || (module as AccessModuleRegistryRow).module_key)} style={registryItemStyle}>
                    <div style={{ minWidth: 0 }}>
                      <div style={registryTitleStyle}>{String((module as any).moduleLabel || (module as AccessModuleRegistryRow).module_label)}</div>
                      <div style={registrySubStyle}>{String((module as any).moduleKey || (module as AccessModuleRegistryRow).module_key)}</div>
                    </div>
                    <Badge tone={statusTone(String((module as any).status || (module as AccessModuleRegistryRow).status || 'active'))}>{String((module as any).status || 'active')}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SubHeader title="Discovered Routes" detail={`Showing ${scanRoutes.length || registry.routes.length} detected routes`} />
              <div style={scrollBoxStyle}>
                {(scanRoutes.length ? scanRoutes : registry.routes).map((route) => (
                  <div key={String((route as any).href || (route as AccessRouteRegistryRow).href)} style={registryItemStyle}>
                    <div style={{ minWidth: 0 }}>
                      <div style={registryTitleStyle}>{String((route as any).label || (route as AccessRouteRegistryRow).label)}</div>
                      <div style={registrySubStyle}>{String((route as any).href || (route as AccessRouteRegistryRow).href)}</div>
                    </div>
                    <Badge tone={statusTone(String((route as any).status || (route as AccessRouteRegistryRow).status || 'active'))}>{String((route as any).status || 'active')}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <SectionHeader eyebrow="Modules" title="Module Registry" subtitle="Canonical registry rows grouped from the generated app routes." />
          <div className="uag-toolbar" style={toolbarStyle}>
            <input value={moduleQuery} onChange={(event) => setModuleQuery(event.target.value)} placeholder="Filter modules..." style={searchStyle} />
            <SmallStat label="Active" value={String(activeRegistryModules.length)} />
            <SmallStat label="Stale" value={String(registry.modules.filter((module) => module.status === 'stale').length)} tone={registry.modules.some((module) => module.status === 'stale') ? 'amber' : 'green'} />
          </div>

          <div className="desktop-only">
            <div style={tableShellStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <Th>Module</Th>
                    <Th>Key</Th>
                    <Th>Routes</Th>
                    <Th>Permission</Th>
                    <Th>Status</Th>
                    <Th>Risk</Th>
                    <Th>Last seen</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModules.map((module) => {
                    const routeCount = Number((module.metadata as any)?.routeCount || registry.routes.filter((route) => route.module_key === module.module_key).length)
                    const isNew = latestScan ? new Date(module.created_at).getTime() >= new Date(latestScan.created_at).getTime() - 1000 : false
                    return (
                      <tr key={module.id}>
                        <Td>
                          <div style={userNameStyle}>{module.module_label}{isNew ? <span style={newBadgeStyle}>New</span> : null}</div>
                          <div style={userSubStyle}>{(module.metadata as any)?.routeCount ? 'Detected from current scan' : 'Registry row'}</div>
                        </Td>
                        <Td>{module.module_key}</Td>
                        <Td>{routeCount}</Td>
                        <Td>{module.module_permission_key || module.permission_key || '—'}</Td>
                        <Td><Badge tone={statusTone(module.status)}>{module.status}</Badge></Td>
                        <Td><Badge tone={statusTone(module.risk_level)}>{module.risk_level}</Badge></Td>
                        <Td>{formatShortDate(module.last_seen_at)}</Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mobile-only" style={{ display: 'none' }}>
            <div style={mobileListStyle}>
              {filteredModules.map((module) => (
                <article key={module.id} style={mobileCardStyle}>
                  <div style={mobileCardTopStyle}>
                    <div>
                      <div style={registryTitleStyle}>{module.module_label}</div>
                      <div style={registrySubStyle}>{module.module_key}</div>
                    </div>
                    <Badge tone={statusTone(module.status)}>{module.status}</Badge>
                  </div>
                  <div style={mobileMetaGridStyle}>
                    <MetaLine label="Routes" value={String(Number((module.metadata as any)?.routeCount || 0))} />
                    <MetaLine label="Permission" value={module.module_permission_key || module.permission_key || '—'} />
                    <MetaLine label="Risk" value={module.risk_level} />
                    <MetaLine label="Seen" value={formatShortDate(module.last_seen_at)} />
                  </div>
                </article>
              ))}
            </div>
          </div>

          {!filteredModules.length ? <EmptyState text="No module rows match the current filter." /> : null}
        </section>
      </div>

      <div className="uag-two" style={twoColumnStyle}>
        <section style={panelStyle}>
          <SectionHeader eyebrow="Routes" title="Route Registry" subtitle="Workspace, page, route and permission key registry for future governance edits." />
          <div className="uag-toolbar" style={toolbarStyle}>
            <input value={routeQuery} onChange={(event) => setRouteQuery(event.target.value)} placeholder="Filter routes..." style={searchStyle} />
            <SmallStat label="Active" value={String(activeRegistryRoutes.length)} />
            <SmallStat label="Stale" value={String(staleRegistryRoutes.length)} tone={staleRegistryRoutes.length ? 'amber' : 'green'} />
          </div>

          <div className="desktop-only">
            <div style={tableShellStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <Th>Route</Th>
                    <Th>Href</Th>
                    <Th>Module</Th>
                    <Th>Permission</Th>
                    <Th>Module permission</Th>
                    <Th>Status</Th>
                    <Th>Last seen</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoutes.map((route) => (
                    <tr key={route.id}>
                      <Td>
                        <div style={userNameStyle}>{route.label}</div>
                        <div style={userSubStyle}>{route.short_label || route.route_type}</div>
                      </Td>
                      <Td style={{ wordBreak: 'break-word' }}>{route.href}</Td>
                      <Td>{route.module_label || route.module_key}</Td>
                      <Td>{route.permission_key}</Td>
                      <Td>{route.module_permission_key || '—'}</Td>
                      <Td><Badge tone={statusTone(route.status)}>{route.status}</Badge></Td>
                      <Td>{formatShortDate(route.last_seen_at)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mobile-only" style={{ display: 'none' }}>
            <div style={mobileListStyle}>
              {filteredRoutes.map((route) => (
                <article key={route.id} style={mobileCardStyle}>
                  <div style={mobileCardTopStyle}>
                    <div>
                      <div style={registryTitleStyle}>{route.label}</div>
                      <div style={registrySubStyle}>{route.href}</div>
                    </div>
                    <Badge tone={statusTone(route.status)}>{route.status}</Badge>
                  </div>
                  <div style={mobileMetaGridStyle}>
                    <MetaLine label="Module" value={route.module_label || route.module_key} />
                    <MetaLine label="Permission" value={route.permission_key} />
                    <MetaLine label="Module permission" value={route.module_permission_key || '—'} />
                    <MetaLine label="Last seen" value={formatShortDate(route.last_seen_at)} />
                  </div>
                </article>
              ))}
            </div>
          </div>

          {!filteredRoutes.length ? <EmptyState text="No route rows match the current filter." /> : null}
        </section>

        <section style={panelStyle}>
          <SectionHeader eyebrow="Phase 2" title="Role Template Studio" subtitle="Registry rows are ready now. Editing and application remain disabled until Phase 2." />
          <div className="uag-toolbar" style={toolbarStyle}>
            <input value={templateQuery} onChange={(event) => setTemplateQuery(event.target.value)} placeholder="Filter templates..." style={searchStyle} />
            <SmallStat label="Templates" value={String(filteredTemplates.length)} />
            <SmallStat label="System" value={String(registry.templates.filter((template) => template.is_system).length)} tone="green" />
          </div>

          <div style={tableShellStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <Th>Template</Th>
                  <Th>Role</Th>
                  <Th>Permissions</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((template) => (
                  <tr key={template.id}>
                    <Td>
                      <div style={userNameStyle}>{template.template_label}</div>
                      <div style={userSubStyle}>{template.template_key}</div>
                    </Td>
                    <Td>{template.role || '—'}</Td>
                    <Td>{template.permissions.length}</Td>
                    <Td><Badge tone={statusTone(template.status)}>{template.status}</Badge></Td>
                    <Td><button type="button" style={disabledButtonStyle} disabled title="Template editing is reserved for Phase 2.">Phase 2</button></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!filteredTemplates.length ? <EmptyState text="No role templates match the current filter." /> : null}
        </section>
      </div>

      <section style={panelStyle}>
        <SectionHeader eyebrow="Registry Log" title="Latest Events & Scan Runs" subtitle="Chronological registry events generated by the scan pipeline." />
        <div className="events-dual" style={eventGridStyle}>
          <div>
            <SubHeader title="Events" detail="Latest registry events" />
            <div style={scrollBoxStyle}>
              {events.length ? events.map((event) => (
                <div key={event.id} style={eventItemStyle}>
                  <div style={eventTopStyle}>
                    <Badge tone={statusTone(event.event_type)}>{event.event_type}</Badge>
                    <span style={eventTimeStyle}>{formatShortDate(event.created_at)}</span>
                  </div>
                  <div style={eventMessageStyle}>{event.message || '—'}</div>
                  <div style={eventMetaStyle}>{event.module_key || event.route_href || 'General registry event'}</div>
                </div>
              )) : <EmptyState text="No registry events yet." />}
            </div>
          </div>

          <div>
            <SubHeader title="Scan Runs" detail="Latest scan executions" />
            <div style={scrollBoxStyle}>
              {scans.length ? scans.map((scan) => (
                <div key={String(scan.id || scan.created_at)} style={eventItemStyle}>
                  <div style={eventTopStyle}>
                    <Badge tone={statusTone(String(scan.status || 'completed'))}>{String(scan.status || 'completed')}</Badge>
                    <span style={eventTimeStyle}>{formatShortDate(String(scan.created_at || ''))}</span>
                  </div>
                  <div style={eventMessageStyle}>{String(scan.scan_type || 'app_routes_scan')}</div>
                  <div style={eventMetaStyle}>
                    {String(scan.modules_detected || 0)} modules, {String(scan.routes_detected || 0)} routes, {String(scan.stale_routes || 0)} stale routes
                  </div>
                </div>
              )) : <EmptyState text="No scan runs yet." />}
            </div>
          </div>
        </div>
      </section>

      {selectedPreview ? (
        <div style={modalOverlayStyle} onClick={() => setSelectedPreview(null)}>
          <aside style={modalStyle} onClick={(event) => event.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div>
                <div style={eyebrowStyle}>Access Preview</div>
                <h2 style={modalTitleStyle}>{selectedPreview.user.fullName}</h2>
                <div style={userSubStyle}>{selectedPreview.user.email || '—'} · {selectedPreview.user.role || '—'} · {selectedPreview.user.status || '—'}</div>
              </div>
              <button type="button" onClick={() => setSelectedPreview(null)} style={closeButtonStyle}>Close</button>
            </div>

            <div style={previewBadgeRowStyle}>
              <Badge tone={selectedPreview.fullAccess ? 'green' : 'blue'}>{selectedPreview.fullAccess ? 'Full access' : 'Scoped access'}</Badge>
              <Badge tone={statusTone(selectedPreview.status)}>{selectedPreview.status || '—'}</Badge>
              <Badge tone="slate">{selectedPreview.permissions.length} permissions</Badge>
              <Badge tone="slate">{selectedPreview.moduleCount} modules</Badge>
              <Badge tone="slate">{selectedPreview.routeCount} routes</Badge>
            </div>

            <div className="preview-grid" style={previewGridStyle}>
              <PreviewCard label="Department" value={selectedPreview.user.department || '—'} />
              <PreviewCard label="Job title" value={selectedPreview.user.jobTitle || '—'} />
              <PreviewCard label="Registry version" value={selectedPreview.registryVersion ? formatShortDate(selectedPreview.registryVersion.createdAt) : '—'} />
              <PreviewCard label="Latest scan" value={selectedPreview.latestScan ? formatShortDate(selectedPreview.latestScan.created_at) : '—'} />
            </div>

            <div style={previewSectionStyle}>
              <SubHeader title="Assigned Modules" detail="Modules with at least one accessible route" />
              <div style={tagListStyle}>
                {selectedPreview.assignedModules.length ? selectedPreview.assignedModules.map((module) => <span key={module.moduleKey} style={tagStyle}>{module.moduleLabel || module.moduleKey} · {module.routeCount}</span>) : <EmptyState text="No assigned modules detected." />}
              </div>
            </div>

            <div style={previewSectionStyle}>
              <SubHeader title="Assigned Routes" detail="Routes currently reachable from app_users.permissions" />
              <div style={scrollBoxStyle}>
                {selectedPreview.assignedRoutes.length ? selectedPreview.assignedRoutes.map((route) => (
                  <div key={route.href} style={eventItemStyle}>
                    <div style={eventMessageStyle}>{route.label}</div>
                    <div style={eventMetaStyle}>{route.href} · {route.permissionKey}</div>
                  </div>
                )) : <EmptyState text="No assigned routes detected." />}
              </div>
            </div>

            <div style={previewSectionStyle}>
              <SubHeader title="Blocked Routes" detail="Routes the current permissions do not cover" />
              <div style={scrollBoxStyle}>
                {selectedPreview.deniedRoutes.length ? selectedPreview.deniedRoutes.map((route) => (
                  <div key={route.href} style={eventItemStyle}>
                    <div style={eventMessageStyle}>{route.label}</div>
                    <div style={eventMetaStyle}>{route.href}</div>
                    <div style={tagListStyle}>
                      {route.missingPermissions.map((permission) => <span key={permission} style={tagStyle}>{permission}</span>)}
                    </div>
                  </div>
                )) : <EmptyState text="No blocked routes." />}
              </div>
            </div>

            <div style={previewSectionStyle}>
              <SubHeader title="Stale Assigned Permissions" detail="Permissions still stored on the user that no longer exist in the registry" />
              <div style={tagListStyle}>
                {selectedPreview.staleAssignedPermissions.length ? selectedPreview.staleAssignedPermissions.map((permission) => <span key={permission} style={warningTagStyle}>{permission}</span>) : <EmptyState text="No stale assigned permissions." />}
              </div>
            </div>

            <div style={modalActionsStyle}>
              {canEditUser ? <Link href={`/users/${selectedPreview.user.id}/edit`} style={linkButtonStyle}>Edit User Permissions</Link> : <button type="button" style={disabledButtonStyle} disabled title="Requires CEO or Manager.">Edit User Permissions</button>}
              <button type="button" onClick={() => setSelectedPreview(null)} style={secondaryModalButtonStyle}>Close</button>
            </div>
          </aside>
        </div>
      ) : null}

      {previewError ? <div style={errorBannerStyle}>{previewError}</div> : null}
      {previewBusy ? <div style={infoBannerStyle}>Loading access preview...</div> : null}

      <style jsx global>{`
        .desktop-only { display: block; }
        .mobile-only { display: none; }
        @media (max-width: 980px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: block !important; }
          .uag-hero { grid-template-columns: 1fr !important; }
          .uag-kpi { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .uag-two { grid-template-columns: 1fr !important; }
          .scan-summary, .scan-dual, .events-dual, .preview-grid, .uag-toolbar { grid-template-columns: 1fr !important; }
          .uag-toolbar { justify-content: stretch !important; }
        }
        @media (max-width: 640px) {
          .uag-kpi { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function ActionButton({
  children,
  onClick,
  disabled,
  tone,
  reason,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  tone: 'primary' | 'secondary' | 'ghost'
  reason?: string
}) {
  const style = tone === 'primary' ? primaryButtonStyle : tone === 'secondary' ? secondaryButtonStyle : ghostButtonStyle
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={reason} style={disabled ? disabledButtonStyle : style}>
      {children}
    </button>
  )
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div style={sectionHeaderStyle}>
      <div style={eyebrowStyle}>{eyebrow}</div>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <p style={sectionSubtitleStyle}>{subtitle}</p>
    </div>
  )
}

function SubHeader({ title, detail }: { title: string; detail: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={subTitleStyle}>{title}</div>
      <div style={subDetailStyle}>{detail}</div>
    </div>
  )
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: StatusTone }) {
  return (
    <div style={{ ...metricCardStyle, ...toneStyles[tone] }}>
      <div style={metricValueStyle}>{value}</div>
      <div style={metricLabelStyle}>{label}</div>
    </div>
  )
}

function MetaChip({ label, value, tone }: { label: string; value: string; tone: StatusTone }) {
  return (
    <div style={{ ...metaChipStyle, ...toneChipStyles[tone] }}>
      <span style={metaChipLabelStyle}>{label}</span>
      <strong style={metaChipValueStyle}>{value}</strong>
    </div>
  )
}

function SmallStat({ label, value, tone = 'slate' }: { label: string; value: string; tone?: StatusTone }) {
  return (
    <div style={{ ...smallStatStyle, ...toneChipStyles[tone] }}>
      <span style={smallStatLabelStyle}>{label}</span>
      <strong style={smallStatValueStyle}>{value}</strong>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={statBlockStyle}>
      <span style={smallStatLabelStyle}>{label}</span>
      <strong style={metricValueStyle}>{value}</strong>
    </div>
  )
}

function Badge({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return <span style={{ ...badgeStyle, ...toneBadgeStyles[tone] }}>{children}</span>
}

function PreviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={previewCardStyle}>
      <span style={smallStatLabelStyle}>{label}</span>
      <strong style={previewCardValueStyle}>{value}</strong>
    </div>
  )
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={metaLineStyle}>
      <span style={metaLineLabelStyle}>{label}</span>
      <strong style={metaLineValueStyle}>{value}</strong>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={thStyle}>{children}</th>
}

function Td({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return <td style={{ ...tdStyle, ...style }}>{children}</td>
}

const rootStyle: CSSProperties = { display: 'grid', gap: 18 }
const heroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18, alignItems: 'start', borderRadius: 30, padding: 26, background: 'linear-gradient(135deg,#ffffff 0%,#f8fbff 45%,#eef4ff 100%)', border: '1px solid #dbe5f2', boxShadow: '0 24px 60px rgba(15,23,42,.06)' }
const eyebrowStyle: CSSProperties = { display: 'inline-flex', width: 'fit-content', padding: '6px 10px', borderRadius: 999, background: '#eef2ff', color: '#3730a3', fontWeight: 950, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }
const titleStyle: CSSProperties = { margin: '10px 0 8px', color: '#0f172a', fontSize: 38, lineHeight: 1.05, fontWeight: 1000, letterSpacing: '-.04em' }
const subtitleStyle: CSSProperties = { margin: 0, color: '#475569', fontSize: 15, lineHeight: 1.7, fontWeight: 650, maxWidth: 760 }
const metaRowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }
const actionsStyle: CSSProperties = { display: 'grid', gap: 10, justifyItems: 'stretch' }
const panelStyle: CSSProperties = { background: '#fff', border: '1px solid #dbe5f2', borderRadius: 28, padding: 22, boxShadow: '0 20px 48px rgba(15,23,42,.05)' }
const sectionHeaderStyle: CSSProperties = { marginBottom: 16 }
const sectionTitleStyle: CSSProperties = { margin: '6px 0 6px', color: '#0f172a', fontSize: 22, fontWeight: 950 }
const sectionSubtitleStyle: CSSProperties = { margin: 0, color: '#64748b', lineHeight: 1.65, fontWeight: 650 }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }
const metricCardStyle: CSSProperties = { borderRadius: 20, padding: 16, border: '1px solid #dbe5f2', background: '#fff', display: 'grid', gap: 6, minWidth: 0 }
const metricValueStyle: CSSProperties = { color: '#0f172a', fontSize: 24, fontWeight: 950, lineHeight: 1.1 }
const metricLabelStyle: CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em' }
const toneStyles: Record<StatusTone, CSSProperties> = {
  green: { boxShadow: 'inset 0 0 0 1px rgba(34,197,94,.08)' },
  amber: { boxShadow: 'inset 0 0 0 1px rgba(245,158,11,.08)' },
  red: { boxShadow: 'inset 0 0 0 1px rgba(239,68,68,.08)' },
  blue: { boxShadow: 'inset 0 0 0 1px rgba(59,130,246,.08)' },
  slate: { boxShadow: 'inset 0 0 0 1px rgba(148,163,184,.08)' },
}
const toneChipStyles: Record<StatusTone, CSSProperties> = {
  green: { background: '#ecfdf5', color: '#166534' },
  amber: { background: '#fffbeb', color: '#92400e' },
  red: { background: '#fef2f2', color: '#991b1b' },
  blue: { background: '#eff6ff', color: '#1d4ed8' },
  slate: { background: '#f8fafc', color: '#334155' },
}
const metaChipStyle: CSSProperties = { display: 'grid', gap: 4, minWidth: 180, padding: '12px 14px', borderRadius: 16, border: '1px solid #dbe5f2' }
const metaChipLabelStyle: CSSProperties = { color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 900 }
const metaChipValueStyle: CSSProperties = { color: '#0f172a', fontSize: 13, fontWeight: 850, lineHeight: 1.4 }
const toolbarStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', marginBottom: 16 }
const toolbarMetaStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }
const searchStyle: CSSProperties = { width: '100%', borderRadius: 16, border: '1px solid #cbd5e1', padding: '13px 14px', outline: 'none', fontWeight: 750, color: '#0f172a', background: '#fff' }
const tableShellStyle: CSSProperties = { overflow: 'hidden', borderRadius: 22, border: '1px solid #e2e8f0' }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'separate', borderSpacing: 0 }
const thStyle: CSSProperties = { padding: '13px 14px', textAlign: 'left', background: '#f8fafc', color: '#334155', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 900, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }
const tdStyle: CSSProperties = { padding: '14px', borderBottom: '1px solid #eef2f7', color: '#0f172a', verticalAlign: 'top', fontSize: 13, fontWeight: 650 }
const userCellStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }
const avatarStyle: CSSProperties = { width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg,#2563eb,#38bdf8)', color: '#fff', fontWeight: 1000, display: 'grid', placeItems: 'center', flexShrink: 0 }
const userNameStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a', fontWeight: 900, minWidth: 0 }
const userSubStyle: CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 650, marginTop: 3, wordBreak: 'break-word' }
const selfBadgeStyle: CSSProperties = { padding: '3px 7px', borderRadius: 999, background: '#dbeafe', color: '#1d4ed8', fontSize: 11, fontWeight: 900 }
const currentUserRowStyle: CSSProperties = { background: '#f8fbff' }
const actionGroupStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const miniLinkStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 11px', borderRadius: 999, background: '#fff', border: '1px solid #cbd5e1', color: '#0f172a', textDecoration: 'none', fontWeight: 850, fontSize: 12 }
const miniDangerLinkStyle: CSSProperties = { ...miniLinkStyle, borderColor: '#fecaca', color: '#991b1b', background: '#fff5f5' }
const miniDisabledButtonStyle: CSSProperties = { ...miniLinkStyle, cursor: 'not-allowed', opacity: .55 }
const disabledButtonStyle: CSSProperties = { ...miniLinkStyle, cursor: 'not-allowed', opacity: .55 }
const primaryButtonStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 0, padding: '12px 14px', borderRadius: 16, background: 'linear-gradient(135deg,#1d4ed8,#0f172a)', color: '#fff', fontWeight: 950, cursor: 'pointer', boxShadow: '0 14px 30px rgba(29,78,216,.18)' }
const secondaryButtonStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', padding: '12px 14px', borderRadius: 16, background: '#fff', color: '#0f172a', fontWeight: 950, cursor: 'pointer' }
const ghostButtonStyle: CSSProperties = { ...secondaryButtonStyle, background: '#f8fafc' }
const linkButtonStyle: CSSProperties = { ...primaryButtonStyle, textDecoration: 'none' }
const errorBannerStyle: CSSProperties = { padding: '12px 14px', borderRadius: 16, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontWeight: 800 }
const infoBannerStyle: CSSProperties = { padding: '12px 14px', borderRadius: 16, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 800 }
const smallStatStyle: CSSProperties = { display: 'grid', gap: 3, padding: '10px 12px', borderRadius: 14, border: '1px solid #dbe5f2', minWidth: 110 }
const smallStatLabelStyle: CSSProperties = { color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 900 }
const smallStatValueStyle: CSSProperties = { color: '#0f172a', fontSize: 13, fontWeight: 850 }
const statBlockStyle: CSSProperties = { display: 'grid', gap: 4, padding: 14, borderRadius: 16, border: '1px solid #dbe5f2', background: '#fff' }
const scanSummaryStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginBottom: 18 }
const twoColumnStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 18 }
const listGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }
const scrollBoxStyle: CSSProperties = { display: 'grid', gap: 10, maxHeight: 360, overflow: 'auto', paddingRight: 2 }
const registryItemStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 12, borderRadius: 16, border: '1px solid #e2e8f0', background: '#f8fafc' }
const registryTitleStyle: CSSProperties = { color: '#0f172a', fontWeight: 900 }
const registrySubStyle: CSSProperties = { color: '#64748b', fontSize: 12, marginTop: 3, wordBreak: 'break-word' }
const eventGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }
const eventItemStyle: CSSProperties = { display: 'grid', gap: 6, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#f8fafc' }
const eventTopStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }
const eventTimeStyle: CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 700 }
const eventMessageStyle: CSSProperties = { color: '#0f172a', fontWeight: 850, lineHeight: 1.5 }
const eventMetaStyle: CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 650, wordBreak: 'break-word' }
const modalOverlayStyle: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.48)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 80 }
const modalStyle: CSSProperties = { width: 'min(920px, 100%)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 28, border: '1px solid #dbe5f2', boxShadow: '0 30px 80px rgba(15,23,42,.28)', padding: 22, display: 'grid', gap: 16 }
const modalHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 16 }
const modalTitleStyle: CSSProperties = { margin: '8px 0 4px', color: '#0f172a', fontSize: 28, fontWeight: 1000, lineHeight: 1.1 }
const closeButtonStyle: CSSProperties = { border: '1px solid #cbd5e1', background: '#fff', borderRadius: 14, padding: '10px 12px', color: '#0f172a', fontWeight: 850, cursor: 'pointer' }
const previewBadgeRowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const previewGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }
const previewCardStyle: CSSProperties = { display: 'grid', gap: 6, padding: 14, borderRadius: 18, border: '1px solid #dbe5f2', background: '#f8fafc' }
const previewCardValueStyle: CSSProperties = { color: '#0f172a', fontWeight: 900, wordBreak: 'break-word' }
const previewSectionStyle: CSSProperties = { display: 'grid', gap: 10 }
const metaLineStyle: CSSProperties = { display: 'grid', gap: 4, padding: 12, borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff' }
const metaLineLabelStyle: CSSProperties = { color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 900 }
const metaLineValueStyle: CSSProperties = { color: '#0f172a', fontSize: 13, fontWeight: 850, wordBreak: 'break-word' }
const tagListStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const subTitleStyle: CSSProperties = { color: '#0f172a', fontSize: 15, fontWeight: 950 }
const subDetailStyle: CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 650, marginTop: 2, lineHeight: 1.5 }
const tagStyle: CSSProperties = { display: 'inline-flex', padding: '7px 10px', borderRadius: 999, background: '#eef2ff', color: '#3730a3', fontWeight: 850, fontSize: 12 }
const warningTagStyle: CSSProperties = { ...tagStyle, background: '#fffbeb', color: '#92400e' }
const modalActionsStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', paddingTop: 8 }
const secondaryModalButtonStyle: CSSProperties = { ...secondaryButtonStyle, textDecoration: 'none' }
const emptyStyle: CSSProperties = { padding: 18, textAlign: 'center', borderRadius: 16, border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 750, background: '#fff' }
const mobileListStyle: CSSProperties = { display: 'grid', gap: 12 }
const mobileCardStyle: CSSProperties = { display: 'grid', gap: 12, borderRadius: 22, padding: 16, border: '1px solid #dbe5f2', background: '#fff' }
const mobileCardTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }
const mobileMetaGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const mobileActionStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const badgeStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' }
const newBadgeStyle: CSSProperties = { marginLeft: 8, padding: '2px 7px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 900 }
const toneBadgeStyles: Record<StatusTone, CSSProperties> = {
  green: { background: '#dcfce7', color: '#166534' },
  amber: { background: '#fffbeb', color: '#92400e' },
  red: { background: '#fee2e2', color: '#991b1b' },
  blue: { background: '#dbeafe', color: '#1d4ed8' },
  slate: { background: '#e2e8f0', color: '#334155' },
}
