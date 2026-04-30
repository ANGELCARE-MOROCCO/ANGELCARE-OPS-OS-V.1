import Link from 'next/link'

export function EnterpriseHero({ title, subtitle, badge }: { title: string; subtitle: string; badge: string }) {
  return (
    <section style={heroStyle}>
      <div>
        <div style={badgeStyle}>{badge}</div>
        <h1 style={titleStyle}>{title}</h1>
        <p style={subtitleStyle}>{subtitle}</p>
      </div>
      <div style={heroCardStyle}>
        <strong>Enterprise governance mode</strong>
        <span>Designed for control, audit, quality and international operating discipline.</span>
      </div>
    </section>
  )
}

export function EnterpriseGrid({ children }: { children: React.ReactNode }) {
  return <div style={gridStyle}>{children}</div>
}

export function EnterpriseCard({ title, value, subtitle, href }: { title: string; value: string; subtitle: string; href?: string }) {
  const content = (
    <div style={cardStyle}>
      <span style={cardTitleStyle}>{title}</span>
      <strong style={cardValueStyle}>{value}</strong>
      <small style={cardSubStyle}>{subtitle}</small>
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link> : content
}

export function EnterpriseTable({ rows }: { rows: Array<Record<string, any>> }) {
  const headers = rows[0] ? Object.keys(rows[0]) : []
  return (
    <div style={tableWrapStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>{headers.map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{headers.map((h) => <td key={h} style={tdStyle}>{String(row[h] ?? '—')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function EnterpriseActionList({ actions }: { actions: { title: string; detail: string; href: string; priority?: string }[] }) {
  return (
    <div style={listStyle}>
      {actions.map((a) => (
        <Link key={a.title} href={a.href} style={actionStyle}>
          <div>
            <strong>{a.title}</strong>
            <span>{a.detail}</span>
          </div>
          <small>{a.priority || 'Open'}</small>
        </Link>
      ))}
    </div>
  )
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'stretch', padding: 30, borderRadius: 34, background: 'radial-gradient(circle at top left,#312e81,#020617 65%)', color: '#fff', boxShadow: '0 28px 80px rgba(2,6,23,.30)' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#c7d2fe', fontWeight: 950, fontSize: 12, letterSpacing: 1 }
const titleStyle: React.CSSProperties = { margin: '16px 0 8px', fontSize: 42, fontWeight: 1000, letterSpacing: -1 }
const subtitleStyle: React.CSSProperties = { margin: 0, maxWidth: 820, color: 'rgba(255,255,255,.86)', fontWeight: 800, lineHeight: 1.6 }
const heroCardStyle: React.CSSProperties = { minWidth: 300, display: 'grid', gap: 8, padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.18)' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 18, borderRadius: 22, background: '#fff', border: '1px solid #dbe3ee', boxShadow: '0 18px 40px rgba(15,23,42,.06)', color: '#0f172a' }
const cardTitleStyle: React.CSSProperties = { color: '#64748b', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }
const cardValueStyle: React.CSSProperties = { fontSize: 26, fontWeight: 1000 }
const cardSubStyle: React.CSSProperties = { color: '#64748b', fontWeight: 750, lineHeight: 1.45 }
const tableWrapStyle: React.CSSProperties = { overflow: 'auto', border: '1px solid #dbe3ee', borderRadius: 22, background: '#fff' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: 14, background: '#f8fafc', color: '#334155', fontSize: 12, textTransform: 'uppercase' }
const tdStyle: React.CSSProperties = { padding: 14, borderTop: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 750 }
const listStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const actionStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, padding: 14, borderRadius: 18, background: '#fff', border: '1px solid #dbe3ee', color: '#0f172a', textDecoration: 'none' }
