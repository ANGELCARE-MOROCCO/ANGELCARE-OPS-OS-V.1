import type { Angelcare360TransportRouteListRecord } from '@/types/angelcare360/transport'
import Angelcare360TransportRouteDrawer from './Angelcare360TransportRouteDrawer'

type Angelcare360TransportRouteDetailProps = {
  schoolId: string
  route: Angelcare360TransportRouteListRecord
}

export default function Angelcare360TransportRouteDetail({ schoolId, route }: Angelcare360TransportRouteDetailProps) {
  const metrics = [
    ['Arrêts', route.stop_count || 0],
    ['Affectations', route.assignment_count || 0],
    ['Affectations actives', route.active_assignment_count || 0],
    ['Capacité', route.capacity_seats ?? '—'],
  ]

  return (
    <section style={shellStyle}>
      <section style={cardStyle}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Détail circuit</div>
            <h2 style={titleStyle}>{route.label}</h2>
            <p style={subtitleStyle}>{route.route_code} · {route.route_type} · {route.status}</p>
          </div>
          <div style={chipRowStyle}>
            {route.capacity_warning ? <span style={warningChipStyle}>Alerte capacité</span> : null}
            {route.missing_driver ? <span style={warningChipStyle}>Chauffeur manquant</span> : null}
            {route.missing_accompagnateur ? <span style={warningChipStyle}>Accompagnateur manquant</span> : null}
          </div>
        </div>

        <div style={metricGridStyle}>
          {metrics.map(([label, value]) => (
            <article key={String(label)} style={metricCardStyle}>
              <div style={metricLabelStyle}>{label}</div>
              <div style={metricValueStyle}>{String(value)}</div>
            </article>
          ))}
        </div>

        <div style={textGridStyle}>
          <TextLine label="Chauffeur" value={route.responsible_staff_full_name || route.responsible_staff_id || 'Non affecté'} />
          <TextLine label="Accompagnateur" value={route.accompagnateur_staff_full_name || route.accompagnateur_staff_id || 'Non affecté'} />
          <TextLine label="Véhicule" value={route.vehicle_plate_number || route.vehicle_code || 'Non affecté'} />
        </div>
      </section>

      <Angelcare360TransportRouteDrawer schoolId={schoolId} route={route} />
    </section>
  )
}

function TextLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <article style={textCardStyle}>
      <div style={textLabelStyle}>{label}</div>
      <div style={textValueStyle}>{value}</div>
    </article>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
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
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
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
  fontSize: 24,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '10px 0 0',
  color: '#475569',
  fontWeight: 700,
}

const chipRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const warningChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#fef3c7',
  color: '#92400e',
  fontSize: 12,
  fontWeight: 900,
}

const metricGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
}

const metricCardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: 14,
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
}

const metricLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.7,
  fontWeight: 900,
}

const metricValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 22,
  fontWeight: 950,
}

const textGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
}

const textCardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: 14,
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#fff',
}

const textLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.7,
  fontWeight: 900,
}

const textValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 700,
  lineHeight: 1.5,
}

