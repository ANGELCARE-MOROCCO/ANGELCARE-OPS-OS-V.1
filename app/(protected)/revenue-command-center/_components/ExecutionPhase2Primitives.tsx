import Link from 'next/link'
import { getSignalVisual, formatDate } from '../_lib/executionIntelligence'

export function SignalBadge({ level }: { level?: string }) {
  const s = getSignalVisual(level)
  return <span style={{ ...badgeStyle, color: s.color, background: s.bg, borderColor: s.border }}>{s.icon} {s.label}</span>
}

export function ScorePill({ score }: { score?: number }) {
  const value = Number(score || 0)
  const color = value >= 80 ? '#dc2626' : value >= 55 ? '#d97706' : '#16a34a'
  return <span style={{ ...scoreStyle, color, background: `${color}14`, borderColor: `${color}55` }}>Score {value}</span>
}

export function Panel({ title, subtitle, children, action }: { title?: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section style={panelStyle}>{(title || subtitle || action) ? <div style={panelHeaderStyle}><div>{title ? <h2 style={titleStyle}>{title}</h2> : null}{subtitle ? <p style={subStyle}>{subtitle}</p> : null}</div>{action}</div> : null}{children}</section>
}

export function Kpi({ title, value, sub, tone = '#0f172a' }: { title: string; value: string | number; sub?: string; tone?: string }) {
  return <div style={kpiStyle}><span>{title}</span><strong style={{ color: tone }}>{value}</strong>{sub ? <small>{sub}</small> : null}</div>
}

export function WorkCard({ title, description, level, score, href, meta }: { title: string; description?: string; level?: string; score?: number; href: string; meta?: string }) {
  return <Link href={href} style={{ textDecoration: 'none' }}><article style={cardStyle}><div style={topStyle}><SignalBadge level={level} /><ScorePill score={score} /></div><h3 style={cardTitleStyle}>{title}</h3><p style={cardTextStyle}>{description || 'No description.'}</p>{meta ? <small style={metaStyle}>{meta}</small> : null}</article></Link>
}

export function TaskMini({ task, signal }: { task: any; signal: any }) {
  return <WorkCard title={task.title || 'Untitled task'} description={signal.reason} level={signal.level} score={signal.score} href={`/revenue-command-center/tasks/${task.id}`} meta={`Due: ${formatDate(task.due_at || task.planned_end_at)} • ${signal.action}`} />
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div style={emptyStyle}><strong>{title}</strong><span>{text}</span></div>
}

export function ActionLink({ href, children, variant = 'dark' }: { href: string; children: React.ReactNode; variant?: 'dark' | 'light' }) {
  return <Link href={href} style={variant === 'dark' ? actionDarkStyle : actionLightStyle}>{children}</Link>
}

const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderRadius: 999, border: '1px solid', fontSize: 11, fontWeight: 950 }
const scoreStyle: React.CSSProperties = { display: 'inline-flex', padding: '6px 9px', borderRadius: 999, border: '1px solid', fontSize: 11, fontWeight: 950 }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const panelHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18 }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 950 }
const subStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 38px rgba(15,23,42,.05)', color: '#0f172a' }
const cardStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 22, padding: 16, background: 'linear-gradient(180deg,#fff,#f8fafc)', display: 'grid', gap: 10, color: '#0f172a', minHeight: 170 }
const topStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }
const cardTitleStyle: React.CSSProperties = { margin: 0, fontSize: 17, fontWeight: 950, color: '#0f172a' }
const cardTextStyle: React.CSSProperties = { margin: 0, color: '#64748b', lineHeight: 1.55, fontWeight: 700 }
const metaStyle: React.CSSProperties = { color: '#475569', fontWeight: 850 }
const emptyStyle: React.CSSProperties = { padding: 20, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', display: 'grid', gap: 6, fontWeight: 800 }
const actionDarkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 950 }
const actionLightStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#fff', color: '#0f172a', border: '1px solid #dbe3ee', textDecoration: 'none', fontWeight: 950 }
