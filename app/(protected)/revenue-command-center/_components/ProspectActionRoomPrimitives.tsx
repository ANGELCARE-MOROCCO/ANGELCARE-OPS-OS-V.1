import Link from 'next/link'

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

  if (!hasNext) return { level: 'critical', icon: '🔴', label: 'NO NEXT ACTION', color: '#dc2626', reason: 'This prospect has no defined next action.' }
  if (hours >= 72 && value >= 5000) return { level: 'critical', icon: '🔴', label: 'HIGH VALUE INACTIVE', color: '#dc2626', reason: 'High-value prospect inactive for more than 72 hours.' }
  if (hours >= 48) return { level: 'risk', icon: '🟡', label: 'FOLLOW-UP RISK', color: '#d97706', reason: 'Prospect has been inactive for more than 48 hours.' }
  return { level: 'stable', icon: '🟢', label: 'ON TRACK', color: '#16a34a', reason: 'Prospect has recent activity or defined next action.' }
}

export function Panel({ title, subtitle, children, action }: { title?: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section style={panelStyle}>
      {(title || subtitle || action) ? (
        <div style={panelHeaderStyle}>
          <div>{title ? <h2 style={panelTitleStyle}>{title}</h2> : null}{subtitle ? <p style={panelSubtitleStyle}>{subtitle}</p> : null}</div>
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

export function ActionButton({ href, children, variant = 'dark' }: { href?: string; children: React.ReactNode; variant?: 'dark' | 'light' | 'danger' | 'success' }) {
  const style = variant === 'danger' ? dangerButtonStyle : variant === 'success' ? successButtonStyle : variant === 'light' ? lightButtonStyle : darkButtonStyle
  if (href) return <Link href={href} style={style}>{children}</Link>
  return <span style={style}>{children}</span>
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div style={emptyStyle}><strong>{title}</strong><span>{text}</span></div>
}

export function TimelineRow({ icon = '•', title, text, date }: { icon?: string; title: string; text?: string; date?: string | null }) {
  return (
    <div style={timelineRowStyle}>
      <div style={timelineIconStyle}>{icon}</div>
      <div><strong>{title}</strong>{text ? <p>{text}</p> : null}<small>{formatDate(date)}</small></div>
    </div>
  )
}

export function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return <div style={fieldStyle}><span>{label}</span><strong>{value || '—'}</strong></div>
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
const timelineRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '34px 1fr', gap: 10, padding: 12, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
const timelineIconStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#eef2ff', color: '#3730a3', fontWeight: 950 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 12, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
