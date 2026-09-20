import type { StudioSourceEntity, StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'

export function isStudioSourceReference(value:unknown):value is StudioSourceReference{
  if(!value||typeof value!=='object'||Array.isArray(value))return false
  const row=value as Record<string,unknown>
  return typeof row.sourceId==='string'&&Boolean(row.sourceId)&&typeof row.entityId==='string'&&Boolean(row.entityId)
}

export function normalizeSourceReferences(value:unknown):StudioSourceReference[]{
  if(Array.isArray(value))return value.filter(isStudioSourceReference)
  return isStudioSourceReference(value)?[value]:[]
}

export function exactLegacyEntity(items:StudioSourceEntity[],legacyValue:string,legacyValueField?:string):StudioSourceEntity|undefined{
  const wanted=legacyValue.trim()
  if(!wanted)return undefined
  return items.find(item=>{
    if(item.id===wanted||item.title===wanted||item.subtitle===wanted)return true
    if(legacyValueField&&String(item.metadata?.[legacyValueField]??'')===wanted)return true
    return Object.values(item.metadata||{}).some(value=>typeof value==='string'&&value===wanted)
  })
}
