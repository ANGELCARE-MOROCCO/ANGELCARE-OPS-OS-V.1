import React from 'react'

export type Tone = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate' | 'cyan'

const tones: Record<Tone, { bg: string; border: string; text: string; soft: string }> = {
  blue: { bg: '#1d4ed8', border: '#93c5fd', text: '#1e3a8a', soft: '#eff6ff' },
  green: { bg: '#16a34a', border: '#86efac', text: '#166534', soft: '#f0fdf4' },
  amber: { bg: '#d97706', border: '#fcd34d', text: '#92400e', soft: '#fffbeb' },
  red: { bg: '#dc2626', border: '#fca5a5', text: '#991b1b', soft: '#fef2f2' },
  purple: { bg: '#7c3aed', border: '#c4b5fd', text: '#5b21b6', soft: '#f5f3ff' },
  slate: { bg: '#0f172a', border: '#cbd5e1', text: '#334155', soft: '#f8fafc' },
  cyan: { bg: '#0891b2', border: '#67e8f9', text: '#155e75', soft: '#ecfeff' },
}

export function WorkspaceHero({ title, subtitle, badge, right }: { title: string; subtitle: string; badge: string; right?: React.ReactNode }) {
  return (
    <section style={heroStyle}>
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={heroBadgeStyle}>{badge}</div>
        <h1 style={heroTitleStyle}>{title}</h1>
        <p style={heroTextStyle}>{subtitle}</p>
      </div>
      {right ? <div style={{ position: 'relative', zIndex: 2 }}>{right}</div> : null}
      <div style={heroGlowStyle} />
    </section>
  )
}

export function KpiCard({ label, value, sub, tone = 'blue' }: { label: string; value: string | number; sub: string; tone?: Tone }) {
  const t = tones[tone]
  return (
    <div style={{ ...kpiStyle, borderColor: t.border }}>
      <span style={kpiLabelStyle}>{label}</span>
      <strong style={kpiValueStyle}>{value}</strong>
      <small style={{ color: t.text, fontWeight: 850 }}>{sub}</small>
    </div>
  )
}

export function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section style={panelStyle}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={panelTitleStyle}>{title}</h2>
        {subtitle ? <p style={panelTextStyle}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function Badge({ children, tone = 'blue' }: { children: React.ReactNode; tone?: Tone }) {
  const t = tones[tone]
  return <span style={{ ...badgeStyle, background: t.soft, borderColor: t.border, color: t.text }}>{children}</span>
}

export function InsightCard({ title, text, tone = 'blue' }: { title: string; text: string; tone?: Tone }) {
  const t = tones[tone]
  return (
    <div style={{ ...insightStyle, background: t.soft, borderColor: t.border }}>
      <strong style={{ color: '#0f172a' }}>{title}</strong>
      <p style={{ margin: '7px 0 0', color: '#475569', fontWeight: 750, lineHeight: 1.55 }}>{text}</p>
    </div>
  )
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return <div style={tableWrapStyle}>{children}</div>
}

export function EmptyState({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(value || 0)
}

export function safeDate(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(date))
}

const heroStyle: React.CSSProperties = { position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 22, padding: 32, borderRadius: 34, background: 'linear-gradient(135deg,#020617,#1e3a8a 58%,#0f172a)', color: '#fff', boxShadow: '0 34px 90px rgba(15,23,42,.24)' }
const heroGlowStyle: React.CSSProperties = { position: 'absolute', inset: 'auto auto -110px -90px', width: 310, height: 310, borderRadius: 999, background: 'radial-gradient(circle,rgba(96,165,250,.34),transparent 68%)', filter: 'blur(20px)' }
const heroBadgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bfdbfe', fontWeight: 950, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 40, fontWeight: 1000, letterSpacing: -0.8, color: '#fff' }
const heroTextStyle: React.CSSProperties = { margin: '9px 0 0', color: 'rgba(255,255,255,.85)', fontWeight: 800, lineHeight: 1.55, maxWidth: 760 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, padding: 18, display: 'grid', gap: 6, boxShadow: '0 18px 42px rgba(15,23,42,.055)', color: '#0f172a' }
const kpiLabelStyle: React.CSSProperties = { color: '#64748b', fontWeight: 850, fontSize: 13 }
const kpiValueStyle: React.CSSProperties = { fontSize: 28, fontWeight: 1000, letterSpacing: -0.5 }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 42px rgba(15,23,42,.06)' }
const panelTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 1000 }
const panelTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.5 }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 10px', borderRadius: 999, border: '1px solid', fontSize: 12, fontWeight: 950 }
const insightStyle: React.CSSProperties = { border: '1px solid', borderRadius: 18, padding: 16 }
const tableWrapStyle: React.CSSProperties = { overflowX: 'auto', borderRadius: 18, border: '1px solid #e2e8f0' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 850 }
