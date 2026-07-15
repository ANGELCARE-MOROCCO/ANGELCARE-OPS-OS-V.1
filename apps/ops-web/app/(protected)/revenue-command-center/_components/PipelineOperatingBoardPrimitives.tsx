import Link from 'next/link'

export const PIPELINE_STAGES = [
  'new',
  'prospecting',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
]

export function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}

export function formatCurrency(value?: number | string | null) {
  return `${Number(value || 0).toLocaleString('fr-FR')} MAD`
}

export function prospectSignal(prospect: any) {
  const value = Number(prospect?.estimated_value || 0)
  const hasNext = Boolean(prospect?.next_action || prospect?.next_action_at)
  const last = prospect?.last_interaction_at || prospect?.updated_at || prospect?.created_at
  const hours = last ? (Date.now() - new Date(last).getTime()) / 36e5 : 999

  if (prospect?.stage === 'lost') return { icon: '⚫', label: 'LOST', color: '#64748b', reason: 'Closed lost.' }
  if (prospect?.stage === 'won') return { icon: '🟢', label: 'WON', color: '#16a34a', reason: 'Closed won.' }
  if (!hasNext) return { icon: '🔴', label: 'NO NEXT ACTION', color: '#dc2626', reason: 'No next action defined.' }
  if (hours >= 72 && value >= 5000) return { icon: '🔴', label: 'STUCK HIGH VALUE', color: '#dc2626', reason: 'High value prospect inactive 72h+.' }
  if (hours >= 48) return { icon: '🟡', label: 'STUCK', color: '#d97706', reason: 'Inactive 48h+.' }
  if (value >= 10000) return { icon: '🟣', label: 'HIGH VALUE', color: '#7c3aed', reason: 'High value prospect.' }
  return { icon: '🟢', label: 'ACTIVE', color: '#16a34a', reason: 'Tracked and active.' }
}

export function Panel({ title, subtitle, children, action }: { title?: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section style={panelStyle}>
      {(title || subtitle || action) ? (
        <div style={panelHeaderStyle}>
          <div>
            {title ? <h2 style={panelTitleStyle}>{title}</h2> : null}
            {subtitle ? <p style={panelSubtitleStyle}>{subtitle}</p> : null}
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

export function ActionLink({ href, children, variant = 'dark' }: { href: string; children: React.ReactNode; variant?: 'dark' | 'light' | 'danger' | 'success' }) {
  const style = variant === 'danger' ? dangerButtonStyle : variant === 'success' ? successButtonStyle : variant === 'light' ? lightButtonStyle : darkButtonStyle
  return <Link href={href} style={style}>{children}</Link>
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div style={emptyStyle}><strong>{title}</strong><span>{text}</span></div>
}

export function ProspectMiniCard({ prospect, taskCount = 0, ownerName }: { prospect: any; taskCount?: number; ownerName?: string }) {
  const signal = prospectSignal(prospect)
  return (
    <Link href={`/revenue-command-center/prospects/${prospect.id}`} style={{ textDecoration: 'none' }}>
      <article style={miniCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
          <Badge tone={signal.color}>{signal.icon} {signal.label}</Badge>
          <strong style={{ color: '#0f172a', fontSize: 12 }}>{formatCurrency(prospect.estimated_value)}</strong>
        </div>
        <h3 style={miniTitleStyle}>{prospect.name || 'Unnamed prospect'}</h3>
        <p style={miniTextStyle}>{prospect.segment || 'No segment'} • {prospect.city || 'No city'}</p>
        <p style={miniTextStyle}>Owner: {ownerName || 'Unassigned'} • Tasks: {taskCount}</p>
        <div style={nextActionStyle}>
          <span>Next:</span>
          <strong>{prospect.next_action || 'Missing'}</strong>
          <small>{formatDate(prospect.next_action_at)}</small>
        </div>
      </article>
    </Link>
  )
}

export function OwnerLoadCard({ owner, count, overdue, value }: { owner: any; count: number; overdue: number; value: number }) {
  return (
    <article style={ownerCardStyle}>
      <div>
        <h3 style={miniTitleStyle}>{owner?.full_name || owner?.username || 'Unassigned'}</h3>
        <p style={miniTextStyle}>{owner?.role || 'Revenue user'}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        <SmallMetric label="Prospects" value={count} />
        <SmallMetric label="Gaps" value={overdue} danger />
        <SmallMetric label="Value" value={formatCurrency(value)} />
      </div>
    </article>
  )
}

function SmallMetric({ label, value, danger }: { label: string; value: string | number; danger?: boolean }) {
  return <div style={smallMetricStyle}><span>{label}</span><strong style={{ color: danger ? '#dc2626' : '#0f172a' }}>{value}</strong></div>
}

const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, padding: 20, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const panelHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 16 }
const panelTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 950 }
const panelSubtitleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.5 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 20, padding: 16, display: 'grid', gap: 6, color: '#0f172a', boxShadow: '0 14px 28px rgba(15,23,42,.05)' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderRadius: 999, border: '1px solid', fontSize: 11, fontWeight: 950 }
const baseButtonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, padding: '12px 14px', fontWeight: 950, textDecoration: 'none', cursor: 'pointer', border: 'none' }
const darkButtonStyle: React.CSSProperties = { ...baseButtonStyle, background: '#0f172a', color: '#fff' }
const lightButtonStyle: React.CSSProperties = { ...baseButtonStyle, background: '#fff', color: '#0f172a', border: '1px solid #dbe3ee' }
const dangerButtonStyle: React.CSSProperties = { ...baseButtonStyle, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }
const successButtonStyle: React.CSSProperties = { ...baseButtonStyle, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 16, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', display: 'grid', gap: 6, fontWeight: 800 }
const miniCardStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 18, padding: 14, background: 'linear-gradient(180deg,#fff,#f8fafc)', color: '#0f172a', display: 'grid', gap: 9 }
const miniTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 16, fontWeight: 950 }
const miniTextStyle: React.CSSProperties = { margin: 0, color: '#64748b', fontWeight: 750, lineHeight: 1.45, fontSize: 13 }
const nextActionStyle: React.CSSProperties = { display: 'grid', gap: 3, padding: 10, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }
const ownerCardStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#f8fafc' }
const smallMetricStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: 8, borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0', fontSize: 12 }
