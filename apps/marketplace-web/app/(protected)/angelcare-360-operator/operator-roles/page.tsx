import { notFound } from 'next/navigation'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import type { Angelcare360OperatorRole } from '@/types/angelcare360/operator'

export const dynamic = 'force-dynamic'

const ROLE_MATRIX: Array<{ role: Angelcare360OperatorRole; label: string; access: string }> = [
  { role: 'super_admin', label: 'Super admin', access: 'Accès complet opérateur' },
  { role: 'operator_admin', label: 'Administrateur opérateur', access: 'Gestion large des opérations' },
  { role: 'account_manager', label: 'Responsable compte', access: 'Suivi commercial et client' },
  { role: 'finance_operator', label: 'Opérateur finance', access: 'Facturation et encaissements' },
  { role: 'support_operator', label: 'Opérateur support', access: 'Tickets et assistance' },
  { role: 'implementation_manager', label: 'Responsable implémentation', access: 'Onboarding et service' },
  { role: 'read_only', label: 'Lecture seule', access: 'Consultation sans mutation' },
]

export default async function Angelcare360OperatorRolesPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  return (
    <Angelcare360OperatorPageShell
      badge="Rôles opérateur"
      statusLabel="Gouvernance interne"
      title="Rôles opérateur"
      subtitle="Matrice des rôles internes AngelCare et de leur périmètre de lecture ou de mutation."
    >
      <Angelcare360OperatorDataTable
        title="Matrice des rôles"
        rows={ROLE_MATRIX}
        emptyTitle="Aucun rôle"
        emptyDescription="La matrice opérateur sera affichée ici."
        rowKey={(row) => row.role}
        columns={[
          { key: 'role', label: 'Rôle', render: (row) => String((row as { role: string }).role) },
          { key: 'label', label: 'Libellé', render: (row) => String((row as { label: string }).label) },
          { key: 'access', label: 'Accès', render: (row) => String((row as { access: string }).access) },
          { key: 'status', label: 'Statut', render: () => <Angelcare360OperatorStatusBadge status="enabled" /> },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
