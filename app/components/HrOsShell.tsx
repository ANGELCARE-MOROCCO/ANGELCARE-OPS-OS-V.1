import Link from 'next/link'
import type React from 'react'

export const HR_OS_LINKS = [
  { key: 'command', label: 'Command Center', href: '/hr-os', icon: '⌘' },
  { key: 'intelligence', label: 'Intelligence', href: '/hr-os/intelligence', icon: '✦' },
  { key: 'enterprise', label: 'Enterprise', href: '/hr-os/enterprise', icon: '⬢' },
  { key: 'realtime', label: 'Realtime', href: '/hr-os/realtime', icon: '●' },
  { key: 'executive-ai', label: 'Executive AI', href: '/hr-os/executive-ai', icon: '◆' },
  { key: 'board-reports', label: 'Board Reports', href: '/hr-os/board-reports', icon: '▤' },
  { key: 'onboarding', label: 'Onboarding', href: '/hr-os/onboarding', icon: '◌' },
  { key: 'onboarding-smart', label: 'Smart Onboarding', href: '/hr-os/onboarding-smart', icon: '◉' },
  { key: 'strategy', label: 'Strategy', href: '/hr-os/strategy', icon: '◎' },
  { key: 'war-room', label: 'War Room', href: '/hr-os/war-room', icon: '▣' },
  { key: 'recruitment', label: 'Recruitment', href: '/hr-os/recruitment', icon: '◎' },
  { key: 'talent-dna', label: 'Talent DNA', href: '/hr-os/talent-dna', icon: '◇' },
  { key: 'readiness', label: 'Readiness', href: '/hr-os/readiness', icon: '▲' },
  { key: 'allocation', label: 'Allocation', href: '/hr-os/allocation', icon: '⇄' },
  { key: 'compliance', label: 'Compliance', href: '/hr-os/compliance', icon: '✓' },
  { key: 'performance', label: 'Performance', href: '/hr-os/performance', icon: '↗' },
  { key: 'incidents', label: 'Incidents', href: '/hr-os/incidents', icon: '!' },
  { key: 'academy', label: 'Academy Bridge', href: '/hr-os/academy', icon: '✦' },
  { key: 'reports', label: 'Reports', href: '/hr-os/reports', icon: '▣' },
] as const

export default function HrOsShell({
  title,
  subtitle,
  active,
  children,
  actions,
}: {
  title: string
  subtitle: string
  active: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <main style={page}>
      <section style={hero}>
        <div style={heroLeft}>
          <div style={badge}>ANGELCARE HR-OS · SMART ONBOARDING</div>
          <h1 style={titleStyle}>{title}</h1>
          <p style={subtitleStyle}>{subtitle}</p>
        </div>
        <div style={heroRight}>
          <div style={liveRow}><span style={liveDot} /> TRAINING ENFORCEMENT READY</div>
          <strong style={{ fontSize: 28 }}>Adoption Control</strong>
          <small style={{ color: '#cbd5e1', fontWeight: 800, lineHeight: 1.55 }}>
            Role-based training, readiness score, manager assessment and behavior control foundations.
          </small>
          {actions && <div style={actionWrap}>{actions}</div>}
        </div>
      </section>

      <nav style={nav}>
        {HR_OS_LINKS.map((link) => (
          <Link key={link.key} href={link.href} style={active === link.key ? navActive : navItem}>
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      {children}
    </main>
  )
}

const page: React.CSSProperties = { display: 'grid', gap: 18, padding: 24, background: 'linear-gradient(180deg,#f8fafc,#eef2ff)', minHeight: '100vh' }
const hero: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, padding: 32, borderRadius: 34, background: 'radial-gradient(circle at top left,#4338ca,#020617 62%)', color: '#fff', boxShadow: '0 32px 90px rgba(2,6,23,.38)', overflow: 'hidden' }
const heroLeft: React.CSSProperties = { display: 'grid', gap: 10, alignContent: 'center' }
const badge: React.CSSProperties = { display: 'inline-flex', width: 'fit-content', padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.14)', fontSize: 12, fontWeight: 950, letterSpacing: 1 }
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 46, fontWeight: 1000, letterSpacing: -1.2 }
const subtitleStyle: React.CSSProperties = { margin: 0, maxWidth: 860, color: 'rgba(255,255,255,.88)', fontWeight: 780, lineHeight: 1.65 }
const heroRight: React.CSSProperties = { display: 'grid', gap: 10, padding: 20, borderRadius: 26, background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.18)', backdropFilter: 'blur(10px)' }
const liveRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#86efac', fontSize: 11, fontWeight: 950, letterSpacing: 1 }
const liveDot: React.CSSProperties = { width: 9, height: 9, borderRadius: 999, background: '#22c55e', boxShadow: '0 0 16px #22c55e' }
const actionWrap: React.CSSProperties = { marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }
const nav: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', padding: 12, borderRadius: 24, background: '#fff', border: '1px solid #dbe3ee', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const navItem: React.CSSProperties = { display: 'inline-flex', gap: 8, alignItems: 'center', padding: '10px 13px', borderRadius: 14, textDecoration: 'none', color: '#334155', fontWeight: 900, background: '#f8fafc', border: '1px solid #e2e8f0' }
const navActive: React.CSSProperties = { ...navItem, background: '#0f172a', color: '#fff', borderColor: '#0f172a' }
