import Link from 'next/link'
import type { Angelcare360PayrollRecordListRecord } from '@/types/angelcare360/payroll'
import Angelcare360PayrollDataTable from './Angelcare360PayrollDataTable'

type Props = {
  records: Angelcare360PayrollRecordListRecord[]
}

export default function Angelcare360PayrollRecordsWorkspace({ records }: Props) {
  return (
    <Angelcare360PayrollDataTable
      title="Dossiers de paie"
      description="Préparation, validation et confirmation de paiement des dossiers."
      rows={records}
      emptyTitle="Aucun dossier"
      emptyDescription="Préparez un dossier lorsque le personnel et la période sont prêts."
      columns={[
        { key: 'record', label: 'Dossier', render: (row) => <RecordCell row={row} /> },
        { key: 'staff', label: 'Personnel', render: (row) => row.staff_full_name || row.staff_code || '—' },
        { key: 'period', label: 'Période', render: (row) => row.period_label || '—' },
        { key: 'base', label: 'Base', align: 'right', render: (row) => row.base_salary },
        { key: 'net', label: 'Net', align: 'right', render: (row) => row.net_amount },
        { key: 'payment', label: 'Paiement', render: (row) => row.payment_status },
        { key: 'status', label: 'Statut', render: (row) => row.status },
        { key: 'action', label: 'Détail', render: (row) => <Link href={row.detail_href || '#'} style={linkStyle}>Ouvrir</Link> },
      ]}
    />
  )
}

function RecordCell({ row }: { row: Angelcare360PayrollRecordListRecord }) {
  return (
    <div style={stackStyle}>
      <div style={titleStyle}>{row.payroll_number}</div>
      <div style={metaStyle}>{row.department || row.staff_type || '—'}</div>
      {row.blocked_reason ? <div style={warningStyle}>{row.blocked_reason}</div> : null}
    </div>
  )
}

const stackStyle: React.CSSProperties = { display: 'grid', gap: 4 }
const titleStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 900 }
const metaStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 700 }
const warningStyle: React.CSSProperties = { color: '#92400e', fontSize: 12, fontWeight: 700, lineHeight: 1.5 }
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
