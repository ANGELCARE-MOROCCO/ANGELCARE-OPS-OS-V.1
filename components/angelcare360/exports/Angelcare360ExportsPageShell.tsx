import type { ReactNode } from 'react'
import Angelcare360ExportsNavigation from './Angelcare360ExportsNavigation'
import type { Angelcare360ExportsNavigationItem } from '@/data/angelcare360/exports-navigation'

type Props = {
  title: string
  subtitle: string
  badge?: string
  statusLabel?: string
  contextRow?: ReactNode
  navigationItems: Angelcare360ExportsNavigationItem[]
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  children: ReactNode
}

export default function Angelcare360ExportsPageShell({
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
      <Angelcare360ExportsNavigation items={navigationItems} />
      <div style={contentStyle}>{children}</div>
    </section>
  )
}

const shellStyle: React.CSSProperties = { display: 'grid', gap: 18 }
const headerStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, alignItems: 'start' }
const headingStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const badgeRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 10px', background: '#fef3c7', color: '#b45309', fontSize: 12, fontWeight: 900 }
const statusStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 10px', background: '#f8fafc', color: '#0f172a', fontSize: 12, fontWeight: 900, border: '1px solid #e2e8f0' }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 30, lineHeight: 1.08, fontWeight: 950 }
const subtitleStyle: React.CSSProperties = { margin: 0, maxWidth: 980, color: '#475569', fontSize: 15, lineHeight: 1.65, fontWeight: 600 }
const contextStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const actionsStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'end' }
const contentStyle: React.CSSProperties = { display: 'grid', gap: 16 }
