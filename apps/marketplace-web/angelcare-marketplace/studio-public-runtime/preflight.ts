import 'server-only'
import type { ComponentData,Data } from '@puckeditor/core'
import { isStudioActionReference } from '@/angelcare-marketplace/studio-action-registry/reference'
import { resolveStudioPublicAction } from '@/angelcare-marketplace/studio-action-registry/public-resolver'
import { isStudioWorkflowReference } from '@/angelcare-marketplace/studio-workflows/reference'
import { getStudioWorkflowDescriptor } from '@/angelcare-marketplace/studio-workflows/registry'
import type { StudioRuntimePreflightEntry,StudioRuntimePreflightReport } from './types'

const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{ }
const children=(c:ComponentData)=>Array.isArray(obj(c.props).content)?obj(c.props).content as ComponentData[]:[]
const okAction=(status:string)=>status==='READY'||status==='CONTEXT_REQUIRED'

export async function preflightStudioRuntime(data:Data,locale:'fr'|'en'|'ar'):Promise<StudioRuntimePreflightReport>{
  const entries:StudioRuntimePreflightEntry[]=[]
  let actionCount=0,workflowCount=0
  const walk=async(component:ComponentData):Promise<void>=>{
    const props=obj(component.props),blockId=String(props.id||component.type||'block')
    const workflowRaw=props.__studioWorkflow
    let workflowActionId:string|null=null
    if(workflowRaw!==undefined){
      workflowCount++
      if(!isStudioWorkflowReference(workflowRaw)){entries.push({kind:'workflow',blockId,identifier:'unknown',status:'INVALID',note:'Workflow Studio non enregistré.'})}
      else{
        const descriptor=getStudioWorkflowDescriptor(workflowRaw.workflowId);workflowActionId=descriptor?.actionId||null
        if(!descriptor)entries.push({kind:'workflow',blockId,identifier:workflowRaw.workflowId,status:'INVALID',note:'Workflow Studio non enregistré.'})
        else if(descriptor.targetRequired&&!workflowRaw.target)entries.push({kind:'workflow',blockId,identifier:workflowRaw.workflowId,status:'TARGET_REQUIRED',note:'La cible canonique requise est absente.'})
        else if(workflowRaw.target&&descriptor.targetSources.length&&!descriptor.targetSources.includes(workflowRaw.target.sourceId))entries.push({kind:'workflow',blockId,identifier:workflowRaw.workflowId,status:'TARGET_UNSUPPORTED',note:'La cible canonique ne correspond pas au workflow.'})
        else entries.push({kind:'workflow',blockId,identifier:workflowRaw.workflowId,status:'READY',note:descriptor.canonicalEngine})
      }
    }
    const candidates:[string,unknown][]=[['primaryAction',props.primaryAction],['secondaryAction',props.secondaryAction]]
    if(Array.isArray(props.items))for(const [index,row] of props.items.entries())if(row&&typeof row==='object'&&!Array.isArray(row))candidates.push([`items.${index}.action`,(row as Record<string,unknown>).action])
    for(const [slot,raw] of candidates){
      if(raw===undefined||raw===null)continue
      actionCount++
      if(!isStudioActionReference(raw)){entries.push({kind:'action',blockId,identifier:slot,status:'INVALID',note:'Action Studio invalide.'});continue}
      const resolved=await resolveStudioPublicAction(raw,locale)
      if(resolved?.status==='WORKFLOW_REQUIRED'&&workflowActionId===raw.actionId){entries.push({kind:'action',blockId,identifier:raw.actionId,status:'WORKFLOW_READY',note:'Action exécutée par le workflow natif du bloc.'});continue}
      entries.push({kind:'action',blockId,identifier:raw.actionId,status:resolved?.status||'INVALID',note:resolved?.reason||resolved?.canonicalEngine||'Action résolue.'})
    }
    for(const child of children(component))await walk(child)
  }
  for(const component of Array.isArray(data.content)?data.content:[])await walk(component)
  const blockerCount=entries.filter(row=>row.status!=='READY'&&row.status!=='WORKFLOW_READY'&&row.status!=='CONTEXT_REQUIRED').length
  return{actionCount,workflowCount,blockerCount,entries}
}
