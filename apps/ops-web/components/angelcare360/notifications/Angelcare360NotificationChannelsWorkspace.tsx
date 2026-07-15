'use client'

import type { Angelcare360NotificationChannelReadinessRecord } from '@/types/angelcare360/communications'

type Props = {
  readiness: Angelcare360NotificationChannelReadinessRecord
}

export default function Angelcare360NotificationChannelsWorkspace({ readiness }: Props) {
  const rows = [
    ['Email', readiness.email],
    ['SMS', readiness.sms],
    ['WhatsApp', readiness.whatsapp],
    ['Push', readiness.push],
  ] as const
  return (
    <div style={gridStyle}>
      {rows.map(([label, item]) => (
        <article key={label} style={cardStyle}>
          <div style={labelStyle}>{label}</div>
          <div style={statusStyle}>{item.status}</div>
          <div style={reasonStyle}>{item.reason}</div>
        </article>
      ))}
    </div>
  )
}

const gridStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 16, borderRadius: 20, border: '1px solid #dbe4ef', background: '#fff' }
const labelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 900 }
const statusStyle: React.CSSProperties = { color: '#0f172a', fontSize: 18, fontWeight: 900 }
const reasonStyle: React.CSSProperties = { color: '#475569', lineHeight: 1.6, fontWeight: 600 }

