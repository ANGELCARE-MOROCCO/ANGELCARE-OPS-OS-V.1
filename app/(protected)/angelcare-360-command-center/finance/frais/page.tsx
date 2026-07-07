import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360FinanceDataTable from '@/components/angelcare360/finance/Angelcare360FinanceDataTable'
import Angelcare360FinancePageShell from '@/components/angelcare360/finance/Angelcare360FinancePageShell'
import { ANGELCARE360_FINANCE_NAVIGATION } from '@/data/angelcare360/finance-navigation'
import { getAngelcare360FinanceContext } from '../_utils'
import { listAngelcare360FeeStructures } from '@/lib/angelcare360/server/finance'

export const dynamic = 'force-dynamic'

export default async function Angelcare360FinanceFeesPage() {
  const context = await getAngelcare360FinanceContext()
  const feeStructures = await listAngelcare360FeeStructures({ schoolId: context.school!.id })

  return (
    <Angelcare360FinancePageShell
      title="Frais scolaires"
      subtitle="Structures tarifaires, articles de frais et affectations associées à la scolarité."
      badge="Phase 8"
      statusLabel={`${feeStructures.length} structure(s)`}
      navigationItems={ANGELCARE360_FINANCE_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/finance" style={linkStyle}>Retour au cockpit</Link>}
    >
      {feeStructures.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucune structure de frais"
          description="Créez une structure tarifaire via l’API finance ou la prochaine couche formulaire de production."
          actionLabel="Voir le cockpit"
          actionHref="/angelcare-360-command-center/finance"
        />
      ) : (
        <Angelcare360FinanceDataTable
          title="Structures de frais"
          description="Les montants et articles sont persistés en base et calculés côté serveur."
          rows={feeStructures}
          emptyTitle="Aucune structure"
          emptyDescription="Aucune donnée n’est disponible pour le moment."
          columns={[
            { key: 'label', label: 'Structure', render: (row) => <ItemTitle row={row} /> },
            { key: 'year', label: 'Année', render: (row) => row.academic_year_label || '—' },
            { key: 'currency', label: 'Devise', render: (row) => row.currency },
            { key: 'items', label: 'Articles', render: (row) => String(row.fee_item_count || 0) },
            { key: 'assignments', label: 'Affectations', render: (row) => String(row.student_assignment_count || 0) },
            { key: 'status', label: 'Statut', render: (row) => <StatusPill label={row.status} /> },
            { key: 'action', label: 'Détail', render: (row) => <Link href={row.detail_href || '#'} style={linkStyle}>Ouvrir</Link> },
          ]}
        />
      )}
    </Angelcare360FinancePageShell>
  )
}

function ItemTitle({ row }: { row: { label: string; fee_code: string; description?: string | null } }) {
  return (
    <div style={stackStyle}>
      <div style={titleStyle}>{row.label}</div>
      <div style={metaStyle}>{row.fee_code}</div>
      {row.description ? <div style={descriptionStyle}>{row.description}</div> : null}
    </div>
  )
}

function StatusPill({ label }: { label: string }) {
  return <span style={pillStyle}>{label}</span>
}

const stackStyle: React.CSSProperties = { display: 'grid', gap: 4 }
const titleStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 900 }
const metaStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 700 }
const descriptionStyle: React.CSSProperties = { color: '#475569', fontSize: 12, lineHeight: 1.45, fontWeight: 600 }
const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '5px 9px',
  background: '#dcfce7',
  color: '#166534',
  fontSize: 11,
  fontWeight: 900,
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

