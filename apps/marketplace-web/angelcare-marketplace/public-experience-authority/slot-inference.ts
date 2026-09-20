import type { ComponentData, Data } from '@puckeditor/core'
import type { PublicExperienceThemeSlot } from './types'

const text=(value:unknown)=>typeof value==='string'?value.toLowerCase():''
const blockId=(component:ComponentData,index:number)=>String((component.props as Record<string,unknown>)?.id||`${component.type}-${index+1}`)
function haystack(component:ComponentData){const props=(component.props||{}) as Record<string,unknown>;return [component.type,props.title,props.eyebrow,props.lead,props.body].map(text).join(' ')}
function slotFor(component:ComponentData,index:number):PublicExperienceThemeSlot|null{
  const hay=haystack(component),type=String(component.type||'')
  const id=blockId(component,index)
  if(index===0||type==='hero'||/\bhero\b|bienvenue|découvr|discover/.test(hay))return{blockId:id,slot:'hero',confidence:index===0?0.82:0.94,reason:'Premier bloc / langage hero détecté.'}
  if(type==='category_grid'||/catégor|univers|rayon|department/.test(hay))return{blockId:id,slot:'facets',confidence:0.72,reason:'Navigation/facettes détectées.'}
  if(type==='collection_rail'||/collection/.test(hay))return{blockId:id,slot:index%3===0?'collection_1':'collection_0',confidence:0.84,reason:'Rail collection détecté.'}
  if(type==='product_grid'||/best|populaire|featured|sélection|tendance|flash|offre|nouveaut/.test(hay))return{blockId:id,slot:/featured|sélection|flash|best|populaire|tendance/.test(hay)?'featured_items':'inventory_items',confidence:0.9,reason:'Bloc commerce détecté.'}
  if(type==='trust_strip'||/confiance|trust|garantie|sécur/.test(hay))return{blockId:id,slot:'trust',confidence:0.9,reason:'Preuve/trust détecté.'}
  if(index>5&&/cta|rejoindre|commencer|contact|réserver|acheter|s'inscrire/.test(hay))return{blockId:id,slot:'final_cta',confidence:0.7,reason:'CTA de clôture détecté.'}
  return null
}
export function inferPublicExperienceThemeSlots(data:Data):PublicExperienceThemeSlot[]{return (Array.isArray(data.content)?data.content:[]).map(slotFor).filter((row):row is PublicExperienceThemeSlot=>Boolean(row))}
