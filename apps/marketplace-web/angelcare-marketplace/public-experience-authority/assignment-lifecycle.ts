import {createHash} from 'node:crypto'
import type {PublicExperienceAssignmentLifecycle} from './types'

export const PEA_DEFAULT_LIFECYCLE:PublicExperienceAssignmentLifecycle={mode:'immediate',startsAt:null,endsAt:null,rolloutPercent:100,autoFallback:true}

const clamp=(value:number)=>Math.max(0,Math.min(100,Math.round(Number.isFinite(value)?value:100)))
const stamp=(value:string|null|undefined)=>{if(!value)return null;const ms=Date.parse(value);return Number.isFinite(ms)?ms:null}

export function normalizeAssignmentLifecycle(value:Partial<PublicExperienceAssignmentLifecycle>|null|undefined):PublicExperienceAssignmentLifecycle{
 const mode=value?.mode==='scheduled'||value?.mode==='canary'?''+value.mode:'immediate'
 return{mode:mode as PublicExperienceAssignmentLifecycle['mode'],startsAt:value?.startsAt||null,endsAt:value?.endsAt||null,rolloutPercent:mode==='canary'?clamp(Number(value?.rolloutPercent??10)):100,autoFallback:true}
}

export function validateAssignmentLifecycle(value:Partial<PublicExperienceAssignmentLifecycle>|null|undefined):string[]{
 const v=normalizeAssignmentLifecycle(value),errors:string[]=[],start=stamp(v.startsAt),end=stamp(v.endsAt)
 if(v.mode==='scheduled'&&!v.startsAt&&!v.endsAt)errors.push('Une assignation planifiée requiert un début ou une fin.')
 if(v.startsAt&&start===null)errors.push('Date de début invalide.')
 if(v.endsAt&&end===null)errors.push('Date de fin invalide.')
 if(start!==null&&end!==null&&end<=start)errors.push('La fin doit être postérieure au début.')
 if(v.mode==='canary'&&(v.rolloutPercent<1||v.rolloutPercent>100))errors.push('Le rollout canary doit être compris entre 1 et 100%.')
 return errors
}

function cohortBucket(seed:string){const h=createHash('sha256').update(seed).digest();return ((h[0]<<8)|h[1])%100}

export interface PublicExperienceLifecycleDecision {active:boolean;state:'ACTIVE'|'SCHEDULED'|'EXPIRED'|'CANARY_INCLUDED'|'CANARY_EXCLUDED'|'DISABLED';reason:string;rolloutPercent:number}
export function evaluateAssignmentLifecycle(lifecycleInput:PublicExperienceAssignmentLifecycle|null|undefined,seed:string,nowMs=Date.now()):PublicExperienceLifecycleDecision{
 const lifecycle=normalizeAssignmentLifecycle(lifecycleInput),start=stamp(lifecycle.startsAt),end=stamp(lifecycle.endsAt)
 if(start!==null&&nowMs<start)return{active:false,state:'SCHEDULED',reason:`Activation prévue ${new Date(start).toISOString()}.`,rolloutPercent:lifecycle.rolloutPercent}
 if(end!==null&&nowMs>=end)return{active:false,state:'EXPIRED',reason:`Assignation expirée ${new Date(end).toISOString()}.`,rolloutPercent:lifecycle.rolloutPercent}
 if(lifecycle.mode==='canary'){
  const bucket=cohortBucket(seed);const active=bucket<lifecycle.rolloutPercent
  return{active,state:active?'CANARY_INCLUDED':'CANARY_EXCLUDED',reason:active?`Cohorte ${bucket} incluse dans rollout ${lifecycle.rolloutPercent}%.`:`Cohorte ${bucket} hors rollout ${lifecycle.rolloutPercent}%.`,rolloutPercent:lifecycle.rolloutPercent}
 }
 return{active:true,state:'ACTIVE',reason:lifecycle.mode==='scheduled'?'Fenêtre planifiée active.':'Assignation immédiate active.',rolloutPercent:100}
}
