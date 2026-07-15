import Angelcare360FinanceDataTable from '@/components/angelcare360/finance/Angelcare360FinanceDataTable'
import Angelcare360FinancePageShell from '@/components/angelcare360/finance/Angelcare360FinancePageShell'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { ANGELCARE360_FINANCE_NAVIGATION } from '@/data/angelcare360/finance-navigation'
import { getAngelcare360FinanceContext } from '../_utils'
import { listAngelcare360Receipts } from '@/lib/angelcare360/server/finance'

export const dynamic = 'force-dynamic'

export default async function Angelcare360FinanceReceiptsPage() {
  const context = await getAngelcare360FinanceContext()
  const receipts = await listAngelcare360Receipts({ schoolId: context.school!.id })

  return (
    <Angelcare360FinancePageShell
      title="Reçus"
      subtitle="Reçus émis uniquement pour des paiements confirmés."
      badge="Disponible"
      statusLabel={`${receipts.length} reçu(s)`}
      navigationItems={ANGELCARE360_FINANCE_NAVIGATION}
    >
      {receipts.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucun reçu"
          description="Aucun reçu n’est encore émis pour l’établissement sélectionné."
          actionLabel="Voir les paiements"
          actionHref="/angelcare-360-command-center/finance/paiements"
        />
      ) : (
        <Angelcare360FinanceDataTable
          title="Reçus émis"
          description="Les reçus sont liés aux paiements confirmés et restent sans export PDF tant que l’infrastructure n’est pas disponible."
          rows={receipts}
          emptyTitle="Aucun reçu"
          emptyDescription="Aucune donnée n’est disponible pour le moment."
          columns={[
            { key: 'receipt_number', label: 'Reçu', render: (row) => row.receipt_number },
            { key: 'payment', label: 'Paiement', render: (row) => row.payment_number || '—' },
            { key: 'amount', label: 'Montant', align: 'right', render: (row) => `${row.payment_amount || 0}` },
            { key: 'invoice', label: 'Facture', render: (row) => row.invoice_number || '—' },
            { key: 'status', label: 'Statut', render: (row) => row.status },
          ]}
        />
      )}
    </Angelcare360FinancePageShell>
  )
}

