'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'
import Angelcare360PeopleNavigation from './Angelcare360PeopleNavigation'
import { ANGELCARE360_PEOPLE_NAVIGATION } from '@/data/angelcare360/people-navigation'

type Angelcare360PeopleChromeProps = {
  children: ReactNode
}

const ROUTES_WITH_DEDICATED_FIGMA_BODY = new Set([
  '/angelcare-360-command-center/eleves',
])

export default function Angelcare360PeopleChrome({ children }: Angelcare360PeopleChromeProps) {
  const pathname = usePathname()

  if (ROUTES_WITH_DEDICATED_FIGMA_BODY.has(pathname)) {
    return <main style={dedicatedRouteStyle}>{children}</main>
  }

  return (
    <div style={shellStyle}>
      <div style={topBarStyle}>
        <div>
          <div style={eyebrowStyle}>Espace personnes</div>
          <div style={titleStyle}>ANGELCARE 360 COMMAND CENTER</div>
          <div style={metaStyle}>Dossiers élèves, familles, enseignants et personnel, dans un espace français isolé.</div>
        </div>
        <div style={actionsStyle}>
          <Link href="/angelcare-360-command-center" style={secondaryLinkStyle}>
            Retour au cockpit
          </Link>
          <div style={statusStyle}>Navigation personnes sécurisée</div>
        </div>
      </div>

      <Angelcare360PeopleNavigation items={ANGELCARE360_PEOPLE_NAVIGATION} />

      <main style={contentStyle}>{children}</main>
    </div>
  )
}

const dedicatedRouteStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  overflowX: 'hidden',
}

const shellStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
}

const topBarStyle: CSSProperties = {
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

const eyebrowStyle: CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: CSSProperties = {
  marginTop: 8,
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 950,
}

const metaStyle: CSSProperties = {
  marginTop: 6,
  color: '#475569',
  fontSize: 13,
  lineHeight: 1.6,
  fontWeight: 600,
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 10,
}

const secondaryLinkStyle: CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 800,
}

const statusStyle: CSSProperties = {
  borderRadius: 999,
  padding: '8px 12px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 900,
}

const contentStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
}
