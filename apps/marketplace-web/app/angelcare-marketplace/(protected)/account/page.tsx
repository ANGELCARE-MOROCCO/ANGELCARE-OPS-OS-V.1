import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { AccountAccess } from '@/angelcare-marketplace/features/workspace/AccountAccess'
import { WorkspaceShell } from '@/angelcare-marketplace/shells/WorkspaceShell'

export const metadata = { title: 'Identité & accès' }

export default async function MarketplaceAccountPage() {
  const context = await requireMarketplacePageContext('marketplace.workspace.access')
  return <WorkspaceShell context={context}><AccountAccess context={context} /></WorkspaceShell>
}
