import Link from 'next/link'
import type { Angelcare360TransportVehicleListRecord } from '@/types/angelcare360/transport'
import Angelcare360TransportDataTable from './Angelcare360TransportDataTable'
import Angelcare360TransportVehicleDrawer from './Angelcare360TransportVehicleDrawer'

type Angelcare360TransportVehiclesWorkspaceProps = {
  schoolId: string
  vehicles: Angelcare360TransportVehicleListRecord[]
}

export default function Angelcare360TransportVehiclesWorkspace({ schoolId, vehicles }: Angelcare360TransportVehiclesWorkspaceProps) {
  return (
    <section style={shellStyle}>
      <Angelcare360TransportVehicleDrawer schoolId={schoolId} />
      <Angelcare360TransportDataTable
        title="Véhicules enregistrés"
        description="Les véhicules sont suivis avec leur capacité, leur chauffeur et leur état opérationnel."
        rows={vehicles}
        emptyTitle="Aucun véhicule"
        emptyDescription="Créez un véhicule pour commencer à affecter les circuits."
        columns={[
          { key: 'vehicle', label: 'Véhicule', render: (row) => <VehicleCell row={row} /> },
          { key: 'driver', label: 'Chauffeur', render: (row) => row.assigned_driver_full_name || row.assigned_driver_staff_id || '—' },
          { key: 'route', label: 'Circuit', render: (row) => row.route_label || row.route_code || '—' },
          { key: 'capacity', label: 'Capacité', align: 'right', render: (row) => row.capacity_seats },
          { key: 'assignments', label: 'Élèves', align: 'right', render: (row) => row.active_assignment_count || 0 },
          { key: 'status', label: 'Statut', render: (row) => row.status },
          { key: 'action', label: 'Détail', render: (row) => <Link href={row.detail_href || '#'} style={linkStyle}>Ouvrir</Link> },
        ]}
      />
    </section>
  )
}

function VehicleCell({ row }: { row: Angelcare360TransportVehicleListRecord }) {
  return (
    <div style={stackStyle}>
      <div style={titleStyle}>{row.vehicle_code}</div>
      <div style={metaStyle}>{row.plate_number} · {row.model || 'Modèle non renseigné'}</div>
      {row.capacity_warning ? <div style={warningStyle}>Alerte capacité</div> : null}
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

