import { CareLinkFieldAgentPremiumApp } from '@/components/carelink/mobile/CareLinkFieldAgentPremiumApp'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'

export const dynamic = 'force-dynamic'

export default async function CareLinkSafetyPage() {
  const workspace = await loadCarelinkMobileWorkspace()
  return <CareLinkFieldAgentPremiumApp records={workspace.records} workspace={workspace} view="safety" />
}
