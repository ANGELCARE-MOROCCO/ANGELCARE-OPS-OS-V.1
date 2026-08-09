import 'server-only'
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { productionEnvironment } from '../config'

type SignedResult<T>={ok:boolean;status:number;data:T}
function sha(value:Uint8Array|string){return createHash('sha256').update(value as any).digest('hex')}
function signature(secret:string,timestamp:string,nonce:string,method:string,path:string,bodyHash:string){return createHmac('sha256',secret).update([timestamp,nonce,method.toUpperCase(),path,bodyHash].join('\n')).digest('hex')}
async function signedRequest<T>(path:string,init:{method?:string;body?:Uint8Array|string;headers?:Record<string,string>}={}):Promise<SignedResult<T>>{
 const env=productionEnvironment();if(!env.windows.baseUrl||!env.windows.secret)throw new Error('Flashcards Windows Product Vault is not configured.')
 const method=(init.method||'GET').toUpperCase();const body=init.body??'';const bytes=typeof body==='string'?new TextEncoder().encode(body):body;const requestBody=new ArrayBuffer(bytes.byteLength);new Uint8Array(requestBody).set(bytes);const timestamp=String(Date.now());const nonce=randomUUID();const bodyHash=sha(bytes);const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),env.windows.timeoutMs)
 try{const response=await fetch(`${env.windows.baseUrl}${path}`,{method,headers:{'x-angelcare-node-id':env.windows.nodeId,'x-angelcare-timestamp':timestamp,'x-angelcare-nonce':nonce,'x-angelcare-body-sha256':bodyHash,'x-angelcare-signature':signature(env.windows.secret,timestamp,nonce,method,path,bodyHash),...(init.headers||{})},body:method==='GET'||method==='HEAD'?undefined:requestBody,signal:controller.signal,cache:'no-store'});const data=await response.json().catch(()=>({error:`Vault returned HTTP ${response.status}`})) as T;return{ok:response.ok,status:response.status,data}}finally{clearTimeout(timeout)}}
export async function vaultHealth(){return signedRequest<Record<string,unknown>>('/v1/health')}
export async function createVaultUpload(input:Record<string,unknown>){return signedRequest<Record<string,unknown>>('/v1/uploads',{method:'POST',body:JSON.stringify(input),headers:{'content-type':'application/json'}})}
export async function sendVaultPart(sessionId:string,partNumber:number,bytes:Uint8Array,partSha256:string){return signedRequest<Record<string,unknown>>(`/v1/uploads/${encodeURIComponent(sessionId)}/parts/${partNumber}`,{method:'PUT',body:bytes,headers:{'content-type':'application/octet-stream','x-part-sha256':partSha256}})}
export async function finaliseVaultUpload(sessionId:string,input:Record<string,unknown>){return signedRequest<Record<string,unknown>>(`/v1/uploads/${encodeURIComponent(sessionId)}/finalise`,{method:'POST',body:JSON.stringify(input),headers:{'content-type':'application/json'}})}
export async function cancelVaultUpload(sessionId:string){return signedRequest<Record<string,unknown>>(`/v1/uploads/${encodeURIComponent(sessionId)}/cancel`,{method:'POST',body:'{}',headers:{'content-type':'application/json'}})}
export async function vaultUploadStatus(sessionId:string){return signedRequest<Record<string,unknown>>(`/v1/uploads/${encodeURIComponent(sessionId)}`)}
export async function vaultReconcile(){return signedRequest<Record<string,unknown>>('/v1/reconcile',{method:'POST',body:'{}',headers:{'content-type':'application/json'}})}
export function chunkChecksum(bytes:Uint8Array){return sha(bytes)}
export async function vaultDownload(objectKey:string,range:string|null){
 const env=productionEnvironment();if(!env.windows.baseUrl||!env.windows.secret)throw new Error('Flashcards Windows Product Vault is not configured.')
 const path=`/v1/objects/${encodeURIComponent(objectKey)}/download`;const method='GET';const timestamp=String(Date.now());const nonce=randomUUID();const bodyHash=sha('');const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),env.windows.timeoutMs)
 try{return await fetch(`${env.windows.baseUrl}${path}`,{method,headers:{'x-angelcare-node-id':env.windows.nodeId,'x-angelcare-timestamp':timestamp,'x-angelcare-nonce':nonce,'x-angelcare-body-sha256':bodyHash,'x-angelcare-signature':signature(env.windows.secret,timestamp,nonce,method,path,bodyHash),...(range?{range}: {})},signal:controller.signal,cache:'no-store'})}finally{clearTimeout(timeout)}
}
