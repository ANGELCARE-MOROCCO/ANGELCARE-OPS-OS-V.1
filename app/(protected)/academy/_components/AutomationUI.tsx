import Link from 'next/link'
import type { AutomationSignal } from '../_lib/automationEngine'

const severityColors: Record<string, string> = {
  low: '#64748b',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7f1d1d',
}

export function AutomationSignalPanel({ signals }: { signals: AutomationSignal[] }) {
  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Automation & Exception Queue</h2>
          <p style={textStyle}>System-generated management actions across payments, attendance, eligibility, certification, and placement.</p>
        </div>
        <strong style={countStyle}>{signals.length} signal(s)</strong>
      </div>

      <div style={gridStyle}>
        {signals.length ? signals.map((signal) => (
          <Link key={signal.id} href={signal.href} style={signalStyle(severityColors[signal.severity])}>
            <span style={badgeStyle(severityColors[signal.severity])}>{signal.severity.toUpperCase()}</span>
            <strong>{signal.title}</strong>
            <p>{signal.message}</p>
            <small>{signal.actionLabel} →</small>
          </Link>
        )) : (
          <div style={emptyStyle}>No critical Academy exception detected. Maintain daily monitoring rhythm.</div>
        )}
      </div>
    </section>
  )
}

export function ExecutivePlaybook() {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>Academy Executive Playbook</h2>
      <div style={playbookGridStyle}>
        {[
          ['Morning Control', 'Review exceptions, overdue payments, attendance risks, and group capacity before 10:00.'],
          ['Midday Dispatch', 'Confirm trainer/location readiness and unblock eligibility/enrollment decisions.'],
          ['Evening Closure', 'Audit completed actions, certification readiness, and next-day follow-ups.'],
          ['Weekly Board View', 'Review revenue collection, completion rate, placement pipeline, and partner opportunities.'],
        ].map(([title, body]) => (
          <div key={title} style={playbookCardStyle}>
            <strong>{title}</strong>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 28, padding: 24, boxShadow: '0 22px 48px rgba(15,23,42,.07)', display: 'grid', gap: 18 }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start' }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 950 }
const textStyle: React.CSSProperties = { margin: '8px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.55 }
const countStyle: React.CSSProperties = { padding: '10px 13px', borderRadius: 999, background: '#0f172a', color: '#fff', fontSize: 12 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }
const signalStyle = (tone: string): React.CSSProperties => ({ display: 'grid', gap: 8, textDecoration: 'none', color: '#0f172a', padding: 16, borderRadius: 20, background: `${tone}10`, border: `1px solid ${tone}44` })
const badgeStyle = (tone: string): React.CSSProperties => ({ width: 'fit-content', padding: '5px 9px', borderRadius: 999, background: `${tone}22`, border: `1px solid ${tone}55`, fontSize: 10, fontWeight: 950, color: '#0f172a' })
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 850 }
const playbookGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }
const playbookCardStyle: React.CSSProperties = { padding: 16, borderRadius: 20, background: 'linear-gradient(180deg,#f8fafc,#eef2ff)', border: '1px solid #dbe3ee', color: '#0f172a' }
