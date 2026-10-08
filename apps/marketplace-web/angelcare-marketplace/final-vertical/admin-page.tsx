import {notFound} from 'next/navigation'
import {requireMarketplaceWorkspacePageContext} from '../auth/context'
import {getFinalMz2Workspace} from './registry'
import {loadFinalWorkspaceData} from './repository'
import {QaControlRoom} from './components/domains/QaControlRoom'
import {LaunchReleaseControlRoom} from './components/domains/LaunchReleaseControlRoom'
import {IntelligenceDecisionRoom} from './components/domains/IntelligenceDecisionRoom'
import {PlatformPerformanceWorkspace} from './components/domains/PlatformPerformanceWorkspace'
import {GrowthControlRoom} from './components/domains/GrowthControlRoom'
import {SecurityControlRoom} from './components/domains/SecurityControlRoom'
import {TrustQualityControlRoom} from './components/domains/TrustQualityControlRoom'
const RENDERERS={qa:QaControlRoom,launch:LaunchReleaseControlRoom,intelligence:IntelligenceDecisionRoom,platform_performance:PlatformPerformanceWorkspace,growth:GrowthControlRoom,security:SecurityControlRoom,trust:TrustQualityControlRoom} as const
export async function FinalVerticalPage({workspaceKey}:{workspaceKey:string}){const def=getFinalMz2Workspace(workspaceKey);if(!def)notFound();const context=await requireMarketplaceWorkspacePageContext(def.key,def.permission);const Renderer=RENDERERS[def.domain as keyof typeof RENDERERS];if(!Renderer)notFound();return <Renderer definition={def} data={await loadFinalWorkspaceData(def,context)} actorName={context.actor.displayName}/>}
