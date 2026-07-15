import Link from 'next/link'

export function Panel({ title, subtitle, children, action }: { title?: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section style={panelStyle}>
      {(title || subtitle || action) ? (
        <div style={panelHeaderStyle}>
          <div>
            {title ? <h2 style={titleStyle}>{title}</h2> : null}
            {subtitle ? <p style={subStyle}>{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function Kpi({ title, value, sub, tone = '#0f172a' }: { title: string; value: string | number; sub?: string; tone?: string }) {
  return <div style={kpiStyle}><span>{title}</span><strong style={{ color: tone }}>{value}</strong>{sub ? <small>{sub}</small> : null}</div>
}

export function Badge({ children, tone = '#2563eb' }: { children: React.ReactNode; tone?: string }) {
  return <span style={{ ...badgeStyle, color: tone, background: `${tone}14`, borderColor: `${tone}44` }}>{children}</span>
}

export function ActionLink({ href, children, variant = 'dark' }: { href: string; children: React.ReactNode; variant?: 'dark' | 'light' | 'danger' }) {
  const style = variant === 'danger' ? actionDangerStyle : variant === 'light' ? actionLightStyle : actionDarkStyle
  return <Link href={href} style={style}>{children}</Link>
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div style={emptyStyle}><strong>{title}</strong><span>{text}</span></div>
}

export function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}

export function TimelineItem({ action, note, date }: { action?: string; note?: string; date?: string }) {
  return (
    <div style={timelineItemStyle}>
      <div style={dotStyle} />
      <div>
        <strong>{action || 'activity'}</strong>
        <p>{note || '—'}</p>
        <small>{formatDate(date)}</small>
      </div>
    </div>
  )
}

export function CommandTile({ title, subtitle, href, icon }: { title: string; subtitle: string; href: string; icon: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <article style={tileStyle}>
        <div style={tileIconStyle}>{icon}</div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </article>
    </Link>
  )
}

const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const panelHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18 }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 950 }
const subStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 38px rgba(15,23,42,.05)', color: '#0f172a' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderRadius: 999, border: '1px solid', fontSize: 11, fontWeight: 950 }
const actionDarkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 950 }
const actionLightStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#fff', color: '#0f172a', border: '1px solid #dbe3ee', textDecoration: 'none', fontWeight: 950 }
const actionDangerStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', textDecoration: 'none', fontWeight: 950 }
const emptyStyle: React.CSSProperties = { padding: 20, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', display: 'grid', gap: 6, fontWeight: 800 }
const timelineItemStyle: React.CSSProperties = { position: 'relative', display: 'grid', gridTemplateColumns: '18px 1fr', gap: 10, padding: '12px 0', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }
const dotStyle: React.CSSProperties = { width: 10, height: 10, borderRadius: 999, background: '#2563eb', marginTop: 5, boxShadow: '0 0 0 5px #dbeafe' }
const tileStyle: React.CSSProperties = { minHeight: 160, padding: 18, borderRadius: 24, border: '1px solid #dbe3ee', background: 'linear-gradient(180deg,#fff,#f8fafc)', boxShadow: '0 18px 38px rgba(15,23,42,.05)', color: '#0f172a', display: 'grid', gap: 10 }
const tileIconStyle: React.CSSProperties = { width: 42, height: 42, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#eef2ff', fontSize: 22 }
