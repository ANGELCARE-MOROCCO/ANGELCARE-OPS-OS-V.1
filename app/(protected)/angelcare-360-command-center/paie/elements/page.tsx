import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PayrollPageShell from '@/components/angelcare360/payroll/Angelcare360PayrollPageShell'
import Angelcare360PayrollItemsWorkspace from '@/components/angelcare360/payroll/Angelcare360PayrollItemsWorkspace'
import { ANGELCARE360_PAYROLL_NAVIGATION } from '@/data/angelcare360/payroll-navigation'
import { listAngelcare360PayrollItems, getAngelcare360PayrollOverview } from '@/lib/angelcare360/server/payroll'
import { getAngelcare360PayrollContext, payrollBadgeStyle, payrollSecondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360PayrollElementsPage() {
  const context = await getAngelcare360PayrollContext()
  const [overview, items] = await Promise.all([
    getAngelcare360PayrollOverview({ schoolId: context.school.id }),
    listAngelcare360PayrollItems({ schoolId: context.school.id }),
  ])

  if (!overview) {
    return <Angelcare360EmptyState title="Éléments de paie indisponibles" description="Le cockpit paie n’a pas pu résoudre le contexte actif." />
  }

  return (
    <Angelcare360PayrollPageShell
      title="Éléments de paie"
      subtitle="Base salaire, primes, retenues, avances, ajustements et remboursements."
      badge="Phase 9"
      statusLabel={`${items.length} élément(s)`}
      navigationItems={ANGELCARE360_PAYROLL_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/paie" style={payrollSecondaryLinkStyle}>Retour au cockpit</Link>}
      contextRow={
        <>
          <Badge label={`Brut: ${overview.grossTotal}`} />
          <Badge label={`Net: ${overview.netTotal}`} />
          <Badge label={`Retenues: ${overview.deductionTotal}`} />
        </>
      }
    >
      {items.length === 0 ? (
        <Angelcare360EmptyState title="Aucun élément" description="Ajoutez un élément de paie pour faire évoluer le calcul du dossier." />
      ) : (
        <Angelcare360PayrollItemsWorkspace items={items} />
      )}
    </Angelcare360PayrollPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={payrollBadgeStyle}>{label}</span>
}
