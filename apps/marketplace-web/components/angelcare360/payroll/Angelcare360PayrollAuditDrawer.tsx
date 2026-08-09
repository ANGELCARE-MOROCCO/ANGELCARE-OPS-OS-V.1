import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'
import Angelcare360PayrollDataTable from './Angelcare360PayrollDataTable'

type Props = {
  events: Angelcare360AuditRecord[]
}

export default function Angelcare360PayrollAuditDrawer({ events }: Props) {
  return (
    <Angelcare360PayrollDataTable
      title="Audit paie"
      description="Journal des opérations sensibles et des blocages paie."
      rows={events}
      emptyTitle="Aucun événement"
      emptyDescription="Les opérations paie apparaîtront ici dès qu’elles sont exécutées."
      columns={[
        { key: 'action', label: 'Action', render: (row) => `${row.module} · ${row.action}` },
        { key: 'entity', label: 'Entité', render: (row) => row.entity_type || '—' },
        { key: 'actor', label: 'Acteur', render: (row) => row.actor_role || '—' },
        { key: 'severity', label: 'Gravité', render: (row) => row.severity },
        { key: 'date', label: 'Date', render: (row) => row.created_at },
      ]}
    />
  )
}
