'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Snapshot = {
  mode?: string
  loadedAt?: string
  kpis?: Array<{ label: string; value: string; href: string; icon: string }>
  priorityFamilies?: Array<{ name: string; issue: string; priority: string; href: string }>
  leadQueue?: Array<{ name: string; stage: string; action: string; href: string }>
  activity?: Array<{ title: string; time: string; href: string }>
  sync?: Array<{ module: string; table: string; count: number; href: string }>
}

const fallbackSnapshot: Snapshot = {
  mode: 'fallback-ui',
  loadedAt: new Date().toISOString(),
  kpis: [
    { label: 'Revenue Recovered', value: '182K MAD', href: '/revenue-command-center', icon: '💎' },
    { label: 'Families at Risk', value: '12', href: '/families', icon: '🏡' },
    { label: 'Pending Follow-ups', value: '31', href: '/leads', icon: '📞' },
    { label: 'Activation SLA', value: '92%', href: '/services', icon: '🧩' },
    { label: 'Open Escalations', value: '11', href: '/incidents', icon: '🚨' },
  ],
  priorityFamilies: [
    { name: 'Famille El Mansouri', issue: 'Proposal hesitation', priority: 'critical', href: '/revenue-command-center' },
    { name: 'Famille Benali', issue: 'Activation blocked', priority: 'warning', href: '/services' },
    { name: 'Famille Idrissi', issue: 'Complaint escalation', priority: 'critical', href: '/incidents' },
    { name: 'Famille Alaoui', issue: 'Renewal opportunity', priority: 'boost', href: '/sales' },
  ],
  leadQueue: [
    { name: 'Crèche Les Petits Génies', stage: 'B2B warm lead', action: 'Schedule visit', href: '/leads' },
    { name: 'Famille Berrada', stage: 'WhatsApp inquiry', action: 'Call within 2h', href: '/voice-center' },
    { name: 'Famille Tazi', stage: 'Pricing objection', action: 'Send value package', href: '/revenue-command-center' },
  ],
  activity: [
    { title: 'Complaint escalated', time: '2 min ago', href: '/incidents' },
    { title: 'Recovery call completed', time: '18 min ago', href: '/voice-center' },
    { title: 'Family activation approved', time: '42 min ago', href: '/services' },
    { title: 'Revenue follow-up assigned', time: '1h ago', href: '/revenue-command-center/tasks' },
  ],
  sync: [
    { module: 'Leads', table: 'leads', count: 0, href: '/leads' },
    { module: 'Families', table: 'families', count: 0, href: '/families' },
    { module: 'Services', table: 'services', count: 0, href: '/services' },
    { module: 'Revenue', table: 'revenue', count: 0, href: '/revenue-command-center' },
    { module: 'Incidents', table: 'incidents', count: 0, href: '/incidents' },
    { module: 'Tasks', table: 'tasks', count: 0, href: '/revenue-command-center/tasks' },
  ],
}

export default function CSAExecutiveCommandCenterV5Live() {
  const [snapshot, setSnapshot] = useState<Snapshot>(fallbackSnapshot)
  const [status, setStatus] = useState<'loading' | 'live' | 'fallback'>('loading')

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const res = await fetch('/api/csa/live-snapshot', { cache: 'no-store' })
        const json = await res.json()

        if (!alive) return

        if (json?.ok && json?.snapshot) {
          setSnapshot({ ...fallbackSnapshot, ...json.snapshot })
          setStatus(json.snapshot.mode === 'fallback' ? 'fallback' : 'live')
        } else {
          setStatus('fallback')
        }
      } catch {
        if (alive) setStatus('fallback')
      }
    }

    load()
    const timer = setInterval(load, 45000)

    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [])

  const kpis = snapshot.kpis?.length ? snapshot.kpis : fallbackSnapshot.kpis!
  const priorityFamilies = snapshot.priorityFamilies?.length ? snapshot.priorityFamilies : fallbackSnapshot.priorityFamilies!
  const leadQueue = snapshot.leadQueue?.length ? snapshot.leadQueue : fallbackSnapshot.leadQueue!
  const activity = snapshot.activity?.length ? snapshot.activity : fallbackSnapshot.activity!
  const sync = snapshot.sync?.length ? snapshot.sync : fallbackSnapshot.sync!

  const pulseScore = useMemo(() => {
    const total = sync.reduce((sum, item) => sum + (Number(item.count) || 0), 0)
    if (total > 100) return '96%'
    if (total > 30) return '91%'
    return '84%'
  }, [sync])

  return (
    <div style={page}>
      <aside style={side}>
        <div style={brand}>
          <div style={logo}>🎧</div>
          <div>
            <strong>C.S.A OPS</strong>
            <p>Executive Control Tower</p>
          </div>
        </div>

        <div style={rail}>
          {[
            ['Mission Control', '/csa-home', status === 'live' ? 'LIVE' : 'SAFE'],
            ['Families', '/families', String(sync.find((x) => x.module === 'Families')?.count ?? '—')],
            ['Leads', '/leads', String(sync.find((x) => x.module === 'Leads')?.count ?? '—')],
            ['Revenue Risk', '/revenue-command-center', 'SYNC'],
            ['Escalations', '/incidents', String(sync.find((x) => x.module === 'Incidents')?.count ?? '—')],
            ['Voice', '/voice-center', 'ON'],
          ].map(([label, href, badge]) => (
            <Link key={label} href={href} style={nav}>
              <span>{label}</span>
              <b>{badge}</b>
            </Link>
          ))}
        </div>

        <div style={aiBox}>
          <span>LIVE SYNC ENGINE</span>
          <strong>{status === 'live' ? 'Connected to operational modules.' : 'Safe fallback mode active.'}</strong>
          <p>Leads, families, services, incidents and tasks are checked every 45 seconds.</p>
        </div>
      </aside>

      <main style={main}>
        <header style={hero}>
          <div>
            <div style={badge}>LIVE EXECUTION GRID · {status.toUpperCase()}</div>
            <h1 style={title}>Customer Success Executive Command Center</h1>
            <p style={sub}>
              AI-native operational war room synchronized with families, leads, services,
              revenue recovery, escalations and communications.
            </p>

            <div style={actions}>
              <Link href="/voice-center" style={primary}>Open Voice Recovery</Link>
              <Link href="/revenue-command-center" style={secondary}>Revenue Risk</Link>
              <Link href="/families" style={secondary}>Families</Link>
              <Link href="/api/csa/live-snapshot" style={secondary}>Live Snapshot</Link>
            </div>
          </div>

          <div style={mission}>
            <span>Operational Pulse</span>
            <strong>{pulseScore}</strong>
            <p>Mode: {snapshot.mode || 'fallback'} · Loaded: {snapshot.loadedAt || '—'}</p>
            <div style={live} />
          </div>
        </header>

        <section style={kpiGrid}>
          {kpis.slice(0, 5).map((kpi) => (
            <Link key={kpi.label} href={kpi.href} style={kpiCard}>
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <em>{kpi.icon} Live synchronized</em>
            </Link>
          ))}
        </section>

        <section style={grid}>
          <div style={left}>
            <div style={panel}>
              <div style={head}>
                <h2>Live Recovery Board</h2>
                <Link href="/families">Open →</Link>
              </div>

              {priorityFamilies.slice(0, 6).map((item) => (
                <Link key={`${item.name}-${item.issue}`} href={item.href} style={row}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.issue}</p>
                  </div>
                  <b>{item.priority}</b>
                </Link>
              ))}
            </div>

            <div style={panel}>
              <div style={head}>
                <h2>Lead Recovery Queue</h2>
                <Link href="/leads">Open →</Link>
              </div>

              {leadQueue.slice(0, 5).map((item) => (
                <Link key={`${item.name}-${item.action}`} href={item.href} style={row}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.stage}</p>
                  </div>
                  <b>{item.action}</b>
                </Link>
              ))}
            </div>
          </div>

          <div style={center}>
            <div style={big}>
              <div style={head}>
                <h2>Module Synchronization Matrix</h2>
                <Link href="/reports">Analytics →</Link>
              </div>

              <div style={matrix}>
                {sync.map((item) => (
                  <Link key={item.module} href={item.href} style={cell}>
                    <span>{item.module}</span>
                    <strong>{item.count}</strong>
                    <p>{item.table}</p>
                  </Link>
                ))}
              </div>

              <div style={bars}>
                {sync.slice(0, 6).map((item) => (
                  <div key={item.module} style={{ height: Math.max(34, Math.min(230, 34 + Number(item.count || 0) * 3)) }} />
                ))}
              </div>
            </div>
          </div>

          <div style={right}>
            <div style={panel}>
              <div style={head}>
                <h2>Quick Execution Dock</h2>
              </div>

              <div style={dock}>
                {[
                  ['Call', '/voice-center'],
                  ['Recover', '/revenue-command-center'],
                  ['Activate', '/services'],
                  ['Escalate', '/incidents'],
                  ['Families', '/families'],
                  ['Tasks', '/revenue-command-center/tasks'],
                ].map(([label, href]) => (
                  <Link key={label} href={href} style={dockBtn}>{label}</Link>
                ))}
              </div>
            </div>

            <div style={panel}>
              <div style={head}>
                <h2>Live Activity Stream</h2>
              </div>

              {activity.slice(0, 7).map((item) => (
                <Link key={`${item.title}-${item.time}`} href={item.href} style={feed}>
                  <strong>{item.title}</strong>
                  <span>{item.time}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

const page: React.CSSProperties = { display: 'grid', gridTemplateColumns: '300px 1fr', minHeight: '100vh', background: '#020617', color: '#fff', fontFamily: 'Inter, Arial' }
const side: React.CSSProperties = { padding: 24, background: 'linear-gradient(180deg,#020617,#071226)', borderRight: '1px solid rgba(255,255,255,.08)' }
const brand: React.CSSProperties = { display: 'flex', gap: 14, alignItems: 'center', marginBottom: 24 }
const logo: React.CSSProperties = { width: 56, height: 56, borderRadius: 20, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#0ea5e9,#8b5cf6)', fontSize: 24 }
const rail: React.CSSProperties = { display: 'grid', gap: 10 }
const nav: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,.05)', textDecoration: 'none', color: '#fff', fontWeight: 800 }
const aiBox: React.CSSProperties = { marginTop: 28, padding: 18, borderRadius: 22, background: 'rgba(14,165,233,.12)', border: '1px solid rgba(14,165,233,.25)', display: 'grid', gap: 8 }
const main: React.CSSProperties = { padding: 28, display: 'grid', gap: 18 }
const hero: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, padding: 28, borderRadius: 34, background: 'linear-gradient(135deg,#082f49,#0f172a,#172554)', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 40px 120px rgba(2,6,23,.45)' }
const badge: React.CSSProperties = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, background: 'rgba(239,68,68,.18)', color: '#fca5a5', fontWeight: 900, fontSize: 12 }
const title: React.CSSProperties = { fontSize: 52, lineHeight: 1.02, margin: '16px 0' }
const sub: React.CSSProperties = { fontSize: 18, color: '#cbd5e1', maxWidth: 800 }
const actions: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 22 }
const primary: React.CSSProperties = { padding: '14px 18px', borderRadius: 16, background: '#ef4444', textDecoration: 'none', color: '#fff', fontWeight: 900 }
const secondary: React.CSSProperties = { padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,.08)', textDecoration: 'none', color: '#fff', fontWeight: 900 }
const mission: React.CSSProperties = { padding: 24, borderRadius: 26, background: 'rgba(255,255,255,.06)', display: 'grid', gap: 10 }
const live: React.CSSProperties = { height: 10, borderRadius: 999, background: 'linear-gradient(90deg,#22c55e,#38bdf8,#8b5cf6)' }
const kpiGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }
const kpiCard: React.CSSProperties = { padding: 18, borderRadius: 22, background: 'linear-gradient(180deg,#0f172a,#111827)', border: '1px solid rgba(255,255,255,.06)', display: 'grid', gap: 8, color: '#fff', textDecoration: 'none' }
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1.2fr .7fr', gap: 18, alignItems: 'start' }
const left: React.CSSProperties = { display: 'grid', gap: 18 }
const center: React.CSSProperties = { display: 'grid', gap: 18 }
const right: React.CSSProperties = { display: 'grid', gap: 18 }
const panel: React.CSSProperties = { padding: 22, borderRadius: 28, background: '#0f172a', border: '1px solid rgba(255,255,255,.06)' }
const big: React.CSSProperties = { padding: 22, borderRadius: 28, background: '#0f172a', border: '1px solid rgba(255,255,255,.06)' }
const head: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: 16 }
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 16, borderRadius: 18, background: 'rgba(255,255,255,.04)', marginBottom: 10, color: '#fff', textDecoration: 'none' }
const matrix: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }
const cell: React.CSSProperties = { padding: 18, borderRadius: 18, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 8, color: '#fff', textDecoration: 'none' }
const bars: React.CSSProperties = { height: 260, display: 'flex', alignItems: 'end', gap: 16, marginTop: 24 }
const dock: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }
const dockBtn: React.CSSProperties = { padding: '18px 14px', borderRadius: 18, background: 'rgba(255,255,255,.05)', textDecoration: 'none', color: '#fff', fontWeight: 900, textAlign: 'center' }
const feed: React.CSSProperties = { display: 'grid', gap: 5, padding: 14, borderBottom: '1px solid rgba(255,255,255,.08)', color: '#fff', textDecoration: 'none' }
