import Link from 'next/link'
import Angelcare360FinanceDataTable from '@/components/angelcare360/finance/Angelcare360FinanceDataTable'
import Angelcare360FinancePageShell from '@/components/angelcare360/finance/Angelcare360FinancePageShell'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { ANGELCARE360_FINANCE_NAVIGATION } from '@/data/angelcare360/finance-navigation'
import { getAngelcare360FinanceContext } from '../_utils'
import { listAngelcare360StudentFeeAssignments } from '@/lib/angelcare360/server/finance'

export const dynamic = 'force-dynamic'

export default async function Angelcare360FinanceAssignmentsPage() {
  const context = await getAngelcare360FinanceContext()
  const assignments = await listAngelcare360StudentFeeAssignments({ schoolId: context.school!.id })

  return (
    <Angelcare360FinancePageShell
      title="Affectations frais"
      subtitle="Affectation des structures tarifaires aux élèves, classes et sections."
      badge="Phase 8"
      statusLabel={`${assignments.length} affectation(s)`}
      navigationItems={ANGELCARE360_FINANCE_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/finance" style={linkStyle}>Retour au cockpit</Link>}
    >
      {assignments.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucune affectation de frais"
          description="Les affectations seront créées par le moteur finance serveur selon la structure de frais active."
          actionLabel="Voir les structures"
          actionHref="/angelcare-360-command-center/finance/frais"
        />
      ) : (
        <Angelcare360FinanceDataTable
          title="Affectations actives"
          description="Les affectations sont persistées côté base et auditées."
          rows={assignments}
          emptyTitle="Aucune affectation"
          emptyDescription="Aucune donnée n’est disponible pour le moment."
          columns={[
            { key: 'student', label: 'Élève', render: (row) => `${row.student_full_name || '—'} (${row.student_code || '—'})` },
            { key: 'structure', label: 'Structure', render: (row) => row.fee_structure_label || row.fee_structure_code || '—' },
            { key: 'class', label: 'Classe', render: (row) => row.class_name || '—' },
            { key: 'section', label: 'Section', render: (row) => row.section_name || '—' },
            { key: 'assigned_on', label: 'Affectée le', render: (row) => row.assigned_on },
            { key: 'status', label: 'Statut', render: (row) => row.status },
          ]}
        />
      )}
    </Angelcare360FinancePageShell>
  )
}

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

