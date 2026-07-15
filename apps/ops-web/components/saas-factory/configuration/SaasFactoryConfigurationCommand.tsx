'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, Archive, CheckCircle2, ChevronDown, ClipboardCheck, DatabaseZap, Download, Eye,
  FileJson, Flag, History, Loader2, Lock, Plus, RefreshCw, RotateCcw, Save, Search, Send,
  Settings, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, Upload, X
} from 'lucide-react'
import styles from '@/components/saas-factory/SaasFactoryCommandCenter.module.css'

type ConfigGroup = { id: string; key: string; label: string; scope: string; owner: string; status: string; optionCount: number; enabledCount: number; disabledCount: number; updatedAt: string; description: string; source: string }
type ConfigOption = { id: string; groupKey: string; value: string; label: string; enabled: boolean; sortOrder: number; owner: string; updatedAt: string; source: string }
type ConfigFlag = { id: string; key: string; label: string; moduleKey: string; status: string; rolloutPercent: number; owner: string; risk: string; updatedAt: string }
type Policy = { id: string; title: string; status: string; owner: string; severity: string; description: string }
type Recommendation = { id: string; title: string; priority: string; action: string; reason: string }
type State = {
  ok: boolean; source: string; generatedAt: string; summary: Record<string, number | boolean>;
  groups: ConfigGroup[]; options: ConfigOption[]; flags: ConfigFlag[]; policies: Policy[]; recommendations: Recommendation[]; auditEvents: any[]; warnings: string[]
}
type Workflow = null | { type: 'create-option' | 'create-group' | 'feature-gate' | 'validate' | 'publish' | 'rollback' | 'export' | 'audit' | 'policy' | 'environment' | 'bulk' | 'unsafe' | 'details'; title: string; target?: any }

const emptyState: State = { ok: false, source: 'loading', generatedAt: '', summary: {}, groups: [], options: [], flags: [], policies: [], recommendations: [], auditEvents: [], warnings: [] }
const apiBase = '/api/saas-factory/configuration'

const sidebarLinks = [
  ['Overview','/saas-factory-command',Settings],
  ['Observatory','/saas-factory-command/observatory',DatabaseZap],
  ['Modules','/saas-factory-command/modules',SlidersHorizontal],
  ['Configuration','/saas-factory-command/configuration',ShieldCheck],
  ['Options','/saas-factory-command/options',ClipboardCheck],
  ['Actions','/saas-factory-command/actions',Settings],
  ['APIs','/saas-factory-command/apis',DatabaseZap],
  ['Supabase','/saas-factory-command/supabase',DatabaseZap],
  ['Realtime','/saas-factory-command/realtime',RefreshCw],
  ['Incidents','/saas-factory-command/incidents',AlertTriangle],
  ['Permissions','/saas-factory-command/permissions',Lock],
  ['Feature Flags','/saas-factory-command/feature-flags',Flag],
  ['Rules','/saas-factory-command/rules',Settings],
  ['Data Sources','/saas-factory-command/data-sources',DatabaseZap],
  ['Queues','/saas-factory-command/queues',RefreshCw],
  ['Tenants','/saas-factory-command/tenants',ShieldCheck],
  ['Deployment','/saas-factory-command/deployment',Send],
  ['Audit','/saas-factory-command/audit',History],
] as const

async function parseJsonResponse(response: Response) {
  const text = await response.text()
  try { return JSON.parse(text) } catch {
    const contentType = response.headers.get('content-type') || 'unknown'
    const looksHtml = text.trim().startsWith('<')
    throw new Error(looksHtml ? `Configuration API returned HTML instead of JSON. HTTP ${response.status}. Content-Type: ${contentType}. The API route is missing, stale, or crashing; restart Next dev server after applying this fix.` : `Configuration API returned invalid JSON. HTTP ${response.status}: ${text.slice(0, 220)}`)
  }
}

function pillClass(value: string) {
  if (['healthy', 'enabled', 'passed', 'published', 'live'].includes(value)) return styles.pillGreen
  if (['warning', 'review', 'attention', 'pending', 'preview'].includes(value)) return styles.pillYellow
  if (['disabled', 'failed', 'blocked', 'critical'].includes(value)) return styles.pillRed
  return styles.pillBlue
}
function Pill({ value }: { value: string }) { return <span className={`${styles.pill} ${pillClass(value)}`}>{value.replace(/_/g, ' ')}</span> }
function k(value: unknown) { return value === undefined || value === null || value === '' ? '—' : String(value) }

export default function SaasFactoryConfigurationCommand() {
  const [state, setState] = useState<State>(emptyState)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [workflow, setWorkflow] = useState<Workflow>(null)
  const [result, setResult] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState<Record<string, any>>({ group_key: 'cities', value: '', label: '', is_enabled: true, key: '', status: 'disabled', rollout_percent: 0, reason: '' })

  async function load() {
    setLoading(true); setError('')
    try {
      const response = await fetch(apiBase, { cache: 'no-store' })
      const data = await parseJsonResponse(response)
      if (!response.ok) throw new Error(data?.error || 'Configuration state could not be loaded')
      setState(data)
    } catch (err: any) { setError(err?.message || 'Configuration load failed') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const options = useMemo(() => state.options.filter((option) => {
    const text = `${option.label} ${option.value} ${option.groupKey} ${option.owner}`.toLowerCase()
    const matchesText = text.includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || (filter === 'enabled' && option.enabled) || (filter === 'disabled' && !option.enabled)
    return matchesText && matchesFilter
  }), [state.options, search, filter])

  function open(next: NonNullable<Workflow>) { setWorkflow(next); setResult(null); setError('') }
  async function post(path: string, payload: any = {}) {
    setRunning(true); setError('')
    try {
      const response = await fetch(`${apiBase}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await parseJsonResponse(response)
      setResult(data)
      if (!response.ok) throw new Error(data?.reason || data?.error || data?.blockers?.join(', ') || 'Action failed')
      await load()
    } catch (err: any) { setError(err?.message || 'Action failed') }
    finally { setRunning(false) }
  }
  async function save(type: 'option' | 'group' | 'flag') { await post('', { type, payload: type === 'group' ? { key: form.key, label: form.label, is_enabled: form.is_enabled } : type === 'flag' ? { key: form.key, label: form.label, status: form.status, rollout_percent: Number(form.rollout_percent || 0) } : { group_key: form.group_key, value: form.value, label: form.label, is_enabled: form.is_enabled } }) }
  function download(dataset: string, format: 'json' | 'csv') { window.location.href = `${apiBase}/export?dataset=${encodeURIComponent(dataset)}&format=${format}` }

  return <main className={styles.shell}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}><div className={styles.mark}/><div><div className={styles.brandTitle}>ANGELCARE</div><div className={styles.brandSub}>SAAS FACTORY COMMAND</div></div></div>
      <div className={styles.navLabel}>Command Center</div>
      {sidebarLinks.map(([label, href, Icon]) => <Link key={href} className={`${styles.navItem} ${href === '/saas-factory-command/configuration' ? styles.navActive : ''}`} href={href}><Icon size={18}/> {label}</Link>)}
      <div className={styles.sideCard}><div className={styles.navLabel} style={{marginTop:0}}>Configuration Status</div><Pill value={state.source || 'loading'} /><div className={styles.statusRing}><div className={styles.statusRingInner}><div><b>{state.summary.readinessScore ?? '—'}%</b><br/><small>Readiness</small></div></div></div><div className={state.source === 'supabase' ? styles.up : styles.warn}>● Source Confidence</div><div className={state.summary.publishable ? styles.up : styles.warn}>● Publish Gate</div><div className={Number(state.summary.pendingWarnings || 0) === 0 ? styles.up : styles.warn}>● Governance Warnings</div></div>
      <div className={styles.sideCard}><div className={styles.navLabel} style={{marginTop:0}}>Quick Workflows</div>{[
        ['Validate configuration','validate',ClipboardCheck],['Create option','create-option',Plus],['Publish preview','publish',Send],['Rollback center','rollback',RotateCcw],['Export baseline','export',Download]
      ].map(([label,type,Icon]: any) => <button key={type} className={styles.button} style={{width:'100%',justifyContent:'center',marginBottom:8}} onClick={() => open({ type, title: label })}><Icon size={16}/> {label}</button>)}</div>
    </aside>

    <section className={styles.main}>
      <div className={styles.topbar}><div><div className={styles.titleRow}><h1 className={styles.title}>Configuration Factory</h1><span className={styles.liveBadge}>GOVERNED</span></div><div className={styles.subtitle}>Operational configuration CRUD, option governance, publish control, rollback and audit evidence.</div></div><div className={styles.controls}>
        <div className={styles.selectBox}>Environment <b>Production</b><ChevronDown size={14}/></div>
        <div className={styles.selectBox}>Last refresh <b>{state.generatedAt ? new Date(state.generatedAt).toLocaleTimeString() : '—'}</b></div>
        <button className={styles.button} onClick={load} disabled={loading}>{loading ? <Loader2 size={16} /> : <RefreshCw size={16}/>} Refresh</button>
        <button className={`${styles.button} ${styles.primary}`} onClick={() => open({ type: 'publish', title: 'Publish Configuration Workflow' })}><Send size={16}/> Publish Changes</button>
      </div></div>

      {error && <div style={{display:'flex',gap:10,alignItems:'center',padding:12,border:'1px solid rgba(234,179,8,.35)',borderRadius:12,background:'rgba(234,179,8,.10)',marginBottom:14}}><AlertTriangle size={18}/><b>{error}</b></div>}
      <div className={styles.metricGrid}>
        <Metric label="Option Groups" value={state.summary.optionGroups ?? 0} sub="Governed registries" icon={<SlidersHorizontal size={18}/>} />
        <Metric label="Live Options" value={state.summary.options ?? 0} sub={`${state.summary.enabledOptions ?? 0} enabled`} icon={<CheckCircle2 size={18}/>} tone="blue" />
        <Metric label="Feature Gates" value={state.summary.featureFlags ?? 0} sub="Release controls" icon={<Flag size={18}/>} tone="purple" />
        <Metric label="Warnings" value={state.summary.pendingWarnings ?? 0} sub="Need review" icon={<AlertTriangle size={18}/>} tone={(state.summary.pendingWarnings ?? 0) ? 'yellow' : 'green'} />
        <Metric label="Readiness" value={`${state.summary.readinessScore ?? '—'}%`} sub={state.summary.publishable ? 'Publishable' : 'Preview required'} icon={<ShieldCheck size={18}/>} tone={state.summary.publishable ? 'green' : 'yellow'} />
      </div>

      <div className={styles.grid}>
        <Card title="Configuration Registry" subtitle="Create, edit, validate, archive and publish option values" span={8} action={<div className={styles.toolbar}><button className={styles.button} onClick={() => open({ type: 'create-option', title: 'Create Live Option' })}><Plus size={16}/> Option</button><button className={styles.button} onClick={() => open({ type: 'create-group', title: 'Create Option Group' })}><Plus size={16}/> Group</button></div>}>
          <div className={styles.toolbar}><div className={styles.searchBox}><Search size={15}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search configuration values..."/></div>{['all','enabled','disabled'].map((item) => <button key={item} className={`${styles.button} ${filter === item ? styles.primary : ''}`} onClick={() => setFilter(item)}>{item}</button>)}</div>
          {loading ? <Empty title="Loading configuration registry" /> : options.length === 0 ? <Empty title="No matching configuration values" /> : <table className={styles.table}><thead><tr><th>Option</th><th>Group</th><th>Status</th><th>Owner</th><th>Source</th><th>Actions</th></tr></thead><tbody>{options.map((option, index) => <tr key={`${option.id}-${option.groupKey}-${option.value}-${index}`}><td><b>{option.label}</b><br/><small>{option.value}</small></td><td>{option.groupKey}</td><td><Pill value={option.enabled ? 'enabled' : 'disabled'} /></td><td>{option.owner}</td><td><Pill value={option.source}/></td><td><button className={styles.button} onClick={() => open({ type: 'details', title: `Option Evidence: ${option.label}`, target: option })}><Eye size={16}/> Inspect</button></td></tr>)}</tbody></table>}
        </Card>

        <Card title="Publish Governance" subtitle="Safe apply, preview, rollback, export and unsafe action control" span={4}>
          {[
            ['Validate configuration','validate',ClipboardCheck],['Publish preview/apply','publish',Send],['Rollback baseline','rollback',RotateCcw],['Export baseline','export',FileJson],['Hard delete configuration','unsafe',Trash2]
          ].map(([label,type,Icon]: any) => <button key={type} className={`${styles.button} ${type === 'publish' ? styles.primary : type === 'unsafe' ? styles.danger : ''}`} style={{width:'100%',marginBottom:10,justifyContent:'center'}} onClick={() => open({ type, title: label })}><Icon size={16}/> {label}</button>)}
          <div className={styles.feedItem}><Lock size={16}/><div><b>Hard deletes blocked</b><br/><small>Use disable/archive workflows with audit evidence.</small></div></div>
        </Card>

        <Card title="Option Groups" subtitle="Registry health and distribution scope" span={4}>{state.groups.map((group, index) => <div className={styles.feedItem} key={`${group.id}-${group.key}-${index}`} onClick={() => open({ type: 'details', title: `Group Evidence: ${group.label}`, target: group })} role="button"><span className={group.status === 'healthy' ? styles.dot : styles.dotWarn}/><div style={{flex:1}}><b>{group.label}</b><br/><small>{group.optionCount} options • {group.owner}</small></div><Pill value={group.status}/></div>)}</Card>
        <Card title="Feature Gate Controls" subtitle="Release-linked configuration flags" span={4} action={<button className={styles.button} onClick={() => open({ type: 'feature-gate', title: 'Create Feature Gate' })}><Plus size={16}/> Gate</button>}>{state.flags.map((flag, index) => <div className={styles.feedItem} key={`${flag.id}-${flag.key}-${index}`} onClick={() => open({ type: 'feature-gate', title: `Feature Gate: ${flag.label}`, target: flag })} role="button"><Flag size={16}/><div style={{flex:1}}><b>{flag.label}</b><br/><small>{flag.moduleKey} • {flag.rolloutPercent}% rollout</small></div><Pill value={flag.status}/></div>)}</Card>
        <Card title="Policy & Rules" subtitle="Configuration safety controls" span={4}>{state.policies.map((policy) => <div className={styles.feedItem} key={policy.id} onClick={() => open({ type: 'policy', title: policy.title, target: policy })} role="button"><ShieldCheck size={16}/><div style={{flex:1}}><b>{policy.title}</b><br/><small>{policy.owner}</small></div><Pill value={policy.status}/></div>)}</Card>
        <Card title="Recommendations" subtitle="Generated from configuration state" span={6}>{state.recommendations.map((rec, index) => <div className={styles.feedItem} key={`${rec.id}-${index}`} onClick={() => open({ type: 'bulk', title: rec.title, target: rec })} role="button"><Sparkles size={16}/><div style={{flex:1}}><b>{rec.title}</b><br/><small>{rec.reason}</small></div><Pill value={rec.priority}/></div>)}</Card>
        <Card title="Audit Evidence" subtitle="Recent configuration and factory events" span={6} action={<button className={styles.button} onClick={() => open({ type: 'audit', title: 'Configuration Audit Evidence' })}><History size={16}/> Open</button>}>{state.auditEvents.slice(0, 6).map((event: any, index: number) => <div className={styles.feedItem} key={`${event.id || event.event_type || 'event'}-${index}`}><span className={styles.dotInfo}/><div><b>{event.title || event.event || event.event_type}</b><br/><small>{event.actor || event.user || 'system'} • {event.created_at || event.time || 'recent'}</small></div></div>)}</Card>
      </div>
    </section>
    {workflow && <WorkflowModal workflow={workflow} form={form} setForm={setForm} state={state} result={result} error={error} running={running} close={() => setWorkflow(null)} save={save} post={post} download={download} />}
  </main>
}

function Metric({ label, value, sub, icon, tone = 'green' }: { label: string; value: any; sub: string; icon: any; tone?: 'green'|'yellow'|'blue'|'purple' }) { const toneClass = tone === 'yellow' ? styles.warn : tone === 'blue' ? styles.info : tone === 'purple' ? styles.purple : styles.up; return <div className={styles.metric}><div className={styles.metricTop}><span>{label}</span><span className={toneClass}>{icon}</span></div><div className={styles.metricValue}>{value}</div><div className={styles.metricSub}><span className={toneClass}>{sub}</span></div></div> }
function Card({ title, subtitle, span, children, action }: any) { return <section className={`${styles.card} ${styles[`span${span}` as keyof typeof styles] || styles.span4}`}><div className={styles.cardPad}><div className={styles.cardTitle}><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</div></section> }
function Empty({ title }: { title: string }) { return <div style={{display:'grid',gap:8,placeItems:'center',textAlign:'center',border:'1px dashed rgba(148,163,184,.24)',borderRadius:14,padding:20,color:'#94a3b8'}}><DatabaseZap size={22}/><b>{title}</b><small>Nothing fake is injected here. Connect live data or create a governed record.</small></div> }

function WorkflowModal({ workflow, form, setForm, state, result, error, running, close, save, post, download }: any) {
  const type = workflow.type
  return <div className={styles.modalBackdrop} onClick={close}><div className={styles.modal} onClick={(e)=>e.stopPropagation()}><div className={styles.cardTitle}><div><h2>{workflow.title}</h2><p>{modalSubtitle(type)}</p></div><button className={styles.button} onClick={close}><X size={16}/> Close</button></div>
    {error && <div style={{display:'flex',gap:10,alignItems:'center',padding:12,border:'1px solid rgba(234,179,8,.35)',borderRadius:12,background:'rgba(234,179,8,.10)',marginBottom:14}}><AlertTriangle size={18}/><b>{error}</b></div>}
    <div className={styles.grid}>
      {type === 'create-option' && <><Card title="Option Definition" span={6}><label>Group key<input className={styles.input} value={form.group_key || ''} onChange={(e)=>setForm({...form, group_key:e.target.value})}/></label><label>Value<input className={styles.input} value={form.value || ''} onChange={(e)=>setForm({...form, value:e.target.value})}/></label><label>Label<input className={styles.input} value={form.label || ''} onChange={(e)=>setForm({...form, label:e.target.value})}/></label><label className={styles.selectBox}><input type="checkbox" checked={form.is_enabled !== false} onChange={(e)=>setForm({...form, is_enabled:e.target.checked})}/> Enabled</label><button className={`${styles.button} ${styles.primary}`} onClick={()=>save('option')} disabled={running}><Save size={16}/> Save option</button></Card><Evidence state={state}/></>}
      {type === 'create-group' && <><Card title="Option Group Registry" span={6}><label>Group key<input className={styles.input} value={form.key || ''} onChange={(e)=>setForm({...form, key:e.target.value})}/></label><label>Label<input className={styles.input} value={form.label || ''} onChange={(e)=>setForm({...form, label:e.target.value})}/></label><label className={styles.selectBox}><input type="checkbox" checked={form.is_enabled !== false} onChange={(e)=>setForm({...form, is_enabled:e.target.checked})}/> Enabled</label><button className={`${styles.button} ${styles.primary}`} onClick={()=>save('group')} disabled={running}><Save size={16}/> Save group</button></Card><Evidence state={state}/></>}
      {type === 'feature-gate' && <><Card title="Release Gate Editor" span={6}><label>Key<input className={styles.input} value={form.key || workflow.target?.key || ''} onChange={(e)=>setForm({...form, key:e.target.value})}/></label><label>Label<input className={styles.input} value={form.label || workflow.target?.label || ''} onChange={(e)=>setForm({...form, label:e.target.value})}/></label><label>Status<select className={styles.input} value={form.status || workflow.target?.status || 'disabled'} onChange={(e)=>setForm({...form, status:e.target.value})}><option>enabled</option><option>disabled</option><option>rolling_out</option></select></label><label>Rollout %<input className={styles.input} type="number" value={form.rollout_percent ?? workflow.target?.rolloutPercent ?? 0} onChange={(e)=>setForm({...form, rollout_percent:e.target.value})}/></label><button className={`${styles.button} ${styles.primary}`} onClick={()=>save('flag')}><Flag size={16}/> Save gate</button></Card><Evidence state={state}/></>}
      {type === 'validate' && <><Card title="Validation Matrix" span={7}><button className={`${styles.button} ${styles.primary}`} onClick={()=>post('/validate')} disabled={running}>{running ? <Loader2 size={16}/> : <ClipboardCheck size={16}/>} Run validation</button><ResultTable result={result}/></Card><Evidence state={state}/></>}
      {type === 'publish' && <><Card title="Publish Preview & Apply" span={7}><p>This workflow previews production impact first. Apply is blocked when live source confidence or registry safety is missing.</p><div className={styles.toolbar}><button className={styles.button} onClick={()=>post('/publish', { confirmed:false })}>Generate preview</button><button className={`${styles.button} ${styles.primary}`} onClick={()=>post('/publish', { confirmed:true })}>Confirm publish</button></div><ResultTable result={result}/></Card><Evidence state={state}/></>}
      {type === 'rollback' && <><Card title="Rollback Baseline Center" span={7}><label>Rollback reason<textarea className={styles.input} value={form.reason || ''} onChange={(e)=>setForm({...form, reason:e.target.value})}/></label><div className={styles.toolbar}><button className={styles.button} onClick={()=>post('/rollback', { confirmed:false })}>Preview rollback</button><button className={`${styles.button} ${styles.primary}`} onClick={()=>post('/rollback', { confirmed:true, reason: form.reason })}>Confirm rollback request</button></div><ResultTable result={result}/></Card><Evidence state={state}/></>}
      {type === 'export' && <><Card title="Export Builder" span={7}>{['snapshot','options','groups','flags'].map((dataset)=> <div className={styles.feedItem} key={dataset}><FileJson size={16}/><b style={{flex:1}}>{dataset}</b><button className={styles.button} onClick={()=>download(dataset,'json')}>JSON</button><button className={styles.button} onClick={()=>download(dataset,'csv')}>CSV</button></div>)}</Card><Evidence state={state}/></>}
      {type === 'audit' && <Card title="Audit Evidence Timeline" span={12}>{state.auditEvents.map((event: any, index: number) => <div className={styles.feedItem} key={`${event.id || event.event_type || 'audit'}-${index}`}><History size={16}/><div><b>{event.title || event.event || event.event_type}</b><br/><small>{event.actor || event.user || 'system'} • {event.created_at || event.time}</small></div><Pill value={event.severity || 'info'}/></div>)}</Card>}
      {type === 'policy' && <><Card title="Policy Evidence" span={7}><h3>{workflow.target?.title}</h3><Pill value={workflow.target?.status || 'review'}/><p>{workflow.target?.description}</p><button className={styles.button} onClick={()=>post('/actions', { action:'policy-review', policy: workflow.target?.id })}>Write policy review audit</button><ResultTable result={result}/></Card><Evidence state={state}/></>}
      {type === 'bulk' && <><Card title="Remediation Plan" span={7}><h3>{workflow.target?.title}</h3><p>{workflow.target?.reason}</p><button className={`${styles.button} ${styles.primary}`} onClick={()=>post('/actions', { action:'remediation-plan', recommendation: workflow.target })}>Create remediation audit</button><ResultTable result={result}/></Card><Evidence state={state}/></>}
      {type === 'details' && <><Card title="Record Evidence" span={7}><table className={styles.table}><tbody>{Object.entries(workflow.target || {}).map(([key,value]) => <tr key={key}><th>{key}</th><td>{k(value)}</td></tr>)}</tbody></table><div className={styles.toolbar}><button className={styles.button} onClick={()=>post('/actions', { action:'inspect-record', record: workflow.target })}><Eye size={16}/> Inspect</button><button className={styles.button} onClick={()=>post('/actions', { action:'archive-preview', record: workflow.target })}><Archive size={16}/> Archive preview</button></div><ResultTable result={result}/></Card><Evidence state={state}/></>}
      {type === 'unsafe' && <><Card title="Unsafe Action Block" span={7}><AlertTriangle size={28}/><h3>Hard delete and purge are blocked.</h3><p>Enterprise configuration records must be disabled, archived, or rolled back with audit evidence. This button writes an audit attempt and returns a clear blocked reason.</p><button className={`${styles.button} ${styles.danger}`} onClick={()=>post('/actions', { action:'hard-delete' })}><Trash2 size={16}/> Attempt blocked action</button><ResultTable result={result}/></Card><Evidence state={state}/></>}
    </div>
  </div></div>
}
function modalSubtitle(type: string) { return ({ 'create-option':'Create a real option value and distribute it through the registry.', 'create-group':'Create an option namespace with governance metadata.', 'feature-gate':'Control release gates and rollout percentage.', validate:'Run a structured backend validation matrix.', publish:'Preview and apply configuration changes safely.', rollback:'Request rollback against previous audited baseline.', export:'Download real JSON/CSV configuration evidence.', audit:'Inspect recent audit evidence.', policy:'Review safety policy and write audit evidence.', bulk:'Turn recommendation into remediation evidence.', details:'Inspect a concrete record and related actions.', unsafe:'Blocked/destructive action governance.' } as Record<string,string>)[type] || 'Configuration workflow' }
function Evidence({ state }: { state: State }) { return <Card title="Execution Context" span={5}><div className={styles.feedItem}><b>Source</b><span style={{marginLeft:'auto'}}><Pill value={state.source}/></span></div><div className={styles.feedItem}><b>Option groups</b><span style={{marginLeft:'auto'}}>{state.summary.optionGroups ?? 0}</span></div><div className={styles.feedItem}><b>Options</b><span style={{marginLeft:'auto'}}>{state.summary.options ?? 0}</span></div><div className={styles.feedItem}><b>Warnings</b><span style={{marginLeft:'auto'}}>{state.summary.pendingWarnings ?? 0}</span></div>{state.warnings.map((warning, index) => <div className={styles.feedItem} key={`${warning}-${index}`}><span className={styles.dotWarn}/><small>{warning}</small></div>)}</Card> }
function ResultTable({ result }: { result: any }) { if (!result) return <Empty title="No execution result yet" />; const checks = result.checks || result.steps || []; return <div><div className={styles.feedItem}><b>Result</b><span style={{marginLeft:'auto'}}><Pill value={result.ok ? 'passed' : result.blocked ? 'blocked' : 'failed'} /></span></div>{checks.length ? <table className={styles.table}><thead><tr><th>Check</th><th>Status</th><th>Recommendation</th></tr></thead><tbody>{checks.map((check: any, index: number) => <tr key={`${check.id || check.label}-${index}`}><td>{check.label}</td><td><Pill value={check.status}/></td><td>{check.recommendation || check.detail}</td></tr>)}</tbody></table> : <pre style={{whiteSpace:'pre-wrap', maxHeight:280, overflow:'auto'}}>{JSON.stringify(result, null, 2)}</pre>}</div> }
