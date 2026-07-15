import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360ReportsHub from '@/components/angelcare360/reports/Angelcare360ReportsHub'
import Angelcare360ReportsPageShell from '@/components/angelcare360/reports/Angelcare360ReportsPageShell'
import { ANGELCARE360_REPORTS_NAVIGATION } from '@/data/angelcare360/reports-navigation'
import { getAngelcare360ReportsOverview } from '@/lib/angelcare360/server/reports'
import { getAngelcare360ReportsContext } from './_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ReportsPage() {
  const context = await getAngelcare360ReportsContext()
  const overview = await getAngelcare360ReportsOverview({ schoolId: context.school.id })
  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Vue rapports indisponible"
        description="Aucune donnée de reporting active n’a pu être résolue pour alimenter le cockpit."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const contextRow = (
    <>
      <Badge label={`Établissement: ${overview.schoolName}`} />
      <Badge label={`Année: ${overview.activeAcademicYearLabel || 'Non résolue'}`} />
      <Badge label={`Catalogue: ${overview.reportCount}`} />
      <Badge label={`Demandes: ${overview.requestCount}`} />
    </>
  )

  return (
    <Angelcare360ReportsPageShell
      title="Rapports, Exports & Documents"
      subtitle="Le cockpit de reporting consolide les catalogues, modèles, demandes, exports verrouillés et gouvernance documentaire."
      badge="Disponible"
      statusLabel={overview.risks.length > 0 ? `${overview.risks.length} risque(s)` : 'Socle reporting prêt'}
      contextRow={contextRow}
      navigationItems={ANGELCARE360_REPORTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/rapports/catalogue" style={primaryLinkStyle}>Voir le catalogue</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/rapports/audit" style={secondaryLinkStyle}>Audit rapports</Link>}
    >
      <Angelcare360ReportsHub overview={overview} />
    </Angelcare360ReportsPageShell>
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
  background: '#eff6ff',
  color: '#1d4ed8',
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
