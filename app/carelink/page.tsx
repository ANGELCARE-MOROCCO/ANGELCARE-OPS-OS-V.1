import { CareLinkFieldAgentPremiumApp } from '@/components/carelink/mobile/CareLinkFieldAgentPremiumApp'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'

export const dynamic = 'force-dynamic'

export default async function CareLinkPage() {
  const dashboard = await loadCarelinkMobileWorkspace()
  return <CareLinkFieldAgentPremiumApp records={dashboard.records} workspace={dashboard} view="home" />
}
