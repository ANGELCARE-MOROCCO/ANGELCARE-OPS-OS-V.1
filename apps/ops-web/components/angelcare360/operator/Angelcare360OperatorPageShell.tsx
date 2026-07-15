import type { ReactNode } from 'react'
import { ANGELCARE360_OPERATOR_COLORS, operatorHeroBackground } from './Angelcare360OperatorVisualSystem'

type Props = {
  title: string
  subtitle: string
  badge?: string
  statusLabel?: string
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  contextRow?: ReactNode
  children: ReactNode
}

export default function Angelcare360OperatorPageShell({
  title,
  subtitle,
  badge,
  statusLabel,
  primaryAction,
  secondaryActions,
  contextRow,
  children,
}: Props) {
  return (
    <section style={shellStyle}>
      <header style={headerStyle}>
        <div style={heroStyle}>
          <div style={headingStyle}>
            <div style={eyebrowRowStyle}>
              {badge ? <span style={badgeStyle}>{badge}</span> : null}
              {statusLabel ? <span style={statusStyle}>{statusLabel}</span> : null}
            </div>
            <h1 style={titleStyle}>{title}</h1>
            <p style={subtitleStyle}>{subtitle}</p>
          </div>
          {primaryAction || secondaryActions ? <div style={actionsStyle}>{secondaryActions}{primaryAction}</div> : null}
        </div>
      </header>
      {contextRow ? <div style={contextStyle}>{contextRow}</div> : null}
      <div style={contentStyle}>{children}</div>
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 20,
}

const headerStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const heroStyle: React.CSSProperties = {
  ...operatorHeroBackground,
  padding: 24,
  display: 'grid',
  gap: 16,
}

const headingStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}

const eyebrowRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: ANGELCARE360_OPERATOR_COLORS.blueSoft,
  color: ANGELCARE360_OPERATOR_COLORS.blue,
  fontSize: 12,
  fontWeight: 900,
}

const statusStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: ANGELCARE360_OPERATOR_COLORS.background,
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 12,
  fontWeight: 900,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 32,
  lineHeight: 1.06,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: 980,
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  fontSize: 15,
  lineHeight: 1.7,
  fontWeight: 600,
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  justifyContent: 'end',
}

const contextStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  padding: 14,
  borderRadius: 20,
  background: ANGELCARE360_OPERATOR_COLORS.white,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
  boxShadow: '0 14px 38px rgba(15,23,42,.04)',
}

const contentStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}
