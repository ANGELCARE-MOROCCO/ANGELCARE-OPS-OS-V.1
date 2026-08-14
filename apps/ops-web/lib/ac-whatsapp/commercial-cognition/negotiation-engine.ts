import { hasAny, normalizeText } from './text'
import type { CommercialSignals } from './types'

export type NegotiationState={active:boolean;pressure:number;concessionsRequested:string[];authorityRequired:boolean;strategy:string;guardrails:string[]}

export function analyzeNegotiation(text:string,signals:CommercialSignals):NegotiationState{
  const n=normalizeText(text)
  const discount=hasAny(n,['remise','discount','reduction','réduction','moins cher','geste commercial'])
  const terms=hasAny(n,['conditions','contrat','engagement','paiement','payment','acompte','invoice','facture'])
  const competitor=hasAny(n,['concurrent','autre prestataire','ailleurs','offre moins chère','offre moins chere'])
  const concessionsRequested=[discount?'discount':'',terms?'terms':'',competitor?'competitive_match':''].filter(Boolean)
  const active=concessionsRequested.length>0||signals.buyingReadiness==='decision_ready'
  const pressure=Math.min(1,(discount?.45:0)+(terms?.25:0)+(competitor?.25:0)+(signals.buyingReadiness==='decision_ready'?.15:0))
  return {active,pressure,concessionsRequested,authorityRequired:discount||terms,strategy:discount?'protect_margin_and_trade_concession_for_commitment':competitor?'reframe_value_before_matching':terms?'clarify_terms_and_authority':'hold_value_and_close',guardrails:['never_invent_discount','never_modify_contract_terms_without_authority','trade_value_for_commitment_not_unilateral_concession']}
}
