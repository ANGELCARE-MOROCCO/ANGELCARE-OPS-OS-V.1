import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PayrollPageShell from '@/components/angelcare360/payroll/Angelcare360PayrollPageShell'
import Angelcare360PayrollComplianceWorkspace from '@/components/angelcare360/payroll/Angelcare360PayrollComplianceWorkspace'
import { ANGELCARE360_PAYROLL_NAVIGATION } from '@/data/angelcare360/payroll-navigation'
import { getAngelcare360PayrollComplianceReadiness, getAngelcare360PayrollOverview } from '@/lib/angelcare360/server/payroll'
import { getAngelcare360PayrollContext, payrollBadgeStyle, payrollSecondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360PayrollCompliancePage() {
  const context = await getAngelcare360PayrollContext()
  const [overview, compliance] = await Promise.all([
    getAngelcare360PayrollOverview({ schoolId: context.school.id }),
    getAngelcare360PayrollComplianceReadiness({ schoolId: context.school.id }),
  ])

  if (!overview || !compliance) {
    return <Angelcare360EmptyState title="Conformité paie indisponible" description="Le cockpit paie n’a pas pu résoudre le contexte actif." />
  }

  return (
    <Angelcare360PayrollPageShell
      title="Conformité"
      subtitle="Verrouillage des règles sociales, fiscales, CNSS, export et virement bancaire."
      badge="Phase 9"
      statusLabel={compliance.overallStatus}
      navigationItems={ANGELCARE360_PAYROLL_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/paie" style={payrollSecondaryLinkStyle}>Retour au cockpit</Link>}
      contextRow={
        <>
          <Badge label={`Période: ${overview.activePayrollPeriodLabel || 'Non résolue'}`} />
          <Badge label={`Blocages: ${compliance.checkpoints.length}`} />
        </>
      }
    >
      <Angelcare360PayrollComplianceWorkspace compliance={compliance} />
    </Angelcare360PayrollPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={payrollBadgeStyle}>{label}</span>
}
