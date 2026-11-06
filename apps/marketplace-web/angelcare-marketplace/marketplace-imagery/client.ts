"use client";
export { useUI } from '../digital-customer-experience/components/ui';
const API='/api/angelcare-marketplace/admin/imagery';
async function request<T>(url:string,init:RequestInit):Promise<T>{const r=await fetch(url,{...init,cache:'no-store',signal:AbortSignal.timeout(60000)});const j=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(j.error?.message||'Imagery request failed.'),{code:j.error?.code});return j.data;}
export function query<T=any>(params:Record<string,unknown>):Promise<T>{const q=new URLSearchParams(Object.entries(params).filter(([,v])=>v!==undefined&&v!==null).map(([k,v])=>[k,String(v)]));return request(API+'?'+q,{});}
export function mutate<T=any>(command:Record<string,unknown>):Promise<T>{return request(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...command,requestId:command.requestId||crypto.randomUUID()})});}
