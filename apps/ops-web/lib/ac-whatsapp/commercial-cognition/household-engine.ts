import { hasAny, normalizeText } from './text'
import type { CommercialSignals } from './types'

export type HouseholdContext={applicable:boolean;needClass:string;recurringPotential:number;safeguards:string[];qualificationNeeds:string[]}
export function inferHouseholdContext(input:{messages:any[];signals:CommercialSignals}):HouseholdContext{
  if(input.signals.customerType!=='b2c')return {applicable:false,needClass:'none',recurringPotential:0,safeguards:[],qualificationNeeds:[]}
  const text=normalizeText(input.messages.map(r=>r.body||r.caption||'').join(' '))
  const special=hasAny(text,['autisme','autism','besoins speciaux','besoins spéciaux','handicap','trisomie','special needs'])
  const postpartum=hasAny(text,['postpartum','apres accouchement','après accouchement','nouveau ne','nouveau-né','newborn'])
  const recurring=hasAny(text,['tous les jours','chaque jour','hebdomadaire','semaine','régulier','regulier','recurring','mensuel'])
  const needClass=special?'special_child_support':postpartum?'postpartum_support':'home_childcare'
  const safeguards=special?['no_medical_claims','qualify_support_requirements','human_escalation_for_health_or_safety_uncertainty']:postpartum?['gentle_intensity','no_health_claims','reduce_cognitive_load']:[]
  const qualificationNeeds=special?['practical_support_needs','schedule','location','required_experience','safety_constraints']:['schedule','location','child_age_or_service_context','urgency']
  return {applicable:true,needClass,recurringPotential:recurring?.85:.45,safeguards,qualificationNeeds}
}
