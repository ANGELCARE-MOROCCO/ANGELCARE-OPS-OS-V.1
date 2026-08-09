'use client'
import { shouldStartAutoRefresh, safeRefreshInterval, safeUiInterval } from '@/lib/runtime/client-live-governor'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type LiveActivity = { title: string; time?: string; href: string }

function formatRelativeTime(value?: string) {
  if (!value) return 'live'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const navMain = [
  ['Executive Home', '/market-os/marketing-home', '⌘', 'LIVE'],
  ['Market-OS Home', '/market-os', '◎', 'MKT'],
  ['Campaign Lifecycle', '/market-os/campaign-lifecycle', '🎯', ''],
  ['Content Command', '/market-os/content-command-center', '🧠', ''],
  ['SEO Blog Workspace', '/market-os/seo-blog-workspace', '✍️', ''],
  ['Automation Control', '/market-os/automation-control', '⚙️', ''],
  ['Partners Network', '/market-os/partners-network', '🤝', ''],
  ['Marketing Calendar', '/market-os/calendar', '🗓️', ''],
]

const navSync = [
  ['Revenue Command', '/revenue-command-center', '💎', 'MAD'],
  ['Leads', '/leads', '📈', ''],
  ['Sales', '/sales', '🚀', ''],
  ['Services', '/services', '🧩', ''],
  ['Families', '/families', '🏡', ''],
  ['Reports', '/reports', '📊', ''],
]

const fallbackKpis = [
  { label: 'Campaigns Active', value: '24', href: '/market-os/campaign-lifecycle', icon: '🎯' },
  { label: 'Leads Generated', value: '1,284', href: '/leads', icon: '👥' },
  { label: 'Revenue Influenced', value: '2.48M MAD', href: '/revenue-command-center', icon: '💰' },
  { label: 'Content Published', value: '48', href: '/market-os/content-command-center', icon: '📄' },
  { label: 'Partners in Motion', value: '18', href: '/market-os/partners-network', icon: '🤝' },
  { label: 'Sales Handoffs', value: '31', href: '/sales', icon: '🚀' },
]

const fallbackCampaigns = [
  { title: 'Rabat Preschool B2B Activation', type: 'Partnership acquisition', status: 'Scaling', href: '/market-os/campaign-lifecycle' },
  { title: 'Casablanca Parent Trust Funnel', type: 'B2C acquisition', status: 'Active', href: '/market-os/campaign-lifecycle' },
  { title: 'Academy Authority Content', type: 'SEO + organic', status: 'Content', href: '/market-os/content-command-center' },
  { title: 'Kindergarten WinWin Partnerships', type: 'B2B outreach', status: 'Risk', href: '/market-os/partners-network' },
]

const fallbackActivity = [
  { title: 'Lead generated from Meta campaign', time: new Date(Date.now() - 120000).toISOString(), href: '/leads' },
  { title: 'Campaign creative approved', time: new Date(Date.now() - 900000).toISOString(), href: '/market-os/campaign-lifecycle' },
  { title: 'Partnership proposal moved to negotiation', time: new Date(Date.now() - 3600000).toISOString(), href: '/market-os/partners-network' },
]

const performanceViews = ['Acquisition', 'Revenue', 'Content', 'Partners', 'Automation'] as const
const ranges = ['Live', 'Today', '7D', '30D'] as const

const chartProfiles: Record<string, Record<string, Array<{ x: number; y: number; label: string }>>> = {
  Acquisition: {
    Live: [{x:65,y:260,label:'00:00'},{x:245,y:210,label:'06:00'},{x:420,y:175,label:'09:00'},{x:610,y:120,label:'12:00'},{x:815,y:105,label:'18:00'},{x:940,y:70,label:'24:00'}],
    Today: [{x:65,y:270,label:'00:00'},{x:245,y:230,label:'06:00'},{x:420,y:160,label:'09:00'},{x:610,y:130,label:'12:00'},{x:815,y:110,label:'18:00'},{x:940,y:88,label:'24:00'}],
    '7D': [{x:65,y:250,label:'Mon'},{x:245,y:218,label:'Tue'},{x:420,y:190,label:'Wed'},{x:610,y:132,label:'Thu'},{x:815,y:95,label:'Fri'},{x:940,y:75,label:'Sun'}],
    '30D': [{x:65,y:280,label:'W1'},{x:245,y:235,label:'W2'},{x:420,y:200,label:'W3'},{x:610,y:155,label:'W4'},{x:815,y:105,label:'W5'},{x:940,y:82,label:'Now'}],
  },
  Revenue: {
    Live: [{x:65,y:275,label:'00:00'},{x:245,y:240,label:'06:00'},{x:420,y:180,label:'09:00'},{x:610,y:205,label:'12:00'},{x:815,y:102,label:'18:00'},{x:940,y:60,label:'24:00'}],
    Today: [{x:65,y:270,label:'00:00'},{x:245,y:225,label:'06:00'},{x:420,y:205,label:'09:00'},{x:610,y:150,label:'12:00'},{x:815,y:86,label:'18:00'},{x:940,y:72,label:'24:00'}],
    '7D': [{x:65,y:260,label:'Mon'},{x:245,y:230,label:'Tue'},{x:420,y:245,label:'Wed'},{x:610,y:145,label:'Thu'},{x:815,y:105,label:'Fri'},{x:940,y:76,label:'Sun'}],
    '30D': [{x:65,y:285,label:'W1'},{x:245,y:240,label:'W2'},{x:420,y:190,label:'W3'},{x:610,y:130,label:'W4'},{x:815,y:90,label:'W5'},{x:940,y:55,label:'Now'}],
  },
  Content: {
    Live: [{x:65,y:255,label:'00:00'},{x:245,y:225,label:'06:00'},{x:420,y:230,label:'09:00'},{x:610,y:155,label:'12:00'},{x:815,y:115,label:'18:00'},{x:940,y:98,label:'24:00'}],
    Today: [{x:65,y:275,label:'00:00'},{x:245,y:245,label:'06:00'},{x:420,y:210,label:'09:00'},{x:610,y:170,label:'12:00'},{x:815,y:130,label:'18:00'},{x:940,y:100,label:'24:00'}],
    '7D': [{x:65,y:250,label:'Mon'},{x:245,y:260,label:'Tue'},{x:420,y:210,label:'Wed'},{x:610,y:185,label:'Thu'},{x:815,y:145,label:'Fri'},{x:940,y:115,label:'Sun'}],
    '30D': [{x:65,y:270,label:'W1'},{x:245,y:250,label:'W2'},{x:420,y:218,label:'W3'},{x:610,y:190,label:'W4'},{x:815,y:150,label:'W5'},{x:940,y:122,label:'Now'}],
  },
  Partners: {
    Live: [{x:65,y:280,label:'00:00'},{x:245,y:250,label:'06:00'},{x:420,y:215,label:'09:00'},{x:610,y:165,label:'12:00'},{x:815,y:138,label:'18:00'},{x:940,y:82,label:'24:00'}],
    Today: [{x:65,y:280,label:'00:00'},{x:245,y:255,label:'06:00'},{x:420,y:230,label:'09:00'},{x:610,y:170,label:'12:00'},{x:815,y:142,label:'18:00'},{x:940,y:95,label:'24:00'}],
    '7D': [{x:65,y:260,label:'Mon'},{x:245,y:240,label:'Tue'},{x:420,y:205,label:'Wed'},{x:610,y:198,label:'Thu'},{x:815,y:130,label:'Fri'},{x:940,y:98,label:'Sun'}],
    '30D': [{x:65,y:285,label:'W1'},{x:245,y:252,label:'W2'},{x:420,y:222,label:'W3'},{x:610,y:175,label:'W4'},{x:815,y:135,label:'W5'},{x:940,y:88,label:'Now'}],
  },
  Automation: {
    Live: [{x:65,y:205,label:'00:00'},{x:245,y:190,label:'06:00'},{x:420,y:185,label:'09:00'},{x:610,y:150,label:'12:00'},{x:815,y:120,label:'18:00'},{x:940,y:105,label:'24:00'}],
    Today: [{x:65,y:220,label:'00:00'},{x:245,y:205,label:'06:00'},{x:420,y:180,label:'09:00'},{x:610,y:160,label:'12:00'},{x:815,y:135,label:'18:00'},{x:940,y:100,label:'24:00'}],
    '7D': [{x:65,y:240,label:'Mon'},{x:245,y:220,label:'Tue'},{x:420,y:200,label:'Wed'},{x:610,y:160,label:'Thu'},{x:815,y:128,label:'Fri'},{x:940,y:110,label:'Sun'}],
    '30D': [{x:65,y:255,label:'W1'},{x:245,y:235,label:'W2'},{x:420,y:210,label:'W3'},{x:610,y:175,label:'W4'},{x:815,y:145,label:'W5'},{x:940,y:118,label:'Now'}],
  },
}

function smooth(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => {
    if (index === 0) return `M${point.x} ${point.y}`
    const prev = points[index - 1]
    const cx = (prev.x + point.x) / 2
    return `C${cx} ${prev.y}, ${cx} ${point.y}, ${point.x} ${point.y}`
  }).join(' ')
}

function area(points: Array<{ x: number; y: number }>) {
  const first = points[0]
  const last = points[points.length - 1]
  return `${smooth(points)} L${last.x} 305 L${first.x} 305 Z`
}

function offset(points: Array<{ x: number; y: number; label: string }>, yOffset: number) {
  return points.map((p) => ({ ...p, y: Math.min(295, Math.max(45, p.y + yOffset)) }))
}

export default function MarketingCommandCenter() {
  const [snapshot, setSnapshot] = useState<any>(null)
  const [status, setStatus] = useState<'loading' | 'live' | 'safe'>('loading')
  const [tick, setTick] = useState(0)
  const [view, setView] = useState<(typeof performanceViews)[number]>('Acquisition')
  const [range, setRange] = useState<(typeof ranges)[number]>('Live')
  const [layers, setLayers] = useState<string[]>(['Today', 'Baseline', 'Revenue'])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch('/api/marketing/deep-sync', { cache: 'no-store' })
        const json = await res.json()
        if (!active) return
        if (json?.ok) {
          setSnapshot(json)
          setStatus(json.mode === 'deep-live' ? 'live' : 'safe')
        } else {
          setStatus('safe')
        }
      } catch {
        if (active) setStatus('safe')
      }
    }
    load()
    if (!shouldStartAutoRefresh()) return
    const sync = setInterval(load, safeRefreshInterval(30000))
    const clock = setInterval(() => setTick((x) => x + 1), safeUiInterval(15000))
    return () => {
      active = false
      clearInterval(sync)
      clearInterval(clock)
    }
  }, [])

  const kpis = snapshot?.kpis?.length ? snapshot.kpis : fallbackKpis
  const campaigns = snapshot?.campaignsBoard?.length ? snapshot.campaignsBoard : fallbackCampaigns
  const activity = snapshot?.activity?.length ? snapshot.activity : fallbackActivity
  const sync = snapshot?.sync?.length ? snapshot.sync : []
  const aiActions = snapshot?.aiActions?.length ? snapshot.aiActions : []

  const points = chartProfiles[view][range]
  const baseline = offset(points, 42)
  const revenue = offset(points, view === 'Revenue' ? 14 : 75)

  const metrics = useMemo(() => {
    const counts = snapshot?.rawCounts || {}
    if (view === 'Revenue') return [['Revenue Influenced', snapshot?.marketingPerformance?.revenueInfluenced || '2.48M MAD', 'MAD source'], ['Sales Handoffs', String(counts.sales || 31), 'sales sync'], ['Leads in Motion', String(counts.leads || 1284), 'pipeline'], ['Tasks Open', String(counts.tasks || 23), 'execution']]
    if (view === 'Content') return [['Content Assets', String(counts.contentTasks || 48), 'production'], ['Published', String(snapshot?.marketingPerformance?.contentPublished || 48), 'live'], ['SEO Workbench', '82/100', 'quality'], ['Approvals', String(counts.tasks || 7), 'pending']]
    if (view === 'Partners') return [['Partners', String(counts.partners || 18), 'B2B'], ['Meetings', '42', 'pipeline'], ['Value', '410K MAD', 'potential'], ['Risk', '7', 'needs action']]
    if (view === 'Automation') return [['Automations', String(counts.automations || 12), 'active'], ['Flows', '9', 'running'], ['Errors', '0', 'healthy'], ['Triggered', '156', 'today']]
    return [['Campaigns', String(counts.campaigns || 24), 'active'], ['Leads', String(counts.leads || 1284), 'generated'], ['CAC Control', 'Stable', 'healthy'], ['ROAS', '5.4x', 'blended']]
  }, [snapshot, view])

  const toggleLayer = (name: string) => {
    setLayers((current) => current.includes(name) ? current.filter((x) => x !== name) : [...current, name])
  }

  return (
    <div style={page}>
      <aside style={sidebar}>
        <div style={brand}>
          <div style={brandLogo}>A</div>
          <div>
            <strong>ANGELCARE</strong>
            <p>MARKETING EXECUTIVE OS</p>
          </div>
        </div>

        <Section title="Executive Market-OS" items={navMain} />
        <Section title="Cross-module Sync" items={navSync} />

        <div style={syncEngine}>
          <strong>LIVE MARKETING SYNC</strong>
          <b>{status === 'live' ? 'deep-live' : 'safe'}</b>
          <p>Campaigns, leads, revenue, content, partners and sales checked every 30 seconds.</p>
          <span>● connected</span>
        </div>
      </aside>

      <main style={main}>
        <header style={topbar}>
          <div style={statusRow}>
            {['MARKET-OS: ONLINE', 'REVENUE: SYNCED', 'LEADS: LIVE', 'CONTENT: ACTIVE'].map((x) => <span key={x}>● {x}</span>)}
          </div>
          <div style={clock}>Marketing Executive · {status.toUpperCase()}</div>
        </header>

        <section style={heroGrid}>
          <div style={hero}>
            <span style={eyebrow}>AI MARKET INTELLIGENCE COMMAND</span>
            <h1>Marketing Executive Command Center</h1>
            <p>AI-native operating cockpit synchronized with Market-OS, Campaigns, Revenue, Leads, Sales, Services, Families, Content, Automation and Partnerships.</p>
            <div style={heroActions}>
              <Link href="/market-os/campaign-lifecycle" style={primary}>Campaign Control</Link>
              <Link href="/market-os/content-command-center" style={secondary}>Content Command</Link>
              <Link href="/revenue-command-center" style={secondary}>Revenue Sync</Link>
              <Link href="/api/marketing/deep-sync" style={secondary}>Live Snapshot</Link>
            </div>
          </div>

          <div style={mission}>
            <strong>Mission Status</strong>
            <h2>Growth Execution <b>92%</b></h2>
            <div style={progress}><span /></div>
            <div style={missionStats}>
              <Mini label="ROAS" value="5.4x" />
              <Mini label="Revenue" value={snapshot?.marketingPerformance?.revenueInfluenced || '2.48M MAD'} />
              <Mini label="Leads" value={String(snapshot?.rawCounts?.leads || 1284)} />
              <Mini label="Partners" value={String(snapshot?.rawCounts?.partners || 18)} />
            </div>
          </div>

          <div style={aiInsight}>
            <strong>AI COMMAND INSIGHT</strong>
            {(aiActions.length ? aiActions : [
              { title: 'Lead acceleration needed', detail: 'High-intent leads require sales routing.' },
              { title: 'Partnership follow-up', detail: 'B2B opportunities need urgent action.' },
              { title: 'Content authority gap', detail: 'Increase SEO publication velocity.' },
            ]).slice(0, 3).map((item: any) => (
              <Link key={item.title} href={item.href || '/reports'}>{item.title}<span>{item.detail}</span></Link>
            ))}
          </div>
        </section>

        <section style={kpiGrid}>
          {kpis.map((kpi: any) => (
            <Link key={kpi.label} href={kpi.href} style={kpiCard}>
              <span>{kpi.icon}</span>
              <strong>{kpi.value}</strong>
              <p>{kpi.label}</p>
              <em>Live module source</em>
            </Link>
          ))}
        </section>

        <section style={mainGrid}>
          <Panel title="CAMPAIGN EXECUTION BOARD" sub="Active growth operations" href="/market-os/campaign-lifecycle" action="Open Campaigns">
            {campaigns.map((item: any) => (
              <Link key={item.title} href={item.href} style={row}>
                <div><strong>{item.title}</strong><p>{item.type}</p></div>
                <b>{item.status}</b>
              </Link>
            ))}
          </Panel>

          <Panel title="MODULE SYNCHRONIZATION MATRIX" sub="Real-time marketing system status" href="/reports" action="Analytics">
            <div style={moduleGrid}>
              {(sync.length ? sync : [
                { module: 'Campaign Lifecycle', count: 24, href: '/market-os/campaign-lifecycle' },
                { module: 'Content Command', count: 48, href: '/market-os/content-command-center' },
                { module: 'Revenue Command', count: 12, href: '/revenue-command-center' },
                { module: 'Leads Module', count: 1284, href: '/leads' },
                { module: 'Sales Module', count: 31, href: '/sales' },
                { module: 'Partners Network', count: 18, href: '/market-os/partners-network' },
              ]).slice(0, 9).map((item: any) => (
                <Link key={item.module} href={item.href} style={moduleCard}>
                  <strong>{item.module}</strong>
                  <b>{item.count}</b>
                  <span>✓ connected</span>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="LIVE ACTIVITY STREAM" sub="Deep-sync operational feed" href="/reports" action={status === 'live' ? 'LIVE' : 'SAFE'}>
            {activity.slice(0, 7).map((item: LiveActivity) => (
              <Link key={`${item.title}-${item.time}`} href={item.href} style={activityRow}>
                <strong>{item.title}</strong>
                <span>{formatRelativeTime(item.time)}</span>
              </Link>
            ))}
          </Panel>
        </section>

        <Panel title="SMART MARKETING PERFORMANCE CONSOLE" sub={`${view} · ${range} · ${status === 'live' ? 'deep live sync' : 'safe mode'}`} href="/reports" action="Open Reports">
          <div style={smartControls}>
            <div>
              <span>Time range</span>
              <div style={buttonRow}>{ranges.map((x) => <button key={x} onClick={() => setRange(x)} style={x === range ? activeButton : plainButton}>{x}</button>)}</div>
            </div>
            <div>
              <span>Performance view</span>
              <div style={buttonRow}>{performanceViews.map((x) => <button key={x} onClick={() => setView(x)} style={x === view ? activeButton : plainButton}>{x}</button>)}</div>
            </div>
            <div>
              <span>Chart layers</span>
              <div style={buttonRow}>{['Today', 'Baseline', 'Revenue'].map((x) => <button key={x} onClick={() => toggleLayer(x)} style={layers.includes(x) ? layerOn : plainButton}>{x}</button>)}</div>
            </div>
          </div>

          <div style={metricGrid}>
            {metrics.map(([label, value, detail]) => (
              <div key={label} style={metricCard}><span>{label}</span><strong>{value}</strong><em>{detail}</em></div>
            ))}
          </div>

          <div style={chartShell}>
            <svg viewBox="0 0 980 330" width="100%" height="100%" preserveAspectRatio="none" style={chartSvg}>
              <defs>
                <linearGradient id="mktMain" x1="0" x2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="45%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
                <linearGradient id="mktArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(139,92,246,.38)" />
                  <stop offset="100%" stopColor="rgba(14,165,233,0)" />
                </linearGradient>
              </defs>
              {[55, 110, 165, 220, 275].map((y) => <line key={y} x1="60" y1={y} x2="940" y2={y} stroke="rgba(148,163,184,.18)" />)}
              {layers.includes('Today') && <><path d={`${area(points)}`} fill="url(#mktArea)" /><path d={smooth(points)} fill="none" stroke="url(#mktMain)" strokeWidth="6" strokeLinecap="round" /></>}
              {layers.includes('Baseline') && <path d={smooth(baseline)} fill="none" stroke="#38bdf8" strokeWidth="4" strokeDasharray="14 14" opacity=".72" />}
              {layers.includes('Revenue') && <path d={smooth(revenue)} fill="none" stroke="#22c55e" strokeWidth="3" opacity=".62" />}
              {points.slice(1).map((p) => <g key={p.label}><circle cx={p.x} cy={p.y} r="9" fill="#8b5cf6" stroke="#fff" strokeWidth="3" /><text x={p.x} y={p.y - 18} fill="#cbd5e1" fontSize="13" textAnchor="middle" fontWeight="700">{p.label}</text></g>)}
            </svg>
            <div style={axis}>{points.map((p) => <span key={p.label}>{p.label}</span>)}</div>
          </div>
        </Panel>
      </main>
    </div>
  )
}

function Section({ title, items }: { title: string; items: string[][] }) {
  return <section style={section}><h3>{title}</h3>{items.map(([label, href, icon, badge]) => <Link key={label} href={href} style={sideLink}><span>{icon}</span><b>{label}</b>{badge ? <em>{badge}</em> : null}</Link>)}</section>
}

function Panel({ title, sub, href, action, children }: { title: string; sub: React.ReactNode; href: string; action: React.ReactNode; children: React.ReactNode }) {
  return <section style={panel}><header style={panelHeader}><div><h2>{title}</h2>{sub ? <p>{sub}</p> : null}</div><Link href={href}>{action} →</Link></header>{children}</section>
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div style={mini}><span>{label}</span><strong>{value}</strong></div>
}

const page: React.CSSProperties = { minHeight: '100vh', display: 'grid', gridTemplateColumns: '286px 1fr', background: '#050b14', color: '#e5eefc', fontFamily: 'Inter, Arial, sans-serif' }
const sidebar: React.CSSProperties = { background: 'linear-gradient(180deg,#07111f,#050b14)', borderRight: '1px solid rgba(148,163,184,.14)', padding: 22, display: 'grid', alignContent: 'start', gap: 22 }
const brand: React.CSSProperties = { display: 'flex', gap: 14, alignItems: 'center', padding: '16px 0 18px' }
const brandLogo: React.CSSProperties = { width: 56, height: 56, borderRadius: 18, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', boxShadow: '0 0 34px rgba(124,58,237,.45)', fontSize: 28, fontWeight: 1000 }
const section: React.CSSProperties = { display: 'grid', gap: 8 }
const sideLink: React.CSSProperties = { display: 'grid', gridTemplateColumns: '26px 1fr auto', alignItems: 'center', gap: 10, minHeight: 42, padding: '0 12px', borderRadius: 12, color: '#dbeafe', textDecoration: 'none', fontWeight: 900, background: 'rgba(255,255,255,.025)' }
const syncEngine: React.CSSProperties = { padding: 18, borderRadius: 18, background: 'linear-gradient(180deg,rgba(14,165,233,.14),rgba(14,165,233,.06))', border: '1px solid rgba(14,165,233,.26)', display: 'grid', gap: 8 }
const main: React.CSSProperties = { padding: 18, display: 'grid', gap: 16 }
const topbar: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 44 }
const statusRow: React.CSSProperties = { display: 'flex', gap: 10 }
const clock: React.CSSProperties = { fontWeight: 1000, color: '#fff' }
const heroGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.7fr 1fr .95fr', gap: 12 }
const hero: React.CSSProperties = { borderRadius: 16, padding: 24, background: 'linear-gradient(135deg,rgba(15,23,42,.98),rgba(2,6,23,.95))', border: '1px solid rgba(124,58,237,.45)' }
const eyebrow: React.CSSProperties = { color: '#c4b5fd', fontSize: 12, fontWeight: 1000, letterSpacing: 1.7 }
const heroActions: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }
const primary: React.CSSProperties = { padding: '13px 16px', borderRadius: 12, background: '#7c3aed', color: '#fff', textDecoration: 'none', fontWeight: 1000 }
const secondary: React.CSSProperties = { ...primary, background: 'rgba(255,255,255,.08)' }
const mission: React.CSSProperties = { borderRadius: 16, padding: 22, background: 'linear-gradient(180deg,#0b1726,#06111f)', border: '1px solid rgba(14,165,233,.25)' }
const progress: React.CSSProperties = { height: 9, borderRadius: 999, background: '#1f2937', overflow: 'hidden' }
const missionStats: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginTop: 18 }
const mini: React.CSSProperties = { display: 'grid', gap: 4 }
const aiInsight: React.CSSProperties = { borderRadius: 16, padding: 22, background: 'linear-gradient(180deg,#0d1022,#111827)', border: '1px solid rgba(124,58,237,.3)', display: 'grid', gap: 10 }
const kpiGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }
const kpiCard: React.CSSProperties = { minHeight: 132, borderRadius: 15, padding: 18, display: 'grid', gap: 8, background: 'linear-gradient(180deg,#101827,#0b1320)', border: '1px solid rgba(148,163,184,.14)', color: '#fff', textDecoration: 'none' }
const mainGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1fr', gap: 12, alignItems: 'start' }
const panel: React.CSSProperties = { borderRadius: 15, padding: 18, background: 'linear-gradient(180deg,#0d1726,#09111e)', border: '1px solid rgba(14,165,233,.24)', boxShadow: '0 22px 70px rgba(0,0,0,.24)' }
const panelHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 14 }
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,.04)', color: '#fff', textDecoration: 'none', marginBottom: 9 }
const moduleGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }
const moduleCard: React.CSSProperties = { padding: 13, borderRadius: 12, background: 'rgba(255,255,255,.04)', color: '#fff', textDecoration: 'none', display: 'grid', gap: 5 }
const activityRow: React.CSSProperties = { display: 'grid', gap: 5, padding: 13, borderRadius: 12, background: 'rgba(255,255,255,.04)', color: '#fff', textDecoration: 'none', marginBottom: 8 }
const smartControls: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'end', marginBottom: 16 }
const buttonRow: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }
const plainButton: React.CSSProperties = { border: '1px solid rgba(148,163,184,.14)', cursor: 'pointer', padding: '10px 13px', borderRadius: 11, background: 'rgba(255,255,255,.045)', color: '#94a3b8', fontWeight: 950 }
const activeButton: React.CSSProperties = { ...plainButton, background: 'linear-gradient(135deg,#7c3aed,#0ea5e9)', color: '#fff' }
const layerOn: React.CSSProperties = { ...plainButton, background: 'rgba(34,197,94,.14)', borderColor: 'rgba(34,197,94,.32)', color: '#fff' }
const metricGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }
const metricCard: React.CSSProperties = { padding: 14, borderRadius: 16, background: 'linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.035))', border: '1px solid rgba(148,163,184,.14)', display: 'grid', gap: 7 }
const chartShell: React.CSSProperties = { position: 'relative', minHeight: 420, borderRadius: 20, overflow: 'hidden', background: 'radial-gradient(circle at 45% 8%,rgba(124,58,237,.30),transparent 42%), linear-gradient(180deg,rgba(15,23,42,.98),rgba(8,15,28,.98))', border: '1px solid rgba(148,163,184,.18)' }
const chartSvg: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' }
const axis: React.CSSProperties = { position: 'absolute', left: 58, right: 40, bottom: 18, display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 12, fontWeight: 900 }
