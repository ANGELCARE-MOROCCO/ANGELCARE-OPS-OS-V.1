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

const executiveFallback: Snapshot = {
  mode: 'executive-safe',
  loadedAt: new Date().toISOString(),
  kpis: [
    { label: 'Revenue Recovery Value', value: '41.8K MAD', href: '/revenue-command-center', icon: '💎' },
    { label: 'Families Requiring Action', value: '32', href: '/families', icon: '🏡' },
    { label: 'Leads To Recover', value: '47', href: '/leads', icon: '📞' },
    { label: 'Services Awaiting Activation', value: '22', href: '/services', icon: '🧩' },
    { label: 'Escalations Open', value: '11', href: '/incidents', icon: '🚨' },
  ],
  priorityFamilies: [
    { name: 'Famille El Mansouri', issue: 'Proposal hesitation · revenue recovery required', priority: 'Critical', href: '/revenue-command-center' },
    { name: 'Famille Benali', issue: 'Service launch blocked · activation desk action', priority: 'Critical', href: '/services' },
    { name: 'Famille Idrissi', issue: 'Complaint recovery · family satisfaction risk', priority: 'High', href: '/incidents' },
    { name: 'Famille Alaoui', issue: 'Renewal opportunity · sales handoff required', priority: 'Medium', href: '/sales' },
  ],
  leadQueue: [
    { name: 'Crèche Les Petits Génies', stage: 'B2B partnership lead', action: 'Schedule visit', href: '/leads' },
    { name: 'Famille Berrada', stage: 'WhatsApp inquiry', action: 'Call within 2h', href: '/voice-center' },
    { name: 'Famille Tazi', stage: 'Pricing objection', action: 'Send value package', href: '/revenue-command-center' },
  ],
  activity: [
    { title: 'Revenue recovery follow-up assigned', time: 'Live', href: '/revenue-command-center/tasks' },
    { title: 'Service activation approved', time: 'Live', href: '/services' },
    { title: 'Complaint marked high priority', time: 'Live', href: '/incidents' },
  ],
  sync: [
    { module: 'Revenue Management', table: 'revenue', count: 12, href: '/revenue-command-center' },
    { module: 'Services Module', table: 'services', count: 22, href: '/services' },
    { module: 'Sales Module', table: 'sales', count: 8, href: '/sales' },
    { module: 'Leads Module', table: 'leads', count: 47, href: '/leads' },
    { module: 'Families Module', table: 'families', count: 32, href: '/families' },
    { module: 'Complaints & Escalations', table: 'incidents', count: 11, href: '/incidents' },
  ],
}

const operatingModules = [
  {
    title: 'Revenue Recovery Command',
    href: '/revenue-command-center',
    subtitle: 'Recover delayed decisions, protect revenue, close hesitations and coordinate payment risk.',
    badge: 'Revenue',
    icon: '💎',
  },
  {
    title: 'Services Activation Desk',
    href: '/services',
    subtitle: 'Track service readiness, activation blockers, start conditions and family confirmations.',
    badge: 'Services',
    icon: '🧩',
  },
  {
    title: 'Sales Handoff Control',
    href: '/sales',
    subtitle: 'Synchronize sales notes, proposal follow-up, objections and conversion handoffs.',
    badge: 'Sales',
    icon: '🚀',
  },
  {
    title: 'Lead Recovery Queue',
    href: '/leads',
    subtitle: 'Prioritize hot leads, WhatsApp inquiries, callback delays and B2B opportunities.',
    badge: 'Leads',
    icon: '📞',
  },
  {
    title: 'Families Success Center',
    href: '/families',
    subtitle: 'Monitor family satisfaction, lifecycle notes, account health and retention signals.',
    badge: 'Families',
    icon: '🏡',
  },
  {
    title: 'Complaints & Escalations',
    href: '/incidents',
    subtitle: 'Resolve complaints, urgent incidents, family frustration and operational risks.',
    badge: 'Risk',
    icon: '🚨',
  },
]

function moduleCount(sync: Snapshot['sync'], name: string) {
  const found = sync?.find((x) => x.module.toLowerCase().includes(name.toLowerCase()) || x.href.includes(name.toLowerCase()))
  return found?.count ?? '—'
}

export default function CSAExecutivePortalPremiumV6() {
  const [snapshot, setSnapshot] = useState<Snapshot>(executiveFallback)
  const [status, setStatus] = useState<'loading' | 'live' | 'safe'>('loading')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const res = await fetch('/api/csa/live-snapshot', { cache: 'no-store' })
        const json = await res.json()
        if (!active) return

        if (json?.ok && json?.snapshot) {
          const s = json.snapshot as Snapshot
          const sync = s.sync?.map((item) => {
            if (item.module === 'Leads') return { ...item, module: 'Leads Module' }
            if (item.module === 'Families') return { ...item, module: 'Families Module' }
            if (item.module === 'Services') return { ...item, module: 'Services Module' }
            if (item.module === 'Sales') return { ...item, module: 'Sales Module' }
            if (item.module === 'Incidents') return { ...item, module: 'Complaints & Escalations' }
            if (item.module === 'Tasks') return { ...item, module: 'Execution Tasks' }
            return item
          })

          setSnapshot({ ...executiveFallback, ...s, sync: sync?.length ? sync : executiveFallback.sync })
          setStatus(s.mode === 'fallback' ? 'safe' : 'live')
        } else {
          setStatus('safe')
        }
      } catch {
        setStatus('safe')
      }
    }

    load()
    const timer = setInterval(load, 45000)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  const kpis = snapshot.kpis?.length ? snapshot.kpis : executiveFallback.kpis!
  const priorityFamilies = snapshot.priorityFamilies?.length ? snapshot.priorityFamilies : executiveFallback.priorityFamilies!
  const leadQueue = snapshot.leadQueue?.length ? snapshot.leadQueue : executiveFallback.leadQueue!
  const activity = snapshot.activity?.length ? snapshot.activity : executiveFallback.activity!
  const sync = snapshot.sync?.length ? snapshot.sync : executiveFallback.sync!

  const pressure = useMemo(() => {
    const total = sync.reduce((sum, x) => sum + (Number(x.count) || 0), 0)
    if (total > 80) return 'High'
    if (total > 25) return 'Controlled'
    return 'Stable'
  }, [sync])

  return (
    <div style={page}>
      <aside style={sidebar}>
        <div style={brandBlock}>
          <div style={brandIcon}>🎧</div>
          <div>
            <div style={brandTitle}>C.S.A EXECUTIVE OS</div>
            <div style={brandSubtitle}>Client Success Authority</div>
          </div>
        </div>

        <nav style={navStack}>
          {[
            ['Executive Portal', '/csa-home', status === 'live' ? 'LIVE' : 'SAFE'],
            ['Revenue Recovery', '/revenue-command-center', moduleCount(sync, 'Revenue')],
            ['Services Activation', '/services', moduleCount(sync, 'Services')],
            ['Sales Handoff', '/sales', moduleCount(sync, 'Sales')],
            ['Lead Recovery', '/leads', moduleCount(sync, 'Leads')],
            ['Families Success', '/families', moduleCount(sync, 'Families')],
            ['Escalations', '/incidents', moduleCount(sync, 'Escalations')],
            ['Voice / WhatsApp', '/voice-center', 'ON'],
          ].map(([label, href, badge]) => (
            <Link key={label} href={String(href)} style={navItem}>
              <span>{label}</span>
              <b>{badge}</b>
            </Link>
          ))}
        </nav>

        <div style={sidebarIntelligence}>
          <span>OPERATING PRESSURE</span>
          <strong>{pressure}</strong>
          <p>Live module checks run every 45 seconds across C.S.A related modules.</p>
        </div>
      </aside>

      <main style={main}>
        <section style={hero}>
          <div>
            <div style={heroBadge}>CUSTOMER SUCCESS WAR ROOM · {status.toUpperCase()}</div>
            <h1 style={heroTitle}>C.S.A Executive Command Portal</h1>
            <p style={heroText}>
              Premium client-success operating center linked to Revenue Management, Services,
              Sales, Leads, Families, Escalations, Voice follow-up and execution tasks.
            </p>

            <div style={heroActions}>
              <Link href="/revenue-command-center" style={primaryButton}>Recover Revenue</Link>
              <Link href="/services" style={secondaryButton}>Activate Services</Link>
              <Link href="/families" style={secondaryButton}>Family Success</Link>
              <Link href="/voice-center" style={secondaryButton}>Voice / WhatsApp</Link>
            </div>
          </div>

          <div style={missionCard}>
            <span>Executive Pulse</span>
            <strong>{status === 'live' ? 'Live Synced' : 'Safe Synced'}</strong>
            <p>Mode: {snapshot.mode || 'safe'} · Loaded: {snapshot.loadedAt || '—'}</p>
            <div style={pulseLine} />
          </div>
        </section>

        <section style={kpiGrid}>
          {kpis.slice(0, 5).map((kpi) => (
            <Link key={kpi.label} href={kpi.href} style={kpiCard}>
              <div style={kpiTop}>
                <span>{kpi.label}</span>
                <b>{kpi.icon}</b>
              </div>
              <strong>{kpi.value}</strong>
              <em>Live C.S.A operational source</em>
            </Link>
          ))}
        </section>

        <section style={moduleGrid}>
          {operatingModules.map((module) => (
            <Link key={module.title} href={module.href} style={moduleCard}>
              <div style={moduleTop}>
                <span>{module.icon}</span>
                <b>{module.badge}</b>
              </div>
              <h2>{module.title}</h2>
              <p>{module.subtitle}</p>
              <strong>Open synchronized workspace →</strong>
            </Link>
          ))}
        </section>

        <section style={contentGrid}>
          <div style={leftCol}>
            <Panel title="Family Risk & Recovery Board" href="/families" action="Open Families">
              {priorityFamilies.slice(0, 6).map((item) => (
                <Link key={`${item.name}-${item.issue}`} href={item.href} style={row}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.issue}</p>
                  </div>
                  <b>{item.priority}</b>
                </Link>
              ))}
            </Panel>

            <Panel title="Lead Recovery Queue" href="/leads" action="Open Leads">
              {leadQueue.slice(0, 5).map((item) => (
                <Link key={`${item.name}-${item.action}`} href={item.href} style={row}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.stage}</p>
                  </div>
                  <b>{item.action}</b>
                </Link>
              ))}
            </Panel>
          </div>

          <div style={centerCol}>
            <Panel title="C.S.A Module Health" href="/reports" action="Analytics">
              <div style={healthGrid}>
                {sync.map((item) => (
                  <Link key={`${item.module}-${item.table}`} href={item.href} style={healthCard}>
                    <span>{item.module}</span>
                    <strong>{item.count}</strong>
                    <p>{item.href}</p>
                  </Link>
                ))}
              </div>
            </Panel>

            <Panel title="AI Next Best Actions" href="/revenue-command-center/tasks" action="Create Tasks">
              <div style={aiGrid}>
                {[
                  ['Revenue Recovery', 'Call delayed high-intent families and protect pending value.', '/revenue-command-center'],
                  ['Service Activation', 'Remove blockers for families ready to start this week.', '/services'],
                  ['Family Retention', 'Escalate satisfaction risks before churn probability increases.', '/families'],
                  ['Lead Conversion', 'Prioritize WhatsApp leads with pricing objections.', '/leads'],
                ].map(([title, text, href]) => (
                  <Link key={title} href={href} style={aiCard}>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </Link>
                ))}
              </div>
            </Panel>
          </div>

          <div style={rightCol}>
            <Panel title="Quick Execution Dock" href="/revenue-command-center/tasks" action="Tasks">
              <div style={dockGrid}>
                {[
                  ['Call', '/voice-center'],
                  ['Recover', '/revenue-command-center'],
                  ['Activate', '/services'],
                  ['Escalate', '/incidents'],
                  ['Handoff', '/sales'],
                  ['Family', '/families'],
                ].map(([label, href]) => (
                  <Link key={label} href={href} style={dockButton}>{label}</Link>
                ))}
              </div>
            </Panel>

            <Panel title="Live Activity Stream" href="/reports" action="View All">
              {activity.slice(0, 7).map((item) => (
                <Link key={`${item.title}-${item.time}`} href={item.href} style={activityRow}>
                  <strong>{item.title}</strong>
                  <span>{item.time}</span>
                </Link>
              ))}
            </Panel>
          </div>
        </section>
      </main>
    </div>
  )
}

function Panel({
  title,
  href,
  action,
  children,
}: {
  title: string
  href: string
  action: string
  children: React.ReactNode
}) {
  return (
    <section style={panel}>
      <header style={panelHeader}>
        <h2>{title}</h2>
        <Link href={href}>{action} →</Link>
      </header>
      {children}
    </section>
  )
}

const page: React.CSSProperties = { minHeight: '100vh', display: 'grid', gridTemplateColumns: '310px 1fr', background: '#eef3f8', color: '#0f172a', fontFamily: 'Inter, Arial, sans-serif' }
const sidebar: React.CSSProperties = { background: 'linear-gradient(180deg,#020617,#071226)', color: '#fff', padding: 24, display: 'grid', alignContent: 'start', gap: 24 }
const brandBlock: React.CSSProperties = { display: 'flex', gap: 14, alignItems: 'center' }
const brandIcon: React.CSSProperties = { width: 58, height: 58, borderRadius: 20, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)', fontSize: 24 }
const brandTitle: React.CSSProperties = { fontWeight: 1000, letterSpacing: 1 }
const brandSubtitle: React.CSSProperties = { color: '#93c5fd', fontSize: 12, fontWeight: 800 }
const navStack: React.CSSProperties = { display: 'grid', gap: 9 }
const navItem: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '13px 14px', borderRadius: 16, background: 'rgba(255,255,255,.055)', color: '#fff', textDecoration: 'none', fontWeight: 900 }
const sidebarIntelligence: React.CSSProperties = { padding: 18, borderRadius: 22, background: 'rgba(14,165,233,.12)', border: '1px solid rgba(14,165,233,.28)', display: 'grid', gap: 8 }
const main: React.CSSProperties = { padding: 28, display: 'grid', gap: 18 }
const hero: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, padding: 30, borderRadius: 34, background: 'linear-gradient(135deg,#082f49,#172554 58%,#312e81)', color: '#fff', boxShadow: '0 30px 90px rgba(15,23,42,.25)' }
const heroBadge: React.CSSProperties = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bae6fd', fontWeight: 1000, fontSize: 12 }
const heroTitle: React.CSSProperties = { fontSize: 54, lineHeight: 1.02, margin: '16px 0 12px', letterSpacing: -1.5 }
const heroText: React.CSSProperties = { color: '#dbeafe', fontSize: 17, lineHeight: 1.65, maxWidth: 900 }
const heroActions: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 22 }
const primaryButton: React.CSSProperties = { padding: '14px 18px', borderRadius: 16, background: '#fff', color: '#0f172a', textDecoration: 'none', fontWeight: 1000 }
const secondaryButton: React.CSSProperties = { padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,.11)', color: '#fff', textDecoration: 'none', fontWeight: 900, border: '1px solid rgba(255,255,255,.14)' }
const missionCard: React.CSSProperties = { padding: 24, borderRadius: 26, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)', display: 'grid', gap: 10, alignContent: 'start' }
const pulseLine: React.CSSProperties = { height: 10, borderRadius: 999, background: 'linear-gradient(90deg,#22c55e,#38bdf8,#8b5cf6)' }
const kpiGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }
const kpiCard: React.CSSProperties = { minHeight: 122, padding: 18, borderRadius: 24, background: '#fff', border: '1px solid #dbe3ee', color: '#0f172a', textDecoration: 'none', boxShadow: '0 16px 36px rgba(15,23,42,.06)', display: 'grid', gap: 8 }
const kpiTop: React.CSSProperties = { display: 'flex', justifyContent: 'space-between' }
const moduleGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }
const moduleCard: React.CSSProperties = { padding: 20, borderRadius: 26, background: '#fff', border: '1px solid #dbe3ee', color: '#0f172a', textDecoration: 'none', boxShadow: '0 16px 36px rgba(15,23,42,.06)' }
const moduleTop: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const contentGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1.15fr .75fr', gap: 16, alignItems: 'start' }
const leftCol: React.CSSProperties = { display: 'grid', gap: 16 }
const centerCol: React.CSSProperties = { display: 'grid', gap: 16 }
const rightCol: React.CSSProperties = { display: 'grid', gap: 16 }
const panel: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 28, padding: 20, boxShadow: '0 16px 36px rgba(15,23,42,.06)' }
const panelHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 15, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', textDecoration: 'none', marginBottom: 10 }
const healthGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }
const healthCard: React.CSSProperties = { padding: 16, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', textDecoration: 'none', display: 'grid', gap: 7 }
const aiGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }
const aiCard: React.CSSProperties = { padding: 16, borderRadius: 20, background: '#eff6ff', color: '#1e3a8a', textDecoration: 'none', display: 'grid', gap: 8 }
const dockGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }
const dockButton: React.CSSProperties = { padding: '16px 12px', borderRadius: 18, background: '#0f172a', color: '#fff', textDecoration: 'none', textAlign: 'center', fontWeight: 1000 }
const activityRow: React.CSSProperties = { display: 'grid', gap: 5, padding: '12px 0', borderBottom: '1px solid #e2e8f0', color: '#0f172a', textDecoration: 'none' }
