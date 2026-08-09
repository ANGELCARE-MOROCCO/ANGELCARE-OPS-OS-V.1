import 'server-only'
import { assertSafeForExternalProvider } from '@/lib/flashcards-os/intelligence/privacy'
import { extractJsonFromProviderText, openRouterFreeCompletion } from '@/lib/flashcards-os/intelligence/adapters/openrouter-free'
import { loadModelProfile } from '@/lib/flashcards-os/intelligence/server/repository'
import type { CatalogueCollectionCandidate, JourneyComposerInput, PackageComposerInput } from './types'

const packageSchema = {
  type: 'object', additionalProperties: false, required: ['scenarios'], properties: {
    scenarios: { type: 'array', minItems: 1, maxItems: 10, items: { type: 'object', additionalProperties: false,
      required: ['name','positioning','customerPromise','targetCustomer','collectionIds','collectionRationales','coverageGaps','risks','upsellCollectionIds','upgradePath','salesArgument','confidenceScore'],
      properties: {
        name:{type:'string'}, positioning:{type:'string'}, customerPromise:{type:'string'}, targetCustomer:{type:'string'},
        collectionIds:{type:'array',items:{type:'string'},minItems:1,maxItems:24},
        collectionRationales:{type:'array',items:{type:'object',additionalProperties:false,required:['collectionId','rationale','usageOrder'],properties:{collectionId:{type:'string'},rationale:{type:'string'},usageOrder:{type:'integer',minimum:1}}}},
        coverageGaps:{type:'array',items:{type:'string'}}, risks:{type:'array',items:{type:'string'}}, upsellCollectionIds:{type:'array',items:{type:'string'}},
        upgradePath:{type:'string'}, salesArgument:{type:'string'}, confidenceScore:{type:'number',minimum:0,maximum:100},
      },
    } },
  },
}

const journeySchema = {
  type:'object',additionalProperties:false,required:['plans'],properties:{plans:{type:'array',minItems:1,maxItems:10,items:{type:'object',additionalProperties:false,
    required:['name','thesis','targetLearner','expectedOutcome','collectionIds','days','baseline','midpointReview','finalAssessment','adaptations','risks'],
    properties:{name:{type:'string'},thesis:{type:'string'},targetLearner:{type:'string'},expectedOutcome:{type:'string'},collectionIds:{type:'array',items:{type:'string'},minItems:1,maxItems:24},
      days:{type:'array',minItems:1,maxItems:90,items:{type:'object',additionalProperties:false,required:['dayNumber','title','objectiveKeys','sessions','parentOrTeacherContinuation'],properties:{dayNumber:{type:'integer',minimum:1},title:{type:'string'},objectiveKeys:{type:'array',items:{type:'string'}},parentOrTeacherContinuation:{type:'string'},sessions:{type:'array',minItems:1,maxItems:5,items:{type:'object',additionalProperties:false,required:['sessionNumber','title','durationMinutes','objectiveKeys','activities','facilitatorInstruction','successIndicator'],properties:{sessionNumber:{type:'integer',minimum:1},title:{type:'string'},durationMinutes:{type:'integer',minimum:5,maximum:120},objectiveKeys:{type:'array',items:{type:'string'}},facilitatorInstruction:{type:'string'},successIndicator:{type:'string'},activities:{type:'array',minItems:1,maxItems:12,items:{type:'object',additionalProperties:false,required:['order','title','instruction','durationMinutes','collectionId','cardReference','objectiveKeys','expectedObservation'],properties:{order:{type:'integer',minimum:1},title:{type:'string'},instruction:{type:'string'},durationMinutes:{type:'integer',minimum:1,maximum:120},collectionId:{type:'string'},cardReference:{type:'string'},objectiveKeys:{type:'array',items:{type:'string'}},expectedObservation:{type:'string'}}}}}}}}}},
      baseline:{type:'string'},midpointReview:{type:'string'},finalAssessment:{type:'string'},adaptations:{type:'array',items:{type:'string'}},risks:{type:'array',items:{type:'string'}}}
  }}}}

function providerPayload(collections: CatalogueCollectionCandidate[]) {
  return collections.map((item) => ({
    collectionId:item.id, collectionCode:item.code, collectionName:item.name, categoryId:item.categoryId, categoryName:item.categoryName,
    versionId:item.versionId, versionLabel:item.versionLabel, status:item.status, readinessScore:item.readinessScore, cardCount:item.cardCount,
    ageMinMonths:item.ageMinMonths, ageMaxMonths:item.ageMaxMonths, languages:item.languages, formats:item.formats,
    methodologies:item.methodologies, audiences:item.audiences, usageContexts:item.usageContexts, objectiveKeys:item.objectiveKeys,
    painPointKeys:item.painPointKeys, outcomeKeys:item.outcomeKeys, description:item.description, priceDh:item.priceDh,
  }))
}

async function complete(profileKey:string, system:string, context:unknown, schema:any) {
  const profile = await loadModelProfile(profileKey)
  const safe = assertSafeForExternalProvider(JSON.stringify(context, null, 2))
  const result = await openRouterFreeCompletion({
    taskProfile: profileKey, messages: [{ role:'system', content:system }, { role:'user', content:safe.safeText }],
    temperature: profile.temperature, maxOutputTokens: profile.maxOutputTokens, timeoutMs: profile.timeoutMs,
    retryLimit: profile.retryLimit, jsonSchema: schema, metadata: { task_profile: profileKey, source_doctrine:'local_catalogue_only' },
  })
  return { data: extractJsonFromProviderText(result.rawContent) as any, usage: { responseId:result.responseId, modelRequested:result.requestedRoute, modelUsed:result.actualModel || result.requestedRoute, promptTokens:result.promptTokens, completionTokens:result.completionTokens, totalTokens:result.totalTokens, costUsd:result.providerReportedCostUsd, latencyMs:result.latencyMs, attemptCount:result.attemptCount } }
}

export function composeCataloguePackages(input: PackageComposerInput, candidates: CatalogueCollectionCandidate[]) {
  return complete('flashcards_solution_composer',
    'You are ANGELCARE Flashcards Catalogue Package Architect. The supplied LOCAL CATALOGUE is the only source of product truth. Use only exact collectionId values supplied. Never invent a collection, category, version, card count, price, feature or availability. Return genuinely different package proposals respecting the maximum collection count and requested customer conditions. Do not calculate prices. Do not use external research. Every selected collection needs a specific rationale and usage order.',
    { request: input, localCatalogue: providerPayload(candidates), requestedProposalCount: input.requestedProposalCount }, packageSchema)
}

export function composeCatalogueJourneys(input: JourneyComposerInput, candidates: CatalogueCollectionCandidate[]) {
  return complete('flashcards_learning_journey_architect',
    'You are ANGELCARE Flashcards Learning Programme Architect. The supplied LOCAL CATALOGUE is the only source of knowledge and product truth. Use only exact collectionId values supplied. Every activity must identify an exact registered collectionId. Never write generic instructions such as use language flashcards without naming the exact collection. Respect exact days, sessions per day and minutes per session. Build meaningfully different plans with clear facilitator instructions, expected observations and progression. Never invent prices, collections or card content. Do not use external research.',
    { request: input, localCatalogue: providerPayload(candidates), requestedProposalCount: input.requestedProposalCount }, journeySchema)
}
