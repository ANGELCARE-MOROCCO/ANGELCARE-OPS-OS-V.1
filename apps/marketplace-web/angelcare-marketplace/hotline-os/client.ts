export class HotlineRequestError extends Error {
 constructor(message:string,public status:number,public retryable:boolean){super(message);this.name='HotlineRequestError'}
}
export async function hotlineTransport<T>(url:string,body?:unknown,method?:string,options:{signal?:AbortSignal;timeoutMs?:number}={}):Promise<T>{
 const controller=new AbortController(),verb=method||(body===undefined?'GET':'POST');let timedOut=false;
 const cancel=()=>controller.abort(options.signal?.reason);
 if(options.signal?.aborted)cancel();else options.signal?.addEventListener('abort',cancel,{once:true});
 const timer=setTimeout(()=>{timedOut=true;controller.abort()},options.timeoutMs??(verb==='GET'?30000:60000));
 try{
  const response=await fetch(url,{method:verb,credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:body===undefined?{}:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  const payload=await response.json().catch(()=>null);
  if(!response.ok||payload?.error||!payload||!Object.prototype.hasOwnProperty.call(payload,'data'))throw new HotlineRequestError(payload?.error?.message||`Réception indisponible (${response.status}).`,response.status,[408,429,500,502,503,504].includes(response.status));
  return payload.data as T;
 }catch(error){
  if(options.signal?.aborted)throw error;
  if(timedOut)throw new HotlineRequestError('La réponse prend plus de temps que prévu. Réessayez ; vos modifications sont conservées.',408,true);
  if(error instanceof HotlineRequestError)throw error;
  throw new HotlineRequestError('Connexion interrompue. Vérifiez votre connexion puis réessayez ; vos modifications sont conservées.',0,true);
 }finally{clearTimeout(timer);options.signal?.removeEventListener('abort',cancel)}
}
export function hotlineRequest<T=any>(path:string,body?:unknown,admin=false,method?:string,options:{signal?:AbortSignal;timeoutMs?:number}={}):Promise<T>{
 return hotlineTransport<T>(`/api/angelcare-marketplace/${admin?'admin':'public'}/hotline/${path}`,body,method,options)
}
