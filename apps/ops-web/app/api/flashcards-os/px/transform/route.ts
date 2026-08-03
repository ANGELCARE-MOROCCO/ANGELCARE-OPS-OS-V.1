import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { extractJsonFromProviderText, openRouterFreeCompletion } from '@/lib/flashcards-os/intelligence/adapters/openrouter-free'
import { loadCatalogueComposerOptions } from '@/lib/flashcards-os/catalogue-composer/source'
import { actorFromPxUser, getWorkbench, recordScenarioComposition, replaceWorkbenchItems } from '@/lib/flashcards-os/px/repository'

const schema={type:'object',additionalProperties:false,required:['summary','impact','items'],properties:{summary:{type:'string'},impact:{type:'object',additionalProperties:false,required:['learning','commercial','execution'],properties:{learning:{type:'string'},commercial:{type:'string'},execution:{type:'string'}}},items:{type:'array',minItems:1,maxItems:240,items:{type:'object',additionalProperties:false,required:['itemKind','sourceRef','title','sortOrder','quantity','durationMinutes','locked','payload'],properties:{itemKind:{type:'string',enum:['collection','activity']},sourceRef:{type:'string'},title:{type:'string'},sortOrder:{type:'integer'},quantity:{type:'integer',minimum:1,maximum:1000},durationMinutes:{type:['integer','null'],minimum:1,maximum:480},locked:{type:'boolean'},payload:{type:'object'}}}}}}

export async function POST(request:Request){
 const access=await assertFlashcardsApiAccess('flashcards_os.view_solutions');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status})
 try{
  const body=await request.json();const actor=actorFromPxUser(access.user);const current=await getWorkbench(String(body.workbenchId||''),actor);if(!current)throw new Error('Workbench not found.')
  const allowedKeys=['reduce_cost','fewer_collections','increase_language','increase_creativity','younger_age','home_use','classroom','hotel','b2b_deployment','essential','premium','five_day','thirty_day','increase_repetition','increase_variety','shorter_sessions','simplify_facilitation']
  const transformationKey=allowedKeys.includes(String(body.transformationKey))?String(body.transformationKey):'simplify_facilitation'
  const options=await loadCatalogueComposerOptions();const allowed=new Set(options.collections.map((item)=>item.id))
  const result=await openRouterFreeCompletion({taskProfile:'flashcards_solution_composer',messages:[{role:'system',content:'You are ANGELCARE Flashcards Workbench Transformer. Transform only the supplied package or journey. Use only exact collection IDs already present in the allowed catalogue list. Never invent price, collection, deliverable, legal status or approval. Keep locked items unchanged. Return only JSON.'},{role:'user',content:JSON.stringify({transformationKey,workbench:current.workbench,items:current.items,allowedCollections:options.collections.map((item)=>({id:item.id,code:item.code,name:item.name,priceDh:item.priceDh,objectives:item.objectiveKeys,contexts:item.usageContexts}))})}],temperature:.2,maxOutputTokens:12000,jsonSchema:schema,metadata:{workspace:'flashcards-px-transform'}})
  const proposed=extractJsonFromProviderText(result.rawContent) as any
  const items=Array.isArray(proposed.items)?proposed.items:[]
  for(const item of items){if(!allowed.has(String(item.sourceRef)))throw new Error(`Transformation referenced unknown local collection: ${String(item.sourceRef)}`)}
  const normalized=items.map((item:any,index:number)=>({itemKind:item.itemKind==='activity'?'activity':'collection',sourceRef:String(item.sourceRef),title:String(item.title||item.sourceRef),sortOrder:Number(item.sortOrder||((index+1)*100)),quantity:Math.max(1,Number(item.quantity||1)),durationMinutes:item.durationMinutes==null?null:Math.max(1,Number(item.durationMinutes)),locked:Boolean(item.locked),payload:item.payload&&typeof item.payload==='object'?item.payload:{}}))
  let applied:Awaited<ReturnType<typeof replaceWorkbenchItems>>|null=null
  if(body.apply===true)applied=await replaceWorkbenchItems(current.workbench.id,normalized,actor)
  await recordScenarioComposition({workbenchId:current.workbench.id,kind:'transformation',transformationKey,before:{workbench:current.workbench,items:current.items},proposed:{...proposed,items:normalized},applied,providerRoute:result.requestedRoute,actualModel:result.actualModel},actor)
  return NextResponse.json({transformationKey,proposal:{...proposed,items:normalized},applied,provider:{requestedRoute:result.requestedRoute,actualModel:result.actualModel,providerName:result.providerName}})
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Transformation failed.'},{status:400})}
}
