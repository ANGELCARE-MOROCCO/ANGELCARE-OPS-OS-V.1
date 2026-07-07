import Link from 'next/link'
import Angelcare360FinanceDataTable from '@/components/angelcare360/finance/Angelcare360FinanceDataTable'
import Angelcare360FinancePageShell from '@/components/angelcare360/finance/Angelcare360FinancePageShell'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { ANGELCARE360_FINANCE_NAVIGATION } from '@/data/angelcare360/finance-navigation'
import { getAngelcare360FinanceContext } from '../_utils'
import { listAngelcare360Discounts } from '@/lib/angelcare360/server/finance'

export const dynamic = 'force-dynamic'

export default async function Angelcare360FinanceDiscountsPage() {
  const context = await getAngelcare360FinanceContext()
  const discounts = await listAngelcare360Discounts({ schoolId: context.school!.id })

  return (
    <Angelcare360FinancePageShell
      title="Remises"
      subtitle="Demandes, approbations et application des remises."
      badge="Phase 8"
      statusLabel={`${discounts.length} remise(s)`}
      navigationItems={ANGELCARE360_FINANCE_NAVIGATION}
    >
      {discounts.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucune remise"
          description="Aucune remise n’est enregistrée pour le moment."
          actionLabel="Voir les factures"
          actionHref="/angelcare-360-command-center/finance/factures"
        />
      ) : (
        <Angelcare360FinanceDataTable
          title="Remises et réductions"
          description="Les remises sont auditées et ne s’appliquent que via le serveur."
          rows={discounts}
          emptyTitle="Aucune remise"
          emptyDescription="Aucune donnée n’est disponible pour le moment."
          columns={[
            { key: 'discount_code', label: 'Code', render: (row) => row.discount_code },
            { key: 'student', label: 'Élève', render: (row) => row.student_full_name || '—' },
            { key: 'invoice', label: 'Facture', render: (row) => row.invoice_number || '—' },
            { key: 'amount', label: 'Montant', align: 'right', render: (row) => `${row.amount}` },
            { key: 'status', label: 'Statut', render: (row) => row.status },
          ]}
        />
      )}
    </Angelcare360FinancePageShell>
  )
}

