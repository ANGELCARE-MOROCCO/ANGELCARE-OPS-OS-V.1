import {requireMarketplacePageContext} from '../auth/context'
import {RealityCompletionPage} from '../reality-completion/admin-page'
import {executiveAuthoritySummary} from '../final-authority/repository'
import {ExecutiveControlCommand} from './components/ExecutiveControlCommand'
import type {ExecutiveControlMode} from './types'
export const dynamic='force-dynamic'
const intelligenceKeys:Record<Exclude<ExecutiveControlMode,'command'|'performance'|'security'|'qa'|'launch'>,string>={
 executive:'intelligence.executive',demand:'intelligence.demand',discovery:'intelligence.discovery',conversion:'intelligence.conversion',revenue:'intelligence.revenue',customers:'intelligence.customers',categories:'intelligence.categories',territories:'intelligence.territories',operations:'intelligence.operations',trust:'intelligence.trust',growth:'intelligence.growth',
}
export async function ExecutiveControlAreaPage({mode}:{mode:ExecutiveControlMode}){
 if(mode==='command'){const context=await requireMarketplacePageContext('marketplace.intelligence.view');return <ExecutiveControlCommand data={await executiveAuthoritySummary(context)}/>}
 if(mode==='performance')return <RealityCompletionPage workspaceKey="performance.command"/>
 if(mode==='security')return <RealityCompletionPage workspaceKey="security.command"/>
 if(mode==='qa')return <RealityCompletionPage workspaceKey="qa.command"/>
 if(mode==='launch')return <RealityCompletionPage workspaceKey="launch.command"/>
 return <RealityCompletionPage workspaceKey={intelligenceKeys[mode]}/>
}
