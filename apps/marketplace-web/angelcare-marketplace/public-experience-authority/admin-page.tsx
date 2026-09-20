import {hasMarketplacePermission,requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {publicExperienceAuthoritySnapshot} from './repository'
import {PublicExperienceAuthorityCommand,type PublicExperienceAuthorityView} from './components/PublicExperienceAuthorityCommand'

export async function PublicExperienceAuthorityPage({view='overview'}:{view?:PublicExperienceAuthorityView}){
 const context=await requireMarketplacePageContext('marketplace.admin.access')
 const snapshot=await publicExperienceAuthoritySnapshot(context)
 const canManage=hasMarketplacePermission(context,'marketplace.configuration.manage')&&hasMarketplacePermission(context,'marketplace.cms.pages.manage')
 return <PublicExperienceAuthorityCommand snapshot={snapshot} view={view} canManage={canManage}/>
}
