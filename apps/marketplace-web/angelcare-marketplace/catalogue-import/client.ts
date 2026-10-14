import type { Row } from '../catalogue-population/model'
export const ENDPOINT='/api/angelcare-marketplace/admin/catalog/import-command'
export async function request<T=Row>(url:string,init:RequestInit={}):Promise<T>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000)
 const signal=init.signal?AbortSignal.any([init.signal,controller.signal]):controller.signal
 try{const response=await fetch(url,{...init,signal,cache:'no-store',headers:{...(init.body?{'content-type':'application/json'}:{}),...init.headers}}),result=await response.json();if(!response.ok||result.error)throw Error(result.error?.message||'Opération interrompue. Relisez l’état avant de reprendre.');if(result.data===undefined)throw Error('Réponse incomplète.');return result.data}
 finally{clearTimeout(timer)}
}
export const post=<T=Row,>(body:Row)=>request<T>(ENDPOINT,{method:'POST',body:JSON.stringify(body)})
export function download(name:string,content:string,type='text/csv;charset=utf-8'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export async function ingestFile(run:Row,path:string,file:File|null,onProgress:(message:string)=>void){
 const {sha256File,MEDIA_ALLOWED_MIME,MEDIA_MAX_BYTES}=await import('../commerce-studio/media-library-operations')
 const binding=run.manifest.find((r:Row)=>r.path===path);if(!binding)throw Error('Chemin hors manifeste.')
 if(run.assets?.[path])return run.assets[path]
 if(binding.existingAssetKey)return request<Row>('/api/angelcare-marketplace/admin/catalog/population?part=asset&key='+encodeURIComponent(binding.existingAssetKey))
 if(!file)throw Error('Resélectionnez le fichier : '+path)
 if(!MEDIA_ALLOWED_MIME.has(file.type)||file.size<=0||file.size>MEDIA_MAX_BYTES)throw Error('Format ou taille de média refusé : '+path)
 const checksum=await sha256File(file);if(binding.checksum&&binding.checksum!==checksum)throw Error('Le fichier a changé : '+path)
 const check=await request<Row[]>('/api/angelcare-marketplace/admin/media/preflight',{method:'POST',body:JSON.stringify({files:[{fileName:file.name,mimeType:file.type,sizeBytes:file.size,checksumSha256:checksum}]})})
 if(check[0]?.errors?.length)throw Error(check[0].errors.join(' · '));if(check[0]?.duplicate)return check[0].duplicate
 const storageKey='angelcare.import.r2.upload.'+run.id+'.'+path
 let session:Row|null=null;try{session=JSON.parse(localStorage.getItem(storageKey)||'null')}catch{}
 if(session){try{const asset=await request<Row>('/api/angelcare-marketplace/admin/media/'+session.assetId);if(asset.status==='active'){if(asset.metadata?.sha256!==checksum)throw Error('Asset repris différent ; remplacement bloqué.');return asset}}catch(e){if(e instanceof Error&&e.message.includes('remplacement bloqué'))throw e}}
 if(!session||Date.parse(session.expiresAt||'')<Date.now()){
  session=await request<Row>('/api/angelcare-marketplace/admin/media/upload-session',{method:'POST',body:JSON.stringify({fileName:file.name,mimeType:file.type,sizeBytes:file.size,altTextFr:binding.altFr,replaceAssetId:session?.assetId})})
  try{localStorage.setItem(storageKey,JSON.stringify(session))}catch{}
 }
 onProgress('Téléversement vers le Media Vault')
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),180000)
 try{const response=await fetch(session.uploadUrl,{method:'PUT',headers:{'content-type':file.type},body:file,signal:controller.signal});if(!response.ok)throw Error('Stockage : HTTP '+response.status)}finally{clearTimeout(timeout)}
 const asset=await request<Row>(session.completionUrl,{method:'POST',body:JSON.stringify({fileName:file.name,mimeType:file.type,sizeBytes:file.size,checksumSha256:checksum,altTextFr:binding.altFr,productReference:binding.itemKey})})
 try{localStorage.removeItem(storageKey)}catch{}
 return asset
}
