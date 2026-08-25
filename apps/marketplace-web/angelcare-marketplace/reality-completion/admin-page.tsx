import {notFound} from 'next/navigation'
import {requireMarketplaceWorkspacePageContext} from '../auth/context'
import {getFinalMz2Workspace} from '../final-vertical/registry'
import {REALITY_DOMAIN_CONTRACTS,isRealityDomain} from './domain-contract'
import {loadRealityWorkspace} from './repository'
import {GrowthExecutionCommand} from './components/GrowthExecutionCommand'
import {QaDefectCommand} from './components/QaDefectCommand'
import {IntelligenceDecisionCommand} from './components/IntelligenceDecisionCommand'
import {PerformanceIncidentCommand} from './components/PerformanceIncidentCommand'
import {SecurityIncidentCommand} from './components/SecurityIncidentCommand'
import {TrustInvestigationCommand} from './components/TrustInvestigationCommand'
import {ReleaseExecutionCommand} from './components/ReleaseExecutionCommand'

const RENDERERS={
 growth:GrowthExecutionCommand,
 qa:QaDefectCommand,
 intelligence:IntelligenceDecisionCommand,
 platform_performance:PerformanceIncidentCommand,
 security:SecurityIncidentCommand,
 trust:TrustInvestigationCommand,
 launch:ReleaseExecutionCommand,
} as const

export async function RealityCompletionPage({workspaceKey}:{workspaceKey:string}){
 const definition=getFinalMz2Workspace(workspaceKey)
 if(!definition||!isRealityDomain(definition.domain))notFound()
 const domain=definition.domain
 const contract=REALITY_DOMAIN_CONTRACTS[domain]
 const context=await requireMarketplaceWorkspacePageContext(workspaceKey,contract.managePermission)
 const data=await loadRealityWorkspace(domain,workspaceKey,context)
 const Renderer=RENDERERS[domain]
 return <Renderer workspaceKey={workspaceKey} title={definition.title} mission={definition.mission} lifecycle={contract.lifecycle} actorName={context.actor.displayName} records={data.records} sources={data.sourceRecords} events={data.events}/>
}
