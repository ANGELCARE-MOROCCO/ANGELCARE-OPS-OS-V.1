import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

type Angelcare360TransportAuditDrawerProps = {
  event: Angelcare360AuditRecord | null
}

export default function Angelcare360TransportAuditDrawer({ event }: Angelcare360TransportAuditDrawerProps) {
  if (!event) {
    return (
      <section style={cardStyle}>
        <div style={emptyTitleStyle}>Aucun événement sélectionné</div>
        <div style={emptyDescriptionStyle}>Sélectionnez une ligne d’audit pour voir les détails structurés.</div>
      </section>
    )
  }

  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Détail audit</div>
          <h3 style={titleStyle}>{event.module} · {event.action}</h3>
        </div>
        <span style={severityStyle}>{event.severity}</span>
      </div>

      <dl style={gridStyle}>
        <Row label="Module" value={event.module} />
        <Row label="Action" value={event.action} />
        <Row label="Entité" value={event.entity_type || '—'} />
        <Row label="Identifiant" value={event.entity_id || '—'} />
        <Row label="Acteur" value={event.actor_role || '—'} />
        <Row label="Date" value={new Date(event.created_at).toLocaleString('fr-FR')} />
      </dl>

      <pre style={preStyle}>{JSON.stringify({ before: event.before_data, after: event.after_data, metadata: event.metadata }, null, 2)}</pre>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={rowStyle}>
      <dt style={labelStyle}>{label}</dt>
      <dd style={valueStyle}>{value}</dd>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 18,
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#0284c7',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 950,
}

const severityStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 900,
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  padding: 12,
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
}

const labelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.7,
  fontWeight: 900,
}

const valueStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontWeight: 700,
}

const preStyle: React.CSSProperties = {
  margin: 0,
  padding: 14,
  borderRadius: 18,
  background: '#0f172a',
  color: '#e2e8f0',
  overflowX: 'auto',
  fontSize: 12,
  lineHeight: 1.5,
}

const emptyTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 900,
}

const emptyDescriptionStyle: React.CSSProperties = {
  color: '#475569',
  lineHeight: 1.6,
  fontWeight: 600,
}

