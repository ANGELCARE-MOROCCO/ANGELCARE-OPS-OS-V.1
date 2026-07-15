import Angelcare360FinanceDataTable from '@/components/angelcare360/finance/Angelcare360FinanceDataTable'
import Angelcare360FinancePageShell from '@/components/angelcare360/finance/Angelcare360FinancePageShell'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { ANGELCARE360_FINANCE_NAVIGATION } from '@/data/angelcare360/finance-navigation'
import { getAngelcare360FinanceContext } from '../_utils'
import { listAngelcare360Expenses } from '@/lib/angelcare360/server/finance'

export const dynamic = 'force-dynamic'

export default async function Angelcare360FinanceExpensesPage() {
  const context = await getAngelcare360FinanceContext()
  const expenses = await listAngelcare360Expenses({ schoolId: context.school!.id })

  return (
    <Angelcare360FinancePageShell
      title="Dépenses"
      subtitle="Dépenses opérationnelles enregistrées si le socle finance les supporte."
      badge="Disponible"
      statusLabel={`${expenses.length} dépense(s)`}
      navigationItems={ANGELCARE360_FINANCE_NAVIGATION}
    >
      {expenses.length === 0 ? (
        <Angelcare360EmptyState title="Aucune dépense" description="Aucune dépense n’a encore été enregistrée pour l’établissement." actionLabel="Retour au cockpit" actionHref="/angelcare-360-command-center/finance" />
      ) : (
        <Angelcare360FinanceDataTable
          title="Dépenses"
          description="Les dépenses sont limitées au périmètre financier et auditées côté serveur."
          rows={expenses}
          emptyTitle="Aucune dépense"
          emptyDescription="Aucune donnée n’est disponible pour le moment."
          columns={[
            { key: 'code', label: 'Code', render: (row) => row.expense_code },
            { key: 'date', label: 'Date', render: (row) => row.expense_date },
            { key: 'vendor', label: 'Fournisseur', render: (row) => row.vendor_name },
            { key: 'amount', label: 'Montant', align: 'right', render: (row) => `${row.amount}` },
            { key: 'status', label: 'Statut', render: (row) => row.status },
          ]}
        />
      )}
    </Angelcare360FinancePageShell>
  )
}

