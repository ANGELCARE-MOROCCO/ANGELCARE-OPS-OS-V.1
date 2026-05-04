export function decideNextAction(context:any){
if(context.ceo_override)return 'CEO_ACTION'
if(context.risk_level==='high')return 'RISK_BLOCK'
if(context.payment_pending)return 'COLLECT_PAYMENT'
if(context.stage==='negotiation')return 'FORCE_CLOSE'
return 'FOLLOW_AUTOPILOT'}