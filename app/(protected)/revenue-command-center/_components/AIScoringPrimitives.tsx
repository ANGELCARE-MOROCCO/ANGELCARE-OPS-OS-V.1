import Link from 'next/link'

export function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}

export function formatCurrency(value?: number | string | null) {
  return `${Number(value || 0).toLocaleString('fr-FR')} MAD`
}

export function scoreTone(score?: number | null) {
  const value = Number(score || 0)
  if (value >= 80) return '#16a34a'
  if (value >= 65) return '#7c3aed'
  if (value >= 45) return '#d97706'
  return '#dc2626'
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

export function ScoreBar({ label, value, tone }: { label: string; value: number; tone?: string }) {
  const color = tone || scoreTone(value)
  return (
    <div style={scoreWrapStyle}>
      <div style={scoreLabelStyle}><span>{label}</span><strong>{value}</strong></div>
      <div style={trackStyle}><div style={{ ...barStyle, width: `${Math.max(0, Math.min(100, value))}%`, background: color }} /></div>
    </div>
  )
}

export function ProspectScoreCard({ prospect }: { prospect: any }) {
  const tone = scoreTone(prospect.ai_score)
  return (
    <Link href={`/revenue-command-center/prospects/${prospect.id}`} style={{ textDecoration: 'none' }}>
      <article style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <Badge tone={tone}>AI SCORE {prospect.ai_score || 0}</Badge>
          <strong style={{ color: '#0f172a' }}>{formatCurrency(prospect.estimated_value)}</strong>
        </div>
        <h3 style={cardTitleStyle}>{prospect.name || 'Unnamed prospect'}</h3>
        <p style={cardTextStyle}>{prospect.segment || 'No segment'} • {prospect.stage || prospect.status || 'No stage'}</p>
        <ScoreBar label="Revenue" value={Number(prospect.ai_revenue_score || 0)} />
        <ScoreBar label="Urgency" value={Number(prospect.ai_urgency_score || 0)} />
        <ScoreBar label="Risk" value={Number(prospect.ai_risk_score || 0)} tone="#dc2626" />
        <p style={recommendationStyle}>{prospect.ai_next_best_action || 'Run AI scoring to generate next best action.'}</p>
      </article>
    </Link>
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
const cardStyle: React.CSSProperties = { padding: 16, borderRadius: 20, background: 'linear-gradient(180deg,#fff,#f8fafc)', border: '1px solid #e2e8f0', display: 'grid', gap: 10, color: '#0f172a' }
const cardTitleStyle: React.CSSProperties = { margin: 0, fontSize: 17, fontWeight: 950, color: '#0f172a' }
const cardTextStyle: React.CSSProperties = { margin: 0, color: '#64748b', lineHeight: 1.55, fontWeight: 700 }
const recommendationStyle: React.CSSProperties = { margin: 0, color: '#0f172a', lineHeight: 1.55, fontWeight: 900, background: '#eef2ff', border: '1px solid #c7d2fe', padding: 10, borderRadius: 14 }
const scoreWrapStyle: React.CSSProperties = { display: 'grid', gap: 5 }
const scoreLabelStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 12, fontWeight: 900 }
const trackStyle: React.CSSProperties = { width: '100%', height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const barStyle: React.CSSProperties = { height: '100%', borderRadius: 999 }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 16, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', display: 'grid', gap: 6, fontWeight: 800 }
