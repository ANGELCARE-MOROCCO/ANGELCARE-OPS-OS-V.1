'use client'

import type { Angelcare360ClaimTicketRecord } from '@/types/angelcare360/communications'

type Props = {
  ticket: Angelcare360ClaimTicketRecord
}

export default function Angelcare360ClaimTicketDetail({ ticket }: Props) {
  return (
    <div style={gridStyle}>
      <article style={cardStyle}>
        <div style={labelStyle}>Code</div>
        <div style={valueStyle}>{ticket.reclamation_code}</div>
      </article>
      <article style={cardStyle}>
        <div style={labelStyle}>Statut</div>
        <div style={valueStyle}>{ticket.status}</div>
      </article>
      <article style={cardStyle}>
        <div style={labelStyle}>Priorité</div>
        <div style={valueStyle}>{ticket.priority}</div>
      </article>
      <article style={cardStyle}>
        <div style={labelStyle}>Résumé</div>
        <div style={valueStyle}>{ticket.resolution_summary || 'Non résolue'}</div>
      </article>
    </div>
  )
}

const gridStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 16, borderRadius: 20, border: '1px solid #dbe4ef', background: '#fff' }
const labelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 900 }
const valueStyle: React.CSSProperties = { color: '#0f172a', fontSize: 18, fontWeight: 900, lineHeight: 1.45 }

