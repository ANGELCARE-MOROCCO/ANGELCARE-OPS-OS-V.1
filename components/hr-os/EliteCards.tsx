import Link from 'next/link'

export function ActionButton({
  href,
  children,
  variant = 'dark',
}: {
  href?: string
  children: React.ReactNode
  variant?: 'dark' | 'light' | 'danger' | 'success'
}) {
  const style =
    variant === 'danger'
      ? dangerStyle
      : variant === 'success'
      ? successStyle
      : variant === 'light'
      ? lightStyle
      : darkStyle

  if (href) return <Link href={href} style={style}>{children}</Link>
  return <span style={style}>{children}</span>
}

export function MetricCard({
  title,
  label,
  value,
  subtitle,
  delta,
  status,
  interpretation,
  action,
  tone = '#0f172a',
}: {
  title?: string
  label?: string
  value?: string | number
  subtitle?: string
  delta?: string
  status?: string
  interpretation?: string
  action?: string
  tone?: string
}) {
  const displayTitle = title || label || 'Metric'
  const safeValue = value ?? '-'

  return (
    <div style={metricStyle}>
      <div style={metricTopStyle}>
        <span>{displayTitle}</span>
        {status ? <RiskBadge risk={status}>{status}</RiskBadge> : null}
      </div>
      <strong style={{ color: tone }}>{safeValue}</strong>
      {subtitle || delta ? <small>{subtitle || delta}</small> : null}
      {interpretation ? <p style={metricTextStyle}>{interpretation}</p> : null}
      {action ? <p style={metricActionStyle}>{action}</p> : null}
    </div>
  )
}

export function WorkCard({
  title,
  eyebrow,
  subtitle,
  description,
  href,
  badge,
  footer,
  children,
}: {
  title: string
  eyebrow?: string
  subtitle?: string
  description?: string
  href?: string
  badge?: React.ReactNode
  footer?: React.ReactNode
  children?: React.ReactNode
}) {
  const body = (
    <article style={workCardStyle}>
      <div style={workTopStyle}>
        <div>
          {eyebrow ? <div style={eyebrowStyle}>{eyebrow}</div> : null}
          <h3 style={workTitleStyle}>{title}</h3>
          {subtitle ? <p style={workSubtitleStyle}>{subtitle}</p> : null}
        </div>
        {badge}
      </div>

      {description ? <p style={workDescriptionStyle}>{description}</p> : null}
      {children}
      {footer ? <div style={footerStyle}>{footer}</div> : null}
    </article>
  )

  if (href) return <Link href={href} style={{ textDecoration: 'none' }}>{body}</Link>
  return body
}

export function RiskBadge({
  level,
  risk,
  children,
}: {
  level?: 'critical' | 'risk' | 'stable' | 'info' | string
  risk?: string
  children?: React.ReactNode
}) {
  const resolved = level || risk || 'stable'
  const normalized = String(resolved).toLowerCase()

  const isCritical =
    normalized.includes('critical') ||
    normalized.includes('high') ||
    normalized.includes('approval') ||
    normalized.includes('severe') ||
    normalized.includes('red')

  const isRisk =
    normalized.includes('risk') ||
    normalized.includes('medium') ||
    normalized.includes('warning') ||
    normalized.includes('amber') ||
    normalized.includes('review')

  const isStable =
    normalized.includes('stable') ||
    normalized.includes('ok') ||
    normalized.includes('green') ||
    normalized.includes('low') ||
    normalized.includes('clean')

  const color = isCritical ? '#dc2626' : isRisk ? '#d97706' : isStable ? '#16a34a' : '#2563eb'
  const icon = isCritical ? '🔴' : isRisk ? '🟡' : isStable ? '🟢' : '🔵'
  const badgeLabel = children || String(resolved).toUpperCase()

  return (
    <span style={{ ...riskStyle, color, background: `${color}14`, borderColor: `${color}44` }}>
      {icon} {badgeLabel}
    </span>
  )
}

const baseButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 14px',
  borderRadius: 14,
  textDecoration: 'none',
  fontWeight: 950,
}

const darkStyle: React.CSSProperties = { ...baseButton, background: '#0f172a', color: '#fff' }
const lightStyle: React.CSSProperties = { ...baseButton, background: '#fff', color: '#0f172a', border: '1px solid #dbe3ee' }
const dangerStyle: React.CSSProperties = { ...baseButton, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }
const successStyle: React.CSSProperties = { ...baseButton, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }

const metricStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #dbe3ee',
  borderRadius: 22,
  padding: 18,
  display: 'grid',
  gap: 7,
  boxShadow: '0 18px 38px rgba(15,23,42,.05)',
  color: '#0f172a',
}

const metricTopStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'center',
}

const metricTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  lineHeight: 1.5,
  fontWeight: 700,
  fontSize: 13,
}

const metricActionStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  lineHeight: 1.5,
  fontWeight: 900,
  fontSize: 13,
}

const workCardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 16,
  background: 'linear-gradient(180deg,#fff,#f8fafc)',
  color: '#0f172a',
  display: 'grid',
  gap: 10,
  minHeight: 150,
}

const workTopStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'flex-start',
}

const eyebrowStyle: React.CSSProperties = {
  display: 'inline-flex',
  marginBottom: 8,
  padding: '5px 8px',
  borderRadius: 999,
  background: '#eef2ff',
  color: '#3730a3',
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: '.04em',
}

const workTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 17,
  fontWeight: 950,
  color: '#0f172a',
}

const workSubtitleStyle: React.CSSProperties = {
  margin: '5px 0 0',
  color: '#64748b',
  fontWeight: 750,
}

const workDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  lineHeight: 1.55,
  fontWeight: 700,
}

const footerStyle: React.CSSProperties = {
  marginTop: 4,
}

const riskStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 9px',
  borderRadius: 999,
  border: '1px solid',
  fontSize: 11,
  fontWeight: 950,
}
