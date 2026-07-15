import { notFound } from 'next/navigation'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorAuditLogs } from '@/lib/angelcare360/operator/audit'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorAuditPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const auditLogs = await listOperatorAuditLogs()

  return (
    <Angelcare360OperatorPageShell
      badge="Audit interne"
      statusLabel={`${auditLogs.length} entrée(s)`}
      title="Audit opérateur"
      subtitle="Journal interne des actions opérateur et des modifications sensibles."
    >
      <Angelcare360OperatorDataTable
        title="Journal d’audit"
        rows={auditLogs}
        emptyTitle="Aucune entrée d’audit"
        emptyDescription="Les actions opérateur apparaîtront ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'module', label: 'Module', render: (row) => String((row as Record<string, unknown>).module || '—') },
          { key: 'action', label: 'Action', render: (row) => String((row as Record<string, unknown>).action || '—') },
          { key: 'entity_type', label: 'Entité', render: (row) => String((row as Record<string, unknown>).entity_type || '—') },
          { key: 'severity', label: 'Sévérité', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).severity || '—')} /> },
          { key: 'created_at', label: 'Horodatage', render: (row) => String((row as Record<string, unknown>).created_at || '—') },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
