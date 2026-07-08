import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360ExportAuditDrawer from '@/components/angelcare360/exports/Angelcare360ExportAuditDrawer'
import Angelcare360ExportsPageShell from '@/components/angelcare360/exports/Angelcare360ExportsPageShell'
import { ANGELCARE360_EXPORTS_NAVIGATION } from '@/data/angelcare360/exports-navigation'
import { getAngelcare360ExportsContext } from '../_utils'
import { getAngelcare360ExportOverview, listAngelcare360ExportAuditEvents } from '@/lib/angelcare360/server/reports'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ExportAuditPage() {
  const context = await getAngelcare360ExportsContext()
  const [overview, events] = await Promise.all([
    getAngelcare360ExportOverview({ schoolId: context.school.id }),
    listAngelcare360ExportAuditEvents({ schoolId: context.school.id, filters: {} }),
  ])

  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Audit exports indisponible"
        description="Aucun événement d’audit réel n’a pu être résolu."
        actionLabel="Retour aux exports"
        actionHref="/angelcare-360-command-center/exports"
      />
    )
  }

  return (
    <Angelcare360ExportsPageShell
      title="Audit exports"
      subtitle="Journal des blocages, fichiers et readiness de sortie."
      badge="Audit"
      statusLabel={`${events.length} événement(s)`}
      navigationItems={ANGELCARE360_EXPORTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/exports" style={primaryLinkStyle}>Vue exports</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/exports/historique" style={secondaryLinkStyle}>Historique</Link>}
    >
      <Angelcare360ExportAuditDrawer events={events} />
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
