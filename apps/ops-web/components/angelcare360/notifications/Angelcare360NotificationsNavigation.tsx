'use client'

import Link from 'next/link'
import type { Angelcare360ModuleNavigationItem } from '@/types/angelcare360/module'

type Props = {
  items: Angelcare360ModuleNavigationItem[]
}

export default function Angelcare360NotificationsNavigation({ items }: Props) {
  return (
    <nav style={navStyle}>
      {items.map((item) => (
        <Link key={item.key} href={item.href} style={linkStyle}>
          <span style={labelStyle}>{item.label}</span>
          <span style={summaryStyle}>{item.summary}</span>
          {item.badge ? <span style={badgeStyle}>{item.badge}</span> : null}
        </Link>
      ))}
    </nav>
  )
}

const navStyle: React.CSSProperties = { display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }
const linkStyle: React.CSSProperties = { display: 'grid', gap: 6, alignContent: 'start', padding: 16, borderRadius: 20, border: '1px solid #dbe4ef', background: '#fff', textDecoration: 'none', color: '#0f172a', boxShadow: '0 12px 28px rgba(15,23,42,.04)' }
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 900 }
const summaryStyle: React.CSSProperties = { color: '#475569', lineHeight: 1.5, fontSize: 13, fontWeight: 600 }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', width: 'fit-content', borderRadius: 999, padding: '4px 8px', background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 900 }

