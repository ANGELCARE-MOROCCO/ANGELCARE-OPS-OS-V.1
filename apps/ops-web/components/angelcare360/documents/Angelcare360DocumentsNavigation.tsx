import Link from 'next/link'
import type { Angelcare360DocumentsNavigationItem } from '@/data/angelcare360/documents-navigation'

type Props = {
  items: Angelcare360DocumentsNavigationItem[]
}

export default function Angelcare360DocumentsNavigation({ items }: Props) {
  return (
    <nav style={navStyle}>
      {items.map((item) => (
        <Link key={item.key} href={item.href} style={linkStyle}>
          <span style={labelStyle}>{item.label}</span>
          <span style={summaryStyle}>{item.summary}</span>
        </Link>
      ))}
    </nav>
  )
}

const navStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }
const linkStyle: React.CSSProperties = { display: 'grid', gap: 6, borderRadius: 18, border: '1px solid #dbe4ef', background: '#fff', padding: '12px 14px', textDecoration: 'none', boxShadow: '0 12px 28px rgba(15,23,42,.04)' }
const labelStyle: React.CSSProperties = { color: '#0f172a', fontSize: 14, fontWeight: 900 }
const summaryStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, lineHeight: 1.5, fontWeight: 600 }
