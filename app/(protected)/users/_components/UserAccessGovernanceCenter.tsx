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
import ActionProgressPanel from '@/components/shared/ActionProgressPanel'
import BroadcastControlTower from './BroadcastControlTower'
import { useActionProgress } from '@/hooks/useActionProgress'
import type { PermissionCatalogResponse } from '@/lib/users/access-governance/permission-catalog'

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
type UsersPageMode = 'governance' | 'activities' | 'attendance'

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
  const [moduleQuery, setModuleQuery] = useState('')
  const [routeQuery, setRouteQuery] = useState('')
  const [templateQuery, setTemplateQuery] = useState('')
  const [selectedPreview, setSelectedPreview] = useState<AccessGovernancePreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [scanBusy, setScanBusy] = useState(false)
  const [refreshBusy, setRefreshBusy] = useState(false)
  const [previewBusy, setPreviewBusy] = useState(false)
  const [scanSummary, setScanSummary] = useState<AccessGovernanceScanSummary | null>(null)
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
      fetchJson<{ ok: boolean; modules: AccessModuleRegistryRow[]; routes: AccessRouteRegistryRow[]; templates: AccessGovernanceRegistrySnapshot['templates']; latestScan: AccessGovernanceRegistrySnapshot['latestScan']; stats: AccessGovernanceRegistrySnapshot['stats'] }>('/api/users/access-governance/registry'),
      fetchJson<{ ok: boolean; events: AccessRegistryEventRow[]; scans: Array<Record<string, unknown>> }>('/api/users/access-governance/events'),
    ])

    if (registryResult.ok) {
      actionProgress.setStep('registry', 'done', 'Registry loaded.', 50)
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
    const docRef = docRefForAttendanceMonth(user, selectedMonth)
    const monthTitle = monthLabelFromIso(selectedMonth)
    const generatedAt = new Date().toLocaleString('fr-FR')
    const rowsHtml = monthRows.length
      ? monthRows.map((row, index) => {
          const rowDate = rowDateIso(row)
          const inAt = attendanceTimeValue(row, 'in')
          const outAt = attendanceTimeValue(row, 'out')
          const pauseAt = timeShort((row as Record<string, unknown>).break_start_at || (row as Record<string, unknown>).lunch_start)
          const retourAt = timeShort((row as Record<string, unknown>).break_end_at || (row as Record<string, unknown>).lunch_end)
          const flag = attendanceRowFlag(normalizeAttendanceDisplayRow(row), shiftStart, shiftEnd, graceMinutes)
          return `
            <section class="day-card">
              <div class="day-card-head">
                <div>
                  <div class="day-title">Jour ${index + 1}</div>
                  <div class="day-date">${rowDate}</div>
                </div>
                <div class="flag flag-${flag.status}">${flag.label}</div>
              </div>
              <div class="four-grid">
                <div class="metric in"><div class="k">IN</div><div class="v">${inAt}</div></div>
                <div class="metric out"><div class="k">OUT</div><div class="v">${outAt}</div></div>
                <div class="metric pause"><div class="k">PAUSE</div><div class="v">${pauseAt}</div></div>
                <div class="metric retour"><div class="k">RETOUR</div><div class="v">${retourAt}</div></div>
              </div>
              <div class="meta">Statut: ${String((row as Record<string, unknown>).status || '—')} · Source: HR attendance records</div>
            </section>
          `
        }).join('')
      : `<div class="empty">Aucune donnée trouvée pour ce mois.</div>`

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${docRef}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          * { box-sizing: border-box; }
          body { font-family: Inter, Arial, sans-serif; margin: 0; color: #0f172a; background: #f8fafc; }
          .page { width: 100%; }
          .header {
            border: 1px solid #dbeafe; background: linear-gradient(180deg,#ffffff,#eff6ff);
            border-radius: 16px; padding: 18px 20px; margin-bottom: 14px;
          }
          .eyebrow { font-size: 10px; font-weight: 800; letter-spacing: .14em; color: #1d4ed8; text-transform: uppercase; }
          .title { font-size: 24px; font-weight: 800; margin-top: 6px; }
          .sub { font-size: 12px; color: #475569; margin-top: 6px; }
          .meta-grid {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px;
          }
          .meta-card {
            background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px;
          }
          .meta-card .k { font-size: 10px; font-weight: 800; letter-spacing: .12em; color: #64748b; text-transform: uppercase; }
          .meta-card .v { font-size: 14px; font-weight: 700; margin-top: 6px; }
          .cards { display: grid; gap: 12px; }
          .day-card {
            background: #fff; border: 1px solid #dbeafe; border-radius: 14px; padding: 12px 14px; break-inside: avoid;
          }
          .day-card-head {
            display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 10px;
          }
          .day-title { font-size: 13px; font-weight: 800; color: #0f172a; }
          .day-date { font-size: 12px; color: #475569; margin-top: 2px; }
          .flag {
            padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 800;
          }
          .flag-normal { background: #dcfce7; color: #166534; }
          .flag-delay { background: #fef3c7; color: #92400e; }
          .flag-early { background: #ffedd5; color: #9a3412; }
          .flag-critical { background: #ffe4e6; color: #9f1239; }
          .flag-overtime { background: #dbeafe; color: #1d4ed8; }
          .flag-absence { background: #fee2e2; color: #991b1b; }
          .four-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
          .metric { border-radius: 12px; padding: 10px 12px; border: 1px solid #e2e8f0; }
          .metric .k { font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
          .metric .v { font-size: 18px; font-weight: 800; margin-top: 6px; }
          .metric.in { background: #f0fdf4; border-color: #bbf7d0; }
          .metric.out { background: #fef2f2; border-color: #fecaca; }
          .metric.pause { background: #fffbeb; border-color: #fde68a; }
          .metric.retour { background: #eff6ff; border-color: #bfdbfe; }
          .meta { margin-top: 10px; font-size: 11px; color: #475569; }
          .empty {
            background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 18px; color: #64748b;
          }
          .footer {
            margin-top: 14px; font-size: 11px; color: #64748b; text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="eyebrow">AngelCare · Attendance Monthly Record</div>
            <div class="title">Monthly Attendance History</div>
            <div class="sub">Referenced A4 attendance document generated from the live users attendance command center.</div>
            <div class="meta-grid">
              <div class="meta-card"><div class="k">Document Ref</div><div class="v">${docRef}</div></div>
              <div class="meta-card"><div class="k">Employee</div><div class="v">${user.fullName}</div></div>
              <div class="meta-card"><div class="k">Month</div><div class="v">${monthTitle}</div></div>
              <div class="meta-card"><div class="k">Generated</div><div class="v">${generatedAt}</div></div>
              <div class="meta-card"><div class="k">Department</div><div class="v">${user.department || '—'}</div></div>
              <div class="meta-card"><div class="k">Role</div><div class="v">${user.role || '—'}</div></div>
              <div class="meta-card"><div class="k">Shift</div><div class="v">${shiftStart} → ${shiftEnd}</div></div>
              <div class="meta-card"><div class="k">Grace</div><div class="v">${graceMinutes} min</div></div>
            </div>
          </div>

          <div class="cards">${rowsHtml}</div>

          <div class="footer">
            Generated by AngelCare OpsOS · Users Attendance Monitoring · ${docRef}
          </div>
        </div>
      </body>
      </html>
    `
    const w = window.open('', '_blank', 'width=1100,height=900')
    if (!w) return
    w.document.open()
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => {
      w.print()
    }, 350)
  }

  return (
    <div style={rootStyle}>
      <ActionProgressPanel progress={actionProgress.progress} onClose={actionProgress.closeProgress} />
      <BroadcastControlTower />
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
          <ActionButton onClick={() => void refreshPermissionCatalog('Permission control refreshed.')} disabled={refreshBusy} tone="ghost">
            Refresh Permission Control
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

      <section style={modeSwitcherStyle}>
        <div>
          <div style={subTitleStyle}>Users Management Workspaces</div>
          <div style={subDetailStyle}>Open a focused in-page workspace without leaving the main users management page.</div>
        </div>
        <div style={modeButtonRowStyle}>
          <button type="button" onClick={() => setActiveUsersPage('governance')} style={activeUsersPage === 'governance' ? modeButtonActiveStyle : modeButtonStyle}>Access Control</button>
          <button type="button" onClick={() => setActiveUsersPage('activities')} style={activeUsersPage === 'activities' ? modeButtonActiveStyle : modeButtonStyle}>User's Activities</button>
          <button type="button" onClick={() => setActiveUsersPage('attendance')} style={activeUsersPage === 'attendance' ? modeButtonActiveStyle : modeButtonStyle}>Attendance</button>
        </div>
      </section>

      {activeUsersPage === 'activities' ? (
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
              <div style={activityAvatarStyle}>{selectedUser.initials}</div>
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
                  <div style={attendanceAvatarStyle}>{user.initials}</div>
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

type AttendanceTone = 'green' | 'amber' | 'red' | 'blue' | 'slate'
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

function attendanceRowFlag(row: AttendanceHistoryRow, shiftStart: string, shiftEnd: string, graceMinutes: number) {
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

  const inValue =
    normalizedRow.punchInAt ||
    normalizedRow.check_in ||
    normalizedRow.punch_in_at

  const outValue =
    normalizedRow.punchOutAt ||
    normalizedRow.check_out ||
    normalizedRow.punch_out_at

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
    status: selectedRowFlag.tone,
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
    const docRef = docRefForAttendanceMonth(user, selectedMonth)
    const monthTitle = monthLabelFromIso(selectedMonth)
    const generatedAt = new Date().toLocaleString('fr-FR')
    const printRows = Array.isArray(displayRows) ? displayRows : []

    const rowsHtml = printRows.length
      ? printRows.map((row, index) => {
          const record = row as Record<string, unknown>
          const rowDate = rowDateIso(row)
          const inAt = String(record.punchInAt || record.check_in || record.punch_in_at || '—')
          const outAt = String(record.punchOutAt || record.check_out || record.punch_out_at || '—')
          const pauseAt = String(record.pauseAt || record.lunch_start || record.break_start_at || '—')
          const retourAt = String(record.retourAt || record.lunch_end || record.break_end_at || '—')
          const flag = attendanceRowFlag(normalizeAttendanceDisplayRow(row), shiftStart, shiftEnd, graceMinutes)

          return `
            <section class="day-card">
              <div class="day-card-head">
                <div>
                  <div class="day-title">Day ${index + 1}</div>
                  <div class="day-date">${rowDate || '—'}</div>
                </div>
                <div class="flag flag-${flag.status}">${flag.label}</div>
              </div>
              <div class="four-grid">
                <div class="metric in"><div class="k">IN</div><div class="v">${inAt}</div></div>
                <div class="metric out"><div class="k">OUT</div><div class="v">${outAt}</div></div>
                <div class="metric pause"><div class="k">PAUSE</div><div class="v">${pauseAt}</div></div>
                <div class="metric retour"><div class="k">RETOUR</div><div class="v">${retourAt}</div></div>
              </div>
              <div class="meta">Status: ${String(record.status || '—')} · Source: HR attendance records</div>
            </section>
          `
        }).join('')
      : `<div class="empty">No attendance data found for this selected month.</div>`

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${docRef}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          * { box-sizing: border-box; }
          body { font-family: Inter, Arial, sans-serif; margin: 0; color: #0f172a; background: #f8fafc; }
          .page { width: 100%; }
          .header {
            border: 1px solid #dbeafe;
            background: linear-gradient(180deg,#ffffff,#eff6ff);
            border-radius: 16px;
            padding: 18px 20px;
            margin-bottom: 14px;
          }
          .eyebrow {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .14em;
            color: #1d4ed8;
            text-transform: uppercase;
          }
          .title {
            font-size: 24px;
            font-weight: 900;
            margin-top: 6px;
          }
          .sub {
            font-size: 12px;
            color: #475569;
            margin-top: 6px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-top: 14px;
          }
          .meta-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 10px 12px;
          }
          .meta-card .k {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .12em;
            color: #64748b;
            text-transform: uppercase;
          }
          .meta-card .v {
            font-size: 13px;
            font-weight: 800;
            margin-top: 6px;
          }
          .cards { display: grid; gap: 12px; }
          .day-card {
            background: #fff;
            border: 1px solid #dbeafe;
            border-radius: 14px;
            padding: 12px 14px;
            break-inside: avoid;
          }
          .day-card-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
          }
          .day-title { font-size: 13px; font-weight: 900; }
          .day-date { font-size: 12px; color: #475569; margin-top: 2px; }
          .flag {
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 900;
          }
          .flag-normal { background: #dcfce7; color: #166534; }
          .flag-delay { background: #fef3c7; color: #92400e; }
          .flag-early { background: #ffedd5; color: #9a3412; }
          .flag-critical { background: #ffe4e6; color: #9f1239; }
          .flag-overtime { background: #dbeafe; color: #1d4ed8; }
          .flag-absence { background: #fee2e2; color: #991b1b; }
          .four-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
          .metric {
            border-radius: 12px;
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
          }
          .metric .k {
            font-size: 10px;
            font-weight: 900;
            letter-spacing: .12em;
            text-transform: uppercase;
          }
          .metric .v {
            font-size: 18px;
            font-weight: 900;
            margin-top: 6px;
          }
          .metric.in { background: #f0fdf4; border-color: #bbf7d0; }
          .metric.out { background: #fef2f2; border-color: #fecaca; }
          .metric.pause { background: #fffbeb; border-color: #fde68a; }
          .metric.retour { background: #eff6ff; border-color: #bfdbfe; }
          .meta { margin-top: 10px; font-size: 11px; color: #475569; }
          .empty {
            background: #fff;
            border: 1px dashed #cbd5e1;
            border-radius: 12px;
            padding: 18px;
            color: #64748b;
          }
          .footer {
            margin-top: 14px;
            font-size: 11px;
            color: #64748b;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="eyebrow">AngelCare · Attendance Monthly Record</div>
            <div class="title">Monthly Attendance History</div>
            <div class="sub">Referenced A4 attendance document generated from the live users attendance command center.</div>

            <div class="meta-grid">
              <div class="meta-card"><div class="k">Document Ref</div><div class="v">${docRef}</div></div>
              <div class="meta-card"><div class="k">Employee</div><div class="v">${user.fullName}</div></div>
              <div class="meta-card"><div class="k">Month</div><div class="v">${monthTitle}</div></div>
              <div class="meta-card"><div class="k">Generated</div><div class="v">${generatedAt}</div></div>
              <div class="meta-card"><div class="k">Department</div><div class="v">${user.department || '—'}</div></div>
              <div class="meta-card"><div class="k">Role</div><div class="v">${user.role || '—'}</div></div>
              <div class="meta-card"><div class="k">Shift</div><div class="v">${shiftStart} → ${shiftEnd}</div></div>
              <div class="meta-card"><div class="k">Grace</div><div class="v">${graceMinutes} min</div></div>
            </div>
          </div>

          <div class="cards">${rowsHtml}</div>

          <div class="footer">
            Generated by AngelCare OpsOS · Users Attendance Monitoring · ${docRef}
          </div>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank', 'width=1100,height=900')
    if (!printWindow) return

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
    }, 350)
  }

  return (
    <div style={attendanceModalOverlayStyle} role="dialog" aria-modal="true">
      <div style={attendanceModalStyle}>
        <div style={attendanceModalHeaderStyle}>
          <div style={userCellStyle}>
            <div style={attendanceModalAvatarStyle}>{user.initials}</div>
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

const modeSwitcherStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 14, borderRadius: 22, border: '1px solid #dbe5f2', background: '#fff', boxShadow: '0 16px 36px rgba(15,23,42,.04)', flexWrap: 'wrap' }
const modeButtonRowStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const modeButtonStyle: CSSProperties = { border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', borderRadius: 999, padding: '11px 14px', fontWeight: 950, cursor: 'pointer' }
const modeButtonActiveStyle: CSSProperties = { ...modeButtonStyle, border: '1px solid #1d4ed8', background: 'linear-gradient(135deg,#2563eb,#0f172a)', color: '#fff', boxShadow: '0 14px 28px rgba(37,99,235,.18)' }
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


const toneBadgeStyles: Record<StatusTone, CSSProperties> = {
  green: { background: '#dcfce7', color: '#166534' },
  amber: { background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff' },
  red: { background: '#fee2e2', color: '#991b1b' },
  blue: { background: '#dbeafe', color: '#1d4ed8' },
  slate: { background: '#e2e8f0', color: '#334155' },
}
