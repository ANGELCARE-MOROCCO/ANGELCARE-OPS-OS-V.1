import type { ComponentData, Data } from '@puckeditor/core'
import { isStudioLiveBindingReference, studioBindingTarget, studioLiveBinding } from './registry'
import type { StudioBindingReport, StudioBindingResolutionEntry, StudioBindingValueType, StudioLiveBindingContext } from './types'

const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value)) as T
const missing=(value:unknown)=>value===null||value===undefined||value===''||(Array.isArray(value)&&value.length===0)
const preview=(value:unknown)=>{if(value===null||value===undefined)return '—';if(Array.isArray(value))return `${value.length} élément(s)`;const text=typeof value==='string'?value:JSON.stringify(value);return String(text).replace(/\s+/g,' ').slice(0,120)}
const typeOk=(value:unknown,type:StudioBindingValueType)=>type==='text'?typeof value==='string':type==='number'?typeof value==='number'&&Number.isFinite(value):type==='boolean'?typeof value==='boolean':type==='url'?typeof value==='string'&&(/^(https?:\/\/|\/)/.test(value)):type==='items'?Array.isArray(value):false

export function applyStudioLiveBindings(data:Data,context:StudioLiveBindingContext):{data:Data;report:StudioBindingReport}{
  const copy=clone(data),entries:StudioBindingResolutionEntry[]=[];const touched=new Set<string>()
  const walk=(component:ComponentData)=>{
    const props=(component.props||{}) as Record<string,unknown>,blockId=String(props.id||component.type||'block'),blockType=String(component.type||'block')
    const rawBindings=props.__studioBindings&&typeof props.__studioBindings==='object'&&!Array.isArray(props.__studioBindings)?props.__studioBindings as Record<string,unknown>:{}
    for(const [targetKey,rawReference] of Object.entries(rawBindings)){
      const target=studioBindingTarget(targetKey)
      if(!target){entries.push({blockId,blockType,target:targetKey,bindingKey:'unknown',status:'INCOMPATIBLE_TARGET',authority:null,preview:'Cible de binding non enregistrée'});continue}
      if(!isStudioLiveBindingReference(rawReference)){const bindingKey=rawReference&&typeof rawReference==='object'&&!Array.isArray(rawReference)&&typeof (rawReference as Record<string,unknown>).bindingKey==='string'?String((rawReference as Record<string,unknown>).bindingKey):'unknown';entries.push({blockId,blockType,target:targetKey,bindingKey,status:'UNKNOWN_BINDING',authority:null,preview:'Binding inconnue ou invalide'});continue}
      const reference=rawReference,descriptor=studioLiveBinding(reference.bindingKey)
      if(!descriptor){entries.push({blockId,blockType,target:targetKey,bindingKey:reference.bindingKey,status:'UNKNOWN_BINDING',authority:null,preview:'Binding inconnue'});continue}
      if(!target||!target.accepts.includes(descriptor.valueType)){entries.push({blockId,blockType,target:targetKey,bindingKey:reference.bindingKey,status:'INCOMPATIBLE_TARGET',authority:descriptor.authority,preview:'Type incompatible'});continue}
      const value=context.values[reference.bindingKey]
      if(missing(value)){
        if(reference.missingPolicy==='empty'){props[targetKey]=descriptor.valueType==='items'?[]:descriptor.valueType==='number'?0:'';entries.push({blockId,blockType,target:targetKey,bindingKey:reference.bindingKey,status:'MISSING_EMPTIED',authority:descriptor.authority,preview:'Valeur absente → vide'});touched.add(blockId);continue}
        if(reference.missingPolicy==='omit'){delete props[targetKey];entries.push({blockId,blockType,target:targetKey,bindingKey:reference.bindingKey,status:'MISSING_OMITTED',authority:descriptor.authority,preview:'Valeur absente → propriété omise'});touched.add(blockId);continue}
        if(reference.missingPolicy==='hide_block'){props.hidden=true;entries.push({blockId,blockType,target:targetKey,bindingKey:reference.bindingKey,status:'BLOCK_HIDDEN',authority:descriptor.authority,preview:'Valeur absente → bloc masqué'});touched.add(blockId);continue}
        entries.push({blockId,blockType,target:targetKey,bindingKey:reference.bindingKey,status:'MISSING_PRESERVED',authority:descriptor.authority,preview:'Valeur absente → contenu statique conservé'});continue
      }
      if(!typeOk(value,descriptor.valueType)){entries.push({blockId,blockType,target:targetKey,bindingKey:reference.bindingKey,status:'INCOMPATIBLE_TARGET',authority:descriptor.authority,preview:'Valeur canonique de type inattendu'});continue}
      props[targetKey]=clone(value);entries.push({blockId,blockType,target:targetKey,bindingKey:reference.bindingKey,status:'BOUND',authority:descriptor.authority,preview:preview(value)});touched.add(blockId)
    }
    const content=props.content;if(Array.isArray(content))for(const child of content)if(child&&typeof child==='object'&&!Array.isArray(child))walk(child as ComponentData)
  }
  for(const component of Array.isArray(copy.content)?copy.content:[])walk(component)
  const missingCount=entries.filter(row=>row.status.startsWith('MISSING_')||row.status==='BLOCK_HIDDEN').length
  const blockerCount=entries.filter(row=>row.status==='UNKNOWN_BINDING'||row.status==='INCOMPATIBLE_TARGET').length
  return{data:copy,report:{bindingCount:entries.length,boundCount:entries.filter(row=>row.status==='BOUND').length,missingCount,blockerCount,blocksTouched:touched.size,entries}}
}
