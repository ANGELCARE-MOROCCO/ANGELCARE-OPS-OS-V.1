import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PayrollPageShell from '@/components/angelcare360/payroll/Angelcare360PayrollPageShell'
import Angelcare360PayrollRecordsWorkspace from '@/components/angelcare360/payroll/Angelcare360PayrollRecordsWorkspace'
import { ANGELCARE360_PAYROLL_NAVIGATION } from '@/data/angelcare360/payroll-navigation'
import { getAngelcare360PayrollOverview, listAngelcare360PayrollRecords } from '@/lib/angelcare360/server/payroll'
import { getAngelcare360PayrollContext, payrollBadgeStyle, payrollSecondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360PayrollRecordsPage() {
  const context = await getAngelcare360PayrollContext()
  const [overview, records] = await Promise.all([
    getAngelcare360PayrollOverview({ schoolId: context.school.id }),
    listAngelcare360PayrollRecords({ schoolId: context.school.id }),
  ])

  if (!overview) {
    return <Angelcare360EmptyState title="Dossiers de paie indisponibles" description="Le cockpit paie n’a pas pu résoudre le contexte actif." />
  }

  return (
    <Angelcare360PayrollPageShell
      title="Dossiers de paie"
      subtitle="Préparation, validation et confirmation des dossiers de rémunération."
      badge="Phase 9"
      statusLabel={records.length > 0 ? `${records.length} dossier(s)` : 'Aucun dossier'}
      navigationItems={ANGELCARE360_PAYROLL_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/paie" style={payrollSecondaryLinkStyle}>Retour au cockpit</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/paie/validation" style={payrollSecondaryLinkStyle}>Validation</Link>}
      contextRow={
        <>
          <Badge label={`Année: ${overview.activeAcademicYearLabel || 'Non résolue'}`} />
          <Badge label={`Période: ${overview.activePayrollPeriodLabel || 'Non résolue'}`} />
          <Badge label={`Validation: ${overview.pendingReviewCount} en attente`} />
        </>
      }
    >
      {records.length === 0 ? (
        <Angelcare360EmptyState title="Aucun dossier" description="Préparez un dossier lorsque le personnel et la période sont prêts." />
      ) : (
        <Angelcare360PayrollRecordsWorkspace records={records} />
      )}
    </Angelcare360PayrollPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={payrollBadgeStyle}>{label}</span>
}
