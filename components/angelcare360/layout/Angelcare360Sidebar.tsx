'use client'

import Link from 'next/link'
import type { Angelcare360ModuleSection } from '@/types/angelcare360/module'
import { ANGELCARE360_COLORS } from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Angelcare360SidebarProps = {
  open: boolean
  onClose: () => void
  sections: Angelcare360ModuleSection[]
  pathname: string
  showCloseButton: boolean
}

export default function Angelcare360Sidebar({ open, onClose, sections, pathname, showCloseButton }: Angelcare360SidebarProps) {
  return (
    <aside
      style={{
        ...sidebarStyle,
        transform: open ? 'translateX(0)' : undefined,
      }}
      aria-label="Navigation AngelCare 360"
    >
      <div style={sidebarHeaderStyle}>
        <div>
          <div style={sidebarEyebrowStyle}>ANGELCARE 360</div>
          <div style={sidebarTitleStyle}>Command Center</div>
        </div>
        {showCloseButton ? (
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            Fermer
          </button>
        ) : (
          <div aria-hidden="true" style={closeSpacerStyle} />
        )}
      </div>

      <div style={sidebarNoteStyle}>
        Navigation française, isolation stricte et périmètres opérationnels contrôlés.
      </div>

      <nav style={navStyle}>
        {sections.map((section) => (
          <div key={section.group} style={groupStyle}>
            <div style={groupTitleStyle}>{section.label}</div>
            <div style={groupSummaryStyle}>{section.summary}</div>
            <div style={groupItemsStyle}>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.endsWith(`/${item.id}`)
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    style={{
                      ...linkStyle,
                      ...(isActive ? activeLinkStyle : null),
                    }}
                    title={item.disabledActionReason}
                  >
                    <span>{item.label}</span>
                    <span style={badgeStyle}>{item.badge}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}

const sidebarStyle: React.CSSProperties = {
  width: 336,
  minWidth: 336,
  background: 'rgba(255,255,255,.97)',
  borderRight: `1px solid ${ANGELCARE360_COLORS.borderSoft}`,
  backdropFilter: 'blur(16px)',
  padding: 20,
  position: 'sticky',
  top: 0,
  height: '100vh',
  overflow: 'auto',
}

const sidebarHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'start',
  justifyContent: 'space-between',
  gap: 12,
}

const sidebarEyebrowStyle: React.CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  fontSize: 11,
  fontWeight: 900,
  color: '#2563eb',
}

const sidebarTitleStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 21,
  fontWeight: 900,
  color: ANGELCARE360_COLORS.navy,
}

const closeButtonStyle: React.CSSProperties = {
  border: `1px solid ${ANGELCARE360_COLORS.border}`,
  borderRadius: 12,
  padding: '8px 10px',
  background: ANGELCARE360_COLORS.white,
  color: ANGELCARE360_COLORS.navy,
  fontWeight: 800,
  cursor: 'pointer',
}

const closeSpacerStyle: React.CSSProperties = {
  width: 72,
  height: 36,
}

const sidebarNoteStyle: React.CSSProperties = {
  marginTop: 16,
  background: ANGELCARE360_COLORS.blueSoft,
  color: '#1e3a8a',
  borderRadius: 18,
  padding: 14,
  fontSize: 13,
  lineHeight: 1.55,
  fontWeight: 650,
}

const navStyle: React.CSSProperties = {
  marginTop: 18,
  display: 'grid',
  gap: 16,
}

const groupStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const groupTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  color: ANGELCARE360_COLORS.slateMuted,
}

const groupSummaryStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.55,
  color: ANGELCARE360_COLORS.slateMuted,
  fontWeight: 600,
}

const groupItemsStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const linkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 13px',
  borderRadius: 14,
  textDecoration: 'none',
  color: ANGELCARE360_COLORS.navy,
  border: `1px solid ${ANGELCARE360_COLORS.borderSoft}`,
  background: ANGELCARE360_COLORS.background,
  fontSize: 14,
  fontWeight: 750,
}

const activeLinkStyle: React.CSSProperties = {
  border: `1px solid ${ANGELCARE360_COLORS.blueBorderActive}`,
  background: ANGELCARE360_COLORS.blueSoft,
  boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.08)',
}

const badgeStyle: React.CSSProperties = {
  flexShrink: 0,
  borderRadius: 999,
  padding: '4px 8px',
  fontSize: 11,
  fontWeight: 900,
  color: ANGELCARE360_COLORS.blue,
  background: '#dbeafe',
}
