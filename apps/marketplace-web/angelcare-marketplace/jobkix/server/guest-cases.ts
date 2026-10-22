import 'server-only';
import { randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { JobkixFault } from '../contracts';
import { getJobkixSession } from './identity';
import { object,text,integer } from '../validation';
import { guestAccessCode as token,guestMac,issueGuestCredential,readGuestCredential } from '../guest-credential';
import { guestCasePayload,guestDraft } from '../guest-case';
import { dependencyError } from './http';
const COOKIE='jobkix_guest_case_v1',COOKIE_PATH='/api/jobkix/cases/guest',AGE=30*86400;
function secret(){const value=process.env.JOBKIX_GUEST_CASE_SECRET||'';if(value.length<32)throw new JobkixFault('DEPENDENCY_UNAVAILABLE');return value;}
const mac=(label:string,value:string)=>guestMac(secret(),label,value);
async function store(value:string){(await cookies()).set(COOKIE,issueGuestCredential(secret(),value,Date.now()+AGE*1000),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:COOKIE_PATH,maxAge:AGE});}
function rateKey(request:Request){const header=process.env.JOBKIX_TRUSTED_CLIENT_IP_HEADER;if(header!=='cf-connecting-ip'&&header!=='x-real-ip')throw new JobkixFault('DEPENDENCY_UNAVAILABLE');const ip=request.headers.get(header)?.trim()||'';if(!isIP(ip))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');return mac('guest-rate',ip);}
async function call(name:string,args:Record<string,unknown>){const db=await createServiceClient(),result=await db.rpc(name,args);if(result.error)throw dependencyError(result.error);return object(result.data);}
/** Anonymous proof is scoped to one private case. Signed-in identities use their own canonical account workflow. */
export async function guestCaseRequest(request:Request,input:Record<string,unknown>){
 const session=await getJobkixSession();if(session.state!=='anonymous')throw new JobkixFault(session.state==='restricted'?'ACCOUNT_RESTRICTED':'FORBIDDEN');
 const action=text(input.action,'action',1,100),rate=rateKey(request),jar=await cookies();let current=readGuestCredential(secret(),jar.get(COOKIE)?.value);
 if(action==='begin'){if(!current){current=randomBytes(32).toString('hex');await store(current);}return call('jobkix_guest_case_status',{p_hash:mac('receipt',current),p_rate_key:rate});}
 if(action==='restore'){const candidate=token(input.accessCode),result=await call('jobkix_guest_case_status',{p_hash:mac('receipt',candidate),p_rate_key:rate});if(!result.case)throw new JobkixFault('NOT_FOUND');await store(candidate);return result;}
 if(!current)throw new JobkixFault('AUTHENTICATION_REQUIRED');
 const hash=mac('receipt',current);
 if(action==='status')return call('jobkix_guest_case_status',{p_hash:hash,p_rate_key:rate});
 if(action==='receipt'){const status=await call('jobkix_guest_case_status',{p_hash:hash,p_rate_key:rate});if(!status.case)throw new JobkixFault('NOT_FOUND');const record=object(status.case);return {format:'JOBKIX_PRIVATE_CASE_RECEIPT_V1',reference:record.reference,accessCode:current,expiresAt:record.expiresAt};}
 if(action==='new'){const status=await call('jobkix_guest_case_status',{p_hash:hash,p_rate_key:rate});if(!status.case)throw new JobkixFault('INVALID_TRANSITION');await store(randomBytes(32).toString('hex'));return {case:null,draft:null};}
 const payload=action==='draft.save'?guestDraft(input.payload):action==='draft.remove'?{}:guestCasePayload(action,input.payload),key=text(input.idempotencyKey,'idempotencyKey',16,180),version=integer(input.expectedVersion??0,'version',0,1000000);
 return call('jobkix_guest_case_command',{p_hash:hash,p_action:action,p_payload:payload,p_version:version,p_key:key,p_rate_key:rate});
}
