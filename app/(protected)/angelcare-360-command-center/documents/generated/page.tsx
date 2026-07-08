import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360GeneratedDocumentsWorkspace from '@/components/angelcare360/documents/Angelcare360GeneratedDocumentsWorkspace'
import Angelcare360DocumentsPageShell from '@/components/angelcare360/documents/Angelcare360DocumentsPageShell'
import { ANGELCARE360_DOCUMENTS_NAVIGATION } from '@/data/angelcare360/documents-navigation'
import { getAngelcare360DocumentsContext } from '../_utils'
import { getAngelcare360DocumentsOverview, listAngelcare360GeneratedDocuments } from '@/lib/angelcare360/server/reports'

export const dynamic = 'force-dynamic'

export default async function Angelcare360GeneratedDocumentsPage() {
  const context = await getAngelcare360DocumentsContext()
  const [overview, documents] = await Promise.all([
    getAngelcare360DocumentsOverview({ schoolId: context.school.id }),
    listAngelcare360GeneratedDocuments({ schoolId: context.school.id }),
  ])

  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Documents générés indisponibles"
        description="Aucun document généré réel n’a pu être résolu."
        actionLabel="Retour aux documents"
        actionHref="/angelcare-360-command-center/documents"
      />
    )
  }

  return (
    <Angelcare360DocumentsPageShell
      title="Documents générés"
      subtitle="Les documents listés ici proviennent de fichiers réellement persistés."
      badge="Documents"
      statusLabel={`${documents.length} document(s)`}
      navigationItems={ANGELCARE360_DOCUMENTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/documents/templates" style={primaryLinkStyle}>Templates</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/documents/governance" style={secondaryLinkStyle}>Gouvernance</Link>}
    >
      <Angelcare360GeneratedDocumentsWorkspace documents={documents} />
    </Angelcare360DocumentsPageShell>
  )
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
