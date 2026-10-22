'use client';
import { useEffect,useRef,useState } from 'react';
import { JobkixFault,type FaultCode } from '../contracts';
import { object } from '../validation';
const CODES:readonly FaultCode[]=['INVALID_INPUT','AUTHENTICATION_REQUIRED','EMAIL_UNCONFIRMED','FORBIDDEN','ACCOUNT_RESTRICTED','NOT_FOUND','VERSION_CONFLICT','IDEMPOTENCY_CONFLICT','VACANCY_UNAVAILABLE','ALREADY_APPLIED','DOCUMENT_NOT_READY','INVALID_TRANSITION','OFFER_EXPIRED','DEPENDENCY_UNAVAILABLE','RATE_LIMITED'];
export async function readResponse(response:Response):Promise<Record<string,unknown>>{
 let data:Record<string,unknown>;try{data=object(await response.json());}catch{throw new JobkixFault('DEPENDENCY_UNAVAILABLE');}
 if(!response.ok||data.ok!==true){
  const error=data.error&&typeof data.error==='object'&&!Array.isArray(data.error)?object(data.error):{};
  const code=CODES.find(code=>code===error.code)||'DEPENDENCY_UNAVAILABLE';
  const fields=error.fields&&typeof error.fields==='object'&&!Array.isArray(error.fields)?Object.fromEntries(Object.entries(error.fields).filter((entry):entry is [string,string]=>typeof entry[1]==='string')):{};
  throw new JobkixFault(code,fields);
 }
 return data;
}
export function useCommand(endpoint='/api/jobkix/commands'){
 const [pending,setPending]=useState(false),[error,setError]=useState<JobkixFault|null>(null);
 const mounted=useRef(true),busy=useRef(false),keys=useRef(new Map<string,string>()),lastError=useRef<JobkixFault|null>(null);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 async function run(action:string,payload:Record<string,unknown>,expectedVersion=0,idempotencyKey?:string):Promise<Record<string,unknown>|null>{
  if(busy.current)return null;busy.current=true;lastError.current=null;setPending(true);setError(null);
  const fingerprint=JSON.stringify({action,payload,expectedVersion});let key=idempotencyKey||keys.current.get(fingerprint);
  if(!key){key=idempotencyKey||crypto.randomUUID();keys.current.set(fingerprint,key);}
  try{const data=await readResponse(await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,payload,expectedVersion,idempotencyKey:key})}));const result=object(data.result);keys.current.delete(fingerprint);return result;}
  catch(error){const fault=error instanceof JobkixFault?error:new JobkixFault('DEPENDENCY_UNAVAILABLE');lastError.current=fault;if(mounted.current)setError(fault);return null;}
  finally{busy.current=false;if(mounted.current)setPending(false);}
 }
 return {run,pending,error,lastError,clearError:()=>{lastError.current=null;setError(null);}};
}
