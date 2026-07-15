'use client'

import Link from 'next/link'
import { ANGELCARE360_OPERATOR_COLORS } from './Angelcare360OperatorVisualSystem'
import type { Angelcare360OperatorNavigationSection } from '@/types/angelcare360/operator'

type Props = {
  sections: Angelcare360OperatorNavigationSection[]
  pathname: string
  open: boolean
  onClose: () => void
  showCloseButton: boolean
}

export default function Angelcare360OperatorSidebar({ sections, pathname, open, onClose, showCloseButton }: Props) {
  return (
    <aside
      aria-label="Navigation du backoffice opérateur AngelCare"
      style={{
        ...sidebarStyle,
        transform: open ? 'translateX(0)' : undefined,
      }}
    >
      <div style={brandCardStyle}>
        <div style={brandEyebrowStyle}>Espace interne</div>
        <div style={brandTitleStyle}>Backoffice Opérateur AngelCare 360</div>
        <div style={brandSubtitleStyle}>Pilotage SaaS, monétisation, clients et service.</div>
      </div>

      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Navigation</div>
          <div style={titleStyle}>Catalogue des modules</div>
        </div>
        {showCloseButton ? (
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            Fermer
          </button>
        ) : (
          <div aria-hidden="true" style={{ width: 72, height: 36 }} />
        )}
      </div>

      <div style={noteStyle}>
        Espace interne AngelCare réservé aux opérations SaaS, à la monétisation et au pilotage client.
      </div>

      <nav style={navStyle}>
        {sections.map((section) => (
          <div key={section.group} style={groupStyle}>
            <div style={groupLabelStyle}>{section.label}</div>
            <div style={groupSummaryStyle}>{section.summary}</div>
            <div style={groupItemsStyle}>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    style={{
                      ...linkStyle,
                      ...(isActive ? activeLinkStyle : null),
                    }}
                    title={item.summary}
                  >
                    <div style={linkContentStyle}>
                      <div style={linkLabelStyle}>{item.label}</div>
                      <div style={linkSummaryStyle}>{item.summary}</div>
                    </div>
                    {item.badge ? <span style={badgeStyle}>{item.badge}</span> : null}
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
  width: 360,
  minWidth: 360,
  background:
    'linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(247,251,255,.98) 100%)',
  borderRight: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
  backdropFilter: 'blur(16px)',
  padding: 20,
  position: 'sticky',
  top: 0,
  height: '100vh',
  overflow: 'auto',
}

const brandCardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: 16,
  borderRadius: 22,
  background:
    'linear-gradient(135deg, rgba(239,246,255,.95) 0%, rgba(255,255,255,.98) 100%)',
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.blueBorder}`,
  boxShadow: '0 16px 42px rgba(15,23,42,.05)',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'start',
  justifyContent: 'space-between',
  gap: 12,
  marginTop: 16,
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  fontSize: 11,
  fontWeight: 900,
  color: ANGELCARE360_OPERATOR_COLORS.blue,
}

const titleStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 21,
  fontWeight: 950,
  color: ANGELCARE360_OPERATOR_COLORS.navy,
}

const brandEyebrowStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.blue,
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 11,
  fontWeight: 900,
}

const brandTitleStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 18,
  lineHeight: 1.1,
  fontWeight: 950,
}

const brandSubtitleStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  fontSize: 13,
  lineHeight: 1.55,
  fontWeight: 600,
}

const closeButtonStyle: React.CSSProperties = {
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.border}`,
  borderRadius: 12,
  padding: '8px 10px',
  background: ANGELCARE360_OPERATOR_COLORS.white,
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontWeight: 800,
  cursor: 'pointer',
}

const noteStyle: React.CSSProperties = {
  marginTop: 16,
  background:
    'linear-gradient(180deg, rgba(239,246,255,.98) 0%, rgba(255,255,255,.98) 100%)',
  color: '#1e3a8a',
  borderRadius: 18,
  padding: 14,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.blueBorder}`,
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
  padding: 14,
  borderRadius: 18,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
  background: ANGELCARE360_OPERATOR_COLORS.white,
  boxShadow: '0 12px 32px rgba(15,23,42,.04)',
}

const groupLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  color: ANGELCARE360_OPERATOR_COLORS.blue,
}

const groupSummaryStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.55,
  color: ANGELCARE360_OPERATOR_COLORS.slateMuted,
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
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
  background: ANGELCARE360_OPERATOR_COLORS.background,
  fontSize: 14,
  fontWeight: 750,
  boxShadow: '0 8px 22px rgba(15,23,42,.03)',
  transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease, background-color .15s ease',
}

const activeLinkStyle: React.CSSProperties = {
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.blueBorderActive}`,
  background: ANGELCARE360_OPERATOR_COLORS.blueSoft,
  boxShadow: '0 12px 24px rgba(37,99,235,.08)',
}

const linkContentStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const linkLabelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
}

const linkSummaryStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slateMuted,
  fontSize: 12,
  lineHeight: 1.45,
  fontWeight: 600,
}

const badgeStyle: React.CSSProperties = {
  flexShrink: 0,
  borderRadius: 999,
  padding: '4px 8px',
  fontSize: 11,
  fontWeight: 900,
  color: ANGELCARE360_OPERATOR_COLORS.blue,
  background: '#dbeafe',
}
