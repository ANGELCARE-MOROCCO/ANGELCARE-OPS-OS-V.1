import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PayrollPageShell from '@/components/angelcare360/payroll/Angelcare360PayrollPageShell'
import Angelcare360PayrollPaymentsWorkspace from '@/components/angelcare360/payroll/Angelcare360PayrollPaymentsWorkspace'
import { ANGELCARE360_PAYROLL_NAVIGATION } from '@/data/angelcare360/payroll-navigation'
import { getAngelcare360PayrollOverview, listAngelcare360PayrollRecords } from '@/lib/angelcare360/server/payroll'
import { getAngelcare360PayrollContext, payrollBadgeStyle, payrollSecondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360PayrollPaymentsPage() {
  const context = await getAngelcare360PayrollContext()
  const [overview, records] = await Promise.all([
    getAngelcare360PayrollOverview({ schoolId: context.school.id }),
    listAngelcare360PayrollRecords({ schoolId: context.school.id }),
  ])

  if (!overview) {
    return <Angelcare360EmptyState title="Paiements paie indisponibles" description="Le cockpit paie n’a pas pu résoudre le contexte actif." />
  }

  return (
    <Angelcare360PayrollPageShell
      title="Paiements"
      subtitle="Suivi des confirmations de paiement internes, sans virement bancaire exécuté."
      badge="Disponible"
      statusLabel={`${overview.paidCount} payé(s)`}
      navigationItems={ANGELCARE360_PAYROLL_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/paie/dossiers" style={payrollSecondaryLinkStyle}>Voir les dossiers</Link>}
      contextRow={
        <>
          <Badge label={`Payés: ${overview.paidCount}`} />
          <Badge label={`Bloqués: ${overview.blockedCount}`} />
          <Badge label={`Brut: ${overview.grossTotal}`} />
        </>
      }
    >
      {records.length === 0 ? (
        <Angelcare360EmptyState title="Aucun paiement" description="Aucun dossier n’a encore atteint le statut de paiement confirmé." />
      ) : (
        <Angelcare360PayrollPaymentsWorkspace records={records} />
      )}
    </Angelcare360PayrollPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={payrollBadgeStyle}>{label}</span>
}
