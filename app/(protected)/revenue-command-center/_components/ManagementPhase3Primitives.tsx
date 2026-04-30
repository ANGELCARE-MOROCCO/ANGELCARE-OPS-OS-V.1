import Link from 'next/link'

export function toneForScore(score: number) {
  if (score >= 80) return { color: '#dc2626', bg: '#fee2e2', label: 'Critical pressure' }
  if (score >= 55) return { color: '#d97706', bg: '#fef3c7', label: 'At risk' }
  return { color: '#16a34a', bg: '#dcfce7', label: 'Stable' }
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
  return (
    <div style={kpiStyle}>
      <span>{title}</span>
      <strong style={{ color: tone }}>{value}</strong>
      {sub ? <small>{sub}</small> : null}
    </div>
  )
}

export function ActionLink({ href, children, variant = 'dark' }: { href: string; children: React.ReactNode; variant?: 'dark' | 'light' | 'danger' }) {
  const style = variant === 'danger' ? actionDangerStyle : variant === 'light' ? actionLightStyle : actionDarkStyle
  return <Link href={href} style={style}>{children}</Link>
}

export function StatusBadge({ level, label }: { level: 'critical' | 'risk' | 'stable'; label?: string }) {
  const color = level === 'critical' ? '#dc2626' : level === 'risk' ? '#d97706' : '#16a34a'
  const bg = level === 'critical' ? '#fee2e2' : level === 'risk' ? '#fef3c7' : '#dcfce7'
  const icon = level === 'critical' ? '🔴' : level === 'risk' ? '🟡' : '🟢'
  return <span style={{ ...badgeStyle, color, background: bg, borderColor: `${color}44` }}>{icon} {label || level.toUpperCase()}</span>
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div style={emptyStyle}><strong>{title}</strong><span>{text}</span></div>
}

export function UserWorkloadCard({ user, stats }: { user: any; stats: any }) {
  const pressure = stats.overdue * 25 + stats.open * 5 - stats.completed * 3
  const tone = pressure >= 80 ? 'critical' : pressure >= 40 ? 'risk' : 'stable'
  return (
    <Link href={`/users/${user.id}/tasks`} style={{ textDecoration: 'none' }}>
      <article style={userCardStyle}>
        <div style={rowStyle}>
          <div>
            <h3 style={cardTitleStyle}>{user.full_name || user.username || 'Unnamed user'}</h3>
            <p style={cardTextStyle}>{user.role || 'staff'} • {user.department || 'Revenue'}</p>
          </div>
          <StatusBadge level={tone as any} label={tone === 'critical' ? 'OVERLOAD' : tone === 'risk' ? 'WATCH' : 'OK'} />
        </div>
        <div style={miniGridStyle}>
          <Mini label="Open" value={stats.open} />
          <Mini label="Overdue" value={stats.overdue} danger />
          <Mini label="Progress" value={stats.progress} />
          <Mini label="Done" value={stats.completed} />
        </div>
      </article>
    </Link>
  )
}

function Mini({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return <div style={miniStyle}><span>{label}</span><strong style={{ color: danger ? '#dc2626' : '#0f172a' }}>{value}</strong></div>
}

const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const panelHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18 }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 950 }
const subStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 38px rgba(15,23,42,.05)', color: '#0f172a' }
const actionDarkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 950 }
const actionLightStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#fff', color: '#0f172a', border: '1px solid #dbe3ee', textDecoration: 'none', fontWeight: 950 }
const actionDangerStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', textDecoration: 'none', fontWeight: 950 }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderRadius: 999, border: '1px solid', fontSize: 11, fontWeight: 950 }
const emptyStyle: React.CSSProperties = { padding: 20, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', display: 'grid', gap: 6, fontWeight: 800 }
const userCardStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 22, padding: 16, background: 'linear-gradient(180deg,#fff,#f8fafc)', color: '#0f172a', display: 'grid', gap: 14 }
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }
const cardTitleStyle: React.CSSProperties = { margin: 0, fontSize: 17, fontWeight: 950, color: '#0f172a' }
const cardTextStyle: React.CSSProperties = { margin: '5px 0 0', color: '#64748b', fontWeight: 750 }
const miniGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }
const miniStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: 10, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }
