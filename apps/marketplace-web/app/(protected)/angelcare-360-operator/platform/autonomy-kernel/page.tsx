import { notFound } from 'next/navigation'
import AutonomyKernelCommandCenter from '@/components/angelcare360/operator/autonomy-kernel/AutonomyKernelCommandCenter'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { getAutonomyKernelSnapshot } from '@/lib/angelcare360/operator/autonomy-kernel'
import type { AutonomyKernelScene } from '@/types/angelcare360/operator/autonomy-kernel'

export const dynamic = 'force-dynamic'

const scenes: AutonomyKernelScene[] = ['command', 'metadata', 'workflows', 'policies', 'entitlements', 'metering', 'extensions', 'reliability']

export default async function AutonomyKernelPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()
  const params = searchParams ? await searchParams : {}
  const raw = Array.isArray(params.view) ? params.view[0] : params.view
  const activeScene = scenes.includes((raw || '') as AutonomyKernelScene) ? raw as AutonomyKernelScene : 'command'
  const snapshot = await getAutonomyKernelSnapshot()
  return <AutonomyKernelCommandCenter initialSnapshot={snapshot} activeScene={activeScene} />
}
