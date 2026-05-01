import Link from 'next/link'

export function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}

export function taskSignal(task: any) {
  if (task?.status === 'completed') return { icon: '🟢', label: 'COMPLETED', color: '#16a34a', reason: 'Task completed.' }
  const due = task?.due_at || task?.planned_end_at
  if (!due) return { icon: '🟡', label: 'NO DEADLINE', color: '#d97706', reason: 'Task needs a due date.' }
  const hours = (new Date(due).getTime() - Date.now()) / 36e5
  if (hours < 0) return { icon: '🔴', label: 'OVERDUE', color: '#dc2626', reason: 'Task is overdue and needs intervention.' }
  if (hours <= 24) return { icon: '🟡', label: 'DUE SOON', color: '#d97706', reason: 'Task is due within 24 hours.' }
  return { icon: '🟢', label: 'ON TRACK', color: '#16a34a', reason: 'Task is within planned timing.' }
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

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div style={emptyStyle}><strong>{title}</strong><span>{text}</span></div>
}

export function TimelineRow({ icon = '•', title, text, date }: { icon?: string; title: string; text?: string; date?: string | null }) {
  return <div style={timelineRowStyle}><div style={timelineIconStyle}>{icon}</div><div><strong>{title}</strong>{text ? <p>{text}</p> : null}<small>{formatDate(date)}</small></div></div>
}

export function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} style={linkStyle}>{children}</Link>
}

const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, padding: 20, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const panelHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 16 }
const panelTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 950 }
const panelSubtitleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.5 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 20, padding: 16, display: 'grid', gap: 6, color: '#0f172a', boxShadow: '0 14px 28px rgba(15,23,42,.05)' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderRadius: 999, border: '1px solid', fontSize: 11, fontWeight: 950 }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 16, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', display: 'grid', gap: 6, fontWeight: 800 }
const timelineRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '34px 1fr', gap: 10, padding: 12, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
const timelineIconStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#eef2ff', color: '#3730a3', fontWeight: 950 }
const linkStyle: React.CSSProperties = { display: 'inline-flex', padding: '11px 14px', borderRadius: 14, background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 950 }
