import { createServiceClient } from '@/lib/supabase/server'
import { MarketplaceError } from '../server/errors'
import { effectiveAccess } from './access'
import type { DceRecord } from './types'
export async function assertCustomerExperienceAccess(r:DceRecord,customerId:string,action:'use'|'contribute'|'download'|'print'){
 const db=await createServiceClient(),scope=(q:any)=>(r.tenant_id?q.eq('tenant_id',r.tenant_id):q.is('tenant_id',null))[r.territory_id?'eq':'is']('territory_id',r.territory_id||null),policies:DceRecord[]=[],grants:DceRecord[]=[];
 for(let page=0;page<1000;page++){const z=await scope(db.from('ac_dce_releases').select('snapshot').eq('state','published').eq('snapshot->>kind','access_policy')).order('id').range(page*100,page*100+99);if(z.error)throw new MarketplaceError('NOT_READY','Active access rules unavailable.');policies.push(...(z.data||[]).map((v:any)=>v.snapshot));if((z.data||[]).length<100)break;if(page===999)throw new MarketplaceError('NOT_READY','Narrow the access policy scope.')}
 const g=await scope(db.from('ac_dce_records').select('*').eq('kind','grant').eq('data->>customerId',customerId).eq('data->>resourceId',r.id));if(g.error)throw new MarketplaceError('NOT_READY','Native grants unavailable.');grants.push(...g.data||[]);const decision=effectiveAccess(r,policies,{action,audience:r.audience,authenticated:true,customerId,grants});if(!decision.allowed)throw new MarketplaceError('PERMISSION_DENIED','Experience access denied: '+decision.reason)
}
