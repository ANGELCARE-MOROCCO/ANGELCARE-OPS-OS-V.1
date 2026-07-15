'use client'

import type { ReactNode } from 'react'
import { ANGELCARE360_OPERATOR_COLORS, operatorButtonSecondary, operatorSectionBackground } from './Angelcare360OperatorVisualSystem'

type Props = {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export default function Angelcare360OperatorDrawer({ open, title, subtitle, onClose, children, footer }: Props) {
  if (!open) return null

  return (
    <div style={overlayStyle} role="presentation" onClick={onClose}>
      <div style={drawerStyle} onClick={(event) => event.stopPropagation()}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Action opérateur</div>
            <h3 style={titleStyle}>{title}</h3>
            {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            Fermer
          </button>
        </header>
        <div style={bodyStyle}>{children}</div>
        {footer ? <footer style={footerStyle}>{footer}</footer> : null}
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 70,
  background: 'rgba(15,23,42,.34)',
  backdropFilter: 'blur(10px)',
  display: 'grid',
  placeItems: 'end',
  padding: 20,
}

const drawerStyle: React.CSSProperties = {
  width: 'min(1040px, 100%)',
  maxHeight: '92vh',
  overflow: 'auto',
  borderRadius: 30,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_OPERATOR_COLORS.border,
  background:
    'linear-gradient(180deg, rgba(255,255,255,.99) 0%, rgba(248,250,252,.98) 100%)',
  boxShadow: '0 36px 108px rgba(15,23,42,.20)',
  padding: 24,
  display: 'grid',
  gap: 18,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  paddingBottom: 14,
  borderBottom: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
}

const eyebrowStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.blue,
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 11,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 24,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  lineHeight: 1.65,
  fontWeight: 600,
}

const closeButtonStyle: React.CSSProperties = {
  ...operatorButtonSecondary,
  minHeight: 40,
  padding: '8px 12px',
}

const footerStyle: React.CSSProperties = {
  paddingTop: 4,
  borderTop: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
  display: 'flex',
  justifyContent: 'end',
  gap: 10,
}

const bodyStyle: React.CSSProperties = {
  ...operatorSectionBackground,
  borderRadius: 24,
  padding: 20,
}
