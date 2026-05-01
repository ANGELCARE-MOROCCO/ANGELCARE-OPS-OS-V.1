import Link from 'next/link'

export function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}

export function formatCurrency(value?: number | string | null) {
  return `${Number(value || 0).toLocaleString('fr-FR')} MAD`
}

export function prioritySignal(item: any, type: 'task' | 'prospect' | 'appointment') {
  const now = Date.now()

  if (type === 'task') {
    if (item.status === 'completed') return { icon: '🟢', label: 'DONE', color: '#16a34a' }
    const due = item.due_at || item.planned_end_at
    if (!due) return { icon: '🟡', label: 'NO DEADLINE', color: '#d97706' }
    const hours = (new Date(due).getTime() - now) / 36e5
    if (hours < 0) return { icon: '🔴', label: 'OVERDUE', color: '#dc2626' }
    if (hours <= 24) return { icon: '🟡', label: 'TODAY', color: '#d97706' }
    return { icon: '🟢', label: 'PLANNED', color: '#16a34a' }
  }

  if (type === 'prospect') {
    if (!item.next_action && !item.next_action_at) return { icon: '🔴', label: 'NO NEXT ACTION', color: '#dc2626' }
    if (Number(item.estimated_value || 0) >= 10000) return { icon: '🟡', label: 'HIGH VALUE', color: '#d97706' }
    return { icon: '🟢', label: 'TRACKED', color: '#16a34a' }
  }

  const scheduled = item.scheduled_at
  if (!scheduled) return { icon: '🟡', label: 'NO TIME', color: '#d97706' }
  const hours = (new Date(scheduled).getTime() - now) / 36e5
  if (hours < 0) return { icon: '🔴', label: 'OUTCOME NEEDED', color: '#dc2626' }
  if (hours <= 24) return { icon: '🟡', label: 'TODAY', color: '#d97706' }
  return { icon: '🟢', label: 'SCHEDULED', color: '#16a34a' }
}

export function Panel({ title, subtitle, children, action }: { title?: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section style={panelStyle}>{(title || subtitle || action) ? <div style={panelHeaderStyle}><div>{title ? <h2 style={panelTitleStyle}>{title}</h2> : null}{subtitle ? <p style={panelSubtitleStyle}>{subtitle}</p> : null}</div>{action}</div> : null}{children}</section>
}

export function Kpi({ title, value, sub, tone = '#0f172a' }: { title: string; value: string | number; sub?: string; tone?: string }) {
  return <div style={kpiStyle}><span>{title}</span><strong style={{ color: tone }}>{value}</strong>{sub ? <small>{sub}</small> : null}</div>
}

export function Badge({ children, tone = '#2563eb' }: { children: React.ReactNode; tone?: string }) {
  return <span style={{ ...badgeStyle, color: tone, background: `${tone}14`, borderColor: `${tone}44` }}>{children}</span>
}

export function ActionLink({ href, children, variant = 'dark' }: { href: string; children: React.ReactNode; variant?: 'dark' | 'light' | 'success' }) {
  const style = variant === 'success' ? successButtonStyle : variant === 'light' ? lightButtonStyle : darkButtonStyle
  return <Link href={href} style={style}>{children}</Link>
}

export function WorkRow({ href, title, text, signal, meta }: { href: string; title: string; text?: string; signal: any; meta?: string }) {
  return <Link href={href} style={{ textDecoration: 'none' }}><article style={workRowStyle}><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}><Badge tone={signal.color}>{signal.icon} {signal.label}</Badge>{meta ? <Badge tone="#64748b">{meta}</Badge> : null}</div><h3 style={rowTitleStyle}>{title}</h3>{text ? <p style={rowTextStyle}>{text}</p> : null}</article></Link>
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div style={emptyStyle}><strong>{title}</strong><span>{text}</span></div>
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
const successButtonStyle: React.CSSProperties = { ...baseButtonStyle, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }
const workRowStyle: React.CSSProperties = { padding: 14, borderRadius: 18, background: 'linear-gradient(180deg,#fff,#f8fafc)', border: '1px solid #e2e8f0', color: '#0f172a', display: 'grid', gap: 8 }
const rowTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 16, fontWeight: 950 }
const rowTextStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', lineHeight: 1.5, fontWeight: 700 }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 16, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', display: 'grid', gap: 6, fontWeight: 800 }
