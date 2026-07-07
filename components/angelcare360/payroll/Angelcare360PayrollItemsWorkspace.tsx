import Link from 'next/link'
import type { Angelcare360PayrollItemListRecord } from '@/types/angelcare360/payroll'
import Angelcare360PayrollDataTable from './Angelcare360PayrollDataTable'

type Props = {
  items: Angelcare360PayrollItemListRecord[]
  title?: string
  description?: string
}

export default function Angelcare360PayrollItemsWorkspace({ items, title = 'Éléments de paie', description = 'Base salaire, primes, retenues, avances, ajustements et remboursements.' }: Props) {
  return (
    <Angelcare360PayrollDataTable
      title={title}
      description={description}
      rows={items}
      emptyTitle="Aucun élément"
      emptyDescription="Ajoutez un élément de paie pour faire évoluer le calcul du dossier."
      columns={[
        { key: 'item', label: 'Élément', render: (row) => <ItemCell row={row} /> },
        { key: 'type', label: 'Type', render: (row) => row.item_type },
        { key: 'amount', label: 'Montant', align: 'right', render: (row) => row.amount },
        { key: 'staff', label: 'Personnel', render: (row) => row.staff_full_name || row.staff_code || '—' },
        { key: 'period', label: 'Période', render: (row) => row.period_label || '—' },
        { key: 'status', label: 'Statut', render: (row) => row.status },
        { key: 'action', label: 'Détail', render: (row) => <Link href={row.detail_href || '#'} style={linkStyle}>Ouvrir</Link> },
      ]}
    />
  )
}

function ItemCell({ row }: { row: Angelcare360PayrollItemListRecord }) {
  return (
    <div style={stackStyle}>
      <div style={titleStyle}>{row.label}</div>
      <div style={metaStyle}>{row.item_code}</div>
      {row.notes ? <div style={metaStyle}>{row.notes}</div> : null}
    </div>
  )
}

const stackStyle: React.CSSProperties = { display: 'grid', gap: 4 }
const titleStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 900 }
const metaStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 700, lineHeight: 1.5 }
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
