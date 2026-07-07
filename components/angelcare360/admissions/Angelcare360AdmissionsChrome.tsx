'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import Angelcare360AdmissionsNavigation from './Angelcare360AdmissionsNavigation'
import { ANGELCARE360_ADMISSIONS_NAVIGATION } from '@/data/angelcare360/admissions-navigation'

type Angelcare360AdmissionsChromeProps = {
  children: ReactNode
}

export default function Angelcare360AdmissionsChrome({ children }: Angelcare360AdmissionsChromeProps) {
  return (
    <div style={shellStyle}>
      <div style={topBarStyle}>
        <div>
          <div style={eyebrowStyle}>Admissions & Inscriptions</div>
          <div style={titleStyle}>ANGELCARE 360 COMMAND CENTER</div>
          <div style={metaStyle}>Pipeline d’admission, conversion sécurisée et dossiers scolaires dans un espace français isolé.</div>
        </div>
        <div style={actionsStyle}>
          <Link href="/angelcare-360-command-center" style={secondaryLinkStyle}>
            Retour au cockpit
          </Link>
          <div style={statusStyle}>Admissions actives et auditées</div>
        </div>
      </div>

      <Angelcare360AdmissionsNavigation items={ANGELCARE360_ADMISSIONS_NAVIGATION} />

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

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 10,
}

const secondaryLinkStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 800,
}

const statusStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '8px 12px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 900,
}

const contentStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
}

