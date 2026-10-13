import type {Fact} from './model'

export type IndicatorKind='age-min'|'age-max'|'material'|'dimensions'|'weight'|'language'|'format'|'contents'|'care'|'delivery'|'storage'|'level'|'generic'
export function indicatorKind(key:string):IndicatorKind {
  const k=key.toLowerCase()
  if(/^(?:minimum_age|age_min|minimum_age_years|age_from|age_minimum)$/.test(k))return 'age-min'
  if(/^(?:maximum_age|age_max|maximum_age_years|age_to|age_maximum)$/.test(k))return 'age-max'
  if(/material|matiere|fabric|composition/.test(k))return 'material'
  if(/dimension|measurement|size_cm/.test(k))return 'dimensions'
  if(/weight|poids/.test(k))return 'weight'
  if(/language|langue/.test(k))return 'language'
  if(/format|file_type|download/.test(k))return 'format'
  if(/contents|component|included|pack_count/.test(k))return 'contents'
  if(/delivery|shipping|lead_time|handover|access_instruction/.test(k))return 'delivery'
  if(/storage|rangement/.test(k))return 'storage'
  if(/care|maintenance|usage|preparation/.test(k))return 'care'
  if(/difficulty|level|niveau/.test(k))return 'level'
  return 'generic'
}
/** A numeric graphic never infers units, an age range or a product suitability claim. */
export function indicatorNumber(fact:Fact):string|null {
  if(!['age-min','age-max'].includes(indicatorKind(fact.key)))return null
  const v=fact.value.trim()
  return /^\d+(?:[.,]\d+)?$/.test(v)?v:null
}
