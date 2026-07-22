'use client'

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import type {
  AccessDiscoveredResource,
  AccessGovernanceScanSummary,
  AccessResourceOverride,
  AccessResourceType,
  AccessRegistryVersionRow,
} from '@/lib/users/access-governance/types'

type Props = {
  open: boolean
  canManage: boolean
  onClose: () => void
  onPublished: (summary: AccessGovernanceScanSummary) => Promise<void> | void
  onRegistryChanged?: () => Promise<void> | void
}

type TabKey = 'overview' | 'classification' | 'families' | 'routes' | 'reconciliation' | 'publication'

const RESOURCE_TYPES: AccessResourceType[] = [
  'module',
  'module_workspace',
  'route_family',
  'route_group',
  'standalone_route',
  'route',
  'dynamic_route',
  'api_route',
  'internal',
]

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) {
    throw new Error(String(payload?.error || response.statusText || 'Request failed'))
  }
  return payload as T
}

function typeLabel(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function riskTone(value: string) {
  const risk = value.toLowerCase()
  if (risk === 'high' || risk === 'critical') return { background: '#fee2e2', color: '#991b1b' }
  if (risk === 'controlled' || risk === 'medium') return { background: '#fef3c7', color: '#92400e' }
  return { background: '#dcfce7', color: '#166534' }
}

function resourceOverride(resource: AccessDiscoveredResource, overrides: Map<string, AccessResourceOverride>) {
  const override = overrides.get(resource.resourceKey)
  return override ? { ...resource, ...override } : resource
}

export default function GlobalAccessRegistryScannerModal({ open, canManage, onClose, onPublished, onRegistryChanged }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [summary, setSummary] = useState<AccessGovernanceScanSummary | null>(null)
  const [overrides, setOverrides] = useState<Map<string, AccessResourceOverride>>(() => new Map())
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [busy, setBusy] = useState<'scan' | 'publish' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [includeApi, setIncludeApi] = useState(true)
  const [confirmPublish, setConfirmPublish] = useState(false)
  const [versions, setVersions] = useState<AccessRegistryVersionRow[]>([])
  const [rollbackBusy, setRollbackBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    void requestJson<{ ok: true; versions: AccessRegistryVersionRow[] }>('/api/users/access-governance/versions')
      .then((payload) => setVersions(payload.versions || []))
      .catch(() => setVersions([]))
  }, [open, summary?.registryVersionId])

  const resources = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (summary?.resources || [])
      .map((resource) => resourceOverride(resource, overrides))
      .filter((resource) => typeFilter === 'all' || resource.resourceType === typeFilter)
      .filter((resource) => !q || [
        resource.displayName,
        resource.resourceKey,
        resource.resourceType,
        resource.canonicalRoute,
        resource.sourcePath,
        resource.permissionKey,
        resource.familyKey,
        resource.moduleKey,
      ].join(' ').toLowerCase().includes(q))
  }, [overrides, query, summary?.resources, typeFilter])

  const topResources = useMemo(
    () => resources.filter((resource) => !resource.parentResourceKey && ['module', 'route_family', 'standalone_route'].includes(resource.resourceType)),
    [resources],
  )

  function setOverride(resource: AccessDiscoveredResource, patch: Partial<AccessResourceOverride>) {
    setOverrides((current) => {
      const next = new Map(current)
      next.set(resource.resourceKey, {
        resourceKey: resource.resourceKey,
        ...(next.get(resource.resourceKey) || {}),
        ...patch,
      })
      return next
    })
  }

  async function runDryScan() {
    if (!canManage || busy) return
    setBusy('scan')
    setError(null)
    setNotice(null)
    setConfirmPublish(false)
    try {
      const payload = await requestJson<AccessGovernanceScanSummary & { ok: true }>('/api/users/access-governance/scan', {
        method: 'POST',
        body: JSON.stringify({ mode: 'dry_run', includeApi }),
        headers: { 'Idempotency-Key': `access-scan-preview:${Date.now()}` },
      })
      setSummary(payload)
      setOverrides(new Map())
      setNotice(`Dry run completed across ${payload.rootsScanned.length} application root${payload.rootsScanned.length === 1 ? '' : 's'}. No access was granted and no registry resource was published.`)
      setActiveTab('overview')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Global scan failed.')
    } finally {
      setBusy(null)
    }
  }

  async function rollbackVersion(versionId: string) {
    if (!canManage || rollbackBusy || busy) return
    setRollbackBusy(versionId)
    setError(null)
    try {
      const payload = await requestJson<{ ok: true; versionId: string; versionNumber: number; rolledBackAt: string }>(`/api/users/access-governance/versions/${versionId}/rollback`, { method: 'POST' })
      setNotice(`Registry version ${payload.versionNumber} was restored. User grants remain unchanged.`)
      const versionPayload = await requestJson<{ ok: true; versions: AccessRegistryVersionRow[] }>('/api/users/access-governance/versions')
      setVersions(versionPayload.versions || [])
      await onRegistryChanged?.()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Registry rollback failed.')
    } finally {
      setRollbackBusy(null)
    }
  }

  async function publishScan() {
    if (!canManage || !summary || busy || !confirmPublish) return
    setBusy('publish')
    setError(null)
    try {
      const payload = await requestJson<AccessGovernanceScanSummary & { ok: true }>(`/api/users/access-governance/scan/${summary.latestScanId}/publish`, {
        method: 'POST',
        body: JSON.stringify({ overrides: [...overrides.values()] }),
        headers: { 'Idempotency-Key': `access-scan-publish:${summary.latestScanId}` },
      })
      setSummary(payload)
      setNotice(`Registry version published successfully with ${payload.resourcesDetected} classified resources. Existing user grants were not changed automatically.`)
      setConfirmPublish(false)
      await onPublished(payload)
      setActiveTab('publication')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Registry publication failed.')
    } finally {
      setBusy(null)
    }
  }

  if (!open) return null

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'overview', label: 'Scan Overview' },
    { key: 'classification', label: 'Classification Studio' },
    { key: 'families', label: 'Families & Groups' },
    { key: 'routes', label: 'Pages & APIs' },
    { key: 'reconciliation', label: 'Reconciliation' },
    { key: 'publication', label: 'Publication & Recovery' },
  ]

  return (
    <div style={backdropStyle} role="dialog" aria-modal="true" aria-label="Global Access Registry Scanner">
      <div style={modalStyle}>
        <header style={headerStyle}>
          <div style={{ minWidth: 0 }}>
            <div style={eyebrowStyle}>Users Management · Global Access Governance</div>
            <h2 style={titleStyle}>Global Access Registry & Route-Family Scanner</h2>
            <p style={subtitleStyle}>Discover every application surface—not only protected modules—classify independent families, review assignability, publish a recoverable registry version, and expose authorized families on staff dashboards.</p>
          </div>
          <div style={headerActionsStyle}>
            <button type="button" onClick={runDryScan} disabled={!canManage || Boolean(busy)} style={primaryButtonStyle}>
              {busy === 'scan' ? 'Scanning Entire App…' : summary ? 'Run Fresh Dry Scan' : 'Start Global Dry Scan'}
            </button>
            <button type="button" onClick={onClose} style={closeButtonStyle}>Close</button>
          </div>
        </header>

        <div style={securityStripStyle}>
          <span>● Filesystem-wide discovery</span>
          <span>● No automatic grants</span>
          <span>● Missing routes are marked, never deleted</span>
          <span>● Actor-backed publication</span>
          <span>● Version rollback</span>
        </div>

        {error ? <div style={errorStyle}>{error}</div> : null}
        {notice ? <div style={noticeStyle}>{notice}</div> : null}

        <nav style={tabsStyle}>
          {tabs.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} style={activeTab === tab.key ? activeTabStyle : tabStyle}>
              {tab.label}
            </button>
          ))}
        </nav>

        <main style={bodyStyle}>
          {!summary ? (
            <EmptyScannerState includeApi={includeApi} onIncludeApi={setIncludeApi} onRun={runDryScan} canManage={canManage} busy={Boolean(busy)} />
          ) : activeTab === 'overview' ? (
            <Overview summary={summary} includeApi={includeApi} onIncludeApi={setIncludeApi} />
          ) : activeTab === 'classification' ? (
            <ClassificationStudio resources={resources} query={query} setQuery={setQuery} typeFilter={typeFilter} setTypeFilter={setTypeFilter} overrides={overrides} onOverride={setOverride} />
          ) : activeTab === 'families' ? (
            <FamilyHierarchy resources={resources} topResources={topResources} />
          ) : activeTab === 'routes' ? (
            <RouteAndApiInventory resources={resources} query={query} setQuery={setQuery} typeFilter={typeFilter} setTypeFilter={setTypeFilter} />
          ) : activeTab === 'reconciliation' ? (
            <Reconciliation summary={summary} overrides={overrides} />
          ) : (
            <Publication
              summary={summary}
              overrides={overrides}
              confirmPublish={confirmPublish}
              setConfirmPublish={setConfirmPublish}
              onPublish={publishScan}
              busy={busy === 'publish'}
              canManage={canManage}
              versions={versions}
              rollbackBusy={rollbackBusy}
              onRollback={rollbackVersion}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function EmptyScannerState({ includeApi, onIncludeApi, onRun, canManage, busy }: { includeApi: boolean; onIncludeApi: (value: boolean) => void; onRun: () => void; canManage: boolean; busy: boolean }) {
  return (
    <section style={emptyStyle}>
      <div style={emptyIconStyle}>◎</div>
      <h3 style={{ margin: 0, color: '#0f172a', fontSize: 24 }}>Ready to scan the complete OpsOS application estate</h3>
      <p style={{ maxWidth: 760, margin: '10px auto 0', color: '#64748b', lineHeight: 1.7, fontWeight: 600 }}>The scanner traverses every Next.js application root, including independently mounted pages such as CareLink OPS, TrainingHub, assessment portals, CEO controls, public operational surfaces and API route handlers.</p>
      <label style={toggleRowStyle}>
        <input type="checkbox" checked={includeApi} onChange={(event) => onIncludeApi(event.target.checked)} />
        Include API route inventory and guard-risk classification
      </label>
      <button type="button" onClick={onRun} disabled={!canManage || busy} style={primaryButtonStyle}>Run Global Dry Scan</button>
      {!canManage ? <p style={{ color: '#b91c1c', fontWeight: 800 }}>This action requires users.manage or an authorized governance role.</p> : null}
    </section>
  )
}

function Overview({ summary, includeApi, onIncludeApi }: { summary: AccessGovernanceScanSummary; includeApi: boolean; onIncludeApi: (value: boolean) => void }) {
  const stats = [
    ['Application resources', summary.resourcesDetected],
    ['Formal modules', summary.modulesDetected],
    ['Independent families', summary.familiesDetected],
    ['Nested groups', summary.groupsDetected],
    ['Assignable pages', summary.routesDetected],
    ['Standalone pages', summary.standaloneRoutesDetected],
    ['API routes', summary.apiRoutesDetected],
    ['Missing from source', summary.missingResources],
  ]
  return (
    <section style={sectionStackStyle}>
      <div style={statsGridStyle}>{stats.map(([label, value]) => <Stat key={String(label)} label={String(label)} value={Number(value)} />)}</div>
      <div style={twoColumnStyle}>
        <Panel title="Scanner perimeter" subtitle="Every filesystem root inspected by this dry run.">
          {summary.rootsScanned.map((root) => <div key={root} style={codeRowStyle}>{root}</div>)}
          <label style={toggleRowStyle}><input type="checkbox" checked={includeApi} onChange={(event) => onIncludeApi(event.target.checked)} /> Include APIs on the next fresh scan</label>
        </Panel>
        <Panel title="Governance safety" subtitle="No discovery creates user access automatically.">
          <Checklist label="Registry mode" value={summary.scanMode === 'dry_run' ? 'Dry run / preview only' : 'Published'} good />
          <Checklist label="Scan checksum" value={summary.checksum.slice(0, 18) + '…'} good />
          <Checklist label="New resources" value={String(summary.newResources)} good />
          <Checklist label="Changed classifications" value={String(summary.changedResources)} good={summary.changedResources === 0} />
          <Checklist label="Missing resources" value={String(summary.missingResources)} good={summary.missingResources === 0} />
        </Panel>
      </div>
      {summary.warnings.length ? <Panel title="Review warnings" subtitle="These findings are informational and do not block classification.">{summary.warnings.map((warning) => <div key={warning} style={warningRowStyle}>⚠ {warning}</div>)}</Panel> : null}
    </section>
  )
}

function ClassificationStudio({ resources, query, setQuery, typeFilter, setTypeFilter, overrides, onOverride }: {
  resources: AccessDiscoveredResource[]
  query: string
  setQuery: (value: string) => void
  typeFilter: string
  setTypeFilter: (value: string) => void
  overrides: Map<string, AccessResourceOverride>
  onOverride: (resource: AccessDiscoveredResource, patch: Partial<AccessResourceOverride>) => void
}) {
  return (
    <section style={sectionStackStyle}>
      <Toolbar query={query} setQuery={setQuery} typeFilter={typeFilter} setTypeFilter={setTypeFilter} count={resources.length} />
      <div style={resourceGridStyle}>
        {resources.map((resource) => {
          const edited = overrides.has(resource.resourceKey)
          return (
            <article key={resource.resourceKey} style={{ ...resourceCardStyle, ...(edited ? { borderColor: '#60a5fa', boxShadow: '0 0 0 3px rgba(59,130,246,.10)' } : {}) }}>
              <div style={cardTopStyle}>
                <div>
                  <div style={cardTitleStyle}>{resource.displayName}</div>
                  <div style={cardCodeStyle}>{resource.resourceKey}</div>
                </div>
                <span style={{ ...badgeStyle, ...riskTone(resource.riskLevel) }}>{resource.riskLevel}</span>
              </div>
              <div style={miniGridStyle}>
                <label style={fieldStyle}><span>Classification</span><select value={resource.resourceType} onChange={(event) => onOverride(resource, { resourceType: event.target.value as AccessResourceType })} style={inputStyle}>{RESOURCE_TYPES.map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}</select></label>
                <label style={fieldStyle}><span>Display name</span><input value={resource.displayName} onChange={(event) => onOverride(resource, { displayName: event.target.value })} style={inputStyle} /></label>
              </div>
              <div style={toggleGridStyle}>
                <Toggle label="Assignable" checked={resource.assignable} onChange={(checked) => onOverride(resource, { assignable: checked })} />
                <Toggle label="Dashboard card" checked={resource.dashboardVisible} onChange={(checked) => onOverride(resource, { dashboardVisible: checked })} />
                <Toggle label="Navigation" checked={resource.navigationVisible} onChange={(checked) => onOverride(resource, { navigationVisible: checked })} />
              </div>
              <div style={detailListStyle}>
                <Detail label="Route" value={resource.canonicalRoute || 'No direct route'} />
                <Detail label="Permission" value={resource.permissionKey} />
                <Detail label="Parent" value={resource.parentResourceKey || 'Top-level'} />
                <Detail label="Source" value={resource.sourcePath || 'Derived group'} />
              </div>
              <p style={reasonStyle}>{resource.classificationReason}</p>
            </article>
          )
        })}
      </div>
      {!resources.length ? <div style={emptyInlineStyle}>No resources match this classification filter.</div> : null}
    </section>
  )
}

function FamilyHierarchy({ resources, topResources }: { resources: AccessDiscoveredResource[]; topResources: AccessDiscoveredResource[] }) {
  return (
    <section style={sectionStackStyle}>
      <div style={statsGridStyle}>
        <Stat label="Formal modules" value={topResources.filter((resource) => resource.resourceType === 'module').length} />
        <Stat label="Independent families" value={topResources.filter((resource) => resource.resourceType === 'route_family').length} />
        <Stat label="Standalone pages" value={topResources.filter((resource) => resource.resourceType === 'standalone_route').length} />
        <Stat label="Nested groups" value={resources.filter((resource) => ['route_group', 'module_workspace'].includes(resource.resourceType)).length} />
      </div>
      <div style={hierarchyGridStyle}>
        {topResources.map((root) => {
          const children = resources.filter((resource) => resource.parentResourceKey === root.resourceKey)
          return (
            <article key={root.resourceKey} style={hierarchyCardStyle}>
              <div style={cardTopStyle}>
                <div><div style={cardTitleStyle}>{root.displayName}</div><div style={cardCodeStyle}>{typeLabel(root.resourceType)}</div></div>
                <span style={{ ...badgeStyle, background: root.assignable ? '#dcfce7' : '#e2e8f0', color: root.assignable ? '#166534' : '#475569' }}>{root.assignable ? 'assignable' : 'excluded'}</span>
              </div>
              <div style={routeHeroStyle}>{root.canonicalRoute || 'No direct route'}</div>
              <div style={treeStyle}>
                {children.slice(0, 24).map((child) => (
                  <div key={child.resourceKey} style={treeRowStyle}>
                    <span>{child.resourceType === 'route_group' || child.resourceType === 'module_workspace' ? '▣' : '↳'}</span>
                    <span style={{ minWidth: 0 }}><strong>{child.displayName}</strong><small>{child.canonicalRoute || child.resourceKey}</small></span>
                    <span style={tinyBadgeStyle}>{typeLabel(child.resourceType)}</span>
                  </div>
                ))}
                {children.length > 24 ? <div style={moreStyle}>+ {children.length - 24} additional linked resources</div> : null}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function RouteAndApiInventory({ resources, query, setQuery, typeFilter, setTypeFilter }: { resources: AccessDiscoveredResource[]; query: string; setQuery: (value: string) => void; typeFilter: string; setTypeFilter: (value: string) => void }) {
  const routeResources = resources.filter((resource) => ['route', 'dynamic_route', 'standalone_route', 'api_route'].includes(resource.resourceType))
  return (
    <section style={sectionStackStyle}>
      <Toolbar query={query} setQuery={setQuery} typeFilter={typeFilter} setTypeFilter={setTypeFilter} count={routeResources.length} />
      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead><tr><Th>Surface</Th><Th>Route pattern</Th><Th>Class</Th><Th>Family / Module</Th><Th>Permission</Th><Th>Protection</Th><Th>Risk</Th></tr></thead>
          <tbody>
            {routeResources.map((resource) => (
              <tr key={resource.resourceKey}>
                <Td><strong>{resource.displayName}</strong><small style={smallBlockStyle}>{resource.sourcePath || 'Derived resource'}</small></Td>
                <Td><code>{resource.routePattern || resource.canonicalRoute}</code></Td>
                <Td>{typeLabel(resource.resourceType)}</Td>
                <Td>{resource.moduleKey || resource.familyKey || 'Standalone'}</Td>
                <Td><code>{resource.permissionKey}</code></Td>
                <Td>{resource.protected ? 'Protected tree' : resource.resourceType === 'api_route' ? 'API guard review' : 'Independent mount'}</Td>
                <Td><span style={{ ...badgeStyle, ...riskTone(resource.riskLevel) }}>{resource.riskLevel}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Reconciliation({ summary, overrides }: { summary: AccessGovernanceScanSummary; overrides: Map<string, AccessResourceOverride> }) {
  const blocks = [
    ['New resources', summary.diff.newResourceKeys],
    ['Changed resources', summary.diff.changedResourceKeys],
    ['Missing resources', summary.diff.missingResourceKeys],
    ['New formal modules', summary.diff.newModuleKeys],
    ['New assignable routes', summary.diff.newRouteHrefs],
    ['Stale module rows', summary.diff.staleModuleKeys],
    ['Stale route rows', summary.diff.staleRouteHrefs],
  ] as const
  return (
    <section style={sectionStackStyle}>
      <div style={statsGridStyle}>
        <Stat label="Classification overrides" value={overrides.size} />
        <Stat label="New resources" value={summary.newResources} />
        <Stat label="Changed resources" value={summary.changedResources} />
        <Stat label="Missing resources" value={summary.missingResources} />
      </div>
      <div style={reconciliationGridStyle}>
        {blocks.map(([title, values]) => (
          <Panel key={title} title={title} subtitle={`${values.length} detected`}>
            <div style={diffListStyle}>{values.slice(0, 40).map((value) => <div key={value} style={diffRowStyle}>{value}</div>)}</div>
            {values.length > 40 ? <div style={moreStyle}>+ {values.length - 40} more</div> : null}
            {!values.length ? <div style={successEmptyStyle}>No findings in this category.</div> : null}
          </Panel>
        ))}
      </div>
      <Panel title="Reconciliation doctrine" subtitle="Safe behavior applied during publication.">
        <div style={doctrineGridStyle}>
          <Checklist label="New resources" value="Added as active only after explicit publication" good />
          <Checklist label="Changed resources" value="Updated without changing existing user grants" good />
          <Checklist label="Missing resources" value="Marked missing; never deleted automatically" good />
          <Checklist label="Retired resources" value="Require a separate explicit governance decision" good />
        </div>
      </Panel>
    </section>
  )
}

function Publication({ summary, overrides, confirmPublish, setConfirmPublish, onPublish, busy, canManage, versions, rollbackBusy, onRollback }: {
  summary: AccessGovernanceScanSummary
  overrides: Map<string, AccessResourceOverride>
  confirmPublish: boolean
  setConfirmPublish: (value: boolean) => void
  onPublish: () => void
  busy: boolean
  canManage: boolean
  versions: AccessRegistryVersionRow[]
  rollbackBusy: string | null
  onRollback: (versionId: string) => void
}) {
  return (
    <section style={sectionStackStyle}>
      <div style={twoColumnStyle}>
        <Panel title="Publication package" subtitle="The exact classification package that will become the active access registry.">
          <Checklist label="Scan ID" value={summary.latestScanId || 'Not persisted'} good={Boolean(summary.latestScanId)} />
          <Checklist label="Checksum" value={summary.checksum.slice(0, 24) + '…'} good />
          <Checklist label="Resources" value={String(summary.resourcesDetected)} good />
          <Checklist label="Manual overrides" value={String(overrides.size)} good />
          <Checklist label="Existing user grants" value="Preserved unchanged" good />
        </Panel>
        <Panel title="After publication" subtitle="What becomes available immediately after SQL and app deployment.">
          <Checklist label="Users permissions" value="Families and standalone pages become assignable" good />
          <Checklist label="Dashboard" value="Authorized independent family cards appear beside modules" good />
          <Checklist label="Route registry" value="Global pages and dynamic patterns become visible" good />
          <Checklist label="Recovery" value="A complete version snapshot is created" good />
        </Panel>
      </div>

      {summary.scanMode === 'publish' ? (
        <div style={publishedStyle}>
          <strong>Registry publication completed.</strong>
          <span>Version ID: {summary.registryVersionId || 'recorded by the server'}</span>
        </div>
      ) : (
        <div style={publishBoxStyle}>
          <div>
            <div style={eyebrowStyle}>Explicit publication gate</div>
            <h3 style={{ margin: '7px 0 0', color: '#0f172a' }}>Publish this reviewed global registry</h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', lineHeight: 1.6, fontWeight: 600 }}>Publication writes only the registry and version history. It does not grant newly discovered access to any user automatically.</p>
          </div>
          <label style={confirmStyle}><input type="checkbox" checked={confirmPublish} onChange={(event) => setConfirmPublish(event.target.checked)} /> I confirm the classifications and understand missing routes will be marked rather than deleted.</label>
          <button type="button" onClick={onPublish} disabled={!canManage || busy || !confirmPublish} style={dangerButtonStyle}>{busy ? 'Publishing Registry Version…' : 'Publish Reviewed Registry'}</button>
        </div>
      )}

      <Panel title="Registry version history" subtitle="Restore a prior published snapshot without deleting audit history or user grants.">
        <div style={versionListStyle}>
          {versions.map((version) => (
            <div key={version.id} style={versionRowStyle}>
              <div><strong>Version {version.version_number}</strong><small>{new Date(version.published_at || version.created_at).toLocaleString('fr-FR')} · {version.resource_count} resources · {version.actor_email || 'system actor'}</small></div>
              <span style={{ ...badgeStyle, background: version.status === 'active' ? '#dcfce7' : '#e2e8f0', color: version.status === 'active' ? '#166534' : '#475569' }}>{version.status}</span>
              <button type="button" disabled={!canManage || Boolean(rollbackBusy)} onClick={() => onRollback(version.id)} style={versionButtonStyle}>{rollbackBusy === version.id ? 'Restoring…' : 'Restore version'}</button>
            </div>
          ))}
          {!versions.length ? <div style={emptyInlineStyle}>No published registry version exists yet.</div> : null}
        </div>
      </Panel>
    </section>
  )
}

function Toolbar({ query, setQuery, typeFilter, setTypeFilter, count }: { query: string; setQuery: (value: string) => void; typeFilter: string; setTypeFilter: (value: string) => void; count: number }) {
  return <div style={toolbarStyle}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, route, permission, source…" style={{ ...inputStyle, flex: '1 1 340px' }} /><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} style={inputStyle}><option value="all">All resource types</option>{RESOURCE_TYPES.map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}</select><span style={countStyle}>{count} shown</span></div>
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label style={miniToggleStyle}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>
}
function Detail({ label, value }: { label: string; value: string }) { return <div style={detailRowStyle}><span>{label}</span><strong>{value}</strong></div> }
function Stat({ label, value }: { label: string; value: number }) { return <div style={statStyle}><span>{label}</span><strong>{value.toLocaleString()}</strong></div> }
function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) { return <article style={panelStyle}><div><h3 style={panelTitleStyle}>{title}</h3><p style={panelSubtitleStyle}>{subtitle}</p></div><div style={{ marginTop: 16 }}>{children}</div></article> }
function Checklist({ label, value, good }: { label: string; value: string; good: boolean }) { return <div style={checkRowStyle}><span style={{ color: good ? '#16a34a' : '#d97706' }}>{good ? '●' : '▲'}</span><span>{label}</span><strong>{value}</strong></div> }
function Th({ children }: { children: ReactNode }) { return <th style={thStyle}>{children}</th> }
function Td({ children }: { children: ReactNode }) { return <td style={tdStyle}>{children}</td> }

const backdropStyle: CSSProperties = { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.72)', backdropFilter: 'blur(8px)', padding: 18, display: 'grid', placeItems: 'center' }
const modalStyle: CSSProperties = { width: 'min(1700px, 98vw)', height: 'min(940px, 96vh)', background: '#f6f9fd', borderRadius: 30, overflow: 'hidden', boxShadow: '0 40px 120px rgba(2,6,23,.38)', border: '1px solid rgba(255,255,255,.65)', display: 'flex', flexDirection: 'column' }
const headerStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, padding: '24px 26px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0' }
const headerActionsStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.14em' }
const titleStyle: CSSProperties = { margin: '8px 0 0', color: '#0f172a', fontSize: 27, lineHeight: 1.12 }
const subtitleStyle: CSSProperties = { margin: '9px 0 0', maxWidth: 980, color: '#64748b', fontSize: 14, lineHeight: 1.55, fontWeight: 600 }
const securityStripStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 18, padding: '10px 26px', background: '#0f172a', color: '#dbeafe', fontSize: 11, fontWeight: 850 }
const tabsStyle: CSSProperties = { display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 22px', background: '#fff', borderBottom: '1px solid #e2e8f0' }
const tabStyle: CSSProperties = { border: '1px solid #dbe4ef', borderRadius: 999, padding: '9px 13px', background: '#fff', color: '#475569', fontWeight: 850, fontSize: 12, whiteSpace: 'nowrap', cursor: 'pointer' }
const activeTabStyle: CSSProperties = { ...tabStyle, background: '#eaf2ff', color: '#1d4ed8', borderColor: '#93c5fd' }
const bodyStyle: CSSProperties = { flex: 1, minHeight: 0, overflow: 'auto', padding: 22 }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 14, padding: '11px 16px', background: '#2563eb', color: '#fff', fontWeight: 900, cursor: 'pointer' }
const dangerButtonStyle: CSSProperties = { ...primaryButtonStyle, background: '#0f172a', padding: '13px 18px' }
const closeButtonStyle: CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 14, padding: '11px 15px', background: '#fff', color: '#334155', fontWeight: 900, cursor: 'pointer' }
const errorStyle: CSSProperties = { margin: '12px 22px 0', border: '1px solid #fecaca', borderRadius: 14, background: '#fef2f2', color: '#991b1b', padding: 12, fontWeight: 800 }
const noticeStyle: CSSProperties = { margin: '12px 22px 0', border: '1px solid #bfdbfe', borderRadius: 14, background: '#eff6ff', color: '#1e40af', padding: 12, fontWeight: 800 }
const emptyStyle: CSSProperties = { minHeight: 560, display: 'grid', placeItems: 'center', alignContent: 'center', textAlign: 'center', gap: 16, border: '1px dashed #93c5fd', borderRadius: 26, background: '#fff' }
const emptyIconStyle: CSSProperties = { width: 72, height: 72, display: 'grid', placeItems: 'center', borderRadius: 24, background: '#eaf2ff', color: '#2563eb', fontSize: 34, fontWeight: 900 }
const toggleRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 9, color: '#334155', fontSize: 13, fontWeight: 800 }
const sectionStackStyle: CSSProperties = { display: 'grid', gap: 16 }
const statsGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12 }
const statStyle: CSSProperties = { border: '1px solid #dbe5f1', borderRadius: 18, background: '#fff', padding: 16, display: 'grid', gap: 8 }
const twoColumnStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }
const panelStyle: CSSProperties = { border: '1px solid #dbe5f1', borderRadius: 22, background: '#fff', padding: 18, boxShadow: '0 10px 30px rgba(15,23,42,.04)' }
const panelTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 17 }
const panelSubtitleStyle: CSSProperties = { margin: '6px 0 0', color: '#64748b', fontSize: 12, lineHeight: 1.5, fontWeight: 650 }
const codeRowStyle: CSSProperties = { padding: '10px 12px', borderRadius: 12, background: '#f1f5f9', color: '#334155', fontFamily: 'monospace', fontSize: 12, marginBottom: 8, wordBreak: 'break-all' }
const warningRowStyle: CSSProperties = { borderRadius: 12, background: '#fffbeb', color: '#92400e', padding: 12, fontWeight: 750, marginBottom: 8 }
const checkRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '18px minmax(120px, .8fr) 1fr', alignItems: 'center', gap: 10, borderBottom: '1px solid #eef2f7', padding: '10px 0', color: '#475569', fontSize: 12 }
const resourceGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(390px, 1fr))', gap: 14 }
const resourceCardStyle: CSSProperties = { border: '1px solid #dbe5f1', borderRadius: 22, background: '#fff', padding: 17 }
const cardTopStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }
const cardTitleStyle: CSSProperties = { color: '#0f172a', fontWeight: 950, fontSize: 15 }
const cardCodeStyle: CSSProperties = { marginTop: 5, color: '#64748b', fontFamily: 'monospace', fontSize: 10, wordBreak: 'break-all' }
const badgeStyle: CSSProperties = { display: 'inline-flex', borderRadius: 999, padding: '6px 9px', fontSize: 10, fontWeight: 950, textTransform: 'uppercase', whiteSpace: 'nowrap' }
const miniGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 6, color: '#475569', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }
const inputStyle: CSSProperties = { width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: '10px 11px', background: '#fff', color: '#0f172a', fontSize: 12, fontWeight: 700, boxSizing: 'border-box' }
const toggleGridStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }
const miniToggleStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #dbe5f1', borderRadius: 999, padding: '7px 10px', color: '#334155', fontSize: 11, fontWeight: 800 }
const detailListStyle: CSSProperties = { display: 'grid', gap: 6, marginTop: 14, paddingTop: 12, borderTop: '1px solid #eef2f7' }
const detailRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10, color: '#64748b', fontSize: 10 }
const reasonStyle: CSSProperties = { margin: '12px 0 0', borderRadius: 12, background: '#f8fafc', padding: 10, color: '#475569', fontSize: 11, lineHeight: 1.5, fontWeight: 650 }
const emptyInlineStyle: CSSProperties = { borderRadius: 18, background: '#fff', padding: 30, textAlign: 'center', color: '#64748b', fontWeight: 800 }
const hierarchyGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14 }
const hierarchyCardStyle: CSSProperties = { border: '1px solid #dbe5f1', borderRadius: 22, background: '#fff', padding: 17 }
const routeHeroStyle: CSSProperties = { marginTop: 13, borderRadius: 12, background: '#0f172a', color: '#dbeafe', padding: '10px 12px', fontFamily: 'monospace', fontSize: 11 }
const treeStyle: CSSProperties = { display: 'grid', gap: 7, marginTop: 12 }
const treeRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '18px 1fr auto', alignItems: 'center', gap: 8, padding: 9, borderRadius: 12, background: '#f8fafc', color: '#475569', fontSize: 11 }
const tinyBadgeStyle: CSSProperties = { borderRadius: 999, background: '#e2e8f0', padding: '4px 7px', color: '#475569', fontSize: 8, fontWeight: 900, textTransform: 'uppercase' }
const moreStyle: CSSProperties = { padding: 9, color: '#2563eb', fontSize: 11, fontWeight: 850 }
const toolbarStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', border: '1px solid #dbe5f1', borderRadius: 18, background: '#fff', padding: 12 }
const countStyle: CSSProperties = { borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', padding: '8px 11px', fontSize: 11, fontWeight: 900 }
const tableWrapStyle: CSSProperties = { overflow: 'auto', border: '1px solid #dbe5f1', borderRadius: 20, background: '#fff' }
const tableStyle: CSSProperties = { width: '100%', minWidth: 1150, borderCollapse: 'collapse', color: '#334155', fontSize: 11 }
const thStyle: CSSProperties = { position: 'sticky', top: 0, zIndex: 1, padding: '12px 13px', background: '#f8fafc', color: '#475569', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 9, fontWeight: 950, borderBottom: '1px solid #dbe5f1' }
const tdStyle: CSSProperties = { padding: '12px 13px', borderBottom: '1px solid #eef2f7', verticalAlign: 'top' }
const smallBlockStyle: CSSProperties = { display: 'block', marginTop: 4, color: '#94a3b8', fontSize: 9 }
const reconciliationGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 14 }
const diffListStyle: CSSProperties = { maxHeight: 260, overflow: 'auto', display: 'grid', gap: 6 }
const diffRowStyle: CSSProperties = { borderRadius: 10, background: '#f8fafc', color: '#475569', padding: '8px 10px', fontFamily: 'monospace', fontSize: 10, wordBreak: 'break-all' }
const successEmptyStyle: CSSProperties = { borderRadius: 12, background: '#f0fdf4', color: '#166534', padding: 12, fontWeight: 800, fontSize: 11 }
const doctrineGridStyle: CSSProperties = { display: 'grid', gap: 2 }
const publishBoxStyle: CSSProperties = { border: '1px solid #93c5fd', borderRadius: 24, background: '#fff', padding: 22, display: 'grid', gap: 16 }
const confirmStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 14, background: '#f8fafc', padding: 13, color: '#334155', fontSize: 12, fontWeight: 800 }
const publishedStyle: CSSProperties = { border: '1px solid #86efac', borderRadius: 22, background: '#f0fdf4', color: '#166534', padding: 22, display: 'grid', gap: 7 }

const versionListStyle: CSSProperties = { display: 'grid', gap: 9 }
const versionRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 12, border: '1px solid #e2e8f0', borderRadius: 14, padding: 12, color: '#334155', fontSize: 11 }
const versionButtonStyle: CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 10, background: '#fff', color: '#334155', padding: '8px 10px', fontSize: 10, fontWeight: 900, cursor: 'pointer' }
