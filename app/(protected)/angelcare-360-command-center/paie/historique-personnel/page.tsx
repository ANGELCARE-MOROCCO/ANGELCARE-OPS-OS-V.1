import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PayrollPageShell from '@/components/angelcare360/payroll/Angelcare360PayrollPageShell'
import Angelcare360StaffPayrollHistoryWorkspace from '@/components/angelcare360/payroll/Angelcare360StaffPayrollHistoryWorkspace'
import { ANGELCARE360_PAYROLL_NAVIGATION } from '@/data/angelcare360/payroll-navigation'
import { getAngelcare360PayrollOverview, listAngelcare360StaffPayrollHistory } from '@/lib/angelcare360/server/payroll'
import { getAngelcare360PayrollContext, payrollBadgeStyle, payrollSecondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360StaffPayrollHistoryPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const context = await getAngelcare360PayrollContext()
  const [overview, records] = await Promise.all([
    getAngelcare360PayrollOverview({ schoolId: context.school.id }),
    listAngelcare360StaffPayrollHistory({
      schoolId: context.school.id,
      staffId: typeof searchParams?.staffId === 'string' ? searchParams.staffId : null,
      payrollPeriodId: typeof searchParams?.payrollPeriodId === 'string' ? searchParams.payrollPeriodId : null,
      status: typeof searchParams?.status === 'string' ? searchParams.status : null,
      search: typeof searchParams?.search === 'string' ? searchParams.search : null,
      from: typeof searchParams?.from === 'string' ? searchParams.from : null,
      to: typeof searchParams?.to === 'string' ? searchParams.to : null,
    }),
  ])

  if (!overview) {
    return <Angelcare360EmptyState title="Historique paie indisponible" description="Le cockpit paie n’a pas pu résoudre le contexte actif." />
  }

  return (
    <Angelcare360PayrollPageShell
      title="Historique personnel"
      subtitle="Vue chronologique des dossiers de paie du personnel."
      badge="Phase 9"
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
