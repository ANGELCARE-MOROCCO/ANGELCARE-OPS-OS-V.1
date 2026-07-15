'use client'

import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle: string
  badge?: string
  statusLabel?: string
  contextRow?: ReactNode
  navigation: ReactNode
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  children: ReactNode
}

export default function Angelcare360ClaimsPageShell({
  title,
  subtitle,
  badge,
  statusLabel,
  contextRow,
  navigation,
  primaryAction,
  secondaryActions,
  children,
}: Props) {
  return (
    <div style={shellStyle}>
      <header style={heroStyle}>
        <div style={heroTextStyle}>
          {badge ? <span style={badgeStyle}>{badge}</span> : null}
          <h1 style={titleStyle}>{title}</h1>
          <p style={subtitleStyle}>{subtitle}</p>
          <div style={contextRowStyle}>{contextRow}</div>
        </div>
        <div style={heroActionsStyle}>
          {statusLabel ? <span style={statusStyle}>{statusLabel}</span> : null}
          <div style={actionRowStyle}>
            {primaryAction}
            {secondaryActions}
          </div>
        </div>
      </header>
      <div style={navigationStyle}>{navigation}</div>
      <main style={mainStyle}>{children}</main>
    </div>
  )
}

const shellStyle: React.CSSProperties = { display: 'grid', gap: 18 }
const heroStyle: React.CSSProperties = { display: 'grid', gap: 16, gridTemplateColumns: '1.6fr .9fr', alignItems: 'start', padding: 24, borderRadius: 28, border: '1px solid #dbe4ef', background: 'linear-gradient(135deg,#ffffff 0%,#fffaf8 100%)', boxShadow: '0 24px 70px rgba(15,23,42,.06)' }
const heroTextStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 10px', background: '#fff7ed', color: '#c2410c', fontSize: 12, fontWeight: 900, width: 'fit-content' }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 34, lineHeight: 1.05, fontWeight: 950 }
const subtitleStyle: React.CSSProperties = { margin: 0, color: '#475569', lineHeight: 1.65, fontWeight: 600, maxWidth: 820 }
const contextRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const heroActionsStyle: React.CSSProperties = { display: 'grid', gap: 12, justifyItems: 'end' }
const statusStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, padding: '8px 12px', background: '#f8fafc', color: '#0f172a', fontSize: 12, fontWeight: 900, border: '1px solid #e2e8f0' }
const actionRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'end' }
const navigationStyle: React.CSSProperties = { overflowX: 'auto', paddingBottom: 4 }
const mainStyle: React.CSSProperties = { display: 'grid', gap: 18 }

