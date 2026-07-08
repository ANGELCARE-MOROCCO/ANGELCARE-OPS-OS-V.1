import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360ExportsHub from '@/components/angelcare360/exports/Angelcare360ExportsHub'
import Angelcare360ExportsPageShell from '@/components/angelcare360/exports/Angelcare360ExportsPageShell'
import { ANGELCARE360_EXPORTS_NAVIGATION } from '@/data/angelcare360/exports-navigation'
import { getAngelcare360ExportOverview } from '@/lib/angelcare360/server/reports'
import { getAngelcare360ExportsContext } from './_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ExportsPage() {
  const context = await getAngelcare360ExportsContext()
  const overview = await getAngelcare360ExportOverview({ schoolId: context.school.id })
  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Vue exports indisponible"
        description="Aucune donnée d’export n’a pu être résolue pour alimenter le cockpit."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const contextRow = (
    <>
      <Badge label={`Établissement: ${overview.schoolName}`} />
      <Badge label={`Année: ${overview.activeAcademicYearLabel || 'Non résolue'}`} />
      <Badge label={`Fichiers: ${overview.exportFileCount}`} />
      <Badge label={`Blocages: ${overview.blockedExportAttemptCount}`} />
    </>
  )

  return (
    <Angelcare360ExportsPageShell
      title="Exports"
      subtitle="Le cockpit export conserve l’état de préparation PDF A4, CSV/XLSX et l’historique des fichiers réels."
      badge="Disponible"
      statusLabel={overview.risks.length > 0 ? `${overview.risks.length} risque(s)` : 'Socle export prêt'}
      contextRow={contextRow}
      navigationItems={ANGELCARE360_EXPORTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/exports/files" style={primaryLinkStyle}>Voir les fichiers</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/exports/audit" style={secondaryLinkStyle}>Audit exports</Link>}
    >
      <Angelcare360ExportsHub overview={overview} />
    </Angelcare360ExportsPageShell>
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
  background: '#fef3c7',
  color: '#b45309',
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
