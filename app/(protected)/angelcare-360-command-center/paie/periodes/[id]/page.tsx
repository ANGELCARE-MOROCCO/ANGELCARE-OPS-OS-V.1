import Link from 'next/link'
import { notFound } from 'next/navigation'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PayrollPageShell from '@/components/angelcare360/payroll/Angelcare360PayrollPageShell'
import Angelcare360PayrollPeriodDetail from '@/components/angelcare360/payroll/Angelcare360PayrollPeriodDetail'
import { ANGELCARE360_PAYROLL_NAVIGATION } from '@/data/angelcare360/payroll-navigation'
import { getAngelcare360PayrollPeriodById } from '@/lib/angelcare360/server/payroll'
import { getAngelcare360PayrollContext, payrollBadgeStyle, payrollSecondaryLinkStyle } from '../../_utils'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360PayrollPeriodDetailPage({ params }: PageProps) {
  const context = await getAngelcare360PayrollContext()
  const { id } = await params
  const period = await getAngelcare360PayrollPeriodById(id)
  if (!period) notFound()

  return (
    <Angelcare360PayrollPageShell
      title={period.label}
      subtitle="Détail d’une période de paie, des dossiers rattachés et des contrôles de verrouillage."
      badge="Période"
      statusLabel={period.status}
      navigationItems={ANGELCARE360_PAYROLL_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/paie/periodes" style={payrollSecondaryLinkStyle}>Retour</Link>}
      contextRow={
        <>
          <Badge label={context.school.name} />
          <Badge label={period.period_code} />
          <Badge label={`${period.payroll_record_count || 0} dossier(s)`} />
        </>
      }
    >
      <Angelcare360PayrollPeriodDetail period={period} />
      {period.blocked_reason ? (
        <Angelcare360EmptyState title="Motif de blocage" description={period.blocked_reason} />
      ) : null}
    </Angelcare360PayrollPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={payrollBadgeStyle}>{label}</span>
}
