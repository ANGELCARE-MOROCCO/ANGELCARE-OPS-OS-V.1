import type { ComponentData,Data } from '@puckeditor/core'
import { getStudioSourceDescriptor } from '@/angelcare-marketplace/studio-source-registry/registry'
import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'
import { isStudioDependencySource,studioSourceEntityTag,studioSourceFamilyTag } from './registry'
import { STUDIO_DEPENDENCY_MAX_DIRECT,type StudioDependencyGraph,type StudioDependencyReference,type StudioDependencyRelation } from './types'

const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
const ref=(v:unknown):StudioSourceReference|null=>{const o=obj(v),sourceId=typeof o.sourceId==='string'?o.sourceId:'',entityId=typeof o.entityId==='string'?o.entityId:'';return sourceId&&entityId&&isStudioDependencySource(sourceId)?{sourceId,entityId}:null}
const relationFor=(path:string,sourceId:string):StudioDependencyRelation=>path.includes('action')?'action_target':path.includes('workflow')?'workflow_target':path.includes('Dynamic')||path.includes('dynamic')?'queries':sourceId==='media.assets'?'uses_media':sourceId==='content.templates'?'uses_template':sourceId.startsWith('context.')||sourceId.startsWith('audience.')?'uses_context':path.includes('href')?'navigates_to':'source_reference'

export function extractStudioDependencies(data:Data):StudioDependencyGraph{
 const rows:StudioDependencyReference[]=[],seen=new Set<string>();let truncated=false
 const add=(r:StudioSourceReference,blockId:string,path:string)=>{if(rows.length>=STUDIO_DEPENDENCY_MAX_DIRECT){truncated=true;return}const key=`${r.sourceId}:${r.entityId}:${blockId}:${path}`;if(seen.has(key))return;seen.add(key);rows.push({...r,relation:relationFor(path,r.sourceId),blockId,path})}
 const walk=(value:unknown,path:string,blockId:string,depth=0)=>{if(depth>14||truncated)return;const direct=ref(value);if(direct)add(direct,blockId,path);if(Array.isArray(value)){for(let i=0;i<value.length;i++)walk(value[i],`${path}[${i}]`,blockId,depth+1);return}const o=obj(value);if(!Object.keys(o).length)return
   if(typeof o.sourceId==='string'&&typeof o.strategy==='string'&&getStudioSourceDescriptor(o.sourceId)){const family={sourceId:o.sourceId,entityId:'*'};add(family,blockId,`${path}.__source_family`)}
   for(const [k,v] of Object.entries(o))walk(v,path?`${path}.${k}`:k,blockId,depth+1)
 }
 const components=Array.isArray(data.content)?data.content:[]
 const visitComponent=(component:ComponentData)=>{const p=obj(component.props),blockId=String(p.id||component.type||'block');walk(p,'props',blockId);const nested=Array.isArray(p.content)?p.content as ComponentData[]:[];for(const child of nested)visitComponent(child)}
 for(const component of components)visitComponent(component)
 const cacheTags=[...new Set(rows.flatMap(row=>row.entityId==='*'?[studioSourceFamilyTag(row.sourceId)]:[studioSourceFamilyTag(row.sourceId),studioSourceEntityTag(row)]))]
 return{version:1,dependencyCount:rows.length,sourceCount:new Set(rows.map(row=>row.sourceId)).size,dependencies:rows,cacheTags,truncated}
}
