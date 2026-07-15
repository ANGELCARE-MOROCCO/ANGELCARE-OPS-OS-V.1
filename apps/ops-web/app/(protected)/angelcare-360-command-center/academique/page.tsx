import Link from 'next/link'
import { redirect } from 'next/navigation'
import Angelcare360AcademicHub from '@/components/angelcare360/academics/Angelcare360AcademicHub'
import Angelcare360AcademicPageShell from '@/components/angelcare360/academics/Angelcare360AcademicPageShell'
import { ANGELCARE360_ACADEMICS_NAVIGATION } from '@/data/angelcare360/academics-navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360AcademicOverview } from '@/lib/angelcare360/server/academics'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AcademiquePage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const overview = await getAngelcare360AcademicOverview({ schoolId: context.school.id })
  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Vue académique indisponible"
        description="Aucun établissement actif n’a pu être résolu pour alimenter le cockpit académique."
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
      <Badge label={`Notes: ${overview.markCount}`} />
    </>
  )

  return (
    <Angelcare360AcademicPageShell
      title="Académique & Évaluations"
      subtitle="Le cockpit académique exécute les cours, devoirs, examens, notes, moyennes, bulletins et appréciations avec traçabilité serveur."
      badge="Disponible"
      statusLabel={overview.risks.length > 0 ? `${overview.risks.length} risque(s)` : 'Socle académique prêt'}
      contextRow={contextRow}
      navigationItems={ANGELCARE360_ACADEMICS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/academique/cours" style={primaryLinkStyle}>Voir les cours</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/academique/audit" style={secondaryLinkStyle}>Audit académique</Link>}
    >
      <Angelcare360AcademicHub
        overview={overview}
        canCreateLessons={true}
        canCreateAssignments={true}
        canCreateExams={true}
        canOpenBulletins={true}
      />
    </Angelcare360AcademicPageShell>
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
  color: '#1e40af',
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
