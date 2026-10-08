import type { StudioSourceDescriptor, StudioSourceEntity, StudioSourceReference, StudioSourceValidationStatus } from '@/angelcare-marketplace/studio-source-registry/types'

export type UniversalPickerMode='single'|'multiple'
export type UniversalPickerState='idle'|'loading'|'ready'|'empty'|'denied'|'error'

export interface UniversalPickerContext{
  locale?:'fr'|'en'|'ar'
  territoryId?:string|null
  audienceId?:string|null
}

export interface UniversalPickerFilterOption{
  label:string
  value:string
}

export interface UniversalPickerFilter{
  key:string
  label:string
  value?:string
  options:UniversalPickerFilterOption[]
}

export interface UniversalPickerValueOption{
  sourceId:string
  entityId:string
}

export interface UniversalPickerSelection{
  reference:StudioSourceReference
  entity?:StudioSourceEntity
  validationStatus?:StudioSourceValidationStatus
}

export interface UniversalPickerProps{
  sourceId?:string
  allowedSources?:string[]
  mode?:UniversalPickerMode
  value:StudioSourceReference|StudioSourceReference[]|string|null|undefined
  onChange:(value:StudioSourceReference|StudioSourceReference[]|null)=>void
  label?:string
  description?:string
  required?:boolean
  disabled?:boolean
  context?:UniversalPickerContext
  filters?:UniversalPickerFilter[]
  legacyValueField?:string
  adminBridge?:boolean
}

export interface PickerApiEnvelope<T>{
  data?:T
  error?:{message?:string;code?:string}
  requestId?:string
}

export interface PickerSourceListPayload{sources:StudioSourceDescriptor[]}
export interface PickerSearchPayload{
  sourceId:string
  items:StudioSourceEntity[]
  nextCursor:string|null
  total?:number
}
