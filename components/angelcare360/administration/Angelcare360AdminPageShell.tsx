'use client'

import type { ReactNode } from 'react'

type Angelcare360AdminPageShellProps = {
  title: string
  subtitle: string
  badge?: string
  statusLabel?: string
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  contextRow?: ReactNode
  children: ReactNode
}

export default function Angelcare360AdminPageShell({
  title,
  subtitle,
  badge,
  statusLabel,
  primaryAction,
  secondaryActions,
  contextRow,
  children,
}: Angelcare360AdminPageShellProps) {
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
  display: 'grid',
  gap: 18,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'start',
  justifyContent: 'space-between',
  gap: 16,
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
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#dbeafe',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 900,
}

const statusStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#eff6ff',
  color: '#1e40af',
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 28,
  lineHeight: 1.1,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: 900,
  color: '#475569',
  fontSize: 15,
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
}

const contentStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}
