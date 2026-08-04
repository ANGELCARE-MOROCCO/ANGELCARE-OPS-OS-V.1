import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360GovernanceCommand from '@/components/angelcare360/governance/Angelcare360GovernanceCommand'
import { getGovernanceCommandSnapshot } from '@/lib/angelcare360/server/governance-command'
import type { GovernanceEntityType, GovernancePlaneKey } from '@/types/angelcare360/governance-command'

export const dynamic = 'force-dynamic'

export default async function Angelcare360GovernancePage({
  searchParams,
}: {
  searchParams?: Promise<{ plane?: string; entity?: string; type?: string; drawer?: string; focus?: string }>
}) {
  try {
    const emptyParams: { plane?: string; entity?: string; type?: string; drawer?: string; focus?: string } = {}
    const [snapshot, params] = await Promise.all([getGovernanceCommandSnapshot(), searchParams || Promise.resolve(emptyParams)])
    return (
      <Angelcare360GovernanceCommand
        initialSnapshot={snapshot}
        initialPlane={(params.plane || 'institutions') as GovernancePlaneKey}
        initialEntityId={params.entity || null}
        initialEntityType={(params.type || null) as GovernanceEntityType | null}
        initialDrawer={params.drawer || null}
        initialFocus={params.focus || null}
      />
    )
  } catch (error) {
    return (
      <Angelcare360EmptyState
        title="Gouvernance institutionnelle indisponible"
        description={error instanceof Error ? error.message : 'Le commandement institutionnel ne peut pas être chargé.'}
        actionLabel="Retour au command center"
        actionHref="/angelcare-360-command-center"
      />
    )
  }
}
