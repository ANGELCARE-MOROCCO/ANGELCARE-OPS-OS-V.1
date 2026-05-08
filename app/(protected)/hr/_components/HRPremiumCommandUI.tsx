import Link from 'next/link'
import type { ReactNode, CSSProperties } from 'react'

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate' | 'cyan'

const tones: Record<Tone, { bg: string; text: string; border: string; glow: string }> = {
  blue: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', glow: 'rgba(37,99,235,.18)' },
  green: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', glow: 'rgba(5,150,105,.18)' },
  amber: { bg: '#fffbeb', text: '#b45309', border: '#fde68a', glow: 'rgba(217,119,6,.18)' },
  red: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', glow: 'rgba(220,38,38,.18)' },
  purple: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', glow: 'rgba(124,58,237,.18)' },
  slate: { bg: '#f8fafc', text: '#334155', border: '#cbd5e1', glow: 'rgba(15,23,42,.12)' },
  cyan: { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc', glow: 'rgba(8,145,178,.18)' },
}

export function PremiumShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background:
          'radial-gradient(circle at top left, rgba(37,99,235,.12), transparent 32%), radial-gradient(circle at top right, rgba(20,184,166,.10), transparent 30%), #f8fafc',
        borderRadius: 28,
        padding: 2,
      }}
    >
      {children}
    </div>
  )
}

export function PremiumHero({
  eyebrow,
  title,
  subtitle,
  actions,
  stats,
}: {
  eyebrow: string
  title: string
  subtitle: string
  actions?: ReactNode
  stats?: { label: string; value: ReactNode; tone?: Tone }[]
}) {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 32,
        padding: 30,
        color: 'white',
        marginBottom: 22,
        background:
          'linear-gradient(135deg, #020617 0%, #0f172a 36%, #1e3a8a 70%, #0f766e 100%)',
        boxShadow: '0 30px 90px rgba(2,6,23,.28)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 18% 10%, rgba(255,255,255,.18), transparent 24%), radial-gradient(circle at 85% 18%, rgba(34,211,238,.20), transparent 24%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0,1.45fr) minmax(280px,.75fr)', gap: 24 }}>
        <div>
          <div style={{ fontWeight: 950, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.4, color: '#93c5fd' }}>
            {eyebrow}
          </div>
          <h1 style={{ margin: '10px 0 10px', fontSize: 40, lineHeight: 1.03, letterSpacing: -1.2 }}>{title}</h1>
          <p style={{ margin: 0, color: '#dbeafe', fontWeight: 760, lineHeight: 1.6, maxWidth: 940 }}>{subtitle}</p>
          {actions ? <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>{actions}</div> : null}
        </div>

        <div
          style={{
            display: 'grid',
            gap: 10,
            background: 'rgba(255,255,255,.10)',
            border: '1px solid rgba(255,255,255,.18)',
            borderRadius: 24,
            padding: 16,
            backdropFilter: 'blur(14px)',
          }}
        >
          {(stats || []).slice(0, 4).map((stat) => (
            <div key={String(stat.label)} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,.12)', paddingBottom: 10 }}>
              <span style={{ color: '#bfdbfe', fontWeight: 850, fontSize: 13 }}>{stat.label}</span>
              <strong style={{ color: 'white', fontSize: 20 }}>{stat.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CommandButton({
  href,
  children,
  tone = 'blue',
}: {
  href: string
  children: ReactNode
  tone?: Tone
}) {
  const t = tones[tone]
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 40,
        padding: '10px 14px',
        borderRadius: 999,
        border: `1px solid ${t.border}`,
        background: t.bg,
        color: t.text,
        textDecoration: 'none',
        fontWeight: 950,
        boxShadow: `0 12px 26px ${t.glow}`,
      }}
    >
      {children}
    </Link>
  )
}

export function PulseMetric({
  label,
  value,
  detail,
  tone = 'blue',
  progress,
}: {
  label: string
  value: ReactNode
  detail: string
  tone?: Tone
  progress?: number
}) {
  const t = tones[tone]
  const safeProgress = typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : undefined
  return (
    <div
      style={{
        background: 'white',
        border: `1px solid ${t.border}`,
        borderRadius: 24,
        padding: 18,
        boxShadow: `0 18px 55px ${t.glow}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .8 }}>{label}</div>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: t.text, boxShadow: `0 0 0 5px ${t.bg}` }} />
      </div>
      <div style={{ color: t.text, fontWeight: 950, fontSize: 34, marginTop: 8 }}>{value}</div>
      <div style={{ color: '#475569', fontWeight: 750, marginTop: 5 }}>{detail}</div>
      {safeProgress !== undefined ? (
        <div style={{ marginTop: 14, height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
          <div style={{ width: `${safeProgress}%`, height: '100%', borderRadius: 999, background: t.text }} />
        </div>
      ) : null}
    </div>
  )
}

export function PremiumPanel({
  title,
  subtitle,
  children,
  right,
  accent = 'blue',
}: {
  title: string
  subtitle?: string
  children: ReactNode
  right?: ReactNode
  accent?: Tone
}) {
  const t = tones[accent]
  return (
    <section
      style={{
        position: 'relative',
        background: 'rgba(255,255,255,.96)',
        border: `1px solid ${t.border}`,
        borderRadius: 26,
        padding: 18,
        boxShadow: `0 18px 55px ${t.glow}`,
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: t.text }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 14, paddingLeft: 4 }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: 21, fontWeight: 950 }}>{title}</h2>
          {subtitle ? <p style={{ margin: '5px 0 0', color: '#64748b', fontWeight: 760, lineHeight: 1.45 }}>{subtitle}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

export function WorkQueueRow({
  title,
  meta,
  status,
  tone = 'slate',
  href,
}: {
  title: ReactNode
  meta: ReactNode
  status: ReactNode
  tone?: Tone
  href?: string
}) {
  const t = tones[tone]
  const inner = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '12px minmax(0,1fr) auto',
        gap: 12,
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: 999, background: t.text, boxShadow: `0 0 0 5px ${t.bg}` }} />
      <div>
        <div style={{ color: '#0f172a', fontWeight: 950 }}>{title}</div>
        <div style={{ color: '#64748b', fontWeight: 720, fontSize: 13, marginTop: 3 }}>{meta}</div>
      </div>
      <span style={{ color: t.text, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 950 }}>
        {status}
      </span>
    </div>
  )

  return href ? <Link href={href} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>{inner}</Link> : inner
}

export function CommandRail({
  items,
}: {
  items: { label: string; href: string; tone?: Tone; detail?: string }[]
}) {
  return (
    <PremiumPanel title="Command Rail" subtitle="Fast HR interventions" accent="slate">
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((item) => {
          const t = tones[item.tone || 'blue']
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: 14,
                borderRadius: 18,
                border: `1px solid ${t.border}`,
                background: t.bg,
                textDecoration: 'none',
                color: t.text,
                fontWeight: 950,
              }}
            >
              {item.label}
              {item.detail ? <div style={{ color: '#475569', fontSize: 12, fontWeight: 750, marginTop: 4 }}>{item.detail}</div> : null}
            </Link>
          )
        })}
      </div>
    </PremiumPanel>
  )
}

export function HeatTile({
  label,
  value,
  tone = 'blue',
  detail,
}: {
  label: string
  value: ReactNode
  tone?: Tone
  detail?: string
}) {
  const t = tones[tone]
  return (
    <div style={{ borderRadius: 18, border: `1px solid ${t.border}`, background: t.bg, padding: 14 }}>
      <div style={{ color: t.text, fontWeight: 950, fontSize: 22 }}>{value}</div>
      <div style={{ color: '#0f172a', fontWeight: 900, marginTop: 4 }}>{label}</div>
      {detail ? <div style={{ color: '#64748b', fontWeight: 700, fontSize: 12, marginTop: 4 }}>{detail}</div> : null}
    </div>
  )
}

export function SectionTabs({ items }: { items: { label: string; href: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 18 }}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            whiteSpace: 'nowrap',
            textDecoration: 'none',
            color: '#0f172a',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 999,
            padding: '9px 12px',
            fontWeight: 900,
          }}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}

export const twoColumn: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) 360px',
  gap: 20,
}

export const threeColumn: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
  gap: 14,
}
