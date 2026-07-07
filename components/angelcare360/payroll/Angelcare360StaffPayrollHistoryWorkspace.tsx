import Link from 'next/link'
import type { Angelcare360PayrollRecordListRecord } from '@/types/angelcare360/payroll'
import Angelcare360PayrollDataTable from './Angelcare360PayrollDataTable'

type Props = {
  records: Angelcare360PayrollRecordListRecord[]
}

export default function Angelcare360StaffPayrollHistoryWorkspace({ records }: Props) {
  return (
    <Angelcare360PayrollDataTable
      title="Historique personnel"
      description="Vue chronologique des dossiers de paie du personnel."
      rows={records}
      emptyTitle="Aucun historique"
      emptyDescription="Aucun dossier n’a encore été enregistré pour ce membre du personnel."
      columns={[
        { key: 'staff', label: 'Personnel', render: (row) => row.staff_full_name || row.staff_code || '—' },
        { key: 'record', label: 'Dossier', render: (row) => row.payroll_number },
        { key: 'period', label: 'Période', render: (row) => row.period_label || '—' },
        { key: 'base', label: 'Base', align: 'right', render: (row) => row.base_salary },
        { key: 'net', label: 'Net', align: 'right', render: (row) => row.net_amount },
        { key: 'status', label: 'Statut', render: (row) => row.status },
        { key: 'action', label: 'Détail', render: (row) => <Link href={row.detail_href || '#'} style={linkStyle}>Ouvrir</Link> },
      ]}
    />
  )
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
