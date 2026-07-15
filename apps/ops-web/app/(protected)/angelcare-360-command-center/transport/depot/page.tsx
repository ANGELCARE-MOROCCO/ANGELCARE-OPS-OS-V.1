import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360TransportDropoffListWorkspace from '@/components/angelcare360/transport/Angelcare360TransportDropoffListWorkspace'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { listAngelcare360TransportDropoffList } from '@/lib/angelcare360/server/transport'
import { getAngelcare360TransportContext } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportDropoffPage() {
  const context = await getAngelcare360TransportContext()
  const dropoffs = await listAngelcare360TransportDropoffList({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null })

  return (
    <Angelcare360TransportPageShell
      title="Dépôt"
      subtitle="Liste de dépôt dérivée des affectations transport actives."
      badge="Disponible"
      statusLabel={`${dropoffs.length} ligne(s)`}
      navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/transport" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      {dropoffs.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucun dépôt"
          description="Aucune affectation active ne permet de construire une liste de dépôt."
        />
      ) : (
        <Angelcare360TransportDropoffListWorkspace dropoffs={dropoffs} />
      )}
    </Angelcare360TransportPageShell>
  )
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

