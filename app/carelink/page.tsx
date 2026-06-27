import { CareLinkFieldAgentPremiumApp } from '@/components/carelink/mobile/CareLinkFieldAgentPremiumApp'
import { loadCarelinkMobileWorkspaceOrRedirect } from '@/lib/carelink/mobile-page-access'

export const dynamic = 'force-dynamic'

export default async function CareLinkPage() {
  const dashboard = await loadCarelinkMobileWorkspaceOrRedirect()
  return <CareLinkFieldAgentPremiumApp records={dashboard.records} workspace={dashboard} view="home" />
}
