import {createServiceClient} from '@/lib/supabase/server'
import type {MarketplaceRequestContext} from '../domain/types'
import {MarketplaceError} from '../server/errors'
import {listOperatingCases} from '../admin-operating/repository'
import type {FinalSourceRecord,FinalWorkspaceData,FinalWorkspaceDefinition} from './types'
const text=(v:unknown)=>typeof v==='string'?v.trim():''
const statusText=(v:unknown)=>typeof v==='string'?v.trim():typeof v==='boolean'?(v?'enabled':'disabled'):typeof v==='number'?String(v):''
const pick=(row:Record<string,unknown>,fields:string[])=>{for(const f of fields){const v=row[f];if(typeof v==='string'&&v.trim())return v.trim()}return ''}
function fail(action:string,error:unknown):never{throw new MarketplaceError('INTERNAL_ERROR',`Impossible de ${action}.`,{cause:error,retryable:true})}
function meta(row:Record<string,unknown>,fields:string[]){return fields.map(f=>text(row[f])).filter(Boolean).slice(0,4).join(' · ')}
export async function loadFinalWorkspaceData(def:FinalWorkspaceDefinition,context:MarketplaceRequestContext):Promise<FinalWorkspaceData>{
 const cases=await listOperatingCases(context,{workspaceKey:def.key,limit:250})
 if(!def.sourceTable)return{cases,sourceRecords:[]}
 const db=await createServiceClient();let query=db.from(def.sourceTable).select('*').limit(250)
 const {data,error}=await query
 if(error){const e=error as {code?:string};if(e.code==='42P01'||e.code==='PGRST205')throw new MarketplaceError('CONFIGURATION_ERROR',`La migration MZ2 requise pour ${def.title} doit être appliquée.`,{cause:error});fail(`charger la source ${def.sourceTable}`,error)}
 const sourceRecords=((data||[]) as Record<string,unknown>[]).map(row=>({id:text(row.id),title:pick(row,def.sourceTitleFields)||text(row.id)||'Enregistrement',status:statusText(row[def.sourceStatusField])||'unknown',meta:meta(row,def.sourceMetaFields),raw:row}))
 return{cases,sourceRecords}
}
