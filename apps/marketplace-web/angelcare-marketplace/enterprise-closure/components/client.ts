export type ApiEnvelope<T>={data:T}
export async function enterpriseRequest<T>(url:string,init?:RequestInit):Promise<T>{
 const response=await fetch(url,{...init,headers:{'content-type':'application/json',...(init?.headers||{})}})
 const payload=await response.json() as ApiEnvelope<T>|{error?:{message?:string}}
 if(!response.ok||!('data' in payload))throw new Error('error' in payload?payload.error?.message||'Action impossible.':'Action impossible.')
 return payload.data
}
export const money=(value:unknown,currency='Dh')=>`${Number(value||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} ${currency}`
export const dateTime=(value:string|null|undefined)=>value?new Date(value).toLocaleString('fr-FR'):'—'
