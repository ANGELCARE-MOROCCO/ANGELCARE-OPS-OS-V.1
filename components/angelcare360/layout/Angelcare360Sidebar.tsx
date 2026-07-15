'use client'

import Link from 'next/link'
import type { Angelcare360ModuleSection } from '@/types/angelcare360/module'
import {
  ANGELCARE360_COLORS,
  angelcare360HeroBackdropStyle,
  angelcare360PillBlueStyle,
  angelcare360PillStyle,
  angelcare360SectionBackdropStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

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
          <div style={sidebarSubtitleStyle}>Espaces opérationnels, navigation contrôlée et états verrouillés.</div>
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
  width: 344,
  minWidth: 344,
  ...angelcare360SectionBackdropStyle,
  background:
    'linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(247,250,252,.98) 100%)',
  backdropFilter: 'blur(18px)',
  padding: 22,
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
  color: ANGELCARE360_COLORS.blueDeep,
}

const sidebarTitleStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 22,
  fontWeight: 900,
  color: ANGELCARE360_COLORS.navy,
}

const sidebarSubtitleStyle: React.CSSProperties = {
  marginTop: 6,
  color: ANGELCARE360_COLORS.slateMuted,
  fontSize: 12,
  lineHeight: 1.55,
  fontWeight: 650,
}

const closeButtonStyle: React.CSSProperties = {
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_COLORS.borderStrong,
  borderRadius: 12,
  padding: '8px 10px',
  background: ANGELCARE360_COLORS.white,
  color: ANGELCARE360_COLORS.navy,
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 10px 20px rgba(15,23,42,.05)',
}

const closeSpacerStyle: React.CSSProperties = {
  width: 72,
  height: 36,
}

const sidebarNoteStyle: React.CSSProperties = {
  marginTop: 16,
  ...angelcare360HeroBackdropStyle,
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
  ...angelcare360SectionBackdropStyle,
  padding: 14,
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
  borderRadius: 16,
  textDecoration: 'none',
  color: ANGELCARE360_COLORS.navy,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_COLORS.borderSoft,
  background: `linear-gradient(180deg, ${ANGELCARE360_COLORS.white} 0%, ${ANGELCARE360_COLORS.background} 100%)`,
  fontSize: 14,
  fontWeight: 750,
  boxShadow: '0 10px 24px rgba(15,23,42,.04)',
}

const activeLinkStyle: React.CSSProperties = {
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_COLORS.blueBorderActive,
  background: ANGELCARE360_COLORS.blueTint,
  boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.08), 0 12px 28px rgba(29,78,216,.08)',
}

const badgeStyle: React.CSSProperties = {
  flexShrink: 0,
  borderRadius: 999,
  padding: '4px 8px',
  fontSize: 11,
  fontWeight: 900,
  color: ANGELCARE360_COLORS.blueDeep,
  background: ANGELCARE360_COLORS.blueTint,
}
