import { CASE_TRANSITIONS,INCIDENT_TRANSITIONS } from '../constants'
export function clamp(value:number,min=0,max=100){return Math.max(min,Math.min(max,Number.isFinite(value)?value:0))}
export function percentage(numerator:number,denominator:number){return denominator>0?Math.round((numerator/denominator)*10000)/100:null}
export function durationVariance(plannedMinutes:number,actualMinutes:number){return actualMinutes-plannedMinutes}
export function classifyDurationVariance(plannedMinutes:number,actualMinutes:number){
 const delta=durationVariance(plannedMinutes,actualMinutes),ratio=plannedMinutes>0?Math.abs(delta)/plannedMinutes:1
 if(delta===0)return'exact'
 if(ratio<=.05)return'acceptable_operational_variance'
 if(ratio<=.15)return'material_variance'
 return'critical_variance'
}
export function compliance(required:number,completed:number){return required<=0?null:percentage(completed,required)}
export function severityScore(severity:string){return({info:5,opportunity:10,warning:30,material:55,blocking:80,critical:100} as Record<string,number>)[severity]??30}
export function assertCaseTransition(from:string,to:string,customerConfirmed=false){
 if(!(CASE_TRANSITIONS[from]||[]).includes(to))throw Object.assign(new Error(`Transition CX interdite: ${from} → ${to}`),{status:422,code:'INVALID_CX_TRANSITION'})
 if(['resolved','closed'].includes(to)&&!customerConfirmed)throw Object.assign(new Error('La confirmation client est obligatoire avant résolution ou clôture.'),{status:422,code:'CUSTOMER_CONFIRMATION_REQUIRED'})
}
export function assertIncidentTransition(from:string,to:string){
 if(!(INCIDENT_TRANSITIONS[from]||[]).includes(to))throw Object.assign(new Error(`Transition incident interdite: ${from} → ${to}`),{status:422,code:'INVALID_INCIDENT_TRANSITION'})
}
export function readinessState(controls:Array<{status:string;blocking:boolean}>){
 const failed=controls.filter(x=>x.blocking&&['failed','blocked'].includes(x.status)).length
 const passed=controls.filter(x=>x.status==='passed').length
 if(failed)return{status:'blocked',passed,total:controls.length,failed}
 if(controls.length&&passed===controls.length)return{status:'ready',passed,total:controls.length,failed:0}
 return{status:'not_ready',passed,total:controls.length,failed:0}
}
export function healthState(verified:boolean,state:string){
 if(!verified&&state==='healthy')throw Object.assign(new Error('Un contrôle sans preuve vérifiée ne peut pas être Healthy.'),{status:422,code:'HEALTH_EVIDENCE_REQUIRED'})
 return state
}
