import 'server-only'
import { randomUUID } from 'node:crypto'
import { composeLearningJourneyPlans } from '../adapters/openrouter-solutions'
import { clampScenarioCount, solutionsEnvironment } from '../config'
import type { EligibleRelease, JourneyActivity, JourneyDay, JourneyRequest, JourneyScenario, JourneySession } from '../types'
import { calculateCommercial } from './pricing'

const activityKinds=new Set(['opening','revision','new_content','core','guided_practice','independent_practice','reinforcement','assessment','closing','home_continuation'])
function unique<T>(items:T[]){return[...new Set(items)]}
export function validateJourneyRequest(request:JourneyRequest){
 const env=solutionsEnvironment();const findings:string[]=[]
 if(!request.learnerProfileKeys.length)findings.push('Learner and age profile is mandatory.')
 if(!request.usageContextKeys.length)findings.push('Usage context is mandatory.')
 if(!request.painPointKeys.length)findings.push('Situation and pain points are mandatory.')
 if(!request.capabilityObjectiveKeys.length)findings.push('Capability objective is mandatory.')
 if(!request.desiredOutcomeKeys.length)findings.push('Desired measurable outcome is mandatory.')
 if(!request.primaryObjectiveKey)findings.push('Primary objective is mandatory.')
 if(request.durationDays<1||request.durationDays>env.maximumJourneyDays)findings.push(`Duration must remain between 1 and ${env.maximumJourneyDays} days.`)
 if(request.sessionsPerDay<1||request.sessionsPerDay>env.maximumSessionsPerDay)findings.push(`Sessions per day must remain between 1 and ${env.maximumSessionsPerDay}.`)
 if(request.minutesPerSession<5||request.minutesPerSession>env.maximumMinutesPerSession)findings.push(`Session duration must remain between 5 and ${env.maximumMinutesPerSession} minutes.`)
 if(request.maximumCollections<1||request.maximumCollections>24)findings.push('Maximum collections must remain between 1 and 24.')
 if(request.requestedPlanCount<1||request.requestedPlanCount>10)findings.push('Journey proposal count must remain between 1 and 10.')
 return findings
}
function workloadFindings(request:JourneyRequest,days:JourneyDay[]){
 const findings:string[]=[]
 if(days.length!==request.durationDays)findings.push(`Plan contains ${days.length} days instead of ${request.durationDays}.`)
 const sessions=days.flatMap((day)=>day.sessions)
 const expected=request.durationDays*request.sessionsPerDay
 if(sessions.length!==expected)findings.push(`Plan contains ${sessions.length} sessions instead of ${expected}.`)
 for(const session of sessions){
   const activityMinutes=session.activities.reduce((sum,activity)=>sum+activity.durationMinutes,0)
   if(session.durationMinutes!==request.minutesPerSession)findings.push(`Day ${session.dayNumber} session ${session.sessionNumber} duration differs from request.`)
   if(Math.abs(activityMinutes-session.durationMinutes)>2)findings.push(`Day ${session.dayNumber} session ${session.sessionNumber} activity minutes do not reconcile.`)
 }
 return unique(findings)
}
export async function generateLearningJourneyScenarios(input:{request:JourneyRequest;candidates:EligibleRelease[]}){
 const findings=validateJourneyRequest(input.request);if(findings.length)throw new Error(findings.join(' '))
 const candidateMap=new Map(input.candidates.map((candidate)=>[candidate.id,candidate]))
 const requiredMissing=input.request.requiredReleaseIds.filter((id)=>!candidateMap.has(id));if(requiredMissing.length)throw new Error(`Required journey releases are unavailable: ${requiredMissing.join(', ')}`)
 const count=clampScenarioCount(input.request.requestedPlanCount,true)
 const composed=await composeLearningJourneyPlans({request:input.request,candidates:input.candidates,scenarioCount:count})
 const rawPlans=Array.isArray(composed.data.plans)?composed.data.plans.slice(0,count):[];if(!rawPlans.length)throw new Error('OpenRouter returned no valid learning journey.')
 const scenarios:JourneyScenario[]=rawPlans.map((raw:any,index:number)=>{
   let releaseIds:string[]=unique<string>(Array.isArray(raw.releaseIds)?raw.releaseIds.map((value:unknown)=>String(value)).filter((id:string)=>candidateMap.has(id)):[])
   for(const required of input.request.requiredReleaseIds)if(candidateMap.has(required)&&!releaseIds.includes(required))releaseIds.unshift(required)
   releaseIds=releaseIds.filter((id)=>!input.request.excludedReleaseIds.includes(id)).slice(0,input.request.maximumCollections)
   if(!releaseIds.length&&input.candidates[0])releaseIds=[input.candidates[0].id]
   const days:JourneyDay[]=(Array.isArray(raw.days)?raw.days:[]).slice(0,input.request.durationDays).map((day:any,dayIndex:number)=>{
     const dayNumber=dayIndex+1
     const sessions:JourneySession[]=(Array.isArray(day.sessions)?day.sessions:[]).slice(0,input.request.sessionsPerDay).map((session:any,sessionIndex:number)=>{
       const sessionNumber=sessionIndex+1
       const activities:JourneyActivity[]=(Array.isArray(session.activities)?session.activities:[]).map((activity:any,activityIndex:number)=>({id:randomUUID(),order:activityIndex+1,kind:activityKinds.has(String(activity.kind))?activity.kind:'core',title:String(activity.title||`Activity ${activityIndex+1}`),instruction:String(activity.instruction||''),durationMinutes:Math.max(1,Math.round(Number(activity.durationMinutes)||1)),releaseId:activity.releaseId&&candidateMap.has(String(activity.releaseId))?String(activity.releaseId):null,cardGroupReference:activity.cardGroupReference==null?null:String(activity.cardGroupReference),objectiveKeys:Array.isArray(activity.objectiveKeys)?activity.objectiveKeys.map(String):[],successIndicator:String(activity.successIndicator||'Observable learner response recorded.') }))
       return{id:randomUUID(),dayNumber,sessionNumber,title:String(session.title||`Session ${sessionNumber}`),durationMinutes:input.request.minutesPerSession,objectiveKeys:Array.isArray(session.objectiveKeys)?session.objectiveKeys.map(String):[],activities,facilitatorScript:String(session.facilitatorScript||''),learnerResponseExpected:String(session.learnerResponseExpected||''),adjustmentRule:String(session.adjustmentRule||'Reduce new content when two consecutive errors occur.')}
     })
     return{id:randomUUID(),dayNumber,title:String(day.title||`Day ${dayNumber}`),objectiveKeys:Array.isArray(day.objectiveKeys)?day.objectiveKeys.map(String):[],targetConcepts:Array.isArray(day.targetConcepts)?day.targetConcepts.map(String):[],sessions,observation:String(day.observation||''),homeContinuation:String(day.homeContinuation||'')}
   })
   const selected=releaseIds.map((id)=>candidateMap.get(id)).filter(Boolean) as EligibleRelease[]
   const commercial=calculateCommercial({universe:input.request.universe,items:selected.map((release)=>({release,quantity:1})),deliveryDh:input.request.deliveryMode==='physical'||input.request.deliveryMode==='hybrid'?20:0,digitalDeliveryDh:input.request.deliveryMode==='digital'||input.request.deliveryMode==='hybrid'?8:0,supportDh:input.request.universe==='b2b'?80:0,minimumMarginPercent:input.request.universe==='b2c'?40:30,taxPercent:0})
   return{id:randomUUID(),code:`JRN-SCN-${new Date().toISOString().replace(/\D/g,'').slice(0,12)}-${String(index+1).padStart(2,'0')}`,requestId:input.request.id,version:1,status:'generated',name:String(raw.name||`Learning journey ${index+1}`),thesis:String(raw.thesis||''),targetLearner:String(raw.targetLearner||''),rationale:String(raw.rationale||''),expectedOutcome:String(raw.expectedOutcome||''),releaseIds,days,adaptations:Array.isArray(raw.adaptations)?raw.adaptations.map((item:any)=>({key:String(item.key),title:String(item.title),instruction:String(item.instruction)})):[],baseline:String(raw.baseline||''),midpointReview:String(raw.midpointReview||''),finalAssessment:String(raw.finalAssessment||''),masteryCriteria:String(raw.masteryCriteria||''),risks:Array.isArray(raw.risks)?raw.risks.map(String):[],workloadFindings:workloadFindings(input.request,days),commercial,generationRunId:null,createdAt:new Date().toISOString()}
 })
 return{scenarios,usage:composed.usage}
}
export function recalculateJourneyScenario(scenario:JourneyScenario,request:JourneyRequest,releases:EligibleRelease[]){
 const releaseMap=new Map(releases.map((release)=>[release.id,release]));const selected=scenario.releaseIds.map((id)=>releaseMap.get(id)).filter(Boolean) as EligibleRelease[]
 const commercial=calculateCommercial({universe:request.universe,items:selected.map((release)=>({release,quantity:1})),deliveryDh:request.deliveryMode==='physical'||request.deliveryMode==='hybrid'?20:0,digitalDeliveryDh:request.deliveryMode==='digital'||request.deliveryMode==='hybrid'?8:0,supportDh:request.universe==='b2b'?80:0,minimumMarginPercent:request.universe==='b2c'?40:30,taxPercent:0})
 return{...scenario,status:'human_review' as const,workloadFindings:workloadFindings(request,scenario.days),commercial}
}
