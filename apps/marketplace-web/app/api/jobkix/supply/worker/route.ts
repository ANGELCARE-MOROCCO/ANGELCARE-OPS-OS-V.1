import {workerAuthorized,workerClaim,workerBatch,workerFinish} from '@/angelcare-marketplace/jobkix/supply/server';
import {PRIVATE_HEADERS,failure} from '@/angelcare-marketplace/jobkix/server/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
async function boundedJson(request:Request){const reader=request.body?.getReader();if(!reader)throw Error('Missing request');const chunks:Uint8Array[]=[];let bytes=0;try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.length;if(bytes>1000000){await reader.cancel();throw Error('Worker payload exceeds 1MB');}chunks.push(value)}}finally{reader.releaseLock()}const b=new Uint8Array(bytes);let i=0;for(const ch of chunks){b.set(ch,i);i+=ch.length}const p=JSON.parse(new TextDecoder().decode(b));if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Invalid worker payload');return p as Record<string,unknown>}
export async function POST(request:Request){
 if(!workerAuthorized(request.headers.get('x-jobkix-worker-key')||''))return Response.json({ok:false,error:'Forbidden'},{status:403,headers:PRIVATE_HEADERS});
 try{const p=await boundedJson(request),action=p.action,worker=String(p.worker||'');if(!/^[a-z0-9_-]{4,128}$/i.test(worker))throw Error('Invalid worker');
  let data:unknown;if(action==='claim')data=await workerClaim(worker);else if(action==='batch')data=await workerBatch(worker,p);else if(action==='finish')data=await workerFinish(worker,p);else throw Error('Unknown worker command');return Response.json({ok:true,result:data},{headers:PRIVATE_HEADERS});
 }catch(error){return failure(error)}
}
