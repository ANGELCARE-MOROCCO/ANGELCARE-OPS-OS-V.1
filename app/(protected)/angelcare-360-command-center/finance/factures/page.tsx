import Link from 'next/link'
import Angelcare360FinanceDataTable from '@/components/angelcare360/finance/Angelcare360FinanceDataTable'
import Angelcare360FinancePageShell from '@/components/angelcare360/finance/Angelcare360FinancePageShell'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { ANGELCARE360_FINANCE_NAVIGATION } from '@/data/angelcare360/finance-navigation'
import { getAngelcare360FinanceContext } from '../_utils'
import { listAngelcare360Invoices } from '@/lib/angelcare360/server/finance'

export const dynamic = 'force-dynamic'

export default async function Angelcare360FinanceInvoicesPage() {
  const context = await getAngelcare360FinanceContext()
  const invoices = await listAngelcare360Invoices({ schoolId: context.school!.id })

  return (
    <Angelcare360FinancePageShell
      title="Factures"
      subtitle="Brouillons, émission, statut de paiement et lignes de facture liées au recouvrement scolaire."
      badge="Phase 8"
      statusLabel={`${invoices.length} facture(s)`}
      navigationItems={ANGELCARE360_FINANCE_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/finance" style={linkStyle}>Retour au cockpit</Link>}
    >
      {invoices.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucune facture"
          description="Les factures seront créées via le moteur finance serveur quand les lignes et le contexte élève seront disponibles."
          actionLabel="Voir les soldes"
          actionHref="/angelcare-360-command-center/finance/soldes-eleves"
        />
      ) : (
        <Angelcare360FinanceDataTable
          title="Factures enregistrées"
          description="Les totaux sont calculés côté serveur à partir des lignes et remises."
          rows={invoices}
          emptyTitle="Aucune facture"
          emptyDescription="Aucune donnée n’est disponible pour le moment."
          columns={[
            { key: 'invoice_number', label: 'Facture', render: (row) => <InvoiceCell row={row} /> },
            { key: 'student', label: 'Élève', render: (row) => row.student_full_name || '—' },
            { key: 'year', label: 'Année', render: (row) => row.academic_year_label || '—' },
            { key: 'total', label: 'Total', align: 'right', render: (row) => `${row.total_amount}` },
            { key: 'paid', label: 'Payé', align: 'right', render: (row) => `${row.amount_paid}` },
            { key: 'balance', label: 'Solde', align: 'right', render: (row) => `${row.balance_due}` },
            { key: 'status', label: 'Statut', render: (row) => row.status },
            { key: 'action', label: 'Détail', render: (row) => <Link href={row.detail_href || '#'} style={linkStyle}>Ouvrir</Link> },
          ]}
        />
      )}
    </Angelcare360FinancePageShell>
  )
}

function InvoiceCell({ row }: { row: { invoice_number: string; invoice_date: string; due_date?: string | null } }) {
  return (
    <div style={stackStyle}>
      <div style={titleStyle}>{row.invoice_number}</div>
      <div style={metaStyle}>{row.invoice_date}</div>
      {row.due_date ? <div style={metaStyle}>Échéance: {row.due_date}</div> : null}
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

