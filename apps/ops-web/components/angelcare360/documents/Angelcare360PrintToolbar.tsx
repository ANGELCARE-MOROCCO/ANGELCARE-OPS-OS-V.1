'use client'

import Link from 'next/link'
import {
  ANGELCARE360_COLORS,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Props = {
  backHref: string
  printLabel?: string
}

export default function Angelcare360PrintToolbar({ backHref, printLabel = 'Imprimer' }: Props) {
  return (
    <div style={toolbarStyle}>
      <button type="button" onClick={() => window.print()} style={printButtonStyle}>{printLabel}</button>
      <Link href={backHref} style={backLinkStyle}>Retour</Link>
    </div>
  )
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  marginBottom: 14,
}

const printButtonStyle: React.CSSProperties = {
  borderRadius: 14,
  border: `1px solid ${ANGELCARE360_COLORS.blueDeep}`,
  background: `linear-gradient(180deg, ${ANGELCARE360_COLORS.blue} 0%, ${ANGELCARE360_COLORS.blueDeep} 100%)`,
  color: ANGELCARE360_COLORS.white,
  padding: '10px 14px',
  fontWeight: 900,
  cursor: 'pointer',
}

const backLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: `1px solid ${ANGELCARE360_COLORS.border}`,
  background: ANGELCARE360_COLORS.white,
  color: ANGELCARE360_COLORS.navy,
  textDecoration: 'none',
  padding: '10px 14px',
  fontWeight: 900,
}

