import type {ComponentData,Data} from '@puckeditor/core'
import {getStudioActionDescriptor} from '@/angelcare-marketplace/studio-action-registry/registry'
import type {PublicExperienceWorldFactoryRecord} from './types'
import {materializedOperabilityForBlock} from './operability'
import { isAtomicRoot } from '../../atomic-offer-experience/model'

const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value)) as T
const rec=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{ }

const isComponent=(value:unknown):value is ComponentData=>Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&typeof (value as Record<string,unknown>).type==='string'&&(value as Record<string,unknown>).props&&typeof (value as Record<string,unknown>).props==='object')
function walk(data:Data,visit:(component:ComponentData,props:Record<string,unknown>,path:string)=>void){
 const loop=(component:ComponentData,path:string)=>{const props=rec(component.props);visit(component,props,path);for(const [key,value] of Object.entries(props)){if(Array.isArray(value))value.forEach((child,index)=>{if(isComponent(child))loop(child,`${path}.props.${key}.${index}`)});else if(isComponent(value))loop(value,`${path}.props.${key}`)}}
 for(const [index,component] of (Array.isArray(data.content)?data.content:[]).entries())loop(component,`root.${index}`)
}
function idOf(component:ComponentData,path:string){const props=rec(component.props);return typeof props.id==='string'&&props.id?props.id:`${String(component.type||'block')}@${path}`}

export function materializeWorldFactoryData(source:Data,factory:PublicExperienceWorldFactoryRecord):Data{
 const data=clone(source)
 const bindingsByBlock=new Map<string,PublicExperienceWorldFactoryRecord['bindingPlan']>()
 for(const row of factory.bindingPlan){if(row.status!=='RESOLVED')continue;const list=bindingsByBlock.get(row.blockId)||[];list.push(row);bindingsByBlock.set(row.blockId,list)}
 const actionsByBlock=new Map<string,PublicExperienceWorldFactoryRecord['actionPlan']>()
 for(const row of factory.actionPlan){if(row.status!=='RESOLVED'||!row.actionId)continue;const descriptor=getStudioActionDescriptor(row.actionId);if(!descriptor||descriptor.executionMode==='workflow')continue;const list=actionsByBlock.get(row.blockId)||[];list.push(row);actionsByBlock.set(row.blockId,list)}
 const relationByBlock=new Map(factory.relationPlan.map(row=>[row.blockId,row]))
 walk(data,(component,props,path)=>{
  const blockId=idOf(component,path)
  const bindings=bindingsByBlock.get(blockId)||[]
  // The opt-in atomic renderer reads typed public sources and omits whole empty
  // sections. Generic hide_block bindings must not hide its complete root when
  // one optional media/price/field projection is absent. Older packs are unchanged.
  const atomicProjection=['atomic_offer_section','atomic_offer_group'].includes(String(component.type))||isAtomicRoot(String(component.type),props)
  if(bindings.length&&!atomicProjection){const map=rec(props.__studioBindings);for(const row of bindings)map[row.targetKey]={version:1,bindingKey:row.bindingKey,missingPolicy:row.missingPolicy};props.__studioBindings=map}
  const actions=actionsByBlock.get(blockId)||[]
  for(const row of actions){const descriptor=getStudioActionDescriptor(row.actionId!);if(!descriptor)continue;const reference={version:1,actionId:row.actionId,targetMode:row.targetMode,...(row.targetMode==='none'?{}:{})};if(row.intent==='primary')props.primaryAction=reference;else if(row.intent==='secondary')props.secondaryAction=reference}
  const relation=relationByBlock.get(blockId)
  const repeater=factory.operability.repeaters.find(row=>row.blockId===blockId&&row.targetKey==='items')
  if(relation&&!atomicProjection)props.__studioDynamicSource={version:1,sourceId:'catalog.items',strategy:relation.strategy,limit:relation.limit,filters:{},anchorMode:'current_item',sort:'recommended',emptyPolicy:relation.emptyPolicy}
  else if(!atomicProjection&&repeater?.source==='dynamic_source'&&repeater.sourceId&&repeater.strategy)props.__studioDynamicSource={version:1,sourceId:repeater.sourceId,strategy:repeater.strategy,query:repeater.query||'',limit:repeater.limit,filters:repeater.filters||{},context:repeater.context||{territoryMode:'inherit',audienceMode:'inherit'},merchandising:repeater.merchandising||{mode:'automatic',pinnedEntityIds:[],excludedEntityIds:[],orderedEntityIds:[],manualEntityIds:[]},sort:repeater.sort||'canonical',emptyPolicy:repeater.emptyPolicy==='block_publish'?'hide_block':repeater.emptyPolicy==='omit'?'hide_block':repeater.emptyPolicy}
  props.__worldFactory={engineVersion:factory.engineVersion,schemaVersion:factory.schemaVersion,compiledFingerprint:factory.compiledFingerprint,blockId,role:factory.semanticSlots.find(row=>row.blockId===blockId)?.role||'unknown'}
  props.__worldFactoryOperability=materializedOperabilityForBlock(factory.operability,blockId)
 })
 const root=rec(data.root);root.__worldFactory={engineVersion:factory.engineVersion,schemaVersion:factory.schemaVersion,compilerProfile:factory.compilerProfile,candidateFingerprint:factory.candidateFingerprint,compiledFingerprint:factory.compiledFingerprint,worldKey:factory.revision.worldKey,revision:factory.revision.revision};root.__worldFactoryOperability={version:factory.operability.version,density:factory.operability.density,localization:factory.operability.localization,tokens:factory.operability.tokens,performance:factory.operability.performance,shell:factory.operability.shell,editing:factory.operability.editing,inspector:factory.operability.inspector};data.root=root
 return data
}
