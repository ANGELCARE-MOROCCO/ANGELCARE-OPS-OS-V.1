'use client'

import type { ReactNode } from 'react'
import {
  ANGELCARE360_COLORS,
  angelcare360HeroBackdropStyle,
  angelcare360PageShellStyle,
  angelcare360PillBlueStyle,
  angelcare360PillStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

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

export default function Angelcare360NotificationsPageShell({
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

const shellStyle: React.CSSProperties = { ...angelcare360PageShellStyle }
const heroStyle: React.CSSProperties = { ...angelcare360HeroBackdropStyle, display: 'grid', gap: 18, gridTemplateColumns: '1.6fr .9fr', alignItems: 'start', padding: 24 }
const heroTextStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const badgeStyle: React.CSSProperties = { ...angelcare360PillBlueStyle, width: 'fit-content' }
const titleStyle: React.CSSProperties = { margin: 0, color: ANGELCARE360_COLORS.navy, fontSize: 34, lineHeight: 1.05, fontWeight: 950 }
const subtitleStyle: React.CSSProperties = { margin: 0, color: ANGELCARE360_COLORS.slate, lineHeight: 1.65, fontWeight: 600, maxWidth: 820 }
const contextRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, padding: 14, borderRadius: 20, border: `1px solid ${ANGELCARE360_COLORS.borderSoft}`, background: ANGELCARE360_COLORS.white, boxShadow: '0 14px 32px rgba(15,23,42,.04)' }
const heroActionsStyle: React.CSSProperties = { display: 'grid', gap: 12, justifyItems: 'end' }
const statusStyle: React.CSSProperties = { ...angelcare360PillStyle, justifyContent: 'center' }
const actionRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'end' }
const navigationStyle: React.CSSProperties = { overflowX: 'auto', paddingBottom: 4, borderRadius: 20, padding: 4, background: ANGELCARE360_COLORS.white, border: `1px solid ${ANGELCARE360_COLORS.borderSoft}`, boxShadow: '0 14px 32px rgba(15,23,42,.04)' }
const mainStyle: React.CSSProperties = { display: 'grid', gap: 18 }
