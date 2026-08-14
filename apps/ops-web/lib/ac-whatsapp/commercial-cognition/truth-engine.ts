import { normalizeText } from './text'

export type TruthGate={ok:boolean;violations:string[];requiresHuman:boolean}
export function validateCommercialTruth(input:{responseText?:string|null;knowledgeEntities:any[];offer:any|null}) : TruthGate{
  const text=normalizeText(input.responseText||'')
  const violations:string[]=[]
  const knowledge=JSON.stringify(input.knowledgeEntities||[]).toLowerCase()
  const mentionsPrice=/\b\d+[\s.,]?\d*\s*(dh|mad|dhs|€|eur|euro|euros)\b/i.test(input.responseText||'')
  const claimsAvailability=/\b(disponible immédiatement|disponible aujourd'hui|garanti disponible|availability confirmed)\b/i.test(input.responseText||'')
  if(mentionsPrice&&!knowledge.includes('price')&&!knowledge.includes('prix')&&!knowledge.includes('tarif'))violations.push('UNSUPPORTED_PRICE_CLAIM')
  if(claimsAvailability&&!knowledge.includes('availability')&&!knowledge.includes('disponibil'))violations.push('UNSUPPORTED_AVAILABILITY_CLAIM')
  if(text.includes('garantie 100%')||text.includes('100% garanti'))violations.push('UNSUPPORTED_GUARANTEE')
  return {ok:violations.length===0,violations,requiresHuman:violations.length>0}
}
