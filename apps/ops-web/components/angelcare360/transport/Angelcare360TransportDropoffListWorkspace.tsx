import type { Angelcare360TransportDropoffListRecord } from '@/types/angelcare360/transport'
import Angelcare360TransportDataTable from './Angelcare360TransportDataTable'

type Angelcare360TransportDropoffListWorkspaceProps = {
  dropoffs: Angelcare360TransportDropoffListRecord[]
}

export default function Angelcare360TransportDropoffListWorkspace({ dropoffs }: Angelcare360TransportDropoffListWorkspaceProps) {
  return (
    <Angelcare360TransportDataTable
      title="Liste de dépôt"
      description="Les sorties élèves sont dérivées des affectations actives et restent sans suivi GPS simulé."
      rows={dropoffs}
      emptyTitle="Aucun dépôt"
      emptyDescription="Aucune affectation active n’est disponible pour le dépôt."
      columns={[
        { key: 'student', label: 'Élève', render: (row) => row.student_full_name || row.student_code || '—' },
        { key: 'route', label: 'Circuit', render: (row) => row.route_label || row.route_code || '—' },
        { key: 'stop', label: 'Arrêt', render: (row) => row.dropoff_stop_label || '—' },
        { key: 'time', label: 'Heure prévue', render: (row) => row.expected_time || '—' },
        { key: 'coverage', label: 'Contacts', render: (row) => row.emergency_contact_ready ? 'OK' : 'Manquant' },
      ]}
    />
  )
}

