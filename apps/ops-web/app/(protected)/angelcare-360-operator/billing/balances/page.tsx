import { notFound } from 'next/navigation'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorBalancesPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const clients = await listOperatorClients()

  return (
    <Angelcare360OperatorPageShell
      badge="Soldes & impayés"
      statusLabel={`${clients.length} client(s)`}
      title="Soldes clients"
      subtitle="Vue consolidée des balances, encours et signaux de risque par client."
    >
      <Angelcare360OperatorDataTable
        title="Balances par client"
        rows={clients}
        emptyTitle="Aucun client"
        emptyDescription="Les soldes clients apparaîtront ici avec leurs signaux de recouvrement."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        hrefKey={(row) => `/angelcare-360-operator/clients/${String((row as Record<string, unknown>).id)}`}
        columns={[
          { key: 'display_name', label: 'Client', render: (row) => String((row as Record<string, unknown>).display_name || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'lifecycle_stage', label: 'Cycle', render: (row) => String((row as Record<string, unknown>).lifecycle_stage || '—') },
          { key: 'balance_due_mad', label: 'Solde dû', align: 'right', render: (row) => `${Number((row as Record<string, unknown>).balance_due_mad || 0).toLocaleString('fr-FR')} MAD` },
          { key: 'support_count', label: 'Tickets', align: 'right', render: (row) => String((row as Record<string, unknown>).support_count || 0) },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
