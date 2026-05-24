'use client'

import { useMemo, useState, type CSSProperties } from 'react'

type PermissionOption = {
  value: string
  label: string
  module?: string
  moduleLabel?: string
  href?: string
  area?: string
  category?: string
  modulePermissionKey?: string
}

type Props = {
  corePermissions: PermissionOption[]
  pagePermissions: PermissionOption[]
  defaultPermissions?: string[]
  roleTemplates?: Record<string, string[]>
}

const MODULE_ICONS: Record<string, string> = {
  academy: '🎓', admin: '🛡️', billing: '💳', caregivers: '🧸', contracts: '📄', families: '🏡', hr: '👥', incidents: '🚨', leads: '🎯', locations: '📍', market_os: '📣', 'market-os': '📣', missions: '🗺️', operations: '⚙️', pointage: '⏱️', print: '🖨️', profile: '👤', reports: '📊', revenue: '💎', 'revenue-command-center': '💎', sales: '🚀', services: '🧩', settings: '🔧', users: '🔐', 'voice-center': '☎️', voice: '☎️', staff_portal: '🏢', unknown: '✨'
}

function nice(text?: string) {
  return String(text || 'General').replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function moduleOf(option: PermissionOption) {
  if (option.module) return option.module
  const value = option.value || ''
  if (value.startsWith('page:/')) return value.split('/')[1] || 'root'
  return value.split('.')[0] || 'unknown'
}

function groupOptions(options: PermissionOption[]) {
  return options.reduce<Record<string, PermissionOption[]>>((acc, option) => {
    const key = moduleOf(option)
    if (!acc[key]) acc[key] = []
    acc[key].push(option)
    return acc
  }, {})
}

function matches(option: PermissionOption, query: string) {
  if (!query) return true
  const haystack = `${option.value} ${option.label} ${option.module} ${option.moduleLabel} ${option.href}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export default function SmartPermissionsPanel({ corePermissions, pagePermissions, defaultPermissions = [], roleTemplates = {} }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultPermissions))
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'all' | 'selected' | 'core' | 'pages'>('all')
  const [open, setOpen] = useState<Set<string>>(() => new Set(['hr', 'users', 'market-os', 'market_os', 'revenue-command-center', 'academy']))

  const normalizedCore = useMemo(() => corePermissions.map(p => ({ ...p, moduleLabel: p.moduleLabel || nice(moduleOf(p)) })), [corePermissions])
  const normalizedPages = useMemo(() => pagePermissions.map(p => ({ ...p, moduleLabel: p.moduleLabel || nice(moduleOf(p)) })), [pagePermissions])

  const visibleCore = normalizedCore.filter((p) => matches(p, query) && (mode === 'all' || mode === 'core' || (mode === 'selected' && selected.has(p.value))))
  const visiblePages = normalizedPages.filter((p) => matches(p, query) && (mode === 'all' || mode === 'pages' || (mode === 'selected' && selected.has(p.value))))

  const coreGroups = groupOptions(visibleCore)
  const pageGroups = groupOptions(visiblePages)
  const allValues = [...normalizedCore, ...normalizedPages].map(p => p.value)
  const selectedCore = normalizedCore.filter(p => selected.has(p.value)).length
  const selectedPages = normalizedPages.filter(p => selected.has(p.value)).length
  const moduleCoverage = new Set([...normalizedCore, ...normalizedPages].filter(p => selected.has(p.value)).map(moduleOf)).size
  const totalModules = new Set([...normalizedCore, ...normalizedPages].map(moduleOf)).size

  function toggle(value: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(value) ? next.delete(value) : next.add(value)
      return next
    })
  }

  function bulk(values: string[], checked: boolean) {
    setSelected(prev => {
      const next = new Set(prev)
      values.forEach(value => checked ? next.add(value) : next.delete(value))
      return next
    })
  }

  function applyTemplate(name: string) {
    const template = roleTemplates[name] || []
    if (!template.length) return
    if (template.includes('*')) return bulk(allValues, true)
    const pageValues = normalizedPages.filter(p => template.includes(p.modulePermissionKey as any) || template.includes(moduleOf(p) + '.view')).map(p => p.value)
    bulk([...template, ...pageValues], true)
  }

  function toggleGroup(key: string) {
    setOpen(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <section style={panelStyle}>
      {[...selected].map(value => <input key={value} type="hidden" name="permissions" value={value} />)}

      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>Full app permission matrix</div>
          <h2 style={titleStyle}>100% module & submodule coverage</h2>
          <p style={textStyle}>Grant capability permissions and exact page access across AngelCare OS. Every route from the app map is represented as a page permission.</p>
        </div>
        <div style={statsGridStyle}>
          <Stat label="Selected" value={selected.size} />
          <Stat label="Capabilities" value={selectedCore} />
          <Stat label="Pages" value={selectedPages} />
          <Stat label="Modules" value={`${moduleCoverage}/${totalModules}`} />
        </div>
      </div>

      <div style={toolbarStyle}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search modules, pages, permissions, routes..." style={searchStyle} />
        <select style={selectStyle} onChange={e => applyTemplate(e.target.value)} defaultValue="">
          <option value="">Apply role template</option>
          {Object.keys(roleTemplates).sort().map(key => <option key={key} value={key}>{nice(key)}</option>)}
        </select>
        <button type="button" style={darkButtonStyle} onClick={() => bulk(allValues, true)}>Select all app</button>
        <button type="button" style={lightButtonStyle} onClick={() => setSelected(new Set(defaultPermissions))}>Reset</button>
      </div>

      <div style={modeBarStyle}>
        {(['all','core','pages','selected'] as const).map(item => <button key={item} type="button" onClick={() => setMode(item)} style={mode === item ? activeModeStyle : modeStyle}>{nice(item)}</button>)}
      </div>

      <div style={columnsStyle}>
        <PermissionColumn title="Operational capabilities" subtitle="Create, manage, approve, export and admin permissions." groups={coreGroups} selected={selected} open={open} onToggle={toggle} onBulk={bulk} onToggleGroup={toggleGroup} />
        <PermissionColumn title="Exact page access" subtitle="Every live route/submodule available in the app navigation map." groups={pageGroups} selected={selected} open={open} onToggle={toggle} onBulk={bulk} onToggleGroup={toggleGroup} showHref />
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div style={statStyle}><strong>{value}</strong><span>{label}</span></div>
}

function PermissionColumn({ title, subtitle, groups, selected, open, onToggle, onBulk, onToggleGroup, showHref = false }: any) {
  const keys = Object.keys(groups).sort((a, b) => a.localeCompare(b))
  return (
    <div style={columnStyle}>
      <div style={columnHeaderStyle}><strong>{title}</strong><span>{subtitle}</span></div>
      <div style={groupListStyle}>
        {keys.map(key => {
          const options: PermissionOption[] = groups[key]
          const values = options.map(o => o.value)
          const checked = values.filter(v => selected.has(v)).length
          const isOpen = open.has(key)
          return (
            <div key={key} style={groupStyle}>
              <button type="button" style={groupHeaderStyle} onClick={() => onToggleGroup(key)}>
                <span style={groupIconStyle}>{MODULE_ICONS[key] || MODULE_ICONS[nice(key).toLowerCase()] || '✨'}</span>
                <span style={{ flex: 1 }}><strong>{nice(key)}</strong><small>{checked}/{values.length} selected</small></span>
                <span>{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen ? <>
                <div style={bulkRowStyle}>
                  <button type="button" onClick={() => onBulk(values, true)} style={tinyButtonStyle}>Select module</button>
                  <button type="button" onClick={() => onBulk(values, false)} style={tinyLightButtonStyle}>Clear</button>
                </div>
                <div style={optionListStyle}>
                  {options.map(option => <label key={option.value} style={optionStyle}>
                    <input type="checkbox" checked={selected.has(option.value)} onChange={() => onToggle(option.value)} />
                    <span><strong>{option.label || option.value}</strong>{showHref ? <small>{option.href || option.value}</small> : <small>{option.value}</small>}</span>
                  </label>)}
                </div>
              </> : null}
            </div>
          )
        })}
        {!keys.length ? <div style={emptyStyle}>No permissions match this filter.</div> : null}
      </div>
    </div>
  )
}

const panelStyle: CSSProperties = { borderRadius: 30, padding: 22, background: 'linear-gradient(180deg,#ffffff,#f8fafc)', border: '1px solid #e2e8f0', boxShadow: '0 24px 60px rgba(15,23,42,.08)', marginTop: 18 }
const topStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 16, alignItems: 'start', marginBottom: 16 }
const eyebrowStyle: CSSProperties = { color: '#7c3aed', fontSize: 11, fontWeight: 1000, textTransform: 'uppercase', letterSpacing: '.14em' }
const titleStyle: CSSProperties = { margin: '6px 0', fontSize: 28, lineHeight: 1.05, fontWeight: 1000, letterSpacing: '-.04em', color: '#0f172a' }
const textStyle: CSSProperties = { margin: 0, color: '#64748b', fontWeight: 750, lineHeight: 1.7 }
const statsGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }
const statStyle: CSSProperties = { display: 'grid', gap: 4, padding: 14, borderRadius: 20, background: '#fff', border: '1px solid #e2e8f0', textAlign: 'center', color: '#0f172a' }
const toolbarStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 220px auto auto', gap: 10, padding: 12, borderRadius: 24, background: '#eef2ff', border: '1px solid #ddd6fe', marginBottom: 12 }
const searchStyle: CSSProperties = { minWidth: 0, border: '1px solid #c7d2fe', borderRadius: 16, padding: '12px 14px', fontWeight: 850, outline: 'none', background: '#fff', color: '#0f172a' }
const selectStyle: CSSProperties = { border: '1px solid #c7d2fe', borderRadius: 16, padding: '12px 14px', fontWeight: 850, background: '#fff', color: '#0f172a' }
const darkButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 14px', background: '#4c1d95', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const lightButtonStyle: CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 16, padding: '12px 14px', background: '#fff', color: '#0f172a', fontWeight: 950, cursor: 'pointer' }
const modeBarStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }
const modeStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 999, background: '#fff', padding: '9px 13px', fontWeight: 950, color: '#475569', cursor: 'pointer' }
const activeModeStyle: CSSProperties = { ...modeStyle, background: '#0f172a', color: '#fff', borderColor: '#0f172a' }
const columnsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }
const columnStyle: CSSProperties = { minWidth: 0, borderRadius: 24, background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden' }
const columnHeaderStyle: CSSProperties = { display: 'grid', gap: 4, padding: 16, background: 'linear-gradient(135deg,#f8fafc,#eef2ff)', color: '#0f172a' }
const groupListStyle: CSSProperties = { display: 'grid', gap: 10, padding: 12, maxHeight: 720, overflow: 'auto' }
const groupStyle: CSSProperties = { borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', background: '#fff' }
const groupHeaderStyle: CSSProperties = { width: '100%', border: 0, background: '#fff', padding: 13, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left', color: '#0f172a' }
const groupIconStyle: CSSProperties = { width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 14, background: '#f1f5f9' }
const bulkRowStyle: CSSProperties = { display: 'flex', gap: 8, padding: '0 13px 10px' }
const tinyButtonStyle: CSSProperties = { border: 0, borderRadius: 999, background: '#ede9fe', color: '#5b21b6', padding: '7px 10px', fontSize: 11, fontWeight: 950, cursor: 'pointer' }
const tinyLightButtonStyle: CSSProperties = { ...tinyButtonStyle, background: '#f1f5f9', color: '#475569' }
const optionListStyle: CSSProperties = { display: 'grid', gap: 6, padding: '0 13px 13px' }
const optionStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '18px 1fr', gap: 10, alignItems: 'start', borderRadius: 14, padding: 10, background: '#f8fafc', color: '#0f172a', fontSize: 13 }
const emptyStyle: CSSProperties = { padding: 24, textAlign: 'center', borderRadius: 18, border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 850 }
