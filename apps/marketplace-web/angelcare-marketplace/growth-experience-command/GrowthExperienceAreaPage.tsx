import {requireMarketplacePageContext} from '../auth/context'
import {RealityCompletionPage} from '../reality-completion/admin-page'
import {LiveExperiencePage} from '../live-experience-command/admin-pages'
import {LiveGovernancePage} from '../live-experience-command/governance-admin-page'
import {MerchandisingPage,HomepageComposerPage} from '../commerce-studio/admin-pages'
import {assistedOrderOptions,listSearchRules,frontendControlSnapshot} from '../total-commerce-control/repository'
import {DiscoveryControl} from '../total-commerce-control/components/DiscoveryControl'
import {FrontendControlCommand} from '../total-commerce-control/components/FrontendControlCommand'
import {conversionAdminSummary,listConversionSessions} from '../conversion-universe/repository'
import {ConversionAdminCommand} from '../conversion-universe/components/ConversionAdminCommand'
import {LocalizationCockpit} from '../localization-intelligence/components/LocalizationCockpit'
import {localizationSummary} from '../localization-intelligence/repository'
import {growthExperienceSnapshot} from './repository'
import {GrowthExperienceCommand} from './components/GrowthExperienceCommand'
import type {GrowthExperienceMode} from './types'

export const dynamic='force-dynamic'

export async function GrowthExperienceAreaPage({mode}:{mode:GrowthExperienceMode}){
  if(mode==='command'){
    const context=await requireMarketplacePageContext('marketplace.growth.view')
    return <GrowthExperienceCommand data={await growthExperienceSnapshot(context)}/>
  }
  if(mode==='acquisition')return <RealityCompletionPage workspaceKey="growth.opportunities"/>
  if(mode==='campaigns')return <LiveExperiencePage mode="command"/>
  if(mode==='audiences')return <LiveGovernancePage mode="audiences"/>
  if(mode==='retention')return <RealityCompletionPage workspaceKey="growth.retention"/>
  if(mode==='recovery')return <RealityCompletionPage workspaceKey="growth.recovery"/>
  if(mode==='experiments')return <LiveGovernancePage mode="experiments"/>
  if(mode==='merchandising')return MerchandisingPage({mode:'merchandising'})
  if(mode==='homepage')return HomepageComposerPage({mode:'command'})
  if(mode==='discovery'||mode==='search'){
    await requireMarketplacePageContext('marketplace.merchandising.view')
    const [rules,options]=await Promise.all([listSearchRules(),assistedOrderOptions()])
    return <DiscoveryControl initial={rules} options={options}/>
  }
  if(mode==='conversion'){
    const context=await requireMarketplacePageContext('marketplace.conversion.view')
    const [summary,sessions]=await Promise.all([conversionAdminSummary(context),listConversionSessions(context,{limit:100})])
    return <ConversionAdminCommand summary={summary} sessions={sessions}/>
  }
  if(mode==='localization'){
    await requireMarketplacePageContext('marketplace.localization.access')
    return <LocalizationCockpit summary={await localizationSummary()}/>
  }
  if(mode==='public-experience'){
    await requireMarketplacePageContext('marketplace.commerce.view')
    return <FrontendControlCommand snapshot={await frontendControlSnapshot()}/>
  }
  return <RealityCompletionPage workspaceKey="performance.command"/>
}
