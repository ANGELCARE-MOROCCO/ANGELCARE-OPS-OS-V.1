import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'
import { STUDIO_TEMPLATE_ASSIGNMENT_VERSION, STUDIO_TEMPLATE_PRECEDENCE, type StudioTemplateAssignment, type StudioTemplateAssignmentScope, type StudioTemplateReference } from './types'

export const STUDIO_TEMPLATE_ASSIGNMENT_KEY='studio_template_assignment'
export const STUDIO_TEMPLATE_DEFAULT_CONFIG_KEY='studio.template.default'
export const STUDIO_TEMPLATE_FAMILY_CONFIG_PREFIX='studio.template.family.'
export const STUDIO_TEMPLATE_PLACEMENT_CONFIG_PREFIX='studio.template.placement.'

const record=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}
const text=(value:unknown)=>typeof value==='string'?value.trim():''

export function normalizeTemplateReference(value:unknown):StudioTemplateReference|null{
  const row=record(value)
  const sourceId=text(row.sourceId),entityId=text(row.entityId)
  return sourceId==='content.templates'&&entityId?{sourceId:'content.templates',entityId}:null
}

export function normalizeSourceReference(value:unknown):StudioSourceReference|null{
  const row=record(value),sourceId=text(row.sourceId),entityId=text(row.entityId)
  return sourceId&&entityId?{sourceId,entityId}:null
}

export function parseStudioTemplateAssignment(value:unknown,scope?:StudioTemplateAssignmentScope):StudioTemplateAssignment|null{
  const row=record(value),template=normalizeTemplateReference(row.template)
  if(!template)return null
  const rawScope=text(row.scope) as StudioTemplateAssignmentScope
  const resolvedScope=scope||rawScope
  if(!STUDIO_TEMPLATE_PRECEDENCE.includes(resolvedScope))return null
  return{version:STUDIO_TEMPLATE_ASSIGNMENT_VERSION,scope:resolvedScope,template,target:normalizeSourceReference(row.target),familyKey:text(row.familyKey)||null,placementId:text(row.placementId)||null,enabled:row.enabled!==false}
}

export function assignmentFromContainer(container:unknown,scope:StudioTemplateAssignmentScope):StudioTemplateAssignment|null{
  return parseStudioTemplateAssignment(record(container)[STUDIO_TEMPLATE_ASSIGNMENT_KEY],scope)
}

export function containerWithAssignment(container:unknown,assignment:StudioTemplateAssignment|null){
  const current={...record(container)}
  if(assignment)current[STUDIO_TEMPLATE_ASSIGNMENT_KEY]=assignment
  else delete current[STUDIO_TEMPLATE_ASSIGNMENT_KEY]
  return current
}

export function safeFamilyKey(value:unknown){return text(value).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120)}
export function safePlacementId(value:unknown){return text(value).replace(/[^a-zA-Z0-9_-]+/g,'').slice(0,140)}
export function familyConfigKey(familyKey:string){return `${STUDIO_TEMPLATE_FAMILY_CONFIG_PREFIX}${safeFamilyKey(familyKey)}`}
export function placementConfigKey(placementId:string){return `${STUDIO_TEMPLATE_PLACEMENT_CONFIG_PREFIX}${safePlacementId(placementId)}`}
