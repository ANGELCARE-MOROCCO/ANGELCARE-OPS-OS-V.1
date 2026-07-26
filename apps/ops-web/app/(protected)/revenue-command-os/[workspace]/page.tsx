import { notFound, permanentRedirect } from 'next/navigation'
import { REVENUE_OS_WORKSPACES } from '@/lib/revenue-command-os/constants'
import type { RevenueOsWorkspaceKey } from '@/lib/revenue-command-os/types'
import RevenueOsWorkspacePage from '../_components/RevenueOsWorkspacePage'

export const dynamic = 'force-dynamic'

const LEGACY_WORKSPACE_ALIASES: Record<string, string> = {
  'intelligent-commands': '/revenue-command-os/command-kernel',
  commands: '/revenue-command-os/command-kernel',
  strategies: '/revenue-command-os/strategy-engine',
  council: '/revenue-command-os/validation-council',
  studio: '/revenue-command-os/strategy-studio',
  compiler: '/revenue-command-os/mission-compiler',
  execution: '/revenue-command-os/execution-autopilot',
  programs: '/revenue-command-os/active-programs',
  missions: '/revenue-command-os/compiled-missions',
  validations: '/revenue-command-os/approvals',
  memory: '/revenue-command-os/memory-learning',
  parameters: '/revenue-command-os/settings',
  objectives: '/revenue-command-os/revenue-objectives',
}

export default async function RevenueCommandOsWorkspaceRoute({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params
  const alias = LEGACY_WORKSPACE_ALIASES[workspace]
  if (alias) permanentRedirect(alias)
  const found = REVENUE_OS_WORKSPACES.find((item) => item.key === workspace && item.href !== '/revenue-command-os')
  if (!found) notFound()
  return <RevenueOsWorkspacePage workspaceKey={found.key as RevenueOsWorkspaceKey} />
}
