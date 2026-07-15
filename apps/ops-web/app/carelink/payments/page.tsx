import { CareLinkFieldAgentPremiumApp } from '@/components/carelink/mobile/CareLinkFieldAgentPremiumApp'
import { loadCarelinkMobileWorkspaceOrRedirect } from '@/lib/carelink/mobile-page-access'

export const dynamic = 'force-dynamic'

export default async function CareLinkPaymentsPage() {
  const workspace = await loadCarelinkMobileWorkspaceOrRedirect()
  return <CareLinkFieldAgentPremiumApp records={workspace.records} workspace={workspace} view="payments" />
}
