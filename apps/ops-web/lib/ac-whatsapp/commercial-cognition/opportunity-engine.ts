import type { CognitionState } from './types'
export function buildOpportunityVector(state:CognitionState){
  const s=state.signals;const best=state.offers[0]||null
  const immediate=s.commercialPotential*s.conversionProbability
  const expansion=Math.max(0,...state.offers.filter(o=>o.timing==='after_conversion'||o.timing==='after_satisfaction'||o.timing==='seed_later').map(o=>o.fit*.65))
  const strategic=s.customerType==='b2b'?.72:.42
  const priority=Math.max(0,Math.min(1,immediate*.55+expansion*.2+strategic*.15+s.emotional.urgency*.1))
  return {immediatePotential:immediate,conversionProbability:s.conversionProbability,expansionPotential:expansion,strategicValue:strategic,priority,bestOfferKey:best?.key||null,bestOfferFit:best?.fit||0}
}
