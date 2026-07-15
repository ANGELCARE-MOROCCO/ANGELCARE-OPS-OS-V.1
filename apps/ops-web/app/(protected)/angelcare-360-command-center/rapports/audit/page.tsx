import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360ReportAuditDrawer from '@/components/angelcare360/reports/Angelcare360ReportAuditDrawer'
import Angelcare360ReportsPageShell from '@/components/angelcare360/reports/Angelcare360ReportsPageShell'
import { ANGELCARE360_REPORTS_NAVIGATION } from '@/data/angelcare360/reports-navigation'
import { getAngelcare360ReportsContext } from '../_utils'
import { getAngelcare360ReportsOverview, listAngelcare360ReportAuditEvents } from '@/lib/angelcare360/server/reports'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ReportAuditPage() {
  const context = await getAngelcare360ReportsContext()
  const [overview, events] = await Promise.all([
    getAngelcare360ReportsOverview({ schoolId: context.school.id }),
    listAngelcare360ReportAuditEvents({ schoolId: context.school.id, filters: {} }),
  ])

  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Audit rapports indisponible"
        description="Aucun événement d’audit réel n’a pu être résolu."
        actionLabel="Retour aux rapports"
        actionHref="/angelcare-360-command-center/rapports"
      />
    )
  }

  return (
    <Angelcare360ReportsPageShell
      title="Audit rapports"
      subtitle="Journal des opérations, blocages et demandes liées au reporting."
      badge="Audit"
      statusLabel={`${events.length} événement(s)`}
      navigationItems={ANGELCARE360_REPORTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/rapports" style={primaryLinkStyle}>Vue rapports</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/rapports/historique" style={secondaryLinkStyle}>Historique</Link>}
    >
      <Angelcare360ReportAuditDrawer events={events} />
    </Angelcare360ReportsPageShell>
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
