import Link from 'next/link'
import type { ReactNode } from 'react'

export type EnterpriseTone = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan' | 'slate'

const tones: Record<EnterpriseTone, { bg: string; text: string; border: string; glow: string; dark: string }> = {
  blue: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', glow: 'rgba(37,99,235,.18)', dark: '#1e3a8a' },
  green: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', glow: 'rgba(5,150,105,.18)', dark: '#064e3b' },
  amber: { bg: '#fffbeb', text: '#b45309', border: '#fde68a', glow: 'rgba(217,119,6,.18)', dark: '#92400e' },
  red: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', glow: 'rgba(220,38,38,.20)', dark: '#7f1d1d' },
  purple: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', glow: 'rgba(124,58,237,.18)', dark: '#4c1d95' },
  cyan: { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc', glow: 'rgba(8,145,178,.18)', dark: '#164e63' },
  slate: { bg: '#f8fafc', text: '#334155', border: '#cbd5e1', glow: 'rgba(15,23,42,.10)', dark: '#334155' },
}

export const enterpriseGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))',
  gap: 14,
} as const

export function EnterprisePageShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ borderRadius: 34, padding: 2, background: 'radial-gradient(circle at top left, rgba(37,99,235,.14), transparent 34%), radial-gradient(circle at top right, rgba(20,184,166,.12), transparent 28%), linear-gradient(180deg,#f8fafc,#eef2ff)' }}>
      {children}
    </div>
  )
}

export function EnterpriseHero({ eyebrow, title, subtitle, actions, stats, tone = 'blue' }: { eyebrow: string; title: string; subtitle: string; actions?: ReactNode; stats?: { label: string; value: ReactNode; detail?: string }[]; tone?: EnterpriseTone }) {
  const t = tones[tone]
  return (
    <section style={{ position: 'relative', overflow: 'hidden', borderRadius: 34, padding: 32, color: 'white', marginBottom: 22, background: `linear-gradient(135deg,#020617 0%,${t.dark} 50%,#0f766e 100%)`, boxShadow: '0 34px 100px rgba(2,6,23,.30)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 18% 12%, rgba(255,255,255,.18), transparent 25%), radial-gradient(circle at 82% 22%, rgba(34,211,238,.19), transparent 25%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(300px,.65fr)', gap: 24 }}>
        <div>
          <div style={{ color: '#bfdbfe', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase' }}>{eyebrow}</div>
          <h1 style={{ margin: '10px 0', fontSize: 42, lineHeight: 1.02, letterSpacing: -1.2 }}>{title}</h1>
          <p style={{ color: '#dbeafe', margin: 0, fontWeight: 760, lineHeight: 1.6, maxWidth: 980 }}>{subtitle}</p>
          {actions ? <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>{actions}</div> : null}
        </div>
        <div style={{ background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 26, padding: 16, backdropFilter: 'blur(16px)', display: 'grid', gap: 11 }}>
          {(stats || []).slice(0, 5).map((item) => (
            <div key={String(item.label)} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, borderBottom: '1px solid rgba(255,255,255,.13)', paddingBottom: 10 }}>
              <div>
                <div style={{ color: '#bfdbfe', fontSize: 12, fontWeight: 900 }}>{item.label}</div>
                {item.detail ? <div style={{ color: '#dbeafe', fontSize: 11, fontWeight: 700, marginTop: 2 }}>{item.detail}</div> : null}
              </div>
              <strong style={{ color: 'white', fontSize: 21 }}>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function EnterpriseButton({ href, children, tone = 'blue' }: { href: string; children: ReactNode; tone?: EnterpriseTone }) {
  const t = tones[tone]
  return <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 40, padding: '10px 14px', borderRadius: 999, background: t.bg, border: `1px solid ${t.border}`, color: t.text, textDecoration: 'none', fontWeight: 950, boxShadow: `0 12px 26px ${t.glow}` }}>{children}</Link>
}

export function EnterpriseMetric({ label, value, detail, tone = 'blue' }: { label: string; value: ReactNode; detail: string; tone?: EnterpriseTone }) {
  const t = tones[tone]
  return (
    <div style={{ background: 'white', border: `1px solid ${t.border}`, borderRadius: 25, padding: 18, boxShadow: `0 18px 55px ${t.glow}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .8 }}>{label}</div>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: t.text, boxShadow: `0 0 0 5px ${t.bg}` }} />
      </div>
      <div style={{ color: t.text, fontSize: 34, fontWeight: 950, marginTop: 8 }}>{value}</div>
      <div style={{ color: '#475569', fontWeight: 750, marginTop: 5 }}>{detail}</div>
    </div>
  )
}

export function EnterprisePanel({ title, subtitle, children, tone = 'blue' }: { title: string; subtitle?: string; children: ReactNode; tone?: EnterpriseTone }) {
  const t = tones[tone]
  return (
    <section style={{ position: 'relative', background: 'rgba(255,255,255,.98)', border: `1px solid ${t.border}`, borderRadius: 28, padding: 18, boxShadow: `0 18px 55px ${t.glow}`, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: t.text }} />
      <div style={{ paddingLeft: 5, marginBottom: 15 }}>
        <h2 style={{ margin: 0, color: '#0f172a', fontWeight: 950, fontSize: 22 }}>{title}</h2>
        {subtitle ? <p style={{ color: '#64748b', margin: '5px 0 0', fontWeight: 760, lineHeight: 1.45 }}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function EnterpriseRow({ title, meta, status, href, tone = 'slate' }: { title: ReactNode; meta: ReactNode; status: ReactNode; href?: string; tone?: EnterpriseTone }) {
  const t = tones[tone]
  const body = (
    <div style={{ display: 'grid', gridTemplateColumns: '12px minmax(0,1fr) auto', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: t.text, boxShadow: `0 0 0 5px ${t.bg}` }} />
      <div>
        <div style={{ color: '#0f172a', fontWeight: 950 }}>{title}</div>
        <div style={{ color: '#64748b', fontWeight: 720, fontSize: 13, marginTop: 4 }}>{meta}</div>
      </div>
      <span style={{ color: t.text, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 950 }}>{status}</span>
    </div>
  )
  return href ? <Link href={href} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>{body}</Link> : body
}

export function EnterpriseNavStrip({ items }: { items: { label: string; href: string; tone?: EnterpriseTone }[] }) {
  return (
    <div style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 5, marginBottom: 20 }}>
      {items.map((item) => {
        const t = tones[item.tone || 'slate']
        return <Link key={item.href} href={item.href} style={{ whiteSpace: 'nowrap', textDecoration: 'none', color: t.text, border: `1px solid ${t.border}`, background: 'white', borderRadius: 999, padding: '10px 13px', fontWeight: 950, boxShadow: `0 10px 24px ${t.glow}` }}>{item.label}</Link>
      })}
    </div>
  )
}
