import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360PdfA4ReadinessWorkspace from '@/components/angelcare360/exports/Angelcare360PdfA4ReadinessWorkspace'
import Angelcare360ExportsPageShell from '@/components/angelcare360/exports/Angelcare360ExportsPageShell'
import { ANGELCARE360_EXPORTS_NAVIGATION } from '@/data/angelcare360/exports-navigation'
import { getAngelcare360ExportsContext } from '../_utils'
import { getAngelcare360PdfA4Readiness } from '@/lib/angelcare360/server/reports'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ExportPdfA4Page() {
  const context = await getAngelcare360ExportsContext()
  const readiness = await getAngelcare360PdfA4Readiness({ schoolId: context.school.id })
  if (!readiness) {
    return (
      <Angelcare360EmptyState
        title="PDF A4 indisponible"
        description="Aucune readiness PDF n’a pu être résolue."
        actionLabel="Retour aux exports"
        actionHref="/angelcare-360-command-center/exports"
      />
    )
  }

  return (
    <Angelcare360ExportsPageShell
      title="PDF A4"
      subtitle="La génération PDF A4 reste verrouillée tant qu’un moteur d’export réel n’est pas configuré."
      badge="Exports"
      statusLabel={readiness.ready ? 'Prêt' : 'Verrouillé'}
      navigationItems={ANGELCARE360_EXPORTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/exports/files" style={primaryLinkStyle}>Fichiers</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/exports/audit" style={secondaryLinkStyle}>Audit</Link>}
    >
      <Angelcare360PdfA4ReadinessWorkspace readiness={readiness} />
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
