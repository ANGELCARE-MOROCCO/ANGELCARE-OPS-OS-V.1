import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { UniversalExperienceStudio } from '@/angelcare-marketplace/studio-universal/components/UniversalExperienceStudio'
import { loadStudioPickerData } from '@/angelcare-marketplace/studio-universal/picker-data'
import { loadStudioDocument } from '@/angelcare-marketplace/studio-universal/repository'

export default async function Page({params}:{params:Promise<{pageId:string}>}){
  const context=await requireMarketplacePageContext()
  const {pageId}=await params
  const {detail,data}=await loadStudioDocument(pageId)
  const pickers=await loadStudioPickerData(data)
  return <UniversalExperienceStudio page={detail.page} initialData={data} pickers={pickers} canPreview={hasMarketplacePermission(context,'marketplace.cms.preview')} canPublish={hasMarketplacePermission(context,'marketplace.cms.publish')}/>
}
