import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { adminListFamilies, adminListRequests } from '@/angelcare-marketplace/family-experience/repository'
import { FamilyRequestDossier } from '@/angelcare-marketplace/admin-control-plane/components/FamilyRequestDossier'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  await requireMarketplacePageContext('marketplace.family.admin.view')
  const { requestId } = await params
  const [requests, families] = await Promise.all([adminListRequests(), adminListFamilies()])
  const item = requests.find((row) => row.id === requestId) || null
  const family = item ? families.find((row) => row.id === item.family_account_id) || null : null
  return <FamilyRequestDossier item={item as Record<string, unknown> | null} family={family as Record<string, unknown> | null} />
}
