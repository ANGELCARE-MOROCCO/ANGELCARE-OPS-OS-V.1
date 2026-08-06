import { requireMarketplacePageContext } from '../auth/context'
import { liveExperienceSummary } from './repository'
import { LiveExperienceCommand } from './components/LiveExperienceCommand'
import type { LiveMode } from './types'
export async function LiveExperiencePage({mode='command'}:{mode?:LiveMode}){const context=await requireMarketplacePageContext('marketplace.live_experience.view');return <LiveExperienceCommand summary={await liveExperienceSummary(context)} mode={mode} actorName={context.actor.displayName}/>} 
