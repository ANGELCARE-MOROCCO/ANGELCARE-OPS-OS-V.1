import type {MarketplacePermission} from '../domain/types'
import {requireMarketplaceApiContext} from '../auth/context'
import {apiFailure,apiSuccess,cleanOptionalText,parseJsonObject,requestId} from '../server/request'
import {executiveAuthoritySummary,listDefects,listExperiments,listGrowthOpportunities,listLaunchGates,listMetricDefinitions,listMetricObservations,listMonitoring,listPerformance,listQaChecks,listQaRuns,listReleaseRecords,listSecurityAssessments,listSecurityControls,transitionDefect,transitionExperiment,transitionRelease} from './repository'
async function get(request:Request,permission:MarketplacePermission,load:(context:Awaited<ReturnType<typeof requireMarketplaceApiContext>>)=>Promise<unknown>){const id=requestId(request);try{return apiSuccess(await load(await requireMarketplaceApiContext(permission)),{requestId:id})}catch(error){return apiFailure(error,id)}}
export const handleExecutive=(r:Request)=>get(r,'marketplace.intelligence.view',executiveAuthoritySummary)
export const handleMetrics=(r:Request)=>get(r,'marketplace.intelligence.view',()=>listMetricDefinitions())
export const handleObservations=(r:Request)=>get(r,'marketplace.intelligence.view',c=>listMetricObservations(c,new URL(r.url).searchParams.get('domain')||undefined))
export const handleGrowth=(r:Request)=>get(r,'marketplace.growth.view',listGrowthOpportunities)
export const handleExperiments=(r:Request)=>get(r,'marketplace.growth.view',()=>listExperiments())
export const handlePerformance=(r:Request)=>get(r,'marketplace.performance.view',listPerformance)
export const handleSecurity=(r:Request)=>get(r,'marketplace.security.view',()=>listSecurityControls())
export const handleSecurityAssessments=(r:Request)=>get(r,'marketplace.security.view',()=>listSecurityAssessments())
export const handleQa=(r:Request)=>get(r,'marketplace.qa.view',()=>listQaRuns())
export const handleQaChecks=(r:Request)=>get(r,'marketplace.qa.view',()=>listQaChecks(new URL(r.url).searchParams.get('runId')||undefined))
export const handleDefects=(r:Request)=>get(r,'marketplace.qa.view',()=>listDefects())
export const handleLaunch=(r:Request)=>get(r,'marketplace.launch.view',()=>listLaunchGates())
export const handleReleases=(r:Request)=>get(r,'marketplace.launch.view',()=>listReleaseRecords())
export const handleMonitoring=(r:Request)=>get(r,'marketplace.launch.monitoring',listMonitoring)
export async function handleExperimentTransition(request:Request,id:string){const rid=requestId(request);try{const c=await requireMarketplaceApiContext('marketplace.growth.experiments.manage'),b=await parseJsonObject(request);return apiSuccess(await transitionExperiment(id,String(b.nextStatus||''),cleanOptionalText(b.reason,2000),c,rid,request),{requestId:rid})}catch(error){return apiFailure(error,rid)}}
export async function handleDefectTransition(request:Request,id:string){const rid=requestId(request);try{const c=await requireMarketplaceApiContext('marketplace.qa.defects.manage'),b=await parseJsonObject(request);return apiSuccess(await transitionDefect(id,String(b.nextStatus||''),cleanOptionalText(b.reason,2000),c,rid,request),{requestId:rid})}catch(error){return apiFailure(error,rid)}}
export async function handleReleaseTransition(request:Request,id:string){const rid=requestId(request);try{const c=await requireMarketplaceApiContext('marketplace.launch.approve'),b=await parseJsonObject(request);return apiSuccess(await transitionRelease(id,String(b.nextStatus||''),cleanOptionalText(b.reason,2000),c,rid,request),{requestId:rid})}catch(error){return apiFailure(error,rid)}}
