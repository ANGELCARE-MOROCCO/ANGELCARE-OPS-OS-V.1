import Link from 'next/link'
import type { Angelcare360PayrollRecordListRecord } from '@/types/angelcare360/payroll'
import Angelcare360PayrollDataTable from './Angelcare360PayrollDataTable'

type Props = {
  records: Angelcare360PayrollRecordListRecord[]
}

export default function Angelcare360PayrollPaymentsWorkspace({ records }: Props) {
  return (
    <Angelcare360PayrollDataTable
      title="Paiements paie"
      description="Suivi des confirmations internes, sans virement bancaire exécuté."
      rows={records}
      emptyTitle="Aucun paiement"
      emptyDescription="Aucun dossier n’a encore atteint le statut de paiement confirmé."
      columns={[
        { key: 'record', label: 'Dossier', render: (row) => row.payroll_number },
        { key: 'staff', label: 'Personnel', render: (row) => row.staff_full_name || row.staff_code || '—' },
        { key: 'amount', label: 'Net', align: 'right', render: (row) => row.net_amount },
        { key: 'payment', label: 'Statut paiement', render: (row) => row.payment_status },
        { key: 'method', label: 'Méthode', render: (row) => row.payment_method || '—' },
        { key: 'reference', label: 'Référence', render: (row) => row.payment_reference || '—' },
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
