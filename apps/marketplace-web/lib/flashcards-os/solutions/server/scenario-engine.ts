import 'server-only'
import { randomUUID } from 'node:crypto'
import { composeSolutionScenarioNarratives } from '../adapters/openrouter-solutions'
import { clampScenarioCount } from '../config'
import type { EligibleRelease, EligibilityResult, ScenarioItem, ScenarioRole, SolutionRequest, SolutionScenario } from '../types'
import { calculateCommercial } from './pricing'

function unique<T>(items:T[]){return [...new Set(items)]}
function scoreCoverage(request:SolutionRequest,releases:EligibleRelease[]){
 const requested=unique([...request.constraints.objectiveKeys,...request.constraints.painPointKeys,...request.constraints.outcomeKeys])
 if(!requested.length)return 100
 const covered=new Set(releases.flatMap((release)=>[...release.objectiveKeys,...release.painPointKeys,...release.outcomeKeys]))
 return Math.round(requested.filter((key)=>covered.has(key)).length/requested.length*100)
}
function roleOrDefault(value:string,index:number,roles:ScenarioRole[]):ScenarioRole{
 const allowed=new Set<ScenarioRole>(['essential','balanced','comprehensive','premium','lowest_cost','highest_coverage','highest_margin','fastest_deployment','digital_first','physical_first','hybrid','home_intensive','classroom_ready','therapist_oriented'])
 if(allowed.has(value as ScenarioRole))return value as ScenarioRole
 return roles[index%Math.max(roles.length,1)]||'balanced'
}
function similaritySignature(ids:string[]){return [...ids].sort().join('|')}
function diversityScore(index:number,allSignatures:string[],signature:string){
 const duplicates=allSignatures.filter((item)=>item===signature).length
 return Math.max(25,Math.min(100,96-index*3-(duplicates-1)*40))
}
export function validateSolutionRequest(request:SolutionRequest){
 const findings:string[]=[]
 if(!request.title.trim())findings.push('Request title is required.')
 if(!['b2c','b2b'].includes(request.universe))findings.push('Commercial universe must be B2C or B2B.')
 if(request.requestedScenarioCount<1||request.requestedScenarioCount>10)findings.push('Scenario count must remain between 1 and 10.')
 if(request.constraints.maximumCollections<1||request.constraints.maximumCollections>24)findings.push('Maximum collections must remain between 1 and 24.')
 if(request.constraints.minimumCollections>request.constraints.maximumCollections)findings.push('Minimum collections cannot exceed maximum collections.')
 if(request.constraints.budgetMaxDh>0&&request.constraints.budgetMinDh>request.constraints.budgetMaxDh)findings.push('Budget minimum cannot exceed budget maximum.')
 if(request.constraints.minimumGrossMarginPercent<-100||request.constraints.minimumGrossMarginPercent>100)findings.push('Margin threshold is outside the valid range.')
 if(request.constraints.maximumDiscountPercent<0||request.constraints.maximumDiscountPercent>100)findings.push('Maximum discount must remain between 0 and 100%.')
 return findings
}
export async function generateSolutionScenarios(input:{request:SolutionRequest;candidates:EligibleRelease[];eligibility:EligibilityResult[]}){
 const requestFindings=validateSolutionRequest(input.request);if(requestFindings.length)throw new Error(requestFindings.join(' '))
 const eligibleIds=new Set(input.eligibility.filter((result)=>result.eligible).map((result)=>result.releaseId))
 const candidates=input.candidates.filter((candidate)=>eligibleIds.has(candidate.id))
 const requiredMissing=input.request.constraints.requiredReleaseIds.filter((id)=>!eligibleIds.has(id))
 if(requiredMissing.length)throw new Error(`Required releases are ineligible: ${requiredMissing.join(', ')}`)
 if(candidates.length<input.request.constraints.minimumCollections)throw new Error('Eligible product pool is smaller than the minimum collection requirement.')
 const count=clampScenarioCount(input.request.requestedScenarioCount)
 const roles:ScenarioRole[]=(input.request.scenarioRoles.length?input.request.scenarioRoles:['essential','balanced','premium'] as ScenarioRole[]).slice(0,count)
 const composed=await composeSolutionScenarioNarratives({request:input.request,candidates,roles,scenarioCount:count})
 const rawScenarios=Array.isArray(composed.data.scenarios)?composed.data.scenarios.slice(0,count):[]
 if(!rawScenarios.length)throw new Error('OpenRouter returned no valid solution scenario.')
 const candidateMap=new Map(candidates.map((candidate)=>[candidate.id,candidate]))
 const signatures:string[]=[]
 const scenarios:SolutionScenario[]=rawScenarios.map((raw:any,index:number)=>{
   let releaseIds:string[]=unique<string>(Array.isArray(raw.releaseIds)?raw.releaseIds.map((value:unknown)=>String(value)).filter((id:string)=>candidateMap.has(id)):[])
   for(const required of input.request.constraints.requiredReleaseIds)if(candidateMap.has(required)&&!releaseIds.includes(required))releaseIds.unshift(required)
   releaseIds=releaseIds.filter((id)=>!input.request.constraints.excludedReleaseIds.includes(id)).slice(0,input.request.constraints.maximumCollections)
   if(releaseIds.length<input.request.constraints.minimumCollections){
     for(const candidate of candidates){if(releaseIds.length>=input.request.constraints.minimumCollections)break;if(!releaseIds.includes(candidate.id))releaseIds.push(candidate.id)}
   }
   const selected=releaseIds.map((id)=>candidateMap.get(id)).filter(Boolean) as EligibleRelease[]
   if(!selected.length)throw new Error(`Scenario ${index+1} contains no eligible release.`)
   const rationales=new Map<string,string>((Array.isArray(raw.itemRationales)?raw.itemRationales:[]).map((item:any)=>[String(item.releaseId),String(item.rationale||'')]))
   const items:ScenarioItem[]=selected.map((release)=>({id:randomUUID(),releaseId:release.id,releaseCode:release.code,collectionName:release.collectionName,quantity:1,format:input.request.constraints.deliveryMode,rationale:rationales.get(release.id)||'Selected to cover the governed customer and learner requirements.',objectivesCovered:release.objectiveKeys.filter((key)=>input.request.constraints.objectiveKeys.includes(key)),painPointsCovered:release.painPointKeys.filter((key)=>input.request.constraints.painPointKeys.includes(key)),outcomesCovered:release.outcomeKeys.filter((key)=>input.request.constraints.outcomeKeys.includes(key)),locked:input.request.constraints.requiredReleaseIds.includes(release.id)}))
   const commercial=calculateCommercial({universe:input.request.universe,items:selected.map((release)=>({release,quantity:1})),deliveryDh:input.request.universe==='b2c'?20:0,supportDh:input.request.universe==='b2b'?60:0,discountPercent:0,maximumDiscountPercent:input.request.constraints.maximumDiscountPercent,taxPercent:0,minimumMarginPercent:input.request.constraints.minimumGrossMarginPercent})
   const signature=similaritySignature(releaseIds);signatures.push(signature)
   const coverage=scoreCoverage(input.request,selected)
   const warnings:string[]=[]
   if(input.request.constraints.budgetMaxDh>0&&commercial.finalTotalDh>input.request.constraints.budgetMaxDh)warnings.push('Scenario exceeds the maximum budget.')
   if(input.request.constraints.budgetMinDh>0&&commercial.finalTotalDh<input.request.constraints.budgetMinDh)warnings.push('Scenario falls below the intended budget floor.')
   const duplicateConcepts=items.flatMap((item)=>item.objectivesCovered).filter((key,position,all)=>all.indexOf(key)!==position)
   return{id:randomUUID(),code:`SCN-${new Date().toISOString().replace(/\D/g,'').slice(0,12)}-${String(index+1).padStart(2,'0')}`,requestId:input.request.id,version:1,role:roleOrDefault(String(raw.role||''),index,roles),status:'generated',name:String(raw.name||`Solution ${index+1}`),positioning:String(raw.positioning||''),targetCustomer:String(raw.targetCustomer||''),problemAddressed:String(raw.problemAddressed||''),promise:String(raw.promise||''),items,coverageScore:coverage,suitabilityScore:Math.round(input.eligibility.filter((result)=>releaseIds.includes(result.releaseId)).reduce((sum,result)=>sum+result.score,0)/Math.max(releaseIds.length,1)),diversityScore:diversityScore(index,signatures,signature),confidenceScore:Math.max(0,Math.min(100,Math.round(Number(raw.confidenceScore)||75))),coverageGaps:unique<string>([...(Array.isArray(raw.coverageGaps)?raw.coverageGaps.map((value:unknown)=>String(value)):[]),...warnings]),duplicateWarnings:unique(duplicateConcepts.map((key)=>`Overlapping coverage: ${key}`)),risks:Array.isArray(raw.risks)?raw.risks.map(String):[],upsell:String(raw.upsell||''),downgradeAlternative:String(raw.downgradeAlternative||''),salesArgument:String(raw.salesArgument||''),commercial,evidenceIds:[],internalFactIds:releaseIds,generationRunId:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}
 })
 if(input.request.constraints.requireVisiblyDifferentScenarios&&new Set(scenarios.map((scenario)=>similaritySignature(scenario.items.map((item)=>item.releaseId)))).size<Math.min(2,scenarios.length))throw new Error('Generated scenarios are not sufficiently differentiated. Rerun with stronger diversification.')
 return{scenarios,usage:composed.usage}
}
export function recalculateSolutionScenario(scenario:SolutionScenario,releases:EligibleRelease[],request:SolutionRequest,discountPercent=0){
 const releaseMap=new Map(releases.map((release)=>[release.id,release]))
 const selected=scenario.items.map((item)=>({release:releaseMap.get(item.releaseId),quantity:item.quantity})).filter((item):item is {release:EligibleRelease;quantity:number}=>Boolean(item.release))
 const commercial=calculateCommercial({universe:request.universe,items:selected,deliveryDh:request.universe==='b2c'?20:0,supportDh:request.universe==='b2b'?60:0,discountPercent,maximumDiscountPercent:request.constraints.maximumDiscountPercent,taxPercent:0,minimumMarginPercent:request.constraints.minimumGrossMarginPercent})
 return{...scenario,status:'edited' as const,commercial,coverageScore:scoreCoverage(request,selected.map((item)=>item.release)),updatedAt:new Date().toISOString()}
}
