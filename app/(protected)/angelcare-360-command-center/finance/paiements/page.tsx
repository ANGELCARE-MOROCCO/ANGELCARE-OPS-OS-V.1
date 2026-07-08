import Link from 'next/link'
import Angelcare360FinanceDataTable from '@/components/angelcare360/finance/Angelcare360FinanceDataTable'
import Angelcare360FinancePageShell from '@/components/angelcare360/finance/Angelcare360FinancePageShell'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { ANGELCARE360_FINANCE_NAVIGATION } from '@/data/angelcare360/finance-navigation'
import { getAngelcare360FinanceContext } from '../_utils'
import { listAngelcare360Payments } from '@/lib/angelcare360/server/finance'

export const dynamic = 'force-dynamic'

export default async function Angelcare360FinancePaymentsPage() {
  const context = await getAngelcare360FinanceContext()
  const payments = await listAngelcare360Payments({ schoolId: context.school!.id })

  return (
    <Angelcare360FinancePageShell
      title="Paiements"
      subtitle="Saisie, confirmation, rejet et allocation côté serveur."
      badge="Disponible"
      statusLabel={`${payments.length} paiement(s)`}
      navigationItems={ANGELCARE360_FINANCE_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/finance" style={linkStyle}>Retour au cockpit</Link>}
    >
      {payments.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucun paiement"
          description="Les paiements seront enregistrés et confirmés via le moteur finance serveur."
          actionLabel="Voir les factures"
          actionHref="/angelcare-360-command-center/finance/factures"
        />
      ) : (
        <Angelcare360FinanceDataTable
          title="Paiements enregistrés"
          description="Les paiements confirmés alimentent l’allocation et les reçus."
          rows={payments}
          emptyTitle="Aucun paiement"
          emptyDescription="Aucune donnée n’est disponible pour le moment."
          columns={[
            { key: 'number', label: 'Paiement', render: (row) => <PaymentCell row={row} /> },
            { key: 'invoice', label: 'Facture', render: (row) => row.invoice_number || '—' },
            { key: 'student', label: 'Élève', render: (row) => row.student_full_name || '—' },
            { key: 'amount', label: 'Montant', align: 'right', render: (row) => `${row.amount}` },
            { key: 'allocated', label: 'Alloué', align: 'right', render: (row) => `${row.allocated_amount}` },
            { key: 'method', label: 'Mode', render: (row) => row.method },
            { key: 'status', label: 'Statut', render: (row) => row.status },
            { key: 'action', label: 'Détail', render: (row) => <Link href={row.detail_href || '#'} style={linkStyle}>Ouvrir</Link> },
          ]}
        />
      )}
    </Angelcare360FinancePageShell>
  )
}

function PaymentCell({ row }: { row: { payment_number: string; payment_date: string; reference?: string | null } }) {
  return (
    <div style={stackStyle}>
      <div style={titleStyle}>{row.payment_number}</div>
      <div style={metaStyle}>{row.payment_date}</div>
      {row.reference ? <div style={metaStyle}>Réf. {row.reference}</div> : null}
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

