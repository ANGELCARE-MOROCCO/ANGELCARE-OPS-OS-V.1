import {requireMarketplacePageContext,hasMarketplacePermission} from '../auth/context'
import {listCustomCreatives} from './creative-360'
import {LIVE_THEMES,LIVE_PURPOSES} from './registry'
import {LiveCreativeCommand} from './components/LiveCreativeCommand'
export async function LiveCreativeAdminPage(){
 const context=await requireMarketplacePageContext('marketplace.live_experience.view')
 const custom=await listCustomCreatives()
 return <LiveCreativeCommand initial={custom} themes={LIVE_THEMES.map(t=>({key:t.key,kind:t.kind,name:t.name}))} purposes={LIVE_PURPOSES.map(p=>({key:p.key,kind:p.kind,name:p.name}))} canManage={hasMarketplacePermission(context,'marketplace.live_experience.manage')} canPublish={hasMarketplacePermission(context,'marketplace.live_experience.publish')}/>
}
