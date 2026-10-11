export class HotlineRequestError extends Error {
  constructor(message:string, public status:number, public retryable:boolean) { super(message); this.name='HotlineRequestError' }
}
export async function hotlineRequest<T=any>(path:string,body?:unknown,admin=false,method?:string,options:{signal?:AbortSignal;timeoutMs?:number}={}):Promise<T>{
  const controller=new AbortController(), verb=method||(body===undefined?'GET':'POST');
  const cancel=()=>controller.abort();
  if(options.signal?.aborted)controller.abort();
  options.signal?.addEventListener('abort',cancel,{once:true});
  const timer=setTimeout(cancel,options.timeoutMs??(verb==='GET'?12000:30000));
  try {
    const response=await fetch(`/api/angelcare-marketplace/${admin?'admin':'public'}/hotline/${path}`,{method:verb,credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:body===undefined?{}:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
    const payload=await response.json().catch(()=>null);
    if(!response.ok||payload?.error||!payload||!Object.prototype.hasOwnProperty.call(payload,'data'))throw new HotlineRequestError(payload?.error?.message||`Reception unavailable (${response.status})`,response.status,[408,429,500,502,503,504].includes(response.status));
    return payload.data;
  } finally {clearTimeout(timer);options.signal?.removeEventListener('abort',cancel)}
}
