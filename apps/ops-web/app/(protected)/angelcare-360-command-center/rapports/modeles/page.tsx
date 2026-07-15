import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360ReportTemplatesWorkspace from '@/components/angelcare360/reports/Angelcare360ReportTemplatesWorkspace'
import Angelcare360ReportsPageShell from '@/components/angelcare360/reports/Angelcare360ReportsPageShell'
import { ANGELCARE360_REPORTS_NAVIGATION } from '@/data/angelcare360/reports-navigation'
import { getAngelcare360ReportsContext } from '../_utils'
import { getAngelcare360ReportsOverview, listAngelcare360ReportCatalogue, listAngelcare360ReportTemplates } from '@/lib/angelcare360/server/reports'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ReportTemplatesPage() {
  const context = await getAngelcare360ReportsContext()
  const [overview, reports, templates] = await Promise.all([
    getAngelcare360ReportsOverview({ schoolId: context.school.id }),
    listAngelcare360ReportCatalogue({ schoolId: context.school.id }),
    listAngelcare360ReportTemplates({ schoolId: context.school.id }),
  ])

  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Modèles de rapport indisponibles"
        description="Le socle de modèles n’a pas pu être résolu."
        actionLabel="Retour aux rapports"
        actionHref="/angelcare-360-command-center/rapports"
      />
    )
  }

  return (
    <Angelcare360ReportsPageShell
      title="Modèles de rapports"
      subtitle="Les modèles sont stockés côté serveur et restent validés avant toute génération."
      badge="Rapports"
      statusLabel={`${templates.length} modèle(s)`}
      navigationItems={ANGELCARE360_REPORTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/rapports/catalogue" style={primaryLinkStyle}>Retour au catalogue</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/rapports/demandes" style={secondaryLinkStyle}>Demandes</Link>}
    >
      <Angelcare360ReportTemplatesWorkspace schoolId={context.school.id} reports={reports} templates={templates} />
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
