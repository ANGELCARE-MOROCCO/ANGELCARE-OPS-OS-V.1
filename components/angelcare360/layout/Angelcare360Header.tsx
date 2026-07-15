import Link from 'next/link'
import AngelCareLogo from '@/components/brand/AngelCareLogo'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'
import {
  ANGELCARE360_COLORS,
  angelcare360ButtonBaseStyle,
  angelcare360ButtonSecondaryStyle,
  angelcare360PillBlueStyle,
  angelcare360PillStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Angelcare360HeaderProps = {
  user: Angelcare360SessionUser
  access: Angelcare360AccessProfile
  pathname: string
  onToggleSidebar: () => void
  showMenuButton: boolean
}

export default function Angelcare360Header({ user, access, pathname, onToggleSidebar, showMenuButton }: Angelcare360HeaderProps) {
  const title = pathname.includes('/direction') ? 'Cockpit de Direction' : 'Vue d’ensemble'

  return (
    <header style={headerStyle}>
      <div style={brandRowStyle}>
        {showMenuButton ? (
          <button type="button" onClick={onToggleSidebar} style={menuButtonStyle} aria-label="Ouvrir la navigation AngelCare 360">
            Menu
          </button>
        ) : (
          <div aria-hidden="true" style={menuSpacerStyle} />
        )}
        <Link href="/angelcare-360-command-center" style={brandLinkStyle} aria-label="Retour au cockpit d’AngelCare 360">
          <AngelCareLogo size="sm" showText />
          <div style={brandCopyStyle}>
            <div style={brandTitleStyle}>ANGELCARE 360 COMMAND CENTER</div>
            <div style={brandSubtitleStyle}>Pilotage scolaire français, lecture consolidée et contrôle des accès</div>
          </div>
        </Link>
      </div>

      <div style={metaRowStyle}>
        <div style={routeChipStyle}>{title}</div>
        <div style={roleChipStyle}>{access.summary}</div>
        <div style={userChipStyle}>
          {user.full_name || user.name || user.email || 'Utilisateur connecté'}
        </div>
      </div>

      <div style={routeActionsStyle}>
        <Link href="/angelcare-360-command-center" style={actionLinkStyle}>
          Vue d’ensemble
        </Link>
        <Link href="/angelcare-360-command-center/direction" style={primaryActionLinkStyle}>
          Cockpit détaillé
        </Link>
      </div>
    </header>
  )
}

const headerStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
  padding: '20px 28px',
  background: 'rgba(255,255,255,.95)',
  borderBottom: `1px solid ${ANGELCARE360_COLORS.borderSoft}`,
  backdropFilter: 'blur(16px)',
}

const brandRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}

const menuButtonStyle: React.CSSProperties = {
  ...angelcare360ButtonSecondaryStyle,
  padding: '8px 12px',
}

const menuSpacerStyle: React.CSSProperties = {
  width: 70,
  height: 36,
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
  color: ANGELCARE360_COLORS.navy,
  fontSize: 14,
  fontWeight: 950,
  letterSpacing: 0.4,
}

const brandSubtitleStyle: React.CSSProperties = {
  color: ANGELCARE360_COLORS.slateMuted,
  fontSize: 12,
  fontWeight: 650,
  lineHeight: 1.45,
  maxWidth: 520,
}

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const routeChipStyle: React.CSSProperties = {
  ...angelcare360PillBlueStyle,
  padding: '7px 10px',
}

const roleChipStyle: React.CSSProperties = {
  ...angelcare360PillStyle,
  padding: '7px 10px',
}

const userChipStyle: React.CSSProperties = {
  ...angelcare360PillStyle,
  background: `linear-gradient(180deg, ${ANGELCARE360_COLORS.navy} 0%, ${ANGELCARE360_COLORS.navyDeep} 100%)`,
  color: ANGELCARE360_COLORS.white,
  borderColor: ANGELCARE360_COLORS.navy,
  padding: '7px 10px',
}

const routeActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const actionLinkStyle: React.CSSProperties = {
  ...angelcare360ButtonSecondaryStyle,
  textDecoration: 'none',
  padding: '9px 12px',
}

const primaryActionLinkStyle: React.CSSProperties = {
  ...angelcare360ButtonBaseStyle,
  textDecoration: 'none',
  padding: '9px 12px',
}
