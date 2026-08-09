import 'server-only'
import { assertSafeForExternalProvider } from '@/lib/flashcards-os/intelligence/privacy'
import { extractJsonFromProviderText, openRouterFreeCompletion } from '@/lib/flashcards-os/intelligence/adapters/openrouter-free'
import { loadModelProfile } from '@/lib/flashcards-os/intelligence/server/repository'
import type { EligibleRelease, JourneyRequest, ScenarioRole, SolutionRequest } from '../types'

const scenarioSchema = {
  type:'object', additionalProperties:false, required:['scenarios'], properties:{ scenarios:{ type:'array', minItems:1, maxItems:10, items:{ type:'object', additionalProperties:false,
    required:['role','name','positioning','targetCustomer','problemAddressed','promise','releaseIds','itemRationales','coverageGaps','risks','upsell','downgradeAlternative','salesArgument','confidenceScore'],
    properties:{ role:{type:'string'},name:{type:'string'},positioning:{type:'string'},targetCustomer:{type:'string'},problemAddressed:{type:'string'},promise:{type:'string'},releaseIds:{type:'array',items:{type:'string'},minItems:1,maxItems:24},itemRationales:{type:'array',items:{type:'object',additionalProperties:false,required:['releaseId','rationale'],properties:{releaseId:{type:'string'},rationale:{type:'string'}}},maxItems:24},coverageGaps:{type:'array',items:{type:'string'},maxItems:20},risks:{type:'array',items:{type:'string'},maxItems:20},upsell:{type:'string'},downgradeAlternative:{type:'string'},salesArgument:{type:'string'},confidenceScore:{type:'number',minimum:0,maximum:100} }
  }}}}
const journeySchema = {
  type:'object',additionalProperties:false,required:['plans'],properties:{plans:{type:'array',minItems:1,maxItems:10,items:{type:'object',additionalProperties:false,
    required:['name','thesis','targetLearner','rationale','expectedOutcome','releaseIds','days','adaptations','baseline','midpointReview','finalAssessment','masteryCriteria','risks'],
    properties:{name:{type:'string'},thesis:{type:'string'},targetLearner:{type:'string'},rationale:{type:'string'},expectedOutcome:{type:'string'},releaseIds:{type:'array',items:{type:'string'},minItems:1,maxItems:24},days:{type:'array',minItems:1,maxItems:90,items:{type:'object',additionalProperties:false,required:['dayNumber','title','objectiveKeys','targetConcepts','sessions','observation','homeContinuation'],properties:{dayNumber:{type:'integer',minimum:1},title:{type:'string'},objectiveKeys:{type:'array',items:{type:'string'}},targetConcepts:{type:'array',items:{type:'string'}},sessions:{type:'array',minItems:1,maxItems:12,items:{type:'object',additionalProperties:false,required:['sessionNumber','title','durationMinutes','objectiveKeys','activities','facilitatorScript','learnerResponseExpected','adjustmentRule'],properties:{sessionNumber:{type:'integer',minimum:1},title:{type:'string'},durationMinutes:{type:'integer',minimum:5,maximum:240},objectiveKeys:{type:'array',items:{type:'string'}},activities:{type:'array',minItems:3,maxItems:12,items:{type:'object',additionalProperties:false,required:['kind','title','instruction','durationMinutes','releaseId','cardGroupReference','objectiveKeys','successIndicator'],properties:{kind:{type:'string'},title:{type:'string'},instruction:{type:'string'},durationMinutes:{type:'integer',minimum:1,maximum:240},releaseId:{type:['string','null']},cardGroupReference:{type:['string','null']},objectiveKeys:{type:'array',items:{type:'string'}},successIndicator:{type:'string'}}}},facilitatorScript:{type:'string'},learnerResponseExpected:{type:'string'},adjustmentRule:{type:'string'}}}},observation:{type:'string'},homeContinuation:{type:'string'}}}},adaptations:{type:'array',items:{type:'object',additionalProperties:false,required:['key','title','instruction'],properties:{key:{type:'string'},title:{type:'string'},instruction:{type:'string'}}},maxItems:20},baseline:{type:'string'},midpointReview:{type:'string'},finalAssessment:{type:'string'},masteryCriteria:{type:'string'},risks:{type:'array',items:{type:'string'},maxItems:20}}
  }}}}
function parsed(content:string){return extractJsonFromProviderText(content) as any}
async function complete(input:{profileKey:string;system:string;context:unknown;schema:any}){
  const profile=await loadModelProfile(input.profileKey)
  const safe=assertSafeForExternalProvider(JSON.stringify(input.context,null,2))
  const result=await openRouterFreeCompletion({
    taskProfile:input.profileKey,
    messages:[{role:'system',content:input.system},{role:'user',content:safe.safeText}],
    temperature:profile.temperature,
    maxOutputTokens:profile.maxOutputTokens,
    timeoutMs:profile.timeoutMs,
    retryLimit:profile.retryLimit,
    jsonSchema:input.schema,
    metadata:{task_profile:input.profileKey},
  })
  return{data:parsed(result.rawContent),usage:{responseId:result.responseId,modelRequested:result.requestedRoute,modelUsed:result.actualModel,fallbackUsed:false,promptTokens:result.promptTokens,completionTokens:result.completionTokens,totalTokens:result.totalTokens,costUsd:result.providerReportedCostUsd,latencyMs:result.latencyMs,attemptCount:result.attemptCount,redactionFindings:safe.findings}}
}
export async function composeSolutionScenarioNarratives(input:{request:SolutionRequest;candidates:EligibleRelease[];roles:ScenarioRole[];scenarioCount:number}){
 return complete({profileKey:'flashcards_solution_composer',schema:scenarioSchema,system:'You are ANGELCARE Sellable Solution Architect. Use only the exact approved release IDs supplied. Compose differentiated B2C or B2B solution structures and explanations. Never calculate, invent or alter authoritative prices, taxes, discounts, costs, margins, stock or delivery feasibility. Never call external research. Human authority and deterministic commercial rules remain final.',context:input})
}
export async function composeLearningJourneyPlans(input:{request:JourneyRequest;candidates:EligibleRelease[];scenarioCount:number}){
 return complete({profileKey:'flashcards_learning_journey_architect',schema:journeySchema,system:'You are ANGELCARE Learning Journey Architect. Use only exact approved release IDs supplied. Build detailed day-by-day and session-by-session programmes aligned to all five mandatory dimensions. Respect duration, sessions, minutes, maximum collections and facilitator constraints. Do not calculate authoritative prices or margins. Do not invoke external research. Human pedagogical and commercial approval remains final.',context:input})
}
