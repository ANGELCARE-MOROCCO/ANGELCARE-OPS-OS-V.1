import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { StudioIndex } from '@/angelcare-marketplace/studio-universal/components/StudioIndex'
import { studioPageIndex } from '@/angelcare-marketplace/studio-universal/repository'

export default async function Page(){
  const context=await requireMarketplacePageContext('marketplace.cms.view')
  const pages=await studioPageIndex(context)
  return <StudioIndex pages={pages}/>
}
