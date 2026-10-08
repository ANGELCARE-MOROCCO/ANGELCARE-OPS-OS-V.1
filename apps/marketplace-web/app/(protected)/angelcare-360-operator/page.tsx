import { notFound } from 'next/navigation'
import SovereignPulseDashboard from '@/components/angelcare360/operator/sovereign-pulse/SovereignPulseDashboard'
import { getSovereignPulseSnapshot } from '@/lib/angelcare360/operator/sovereign-pulse'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import type { SovereignPulseMode, SovereignPulsePrivacy, SovereignPulseSceneKey } from '@/types/angelcare360/operator/sovereign-pulse'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function Angelcare360OperatorPage({ searchParams }: { searchParams?: SearchParams }) {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const params = searchParams ? await searchParams : {}
  const mode: SovereignPulseMode = one(params.mode) === 'wall' ? 'wall' : 'desk'
  const scene = one(params.scene) as SovereignPulseSceneKey | undefined
  const privacy = one(params.privacy) as SovereignPulsePrivacy | undefined
  const snapshot = await getSovereignPulseSnapshot()

  return (
    <SovereignPulseDashboard
      initialSnapshot={snapshot}
      initialMode={mode}
      initialScene={scene}
      initialPrivacy={privacy}
      operatorName={session.user.full_name || session.user.name || session.user.email || 'Équipe AngelCare'}
    />
  )
}
