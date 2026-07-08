import Link from 'next/link'
import Angelcare360FinanceDataTable from '@/components/angelcare360/finance/Angelcare360FinanceDataTable'
import Angelcare360FinancePageShell from '@/components/angelcare360/finance/Angelcare360FinancePageShell'
import { ANGELCARE360_FINANCE_NAVIGATION } from '@/data/angelcare360/finance-navigation'
import { getAngelcare360FinanceContext } from '../_utils'
import { listAngelcare360StudentBalances } from '@/lib/angelcare360/server/finance'

export const dynamic = 'force-dynamic'

export default async function Angelcare360FinanceBalancesPage() {
  const context = await getAngelcare360FinanceContext()
  const balances = await listAngelcare360StudentBalances({ schoolId: context.school!.id })

  return (
    <Angelcare360FinancePageShell
      title="Soldes élèves"
      subtitle="Vue consolidée des créances, paiements, remises et reste à payer."
      badge="Disponible"
      statusLabel={`${balances.length} élève(s)`}
      navigationItems={ANGELCARE360_FINANCE_NAVIGATION}
    >
      <Angelcare360FinanceDataTable
        title="Soldes par élève"
        description="Les soldes sont calculés à partir des factures, paiements confirmés et remises appliquées."
        rows={balances}
        emptyTitle="Aucun solde"
        emptyDescription="Aucun élève n’a encore de solde calculé."
        columns={[
          { key: 'student', label: 'Élève', render: (row) => <Link href={row.detailHref} style={linkStyle}>{row.studentFullName}</Link> },
          { key: 'class', label: 'Classe', render: (row) => row.className || '—' },
          { key: 'invoiced', label: 'Facturé', align: 'right', render: (row) => `${row.invoicedTotal}` },
          { key: 'paid', label: 'Payé', align: 'right', render: (row) => `${row.paidTotal}` },
          { key: 'discount', label: 'Remises', align: 'right', render: (row) => `${row.discountTotal}` },
          { key: 'outstanding', label: 'Solde', align: 'right', render: (row) => `${row.outstandingTotal}` },
          { key: 'state', label: 'Calcul', render: (row) => row.isPartialCalculation ? 'Partiel' : 'Complet' },
        ]}
      />
    </Angelcare360FinancePageShell>
  )
}

const linkStyle: React.CSSProperties = {
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 800,
}

