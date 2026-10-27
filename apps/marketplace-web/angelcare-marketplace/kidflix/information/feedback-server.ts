import 'server-only';
import {createHash,createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import {createServiceClient} from '@/lib/supabase/server';
import {takeBudget} from '../documents/server';
import {cleanFeedback} from './model';
import type {Locale} from '../catalogue';
const TABLE='angelcare_marketplace_public_inquiries',CHANNEL='kidflix-information-r1',MAX_BODY=24576;
const response=(value:unknown,status=200)=>Response.json(value,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
function secret(){const value=process.env.MARKETPLACE_DCE_ANALYTICS_SECRET||'';if(value.length<32)throw Error('NOT_READY');return value;}
function sign(value:string){return createHmac('sha256',secret()).update(CHANNEL+'|'+value).digest('base64url');}
export function issueChallenge(host:string,kind:string,locale:string,now=Date.now()){
 const value=Buffer.from(JSON.stringify({nonce:randomUUID(),host,kind,locale,at:now})).toString('base64url');return value+'.'+sign(value);
}
export function verifyChallenge(token:unknown,host:string,kind:string,locale:string,now=Date.now()){
 if(typeof token!=='string'||token.length>2000)throw Error('INVALID_TOKEN');
 const parts=token.split('.');if(parts.length!==2)throw Error('INVALID_TOKEN');
 const actual=Buffer.from(parts[1]),expected=Buffer.from(sign(parts[0]));
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw Error('INVALID_TOKEN');
 let v;try{v=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));}catch{throw Error('INVALID_TOKEN');}
 if(!v||v.host!==host||v.kind!==kind||v.locale!==locale||typeof v.at!=='number'||v.at>now+5000||now-v.at>30*60*1000||!/^[a-f0-9-]{36}$/.test(v.nonce||''))throw Error('INVALID_TOKEN');
 return v.nonce as string;
}
export async function readBody(request:Request){
 if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))throw Error('INVALID_FEEDBACK');
 const length=Number(request.headers.get('content-length')||0);if(length>MAX_BODY)throw Error('TOO_LARGE');
 const reader=request.body?.getReader();if(!reader)throw Error('INVALID_FEEDBACK');
 const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>MAX_BODY){await reader.cancel();throw Error('TOO_LARGE');}chunks.push(chunk.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Error('INVALID_FEEDBACK');}
}
function hostOf(request:Request){const host=(request.headers.get('host')||new URL(request.url).host).toLowerCase();if(!/^[a-z0-9.-]+(?::\d{1,5})?$/.test(host))throw Error('ORIGIN_REJECTED');return host;}
function originOf(request:Request){const host=hostOf(request),proto=request.headers.get('x-forwarded-proto')||new URL(request.url).protocol.replace(':','');if(!['http','https'].includes(proto))throw Error('ORIGIN_REJECTED');return proto+'://'+host;}
function validTarget(kind:unknown,locale:unknown){return ['accessibility','privacy'].includes(String(kind))&&['en','fr','ar'].includes(String(locale));}
function receipt(row:Record<string,unknown>|null){const ref=row?.public_reference;if(typeof ref!=='string'||ref.length<3||ref.length>150||/[<>\r\n]/.test(ref))throw Error('NOT_READY');return {received:true,reference:ref};}
export async function GET(request:Request){try{const url=new URL(request.url),kind=url.searchParams.get('kind'),locale=url.searchParams.get('locale');if(!validTarget(kind,locale))return response({error:'INVALID_FEEDBACK'},400);return response({token:issueChallenge(hostOf(request),String(kind),String(locale))});}catch{return response({error:'NOT_READY'},503);}}
export async function POST(request:Request){try{
 const origin=originOf(request);if(request.headers.get('origin')!==origin||request.headers.get('sec-fetch-site')==='cross-site')throw Error('ORIGIN_REJECTED');
 const raw=await readBody(request),input=cleanFeedback(raw,origin),host=hostOf(request),key=verifyChallenge(raw.token,host,input.kind,input.locale);
 const categories=input.kind==='accessibility'?['reading','keyboard','media','language','other']:['browser','newsletter','external','other'];if(!categories.includes(input.category))throw Error('INVALID_FEEDBACK');
 let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([takeBudget(request,host,input.locale as Locale,'newsletter'),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('NOT_READY')),8000);})]);}finally{if(timer)clearTimeout(timer);}
 const digest=createHash('sha256').update(JSON.stringify(input)).digest('hex'),db=await createServiceClient();
 const lookup=async()=>{const r=await db.from(TABLE).select('id,public_reference,status,source_metadata').contains('source_metadata',{entry:CHANNEL,submissionKey:key,channel:CHANNEL,siteHost:host}).abortSignal(AbortSignal.timeout(8000)).maybeSingle();if(r.error)throw Error('NOT_READY');if(r.data&&r.data.source_metadata?.submissionHash!==digest)throw Error('REQUEST_CHANGED');return r.data;};
 const previous=await lookup();if(previous)return response(receipt(previous));
 const r=await db.from(TABLE).insert({id:key,audience:'other',source_route:`/kidflix/${input.locale}/${input.kind}`,full_name:'KidFlix visitor',email:input.email||null,phone:null,organization:null,city:null,message:`[KidFlix ${input.kind} · ${input.category}]\n${input.page?input.page+'\n':''}${input.message}`,consent_granted_at:new Date().toISOString(),locale:input.locale,territory_id:null,source_metadata:{entry:CHANNEL,submissionKey:key,submissionHash:digest,contactTopic:'other',channel:CHANNEL,siteHost:host,world:'kidflix',kind:input.kind,category:input.category,page:input.page,anonymous:!input.email}}).select('id,public_reference,status').abortSignal(AbortSignal.timeout(8000)).single();
 if(r.error){if(r.error.code==='23505'){const previous=await lookup();if(previous)return response(receipt(previous));}throw Error('NOT_READY');}
 return response(receipt(r.data),201);
 }catch(error){const code=error instanceof Error?error.message:'NOT_READY';const statuses:Record<string,number>={ORIGIN_REJECTED:403,TOO_LARGE:413,INVALID_FEEDBACK:400,INVALID_PAGE:400,INVALID_TOKEN:400,REQUEST_CHANGED:409,RATE_LIMITED:429};return response({error:statuses[code]?code:'NOT_READY'},statuses[code]||503);}}
