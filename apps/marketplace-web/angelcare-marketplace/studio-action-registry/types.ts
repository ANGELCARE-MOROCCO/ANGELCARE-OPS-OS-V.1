import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'

export type StudioActionCategory='navigation'|'commerce'|'conversion'|'workflow'|'external'
export type StudioActionExecutionMode='route'|'workflow'|'external'
export type StudioActionValidation='target'|'publication'|'availability'|'pricing'|'consent'|'basket_context'
export type StudioActionResolutionStatus='READY'|'INVALID'|'TARGET_REQUIRED'|'TARGET_UNSUPPORTED'|'TARGET_NOT_FOUND'|'TARGET_NOT_PUBLISHED'|'DISABLED'|'WORKFLOW_REQUIRED'|'CONTEXT_REQUIRED'|'UNSAFE_EXTERNAL_URL'

export interface StudioActionDescriptor{
  id:string
  version:1
  p00ActionId:string
  label:string
  description:string
  category:StudioActionCategory
  executionMode:StudioActionExecutionMode
  targetRequired:boolean
  targetSources:readonly string[]
  canonicalEngine:string
  creates:string|null
  adminDestination:string|null
  validations:readonly StudioActionValidation[]
  p07WorkflowRequired?:boolean
  defaultNewWindow?:boolean
}

export interface StudioActionReference{
  version:1
  actionId:string
  target?:StudioSourceReference|null
  externalUrl?:string|null
  newWindow?:boolean
}

export interface StudioResolvedAction{
  status:StudioActionResolutionStatus
  actionId:string
  label:string
  href:string|null
  external:boolean
  newWindow:boolean
  canonicalEngine:string
  creates:string|null
  adminDestination:string|null
  target?:StudioSourceReference|null
  reason?:string
  validations:readonly StudioActionValidation[]
}
