import { notFound } from 'next/navigation'
import ExecutiveCommandCabinet from '@/components/angelcare360/operator/executive-command/ExecutiveCommandCabinet'
import { getExecutiveCommandSnapshot } from '@/lib/angelcare360/operator/executive-command'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import type { ExecutiveSceneKey } from '@/types/angelcare360/operator/executive-command'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

const SCENES: ExecutiveSceneKey[] = ['command', 'decisions', 'agenda', 'performance', 'growth', 'risk', 'transformation', 'board']

export default async function ExecutiveCommandPage({ searchParams }: { searchParams?: SearchParams }) {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const params = searchParams ? await searchParams : {}
  const requested = one(params.view) as ExecutiveSceneKey | undefined
  const initialScene = requested && SCENES.includes(requested) ? requested : 'command'
  const snapshot = await getExecutiveCommandSnapshot()

  return (
    <ExecutiveCommandCabinet
      initialSnapshot={snapshot}
      initialScene={initialScene}
      operatorName={session.user.full_name || session.user.name || session.user.email || 'Direction AngelCare'}
    />
  )
}
