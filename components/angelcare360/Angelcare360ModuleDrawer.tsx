'use client'

import Link from 'next/link'
import type { Angelcare360ModuleRecord } from '@/types/angelcare360/module'

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
            <div style={metaValueStyle}>{module.stage === 'actif' ? 'Actif' : 'Prévu'}</div>
          </div>
          <div style={metaCardStyle}>
            <div style={metaLabelStyle}>Périmètre</div>
            <div style={metaValueStyle}>{module.group}</div>
          </div>
          <div style={metaCardStyle}>
            <div style={metaLabelStyle}>Route</div>
            <div style={metaValueStyle}>{module.href}</div>
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
  background: '#fff',
  borderRadius: 28,
  border: '1px solid #dbe4ef',
  boxShadow: '0 30px 90px rgba(15, 23, 42, 0.18)',
  padding: 22,
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
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 950,
}

const purposeStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#475569',
  fontWeight: 650,
  lineHeight: 1.55,
}

const closeButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '8px 12px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 800,
  cursor: 'pointer',
}

const metaGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10,
}

const metaCardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  background: '#f8fafc',
  padding: 14,
}

const metaLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const metaValueStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#0f172a',
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
  color: '#0f172a',
  lineHeight: 1.65,
  fontWeight: 600,
}

const reasonBoxStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #bfdbfe',
  background: '#eff6ff',
  padding: 14,
}

const reasonTitleStyle: React.CSSProperties = {
  color: '#1d4ed8',
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
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 14px',
  fontWeight: 800,
}

const disabledButtonStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#f8fafc',
  color: '#64748b',
  fontWeight: 800,
  cursor: 'not-allowed',
}

