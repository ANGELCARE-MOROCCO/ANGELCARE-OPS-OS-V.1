import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360ReportHistoryWorkspace from '@/components/angelcare360/reports/Angelcare360ReportHistoryWorkspace'
import Angelcare360ReportsPageShell from '@/components/angelcare360/reports/Angelcare360ReportsPageShell'
import { ANGELCARE360_REPORTS_NAVIGATION } from '@/data/angelcare360/reports-navigation'
import { getAngelcare360ReportsContext } from '../_utils'
import { getAngelcare360ReportsOverview, listAngelcare360ReportHistory } from '@/lib/angelcare360/server/reports'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ReportHistoryPage() {
  const context = await getAngelcare360ReportsContext()
  const [overview, history] = await Promise.all([
    getAngelcare360ReportsOverview({ schoolId: context.school.id }),
    listAngelcare360ReportHistory({ schoolId: context.school.id }),
  ])

  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Historique des rapports indisponible"
        description="Aucun historique réel n’a pu être résolu."
        actionLabel="Retour aux rapports"
        actionHref="/angelcare-360-command-center/rapports"
      />
    )
  }

  return (
    <Angelcare360ReportsPageShell
      title="Historique des rapports"
      subtitle="Historique réel des demandes et des exports liés, sans faux fichier ni faux état terminé."
      badge="Rapports"
      statusLabel={`${history.length} entrée(s)`}
      navigationItems={ANGELCARE360_REPORTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/rapports/demandes" style={primaryLinkStyle}>Demandes</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/rapports/audit" style={secondaryLinkStyle}>Audit</Link>}
    >
      <Angelcare360ReportHistoryWorkspace history={history} />
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
