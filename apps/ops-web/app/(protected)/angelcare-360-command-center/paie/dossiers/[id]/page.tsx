import Link from 'next/link'
import { notFound } from 'next/navigation'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PayrollPageShell from '@/components/angelcare360/payroll/Angelcare360PayrollPageShell'
import Angelcare360PayrollRecordDetail from '@/components/angelcare360/payroll/Angelcare360PayrollRecordDetail'
import { ANGELCARE360_PAYROLL_NAVIGATION } from '@/data/angelcare360/payroll-navigation'
import { getAngelcare360PayrollRecordById } from '@/lib/angelcare360/server/payroll'
import { getAngelcare360PayrollContext, payrollBadgeStyle, payrollSecondaryLinkStyle } from '../../_utils'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360PayrollRecordDetailPage({ params }: PageProps) {
  const context = await getAngelcare360PayrollContext()
  const { id } = await params
  const record = await getAngelcare360PayrollRecordById(id)
  if (!record) notFound()

  return (
    <Angelcare360PayrollPageShell
      title={record.payroll_number}
      subtitle="Détail du dossier de paie, des éléments et des statuts de paiement."
      badge="Dossier"
      statusLabel={record.status}
      navigationItems={ANGELCARE360_PAYROLL_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/paie/dossiers" style={payrollSecondaryLinkStyle}>Retour</Link>}
      contextRow={
        <>
          <Badge label={context.school.name} />
          <Badge label={record.staff_full_name || record.staff_code || 'Personnel'} />
          <Badge label={record.period_label || 'Période non résolue'} />
        </>
      }
    >
      <Angelcare360PayrollRecordDetail record={record} />
      {record.blocked_reason ? (
        <Angelcare360EmptyState title="Motif de blocage" description={record.blocked_reason} />
      ) : null}
    </Angelcare360PayrollPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={payrollBadgeStyle}>{label}</span>
}
