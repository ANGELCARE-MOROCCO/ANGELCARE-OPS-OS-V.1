import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import Angelcare360TransportPickupListWorkspace from '@/components/angelcare360/transport/Angelcare360TransportPickupListWorkspace'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { listAngelcare360TransportPickupList } from '@/lib/angelcare360/server/transport'
import { getAngelcare360TransportContext } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportPickupPage() {
  const context = await getAngelcare360TransportContext()
  const pickups = await listAngelcare360TransportPickupList({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null })

  return (
    <Angelcare360TransportPageShell
      title="Ramassage"
      subtitle="Liste de ramassage dérivée des affectations transport actives."
      badge="Phase 10"
      statusLabel={`${pickups.length} ligne(s)`}
      navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/transport" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      {pickups.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucun ramassage"
          description="Aucune affectation active ne permet de construire une liste de ramassage."
        />
      ) : (
        <Angelcare360TransportPickupListWorkspace pickups={pickups} />
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

