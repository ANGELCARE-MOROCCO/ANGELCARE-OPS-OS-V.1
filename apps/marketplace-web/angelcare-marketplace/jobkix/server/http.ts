import { JobkixFault, type FaultCode } from '../contracts';
import { object } from '../validation';
const CODES: readonly FaultCode[] = ['INVALID_INPUT','AUTHENTICATION_REQUIRED','EMAIL_UNCONFIRMED','FORBIDDEN','ACCOUNT_RESTRICTED','NOT_FOUND','VERSION_CONFLICT','IDEMPOTENCY_CONFLICT','VACANCY_UNAVAILABLE','ALREADY_APPLIED','DOCUMENT_NOT_READY','INVALID_TRANSITION','OFFER_EXPIRED','DEPENDENCY_UNAVAILABLE','RATE_LIMITED'];
export const PRIVATE_HEADERS = { 'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow' };
export function dependencyError(error: unknown): JobkixFault {
  if (error instanceof JobkixFault) return error;
  if (error && typeof error==='object' && 'message' in error && typeof error.message==='string') {
    const code=CODES.find(code=>code===error.message);
    if(code)return new JobkixFault(code);
    if('code' in error && typeof error.code==='string') {
      if(['22P02','23502','23514','22007','22008'].includes(error.code))return new JobkixFault('INVALID_INPUT');
      if(['40001','40P01'].includes(error.code))return new JobkixFault('VERSION_CONFLICT');
    }
  }
  return new JobkixFault('DEPENDENCY_UNAVAILABLE');
}
export function failure(error: unknown): Response {
  const fault=dependencyError(error);
  const status=fault.code==='AUTHENTICATION_REQUIRED'?401:['FORBIDDEN','EMAIL_UNCONFIRMED','ACCOUNT_RESTRICTED'].includes(fault.code)?403:fault.code==='NOT_FOUND'?404:fault.code==='RATE_LIMITED'?429:fault.code==='DEPENDENCY_UNAVAILABLE'?503:['VERSION_CONFLICT','IDEMPOTENCY_CONFLICT','ALREADY_APPLIED'].includes(fault.code)?409:422;
  return Response.json({ok:false,error:{code:fault.code,fields:fault.fields}},{status,headers:PRIVATE_HEADERS});
}
export function requestOrigin(request: Request): string {
  const configured=process.env.JOBKIX_PUBLIC_ORIGIN;
  const parsed=new URL(configured||request.url);
  if(configured && (parsed.protocol!=='https:' || parsed.username || parsed.password || parsed.pathname!=='/' || parsed.search || parsed.hash))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
  return parsed.origin;
}
export function requireSameOrigin(request: Request): void {
  const origin=request.headers.get('origin');
  if(!origin || origin!==requestOrigin(request) || request.headers.get('sec-fetch-site')==='cross-site')throw new JobkixFault('FORBIDDEN');
}
export async function requestJson(request: Request, limit=200000): Promise<Record<string,unknown>> {
  requireSameOrigin(request);
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json') || !request.body)throw new JobkixFault('INVALID_INPUT');
  const reader=request.body.getReader();const chunks:Uint8Array[]=[];let size=0;
  try {
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new JobkixFault('INVALID_INPUT');}chunks.push(value);}
  }finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  try{return object(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));}catch(error){if(error instanceof JobkixFault)throw error;throw new JobkixFault('INVALID_INPUT');}
}
