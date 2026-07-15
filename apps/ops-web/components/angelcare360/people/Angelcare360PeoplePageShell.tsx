import type { ReactNode } from 'react'
import {
  ANGELCARE360_COLORS,
  angelcare360HeroBackdropStyle,
  angelcare360PageShellStyle,
  angelcare360PillBlueStyle,
  angelcare360PillStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Angelcare360PeoplePageShellProps = {
  title: string
  subtitle: string
  badge?: string
  statusLabel?: string
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  contextRow?: ReactNode
  children: ReactNode
}

export default function Angelcare360PeoplePageShell({
  title,
  subtitle,
  badge,
  statusLabel,
  primaryAction,
  secondaryActions,
  contextRow,
  children,
}: Angelcare360PeoplePageShellProps) {
  return (
    <section style={shellStyle}>
      <header style={headerStyle}>
        <div style={headingStyle}>
          <div style={eyebrowRowStyle}>
            {badge ? <span style={badgeStyle}>{badge}</span> : null}
            {statusLabel ? <span style={statusStyle}>{statusLabel}</span> : null}
          </div>
          <h1 style={titleStyle}>{title}</h1>
          <p style={subtitleStyle}>{subtitle}</p>
        </div>

        {primaryAction || secondaryActions ? <div style={actionsStyle}>{secondaryActions}{primaryAction}</div> : null}
      </header>

      {contextRow ? <div style={contextStyle}>{contextRow}</div> : null}
      <div style={contentStyle}>{children}</div>
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  ...angelcare360PageShellStyle,
}

const headerStyle: React.CSSProperties = {
  ...angelcare360HeroBackdropStyle,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'start',
  justifyContent: 'space-between',
  gap: 18,
  padding: 22,
}

const headingStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const eyebrowRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const badgeStyle: React.CSSProperties = {
  ...angelcare360PillBlueStyle,
  width: 'fit-content',
}

const statusStyle: React.CSSProperties = {
  ...angelcare360PillStyle,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: ANGELCARE360_COLORS.navy,
  fontSize: 30,
  lineHeight: 1.08,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: 940,
  color: ANGELCARE360_COLORS.slate,
  fontSize: 15.5,
  lineHeight: 1.65,
  fontWeight: 600,
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const contextStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  padding: 16,
  borderRadius: 22,
  background: ANGELCARE360_COLORS.white,
  border: `1px solid ${ANGELCARE360_COLORS.borderSoft}`,
  boxShadow: '0 14px 32px rgba(15,23,42,.04)',
}

const contentStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}
