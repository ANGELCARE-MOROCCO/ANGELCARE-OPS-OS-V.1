import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PageDossierClient } from '@/angelcare-marketplace/experience-builder/components/PageDossierClient'
import { getPageDetail } from '@/angelcare-marketplace/experience-builder/repository'

export default async function Page({ params }: { params: Promise<{ pageId: string }> }) {
  const context = await requireMarketplacePageContext('marketplace.cms.view')
  const { pageId } = await params
  const bundle = await getPageDetail(pageId)
  return <PageDossierClient
    initialPage={bundle.page}
    blocks={bundle.blocks}
    versions={bundle.versions}
    permissions={{
      edit: hasMarketplacePermission(context, 'marketplace.cms.edit'),
      blocks: hasMarketplacePermission(context, 'marketplace.cms.blocks.manage'),
      preview: hasMarketplacePermission(context, 'marketplace.cms.preview'),
      rollback: hasMarketplacePermission(context, 'marketplace.cms.rollback'),
      transitions: {
        draft: hasMarketplacePermission(context, 'marketplace.cms.edit'),
        submitted: hasMarketplacePermission(context, 'marketplace.cms.submit'),
        in_review: hasMarketplacePermission(context, 'marketplace.cms.review'),
        approved: hasMarketplacePermission(context, 'marketplace.cms.approve'),
        scheduled: hasMarketplacePermission(context, 'marketplace.cms.schedule'),
        published: hasMarketplacePermission(context, 'marketplace.cms.publish'),
        retired: hasMarketplacePermission(context, 'marketplace.cms.publish'),
        archived: hasMarketplacePermission(context, 'marketplace.cms.archive'),
      },
    }}
  />
}
