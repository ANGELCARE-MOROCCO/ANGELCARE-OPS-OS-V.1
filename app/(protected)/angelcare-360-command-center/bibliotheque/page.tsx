import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360LibraryHub from '@/components/angelcare360/library/Angelcare360LibraryHub'
import Angelcare360LibraryPageShell from '@/components/angelcare360/library/Angelcare360LibraryPageShell'
import { ANGELCARE360_LIBRARY_NAVIGATION } from '@/data/angelcare360/library-navigation'
import { getAngelcare360LibraryOverview } from '@/lib/angelcare360/server/library'
import { getAngelcare360LibraryContext, libraryBadgeStyle, libraryPrimaryLinkStyle, librarySecondaryLinkStyle } from './_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360BibliothequePage() {
  const context = await getAngelcare360LibraryContext()
  const overview = await getAngelcare360LibraryOverview({ schoolId: context.school.id })
  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Vue bibliothèque indisponible"
        description="Aucune donnée active n’a pu être résolue pour alimenter le cockpit bibliothèque."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const contextRow = (
    <>
      <Badge label={`Établissement: ${overview.schoolName}`} />
      <Badge label={`Année: ${overview.activeAcademicYearLabel || 'Non résolue'}`} />
      <Badge label={`Livres: ${overview.bookCount}`} />
      <Badge label={`Prêts: ${overview.loanCount}`} />
    </>
  )

  return (
    <Angelcare360LibraryPageShell
      title="Bibliothèque & Inventaire"
      subtitle="Le cockpit bibliothèque suit les livres, exemplaires, prêts, retours et disponibilités sans export simulé ni code-barres fictif."
      badge="Phase 11"
      statusLabel={overview.risks.length > 0 ? `${overview.risks.length} risque(s)` : 'Socle bibliothèque prêt'}
      contextRow={contextRow}
      navigationItems={ANGELCARE360_LIBRARY_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/bibliotheque/livres" style={libraryPrimaryLinkStyle}>Voir les livres</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/bibliotheque/audit" style={librarySecondaryLinkStyle}>Audit bibliothèque</Link>}
    >
      <Angelcare360LibraryHub overview={overview} />
    </Angelcare360LibraryPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={libraryBadgeStyle}>{label}</span>
}
