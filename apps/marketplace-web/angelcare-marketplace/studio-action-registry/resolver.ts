import 'server-only'
import type { MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import { validateStudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/resolver'
import { getStudioActionDescriptor, STUDIO_ACTION_DESCRIPTORS } from './registry'
import { safeExternalStudioUrl } from './reference'
import type { StudioActionReference } from './types'

export function listStudioActions(){return STUDIO_ACTION_DESCRIPTORS}
export function getStudioAction(actionId:string){return getStudioActionDescriptor(actionId)}
export async function validateStudioAction(action:StudioActionReference,context:MarketplaceRequestContext){
  const descriptor=getStudioActionDescriptor(action.actionId)
  if(!descriptor)return{status:'INVALID',reason:'Action Studio inconnue.'}
  if(descriptor.executionMode==='external')return safeExternalStudioUrl(action.externalUrl)?{status:'VALID',descriptor}:{status:'INVALID',reason:'URL externe refusée.'}
  if(descriptor.targetRequired&&!action.target)return{status:'TARGET_REQUIRED',descriptor}
  if(action.target&&descriptor.targetSources.length&&!descriptor.targetSources.includes(action.target.sourceId))return{status:'TARGET_UNSUPPORTED',descriptor,reason:'Source cible non autorisée.'}
  if(action.target){const validation=await validateStudioSourceReference(action.target,{context:{locale:context.locale,territoryId:context.territoryId}},context);if(validation.status!=='VALID')return{status:validation.status,descriptor,validation}}
  if(descriptor.p07WorkflowRequired)return{status:'WORKFLOW_REQUIRED',descriptor,reason:'Action reconnue; exécution formulaire réservée à P07.'}
  return{status:'VALID',descriptor}
}
