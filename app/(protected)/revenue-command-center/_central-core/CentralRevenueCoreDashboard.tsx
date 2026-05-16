'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Activity, AlertTriangle, BarChart3, Bell, BriefcaseBusiness, CalendarDays, CheckSquare, ChevronRight, Command, Filter, GitBranch, Handshake, LayoutDashboard, Megaphone, Mic, Network, Plus, RefreshCcw, Search, ShieldCheck, Target, Users, Zap } from 'lucide-react'

type ModuleKey = 'prospects' | 'appointments' | 'sdr' | 'daily-tasks' | 'campaigns' | 'partnerships' | 'analytics' | 'executive-briefing' | 'follow-ups' | 'b2c-workflow' | 'decision-maps'
type StageKey = 'prospecting' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'blocked' | 'lost'

type RecordRow = {
  id: string
  module: ModuleKey
  title: string
  account: string
  owner: string
  stage: StageKey
  status: string
  priority: string
  value_mad: number
  probability: number
  due_at: string | null
  updated_at: string
}

type Snapshot = {
  records: RecordRow[]
  totals: { pipelineMad: number; openRecords: number; wonMad: number; forecastMad: number; meetingsToday: number; winRate: number; avgDealSizeMad: number; salesCycleDays: number; forecastAccuracy: number }
  stageTotals: Array<{ stage: StageKey; label: string; valueMad: number; count: number }>
  moduleTotals: Array<{ module: ModuleKey; label: string; count: number; valueMad: number; critical: number }>
  alerts: RecordRow[]
  schedule: RecordRow[]
  activity: RecordRow[]
  opportunities: RecordRow[]
}

const blank: Snapshot = {
  records: [],
  totals: { pipelineMad: 0, openRecords: 0, wonMad: 0, forecastMad: 0, meetingsToday: 0, winRate: 0, avgDealSizeMad: 0, salesCycleDays: 0, forecastAccuracy: 0 },
  stageTotals: [], moduleTotals: [], alerts: [], schedule: [], activity: [], opportunities: []
}

const moduleMeta: Array<{ key: ModuleKey; label: string; href: string; icon: any; description: string; gradient: string; accent: string }> = [
  { key: 'prospects', label: 'Prospects', href: '/revenue-command-center/prospects', icon: Users, description: 'Create, qualify, score and move prospects through the live pipeline.', gradient: 'linear-gradient(135deg,#22d3ee,#2563eb)', accent: '#38bdf8' },
  { key: 'appointments', label: 'Appointments', href: '/revenue-command-center/appointments', icon: CalendarDays, description: 'Schedule meetings, conversion calls and revenue follow-through.', gradient: 'linear-gradient(135deg,#60a5fa,#4f46e5)', accent: '#60a5fa' },
  { key: 'sdr', label: 'SDR Hub', href: '/revenue-command-center/sdr-execution', icon: Network, description: 'Operate SDR actions, ownership, recovery and qualification velocity.', gradient: 'linear-gradient(135deg,#a78bfa,#7c3aed)', accent: '#a78bfa' },
  { key: 'daily-tasks', label: 'Daily Tasks', href: '/revenue-command-center/daily-desk', icon: CheckSquare, description: 'Live task queue, execution discipline, blockers and next actions.', gradient: 'linear-gradient(135deg,#facc15,#f97316)', accent: '#fbbf24' },
  { key: 'campaigns', label: 'Campaigns', href: '/revenue-command-center/campaigns', icon: Megaphone, description: 'Campaign production, activation, pipeline source and revenue impact.', gradient: 'linear-gradient(135deg,#f472b6,#be123c)', accent: '#fb7185' },
  { key: 'partnerships', label: 'Partnerships', href: '/revenue-command-center/partnerships', icon: Handshake, description: 'Strategic B2B partnerships, channel conversion and account growth.', gradient: 'linear-gradient(135deg,#fde047,#ea580c)', accent: '#f59e0b' },
  { key: 'follow-ups', label: 'Follow-Ups', href: '/revenue-command-center/follow-ups', icon: RefreshCcw, description: 'Automated follow-up control, overdue recovery and retention pressure.', gradient: 'linear-gradient(135deg,#34d399,#059669)', accent: '#34d399' },
  { key: 'b2c-workflow', label: 'B2C Workflow', href: '/revenue-command-center/b2c-workflow', icon: GitBranch, description: 'B2C journey flow, conversion movement and customer routing.', gradient: 'linear-gradient(135deg,#c084fc,#a21caf)', accent: '#d946ef' },
  { key: 'decision-maps', label: 'Decision Maps', href: '/revenue-command-center/decision-maps', icon: Target, description: 'Decision makers, influence paths, blockers and approval mapping.', gradient: 'linear-gradient(135deg,#fb7185,#e11d48)', accent: '#f43f5e' },
  { key: 'executive-briefing', label: 'Executive Briefing', href: '/revenue-command-center/executive-briefing', icon: BriefcaseBusiness, description: 'Executive reports, risks, forecasts and action briefings.', gradient: 'linear-gradient(135deg,#818cf8,#2563eb)', accent: '#818cf8' },
]

const C = {
  bg: '#020817', panel: '#081522', card: '#0d1b2b', card2: '#112235', border: 'rgba(148, 211, 255, .22)',
  text: '#f8fafc', text2: '#dbeafe', muted: '#b8c7dc', faint: '#94a3b8', cyan: '#67e8f9', green: '#34d399', red: '#fb7185', violet: '#a78bfa'
}

const s: Record<string, CSSProperties> = {
  root: { minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' },
  glow: { position: 'fixed', inset: 0, background: 'radial-gradient(circle at 17% 2%, rgba(59,130,246,.22), transparent 30%), radial-gradient(circle at 82% 0%, rgba(168,85,247,.24), transparent 35%), linear-gradient(135deg,#020817,#071426 52%,#030712)', pointerEvents: 'none' },
  layout: { position: 'relative', display: 'grid', gridTemplateColumns: '292px minmax(0,1fr)', minHeight: '100vh' },
  aside: { position: 'sticky', top: 0, height: '100vh', borderRight: '1px solid rgba(255,255,255,.10)', background: 'rgba(4,16,29,.96)', padding: 18, backdropFilter: 'blur(22px)' },
  page: { padding: '18px 22px 34px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, borderBottom: '1px solid rgba(255,255,255,.10)', paddingBottom: 16, marginBottom: 16 },
  input: { height: 42, width: 560, borderRadius: 14, border: `1px solid ${C.border}`, background: '#050b18', color: C.text, padding: '0 16px 0 44px', outline: 'none', fontWeight: 700 },
  btn: { height: 42, borderRadius: 14, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,.08)', color: C.text, padding: '0 14px', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', textDecoration: 'none' },
  primaryBtn: { height: 42, borderRadius: 14, border: '1px solid rgba(124,58,237,.55)', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', padding: '0 16px', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', textDecoration: 'none' },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 350px', gap: 16 },
  card: { borderRadius: 24, border: `1px solid ${C.border}`, background: 'linear-gradient(180deg,rgba(13,27,43,.98),rgba(8,21,34,.98))', boxShadow: '0 24px 80px rgba(0,0,0,.34)', color: C.text },
  cardPad: { padding: 18 },
  title: { margin: 0, color: C.text, fontWeight: 950, letterSpacing: '-.03em' },
  subtitle: { margin: '4px 0 0', color: C.muted, fontWeight: 700 },
  navLabel: { margin: '22px 8px 10px', color: C.muted, fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.22em' },
  tableHead: { position: 'sticky', top: 0, background: '#0d1b2b', color: C.text2, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.18em' }
}

function mad(value: number) {
  if (!Number.isFinite(value)) return '0 MAD'
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(2)}M MAD`
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}K MAD`
  return `${Math.round(value)} MAD`
}
function timeLabel(value: string | null) { if (!value) return 'No date'; return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(new Date(value)) }
function safeRows<T>(rows: T[] | undefined, fallback: T[] = []) { return Array.isArray(rows) && rows.length ? rows : fallback }

export default function CentralRevenueCoreDashboard({ focus }: { focus?: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(blank)
  const [loading, setLoading] = useState(true)
  const [syncedAt, setSyncedAt] = useState('')
  const [query, setQuery] = useState('')
  const [quick, setQuick] = useState('')
  const [view, setView] = useState<'forecast' | 'pipeline' | 'modules' | 'owners'>('forecast')
  const [moduleFilter, setModuleFilter] = useState<ModuleKey | 'all'>('all')

  async function load() {
    const response = await fetch('/api/revenue-command-center/central-core', { cache: 'no-store' })
    const json = await response.json()
    if (json?.snapshot) setSnapshot(json.snapshot)
    if (json?.syncedAt) setSyncedAt(json.syncedAt)
    setLoading(false)
  }
  useEffect(() => { load().catch(() => setLoading(false)); const interval = window.setInterval(() => load().catch(() => null), 9000); return () => window.clearInterval(interval) }, [])

  async function createQuick() {
    if (!quick.trim()) return
    await fetch('/api/revenue-command-center/central-core', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: quick.trim(), account: 'Quick revenue action', owner: 'Central Revenue Core', module: (focus as ModuleKey) || (moduleFilter === 'all' ? 'prospects' : moduleFilter), stage: 'prospecting', status: 'open', priority: 'high', value_mad: 25000, probability: 35 }) })
    setQuick('')
    await load()
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return snapshot.records.filter((r) => (moduleFilter === 'all' || r.module === moduleFilter) && (!q || [r.title, r.account, r.owner, r.module, r.stage, r.status].join(' ').toLowerCase().includes(q)))
  }, [snapshot.records, query, moduleFilter])

  const maxStage = Math.max(...snapshot.stageTotals.map(s => s.valueMad), 1)
  const ownerRows = useMemo(() => {
    const map = new Map<string, { label: string; value: number; count: number }>()
    snapshot.records.forEach(r => { const prev = map.get(r.owner) || { label: r.owner || 'Unassigned', value: 0, count: 0 }; prev.value += r.value_mad || 0; prev.count += 1; map.set(prev.label, prev) })
    return Array.from(map.values()).sort((a,b)=>b.value-a.value).slice(0,8)
  }, [snapshot.records])
  const performanceRows = useMemo(() => {
    if (view === 'modules') return snapshot.moduleTotals.map(m => ({ label: m.label, value: m.valueMad, count: m.count, href: moduleMeta.find(x=>x.key===m.module)?.href || '/revenue-command-center', score: Math.max(14, Math.round((m.valueMad / Math.max(snapshot.totals.pipelineMad,1))*100)) }))
    if (view === 'pipeline') return snapshot.stageTotals.map(st => ({ label: st.label, value: st.valueMad, count: st.count, href: `/revenue-command-center/prospects?stage=${st.stage}`, score: Math.max(14, Math.round((st.valueMad / maxStage)*100)) }))
    if (view === 'owners') return ownerRows.map(o => ({ ...o, href: `/revenue-command-center?owner=${encodeURIComponent(o.label)}`, score: Math.max(14, Math.round((o.value / Math.max(ownerRows[0]?.value || 1,1))*100)) }))
    const base = Math.max(snapshot.totals.forecastMad, snapshot.totals.pipelineMad, 1)
    return ['Baseline','Qualified','Proposal','Negotiation','Weighted','Committed','Best Case'].map((label, i) => ({ label, value: Math.round(base * [.28,.38,.48,.58,.70,.84,1][i]), count: i+1, href: '/revenue-command-center/revenue-analytics', score: [24,34,44,55,67,80,94][i] }))
  }, [view, snapshot, ownerRows, maxStage])

  const activeModules = moduleMeta.map(m => ({ ...m, total: snapshot.moduleTotals.find(t => t.module === m.key) }))

  return <main style={s.root} className="rcc-force-contrast">
    <style>{`
      .rcc-force-contrast, .rcc-force-contrast * { box-sizing: border-box; }
      .rcc-force-contrast h1, .rcc-force-contrast h2, .rcc-force-contrast h3, .rcc-force-contrast p, .rcc-force-contrast span, .rcc-force-contrast b, .rcc-force-contrast strong, .rcc-force-contrast td, .rcc-force-contrast th, .rcc-force-contrast a, .rcc-force-contrast button, .rcc-force-contrast input { color: inherit; }
      .rcc-force-contrast a { text-decoration: none; }
      .rcc-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
      .rcc-scroll::-webkit-scrollbar-thumb { background: rgba(103,232,249,.42); border-radius: 999px; }
      .rcc-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,.06); }
    `}</style>
    <div style={s.glow} />
    <div style={s.layout}>
      <aside style={s.aside}>
        <Link href="/revenue-command-center" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30, color: C.text }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#d946ef,#7c3aed,#22d3ee)', fontWeight: 950, fontSize: 22 }}>A</div>
          <div><div style={{ fontSize: 18, fontWeight: 950, letterSpacing: '.04em' }}>ANGELCARE</div><div style={{ color: C.text2, fontSize: 12, fontWeight: 800 }}>Strategic Business Development</div></div>
        </Link>
        <NavGroup title="Command HQ" items={[{ href: '/revenue-command-center', label: 'Command Center', icon: Command }]} />
        <NavGroup title="Central Revenue Core" items={moduleMeta.slice(0,9).map(m=>({ href: m.href, label: m.label, icon: m.icon }))} />
        <NavGroup title="Intelligence" items={[{ href: '/revenue-command-center/revenue-analytics', label: 'Revenue Analytics', icon: BarChart3 }, { href: '/revenue-command-center/executive-briefing', label: 'Executive Briefing', icon: ShieldCheck }]} />
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
          <div style={{ ...s.card, padding: 14, borderColor: 'rgba(52,211,153,.28)' }}><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><ShieldCheck style={{ color: C.green }} /><div><p style={{ margin: 0, color: C.text, fontWeight: 950 }}>System Status</p><p style={{ margin: 0, color: C.green, fontWeight: 900 }}>Live central core</p><p style={{ margin: 0, color: C.muted, fontSize: 12 }}>{syncedAt ? `Synced ${timeLabel(syncedAt)}` : loading ? 'Syncing now' : 'Ready'}</p></div></div></div>
        </div>
      </aside>

      <section style={s.page}>
        <header style={s.header}>
          <div style={{ position: 'relative' }}><Search size={18} style={{ position: 'absolute', left: 15, top: 12, color: C.muted }} /><input style={s.input} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search prospects, accounts, deals, tasks..." /></div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><button onClick={load} style={s.btn}><RefreshCcw size={16}/>Refresh live</button><Link href="/revenue-command-center/daily-desk" style={s.primaryBtn}><Plus size={17}/>Create action</Link><Bell style={{ color: C.text2 }}/><span style={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: 999, background: '#4f46e5', fontWeight: 950 }}>AE</span></div>
        </header>

        <div style={s.grid}>
          <div style={{ display: 'grid', gap: 16 }}>
            <section><h1 style={{ ...s.title, fontSize: 26 }}>Angelcare Strategic Business Development Command Center 🛡️</h1><p style={{ ...s.subtitle, fontSize: 15 }}>Live MAD revenue intelligence, pipeline movement and execution control connected to the central revenue core.</p></section>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12 }}>
              <Kpi icon={Target} label="Pipeline Value" value={mad(snapshot.totals.pipelineMad)} sub="live central baseline" />
              <Kpi icon={BriefcaseBusiness} label="Open Records" value={String(snapshot.totals.openRecords)} sub={`${filtered.length} visible records`} />
              <Kpi icon={Megaphone} label="Won This Month" value={mad(snapshot.totals.wonMad)} sub="synced from closed-won" />
              <Kpi icon={BarChart3} label="Forecast" value={mad(snapshot.totals.forecastMad)} sub="weighted MAD forecast" />
              <Kpi icon={CalendarDays} label="Meetings Today" value={String(snapshot.totals.meetingsToday)} sub="view agenda →" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 14 }}>
              <Card title="Revenue Pipeline Overview" action={<Link href="/revenue-command-center/prospects" style={{ color: C.cyan, fontWeight: 900 }}>Open pipeline</Link>}>
                <h3 style={{ margin: '4px 0', color: C.text, fontSize: 28 }}>{mad(snapshot.totals.pipelineMad)}</h3><p style={{ margin: 0, color: C.green, fontWeight: 900 }}>↑ live MAD pipeline by stage</p>
                <div style={{ height: 145, display: 'flex', alignItems: 'end', gap: 14, marginTop: 14 }}>{snapshot.stageTotals.slice(0,5).map((st,i)=><Link key={st.stage} href={`/revenue-command-center/prospects?stage=${st.stage}`} style={{ flex: 1, color: C.text, textAlign: 'center' }}><div style={{ height: `${Math.max(34, (st.valueMad/maxStage)*118)}px`, borderRadius: '10px 10px 0 0', background: ['linear-gradient(#60a5fa,#2563eb)','linear-gradient(#34d399,#059669)','linear-gradient(#fde047,#f97316)','linear-gradient(#f472b6,#be185d)','linear-gradient(#c084fc,#7c3aed)'][i], boxShadow: '0 12px 30px rgba(0,0,0,.25)' }} /><p style={{ margin: '8px 0 0', color: C.text2, fontSize: 12, fontWeight: 900 }}>{st.label}</p><b style={{ color: C.text }}>{mad(st.valueMad)}</b></Link>)}</div>
              </Card>
              <Card title="Revenue Performance Control Room" action={<Link href="/revenue-command-center/revenue-analytics" style={{ color: C.cyan, fontWeight: 900 }}>Open analytics</Link>}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'end' }}><div><h3 style={{ margin: '4px 0', color: C.text, fontSize: 28 }}>{mad(view === 'forecast' ? snapshot.totals.forecastMad : performanceRows.reduce((a,b)=>a+b.value,0))}</h3><p style={{ margin: 0, color: C.green, fontWeight: 900 }}>↑ live, clickable and synced</p></div><div style={{ display: 'flex', gap: 6 }}>{(['forecast','pipeline','modules','owners'] as const).map(v=><button key={v} onClick={()=>setView(v)} style={{ ...s.btn, height: 34, padding: '0 10px', background: view===v ? 'rgba(103,232,249,.18)' : 'rgba(255,255,255,.06)', borderColor: view===v ? 'rgba(103,232,249,.55)' : C.border, color: C.text }}>{v}</button>)}</div></div>
                <div style={{ marginTop: 16, padding: 14, borderRadius: 18, background: 'linear-gradient(135deg,rgba(76,29,149,.8),rgba(14,22,44,.9))', border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'grid', gap: 8 }}>{performanceRows.slice(0,7).map((row,i)=><Link key={row.label} href={row.href} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 98px', gap: 12, alignItems: 'center', color: C.text }}><span style={{ color: C.text2, fontWeight: 900 }}>{row.label}</span><span style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,.11)', overflow: 'hidden' }}><span style={{ display:'block', width: `${Math.min(100,row.score)}%`, height: '100%', borderRadius: 999, background: ['#60a5fa','#22c55e','#f59e0b','#ec4899','#8b5cf6','#67e8f9','#f97316'][i%7] }} /></span><b style={{ textAlign: 'right', color: C.text }}>{mad(row.value)}</b></Link>)}</div>
                </div>
              </Card>
            </div>

            <Card title="Core Modules Gateway" subtitle="No invisible text. Every card is clickable and opens the restored expert workspace." action={<select value={moduleFilter} onChange={e=>setModuleFilter(e.target.value as any)} style={{ ...s.btn, color: C.text, background: '#071426' }}><option value="all">All modules</option>{moduleMeta.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}</select>}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12, marginTop: 16 }}>{activeModules.map(m => { const Icon = m.icon; return <Link key={m.key} href={m.href} style={{ minHeight: 158, borderRadius: 20, border: `1px solid ${m.accent}55`, background: 'linear-gradient(180deg,rgba(22,37,55,.98),rgba(11,25,40,.98))', padding: 16, color: C.text, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 18px 45px rgba(0,0,0,.22)' }}><div><div style={{ width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 14, background: m.gradient, color: '#03101d', marginBottom: 12 }}><Icon size={23}/></div><div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 8 }}><h3 style={{ margin: 0, color: C.text, fontSize: 17, fontWeight: 950 }}>{m.label}</h3><ChevronRight size={19} style={{ color: C.text2 }}/></div><p style={{ margin: '6px 0 0', color: C.text2, fontWeight: 700, lineHeight: 1.35 }}>{m.description}</p></div><p style={{ margin: '10px 0 0', color: C.cyan, fontSize: 13, fontWeight: 950 }}>{m.total?.count ?? 0} synced · {mad(m.total?.valueMad ?? 0)}</p></Link> })}</div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>
              <Card title="Pipeline by Stage (MAD)" action={<Link href="/revenue-command-center/prospects" style={{ color: C.cyan, fontWeight: 900 }}>Manage</Link>}><div style={{ display:'grid', gridTemplateColumns:'150px 1fr', gap:16, alignItems:'center', marginTop: 12 }}><div style={{ width:150,height:150,borderRadius:999,display:'grid',placeItems:'center',background:'conic-gradient(#0ea5e9 0 18%,#10b981 18% 44%,#f59e0b 44% 67%,#ec4899 67% 86%,#8b5cf6 86% 100%)' }}><div style={{ width:94,height:94,borderRadius:999,display:'grid',placeItems:'center',background:C.panel,textAlign:'center',fontWeight:950,color:C.text }}>{mad(snapshot.totals.pipelineMad)}</div></div><div>{snapshot.stageTotals.slice(0,5).map(st=><Link href={`/revenue-command-center/prospects?stage=${st.stage}`} key={st.stage} style={{ display:'flex', justifyContent:'space-between', color:C.text, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,.08)' }}><span style={{ color:C.text2, fontWeight:900 }}>{st.label}</span><b>{mad(st.valueMad)}</b></Link>)}</div></div></Card>
              <Card title="Top Opportunities"><List rows={snapshot.opportunities}/></Card>
              <Card title="SDR + Owner Performance"><div style={{ marginTop: 14, display:'grid', gap: 13 }}>{safeRows(ownerRows).slice(0,5).map((row,i)=><Link href={`/revenue-command-center?owner=${encodeURIComponent(row.label)}`} key={row.label} style={{ color:C.text }}><div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}><b>{row.label}</b><span style={{ color:C.text2, fontWeight:900 }}>{mad(row.value)}</span></div><div style={{ height:9,borderRadius:999,background:'rgba(255,255,255,.12)' }}><div style={{ width:`${Math.max(12,Math.round((row.value/(ownerRows[0]?.value || 1))*100))}%`, height:9,borderRadius:999,background:i%2?'linear-gradient(90deg,#60a5fa,#818cf8)':'linear-gradient(90deg,#22c55e,#2dd4bf)' }} /></div></Link>)}</div></Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <Card title="Recent Activity Feed"><List rows={snapshot.activity} compact /></Card>
              <Card title="Tasks & Follow-Ups Overview"><div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:16 }}><MiniMetric value={String(snapshot.moduleTotals.find(m=>m.module==='daily-tasks')?.count ?? 0)} label="Tasks"/><MiniMetric value={String(snapshot.alerts.length)} label="Critical"/><MiniMetric value={String(snapshot.moduleTotals.find(m=>m.module==='follow-ups')?.count ?? 0)} label="Follow-ups"/><MiniMetric value={`${snapshot.totals.forecastAccuracy}%`} label="Accuracy"/></div></Card>
              <Card title="Quick Add to Central Core"><div style={{ marginTop: 14, display:'grid', gap:10 }}><input value={quick} onChange={e=>setQuick(e.target.value)} style={{ ...s.input, width:'100%', padding:'0 14px' }} placeholder="Add live prospect or action"/><button onClick={createQuick} style={{ ...s.primaryBtn, justifyContent:'center' }}><Plus size={18}/>Create synced record</button></div></Card>
            </div>

            <Card title="Unified Record Ledger" subtitle={`${filtered.length} live records from central revenue_core_records`} action={<button onClick={load} style={s.btn}><RefreshCcw size={16}/>Sync</button>}>
              <div className="rcc-scroll" style={{ marginTop: 14, maxHeight: 380, overflow: 'auto', border: `1px solid ${C.border}`, borderRadius: 18 }}><table style={{ width:'100%', borderCollapse:'collapse', color:C.text }}><thead style={s.tableHead}><tr><th style={{ padding: 13, textAlign:'left' }}>Record</th><th style={{ textAlign:'left' }}>Module</th><th style={{ textAlign:'left' }}>Stage</th><th style={{ textAlign:'left' }}>Status</th><th style={{ textAlign:'left' }}>Value</th><th style={{ textAlign:'left' }}>Owner</th></tr></thead><tbody>{filtered.slice(0,40).map(r=><tr key={r.id} style={{ borderTop:'1px solid rgba(255,255,255,.09)' }}><td style={{ padding:13 }}><b style={{ color:C.text }}>{r.title}</b><p style={{ margin: '3px 0 0', color:C.text2 }}>{r.account}</p></td><td style={{ color:C.text2, fontWeight:900 }}>{r.module}</td><td style={{ color:C.text2, fontWeight:900 }}>{r.stage}</td><td><span style={{ borderRadius:999, padding:'5px 9px', background:'rgba(103,232,249,.13)', color:C.text, fontWeight:900 }}>{r.status}</span></td><td style={{ color:C.text, fontWeight:950 }}>{mad(r.value_mad)}</td><td style={{ color:C.text2, fontWeight:900 }}>{r.owner}</td></tr>)}</tbody></table></div>
            </Card>
          </div>

          <aside style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <Card title="Critical Alerts"><div style={{ display:'grid', gap:10, marginTop:14 }}>{snapshot.alerts.slice(0,5).map(r=><Link href={`/revenue-command-center/${r.module}`} key={r.id} style={{ border:'1px solid rgba(251,113,133,.35)', background:'rgba(127,29,29,.30)', borderRadius:16, padding:13, color:C.text }}><div style={{ display:'flex', gap:10 }}><AlertTriangle color={C.red} size={18}/><div><b style={{ color:'#fecaca' }}>{r.title}</b><p style={{ margin:'4px 0 0', color:C.text2 }}>{r.account} · {mad(r.value_mad)}</p></div></div></Link>)}</div></Card>
            <Card title="Today's Schedule"><div style={{ display:'grid', gap:10, marginTop:14 }}>{snapshot.schedule.slice(0,5).map(r=><Link href="/revenue-command-center/appointments" key={r.id} style={{ border:`1px solid ${C.border}`, background:'rgba(255,255,255,.07)', borderRadius:16, padding:13, color:C.text }}><p style={{ margin:0, color:C.cyan, fontWeight:950 }}>{timeLabel(r.due_at)}</p><b>{r.title}</b><p style={{ margin:'4px 0 0', color:C.text2 }}>{r.account}</p></Link>)}</div></Card>
            <Card title="Smart Navigation Control"><div style={{ marginTop:14, display:'grid', gap:10 }}>{moduleMeta.slice(0,6).map(m=><Link key={m.key} href={m.href} style={{ ...s.btn, height: 42, justifyContent:'space-between' }}><span>{m.label}</span><ChevronRight size={17}/></Link>)}</div></Card>
          </aside>
        </div>
      </section>
    </div>
    <div style={{ position:'fixed', right:28, bottom:28, display:'flex', gap:12, alignItems:'center', border:`1px solid ${C.border}`, background:'rgba(8,15,30,.94)', borderRadius:28, padding:'14px 20px', boxShadow:'0 0 44px rgba(124,58,237,.42)', color:C.text }}><Mic color={C.cyan}/><div><b>Voice Terminal</b><p style={{ margin:0, color:C.muted, fontSize:12 }}>Ready for revenue command</p></div></div>
  </main>
}

function Card({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) { return <section style={{ ...s.card, padding: 18 }}><div style={{ display:'flex', justifyContent:'space-between', gap:14, alignItems:'start' }}><div><h2 style={{ margin:0, color:C.text, fontSize:18, fontWeight:950 }}>{title}</h2>{subtitle && <p style={{ margin:'4px 0 0', color:C.muted, fontWeight:700 }}>{subtitle}</p>}</div>{action || <Link href="/revenue-command-center" style={{ color:C.cyan, fontWeight:900 }}>View all</Link>}</div>
      <style jsx global>{`
        /* RCC_PARENT_SHELL_FULLWIDTH_FIX_V5 */
        .rcc-shell-main,
        .rcc-shell-content,
        .rcc-shell-content > *,
        main.rcc-shell-main > * {
          width: 100% !important;
          max-width: none !important;
          min-width: 0 !important;
        }
        [class*="revenue-command-center"] {
          max-width: none !important;
        }
      `}</style>

      {children}</section> }
function NavGroup({ title, items }: { title: string; items: Array<{ href: string; label: string; icon: any }> }) { return <div><p style={s.navLabel}>{title}</p><div style={{ display:'grid', gap:4 }}>{items.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:13, color:C.text2, fontWeight:900 }}><Icon size={18}/>{item.label}</Link> })}</div></div> }
function Kpi({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) { return <div style={{ ...s.card, padding:16 }}><div style={{ display:'flex', gap:12, alignItems:'center' }}><div style={{ width:42,height:42,borderRadius:13,display:'grid',placeItems:'center',background:'rgba(37,99,235,.24)', color:C.cyan }}><Icon size={19}/></div><div><p style={{ margin:0, color:C.muted, fontSize:11, fontWeight:950, textTransform:'uppercase', letterSpacing:'.08em' }}>{label}</p><p style={{ margin:'3px 0', color:C.text, fontSize:22, fontWeight:950 }}>{value}</p><p style={{ margin:0, color:C.green, fontSize:12, fontWeight:850 }}>{sub}</p></div></div></div> }
function List({ rows, compact=false }: { rows: RecordRow[]; compact?: boolean }) { return <div style={{ display:'grid', gap:10, marginTop:14 }}>{rows.slice(0, compact ? 4 : 5).map(r=><Link key={r.id} href={`/revenue-command-center/${r.module}`} style={{ display:'flex', alignItems:'center', gap:10, border:`1px solid ${C.border}`, background:'rgba(255,255,255,.07)', borderRadius:16, padding:12, color:C.text }}><span style={{ width:34,height:34,borderRadius:999,display:'grid',placeItems:'center',background:'rgba(167,139,250,.22)' }}><Zap size={16} color={C.violet}/></span><span style={{ minWidth:0, flex:1 }}><b style={{ display:'block', color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.title}</b><small style={{ color:C.text2, fontWeight:800 }}>{r.account} · {mad(r.value_mad)}</small></span><strong style={{ color:C.cyan }}>{r.probability}%</strong></Link>)}</div> }
function MiniMetric({ value, label }: { value: string; label: string }) { return <div style={{ border:`1px solid ${C.border}`, background:'rgba(255,255,255,.07)', borderRadius:16, padding:12 }}><p style={{ margin:0, color:C.text, fontSize:24, fontWeight:950 }}>{value}</p><p style={{ margin:0, color:C.muted, fontSize:12, fontWeight:900 }}>{label}</p></div> }
