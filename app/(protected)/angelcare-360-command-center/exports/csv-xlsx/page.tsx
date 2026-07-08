import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360CsvXlsxReadinessWorkspace from '@/components/angelcare360/exports/Angelcare360CsvXlsxReadinessWorkspace'
import Angelcare360ExportsPageShell from '@/components/angelcare360/exports/Angelcare360ExportsPageShell'
import { ANGELCARE360_EXPORTS_NAVIGATION } from '@/data/angelcare360/exports-navigation'
import { getAngelcare360ExportsContext } from '../_utils'
import { getAngelcare360CsvXlsxReadiness } from '@/lib/angelcare360/server/reports'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ExportCsvXlsxPage() {
  const context = await getAngelcare360ExportsContext()
  const readiness = await getAngelcare360CsvXlsxReadiness({ schoolId: context.school.id })
  if (!readiness) {
    return (
      <Angelcare360EmptyState
        title="CSV / XLSX indisponibles"
        description="Aucune readiness CSV/XLSX n’a pu être résolue."
        actionLabel="Retour aux exports"
        actionHref="/angelcare-360-command-center/exports"
      />
    )
  }

  return (
    <Angelcare360ExportsPageShell
      title="CSV / XLSX"
      subtitle="Les exports tabulaires restent verrouillés tant qu’un moteur de sortie réel n’est pas disponible."
      badge="Exports"
      statusLabel={readiness.ready ? 'Prêt' : 'Verrouillé'}
      navigationItems={ANGELCARE360_EXPORTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/exports/files" style={primaryLinkStyle}>Fichiers</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/exports/audit" style={secondaryLinkStyle}>Audit</Link>}
    >
      <Angelcare360CsvXlsxReadinessWorkspace readiness={readiness} />
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
