import Angelcare360FinanceDataTable from '@/components/angelcare360/finance/Angelcare360FinanceDataTable'
import Angelcare360FinancePageShell from '@/components/angelcare360/finance/Angelcare360FinancePageShell'
import { ANGELCARE360_FINANCE_NAVIGATION } from '@/data/angelcare360/finance-navigation'
import { getAngelcare360FinanceContext } from '../_utils'
import { listAngelcare360FinanceAuditEvents } from '@/lib/angelcare360/server/finance'

export const dynamic = 'force-dynamic'

export default async function Angelcare360FinanceAuditPage() {
  const context = await getAngelcare360FinanceContext()
  const events = await listAngelcare360FinanceAuditEvents({ schoolId: context.school!.id })

  return (
    <Angelcare360FinancePageShell
      title="Audit finance"
      subtitle="Journal des événements financiers, opérations sensibles et blocages d’export."
      badge="Disponible"
      statusLabel={`${events.length} événement(s)`}
      navigationItems={ANGELCARE360_FINANCE_NAVIGATION}
    >
      <Angelcare360FinanceDataTable
        title="Événements d’audit"
        description="Les événements financiers sont écrits côté serveur et filtrables par action ou entité."
        rows={events}
        emptyTitle="Aucun événement"
        emptyDescription="Aucun audit financier n’est encore enregistré."
        columns={[
          { key: 'created_at', label: 'Date', render: (row) => row.created_at },
          { key: 'module', label: 'Module', render: (row) => row.module },
          { key: 'action', label: 'Action', render: (row) => row.action },
          { key: 'entity', label: 'Entité', render: (row) => row.entity_type || '—' },
          { key: 'severity', label: 'Sévérité', render: (row) => row.severity },
          { key: 'actor', label: 'Auteur', render: (row) => row.actor_role || '—' },
        ]}
      />
    </Angelcare360FinancePageShell>
  )
}
