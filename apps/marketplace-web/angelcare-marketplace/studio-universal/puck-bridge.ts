import type { ComponentData, Data } from '@puckeditor/core'
import type { CmsBlock } from '@/angelcare-marketplace/experience-builder/types'

const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value)) as T
const string=(value:unknown)=>value==null?'':String(value)

export function stableStudioId(type:string,index:number,seed='studio'){
  const safe=type.replace(/[^a-z0-9_-]/gi,'-').slice(0,40)||'block'
  return `${safe}-${seed}-${String(index+1).padStart(3,'0')}`
}

export function cmsBlocksToPuckData(blocks:CmsBlock[],root?:Record<string,unknown>):Data{
  const content=blocks.filter(block=>block.status!=='archived').sort((a,b)=>a.sort_order-b.sort_order).map((block,index)=>{
    const stored=block.content?.__studioPuck
    if(stored&&typeof stored==='object'&&!Array.isArray(stored))return clone(stored as ComponentData)
    const content=block.content||{}
    const props:Record<string,unknown>={id:block.block_key||stableStudioId(block.block_type,index),...content,sourceDesign:(block.settings as any)?.sourceDesign||{},responsive:(block.settings as any)?.responsive||{mobileVisible:true,tabletVisible:true,desktopVisible:true},hidden:block.status==='hidden',locked:Boolean((block.settings as any)?.locked)}
    delete props.__studioPuck
    return {type:string(block.block_type),props} as ComponentData
  })
  return {content,root:{props:{title:string(root?.title),locale:string(root?.locale||'fr'),...root}}} as unknown as Data
}

export function puckDataToCmsBlocks(data:Data){
  const content=Array.isArray(data.content)?data.content:[]
  return content.map((component,index)=>{
    const props=(component?.props||{}) as Record<string,unknown>
    const id=string(props.id)||stableStudioId(string(component.type)||'block',index,Date.now().toString(36))
    const publicContent:Record<string,unknown>={...props,__studioPuck:clone(component)}
    delete publicContent.id
    delete publicContent.sourceDesign
    delete publicContent.responsive
    delete publicContent.locked
    delete publicContent.hidden
    return {blockKey:id,blockType:string(component.type),sortOrder:index,content:publicContent,settings:{sourceDesign:props.sourceDesign||{},responsive:props.responsive||{},locked:Boolean(props.locked),studioFormat:'angelcare-puck-v1'},status:props.hidden===true?'hidden':'active'}
  })
}

export function fingerprintsInData(data:Data){
  const found=new Set<string>()
  const walk=(value:unknown)=>{if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach(walk);return}const record=value as Record<string,unknown>;const props=record.props;if(props&&typeof props==='object'&&!Array.isArray(props)){const fp=(props as Record<string,unknown>).__studioSourceFingerprint;if(typeof fp==='string'&&fp)found.add(fp)}Object.values(record).forEach(walk)}
  walk(data.content)
  return found
}

export function rekeyComponent<T extends ComponentData>(source:T,suffix:string):T{
  const copy=clone(source) as any
  let index=0
  const walk=(value:any)=>{if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach(walk);return}if(value.props&&typeof value.props==='object'&&typeof value.props.id==='string'){value.props.id=`${value.props.id}-${suffix}-${++index}`}Object.values(value).forEach(walk)}
  walk(copy)
  return copy
}
