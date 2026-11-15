import 'server-only';
import {randomUUID} from 'node:crypto';
import {JobkixFault} from '../contracts';
import {PRIVATE_HEADERS} from '../server/http';

export type SupplyBlocker={code:string;field?:string;current?:number;required?:number};
export class SupplyError extends Error {
 constructor(public readonly code:string, public readonly status:number,
  public readonly blockers:SupplyBlocker[]=[],public readonly retryable=false) {
  super(code);this.name='SupplyError';
 }
}
const faultStatus=(code:string)=>code==='AUTHENTICATION_REQUIRED'?401:
 ['FORBIDDEN','EMAIL_UNCONFIRMED','ACCOUNT_RESTRICTED'].includes(code)?403:
 code==='NOT_FOUND'?404:['VERSION_CONFLICT','IDEMPOTENCY_CONFLICT'].includes(code)?409:
 code==='DEPENDENCY_UNAVAILABLE'?503:422;
export function supplyFailure(error:unknown):Response {
 const requestId=randomUUID();
 const dependency=error instanceof Error&&(/Suppl(y|ies) (storage|migration) error:|Missing Supabase server env values:|ECONNREFUSED|ETIMEDOUT|fetch failed|connect timeout/i.test(error.message));
 const code=error instanceof SupplyError?error.code:
  error instanceof JobkixFault?error.code:dependency?'DEPENDENCY_UNAVAILABLE':'INTERNAL_ERROR';
 const status=error instanceof SupplyError?error.status:
  error instanceof JobkixFault?faultStatus(error.code):dependency?503:500;
 const blockers=error instanceof SupplyError?error.blockers:[];
 const retryable=error instanceof SupplyError?error.retryable:dependency;
 // Secrets and Supabase query strings are kept server-side, never sent to the client.
 console.error('[JOBKIX_SUPPLY_FAILURE]',{requestId,code,status,
  detail:error instanceof Error?error.message:String(error)});
 return Response.json({ok:false,error:{code,requestId,retryable,blockers,
  message:code==='PUBLICATION_NOT_ELIGIBLE'?'This vacancy is not ready to publish. Review the requirements below.':
   code==='VERSION_CONFLICT'?'This vacancy changed. Refresh it before trying again.':
   code==='DEPENDENCY_UNAVAILABLE'?'The supply storage service is unavailable. No success is assumed.':
   code==='FORBIDDEN'?'You do not have permission to perform this operation.':
   code==='INTERNAL_ERROR'?'The operation could not be completed. Reference the request ID for support.':
   code.replaceAll('_',' ').toLowerCase()}},{status,headers:{...PRIVATE_HEADERS,'X-Request-ID':requestId}});
}
export function assertDecisionResult(value:unknown):Record<string,unknown> {
 if(!value||typeof value!=='object'||Array.isArray(value))throw new SupplyError('DEPENDENCY_UNAVAILABLE',503,[],true);
 const result=value as Record<string,unknown>;
 if(result.ok===true)return result;
 const code=String(result.code||'DEPENDENCY_UNAVAILABLE');
 if(code==='PUBLICATION_NOT_ELIGIBLE'){
  const assessment=result.assessment&&typeof result.assessment==='object'?result.assessment as Record<string,unknown>:{};
  const reasons=Array.isArray(assessment.reasons)?assessment.reasons:[];
  throw new SupplyError(code,422,reasons.map(x=>({code:String(x)})));
 }
 if(code==='VERSION_CONFLICT'||code==='IDEMPOTENCY_CONFLICT')throw new SupplyError(code,409,[],true);
 if(code==='NOT_FOUND')throw new SupplyError(code,404);
 if(['INVALID_TRANSITION','AUTO_PUBLICATION_NOT_AUTHORIZED','INVALID_INPUT','PROVENANCE_FIELD_IMMUTABLE','EDITORIAL_SOURCE_EVIDENCE_REQUIRED'].includes(code))throw new SupplyError(code,422);
 throw new SupplyError('DEPENDENCY_UNAVAILABLE',503,[],true);
}
