import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

type Props = {
  events: Angelcare360AuditRecord[]
}

export default function Angelcare360InventoryAuditDrawer({ events }: Props) {
  return (
    <section style={cardStyle}>
      <h3 style={titleStyle}>Audit inventaire</h3>
      {events.length > 0 ? (
        <ul style={listStyle}>
          {events.map((event) => <li key={event.id} style={itemStyle}>{event.module} · {event.action} · {event.severity}</li>)}
        </ul>
      ) : (
        <p style={emptyStyle}>Aucun événement d’audit inventaire pour le moment.</p>
      )}
    </section>
  )
}

const cardStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 18, borderRadius: 24, border: '1px solid #dbe4ef', background: '#fff' }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 950 }
const listStyle: React.CSSProperties = { margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }
const itemStyle: React.CSSProperties = { color: '#334155', lineHeight: 1.5, fontWeight: 600 }
const emptyStyle: React.CSSProperties = { margin: 0, color: '#64748b', fontWeight: 600 }
