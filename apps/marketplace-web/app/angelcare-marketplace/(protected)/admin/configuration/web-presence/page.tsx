import type {Metadata} from 'next'
import {hasMarketplacePermission,requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {getWebPresenceSnapshot,webPresenceHistory} from '@/angelcare-marketplace/web-presence/repository'
import {parseScope} from '@/angelcare-marketplace/web-presence/schema'
import {WebPresenceWorkspace} from '@/angelcare-marketplace/web-presence/WebPresenceWorkspace'
export const metadata:Metadata={title:'Présence Web & Identité Navigateur'}
export const dynamic='force-dynamic'
export default async function WebPresencePage({searchParams}:{searchParams:Promise<{scope?:string}>}){const context=await requireMarketplacePageContext('marketplace.web_presence.view'),scope=parseScope((await searchParams).scope);const[snapshot,history]=await Promise.all([getWebPresenceSnapshot(scope),webPresenceHistory(scope).catch(()=>[])]);return <WebPresenceWorkspace initial={snapshot} history={history} actorName={context.actor.displayName} permissions={{manage:hasMarketplacePermission(context,'marketplace.web_presence.manage'),publish:hasMarketplacePermission(context,'marketplace.web_presence.publish'),rollback:hasMarketplacePermission(context,'marketplace.web_presence.rollback'),verify:hasMarketplacePermission(context,'marketplace.web_presence.verify')}}/>}
