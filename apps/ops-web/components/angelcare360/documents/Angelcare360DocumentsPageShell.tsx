import type { ReactNode } from 'react'
import Angelcare360DocumentsNavigation from './Angelcare360DocumentsNavigation'
import type { Angelcare360DocumentsNavigationItem } from '@/data/angelcare360/documents-navigation'
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
  navigationItems: Angelcare360DocumentsNavigationItem[]
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  children: ReactNode
}

export default function Angelcare360DocumentsPageShell({
  title,
  subtitle,
  badge,
  statusLabel,
  contextRow,
  navigationItems,
  primaryAction,
  secondaryActions,
  children,
}: Props) {
  return (
    <section style={shellStyle}>
      <header style={headerStyle}>
        <div style={headingStyle}>
          <div style={badgeRowStyle}>
            {badge ? <span style={badgeStyle}>{badge}</span> : null}
            {statusLabel ? <span style={statusStyle}>{statusLabel}</span> : null}
          </div>
          <h1 style={titleStyle}>{title}</h1>
          <p style={subtitleStyle}>{subtitle}</p>
        </div>
        <div style={actionsStyle}>
          {secondaryActions}
          {primaryAction}
        </div>
      </header>
      {contextRow ? <div style={contextStyle}>{contextRow}</div> : null}
      <Angelcare360DocumentsNavigation items={navigationItems} />
      <div style={contentStyle}>{children}</div>
    </section>
  )
}

const shellStyle: React.CSSProperties = { ...angelcare360PageShellStyle }
const headerStyle: React.CSSProperties = { ...angelcare360HeroBackdropStyle, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 18, alignItems: 'start', padding: 22 }
const headingStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const badgeRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const badgeStyle: React.CSSProperties = { ...angelcare360PillBlueStyle, width: 'fit-content' }
const statusStyle: React.CSSProperties = { ...angelcare360PillStyle }
const titleStyle: React.CSSProperties = { margin: 0, color: ANGELCARE360_COLORS.navy, fontSize: 30, lineHeight: 1.08, fontWeight: 950 }
const subtitleStyle: React.CSSProperties = { margin: 0, maxWidth: 980, color: ANGELCARE360_COLORS.slate, fontSize: 15.5, lineHeight: 1.65, fontWeight: 600 }
const contextStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, padding: 14, borderRadius: 20, border: `1px solid ${ANGELCARE360_COLORS.borderSoft}`, background: ANGELCARE360_COLORS.white, boxShadow: '0 14px 32px rgba(15,23,42,.04)' }
const actionsStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'end' }
const contentStyle: React.CSSProperties = { display: 'grid', gap: 16 }
