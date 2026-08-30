import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PageBuilderClient } from '@/angelcare-marketplace/experience-builder/components/PageBuilderClient'
import { getPageDetail } from '@/angelcare-marketplace/experience-builder/repository'

export default async function Page({ params }: { params: Promise<{ pageId: string }> }) {
  const context = await requireMarketplacePageContext('marketplace.cms.blocks.manage')
  const { pageId } = await params
  const detail = await getPageDetail(pageId)
  return <PageBuilderClient page={detail.page} initialBlocks={detail.blocks} canPreview={hasMarketplacePermission(context, 'marketplace.cms.preview')} />
}
