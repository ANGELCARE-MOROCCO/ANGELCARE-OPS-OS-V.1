import {HotlineRequestError} from './client'
export async function chatRequest<T>(path:string,body?:unknown,admin=false,options:{signal?:AbortSignal}={}):Promise<T>{
 const controller=new AbortController(),cancel=()=>controller.abort(),timer=setTimeout(cancel,12000)
 options.signal?.addEventListener('abort',cancel,{once:true});if(options.signal?.aborted)cancel()
 try{const response=await fetch(`/api/angelcare-marketplace/${admin?'admin':'public'}/hotline-chat/${path}`,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:body===undefined?{}:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const payload=await response.json().catch(()=>null);if(!response.ok||!payload||payload.error||!Object.prototype.hasOwnProperty.call(payload,'data'))throw new HotlineRequestError(payload?.error?.message||'Chat unavailable',response.status,response.status>=500);return payload.data as T}finally{clearTimeout(timer);options.signal?.removeEventListener('abort',cancel)}
}
