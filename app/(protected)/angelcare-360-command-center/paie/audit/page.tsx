import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PayrollPageShell from '@/components/angelcare360/payroll/Angelcare360PayrollPageShell'
import Angelcare360PayrollAuditDrawer from '@/components/angelcare360/payroll/Angelcare360PayrollAuditDrawer'
import { ANGELCARE360_PAYROLL_NAVIGATION } from '@/data/angelcare360/payroll-navigation'
import { getAngelcare360PayrollOverview, listAngelcare360PayrollAuditEvents } from '@/lib/angelcare360/server/payroll'
import { getAngelcare360PayrollContext, payrollBadgeStyle, payrollSecondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360PayrollAuditPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const context = await getAngelcare360PayrollContext()
  const [overview, events] = await Promise.all([
    getAngelcare360PayrollOverview({ schoolId: context.school.id }),
    listAngelcare360PayrollAuditEvents({
      schoolId: context.school.id,
      module: typeof searchParams?.module === 'string' ? searchParams.module : null,
      action: typeof searchParams?.action === 'string' ? searchParams.action : null,
      entityType: typeof searchParams?.entityType === 'string' ? searchParams.entityType : null,
      entityId: typeof searchParams?.entityId === 'string' ? searchParams.entityId : null,
      severity: typeof searchParams?.severity === 'string' ? searchParams.severity : null,
      actorUserId: typeof searchParams?.actorUserId === 'string' ? searchParams.actorUserId : null,
      search: typeof searchParams?.search === 'string' ? searchParams.search : null,
      from: typeof searchParams?.from === 'string' ? searchParams.from : null,
      to: typeof searchParams?.to === 'string' ? searchParams.to : null,
    }),
  ])

  if (!overview) {
    return <Angelcare360EmptyState title="Audit paie indisponible" description="Le cockpit paie n’a pas pu résoudre le contexte actif." />
  }

  return (
    <Angelcare360PayrollPageShell
      title="Audit paie"
      subtitle="Journal des mutations sensibles et des blocages paie."
      badge="Phase 9"
      statusLabel={`${events.length} événement(s)`}
      navigationItems={ANGELCARE360_PAYROLL_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/paie" style={payrollSecondaryLinkStyle}>Retour au cockpit</Link>}
      contextRow={
        <>
          <Badge label={`Dossiers: ${overview.payrollRecordCount}`} />
          <Badge label={`Paiements: ${overview.paidCount}`} />
          <Badge label={`Blocages: ${overview.blockedCount}`} />
        </>
      }
    >
      {events.length === 0 ? (
        <Angelcare360EmptyState title="Aucun événement" description="Les mutations paie apparaîtront ici dès qu’elles seront exécutées." />
      ) : (
        <Angelcare360PayrollAuditDrawer events={events} />
      )}
    </Angelcare360PayrollPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={payrollBadgeStyle}>{label}</span>
}
