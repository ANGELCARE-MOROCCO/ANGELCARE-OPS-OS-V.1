import Link from 'next/link'
import AngelCareLogo from '@/components/brand/AngelCareLogo'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'
import { ANGELCARE360_OPERATOR_COLORS, operatorButtonBase, operatorButtonSecondary } from './Angelcare360OperatorVisualSystem'

type Props = {
  user: Angelcare360SessionUser
  access: Angelcare360AccessProfile
  pathname: string
  onToggleSidebar: () => void
  showMenuButton: boolean
}

export default function Angelcare360OperatorHeader({ user, access, pathname, onToggleSidebar, showMenuButton }: Props) {
  const title = pathname === '/angelcare-360-operator' ? 'Vue d’ensemble' : 'Pilotage opérateur'

  return (
    <header style={headerStyle}>
      <div style={brandRowStyle}>
        {showMenuButton ? (
          <button type="button" onClick={onToggleSidebar} style={menuButtonStyle} aria-label="Ouvrir la navigation opérateur">
            Menu
          </button>
        ) : (
          <div aria-hidden="true" style={{ width: 70, height: 36 }} />
        )}

        <Link href="/angelcare-360-operator" style={brandLinkStyle} aria-label="Retour au backoffice opérateur">
          <AngelCareLogo size="sm" showText />
          <div style={brandCopyStyle}>
            <div style={brandTitleStyle}>ANGELCARE 360 OPERATOR</div>
            <div style={brandSubtitleStyle}>Cockpit interne de pilotage SaaS et client</div>
          </div>
        </Link>
      </div>

      <div style={metaRowStyle}>
        <div style={routeChipStyle}>{title}</div>
        <div style={roleChipStyle}>{access.summary}</div>
        <div style={userChipStyle}>{user.full_name || user.name || user.email || 'Utilisateur interne'}</div>
      </div>

      <div style={contextRowStyle}>
        <span style={contextPillStyle}>Clients</span>
        <span style={contextPillStyle}>Abonnements</span>
        <span style={contextPillStyle}>Facturation</span>
        <span style={contextPillStyle}>Support</span>
        <span style={contextPillStyle}>Audit</span>
      </div>

      <div style={routeActionsStyle}>
        <Link href="/angelcare-360-operator" style={secondaryActionStyle}>
          Vue d’ensemble
        </Link>
        <Link href="/angelcare-360-operator/audit" style={primaryActionStyle}>
          Audit interne
        </Link>
      </div>
    </header>
  )
}

const headerStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: '18px 24px',
  background:
    'linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(248,250,252,.95) 100%)',
  borderBottom: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
  backdropFilter: 'blur(14px)',
  boxShadow: '0 10px 30px rgba(15,23,42,.03)',
}

const brandRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}

const menuButtonStyle: React.CSSProperties = {
  ...operatorButtonSecondary,
  padding: '8px 12px',
}

const brandLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  textDecoration: 'none',
  minWidth: 0,
}

const brandCopyStyle: React.CSSProperties = {
  display: 'grid',
  gap: 2,
}

const brandTitleStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 14,
  fontWeight: 950,
  letterSpacing: 0.4,
}

const brandSubtitleStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slateMuted,
  fontSize: 12,
  fontWeight: 650,
}

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const contextRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const contextPillStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '5px 10px',
  background: ANGELCARE360_OPERATOR_COLORS.background,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
}

const routeChipStyle: React.CSSProperties = {
  borderRadius: 999,
  background: '#eff6ff',
  color: ANGELCARE360_OPERATOR_COLORS.blue,
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 900,
}

const roleChipStyle: React.CSSProperties = {
  borderRadius: 999,
  background: ANGELCARE360_OPERATOR_COLORS.background,
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 800,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
}

const userChipStyle: React.CSSProperties = {
  borderRadius: 999,
  background: ANGELCARE360_OPERATOR_COLORS.navy,
  color: ANGELCARE360_OPERATOR_COLORS.white,
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 800,
}

const routeActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const secondaryActionStyle: React.CSSProperties = {
  ...operatorButtonSecondary,
  textDecoration: 'none',
}

const primaryActionStyle: React.CSSProperties = {
  ...operatorButtonBase,
  textDecoration: 'none',
}
