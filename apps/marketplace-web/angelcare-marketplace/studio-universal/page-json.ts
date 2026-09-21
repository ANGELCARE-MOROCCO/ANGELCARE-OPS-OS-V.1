import type { ComponentData, Data } from '@puckeditor/core'
import { STUDIO_BLOCK_TYPES } from './block-contracts'
import { isStudioVisualExperience } from './visual-catalogue'
import { isStudioLiveBindingReference, studioBindingTarget } from '@/angelcare-marketplace/studio-live-binding/registry'
import { isStudioDynamicSourceReference } from '@/angelcare-marketplace/studio-dynamic-source/registry'
import { isStudioWorkflowReference } from '@/angelcare-marketplace/studio-workflows/reference'
import { HOMEPAGE_PRO_MAX_COMPONENT_KEYS } from '@/angelcare-marketplace/studio-homepage-pro-max/recipe'

export const STUDIO_PAGE_JSON_FORMAT='angelcare-puck-page-v1' as const
export const STUDIO_PAGE_JSON_MAX_BYTES=5_000_000
const MAX_COMPONENTS=750
const MAX_DEPTH=28
const MAX_STRING=250_000
const blockedKeys=new Set(['__proto__','prototype','constructor'])
const urlKeys=new Set(['href','primaryCtaHref','secondaryCtaHref','mediaUrl','url','src'])
const unsafeScheme=/^(?:javascript|vbscript|data\s*:\s*text\/html)/i
const isRegisteredStudioBlockType=(type:string)=>STUDIO_BLOCK_TYPES.has(type)||isStudioVisualExperience(type)||HOMEPAGE_PRO_MAX_COMPONENT_KEYS.includes(type)

const plain=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value)
const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value)) as T

function inspect(value:unknown,state:{components:number},depth=0,key='root'){
  if(depth>MAX_DEPTH)throw new Error('Le document dépasse la profondeur maximale autorisée.')
  if(typeof value==='string'){
    if(value.length>MAX_STRING)throw new Error(`Le champ ${key} dépasse la taille autorisée.`)
    if(urlKeys.has(key)&&unsafeScheme.test(value.trim()))throw new Error(`Destination non sûre refusée dans ${key}.`)
    return
  }
  if(value==null||typeof value==='number'||typeof value==='boolean')return
  if(Array.isArray(value)){for(const item of value)inspect(item,state,depth+1,key);return}
  if(!plain(value))throw new Error(`Valeur non JSON refusée dans ${key}.`)
  for(const [childKey,childValue] of Object.entries(value)){
    if(blockedKeys.has(childKey))throw new Error(`Clé interdite: ${childKey}.`)
    inspect(childValue,state,depth+1,childKey)
  }
}

function inspectBindingMap(value:unknown){
  if(value===undefined)return
  if(!plain(value))throw new Error('La configuration de données live doit être un objet.')
  if(Object.keys(value).length>12)throw new Error('Trop de bindings live sur un même bloc.')
  for(const [target,reference] of Object.entries(value)){
    if(!studioBindingTarget(target))throw new Error(`Cible de binding live non enregistrée: ${target}.`)
    if(!isStudioLiveBindingReference(reference))throw new Error(`Binding live invalide pour ${target}.`)
  }
}

function inspectDynamicSource(value:unknown){if(value===undefined)return;if(!isStudioDynamicSourceReference(value))throw new Error('Configuration de source dynamique invalide.')}
function inspectWorkflow(value:unknown){if(value===undefined)return;if(!isStudioWorkflowReference(value))throw new Error('Configuration de workflow AngelCare invalide.')}

function inspectComponent(component:unknown,state:{components:number},depth=0){
  if(!plain(component))throw new Error('Chaque bloc Puck doit être un objet.')
  const type=typeof component.type==='string'?component.type:''
  if(!type||!isRegisteredStudioBlockType(type))throw new Error(`Type de bloc non enregistré: ${type||'(vide)'}.`)
  state.components+=1
  if(state.components>MAX_COMPONENTS)throw new Error(`Le document dépasse ${MAX_COMPONENTS} blocs.`)
  if(depth>MAX_DEPTH)throw new Error('La hiérarchie de blocs est trop profonde.')
  const props=plain(component.props)?component.props:{}
  inspectBindingMap(props.__studioBindings)
  inspectDynamicSource(props.__studioDynamicSource)
  inspectWorkflow(props.__studioWorkflow)
  const nested=Array.isArray(props.content)?props.content:[]
  for(const child of nested)inspectComponent(child,state,depth+1)
}

export function validateStudioPageJson(input:unknown):Data{
  const envelope=plain(input)&&input.format===STUDIO_PAGE_JSON_FORMAT?input.data:input
  if(!plain(envelope))throw new Error('Le fichier ne contient pas un document Puck valide.')
  const encoded=JSON.stringify(envelope)
  if(encoded.length>STUDIO_PAGE_JSON_MAX_BYTES)throw new Error('Le document dépasse la taille maximale de 5 Mo.')
  if(!Array.isArray(envelope.content))throw new Error('Le document Puck doit contenir une liste content.')
  const state={components:0}
  for(const component of envelope.content)inspectComponent(component,state)
  inspect(envelope,state)
  return clone(envelope) as unknown as Data
}

export function studioPageJsonEnvelope(data:Data,meta?:{pageId?:string;title?:string;slug?:string;locale?:string}){
  return {format:STUDIO_PAGE_JSON_FORMAT,exportedAt:new Date().toISOString(),meta:{pageId:meta?.pageId||'',title:meta?.title||'',slug:meta?.slug||'',locale:meta?.locale||'fr'},data:clone(data)}
}

export function studioPageComponentCount(data:Data){
  let count=0
  const walk=(component:ComponentData)=>{count+=1;const props=component.props as Record<string,unknown>|undefined;const nested=props&&Array.isArray(props.content)?props.content as ComponentData[]:[];nested.forEach(walk)}
  ;(Array.isArray(data.content)?data.content:[]).forEach(walk)
  return count
}
