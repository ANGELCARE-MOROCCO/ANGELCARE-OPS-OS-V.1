import { notFound } from 'next/navigation'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { getOperatorTenantAccessSummary } from '@/lib/angelcare360/operator/tenants'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorClientAccessPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const accessRows = await getOperatorTenantAccessSummary()

  return (
    <Angelcare360OperatorPageShell
      badge="Accès client"
      statusLabel={`${accessRows.length} tenant(s)`}
      title="Accès client"
      subtitle="État des accès tenant, statut de mise en service et disponibilité du command center."
    >
      <Angelcare360OperatorDataTable
        title="Accès et disponibilité"
        rows={accessRows}
        emptyTitle="Aucun tenant"
        emptyDescription="Les accès client apparaîtront ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'tenant_slug', label: 'Tenant', render: (row) => String((row as Record<string, unknown>).tenant_slug || '—') },
          { key: 'client_id', label: 'Client', render: (row) => String((row as Record<string, unknown>).client_id || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'provisioning_status', label: 'Mise en service', render: (row) => String((row as Record<string, unknown>).provisioning_status || '—') },
          { key: 'access_label', label: 'Lecture opérateur', render: (row) => String((row as Record<string, unknown>).access_label || '—') },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
