'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Angelcare360PeopleNavigationItem } from '@/data/angelcare360/people-navigation'

type Angelcare360PeopleNavigationProps = {
  items: Angelcare360PeopleNavigationItem[]
}

export default function Angelcare360PeopleNavigation({ items }: Angelcare360PeopleNavigationProps) {
  const pathname = usePathname() || '/angelcare-360-command-center/personnes'

  return (
    <nav style={navStyle} aria-label="Navigation personnes AngelCare 360">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            style={{
              ...linkStyle,
              ...(isActive ? activeLinkStyle : null),
            }}
            title={item.summary}
          >
            <div style={contentStyle}>
              <div style={labelStyle}>{item.label}</div>
              <div style={summaryStyle}>{item.summary}</div>
            </div>
            {item.badge ? <span style={badgeStyle}>{item.badge}</span> : null}
          </Link>
        )
      })}
    </nav>
  )
}

const navStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const linkStyle: React.CSSProperties = {
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

const activeLinkStyle: React.CSSProperties = {
  borderColor: '#93c5fd',
  background: '#eff6ff',
  boxShadow: 'inset 0 0 0 1px rgba(59,130,246,.08)',
}

const contentStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
}

const summaryStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  lineHeight: 1.45,
  fontWeight: 600,
}

const badgeStyle: React.CSSProperties = {
  flexShrink: 0,
  borderRadius: 999,
  padding: '5px 9px',
  background: '#dbeafe',
  color: '#1d4ed8',
  fontSize: 11,
  fontWeight: 900,
}

