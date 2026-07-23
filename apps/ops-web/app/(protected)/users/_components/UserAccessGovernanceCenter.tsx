'use client'

import { OperationCompletionManagerButton } from '@/components/operation-completion/OperationCompletionEngine'
import Link from 'next/link'
import {useEffect, useMemo, useState, type CSSProperties, type ReactNode} from 'react'
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
import ActionProgressPanel from '@/components/shared/ActionProgressPanel'
import BroadcastControlTower from './BroadcastControlTower'
import { useActionProgress } from '@/hooks/useActionProgress'
import type { PermissionCatalogResponse } from '@/lib/users/access-governance/permission-catalog'
import GlobalAccessRegistryScannerModal from './GlobalAccessRegistryScannerModal'

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
type UsersPageMode = 'governance' | 'activities' | 'attendance' | 'messages'

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

  const [activeUsersPage, setActiveUsersPage] = useState<UsersPageMode>('governance')
  const [directoryStatus, setDirectoryStatus] = useState('all')
  const [directoryDepartment, setDirectoryDepartment] = useState('all')
  const [directorySort, setDirectorySort] = useState<'name' | 'readiness' | 'recent'>('name')
  const [advancedGovernanceOpen, setAdvancedGovernanceOpen] = useState(false)


  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const shouldOpenAttendance =
      params.get('workspace') === 'attendance' ||
      params.get('attendanceA4Bridge') === '1' ||
      params.has('attendanceEmployeeId') ||
      params.has('attendanceEmail')

    if (shouldOpenAttendance) {
      setActiveUsersPage('attendance')
    }
  }, [])
const [moduleQuery, setModuleQuery] = useState('')
  const [routeQuery, setRouteQuery] = useState('')
  const [templateQuery, setTemplateQuery] = useState('')
  const [selectedPreview, setSelectedPreview] = useState<AccessGovernancePreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [scanBusy, setScanBusy] = useState(false)
  const [refreshBusy, setRefreshBusy] = useState(false)
  const [previewBusy, setPreviewBusy] = useState(false)
  const [scanSummary, setScanSummary] = useState<AccessGovernanceScanSummary | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const actionProgress = useActionProgress()
  const [permissionCatalog, setPermissionCatalog] = useState<{
    modules: number
    routes: number
    permissions: number
    loadedAt: string | null
    message: string | null
    error: string | null
  }>({
    modules: 0,
    routes: 0,
    permissions: 0,
    loadedAt: null,
    message: null,
    error: null,
  })

  useEffect(() => {
    setRegistry(initialRegistry)
    setRegistryMessage(registryError)
    setEvents(initialEvents)
    setScans(initialScans)
  }, [initialRegistry, registryError, initialEvents, initialScans])

  useEffect(() => {
    void refreshPermissionCatalog()
  }, [])

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

  const directoryDepartments = useMemo(
    () => Array.from(new Set(users.map((user) => String(user.department || '').trim()).filter((value) => value && value !== '—'))).sort((a, b) => a.localeCompare(b)),
    [users],
  )

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = users.filter((user) => {
      const userStatus = String(user.status || user.rawUser?.status || '').toLowerCase()
      const statusMatches = directoryStatus === 'all' || userStatus === directoryStatus
      const departmentMatches = directoryDepartment === 'all' || String(user.department || '') === directoryDepartment
      const haystack = [
        user.fullName,
        user.username,
        user.email,
        user.role,
        user.department,
        user.position,
        user.city,
        user.phone,
        userStatus,
      ].join(' ').toLowerCase()
      return statusMatches && departmentMatches && (!q || haystack.includes(q))
    })

    return [...filtered].sort((a, b) => {
      if (directorySort === 'readiness') return Number(b.readiness || 0) - Number(a.readiness || 0)
      if (directorySort === 'recent') {
        const aTime = new Date(String(a.rawUser?.updated_at || a.createdAt || 0)).getTime() || 0
        const bTime = new Date(String(b.rawUser?.updated_at || b.createdAt || 0)).getTime() || 0
        return bTime - aTime
      }
      return String(a.fullName || a.email || '').localeCompare(String(b.fullName || b.email || ''))
    })
  }, [users, query, directoryStatus, directoryDepartment, directorySort])

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
    actionProgress.startAction({
      title: 'Refresh Permission Control',
      subtitle: 'Reloading access registry, permission catalog and governance events.',
      steps: [
        { id: 'registry', label: 'Load module and route registry', percent: 30 },
        { id: 'events', label: 'Load governance events', percent: 65 },
        { id: 'catalog', label: 'Refresh permission control', percent: 90 },
        { id: 'complete', label: 'Refresh complete', percent: 100 },
      ],
    })
    actionProgress.setStep('registry', 'running', 'Loading module and route registry…', 30)
    const [registryResult, eventsResult] = await Promise.all([
      fetchJson<{ ok: boolean; modules: AccessModuleRegistryRow[]; routes: AccessRouteRegistryRow[]; resources: AccessGovernanceRegistrySnapshot['resources']; templates: AccessGovernanceRegistrySnapshot['templates']; latestScan: AccessGovernanceRegistrySnapshot['latestScan']; latestVersion: AccessGovernanceRegistrySnapshot['latestVersion']; stats: AccessGovernanceRegistrySnapshot['stats'] }>('/api/users/access-governance/registry'),
      fetchJson<{ ok: boolean; events: AccessRegistryEventRow[]; scans: Array<Record<string, unknown>> }>('/api/users/access-governance/events'),
    ])

    if (registryResult.ok) {
      actionProgress.setStep('registry', 'done', 'Registry loaded.', 50)
      setRegistry({
        modules: registryResult.data.modules,
        routes: registryResult.data.routes,
        resources: registryResult.data.resources || [],
        templates: registryResult.data.templates,
        latestScan: registryResult.data.latestScan,
        latestVersion: registryResult.data.latestVersion || null,
        stats: registryResult.data.stats,
      })
      setRegistryMessage(null)
    } else {
      setRegistryMessage(registryResult.error)
    }

    if (eventsResult.ok) {
      actionProgress.setStep('events', 'done', 'Governance events loaded.', 75)
      setEvents(eventsResult.data.events)
      setScans(eventsResult.data.scans)
    }

    if (registryResult.ok) {
      actionProgress.setStep('catalog', 'done', 'Permission control refreshed from latest registry.', 95)
      actionProgress.completeAction('Permission control is ready.', {
        modules: registryResult.data.modules?.length || 0,
        routes: registryResult.data.routes?.length || 0,
      })
    } else {
      actionProgress.failAction(registryResult.error)
    }

    setRefreshBusy(false)
  }

  async function refreshPermissionCatalog(message?: string) {
    const result = await fetchJson<PermissionCatalogResponse>('/api/users/access-governance/permission-catalog')
    if (result.ok) {
      setPermissionCatalog({
        modules: result.data.modules.length,
        routes: result.data.flatPermissions.filter((permission) => permission.type === 'route').length,
        permissions: result.data.flatPermissions.length,
        loadedAt: new Date().toISOString(),
        message: message || result.data.message || null,
        error: null,
      })
      return
    }

    setPermissionCatalog((current) => ({
      ...current,
      loading: false,
      error: result.error,
      message: message || null,
    }))
  }

  async function runScan() {
    if (!canManageGovernance || scanBusy) return
    setScanBusy(true)
    setRegistryMessage(null)
    actionProgress.startAction({
      title: 'Run App Access Scan',
      subtitle: 'Scanning app surfaces and updating the access governance registry.',
      steps: [
        { id: 'auth', label: 'Validate admin authorization', percent: 10 },
        { id: 'scan', label: 'Scan modules and routes', percent: 40 },
        { id: 'registry', label: 'Update access registry', percent: 70 },
        { id: 'catalog', label: 'Refresh permission control', percent: 90 },
        { id: 'complete', label: 'Scan complete', percent: 100 },
      ],
    })
    actionProgress.setStep('auth', 'running', 'Preparing access scan…', 10)
    actionProgress.setStep('scan', 'running', 'Calling scan API…', 35)
    const result = await fetchJson<AccessGovernanceScanSummary>('/api/users/access-governance/scan', { method: 'POST' })
    if (result.ok) {
      setScanSummary(result.data)
      await refreshRegistry('Scan completed. Registry refreshed from APP_ROUTES.')
      await refreshPermissionCatalog('Permission control refreshed from the latest registry scan.')
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
    actionProgress.startAction({
      title: 'Open Access Preview',
      subtitle: `Building access preview for ${user.fullName || user.username || 'selected user'}.`,
      steps: [
        { id: 'load', label: 'Load user permissions', percent: 35 },
        { id: 'compare', label: 'Compare with route registry', percent: 70 },
        { id: 'complete', label: 'Preview ready', percent: 100 },
      ],
    })
    actionProgress.setStep('load', 'running', 'Loading assigned permissions and registry state…', 35)
    const result = await fetchJson<AccessGovernancePreview>(`/api/users/access-governance/users/${user.id}/preview`)
    if (result.ok) {
      actionProgress.setStep('compare', 'done', 'Access preview calculated.', 80)
      setSelectedPreview(result.data)
      actionProgress.completeAction('Access preview opened successfully.', {
        assignedRoutes: result.data.assignedRoutes?.length || 0,
        deniedRoutes: result.data.deniedRoutes?.length || 0,
      })
    } else {
      setPreviewError(result.error)
      actionProgress.failAction(result.error)
    }
    setPreviewBusy(false)
  }

  const scanHeadline = scanPayload?.latestScanAt || latestScan?.created_at || null
  const scanModules = scanPayload?.modules || []
  const scanRoutes = scanPayload?.routes || []
  return (
    <div style={rootStyle}>
      <ActionProgressPanel progress={actionProgress.progress} onClose={actionProgress.closeProgress} />
      <GlobalAccessRegistryScannerModal
        open={scannerOpen}
        canManage={canManageGovernance}
        onClose={() => setScannerOpen(false)}
        onPublished={async (published) => {
          setScanSummary(published)
          await refreshRegistry('Global registry published and synchronized.')
          await refreshPermissionCatalog('Permission catalog refreshed with modules, route families, groups and standalone pages.')
        }}
        onRegistryChanged={async () => {
          await refreshRegistry('Registry version restored and synchronized.')
          await refreshPermissionCatalog('Permission catalog refreshed after registry rollback.')
        }}
      />
      {registryMessage ? <div style={errorBannerStyle}>{registryMessage}</div> : null}

      <section style={heroStyle} className="uag-hero">
        <div aria-hidden="true" style={heroGlowOneStyle} />
        <div aria-hidden="true" style={heroGlowTwoStyle} />
        <div style={heroIdentityColumnStyle}>
          <div style={brandLockupStyle}>
            <div style={brandLogoPlateStyle}>
              <img src="/logo.png" alt="ANGELCARE" style={brandLogoStyle} />
            </div>
            <div>
              <div style={brandKickerStyle}>ANGELCARE SANILA OS</div>
              <div style={brandSublineStyle}>People · Identity · Access Command</div>
            </div>
          </div>

          <div style={heroCopyStyle}>
            <div style={eyebrowStyle}>Enterprise Workforce Control Plane</div>
            <h1 style={titleStyle}>Users, Identity & Access Excellence</h1>
            <p style={subtitleStyle}>A privileged command environment for governing every staff identity, operating role, access surface, activity signal and attendance obligation across ANGELCARE.</p>
          </div>

          <div style={heroSignalGridStyle}>
            <HeroSignal icon="◉" label="Workforce identities" value={String(users.length)} detail={`${activeUsers} active members`} tone="blue" />
            <HeroSignal icon="✓" label="Identity readiness" value={`${users.length ? Math.round(users.reduce((sum, user) => sum + Number(user.readiness || 0), 0) / users.length) : 0}%`} detail="Average staff-file completion" tone="green" />
            <HeroSignal icon="⌁" label="Access estate" value={String(registry.stats.totalRoutes)} detail={`${registry.stats.totalModules} governed modules`} tone="purple" />
            <HeroSignal icon="◆" label="Registry posture" value={healthLabel} detail={scanHeadline ? `Last scan ${formatShortDate(scanHeadline)}` : 'Scan readiness available'} tone={healthTone === 'red' ? 'red' : healthTone === 'amber' ? 'amber' : 'slate'} />
          </div>

          <div style={metaRowStyle}>
            <MetaChip tone="blue" label="Command synchronized" value={formatDate(loadedAt)} />
            <MetaChip tone={healthTone} label="Registry health" value={healthLabel} />
            <MetaChip tone="slate" label="Your clearance" value={currentUserRole || '—'} />
          </div>
        </div>

        <div style={heroCommandColumnStyle}>
          <div style={commandColumnHeaderStyle}>
            <span style={commandLiveDotStyle} />
            <div>
              <strong style={commandColumnTitleStyle}>Executive actions</strong>
              <span style={commandColumnSubtitleStyle}>Authorized controls available in your current session</span>
            </div>
          </div>
          <div style={actionsStyle}>
            {canCreateUser ? (
              <Link href="/users/new" style={heroPrimaryLinkStyle}><span style={actionIconStyle}>＋</span><span><strong>Create staff identity</strong><small>Provision account, role and permissions</small></span></Link>
            ) : (
              <button type="button" style={heroDisabledActionStyle} disabled title="Requires CEO, Manager, or Admin.">Create staff identity</button>
            )}
            <ActionButton onClick={() => setScannerOpen(true)} disabled={!canManageGovernance} tone="primary" reason={canRender(canManageGovernance, 'Requires CEO, Admin, Manager, or users.manage.')}>
              Open Global Registry Scanner
            </ActionButton>
            <div style={heroSecondaryActionGridStyle}>
              <ActionButton onClick={() => refreshRegistry()} disabled={refreshBusy} tone="secondary">
                {refreshBusy ? 'Refreshing...' : 'Refresh Registry'}
              </ActionButton>
              <ActionButton onClick={() => void refreshPermissionCatalog('Permission control refreshed.')} disabled={refreshBusy} tone="ghost">
                Refresh Permissions
              </ActionButton>
            </div>
          </div>
          <div style={commandTrustPanelStyle}>
            <div style={commandTrustTopStyle}><span>Secure identity fabric</span><strong>{inactiveUsers ? `${inactiveUsers} attention` : 'All clear'}</strong></div>
            <div style={commandTrustTrackStyle}><span style={{ ...commandTrustFillStyle, width: `${users.length ? Math.round((activeUsers / users.length) * 100) : 0}%` }} /></div>
            <p style={commandTrustCopyStyle}>Every visible action remains governed by the existing role, permission and route-access controls.</p>
          </div>
        </div>
      </section>

      <section style={modeSwitcherStyle}>
        <div style={modeSwitcherHeaderStyle}>
          <div style={modeSwitcherKickerStyle}>SANILA COMMAND WORKSPACES</div>
          <div style={subTitleStyle}>Choose the operational lens you need</div>
          <div style={subDetailStyle}>Each workspace keeps the same authenticated records and backend contracts while presenting a purpose-built executive experience.</div>
        </div>
        <div className="users-command-grid" style={modeButtonRowStyle}>
          <WorkspaceModeButton active={activeUsersPage === 'governance'} icon="◫" title="People & Access" detail="Directory, permissions and registry" onClick={() => setActiveUsersPage('governance')} />
          <WorkspaceModeButton active={activeUsersPage === 'activities'} icon="⌁" title="Activity Intelligence" detail="Sessions, devices and behavior" onClick={() => setActiveUsersPage('activities')} />
          <WorkspaceModeButton active={activeUsersPage === 'attendance'} icon="◷" title="Attendance Command" detail="Presence, shifts and exceptions" onClick={() => setActiveUsersPage('attendance')} />
          <WorkspaceModeButton active={activeUsersPage === 'messages'} icon="✦" title="Broadcast Control" detail="Memos, acknowledgement and follow-up" onClick={() => setActiveUsersPage('messages')} />
          <div style={operationCommandStyle}><OperationCompletionManagerButton /></div>
        </div>
      </section>

      {activeUsersPage === 'messages' ? (
        <BroadcastControlTower />
      ) : activeUsersPage === 'activities' ? (
        <UsersActivitiesInPage
          users={users}
          registry={registry}
          events={events}
          canEditUser={canEditUser}
          canOpenProfile={canOpenProfile}
          canPreviewGovernance={canPreviewGovernance}
          previewBusy={previewBusy}
          openPreview={openPreview}
        />
      ) : activeUsersPage === 'attendance' ? (
        <UsersAttendanceInPage
          users={users}
          canOpenProfile={canOpenProfile}
        />
      ) : (
      <>

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
        <div style={permissionControlStyle}>
          <div>
            <div style={subTitleStyle}>Permission control</div>
            <div style={subDetailStyle}>Live catalog used by create and edit user forms after the latest scan.</div>
          </div>
          <div style={permissionControlStatsStyle}>
            <SmallStat label="Modules available" value={String(permissionCatalog.modules)} tone="blue" />
            <SmallStat label="Routes available" value={String(permissionCatalog.routes)} tone="green" />
            <SmallStat label="Permissions available" value={String(permissionCatalog.permissions)} tone="slate" />
          </div>
          {permissionCatalog.message ? <div style={permissionControlMessageStyle}>{permissionCatalog.message}</div> : null}
          {permissionCatalog.error ? <div style={permissionControlErrorStyle}>{permissionCatalog.error}</div> : null}
          {permissionCatalog.loadedAt ? <div style={permissionControlLoadedStyle}>Last refreshed {formatDate(permissionCatalog.loadedAt)}</div> : null}
        </div>
      </section>

      <section style={panelStyle}>
        <SectionHeader eyebrow="Directory" title="Users Directory" subtitle="Open access previews, review permissions and jump to the existing edit flow." />

        <div className="directory-command-grid" style={directoryCommandBarStyle}>
          <label style={directorySearchFieldStyle}>
            <span style={directoryFieldLabelStyle}>Search the workforce</span>
            <span style={directorySearchControlStyle}><span style={directorySearchIconStyle}>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, role, department, city..." style={directorySearchInputStyle} /></span>
          </label>
          <label style={directoryFilterFieldStyle}>
            <span style={directoryFieldLabelStyle}>Account state</span>
            <select value={directoryStatus} onChange={(event) => setDirectoryStatus(event.target.value)} style={directorySelectStyle}>
              <option value="all">All account states</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
          <label style={directoryFilterFieldStyle}>
            <span style={directoryFieldLabelStyle}>Department</span>
            <select value={directoryDepartment} onChange={(event) => setDirectoryDepartment(event.target.value)} style={directorySelectStyle}>
              <option value="all">All departments</option>
              {directoryDepartments.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
          </label>
          <label style={directoryFilterFieldStyle}>
            <span style={directoryFieldLabelStyle}>Sort order</span>
            <select value={directorySort} onChange={(event) => setDirectorySort(event.target.value as 'name' | 'readiness' | 'recent')} style={directorySelectStyle}>
              <option value="name">Name A–Z</option>
              <option value="readiness">Highest readiness</option>
              <option value="recent">Recently updated</option>
            </select>
          </label>
          <button type="button" onClick={() => { setQuery(''); setDirectoryStatus('all'); setDirectoryDepartment('all'); setDirectorySort('name') }} style={directoryResetButtonStyle}>Reset filters</button>
        </div>
        <div style={directoryResultRailStyle}>
          <div style={directoryResultIdentityStyle}><span style={directoryResultPulseStyle} /><strong>{filteredUsers.length}</strong><span>visible identities from {users.length} total</span></div>
          <div style={toolbarMetaStyle}>
            <SmallStat label="Active" value={String(activeUsers)} tone="green" />
            <SmallStat label="Attention" value={String(inactiveUsers)} tone={inactiveUsers ? 'amber' : 'green'} />
            <SmallStat label="Preview" value={canPreviewGovernance ? 'Enabled' : 'Restricted'} tone={canPreviewGovernance ? 'blue' : 'amber'} />
          </div>
        </div>

        <div className="desktop-only">
          <div style={tableShellStyle}>
            <div style={premiumUsersCardScrollShellStyle}>
              <div style={premiumUsersCardGridStyle}>
                {filteredUsers.map((user) => (
                  <PremiumUsersDirectoryCard
                    key={user.id || user.email || user.username || user.fullName || user.full_name}
                    user={user}
                    canOpenProfile={canOpenProfile}
                    canEditUser={canEditUser}
                    canDeleteUsers={canDeleteUsers}
                  />
                ))}
              </div>
            </div>
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
                      <UserPortrait user={user} size={46} style={avatarStyle} />
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

      <section style={advancedGovernanceGateStyle}>
        <div style={advancedGovernanceIdentityStyle}>
          <div style={advancedGovernanceIconStyle}>⌘</div>
          <div>
            <div style={modeSwitcherKickerStyle}>ADVANCED ACCESS INTELLIGENCE</div>
            <h2 style={advancedGovernanceTitleStyle}>Registry, routes, templates and scan evidence</h2>
            <p style={advancedGovernanceCopyStyle}>The technical governance estate stays intentionally collapsed so everyday people management remains clean. Open it only when you need deep access-control diagnostics.</p>
          </div>
        </div>
        <div style={advancedGovernanceStatsStyle}>
          <SmallStat label="Modules" value={String(registry.stats.totalModules)} tone="blue" />
          <SmallStat label="Routes" value={String(registry.stats.totalRoutes)} tone="slate" />
          <SmallStat label="Stale" value={String(registry.stats.staleRoutes)} tone={registry.stats.staleRoutes ? 'amber' : 'green'} />
          <button type="button" onClick={() => setAdvancedGovernanceOpen((open) => !open)} style={advancedGovernanceButtonStyle}>
            {advancedGovernanceOpen ? 'Collapse registry intelligence' : 'Open registry intelligence'}
          </button>
        </div>
      </section>

      {advancedGovernanceOpen ? (<>
      <div className="uag-two" style={twoColumnStyle}>
        <section style={panelStyle}>
          <SectionHeader eyebrow="App Scan" title="App Access Scan Center" subtitle="Detects access surfaces only. It does not grant access automatically." />

          <div className="scan-summary" style={scanSummaryStyle}>
            <StatBlock label="Scan source" value="Global app filesystem registry v2" />
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
          <SectionHeader eyebrow="Modules" title="Module Registry" subtitle="Canonical formal modules plus independent route-family compatibility rows from the global registry." />
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
          <SectionHeader eyebrow="Routes" title="Route Registry" subtitle="All assignable pages, dynamic routes and compatibility permission keys published from the global registry." />
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
      </>) : null}

      </>)}

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
        @media (max-width: 1280px) {
          .users-command-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .directory-command-grid { grid-template-columns: minmax(240px, 1.5fr) repeat(2, minmax(170px, 1fr)) !important; }
        }
        @media (max-width: 980px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: block !important; }
          .uag-hero { grid-template-columns: 1fr !important; }
          .uag-kpi { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .uag-two { grid-template-columns: 1fr !important; }
          .scan-summary, .scan-dual, .events-dual, .preview-grid, .uag-toolbar, .directory-command-grid { grid-template-columns: 1fr !important; }
          .uag-toolbar { justify-content: stretch !important; }
        }
        @media (max-width: 720px) {
          .users-command-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .uag-kpi { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}


function UsersActivitiesInPage({
  users,
  registry,
  events,
  canEditUser,
  canOpenProfile,
  canPreviewGovernance,
  previewBusy,
  openPreview,
}: {
  users: UserStaffRecord[]
  registry: AccessGovernanceRegistrySnapshot
  events: AccessRegistryEventRow[]
  canEditUser: boolean
  canOpenProfile: boolean
  canPreviewGovernance: boolean
  previewBusy: boolean
  openPreview: (user: UserStaffRecord) => void
}) {
  const [activityQuery, setActivityQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [eventFilter, setEventFilter] = useState('all')
  const [deviceFilter, setDeviceFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('7d')
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '')

  const roles = useMemo(() => Array.from(new Set(users.map((user) => user.role).filter(Boolean))).sort(), [users])
  const statuses = useMemo(() => Array.from(new Set(users.map((user) => user.status).filter(Boolean))).sort(), [users])
  const departments = useMemo(() => Array.from(new Set(users.map((user) => user.department).filter(Boolean))).sort(), [users])
  const eventTypes = useMemo(() => Array.from(new Set(events.map((event) => event.event_type).filter(Boolean))).sort(), [events])
  const deviceTypes = useMemo(() => {
    const values = events.map((event) => String(event.payload?.device_type || event.payload?.deviceType || '')).filter(Boolean)
    return Array.from(new Set(values)).sort()
  }, [events])

  const filteredUsers = useMemo(() => {
    const q = activityQuery.trim().toLowerCase()
    return users.filter((user) => {
      const haystack = [user.fullName, user.username, user.email, user.role, user.department, user.position, user.city, user.status].join(' ').toLowerCase()
      const matchesSearch = !q || haystack.includes(q)
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter
      return matchesSearch && matchesRole && matchesStatus && matchesDepartment
    })
  }, [activityQuery, departmentFilter, roleFilter, statusFilter, users])

  useEffect(() => {
    if (!filteredUsers.length) return
    if (!filteredUsers.some((user) => user.id === selectedUserId)) setSelectedUserId(filteredUsers[0].id)
  }, [filteredUsers, selectedUserId])

  const selectedUser = filteredUsers.find((user) => user.id === selectedUserId) || filteredUsers[0] || users[0]
  const selectedCoverage = selectedUser ? coverageForUser(selectedUser, registry.routes) : { routeCount: 0, moduleCount: 0, moduleTotal: 0 }
  const selectedPermissions = selectedUser ? userPermissions(selectedUser) : []

  const allUserEvents = useMemo(() => {
    if (!selectedUser) return []
    const userKeys = [selectedUser.id, selectedUser.email, selectedUser.username].filter(Boolean).map((value) => String(value).toLowerCase())
    return events.filter((event) => {
      const payload = event.payload || {}
      const haystack = [event.message, event.module_key, event.route_href, event.actor_user_id, event.actor_email, event.event_type, JSON.stringify(payload)].join(' ').toLowerCase()
      return userKeys.some((key) => key && haystack.includes(key))
    })
  }, [events, selectedUser])

  const cutoff = useMemo(() => {
    if (dateFilter === '24h') return Date.now() - 24 * 60 * 60 * 1000
    if (dateFilter === '30d') return Date.now() - 30 * 24 * 60 * 60 * 1000
    if (dateFilter === 'all') return 0
    return Date.now() - 7 * 24 * 60 * 60 * 1000
  }, [dateFilter])

  const userEvents = useMemo(() => allUserEvents.filter((event) => {
    const eventTime = new Date(event.created_at).getTime()
    const payload = event.payload || {}
    const device = String(payload.device_type || payload.deviceType || '').toLowerCase()
    const matchesDate = !cutoff || !Number.isFinite(eventTime) || eventTime >= cutoff
    const matchesEvent = eventFilter === 'all' || event.event_type === eventFilter
    const matchesDevice = deviceFilter === 'all' || device === deviceFilter.toLowerCase()
    const q = activityQuery.trim().toLowerCase()
    const haystack = [event.message, event.module_key, event.route_href, event.actor_email, event.event_type, JSON.stringify(payload)].join(' ').toLowerCase()
    const matchesSearch = !q || haystack.includes(q) || [selectedUser?.fullName, selectedUser?.email, selectedUser?.username].join(' ').toLowerCase().includes(q)
    return matchesDate && matchesEvent && matchesDevice && matchesSearch
  }).slice(0, 80), [activityQuery, allUserEvents, cutoff, deviceFilter, eventFilter, selectedUser])

  const selectedRaw = selectedUser?.rawUser || {}
  const payloads = userEvents.map((event) => event.payload || {})
  const readValue = (keys: string[], fallback = 'Not captured yet') => {
    const pools: Array<Record<string, unknown>> = [...payloads, selectedRaw]
    for (const pool of pools) {
      for (const key of keys) {
        const value = pool[key]
        if (typeof value === 'string' && value.trim()) return value.slice(0, 160)
        if (typeof value === 'number' && Number.isFinite(value)) return String(value)
      }
    }
    return fallback
  }

  const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)))
  const routeEvents = userEvents.filter((event) => event.route_href || event.module_key)
  const securityEvents = userEvents.filter((event) => /login|session|auth|security|permission|access|denied|logout|password|role/i.test([event.event_type, event.message, JSON.stringify(event.payload || {})].join(' ')))
  const ipValues = unique(userEvents.map((event) => String(event.payload?.ip_address || event.payload?.ipAddress || '')))
  const deviceValues = unique(userEvents.map((event) => String(event.payload?.device_type || event.payload?.deviceType || '')))
  const sessionValues = unique(userEvents.map((event) => String(event.payload?.session_id || event.payload?.sessionId || '')))
  const moduleCounts = countBy(userEvents.map((event) => String(event.module_key || '').trim()).filter(Boolean))
  const routeCounts = countBy(userEvents.map((event) => String(event.route_href || '').trim()).filter(Boolean))
  const lastActivity = userEvents[0]?.created_at || selectedUser?.lastLoginAt
  const primaryIp = ipValues[0] || readValue(['ip_address', 'ipAddress', 'client_ip', 'clientIp', 'x_forwarded_for'])
  const locationValue = [readValue(['city'], ''), readValue(['region'], ''), readValue(['country'], '')].filter(Boolean).join(', ') || readValue(['location', 'geo_location'])
  const browserValue = readValue(['browser_name', 'browserName', 'browser'], 'Unknown browser')
  const osValue = readValue(['os_name', 'osName', 'os', 'platform'], 'Unknown OS')
  const deviceValue = deviceValues[0] || readValue(['device_type', 'deviceType', 'device', 'device_name'], 'Unknown device')
  const sessionValue = sessionValues[0] || readValue(['session_id', 'sessionId', 'auth_session_id'])
  const userAgentValue = readValue(['user_agent', 'userAgent'])
  const suspiciousEvents = securityEvents.filter((event) => /denied|failed|blocked|suspicious|risk|unauthorized/i.test([event.event_type, event.message, JSON.stringify(event.payload || {})].join(' ')))
  const riskScore = Math.min(100, Math.max(selectedUser?.risk || 0, suspiciousEvents.length * 16 + Math.max(0, ipValues.length - 1) * 8))

  return (
    <section style={activityWorkspaceStyle}>
      <div style={activityCommandHeroStyle}>
        <div>
          <div style={eyebrowStyle}>User Activity Intelligence Center</div>
          <h2 style={activityTitleStyle}>System usage, sessions, IP, devices & app behavior</h2>
          <p style={subtitleStyle}>Live-synced forensic workspace focused only on app activity: route visits, modules, sessions, devices, IP signals and security governance events.</p>
        </div>
        <div style={activityHeroActionsStyle}>
          <button type="button" style={activityPillButtonStyle}>● Live refresh</button>
          <button type="button" style={activityPillButtonStyle}>Export activity</button>
          <button type="button" style={activityPillButtonStrongStyle}>Suspicious only</button>
        </div>
      </div>

      <div style={activityFilterBarPremiumStyle}>
        <label style={activityFilterMainStyle}><span>Search activity</span><input value={activityQuery} onChange={(event) => setActivityQuery(event.target.value)} placeholder="Route, module, IP, browser, session, user..." style={activityInputStyle} /></label>
        <label style={activityFilterItemStyle}><span>User</span><select value={selectedUser?.id || ''} onChange={(event) => setSelectedUserId(event.target.value)} style={activitySelectStyle}>{filteredUsers.map((user) => <option key={user.id} value={user.id}>{user.fullName || user.username || user.email}</option>)}</select></label>
        <label style={activityFilterItemStyle}><span>Role</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} style={activitySelectStyle}><option value="all">All roles</option>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
        <label style={activityFilterItemStyle}><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={activitySelectStyle}><option value="all">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
        <label style={activityFilterItemStyle}><span>Department</span><select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} style={activitySelectStyle}><option value="all">All departments</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select></label>
        <label style={activityFilterItemStyle}><span>Event</span><select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} style={activitySelectStyle}><option value="all">All events</option>{eventTypes.map((eventType) => <option key={eventType} value={eventType}>{eventType}</option>)}</select></label>
        <label style={activityFilterItemStyle}><span>Device</span><select value={deviceFilter} onChange={(event) => setDeviceFilter(event.target.value)} style={activitySelectStyle}><option value="all">All devices</option>{deviceTypes.map((device) => <option key={device} value={device}>{device}</option>)}</select></label>
        <label style={activityFilterItemStyle}><span>Range</span><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} style={activitySelectStyle}><option value="24h">Last 24h</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="all">All time</option></select></label>
      </div>

      {selectedUser ? (
        <>
          <div style={selectedUserIntelligenceBannerStyle}>
            <div style={userCellStyle}>
              <UserPortrait user={selectedUser} size={54} style={activityAvatarStyle} />
              <div>
                <div style={activityIdentityTitleStyle}>{selectedUser.fullName || 'Unnamed user'}</div>
                <div style={userSubStyle}>{selectedUser.email || '—'} · {selectedUser.role || '—'} · selected user intelligence profile</div>
              </div>
            </div>
            <div style={previewBadgeRowStyle}>
              <Badge tone={statusTone(selectedUser.status)}>{selectedUser.status || '—'}</Badge>
              <Badge tone="blue">Last action {lastActivity ? formatShortDate(lastActivity) : 'Not captured'}</Badge>
              <Badge tone={riskScore > 55 ? 'amber' : 'green'}>Risk {riskScore}%</Badge>
              <Badge tone="slate">{selectedPermissions.length} permissions</Badge>
            </div>
          </div>

          <div style={activitySnapshotGridStyle}>
            <ActivityIntelCard icon="⚡" label="Total events" value={String(userEvents.length)} detail={`${allUserEvents.length} lifetime matched`} />
            <ActivityIntelCard icon="🧭" label="Modules used" value={String(moduleCounts.length)} detail={`${selectedCoverage.moduleCount}/${selectedCoverage.moduleTotal} allowed`} />
            <ActivityIntelCard icon="🌐" label="Distinct IPs" value={String(ipValues.length || (primaryIp !== 'Not captured yet' ? 1 : 0))} detail={primaryIp} />
            <ActivityIntelCard icon="💻" label="Devices" value={String(deviceValues.length || (deviceValue !== 'Unknown device' ? 1 : 0))} detail={`${deviceValue} · ${browserValue}`} />
            <ActivityIntelCard icon="🔐" label="Security events" value={String(securityEvents.length)} detail={`${suspiciousEvents.length} suspicious signals`} />
            <ActivityIntelCard icon="🕒" label="Latest activity" value={lastActivity ? formatShortDate(lastActivity) : '—'} detail={lastActivity ? formatDate(lastActivity) : 'Not captured yet'} />
          </div>

          <div style={activityPremiumLayoutStyle}>
            <div style={activityMainColumnStyle}>
              <PremiumActivityPanel icon="🕒" title="1. Live Activity Timeline" detail="Chronological app actions with route, module, device, IP and exact timestamp.">
                <div style={timelineListStyle}>
                  {userEvents.length ? userEvents.slice(0, 28).map((event) => <ActivityTimelineItem key={event.id} event={event} />) : <EmptyState text="No app activity event matched this user yet. Navigate inside the app as this user to start capturing route visits." />}
                </div>
              </PremiumActivityPanel>

              <PremiumActivityPanel icon="🛡️" title="5. Security & Governance Events" detail="Access-sensitive signals: login, logout, denied access, permissions, sessions and role changes.">
                {securityEvents.length ? securityEvents.slice(0, 12).map((event) => <SecurityEventCard key={event.id} event={event} />) : <EmptyState text="No security or governance event captured for this user yet." />}
                <div style={activityActionRowStyle}>
                  <ActionButton onClick={() => openPreview(selectedUser)} disabled={!canPreviewGovernance || previewBusy} tone="ghost" reason={canRender(canPreviewGovernance, 'Requires users.view or users.manage.')}>Open Access Preview</ActionButton>
                  {canEditUser ? <Link href={`/users/${selectedUser.id}/edit`} style={miniLinkStyle}>Adjust Access</Link> : null}
                  {canOpenProfile ? <Link href={`/users/${selectedUser.id}`} style={miniLinkStyle}>Open Profile</Link> : null}
                </div>
              </PremiumActivityPanel>
            </div>

            <div style={activitySideColumnStyle}>
              <PremiumActivityPanel icon="💻" title="2. Device & Session Intelligence" detail="Device, browser, OS, user agent and session identifiers captured from protected app usage.">
                <DeviceSessionRow label="Session ID" value={sessionValue} />
                <DeviceSessionRow label="Device" value={deviceValue} />
                <DeviceSessionRow label="Browser" value={browserValue} />
                <DeviceSessionRow label="Operating system" value={osValue} />
                <DeviceSessionRow label="User agent" value={userAgentValue} mono />
              </PremiumActivityPanel>

              <PremiumActivityPanel icon="🌍" title="3. IP Address & Location Intelligence" detail="IP footprint, location metadata and network consistency for the selected user.">
                <div style={ipHeroStyle}>
                  <span style={ipLabelStyle}>Primary IP</span>
                  <strong>{primaryIp}</strong>
                  <small>{locationValue}</small>
                </div>
                <div style={miniChipGridStyle}>{ipValues.length ? ipValues.slice(0, 8).map((ip) => <span key={ip} style={networkChipStyle}>{classifyIp(ip)} · {ip}</span>) : <span style={networkChipStyle}>No IP captured yet</span>}</div>
                <DeviceSessionRow label="Location consistency" value={ipValues.length > 1 ? 'Multiple IP signals detected' : 'Stable / not enough history'} />
              </PremiumActivityPanel>

              <PremiumActivityPanel icon="📊" title="4. Module & Route Usage Analytics" detail="Most used modules and routes from captured page_view and governance events.">
                <UsageBars title="Top modules" rows={moduleCounts.slice(0, 6)} />
                <UsageBars title="Top routes" rows={routeCounts.slice(0, 6)} />
              </PremiumActivityPanel>
            </div>
          </div>
        </>
      ) : <EmptyState text="No user matches the current activity filters." />}
    </section>
  )
}

function countBy(values: string[]) {
  const map = new Map<string, number>()
  values.forEach((value) => map.set(value, (map.get(value) || 0) + 1))
  return Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

function classifyIp(ip: string) {
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(ip)) return 'Private'
  if (!ip || ip === 'Not captured yet') return 'Unknown'
  return 'Public'
}

function PremiumActivityPanel({ icon, title, detail, children }: { icon: string; title: string; detail: string; children: ReactNode }) {
  return (
    <article style={premiumActivityPanelStyle}>
      <div style={premiumPanelHeaderStyle}>
        <span style={premiumPanelIconStyle}>{icon}</span>
        <div><h3 style={premiumPanelTitleStyle}>{title}</h3><p style={premiumPanelDetailStyle}>{detail}</p></div>
      </div>
      <div style={premiumPanelBodyStyle}>{children}</div>
    </article>
  )
}

function ActivityIntelCard({ icon, label, value, detail }: { icon: string; label: string; value: string; detail: string }) {
  return (
    <div style={activityIntelCardStyle}>
      <span style={activityIntelIconStyle}>{icon}</span>
      <div><span style={smallStatLabelStyle}>{label}</span><strong style={activityIntelValueStyle}>{value}</strong><small style={activityIntelDetailStyle}>{detail}</small></div>
    </div>
  )
}

function ActivityTimelineItem({ event }: { event: AccessRegistryEventRow }) {
  const payload = event.payload || {}
  const ip = String(payload.ip_address || payload.ipAddress || 'IP not captured')
  const device = String(payload.device_type || payload.deviceType || payload.browser_name || payload.browserName || 'Device not captured')
  const route = event.route_href || event.module_key || 'system'
  return (
    <div style={timelineItemStyle}>
      <div style={timelineDotStyle}>{eventIcon(event.event_type)}</div>
      <div style={timelineContentStyle}>
        <div style={eventTopStyle}><Badge tone={statusTone(event.event_type)}>{event.event_type}</Badge><span style={eventTimeStyle}>{formatShortDate(event.created_at)} · {formatTime(event.created_at)}</span></div>
        <strong style={timelineTitleStyle}>{event.message || `${event.event_type.replaceAll('_', ' ')} · ${route}`}</strong>
        <div style={timelineMetaGridStyle}><span>{route}</span><span>{device}</span><span>{ip}</span></div>
      </div>
    </div>
  )
}

function SecurityEventCard({ event }: { event: AccessRegistryEventRow }) {
  const critical = /denied|failed|blocked|unauthorized|risk|suspicious/i.test([event.event_type, event.message, JSON.stringify(event.payload || {})].join(' '))
  return (
    <div style={critical ? securityEventCriticalStyle : securityEventStyle}>
      <div style={eventTopStyle}><Badge tone={critical ? 'red' : 'blue'}>{critical ? 'Attention' : event.event_type}</Badge><span style={eventTimeStyle}>{formatShortDate(event.created_at)} · {formatTime(event.created_at)}</span></div>
      <strong>{event.message || event.event_type}</strong>
      <small>{event.module_key || event.route_href || 'Governance event'}</small>
    </div>
  )
}

function DeviceSessionRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div style={deviceSessionRowStyle}><span>{label}</span><strong style={mono ? monoValueStyle : undefined}>{value || 'Not captured yet'}</strong></div>
}

function UsageBars({ title, rows }: { title: string; rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <div style={usageBlockStyle}>
      <strong style={usageTitleStyle}>{title}</strong>
      {rows.length ? rows.map((row) => (
        <div key={row.label} style={usageRowStyle}>
          <div style={usageLabelRowStyle}><span>{row.label}</span><b>{row.value}</b></div>
          <div style={usageTrackStyle}><div style={{ ...usageFillStyle, width: `${Math.max(8, Math.round((row.value / max) * 100))}%` }} /></div>
        </div>
      )) : <EmptyState text="No usage captured yet." />}
    </div>
  )
}

function eventIcon(type: string) {
  if (/denied|failed|blocked/i.test(type)) return '🚫'
  if (/login|auth/i.test(type)) return '🔐'
  if (/session/i.test(type)) return '💻'
  if (/permission|role/i.test(type)) return '🛡️'
  return '⚡'
}

function formatTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date)
}


function UsersAttendanceInPage({ users, canOpenProfile }: { users: UserStaffRecord[]; canOpenProfile: boolean }) {
  const todayIso = new Date().toISOString().slice(0, 10)
  const [attendanceQuery, setAttendanceQuery] = useState('')
  const [attendanceStatus, setAttendanceStatus] = useState('all')
  const [attendanceDepartment, setAttendanceDepartment] = useState('all')
  const [attendanceDate, setAttendanceDate] = useState(todayIso)
  const [attendanceMonth, setAttendanceMonth] = useState(todayIso.slice(0, 7))
  const [selectedAttendanceUserId, setSelectedAttendanceUserId] = useState<string | null>(null)
  const [shiftStart, setShiftStart] = useState('10:00')
  const [shiftEnd, setShiftEnd] = useState('18:00')
  const [graceMinutes, setGraceMinutes] = useState(10)

  const departments = useMemo(() => Array.from(new Set(users.map((user) => user.department).filter(Boolean))).sort(), [users])

  const attendanceUsers = useMemo(() => {
    const q = attendanceQuery.trim().toLowerCase()
    return users.filter((user) => {
      const haystack = [user.fullName, user.email, user.username, user.department, user.role, user.city, user.attendanceStatus].join(' ').toLowerCase()
      const statusOk = attendanceStatus === 'all' || normalizedAttendanceStatus(user) === attendanceStatus || user.attendanceStatus === attendanceStatus
      const departmentOk = attendanceDepartment === 'all' || user.department === attendanceDepartment
      const safeAttendanceHistoryRows = Array.isArray(history) ? history : []
      const monthOk = !attendanceMonth || safeAttendanceHistoryRows.some((row) => rowDateIso(row).startsWith(attendanceMonth)) || String(user.punchInAt || user.punchOutAt || '').startsWith(attendanceMonth)
      return (!q || haystack.includes(q)) && statusOk && departmentOk && monthOk
    })
  }, [attendanceQuery, attendanceStatus, attendanceDepartment, attendanceMonth, users])

  const selectedAttendanceUser = users.find((user) => user.id === selectedAttendanceUserId) || null

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const isAttendanceA4Bridge =
      params.get('attendanceA4Bridge') === '1' ||
      params.has('attendanceEmployeeId') ||
      params.has('attendanceEmail')

    if (!isAttendanceA4Bridge) return

    const normalize = (value: unknown) =>
      String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()

    const targetId = normalize(params.get('attendanceEmployeeId'))
    const targetEmail = normalize(params.get('attendanceEmail'))
    const targetMonth = String(params.get('attendanceMonth') || '').trim()

    if (/^\d{4}-\d{2}$/.test(targetMonth)) {
      setAttendanceMonth(targetMonth)
      setAttendanceDate(`${targetMonth}-01`)
    }

    const matchedUser = users.find((rawUser) => {
      const user = rawUser as any
      const candidates = [
        user.id,
        user.email,
        user.username,
        user.staffId,
        user.profileId,
        user.authUserId,
        user.fullName,
        user.name,
      ].map(normalize).filter(Boolean)

      return Boolean(
        (targetId && candidates.includes(targetId)) ||
        (targetEmail && candidates.includes(targetEmail)) ||
        (targetEmail && candidates.some((candidate) => candidate.includes(targetEmail))) ||
        (targetId && candidates.some((candidate) => candidate.includes(targetId)))
      )
    })

    if (matchedUser?.id && selectedAttendanceUserId !== matchedUser.id) {
      setSelectedAttendanceUserId(matchedUser.id)
    }
  }, [users, selectedAttendanceUserId])


  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const isAttendanceBridge =
      params.get('attendanceA4Bridge') === '1' ||
      params.get('workspace') === 'attendance' ||
      params.has('attendanceEmployeeId') ||
      params.has('attendanceEmail')

    if (!isAttendanceBridge) return

    const normalize = (value: unknown) =>
      String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()

    const targetId = normalize(params.get('attendanceEmployeeId'))
    const targetEmail = normalize(params.get('attendanceEmail'))
    const targetMonth = String(params.get('attendanceMonth') || '').trim()


    if (/^\d{4}-\d{2}$/.test(targetMonth)) {
      setAttendanceMonth(targetMonth)
      setAttendanceDate(`${targetMonth}-01`)
    }

    const matchedUser = users.find((user) => {
      const candidates = [
        user.id,
        user.email,
        user.username,
        user.staffId,
        (user as any).profileId,
        (user as any).authUserId,
        user.fullName,
      ].map(normalize).filter(Boolean)

      return Boolean(
        (targetId && candidates.includes(targetId)) ||
        (targetEmail && candidates.includes(targetEmail)) ||
        (targetEmail && candidates.some((candidate) => candidate.includes(targetEmail))) ||
        (targetId && candidates.some((candidate) => candidate.includes(targetId)))
      )
    })

    if (matchedUser?.id && selectedAttendanceUserId !== matchedUser.id) {
      setSelectedAttendanceUserId(matchedUser.id)
    }
  }, [users, selectedAttendanceUserId])


  const totalUsers = users.length
  const onlineUsers = users.filter((user) => normalizedAttendanceStatus(user) === 'online').length
  const offlineUsers = users.filter((user) => normalizedAttendanceStatus(user) === 'offline').length
  const pausedUsers = users.filter((user) => normalizedAttendanceStatus(user) === 'paused').length
  const completedUsers = users.filter((user) => normalizedAttendanceStatus(user) === 'completed').length
  const reviewUsers = users.filter((user) => attendanceRiskForUser(user, attendanceDate, shiftStart, shiftEnd, graceMinutes).tone !== 'green').length

  return (
    <section style={premiumAttendanceWorkspaceStyle}>
      <style jsx global>{`
        @keyframes attendancePulseGreen { 0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,.34); } 50% { box-shadow: 0 0 0 8px rgba(34,197,94,.06); } }
        @keyframes attendancePulseRed { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.32); } 50% { box-shadow: 0 0 0 8px rgba(239,68,68,.06); } }
        @keyframes attendancePulseAmber { 0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,.30); } 50% { box-shadow: 0 0 0 8px rgba(245,158,11,.07); } }
        .attendance-live-green { animation: attendancePulseGreen 1.75s ease-in-out infinite; }
        .attendance-live-red { animation: attendancePulseRed 1.75s ease-in-out infinite; }
        .attendance-live-amber { animation: attendancePulseAmber 1.75s ease-in-out infinite; }
      `}</style>

      <div style={premiumAttendanceHeroStyle}>
        <div style={premiumAttendanceHeroLeftStyle}>
          <div style={eyebrowStyle}>Attendance Live Command Center</div>
          <h2 style={premiumAttendanceTitleStyle}>Users attendance monitoring</h2>
          <p style={subtitleStyle}>Premium live-synced attendance board connected to punch IN, punch OUT, pause and retour signals from the overhead panel.</p>
          <div style={attendanceLiveTagRowStyle}>
            <span style={liveSyncPillStyle}><span style={greenDotStyle} /> Live synced</span>
            <span style={attendanceDatePillStyle}>Selected date · {formatAttendanceDateLabel(attendanceDate)}</span>
            <span style={attendanceDatePillStyle}>Shift · {shiftStart} → {shiftEnd}</span>
          </div>
        </div>
        <div style={premiumAttendanceKpiGridStyle}>
          <AttendanceKpiCard icon="👥" label="Total users" value={String(totalUsers)} detail="Synced profiles" tone="blue" />
          <AttendanceKpiCard icon="🟢" label="Connected / IN" value={String(onlineUsers)} detail="Session in action" tone="green" />
          <AttendanceKpiCard icon="🔴" label="Offline / OUT" value={String(offlineUsers)} detail="Not currently active" tone="red" />
          <AttendanceKpiCard icon="⏸" label="Paused" value={String(pausedUsers)} detail="Break state" tone="amber" />
          <AttendanceKpiCard icon="✅" label="Completed" value={String(completedUsers)} detail="Closed day" tone="green" />
          <AttendanceKpiCard icon="⚠️" label="Needs review" value={String(reviewUsers)} detail="Delay / absence / overtime" tone={reviewUsers ? 'amber' : 'green'} />
        </div>
      </div>

      <div style={attendanceFilterCommandStyle}>
        <input value={attendanceQuery} onChange={(event) => setAttendanceQuery(event.target.value)} placeholder="Search user, email, role, city, department, status..." style={attendanceSearchInputStyle} />
        <input type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value || todayIso)} style={attendanceDateInputStyle} />
        <input type="month" value={attendanceMonth} onChange={(event) => setAttendanceMonth(event.target.value || todayIso.slice(0, 7))} style={attendanceDateInputStyle} />
        <select value={attendanceStatus} onChange={(event) => setAttendanceStatus(event.target.value)} style={attendanceSelectStyle}>
          <option value="all">All live states</option>
          <option value="online">Connected / IN</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="offline">Offline / OUT</option>
          <option value="review">Needs review</option>
        </select>
        <select value={attendanceDepartment} onChange={(event) => setAttendanceDepartment(event.target.value)} style={attendanceSelectStyle}>
          <option value="all">All departments</option>
          {departments.map((department) => <option key={department} value={department}>{department}</option>)}
        </select>
      </div>

      <div style={overheadSyncStripStyle}>
        <OverheadSyncTag label="IN" value="Punch in" tone="green" />
        <OverheadSyncTag label="OUT" value="Punch out" tone="red" />
        <OverheadSyncTag label="Pause" value="Break start" tone="amber" />
        <OverheadSyncTag label="Retour" value="Back from pause" tone="blue" />
        <span style={overheadSyncHintStyle}>Each card below displays the latest synced timing available for the selected date.</span>
      </div>

      <div style={attendanceCardGridStyle}>
        {attendanceUsers.map((user) => {
          const liveState = normalizedAttendanceStatus(user)
          const risk = attendanceRiskForUser(user, attendanceDate, shiftStart, shiftEnd, graceMinutes)
          const history = attendanceHistoryForUser(user)
  const storedShiftRule = attendanceShiftRuleForUser(user)
          const latestForDate = latestAttendanceForDate(history, attendanceDate) || latestAttendanceFromUser(user)
          const pulseClass = liveState === 'online' ? 'attendance-live-green' : liveState === 'offline' ? 'attendance-live-red' : liveState === 'paused' ? 'attendance-live-amber' : ''
          return (
            <button key={user.id} type="button" onClick={() => setSelectedAttendanceUserId(user.id)} style={attendanceUserCardStyle} className={pulseClass}>
              <div style={attendanceCardTopStyle}>
                <div style={userCellStyle}>
                  <UserPortrait user={user} size={48} style={attendanceAvatarStyle} />
                  <div style={{ minWidth: 0 }}>
                    <div style={attendanceUserNameStyle}>{user.fullName || 'Unnamed user'}</div>
                    <div style={attendanceUserSubStyle}>{user.email || '—'}</div>
                  </div>
                </div>
                <LiveStatusPill state={liveState} />
              </div>

              <div style={attendanceUserMetaGridStyle}>
                <AttendanceMiniMeta icon="🏢" label="Department" value={user.department || '—'} />
                <AttendanceMiniMeta icon="📍" label="City" value={user.city || '—'} />
                <AttendanceMiniMeta icon="🧑‍💼" label="Role" value={user.role || '—'} />
                <AttendanceMiniMeta icon="📅" label="Records" value={String(user.coverage.attendance || history.length || 0)} />
              </div>

              <div style={punchActionGridStyle}>
                <PunchSignal label="IN" value={readAttendanceTime(latestForDate, ['punch_in_at', 'in_at', 'clock_in_at', 'started_at']) || formatAttendanceTime(user.punchInAt)} tone="green" />
                <PunchSignal label="OUT" value={readAttendanceTime(latestForDate, ['punch_out_at', 'out_at', 'clock_out_at', 'ended_at']) || formatAttendanceTime(user.punchOutAt)} tone="red" />
                <PunchSignal label="Pause" value={readAttendanceTime(latestForDate, ['pause_at', 'pause_start_at', 'break_start_at'])} tone="amber" />
                <PunchSignal label="Retour" value={readAttendanceTime(latestForDate, ['retour_at', 'return_at', 'pause_end_at', 'break_end_at'])} tone="blue" />
              </div>

              <div style={attendanceCardFooterStyle}>
                <span style={attendanceRiskPillStyle(risk.tone)}>{risk.label}</span>
                <span style={attendanceOpenHintStyle}>Open history →</span>
              </div>
            </button>
          )
        })}
      </div>

      {!attendanceUsers.length ? <EmptyState text="No attendance card matches the current filters." /> : null}

      {selectedAttendanceUser ? (
        <AttendanceHistoryModal
          user={selectedAttendanceUser}
          attendanceDate={attendanceDate}
          shiftStart={shiftStart}
          shiftEnd={shiftEnd}
          graceMinutes={graceMinutes}
          setAttendanceDate={setAttendanceDate}
          setShiftStart={setShiftStart}
          setShiftEnd={setShiftEnd}
          setGraceMinutes={setGraceMinutes}
          canOpenProfile={canOpenProfile}
          onClose={() => setSelectedAttendanceUserId(null)}
        />
      ) : null}
    </section>
  )
}

type AttendanceTone = 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'authorized' | 'absence' | 'critical' | 'delay' | 'early' | 'overtime' | 'normal'
type AttendanceHistoryRow = Record<string, unknown>



function authorizedAbsencesForUser(user: UserStaffRecord): Record<string, unknown>[] {
  const raw = user.rawUser as Record<string, unknown> | undefined
  const rows = raw?.__authorizedAbsences
  return Array.isArray(rows) ? rows as Record<string, unknown>[] : []
}

function isoDateFromParts(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function fullMonthDatesUntilToday(monthIso: string) {
  const today = new Date()
  const year = Number(monthIso.slice(0, 4))
  const monthIndex = Number(monthIso.slice(5, 7)) - 1
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return []

  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex
  const endDay = isCurrentMonth ? today.getDate() : lastDay

  return Array.from({ length: endDay }, (_, index) => isoDateFromParts(year, monthIndex, index + 1))
}

function authorizedAbsenceForDate(records: Record<string, unknown>[], dateIso: string) {
  return records.find((record) => {
    const start = String(record.start_date || '').slice(0, 10)
    const end = String(record.end_date || start).slice(0, 10)
    return start && end && dateIso >= start && dateIso <= end
  }) || null
}

function attendanceLedgerRowForDate(
  dateIso: string,
  history: AttendanceHistoryRow[],
  authorizedAbsences: Record<string, unknown>[],
): AttendanceHistoryRow {
  const existing = history.find((row) => rowDateIso(row) === dateIso)
  if (existing) return existing

  const authorized = authorizedAbsenceForDate(authorizedAbsences, dateIso)
  if (authorized) {
    return {
      attendance_date: dateIso,
      work_date: dateIso,
      status: String(authorized.absence_type || 'authorized_absence'),
      attendance_status: 'authorized',
      notes: String(authorized.reason || authorized.notes || ''),
      __authorizedAbsence: authorized,
      __synthetic: true,
    } as AttendanceHistoryRow
  }

  return {
    attendance_date: dateIso,
    work_date: dateIso,
    status: 'absent',
    attendance_status: 'absent',
    __synthetic: true,
  } as AttendanceHistoryRow
}


function attendanceShiftRuleForUser(user: UserStaffRecord): Record<string, unknown> | null {
  const raw = user.rawUser as Record<string, unknown> | undefined
  const rule = raw?.__shiftRule
  return rule && typeof rule === 'object' ? rule as Record<string, unknown> : null
}

function savedRuleTime(rule: Record<string, unknown> | null, keyName: string, fallback: string) {
  const value = String(rule?.[keyName] || '').slice(0, 5)
  return /^\d{2}:\d{2}$/.test(value) ? value : fallback
}


function monthLabelFromIso(value: string) {
  if (!value) return 'Unknown month'
  const [year, month] = value.split('-')
  const monthIndex = Number(month || '1') - 1
  const date = new Date(Number(year || '2026'), Math.max(0, monthIndex), 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function docRefForAttendanceMonth(user: UserStaffRecord, monthIso: string) {
  const cleanMonth = String(monthIso || '').replace('-', '')
  const cleanUser = String(user.fullName || user.email || user.id).replace(/[^A-Z0-9]+/gi, '').slice(0, 10).toUpperCase()
  return `AC-HR-ATT-${cleanMonth || '000000'}-${cleanUser || 'USER'}`
}





function minutesFromTimeLike(value: unknown): number | null {
  const text = String(value || '').trim()
  if (!text || text === '—') return null

  const simple = text.match(/^(\d{1,2}):(\d{2})/)
  if (simple) {
    const hours = Number(simple[1])
    const minutes = Number(simple[2])
    if (Number.isFinite(hours) && Number.isFinite(minutes)) return hours * 60 + minutes
  }

  const date = new Date(text)
  if (!Number.isNaN(date.getTime())) return date.getHours() * 60 + date.getMinutes()

  return null
}

function shiftMinuteValue(value: string, fallback: string) {
  return minutesFromTimeLike(value) ?? minutesFromTimeLike(fallback) ?? 0
}

function attendanceRowFlag(row: AttendanceHistoryRow, shiftStart: string, shiftEnd: string, graceMinutes: number): { tone: AttendanceTone; label: string; details: string } {
  const record = row as Record<string, unknown>
  const status = String(record.status || record.attendance_status || '').toLowerCase()

  const inText = String(record.punchInAt || record.check_in || record.punch_in_at || '').trim()
  const outText = String(record.punchOutAt || record.check_out || record.punch_out_at || '').trim()

  const inMinutes = minutesFromTimeLike(inText)
  const outMinutes = minutesFromTimeLike(outText)

  const startMinutes = shiftMinuteValue(shiftStart, '10:00')
  const endMinutes = shiftMinuteValue(shiftEnd, '18:00')
  const grace = Math.max(0, Number(graceMinutes || 0))

  if (status.includes('authorized') || status.includes('leave') || status.includes('congé') || status.includes('absence_autorisee') || status.includes('authorized_absence')) {
    return { tone: 'authorized', label: 'Authorized absence', details: 'Approved leave or authorized absence range.' }
  }

  if (status.includes('absent') || status.includes('absence')) {
    return { tone: 'absence', label: 'Real absence', details: 'No attendance record found for this working day.' }
  }

  if (inMinutes === null && outMinutes === null) {
    return { tone: 'absence', label: 'Missing punch', details: 'No IN / OUT time captured.' }
  }

  const delayMinutes = inMinutes !== null ? Math.max(0, inMinutes - startMinutes - grace) : 0
  const earlyOutMinutes = outMinutes !== null ? Math.max(0, endMinutes - outMinutes) : 0
  const overtimeMinutes = outMinutes !== null ? Math.max(0, outMinutes - endMinutes) : 0

  if (inMinutes !== null && outMinutes === null && String(record.status || '').toLowerCase().includes('completed')) {
    return {
      tone: 'critical',
      label: 'Missing OUT',
      details: 'Day is marked completed but no check-out time is captured.',
    }
  }

  if (delayMinutes > 0 && earlyOutMinutes > 0) {
    return {
      tone: 'critical',
      label: `Delay +${delayMinutes} min · Early OUT ${earlyOutMinutes} min`,
      details: `IN after grace window and OUT before shift end.`,
    }
  }

  if (delayMinutes > 0 && outMinutes === null) {
    return {
      tone: 'critical',
      label: `Delay +${delayMinutes} min · Missing OUT`,
      details: `Late check-in and no check-out captured for this day.`,
    }
  }

  if (delayMinutes > 0) {
    return {
      tone: 'delay',
      label: `Delay +${delayMinutes} min`,
      details: `Check-in is later than ${shiftStart} with ${grace} min grace.`,
    }
  }

  if (earlyOutMinutes > 0) {
    return {
      tone: 'early',
      label: `Early OUT -${earlyOutMinutes} min`,
      details: `Check-out is before expected shift end ${shiftEnd}.`,
    }
  }

  if (overtimeMinutes > 0) {
    return {
      tone: 'overtime',
      label: `Overtime +${overtimeMinutes} min`,
      details: `Check-out is after expected shift end ${shiftEnd}.`,
    }
  }

  return {
    tone: 'normal',
    label: 'Normal',
    details: `Inside shift range ${shiftStart} → ${shiftEnd}.`,
  }
}

function attendanceFlagChipStyle(tone: string): CSSProperties {
  if (tone === 'red' || tone === 'danger' || tone === 'critical') return { background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: '1px solid #991b1b', boxShadow: '0 10px 24px rgba(220,38,38,.26)' }
  if (tone === 'critical') return { ...modalFlagChipStyle, background: '#fff1f2', color: '#9f1239', border: '1px solid #fecdd3', boxShadow: '0 10px 22px rgba(225,29,72,.12)' }
  if (tone === 'delay') return { ...modalFlagChipStyle, background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: '1px solid #fde68a', boxShadow: '0 10px 22px rgba(245,158,11,.12)' }
  if (tone === 'early') return { ...modalFlagChipStyle, background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa', boxShadow: '0 10px 22px rgba(234,88,12,.12)' }
  if (tone === 'authorized') return { ...modalFlagChipStyle, background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', color: '#fff', border: '1px solid #6d28d9', boxShadow: '0 10px 22px rgba(124,58,237,.22)' }
  if (tone === 'overtime') return { ...modalFlagChipStyle, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', boxShadow: '0 10px 22px rgba(37,99,235,.12)' }
  if (tone === 'absence') return { ...modalFlagChipStyle, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', boxShadow: '0 10px 22px rgba(220,38,38,.12)' }
  return { ...modalFlagChipStyle, background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', boxShadow: '0 10px 22px rgba(22,163,74,.10)' }
}


function attendanceCardDateFlagStyle(tone: string): CSSProperties {
  if (tone === 'red' || tone === 'danger' || tone === 'critical') return { background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: '1px solid #991b1b', boxShadow: '0 10px 24px rgba(220,38,38,.26)' }
  if (tone === 'normal') {
    return {
      ...modalFlagChipStyle,
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #bbf7d0',
    }
  }

  if (tone === 'overtime') {
    return {
      ...modalFlagChipStyle,
      background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
      color: '#fff',
      border: '1px solid #1d4ed8',
      boxShadow: '0 10px 22px rgba(37,99,235,.22)',
    }
  }

  return {
    ...modalFlagChipStyle,
    background: 'linear-gradient(135deg,#dc2626,#991b1b)',
    color: '#fff',
    border: '1px solid #991b1b',
    boxShadow: '0 10px 24px rgba(220,38,38,.26)',
  }
}


function attendanceRowCardStyle(tone: string): CSSProperties {
  if (tone === 'red' || tone === 'danger' || tone === 'critical') return { background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: '1px solid #991b1b', boxShadow: '0 10px 24px rgba(220,38,38,.26)' }
  if (tone === 'critical') return { ...modalHistoryCardStyle, borderColor: '#fecdd3', background: 'linear-gradient(135deg,#fff,#fff1f2)', boxShadow: '0 18px 45px rgba(225,29,72,.12)' }
  if (tone === 'delay') return { ...modalHistoryCardStyle, borderColor: '#fde68a', background: 'linear-gradient(135deg,#fff,#fffbeb)', boxShadow: '0 18px 45px rgba(245,158,11,.12)' }
  if (tone === 'early') return { ...modalHistoryCardStyle, borderColor: '#fed7aa', background: 'linear-gradient(135deg,#fff,#fff7ed)', boxShadow: '0 18px 45px rgba(234,88,12,.12)' }
  if (tone === 'authorized') return { ...modalHistoryCardStyle, borderColor: '#ddd6fe', background: 'linear-gradient(135deg,#fff,#f5f3ff)', boxShadow: '0 18px 45px rgba(124,58,237,.12)' }
  if (tone === 'overtime') return { ...modalHistoryCardStyle, borderColor: '#bfdbfe', background: 'linear-gradient(135deg,#fff,#eff6ff)', boxShadow: '0 18px 45px rgba(37,99,235,.12)' }
  if (tone === 'absence') return { ...modalHistoryCardStyle, borderColor: '#fecaca', background: 'linear-gradient(135deg,#fff,#fef2f2)', boxShadow: '0 18px 45px rgba(220,38,38,.12)' }
  return modalHistoryCardStyle
}


function normalizeAttendanceDisplayRow(row: AttendanceHistoryRow): AttendanceHistoryRow {
  const record = row as Record<string, unknown>

  const inValue = attendanceTimeValue(row, 'in')
  const outValue = attendanceTimeValue(row, 'out')
  const pauseValue = attendanceTimeValue(row, 'pause')
  const retourValue = attendanceTimeValue(row, 'retour')

  return {
    ...record,
    punchInAt: inValue,
    punchOutAt: outValue,
    pauseAt: pauseValue,
    retourAt: retourValue,
    punch_in_at: record.punch_in_at || record.check_in || inValue,
    punch_out_at: record.punch_out_at || record.check_out || outValue,
    check_in: record.check_in || record.punch_in_at || inValue,
    check_out: record.check_out || record.punch_out_at || outValue,
    break_start_at: record.break_start_at || record.lunch_start || pauseValue,
    break_end_at: record.break_end_at || record.lunch_end || retourValue,
    lunch_start: record.lunch_start || record.break_start_at || pauseValue,
    lunch_end: record.lunch_end || record.break_end_at || retourValue,
  } as AttendanceHistoryRow
}

function attendanceCreatedTime(row: AttendanceHistoryRow) {
  const record = row as Record<string, unknown>
  return timeShort(record.created_at || record.inserted_at || record.updated_at)
}


function attendanceTimeValue(row: AttendanceHistoryRow, kind: 'in' | 'out' | 'pause' | 'retour') {
  const record = row as Record<string, unknown>

  const keysByKind: Record<string, string[]> = {
    in: ['punch_in_at', 'check_in', 'check_in_at', 'clock_in_at', 'in_at', 'start_time', 'started_at'],
    out: ['punch_out_at', 'check_out', 'check_out_at', 'clock_out_at', 'out_at', 'end_time', 'ended_at'],
    pause: ['break_start_at', 'lunch_start', 'pause_at', 'pause_start_at'],
    retour: ['break_end_at', 'lunch_end', 'return_at', 'retour_at', 'pause_end_at'],
  }

  for (const key of keysByKind[kind] || []) {
    const value = record[key]
    if (value !== null && value !== undefined && String(value).trim()) return timeShort(value)
  }

  const action = String(record.last_action || record.event_type || '').toLowerCase()
  const eventTime = record.event_time

  if (eventTime) {
    if (kind === 'in' && (action.includes('in') || action.includes('punch_in') || action.includes('check_in'))) return timeShort(eventTime)
    if (kind === 'out' && (action.includes('out') || action.includes('punch_out') || action.includes('check_out'))) return timeShort(eventTime)
    if (kind === 'pause' && (action.includes('pause') || action.includes('break_start') || action.includes('lunch_start'))) return timeShort(eventTime)
    if (kind === 'retour' && (action.includes('retour') || action.includes('return') || action.includes('break_end') || action.includes('lunch_end'))) return timeShort(eventTime)
  }

  return '—'
}

function timeShort(value: unknown) {
  const text = String(value || '').trim()
  if (!text) return '—'
  if (/^\d{2}:\d{2}/.test(text)) return text.slice(0, 5)
  const date = new Date(text)
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  return text.slice(0, 5)
}

function rowDateIso(row: AttendanceHistoryRow) {
  return String((row as Record<string, unknown>).work_date || (row as Record<string, unknown>).attendance_date || (row as Record<string, unknown>).date || (row as Record<string, unknown>).day || (row as Record<string, unknown>).created_at || '').slice(0, 10)
}

function attendanceHistoryForUser(user: UserStaffRecord): AttendanceHistoryRow[] {
  const raw = user.rawUser as Record<string, unknown> | undefined
  const history = raw?.__attendanceHistory
  return Array.isArray(history) ? history as AttendanceHistoryRow[] : []
}

function getAttendanceValue(row: AttendanceHistoryRow | null | undefined, keys: string[], fallback = '') {
  if (!row) return fallback
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value)
  }
  return fallback
}

function formatAttendanceDateLabel(value?: string | null) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
  } catch {
    return value
  }
}

function formatAttendanceTime(value?: string | null) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch {
    const match = String(value).match(/(\d{1,2}:\d{2})/)
    return match?.[1] || String(value || '—')
  }
}

function readAttendanceTime(row: AttendanceHistoryRow | null | undefined, keys: string[]) {
  const value = getAttendanceValue(row, keys)
  return value ? formatAttendanceTime(value) : '—'
}

function latestAttendanceFromUser(user: UserStaffRecord): AttendanceHistoryRow {
  return {
    status: user.attendanceStatus,
    punch_in_at: user.punchInAt,
    punch_out_at: user.punchOutAt,
    work_date: user.punchInAt || user.punchOutAt,
  }
}

function latestAttendanceForDate(history: AttendanceHistoryRow[], dateIso: string) {
  const matched = history.filter((row) => rowDateIso(row) === dateIso)
  return matched[0] || null
}

function normalizedAttendanceStatus(user: UserStaffRecord) {
  const status = String(user.attendanceStatus || '').toLowerCase()
  const hasIn = Boolean(user.punchInAt)
  const hasOut = Boolean(user.punchOutAt)
  if (status.includes('pause') || status.includes('break')) return 'paused'
  if (status.includes('progress') || status.includes('in_progress') || status.includes('pointed_in') || status === 'in' || (hasIn && !hasOut)) return 'online'
  if (status.includes('completed') || status.includes('done') || (hasIn && hasOut)) return 'completed'
  if (status.includes('out') || status.includes('offline') || status.includes('not_pointed')) return 'offline'
  return hasIn && !hasOut ? 'online' : 'offline'
}

function and_not_out(hasOut: boolean) {
  return !hasOut
}

function minutesFromTime(value: string) {
  const match = String(value || '').match(/(\d{1,2}):(\d{2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function minutesFromDateTime(value?: string | null) {
  if (!value) return null
  const text = String(value)
  const match = text.match(/(\d{1,2}):(\d{2})/)
  if (match) return Number(match[1]) * 60 + Number(match[2])
  try {
    const date = new Date(text)
    if (Number.isNaN(date.getTime())) return null
    return date.getHours() * 60 + date.getMinutes()
  } catch {
    return null
  }
}

function attendanceRiskForUser(user: UserStaffRecord, dateIso: string, shiftStart: string, shiftEnd: string, graceMinutes: number): { tone: AttendanceTone; label: string } {
  const history = attendanceHistoryForUser(user)
  const storedShiftRule = attendanceShiftRuleForUser(user)
  const row = latestAttendanceForDate(history, dateIso) || latestAttendanceFromUser(user)
  const inValue = getAttendanceValue(row, ['punch_in_at', 'check_in', 'check_in_at', 'in_at', 'clock_in_at', 'started_at'], user.punchInAt)
  const outValue = getAttendanceValue(row, ['punch_out_at', 'check_out', 'check_out_at', 'out_at', 'clock_out_at', 'ended_at'], user.punchOutAt)
  const hasRecordForDate = Boolean(latestAttendanceForDate(history, dateIso)) || rowDateIso(row) === dateIso || (!history.length && Boolean(inValue || outValue))
  const authorizedForDate = authorizedAbsenceForDate(authorizedAbsencesForUser(user), dateIso)
  if (authorizedForDate) return { tone: 'blue', label: 'Authorized absence' }
  if (!hasRecordForDate && dateIso <= new Date().toISOString().slice(0, 10)) return { tone: 'red', label: 'Absent · no authorized record' }
  const shiftStartMin = minutesFromTime(shiftStart)
  const shiftEndMin = minutesFromTime(shiftEnd)
  const inMin = minutesFromDateTime(inValue)
  const outMin = minutesFromDateTime(outValue)
  if (shiftStartMin !== null && inMin !== null && inMin > shiftStartMin + graceMinutes) return { tone: 'red', label: `Delay +${inMin - shiftStartMin} min` }
  if (shiftEndMin !== null && outMin !== null && outMin < shiftEndMin) return { tone: 'red', label: `Early OUT · ${shiftEndMin - outMin} min` }
  if (shiftEndMin !== null && outMin !== null && outMin > shiftEndMin + graceMinutes) return { tone: 'blue', label: `Overtime +${outMin - shiftEndMin} min` }
  if (normalizedAttendanceStatus(user) === 'online') return { tone: 'green', label: 'Session in action' }
  if (normalizedAttendanceStatus(user) === 'offline') return { tone: 'red', label: 'Offline' }
  return { tone: 'green', label: 'On schedule' }
}


function attendanceRiskForLedgerRow(
  row: AttendanceHistoryRow,
  user: UserStaffRecord,
  shiftStart: string,
  shiftEnd: string,
  graceMinutes: number
): { tone: AttendanceTone; label: string } {
  const normalizedRow = normalizeAttendanceDisplayRow(row) as Record<string, unknown>
  const rowDate = rowDateIso(row)
  const status = String(normalizedRow.status || normalizedRow.attendance_status || '').toLowerCase()

  const authorized =
    Boolean(normalizedRow.__authorizedAbsence) ||
    Boolean(rowDate && authorizedAbsenceForDate(authorizedAbsencesForUser(user), rowDate))

  if (authorized) {
    return { tone: 'blue', label: 'Authorized absence' }
  }

  const inValue = String(
    normalizedRow.punchInAt ||
    normalizedRow.check_in ||
    normalizedRow.punch_in_at ||
    ''
  )

  const outValue = String(
    normalizedRow.punchOutAt ||
    normalizedRow.check_out ||
    normalizedRow.punch_out_at ||
    ''
  )

  const hasNoTimes =
    !String(inValue || '').trim() ||
    String(inValue || '').trim() === '—'

  const hasNoOut =
    !String(outValue || '').trim() ||
    String(outValue || '').trim() === '—'

  if (
    Boolean(normalizedRow.__synthetic) ||
    status.includes('absent') ||
    status.includes('absence')
  ) {
    return { tone: 'red', label: 'Absent · no authorized record' }
  }

  if (hasNoTimes && hasNoOut) {
    return { tone: 'red', label: 'Absent · no authorized record' }
  }

  const shiftStartMin = minutesFromTime(shiftStart)
  const shiftEndMin = minutesFromTime(shiftEnd)
  const inMin = minutesFromDateTime(inValue)
  const outMin = minutesFromDateTime(outValue)

  const lateMinutes =
    shiftStartMin !== null && inMin !== null
      ? Math.max(0, inMin - shiftStartMin - Math.max(0, Number(graceMinutes || 0)))
      : 0

  const earlyOutMinutes =
    shiftEndMin !== null && outMin !== null
      ? Math.max(0, shiftEndMin - outMin)
      : 0

  if (lateMinutes > 0 && earlyOutMinutes > 0) {
    return { tone: 'red', label: `Delay +${lateMinutes} min · Early OUT ${earlyOutMinutes} min` }
  }

  if (earlyOutMinutes > 0) {
    return { tone: 'red', label: `Early OUT · ${earlyOutMinutes} min` }
  }

  if (lateMinutes > 0) {
    return { tone: 'red', label: `Delay +${lateMinutes} min` }
  }

  if (shiftEndMin !== null && outMin !== null && outMin > shiftEndMin) {
    return { tone: 'blue', label: `Overtime +${outMin - shiftEndMin} min` }
  }

  return { tone: 'green', label: 'Normal' }
}


function AttendanceHistoryModal({
  user,
  attendanceDate,
  shiftStart,
  shiftEnd,
  graceMinutes,
  setAttendanceDate,
  setShiftStart,
  setShiftEnd,
  setGraceMinutes,
  canOpenProfile,
  onClose,
}: {
  user: UserStaffRecord
  attendanceDate: string
  shiftStart: string
  shiftEnd: string
  graceMinutes: number
  setAttendanceDate: (value: string) => void
  setShiftStart: (value: string) => void
  setShiftEnd: (value: string) => void
  setGraceMinutes: (value: number) => void
  canOpenProfile: boolean
  onClose: () => void
}) {
  const history = attendanceHistoryForUser(user)
  const storedShiftRule = attendanceShiftRuleForUser(user)
  const todayIso = new Date().toISOString().slice(0, 10)
  const [ruleSaving, setRuleSaving] = useState(false)
  const [ruleMessage, setRuleMessage] = useState('')
  const [selectedMonth, setSelectedMonth] = useState((attendanceDate || todayIso).slice(0, 7))
  const [absenceType, setAbsenceType] = useState('authorized_absence')
  const [authorizedStartDate, setAuthorizedStartDate] = useState(attendanceDate || todayIso)
  const [authorizedEndDate, setAuthorizedEndDate] = useState(attendanceDate || todayIso)
  const [authorizedReason, setAuthorizedReason] = useState('')
  const [authorizedSaving, setAuthorizedSaving] = useState(false)
  const [authorizedMessage, setAuthorizedMessage] = useState('')
  const authorizedAbsences = useMemo(() => authorizedAbsencesForUser(user), [user])
  const monthRows = useMemo(
    () => fullMonthDatesUntilToday(selectedMonth).map((dateIso) =>
      attendanceLedgerRowForDate(dateIso, history, authorizedAbsences)
    ).reverse(),
    [history, selectedMonth, authorizedAbsences]
  )
  const selectedDateRow = useMemo(
    () => history.find((row) => rowDateIso(row) === attendanceDate) || monthRows[0] || null,
    [history, monthRows, attendanceDate]
  )
  const visibleHistory = history.filter((row) => !attendanceDate || rowDateIso(row) === attendanceDate)
  const rows = monthRows.length ? monthRows : (selectedDateRow ? [selectedDateRow] : [latestAttendanceFromUser(user)])
  const displayRows = rows.map(normalizeAttendanceDisplayRow)
  const selectedDisplayRow =
    displayRows.find((row) => rowDateIso(row) === attendanceDate) ||
    displayRows[0] ||
    normalizeAttendanceDisplayRow(latestAttendanceFromUser(user))
  const selectedRowFlag = attendanceRowFlag(selectedDisplayRow, shiftStart, shiftEnd, graceMinutes)
  const currentRisk = {
    tone: selectedRowFlag.tone,
    label: selectedRowFlag.label,
    detail: selectedRowFlag.details,
  }

  useEffect(() => {
    if (!storedShiftRule) return
    setShiftStart(savedRuleTime(storedShiftRule, 'shift_start', shiftStart))
    setShiftEnd(savedRuleTime(storedShiftRule, 'shift_end', shiftEnd))
    const savedGrace = Number(storedShiftRule.grace_minutes || graceMinutes)
    if (Number.isFinite(savedGrace)) setGraceMinutes(savedGrace)
  }, [user.id])

  async function saveShiftRule() {
    setRuleSaving(true)
    setRuleMessage('')

    try {
      const response = await fetch('/api/users/attendance-shift-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          staffId: user.staffId,
          employeeEmail: user.email,
          employeeName: user.fullName,
          shiftStart,
          shiftEnd,
          graceMinutes,
        }),
      })

      const json = await response.json().catch(() => ({}))

      if (!response.ok || !json.ok) {
        throw new Error(json.error || 'Unable to save shift rule')
      }

      setRuleMessage('Shift rule saved for this employee. Refresh to reload the stored rule.')
    } catch (error) {
      setRuleMessage(error instanceof Error ? error.message : 'Unable to save shift rule')
    } finally {
      setRuleSaving(false)
    }
  }



  async function saveAuthorizedAbsence() {
    setAuthorizedSaving(true)
    setAuthorizedMessage('')

    try {
      const response = await fetch('/api/users/attendance-authorized-absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          staffId: user.staffId,
          employeeEmail: user.email,
          employeeName: user.fullName,
          absenceType,
          startDate: authorizedStartDate,
          endDate: authorizedEndDate,
          reason: authorizedReason,
        }),
      })

      const json = await response.json().catch(() => ({}))

      if (!response.ok || !json.ok) {
        throw new Error(json.error || 'Unable to save authorized absence')
      }

      setAuthorizedMessage('Authorized absence saved. Refresh to reload the monthly ledger.')
    } catch (error) {
      setAuthorizedMessage(error instanceof Error ? error.message : 'Unable to save authorized absence')
    } finally {
      setAuthorizedSaving(false)
    }
  }

  function printAttendanceMonth() {
    const monthIso = selectedMonth || (attendanceDate || todayIso).slice(0, 7)
    const [yearText, monthText] = monthIso.split('-')
    const year = Number(yearText)
    const monthIndex = Number(monthText) - 1
    const daysInMonth = Number.isFinite(year) && Number.isFinite(monthIndex)
      ? new Date(year, monthIndex + 1, 0).getDate()
      : 31

    const monthDates = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1
      return `${monthIso}-${String(day).padStart(2, '0')}`
    })

    const rowsForPrint = monthDates.map((dateIso) => {
      const existing = monthRows.find((row) => rowDateIso(row) === dateIso)
      return normalizeAttendanceDisplayRow(
        existing || attendanceLedgerRowForDate(dateIso, history, authorizedAbsences)
      )
    })

    const printDate = new Date()
    const userName = String(user.fullName || user.name || user.email || 'USER').trim()
    const safeUserCode = userName
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 22) || 'USER'

    const reference = `AC-ATT-${safeUserCode}-${monthIso}`
    const hrRouteReference = `HR-ROUTE-ATT-${safeUserCode}-${monthIso}-${printDate.getFullYear()}${String(printDate.getMonth() + 1).padStart(2, '0')}${String(printDate.getDate()).padStart(2, '0')}-${String(printDate.getHours()).padStart(2, '0')}${String(printDate.getMinutes()).padStart(2, '0')}`
    const generatedAt = printDate.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const monthLabel = new Date(`${monthIso}-01T12:00:00`).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    })

    const escapeHtml = (value: unknown) =>
      String(value ?? '—')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')

    const minutesOfDay = (value: string) => {
      const match = String(value || '').match(/^(\d{1,2}):(\d{2})/)
      if (!match) return null
      return Number(match[1]) * 60 + Number(match[2])
    }

    const workedMinutes = (row: AttendanceHistoryRow) => {
      const inValue = attendanceTimeValue(row, 'in')
      const outValue = attendanceTimeValue(row, 'out')
      const pauseValue = attendanceTimeValue(row, 'pause')
      const retourValue = attendanceTimeValue(row, 'retour')
      const inMin = minutesOfDay(inValue)
      const outMin = minutesOfDay(outValue)
      if (inMin === null || outMin === null || outMin <= inMin) return 0
      let pauseMinutes = 0
      const pauseMin = minutesOfDay(pauseValue)
      const retourMin = minutesOfDay(retourValue)
      if (pauseMin !== null && retourMin !== null && retourMin > pauseMin) pauseMinutes = retourMin - pauseMin
      return Math.max(0, outMin - inMin - pauseMinutes)
    }

    const formatWorked = (minutes: number) => {
      if (!minutes) return '—'
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      return `${h}:${String(m).padStart(2, '0')}`
    }

    const toneClass = (tone: AttendanceTone) => {
      if (tone === 'authorized') return 'authorized'
      if (tone === 'absence' || tone === 'critical' || tone === 'red') return 'red'
      if (tone === 'delay' || tone === 'amber') return 'amber'
      if (tone === 'early') return 'early'
      if (tone === 'overtime' || tone === 'blue') return 'blue'
      if (tone === 'slate') return 'slate'
      return 'green'
    }

    const iconForTone = (tone: AttendanceTone) => {
      if (tone === 'authorized') return '🛡'
      if (tone === 'absence' || tone === 'critical' || tone === 'red') return '✖'
      if (tone === 'delay' || tone === 'amber') return '⚠'
      if (tone === 'early') return '↘'
      if (tone === 'overtime' || tone === 'blue') return '★'
      if (tone === 'slate') return '●'
      return '✓'
    }

    let presentDays = 0
    let authorizedDays = 0
    let absentDays = 0
    let delayDays = 0
    let earlyDays = 0
    let overtimeDays = 0
    let totalWorkedMinutes = 0

    const tableRows = rowsForPrint.map((row, index) => {
      const dateIso = rowDateIso(row) || monthDates[index]
      const date = new Date(`${dateIso}T12:00:00`)
      const weekday = Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')
      const dayText = Number.isNaN(date.getTime())
        ? String(index + 1)
        : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).replace('.', '')

      const flag = attendanceRowFlag(row, shiftStart, shiftEnd, graceMinutes)
      const cls = toneClass(flag.tone)
      const icon = iconForTone(flag.tone)
      const worked = workedMinutes(row)
      totalWorkedMinutes += worked

      if (cls === 'green') presentDays += 1
      if (cls === 'authorized') authorizedDays += 1
      if (cls === 'red') absentDays += 1
      if (cls === 'amber') delayDays += 1
      if (cls === 'early') earlyDays += 1
      if (cls === 'blue') overtimeDays += 1

      const authorized = authorizedAbsenceForDate(authorizedAbsences, dateIso)
      const authorizedLabel = authorized
        ? String(
            authorized.reason ||
            authorized.absence_reason ||
            authorized.type ||
            authorized.absence_type ||
            'Absence autorisée'
          )
        : '—'

      const notes = flag.details || row.notes || row.note || row.source || '—'

      return `
        <tr>
          <td class="day-cell">
            <strong>${index + 1}</strong>
            <span>${escapeHtml(weekday)}</span>
            <em>${escapeHtml(dayText)}</em>
          </td>
          <td>${escapeHtml(attendanceTimeValue(row, 'in') || '—')}</td>
          <td>${escapeHtml(attendanceTimeValue(row, 'out') || '—')}</td>
          <td>${escapeHtml(attendanceTimeValue(row, 'pause') || '—')}</td>
          <td>${escapeHtml(attendanceTimeValue(row, 'retour') || '—')}</td>
          <td><strong>${escapeHtml(formatWorked(worked))}</strong></td>
          <td><span class="status ${cls}"><span>${icon}</span>${escapeHtml(flag.label)}</span></td>
          <td>${escapeHtml(flag.details || '—')}</td>
          <td>${escapeHtml(authorizedLabel)}</td>
          <td>${escapeHtml(notes)}</td>
        </tr>
      `
    }).join('')

    const totalWorked = formatWorked(totalWorkedMinutes)
    const logoHtml = `<img src="/logo.png" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" /><strong class="logo-fallback">ANGELCARE</strong>`

    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(reference)}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #eef2f7;
      font-family: Calibri, Arial, Helvetica, sans-serif;
      color: #071631;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      padding: 6mm 6mm 5mm;
      border: 1px solid #d8e2f0;
      box-shadow: 0 18px 50px rgba(15,23,42,.16);
    }
    .header {
      display: grid;
      grid-template-columns: 55mm 1fr 45mm;
      gap: 5mm;
      align-items: start;
      border-bottom: 2px solid #173f82;
      padding-bottom: 3mm;
    }
    .brand img {
      width: 49mm;
      max-height: 18mm;
      object-fit: contain;
      object-position: left center;
      display: block;
    }
    .logo-fallback {
      display: none;
      font-size: 26px;
      letter-spacing: .04em;
      color: #123f87;
      font-weight: 900;
    }
    .brand small {
      display: block;
      margin-top: .5mm;
      color: #0b2d66;
      font-size: 8px;
      font-weight: 700;
      letter-spacing: .02em;
      text-align: center;
    }
    .title-block { text-align: center; }
    .title-block h1 {
      margin: 0;
      font-family: Calibri, Arial, Helvetica, sans-serif;
      font-size: 20px;
      line-height: 1.05;
      font-weight: 900;
      letter-spacing: .025em;
      text-transform: uppercase;
      color: #071631;
      border-bottom: 2px solid #173f82;
      padding-bottom: 3mm;
    }
    .ref {
      margin-top: 3mm;
      color: #1261d6;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: .035em;
      text-transform: uppercase;
    }
    .doc-meta {
      display: grid;
      gap: 1.3mm;
      font-size: 8px;
      color: #071631;
      font-weight: 800;
    }
    .doc-meta div {
      display: grid;
      grid-template-columns: 16px 1fr auto;
      gap: 5px;
      align-items: center;
    }
    .pill-final {
      background: #047857;
      color: #fff;
      border-radius: 8px;
      padding: 2px 7px;
      font-weight: 900;
    }
    .box {
      border: 1.5px solid #173f82;
      border-radius: 8px;
      padding: 2.5mm 3mm 2mm;
      margin-top: 4mm;
    }
    .box-title {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin: -7mm 0 2mm;
      background: #08275c;
      color: #fff;
      border-radius: 7px 7px 7px 0;
      padding: 1.4mm 3.2mm;
      font-size: 8.4px;
      font-weight: 900;
      letter-spacing: .025em;
      text-transform: uppercase;
    }
    .user-grid {
      display: grid;
      grid-template-columns: 1.15fr .95fr .95fr 1fr;
      gap: 4mm;
    }
    .field {
      display: grid;
      grid-template-columns: 13px 22mm 1fr;
      gap: 1.4mm;
      align-items: center;
      padding: .75mm 0;
      border-bottom: 0;
      font-size: 7.7px;
    }
    .field strong { color: #071631; font-weight: 900; }
    .active-badge {
      display: inline-flex;
      background: #047857;
      color: #fff;
      padding: 1mm 2.5mm;
      border-radius: 7px;
      font-weight: 900;
      width: max-content;
    }
    .kpis {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 3mm;
      margin-top: 4mm;
    }
    .kpi {
      min-height: 14mm;
      border-radius: 7px;
      padding: 2mm;
      display: grid;
      grid-template-columns: 9mm 1fr;
      gap: 2mm;
      align-items: center;
      border: 1.3px solid #dbe5f2;
      background: #fff;
    }
    .kpi .icon {
      width: 8mm;
      height: 8mm;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 11px;
      font-weight: 900;
    }
    .kpi small {
      display: block;
      font-size: 6.3px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .025em;
      line-height: 1.08;
    }
    .kpi strong {
      display: block;
      margin-top: .6mm;
      font-size: 16px;
      line-height: 1;
      font-weight: 900;
    }
    .kpi.green { border-color: #86efac; color: #047857; }
    .kpi.green .icon { background: #dcfce7; }
    .kpi.amber { border-color: #fde68a; color: #b45309; }
    .kpi.amber .icon { background: #fffbeb; }
    .kpi.red { border-color: #fecaca; color: #dc2626; }
    .kpi.red .icon { background: #fef2f2; }
    .kpi.blue { border-color: #bfdbfe; color: #1d4ed8; }
    .kpi.blue .icon { background: #eff6ff; }
    .ledger {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 3.8mm;
      overflow: hidden;
      border: 1px solid #cfd9e8;
      border-radius: 6px;
      font-size: 6.4px;
    }
    .ledger th {
      background: #08275c;
      color: #fff;
      padding: 1mm .55mm;
      text-align: center;
      font-size: 6.1px;
      font-weight: 900;
      text-transform: uppercase;
      border-right: 1px solid rgba(255,255,255,.25);
      line-height: 1.05;
    }
    .ledger td {
      padding: .72mm .45mm;
      text-align: center;
      border-right: 1px solid #dbe3ee;
      border-bottom: 1px solid #e4ebf4;
      vertical-align: middle;
      line-height: 1.05;
    }
    .ledger tr:nth-child(even) td { background: #fbfdff; }
    .day-cell {
      display: grid;
      grid-template-columns: 11px 20px 1fr;
      gap: 2px;
      align-items: center;
      text-align: left !important;
      white-space: nowrap;
    }
    .day-cell strong { color: #071631; font-weight: 900; }
    .day-cell span { color: #123f87; font-weight: 800; }
    .day-cell em { color: #334155; font-style: normal; font-weight: 700; }
    .status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 2.5px;
      min-width: 19mm;
      border-radius: 999px;
      padding: .5mm 1mm;
      font-weight: 900;
      white-space: nowrap;
      border: 1px solid transparent;
    }
    .status.green { color: #047857; background: #ecfdf5; border-color: #bbf7d0; }
    .status.amber { color: #b45309; background: #fffbeb; border-color: #fde68a; }
    .status.red, .status.early { color: #dc2626; background: #fef2f2; border-color: #fecaca; }
    .status.blue { color: #1d4ed8; background: #eff6ff; border-color: #bfdbfe; }
    .status.authorized { color: #ea580c; background: #fff7ed; border-color: #fed7aa; }
    .status.slate { color: #64748b; background: #f8fafc; border-color: #e2e8f0; }
    .legend {
      display: grid;
      grid-template-columns: repeat(9, 1fr);
      gap: 1.2mm;
      margin-top: 2.8mm;
      border: 1px solid #dbe3ee;
      border-radius: 7px;
      padding: 1.4mm;
    }
    .legend div {
      display: grid;
      gap: .55mm;
      text-align: center;
      font-size: 5.7px;
      font-weight: 800;
      color: #334155;
    }
    .legend strong { font-size: 6.4px; }
    .footer-panels {
      display: grid;
      grid-template-columns: 1.08fr 1.05fr .95fr 31mm;
      gap: 3mm;
      margin-top: 3mm;
      border: 1px solid #dbe3ee;
      border-radius: 8px;
      padding: 2mm;
    }
    .footer-panels h3 {
      margin: 0 0 1.4mm;
      font-size: 8px;
      color: #08275c;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .035em;
    }
    .footer-panels p, .footer-panels li {
      margin: .8mm 0;
      font-size: 6.2px;
      color: #334155;
      line-height: 1.22;
      font-weight: 700;
    }
    .sign-line {
      display: grid;
      grid-template-columns: 23mm 1fr;
      gap: 2mm;
      align-items: center;
      font-size: 6.2px;
      margin: 2mm 0;
      color: #334155;
      font-weight: 800;
    }
    .sign-line span:last-child {
      height: 1px;
      background: #a8b6cb;
    }
    .stamp-sign {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      display: grid;
      gap: 1.4mm;
      padding: 1.7mm;
      color: #08275c;
      font-weight: 900;
      min-height: 30mm;
    }
    .stamp-sign h3 {
      margin: 0;
      font-size: 7.4px;
      color: #08275c;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .035em;
    }
    .stamp-box {
      min-height: 15mm;
      border: 1.4px dashed #173f82;
      border-radius: 8px;
      display: grid;
      place-items: center;
      text-align: center;
      color: #173f82;
      background: linear-gradient(135deg,#ffffff,#f8fbff);
    }
    .stamp-box span {
      font-size: 12px;
      letter-spacing: .18em;
      font-weight: 900;
      opacity: .72;
    }
    .stamp-box small {
      display: block;
      margin-top: -3mm;
      font-size: 5.7px;
      color: #64748b;
      font-weight: 800;
      letter-spacing: .02em;
    }
    .signature-line {
      border-top: 1px solid #94a3b8;
      padding-top: 1mm;
      font-size: 6.2px;
      color: #334155;
      text-align: center;
      font-weight: 800;
    }
    /* compact one-page attendance print */
    .user-grid .field span:first-child { font-size: 8px; }
    .ledger th:nth-child(8),
    .ledger td:nth-child(8),
    .ledger th:nth-child(10),
    .ledger td:nth-child(10) {
      max-width: 19mm;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ledger th:nth-child(7),
    .ledger td:nth-child(7) {
      max-width: 24mm;
      white-space: nowrap;
    }
    .footer-panels {
      margin-top: 2mm;
      gap: 2mm;
      padding: 1.6mm;
    }


    .hr-route-footer {
      display: grid;
      grid-template-columns: 1.25fr 1.15fr 1fr 1.35fr;
      gap: 2mm;
      margin-top: 2.4mm;
      padding: 2mm 2.4mm;
      border: 1.4px solid #173f82;
      border-radius: 8px;
      background: linear-gradient(135deg,#ffffff,#f8fbff);
      color: #08275c;
    }
    .hr-route-footer div {
      display: grid;
      gap: .8mm;
      min-width: 0;
      padding-right: 2mm;
      border-right: 1px solid #dbe3ee;
    }
    .hr-route-footer div:last-child {
      border-right: 0;
      padding-right: 0;
    }
    .hr-route-footer strong {
      font-size: 6px;
      font-weight: 900;
      letter-spacing: .06em;
      text-transform: uppercase;
      color: #173f82;
      white-space: nowrap;
    }
    .hr-route-footer span {
      font-size: 6.4px;
      font-weight: 850;
      color: #071631;
      line-height: 1.2;
      word-break: break-word;
    }

    @media print {
      body { background: #fff; }
      .sheet { box-shadow: none; border: 0; width: auto; min-height: auto; padding: 0; }
    }
  </style>
</head>
<body>
  <main class="sheet">
    <header class="header">
      <div class="brand">
        ${logoHtml}
        <small>Care beyond service</small>
      </div>
      <div class="title-block">
        <h1>RAPPORT MENSUEL DE PRÉSENCE</h1>
        <div class="ref">${escapeHtml(reference)}</div>
      </div>
      <div class="doc-meta">
        <div><span>☑</span><span>Version</span><strong>1.0</strong></div>
        <div><span>●</span><span>Statut</span><strong class="pill-final">FINAL</strong></div>
        <div><span>📅</span><span>Généré le</span><strong>${escapeHtml(generatedAt)}</strong></div>
      </div>
    </header>

    <section class="box">
      <div class="box-title">👤 Informations utilisateur</div>
      <div class="user-grid">
        <div>
          <div class="field"><span>👤</span><span>Nom complet</span><strong>${escapeHtml(userName)}</strong></div>
          <div class="field"><span>🔐</span><span>Utilisateur</span><strong>${escapeHtml(user.username || user.email || '—')}</strong></div>
          <div class="field"><span>🏢</span><span>Département</span><strong>${escapeHtml(user.department || '—')}</strong></div>
        </div>
        <div>
          <div class="field"><span>💼</span><span>Poste</span><strong>${escapeHtml(user.jobTitle || user.position || user.role || '—')}</strong></div>
          <div class="field"><span>🧭</span><span>Rôle</span><strong>${escapeHtml(user.role || '—')}</strong></div>
          <div class="field"><span>✅</span><span>Statut</span><strong class="active-badge">${escapeHtml(user.status || 'active')}</strong></div>
        </div>
        <div>
          <div class="field"><span>🌐</span><span>Langue</span><strong>${escapeHtml(user.language || 'fr')}</strong></div>
          <div class="field"><span>🕘</span><span>Horaire</span><strong>${escapeHtml(shiftStart)} – ${escapeHtml(shiftEnd)}</strong></div>
          <div class="field"><span>⌛</span><span>Grâce</span><strong>${escapeHtml(graceMinutes)} min</strong></div>
        </div>
        <div>
          <div class="field"><span>📆</span><span>Mois</span><strong>${escapeHtml(monthLabel)}</strong></div>
          <div class="field"><span>🧾</span><span>Jours totaux</span><strong>${daysInMonth}</strong></div>
          <div class="field"><span>🧩</span><span>Référence</span><strong>${escapeHtml(reference)}</strong></div>
        </div>
      </div>
    </section>

    <section class="kpis">
      <div class="kpi green"><div class="icon">✓</div><div><small>Jours présents</small><strong>${presentDays}</strong></div></div>
      <div class="kpi amber"><div class="icon">🛡</div><div><small>Absences autorisées</small><strong>${authorizedDays}</strong></div></div>
      <div class="kpi amber"><div class="icon">⏱</div><div><small>Retards</small><strong>${delayDays}</strong></div></div>
      <div class="kpi red"><div class="icon">↘</div><div><small>Départs anticipés</small><strong>${earlyDays}</strong></div></div>
      <div class="kpi blue"><div class="icon">↗</div><div><small>Heures supplémentaires</small><strong>${overtimeDays}</strong></div></div>
      <div class="kpi blue"><div class="icon">◷</div><div><small>Heures totales</small><strong>${totalWorked}</strong></div></div>
    </section>

    <table class="ledger">
      <thead>
        <tr>
          <th>Jour / Date</th>
          <th>IN</th>
          <th>OUT</th>
          <th>Pause</th>
          <th>Retour</th>
          <th>Heures<br/>travaillées</th>
          <th>Statut de présence</th>
          <th>Risque / Drapeau</th>
          <th>Absence<br/>autorisée</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>

    <section class="legend">
      <div><strong style="color:#047857">✓ Présent</strong><span>Selon horaire</span></div>
      <div><strong style="color:#b45309">⚠ Retard</strong><span>Arrivée tardive</span></div>
      <div><strong style="color:#dc2626">↘ Départ anticipé</strong><span>Sortie en avance</span></div>
      <div><strong style="color:#1d4ed8">★ Heures supp.</strong><span>Temps additionnel</span></div>
      <div><strong style="color:#ea580c">🛡 Absence autorisée</strong><span>Congé approuvé</span></div>
      <div><strong style="color:#dc2626">✖ Absent</strong><span>Sans autorisation</span></div>
      <div><strong style="color:#1d4ed8">⌛ En session</strong><span>En cours</span></div>
      <div><strong style="color:#64748b">● Week-end</strong><span>Jour non ouvré</span></div>
      <div><strong style="color:#1d4ed8">ℹ Info</strong><span>À surveiller</span></div>
    </section>

    <section class="footer-panels">
      <div>
        <h3>📝 Notes</h3>
        <p>• Les heures travaillées sont calculées hors durée de pause.</p>
        <p>• Grâce accordée : ${escapeHtml(graceMinutes)} minutes, appliquée au check-in.</p>
        <p>• Toute divergence doit être signalée au manager.</p>
      </div>
      <div>
        <h3>⚙ Généré par le système</h3>
        <p>Ce rapport est généré automatiquement depuis les données de présence synchronisées.</p>
        <p><strong>Référence route RH :</strong> ${escapeHtml(hrRouteReference)}</p>
        <p>Document valide après cachet et signature manager.</p>
      </div>
      <div>
        <h3>👤 Approbation</h3>
        <div class="sign-line"><span>Approuvé par</span><span></span></div>
        <div class="sign-line"><span>Poste</span><span></span></div>
        <div class="sign-line"><span>Date</span><span></span></div>
      </div>
      <div class="stamp-sign">
        <h3>🖋 Cachet & signature</h3>
        <div class="stamp-box">
          <span>STAMP</span>
          <small>Manager / HR validation</small>
        </div>
        <div class="signature-line">Signature manager</div>
      </div>
    </section>
    <footer class="hr-route-footer">
      <div>
        <strong>HR DOCUMENT ROUTE REFERENCE</strong>
        <span>${escapeHtml(hrRouteReference)}</span>
      </div>
      <div>
        <strong>ATTENDANCE DOCUMENT REFERENCE</strong>
        <span>${escapeHtml(reference)}</span>
      </div>
      <div>
        <strong>MONTHLY REPORT STATUS</strong>
        <span>FINAL · MANAGER STAMP & SIGNATURE REQUIRED</span>
      </div>
      <div>
        <strong>GENERATED BY</strong>
        <span>ANGELCARE HR ATTENDANCE SYSTEM · ${escapeHtml(generatedAt)}</span>
      </div>
    </footer>

  </main>
  <script>
    window.onload = () => {
      window.focus()
      window.print()
    }
  </script>
</body>
</html>`

    const printWindow = window.open('', '_blank', 'width=1000,height=1400')
    if (!printWindow) return
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  }

  return (
    <div style={attendanceModalOverlayStyle} role="dialog" aria-modal="true">
      <div style={attendanceModalStyle}>
        <div style={attendanceModalHeaderStyle}>
          <div style={userCellStyle}>
            <UserPortrait user={user} size={58} style={attendanceModalAvatarStyle} />
            <div>
              <div style={attendanceModalTitleStyle}>{user.fullName || 'Unnamed user'}</div>
              <div style={attendanceModalSubStyle}>{user.email || '—'} · {user.department || '—'} · {user.role || '—'}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={modalCloseButtonStyle}>×</button>
        </div>

        <div style={attendanceModalShiftPanelStyle}>
          <div>
            <div style={modalSectionTitleStyle}>Shift range & automatic flags</div>
            <div style={modalSectionDetailStyle}>Set the expected shift for this user/date to identify delays, overtime and absence inside the history table.</div>
          </div>
          <div style={modalShiftControlsStyle}>
            <label style={modalLabelStyle}>Date<input type="date" value={attendanceDate} onChange={(event) => { const v = event.target.value; setAttendanceDate(v); if (v) setSelectedMonth(v.slice(0, 7)); }} style={modalInputStyle} /></label>
            <label style={modalLabelStyle}>Month<input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} style={modalInputStyle} /></label>
            <label style={modalLabelStyle}>Shift start<input type="time" value={shiftStart} onChange={(event) => setShiftStart(event.target.value)} style={modalInputStyle} /></label>
            <label style={modalLabelStyle}>Shift end<input type="time" value={shiftEnd} onChange={(event) => setShiftEnd(event.target.value)} style={modalInputStyle} /></label>
            <label style={modalLabelStyle}>Grace min<input type="number" min={0} max={90} value={graceMinutes} onChange={(event) => setGraceMinutes(Number(event.target.value || 0))} style={modalInputStyle} /></label>
            <button type="button" onClick={saveShiftRule} disabled={ruleSaving} style={attendanceModalDoneButtonStyle}>{ruleSaving ? 'Saving…' : 'Save employee rule'}</button>
            <button type="button" onClick={printAttendanceMonth} style={attendanceModalDoneButtonStyle}>Print month A4</button>
            {ruleMessage ? <div style={modalSectionDetailStyle}>{ruleMessage}</div> : null}

            <label style={modalLabelStyle}>Absence type
              <select value={absenceType} onChange={(event) => setAbsenceType(event.target.value)} style={modalInputStyle}>
                <option value="authorized_absence">Authorized absence</option>
                <option value="paid_leave">Paid leave</option>
                <option value="sick_leave">Sick leave</option>
                <option value="mission_leave">Mission / field authorization</option>
                <option value="training_leave">Training authorization</option>
              </select>
            </label>
            <label style={modalLabelStyle}>Absence from
              <input type="date" value={authorizedStartDate} onChange={(event) => setAuthorizedStartDate(event.target.value)} style={modalInputStyle} />
            </label>
            <label style={modalLabelStyle}>Absence until
              <input type="date" value={authorizedEndDate} onChange={(event) => setAuthorizedEndDate(event.target.value)} style={modalInputStyle} />
            </label>
            <label style={modalLabelStyle}>Reason
              <input value={authorizedReason} onChange={(event) => setAuthorizedReason(event.target.value)} placeholder="Reason / approval note" style={modalInputStyle} />
            </label>
            <button type="button" onClick={saveAuthorizedAbsence} disabled={authorizedSaving} style={attendanceModalDoneButtonStyle}>{authorizedSaving ? 'Saving…' : 'Save authorized absence'}</button>
            {authorizedMessage ? <div style={modalSectionDetailStyle}>{authorizedMessage}</div> : null}
          </div>
        </div>

        <div style={attendanceModalKpiRowStyle}>
          <AttendanceKpiCard icon="📅" label="Selected date" value={formatAttendanceDateLabel(attendanceDate)} detail="Exact date filter" tone="blue" />
          <AttendanceKpiCard icon="🧭" label="Live state" value={normalizedAttendanceStatus(user).toUpperCase()} detail="Overhead synced status" tone={attendanceToneFromState(normalizedAttendanceStatus(user))} />
          <AttendanceKpiCard icon="⚑" label="Flag result" value={currentRisk.label} detail="Based on shift range" tone={currentRisk.tone} />
        </div>

        <div style={attendanceHistoryListStyle}>
          {displayRows.map((row, index) => {
            const risk = attendanceRiskFromRow(row, user, shiftStart, shiftEnd, graceMinutes, attendanceDate)
            return (
              <div key={`${rowDateIso(row)}-${index}`} style={attendanceHistoryRowStyle}>
                <div style={attendanceHistoryDateStyle}>
                  <span style={historyCalendarIconStyle}>📆</span>
                  <strong>{formatAttendanceDateLabel(rowDateIso(row) || attendanceDate)}</strong>
                  <span style={attendanceRiskPillStyle(risk.tone)}>{risk.label}</span>
                </div>
                <div style={attendanceHistoryPunchGridStyle}>
                  <PunchSignal label="IN" value={readAttendanceTime(row, ['punch_in_at', 'in_at', 'clock_in_at', 'started_at'])} tone="green" />
                  <PunchSignal label="OUT" value={readAttendanceTime(row, ['punch_out_at', 'out_at', 'clock_out_at', 'ended_at'])} tone="red" />
                  <PunchSignal label="Pause" value={readAttendanceTime(row, ['pause_at', 'pause_start_at', 'break_start_at'])} tone="amber" />
                  <PunchSignal label="Retour" value={readAttendanceTime(row, ['retour_at', 'return_at', 'pause_end_at', 'break_end_at'])} tone="blue" />
                </div>
                <div style={attendanceHistoryMetaStyle}>
                  <span>Status: {getAttendanceValue(row, ['status'], user.attendanceStatus || '—')}</span>
                  <span>Created: {formatAttendanceTime(getAttendanceValue(row, ['created_at']))}</span>
                  <span>Source: HR attendance records</span>
                </div>
              </div>
            )
          })}
        </div>

        <div style={attendanceModalFooterStyle}>
          {canOpenProfile ? <Link href={`/users/${user.id}/attendance`} style={miniLinkStyle}>Open full attendance file</Link> : <button type="button" style={miniDisabledButtonStyle} disabled>Restricted</button>}
          <button type="button" onClick={onClose} style={attendanceModalDoneButtonStyle}>Close history</button>
        </div>
      </div>
    </div>
  )
}

function attendanceRiskFromRow(row: AttendanceHistoryRow, user: UserStaffRecord, shiftStart: string, shiftEnd: string, graceMinutes: number, attendanceDate: string): { tone: AttendanceTone; label: string } {
  const inValue = getAttendanceValue(row, ['punch_in_at', 'check_in', 'check_in_at', 'in_at', 'clock_in_at', 'started_at'], user.punchInAt)
  const outValue = getAttendanceValue(row, ['punch_out_at', 'check_out', 'check_out_at', 'out_at', 'clock_out_at', 'ended_at'], user.punchOutAt)
  const shiftStartMin = minutesFromTime(shiftStart)
  const shiftEndMin = minutesFromTime(shiftEnd)
  const inMin = minutesFromDateTime(inValue)
  const outMin = minutesFromDateTime(outValue)
  const rowIso = rowDateIso(row)
  if (!inValue && !outValue && (!rowIso || rowIso === attendanceDate)) return { tone: 'red', label: 'Absence' }
  if (shiftStartMin !== null && inMin !== null && inMin > shiftStartMin + graceMinutes) return { tone: 'red', label: `Delay +${inMin - shiftStartMin} min` }
  if (shiftEndMin !== null && outMin !== null && outMin > shiftEndMin + graceMinutes) return { tone: 'blue', label: `Overtime +${outMin - shiftEndMin} min` }
  return { tone: 'green', label: 'Normal' }
}

function attendanceToneFromState(state: string): AttendanceTone {
  if (state === 'online') return 'green'
  if (state === 'paused') return 'amber'
  if (state === 'completed') return 'blue'
  return 'red'
}

function AttendanceKpiCard({ icon, label, value, detail, tone }: { icon: string; label: string; value: string; detail: string; tone: AttendanceTone }) {
  return (
    <div style={attendanceKpiCardStyle(tone)}>
      <div style={attendanceKpiIconStyle}>{icon}</div>
      <div>
        <div style={smallStatLabelStyle}>{label}</div>
        <div style={attendanceKpiValueStyle}>{value}</div>
        <div style={attendanceKpiDetailStyle}>{detail}</div>
      </div>
    </div>
  )
}

function LiveStatusPill({ state }: { state: string }) {
  const tone = attendanceToneFromState(state)
  const label = state === 'online' ? 'CONNECTED · IN' : state === 'paused' ? 'PAUSED' : state === 'completed' ? 'COMPLETED' : 'OFFLINE · OUT'
  return <span style={liveStatusPillStyle(tone)}><span style={liveStatusDotStyle(tone)} />{label}</span>
}

function OverheadSyncTag({ label, value, tone }: { label: string; value: string; tone: AttendanceTone }) {
  return <span style={overheadSyncTagStyle(tone)}><strong>{label}</strong>{value}</span>
}

function PunchSignal({ label, value, tone }: { label: string; value: string; tone: AttendanceTone }) {
  return (
    <div style={punchSignalStyle(tone)}>
      <span style={punchSignalLabelStyle}>{label}</span>
      <strong style={punchSignalValueStyle}>{value || '—'}</strong>
    </div>
  )
}

function AttendanceMiniMeta({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={attendanceMiniMetaStyle}>
      <span>{icon}</span>
      <div>
        <div style={attendanceMiniMetaLabelStyle}>{label}</div>
        <div style={attendanceMiniMetaValueStyle}>{value || '—'}</div>
      </div>
    </div>
  )
}


const premiumAttendanceWorkspaceStyle: CSSProperties = {
  padding: 18,
  borderRadius: 28,
  border: '1px solid rgba(203,213,225,.9)',
  background: 'linear-gradient(135deg,#ffffff 0%,#f8fbff 54%,#eef6ff 100%)',
  boxShadow: '0 28px 80px rgba(15,23,42,.08)',
}
const premiumAttendanceHeroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 680px)', gap: 18, alignItems: 'stretch', marginBottom: 16 }
const premiumAttendanceHeroLeftStyle: CSSProperties = { padding: 20, borderRadius: 24, border: '1px solid rgba(219,234,254,.95)', background: 'rgba(255,255,255,.88)', boxShadow: '0 18px 45px rgba(30,64,175,.08)' }
const premiumAttendanceTitleStyle: CSSProperties = { margin: '8px 0 8px', fontSize: 32, letterSpacing: '-.04em', color: '#0f172a' }
const attendanceLiveTagRowStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }
const liveSyncPillStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', borderRadius: 999, padding: '8px 12px', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }
const greenDotStyle: CSSProperties = { width: 9, height: 9, borderRadius: 99, background: '#22c55e', boxShadow: '0 0 0 5px rgba(34,197,94,.14)' }
const attendanceDatePillStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', border: '1px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 999, padding: '8px 12px', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }
const premiumAttendanceKpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }
const attendanceKpiIconStyle: CSSProperties = { width: 42, height: 42, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#fff', border: '1px solid rgba(226,232,240,.9)', boxShadow: '0 10px 26px rgba(15,23,42,.06)' }
const attendanceKpiValueStyle: CSSProperties = { marginTop: 3, fontSize: 20, fontWeight: 950, color: '#0f172a', letterSpacing: '-.03em' }
const attendanceKpiDetailStyle: CSSProperties = { marginTop: 2, fontSize: 11, fontWeight: 800, color: '#64748b' }
const attendanceFilterCommandStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(240px,1fr) 170px 210px 220px', gap: 10, padding: 12, borderRadius: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 16px 36px rgba(15,23,42,.05)', marginBottom: 14 }
const attendanceSearchInputStyle: CSSProperties = { width: '100%', height: 46, borderRadius: 16, border: '1px solid #dbe5f2', padding: '0 16px', outline: 'none', fontWeight: 800, color: '#0f172a', background: '#f8fafc' }
const attendanceDateInputStyle: CSSProperties = { height: 46, borderRadius: 16, border: '1px solid #dbe5f2', padding: '0 14px', outline: 'none', fontWeight: 900, color: '#0f172a', background: '#f8fafc' }
const attendanceSelectStyle: CSSProperties = { height: 46, borderRadius: 16, border: '1px solid #dbe5f2', padding: '0 14px', outline: 'none', fontWeight: 900, color: '#0f172a', background: '#f8fafc' }
const overheadSyncStripStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: 12, borderRadius: 22, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg,#ffffff,#f8fafc)', marginBottom: 18 }
const overheadSyncHintStyle: CSSProperties = { marginLeft: 'auto', color: '#64748b', fontSize: 12, fontWeight: 800 }
const attendanceCardGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 16 }
const attendanceUserCardStyle: CSSProperties = { textAlign: 'left', border: '1px solid #dbe5f2', background: 'linear-gradient(135deg,#ffffff,#f8fbff)', borderRadius: 26, padding: 16, cursor: 'pointer', boxShadow: '0 18px 48px rgba(15,23,42,.07)', transition: 'transform .18s ease, border-color .18s ease, box-shadow .18s ease' }
const attendanceCardTopStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }
const attendanceAvatarStyle: CSSProperties = { width: 46, height: 46, borderRadius: 17, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#2563eb,#06b6d4)', color: '#fff', fontWeight: 950, boxShadow: '0 14px 30px rgba(37,99,235,.24)' }
const attendanceUserNameStyle: CSSProperties = { fontSize: 14, fontWeight: 950, color: '#0f172a', letterSpacing: '-.02em' }
const attendanceUserSubStyle: CSSProperties = { marginTop: 3, fontSize: 12, fontWeight: 800, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 210 }
const attendanceUserMetaGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, marginBottom: 12 }
const attendanceMiniMetaStyle: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', border: '1px solid #eef2f7', background: '#fff', borderRadius: 16, padding: 10 }
const attendanceMiniMetaLabelStyle: CSSProperties = { fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 900, color: '#94a3b8' }
const attendanceMiniMetaValueStyle: CSSProperties = { marginTop: 2, fontSize: 12, fontWeight: 950, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const punchActionGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 8, marginBottom: 12 }
const punchSignalLabelStyle: CSSProperties = { fontSize: 9, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.1em' }
const punchSignalValueStyle: CSSProperties = { display: 'block', marginTop: 5, fontSize: 14, fontWeight: 950, color: '#0f172a' }
const attendanceCardFooterStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 10, borderTop: '1px solid #eef2f7' }
const attendanceOpenHintStyle: CSSProperties = { fontSize: 12, fontWeight: 950, color: '#2563eb' }
const attendanceModalOverlayStyle: CSSProperties = { position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,.48)', backdropFilter: 'blur(10px)', display: 'grid', placeItems: 'center', padding: 22 }
const attendanceModalStyle: CSSProperties = { width: 'min(1180px,96vw)', maxHeight: '90vh', overflow: 'auto', borderRadius: 30, background: 'linear-gradient(135deg,#ffffff,#f8fbff)', border: '1px solid rgba(226,232,240,.95)', boxShadow: '0 40px 120px rgba(15,23,42,.28)', padding: 18 }
const attendanceModalHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: 14, borderRadius: 22, background: '#fff', border: '1px solid #e2e8f0', marginBottom: 14 }
const attendanceModalAvatarStyle: CSSProperties = { width: 56, height: 56, borderRadius: 20, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#16a34a,#2563eb)', color: '#fff', fontWeight: 950, fontSize: 16 }
const attendanceModalTitleStyle: CSSProperties = { fontSize: 22, fontWeight: 950, color: '#0f172a', letterSpacing: '-.04em' }
const attendanceModalSubStyle: CSSProperties = { marginTop: 4, fontSize: 12, fontWeight: 800, color: '#64748b' }
const modalCloseButtonStyle: CSSProperties = { width: 42, height: 42, borderRadius: 16, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: 26, fontWeight: 900, cursor: 'pointer' }
const attendanceModalShiftPanelStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(250px,1fr) minmax(360px,620px)', gap: 14, padding: 14, borderRadius: 22, border: '1px solid #dbeafe', background: '#eff6ff', marginBottom: 14 }
const modalSectionTitleStyle: CSSProperties = { fontSize: 16, fontWeight: 950, color: '#0f172a' }
const modalSectionDetailStyle: CSSProperties = { marginTop: 5, fontSize: 12, color: '#475569', fontWeight: 750, lineHeight: 1.5 }
const modalShiftControlsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }
const modalLabelStyle: CSSProperties = { display: 'grid', gap: 6, fontSize: 10, fontWeight: 950, color: '#475569', textTransform: 'uppercase', letterSpacing: '.08em' }
const modalInputStyle: CSSProperties = { height: 42, borderRadius: 14, border: '1px solid #bfdbfe', background: '#fff', padding: '0 10px', fontWeight: 900, color: '#0f172a' }
const modalFlagChipStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 950 }
const modalHistoryCardStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 22, background: '#fff', padding: 14, boxShadow: '0 14px 34px rgba(15,23,42,.06)' }
const attendanceModalKpiRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginBottom: 14 }
const attendanceHistoryListStyle: CSSProperties = { display: 'grid', gap: 12 }
const attendanceHistoryRowStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 22, background: '#fff', padding: 14, boxShadow: '0 14px 34px rgba(15,23,42,.06)' }
const attendanceHistoryDateStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: '#0f172a' }
const historyCalendarIconStyle: CSSProperties = { width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 12, background: '#eff6ff', border: '1px solid #dbeafe' }
const attendanceHistoryPunchGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }
const attendanceHistoryMetaStyle: CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10, color: '#64748b', fontSize: 11, fontWeight: 800 }
const attendanceModalFooterStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid #e2e8f0' }
const attendanceModalDoneButtonStyle: CSSProperties = { border: '1px solid #1d4ed8', background: 'linear-gradient(135deg,#2563eb,#0f172a)', color: '#fff', borderRadius: 16, padding: '12px 16px', fontWeight: 950, cursor: 'pointer' }
const attendanceKpiCardStyle = (tone: AttendanceTone): CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 12, minHeight: 84, padding: 13, borderRadius: 20, border: `1px solid ${tone === 'green' ? '#bbf7d0' : tone === 'red' ? '#fecaca' : tone === 'amber' ? '#fde68a' : tone === 'blue' ? '#bfdbfe' : '#e2e8f0'}`, background: tone === 'green' ? '#f0fdf4' : tone === 'red' ? '#fff5f5' : tone === 'amber' ? '#fffbeb' : tone === 'blue' ? '#eff6ff' : '#f8fafc' })
const liveStatusPillStyle = (tone: AttendanceTone): CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 999, padding: '8px 10px', border: `1px solid ${tone === 'green' ? '#86efac' : tone === 'red' ? '#fca5a5' : tone === 'amber' ? '#fcd34d' : '#bfdbfe'}`, background: tone === 'green' ? '#dcfce7' : tone === 'red' ? '#fee2e2' : tone === 'amber' ? '#fef3c7' : '#dbeafe', color: tone === 'green' ? '#166534' : tone === 'red' ? '#991b1b' : tone === 'amber' ? '#92400e' : '#1d4ed8', fontSize: 10, fontWeight: 950, letterSpacing: '.08em' })
const liveStatusDotStyle = (tone: AttendanceTone): CSSProperties => ({ width: 8, height: 8, borderRadius: 99, background: tone === 'green' ? '#22c55e' : tone === 'red' ? '#ef4444' : tone === 'amber' ? '#f59e0b' : '#3b82f6' })
const overheadSyncTagStyle = (tone: AttendanceTone): CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 16, padding: '10px 12px', border: `1px solid ${tone === 'green' ? '#bbf7d0' : tone === 'red' ? '#fecaca' : tone === 'amber' ? '#fde68a' : '#bfdbfe'}`, background: tone === 'green' ? '#f0fdf4' : tone === 'red' ? '#fff5f5' : tone === 'amber' ? '#fffbeb' : '#eff6ff', color: '#0f172a', fontSize: 12, fontWeight: 900 })
const punchSignalStyle = (tone: AttendanceTone): CSSProperties => ({ borderRadius: 16, padding: '10px 9px', border: `1px solid ${tone === 'green' ? '#bbf7d0' : tone === 'red' ? '#fecaca' : tone === 'amber' ? '#fde68a' : '#bfdbfe'}`, background: tone === 'green' ? '#f0fdf4' : tone === 'red' ? '#fff5f5' : tone === 'amber' ? '#fffbeb' : '#eff6ff', color: tone === 'green' ? '#166534' : tone === 'red' ? '#991b1b' : tone === 'amber' ? '#92400e' : '#1d4ed8' })
const attendanceRiskPillStyle = (tone: AttendanceTone): CSSProperties => ({ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 950, border: `1px solid ${tone === 'green' ? '#bbf7d0' : tone === 'red' ? '#fecaca' : tone === 'amber' ? '#fde68a' : '#bfdbfe'}`, background: tone === 'green' ? '#f0fdf4' : tone === 'red' ? '#fff5f5' : tone === 'amber' ? '#fffbeb' : '#eff6ff', color: tone === 'green' ? '#166534' : tone === 'red' ? '#991b1b' : tone === 'amber' ? '#92400e' : '#1d4ed8' })

function ActivitySection({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return (
    <article style={activitySectionStyle}>
      <SubHeader title={title} detail={detail} />
      <div style={activitySectionBodyStyle}>{children}</div>
    </article>
  )
}

function ActivityMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={activityMetricStyle}>
      <span style={smallStatLabelStyle}>{label}</span>
      <strong style={activityMetricValueStyle}>{value}</strong>
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



function userProfilePhotoUrl(user: UserStaffRecord) {
  const path = String(user.rawUser?.profile_photo_path || '').trim()
  if (!path || !user.id) return null
  const version = String(user.rawUser?.profile_photo_updated_at || user.rawUser?.updated_at || '').trim()
  return `/api/users/${encodeURIComponent(user.id)}/profile-photo${version ? `?v=${encodeURIComponent(version)}` : ''}`
}

function UserPortrait({ user, size = 52, style }: { user: UserStaffRecord; size?: number; style?: CSSProperties }) {
  const source = userProfilePhotoUrl(user)
  const [photoFailed, setPhotoFailed] = useState(false)
  const name = String(user.fullName || user.name || user.email || 'Utilisateur')
  const showPhoto = Boolean(source && !photoFailed)
  return (
    <span style={{ ...userPortraitBaseStyle, width: size, height: size, ...style }} aria-label={`Photo de ${name}`}>
      {showPhoto ? <img src={source || ''} alt={name} style={userPortraitImageStyle} onError={() => setPhotoFailed(true)} /> : <span>{directoryInitials(name)}</span>}
      <i aria-hidden="true" style={userPortraitVerifiedDotStyle}>✓</i>
    </span>
  )
}

function HeroSignal({ icon, label, value, detail, tone }: { icon: string; label: string; value: string; detail: string; tone: StatusTone | 'purple' }) {
  const toneStyle = heroSignalToneStyles[tone]
  return (
    <div style={{ ...heroSignalStyle, ...toneStyle }}>
      <span style={heroSignalIconStyle}>{icon}</span>
      <span style={heroSignalLabelStyle}>{label}</span>
      <strong style={heroSignalValueStyle}>{value}</strong>
      <small style={heroSignalDetailStyle}>{detail}</small>
    </div>
  )
}

function WorkspaceModeButton({ active, icon, title, detail, onClick }: { active: boolean; icon: string; title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={active ? workspaceModeActiveStyle : workspaceModeStyle} aria-pressed={active}>
      <span style={active ? workspaceModeIconActiveStyle : workspaceModeIconStyle}>{icon}</span>
      <span style={workspaceModeCopyStyle}><strong>{title}</strong><small>{detail}</small></span>
      <span style={workspaceModeArrowStyle}>{active ? '●' : '→'}</span>
    </button>
  )
}

function PremiumUsersDirectoryCard({
  user,
  canOpenProfile,
  canEditUser,
  canDeleteUsers,
}: {
  user: UserStaffRecord
  canOpenProfile: boolean
  canEditUser: boolean
  canDeleteUsers: boolean
}) {
  const fullName = String(user.fullName || user.name || user.email || 'Utilisateur').trim()
  const username = String(user.username || user.email || '—').trim()
  const email = String(user.email || '—').trim()
  const role = String(user.role || 'staff').trim()
  const status = String(user.status || 'active').trim()
  const department = String(user.department || user.departmentName || '—').trim()
  const permissions = directoryPermissionCountForUser(user)
  const moduleCoverageText = moduleCoverageLabelForUser(user)
  const moduleCoverageScore = moduleCoverageScoreForUser(user)
  const updatedAt = formatDirectoryCardDate(user.updatedAt || user.updated_at || user.lastUpdated || user.last_updated || user.createdAt || user.created_at)
  const tone = directoryStatusTone(status)
  const roleTone = directoryRoleTone(role)
  const signalTone = moduleCoverageScore >= 75 ? 'green' : moduleCoverageScore >= 35 ? 'amber' : 'red'

  const readiness = Math.max(0, Math.min(100, Number(user.readiness || 0)))
  const lastLogin = formatDirectoryCardDate(user.lastLoginAt)

  return (
    <article style={premiumUserCardStyle}>
      <div style={premiumUserCardAccentStyle} />
      <div style={premiumUserCardTopStyle}>
        <div style={premiumUserIdentityStyle}>
          <UserPortrait user={user} size={64} style={premiumUserAvatarStyle} />
          <div style={{ minWidth: 0 }}>
            <div style={premiumIdentityOverlineStyle}>SANILA STAFF IDENTITY</div>
            <h3 style={premiumUserNameStyle}>{fullName}</h3>
            <p style={premiumUserPositionStyle}>{user.position || 'Position not assigned'} · {department}</p>
            <p style={premiumUserEmailStyle}>{email}</p>
          </div>
        </div>

        <div style={premiumSignalStackStyle}>
          <span style={directorySignalBarsStyle(signalTone)}><i /><i /><i /><i /></span>
          <span style={directoryStatusPillStyle(tone)}>● {status}</span>
        </div>
      </div>

      <div style={premiumUserChipRowStyle}>
        <span style={directoryRolePillStyle(roleTone)}>{role}</span>
        <span style={premiumSoftPillStyle}>@ {username}</span>
        <span style={premiumReadinessPillStyle}>{readiness}% identity ready</span>
      </div>

      <div style={premiumUserDataGridStyle}>
        <PremiumUserData label="Permissions" value={String(permissions)} icon="⌘" />
        <PremiumUserData label="Module coverage" value={moduleCoverageText} icon="◫" />
        <PremiumUserData label="Last sign-in" value={lastLogin} icon="◷" />
        <PremiumUserData label="Record updated" value={updatedAt} icon="↻" />
      </div>

      <div style={premiumCoverageBlockStyle}>
        <div style={premiumCoverageHeaderStyle}>
          <span>Identity & access assurance</span>
          <strong>{readiness}%</strong>
        </div>
        <div style={premiumCoverageTrackStyle}>
          <div style={{ ...premiumCoverageFillStyle, width: `${readiness}%`, background: directoryToneSolid(readiness >= 75 ? 'green' : readiness >= 45 ? 'amber' : 'red') }} />
        </div>
        <div style={premiumCoverageFootStyle}><span>{moduleCoverageScore}% module reach</span><span>{user.city || 'Location not assigned'}</span></div>
      </div>

      <div style={premiumUserActionRowStyle}>
        {canOpenProfile ? <a href={`/users/${user.id}`} style={premiumUserActionPrimaryStyle}>Open profile</a> : <span style={premiumUserActionDisabledStyle}>Profile restricted</span>}
        {canEditUser ? <a href={`/users/${user.id}/edit`} style={premiumUserActionStyle}>Edit identity</a> : <span style={premiumUserActionDisabledStyle}>Edit restricted</span>}
        <a href={`/users/${user.id}/attendance`} style={premiumUserActionStyle}>Attendance</a>
      </div>
      <div style={premiumUserSecondaryActionsStyle}>
        <a href={`/users/${user.id}/tasks`} style={premiumUserTextActionStyle}>Tasks</a>
        <a href={`/users/${user.id}/lead-portfolio`} style={premiumUserTextActionStyle}>Lead portfolio</a>
        {canDeleteUsers ? <a href={`/users/${user.id}/delete`} style={premiumUserDeleteTextActionStyle}>Controlled deletion</a> : <span style={premiumUserRestrictedTextStyle}>Deletion restricted</span>}
      </div>
    </article>
  )
}

function PremiumUserData({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={premiumUserDataStyle}>
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value || '—'}</strong>
    </div>
  )
}

function directoryInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U'
}

function formatDirectoryCardDate(value: unknown) {
  const text = String(value || '').trim()
  if (!text) return '—'
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return text
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function directoryExtractPermissionValue(item: unknown): string {
  if (typeof item === 'string') return item.trim()

  if (item && typeof item === 'object') {
    const row = item as Record<string, unknown>
    const keys = [
      'permission',
      'permission_key',
      'permissionKey',
      'key',
      'code',
      'slug',
      'href',
      'path',
      'route',
      'page',
      'module',
      'module_key',
      'moduleKey',
      'name',
      'label',
    ]

    for (const key of keys) {
      const value = row[key]
      if (value !== undefined && value !== null && String(value).trim()) return String(value).trim()
    }
  }

  return ''
}

function directoryArrayValues(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(directoryExtractPermissionValue).map((item) => item.trim()).filter(Boolean)
}

function directoryPermissionListForUser(user: UserStaffRecord): string[] {
  const source = user as any
  const coverage = source.coverage && typeof source.coverage === 'object' ? source.coverage : {}

  const directCandidates = [
    source.permissions,
    source.permission_keys,
    source.permissionKeys,
    source.access_permissions,
    source.accessPermissions,
    source.visible_permissions,
    source.visiblePermissions,
    source.effective_permissions,
    source.effectivePermissions,
    source.selected_permissions,
    source.selectedPermissions,
    source.allowed_permissions,
    source.allowedPermissions,
    source.granted_permissions,
    source.grantedPermissions,
    source.permission_catalog,
    source.permissionCatalog,
    source.routes,
    source.allowed_routes,
    source.allowedRoutes,
    source.visible_routes,
    source.visibleRoutes,
    source.pages,
    source.allowed_pages,
    source.allowedPages,
    source.modules,
    source.allowed_modules,
    source.allowedModules,
    source.module_permissions,
    source.modulePermissions,
    coverage.permissions,
    coverage.permission_keys,
    coverage.permissionKeys,
    coverage.routes,
    coverage.pages,
    coverage.modules,
  ]

  const values: string[] = []

  for (const candidate of directCandidates) {
    values.push(...directoryArrayValues(candidate))
  }

  // Generic fallback: scan any user field that looks like synced access data.
  for (const [key, value] of Object.entries(source)) {
    const normalizedKey = key.toLowerCase()
    const looksLikeAccessField =
      normalizedKey.includes('permission') ||
      normalizedKey.includes('route') ||
      normalizedKey.includes('page') ||
      normalizedKey.includes('module') ||
      normalizedKey.includes('access')

    if (looksLikeAccessField) values.push(...directoryArrayValues(value))
  }

  for (const [key, value] of Object.entries(coverage as Record<string, unknown>)) {
    const normalizedKey = key.toLowerCase()
    const looksLikeAccessField =
      normalizedKey.includes('permission') ||
      normalizedKey.includes('route') ||
      normalizedKey.includes('page') ||
      normalizedKey.includes('module') ||
      normalizedKey.includes('access')

    if (looksLikeAccessField) values.push(...directoryArrayValues(value))
  }

  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function directoryNumericFallbackForUser(user: UserStaffRecord, kind: 'permissions' | 'modules') {
  const source = user as any
  const coverage = source.coverage && typeof source.coverage === 'object' ? source.coverage : {}

  const permissionCandidates = [
    source.permissionsCount,
    source.permissionCount,
    source.permissions_count,
    source.permission_count,
    source.accessCount,
    source.access_count,
    source.totalPermissions,
    source.total_permissions,
    source.selectedPermissionsCount,
    source.selected_permissions_count,
    source.visiblePermissionsCount,
    source.visible_permissions_count,
    coverage.permissions,
    coverage.permissionCount,
    coverage.permissionsCount,
    coverage.permissions_count,
    coverage.accessCount,
    coverage.access_count,
  ]

  const moduleCandidates = [
    source.modulesCount,
    source.moduleCount,
    source.modules_count,
    source.module_count,
    source.coveredModules,
    source.covered_modules,
    source.moduleCoverage,
    source.module_coverage,
    source.visibleModules,
    source.visible_modules,
    source.allowedModulesCount,
    source.allowed_modules_count,
    coverage.modules,
    coverage.moduleCount,
    coverage.modulesCount,
    coverage.modules_count,
    coverage.coveredModules,
    coverage.covered_modules,
    coverage.moduleCoverage,
    coverage.module_coverage,
  ]

  const candidates = kind === 'permissions' ? permissionCandidates : moduleCandidates

  for (const value of candidates) {
    const n = Number(value)
    if (Number.isFinite(n) && n >= 0) return n
  }

  return null
}

function directoryPermissionCountForUser(user: UserStaffRecord) {
  const list = directoryPermissionListForUser(user)
  if (list.length) return list.length

  const fallback = directoryNumericFallbackForUser(user, 'permissions')
  return fallback ?? 0
}

function directoryModuleKeyFromPermission(permission: string) {
  const raw = String(permission || '').trim()
  if (!raw) return ''

  const normalized = raw
    .replace(/^page:\//, '')
    .replace(/^route:\//, '')
    .replace(/^permission:\//, '')
    .replace(/^\/+/, '')

  if (!normalized) return ''

  if (normalized.includes('/')) {
    const parts = normalized.split('/').filter(Boolean)
    if (!parts.length) return ''
    return parts[0]
  }

  if (normalized.includes('.')) {
    const [first] = normalized.split('.')
    return first || ''
  }

  if (normalized.includes(':')) {
    const parts = normalized.split(':').filter(Boolean)
    return parts[0] || ''
  }

  return normalized
}

function directoryModuleTotalForUser(user: UserStaffRecord) {
  const source = user as any
  const coverage = source.coverage && typeof source.coverage === 'object' ? source.coverage : {}

  const candidates = [
    coverage.totalModules,
    coverage.modulesTotal,
    coverage.total_modules,
    coverage.registryModules,
    coverage.registry_modules,
    source.totalModules,
    source.modulesTotal,
    source.total_modules,
    source.registryModuleTotal,
    source.registry_module_total,
    source.moduleRegistryTotal,
    source.module_registry_total,
  ]

  for (const value of candidates) {
    const n = Number(value)
    if (Number.isFinite(n) && n > 0) return n
  }

  return 61
}

function moduleCoverageLabelForUser(user: UserStaffRecord) {
  const directCovered = directoryNumericFallbackForUser(user, 'modules')

  let covered: number

  if (directCovered !== null) {
    covered = directCovered
  } else {
    const permissions = directoryPermissionListForUser(user)
    const moduleKeys = new Set(
      permissions
        .map(directoryModuleKeyFromPermission)
        .map((value) => value.trim())
        .filter(Boolean)
    )
    covered = moduleKeys.size
  }

  const total = directoryModuleTotalForUser(user)
  return `${Math.max(0, covered)}/${Math.max(1, total)}`
}

function moduleCoverageScoreForUser(user: UserStaffRecord) {
  const label = moduleCoverageLabelForUser(user)
  const [left, right] = label.split('/').map((value) => Number(value))
  if (!Number.isFinite(left) || !Number.isFinite(right) || right <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((left / right) * 100)))
}

function directoryStatusTone(status: string): 'green' | 'amber' | 'red' | 'slate' {
  const clean = status.toLowerCase()
  if (clean.includes('active') || clean.includes('actif')) return 'green'
  if (clean.includes('pending') || clean.includes('review')) return 'amber'
  if (clean.includes('inactive') || clean.includes('suspend') || clean.includes('blocked')) return 'red'
  return 'slate'
}

function directoryRoleTone(role: string): 'blue' | 'purple' | 'green' | 'slate' {
  const clean = role.toLowerCase()
  if (clean.includes('ceo') || clean.includes('admin')) return 'purple'
  if (clean.includes('marketing')) return 'blue'
  if (clean.includes('manager') || clean.includes('lead')) return 'green'
  return 'slate'
}

function directoryToneSolid(tone: 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'slate') {
  if (tone === 'green') return '#22c55e'
  if (tone === 'amber') return '#f59e0b'
  if (tone === 'red') return '#ef4444'
  if (tone === 'purple') return '#8b5cf6'
  if (tone === 'blue') return '#2563eb'
  return '#64748b'
}

function directoryStatusPillStyle(tone: 'green' | 'amber' | 'red' | 'slate'): CSSProperties {
  const map = {
    green: { background: '#ecfdf5', color: '#047857', border: '#bbf7d0' },
    amber: { background: '#fffbeb', color: '#b45309', border: '#fde68a' },
    red: { background: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    slate: { background: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  }[tone]
  return { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, padding: '7px 10px', background: map.background, color: map.color, border: `1px solid ${map.border}`, fontSize: 11, fontWeight: 1000, whiteSpace: 'nowrap' }
}

function directoryRolePillStyle(tone: 'blue' | 'purple' | 'green' | 'slate'): CSSProperties {
  const map = {
    blue: { background: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    purple: { background: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
    green: { background: '#ecfdf5', color: '#047857', border: '#bbf7d0' },
    slate: { background: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  }[tone]
  return { display: 'inline-flex', alignItems: 'center', width: 'max-content', borderRadius: 999, padding: '7px 10px', background: map.background, color: map.color, border: `1px solid ${map.border}`, fontSize: 11, fontWeight: 1000 }
}

function directorySignalBarsStyle(tone: 'green' | 'amber' | 'red'): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(4,4px)',
    alignItems: 'end',
    gap: 3,
    height: 24,
    color: directoryToneSolid(tone),
  }
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

const modeSwitcherStyle: CSSProperties = { position: 'relative', display: 'grid', gap: 18, padding: '22px', borderRadius: 30, border: '1px solid rgba(191,219,254,.95)', background: 'linear-gradient(135deg,rgba(255,255,255,.98),rgba(247,250,255,.98))', boxShadow: '0 24px 70px rgba(15,23,42,.07)', overflow: 'hidden' }
const modeSwitcherHeaderStyle: CSSProperties = { display: 'grid', gap: 5, maxWidth: 920 }
const modeSwitcherKickerStyle: CSSProperties = { color: '#2563eb', fontSize: 10, fontWeight: 1000, letterSpacing: '.18em', textTransform: 'uppercase' }
const modeButtonRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(210px,1fr)) auto', gap: 12, alignItems: 'stretch' }
const workspaceModeStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '44px minmax(0,1fr) auto', gap: 12, alignItems: 'center', minHeight: 82, padding: 14, textAlign: 'left', border: '1px solid #dbe5f2', background: '#fff', color: '#0f172a', borderRadius: 21, cursor: 'pointer', boxShadow: '0 14px 34px rgba(15,23,42,.045)', transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease' }
const workspaceModeActiveStyle: CSSProperties = { ...workspaceModeStyle, border: '1px solid rgba(59,130,246,.9)', background: 'linear-gradient(135deg,#0f3d91 0%,#1764c0 100%)', color: '#fff', boxShadow: '0 20px 46px rgba(29,78,216,.22)' }
const workspaceModeIconStyle: CSSProperties = { width: 44, height: 44, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe', fontSize: 19, fontWeight: 1000 }
const workspaceModeIconActiveStyle: CSSProperties = { ...workspaceModeIconStyle, background: 'rgba(255,255,255,.16)', color: '#fff', border: '1px solid rgba(255,255,255,.22)' }
const workspaceModeCopyStyle: CSSProperties = { display: 'grid', gap: 4, minWidth: 0 }
const workspaceModeArrowStyle: CSSProperties = { fontSize: 15, fontWeight: 1000, opacity: .75 }
const operationCommandStyle: CSSProperties = { display: 'grid', alignItems: 'stretch', minWidth: 178 }
const activityWorkspaceStyle: CSSProperties = { display: 'grid', gap: 16, borderRadius: 30, padding: 22, border: '1px solid #dbe5f2', background: 'linear-gradient(135deg,#ffffff 0%,#f8fbff 58%,#eef6ff 100%)', boxShadow: '0 24px 60px rgba(15,23,42,.06)' }
const activityHeroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }
const activityTitleStyle: CSSProperties = { margin: '10px 0 8px', color: '#0f172a', fontSize: 32, lineHeight: 1.08, fontWeight: 1000, letterSpacing: '-.035em' }
const activityKpiStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(150px,1fr))', gap: 10 }
const activityFilterBarStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(260px,1.6fr) repeat(4,minmax(150px,1fr))', gap: 10, alignItems: 'center', padding: 12, borderRadius: 22, border: '1px solid #e2e8f0', background: '#fff' }
const selectStyle: CSSProperties = { width: '100%', borderRadius: 16, border: '1px solid #cbd5e1', padding: '13px 14px', outline: 'none', fontWeight: 800, color: '#0f172a', background: '#fff' }
const selectedUserBannerStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 16, borderRadius: 24, border: '1px solid #dbeafe', background: '#ffffff', boxShadow: '0 16px 34px rgba(37,99,235,.06)', flexWrap: 'wrap' }
const activitySectionGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }
const activitySectionStyle: CSSProperties = { display: 'grid', gap: 10, alignContent: 'start', minHeight: 260, padding: 18, borderRadius: 24, border: '1px solid #dbe5f2', background: '#fff', boxShadow: '0 18px 44px rgba(15,23,42,.045)' }
const activitySectionBodyStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'stretch' }
const activityMetricStyle: CSSProperties = { minWidth: 145, flex: '1 1 145px', display: 'grid', gap: 5, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#f8fafc' }
const activityMetricValueStyle: CSSProperties = { color: '#0f172a', fontSize: 16, lineHeight: 1.35, fontWeight: 950, wordBreak: 'break-word' }
const activityActionRowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%', marginTop: 4 }
const rootStyle: CSSProperties = { position: 'relative', isolation: 'isolate', width: '100%', maxWidth: 'none', display: 'grid', gap: 20, padding: 'clamp(12px,1.35vw,24px)', borderRadius: 38, background: 'radial-gradient(circle at 100% 0%,rgba(56,189,248,.12),transparent 28%), radial-gradient(circle at 0% 35%,rgba(37,99,235,.08),transparent 30%), linear-gradient(180deg,#f5f8fd 0%,#ffffff 28%,#f8fbff 100%)', boxSizing: 'border-box', overflow: 'hidden' }
const heroStyle: CSSProperties = { position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0,1.45fr) minmax(340px,.55fr)', gap: 24, alignItems: 'stretch', borderRadius: 36, padding: 'clamp(24px,2.5vw,40px)', background: 'linear-gradient(118deg,#071a38 0%,#0d3c82 47%,#1769c3 100%)', border: '1px solid rgba(147,197,253,.35)', boxShadow: '0 38px 100px rgba(8,35,82,.24)', overflow: 'hidden' }
const eyebrowStyle: CSSProperties = { display: 'inline-flex', width: 'fit-content', padding: '7px 11px', borderRadius: 999, background: 'rgba(219,234,254,.12)', color: '#dbeafe', border: '1px solid rgba(219,234,254,.18)', fontWeight: 950, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase' }
const titleStyle: CSSProperties = { margin: '12px 0 10px', color: '#fff', fontSize: 'clamp(36px,3.5vw,62px)', lineHeight: .98, fontWeight: 1000, letterSpacing: '-.055em', maxWidth: 950 }
const subtitleStyle: CSSProperties = { margin: 0, color: 'rgba(239,246,255,.82)', fontSize: 15, lineHeight: 1.72, fontWeight: 680, maxWidth: 850 }
const metaRowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }
const actionsStyle: CSSProperties = { display: 'grid', gap: 11, justifyItems: 'stretch' }
const panelStyle: CSSProperties = { background: 'linear-gradient(180deg,#ffffff 0%,#fbfdff 100%)', border: '1px solid rgba(219,229,242,.95)', borderRadius: 30, padding: 'clamp(18px,1.7vw,28px)', boxShadow: '0 24px 64px rgba(15,23,42,.065)' }
const sectionHeaderStyle: CSSProperties = { marginBottom: 16 }
const sectionTitleStyle: CSSProperties = { margin: '6px 0 6px', color: '#0f172a', fontSize: 22, fontWeight: 950 }
const sectionSubtitleStyle: CSSProperties = { margin: 0, color: '#64748b', lineHeight: 1.65, fontWeight: 650 }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 13 }
const permissionControlStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  marginTop: 14,
  padding: 14,
  borderRadius: 18,
  border: '1px solid #dbe5f2',
  background: '#f8fbff',
}
const permissionControlStatsStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const permissionControlMessageStyle: CSSProperties = { padding: '10px 12px', borderRadius: 14, background: '#eff6ff', color: '#1d4ed8', fontWeight: 800, fontSize: 12, lineHeight: 1.5 }
const permissionControlErrorStyle: CSSProperties = { padding: '10px 12px', borderRadius: 14, background: '#fef2f2', color: '#991b1b', fontWeight: 800, fontSize: 12, lineHeight: 1.5 }
const permissionControlLoadedStyle: CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 700 }
const metricCardStyle: CSSProperties = { position: 'relative', borderRadius: 22, padding: 17, border: '1px solid #dbe5f2', background: 'linear-gradient(145deg,#ffffff,#f8fbff)', display: 'grid', gap: 7, minWidth: 0, boxShadow: '0 15px 36px rgba(15,23,42,.045)', overflow: 'hidden' }
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
  amber: { background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff' },
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
const miniDangerLinkStyle: CSSProperties = { ...miniLinkStyle, border: '1px solid #fecaca', color: '#991b1b', background: '#fff5f5' }
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
const warningTagStyle: CSSProperties = { ...tagStyle, background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff' }
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
const activityCommandHeroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 18, alignItems: 'start', padding: 20, borderRadius: 28, border: '1px solid #dbe5f2', background: 'linear-gradient(135deg,#ffffff 0%,#f8fbff 55%,#eef6ff 100%)', boxShadow: '0 18px 52px rgba(15,23,42,.06)' }
const activityHeroActionsStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }
const activityPillButtonStyle: CSSProperties = { border: '1px solid #dbe5f2', background: '#fff', color: '#0f172a', borderRadius: 999, padding: '10px 13px', fontSize: 12, fontWeight: 950, boxShadow: '0 10px 24px rgba(15,23,42,.04)' }
const activityPillButtonStrongStyle: CSSProperties = { ...activityPillButtonStyle, border: '1px solid #fecaca', background: '#fff5f5', color: '#991b1b' }
const activityFilterBarPremiumStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(260px,1.6fr) repeat(7,minmax(132px,1fr))', gap: 10, alignItems: 'end', padding: 14, borderRadius: 26, border: '1px solid #dbe5f2', background: '#fff', boxShadow: '0 16px 44px rgba(15,23,42,.045)' }
const activityFilterMainStyle: CSSProperties = { display: 'grid', gap: 6, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 950 }
const activityFilterItemStyle: CSSProperties = { display: 'grid', gap: 6, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 950 }
const activityInputStyle: CSSProperties = { width: '100%', minHeight: 44, borderRadius: 16, border: '1px solid #cbd5e1', padding: '11px 13px', outline: 'none', color: '#0f172a', background: '#f8fafc', fontWeight: 800, textTransform: 'none', letterSpacing: 0 }
const activitySelectStyle: CSSProperties = { width: '100%', minHeight: 44, borderRadius: 16, border: '1px solid #cbd5e1', padding: '10px 11px', outline: 'none', color: '#0f172a', background: '#f8fafc', fontWeight: 850, textTransform: 'none', letterSpacing: 0 }
const selectedUserIntelligenceBannerStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', padding: 16, borderRadius: 26, border: '1px solid #dbe5f2', background: 'linear-gradient(135deg,#0f172a,#1d4ed8)', boxShadow: '0 24px 60px rgba(29,78,216,.14)' }
const activityAvatarStyle: CSSProperties = { width: 52, height: 52, borderRadius: 18, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.28)', color: '#fff', fontWeight: 1000, display: 'grid', placeItems: 'center', flexShrink: 0 }
const activityIdentityTitleStyle: CSSProperties = { color: '#fff', fontSize: 18, fontWeight: 1000, letterSpacing: '-.02em' }
const activitySnapshotGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }
const activityIntelCardStyle: CSSProperties = { display: 'flex', gap: 12, alignItems: 'flex-start', minHeight: 112, padding: 16, borderRadius: 24, border: '1px solid #dbe5f2', background: '#fff', boxShadow: '0 18px 44px rgba(15,23,42,.05)' }
const activityIntelIconStyle: CSSProperties = { width: 40, height: 40, borderRadius: 15, display: 'grid', placeItems: 'center', background: '#eef2ff', fontSize: 19, flexShrink: 0 }
const activityIntelValueStyle: CSSProperties = { display: 'block', color: '#0f172a', fontSize: 20, fontWeight: 1000, marginTop: 5, letterSpacing: '-.03em', wordBreak: 'break-word' }
const activityIntelDetailStyle: CSSProperties = { display: 'block', color: '#64748b', fontSize: 12, fontWeight: 750, marginTop: 4, lineHeight: 1.35, wordBreak: 'break-word' }
const activityPremiumLayoutStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(360px,.85fr)', gap: 16, alignItems: 'start' }
const activityMainColumnStyle: CSSProperties = { display: 'grid', gap: 16, minWidth: 0 }
const activitySideColumnStyle: CSSProperties = { display: 'grid', gap: 16, minWidth: 0 }
const premiumActivityPanelStyle: CSSProperties = { display: 'grid', gap: 14, padding: 18, borderRadius: 28, border: '1px solid #dbe5f2', background: '#fff', boxShadow: '0 22px 58px rgba(15,23,42,.055)', minWidth: 0 }
const premiumPanelHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 12 }
const premiumPanelIconStyle: CSSProperties = { width: 42, height: 42, borderRadius: 16, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#eff6ff,#eef2ff)', border: '1px solid #dbeafe', fontSize: 20, flexShrink: 0 }
const premiumPanelTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 17, fontWeight: 1000, letterSpacing: '-.02em' }
const premiumPanelDetailStyle: CSSProperties = { margin: '4px 0 0', color: '#64748b', fontSize: 12, fontWeight: 700, lineHeight: 1.45 }
const premiumPanelBodyStyle: CSSProperties = { display: 'grid', gap: 10, minWidth: 0 }
const timelineListStyle: CSSProperties = { display: 'grid', gap: 10, maxHeight: 720, overflow: 'auto', paddingRight: 4 }
const timelineItemStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '42px minmax(0,1fr)', gap: 12, padding: 14, borderRadius: 22, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg,#ffffff,#f8fafc)' }
const timelineDotStyle: CSSProperties = { width: 42, height: 42, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#eef2ff', border: '1px solid #dbeafe', fontSize: 18 }
const timelineContentStyle: CSSProperties = { display: 'grid', gap: 8, minWidth: 0 }
const timelineTitleStyle: CSSProperties = { color: '#0f172a', fontSize: 14, fontWeight: 950, lineHeight: 1.45, wordBreak: 'break-word' }
const timelineMetaGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.3fr .85fr .85fr', gap: 8, color: '#64748b', fontSize: 12, fontWeight: 750, wordBreak: 'break-word' }
const securityEventStyle: CSSProperties = { display: 'grid', gap: 7, padding: 13, borderRadius: 18, border: '1px solid #dbe5f2', background: '#f8fafc', color: '#0f172a' }
const securityEventCriticalStyle: CSSProperties = { ...securityEventStyle, border: '1px solid #fecaca', background: '#fff5f5' }
const deviceSessionRowStyle: CSSProperties = { display: 'grid', gap: 5, padding: 13, borderRadius: 18, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 850 }
const monoValueStyle: CSSProperties = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: 11, wordBreak: 'break-word' }
const ipHeroStyle: CSSProperties = { display: 'grid', gap: 6, padding: 16, borderRadius: 22, background: 'linear-gradient(135deg,#eff6ff,#ffffff)', border: '1px solid #bfdbfe', color: '#0f172a' }
const ipLabelStyle: CSSProperties = { color: '#1d4ed8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 1000 }
const miniChipGridStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const networkChipStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '7px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', fontSize: 12, fontWeight: 850 }
const usageBlockStyle: CSSProperties = { display: 'grid', gap: 10 }
const usageTitleStyle: CSSProperties = { color: '#0f172a', fontSize: 13, fontWeight: 1000 }
const usageRowStyle: CSSProperties = { display: 'grid', gap: 6 }
const usageLabelRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, color: '#334155', fontSize: 12, fontWeight: 850 }
const usageTrackStyle: CSSProperties = { height: 8, borderRadius: 999, overflow: 'hidden', background: '#e2e8f0' }
const usageFillStyle: CSSProperties = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#2563eb,#38bdf8)' }



const heroGlowOneStyle: CSSProperties = { position: 'absolute', width: 520, height: 520, borderRadius: '50%', right: -160, top: -250, background: 'radial-gradient(circle,rgba(96,165,250,.34),rgba(96,165,250,0) 68%)', pointerEvents: 'none' }
const heroGlowTwoStyle: CSSProperties = { position: 'absolute', width: 380, height: 380, borderRadius: '50%', left: '38%', bottom: -270, background: 'radial-gradient(circle,rgba(34,211,238,.22),rgba(34,211,238,0) 70%)', pointerEvents: 'none' }
const heroIdentityColumnStyle: CSSProperties = { position: 'relative', zIndex: 1, display: 'grid', alignContent: 'start', gap: 20, minWidth: 0 }
const brandLockupStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 14 }
const brandLogoPlateStyle: CSSProperties = { width: 76, height: 58, padding: 8, borderRadius: 18, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.96)', border: '1px solid rgba(255,255,255,.75)', boxShadow: '0 16px 36px rgba(2,12,27,.24)' }
const brandLogoStyle: CSSProperties = { display: 'block', width: '100%', height: '100%', objectFit: 'contain' }
const brandKickerStyle: CSSProperties = { color: '#fff', fontSize: 13, fontWeight: 1000, letterSpacing: '.18em' }
const brandSublineStyle: CSSProperties = { marginTop: 4, color: 'rgba(219,234,254,.76)', fontSize: 11, fontWeight: 850, letterSpacing: '.08em', textTransform: 'uppercase' }
const heroCopyStyle: CSSProperties = { display: 'grid', alignContent: 'start' }
const heroSignalGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }
const heroSignalStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '34px minmax(0,1fr)', columnGap: 9, rowGap: 3, minHeight: 112, padding: 14, borderRadius: 20, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.085)', backdropFilter: 'blur(12px)', color: '#fff' }
const heroSignalToneStyles: Record<StatusTone | 'purple', CSSProperties> = { blue: { boxShadow: 'inset 0 0 0 1px rgba(96,165,250,.08)' }, green: { boxShadow: 'inset 0 0 0 1px rgba(52,211,153,.13)' }, red: { boxShadow: 'inset 0 0 0 1px rgba(248,113,113,.15)' }, amber: { boxShadow: 'inset 0 0 0 1px rgba(251,191,36,.15)' }, slate: { boxShadow: 'inset 0 0 0 1px rgba(203,213,225,.1)' }, purple: { boxShadow: 'inset 0 0 0 1px rgba(196,181,253,.13)' } }
const heroSignalIconStyle: CSSProperties = { gridRow: '1 / span 2', width: 34, height: 34, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.13)', color: '#fff', fontWeight: 1000 }
const heroSignalLabelStyle: CSSProperties = { color: 'rgba(219,234,254,.72)', fontSize: 9, fontWeight: 950, letterSpacing: '.11em', textTransform: 'uppercase' }
const heroSignalValueStyle: CSSProperties = { color: '#fff', fontSize: 21, lineHeight: 1.05, fontWeight: 1000, letterSpacing: '-.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const heroSignalDetailStyle: CSSProperties = { gridColumn: '1 / -1', marginTop: 7, color: 'rgba(239,246,255,.68)', fontSize: 10, fontWeight: 760 }
const heroCommandColumnStyle: CSSProperties = { position: 'relative', zIndex: 1, alignSelf: 'stretch', display: 'grid', alignContent: 'start', gap: 16, padding: 18, borderRadius: 28, background: 'rgba(255,255,255,.96)', border: '1px solid rgba(255,255,255,.76)', boxShadow: '0 28px 70px rgba(2,12,27,.24)', color: '#0f172a' }
const commandColumnHeaderStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '12px minmax(0,1fr)', gap: 10, alignItems: 'start', paddingBottom: 13, borderBottom: '1px solid #e2e8f0' }
const commandLiveDotStyle: CSSProperties = { width: 10, height: 10, marginTop: 4, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 5px rgba(34,197,94,.13)' }
const commandColumnTitleStyle: CSSProperties = { display: 'block', color: '#0f172a', fontSize: 14, fontWeight: 1000 }
const commandColumnSubtitleStyle: CSSProperties = { display: 'block', marginTop: 4, color: '#64748b', fontSize: 11, fontWeight: 760, lineHeight: 1.4 }
const heroPrimaryLinkStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '42px minmax(0,1fr)', gap: 12, alignItems: 'center', minHeight: 70, padding: 13, borderRadius: 19, background: 'linear-gradient(135deg,#0d47a1,#1976d2)', color: '#fff', textDecoration: 'none', boxShadow: '0 18px 38px rgba(25,118,210,.24)' }
const actionIconStyle: CSSProperties = { width: 42, height: 42, borderRadius: 15, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.16)', fontSize: 22, fontWeight: 500 }
const heroDisabledActionStyle: CSSProperties = { minHeight: 64, borderRadius: 18, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#94a3b8', fontWeight: 900 }
const heroSecondaryActionGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }
const commandTrustPanelStyle: CSSProperties = { display: 'grid', gap: 9, padding: 13, borderRadius: 18, background: 'linear-gradient(135deg,#f8fbff,#eff6ff)', border: '1px solid #dbeafe' }
const commandTrustTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, color: '#1e3a8a', fontSize: 11, fontWeight: 950 }
const commandTrustTrackStyle: CSSProperties = { height: 7, borderRadius: 999, background: '#dbeafe', overflow: 'hidden' }
const commandTrustFillStyle: CSSProperties = { display: 'block', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#16a34a,#22c55e)' }
const commandTrustCopyStyle: CSSProperties = { margin: 0, color: '#64748b', fontSize: 10, lineHeight: 1.5, fontWeight: 720 }
const directoryCommandBarStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(280px,1.65fr) repeat(3,minmax(160px,.75fr)) auto', gap: 10, alignItems: 'end', padding: 14, marginTop: 6, borderRadius: 24, border: '1px solid #dbeafe', background: 'linear-gradient(135deg,#f8fbff,#ffffff)', boxShadow: '0 16px 42px rgba(15,23,42,.045)' }
const directorySearchFieldStyle: CSSProperties = { display: 'grid', gap: 7 }
const directoryFilterFieldStyle: CSSProperties = { display: 'grid', gap: 7 }
const directoryFieldLabelStyle: CSSProperties = { color: '#475569', fontSize: 9, fontWeight: 1000, letterSpacing: '.12em', textTransform: 'uppercase' }
const directorySearchControlStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '42px minmax(0,1fr)', alignItems: 'center', minHeight: 48, borderRadius: 17, border: '1px solid #cbd5e1', background: '#fff', overflow: 'hidden' }
const directorySearchIconStyle: CSSProperties = { display: 'grid', placeItems: 'center', color: '#2563eb', fontSize: 22 }
const directorySearchInputStyle: CSSProperties = { width: '100%', height: 46, border: 0, outline: 'none', padding: '0 13px 0 0', color: '#0f172a', background: 'transparent', fontWeight: 800 }
const directorySelectStyle: CSSProperties = { width: '100%', minHeight: 48, borderRadius: 17, border: '1px solid #cbd5e1', outline: 'none', padding: '0 13px', color: '#0f172a', background: '#fff', fontWeight: 850 }
const directoryResetButtonStyle: CSSProperties = { minHeight: 48, borderRadius: 17, border: '1px solid #dbe5f2', background: '#fff', color: '#334155', padding: '0 15px', fontWeight: 950, cursor: 'pointer' }
const directoryResultRailStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12, flexWrap: 'wrap' }
const directoryResultIdentityStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 12, fontWeight: 800 }
const directoryResultPulseStyle: CSSProperties = { width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 4px rgba(34,197,94,.12)' }
const advancedGovernanceGateStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', padding: 20, borderRadius: 29, border: '1px solid #c7d2fe', background: 'radial-gradient(circle at 100% 0%,rgba(224,231,255,.8),transparent 32%),linear-gradient(135deg,#ffffff,#f8faff)', boxShadow: '0 22px 58px rgba(30,64,175,.07)' }
const advancedGovernanceIdentityStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '54px minmax(0,1fr)', gap: 15, alignItems: 'center', maxWidth: 880 }
const advancedGovernanceIconStyle: CSSProperties = { width: 54, height: 54, borderRadius: 19, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#0f172a,#2563eb)', color: '#fff', fontSize: 22, boxShadow: '0 17px 34px rgba(37,99,235,.2)' }
const advancedGovernanceTitleStyle: CSSProperties = { margin: '5px 0 4px', color: '#0f172a', fontSize: 20, fontWeight: 1000, letterSpacing: '-.025em' }
const advancedGovernanceCopyStyle: CSSProperties = { margin: 0, color: '#64748b', fontSize: 12, lineHeight: 1.55, fontWeight: 720 }
const advancedGovernanceStatsStyle: CSSProperties = { display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap', justifyContent: 'flex-end' }
const advancedGovernanceButtonStyle: CSSProperties = { minHeight: 48, border: 0, borderRadius: 16, padding: '0 17px', background: 'linear-gradient(135deg,#0f3d91,#2563eb)', color: '#fff', fontWeight: 1000, cursor: 'pointer', boxShadow: '0 16px 34px rgba(37,99,235,.2)' }
const userPortraitBaseStyle: CSSProperties = { position: 'relative', display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'visible', borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#0f172a)', color: '#fff', fontWeight: 1000, boxSizing: 'border-box' }
const userPortraitImageStyle: CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', display: 'block' }
const userPortraitVerifiedDotStyle: CSSProperties = { position: 'absolute', right: -1, bottom: -1, width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#22c55e', color: '#fff', border: '3px solid #fff', fontSize: 8, fontStyle: 'normal', fontWeight: 1000, boxShadow: '0 5px 12px rgba(22,163,74,.28)' }
const premiumUserCardAccentStyle: CSSProperties = { position: 'absolute', inset: '0 0 auto 0', height: 4, background: 'linear-gradient(90deg,#ef4444 0 8%,#2563eb 8% 68%,#06b6d4 68% 84%,#22c55e 84% 100%)' }
const premiumIdentityOverlineStyle: CSSProperties = { color: '#2563eb', fontSize: 8, fontWeight: 1000, letterSpacing: '.13em' }
const premiumUserPositionStyle: CSSProperties = { margin: '4px 0 0', color: '#334155', fontSize: 11, fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const premiumReadinessPillStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '7px 10px', background: '#ecfdf5', color: '#047857', border: '1px solid #bbf7d0', fontSize: 10, fontWeight: 950 }
const premiumCoverageFootStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, color: '#64748b', fontSize: 9, fontWeight: 850 }
const premiumUserSecondaryActionsStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 2 }
const premiumUserTextActionStyle: CSSProperties = { color: '#1d4ed8', textDecoration: 'none', fontSize: 10, fontWeight: 950 }
const premiumUserDeleteTextActionStyle: CSSProperties = { marginLeft: 'auto', color: '#dc2626', textDecoration: 'none', fontSize: 10, fontWeight: 950 }
const premiumUserRestrictedTextStyle: CSSProperties = { marginLeft: 'auto', color: '#94a3b8', fontSize: 10, fontWeight: 850 }

const toneBadgeStyles: Record<StatusTone, CSSProperties> = {
  green: { background: '#dcfce7', color: '#166534' },
  amber: { background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff' },
  red: { background: '#fee2e2', color: '#991b1b' },
  blue: { background: '#dbeafe', color: '#1d4ed8' },
  slate: { background: '#e2e8f0', color: '#334155' },
}

const premiumUsersCardScrollShellStyle: CSSProperties = {
  marginTop: 16,
  maxHeight: 'min(860px, calc(100vh - 250px))',
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '8px 12px 14px 8px',
  borderRadius: 28,
  border: '1px solid #dbeafe',
  background: 'linear-gradient(135deg,#f7fbff,#ffffff)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.78)',
  scrollbarWidth: 'thin',
}

const premiumUsersCardGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
  gap: 14,
  alignItems: 'stretch',
}

const premiumUserCardStyle: CSSProperties = {
  position: 'relative',
  display: 'grid',
  gap: 14,
  minHeight: 360,
  padding: 18,
  borderRadius: 28,
  border: '1px solid rgba(191,219,254,.95)',
  background: 'radial-gradient(circle at 100% 0%,rgba(219,234,254,.55),transparent 28%),linear-gradient(150deg,#ffffff 0%,#fbfdff 70%,#f3f8ff 100%)',
  boxShadow: '0 22px 58px rgba(15,23,42,.075)',
  minWidth: 0,
  overflow: 'hidden',
}

const premiumUserCardTopStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'flex-start',
}

const premiumUserIdentityStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '64px minmax(0,1fr)',
  gap: 12,
  alignItems: 'center',
  minWidth: 0,
}

const premiumUserAvatarStyle: CSSProperties = {
  borderRadius: '50%',
  background: 'linear-gradient(135deg,#2563eb,#0f172a)',
  color: '#fff',
  fontSize: 16,
  fontWeight: 1000,
  boxShadow: '0 0 0 5px #fff,0 0 0 7px #bfdbfe,0 18px 36px rgba(37,99,235,.22)',
}

const premiumUserNameStyle: CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 17,
  lineHeight: 1.2,
  fontWeight: 1000,
  letterSpacing: '-.02em',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const premiumUserEmailStyle: CSSProperties = {
  margin: '4px 0 0',
  color: '#64748b',
  fontSize: 11,
  fontWeight: 760,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const premiumSignalStackStyle: CSSProperties = {
  display: 'grid',
  justifyItems: 'end',
  gap: 8,
  flexShrink: 0,
}

const premiumUserChipRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const premiumSoftPillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'max-content',
  maxWidth: '100%',
  borderRadius: 999,
  padding: '7px 10px',
  background: '#f8fafc',
  color: '#475569',
  border: '1px solid #e2e8f0',
  fontSize: 11,
  fontWeight: 900,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const premiumUserDataGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
  gap: 8,
}

const premiumUserDataStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '18px minmax(0,1fr)',
  gridTemplateRows: 'auto auto',
  columnGap: 7,
  rowGap: 2,
  padding: 10,
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  minWidth: 0,
}

const premiumCoverageBlockStyle: CSSProperties = {
  display: 'grid',
  gap: 7,
  padding: 10,
  borderRadius: 17,
  border: '1px solid #dbeafe',
  background: '#eff6ff',
}

const premiumCoverageHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  color: '#1e3a8a',
  fontSize: 11,
  fontWeight: 950,
}

const premiumCoverageTrackStyle: CSSProperties = {
  height: 8,
  borderRadius: 999,
  overflow: 'hidden',
  background: '#dbeafe',
}

const premiumCoverageFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: 999,
}

const premiumUserActionRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.15fr 1fr .9fr',
  gap: 8,
  marginTop: 2,
}

const premiumUserActionPrimaryStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 34,
  borderRadius: 13,
  background: 'linear-gradient(135deg,#2563eb,#0f172a)',
  color: '#fff',
  textDecoration: 'none',
  fontSize: 11,
  fontWeight: 1000,
}

const premiumUserActionStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 34,
  borderRadius: 13,
  background: '#fff',
  color: '#0f172a',
  border: '1px solid #dbe3ee',
  textDecoration: 'none',
  fontSize: 11,
  fontWeight: 950,
}

const premiumUserDeleteActionStyle: CSSProperties = {
  ...premiumUserActionStyle,
  background: '#fef2f2',
  color: '#dc2626',
  border: '1px solid #fecaca',
}

const premiumUserActionDisabledStyle: CSSProperties = {
  ...premiumUserActionStyle,
  color: '#94a3b8',
  background: '#f8fafc',
}


