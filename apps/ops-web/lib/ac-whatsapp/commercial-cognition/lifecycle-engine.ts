import type { CommercialSignals } from './types'

const order=['acquisition','discovery','qualification','trust','fit','evaluation','objection','decision','close','onboarding','activation','satisfaction','retention','renewal','expansion','referral','recovery','winback']
export function lifecyclePosition(signals:CommercialSignals){
  const raw=signals.journeyStage
  const map:Record<string,string>={aware:'acquisition',curious:'discovery',engaged:'qualification',qualified:'fit',solution_fit:'fit',evaluating:'evaluation',closing:'close',converted:'onboarding',active_customer:'satisfaction',satisfaction:'satisfaction',renewal:'renewal',expansion:'expansion',recovery:'recovery',referral:'referral'}
  const stage=map[raw]||raw||'discovery'
  const index=Math.max(0,order.indexOf(stage))
  const next=order[Math.min(order.length-1,index+1)]
  return {stage,index,next,progress:index/(order.length-1),allowedNext:[next,stage==='satisfaction'?'retention':null,stage==='retention'?'expansion':null].filter(Boolean)}
}
export function lifecycleObjective(signals:CommercialSignals){
  const p=lifecyclePosition(signals)
  if(signals.satisfactionRisk>.6)return 'relationship_recovery'
  if(p.stage==='onboarding'||p.stage==='activation')return 'successful_activation'
  if(p.stage==='satisfaction')return 'confirm_satisfaction_and_prevent_churn'
  if(p.stage==='retention'||p.stage==='renewal')return 'retain_and_renew'
  if(p.stage==='expansion')return 'expand_relevant_value'
  if(p.stage==='referral')return 'request_appropriate_referral'
  return 'advance_commercial_journey'
}
