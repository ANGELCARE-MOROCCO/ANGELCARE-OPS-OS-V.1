import Link from 'next/link'
import type { ReactNode } from 'react'

export type AutoTone = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan' | 'slate'

const tones: Record<AutoTone, { bg: string; text: string; border: string; glow: string; dark: string }> = {
  blue: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', glow: 'rgba(37,99,235,.18)', dark: '#1e3a8a' },
  green: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', glow: 'rgba(5,150,105,.18)', dark: '#064e3b' },
  amber: { bg: '#fffbeb', text: '#b45309', border: '#fde68a', glow: 'rgba(217,119,6,.18)', dark: '#92400e' },
  red: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', glow: 'rgba(220,38,38,.20)', dark: '#7f1d1d' },
  purple: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', glow: 'rgba(124,58,237,.18)', dark: '#4c1d95' },
  cyan: { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc', glow: 'rgba(8,145,178,.18)', dark: '#164e63' },
  slate: { bg: '#f8fafc', text: '#334155', border: '#cbd5e1', glow: 'rgba(15,23,42,.10)', dark: '#334155' },
}

export const autoGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(235px,1fr))', gap: 14 } as const

export function AutoShell({ children }: { children: ReactNode }) {
  return <div style={{ borderRadius: 34, padding: 2, background: 'radial-gradient(circle at top left, rgba(37,99,235,.14), transparent 34%), radial-gradient(circle at top right, rgba(245,158,11,.12), transparent 28%), linear-gradient(180deg,#f8fafc,#eef2ff)' }}>{children}</div>
}

export function AutoHero({ eyebrow, title, subtitle, actions, stats, tone = 'blue' }: { eyebrow: string; title: string; subtitle: string; actions?: ReactNode; stats?: { label: string; value: ReactNode; detail?: string }[]; tone?: AutoTone }) {
  const t = tones[tone]
  return (
    <section style={{ position: 'relative', overflow: 'hidden', borderRadius: 34, padding: 32, color: 'white', marginBottom: 22, background: `linear-gradient(135deg,#020617 0%,${t.dark} 54%,#0f766e 100%)`, boxShadow: '0 34px 100px rgba(2,6,23,.30)' }}>
      <div style={{ color: '#bfdbfe', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase' }}>{eyebrow}</div>
      <h1 style={{ margin: '10px 0', fontSize: 42, lineHeight: 1.02, letterSpacing: -1.2 }}>{title}</h1>
      <p style={{ color: '#dbeafe', margin: 0, fontWeight: 760, lineHeight: 1.6, maxWidth: 980 }}>{subtitle}</p>
      {actions ? <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>{actions}</div> : null}
      {stats?.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 20 }}>{stats.map((s) => <div key={s.label} style={{ background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 18, padding: 12 }}><div style={{ color: '#bfdbfe', fontWeight: 800, fontSize: 12 }}>{s.label}</div><strong style={{ fontSize: 22 }}>{s.value}</strong>{s.detail ? <div style={{ color: '#dbeafe', fontSize: 11 }}>{s.detail}</div> : null}</div>)}</div> : null}
    </section>
  )
}

export function AutoButton({ href, children, tone = 'blue' }: { href: string; children: ReactNode; tone?: AutoTone }) {
  const t = tones[tone]
  return <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 40, padding: '10px 14px', borderRadius: 999, background: t.bg, border: `1px solid ${t.border}`, color: t.text, textDecoration: 'none', fontWeight: 950, boxShadow: `0 12px 26px ${t.glow}` }}>{children}</Link>
}

export function AutoMetric({ label, value, detail, tone = 'blue' }: { label: string; value: ReactNode; detail: string; tone?: AutoTone }) {
  const t = tones[tone]
  return <div style={{ background: 'white', border: `1px solid ${t.border}`, borderRadius: 25, padding: 18, boxShadow: `0 18px 55px ${t.glow}` }}><div style={{ color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase' }}>{label}</div><div style={{ color: t.text, fontSize: 34, fontWeight: 950, marginTop: 8 }}>{value}</div><div style={{ color: '#475569', fontWeight: 750 }}>{detail}</div></div>
}

export function AutoPanel({ title, subtitle, children, tone = 'blue' }: { title: string; subtitle?: string; children: ReactNode; tone?: AutoTone }) {
  const t = tones[tone]
  return <section style={{ position: 'relative', background: 'white', border: `1px solid ${t.border}`, borderRadius: 28, padding: 18, boxShadow: `0 18px 55px ${t.glow}` }}><h2 style={{ margin: 0, color: '#0f172a' }}>{title}</h2>{subtitle ? <p style={{ color: '#64748b', fontWeight: 750 }}>{subtitle}</p> : null}{children}</section>
}

export function AutoRow({ title, meta, status, href, tone = 'slate' }: { title: ReactNode; meta: ReactNode; status: ReactNode; href?: string; tone?: AutoTone }) {
  const t = tones[tone]
  const body = <div style={{ display: 'grid', gridTemplateColumns: '12px minmax(0,1fr) auto', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}><span style={{ width: 10, height: 10, borderRadius: 999, background: t.text }} /><div><div style={{ color: '#0f172a', fontWeight: 950 }}>{title}</div><div style={{ color: '#64748b', fontWeight: 720, fontSize: 13, marginTop: 4 }}>{meta}</div></div><span style={{ color: t.text, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 950 }}>{status}</span></div>
  return href ? <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>{body}</Link> : body
}
