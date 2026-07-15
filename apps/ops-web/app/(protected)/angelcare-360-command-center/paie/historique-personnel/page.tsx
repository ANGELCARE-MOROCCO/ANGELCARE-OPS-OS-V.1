import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PayrollPageShell from '@/components/angelcare360/payroll/Angelcare360PayrollPageShell'
import Angelcare360StaffPayrollHistoryWorkspace from '@/components/angelcare360/payroll/Angelcare360StaffPayrollHistoryWorkspace'
import { ANGELCARE360_PAYROLL_NAVIGATION } from '@/data/angelcare360/payroll-navigation'
import { getAngelcare360PayrollOverview, listAngelcare360StaffPayrollHistory } from '@/lib/angelcare360/server/payroll'
import { getAngelcare360PayrollContext, payrollBadgeStyle, payrollSecondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Angelcare360StaffPayrollHistoryPage({ searchParams }: PageProps) {
  const context = await getAngelcare360PayrollContext()
  const resolvedSearchParams = (await searchParams) || {}
  const [overview, records] = await Promise.all([
    getAngelcare360PayrollOverview({ schoolId: context.school.id }),
    listAngelcare360StaffPayrollHistory({
      schoolId: context.school.id,
      staffId: typeof resolvedSearchParams.staffId === 'string' ? resolvedSearchParams.staffId : null,
      payrollPeriodId: typeof resolvedSearchParams.payrollPeriodId === 'string' ? resolvedSearchParams.payrollPeriodId : null,
      status: typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : null,
      search: typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : null,
      from: typeof resolvedSearchParams.from === 'string' ? resolvedSearchParams.from : null,
      to: typeof resolvedSearchParams.to === 'string' ? resolvedSearchParams.to : null,
    }),
  ])

  if (!overview) {
    return <Angelcare360EmptyState title="Historique paie indisponible" description="Le cockpit paie n’a pas pu résoudre le contexte actif." />
  }

  return (
    <Angelcare360PayrollPageShell
      title="Historique personnel"
      subtitle="Vue chronologique des dossiers de paie du personnel."
      badge="Disponible"
      statusLabel={`${records.length} dossier(s)`}
      navigationItems={ANGELCARE360_PAYROLL_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/paie/dossiers" style={payrollSecondaryLinkStyle}>Voir les dossiers</Link>}
      contextRow={
        <>
          <Badge label={`Personnel: ${overview.staffCount}`} />
          <Badge label={`Enseignants: ${overview.teacherCount}`} />
          <Badge label={`Période: ${overview.activePayrollPeriodLabel || 'Non résolue'}`} />
        </>
      }
    >
      {records.length === 0 ? (
        <Angelcare360EmptyState title="Aucun historique" description="Aucun dossier n’a encore été enregistré pour ce membre du personnel." />
      ) : (
        <Angelcare360StaffPayrollHistoryWorkspace records={records} />
      )}
    </Angelcare360PayrollPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={payrollBadgeStyle}>{label}</span>
}
