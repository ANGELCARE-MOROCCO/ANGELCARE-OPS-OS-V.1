import Link from 'next/link'

export function formatCurrency(value?: number | string | null) {
  return `${Number(value || 0).toLocaleString('fr-FR')} MAD`
}

export function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}

export function Panel({ title, subtitle, children, action }: { title?: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section style={panelStyle}>
      {(title || subtitle || action) ? (
        <div style={panelHeaderStyle}>
          <div>
            {title ? <h2 style={titleStyle}>{title}</h2> : null}
            {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
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

export function ActionLink({ href, children, variant = 'dark' }: { href: string; children: React.ReactNode; variant?: 'dark' | 'light' }) {
  return <Link href={href} style={variant === 'light' ? lightButtonStyle : darkButtonStyle}>{children}</Link>
}

export function SeverityCard({ item, children }: { item: any; children?: React.ReactNode }) {
  const tone = item.severity === 'critical' ? '#dc2626' : item.severity === 'warning' ? '#d97706' : '#2563eb'
  return (
    <article style={severityCardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <Badge tone={tone}>{String(item.severity || 'info').toUpperCase()}</Badge>
        <small style={{ color: '#64748b', fontWeight: 800 }}>{formatDate(item.created_at)}</small>
      </div>
      <h3 style={cardTitleStyle}>{item.title || 'Decision insight'}</h3>
      <p style={cardTextStyle}>{item.message || item.description || 'No message.'}</p>
      {item.recommendation ? <p style={recommendationStyle}>Recommendation: {item.recommendation}</p> : null}
      {children}
    </article>
  )
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div style={emptyStyle}><strong>{title}</strong><span>{text}</span></div>
}

const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, padding: 20, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const panelHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 16 }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 950 }
const subtitleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.5 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 20, padding: 16, display: 'grid', gap: 6, color: '#0f172a', boxShadow: '0 14px 28px rgba(15,23,42,.05)' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderRadius: 999, border: '1px solid', fontSize: 11, fontWeight: 950 }
const darkButtonStyle: React.CSSProperties = { display: 'inline-flex', padding: '12px 14px', borderRadius: 14, background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 950, border: 'none', cursor: 'pointer' }
const lightButtonStyle: React.CSSProperties = { display: 'inline-flex', padding: '12px 14px', borderRadius: 14, background: '#fff', color: '#0f172a', textDecoration: 'none', fontWeight: 950, border: '1px solid #dbe3ee' }
const severityCardStyle: React.CSSProperties = { padding: 16, borderRadius: 18, background: 'linear-gradient(180deg,#fff,#f8fafc)', border: '1px solid #e2e8f0', display: 'grid', gap: 10, color: '#0f172a' }
const cardTitleStyle: React.CSSProperties = { margin: 0, fontSize: 17, fontWeight: 950, color: '#0f172a' }
const cardTextStyle: React.CSSProperties = { margin: 0, color: '#64748b', lineHeight: 1.55, fontWeight: 700 }
const recommendationStyle: React.CSSProperties = { margin: 0, color: '#0f172a', lineHeight: 1.55, fontWeight: 900, background: '#eef2ff', border: '1px solid #c7d2fe', padding: 10, borderRadius: 14 }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 16, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', display: 'grid', gap: 6, fontWeight: 800 }
