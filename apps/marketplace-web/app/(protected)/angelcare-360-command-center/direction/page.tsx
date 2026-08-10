import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360DirectionCommand from '@/components/angelcare360/direction/Angelcare360DirectionCommand'
import { getDirectionCommandSnapshot } from '@/lib/angelcare360/server/direction-command'
import type { DirectionPlaneKey } from '@/types/angelcare360/direction-command'

export const dynamic = 'force-dynamic'

export default async function Angelcare360DirectionPage({
  searchParams,
}: {
  searchParams?: Promise<{ plane?: string; matter?: string }>
}) {
  try {
    const params: { plane?: string; matter?: string } =
      (await searchParams) ?? {}

    const snapshot = await getDirectionCommandSnapshot()
    return (
      <Angelcare360DirectionCommand
        initialSnapshot={snapshot}
        initialPlane={(params.plane || 'today') as DirectionPlaneKey}
        initialMatterId={params.matter || null}
      />
    )
  } catch (error) {
    return (
      <Angelcare360EmptyState
        title="Direction Executive Command indisponible"
        description={error instanceof Error ? error.message : 'Le contexte exécutif ne peut pas être chargé.'}
        actionLabel="Retour au command center"
        actionHref="/angelcare-360-command-center"
      />
    )
  }
}
