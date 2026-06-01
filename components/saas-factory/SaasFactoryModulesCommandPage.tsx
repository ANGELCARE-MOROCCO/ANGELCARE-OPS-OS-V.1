'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity, AlertTriangle, Archive, Boxes, CheckCircle2, ChevronDown, Circle, Database, Download, Eye,
  Factory, Gauge, GitBranch, LayoutDashboard, Lock, Network, Plus, RefreshCw, Rocket, Save, Search,
  Settings, ShieldAlert, ShieldCheck, SlidersHorizontal, Trash2, Upload, Workflow, X
} from 'lucide-react'
import styles from './SaasFactoryCommandCenter.module.css'
import { factoryPages } from '@/lib/saas-factory/data'

type ModuleRecord = {
  key: string
  label: string
  description: string
  route: string
  status: string
  health: number
  visibility: string
  access: string
  environment: string
  version: string
  apiCount: number
  pageCount: number
  tables: string[]
  dependencies: string[]
  rollout: string
  owner: string
  source: string
  lastCheckedAt: string
  riskLevel: string
  readiness: number
  exposureScore: number
  incidents: number
  actions: number
  failedActions: number
  apis: number
  failedApis: number
  auditEvents: number
  recommendations: string[]
}

type CommandState = {
  ok: boolean
  source: string
  generatedAt: string
  warnings: string[]
  metrics: Record<string, number>
  modules: ModuleRecord[]
  recommendations: Array<{ id: string; severity: string; moduleKey: string; title: string; action: string }>
  recentAudit: Array<Record<string, any>>
  queueSummary: { totalQueues: number; backlog: number; failed: number; warningQueues: number }
}

type Workflow =
  | { type: 'create' }
  | { type: 'detail'; module: ModuleRecord }
  | { type: 'edit'; module: ModuleRecord }
  | { type: 'exposure'; module: ModuleRecord }
  | { type: 'maintenance'; module: ModuleRecord }
  | { type: 'health'; module?: ModuleRecord }
  | { type: 'sync'; module?: ModuleRecord }
  | { type: 'dependencies'; module: ModuleRecord }
  | { type: 'snapshot'; module?: ModuleRecord }
  | { type: 'retire'; module: ModuleRecord }
  | { type: 'blocked-delete'; module: ModuleRecord }
  | { type: 'export' }
  | { type: 'audit' }
  | { type: 'bulk' }

const iconMap: Record<string, any> = { LayoutDashboard, Activity, Boxes, Factory, Workflow, Database, Network, ShieldAlert, ShieldCheck, Rocket, Settings, Gauge }
const statusOptions = ['all', 'operational', 'warning', 'maintenance', 'disabled', 'critical']
const exposureOptions = ['all', 'visible', 'hidden', 'locked']
const accessOptions = ['all', 'full', 'restricted', 'none']

function IconFor({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = iconMap[name] || Circle
  return <Icon size={size} />
}

function pillClass(value: string) {
  const v = value.toLowerCase()
  if (['healthy', 'live', 'active', 'success', 'released', 'enabled', 'passed', 'ready', 'resolved', 'operational', 'low'].includes(v)) return styles.pillGreen
  if (['warning', 'maintenance', 'rolling_out', 'medium', 'pending', 'identified', 'monitoring'].includes(v)) return styles.pillYellow
  if (['critical', 'dead', 'disabled', 'failed', 'blocked', 'high', 'unhealthy', 'inactive', 'suspended', 'none'].includes(v)) return styles.pillRed
  if (['info', 'readonly', 'view', 'restricted'].includes(v)) return styles.pillBlue
  return styles.pillPurple
}

function Pill({ value }: { value: string }) {
  return <span className={`${styles.pill} ${pillClass(value)}`}>{value.replace(/_/g, ' ')}</span>
}

function Metric({ label, value, sub, tone = 'green' }: { label: string; value: string | number; sub: string; tone?: 'green' | 'red' | 'yellow' | 'blue' | 'purple' }) {
  const toneClass = tone === 'red' ? styles.bad : tone === 'yellow' ? styles.warn : tone === 'blue' ? styles.info : tone === 'purple' ? styles.purple : styles.up
  return <div className={styles.metric}><div className={styles.metricTop}><span>{label}</span><span className={toneClass}>●</span></div><div className={styles.metricValue}>{value}</div><div className={styles.metricSub}><span className={toneClass}>{sub}</span></div></div>
}

function Card({ title, subtitle, span = 4, children, action }: { title: string; subtitle?: string; span?: number; children: ReactNode; action?: ReactNode }) {
  return <section className={`${styles.card} ${styles[`span${span}` as keyof typeof styles] || styles.span4}`}><div className={styles.cardPad}><div className={styles.cardTitle}><div><h3>{title}</h3>{subtitle ? <p>{subtitle}</p> : null}</div>{action}</div>{children}</div></section>
}

function Progress({ value, tone = 'green' }: { value: number; tone?: 'green' | 'yellow' | 'red' }) {
  const bar = tone === 'red' ? styles.barBad : tone === 'yellow' ? styles.barWarn : styles.bar
  return <div className={styles.progress}><div className={bar} style={{ width: `${Math.max(3, Math.min(100, value))}%` }} /></div>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label style={{ display: 'grid', gap: 6 }}><span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>{label}</span>{children}</label>
}

function downloadBlob(name: string, body: string, type: string) {
  const blob = new Blob([body], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

async function readJson(response: Response) {
  const text = await response.text()
  try { return text ? JSON.parse(text) : {} } catch { return { ok: response.ok, raw: text } }
}

export default function SaasFactoryModulesCommandPage() {
  const [state, setState] = useState<CommandState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [exposure, setExposure] = useState('all')
  const [access, setAccess] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [result, setResult] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/saas-factory/modules/command-state', { cache: 'no-store' })
      const payload = await readJson(response)
      if (!response.ok || payload.ok === false) throw new Error(payload.error || 'Modules command-state failed')
      setState(payload)
    } catch (err: any) {
      setError(err?.message || 'Unable to load modules command state')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const modules = state?.modules || []
  const filtered = useMemo(() => modules.filter((module) => {
    const q = search.trim().toLowerCase()
    const matchesSearch = !q || [module.key, module.label, module.description, module.owner, module.route].join(' ').toLowerCase().includes(q)
    return matchesSearch && (status === 'all' || module.status === status) && (exposure === 'all' || module.visibility === exposure) && (access === 'all' || module.access === access)
  }), [modules, search, status, exposure, access])

  const selectedModules = modules.filter((module) => selected.includes(module.key))
  const selectedOrFiltered = selectedModules.length ? selectedModules : filtered

  const openWorkflow = (next: Workflow) => { setResult(null); setWorkflow(next) }

  const runAction = async (action: string, payload: Record<string, any> = {}) => {
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch('/api/saas-factory/modules/actions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, payload }) })
      const payloadJson = await readJson(response)
      setResult(payloadJson)
      setToast(payloadJson.ok ? `Action executed: ${action}` : payloadJson.reason || payloadJson.error || `Action blocked: ${action}`)
      if (payloadJson.ok) await load()
      return payloadJson
    } catch (err: any) {
      const message = err?.message || 'Action failed'
      setResult({ ok: false, error: message })
      setToast(message)
    } finally {
      setBusy(false)
    }
  }

  const runSync = async (moduleKeys: string[]) => {
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch('/api/saas-factory/modules/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scope: moduleKeys.length ? 'selected' : 'all', moduleKeys }) })
      const payload = await readJson(response)
      setResult(payload)
      setToast(`Sync completed: ${payload.summary?.succeeded || 0}/${payload.summary?.requested || 0}`)
      await load()
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || 'Sync failed' })
    } finally { setBusy(false) }
  }

  const runDiagnostics = async (moduleKeys: string[]) => {
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch('/api/saas-factory/modules/diagnostics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ moduleKeys }) })
      const payload = await readJson(response)
      setResult(payload)
      setToast(`Diagnostics: ${payload.summary?.passed || 0} passed / ${payload.summary?.warnings || 0} warnings / ${payload.summary?.failed || 0} failed`)
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || 'Diagnostics failed' })
    } finally { setBusy(false) }
  }

  const exportData = async (format: 'json' | 'csv') => {
    setBusy(true)
    try {
      const response = await fetch(`/api/saas-factory/modules/export?format=${format}`, { cache: 'no-store' })
      const body = await response.text()
      if (!response.ok) throw new Error(body)
      downloadBlob(`saas-factory-modules.${format}`, body, format === 'csv' ? 'text/csv' : 'application/json')
      setResult({ ok: true, exported: format, records: modules.length })
      setToast(`Modules export downloaded as ${format.toUpperCase()}`)
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || 'Export failed' })
    } finally { setBusy(false) }
  }

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}><div className={styles.mark}/><div><div className={styles.brandTitle}>ANGELCARE</div><div className={styles.brandSub}>SAAS FACTORY COMMAND</div></div></div>
      <div className={styles.navLabel}>Command Center</div>
      {factoryPages.map((item) => <Link key={item.key} className={`${styles.navItem} ${item.key === 'modules' ? styles.navActive : ''}`} href={item.href}><IconFor name={item.icon}/>{item.label}</Link>)}
      <div className={styles.sideCard}><div className={styles.navLabel} style={{ marginTop: 0 }}>Registry Source</div><Pill value={state?.source || 'loading'} /><div style={{ marginTop: 12, color: '#94a3b8', fontSize: 12 }}>Live Supabase records are used when available. Fallback state is labeled, never hidden.</div></div>
      <div className={styles.sideCard}><div className={styles.navLabel} style={{ marginTop: 0 }}>Module Quick Ops</div><button className={`${styles.button} ${styles.primary}`} style={{ width: '100%', justifyContent: 'center' }} onClick={() => openWorkflow({ type: 'create' })}><Plus size={16}/> Register Module</button><button className={styles.button} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => openWorkflow({ type: 'bulk' })}><SlidersHorizontal size={16}/> Bulk Operations</button><button className={styles.button} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => openWorkflow({ type: 'audit' })}><ShieldCheck size={16}/> Audit Evidence</button></div>
    </aside>

    <main className={styles.main}>
      <div className={styles.topbar}>
        <div><div className={styles.titleRow}><h1 className={styles.title}>Module Registry & Exposure Control</h1><span className={styles.liveBadge}>LIVE CRUD</span></div><div className={styles.subtitle}>Deep module creation, exposure, health, registry sync, maintenance, audit and safe retirement workspace.</div></div>
        <div className={styles.controls}>
          <div className={styles.selectBox}>Environment <b>Production</b><ChevronDown size={14}/></div>
          <div className={styles.selectBox}>Source <b>{state?.source || 'loading'}</b></div>
          <button className={styles.button} onClick={load} disabled={loading}><RefreshCw size={16}/> Refresh</button>
          <button className={`${styles.button} ${styles.primary}`} onClick={() => openWorkflow({ type: 'sync' })}><Upload size={16}/> Sync Modules</button>
          <button className={styles.button} onClick={() => openWorkflow({ type: 'export' })}><Download size={16}/> Export</button>
        </div>
      </div>

      {error ? <div className={styles.emptyLiveState}><b className={styles.bad}>Unable to load Modules command state.</b><br/>{error}<div style={{ marginTop: 12 }}><button className={styles.button} onClick={load}>Retry</button></div></div> : null}
      {state?.warnings?.length ? <div className={styles.emptyLiveState} style={{ marginBottom: 14 }}><b className={styles.warn}>Compatibility warnings</b><br/>{state.warnings.join(' • ')}</div> : null}

      <div className={styles.metricGrid}>
        <Metric label="Total Modules" value={state?.metrics?.totalModules ?? '...'} sub="registry records" tone="purple" />
        <Metric label="Active" value={state?.metrics?.activeModules ?? '...'} sub="production-capable" />
        <Metric label="Warnings" value={state?.metrics?.warningModules ?? '...'} sub="review required" tone="yellow" />
        <Metric label="Restricted" value={state?.metrics?.restrictedModules ?? '...'} sub="access guarded" tone="blue" />
        <Metric label="Maintenance" value={state?.metrics?.maintenanceModules ?? '...'} sub="controlled windows" tone="yellow" />
        <Metric label="Avg Readiness" value={`${state?.metrics?.averageReadiness ?? 0}%`} sub="deployment posture" />
        <Metric label="Failed Actions" value={state?.metrics?.failedActions ?? '...'} sub="CRUD gaps" tone={(state?.metrics?.failedActions || 0) ? 'red' : 'green'} />
        <Metric label="Deployment Ready" value={`${state?.metrics?.deploymentReady ?? 0}%`} sub="safe exposure" tone="blue" />
      </div>

      <div className={styles.grid}>
        <Card title="Modules Registry Workspace" subtitle="Filtered live records with row-level CRUD, exposure and operational workflows" span={9} action={<button className={`${styles.button} ${styles.primary}`} onClick={() => openWorkflow({ type: 'create' })}><Plus size={16}/> Register Module</button>}>
          <div className={styles.toolbar}>
            {statusOptions.map((item) => <button key={item} className={`${styles.button} ${status === item ? styles.primary : ''}`} onClick={() => setStatus(item)}>{item}</button>)}
            <div className={styles.searchBox}><Search size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search module, owner, route..." /></div>
            <select className={styles.input} value={exposure} onChange={(event) => setExposure(event.target.value)}>{exposureOptions.map((item) => <option key={item}>{item}</option>)}</select>
            <select className={styles.input} value={access} onChange={(event) => setAccess(event.target.value)}>{accessOptions.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          {loading ? <div className={styles.emptyLiveState}>Loading live module registry...</div> : null}
          {!loading && !filtered.length ? <div className={styles.emptyLiveState}>No module matches the current filters. Change filters or register a module.</div> : null}
          {filtered.length ? <div className={styles.liveTableWrap}><table className={styles.table}><thead><tr><th><input type="checkbox" checked={selected.length > 0 && selected.length === filtered.length} onChange={(event) => setSelected(event.target.checked ? filtered.map((module) => module.key) : [])}/></th><th>Module</th><th>Status</th><th>Readiness</th><th>Exposure</th><th>Access</th><th>APIs / Actions</th><th>Owner</th><th>Actions</th></tr></thead><tbody>{filtered.map((module) => <tr key={`module-${module.key}`}><td><input type="checkbox" checked={selected.includes(module.key)} onChange={(event) => setSelected((current) => event.target.checked ? [...new Set([...current, module.key])] : current.filter((key) => key !== module.key))}/></td><td><b>{module.label}</b><br/><small>{module.key} • {module.route}</small><br/><small style={{ color: '#94a3b8' }}>{module.description}</small></td><td><Pill value={module.status}/><br/><small>{module.environment}</small></td><td><b className={module.readiness >= 90 ? styles.up : module.readiness >= 75 ? styles.warn : styles.bad}>{module.readiness}%</b><Progress value={module.readiness} tone={module.readiness >= 90 ? 'green' : module.readiness >= 75 ? 'yellow' : 'red'} /></td><td><Pill value={module.visibility}/><br/><small>score {module.exposureScore}%</small></td><td><Pill value={module.access}/><br/><small>{module.rollout}</small></td><td>{module.apiCount} APIs / {module.actions} actions<br/><small className={module.failedActions || module.failedApis ? styles.bad : styles.up}>{module.failedApis} failed APIs • {module.failedActions} failed actions</small></td><td>{module.owner}<br/><small>{module.version}</small></td><td><div className={styles.toolbar} style={{ marginBottom: 0 }}><button className={styles.button} title="Details" onClick={() => openWorkflow({ type: 'detail', module })}><Eye size={14}/></button><button className={styles.button} title="Edit" onClick={() => openWorkflow({ type: 'edit', module })}><Settings size={14}/></button><button className={styles.button} title="Exposure" onClick={() => openWorkflow({ type: 'exposure', module })}><Lock size={14}/></button><button className={styles.button} title="Health" onClick={() => openWorkflow({ type: 'health', module })}><Gauge size={14}/></button><button className={`${styles.button} ${styles.danger}`} title="Retire" onClick={() => openWorkflow({ type: 'retire', module })}><Archive size={14}/></button></div></td></tr>)}</tbody></table></div> : null}
        </Card>

        <Card title="Module Control Center" subtitle="Context-aware action workspaces. No generic shared command modal." span={3}>
          <button className={`${styles.button} ${styles.primary}`} style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={() => openWorkflow({ type: 'create' })}><Plus size={16}/> Register Module</button>
          <button className={styles.button} style={{ width: '49%', margin: '0 1% 8px' }} onClick={() => openWorkflow({ type: 'sync' })}>Sync</button>
          <button className={styles.button} style={{ width: '49%', margin: '0 1% 8px' }} onClick={() => openWorkflow({ type: 'health' })}>Diagnostics</button>
          <button className={styles.button} style={{ width: '49%', margin: '0 1% 8px' }} onClick={() => openWorkflow({ type: 'bulk' })}>Bulk Edit</button>
          <button className={styles.button} style={{ width: '49%', margin: '0 1% 8px' }} onClick={() => openWorkflow({ type: 'snapshot' })}>Snapshot</button>
          <button className={styles.button} style={{ width: '49%', margin: '0 1% 8px' }} onClick={() => openWorkflow({ type: 'audit' })}>Audit</button>
          <button className={styles.button} style={{ width: '49%', margin: '0 1% 8px' }} onClick={() => openWorkflow({ type: 'export' })}>Export</button>
          <button className={`${styles.button} ${styles.danger}`} style={{ width: '100%', justifyContent: 'center' }} disabled title="Hard delete is blocked; use Retire workflow on a selected module."><Trash2 size={16}/> Hard Delete Blocked</button>
        </Card>

        <Card title="Exposure & Risk Distribution" span={3}>{['visible','hidden','restricted','full','maintenance','disabled'].map((item) => <div key={`dist-${item}`} className={styles.feedItem}><span className={item === 'visible' || item === 'full' ? styles.dot : item === 'maintenance' ? `${styles.dot} ${styles.dotWarn}` : `${styles.dot} ${styles.dotBad}`}/><div style={{ flex: 1 }}>{item}</div><b>{modules.filter((module) => module.visibility === item || module.access === item || module.status === item).length}</b></div>)}</Card>
        <Card title="Recommendations From Module State" span={5}>{state?.recommendations?.length ? state.recommendations.map((item) => <button key={item.id} className={styles.feedItem} style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => { const module = modules.find((m) => m.key === item.moduleKey); if (module) openWorkflow({ type: 'detail', module }) }}><span className={`${styles.dot} ${item.severity === 'critical' || item.severity === 'high' ? styles.dotBad : item.severity === 'medium' ? styles.dotWarn : ''}`}/><div><Pill value={item.severity}/><br/><b>{item.title}</b><br/><small>{item.action}</small></div></button>) : <div className={styles.emptyLiveState}>No state-generated module recommendations.</div>}</Card>
        <Card title="Registry Timeline" span={4}>{(state?.recentAudit || []).slice(0, 6).map((event, index) => <div className={styles.feedItem} key={`audit-${event.id || index}`}><span className={styles.dotInfo}/><div><b>{event.title || event.event || event.event_type || 'Audit event'}</b><br/><small>{event.actor || event.user || 'system'} • {event.created_at || event.time || 'recent'}</small></div></div>)}<button className={styles.button} onClick={() => openWorkflow({ type: 'audit' })}>Open Audit Evidence</button></Card>
      </div>
    </main>
    {workflow ? <WorkflowModal workflow={workflow} modules={modules} selectedModules={selectedOrFiltered} busy={busy} result={result} close={() => setWorkflow(null)} runAction={runAction} runSync={runSync} runDiagnostics={runDiagnostics} exportData={exportData} /> : null}
    {toast ? <div className={styles.toast} onClick={() => setToast(null)}>{toast}</div> : null}
  </div>
}

function WorkflowModal({ workflow, modules, selectedModules, busy, result, close, runAction, runSync, runDiagnostics, exportData }: { workflow: Workflow; modules: ModuleRecord[]; selectedModules: ModuleRecord[]; busy: boolean; result: any; close: () => void; runAction: (action: string, payload?: Record<string, any>) => Promise<any>; runSync: (moduleKeys: string[]) => Promise<void>; runDiagnostics: (moduleKeys: string[]) => Promise<void>; exportData: (format: 'json' | 'csv') => Promise<void> }) {
  const module = 'module' in workflow ? workflow.module : undefined
  const [form, setForm] = useState<Record<string, any>>(() => module ? { ...module, reason: '', window: 'Today 22:00 - 23:00', notes: '' } : { key: '', label: '', description: '', route: '/', owner: 'SaaS Factory Ops', status: 'operational', visibility: 'visible', access: 'full', rollout: 'production', version: 'v1.0.0', reason: '' })
  const setField = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }))
  const title = workflow.type === 'create' ? 'Register New Module' : workflow.type === 'detail' ? `${module?.label} Evidence Room` : workflow.type === 'edit' ? `Edit ${module?.label}` : workflow.type === 'exposure' ? `Exposure & Access Gate — ${module?.label}` : workflow.type === 'maintenance' ? `Maintenance Window — ${module?.label}` : workflow.type === 'health' ? `Module Diagnostics ${module ? `— ${module.label}` : ''}` : workflow.type === 'sync' ? 'Registry Sync Preview' : workflow.type === 'dependencies' ? `Dependency Map — ${module?.label}` : workflow.type === 'snapshot' ? 'Module Snapshot Builder' : workflow.type === 'retire' ? `Safe Retirement — ${module?.label}` : workflow.type === 'blocked-delete' ? `Hard Delete Blocked — ${module?.label}` : workflow.type === 'audit' ? 'Module Audit Evidence' : workflow.type === 'bulk' ? 'Bulk Module Operations' : 'Export Modules'

  return <div className={styles.modalBackdrop}><div className={styles.modal} style={{ width: 'min(1180px, 96vw)', maxHeight: '92vh', overflow: 'auto' }}>
    <div className={styles.cardTitle}><div><h3>{title}</h3><p>{workflow.type} workflow • unique operational flow • audited execution</p></div><button className={styles.button} onClick={close}><X size={16}/> Close</button></div>

    {workflow.type === 'create' || workflow.type === 'edit' ? <div>
      <div className={styles.modalGrid}>
        <Field label="Module key"><input className={styles.input} value={form.key} disabled={workflow.type === 'edit'} onChange={(event) => setField('key', event.target.value)} /></Field>
        <Field label="Label"><input className={styles.input} value={form.label} onChange={(event) => setField('label', event.target.value)} /></Field>
        <Field label="Route prefix"><input className={styles.input} value={form.route} onChange={(event) => setField('route', event.target.value)} /></Field>
        <Field label="Owner team"><input className={styles.input} value={form.owner} onChange={(event) => setField('owner', event.target.value)} /></Field>
        <Field label="Status"><select className={styles.input} value={form.status} onChange={(event) => setField('status', event.target.value)}>{['operational','warning','maintenance','disabled','critical'].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Visibility"><select className={styles.input} value={form.visibility} onChange={(event) => setField('visibility', event.target.value)}>{['visible','hidden','locked'].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Access"><select className={styles.input} value={form.access} onChange={(event) => setField('access', event.target.value)}>{['full','restricted','none'].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Version"><input className={styles.input} value={form.version} onChange={(event) => setField('version', event.target.value)} /></Field>
      </div>
      <Field label="Description"><textarea className={styles.textarea} value={form.description} onChange={(event) => setField('description', event.target.value)} /></Field>
      <Field label="Change reason"><textarea className={styles.textarea} value={form.reason} onChange={(event) => setField('reason', event.target.value)} placeholder="Required operational reason for audit evidence" /></Field>
      <div className={styles.footerActions}><button className={styles.button} onClick={close}>Cancel</button><button className={`${styles.button} ${styles.primary}`} disabled={busy || !form.key || !form.label} onClick={() => runAction(workflow.type === 'create' ? 'create' : 'update', { key: form.key, module: { key: form.key, label: form.label, description: form.description, route_prefix: form.route, owner_team: form.owner, status: form.status, visibility: form.visibility, rollout_stage: form.rollout, metadata_json: { access: form.access, version: form.version, reason: form.reason } } })}><Save size={16}/> Save Module</button></div>
    </div> : null}

    {workflow.type === 'detail' && module ? <div className={styles.grid}><Card title="Operational Identity" span={4}><p><b>{module.label}</b></p><p>{module.description}</p><p><b>Route:</b> {module.route}</p><p><b>Owner:</b> {module.owner}</p><Pill value={module.status}/></Card><Card title="Readiness Evidence" span={4}><b className={module.readiness >= 90 ? styles.up : styles.warn}>{module.readiness}% readiness</b><Progress value={module.readiness}/><br/><b>{module.health}% health</b><Progress value={module.health}/><br/><b>{module.exposureScore}% exposure score</b><Progress value={module.exposureScore}/></Card><Card title="Action Buttons" span={4}><div className={styles.toolbar}><button className={styles.button} onClick={() => runAction('validate', { key: module.key })}>Validate</button><button className={styles.button} onClick={() => runAction('sync-one', { key: module.key })}>Sync</button><button className={styles.button} onClick={() => runAction('snapshot', { key: module.key })}>Snapshot</button><button className={styles.button} onClick={() => runAction('clear-cache', { key: module.key })}>Clear Cache</button></div></Card><Card title="Dependencies" span={6}>{module.dependencies.length ? module.dependencies.map((item) => <span key={`${module.key}-dep-${item}`} className={`${styles.pill} ${styles.pillBlue}`} style={{ margin: 5 }}>{item}</span>) : <div className={styles.emptyLiveState}>No dependencies registered.</div>}<button className={styles.button} onClick={() => runAction('validate', { key: module.key })}>Validate Dependencies</button></Card><Card title="Recommendations" span={6}>{module.recommendations.length ? module.recommendations.map((item) => <div className={styles.feedItem} key={`${module.key}-${item}`}><span className={styles.dotWarn}/>{item}</div>) : <div className={styles.emptyLiveState}>No recommendations for this module.</div>}</Card></div> : null}

    {workflow.type === 'exposure' && module ? <div><div className={styles.modalGrid}><Field label="Visibility"><select className={styles.input} value={form.visibility} onChange={(event) => setField('visibility', event.target.value)}>{['visible','hidden','locked'].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Access profile"><select className={styles.input} value={form.access} onChange={(event) => setField('access', event.target.value)}>{['full','restricted','none'].map((item) => <option key={item}>{item}</option>)}</select></Field></div><Field label="Reason"><textarea className={styles.textarea} value={form.reason} onChange={(event) => setField('reason', event.target.value)} /></Field><div className={styles.emptyLiveState}>Changing exposure affects who can reach the module and how routing appears in production. This action is audited.</div><div className={styles.footerActions}><button className={styles.button} onClick={() => runAction('visibility', { key: module.key, visibility: form.visibility, access: form.access, reason: form.reason })}>Apply Exposure Gate</button></div></div> : null}

    {workflow.type === 'maintenance' && module ? <div><Field label="Maintenance window"><input className={styles.input} value={form.window} onChange={(event) => setField('window', event.target.value)} /></Field><Field label="Owner"><input className={styles.input} value={form.owner} onChange={(event) => setField('owner', event.target.value)} /></Field><Field label="Reason / operator note"><textarea className={styles.textarea} value={form.reason} onChange={(event) => setField('reason', event.target.value)} /></Field><div className={styles.footerActions}><button className={styles.button} onClick={() => runAction('maintenance', { key: module.key, window: form.window, owner: form.owner, reason: form.reason })}>Schedule Maintenance</button></div></div> : null}

    {workflow.type === 'health' ? <div><div className={styles.emptyLiveState}>Diagnostics will check health score, exposure posture, dependency registration and action liveness for {module ? module.label : `${selectedModules.length} selected/visible modules`}.</div><div className={styles.footerActions}><button className={`${styles.button} ${styles.primary}`} disabled={busy} onClick={() => runDiagnostics(module ? [module.key] : selectedModules.map((item) => item.key))}><Activity size={16}/> Run Diagnostics</button></div>{result?.checks ? <table className={styles.table}><thead><tr><th>Check</th><th>Module</th><th>Status</th><th>Finding</th><th>Recommendation</th></tr></thead><tbody>{result.checks.map((check: any) => <tr key={check.id}><td>{check.title}</td><td>{check.moduleKey}</td><td><Pill value={check.status}/></td><td>{check.finding}</td><td>{check.recommendation}</td></tr>)}</tbody></table> : null}</div> : null}

    {workflow.type === 'sync' ? <div><div className={styles.emptyLiveState}>Sync will validate and upsert module registry records with readiness, exposure and health metadata. Selected modules are used when checkboxes are selected; otherwise visible filtered modules are used.</div><table className={styles.table}><thead><tr><th>Module</th><th>Status</th><th>Readiness</th><th>Source</th></tr></thead><tbody>{selectedModules.slice(0, 12).map((item) => <tr key={`sync-${item.key}`}><td>{item.label}</td><td><Pill value={item.status}/></td><td>{item.readiness}%</td><td>{item.source}</td></tr>)}</tbody></table><div className={styles.footerActions}><button className={`${styles.button} ${styles.primary}`} disabled={busy} onClick={() => runSync(selectedModules.map((item) => item.key))}><Upload size={16}/> Execute Registry Sync</button></div></div> : null}

    {workflow.type === 'retire' && module ? <div><div className={styles.emptyLiveState}><b className={styles.warn}>Safe retirement does not delete records.</b><br/>It disables the module, hides it from exposure, and writes audit metadata. Hard delete remains blocked.</div><Field label="Retirement reason"><textarea className={styles.textarea} value={form.reason} onChange={(event) => setField('reason', event.target.value)} /></Field><div className={styles.footerActions}><button className={`${styles.button} ${styles.danger}`} disabled={busy || !form.reason} onClick={() => runAction('disable', { key: module.key, reason: form.reason })}><Archive size={16}/> Retire Safely</button><button className={styles.button} onClick={() => runAction('delete', { key: module.key })}><Trash2 size={16}/> Test Hard Delete Block</button></div></div> : null}

    {workflow.type === 'snapshot' ? <div><div className={styles.emptyLiveState}>Snapshot generates audit evidence for the current module registry state. Use this before risky exposure or rollout changes.</div><div className={styles.footerActions}><button className={styles.button} onClick={() => runAction('snapshot', module ? { key: module.key } : {})}>Generate Snapshot</button></div></div> : null}

    {workflow.type === 'bulk' ? <div><div className={styles.emptyLiveState}>Bulk operations are restricted to safe sync and diagnostics. Destructive bulk actions are intentionally unavailable.</div><div className={styles.toolbar}>{selectedModules.slice(0, 20).map((item) => <span key={`bulk-${item.key}`} className={`${styles.pill} ${styles.pillPurple}`}>{item.label}</span>)}</div><div className={styles.footerActions}><button className={styles.button} onClick={() => runDiagnostics(selectedModules.map((item) => item.key))}>Bulk Diagnostics</button><button className={`${styles.button} ${styles.primary}`} onClick={() => runSync(selectedModules.map((item) => item.key))}>Bulk Sync</button></div></div> : null}

    {workflow.type === 'audit' ? <div><div className={styles.emptyLiveState}>Recent module and SaaS Factory audit events. Export JSON/CSV for compliance evidence.</div><table className={styles.table}><thead><tr><th>Event</th><th>Actor</th><th>Severity</th><th>Time</th></tr></thead><tbody>{modules.slice(0, 8).map((item, index) => <tr key={`audit-module-${item.key}-${index}`}><td>{item.label} registry state reviewed</td><td>{item.owner}</td><td><Pill value={item.riskLevel}/></td><td>{item.lastCheckedAt}</td></tr>)}</tbody></table><div className={styles.footerActions}><button className={styles.button} onClick={() => exportData('json')}>Export Audit JSON</button></div></div> : null}

    {workflow.type === 'export' ? <div><div className={styles.modalGrid}><div className={styles.feedItem}><Download size={18}/><div><b>JSON evidence package</b><br/><small>Full module state, metrics, recommendations and audit context.</small></div></div><div className={styles.feedItem}><Download size={18}/><div><b>CSV registry table</b><br/><small>Spreadsheet-friendly module registry export.</small></div></div></div><div className={styles.footerActions}><button className={styles.button} disabled={busy} onClick={() => exportData('csv')}>Download CSV</button><button className={`${styles.button} ${styles.primary}`} disabled={busy} onClick={() => exportData('json')}>Download JSON</button></div></div> : null}

    {result ? <div style={{ marginTop: 16 }}><Card title="Execution Result" span={12}><pre style={{ whiteSpace: 'pre-wrap', maxHeight: 260, overflow: 'auto', color: '#cbd5e1', fontSize: 12 }}>{JSON.stringify(result, null, 2)}</pre></Card></div> : null}
  </div></div>
}
