import Link from 'next/link'
import type { Angelcare360PayrollPeriodListRecord } from '@/types/angelcare360/payroll'
import Angelcare360PayrollDataTable from './Angelcare360PayrollDataTable'

type Props = {
  periods: Angelcare360PayrollPeriodListRecord[]
}

export default function Angelcare360PayrollPeriodsWorkspace({ periods }: Props) {
  return (
    <Angelcare360PayrollDataTable
      title="Périodes de paie"
      description="Périodes préparées, ouvertes, calculées ou clôturées."
      rows={periods}
      emptyTitle="Aucune période"
      emptyDescription="Créez une période de paie lorsque le calendrier de rémunération est prêt."
      columns={[
        { key: 'period', label: 'Période', render: (row) => <PeriodCell row={row} /> },
        { key: 'year', label: 'Année', render: (row) => row.academic_year_label || '—' },
        { key: 'records', label: 'Dossiers', align: 'right', render: (row) => row.payroll_record_count || 0 },
        { key: 'validated', label: 'Validés', align: 'right', render: (row) => row.validated_record_count || 0 },
        { key: 'paid', label: 'Payés', align: 'right', render: (row) => row.paid_record_count || 0 },
        { key: 'gross', label: 'Brut', align: 'right', render: (row) => row.gross_total || 0 },
        { key: 'status', label: 'Statut', render: (row) => row.status },
        { key: 'action', label: 'Détail', render: (row) => <Link href={row.detail_href || '#'} style={linkStyle}>Ouvrir</Link> },
      ]}
    />
  )
}

function PeriodCell({ row }: { row: Angelcare360PayrollPeriodListRecord }) {
  return (
    <div style={stackStyle}>
      <div style={titleStyle}>{row.label}</div>
      <div style={metaStyle}>{row.period_code}</div>
      <div style={metaStyle}>{row.starts_on} → {row.ends_on}</div>
    </div>
  )
}

const stackStyle: React.CSSProperties = { display: 'grid', gap: 4 }
const titleStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 900 }
const metaStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 700 }
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
