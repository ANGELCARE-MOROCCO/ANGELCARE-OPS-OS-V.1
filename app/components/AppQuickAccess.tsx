'use client'

import Link from 'next/link'
import { useState } from 'react'

type QuickAccessLink = {
  label: string
  href: string
  permission: string
}

export function AppQuickAccess({
  links,
}: {
  links: readonly QuickAccessLink[]
}) {
  const [open, setOpen] = useState(false)

  if (!links.length) return null

  return (
    <div style={wrapStyle}>
      <button type="button" onClick={() => setOpen(!open)} style={buttonStyle}>
        ↓ Modules
      </button>

      {open && (
        <div style={menuStyle}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} style={itemStyle} onClick={() => setOpen(false)}>
              <span>{link.label}</span>
              <small style={smallStyle}>{link.permission}</small>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const wrapStyle: React.CSSProperties = {
  position: 'fixed',
  top: 14,
  right: 92,
  zIndex: 9999,
}

const buttonStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  background: '#0f172a',
  color: '#fff',
  borderRadius: 999,
  padding: '10px 15px',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 18px 40px rgba(15,23,42,.22)',
}

const menuStyle: React.CSSProperties = {
  position: 'absolute',
  top: 48,
  right: 0,
  width: 310,
  maxHeight: 460,
  overflowY: 'auto',
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 10,
  boxShadow: '0 28px 80px rgba(15,23,42,.22)',
}

const itemStyle: React.CSSProperties = {
  display: 'grid',
  gap: 3,
  textDecoration: 'none',
  color: '#0f172a',
  padding: '12px 13px',
  borderRadius: 14,
  fontWeight: 900,
}

const smallStyle: React.CSSProperties = {
  color: '#64748b',
  fontWeight: 700,
  fontSize: 11,
}