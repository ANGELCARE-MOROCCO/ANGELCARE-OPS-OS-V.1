'use client'

import Link from 'next/link'

type Props = {
  schoolName?: string | null
  actions: Array<{ label: string; href: string; disabledReason?: string | null }>
}

export default function Angelcare360CommunicationToolbar({ schoolName, actions }: Props) {
  return (
    <div style={toolbarStyle}>
      <div style={schoolChipStyle}>{schoolName || 'Établissement non résolu'}</div>
      <div style={actionsStyle}>
        {actions.map((action) => (
          action.disabledReason ? (
            <span key={action.label} style={disabledStyle}>{action.label} · {action.disabledReason}</span>
          ) : (
            <Link key={action.label} href={action.href} style={actionLinkStyle}>{action.label}</Link>
          )
        ))}
      </div>
    </div>
  )
}

const toolbarStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'center' }
const schoolChipStyle: React.CSSProperties = { display: 'inline-flex', borderRadius: 999, padding: '8px 12px', background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 800 }
const actionsStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10 }
const actionLinkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', padding: '10px 14px', textDecoration: 'none', fontWeight: 800 }
const disabledStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, border: '1px solid #f1c9c9', background: '#fff5f5', color: '#991b1b', padding: '10px 14px', fontWeight: 700 }
