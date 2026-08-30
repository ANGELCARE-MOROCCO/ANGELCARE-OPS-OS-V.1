import {hasMarketplacePermission,requireMarketplaceWorkspacePageContext} from '../auth/context'
import {HomepageReleaseAuthority} from './components/HomepageReleaseAuthority'
import {homepageReleaseSnapshot} from './repository'
export async function HomepageReleasePage(){const context=await requireMarketplaceWorkspacePageContext('homepage.history','marketplace.homepage.view');const data=await homepageReleaseSnapshot();return <HomepageReleaseAuthority releases={data.releases} versions={data.versions} canManage={hasMarketplacePermission(context,'marketplace.homepage.manage')}/>}
