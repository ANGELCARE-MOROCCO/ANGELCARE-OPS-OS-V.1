'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { ANGELCARE360_ADMINISTRATION_NAVIGATION } from '@/data/angelcare360/administration-navigation'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'

type Angelcare360AdministrationChromeProps = {
  children: ReactNode
  user: Angelcare360SessionUser
  access: Angelcare360AccessProfile
}

export default function Angelcare360AdministrationChrome({ children, user, access }: Angelcare360AdministrationChromeProps) {
  const pathname = usePathname() || '/angelcare-360-command-center/administration'

  return (
    <div style={shellStyle}>
      <div style={topBarStyle}>
        <div>
          <div style={eyebrowStyle}>Administration Control Plane</div>
          <div style={titleStyle}>ANGELCARE 360 COMMAND CENTER</div>
          <div style={metaStyle}>
            {access.roleLabel} · {user.email || 'Session protégée'} · {access.scopeLabel}
          </div>
        </div>
        <div style={statusStyle}>Navigation française et isolée</div>
      </div>

      <nav style={navStyle} aria-label="Navigation administration AngelCare 360">
        {ANGELCARE360_ADMINISTRATION_NAVIGATION.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                ...navItemStyle,
                ...(isActive ? navItemActiveStyle : null),
              }}
            >
              <div style={navItemContentStyle}>
                <div style={navLabelStyle}>{item.label}</div>
                <div style={navSummaryStyle}>{item.summary}</div>
              </div>
              {item.badge ? <span style={navBadgeStyle}>{item.badge}</span> : null}
            </Link>
          )
        })}
      </nav>

      <main style={contentStyle}>{children}</main>
    </div>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
}

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '14px 18px',
  borderRadius: 24,
  background: '#fff',
  border: '1px solid #dbe4ef',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 950,
}

const metaStyle: React.CSSProperties = {
  marginTop: 6,
  color: '#475569',
  fontSize: 13,
  lineHeight: 1.6,
  fontWeight: 600,
}

const statusStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '8px 12px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 900,
}

const navStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const navItemStyle: React.CSSProperties = {
  flex: '1 1 260px',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  padding: '14px 16px',
  borderRadius: 18,
  border: '1px solid #dbe4ef',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  boxShadow: '0 14px 40px rgba(15,23,42,.04)',
}

const navItemActiveStyle: React.CSSProperties = {
  borderColor: '#93c5fd',
  background: '#eff6ff',
  boxShadow: 'inset 0 0 0 1px rgba(59,130,246,.08)',
}

const navItemContentStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const navLabelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
}

const navSummaryStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  lineHeight: 1.45,
  fontWeight: 600,
}

const navBadgeStyle: React.CSSProperties = {
  flexShrink: 0,
  borderRadius: 999,
  padding: '5px 9px',
  background: '#dbeafe',
  color: '#1d4ed8',
  fontSize: 11,
  fontWeight: 900,
}

const contentStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
}

