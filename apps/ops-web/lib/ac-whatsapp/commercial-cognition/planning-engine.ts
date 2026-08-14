import type { CognitionState, Goal } from './types'

export type PlanStep={key:string;objective:string;status:'ready'|'waiting'|'done'|'blocked';requires:string[];priority:number}

export function buildMultiTurnPlan(state:CognitionState,goal:Goal):PlanStep[]{
  const steps:PlanStep[]=[]
  const s=state.signals
  if(s.customerType==='b2b'&&s.authorityConfidence<.55)steps.push({key:'MAP_AUTHORITY',objective:'identify decision authority and buying committee',status:'ready',requires:[],priority:100})
  if(['unqualified','early','exploring'].includes(s.buyingReadiness))steps.push({key:'QUALIFY_NEED',objective:'understand concrete need, context and desired outcome',status:'ready',requires:[],priority:96})
  if(s.trustState==='fragile'||s.trustState==='low')steps.push({key:'BUILD_TRUST',objective:'reduce perceived risk with relevant verified proof',status:'ready',requires:[],priority:94})
  if(state.objections.observed.length)steps.push({key:'RESOLVE_OBJECTION',objective:'clarify and resolve objection root cause',status:state.objections.clarificationNeeded?'ready':'waiting',requires:['objection_root_cause'],priority:93})
  if(['evaluating','high_intent','decision_ready'].includes(s.buyingReadiness))steps.push({key:'VALIDATE_OFFER',objective:'confirm best-fit offer and boundaries',status:'ready',requires:['service_truth'],priority:91})
  if(['high_intent','decision_ready'].includes(s.buyingReadiness))steps.push({key:'SECURE_COMMITMENT',objective:s.customerType==='b2b'?'secure meeting/proposal/decision commitment':'secure booking/purchase next step',status:'ready',requires:['offer_fit'],priority:90})
  if(goal.type==='expansion')steps.push({key:'EXPANSION',objective:'identify relevant expansion only after primary objective stability',status:'waiting',requires:['primary_objective_stable'],priority:42})
  return steps.sort((a,b)=>b.priority-a.priority)
}
