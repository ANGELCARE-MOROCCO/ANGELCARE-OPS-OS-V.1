'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type {
  PermissionCatalogModule,
  PermissionCatalogPermission,
  PermissionCatalogResponse,
} from '@/lib/users/access-governance/permission-catalog'

type Props = {
  defaultPermissions?: string[]
  roleTemplates?: Record<string, string[]>
  catalogEndpoint?: string
}

type CatalogState = {
  loading: boolean
  error: string | null
  message: string | null
  source: PermissionCatalogResponse['source'] | null
  latestScan: PermissionCatalogResponse['latestScan']
  modules: PermissionCatalogModule[]
  flatPermissions: PermissionCatalogPermission[]
}

const LEGACY_MODULE_KEY = '__legacy__'

function titleCase(value: string) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function moduleLabel(value: string) {
  if (value === LEGACY_MODULE_KEY) return 'Legacy / Unknown assigned permissions'
  return titleCase(value)
}

function permissionBadgeText(source: PermissionCatalogPermission['source']) {
  return source
}

function permissionSourceBadgeStyle(source: PermissionCatalogPermission['source']): CSSProperties {
  if (source === 'Registry') return { ...badgeStyle, background: '#e0f2fe', color: '#075985' }
  if (source === 'Generated') return { ...badgeStyle, background: '#ecfccb', color: '#3f6212' }
  return { ...badgeStyle, background: '#f3f4f6', color: '#374151' }
}

function statusBadgeStyle(status: string): CSSProperties {
  const value = String(status || '').toLowerCase()
  if (value === 'stale') return { ...badgeStyle, background: '#fee2e2', color: '#991b1b' }
  if (value === 'new' || value === 'active') return { ...badgeStyle, background: '#dcfce7', color: '#166534' }
  return { ...badgeStyle, background: '#e2e8f0', color: '#334155' }
}

function formatPermissionLabel(permissionKey: string) {
  if (!permissionKey) return 'Permission'
  if (permissionKey.startsWith('page:/')) return permissionKey.replace(/^page:\//, '/')
  return permissionKey.replaceAll('.', ' / ').replaceAll('_', ' ')
}

function isKnownCatalogPermission(permission: string, catalog: PermissionCatalogPermission[]) {
  return catalog.some((item) => item.key === permission)
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) {
    throw new Error(String(payload?.error || response.statusText || 'Request failed'))
  }
  return payload as T
}

function buildLegacyModule(selectedPermissions: string[], catalog: PermissionCatalogPermission[]): PermissionCatalogModule | null {
  const legacyPermissions = selectedPermissions.filter((permission) => !isKnownCatalogPermission(permission, catalog))
  if (!legacyPermissions.length) return null

  return {
    moduleKey: LEGACY_MODULE_KEY,
    moduleLabel: moduleLabel(LEGACY_MODULE_KEY),
    moduleGroup: 'legacy',
    status: 'legacy',
    riskLevel: 'legacy',
    modulePermissionKey: null,
    permissionKey: null,
    routeCount: 0,
    permissions: legacyPermissions.map((permission) => ({
      key: permission,
      label: formatPermissionLabel(permission),
      type: 'legacy',
      href: null,
      moduleKey: LEGACY_MODULE_KEY,
      moduleLabel: moduleLabel(LEGACY_MODULE_KEY),
      status: 'legacy',
      source: 'Legacy',
      modulePermissionKey: null,
      routeType: null,
      riskLevel: 'legacy',
      permissionKey: permission,
      stale: false,
      isNew: false,
    })),
  }
}

export default function SmartPermissionsPanel({
  defaultPermissions = [],
  roleTemplates = {},
  catalogEndpoint = '/api/users/access-governance/permission-catalog',
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultPermissions))
  const [query, setQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [selectedOnly, setSelectedOnly] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [catalog, setCatalog] = useState<CatalogState>({
    loading: true,
    error: null,
    message: null,
    source: null,
    latestScan: null,
    modules: [],
    flatPermissions: [],
  })

  useEffect(() => {
    setSelected(new Set(defaultPermissions))
  }, [defaultPermissions])

  useEffect(() => {
    let active = true

    async function loadCatalog() {
      setCatalog((current) => ({ ...current, loading: true, error: null }))
      try {
        const payload = await fetchJson<PermissionCatalogResponse>(catalogEndpoint)
        if (!active) return
        setCatalog({
          loading: false,
          error: null,
          message: payload.message || null,
          source: payload.source,
          latestScan: payload.latestScan,
          modules: payload.modules || [],
          flatPermissions: payload.flatPermissions || [],
        })
      } catch (error) {
        if (!active) return
        setCatalog({
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to load permission catalog.',
          message: null,
          source: null,
          latestScan: null,
          modules: [],
          flatPermissions: [],
        })
      }
    }

    loadCatalog()
    return () => {
      active = false
    }
  }, [catalogEndpoint])

  const modules = useMemo(() => {
    const list = [...catalog.modules]
    const legacyModule = buildLegacyModule([...selected], catalog.flatPermissions)
    if (legacyModule) list.push(legacyModule)
    return list
  }, [catalog.flatPermissions, catalog.modules, selected])

  const moduleKeys = useMemo(() => {
    const regular = uniqueSorted(modules.filter((module) => module.moduleKey !== LEGACY_MODULE_KEY).map((module) => module.moduleKey))
    const hasLegacy = modules.some((module) => module.moduleKey === LEGACY_MODULE_KEY)
    return ['all', ...regular, ...(hasLegacy ? [LEGACY_MODULE_KEY] : [])]
  }, [modules])

  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase()
    return modules
      .map((module) => {
        const permissions = module.permissions.filter((permission) => {
          const matchesQuery = !q || [
            permission.key,
            permission.label,
            permission.moduleKey,
            permission.moduleLabel,
            permission.href,
            permission.source,
            permission.type,
            permission.status,
          ].join(' ').toLowerCase().includes(q)

          const matchesModule = moduleFilter === 'all' || module.moduleKey === moduleFilter
          const matchesSelected = !selectedOnly || selected.has(permission.key)
          return matchesQuery && matchesModule && matchesSelected
        })

        const moduleMatches = module.moduleKey === LEGACY_MODULE_KEY
          ? (moduleFilter === 'all' || moduleFilter === LEGACY_MODULE_KEY) && [...selected].some((permission) => !isKnownCatalogPermission(permission, catalog.flatPermissions))
          : module.permissions.some((permission) => {
              const matchesQuery = !q || [
                permission.key,
                permission.label,
                permission.moduleKey,
                permission.moduleLabel,
                permission.href,
                permission.source,
                permission.type,
                permission.status,
              ].join(' ').toLowerCase().includes(q)
              const matchesSelected = !selectedOnly || selected.has(permission.key)
              return matchesQuery && matchesSelected
            })

        return { ...module, permissions, moduleMatches }
      })
      .filter((module) => module.moduleMatches)
  }, [catalog.flatPermissions, defaultPermissions, modules, moduleFilter, query, selected, selectedOnly])

  const visiblePermissions = useMemo(() => filteredModules.flatMap((module) => module.permissions), [filteredModules])

  const totalSelected = selected.size
  const selectedVisible = visiblePermissions.filter((permission) => selected.has(permission.key)).length
  const moduleCount = filteredModules.length
  const routeCount = filteredModules.reduce((count, module) => count + module.permissions.filter((permission) => permission.type === 'route').length, 0)
  const permissionCount = filteredModules.reduce((count, module) => count + module.permissions.length, 0)
  const sourceFlags = catalog.source || { registry: false, staticPermissions: false, generatedRoutes: false, resources: false }

  useEffect(() => {
    setExpanded((current) => {
      if (current.size) return current
      const next = new Set<string>()
      filteredModules.slice(0, 4).forEach((module) => next.add(module.moduleKey))
      return next
    })
  }, [filteredModules])

  function togglePermission(permissionKey: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(permissionKey)) next.delete(permissionKey)
      else next.add(permissionKey)
      return next
    })
  }

  function bulkToggle(keys: string[], checked: boolean) {
    setSelected((current) => {
      const next = new Set(current)
      keys.forEach((key) => {
        if (checked) next.add(key)
        else next.delete(key)
      })
      return next
    })
  }

  function toggleExpanded(moduleKey: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(moduleKey)) next.delete(moduleKey)
      else next.add(moduleKey)
      return next
    })
  }

  function selectAllVisible() {
    bulkToggle(visiblePermissions.map((permission) => permission.key), true)
  }

  function clearSelected() {
    setSelected(new Set())
  }

  function selectModule(module: PermissionCatalogModule) {
    bulkToggle(module.permissions.map((permission) => permission.key), true)
  }

  function removeModule(module: PermissionCatalogModule) {
    bulkToggle(module.permissions.map((permission) => permission.key), false)
  }

  const templatePreview = Object.entries(roleTemplates).slice(0, 4)

  return (
    <section style={panelStyle}>
      <input type="hidden" name="permissions_catalog_state" value={catalog.loading ? 'loading' : catalog.error ? 'error' : 'ready'} />
      <input type="hidden" name="permissions_catalog_source" value={JSON.stringify(sourceFlags)} />

      {[...selected].map((permission) => (
        <input key={permission} type="hidden" name="permissions" value={permission} />
      ))}

      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>Unified permission catalog</div>
          <h2 style={titleStyle}>Latest scanned modules, routes and legacy access</h2>
          <p style={textStyle}>
            Permissions are sourced from the live access registry when available, with generated and legacy permissions preserved for backward compatibility.
          </p>
          {catalog.message ? <div style={noticeStyle}>{catalog.message}</div> : null}
          {catalog.error ? <div style={errorStyle}>{catalog.error}</div> : null}
        </div>

        <div style={statsGridStyle}>
          <Stat label="Selected" value={totalSelected} />
          <Stat label="Visible selected" value={selectedVisible} />
          <Stat label="Modules" value={moduleCount} />
          <Stat label="Permissions" value={permissionCount} />
        </div>
      </div>

      <div style={toolbarStyle}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search modules, routes, labels, or permission keys..."
          style={searchStyle}
        />
        <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} style={selectStyle}>
          {moduleKeys.map((moduleKey) => (
            <option key={moduleKey} value={moduleKey}>
              {moduleKey === 'all' ? 'All modules' : moduleLabel(moduleKey)}
            </option>
          ))}
        </select>
        <label style={toggleStyle}>
          <input type="checkbox" checked={selectedOnly} onChange={(event) => setSelectedOnly(event.target.checked)} />
          <span>Selected only</span>
        </label>
        <button type="button" style={darkButtonStyle} onClick={selectAllVisible}>
          Select all visible
        </button>
        <button type="button" style={lightButtonStyle} onClick={clearSelected}>
          Clear selected
        </button>
      </div>

      <div style={summaryBarStyle}>
        <span>{catalog.loading ? 'Loading permission catalog...' : 'Catalog ready for user save.'}</span>
        <span>
          Registry: {sourceFlags.registry ? 'live' : 'fallback'} · Families: {sourceFlags.resources ? 'yes' : 'no'} · Generated: {sourceFlags.generatedRoutes ? 'yes' : 'no'} · Legacy: {sourceFlags.staticPermissions ? 'yes' : 'no'}
        </span>
        {catalog.latestScan ? <span>Latest scan: {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(catalog.latestScan.created_at)))}</span> : null}
      </div>

      {templatePreview.length ? (
        <div style={templateStripStyle}>
          <div style={templateStripLabelStyle}>Role templates available for display only</div>
          <div style={templateChipWrapStyle}>
            {templatePreview.map(([templateKey, permissions]) => (
              <span key={templateKey} style={templateChipStyle}>
                {titleCase(templateKey)} · {permissions.length} permissions
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div style={moduleGridStyle}>
        {filteredModules.map((module) => {
          const allKeys = module.permissions.map((permission) => permission.key)
          const selectedCount = allKeys.filter((permission) => selected.has(permission)).length
          const sourceSet = uniqueSorted(module.permissions.map((permission) => permission.source))
          const isExpanded = expanded.has(module.moduleKey) || module.permissions.length <= 8

          return (
            <article key={module.moduleKey} style={moduleCardStyle}>
              <button type="button" style={moduleHeaderStyle} onClick={() => toggleExpanded(module.moduleKey)}>
                <div style={moduleTitleWrapStyle}>
                  <div style={moduleBadgeStyle}>{module.moduleLabel.slice(0, 1).toUpperCase()}</div>
                  <div style={moduleHeadingCopyStyle}>
                    <strong>{module.moduleLabel}</strong>
                    <span>
                      {module.moduleGroup || 'general'} · {selectedCount}/{module.permissions.length} selected · {module.routeCount} routes
                    </span>
                  </div>
                </div>
                <div style={moduleMetaStyle}>
                  {sourceSet.map((source) => (
                    <span key={source} style={permissionSourceBadgeStyle(source as PermissionCatalogPermission['source'])}>
                      {permissionBadgeText(source as PermissionCatalogPermission['source'])}
                    </span>
                  ))}
                  {module.status ? <span style={statusBadgeStyle(module.status)}>{module.status}</span> : null}
                  {module.riskLevel ? <span style={statusBadgeStyle(module.riskLevel)}>{module.riskLevel}</span> : null}
                  <span style={statusBadgeStyle(isExpanded ? 'active' : 'collapsed')}>{isExpanded ? 'Expanded' : 'Collapsed'}</span>
                </div>
              </button>

              <div style={moduleActionsStyle}>
                <button type="button" style={moduleActionPrimaryStyle} onClick={() => selectModule(module)}>
                  Select module
                </button>
                <button type="button" style={moduleActionSecondaryStyle} onClick={() => removeModule(module)}>
                  Remove module
                </button>
                {module.moduleKey !== LEGACY_MODULE_KEY ? (
                  <span style={moduleKeyStyle}>{module.moduleKey}</span>
                ) : (
                  <span style={moduleKeyStyle}>Legacy section</span>
                )}
              </div>

              {isExpanded ? (
                <div style={permissionListStyle}>
                  {module.permissions.length ? (
                    module.permissions.map((permission) => {
                      const checked = selected.has(permission.key)
                      return (
                        <label key={permission.key} style={permissionRowStyle}>
                          <input type="checkbox" checked={checked} onChange={() => togglePermission(permission.key)} />
                          <div style={permissionCopyStyle}>
                            <div style={permissionTitleRowStyle}>
                              <strong>{permission.label || formatPermissionLabel(permission.key)}</strong>
                              <div style={permissionBadgeRowStyle}>
                                <span style={permissionSourceBadgeStyle(permission.source)}>{permission.source}</span>
                                <span style={statusBadgeStyle(permission.type)}>{permission.type}</span>
                                {permission.stale ? <span style={statusBadgeStyle('stale')}>stale</span> : null}
                                {permission.isNew ? <span style={statusBadgeStyle('new')}>new</span> : null}
                              </div>
                            </div>
                            <div style={permissionMetaLineStyle}>
                              <span>{permission.key}</span>
                              {permission.href ? <span>{permission.href}</span> : null}
                            </div>
                          </div>
                        </label>
                      )
                    })
                  ) : (
                    <div style={emptyStyle}>No permissions match the current filter.</div>
                  )}
                </div>
              ) : null}
            </article>
          )
        })}

        {!filteredModules.length ? <div style={emptyStyle}>No modules or permissions match this filter.</div> : null}
      </div>

      <div style={stickyHintStyle}>
        <strong>{totalSelected} permissions selected</strong>
        <span>Saved into `app_users.permissions` when the user form submits.</span>
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={statStyle}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

const panelStyle: CSSProperties = {
  borderRadius: 30,
  padding: 22,
  background: 'linear-gradient(180deg,#ffffff,#f8fafc)',
  border: '1px solid #e2e8f0',
  boxShadow: '0 24px 60px rgba(15,23,42,.08)',
  marginTop: 18,
}
const topStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, alignItems: 'start', marginBottom: 16 }
const eyebrowStyle: CSSProperties = { color: '#7c3aed', fontSize: 11, fontWeight: 1000, textTransform: 'uppercase', letterSpacing: '.14em' }
const titleStyle: CSSProperties = { margin: '6px 0', fontSize: 28, lineHeight: 1.05, fontWeight: 1000, letterSpacing: '-.04em', color: '#0f172a' }
const textStyle: CSSProperties = { margin: 0, color: '#64748b', fontWeight: 750, lineHeight: 1.7 }
const noticeStyle: CSSProperties = { marginTop: 12, padding: 12, borderRadius: 16, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 850, fontSize: 13 }
const errorStyle: CSSProperties = { marginTop: 12, padding: 12, borderRadius: 16, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontWeight: 850, fontSize: 13 }
const statsGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10 }
const statStyle: CSSProperties = { display: 'grid', gap: 4, padding: 14, borderRadius: 20, background: '#fff', border: '1px solid #e2e8f0', textAlign: 'center', color: '#0f172a' }
const toolbarStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
  gap: 10,
  padding: 12,
  borderRadius: 24,
  background: '#eef2ff',
  border: '1px solid #ddd6fe',
  marginBottom: 12,
}
const searchStyle: CSSProperties = { minWidth: 0, border: '1px solid #c7d2fe', borderRadius: 16, padding: '12px 14px', fontWeight: 850, outline: 'none', background: '#fff', color: '#0f172a' }
const selectStyle: CSSProperties = { border: '1px solid #c7d2fe', borderRadius: 16, padding: '12px 14px', fontWeight: 850, background: '#fff', color: '#0f172a' }
const toggleStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, borderRadius: 16, padding: '0 12px', background: '#fff', border: '1px solid #c7d2fe', fontWeight: 900, color: '#0f172a' }
const darkButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 14px', background: '#4c1d95', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const lightButtonStyle: CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 16, padding: '12px 14px', background: '#fff', color: '#0f172a', fontWeight: 950, cursor: 'pointer' }
const summaryBarStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 10,
  padding: '10px 12px',
  marginBottom: 12,
  borderRadius: 18,
  background: '#f8fafc',
  color: '#475569',
  fontWeight: 800,
  fontSize: 12,
}
const templateStripStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: 14,
  marginBottom: 12,
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#fff',
}
const templateStripLabelStyle: CSSProperties = { color: '#334155', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em' }
const templateChipWrapStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const templateChipStyle: CSSProperties = { padding: '8px 10px', borderRadius: 999, background: '#f1f5f9', color: '#0f172a', fontWeight: 850, fontSize: 12 }
const moduleGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14 }
const moduleCardStyle: CSSProperties = { borderRadius: 24, background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 12px 30px rgba(15,23,42,.05)' }
const moduleHeaderStyle: CSSProperties = {
  width: '100%',
  border: 0,
  background: 'linear-gradient(135deg,#f8fafc,#eef2ff)',
  padding: 14,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  cursor: 'pointer',
  textAlign: 'left',
  color: '#0f172a',
}
const moduleTitleWrapStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }
const moduleBadgeStyle: CSSProperties = { width: 42, height: 42, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#0f172a', color: '#fff', fontWeight: 1000 }
const moduleHeadingCopyStyle: CSSProperties = { display: 'grid', gap: 3, minWidth: 0 }
const moduleMetaStyle: CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }
const badgeStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px 9px', borderRadius: 999, fontSize: 11, fontWeight: 900 }
const moduleActionsStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  padding: 12,
  borderBottom: '1px solid #e2e8f0',
  background: '#fff',
}
const moduleActionPrimaryStyle: CSSProperties = { border: 0, borderRadius: 999, padding: '8px 11px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const moduleActionSecondaryStyle: CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 999, padding: '8px 11px', background: '#fff', color: '#0f172a', fontWeight: 950, cursor: 'pointer' }
const moduleKeyStyle: CSSProperties = { marginLeft: 'auto', alignSelf: 'center', color: '#64748b', fontWeight: 850, fontSize: 12 }
const permissionListStyle: CSSProperties = { display: 'grid', gap: 8, padding: 12 }
const permissionRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '18px 1fr', gap: 10, alignItems: 'start', padding: 12, borderRadius: 16, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }
const permissionCopyStyle: CSSProperties = { display: 'grid', gap: 6 }
const permissionTitleRowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'start' }
const permissionBadgeRowStyle: CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap' }
const permissionMetaLineStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', color: '#64748b', fontSize: 12, fontWeight: 750 }
const emptyStyle: CSSProperties = { padding: 24, textAlign: 'center', borderRadius: 18, border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 850 }
const stickyHintStyle: CSSProperties = {
  position: 'sticky',
  bottom: 10,
  zIndex: 5,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 16,
  padding: '12px 14px',
  borderRadius: 18,
  background: '#0f172a',
  color: '#fff',
  boxShadow: '0 18px 30px rgba(15,23,42,.18)',
}
