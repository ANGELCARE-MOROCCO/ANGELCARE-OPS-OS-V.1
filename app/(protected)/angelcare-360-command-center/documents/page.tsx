import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360DocumentsHub from '@/components/angelcare360/documents/Angelcare360DocumentsHub'
import Angelcare360DocumentsPageShell from '@/components/angelcare360/documents/Angelcare360DocumentsPageShell'
import { ANGELCARE360_DOCUMENTS_NAVIGATION } from '@/data/angelcare360/documents-navigation'
import { getAngelcare360DocumentsOverview } from '@/lib/angelcare360/server/reports'
import { getAngelcare360DocumentsContext } from './_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360DocumentsPage() {
  const context = await getAngelcare360DocumentsContext()
  const overview = await getAngelcare360DocumentsOverview({ schoolId: context.school.id })
  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Vue documents indisponible"
        description="Aucune donnée documentaire active n’a pu être résolue."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const contextRow = (
    <>
      <Badge label={`Établissement: ${overview.schoolName}`} />
      <Badge label={`Année: ${overview.activeAcademicYearLabel || 'Non résolue'}`} />
      <Badge label={`Documents: ${overview.generatedDocumentCount}`} />
      <Badge label={`Templates: ${overview.templateCount}`} />
    </>
  )

  return (
    <Angelcare360DocumentsPageShell
      title="Documents"
      subtitle="Le cockpit documentaire regroupe les documents générés, les templates et la gouvernance de stockage."
      badge="Disponible"
      statusLabel={overview.risks.length > 0 ? `${overview.risks.length} risque(s)` : 'Socle documentaire prêt'}
      contextRow={contextRow}
      navigationItems={ANGELCARE360_DOCUMENTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/documents/generated" style={primaryLinkStyle}>Documents générés</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/documents/audit" style={secondaryLinkStyle}>Audit documents</Link>}
    >
      <Angelcare360DocumentsHub overview={overview} />
    </Angelcare360DocumentsPageShell>
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
  background: '#ecfccb',
  color: '#4d7c0f',
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
