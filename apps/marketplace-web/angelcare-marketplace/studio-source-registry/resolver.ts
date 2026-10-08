import 'server-only'
import { hasMarketplacePermission } from '@/angelcare-marketplace/auth/context'
import type { MarketplacePermission, MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
import { STUDIO_SOURCE_ADAPTER_BY_ID } from './adapters'
import { getStudioSourceDescriptor, STUDIO_SOURCE_DESCRIPTORS } from './registry'
import type { StudioSourceCapability, StudioSourceDescriptor, StudioSourceReference, StudioSourceSearchInput, StudioSourceValidation } from './types'

function descriptorOrThrow(sourceId:string):StudioSourceDescriptor{
  const descriptor=getStudioSourceDescriptor(sourceId)
  if(!descriptor)throw new MarketplaceError('NOT_FOUND','Source Studio inconnue.')
  return descriptor
}

function assertPermission(descriptor:StudioSourceDescriptor,context:MarketplaceRequestContext){
  if(!hasMarketplacePermission(context,descriptor.governance.permission as MarketplacePermission)){
    throw new MarketplaceError('PERMISSION_DENIED','Cette source Marketplace n’est pas autorisée pour votre rôle.')
  }
}

function adapterOrThrow(sourceId:string){
  const adapter=STUDIO_SOURCE_ADAPTER_BY_ID.get(sourceId)
  if(!adapter)throw new MarketplaceError('CONFIGURATION_ERROR',`Aucun adaptateur n’est enregistré pour ${sourceId}.`)
  return adapter
}

function assertCapability(descriptor:StudioSourceDescriptor,capability:StudioSourceCapability){
  if(!descriptor.capabilities[capability])throw new MarketplaceError('VALIDATION_ERROR',`La source ${descriptor.id} ne supporte pas la capacité ${capability}.`)
}

function normalizeInput(input:StudioSourceSearchInput,context:MarketplaceRequestContext):StudioSourceSearchInput{
  const requestedTerritory=input.context?.territoryId??context.territoryId
  if(context.territoryId&&requestedTerritory&&requestedTerritory!==context.territoryId){
    throw new MarketplaceError('PERMISSION_DENIED','Ce territoire est hors du périmètre de votre session Marketplace.')
  }
  return{
    ...input,
    context:{
      locale:input.context?.locale||context.locale,
      territoryId:requestedTerritory,
      audienceId:input.context?.audienceId??null,
    },
  }
}

export function listAuthorizedStudioSources(context:MarketplaceRequestContext){
  return STUDIO_SOURCE_DESCRIPTORS.filter((descriptor)=>hasMarketplacePermission(context,descriptor.governance.permission as MarketplacePermission))
}

export function getAuthorizedStudioSource(sourceId:string,context:MarketplaceRequestContext){
  const descriptor=descriptorOrThrow(sourceId)
  assertPermission(descriptor,context)
  return descriptor
}

export async function searchStudioSource(sourceId:string,input:StudioSourceSearchInput,context:MarketplaceRequestContext){
  const descriptor=descriptorOrThrow(sourceId)
  assertPermission(descriptor,context)
  assertCapability(descriptor,'search')
  return adapterOrThrow(sourceId).search(normalizeInput(input,context),context)
}

export async function browseStudioSource(sourceId:string,input:StudioSourceSearchInput,context:MarketplaceRequestContext){
  const descriptor=descriptorOrThrow(sourceId)
  assertPermission(descriptor,context)
  assertCapability(descriptor,'browse')
  const adapter=adapterOrThrow(sourceId)
  if(!adapter.browse)throw new MarketplaceError('VALIDATION_ERROR',`La source ${sourceId} ne fournit pas de navigation.`)
  return adapter.browse(normalizeInput(input,context),context)
}

export async function getStudioSourceEntity(sourceId:string,entityId:string,input:StudioSourceSearchInput,context:MarketplaceRequestContext){
  const descriptor=descriptorOrThrow(sourceId)
  assertPermission(descriptor,context)
  return adapterOrThrow(sourceId).getById(entityId,normalizeInput(input,context),context)
}

export async function validateStudioSourceReference(reference:StudioSourceReference,input:StudioSourceSearchInput,context:MarketplaceRequestContext):Promise<StudioSourceValidation>{
  const descriptor=getStudioSourceDescriptor(reference.sourceId)
  if(!descriptor)return{status:'SOURCE_UNKNOWN',reference,reason:'Source non enregistrée.'}
  if(!hasMarketplacePermission(context,descriptor.governance.permission as MarketplacePermission))return{status:'NOT_AUTHORIZED',reference,reason:'Permission insuffisante.'}
  const adapter=STUDIO_SOURCE_ADAPTER_BY_ID.get(reference.sourceId)
  if(!adapter)return{status:'UNSUPPORTED',reference,reason:'Adaptateur absent.'}
  let normalized:StudioSourceSearchInput
  try{normalized=normalizeInput(input,context)}catch{return{status:'NOT_AUTHORIZED',reference,reason:'Contexte territorial non autorisé.'}}
  if(adapter.validateSelection)return adapter.validateSelection(reference.entityId,normalized,context)
  const entity=await adapter.getById(reference.entityId,normalized,context)
  if(!entity)return{status:'NOT_FOUND',reference,reason:'Entité introuvable.'}
  const status=String(entity.status||'').toLowerCase()
  if(['archived','deleted','disabled'].includes(status))return{status:'DISABLED',reference,entity,reason:`Statut ${status}.`}
  if(descriptor.governance.publicationAware&&['draft','review','in_review','submitted'].includes(status))return{status:'NOT_PUBLISHED',reference,entity,reason:`Statut ${status}.`}
  return{status:'VALID',reference,entity}
}
