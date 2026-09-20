export interface PublicExperienceRuntimeSpan{name:string;durationMs:number;status:'PASS'|'WATCH'|'BLOCKED';detail:string}
export interface PublicExperienceRuntimeTrace{traceId:string;generatedAt:string;spans:PublicExperienceRuntimeSpan[];totalMs:number}
export function buildRuntimeTrace(traceId:string,spans:PublicExperienceRuntimeSpan[]):PublicExperienceRuntimeTrace{return{traceId,generatedAt:new Date().toISOString(),spans,totalMs:spans.reduce((sum,row)=>sum+Math.max(0,row.durationMs),0)}}
