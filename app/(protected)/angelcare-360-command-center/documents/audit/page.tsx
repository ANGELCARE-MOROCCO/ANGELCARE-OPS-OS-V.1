import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360DocumentAuditDrawer from '@/components/angelcare360/documents/Angelcare360DocumentAuditDrawer'
import Angelcare360DocumentsPageShell from '@/components/angelcare360/documents/Angelcare360DocumentsPageShell'
import { ANGELCARE360_DOCUMENTS_NAVIGATION } from '@/data/angelcare360/documents-navigation'
import { getAngelcare360DocumentsContext } from '../_utils'
import { getAngelcare360DocumentsOverview, listAngelcare360DocumentAuditEvents } from '@/lib/angelcare360/server/reports'

export const dynamic = 'force-dynamic'

export default async function Angelcare360DocumentAuditPage() {
  const context = await getAngelcare360DocumentsContext()
  const [overview, events] = await Promise.all([
    getAngelcare360DocumentsOverview({ schoolId: context.school.id }),
    listAngelcare360DocumentAuditEvents({ schoolId: context.school.id, filters: {} }),
  ])

  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Audit documents indisponible"
        description="Aucun événement d’audit documentaire n’a pu être résolu."
        actionLabel="Retour aux documents"
        actionHref="/angelcare-360-command-center/documents"
      />
    )
  }

  return (
    <Angelcare360DocumentsPageShell
      title="Audit documents"
      subtitle="Journal des templates, readiness et gouvernance documentaire."
      badge="Audit"
      statusLabel={`${events.length} événement(s)`}
      navigationItems={ANGELCARE360_DOCUMENTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/documents" style={primaryLinkStyle}>Vue documents</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/documents/generated" style={secondaryLinkStyle}>Générés</Link>}
    >
      <Angelcare360DocumentAuditDrawer events={events} />
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
