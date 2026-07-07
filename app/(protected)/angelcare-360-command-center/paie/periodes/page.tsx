import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PayrollPageShell from '@/components/angelcare360/payroll/Angelcare360PayrollPageShell'
import Angelcare360PayrollPeriodsWorkspace from '@/components/angelcare360/payroll/Angelcare360PayrollPeriodsWorkspace'
import { ANGELCARE360_PAYROLL_NAVIGATION } from '@/data/angelcare360/payroll-navigation'
import { getAngelcare360PayrollOverview, listAngelcare360PayrollPeriods } from '@/lib/angelcare360/server/payroll'
import { getAngelcare360PayrollContext, payrollBadgeStyle, payrollSecondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360PayrollPeriodsPage() {
  const context = await getAngelcare360PayrollContext()
  const [overview, periods] = await Promise.all([
    getAngelcare360PayrollOverview({ schoolId: context.school.id }),
    listAngelcare360PayrollPeriods({ schoolId: context.school.id }),
  ])

  if (!overview) {
    return <Angelcare360EmptyState title="Périodes de paie indisponibles" description="Le cockpit paie n’a pas pu résoudre le contexte actif." />
  }

  const contextRow = (
    <>
      <Badge label={`Année: ${overview.activeAcademicYearLabel || 'Non résolue'}`} />
      <Badge label={`Période active: ${overview.activePayrollPeriodLabel || 'Non résolue'}`} />
      <Badge label={`Périodes: ${periods.length}`} />
    </>
  )

  return (
    <Angelcare360PayrollPageShell
      title="Périodes de paie"
      subtitle="Gestion des périodes préparées, ouvertes, calculées, validées et clôturées."
      badge="Phase 9"
      statusLabel={overview.openPeriodCount > 0 ? 'Période ouverte' : 'Aucune période ouverte'}
      contextRow={contextRow}
      navigationItems={ANGELCARE360_PAYROLL_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/paie" style={payrollSecondaryLinkStyle}>Retour au cockpit</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/paie/audit" style={payrollSecondaryLinkStyle}>Audit paie</Link>}
    >
      {periods.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucune période"
          description="Créez une période de paie lorsque le calendrier de rémunération est prêt."
        />
      ) : (
        <Angelcare360PayrollPeriodsWorkspace periods={periods} />
      )}
    </Angelcare360PayrollPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={payrollBadgeStyle}>{label}</span>
}
