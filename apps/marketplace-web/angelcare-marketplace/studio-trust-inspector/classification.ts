import type { StudioTrustSeverity,StudioTrustStatus } from './types'
export function studioTrustSeverityForSource(status:string):StudioTrustSeverity{return status==='VALID'?'info':['NOT_PUBLISHED'].includes(status)?'warning':'blocker'}
export function studioTrustStatus(blockers:number,warnings:number):StudioTrustStatus{return blockers>0?'BLOCKED':warnings>0?'ATTENTION':'READY'}
export function studioTrustRuntimeSeverity(status:string,fallbackReason:string|null):StudioTrustSeverity{if(status==='STUDIO_READY')return'info';if(status==='NOT_RUN')return'info';if(status==='FALLBACK_NATIVE'&&fallbackReason==='NO_RESOLVED_TEMPLATE')return'warning';return'blocker'}
