'use client'

import { useMemo, useState } from 'react'

type PermissionOption = {
  value: string
  label: string
  module?: string
  moduleLabel?: string
  href?: string
}

type SmartPermissionsPanelProps = {
  corePermissions: PermissionOption[]
  pagePermissions: PermissionOption[]
  defaultPermissions?: string[]
}

const PRESETS: Record<string, string[]> = {
  agent: ['profile.view', 'page:/profile', 'pointage.view', 'page:/pointage'],
  sales: ['profile.view', 'leads.view', 'leads.create', 'leads.edit', 'revenue.view', 'page:/profile', 'page:/leads', 'page:/leads/new', 'page:/revenue-command-center', 'page:/revenue-command-center/tasks'],
  manager: ['profile.view', 'users.view', 'leads.view', 'leads.create', 'leads.edit', 'missions.view', 'missions.create', 'missions.edit', 'operations.view', 'reports.view', 'revenue.view', 'revenue.manage', 'page:/profile', 'page:/users', 'page:/leads', 'page:/missions', 'page:/operations', 'page:/reports', 'page:/revenue-command-center'],
}

function normalize(value: unknown) {
  return String(value || '').toLowerCase()
}

function groupByModule(items: PermissionOption[]) {
  return items.reduce<Record<string, PermissionOption[]>>((acc, item) => {
    const group = item.moduleLabel || item.module || 'General'
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {})
}

export default function SmartPermissionsPanel({ corePermissions, pagePermissions, defaultPermissions = [] }: SmartPermissionsPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultPermissions))
  const [query, setQuery] = useState('')
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(['Users', 'Market OS', 'Revenue Command Center', 'Leads', 'Missions']))

  const coreGroups = useMemo(() => groupByModule(corePermissions), [corePermissions])
  const pageGroups = useMemo(() => groupByModule(pagePermissions), [pagePermissions])

  const filteredCoreGroups = useMemo(() => filterGroups(coreGroups, query), [coreGroups, query])
  const filteredPageGroups = useMemo(() => filterGroups(pageGroups, query), [pageGroups, query])

  const selectedCount = selected.size
  const pageSelectedCount = Array.from(selected).filter((item) => item.startsWith('page:')).length

  function filterGroups(groups: Record<string, PermissionOption[]>, search: string) {
    const q = normalize(search)
    if (!q) return groups

    return Object.fromEntries(
      Object.entries(groups)
        .map(([group, items]) => [
          group,
          items.filter((item) =>
            normalize(item.label).includes(q) ||
            normalize(item.value).includes(q) ||
            normalize(item.href).includes(q) ||
            normalize(group).includes(q)
          ),
        ] as const)
        .filter(([, items]) => items.length > 0)
    )
  }

  function toggle(value: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  function setValues(values: string[], checked: boolean) {
    setSelected((current) => {
      const next = new Set(current)
      for (const value of values) {
        if (checked) next.add(value)
        else next.delete(value)
      }
      return next
    })
  }

  function applyPreset(preset: keyof typeof PRESETS) {
    setSelected((current) => {
      const next = new Set(current)
      for (const value of PRESETS[preset]) next.add(value)
      return next
    })
  }

  function toggleGroup(group: string) {
    setOpenGroups((current) => {
      const next = new Set(current)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const allCoreValues = corePermissions.map((item) => item.value)
  const allPageValues = pagePermissions.map((item) => item.value)

  return (
    <section style={panelStyle}>
      <div style={topBarStyle}>
        <div>
          <div style={eyebrowStyle}>Permission Engine V2</div>
          <h2 style={titleStyle}>Accès utilisateur intelligent</h2>
          <p style={hintStyle}>Contrôle combiné des capacités métier et des pages visibles dans l’OverheadPanel.</p>
        </div>
        <div style={scoreBoxStyle}>
          <strong>{selectedCount}</strong>
          <span>permissions</span>
          <small>{pageSelectedCount} pages visibles</small>
        </div>
      </div>

      <div style={toolbarStyle}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher permission, page, module..."
          style={searchStyle}
        />
        <button type="button" style={lightButtonStyle} onClick={() => applyPreset('agent')}>Preset Agent</button>
        <button type="button" style={lightButtonStyle} onClick={() => applyPreset('sales')}>Preset Sales</button>
        <button type="button" style={lightButtonStyle} onClick={() => applyPreset('manager')}>Preset Manager</button>
      </div>

      <div style={bulkBarStyle}>
        <button type="button" style={miniButtonStyle} onClick={() => setValues(allCoreValues, true)}>Tout métier</button>
        <button type="button" style={miniButtonStyle} onClick={() => setValues(allCoreValues, false)}>Vider métier</button>
        <button type="button" style={miniButtonStyle} onClick={() => setValues(allPageValues, true)}>Toutes pages</button>
        <button type="button" style={miniButtonStyle} onClick={() => setValues(allPageValues, false)}>Vider pages</button>
      </div>

      {Array.from(selected).map((value) => (
        <input key={value} type="hidden" name="permissions" value={value} />
      ))}

      <div style={columnsStyle}>
        <div style={columnStyle}>
          <div style={columnHeaderStyle}>Capacités métier</div>
          <PermissionGroups groups={filteredCoreGroups} selected={selected} onToggle={toggle} onBulk={setValues} openGroups={openGroups} onToggleGroup={toggleGroup} />
        </div>

        <div style={columnStyle}>
          <div style={columnHeaderStyle}>Pages visibles dans le panel</div>
          <PermissionGroups groups={filteredPageGroups} selected={selected} onToggle={toggle} onBulk={setValues} openGroups={openGroups} onToggleGroup={toggleGroup} showHref />
        </div>
      </div>
    </section>
  )
}

function PermissionGroups({ groups, selected, onToggle, onBulk, openGroups, onToggleGroup, showHref = false }: {
  groups: Record<string, PermissionOption[]>
  selected: Set<string>
  onToggle: (value: string) => void
  onBulk: (values: string[], checked: boolean) => void
  openGroups: Set<string>
  onToggleGroup: (group: string) => void
  showHref?: boolean
}) {
  const entries = Object.entries(groups)

  if (entries.length === 0) {
    return <div style={emptyStyle}>Aucun résultat.</div>
  }

  return (
    <div style={groupsStyle}>
      {entries.map(([group, items]) => {
        const values = items.map((item) => item.value)
        const checkedCount = values.filter((value) => selected.has(value)).length
        const isOpen = openGroups.has(group)

        return (
          <div key={group} style={groupStyle}>
            <div style={groupHeaderStyle}>
              <button type="button" onClick={() => onToggleGroup(group)} style={groupTitleButtonStyle}>
                <span>{isOpen ? '▾' : '▸'} {group}</span>
                <small>{checkedCount}/{items.length}</small>
              </button>
              <div style={groupActionsStyle}>
                <button type="button" style={tinyButtonStyle} onClick={() => onBulk(values, true)}>Tout</button>
                <button type="button" style={tinyButtonStyle} onClick={() => onBulk(values, false)}>Vider</button>
              </div>
            </div>

            {isOpen && (
              <div style={cardsGridStyle}>
                {items.map((item) => {
                  const checked = selected.has(item.value)
                  return (
                    <label key={item.value} style={permissionCardStyle(checked)}>
                      <input type="checkbox" checked={checked} onChange={() => onToggle(item.value)} />
                      <span>
                        <strong>{item.label}</strong>
                        <small>{showHref ? item.href : item.value}</small>
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const panelStyle: React.CSSProperties = { background: '#fff', padding: 20, borderRadius: 18, marginBottom: 18, border: '1px solid #e2e8f0', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const topBarStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 16 }
const eyebrowStyle: React.CSSProperties = { fontSize: 12, color: '#6366f1', fontWeight: 950, textTransform: 'uppercase', letterSpacing: .6 }
const titleStyle: React.CSSProperties = { fontSize: 22, fontWeight: 950, color: '#0f172a', margin: '4px 0' }
const hintStyle: React.CSSProperties = { color: '#64748b', margin: '4px 0 0', fontSize: 13, lineHeight: 1.5 }
const scoreBoxStyle: React.CSSProperties = { minWidth: 132, borderRadius: 16, background: 'linear-gradient(180deg,#0f172a,#1e293b)', color: '#fff', padding: 14, display: 'grid', gap: 2, textAlign: 'right' }
const toolbarStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, marginBottom: 10 }
const searchStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 12, color: '#0f172a', boxSizing: 'border-box' }
const lightButtonStyle: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 12, background: '#f8fafc', color: '#0f172a', padding: '0 12px', fontWeight: 900, cursor: 'pointer' }
const bulkBarStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }
const miniButtonStyle: React.CSSProperties = { border: '1px solid #dbe3ee', background: '#fff', color: '#334155', borderRadius: 999, padding: '8px 11px', fontWeight: 900, cursor: 'pointer', fontSize: 12 }
const columnsStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 14, alignItems: 'start' }
const columnStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 16, padding: 12, background: '#f8fafc' }
const columnHeaderStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 950, marginBottom: 10, textTransform: 'uppercase', fontSize: 12, letterSpacing: .6 }
const groupsStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const groupStyle: React.CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 14, padding: 10 }
const groupHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 8 }
const groupTitleButtonStyle: React.CSSProperties = { border: 'none', background: 'transparent', color: '#0f172a', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', width: '100%', fontWeight: 950, cursor: 'pointer', textAlign: 'left' }
const groupActionsStyle: React.CSSProperties = { display: 'flex', gap: 6 }
const tinyButtonStyle: React.CSSProperties = { border: '1px solid #dbe3ee', background: '#f8fafc', borderRadius: 999, padding: '5px 8px', fontSize: 11, fontWeight: 900, cursor: 'pointer', color: '#334155' }
const cardsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }
const permissionCardStyle = (checked: boolean): React.CSSProperties => ({ display: 'flex', gap: 9, padding: 10, border: checked ? '1px solid #6366f1' : '1px solid #dbe3ee', borderRadius: 12, background: checked ? '#eef2ff' : '#fff', color: '#0f172a' })
const emptyStyle: React.CSSProperties = { padding: 16, borderRadius: 14, background: '#fff', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
