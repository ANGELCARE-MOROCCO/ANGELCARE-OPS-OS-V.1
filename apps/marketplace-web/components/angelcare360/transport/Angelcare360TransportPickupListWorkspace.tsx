import type { Angelcare360TransportPickupListRecord } from '@/types/angelcare360/transport'
import Angelcare360TransportDataTable from './Angelcare360TransportDataTable'

type Angelcare360TransportPickupListWorkspaceProps = {
  pickups: Angelcare360TransportPickupListRecord[]
}

export default function Angelcare360TransportPickupListWorkspace({ pickups }: Angelcare360TransportPickupListWorkspaceProps) {
  return (
    <Angelcare360TransportDataTable
      title="Liste de ramassage"
      description="Les élèves, arrêts et horaires de départ sont dérivés des affectations actives."
      rows={pickups}
      emptyTitle="Aucun ramassage"
      emptyDescription="Aucune affectation active n’est disponible pour le ramassage."
      columns={[
        { key: 'student', label: 'Élève', render: (row) => row.student_full_name || row.student_code || '—' },
        { key: 'route', label: 'Circuit', render: (row) => row.route_label || row.route_code || '—' },
        { key: 'stop', label: 'Arrêt', render: (row) => row.pickup_stop_label || '—' },
        { key: 'time', label: 'Heure prévue', render: (row) => row.expected_time || '—' },
        { key: 'coverage', label: 'Contacts', render: (row) => row.emergency_contact_ready ? 'OK' : 'Manquant' },
      ]}
    />
  )
}

