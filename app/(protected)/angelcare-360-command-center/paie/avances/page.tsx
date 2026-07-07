import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PayrollPageShell from '@/components/angelcare360/payroll/Angelcare360PayrollPageShell'
import Angelcare360PayrollItemsWorkspace from '@/components/angelcare360/payroll/Angelcare360PayrollItemsWorkspace'
import { ANGELCARE360_PAYROLL_NAVIGATION } from '@/data/angelcare360/payroll-navigation'
import { getAngelcare360PayrollOverview, listAngelcare360PayrollAdvances } from '@/lib/angelcare360/server/payroll'
import { getAngelcare360PayrollContext, payrollBadgeStyle, payrollSecondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360PayrollAdvancesPage() {
  const context = await getAngelcare360PayrollContext()
  const [overview, items] = await Promise.all([
    getAngelcare360PayrollOverview({ schoolId: context.school.id }),
    listAngelcare360PayrollAdvances({ schoolId: context.school.id }),
  ])

  if (!overview) {
    return <Angelcare360EmptyState title="Avances indisponibles" description="Le cockpit paie n’a pas pu résoudre le contexte actif." />
  }

  return (
    <Angelcare360PayrollPageShell
      title="Avances"
      subtitle="Vue ciblée sur les avances de paie suivies côté serveur."
      badge="Phase 9"
      statusLabel={`${items.length} avance(s)`}
      navigationItems={ANGELCARE360_PAYROLL_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/paie/elements" style={payrollSecondaryLinkStyle}>Voir tous les éléments</Link>}
      contextRow={<Badge label={`Total avances: ${overview.advanceTotal}`} />}
    >
      {items.length === 0 ? (
        <Angelcare360EmptyState title="Aucune avance" description="Aucune avance n’est rattachée au périmètre actif." />
      ) : (
        <Angelcare360PayrollItemsWorkspace items={items} title="Avances" description="Avances de paie suivies sans exécution bancaire." />
      )}
    </Angelcare360PayrollPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={payrollBadgeStyle}>{label}</span>
}
