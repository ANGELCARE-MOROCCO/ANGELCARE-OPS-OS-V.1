import {MarketplaceError} from '../server/errors'
export async function readAllPages<T=Record<string,unknown>>(query:()=>any):Promise<T[]>{
 const result:T[]=[];const size=500;
 for(let offset=0;;offset+=size){const {data,error}=await query().range(offset,offset+size-1);if(error)throw new MarketplaceError('INTERNAL_ERROR','Lecture interrompue : les résultats incomplets ne sont pas affichés.',{cause:error});const page=(data||[]) as T[];result.push(...page);if(page.length<size)return result}
}
export async function readIdBatches<T=Record<string,unknown>>(ids:string[],query:(batch:string[])=>any):Promise<T[]>{const result:T[]=[];for(let start=0;start<ids.length;start+=80)result.push(...await readAllPages<T>(()=>query(ids.slice(start,start+80))));return result}
