import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PayrollHub from '@/components/angelcare360/payroll/Angelcare360PayrollHub'
import Angelcare360PayrollPageShell from '@/components/angelcare360/payroll/Angelcare360PayrollPageShell'
import { ANGELCARE360_PAYROLL_NAVIGATION } from '@/data/angelcare360/payroll-navigation'
import { getAngelcare360PayrollOverview } from '@/lib/angelcare360/server/payroll'
import { getAngelcare360PayrollContext, payrollBadgeStyle, payrollPrimaryLinkStyle, payrollSecondaryLinkStyle } from './_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360PayrollPage() {
  const context = await getAngelcare360PayrollContext()
  const overview = await getAngelcare360PayrollOverview({ schoolId: context.school.id })
  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Vue paie indisponible"
        description="Aucune donnée de paie active n’a pu être résolue pour alimenter le cockpit."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const contextRow = (
    <>
      <Badge label={`Établissement: ${overview.schoolName}`} />
      <Badge label={`Année: ${overview.activeAcademicYearLabel || 'Non résolue'}`} />
      <Badge label={`Période: ${overview.activePayrollPeriodLabel || 'Non résolue'}`} />
      <Badge label={`Dossiers: ${overview.payrollRecordCount}`} />
    </>
  )

  return (
    <Angelcare360PayrollPageShell
      title="Paie & Rémunérations"
      subtitle="Le cockpit paie prépare les périodes, les dossiers et les validations internes sans prétendre exécuter la conformité légale ni le virement bancaire."
      badge="Phase 9"
      statusLabel={overview.risks.length > 0 ? `${overview.risks.length} risque(s)` : 'Socle paie prêt'}
      contextRow={contextRow}
      navigationItems={ANGELCARE360_PAYROLL_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/paie/periodes" style={payrollPrimaryLinkStyle}>Voir les périodes</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/paie/audit" style={payrollSecondaryLinkStyle}>Audit paie</Link>}
    >
      <Angelcare360PayrollHub overview={overview} />
    </Angelcare360PayrollPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={payrollBadgeStyle}>{label}</span>
}
