import 'server-only';
import { createHash } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { JobkixFault } from '../contracts';
import { MAX_FILE_BYTES,validateDocument } from '../file-validation';
import { object,text,uuid,choice } from '../validation';
import { requireJobkixSession } from './identity';
import { rpc } from './repository';
import { dependencyError,PRIVATE_HEADERS } from './http';
import { adminFile } from './admin-repository';
export async function readFileBytes(request:Request){
 if(!request.body)throw new JobkixFault('INVALID_INPUT');const length=request.headers.get('content-length');if(length&&(!/^\d+$/.test(length)||Number(length)>MAX_FILE_BYTES))throw new JobkixFault('INVALID_INPUT');
 const reader=request.body.getReader(),chunks:Uint8Array[]=[];let bytes=0;
 try{while(true){const result=await reader.read();if(result.done)break;bytes+=result.value.byteLength;if(bytes>MAX_FILE_BYTES){await reader.cancel();throw new JobkixFault('INVALID_INPUT');}chunks.push(result.value);}}finally{reader.releaseLock();}
 if(!bytes)throw new JobkixFault('INVALID_INPUT');const data=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength;}return data;
}
async function privateBucket(){
 const name=process.env.JOBKIX_PRIVATE_DOCUMENT_BUCKET||'jobkix-private-documents';if(!/^[a-z0-9][a-z0-9-]{2,62}$/.test(name))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
 const db=await createServiceClient(),bucket=await db.storage.getBucket(name);if(bucket.error||!bucket.data||bucket.data.public!==false)throw new JobkixFault('DEPENDENCY_UNAVAILABLE');return {db,bucket:db.storage.from(name)};
}
export async function uploadDocument(request:Request){
 const actor=await requireJobkixSession(),url=new URL(request.url),purpose=choice(url.searchParams.get('purpose'),['cv','credential','portfolio','verification','report','message'],'purpose');
 const organizationId=url.searchParams.get('organizationId'),key=text(request.headers.get('x-jobkix-idempotency-key'),'idempotencyKey',16,180);
 let filename:string;try{filename=decodeURIComponent(request.headers.get('x-jobkix-filename')||'');}catch{throw new JobkixFault('INVALID_INPUT');}
 const mime=(request.headers.get('content-type')||'').split(';')[0].trim(),bytes=await readFileBytes(request),validated=await validateDocument(bytes,filename,mime,purpose);
 const {db,bucket}=await privateBucket();
 const begun=object(await rpc('jobkix_file_begin',{p_metadata:{filename:validated.filename,mime,purpose,organizationId:organizationId?uuid(organizationId):null,bytes:bytes.length,sha256:validated.sha256},p_idempotency_key:key}));
 const id=uuid(begun.id),objectKey=text(begun.objectKey,'objectKey',1,300);
 if(objectKey!==actor.userId+'/'+id+'/original')throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
 const upload=await bucket.upload(objectKey,bytes,{contentType:mime,cacheControl:'0',upsert:false});
 if(upload.error){
  // Recover only a byte-identical immutable object after a lost acknowledgement/collision.
  const existing=await bucket.download(objectKey);if(existing.error||!existing.data||existing.data.size!==bytes.length)throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
  const fingerprint=createHash('sha256').update(new Uint8Array(await existing.data.arrayBuffer())).digest('hex');if(fingerprint!==validated.sha256)throw new JobkixFault('IDEMPOTENCY_CONFLICT');
 }
 const completed=await db.rpc('jobkix_file_finish',{p_actor:actor.userId,p_file:id,p_sha256:validated.sha256,p_bytes:bytes.length,p_validation_reference:validated.validationReference});
 if(completed.error)throw dependencyError(completed.error);
 // A completion failure retains quarantined bytes for a safe same-key retry; it never deletes a possibly committed submission attachment.
 return object(completed.data);
}
export async function downloadDocument(id:string,administration:string|null){
 if(!administration)await requireJobkixSession();
 const metadata=administration?await adminFile(administration,id):object(await rpc('jobkix_file_download',{p_file:uuid(id)}));
 const key=text(metadata.objectKey,'objectKey',1,300);if(!/^[a-f0-9-]{36}\/[a-f0-9-]{36}\/original$/.test(key))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
 const {bucket}=await privateBucket(),result=await bucket.download(key);if(result.error||!result.data||result.data.size>MAX_FILE_BYTES)throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
 const bytes=new Uint8Array(await result.data.arrayBuffer()),hash=createHash('sha256').update(bytes).digest('hex');if(hash!==metadata.sha256||bytes.length!==metadata.bytes)throw new JobkixFault('DOCUMENT_NOT_READY');
 const filename=text(metadata.filename,'filename',1,240),mime=choice(metadata.mime,['application/pdf','image/png','image/jpeg','image/webp'],'mime');
 const encoded=encodeURIComponent(filename).replace(/['()*]/g,value=>'%'+value.charCodeAt(0).toString(16).toUpperCase());
 return new Response(bytes,{headers:{...PRIVATE_HEADERS,'Content-Type':mime,'Content-Length':String(bytes.length),'Content-Disposition':`attachment; filename="document.${mime==='application/pdf'?'pdf':mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg'}"; filename*=UTF-8''${encoded}`,'Content-Security-Policy':"sandbox; default-src 'none'"}});
}
