import GrowthSovereignTakeoff from '@/components/angelcare360/operator/growth-sovereign/GrowthSovereignTakeoff'
import { normalizeGrowthMode } from '@/components/angelcare360/operator/growth/GrowthContract'
import { loadGrowthWorkspaceSnapshot } from '@/lib/angelcare360/operator/growth'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorGrowthPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>
}) {
  const params = await searchParams
  const raw = Array.isArray(params.view) ? params.view[0] : params.view
  const [snapshot] = await Promise.all([loadGrowthWorkspaceSnapshot()])
  return <GrowthSovereignTakeoff snapshot={snapshot} initialMode={normalizeGrowthMode(raw)} />
}
