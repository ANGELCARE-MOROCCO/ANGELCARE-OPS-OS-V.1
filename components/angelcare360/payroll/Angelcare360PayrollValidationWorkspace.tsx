import type { Angelcare360PayrollReadinessRecord, Angelcare360PayrollRecordListRecord } from '@/types/angelcare360/payroll'
import Angelcare360PayrollDataTable from './Angelcare360PayrollDataTable'
import Angelcare360PayrollReadinessPanel from './Angelcare360PayrollReadinessPanel'

type Props = {
  readiness: Angelcare360PayrollReadinessRecord
  records: Angelcare360PayrollRecordListRecord[]
}

export default function Angelcare360PayrollValidationWorkspace({ readiness, records }: Props) {
  return (
    <section style={stackStyle}>
      <Angelcare360PayrollReadinessPanel readiness={readiness} />
      <Angelcare360PayrollDataTable
        title="Dossiers à vérifier"
        description="Les dossiers restent verrouillés tant que le calcul n’est pas exploitable."
        rows={records.filter((record) => ['draft', 'pending_review', 'blocked', 'payment_pending'].includes(String(record.status)))}
        emptyTitle="Aucun dossier à vérifier"
        emptyDescription="Les dossiers de paie préparés apparaîtront ici pour validation."
        columns={[
          { key: 'record', label: 'Dossier', render: (row) => row.payroll_number },
          { key: 'staff', label: 'Personnel', render: (row) => row.staff_full_name || row.staff_code || '—' },
          { key: 'period', label: 'Période', render: (row) => row.period_label || '—' },
          { key: 'status', label: 'Statut', render: (row) => row.status },
          { key: 'payment', label: 'Paiement', render: (row) => row.payment_status },
          { key: 'blocked', label: 'Motif', render: (row) => row.blocked_reason || '—' },
        ]}
      />
      <div style={lockStyle}>Le calcul final de la paie sera activé après validation des règles de rémunération de l’établissement.</div>
    </section>
  )
}

const stackStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const lockStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: '#fff7ed',
  color: '#92400e',
  fontWeight: 700,
  lineHeight: 1.6,
}
