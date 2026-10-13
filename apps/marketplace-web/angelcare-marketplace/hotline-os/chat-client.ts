import {hotlineTransport} from './client'
export function chatRequest<T>(path:string,body?:unknown,admin=false,options:{signal?:AbortSignal}={}):Promise<T>{
 return hotlineTransport<T>(`/api/angelcare-marketplace/${admin?'admin':'public'}/hotline-chat/${path}`,body,undefined,options)
}
