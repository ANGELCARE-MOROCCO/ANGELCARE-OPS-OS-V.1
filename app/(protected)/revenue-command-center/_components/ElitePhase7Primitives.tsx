import Link from 'next/link'

export function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}

export function Panel({ title, subtitle, children, action, dense = false }: { title?: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode; dense?: boolean }) {
  return (
    <section style={{ ...panelStyle, padding: dense ? 16 : 22 }}>
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
  return <div style={kpiStyle}><span>{title}</span><strong style={{ color: tone }}>{value}</strong>{sub ? <small>{sub}</small> : null}</div>
}

export function Badge({ children, tone = '#2563eb' }: { children: React.ReactNode; tone?: string }) {
  return <span style={{ ...badgeStyle, color: tone, background: `${tone}14`, borderColor: `${tone}44` }}>{children}</span>
}

export function ActionLink({ href, children, variant = 'dark' }: { href: string; children: React.ReactNode; variant?: 'dark' | 'light' | 'danger' }) {
  const style = variant === 'danger' ? actionDangerStyle : variant === 'light' ? actionLightStyle : actionDarkStyle
  return <Link href={href} style={style}>{children}</Link>
}

export function CommandButton({ href, title, subtitle, icon, tone = '#2563eb' }: { href: string; title: string; subtitle: string; icon: string; tone?: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <article style={{ ...commandButtonStyle, borderColor: `${tone}33` }}>
        <div style={{ ...iconStyle, color: tone, background: `${tone}12` }}>{icon}</div>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </article>
    </Link>
  )
}

export function SignalRow({ title, subtitle, severity = 'info', href }: { title: string; subtitle?: string; severity?: string; href?: string }) {
  const color = severity === 'critical' ? '#dc2626' : severity === 'warning' ? '#d97706' : severity === 'success' ? '#16a34a' : '#2563eb'
  const icon = severity === 'critical' ? '🔴' : severity === 'warning' ? '🟡' : severity === 'success' ? '🟢' : '🔵'
  const body = <div style={signalRowStyle}><span style={{ color }}>{icon}</span><div><strong>{title}</strong>{subtitle ? <p>{subtitle}</p> : null}</div></div>
  return href ? <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>{body}</Link> : body
}

export function TerminalDisplay({ lines }: { lines: string[] }) {
  return (
    <div style={terminalStyle}>
      {lines.map((line, i) => <div key={`${line}-${i}`}>▸ {line}</div>)}
    </div>
  )
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div style={emptyStyle}><strong>{title}</strong><span>{text}</span></div>
}

const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const panelHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 14 }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 19, fontWeight: 950 }
const subStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 750, fontSize: 13 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 20, padding: 14, display: 'grid', gap: 5, boxShadow: '0 14px 28px rgba(15,23,42,.05)', color: '#0f172a' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 999, border: '1px solid', fontSize: 10, fontWeight: 950 }
const actionDarkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '11px 13px', borderRadius: 13, background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 950 }
const actionLightStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '11px 13px', borderRadius: 13, background: '#fff', color: '#0f172a', border: '1px solid #dbe3ee', textDecoration: 'none', fontWeight: 950 }
const actionDangerStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '11px 13px', borderRadius: 13, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', textDecoration: 'none', fontWeight: 950 }
const commandButtonStyle: React.CSSProperties = { minHeight: 120, border: '1px solid', borderRadius: 22, padding: 15, background: 'linear-gradient(180deg,#fff,#f8fafc)', color: '#0f172a', display: 'grid', gridTemplateColumns: '44px 1fr', gap: 12, alignItems: 'start' }
const iconStyle: React.CSSProperties = { width: 42, height: 42, borderRadius: 16, display: 'grid', placeItems: 'center', fontSize: 22 }
const signalRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '24px 1fr', gap: 10, padding: 11, borderRadius: 15, background: '#f8fafc', border: '1px solid #e2e8f0' }
const terminalStyle: React.CSSProperties = { background: '#03140b', color: '#86efac', border: '1px solid rgba(134,239,172,.35)', borderRadius: 18, padding: 14, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: 12, lineHeight: 1.7, boxShadow: 'inset 0 0 22px rgba(34,197,94,.16), 0 18px 38px rgba(15,23,42,.08)' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 16, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', display: 'grid', gap: 6, fontWeight: 800 }
