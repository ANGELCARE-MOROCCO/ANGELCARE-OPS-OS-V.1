import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360ReportRequestsWorkspace from '@/components/angelcare360/reports/Angelcare360ReportRequestsWorkspace'
import Angelcare360ReportsPageShell from '@/components/angelcare360/reports/Angelcare360ReportsPageShell'
import { ANGELCARE360_REPORTS_NAVIGATION } from '@/data/angelcare360/reports-navigation'
import { getAngelcare360ReportsContext } from '../_utils'
import { getAngelcare360ReportsOverview, listAngelcare360ReportCatalogue, listAngelcare360ReportRequests, listAngelcare360ReportTemplates } from '@/lib/angelcare360/server/reports'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ReportRequestsPage() {
  const context = await getAngelcare360ReportsContext()
  const [overview, reports, templates, requests] = await Promise.all([
    getAngelcare360ReportsOverview({ schoolId: context.school.id }),
    listAngelcare360ReportCatalogue({ schoolId: context.school.id }),
    listAngelcare360ReportTemplates({ schoolId: context.school.id }),
    listAngelcare360ReportRequests({ schoolId: context.school.id }),
  ])

  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Demandes de rapport indisponibles"
        description="Aucune source de demande n’a pu être résolue."
        actionLabel="Retour aux rapports"
        actionHref="/angelcare-360-command-center/rapports"
      />
    )
  }

  return (
    <Angelcare360ReportsPageShell
      title="Demandes de rapports"
      subtitle="Les demandes sont persistées côté serveur et restent verrouillées tant que l’infrastructure de sortie n’est pas disponible."
      badge="Rapports"
      statusLabel={`${requests.length} demande(s)`}
      navigationItems={ANGELCARE360_REPORTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/rapports/modeles" style={primaryLinkStyle}>Gérer les modèles</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/rapports/historique" style={secondaryLinkStyle}>Historique</Link>}
    >
      <Angelcare360ReportRequestsWorkspace schoolId={context.school.id} reports={reports} templates={templates} requests={requests} />
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
