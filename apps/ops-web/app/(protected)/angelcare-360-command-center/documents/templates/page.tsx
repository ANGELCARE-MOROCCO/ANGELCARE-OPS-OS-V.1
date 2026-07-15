import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360DocumentTemplatesWorkspace from '@/components/angelcare360/documents/Angelcare360DocumentTemplatesWorkspace'
import Angelcare360DocumentsPageShell from '@/components/angelcare360/documents/Angelcare360DocumentsPageShell'
import { ANGELCARE360_DOCUMENTS_NAVIGATION } from '@/data/angelcare360/documents-navigation'
import { getAngelcare360DocumentsContext } from '../_utils'
import { getAngelcare360DocumentsOverview, listAngelcare360DocumentTemplates } from '@/lib/angelcare360/server/reports'

export const dynamic = 'force-dynamic'

export default async function Angelcare360DocumentTemplatesPage() {
  const context = await getAngelcare360DocumentsContext()
  const [overview, templates] = await Promise.all([
    getAngelcare360DocumentsOverview({ schoolId: context.school.id }),
    listAngelcare360DocumentTemplates({ schoolId: context.school.id }),
  ])

  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Templates documentaires indisponibles"
        description="Aucun template documentaire réel n’a pu être résolu."
        actionLabel="Retour aux documents"
        actionHref="/angelcare-360-command-center/documents"
      />
    )
  }

  return (
    <Angelcare360DocumentsPageShell
      title="Templates documentaires"
      subtitle="Templates stockés côté serveur pour les documents générés et gouvernés."
      badge="Documents"
      statusLabel={`${templates.length} template(s)`}
      navigationItems={ANGELCARE360_DOCUMENTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/documents/generated" style={primaryLinkStyle}>Générés</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/documents/governance" style={secondaryLinkStyle}>Gouvernance</Link>}
    >
      <Angelcare360DocumentTemplatesWorkspace schoolId={context.school.id} templates={templates} />
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
