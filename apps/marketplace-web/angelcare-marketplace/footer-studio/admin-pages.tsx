import { hasMarketplacePermission, requireMarketplacePageContext } from '../auth/context'
import { footerStudioSummary } from './repository'
import { FooterStudioCommand } from './components/FooterStudioCommand'
import type { FooterStudioMode } from './types'

export async function FooterStudioPage({mode='command'}:{mode?:FooterStudioMode}){
  const context=await requireMarketplacePageContext('marketplace.commerce.view')
  const summary=await footerStudioSummary(context)
  return <FooterStudioCommand summary={summary} mode={mode} actorName={context.actor.displayName} canManage={hasMarketplacePermission(context,'marketplace.publication.manage')} canViewAnalytics={hasMarketplacePermission(context,'marketplace.analytics.view')}/>
}
