import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360ExportFilesWorkspace from '@/components/angelcare360/exports/Angelcare360ExportFilesWorkspace'
import Angelcare360ExportsPageShell from '@/components/angelcare360/exports/Angelcare360ExportsPageShell'
import { ANGELCARE360_EXPORTS_NAVIGATION } from '@/data/angelcare360/exports-navigation'
import { getAngelcare360ExportsContext } from '../_utils'
import { getAngelcare360ExportOverview, listAngelcare360ExportFiles } from '@/lib/angelcare360/server/reports'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ExportFilesPage() {
  const context = await getAngelcare360ExportsContext()
  const [overview, files] = await Promise.all([
    getAngelcare360ExportOverview({ schoolId: context.school.id }),
    listAngelcare360ExportFiles({ schoolId: context.school.id }),
  ])

  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Fichiers d’export indisponibles"
        description="Aucun fichier réel n’a pu être résolu."
        actionLabel="Retour aux exports"
        actionHref="/angelcare-360-command-center/exports"
      />
    )
  }

  return (
    <Angelcare360ExportsPageShell
      title="Fichiers d’export"
      subtitle="Fichiers réellement persistés. Aucun téléchargement fictif n’est exposé."
      badge="Exports"
      statusLabel={`${files.length} fichier(s)`}
      navigationItems={ANGELCARE360_EXPORTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/exports/pdf-a4" style={primaryLinkStyle}>PDF A4</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/exports/csv-xlsx" style={secondaryLinkStyle}>CSV / XLSX</Link>}
    >
      <Angelcare360ExportFilesWorkspace files={files} />
    </Angelcare360ExportsPageShell>
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
