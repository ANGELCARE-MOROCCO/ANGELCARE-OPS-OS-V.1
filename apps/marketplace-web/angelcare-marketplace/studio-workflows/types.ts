import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'
import type { StudioAttributionInput } from '@/angelcare-marketplace/studio-attribution/types'

export type StudioWorkflowExecution='public_inquiry'|'conversion'|'family_request'|'b2b_diagnostic'
export type StudioWorkflowFieldType='text'|'email'|'tel'|'textarea'|'number'|'date'|'time'|'select'|'checkbox'
export type StudioWorkflowValue=string|number|boolean|null

export interface StudioWorkflowFieldOption{label:string;value:string}
export interface StudioWorkflowFieldDescriptor{
  key:string
  label:string
  type:StudioWorkflowFieldType
  required?:boolean
  placeholder?:string
  minLength?:number
  maxLength?:number
  min?:number
  max?:number
  options?:readonly StudioWorkflowFieldOption[]
  autocomplete?:string
}

export interface StudioWorkflowDescriptor{
  id:string
  version:1
  label:string
  description:string
  execution:StudioWorkflowExecution
  actionId:string
  targetRequired:boolean
  targetSources:readonly string[]
  canonicalEngine:string
  creates:string
  adminDestination:string
  audience?:'family'|'school'|'hotel'|'clinic'|'corporate'|'provider'|'supplier'|'academy'|'partner_os'|'other'
  conversionJourney?:'service_booking'|'academy_enrollment'|'b2b_quotation'|'partner_subscription'
  b2bVertical?:'establishment'|'hospitality'|'health_partner'|'corporate'
  authenticated?:boolean
  fields:readonly StudioWorkflowFieldDescriptor[]
  consentKeys:readonly string[]
}

export interface StudioWorkflowReference{
  version:1
  workflowId:string
  target?:StudioSourceReference|null
}

export interface StudioWorkflowSubmissionInput{
  reference:StudioWorkflowReference
  locale:'fr'|'en'|'ar'
  sourceRoute:string
  territoryCode?:string|null
  visitorReference?:string|null
  idempotencyKey?:string|null
  attribution?:StudioAttributionInput
  values:Record<string,StudioWorkflowValue|StudioWorkflowValue[]>
}

export interface StudioWorkflowSubmissionResult{
  workflowId:string
  status:'SUBMITTED'|'HANDOVER_PENDING'|'AUTH_REQUIRED'
  publicReference:string|null
  canonicalObjectType:string|null
  adminDestination:string
  nextHref:string|null
  message:string
}
