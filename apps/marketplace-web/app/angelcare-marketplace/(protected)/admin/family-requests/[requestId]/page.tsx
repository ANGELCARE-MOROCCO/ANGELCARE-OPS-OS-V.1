import { requireMarketplacePageContext,hasMarketplacePermission } from '@/angelcare-marketplace/auth/context'
import { adminGetFamilyRequest } from '@/angelcare-marketplace/family-experience/repository'
import { FamilyRequestDossier } from '@/angelcare-marketplace/admin-control-plane/components/FamilyRequestDossier'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  const context=await requireMarketplacePageContext('marketplace.family.admin.view')
  const { requestId } = await params
  const {item,family}=await adminGetFamilyRequest(requestId,context)
  return <FamilyRequestDossier canCreateOrder={hasMarketplacePermission(context,'marketplace.operations.missions.create')} item={item as Record<string, unknown> | null} family={family as Record<string, unknown> | null} />
}
