import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

type Props = {
  events: Angelcare360AuditRecord[]
}

export default function Angelcare360ExportAuditDrawer({ events }: Props) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>Audit exports</h2>
      {events.length ? (
        <div style={stackStyle}>
          {events.map((event) => (
            <article key={event.id} style={cardStyle}>
              <div style={rowStyle}>
                <strong>{event.action}</strong>
                <span>{event.severity}</span>
              </div>
              <div style={metaStyle}>{event.module} · {event.entity_type || '—'} · {event.created_at}</div>
            </article>
          ))}
        </div>
      ) : (
        <div style={emptyStyle}>Aucun événement d’audit exports.</div>
      )}
    </section>
  )
}

const panelStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 18, borderRadius: 24, border: '1px solid #dbe4ef', background: '#fff' }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 17, fontWeight: 900 }
const stackStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 12, borderRadius: 16, border: '1px solid #e2e8f0', background: '#f8fafc' }
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }
const metaStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 700 }
const emptyStyle: React.CSSProperties = { color: '#475569', fontWeight: 700 }
