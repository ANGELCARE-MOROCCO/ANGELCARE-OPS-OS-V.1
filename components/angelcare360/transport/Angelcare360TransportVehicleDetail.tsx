import type { Angelcare360TransportVehicleListRecord } from '@/types/angelcare360/transport'
import Angelcare360TransportVehicleDrawer from './Angelcare360TransportVehicleDrawer'

type Angelcare360TransportVehicleDetailProps = {
  schoolId: string
  vehicle: Angelcare360TransportVehicleListRecord
}

export default function Angelcare360TransportVehicleDetail({ schoolId, vehicle }: Angelcare360TransportVehicleDetailProps) {
  return (
    <section style={shellStyle}>
      <section style={cardStyle}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Détail véhicule</div>
            <h2 style={titleStyle}>{vehicle.vehicle_code}</h2>
            <p style={subtitleStyle}>{vehicle.plate_number} · {vehicle.model || 'Modèle non renseigné'} · {vehicle.status}</p>
          </div>
          {vehicle.capacity_warning ? <span style={warningChipStyle}>Capacité dépassée</span> : null}
        </div>

        <div style={metricGridStyle}>
          <Metric label="Capacité" value={vehicle.capacity_seats} />
          <Metric label="Affectations actives" value={vehicle.active_assignment_count || 0} />
          <Metric label="Chauffeur" value={vehicle.assigned_driver_full_name || vehicle.assigned_driver_staff_id || 'Non affecté'} />
          <Metric label="Circuit" value={vehicle.route_label || vehicle.route_code || 'Non affecté'} />
        </div>
      </section>

      <Angelcare360TransportVehicleDrawer schoolId={schoolId} vehicle={vehicle} />
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <article style={metricCardStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>{String(value ?? '—')}</div>
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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

