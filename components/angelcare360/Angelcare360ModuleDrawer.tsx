'use client'

import Link from 'next/link'
import type { Angelcare360ModuleRecord } from '@/types/angelcare360/module'
import {
  ANGELCARE360_COLORS,
  angelcare360ButtonBaseStyle,
  angelcare360ButtonSecondaryStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Angelcare360ModuleDrawerProps = {
  module: Angelcare360ModuleRecord | null
  onClose: () => void
}

export default function Angelcare360ModuleDrawer({ module, onClose }: Angelcare360ModuleDrawerProps) {
  if (!module) return null

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={`Panneau module ${module.label}`}>
      <div style={drawerStyle}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>{module.badge}</div>
            <h3 style={titleStyle}>{module.label}</h3>
            <p style={purposeStyle}>{module.operationalPurpose}</p>
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            Fermer
          </button>
        </div>

        <div style={metaGridStyle}>
          <div style={metaCardStyle}>
            <div style={metaLabelStyle}>État</div>
            <div style={metaValueStyle}>{module.stage === 'actif' ? 'Disponible' : 'À configurer'}</div>
          </div>
          <div style={metaCardStyle}>
            <div style={metaLabelStyle}>Périmètre</div>
            <div style={metaValueStyle}>{module.group}</div>
          </div>
          <div style={metaCardStyle}>
            <div style={metaLabelStyle}>Accès</div>
            <div style={metaValueStyle}>{module.stage === 'actif' ? 'Disponible' : 'Verrouillé'}</div>
          </div>
        </div>

        <div style={contentStyle}>
          <p style={descriptionStyle}>{module.description}</p>
          <div style={reasonBoxStyle}>
            <strong style={reasonTitleStyle}>Pourquoi c’est verrouillé maintenant</strong>
            <p style={reasonTextStyle}>{module.disabledActionReason}</p>
          </div>
          <div style={actionRowStyle}>
            <Link href={module.href} style={linkStyle} onClick={onClose}>
              Aller à la carte
            </Link>
            <button type="button" disabled style={disabledButtonStyle} title={module.disabledActionReason}>
              {module.disabledActionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: 'rgba(15, 23, 42, 0.34)',
  display: 'grid',
  placeItems: 'end',
  padding: 16,
}

const drawerStyle: React.CSSProperties = {
  width: 'min(720px, 100%)',
  background: ANGELCARE360_COLORS.white,
  borderRadius: 28,
  border: `1px solid ${ANGELCARE360_COLORS.border}`,
  boxShadow: '0 30px 90px rgba(15, 23, 42, 0.18)',
  padding: 24,
  display: 'grid',
  gap: 18,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'start',
  gap: 12,
}

const eyebrowStyle: React.CSSProperties = {
  color: ANGELCARE360_COLORS.blue,
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: ANGELCARE360_COLORS.navy,
  fontSize: 24,
  fontWeight: 950,
  letterSpacing: -0.5,
}

const purposeStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: ANGELCARE360_COLORS.slate,
  fontWeight: 650,
  lineHeight: 1.55,
}

const closeButtonStyle: React.CSSProperties = {
  ...angelcare360ButtonSecondaryStyle,
  padding: '8px 12px',
}

const metaGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10,
}

const metaCardStyle: React.CSSProperties = {
  border: `1px solid ${ANGELCARE360_COLORS.borderSoft}`,
  borderRadius: 18,
  background: ANGELCARE360_COLORS.background,
  padding: 16,
}

const metaLabelStyle: React.CSSProperties = {
  color: ANGELCARE360_COLORS.slateMuted,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const metaValueStyle: React.CSSProperties = {
  marginTop: 8,
  color: ANGELCARE360_COLORS.navy,
  fontWeight: 800,
  lineHeight: 1.45,
  wordBreak: 'break-word',
}

const contentStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
}

const descriptionStyle: React.CSSProperties = {
  margin: 0,
  color: ANGELCARE360_COLORS.navy,
  lineHeight: 1.65,
  fontWeight: 600,
}

const reasonBoxStyle: React.CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${ANGELCARE360_COLORS.blueBorder}`,
  background: ANGELCARE360_COLORS.blueSoft,
  padding: 14,
}

const reasonTitleStyle: React.CSSProperties = {
  color: ANGELCARE360_COLORS.blue,
  fontSize: 13,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 0.9,
}

const reasonTextStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#1e3a8a',
  lineHeight: 1.6,
  fontWeight: 650,
}

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const linkStyle: React.CSSProperties = {
  ...angelcare360ButtonBaseStyle,
  textDecoration: 'none',
  padding: '10px 14px',
}

const disabledButtonStyle: React.CSSProperties = {
  border: `1px dashed ${ANGELCARE360_COLORS.border}`,
  borderRadius: 14,
  padding: '10px 14px',
  background: ANGELCARE360_COLORS.background,
  color: ANGELCARE360_COLORS.slateMuted,
  fontWeight: 800,
  cursor: 'not-allowed',
}
