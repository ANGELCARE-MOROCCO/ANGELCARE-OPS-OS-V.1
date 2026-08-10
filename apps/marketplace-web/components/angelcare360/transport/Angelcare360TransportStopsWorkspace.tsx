import type { Angelcare360TransportStopListRecord } from '@/types/angelcare360/transport'
import Angelcare360TransportDataTable from './Angelcare360TransportDataTable'
import Angelcare360TransportStopDrawer from './Angelcare360TransportStopDrawer'

type Angelcare360TransportStopsWorkspaceProps = {
  schoolId: string
  stops: Angelcare360TransportStopListRecord[]
  routes: Array<{ label: string; value: string }>
}

export default function Angelcare360TransportStopsWorkspace({ schoolId, stops, routes }: Angelcare360TransportStopsWorkspaceProps) {
  return (
    <section style={shellStyle}>
      <Angelcare360TransportStopDrawer schoolId={schoolId} routes={routes} />
      <Angelcare360TransportDataTable
        title="Arrêts configurés"
        description="Les arrêts sont ordonnés par circuit et prêts pour le ramassage et le dépôt."
        rows={stops}
        emptyTitle="Aucun arrêt"
        emptyDescription="Ajoutez au moins un arrêt pour chaque circuit actif."
        columns={[
          { key: 'stop', label: 'Arrêt', render: (row) => <StopCell row={row} /> },
          { key: 'route', label: 'Circuit', render: (row) => row.route_label || row.route_code || '—' },
          { key: 'time', label: 'Heure', render: (row) => row.planned_time || '—' },
          { key: 'order', label: 'Ordre', align: 'right', render: (row) => row.order_index },
          { key: 'status', label: 'Statut', render: (row) => row.status },
        ]}
      />
      {stops.map((stop) => (
        <details key={stop.id} style={detailsStyle}>
          <summary style={summaryStyle}>Modifier {stop.label}</summary>
          <div style={detailsContentStyle}>
            <Angelcare360TransportStopDrawer schoolId={schoolId} routes={routes} stop={stop} />
          </div>
        </details>
      ))}
    </section>
  )
}

function StopCell({ row }: { row: Angelcare360TransportStopListRecord }) {
  return (
    <div style={stackStyle}>
      <div style={titleStyle}>{row.label}</div>
      <div style={metaStyle}>{row.stop_code}</div>
    </div>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
}

const stackStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const titleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 900,
}

const metaStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 700,
}

const detailsStyle: React.CSSProperties = {
  borderRadius: 20,
  border: '1px solid #e2e8f0',
  background: '#fff',
  padding: 14,
}

const summaryStyle: React.CSSProperties = {
  cursor: 'pointer',
  fontWeight: 900,
  color: '#0f172a',
}

const detailsContentStyle: React.CSSProperties = {
  marginTop: 12,
}

