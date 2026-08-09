import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { FamilyDashboard } from '@/angelcare-marketplace/family-experience/components/FamilyDashboard'
import { getFamilyDashboard } from '@/angelcare-marketplace/family-experience/repository'

export default async function Page() {
  const context = await requireMarketplacePageContext('marketplace.family.dashboard')
  return <FamilyDashboard data={await getFamilyDashboard(context)} />
}
