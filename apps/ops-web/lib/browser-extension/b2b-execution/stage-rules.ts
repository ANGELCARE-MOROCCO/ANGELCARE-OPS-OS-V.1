import type { B2BExecutionStage, StageFacts } from './types'

export const B2B_EXECUTION_STAGES: Array<{ key:B2BExecutionStage; label:string; order:number }> = [
  ['new_target','New target',10],['research','Research',20],['qualified','Qualified',30],['initial_contact','Initial contact',40],
  ['discovery','Discovery',50],['meeting_scheduled','Meeting scheduled',60],['needs_confirmed','Needs confirmed',70],
  ['solution_design','Solution design',80],['proposal_preparation','Proposal preparation',90],['proposal_sent','Proposal sent',100],
  ['negotiation','Negotiation',110],['commercial_agreement','Commercial agreement',120],['contract_pending','Contract pending',130],
  ['payment_pending','Payment pending',140],['activation_preparation','Activation preparation',150],['won','Won',160],
  ['lost','Lost',170],['nurture','Nurture',180],
].map(([key,label,order]) => ({ key:key as B2BExecutionStage, label:String(label), order:Number(order) }))

export const STAGE_ORDER = new Map(B2B_EXECUTION_STAGES.map((row) => [row.key, row.order]))

export function coreProspectStatus(stage:B2BExecutionStage){
  if (['new_target','research'].includes(stage)) return 'New'
  if (stage === 'qualified') return 'Qualified'
  if (stage === 'initial_contact') return 'Contacted'
  if (['discovery','meeting_scheduled','needs_confirmed','solution_design'].includes(stage)) return 'Interested'
  if (['proposal_preparation','proposal_sent'].includes(stage)) return 'Proposal Sent'
  if (stage === 'negotiation') return 'Negotiation'
  if (['commercial_agreement','contract_pending','payment_pending'].includes(stage)) return 'Pilot Agreed'
  if (['activation_preparation','won'].includes(stage)) return 'Signed Partner'
  if (stage === 'lost') return 'Lost'
  return 'Nurture'
}

export function validateStageChange(current:B2BExecutionStage,target:B2BExecutionStage,facts:StageFacts){
  if (current === target) return { ok:false as const, missing:['The opportunity is already at this stage.'] }
  const missing:string[]=[]
  if (target === 'qualified' && !facts.hasNeed) missing.push('A qualified business need')
  if (target === 'initial_contact' && !facts.hasContact) missing.push('At least one valid contact')
  if (target === 'discovery' && !facts.hasContact) missing.push('A contact who can participate in discovery')
  if (target === 'meeting_scheduled' && !facts.hasMeeting) missing.push('A scheduled meeting')
  if (target === 'needs_confirmed' && !facts.hasMeetingOutcome) missing.push('A structured discovery or meeting outcome')
  if (target === 'solution_design' && (!facts.hasNeed || !facts.hasScope)) missing.push('Confirmed need and preliminary scope')
  if (target === 'proposal_sent' && !facts.hasProposal) missing.push('A proposal document or proposal record')
  if (target === 'negotiation' && (!facts.hasProposal || !facts.hasDecisionMaker)) missing.push('Proposal plus identified decision authority')
  if (target === 'commercial_agreement' && !facts.hasCommercialAgreement) missing.push('Documented commercial agreement')
  if (target === 'contract_pending' && !facts.hasCommercialAgreement) missing.push('Commercial agreement before contract preparation')
  if (target === 'payment_pending' && !facts.hasContract) missing.push('Accepted or signed contract')
  if (target === 'activation_preparation' && (!facts.hasContract || !facts.hasPayment)) missing.push('Contract and required payment confirmation')
  if (target === 'won' && (!facts.hasContract || !facts.hasPayment || !facts.activationReady)) missing.push('Contract, payment and activation readiness')
  if (target === 'lost' && !facts.reason?.trim()) missing.push('A documented loss reason')
  return missing.length ? { ok:false as const, missing } : { ok:true as const, missing:[] }
}
