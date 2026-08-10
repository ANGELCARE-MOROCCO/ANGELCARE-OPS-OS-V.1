import Link from 'next/link'
import type { Angelcare360TransportRouteListRecord } from '@/types/angelcare360/transport'
import Angelcare360TransportDataTable from './Angelcare360TransportDataTable'
import Angelcare360TransportRouteDrawer from './Angelcare360TransportRouteDrawer'

type Angelcare360TransportRoutesWorkspaceProps = {
  schoolId: string
  routes: Angelcare360TransportRouteListRecord[]
}

export default function Angelcare360TransportRoutesWorkspace({ schoolId, routes }: Angelcare360TransportRoutesWorkspaceProps) {
  return (
    <section style={shellStyle}>
      <Angelcare360TransportRouteDrawer schoolId={schoolId} />
      <Angelcare360TransportDataTable
        title="Circuits enregistrés"
        description="Le circuit, le chauffeur, l’accompagnateur et le véhicule sont gérés côté serveur."
        rows={routes}
        emptyTitle="Aucun circuit"
        emptyDescription="Créez un circuit pour commencer à organiser le transport scolaire."
        columns={[
          { key: 'route', label: 'Circuit', render: (row) => <RouteCell row={row} /> },
          { key: 'staff', label: 'Responsables', render: (row) => <StaffCell row={row} /> },
          { key: 'vehicle', label: 'Véhicule', render: (row) => <VehicleCell row={row} /> },
          { key: 'capacity', label: 'Capacité', align: 'right', render: (row) => row.capacity_seats ?? '—' },
          { key: 'stops', label: 'Arrêts', align: 'right', render: (row) => row.stop_count || 0 },
          { key: 'assignments', label: 'Élèves', align: 'right', render: (row) => row.active_assignment_count || 0 },
          { key: 'status', label: 'Statut', render: (row) => row.status },
          { key: 'action', label: 'Détail', render: (row) => <Link href={row.detail_href || '#'} style={linkStyle}>Ouvrir</Link> },
        ]}
      />
    </section>
  )
}

function RouteCell({ row }: { row: Angelcare360TransportRouteListRecord }) {
  return (
    <div style={stackStyle}>
      <div style={titleStyle}>{row.label}</div>
      <div style={metaStyle}>{row.route_code} · {row.route_type}</div>
      {row.capacity_warning ? <div style={warningStyle}>Alerte capacité</div> : null}
    </div>
  )
}

function StaffCell({ row }: { row: Angelcare360TransportRouteListRecord }) {
  return (
    <div style={stackStyle}>
      <div style={titleStyle}>{row.responsible_staff_full_name || row.responsible_staff_id || 'Sans chauffeur'}</div>
      <div style={metaStyle}>{row.accompagnateur_staff_full_name || row.accompagnateur_staff_id || 'Sans accompagnateur'}</div>
    </div>
  )
}

function VehicleCell({ row }: { row: Angelcare360TransportRouteListRecord }) {
  return (
    <div style={stackStyle}>
      <div style={titleStyle}>{row.vehicle_plate_number || row.vehicle_code || 'Non affecté'}</div>
      <div style={metaStyle}>{row.vehicle_capacity_seats || '—'} place(s)</div>
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

const warningStyle: React.CSSProperties = {
  color: '#b45309',
  fontSize: 12,
  fontWeight: 800,
}

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  padding: '8px 10px',
  textDecoration: 'none',
  fontWeight: 800,
}

