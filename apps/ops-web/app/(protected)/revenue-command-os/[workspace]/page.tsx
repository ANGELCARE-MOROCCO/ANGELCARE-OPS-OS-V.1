import { notFound } from 'next/navigation'
import { REVENUE_OS_WORKSPACES } from '@/lib/revenue-command-os/constants'
import type { RevenueOsWorkspaceKey } from '@/lib/revenue-command-os/types'
import RevenueOsWorkspacePage from '../_components/RevenueOsWorkspacePage'

export const dynamic = 'force-dynamic'

export default async function RevenueCommandOsWorkspaceRoute({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params
  const found = REVENUE_OS_WORKSPACES.find((item) => item.key === workspace && item.href !== '/revenue-command-os')
  if (!found) notFound()
  return <RevenueOsWorkspacePage workspaceKey={found.key as RevenueOsWorkspaceKey} />
}
