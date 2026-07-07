import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PayrollPageShell from '@/components/angelcare360/payroll/Angelcare360PayrollPageShell'
import Angelcare360PayrollValidationWorkspace from '@/components/angelcare360/payroll/Angelcare360PayrollValidationWorkspace'
import { ANGELCARE360_PAYROLL_NAVIGATION } from '@/data/angelcare360/payroll-navigation'
import { calculateAngelcare360PayrollReadiness, getAngelcare360PayrollOverview, listAngelcare360PayrollRecords } from '@/lib/angelcare360/server/payroll'
import { getAngelcare360PayrollContext, payrollBadgeStyle, payrollSecondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360PayrollValidationPage() {
  const context = await getAngelcare360PayrollContext()
  const overview = await getAngelcare360PayrollOverview({ schoolId: context.school.id })
  const [records, readiness] = await Promise.all([
    listAngelcare360PayrollRecords({ schoolId: context.school.id }),
    calculateAngelcare360PayrollReadiness({ schoolId: context.school.id, payrollPeriodId: overview?.activePayrollPeriodId || null, staffId: null }),
  ])

  if (!overview) {
    return <Angelcare360EmptyState title="Validation paie indisponible" description="Le cockpit paie n’a pas pu résoudre le contexte actif." />
  }

  return (
    <Angelcare360PayrollPageShell
      title="Validation"
      subtitle="Préparation, blocage et validation des dossiers de paie."
      badge="Phase 9"
      statusLabel={readiness.canCalculate ? 'Calcul exploitable' : 'Calcul verrouillé'}
      navigationItems={ANGELCARE360_PAYROLL_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/paie/dossiers" style={payrollSecondaryLinkStyle}>Voir les dossiers</Link>}
      contextRow={
        <>
          <Badge label={`En attente: ${overview.pendingReviewCount}`} />
          <Badge label={`Validés: ${overview.validatedCount}`} />
          <Badge label={`Bloqués: ${overview.blockedCount}`} />
        </>
      }
    >
      <Angelcare360PayrollValidationWorkspace readiness={readiness} records={records} />
    </Angelcare360PayrollPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={payrollBadgeStyle}>{label}</span>
}
