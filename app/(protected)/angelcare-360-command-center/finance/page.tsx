import Link from 'next/link'
import Angelcare360FinanceHub from '@/components/angelcare360/finance/Angelcare360FinanceHub'
import Angelcare360FinancePageShell from '@/components/angelcare360/finance/Angelcare360FinancePageShell'
import { ANGELCARE360_FINANCE_NAVIGATION } from '@/data/angelcare360/finance-navigation'
import { getAngelcare360FinanceOverview } from '@/lib/angelcare360/server/finance'
import { getAngelcare360FinanceContext } from './_utils'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360FinancePage() {
  const context = await getAngelcare360FinanceContext()
  const overview = await getAngelcare360FinanceOverview({ schoolId: context.school!.id })
  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Vue finance indisponible"
        description="Aucune donnée financière active n’a pu être résolue pour alimenter le cockpit."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const contextRow = (
    <>
      <Badge label={`Établissement: ${overview.schoolName}`} />
      <Badge label={`Année: ${overview.activeAcademicYearLabel || 'Non résolue'}`} />
      <Badge label={`Période: ${overview.activeTermLabel || 'Non résolue'}`} />
      <Badge label={`Solde dû: ${overview.totalOutstanding}`} />
    </>
  )

  return (
    <Angelcare360FinancePageShell
      title="Finance & Paiements"
      subtitle="Le cockpit finance suit les frais scolaires, les factures, les paiements, les reçus, les remises et les relances avec contrôle serveur."
      badge="Phase 8"
      statusLabel={overview.risks.length > 0 ? `${overview.risks.length} risque(s)` : 'Socle finance prêt'}
      contextRow={contextRow}
      navigationItems={ANGELCARE360_FINANCE_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/finance/factures" style={primaryLinkStyle}>Voir les factures</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/finance/audit" style={secondaryLinkStyle}>Audit finance</Link>}
    >
      <Angelcare360FinanceHub overview={overview} />
    </Angelcare360FinancePageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={badgeStyle}>{label}</span>
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#f0fdf4',
  color: '#166534',
  fontSize: 12,
  fontWeight: 900,
}

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #0f172a',
  background: '#0f172a',
  color: '#fff',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 800,
}

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 800,
}
