import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360ExportHistoryWorkspace from '@/components/angelcare360/exports/Angelcare360ExportHistoryWorkspace'
import Angelcare360ExportsPageShell from '@/components/angelcare360/exports/Angelcare360ExportsPageShell'
import { ANGELCARE360_EXPORTS_NAVIGATION } from '@/data/angelcare360/exports-navigation'
import { getAngelcare360ExportsContext } from '../_utils'
import { getAngelcare360ExportOverview, listAngelcare360ExportHistory } from '@/lib/angelcare360/server/reports'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ExportHistoryPage() {
  const context = await getAngelcare360ExportsContext()
  const [overview, history] = await Promise.all([
    getAngelcare360ExportOverview({ schoolId: context.school.id }),
    listAngelcare360ExportHistory({ schoolId: context.school.id }),
  ])

  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Historique des exports indisponible"
        description="Aucun historique réel n’a pu être résolu."
        actionLabel="Retour aux exports"
        actionHref="/angelcare-360-command-center/exports"
      />
    )
  }

  return (
    <Angelcare360ExportsPageShell
      title="Historique des exports"
      subtitle="Historique réel des fichiers et sorties reliées au moteur de reporting."
      badge="Exports"
      statusLabel={`${history.length} entrée(s)`}
      navigationItems={ANGELCARE360_EXPORTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/exports/files" style={primaryLinkStyle}>Fichiers</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/exports/audit" style={secondaryLinkStyle}>Audit</Link>}
    >
      <Angelcare360ExportHistoryWorkspace history={history} />
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
