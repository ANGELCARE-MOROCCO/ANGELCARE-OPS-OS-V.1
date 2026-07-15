'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity, AlertTriangle, BarChart3, Bell, Boxes, BriefcaseBusiness, Building2, Cable, Check, CheckCircle2,
  ChevronDown, Circle, Database, DatabaseZap, Download, Eye, Factory, Flag, Gauge, GraduationCap, Landmark,
  LayoutDashboard, ListChecks, Mail, Megaphone, MousePointerClick, Network, PhoneCall, Plus, RadioTower,
  RefreshCw, Rocket, Save, ScrollText, Search, Send, ServerCog, Settings, ShieldAlert, ShieldCheck,
  ShoppingBag, SlidersHorizontal, Sparkles, Trash2, Upload, Users, Workflow, X
} from 'lucide-react'
import styles from './SaasFactoryCommandCenter.module.css'
import { actions, auditEvents, dataSources, factoryPages, factorySummary, featureFlags, incidents, modules, optionGroups, queues, tenants } from '@/lib/saas-factory/data'
import type { FactoryStatus } from '@/lib/saas-factory/types'

type PageKey = typeof factoryPages[number]['key']

type Props = { page?: PageKey; pageKey?: PageKey | 'executive'; initialOverview?: unknown }

type ModalState = null | { title: string; mode: string; body?: string }

type ObservatoryProbe = {
  id: string
  name: string
  category: string
  status: string
  severity: string
  related: string
  latencyMs?: number | null
  lastCheckedAt?: string
  source?: string
  failureReason?: string
  recommendedAction?: string
  endpoint?: string
  auditRefs?: string[]
}

type ObservatoryState = null | {
  ok: boolean
  source: string
  generatedAt: string
  lastScanAt?: string
  lastSyncAt?: string
  confidence?: string
  snapshot: Record<string, string | number>
  health: Array<{ key: string; label: string; status: string; score: number; source: string; detail: string }>
  probes: ObservatoryProbe[]
  queues: Array<{ key: string; label: string; status: string; backlog: number; failed: number; recommendedAction: string }>
  incidents: Array<{ id: string; title: string; severity: string; status: string; related?: string }>
  audit: Array<{ id: string; title: string; event_type?: string; severity?: string; created_at?: string }>
  recommendations: Array<{ id: string; title: string; severity: string; reason: string; action: string }>
  disabledActions: Array<{ action: string; reason: string }>
  warnings?: string[]
  checks?: Array<Record<string, unknown>>
  diagnostics?: Array<Record<string, unknown>>
  summary?: string
  resultType?: string
}

type ObservatoryModalState = null | {
  title: string
  command: string
  endpoint: string
  method: 'GET' | 'POST'
  description: string
  kind: 'scan' | 'diagnostics' | 'probe' | 'queue' | 'incident' | 'audit' | 'export' | 'safe' | 'sync' | 'refresh' | 'settings' | 'health' | 'recommendation'
  payload?: Record<string, unknown>
  destructive?: boolean
  disabledReason?: string
}

const iconMap = {
  LayoutDashboard, Activity, Boxes, Factory, ListChecks, MousePointerClick, Cable, Database, RadioTower, ShieldAlert,
  ShieldCheck, Flag, Workflow, DatabaseZap, ServerCog, Building2, Rocket, ScrollText, Mail, Landmark, Users, GraduationCap,
  Megaphone, Network, BriefcaseBusiness, ShoppingBag, PhoneCall, BarChart3
}

const pageTitles: Record<PageKey, { title: string; subtitle: string; primary: string }> = {
  overview: { title: 'Executive Command Overview', subtitle: 'Real-time operational overview of AngelCare Live Factory Command OS', primary: 'Scan Now' },
  observatory: { title: 'Live System Observatory', subtitle: 'Real-time engineering observability and system health monitoring', primary: 'Run All Probes' },
  modules: { title: 'Module Registry & Exposure Control', subtitle: 'Control, monitor and manage all system modules, visibility, access and availability', primary: 'Sync Modules' },
  configuration: { title: 'Configuration Factory', subtitle: 'Centralized live configuration and global options management', primary: 'Publish Changes (3)' },
  options: { title: 'Live Options Registry', subtitle: 'Centralized live options management and global distribution control', primary: 'Sync All Modules' },
  actions: { title: 'Action Liveness Matrix', subtitle: 'Real-time coverage and liveness status of all actions, buttons, modals, APIs and routes', primary: 'Run Full Scan' },
  apis: { title: 'API Command Center', subtitle: 'Monitor, inspect and test all API routes, performance, errors and integrations in real-time', primary: 'API Explorer' },
  supabase: { title: 'Supabase Infrastructure Control', subtitle: 'Monitor, manage and optimize your Supabase backend infrastructure in real-time', primary: 'SQL Editor' },
  realtime: { title: 'Realtime & Notifications', subtitle: 'Stay informed with real-time alerts, system events, and critical notifications', primary: 'Mark All as Read' },
  incidents: { title: 'Incident Command Center', subtitle: 'Detect, respond and resolve incidents in real-time', primary: 'New Incident' },
  permissions: { title: 'Permission Matrix', subtitle: 'View and manage permissions across users, roles, and modules', primary: 'Add Permission' },
  'feature-flags': { title: 'Feature Flags', subtitle: 'Manage feature releases and control access across environments.', primary: 'Create Flag' },
  rules: { title: 'Rule Builder', subtitle: 'Create detection and operational rules with visual logic and validation.', primary: 'Next: Test & Validate' },
  'data-sources': { title: 'Data Source Truth Center', subtitle: 'Discover, inventory, and monitor the health and reliability of all data sources.', primary: 'Add Data Source' },
  queues: { title: 'Queue Operations', subtitle: 'Monitor and manage processing queues in real-time', primary: 'Queue Actions' },
  tenants: { title: 'Tenant Manager', subtitle: 'Manage tenants, their configurations, subscriptions, and access.', primary: 'Create Tenant' },
  deployment: { title: 'Deployment Readiness', subtitle: 'Validate configuration, security controls, and system health before deployment.', primary: 'Run Readiness Check' },
  audit: { title: 'Audit Timeline', subtitle: 'Real-time timeline of security and configuration changes across your environment.', primary: 'Create Alert' },
}

function IconFor({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = (iconMap as Record<string, any>)[name] || Circle
  return <Icon size={size} />
}

function statusClass(status: string) {
  if (['healthy', 'live', 'active', 'success', 'released', 'enabled', 'passed', 'ready', 'resolved'].includes(status)) return styles.pillGreen
  if (['warning', 'maintenance', 'rolling_out', 'medium', 'pending', 'identified', 'monitoring'].includes(status)) return styles.pillYellow
  if (['critical', 'dead', 'disabled', 'failed', 'blocked', 'high', 'unhealthy', 'inactive', 'suspended'].includes(status)) return styles.pillRed
  if (['info', 'low', 'readonly', 'view'].includes(status)) return styles.pillBlue
  return styles.pillPurple
}

function Pill({ value }: { value: string }) {
  return <span className={`${styles.pill} ${statusClass(value)}`}>{value.replace(/_/g, ' ')}</span>
}

function Sparkline({ tone = 'green' }: { tone?: 'green' | 'red' | 'yellow' | 'purple' | 'blue' }) {
  const stroke = tone === 'red' ? '#ef4444' : tone === 'yellow' ? '#eab308' : tone === 'purple' ? '#a855f7' : tone === 'blue' ? '#38bdf8' : '#22c55e'
  return (
    <svg className={styles.spark} viewBox="0 0 96 28" preserveAspectRatio="none">
      <polyline fill="none" stroke={stroke} strokeWidth="2" points="0,18 8,14 15,17 22,10 29,15 37,12 45,18 52,9 59,13 67,5 75,16 84,12 92,7" />
    </svg>
  )
}

type MetricInput = { label: string; value: string | number; sub: string; tone?: 'green' | 'red' | 'yellow' | 'purple' | 'blue'; icon: ReactNode }

function MetricCard({ label, value, sub, tone = 'green', icon }: MetricInput) {
  const toneClass = tone === 'red' ? styles.bad : tone === 'yellow' ? styles.warn : tone === 'purple' ? styles.purple : tone === 'blue' ? styles.info : styles.up
  return (
    <div className={styles.metric}>
      <div className={styles.metricTop}><span>{label}</span><span className={toneClass}>{icon}</span></div>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricSub}><span className={toneClass}>{sub}</span></div>
    </div>
  )
}

function Card({ title, subtitle, span = 4, children, action }: { title: string; subtitle?: string; span?: number; children: ReactNode; action?: ReactNode }) {
  return <section className={`${styles.card} ${styles[`span${span}` as keyof typeof styles] || styles.span4}`}><div className={styles.cardPad}><div className={styles.cardTitle}><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</div></section>
}

function TopBar({ page, onAction }: { page: PageKey; onAction: (mode: string) => void }) {
  const p = pageTitles[page] ?? pageTitles.overview
  return <div className={styles.topbar}>
    <div>
      <div className={styles.titleRow}><h1 className={styles.title}>{p.title}</h1><span className={styles.liveBadge}>LIVE</span></div>
      <div className={styles.subtitle}>{p.subtitle}</div>
    </div>
    <div className={styles.controls}>
      <div className={styles.selectBox}><span className={styles.up}>●</span> Environment <b>Production</b><ChevronDown size={14}/></div>
      <div className={styles.selectBox}>Region <b>US-East (N. Virginia)</b><ChevronDown size={14}/></div>
      <div className={styles.selectBox}>System Time <b>May 19, 2025 10:24:52 AM</b></div>
      <button className={`${styles.button} ${styles.primary}`} onClick={() => onAction(p.primary)}>{page === 'incidents' || page === 'tenants' || page === 'feature-flags' || page === 'data-sources' ? <Plus size={16}/> : <RefreshCw size={16}/>} {p.primary}</button>
      <button className={styles.button} onClick={() => onAction('Open settings')}><Settings size={16}/></button>
      <button className={styles.button} onClick={() => onAction('Open notifications')}><Bell size={16}/></button>
    </div>
  </div>
}

function Sidebar({ page, onAction }: { page: PageKey; onAction: (mode: string) => void }) {
  return <aside className={styles.sidebar}>
    <div className={styles.brand}><div className={styles.mark}/><div><div className={styles.brandTitle}>ANGELCARE</div><div className={styles.brandSub}>SAAS FACTORY COMMAND</div></div></div>
    <div className={styles.navLabel}>Command Center</div>
    {factoryPages.map((item) => <Link key={item.key} className={`${styles.navItem} ${page === item.key ? styles.navActive : ''}`} href={item.href}><IconFor name={item.icon}/>{item.label}</Link>)}
    <div className={styles.sideCard}>
      <div className={styles.navLabel} style={{marginTop:0}}>System Status</div>
      <div>All Systems Operational</div>
      <div className={styles.statusRing}><div className={styles.statusRingInner}><div><b>98.7%</b><br/><small>Excellent</small></div></div></div>
      <div className={styles.up}>● Database Sync</div><div className={styles.up}>● Module Sync</div><div className={styles.up}>● Distribution Engine</div>
    </div>
    <div className={styles.sideCard}>
      <div className={styles.navLabel} style={{marginTop:0}}>Quick Actions</div>
      <button className={`${styles.button} ${styles.primary}`} style={{width:'100%',justifyContent:'center'}} onClick={() => onAction('Add New Option')}><Plus size={16}/> Add New Option</button>
      <button className={styles.button} style={{width:'100%',justifyContent:'center',marginTop:8}} onClick={() => onAction('Open AI Assistant')}><Sparkles size={16}/> Open Assistant</button>
    </div>
  </aside>
}

function KpiStrip({ page }: { page: PageKey }) {
  const s = factorySummary()
  const common: MetricInput[] = [
    { label: 'Global Health Score', value: `${s.globalHealth}%`, sub: 'Excellent', tone: 'green' as const, icon: <Gauge size={18}/> },
    { label: 'Active Modules', value: s.activeModules, sub: 'All running', tone: 'green' as const, icon: <Boxes size={18}/> },
    { label: 'API Uptime (24h)', value: '99.95%', sub: '+0.03%', tone: 'green' as const, icon: <Cable size={18}/> },
    { label: 'Live Users', value: s.activeUsers, sub: '+12%', tone: 'blue' as const, icon: <Users size={18}/> },
    { label: 'Incidents', value: s.incidents, sub: 'Needs attention', tone: 'red' as const, icon: <AlertTriangle size={18}/> },
    { label: 'Sync Confidence', value: '100%', sub: 'Perfect', tone: 'green' as const, icon: <RefreshCw size={18}/> },
    { label: 'Total Options', value: s.totalOptions, sub: 'Active options', tone: 'purple' as const, icon: <ListChecks size={18}/> },
    { label: 'Coverage', value: `${s.actionCoverage}%`, sub: 'All areas scanned', tone: 'green' as const, icon: <ShieldCheck size={18}/> },
  ]
  const byPage: Partial<Record<PageKey, MetricInput[]>> = {
    observatory: [
      { label: 'Overall Health', value: '98.7%', sub: 'Excellent', tone: 'green', icon: <Gauge size={18}/> }, { label: 'API Health', value: '95.9%', sub: 'Healthy', tone: 'green', icon: <Cable size={18}/> }, { label: 'Database Health', value: '99.2%', sub: 'Healthy', tone: 'green', icon: <Database size={18}/> }, { label: 'Realtime Health', value: '100%', sub: 'Connected', tone: 'green', icon: <RadioTower size={18}/> }, { label: 'Queue Health', value: '97.1%', sub: 'Healthy', tone: 'purple', icon: <ServerCog size={18}/> }, { label: 'Storage Health', value: '98.3%', sub: 'Healthy', tone: 'green', icon: <DatabaseZap size={18}/> }, { label: 'Security Health', value: '99.6%', sub: 'Secure', tone: 'green', icon: <ShieldCheck size={18}/> }, { label: 'Incidents', value: '2', sub: 'Active', tone: 'red', icon: <AlertTriangle size={18}/> },
    ],
    modules: [
      { label: 'Total Modules', value: '18', sub: 'All Modules', tone: 'blue', icon: <Boxes size={18}/> }, { label: 'Active Modules', value: '16', sub: '+88.9%', tone: 'green', icon: <CheckCircle2 size={18}/> }, { label: 'Maintenance', value: '1', sub: '+5.6%', tone: 'yellow', icon: <Settings size={18}/> }, { label: 'Disabled Modules', value: '1', sub: '+5.6%', tone: 'red', icon: <X size={18}/> }, { label: 'Healthy Modules', value: '15', sub: '+83.3%', tone: 'green', icon: <ShieldCheck size={18}/> }, { label: 'Dependencies', value: '32', sub: 'Active links', tone: 'blue', icon: <Network size={18}/> }, { label: 'Failed Modules', value: '0', sub: 'All good', tone: 'green', icon: <ShieldCheck size={18}/> }, { label: 'Module Alerts', value: '3', sub: 'Requires attention', tone: 'red', icon: <AlertTriangle size={18}/> },
    ],
    actions: [
      { label: 'Total Actions', value: '8,742', sub: 'All actions scanned', tone: 'blue', icon: <MousePointerClick size={18}/> }, { label: 'Live Actions', value: '8,127', sub: '93.0%', tone: 'green', icon: <CheckCircle2 size={18}/> }, { label: 'Warning Actions', value: '412', sub: '4.7%', tone: 'yellow', icon: <AlertTriangle size={18}/> }, { label: 'Dead Actions', value: '203', sub: '2.3%', tone: 'red', icon: <X size={18}/> }, { label: 'APIs Monitored', value: '353', sub: '100%', tone: 'green', icon: <Cable size={18}/> }, { label: 'Last Scan', value: '2m ago', sub: 'May 19, 10:22 AM', tone: 'green', icon: <RefreshCw size={18}/> }, { label: 'Coverage', value: '98.6%', sub: 'All areas scanned', tone: 'purple', icon: <ShieldCheck size={18}/> }, { label: 'Score', value: '93', sub: 'Excellent', tone: 'green', icon: <Gauge size={18}/> },
    ],
    apis: [
      { label: 'Total Endpoints', value: '353', sub: 'All API routes', tone: 'blue', icon: <Cable size={18}/> }, { label: 'Active Endpoints', value: '342', sub: '97.0%', tone: 'green', icon: <CheckCircle2 size={18}/> }, { label: 'Health Score', value: '98.6%', sub: 'Excellent', tone: 'green', icon: <ShieldCheck size={18}/> }, { label: 'Avg Response', value: '167ms', sub: '-0.5%', tone: 'blue', icon: <Activity size={18}/> }, { label: 'Error Rate', value: '0.12%', sub: 'Stable', tone: 'yellow', icon: <AlertTriangle size={18}/> }, { label: 'Failed Requests', value: '152', sub: '-8.3%', tone: 'red', icon: <X size={18}/> }, { label: 'Rate Limit Events', value: '23', sub: '-4.2%', tone: 'purple', icon: <Gauge size={18}/> }, { label: 'Slow Endpoints', value: '17', sub: '-15.0%', tone: 'purple', icon: <Activity size={18}/> },
    ],
    options: [
      { label: 'Total Groups', value: '28', sub: 'Active groups', tone: 'blue', icon: <ListChecks size={18}/> }, { label: 'Total Options', value: '1,247', sub: 'Enabled options', tone: 'green', icon: <CheckCircle2 size={18}/> }, { label: 'Global Usage', value: '98.5%', sub: 'Across all modules', tone: 'yellow', icon: <Network size={18}/> }, { label: 'Module Bindings', value: '3,892', sub: 'Active bindings', tone: 'purple', icon: <Boxes size={18}/> }, { label: 'Pending Changes', value: '5', sub: 'Unpublished', tone: 'yellow', icon: <AlertTriangle size={18}/> }, { label: 'Sync Status', value: '100%', sub: 'All modules synced', tone: 'green', icon: <RefreshCw size={18}/> }, { label: 'Last Sync', value: '2m ago', sub: 'Successful', tone: 'green', icon: <ShieldCheck size={18}/> }, { label: 'Added (30d)', value: '47', sub: '+12.5%', tone: 'purple', icon: <Plus size={18}/> },
    ],
  }
  return <div className={styles.metricGrid}>{(byPage[page] || common).map((m) => <MetricCard key={m.label} {...m} />)}</div>
}

function ModuleTable({ compact = false }: { compact?: boolean }) {
  return <table className={styles.table}><thead><tr><th>Module</th><th>Status</th><th>Health</th><th>Visibility</th><th>Access</th><th>Environment</th><th>Version</th><th>Last Check</th><th>Actions</th></tr></thead><tbody>{modules.slice(0, compact ? 8 : undefined).map((m) => <tr key={m.key}><td><b>{m.label}</b><br/><small>{m.description}</small></td><td><Pill value={m.status}/></td><td><span className={m.health > 98 ? styles.up : styles.warn}>{m.health}%</span><Sparkline tone={m.status === 'warning' ? 'yellow' : 'green'} /></td><td>{m.visibility}<br/><small>All Roles</small></td><td><Pill value={m.access}/></td><td><span className={m.environment === 'production' ? styles.up : styles.warn}>{m.environment}</span></td><td>{m.version}</td><td>10:24 AM<br/><span className={styles.up}>Live</span></td><td><button className={styles.button}><Eye size={14}/></button></td></tr>)}</tbody></table>
}

function OptionsTable() {
  return <table className={styles.table}><thead><tr><th>Group Name</th><th>Key</th><th>Description</th><th>Options</th><th>Modules</th><th>Usage (30d)</th><th>Status</th><th>Last Updated</th><th>Actions</th></tr></thead><tbody>{optionGroups.map((g) => <tr key={g.key}><td><b>{g.label}</b></td><td>{g.key}</td><td>{g.description}</td><td>{g.options}</td><td>{g.modules}</td><td>{g.usage30d.toLocaleString()}</td><td><Pill value="active"/></td><td>{g.lastUpdated}</td><td><button className={styles.button}><Settings size={14}/></button></td></tr>)}</tbody></table>
}

function ActionsTable() {
  return <table className={styles.table}><thead><tr><th>Action / Element</th><th>Type</th><th>Module</th><th>Page / Path</th><th>Connected API</th><th>Status</th><th>Response Time</th><th>Last Tested</th><th>Error / Issue</th></tr></thead><tbody>{actions.map((a) => <tr key={a.id}><td><b>{a.label}</b></td><td>{a.type}</td><td>{a.module}</td><td>{a.path}</td><td><Pill value={a.method}/>{' '}{a.connectedApi}</td><td><Pill value={a.status}/></td><td>{a.responseTime ? `${a.responseTime}ms` : '-'}</td><td>{a.lastTested}</td><td className={a.error ? styles.bad : ''}>{a.error || '-'}</td></tr>)}</tbody></table>
}

function IncidentTable() {
  return <table className={styles.table}><thead><tr><th>ID</th><th>Title</th><th>Severity</th><th>Affected Services</th><th>Duration</th><th>Status</th></tr></thead><tbody>{incidents.map((i) => <tr key={i.id}><td>{i.id}</td><td><b>{i.title}</b></td><td><Pill value={i.severity}/></td><td>{i.service}</td><td>{i.duration}</td><td><Pill value={i.status}/></td></tr>)}</tbody></table>
}

function ModulesPage({ onAction }: { onAction: (mode: string) => void }) {
  return <><KpiStrip page="modules"/><div className={styles.grid}><Card title="Module Registry & Exposure Control" subtitle="Control, monitor and manage system modules, visibility, access and availability" span={12} action={<button className={`${styles.button} ${styles.primary}`} onClick={()=>onAction('Sync Modules')}><RefreshCw size={16}/> Sync Modules</button>}><ModuleTable/></Card></div></>
}

function ConfigurationPage({ onAction }: { onAction: (mode: string) => void }) {
  return <><KpiStrip page="configuration"/><div className={styles.grid}><Card title="Configuration Factory" subtitle="Centralized live configuration and global options management" span={8} action={<button className={`${styles.button} ${styles.primary}`} onClick={()=>onAction('Publish All Changes')}><Upload size={16}/> Publish Changes</button>}><OptionsTable/></Card><Card title="Configuration Controls" subtitle="Safe configuration actions" span={4}>{['Save City','Seed factory catalog','Refresh live snapshot','Export Report'].map((item)=><button key={item} className={styles.feedItem} style={{width:'100%', color:'inherit'}} onClick={()=>onAction(item)}><Settings size={16}/><div><b>{item}</b><br/><small>Audited command action</small></div></button>)}</Card></div></>
}

function OptionsPage({ onAction }: { onAction: (mode: string) => void }) {
  return <><KpiStrip page="options"/><div className={styles.grid}><Card title="Live Options Registry" subtitle="Centralized live options management and global distribution control" span={12} action={<button className={`${styles.button} ${styles.primary}`} onClick={()=>onAction('Sync All Modules')}><RefreshCw size={16}/> Sync All Modules</button>}><OptionsTable/></Card></div></>
}

function ActionsPage({ onAction }: { onAction: (mode: string) => void }) {
  return <><KpiStrip page="actions"/><div className={styles.grid}><Card title="Action Liveness Matrix" subtitle="Real-time coverage and liveness status of actions, buttons, modals, APIs and routes" span={12} action={<button className={`${styles.button} ${styles.primary}`} onClick={()=>onAction('Run Full Scan')}><RefreshCw size={16}/> Run Full Scan</button>}><ActionsTable/></Card></div></>
}

function ApiPage({ onAction }: { onAction: (mode: string) => void }) {
  const endpoints = actions.map((action) => ({
    key: `${action.method}-${action.connectedApi}`,
    label: action.connectedApi,
    method: action.method,
    module: action.module,
    status: action.status,
    responseTime: action.responseTime,
    lastTested: action.lastTested,
  }))
  return <><KpiStrip page="apis"/><div className={styles.grid}><Card title="API Command Center" subtitle="Monitor, inspect and test API routes, performance, errors and integrations in real-time" span={12} action={<button className={`${styles.button} ${styles.primary}`} onClick={()=>onAction('API Explorer')}><Cable size={16}/> API Explorer</button>}><table className={styles.table}><thead><tr><th>Endpoint</th><th>Method</th><th>Module</th><th>Status</th><th>Response Time</th><th>Last Tested</th></tr></thead><tbody>{endpoints.map((endpoint)=><tr key={endpoint.key}><td><b>{endpoint.label}</b></td><td><Pill value={endpoint.method}/></td><td>{endpoint.module}</td><td><Pill value={endpoint.status}/></td><td>{endpoint.responseTime ? `${endpoint.responseTime}ms` : '-'}</td><td>{endpoint.lastTested}</td></tr>)}</tbody></table></Card></div></>
}

function OverviewPage({ onAction }: { onAction: (mode: string) => void }) {
  return <>
    <KpiStrip page="overview" />
    <div className={styles.grid}>
      <Card title="Live Activity Stream" subtitle="Real-time system events" span={3}>{actions.slice(0,6).map((a,idx)=><div className={styles.feedItem} key={a.id}><span className={`${styles.dot} ${idx===4?styles.dotWarn:''}`}/><div><b>{a.connectedApi}</b><br/><small>{a.status === 'live' ? '200 OK' : a.error} • {a.responseTime || 120}ms</small></div></div>)}<button className={styles.button} onClick={()=>onAction('View Activity')}>View All Activity</button></Card>
      <Card title="System Health Monitor" subtitle="Live infrastructure health overview" span={4}><div className={styles.radar}><div className={styles.radarCore}><div><b style={{fontSize:34}}>98.7</b><br/>GLOBAL HEALTH</div></div></div>{['Infrastructure','Database (Supabase)','APIs & Services','Realtime Services','Storage & Files','Security Layer','Queues & Workers'].map((x,i)=><div className={styles.feedItem} key={x}><span className={styles.dot}/><div style={{flex:1}}>{x}</div><b className={styles.up}>{[100,99.8,99.6,100,98.9,99.7,100][i]}%</b></div>)}</Card>
      <Card title="Live Incidents" subtitle="Real-time incident feed" span={3} action={<button className={styles.button} onClick={()=>onAction('View incidents')}>View All</button>}>{incidents.slice(0,4).map((i)=><div className={styles.feedItem} key={i.id}><span className={`${styles.dot} ${i.severity==='critical'?styles.dotBad:i.severity==='high'?styles.dotWarn:styles.dotInfo}`}/><div><Pill value={i.severity}/><br/><b>{i.title}</b><br/><small>{i.service} • {i.region}</small></div><small>{i.createdAt}</small></div>)}</Card>
      <Card title="Active Users" subtitle="Live users & sessions" span={2}><div className={styles.metricValue}>248 <span className={styles.up} style={{fontSize:14}}>▲ 12%</span></div><div className={styles.miniChart}><div className={styles.line}/></div><div className={styles.feedItem}><b>Revenue Command</b><span style={{marginLeft:'auto'}}>84 users</span></div><div className={styles.feedItem}><b>Academy OS</b><span style={{marginLeft:'auto'}}>62 users</span></div><div className={styles.feedItem}><b>Connect</b><span style={{marginLeft:'auto'}}>38 users</span></div></Card>
      <Card title="Modules Status Overview" subtitle="Core modules live status" span={5}><ModuleTable compact /></Card>
      <Card title="Performance Monitor" subtitle="Live performance metrics" span={3}><div className={styles.grid}><div className={styles.span6}><b className={styles.info}>167ms</b><div className={styles.miniChart}><div className={styles.line}/></div></div><div className={styles.span6}><b className={styles.up}>42ms</b><div className={styles.miniChart}><div className={styles.line}/></div></div><div className={styles.span6}><b className={styles.purple}>1.23s</b><div className={styles.miniChart}><div className={styles.line}/></div></div><div className={styles.span6}><b className={styles.warn}>0.12%</b><div className={styles.miniChart}><div className={styles.line}/></div></div></div></Card>
      <Card title="AI Operational Advisor" subtitle="Smart recommendations" span={4}>{['Consider clearing 128 old email queue items','Database storage is 98.3% used','Enable auto-scaling for queues','2 modules have new updates available'].map(x=><div className={styles.feedItem} key={x}><span className={styles.dot}/><div>{x}</div></div>)}<button className={`${styles.button} ${styles.primary}`} onClick={()=>onAction('View AI Recommendations')}>View All Recommendations</button></Card>
      <Card title="Quick Actions" subtitle="Execute system commands" span={12}><div className={styles.toolbar}>{['System Scan','Clear Cache','Restart Queues','Sync Supabase','View Logs','Run Diagnostics','Emergency Mode'].map((x,i)=><button key={x} className={`${styles.button} ${i===6?styles.primary:''}`} onClick={()=>onAction(x)}>{i===6?<ShieldAlert size={16}/>:<RefreshCw size={16}/>} {x}</button>)}</div></Card>
    </div>
  </>
}

function formatObsValue(value: string | number | undefined) {
  if (value === undefined || value === null || value === '') return '—'
  return String(value)
}

function ObservableSourceBadge({ source, confidence }: { source?: string; confidence?: string }) {
  const value = confidence || source || 'fallback'
  return <span className={`${styles.pill} ${value === 'live' || source === 'supabase' ? styles.pillGreen : value === 'mixed' ? styles.pillYellow : styles.pillBlue}`}>Source: {source || 'runtime'} • {value}</span>
}

function ObservatoryPage({
  onAction,
  state,
  loading,
  search,
  filter,
  onSearch,
  onFilter,
  onProbe,
}: {
  onAction: (mode: string, payload?: Record<string, unknown>) => void
  state: ObservatoryState
  loading: boolean
  search: string
  filter: string
  onSearch: (value: string) => void
  onFilter: (value: string) => void
  onProbe: (probe: ObservatoryProbe) => void
}) {
  const snapshot = state?.snapshot || {}
  const probes = (state?.probes || []).filter((probe) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || [probe.name, probe.category, probe.status, probe.related, probe.endpoint].some((value) => String(value || '').toLowerCase().includes(term))
    const matchesFilter = filter === 'all' || probe.status === filter || probe.category.toLowerCase().includes(filter)
    return matchesSearch && matchesFilter
  })
  const health = state?.health || []
  const recommendations = state?.recommendations || []
  const emptyMessage = loading ? 'Loading live observatory state…' : 'No observability rows returned. This is an honest empty state, not demo data.'

  return <>
    <div className={styles.metricGrid}>
      <MetricCard label="Total Probes" value={formatObsValue(snapshot.totalProbes)} sub={state?.confidence || 'loading'} icon={<Activity size={18}/>} tone="blue" />
      <MetricCard label="Passing Probes" value={formatObsValue(snapshot.passingProbes)} sub="currently healthy" icon={<CheckCircle2 size={18}/>} />
      <MetricCard label="Warning Probes" value={formatObsValue(snapshot.warningProbes)} sub="review required" icon={<AlertTriangle size={18}/>} tone="yellow" />
      <MetricCard label="Failed Probes" value={formatObsValue(snapshot.failedProbes)} sub="incident candidates" icon={<X size={18}/>} tone="red" />
      <MetricCard label="Queue Backlog" value={formatObsValue(snapshot.queueBacklog)} sub="derived/live queue pressure" icon={<ServerCog size={18}/>} tone="purple" />
      <MetricCard label="Readiness Score" value={formatObsValue(snapshot.deploymentReadinessScore)} sub={String(snapshot.currentStatus || 'pending')} icon={<Gauge size={18}/>} tone={Number(snapshot.deploymentReadinessScore || 0) > 85 ? 'green' : 'yellow'} />
      <MetricCard label="Audit Events" value={formatObsValue(snapshot.auditEvents)} sub="recent proof trail" icon={<ScrollText size={18}/>} tone="blue" />
      <MetricCard label="Active Incidents" value={formatObsValue(snapshot.activeIncidents)} sub="open or investigating" icon={<ShieldAlert size={18}/>} tone={Number(snapshot.activeIncidents || 0) ? 'red' : 'green'} />
    </div>

    <section className={styles.livePanel}>
      <div className={styles.livePanelHeader}>
        <div>
          <ObservableSourceBadge source={state?.source} confidence={state?.confidence}/>
          <h2>Observatory Operational Cockpit</h2>
          <p>Last refreshed: {state?.generatedAt || 'not loaded yet'} • Last scan: {state?.lastScanAt || 'not run yet'} • Critical finding: {formatObsValue(snapshot.criticalFinding)}</p>
        </div>
        <div className={styles.controls}>
          <button className={`${styles.button} ${styles.primary}`} onClick={() => onAction('Run All Probes')}><RefreshCw size={16}/> Run All Probes</button>
          <button className={styles.button} onClick={() => onAction('Run Diagnostics')}><ListChecks size={16}/> Diagnostics</button>
          <button className={styles.button} onClick={() => onAction('Sync Observatory Registry')}><DatabaseZap size={16}/> Sync Registry</button>
          <button className={styles.button} onClick={() => onAction('Export Observatory Snapshot')}><Download size={16}/> Export</button>
        </div>
      </div>
      {state?.warnings?.length ? <div className={styles.emptyLiveState}>Runtime warnings: {state.warnings.join(' • ')}</div> : null}
    </section>

    <div className={styles.grid}>
      <Card title="Health Domains" subtitle="Live/fallback source confidence shown per domain" span={5} action={<button className={styles.button} onClick={() => onAction('Refresh Observatory')}><RefreshCw size={16}/> Refresh</button>}>
        {health.length ? health.map((item, index) => <button key={`${item.key || item.label || 'health'}-${index}`} className={styles.feedItem} style={{width:'100%', textAlign:'left'}} onClick={() => onAction(`Inspect ${item.label}`, { item })}>
          <span className={`${styles.dot} ${item.status === 'failed' ? styles.dotBad : item.status === 'warning' ? styles.dotWarn : ''}`}/>
          <div style={{flex:1}}><b>{item.label}</b><br/><small>{item.detail} • {item.source}</small></div>
          <b className={item.score >= 90 ? styles.up : item.score >= 70 ? styles.warn : styles.bad}>{item.score}%</b>
          <Pill value={item.status}/>
        </button>) : <div className={styles.emptyLiveState}>{emptyMessage}</div>}
      </Card>

      <Card title="Probe Matrix" subtitle="Every row opens a detail drawer; filters are local state, not decorative" span={7} action={<div className={styles.toolbar} style={{marginBottom:0}}><div className={styles.searchBox}><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search probes…"/><Search size={15}/></div><button className={`${styles.button} ${filter === 'all' ? styles.primary : ''}`} onClick={() => onFilter('all')}>All</button><button className={`${styles.button} ${filter === 'failed' ? styles.primary : ''}`} onClick={() => onFilter('failed')}>Failed</button><button className={`${styles.button} ${filter === 'warning' ? styles.primary : ''}`} onClick={() => onFilter('warning')}>Warnings</button></div>}>
        {probes.length ? <div className={styles.liveTableWrap}><table className={styles.table}><thead><tr><th>Probe</th><th>Category</th><th>Status</th><th>Severity</th><th>Related</th><th>Action</th></tr></thead><tbody>{probes.slice(0,10).map((probe, index) => <tr key={`${probe.id || probe.name || 'probe'}-${index}`} onClick={() => onProbe(probe)} style={{cursor:'pointer'}}><td><b>{probe.name}</b><br/><small>{probe.endpoint || probe.id}</small></td><td>{probe.category}</td><td><Pill value={probe.status}/></td><td><Pill value={probe.severity}/></td><td>{probe.related}</td><td><button className={styles.button} onClick={(event) => { event.stopPropagation(); onProbe(probe) }}><Eye size={14}/> Detail</button></td></tr>)}</tbody></table></div> : <div className={styles.emptyLiveState}>{emptyMessage}</div>}
      </Card>

      <Card title="Queue Observability" subtitle="Safe queue controls only; purge is gated and audited" span={4}>
        {(state?.queues || []).length ? state!.queues.map((queue, index) => <div className={styles.feedItem} key={`${queue.key || queue.label || 'queue'}-${index}`}><span className={`${styles.dot} ${queue.status === 'warning' ? styles.dotWarn : queue.status === 'failed' ? styles.dotBad : ''}`}/><div style={{flex:1}}><b>{queue.label}</b><br/><small>Backlog {queue.backlog} • failed {queue.failed}</small></div><button className={styles.button} onClick={() => onAction('View Queue Summary', { queue })}>View</button><button className={styles.button} onClick={() => onAction('Retry Failed Jobs', { queue })}>Retry</button></div>) : <div className={styles.emptyLiveState}>{emptyMessage}</div>}
        <button className={`${styles.button} ${styles.danger}`} onClick={() => onAction('Purge Queue')}><Trash2 size={16}/> Purge Queue</button>
      </Card>

      <Card title="Incident Observatory" subtitle="Create incident from real failed probe/diagnostic context" span={4} action={<button className={styles.button} onClick={() => onAction('Create Incident From Observatory')}><Plus size={16}/> New From Probe</button>}>
        {(state?.incidents || []).length ? state!.incidents.slice(0,5).map((incident, index) => <button key={`${incident.id || incident.title || 'incident'}-${index}`} className={styles.feedItem} style={{width:'100%', textAlign:'left'}} onClick={() => onAction('Open Incident Summary', { incident })}><span className={`${styles.dot} ${incident.severity === 'critical' ? styles.dotBad : styles.dotWarn}`}/><div style={{flex:1}}><Pill value={incident.severity}/><br/><b>{incident.title}</b><br/><small>{incident.status} • {incident.related || 'unlinked'}</small></div></button>) : <div className={styles.emptyLiveState}>No open incident rows returned by live/fallback state.</div>}
      </Card>

      <Card title="Audit Timeline" subtitle="Recent command proof trail" span={4} action={<button className={styles.button} onClick={() => onAction('Export Audit Logs')}><Download size={16}/> Export</button>}>
        {(state?.audit || []).length ? state!.audit.slice(0,6).map((event, index) => <button key={`${event.id || event.title || 'audit'}-${index}`} className={styles.feedItem} style={{width:'100%', textAlign:'left'}} onClick={() => onAction('Open Audit Event', { event })}><span className={`${styles.dot} ${event.severity === 'warning' ? styles.dotWarn : ''}`}/><div><b>{event.title}</b><br/><small>{event.event_type || 'audit'} • {event.created_at || 'recent'}</small></div></button>) : <div className={styles.emptyLiveState}>No audit rows returned. Run a command to generate proof trail.</div>}
      </Card>

      <Card title="State-Generated Recommendations" subtitle="Created from failed probes, warnings, queue pressure, incidents and audit state" span={8}>
        {recommendations.length ? recommendations.map((rec, index) => <div className={styles.feedItem} key={`${rec.id || rec.title || 'recommendation'}-${index}`}><span className={`${styles.dot} ${rec.severity === 'critical' || rec.severity === 'high' ? styles.dotBad : rec.severity === 'medium' ? styles.dotWarn : styles.dotInfo}`}/><div style={{flex:1}}><Pill value={rec.severity}/><br/><b>{rec.title}</b><br/><small>{rec.reason}</small><p>{rec.action}</p></div><button className={styles.button} onClick={() => onAction('Open Recommendation', { rec })}>Review</button></div>) : <div className={styles.emptyLiveState}>No recommendations generated from the current state.</div>}
      </Card>

      <Card title="Environment & Safety Controls" subtitle="Unsafe operations explain impact and audit attempted use" span={4}>
        <div className={styles.feedItem}><span className={styles.dot}/><div><b>Current status</b><br/><small>{String(snapshot.currentStatus || 'pending')}</small></div></div>
        {(state?.disabledActions || []).map((item, index) => <div className={styles.feedItem} key={`${item.action || 'disabled-action'}-${index}`}><span className={styles.dotWarn}/><div style={{flex:1}}><b>{item.action}</b><br/><small>{item.reason}</small></div><button className={styles.button} onClick={() => onAction(item.action)} disabled>Disabled</button></div>)}
        <button className={styles.button} onClick={() => onAction('Open Observatory Settings')}><Settings size={16}/> Settings</button>
        <button className={`${styles.button} ${styles.danger}`} onClick={() => onAction('Emergency Freeze')}><ShieldAlert size={16}/> Emergency Freeze</button>
      </Card>
    </div>
  </>
}

function SupabasePage({ onAction }: { onAction: (mode: string) => void }) {
  const tables = ['leads','prospects','activities','users','profiles','contracts','invoices','payments']
  return <><KpiStrip page="observatory"/><div className={styles.grid}><Card title="Database Overview" subtitle="Real-time overview of your Supabase project" span={4}><div className={styles.feedItem}><b>Project Status</b><span style={{marginLeft:'auto'}}><Pill value="healthy"/></span></div><div className={styles.feedItem}><b>Project Ref</b><span style={{marginLeft:'auto'}}>angelcare-prod</span></div>{['CPU Usage 18%','Memory Usage 42%','Disk Usage 68%','Bandwidth 256 GB'].map(x=><div className={styles.feedItem} key={x}><span className={styles.dot}/>{x}</div>)}</Card><Card title="Tables Overview" subtitle="142 active tables in your database" span={5}><table className={styles.table}><thead><tr><th>Table</th><th>Schema</th><th>Rows</th><th>Size</th><th>RLS</th><th>Status</th></tr></thead><tbody>{tables.map((t,i)=><tr key={t}><td>{t}</td><td>public</td><td>{[2.4,1.8,5.6,48.7,48.7,312,892,1.2][i]}{i<3?'M':'K'}</td><td>{[512,356,1200,96,128,248,312,280][i]} MB</td><td><span className={styles.up}>Enabled</span></td><td><Pill value="healthy"/></td></tr>)}</tbody></table></Card><Card title="Realtime Status" span={3}><div className={styles.donut}><div className={styles.donutInner}><b>28</b><br/>Active Channels</div></div>{['Public Channels 16','Private Channels 8','Presence Channels 3','Broadcast Channels 1'].map(x=><div className={styles.feedItem} key={x}><span className={styles.dot}/>{x}</div>)}</Card><Card title="RLS Policies Overview" span={3}><div className={styles.donut}><div className={styles.donutInner}><b>287</b><br/>Total Policies</div></div></Card><Card title="Storage Overview" span={3}>{['documents 32.4 GB','avatars 18.7 GB','contracts 12.1 GB','invoices 9.3 GB','academy 7.8 GB','temp 4.9 GB'].map(x=><div className={styles.feedItem} key={x}><span className={styles.dot}/>{x}</div>)}</Card><Card title="Database Performance" span={3}>{['Avg Query Time 67ms','Slow Queries 23','Max Query Time 1.42s'].map(x=><div className={styles.feedItem} key={x}><span className={styles.dotWarn}/>{x}</div>)}<div className={styles.miniChart}><div className={styles.line}/></div></Card><Card title="Backup & Recovery" span={3}>{['Last Backup 2h ago','Next Backup in 2h 35m','Backup Status 100%'].map(x=><div className={styles.feedItem} key={x}><span className={styles.dot}/>{x}</div>)}<button className={styles.button}>View Backup History</button></Card></div></>
}

function RealtimePage({ onAction }: { onAction: (mode: string) => void }) {
  return <><KpiStrip page="realtime"/><div className={styles.grid}><Card title="Live Notifications" span={4}>{['Payment Service API is down','High error rate detected','Database connection pool exhausted','New user signup spike detected','Slow query detected','Backup completed successfully','Feature flag updated'].map((x,i)=><div className={styles.feedItem} key={x}><span className={`${styles.dot} ${i<2?styles.dotBad:i<4?styles.dotWarn:styles.dotInfo}`}/><div><Pill value={i<2?'critical':i<4?'warning':'info'}/><br/><b>{x}</b></div></div>)}<button className={styles.button}>View All Notifications</button></Card><Card title="Alert Feed (Realtime)" span={4}>{incidents.map(i=><div className={styles.feedItem} key={i.id}><span className={`${styles.dot} ${i.severity==='critical'?styles.dotBad:styles.dotWarn}`}/><div><Pill value={i.severity}/><br/><b>{i.title}</b><br/><small>Service: {i.service}</small></div></div>)}</Card><Card title="System Health Overview" span={4}><div className={styles.donut}><div className={styles.donutInner}><b>98.2%</b><br/>Overall Health</div></div>{['API Services 99.1%','Database 97.5%','Infrastructure 98.8%','External Services 96.3%','Background Jobs 99.7%'].map(x=><div className={styles.feedItem} key={x}><span className={styles.dot}/>{x}</div>)}</Card><Card title="Notification Channels Status" span={12}><div className={styles.toolbar}>{['Email Healthy','Slack Connected','SMS Warning','Webhook Connected','In-App Active','PagerDuty Connected','Teams Connected','Discord Connected','Add Channel'].map((x,i)=><button key={x} className={`${styles.button} ${i===8?styles.primary:''}`} onClick={()=>onAction(x)}>{i===8?<Plus size={16}/>:<Bell size={16}/>} {x}</button>)}</div></Card></div></>
}

function IncidentsPage({ onAction }: { onAction: (mode: string) => void }) {
  return <><KpiStrip page="incidents"/><div className={styles.grid}><Card title="Global Incident Map" span={5}><div className={styles.map}/><div className={styles.toolbar}><Pill value="US-East 7 critical"/><Pill value="US-West 3 high"/><Pill value="Europe 4 high"/><Pill value="Asia Pacific 3 medium"/><Pill value="Africa 2 low"/></div></Card><Card title="Active Incidents" span={4}><IncidentTable/></Card><Card title="Incident Summary (24h)" span={3}><div className={styles.donut}><div className={styles.donutInner}><b>23</b><br/>Total</div></div><div className={styles.miniChart}><div className={styles.line}/></div></Card><Card title="Recent Activity" span={3}>{['Incident created','Escalated L3 Support','War Room session started','Database team joined','Mitigation started'].map(x=><div className={styles.feedItem} key={x}><span className={styles.dot}/>{x}</div>)}</Card><Card title="MTTR Over Time" span={3}><div className={styles.miniChart} style={{height:180}}><div className={styles.line}/></div></Card><Card title="Top Affected Services" span={3}>{['API Gateway 8','Database 7','Payment Service 5','Storage 4','Email Service 3'].map(x=><div className={styles.feedItem} key={x}><span className={styles.dotBad}/>{x}</div>)}</Card><Card title="Communications" span={3}>{['Room created for INC-2025-007','@database-team Please check connection pool','Investigation in progress'].map(x=><div className={styles.feedItem} key={x}><span className={styles.dotWarn}/>{x}</div>)}<input className={styles.input} placeholder="Type message..." style={{width:'100%'}}/></Card></div></>
}

function PermissionsPage({ onAction }: { onAction: (mode: string) => void }) {
  const roles = ['Super Admin','SOC Manager','Threat Analyst','Incident Responder','Threat Hunter','IT Administrator','Compliance Officer','Read Only']
  const blocks = ['Dashboards','Incidents','Threat Intelligence','Automation','Settings']
  const perms = ['View','Create','Edit','Delete','Export','Assign']
  return <><div className={styles.metricGrid}><MetricCard label="Roles" value="8" sub="Configured" icon={<Users size={18}/>} /><MetricCard label="Users" value="36" sub="Assigned" icon={<Users size={18}/>} tone="blue"/><MetricCard label="Permissions" value="152" sub="Active grants" icon={<ShieldCheck size={18}/>} /><MetricCard label="Overrides" value="12" sub="Temporary" icon={<Settings size={18}/>} tone="yellow"/></div><div className={styles.card}><div className={styles.cardPad}><div className={styles.toolbar}><button className={`${styles.button} ${styles.primary}`}>Roles</button><button className={styles.button}>Users</button><button className={styles.button}>User Groups</button><div className={styles.searchBox}><input placeholder="Search roles..."/><Search size={15}/></div><button className={styles.button}>All Modules</button><button className={styles.button}>All Permissions</button><button className={`${styles.button} ${styles.primary}`} onClick={()=>onAction('Add Permission')}><Plus size={16}/> Add Permission</button></div><div className={styles.matrix}><table className={styles.table}><thead><tr><th>Role</th>{blocks.map(b=><th key={b} colSpan={perms.length}>{b}</th>)}</tr><tr><th></th>{blocks.flatMap(b=>perms.map(p=><th key={b+p}>{p}</th>))}</tr></thead><tbody>{roles.map((role,ri)=><tr key={role}><td><b>{role}</b><br/><small>{ri===0?'Full platform access':`${12-ri} users`}</small></td>{blocks.flatMap((b,bi)=>perms.map((p,pi)=>{const status=ri===0?'full':(ri+bi+pi)%5===0?'none':(ri+bi+pi)%3===0?'edit':'view';return <td key={b+p}><span className={styles.permIcon}>{status==='full'?<Check size={16} className={styles.up}/>:status==='edit'?<Settings size={16} className={styles.info}/>:status==='none'?<X size={16} className={styles.bad}/>:<Eye size={16}/>}</span></td>}))}</tr>)}</tbody></table></div></div></div></>
}

function FeatureFlagsPage({ onAction }: { onAction: (mode: string) => void }) {
  return <><div className={styles.metricGrid}><MetricCard label="Total Flags" value="128" sub="↑ 8 vs last week" icon={<Flag size={18}/>} tone="purple"/><MetricCard label="Active Flags" value="78" sub="61% of total" icon={<CheckCircle2 size={18}/>} /><MetricCard label="Enabled Flags" value="45" sub="↑ 5 last week" icon={<Check size={18}/>} tone="blue"/><MetricCard label="Disabled Flags" value="33" sub="↓ 3 last week" icon={<X size={18}/>} tone="yellow"/><MetricCard label="Scheduled Changes" value="7" sub="Next: in 15m" icon={<Activity size={18}/>} tone="purple"/></div><Card title="Feature Flags" span={12}><div className={styles.toolbar}><div className={styles.searchBox}><input placeholder="Search flags..."/><Search size={15}/></div><button className={styles.button}>All Status</button><button className={styles.button}>All Categories</button><button className={styles.button}>All Owners</button><label className={styles.selectBox}><input type="checkbox"/> Show Archived</label><button className={styles.button}>Bulk Actions</button><button className={`${styles.button} ${styles.primary}`} onClick={()=>onAction('Create Flag')}><Plus size={16}/> Create Flag</button></div><table className={styles.table}><thead><tr><th>Flag Name</th><th>Status</th><th>Type</th><th>Environments</th><th>Targeting / Segment</th><th>Owner</th><th>Usage / Impact</th><th>Risk</th></tr></thead><tbody>{featureFlags.map(f=><tr key={f.key}><td><b>{f.key}</b><br/><small>{f.description}</small></td><td><Pill value={f.enabled?'enabled':'disabled'}/></td><td>{f.type}</td><td>{f.environments.map(e=><span key={e} className={`${styles.pill} ${styles.pillBlue}`} style={{marginRight:4}}>{e}</span>)}</td><td>{f.target}</td><td>{f.owner}</td><td><div className={styles.progress}><div className={styles.bar} style={{width:`${f.impact}%`}}/></div>{f.impact}%</td><td><Pill value={f.risk}/></td></tr>)}</tbody></table></Card></>
}

function RulesPage({ onAction }: { onAction: (mode: string) => void }) {
  return <><div className={styles.grid}><Card title="Define Rule" span={9}><div className={styles.modalGrid}><input className={styles.input} defaultValue="Suspicious API Failure Burst"/><input className={styles.input} defaultValue="Detects repeated API failures and creates an incident automatically."/></div><div className={styles.toolbar} style={{marginTop:14}}>{['Correlation Rule','Threshold Rule','Anomaly Rule','Behavioral Rule'].map((x,i)=><button key={x} className={`${styles.button} ${i===0?styles.primary:''}`}>{x}</button>)}<button className={styles.button}>Severity: High</button><label className={styles.selectBox}><input type="checkbox" defaultChecked/> Enabled</label></div><div className={styles.ruleBox}><h3>Conditions</h3>{['Event Source is any of API Gateway, Supabase','Event Category is any of Error, Timeout','Endpoint matches any /api/*','Error Rate is greater than 1%','Initiating User not in Privileged Users'].map((x,i)=><div className={styles.conditionRow} key={x}><select className={styles.input}><option>{x.split(' ')[0]} {x.split(' ')[1]}</option></select><select className={styles.input}><option>{x.includes('greater')?'greater than':'is any of'}</option></select><input className={styles.input} defaultValue={x}/><button className={styles.button}><Trash2 size={14}/></button></div>)}<button className={styles.button}><Plus size={16}/> Add Condition</button><button className={styles.button}><Plus size={16}/> Add Group</button></div><div className={styles.ruleBox}><h3>Exceptions</h3><p>Define conditions that exclude events from triggering this rule.</p><button className={styles.button}><Plus size={16}/> Add Exception</button></div><div className={styles.footerActions}><button className={styles.button}>Save Draft</button><button className={`${styles.button} ${styles.primary}`} onClick={()=>onAction('Validate Rule')}>Next: Test & Validate</button></div></Card><Card title="Rule Summary" span={3}><div className={styles.feedItem}><b>Rule Type</b><span style={{marginLeft:'auto'}}>Correlation Rule</span></div><div className={styles.feedItem}><b>Severity</b><span style={{marginLeft:'auto'}}><Pill value="high"/></span></div><div className={styles.feedItem}><b>Status</b><span style={{marginLeft:'auto'}}><Pill value="enabled"/></span></div><Card title="Estimate Impact" span={12}><div>Events (24h) ~ 2,450</div><div>Unique Hosts ~ 156</div><div>Alert Volume <span className={styles.warn}>Medium</span></div></Card><button className={`${styles.button} ${styles.primary}`} style={{width:'100%'}} onClick={()=>onAction('Run Test')}>Run Test</button></Card></div></>
}

function DataSourcesPage({ onAction }: { onAction: (mode: string) => void }) {
  return <><div className={styles.metricGrid}><MetricCard label="Total Data Sources" value="128" sub="↑ 6 vs last week" icon={<Database size={18}/>} tone="blue"/><MetricCard label="Healthy Sources" value="112" sub="87.5% of total" icon={<CheckCircle2 size={18}/>} /><MetricCard label="Degraded Sources" value="10" sub="7.8% of total" icon={<AlertTriangle size={18}/>} tone="yellow"/><MetricCard label="Unhealthy Sources" value="6" sub="4.7% of total" icon={<X size={18}/>} tone="red"/><MetricCard label="New This Week" value="5" sub="↑ 5 vs last week" icon={<Plus size={18}/>} tone="purple"/></div><div className={styles.splitPanel}><div className={styles.card}><div className={styles.cardPad}><div className={styles.toolbar}><div className={styles.searchBox}><input placeholder="Search data sources..."/><Search size={15}/></div><button className={styles.button}>All Types</button><button className={styles.button}>All Categories</button><button className={styles.button}>All Owners</button><button className={styles.button}>All Status</button><button className={`${styles.button} ${styles.primary}`} onClick={()=>onAction('Add Data Source')}><Plus size={16}/> Add Data Source</button></div><table className={styles.table}><thead><tr><th>Data Source</th><th>Type</th><th>Category</th><th>Status</th><th>Ingestion Health</th><th>Last Ingested</th><th>Owner</th><th>Usage</th></tr></thead><tbody>{dataSources.map(d=><tr key={d.key}><td><b>{d.label}</b></td><td>{d.type}</td><td>{d.category}</td><td><Pill value={d.status}/></td><td><div className={styles.progress}><div className={d.ingestionHealth<50?styles.barBad:d.ingestionHealth<80?styles.barWarn:styles.bar} style={{width:`${d.ingestionHealth}%`}}/></div>{d.ingestionHealth}%</td><td>{d.lastIngested}</td><td>{d.owner}</td><td><Pill value={d.usage}/></td></tr>)}</tbody></table></div></div><aside className={styles.drawer}><h3>Source Health Overview</h3><div className={styles.donut}><div className={styles.donutInner}><b>128</b><br/>Total</div></div><h3>Ingestion Volume</h3><div className={styles.miniChart} style={{height:160}}><div className={styles.line}/></div><h3>Data Source Details</h3><p><b>Supabase Core Tables</b></p><p>Central live source of truth used across ERP modules, realtime channels, auth, and production APIs.</p><button className={styles.button}>View in Catalog</button></aside></div></>
}

function QueuesPage({ onAction }: { onAction: (mode: string) => void }) {
  return <><div className={styles.metricGrid}><MetricCard label="Total Queues" value="18" sub="↑ 2 yesterday" icon={<ServerCog size={18}/>} tone="purple"/><MetricCard label="Total Messages" value="245,892" sub="↑ 12.5%" icon={<Bell size={18}/>} tone="blue"/><MetricCard label="Processing" value="231,342" sub="94.1% total" icon={<Activity size={18}/>} /><MetricCard label="Backlog" value="14,550" sub="↓ 8.3%" icon={<Gauge size={18}/>} tone="yellow"/><MetricCard label="Failed" value="128" sub="↓ 3.1%" icon={<X size={18}/>} tone="red"/><MetricCard label="Avg Processing" value="932 ms" sub="↓ 15.2%" icon={<Activity size={18}/>} tone="blue"/></div><div className={styles.splitPanel}><div className={styles.card}><div className={styles.cardPad}><div className={styles.toolbar}><button className={`${styles.button} ${styles.primary}`}>Queues</button><button className={styles.button}>Dead Letter Queues</button><div className={styles.searchBox}><input placeholder="Search queues..."/><Search size={15}/></div><button className={styles.button}>All Status</button><button className={styles.button}>All Types</button></div><table className={styles.table}><thead><tr><th>Queue Name</th><th>Type</th><th>Status</th><th>Messages</th><th>Backlog</th><th>In-Flight</th><th>Failed</th><th>Avg. Proc. Time</th></tr></thead><tbody>{queues.map(q=><tr key={q.key}><td><b>{q.label}</b><br/><small>Process incoming events</small></td><td>{q.type}</td><td><Pill value={q.status}/></td><td>{q.messages.toLocaleString()}</td><td>{q.backlog.toLocaleString()}</td><td>{q.inFlight.toLocaleString()}</td><td className={q.failed?styles.bad:styles.up}>{q.failed}</td><td className={q.avgMs>1000?styles.bad:styles.up}>{q.avgMs} ms</td></tr>)}</tbody></table></div></div><aside className={styles.drawer}><h3>alerts-processing-queue <Pill value="healthy"/></h3><div className={styles.toolbar}><button className={styles.button}>Overview</button><button className={styles.button}>Messages</button><button className={styles.button}>Consumers</button><button className={styles.button}>Settings</button></div><p>Process incoming security alerts from all sources.</p><div className={styles.miniChart} style={{height:180}}><div className={styles.line}/></div><h3>Actions</h3><button className={styles.button} onClick={()=>onAction('Pause Queue')}>Pause Queue</button><button className={styles.button} onClick={()=>onAction('Purge Queue')}>Purge Queue</button><button className={styles.button} onClick={()=>onAction('Retry Failed')}>Retry Failed</button></aside></div></>
}

function TenantsPage({ onAction }: { onAction: (mode: string) => void }) {
  return <><div className={styles.metricGrid}><MetricCard label="Total Tenants" value="48" sub="↑ 4 last month" icon={<Building2 size={18}/>} tone="purple"/><MetricCard label="Active Tenants" value="42" sub="87.5% of total" icon={<CheckCircle2 size={18}/>} tone="blue"/><MetricCard label="Suspended Tenants" value="3" sub="6.3% of total" icon={<AlertTriangle size={18}/>} tone="yellow"/><MetricCard label="Inactive Tenants" value="3" sub="6.3% of total" icon={<X size={18}/>} tone="red"/><MetricCard label="Total Ingestion" value="2.34 TB" sub="↑ 15.3% yesterday" icon={<Activity size={18}/>} /></div><div className={styles.splitPanel}><div className={styles.card}><div className={styles.cardPad}><div className={styles.toolbar}><div className={styles.searchBox}><input placeholder="Search tenants..."/><Search size={15}/></div><button className={styles.button}>All Status</button><button className={styles.button}>All Plans</button><button className={styles.button}>All Regions</button><button className={styles.button}>Export</button></div><table className={styles.table}><thead><tr><th>Tenant Name</th><th>Status</th><th>Plan</th><th>Region</th><th>Users</th><th>Data Ingestion</th><th>Created On</th></tr></thead><tbody>{tenants.map(t=><tr key={t.key}><td><b>{t.name}</b><br/><small>{t.domain}</small></td><td><Pill value={t.status}/></td><td>{t.plan}</td><td>{t.region}</td><td>{t.users}</td><td>{t.ingestionGb} GB <Sparkline tone={t.status==='suspended'?'yellow':'green'}/></td><td>{t.createdOn}</td></tr>)}</tbody></table></div></div><aside className={styles.drawer}><h2>Angelcare Technologies <Pill value="active"/></h2><div className={styles.toolbar}>{['Overview','Settings','Usage','Users','Integrations','Audit Logs'].map((x,i)=><button className={`${styles.button} ${i===0?styles.primary:''}`} key={x}>{x}</button>)}</div><p><b>Domain:</b> angelcare.com</p><p><b>Plan:</b> Enterprise</p><p><b>Region:</b> US-East (N. Virginia)</p><p><b>Data ingestion:</b> 450.23 GB</p><p><b>Active users:</b> 156</p><div className={styles.progress}><div className={styles.bar} style={{width:'80%'}}/></div><div className={styles.footerActions}><button className={styles.button}>Suspend Tenant</button><button className={`${styles.button} ${styles.danger}`}>Delete Tenant</button></div></aside></div></>
}

function DeploymentPage({ onAction }: { onAction: (mode: string) => void }) {
  const checks = ['Security Configuration','Data Protection','Integrations','Detection & Response','Infrastructure & Health','Compliance & Audit','Performance']
  return <><div className={styles.metricGrid}><MetricCard label="Overall Readiness" value="92" sub="Ready" icon={<Rocket size={18}/>} /><MetricCard label="Readiness Status" value="Ready" sub="All critical passed" icon={<CheckCircle2 size={18}/>} /><MetricCard label="Checks" value="128" sub="124 passed / 3 warning / 1 failed" icon={<ListChecks size={18}/>} tone="yellow"/><MetricCard label="Critical Issues" value="1" sub="Must fix before deployment" icon={<AlertTriangle size={18}/>} tone="red"/><MetricCard label="Warnings" value="3" sub="Should review" icon={<AlertTriangle size={18}/>} tone="yellow"/><MetricCard label="Last Run" value="May 19" sub="Duration: 2m 34s" icon={<Activity size={18}/>} tone="blue"/></div><div className={styles.grid}><Card title="Readiness Overview" span={8}><div className={styles.toolbar}><button className={styles.button}>All Categories</button><label className={styles.selectBox}><input type="checkbox"/> Show only issues</label><div className={styles.searchBox}><input placeholder="Search checks..."/><Search size={15}/></div></div><table className={styles.table}><thead><tr><th>Category</th><th>Status</th><th>Checks</th><th>Passed</th><th>Warning</th><th>Failed</th><th>Readiness Impact</th></tr></thead><tbody>{checks.map((c,i)=><tr key={c}><td><b>{c}</b><br/><small>Production validation area</small></td><td><Pill value={i===6?'failed':i===4?'warning':'passed'}/></td><td>{[24,18,16,20,22,12,16][i]}</td><td>{[24,17,15,19,19,12,14][i]}</td><td className={i===4?styles.warn:''}>{i===4?3:i===1||i===2||i===3?1:0}</td><td className={i===6?styles.bad:''}>{i===6?1:0}</td><td><Pill value={i===6?'high':i===1||i===4?'medium':'high'}/></td></tr>)}</tbody></table></Card><Card title="Readiness Score Trend" span={4}><div className={styles.miniChart} style={{height:190}}><div className={styles.line}/></div><h3>Top Issues to Resolve</h3>{['High CPU usage on indexers','Password policy not configured','Cold storage retention not set'].map((x,i)=><div className={styles.feedItem} key={x}><Pill value={i===0?'critical':'warning'}/>{x}</div>)}</Card><Card title="Deployment Checklist" span={12}>{['Pre-deployment Checks Completed','Security Validation Completed','Performance Validation In Progress','Stakeholder Review Pending','Deployment Approval Pending'].map((x,i)=><span key={x} className={`${styles.pill} ${i<2?styles.pillGreen:i===2?styles.pillYellow:styles.pillBlue}`} style={{margin:8,padding:14}}>{i<2?<Check size={16}/>:i===2?<Activity size={16}/>:<Upload size={16}/>} {x}</span>)}<button className={styles.button} style={{float:'right'}} disabled>Approve Deployment</button></Card></div></>
}

function AuditPage({ onAction }: { onAction: (mode: string) => void }) {
  return <><div className={styles.metricGrid}><MetricCard label="Total Events" value="24,582" sub="↑ 18.6% vs yesterday" icon={<ScrollText size={18}/>} tone="purple"/><MetricCard label="Critical Events" value="152" sub="↑ 8.3%" icon={<AlertTriangle size={18}/>} tone="red"/><MetricCard label="Users" value="36" sub="↑ 5 yesterday" icon={<Users size={18}/>} tone="blue"/><MetricCard label="Resources" value="128" sub="↑ 11 yesterday" icon={<Database size={18}/>} /><MetricCard label="Event Types" value="28" sub="" icon={<ListChecks size={18}/>} tone="blue"/><MetricCard label="Retention" value="365 days" sub="" icon={<Activity size={18}/>} tone="blue"/></div><div className={styles.splitPanel}><div className={styles.card}><div className={styles.cardPad}><div className={styles.toolbar}><div className={styles.searchBox}><input placeholder="Search events..."/><Search size={15}/></div>{['All Event Types','All Users','All Resources','All Severity','May 18 → May 19'].map(x=><button className={styles.button} key={x}>{x}</button>)}</div><table className={styles.table}><thead><tr><th>Time</th><th>Event</th><th>User</th><th>Resource</th><th>Event Type</th><th>Severity</th><th>IP Address</th><th>Details</th></tr></thead><tbody>{auditEvents.map(e=><tr key={e.id}><td>{e.time}</td><td><b>{e.event}</b></td><td>{e.user}</td><td>{e.resource}</td><td>{e.type}</td><td><Pill value={e.severity}/></td><td>{e.ip}</td><td>›</td></tr>)}</tbody></table></div></div><aside className={styles.drawer}><h3>Event Details</h3><Pill value="medium"/><p><b>User role updated</b></p><p>Role updated for user John Smith.</p><p><b>Previous role:</b> SOC Analyst</p><p><b>New role:</b> SOC Lead</p><p><b>Result:</b> Success</p><h3>Timeline Context</h3><div className={styles.feedItem}><span className={styles.dot}/><b>10:22 AM</b> Policy updated</div><div className={styles.feedItem}><span className={styles.dotWarn}/><b>10:24 AM</b> User role updated</div><div className={styles.feedItem}><span className={styles.dotInfo}/><b>10:26 AM</b> Permission changed</div></aside></div></>
}

function GenericPage({ page, onAction, observatoryState, observatoryLoading, observatorySearch, observatoryFilter, onObservatorySearch, onObservatoryFilter, onProbe }: { page: PageKey; onAction: (mode: string, payload?: Record<string, unknown>) => void; observatoryState?: ObservatoryState; observatoryLoading?: boolean; observatorySearch?: string; observatoryFilter?: string; onObservatorySearch?: (value: string) => void; onObservatoryFilter?: (value: string) => void; onProbe?: (probe: ObservatoryProbe) => void }) {
  if (page === 'overview') return <OverviewPage onAction={onAction}/>
  if (page === 'observatory') return <ObservatoryPage onAction={onAction} state={observatoryState || null} loading={Boolean(observatoryLoading)} search={observatorySearch || ''} filter={observatoryFilter || 'all'} onSearch={onObservatorySearch || (()=>{})} onFilter={onObservatoryFilter || (()=>{})} onProbe={onProbe || (()=>{})}/>
  if (page === 'modules') return <ModulesPage onAction={onAction}/>
  if (page === 'configuration') return <ConfigurationPage onAction={onAction}/>
  if (page === 'options') return <OptionsPage onAction={onAction}/>
  if (page === 'actions') return <ActionsPage onAction={onAction}/>
  if (page === 'apis') return <ApiPage onAction={onAction}/>
  if (page === 'supabase') return <SupabasePage onAction={onAction}/>
  if (page === 'realtime') return <RealtimePage onAction={onAction}/>
  if (page === 'incidents') return <IncidentsPage onAction={onAction}/>
  if (page === 'permissions') return <PermissionsPage onAction={onAction}/>
  if (page === 'feature-flags') return <FeatureFlagsPage onAction={onAction}/>
  if (page === 'rules') return <RulesPage onAction={onAction}/>
  if (page === 'data-sources') return <DataSourcesPage onAction={onAction}/>
  if (page === 'queues') return <QueuesPage onAction={onAction}/>
  if (page === 'tenants') return <TenantsPage onAction={onAction}/>
  if (page === 'deployment') return <DeploymentPage onAction={onAction}/>
  return <AuditPage onAction={onAction}/>
}

type LivePanelMetric = { label: string; value: string | number; tone?: string }
type LivePanelAction = { label: string; command: string; tone?: string; payload?: Record<string, unknown> }
type LivePanelRow = Record<string, unknown>
type LivePanelState = {
  ok?: boolean
  page?: string
  title?: string
  status?: string
  metrics?: LivePanelMetric[]
  actions?: LivePanelAction[]
  rows?: LivePanelRow[]
  summary?: Record<string, unknown>
  generated_at?: string
  source?: string
  dryRun?: boolean
}

function renderLiveValue(value: unknown) {
  if (value === null || value === undefined || value === '') return <span style={{color:'#64748b'}}>—</span>
  if (typeof value === 'boolean') return <Pill value={value ? 'yes' : 'no'} />
  if (typeof value === 'object') return <code style={{color:'#93c5fd'}}>{JSON.stringify(value).slice(0, 80)}</code>
  const raw = String(value)
  if (['healthy','active','live','success','passed','ready','enabled','operational'].includes(raw.toLowerCase())) return <Pill value={raw}/>
  if (['warning','queued','pending','partial','draft'].includes(raw.toLowerCase())) return <Pill value={raw}/>
  if (['critical','failed','dead','disabled','error'].includes(raw.toLowerCase())) return <Pill value={raw}/>
  return raw.length > 100 ? `${raw.slice(0, 100)}…` : raw
}

function LiveExecutionPanel({ page, data, loading, error, onAction, onRefresh }: { page: PageKey; data: LivePanelState | null; loading: boolean; error: string; onAction: (mode: string, payload?: Record<string, unknown>) => void; onRefresh: () => void }) {
  const rows = data?.rows || []
  const headers = rows[0] ? Object.keys(rows[0]).filter((key) => !['metadata_json','before_json','after_json','payload_json','result_json'].includes(key)).slice(0, 7) : []
  const metrics = data?.metrics || []
  const actionsList = data?.actions || []
  return <section className={styles.livePanel}>
    <div className={styles.livePanelHeader}>
      <div>
        <div className={styles.navLabel} style={{margin:0}}>Deep Execution Layer</div>
        <h2>{data?.title || pageTitles[page]?.title || 'SaaS Factory Command'}</h2>
        <p>{loading ? 'Loading live command data…' : error ? error : `Source: ${data?.source || 'factory panel API'} • ${data?.generated_at || 'live'}`}</p>
      </div>
      <div className={styles.controls}>
        {actionsList.slice(0,4).map((action) => <button key={action.command} className={`${styles.button} ${action.tone === 'primary' ? styles.primary : ''}`} onClick={() => onAction(action.command, action.payload || {})}>{action.label}</button>)}
        <button className={styles.button} onClick={onRefresh}><RefreshCw size={16}/> Refresh Live</button>
      </div>
    </div>
    <div className={styles.liveMetricGrid}>
      {(metrics.length ? metrics : [
        {label:'Status', value: loading ? 'Loading' : error ? 'Attention' : data?.status || 'Live'},
        {label:'Rows', value: rows.length},
        {label:'Page', value: page},
        {label:'Mode', value: data?.dryRun ? 'Dry Run' : 'Supabase/API'}
      ]).slice(0,6).map((metric) => <MetricCard key={metric.label} label={metric.label} value={metric.value} sub={metric.tone || 'live'} icon={<Activity size={18}/>} tone={metric.tone as any}/>) }
    </div>
    {rows.length > 0 ? <div className={styles.liveTableWrap}><table className={styles.table}><thead><tr>{headers.map((head)=><th key={head}>{head}</th>)}</tr></thead><tbody>{rows.slice(0,8).map((row,idx)=><tr key={String(row.id || row.key || idx)}>{headers.map((head)=><td key={head}>{renderLiveValue(row[head])}</td>)}</tr>)}</tbody></table></div> : <div className={styles.emptyLiveState}>{loading ? 'Fetching live records…' : 'No live records returned yet. Use the command actions above to seed/register this panel.'}</div>}
  </section>
}

function ObservatoryOperationalModal({
  modal,
  result,
  running,
  onClose,
  onRun,
}: {
  modal: ObservatoryModalState
  result: ObservatoryState | Record<string, unknown> | null
  running: boolean
  onClose: () => void
  onRun: (payloadOverride?: Record<string, unknown>, endpointOverride?: string, methodOverride?: 'GET' | 'POST') => void
}) {
  const [incidentDraft, setIncidentDraft] = useState({
    title: 'Observatory generated incident',
    severity: 'high',
    owner: 'SaaS Factory Operator',
    linked: 'observatory',
    notes: 'Evidence summary: failed/warning Observatory signal detected. Validate impact, assign owner, and keep audit trail attached.',
  })
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')
  const [diagnosticOwner, setDiagnosticOwner] = useState('Engineering / SaaS Factory')

  if (!modal) return null
  const resultAny = result as any
  const payloadAny = (modal.payload || {}) as any
  const contextItem = payloadAny.item || payloadAny.queue || payloadAny.incident || payloadAny.event || payloadAny.rec || payloadAny.probe
  const rows = Array.isArray(resultAny?.checks) ? resultAny.checks : Array.isArray(resultAny?.diagnostics) ? resultAny.diagnostics : Array.isArray(resultAny?.probes) ? resultAny.probes : Array.isArray(resultAny?.events) ? resultAny.events : Array.isArray(resultAny?.audit) ? resultAny.audit : []
  const resultSnapshot = resultAny?.snapshot || {}
  const exportHref = `/api/saas-factory/observatory/export?format=${exportFormat}`

  const workflowMeta: Record<string, { eyebrow: string; title: string; promise: string; run: string; accent: 'up' | 'warn' | 'bad' | 'info' | 'purple' }> = {
    scan: { eyebrow: 'Probe execution center', title: 'Run every Observatory probe with evidence capture', promise: 'Selects every known API, Supabase, registry, queue, incident, audit, options and environment probe; returns pass/warn/fail rows and updates the cockpit.', run: 'Start Probe Run', accent: 'info' },
    diagnostics: { eyebrow: 'Diagnostic command matrix', title: 'Convert probe state into owner-ready remediation work', promise: 'Builds severity groups, assigns ownership, exposes safe/unsafe remediation boundaries and generates recommended actions.', run: 'Run Diagnostic Matrix', accent: 'warn' },
    probe: { eyebrow: 'Probe evidence dossier', title: 'Inspect one runtime signal before taking action', promise: 'Shows identity, route/module linkage, failure reason, remediation, audit references and incident eligibility for the selected probe.', run: 'Reload Probe Evidence', accent: 'info' },
    queue: { eyebrow: 'Queue operations workspace', title: modal.command.toLowerCase().includes('retry') ? 'Review failed jobs before safe retry' : 'Inspect backlog and failed job pressure', promise: 'Loads queue evidence, allows safe retry where supported, and blocks purge unless irreversible approval infrastructure exists.', run: modal.command.toLowerCase().includes('retry') ? 'Retry Safe Jobs' : 'Load Queue State', accent: modal.disabledReason ? 'bad' : 'purple' },
    incident: { eyebrow: 'Incident command workflow', title: modal.command.toLowerCase().includes('create') ? 'Create an incident from Observatory evidence' : 'Review incident evidence and lifecycle', promise: 'Creates/reviews incidents with severity, owner, linked evidence, notes, SLA context and audit proof.', run: modal.command.toLowerCase().includes('create') ? 'Create Incident & Audit' : 'Load Incident Timeline', accent: 'bad' },
    audit: { eyebrow: 'Audit evidence explorer', title: 'Review the command proof trail', promise: 'Loads recent audit events, surfaces actor/action/status evidence and enables export for compliance review.', run: 'Load Audit Evidence', accent: 'info' },
    export: { eyebrow: 'Export builder', title: 'Generate a real downloadable Observatory evidence file', promise: 'Choose JSON snapshot or CSV probe evidence and download from the live export route. No fake download buttons.', run: 'Prepare Export', accent: 'up' },
    sync: { eyebrow: 'Registry reconciliation', title: 'Validate Observatory registry exposure', promise: 'Checks and updates safe SaaS Factory registry records for the Observatory API/action surface without destructive schema changes.', run: 'Validate & Sync Registry', accent: 'purple' },
    refresh: { eyebrow: 'Live state reload', title: 'Refresh the Observatory cockpit', promise: 'Reloads snapshot, health domains, probes, queues, incidents, audit events, recommendations and timestamps.', run: 'Refresh Live State', accent: 'up' },
    health: { eyebrow: 'Health domain review', title: `Inspect ${contextItem?.label || contextItem?.key || 'selected'} domain`, promise: 'Turns a health card into a domain-specific evidence review with linked diagnostics, score, source confidence and next actions.', run: 'Run Domain Diagnostics', accent: 'warn' },
    recommendation: { eyebrow: 'Remediation planner', title: 'Turn recommendation into controlled operator work', promise: 'Creates a reviewable plan with risk, owner, evidence, validation action and audit note. Unsafe auto-remediation stays blocked.', run: 'Build Remediation Plan', accent: 'warn' },
    settings: { eyebrow: 'Configuration governance', title: 'Validate Observatory settings safely', promise: 'Surfaces configurable controls without silently mutating production unless a safe endpoint exists.', run: 'Validate Settings', accent: 'info' },
    safe: { eyebrow: 'Safety gate', title: 'Blocked production mutation review', promise: 'This workflow explains why the action is blocked and audits the attempt instead of pretending success.', run: 'Audit Blocked Attempt', accent: 'bad' },
  }

  const meta = workflowMeta[modal.kind] || workflowMeta.safe
  const accentClass = meta.accent === 'bad' ? styles.bad : meta.accent === 'warn' ? styles.warn : meta.accent === 'purple' ? styles.purple : meta.accent === 'up' ? styles.up : styles.info

  const Cell = ({ label, value, tone = 'info' }: { label: string; value: ReactNode; tone?: 'info' | 'warn' | 'bad' | 'up' | 'purple' }) => <div className={styles.workflowCell}><span>{label}</span><b className={tone === 'bad' ? styles.bad : tone === 'warn' ? styles.warn : tone === 'purple' ? styles.purple : tone === 'up' ? styles.up : styles.info}>{value}</b></div>
  const Step = ({ label, text, tone = 'info' }: { label: string; text: string; tone?: 'info' | 'warn' | 'bad' | 'up' | 'purple' }) => <div className={styles.workflowStep}><span className={`${styles.dot} ${tone === 'warn' ? styles.dotWarn : tone === 'bad' ? styles.dotBad : tone === 'info' ? styles.dotInfo : ''}`}/><div><b>{label}</b><small>{text}</small></div></div>
  const MiniTable = ({ title, items }: { title: string; items: Array<{ name: string; status: string; detail: string }> }) => <div className={styles.workflowPanel}><h3>{title}</h3><div className={styles.liveTableWrap}><table className={styles.table}><thead><tr><th>Name</th><th>Status</th><th>Detail</th></tr></thead><tbody>{items.map((item, index) => <tr key={`${title}-${item.name}-${index}`}><td><b>{item.name}</b></td><td><Pill value={item.status}/></td><td>{item.detail}</td></tr>)}</tbody></table></div></div>

  const ContextCard = () => contextItem ? <div className={styles.workflowContext}>
    <div><span>Selected evidence</span><b>{contextItem.label || contextItem.title || contextItem.name || contextItem.key || contextItem.id || 'Runtime object'}</b></div>
    {contextItem.status ? <Pill value={String(contextItem.status)}/> : null}
    {contextItem.severity ? <Pill value={String(contextItem.severity)}/> : null}
    {contextItem.score !== undefined ? <b className={Number(contextItem.score) >= 90 ? styles.up : Number(contextItem.score) >= 70 ? styles.warn : styles.bad}>{String(contextItem.score)}%</b> : null}
    {contextItem.related ? <small>Related: {String(contextItem.related)}</small> : null}
  </div> : null

  const renderWorkflowWorkspace = () => {
    if (modal.kind === 'scan') return <div className={styles.workflowLayout}>
      <div className={styles.workflowPanel}>
        <h3>Probe execution plan</h3>
        <div className={styles.workflowChecklist}>
          {['API availability', 'Supabase connection', 'Module registry', 'Queue state', 'Incident state', 'Audit stream', 'Options registry', 'Environment readiness'].map((label, index) => <label key={`${label}-${index}`}><input type="checkbox" defaultChecked /> {label}</label>)}
        </div>
        <div className={styles.workflowActions}><button className={styles.button} onClick={() => onRun({ coverage: 'full', source: 'probe-execution-center' })} disabled={running}><RefreshCw size={16}/> {running ? 'Running…' : 'Execute full scan'}</button><a className={styles.button} href="/api/saas-factory/observatory/probes"><Eye size={16}/> Probe API</a></div>
      </div>
      <MiniTable title="Expected outputs" items={[{ name: 'Passed checks', status: 'passed', detail: 'Healthy checks remain in monitoring rotation.' }, { name: 'Warning checks', status: 'warning', detail: 'Creates recommendation and review action.' }, { name: 'Failed checks', status: 'failed', detail: 'Eligible for incident creation.' }]} />
      <div className={styles.workflowPanel}><h3>Run guardrails</h3><Step label="No destructive mutation" text="Scan reads/validates and writes audit proof only." tone="up"/><Step label="Post-run refresh" text="Cockpit state refreshes after the endpoint returns." tone="info"/><Step label="Incident handoff" text="Failed probes can become linked incidents from their detail drawer." tone="warn"/></div>
    </div>

    if (modal.kind === 'diagnostics') return <div className={styles.workflowLayout}>
      <div className={styles.workflowPanel}><h3>Diagnostic matrix controls</h3><div className={styles.modalGrid}><select className={styles.input} defaultValue="all"><option value="all">All domains</option><option>API</option><option>Supabase</option><option>Queues</option><option>Incidents</option></select><select className={styles.input} defaultValue="warning"><option>warning</option><option>failed</option><option>passed</option></select><input className={styles.input} value={diagnosticOwner} onChange={(event) => setDiagnosticOwner(event.target.value)} /><select className={styles.input} defaultValue="manual"><option>manual remediation</option><option>safe validation only</option></select></div><textarea className={styles.textarea} defaultValue="Diagnostic note: classify failures, assign owner, keep unsafe remediation blocked until dedicated adapter exists." style={{width:'100%',marginTop:12}}/><div className={styles.workflowActions}><button className={`${styles.button} ${styles.primary}`} disabled={running} onClick={() => onRun({ owner: diagnosticOwner, surface: 'diagnostic-matrix' })}><ListChecks size={16}/> {running ? 'Running…' : 'Run matrix'}</button></div></div>
      <MiniTable title="Severity model" items={[{ name: 'Critical/failed', status: 'failed', detail: 'Incident candidate with owner required.' }, { name: 'Warnings', status: 'warning', detail: 'Requires remediation plan.' }, { name: 'Safe auto-remediation', status: 'blocked', detail: 'Disabled unless endpoint declares safe=true.' }]} />
    </div>

    if (modal.kind === 'probe') return <div className={styles.workflowLayout}>
      <ContextCard />
      <div className={styles.workflowPanel}><h3>Probe evidence dossier</h3><div className={styles.workflowStats}><Cell label="Probe ID" value={String(payloadAny.id || resultAny?.probe?.id || 'pending')} /><Cell label="Status" value={resultAny?.probe?.status || contextItem?.status || 'load required'} tone={resultAny?.probe?.status === 'failed' ? 'bad' : 'info'} /><Cell label="Severity" value={resultAny?.probe?.severity || contextItem?.severity || 'unknown'} tone="warn"/><Cell label="Source" value={resultAny?.probe?.source || 'runtime'} /></div><Step label="Failure evidence" text={resultAny?.probe?.failureReason || 'Reload evidence to see the current failure reason and backend context.'} tone="warn"/><Step label="Remediation" text={resultAny?.probe?.recommendedAction || 'Open diagnostic matrix or create incident when this probe is failed/warning.'} tone="up"/><div className={styles.workflowActions}><button className={styles.button} disabled={running} onClick={() => onRun({ probeId: payloadAny.id, evidence: 'detail-reload' })}><Eye size={16}/> Reload evidence</button><button className={styles.button} onClick={() => onRun({ title: `Incident from ${resultAny?.probe?.name || payloadAny.id || 'probe'}`, severity: resultAny?.probe?.severity || 'high', related: resultAny?.probe?.related || payloadAny.id, description: resultAny?.probe?.failureReason || 'Created from Observatory probe evidence.' }, '/api/saas-factory/system/actions', 'POST')}><Plus size={16}/> Create linked incident</button></div></div>
    </div>

    if (modal.kind === 'queue') return <div className={styles.workflowLayout}>
      <ContextCard />
      <div className={styles.workflowPanel}><h3>Queue command center</h3><div className={styles.workflowStats}><Cell label="Backlog" value={String(contextItem?.backlog ?? '—')} tone={(Number(contextItem?.backlog || 0) > 0 ? 'warn' : 'up')} /><Cell label="Failed jobs" value={String(contextItem?.failed ?? '—')} tone={(Number(contextItem?.failed || 0) > 0 ? 'bad' : 'up')} /><Cell label="Action" value={modal.command} /><Cell label="Mutation" value={modal.disabledReason ? 'blocked' : 'safe-gated'} tone={modal.disabledReason ? 'bad' : 'warn'} /></div><Step label="Review first" text="Operators see queue pressure before any retry attempt." tone="info"/><Step label="Retry boundary" text="Safe retry is audited and never purges records." tone="up"/><Step label="Purge policy" text="Destructive purge requires irreversible approval infrastructure; blocked here." tone="bad"/><div className={styles.workflowActions}><button className={styles.button} disabled={running || Boolean(modal.disabledReason)} onClick={() => onRun({ queue: contextItem, mode: 'retry_failed_jobs' })}><RefreshCw size={16}/> Retry failed jobs</button><button className={`${styles.button} ${styles.danger}`} disabled={running} onClick={() => onRun({ queue: contextItem, mode: 'purge_attempt' })}><Trash2 size={16}/> Audit purge attempt</button></div></div>
    </div>

    if (modal.kind === 'incident') return <div className={styles.workflowLayout}>
      <ContextCard />
      <div className={styles.workflowPanel}><h3>Incident creation / lifecycle</h3><div className={styles.modalGrid}><input className={styles.input} value={incidentDraft.title} onChange={(event) => setIncidentDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="Incident title"/><select className={styles.input} value={incidentDraft.severity} onChange={(event) => setIncidentDraft((draft) => ({ ...draft, severity: event.target.value }))}><option>critical</option><option>high</option><option>medium</option><option>low</option></select><input className={styles.input} value={incidentDraft.owner} onChange={(event) => setIncidentDraft((draft) => ({ ...draft, owner: event.target.value }))} placeholder="Owner"/><input className={styles.input} value={incidentDraft.linked} onChange={(event) => setIncidentDraft((draft) => ({ ...draft, linked: event.target.value }))} placeholder="Linked probe / endpoint"/></div><textarea className={styles.textarea} value={incidentDraft.notes} onChange={(event) => setIncidentDraft((draft) => ({ ...draft, notes: event.target.value }))} style={{width:'100%',marginTop:12}}/><div className={styles.workflowActions}><button className={`${styles.button} ${styles.primary}`} disabled={running} onClick={() => onRun({ ...incidentDraft, description: incidentDraft.notes, related: incidentDraft.linked, source: 'observatory-incident-workflow' })}><Plus size={16}/> {running ? 'Creating…' : 'Create incident'}</button><button className={styles.button} onClick={() => setIncidentDraft((draft) => ({ ...draft, severity: 'critical', notes: `${draft.notes}\nEscalation: mark as critical and notify on-call owner.` }))}><ShieldAlert size={16}/> Escalate draft</button></div></div>
    </div>

    if (modal.kind === 'audit') return <div className={styles.workflowLayout}>
      <ContextCard />
      <div className={styles.workflowPanel}><h3>Audit evidence explorer</h3><div className={styles.workflowStats}><Cell label="Endpoint" value="/api/saas-factory/audit/recent"/><Cell label="Format" value="JSON/CSV export supported" tone="up"/><Cell label="Compliance" value="proof trail"/><Cell label="State" value={rows.length ? `${rows.length} rows loaded` : 'not loaded'} tone={rows.length ? 'up' : 'warn'} /></div><Step label="Load evidence" text="Pulls recent events from Supabase or fallback store." tone="info"/><Step label="Export proof" text="Use export to save a reviewable Observatory evidence file." tone="up"/><div className={styles.workflowActions}><button className={styles.button} disabled={running} onClick={() => onRun()}><ScrollText size={16}/> Load audit trail</button><a className={styles.button} href="/api/saas-factory/observatory/export?format=csv"><Download size={16}/> Export CSV</a></div></div>
    </div>

    if (modal.kind === 'sync') return <div className={styles.workflowLayout}>
      <div className={styles.workflowPanel}><h3>Registry reconciliation preview</h3><MiniTable title="Registry records" items={[{ name: 'Observatory API', status: 'ready', detail: '/api/saas-factory/observatory' }, { name: 'Probe details API', status: 'ready', detail: '/api/saas-factory/observatory/probes/[id]' }, { name: 'Export API', status: 'ready', detail: '/api/saas-factory/observatory/export' }, { name: 'Unsafe destructive actions', status: 'blocked', detail: 'Purge/freeze require dedicated persistence and approval.' }]}/><div className={styles.workflowActions}><button className={`${styles.button} ${styles.primary}`} disabled={running} onClick={() => onRun({ registry: 'observatory', reconcile: true })}><DatabaseZap size={16}/> {running ? 'Syncing…' : 'Sync registry'}</button></div></div>
    </div>

    if (modal.kind === 'health') return <div className={styles.workflowLayout}>
      <ContextCard />
      <div className={styles.workflowPanel}><h3>Health domain workspace</h3><div className={styles.workflowStats}><Cell label="Domain" value={contextItem?.label || contextItem?.key || 'selected'} /><Cell label="Score" value={`${contextItem?.score ?? '—'}%`} tone={Number(contextItem?.score || 0) >= 90 ? 'up' : 'warn'} /><Cell label="Source" value={contextItem?.source || 'runtime'} /><Cell label="Status" value={contextItem?.status || 'pending'} tone={contextItem?.status === 'failed' ? 'bad' : 'info'} /></div><Step label="Domain diagnostics" text={contextItem?.detail || 'Run diagnostics for this domain to expose linked findings.'} tone="info"/><Step label="Incident rule" text="Scores below threshold or failed status can be promoted into incident workflow." tone="warn"/><div className={styles.workflowActions}><button className={styles.button} disabled={running} onClick={() => onRun({ domain: contextItem?.key || contextItem?.label, source: 'health-domain-workspace' })}><ListChecks size={16}/> Diagnose domain</button></div></div>
    </div>

    if (modal.kind === 'recommendation') return <div className={styles.workflowLayout}>
      <ContextCard />
      <div className={styles.workflowPanel}><h3>Remediation plan builder</h3><div className={styles.workflowStats}><Cell label="Risk" value={contextItem?.severity || 'medium'} tone={contextItem?.severity === 'critical' ? 'bad' : 'warn'} /><Cell label="Owner" value="Engineering / SaaS Factory"/><Cell label="Source" value="state-generated"/><Cell label="Auto-remediate" value="blocked" tone="bad"/></div><Step label="Reason" text={contextItem?.reason || 'Recommendation generated from current Observatory state.'} tone="warn"/><Step label="Action" text={contextItem?.action || 'Run diagnostics and validate manually before mutation.'} tone="up"/><div className={styles.workflowActions}><button className={styles.button} disabled={running} onClick={() => onRun({ recommendation: contextItem, plan: 'manual-remediation' })}><Workflow size={16}/> Build plan</button><button className={styles.button} onClick={() => onRun({ title: contextItem?.title || 'Observatory recommendation incident', severity: contextItem?.severity || 'medium', description: contextItem?.reason || 'Created from state-generated recommendation.' }, '/api/saas-factory/system/actions', 'POST')}><Plus size={16}/> Create incident</button></div></div>
    </div>

    if (modal.kind === 'export') return <div className={styles.workflowLayout}>
      <div className={styles.workflowPanel}><h3>Export builder</h3><div className={styles.modalGrid}><select className={styles.input} value={exportFormat} onChange={(event) => setExportFormat(event.target.value as 'json' | 'csv')}><option value="json">Full Observatory snapshot JSON</option><option value="csv">Probe evidence CSV</option></select><input className={styles.input} readOnly value={exportHref}/></div><Step label="Real route" text="Download is served by /api/saas-factory/observatory/export." tone="up"/><Step label="Evidence scope" text={exportFormat === 'json' ? 'Snapshot includes health, probes, queues, incidents, audit, recommendations and disabled actions.' : 'CSV includes probe evidence fields for spreadsheet review.'} tone="info"/><div className={styles.workflowActions}><a className={`${styles.button} ${styles.primary}`} href={exportHref}><Download size={16}/> Download {exportFormat.toUpperCase()}</a><button className={styles.button} onClick={() => onRun({ exportFormat, prepared: true }, exportHref, 'GET')} disabled={running}>Validate export route</button></div></div>
    </div>

    return <div className={styles.workflowLayout}>
      <div className={styles.workflowPanel}><h3>Production safety gate</h3><Step label="Blocked mutation" text={modal.disabledReason || 'This action is not safely backed by a dedicated persisted workflow yet.'} tone="bad"/><Step label="Audit behavior" text="Attempting it records the action and blocked reason instead of showing fake success." tone="info"/><Step label="Required to enable" text="Add dedicated persistence table, approval workflow and endpoint-specific handler." tone="warn"/><div className={styles.workflowActions}><button className={`${styles.button} ${styles.danger}`} disabled={running} onClick={() => onRun({ blocked: true, reason: modal.disabledReason || 'safe gate' })}><ShieldAlert size={16}/> Audit blocked attempt</button></div></div>
    </div>
  }

  return <div className={styles.modalBackdrop}>
    <div className={styles.workflowModal}>
      <div className={styles.workflowHero}>
        <div>
          <span className={`${styles.workflowEyebrow} ${accentClass}`}>{meta.eyebrow}</span>
          <h2>{meta.title}</h2>
          <p>{meta.promise}</p>
          <div className={styles.workflowMetaLine}><span><b>Endpoint:</b> {modal.method} {modal.endpoint}</span><span><b>Command:</b> {modal.command}</span><span><b>Workflow:</b> {modal.kind}</span></div>
        </div>
        <button className={styles.button} onClick={onClose}><X size={16}/></button>
      </div>

      {modal.disabledReason ? <div className={styles.workflowBlocked}><b>Safely disabled:</b> {modal.disabledReason}. This workflow will audit the attempt instead of silently mutating production.</div> : null}

      <div className={styles.workflowStats}>
        <Cell label="Source confidence" value={resultAny?.confidence || 'runtime/fallback aware'} tone="info" />
        <Cell label="Last execution" value={resultAny?.generatedAt || 'not run in this drawer'} tone="purple" />
        <Cell label="Failed probes" value={String(resultSnapshot.failedProbes ?? '—')} tone={Number(resultSnapshot.failedProbes || 0) > 0 ? 'bad' : 'up'} />
        <Cell label="Warnings" value={String(resultSnapshot.warningProbes ?? '—')} tone={Number(resultSnapshot.warningProbes || 0) > 0 ? 'warn' : 'up'} />
      </div>

      {renderWorkflowWorkspace()}

      {resultAny?.summary ? <div className={styles.workflowResultBanner}>{resultAny.summary}</div> : null}
      {resultAny?.probe ? <div className={styles.workflowPanel}><h3>{resultAny.probe.name}</h3><p>{resultAny.probe.failureReason || 'No failure reason reported.'}</p><div className={styles.toolbar}><Pill value={resultAny.probe.status}/><Pill value={resultAny.probe.severity}/><ObservableSourceBadge source={resultAny.probe.source}/></div><p><b>Recommended action:</b> {resultAny.probe.recommendedAction}</p><p><b>Related:</b> {resultAny.probe.related} • <b>Endpoint:</b> {resultAny.probe.endpoint || 'n/a'}</p></div> : null}
      {Array.isArray(rows) && rows.length ? <div className={styles.liveTableWrap} style={{marginTop:14, maxHeight:320, overflow:'auto'}}><table className={styles.table}><thead><tr><th>Name</th><th>Status</th><th>Severity</th><th>Recommended action</th></tr></thead><tbody>{rows.slice(0,14).map((row: any, index: number) => <tr key={`${row.id || row.name || row.title || 'result'}-${index}`}><td><b>{row.name || row.title || row.id || `Result ${index + 1}`}</b><br/><small>{row.category || row.owner || row.endpoint || row.event_type || ''}</small></td><td><Pill value={String(row.status || row.severity || 'info')}/></td><td>{row.severity ? <Pill value={String(row.severity)}/> : '—'}</td><td>{row.recommendedAction || row.action || row.reason || row.detail || 'Review generated detail.'}</td></tr>)}</tbody></table></div> : null}
      {result ? <details style={{marginTop:14}}><summary className={styles.button}>Technical payload</summary><pre className={styles.emptyLiveState} style={{whiteSpace:'pre-wrap', maxHeight:260, overflow:'auto'}}>{JSON.stringify(result, null, 2)}</pre></details> : null}

      <div className={styles.footerActions}>
        <button className={styles.button} onClick={onClose}>Close</button>
        {modal.kind === 'export' ? <a className={`${styles.button} ${styles.primary}`} href={exportHref}><Download size={16}/> Download {exportFormat.toUpperCase()}</a> : <button className={`${styles.button} ${modal.destructive ? styles.danger : styles.primary}`} onClick={() => onRun()} disabled={running}>{running ? 'Running…' : modal.disabledReason ? 'Audit Attempt' : meta.run}</button>}
      </div>
    </div>
  </div>
}


export default function SaasFactoryCommandCenter({ page, pageKey }: Props) {
  const resolvedPage = ((page ?? (pageKey === 'executive' ? 'overview' : pageKey) ?? 'overview') as PageKey)
  const [modal, setModal] = useState<ModalState>(null)
  const [toast, setToast] = useState('')
  const [livePanel, setLivePanel] = useState<LivePanelState | null>(null)
  const [liveLoading, setLiveLoading] = useState(true)
  const [liveError, setLiveError] = useState('')
  const [observatoryState, setObservatoryState] = useState<ObservatoryState>(null)
  const [observatoryLoading, setObservatoryLoading] = useState(false)
  const [observatorySearch, setObservatorySearch] = useState('')
  const [observatoryFilter, setObservatoryFilter] = useState('all')
  const [observatoryModal, setObservatoryModal] = useState<ObservatoryModalState>(null)
  const [observatoryResult, setObservatoryResult] = useState<ObservatoryState | Record<string, unknown> | null>(null)
  const [observatoryRunning, setObservatoryRunning] = useState(false)

  const refreshLivePanel = async () => {
    setLiveLoading(true)
    setLiveError('')
    try {
      const response = await fetch(`/api/saas-factory/panel/${resolvedPage}`, { cache: 'no-store' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result?.ok === false) throw new Error(result?.error || `Panel API failed with HTTP ${response.status}`)
      setLivePanel(result)
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'Unknown live panel error')
    } finally {
      setLiveLoading(false)
    }
  }

  const refreshObservatory = async (endpoint = '/api/saas-factory/observatory/refresh') => {
    setObservatoryLoading(true)
    try {
      const response = await fetch(endpoint, { method: endpoint.includes('/refresh') ? 'POST' : 'GET', cache: 'no-store' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result?.ok === false) throw new Error(result?.error || `Observatory API failed with HTTP ${response.status}`)
      setObservatoryState(result)
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Observatory error'
      setToast(`Observatory failed: ${message}`)
      window.setTimeout(() => setToast(''), 5200)
      return { ok: false, error: message }
    } finally {
      setObservatoryLoading(false)
    }
  }

  useEffect(() => { void refreshLivePanel() }, [resolvedPage])
  useEffect(() => { if (resolvedPage === 'observatory') void refreshObservatory('/api/saas-factory/observatory') }, [resolvedPage])

  const executeCommand = async (mode: string, payload: Record<string, unknown> = {}) => {
    setToast(`${mode}: executing live command...`)
    try {
      const response = await fetch('/api/saas-factory/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, page: resolvedPage, payload }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result?.ok === false) {
        throw new Error(result?.error || `Command failed with HTTP ${response.status}`)
      }
      setToast(result?.message || `${mode} executed. Audit event recorded.`)
      window.setTimeout(() => setToast(''), 3600)
      void refreshLivePanel()
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown command error'
      setToast(`${mode} failed: ${message}`)
      window.setTimeout(() => setToast(''), 5200)
      return { ok: false, error: message }
    }
  }

  const openObservatoryModal = (mode: string, payload: Record<string, unknown> = {}) => {
    const lower = mode.toLowerCase()
    let endpoint = '/api/saas-factory/system/actions'
    let method: 'GET' | 'POST' = 'POST'
    let kind: NonNullable<ObservatoryModalState>['kind'] = 'safe'
    let title = mode
    let description = 'Review this Observatory action before execution. The result appears inside this workspace and the action is audited.'
    let destructive = false
    let disabledReason = ''

    if (lower.includes('run all probes') || lower.includes('scan')) { endpoint = '/api/saas-factory/observatory/scan'; kind = 'scan'; title = 'Run Observatory Probe Scan'; description = 'Runs API, Supabase, module registry, queue, incident, audit, options and environment probes.' }
    else if (lower.includes('diagnostic')) { endpoint = '/api/saas-factory/observatory/diagnostics'; kind = 'diagnostics'; title = 'Run Observatory Diagnostics'; description = 'Builds pass/warn/fail diagnostics and recommended actions from current system state.' }
    else if (lower.includes('refresh')) { endpoint = '/api/saas-factory/observatory/refresh'; kind = 'refresh'; title = 'Refresh Live Observatory'; description = 'Reloads the live/fallback state, health cards, probe list, incidents, queues, audit and recommendations.' }
    else if (lower.includes('sync')) { endpoint = '/api/saas-factory/modules/sync'; kind = 'sync'; title = 'Sync Observatory Registry'; description = 'Validates/registers Observatory API/action registry records through SaaS Factory APIs.' }
    else if (lower.includes('export observatory') || lower.includes('snapshot')) { endpoint = '/api/saas-factory/observatory/export?format=json'; method = 'GET'; kind = 'export'; title = 'Export Observatory Snapshot'; description = 'Downloads a real JSON snapshot from the Observatory export endpoint.' }
    else if (lower.includes('export audit')) { endpoint = '/api/saas-factory/observatory/export?format=csv'; method = 'GET'; kind = 'export'; title = 'Export Observatory Probe CSV'; description = 'Downloads a real CSV export from the Observatory export endpoint.' }
    else if (lower.includes('probe detail')) { endpoint = `/api/saas-factory/observatory/probes/${payload.id}`; method = 'GET'; kind = 'probe'; title = 'Probe Detail Drawer'; description = 'Loads a specific probe with status, severity, linked route/module, failure reason and remediation.' }
    else if (lower.startsWith('inspect ')) { endpoint = '/api/saas-factory/observatory/diagnostics'; kind = 'health'; title = `${mode} Domain Review`; description = 'Opens a health-domain workflow with current score, source confidence, linked checks, incident eligibility and remediation next steps.' }
    else if (lower.includes('recommendation')) { endpoint = '/api/saas-factory/observatory/diagnostics'; kind = 'recommendation'; title = 'Recommendation Review Workspace'; description = 'Turns a state-generated recommendation into a reviewable remediation workflow with owner, risk, action path and audit proof.' }
    else if (lower.includes('queue')) { kind = 'queue'; title = mode; description = 'Queue action is safe-gated. Summary/retry actions are audited; destructive purge is disabled.'; if (lower.includes('purge')) { destructive = true; disabledReason = 'Queue purge is destructive and requires a dedicated queue adapter plus irreversible approval.' } }
    else if (lower.includes('incident')) { endpoint = '/api/saas-factory/system/actions'; kind = 'incident'; title = lower.includes('create') ? 'Create Incident From Observatory Evidence' : 'Incident Summary Workspace'; description = 'Incident workflow with evidence selection, severity, owner, linked failed probe/diagnostic context, audit note and controlled resolve/reopen actions.' }
    else if (lower.includes('audit')) { endpoint = '/api/saas-factory/audit/recent'; method = 'GET'; kind = 'audit'; title = mode; description = 'Loads recent audit events from Supabase or explicit fallback store.' }
    else if (lower.includes('emergency') || lower.includes('freeze')) { destructive = true; disabledReason = 'Emergency/freeze mode requires persisted operations-state support before production mutation.'; title = 'Emergency Freeze Review'; description = 'This action is intentionally blocked and audited until the persistence table is confirmed.' }
    else if (lower.includes('settings')) { kind = 'settings'; title = 'Observatory Settings'; description = 'Settings are review-only here unless backed by a safe SaaS Factory action endpoint.' }

    setObservatoryResult(null)
    setObservatoryModal({ title, command: mode, endpoint, method, description, kind, payload, destructive, disabledReason })
  }

  const runObservatoryModal = async (payloadOverride: Record<string, unknown> = {}, endpointOverride?: string, methodOverride?: 'GET' | 'POST') => {
    if (!observatoryModal) return
    setObservatoryRunning(true)
    try {
      const endpoint = endpointOverride || observatoryModal.endpoint
      const method = methodOverride || observatoryModal.method
      const payload = { ...(observatoryModal.payload || {}), ...payloadOverride }
      const response = await fetch(endpoint, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: method === 'POST' ? JSON.stringify({ action: observatoryModal.command, payload }) : undefined,
        cache: 'no-store',
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result?.ok === false) {
        if (!result?.blocked) throw new Error(result?.error || result?.reason || `HTTP ${response.status}`)
      }
      setObservatoryResult(result)
      if (result?.probes || result?.snapshot || result?.health) setObservatoryState(result)
      setToast(result?.message || result?.reason || `${observatoryModal.command} completed.`)
      window.setTimeout(() => setToast(''), 4200)
      void refreshLivePanel()
      if (observatoryModal.kind !== 'probe' && observatoryModal.kind !== 'audit' && method !== 'GET') void refreshObservatory('/api/saas-factory/observatory')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Observatory command error'
      setObservatoryResult({ ok: false, error: message })
      setToast(`${observatoryModal.command} failed: ${message}`)
      window.setTimeout(() => setToast(''), 5200)
    } finally {
      setObservatoryRunning(false)
    }
  }

  const onAction = (mode: string, payload: Record<string, unknown> = {}) => {
    if (resolvedPage === 'observatory') {
      openObservatoryModal(mode, payload)
      return
    }
    const directCommands = [
      'Save City','Publish All Changes','Publish Options','Run Test','Send API Test','Run Health Check All','Run Full Scan','Run All Probes','Scan Now','Sync Modules','Sync All Modules','Run Readiness Check','Seed factory catalog','Refresh live snapshot','Export Report','Export Data','API Explorer','SQL Editor','Realtime Monitor','Mark All as Read','War Room','Reports','View Logs','Run Diagnostics','Emergency Mode','Clear Cache','Restart Queues','Sync Supabase','Create Alert Rule','View All Alerts','Contact On-Call','Pause Queue','Retry Failed','Purge Queue','Approve Deployment','Create Incident','Create Flag','Create Tenant','Add Data Source'
    ]
    if (directCommands.some((x) => mode.toLowerCase().includes(x.toLowerCase()))) {
      void executeCommand(mode, payload)
      return
    }
    setModal({ title: mode, mode, body: `Live command target: ${mode}. Saving this form will call the SaaS Factory command API, persist an audit event, and update the matching registry where possible.` })
  }

  return <div className={styles.shell}>
    <Sidebar page={resolvedPage} onAction={onAction}/>
    <main className={styles.main}>
      <TopBar page={resolvedPage} onAction={onAction}/>
      <LiveExecutionPanel page={resolvedPage} data={livePanel} loading={liveLoading} error={liveError} onAction={onAction} onRefresh={refreshLivePanel}/>
      <GenericPage page={resolvedPage} onAction={onAction} observatoryState={observatoryState} observatoryLoading={observatoryLoading} observatorySearch={observatorySearch} observatoryFilter={observatoryFilter} onObservatorySearch={setObservatorySearch} onObservatoryFilter={setObservatoryFilter} onProbe={(probe) => openObservatoryModal('Probe Detail', { id: probe.id })}/>
    </main>
    {modal && <div className={styles.modalBackdrop}><div className={styles.modal}><div className={styles.cardTitle}><div><h2>{modal.title}</h2><p>{modal.body}</p></div><button className={styles.button} onClick={()=>setModal(null)}><X size={16}/></button></div><div className={styles.modalGrid}><input className={styles.input} placeholder="Command name" defaultValue={modal.mode}/><input className={styles.input} placeholder="Owner" defaultValue="Selma El Alami"/><select className={styles.input}><option>Production</option><option>Staging</option></select><select className={styles.input}><option>High priority</option><option>Medium priority</option></select></div><textarea className={styles.textarea} defaultValue={`Audit note for ${modal.mode}.`} style={{width:'100%',marginTop:14}}/><div className={styles.footerActions}><button className={styles.button} onClick={()=>setModal(null)}>Cancel</button><button className={`${styles.button} ${styles.primary}`} onClick={()=>{const currentMode = modal.mode; setModal(null); void executeCommand(currentMode, { source: 'modal-save' })}}><Save size={16}/> Save & Audit</button></div></div></div>}
    <ObservatoryOperationalModal modal={observatoryModal} result={observatoryResult} running={observatoryRunning} onClose={() => setObservatoryModal(null)} onRun={runObservatoryModal}/>
    {toast && <div className={styles.toast}>{toast}</div>}
  </div>
}
