import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360DocumentGovernanceWorkspace from '@/components/angelcare360/documents/Angelcare360DocumentGovernanceWorkspace'
import Angelcare360DocumentsPageShell from '@/components/angelcare360/documents/Angelcare360DocumentsPageShell'
import { ANGELCARE360_DOCUMENTS_NAVIGATION } from '@/data/angelcare360/documents-navigation'
import { getAngelcare360DocumentsContext } from '../_utils'
import { getAngelcare360DocumentGovernanceReadiness } from '@/lib/angelcare360/server/reports'

export const dynamic = 'force-dynamic'

export default async function Angelcare360DocumentGovernancePage() {
  const context = await getAngelcare360DocumentsContext()
  const readiness = await getAngelcare360DocumentGovernanceReadiness({ schoolId: context.school.id })

  if (!readiness) {
    return (
      <Angelcare360EmptyState
        title="Gouvernance documentaire indisponible"
        description="Aucune préparation documentaire n’a pu être résolue."
        actionLabel="Retour aux documents"
        actionHref="/angelcare-360-command-center/documents"
      />
    )
  }

  return (
    <Angelcare360DocumentsPageShell
      title="Gouvernance documentaire"
      subtitle="Règles de stockage, rétention et diffusion pour les A4 navigateur, les documents générés et les sorties CSV réelles."
      badge="Documents"
      statusLabel={readiness.templateReady ? 'Prêt' : 'Verrouillé'}
      navigationItems={ANGELCARE360_DOCUMENTS_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/documents/templates" style={primaryLinkStyle}>Templates</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/documents/audit" style={secondaryLinkStyle}>Audit</Link>}
    >
      <Angelcare360DocumentGovernanceWorkspace readiness={readiness} />
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
