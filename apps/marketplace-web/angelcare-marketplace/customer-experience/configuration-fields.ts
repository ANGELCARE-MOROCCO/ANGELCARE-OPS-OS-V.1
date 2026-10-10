import type {AdaptiveExperienceData} from '../category-native-experience/types'
import type {ExperienceFieldBlueprint} from '../category-native/types'
/** Offer policy/capacity/publication fields are descriptive, never customer form controls. */
export function customerConfigurationFields(data:AdaptiveExperienceData):ExperienceFieldBlueprint[] {
 const requestFields=new Set(['site_count','beneficiary_volume','objectives','budget_range_dh','target_start_date'])
 const optionFields=new Set(['available_days','activity_options','caregiver_language_options','recurrence_types','variant_languages','variant_colors'])
 const capabilityFields=new Set(['meal_support_enabled','bedtime_support_enabled','schoolwork_support_enabled'])
 const values={...data.item.experience_configuration,...Object.fromEntries(data.fieldValues.map(value=>[value.field.field_key,value.value]))}
 return data.schema.fields.filter(field=>field.public_visible).flatMap(field=>{
  if(requestFields.has(field.field_key)&&data.schema.configuration.base_family==='b2b')return [field]
  const published=values[field.field_key]
  if(optionFields.has(field.field_key)&&Array.isArray(published)){const options=published.filter((value):value is string=>typeof value==='string'&&Boolean(value.trim()));return options.length?[{...field,field_type:'multiselect' as const,allowed_values:options}]:[]}
  if(capabilityFields.has(field.field_key)&&published===true)return [field]
  return []
 })
}
export function customerSectionLabel(section:string,locale:'fr'|'en'|'ar') {const labels:Record<string,Record<'fr'|'en'|'ar',string>>={availability:{fr:'Vos jours préférés',en:'Your preferred days',ar:'أيامك المفضلة'},configuration:{fr:'Les activités et attentions choisies',en:'Your chosen activities and support',ar:'الأنشطة والمساندة المختارة'},recurrence:{fr:'Le rythme qui vous convient',en:'The rhythm that fits',ar:'الوتيرة المناسبة'},matching:{fr:'Vos préférences d’accompagnement',en:'Your support preferences',ar:'تفضيلات المساندة'},scope:{fr:'Le périmètre de votre projet',en:'Your project scope',ar:'نطاق مشروعك'},operations:{fr:'Votre contexte opérationnel',en:'Your operational context',ar:'سياقك التشغيلي'}};return labels[section]?.[locale]||(locale==='fr'?'Votre demande':locale==='ar'?'طلبك':'Your request')}
