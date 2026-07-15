
export function snoozeDate(hours:number){
  return new Date(Date.now()+hours*3600000).toISOString()
}

export function buildOutcomeLog(outcome:string, note?:string){
  return {
    outcome,
    note: note || '',
    timestamp: new Date().toISOString()
  }
}

export function escalationPayload(reason:string){
  return {
    escalated:true,
    reason,
    at:new Date().toISOString()
  }
}
