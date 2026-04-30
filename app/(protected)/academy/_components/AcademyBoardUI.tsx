import Link from 'next/link'
import type React from 'react'

export type AcademyModule = {
  title: string
  href: string
  description: string
  signal: string
  priority: 'critical' | 'high' | 'normal' | 'strategic'
  icon: string
  actions?: { label: string; href: string }[]
}

export function BoardHero({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <section style={hero}>
      <div style={heroGlow} />
      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 16 }}>
        <div style={eyebrow}>ANGELCARE ACADEMY · BOARD COMMAND SYSTEM</div>
        <h1 style={heroTitle}>{title}</h1>
        <p style={heroText}>{subtitle}</p>
        {children}
      </div>
    </section>
  )
}

export function ExecutiveKpi({ label, value, sub, tone = '#2563eb' }: { label: string; value: string | number; sub: string; tone?: string }) {
  return (
    <div style={{ ...kpi, borderTop: `5px solid ${tone}` }}>
      <span style={kpiLabel}>{label}</span>
      <strong style={kpiValue}>{value}</strong>
      <small style={kpiSub}>{sub}</small>
    </div>
  )
}

export function MasterNavigation({ modules }: { modules: AcademyModule[] }) {
  return (
    <section style={panel}>
      <PanelHeader title="Academy Master Panel" subtitle="All operational sections, executive signals and direct actions in one place." />
      <div style={moduleGrid}>
        {modules.map((m) => (
          <Link key={m.href} href={m.href} style={moduleCard(m.priority)}>
            <div style={moduleTop}>
              <span style={moduleIcon}>{m.icon}</span>
              <span style={priorityPill(m.priority)}>{m.priority}</span>
            </div>
            <h3 style={moduleTitle}>{m.title}</h3>
            <p style={moduleText}>{m.description}</p>
            <div style={signalBox}>{m.signal}</div>
            {m.actions?.length ? (
              <div style={miniActions}>
                {m.actions.slice(0, 3).map((a) => <span key={a.href}>{a.label}</span>)}
              </div>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  )
}

export function CommandPanel({ items }: { items: { title: string; detail: string; href: string; tone?: string }[] }) {
  return (
    <section style={panelDark}>
      <PanelHeader title="Manager Command Priorities" subtitle="Board-style action queue: what must be executed next." dark />
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => (
          <Link key={item.href + item.title} href={item.href} style={commandItem(item.tone || '#60a5fa')}>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function QuickActions({ actions }: { actions: { label: string; href: string; tone?: string }[] }) {
  return (
    <section style={quickPanel}>
      <PanelHeader title="Quick Actions" subtitle="Direct execution shortcuts for Academy managers." />
      <div style={quickGrid}>
        {actions.map((a) => <Link key={a.href + a.label} href={a.href} style={{ ...quickButton, background: a.tone || '#0f172a' }}>{a.label}</Link>)}
      </div>
    </section>
  )
}

export function RiskRadar({ rows }: { rows: { label: string; value: string | number; status: string; tone: string }[] }) {
  return (
    <section style={panel}>
      <PanelHeader title="Risk & Compliance Radar" subtitle="Signals that require management attention before they become operational failures." />
      <div style={{ display: 'grid', gap: 10 }}>
        {rows.map((r) => (
          <div key={r.label} style={riskRow(r.tone)}>
            <span>{r.label}</span>
            <strong>{r.value}</strong>
            <em>{r.status}</em>
          </div>
        ))}
      </div>
    </section>
  )
}

export function PanelHeader({ title, subtitle, dark }: { title: string; subtitle: string; dark?: boolean }) {
  return <div style={{ marginBottom: 18 }}><h2 style={{ ...sectionTitle, color: dark ? '#fff' : '#0f172a' }}>{title}</h2><p style={{ ...sectionText, color: dark ? 'rgba(255,255,255,.72)' : '#64748b' }}>{subtitle}</p></div>
}

export function SubmoduleBoardShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={page}>
      <BoardHero title={title} subtitle={subtitle}>
        <div style={heroActions}>
          <Link href="/academy" style={heroButton}>Academy Command</Link>
          <Link href="/academy/command-center" style={heroButtonLight}>Manager Control</Link>
          <Link href="/academy/reports" style={heroButtonLight}>Reports</Link>
        </div>
      </BoardHero>
      {children}
    </div>
  )
}

export const page: React.CSSProperties = { display: 'grid', gap: 20 }
const hero: React.CSSProperties = { position: 'relative', overflow: 'hidden', borderRadius: 34, padding: 34, color: '#fff', background: 'radial-gradient(circle at 20% 0%,#3b82f6 0,#172554 42%,#020617 100%)', boxShadow: '0 38px 100px rgba(2,6,23,.36)', border: '1px solid rgba(255,255,255,.12)' }
const heroGlow: React.CSSProperties = { position: 'absolute', right: -90, top: -120, width: 380, height: 380, borderRadius: 999, background: 'radial-gradient(circle,rgba(16,185,129,.34),transparent 70%)', filter: 'blur(18px)' }
const eyebrow: React.CSSProperties = { width: 'fit-content', padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)', fontSize: 11, fontWeight: 950, letterSpacing: 1.2, color: '#dbeafe' }
const heroTitle: React.CSSProperties = { margin: 0, fontSize: 48, lineHeight: 1, fontWeight: 1000, letterSpacing: -1.2, color: '#fff' }
const heroText: React.CSSProperties = { margin: 0, maxWidth: 850, color: 'rgba(255,255,255,.84)', fontWeight: 800, lineHeight: 1.65, fontSize: 15 }
const heroActions: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const heroButton: React.CSSProperties = { textDecoration: 'none', padding: '12px 16px', borderRadius: 14, background: '#fff', color: '#0f172a', fontWeight: 950 }
const heroButtonLight: React.CSSProperties = { ...heroButton, background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.18)' }
const panel: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 28, padding: 22, boxShadow: '0 22px 55px rgba(15,23,42,.07)' }
const panelDark: React.CSSProperties = { ...panel, background: 'linear-gradient(180deg,#0f172a,#020617)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }
const sectionTitle: React.CSSProperties = { margin: 0, fontSize: 23, fontWeight: 1000, letterSpacing: -0.3 }
const sectionText: React.CSSProperties = { margin: '6px 0 0', fontSize: 13, fontWeight: 800, lineHeight: 1.55 }
const kpi: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 42px rgba(15,23,42,.06)' }
const kpiLabel: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .5 }
const kpiValue: React.CSSProperties = { color: '#0f172a', fontSize: 31, fontWeight: 1000, letterSpacing: -0.8 }
const kpiSub: React.CSSProperties = { color: '#64748b', fontWeight: 800 }
const moduleGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const moduleTop: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const moduleIcon: React.CSSProperties = { width: 46, height: 46, display: 'grid', placeItems: 'center', borderRadius: 16, background: '#eff6ff', fontSize: 22 }
const moduleTitle: React.CSSProperties = { margin: '14px 0 6px', color: '#0f172a', fontSize: 16, fontWeight: 1000 }
const moduleText: React.CSSProperties = { minHeight: 55, margin: 0, color: '#64748b', fontSize: 12, fontWeight: 800, lineHeight: 1.5 }
const signalBox: React.CSSProperties = { marginTop: 12, padding: 10, borderRadius: 14, background: '#f8fafc', color: '#0f172a', fontSize: 12, fontWeight: 900, border: '1px solid #e2e8f0' }
const miniActions: React.CSSProperties = { marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap', color: '#1d4ed8', fontSize: 11, fontWeight: 950 }
const quickPanel: React.CSSProperties = { ...panel, background: 'linear-gradient(180deg,#ffffff,#f8fafc)' }
const quickGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 10 }
const quickButton: React.CSSProperties = { textDecoration: 'none', textAlign: 'center', padding: '13px 12px', borderRadius: 15, color: '#fff', fontWeight: 950, boxShadow: '0 16px 34px rgba(15,23,42,.12)' }
const moduleCard = (priority: AcademyModule['priority']): React.CSSProperties => ({ textDecoration: 'none', display: 'grid', alignContent: 'start', padding: 16, borderRadius: 22, background: '#fff', border: `1px solid ${priority === 'critical' ? '#fecaca' : priority === 'high' ? '#fed7aa' : priority === 'strategic' ? '#bfdbfe' : '#dbe3ee'}`, boxShadow: '0 16px 35px rgba(15,23,42,.05)', transition: 'transform .18s ease' })
const priorityPill = (priority: AcademyModule['priority']): React.CSSProperties => ({ padding: '6px 8px', borderRadius: 999, fontSize: 10, fontWeight: 1000, textTransform: 'uppercase', color: priority === 'critical' ? '#991b1b' : priority === 'high' ? '#9a3412' : priority === 'strategic' ? '#1d4ed8' : '#334155', background: priority === 'critical' ? '#fee2e2' : priority === 'high' ? '#ffedd5' : priority === 'strategic' ? '#dbeafe' : '#f1f5f9' })
const commandItem = (tone: string): React.CSSProperties => ({ display: 'grid', gap: 4, padding: 14, borderRadius: 18, textDecoration: 'none', color: '#fff', background: `${tone}22`, border: `1px solid ${tone}66` })
const riskRow = (tone: string): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', padding: 13, borderRadius: 16, background: `${tone}12`, border: `1px solid ${tone}44`, color: '#0f172a', fontWeight: 900 })
