import type { CSSProperties, ReactNode } from 'react'
import AngelCareLogo from '@/components/brand/AngelCareLogo'
import type { TrainingHubContext } from '@/lib/traininghub/types'
import { getTrainingHubNavigation, type TrainingHubNavItem } from '@/lib/traininghub/navigation'

type Props = {
  context: TrainingHubContext
  active: string
  eyebrow?: string
  title: string
  subtitle: string
  rightSlot?: ReactNode
  children: ReactNode
}

function roleLabel(context: TrainingHubContext) {
  if (context.isSuperAdmin) return 'CEO / Super Admin'
  if (context.isInternal) return 'AngelCare Internal'
  return context.roles.map((role) => role.code).filter(Boolean).join(' • ') || 'TrainingHub User'
}

function experienceLabel(value: string) {
  if (value === 'admin') return 'Direction Formation'
  if (value === 'partner') return 'Partner Portal'
  if (value === 'trainer') return 'Trainer Cockpit'
  return 'Learning Space'
}

function NavGroup({ title, items, active }: { title: string; items: TrainingHubNavItem[]; active: string }) {
  if (!items.length) return null

  return (
    <section style={navGroupStyle}>
      <div style={navGroupTitleStyle}>{title}</div>
      <div style={navGroupListStyle}>
        {items.map((item) => {
          const selected = item.key === active
          return (
            <a key={item.key} href={item.href} style={selected ? navItemActiveStyle : navItemStyle}>
              <span style={navIconStyle}>{item.icon}</span>
              <span style={navCopyStyle}>
                <span style={navLabelStyle}>{item.label}</span>
                <span style={navDetailStyle}>{item.detail}</span>
              </span>
            </a>
          )
        })}
      </div>
    </section>
  )
}

export default function TrainingHubShell({
  context,
  active,
  eyebrow = 'ANGELCARE TRAININGHUB',
  title,
  subtitle,
  rightSlot,
  children,
}: Props) {
  const primaryOrg = context.organizations[0]
  const navigation = getTrainingHubNavigation(context)
  const permissionCount = (context as any).accès?.length || 0
  const roleCount = context.roles?.length || 0
  const entitlementCount = (context as any).avantages?.length || 0

  return (
    <main style={pageStyle}>
      <aside style={sidebarStyle}>
        <div style={brandBlockStyle}>
          <AngelCareLogo size="md" showText />
          <div style={productPillStyle}>Direction Formation</div>
          <div style={separationPillStyle}>Accès sécurisé par profil et par espace</div>
        </div>

        <nav style={navStyle} aria-label="TrainingHub permission-aware navigation">
          <NavGroup title="Admin command" items={navigation.groups.admin} active={active} />
          <NavGroup title="Operations" items={navigation.groups.execution} active={active} />
          <NavGroup title="Governance" items={navigation.groups.governance} active={active} />
          <NavGroup title="Experience preview" items={navigation.groups.experience} active={active} />
        </nav>

        <div style={accessCardStyle}>
          <div style={accessTopStyle}>
            <span>Profil d’accès</span>
            <strong>{experienceLabel(navigation.primaryExperience)}</strong>
          </div>
          <div style={accessGridStyle}>
            <div><strong>{roleCount}</strong><span>roles</span></div>
            <div><strong>{permissionCount}</strong><span>accès</span></div>
            <div><strong>{entitlementCount}</strong><span>avantages</span></div>
          </div>
          <div style={accessFootStyle}>Rôles métiers + espaces séparés</div>
        </div>
      </aside>

      <section style={mainStyle}>
        <header style={headerStyle}>
          <div style={headerCopyStyle}>
            <div style={eyebrowStyle}>{eyebrow}</div>
            <h1 style={titleStyle}>{title}</h1>
            <p style={subtitleStyle}>{subtitle}</p>
          </div>
          <div style={headerRightStyle}>
            {rightSlot}
            <div style={userCardStyle}>
              <div style={userTopStyle}>
                <div style={userAvatarStyle}>
                  {(context.profile.full_name || context.profile.email || 'AC').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={userNameStyle}>{context.profile.full_name || context.profile.email}</div>
                  <div style={userMetaStyle}>{roleLabel(context)}</div>
                </div>
              </div>
              <div style={userOrgStyle}>{primaryOrg?.name || 'No organization'} • {primaryOrg?.organization_type || 'traininghub'}</div>
            </div>
            <a href="/traininghub/logout" style={logoutStyle}>Déconnexion</a>
          </div>
        </header>

        <section style={adminNoticeStyle}>
          <div>
            <strong>Espace direction AngelCare.</strong>
            <span> Cette navigation filtre les espaces selon les accès, rôles, avantages et expériences autorisées.</span>
          </div>
          <div style={adminNoticeBadgesStyle}>
            <span>Navigation intelligente</span>
            <span>Données protégées</span>
            <span>Accès TrainingHub</span>
          </div>
        </section>

        {children}
      </section>
    </main>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: '310px minmax(0, 1fr)',
  background: 'linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)',
  color: '#0f172a',
  fontFamily: 'Inter, Arial, sans-serif',
}

const sidebarStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  padding: 20,
  borderRight: '1px solid #dbeafe',
  background: 'linear-gradient(180deg, rgba(255,255,255,.96) 0%, rgba(248,250,252,.92) 100%)',
  boxShadow: '18px 0 60px rgba(15,23,42,.04)',
}

const brandBlockStyle: CSSProperties = { display: 'grid', gap: 10 }
const productPillStyle: CSSProperties = {
  justifySelf: 'start',
  border: '1px solid #bfdbfe',
  background: '#eff6ff',
  color: '#1d4ed8',
  borderRadius: 999,
  padding: '7px 11px',
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
}
const separationPillStyle: CSSProperties = {
  border: '1px solid #dcfce7',
  background: '#f0fdf4',
  color: '#047857',
  borderRadius: 16,
  padding: '10px 12px',
  fontSize: 11,
  fontWeight: 850,
  lineHeight: 1.45,
}

const navStyle: CSSProperties = { display: 'grid', gap: 15, overflowY: 'auto', paddingRight: 4 }
const navGroupStyle: CSSProperties = { display: 'grid', gap: 8 }
const navGroupTitleStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  paddingLeft: 4,
}
const navGroupListStyle: CSSProperties = { display: 'grid', gap: 7 }
const navItemStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '34px minmax(0, 1fr)',
  gap: 10,
  alignItems: 'center',
  padding: '11px 12px',
  borderRadius: 18,
  border: '1px solid transparent',
  textDecoration: 'none',
  color: '#334155',
  background: 'transparent',
}
const navItemActiveStyle: CSSProperties = {
  ...navItemStyle,
  background: 'linear-gradient(135deg, #0f2a52 0%, #1d4ed8 100%)',
  color: '#ffffff',
  borderColor: '#1d4ed8',
  boxShadow: '0 16px 40px rgba(37, 99, 235, .20)',
}
const navIconStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 13,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(37,99,235,.10)',
  fontSize: 11,
  fontWeight: 950,
}
const navCopyStyle: CSSProperties = { display: 'grid', gap: 2, minWidth: 0 }
const navLabelStyle: CSSProperties = { fontSize: 13, fontWeight: 950 }
const navDetailStyle: CSSProperties = { fontSize: 11, opacity: 0.76, fontWeight: 800 }

const accessCardStyle: CSSProperties = {
  marginTop: 'auto',
  padding: 16,
  borderRadius: 22,
  border: '1px solid #dbeafe',
  background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)',
  boxShadow: '0 14px 30px rgba(15,23,42,.06)',
}
const accessTopStyle: CSSProperties = { display: 'grid', gap: 4, marginBottom: 12, color: '#1e3a8a' }
const accessGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 12 }
const accessFootStyle: CSSProperties = { fontSize: 11, fontWeight: 850, color: '#64748b' }

const mainStyle: CSSProperties = { minWidth: 0, padding: 26 }
const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 18,
  marginBottom: 14,
}
const headerCopyStyle: CSSProperties = { minWidth: 0 }
const eyebrowStyle: CSSProperties = {
  color: '#2563eb',
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  marginBottom: 8,
}
const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 38,
  lineHeight: 1.05,
  letterSpacing: '-.045em',
  fontWeight: 950,
  color: '#0f172a',
}
const subtitleStyle: CSSProperties = {
  margin: '10px 0 0',
  maxWidth: 780,
  color: '#64748b',
  fontWeight: 750,
  lineHeight: 1.65,
}
const headerRightStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const userCardStyle: CSSProperties = {
  minWidth: 270,
  padding: '12px 14px',
  borderRadius: 20,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  boxShadow: '0 12px 30px rgba(15,23,42,.06)',
}
const userTopStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr)', gap: 10, alignItems: 'center' }
const userAvatarStyle: CSSProperties = { width: 40, height: 40, borderRadius: 14, background: '#eff6ff', color: '#1d4ed8', display: 'grid', placeItems: 'center', fontWeight: 950 }
const userNameStyle: CSSProperties = { fontWeight: 950, fontSize: 13, color: '#0f172a' }
const userMetaStyle: CSSProperties = { fontWeight: 750, fontSize: 11, color: '#64748b', marginTop: 3 }
const userOrgStyle: CSSProperties = { marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#64748b', fontWeight: 800 }
const logoutStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 16,
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  color: '#1d4ed8',
  textDecoration: 'none',
  fontWeight: 950,
  fontSize: 12,
}
const adminNoticeStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 20,
  padding: 14,
  borderRadius: 20,
  border: '1px solid #dbeafe',
  background: '#ffffff',
  color: '#475569',
  fontSize: 12,
  fontWeight: 750,
  boxShadow: '0 10px 26px rgba(15,23,42,.04)',
}
const adminNoticeBadgesStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', color: '#1d4ed8', fontWeight: 950 }
