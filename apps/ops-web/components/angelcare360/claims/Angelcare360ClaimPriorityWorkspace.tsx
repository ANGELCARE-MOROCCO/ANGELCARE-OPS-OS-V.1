'use client'

type Props = {
  tickets: Array<Record<string, any>>
}

export default function Angelcare360ClaimPriorityWorkspace({ tickets }: Props) {
  return (
    <div style={listStyle}>
      {tickets.length ? tickets.map((ticket, index) => (
        <article key={String(ticket.id || index)} style={cardStyle}>
          <div style={headerStyle}>
            <strong>{String(ticket.subject || ticket.reclamation_code || 'Ticket')}</strong>
            <span>{String(ticket.priority || 'normal')}</span>
          </div>
          <div style={footerStyle}>
            <span>{String(ticket.status || '—')}</span>
            <span>{String(ticket.created_at || '—')}</span>
          </div>
        </article>
      )) : (
        <div style={emptyStyle}>Aucune priorité à afficher.</div>
      )}
    </div>
  )
}

const listStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }
const footerStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 12, color: '#64748b', fontSize: 12, fontWeight: 700 }
const emptyStyle: React.CSSProperties = { padding: 16, borderRadius: 18, border: '1px dashed #cbd5e1', color: '#475569', fontWeight: 700 }
