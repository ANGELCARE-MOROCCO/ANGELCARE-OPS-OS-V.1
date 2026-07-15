import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PayrollPageShell from '@/components/angelcare360/payroll/Angelcare360PayrollPageShell'
import Angelcare360PayrollAuditDrawer from '@/components/angelcare360/payroll/Angelcare360PayrollAuditDrawer'
import { ANGELCARE360_PAYROLL_NAVIGATION } from '@/data/angelcare360/payroll-navigation'
import { getAngelcare360PayrollOverview, listAngelcare360PayrollAuditEvents } from '@/lib/angelcare360/server/payroll'
import { getAngelcare360PayrollContext, payrollBadgeStyle, payrollSecondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Angelcare360PayrollAuditPage({ searchParams }: PageProps) {
  const context = await getAngelcare360PayrollContext()
  const resolvedSearchParams = (await searchParams) || {}
  const [overview, events] = await Promise.all([
    getAngelcare360PayrollOverview({ schoolId: context.school.id }),
    listAngelcare360PayrollAuditEvents({
      schoolId: context.school.id,
      module: typeof resolvedSearchParams.module === 'string' ? resolvedSearchParams.module : null,
      action: typeof resolvedSearchParams.action === 'string' ? resolvedSearchParams.action : null,
      entityType: typeof resolvedSearchParams.entityType === 'string' ? resolvedSearchParams.entityType : null,
      entityId: typeof resolvedSearchParams.entityId === 'string' ? resolvedSearchParams.entityId : null,
      severity: typeof resolvedSearchParams.severity === 'string' ? resolvedSearchParams.severity : null,
      actorUserId: typeof resolvedSearchParams.actorUserId === 'string' ? resolvedSearchParams.actorUserId : null,
      search: typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : null,
      from: typeof resolvedSearchParams.from === 'string' ? resolvedSearchParams.from : null,
      to: typeof resolvedSearchParams.to === 'string' ? resolvedSearchParams.to : null,
    }),
  ])

  if (!overview) {
    return <Angelcare360EmptyState title="Audit paie indisponible" description="Le cockpit paie n’a pas pu résoudre le contexte actif." />
  }

  return (
    <Angelcare360PayrollPageShell
      title="Audit paie"
      subtitle="Journal des opérations sensibles et des blocages paie."
      badge="Disponible"
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
        <Angelcare360EmptyState title="Aucun événement" description="Les opérations paie apparaîtront ici dès qu’elles seront exécutées." />
      ) : (
        <Angelcare360PayrollAuditDrawer events={events} />
      )}
    </Angelcare360PayrollPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={payrollBadgeStyle}>{label}</span>
}
