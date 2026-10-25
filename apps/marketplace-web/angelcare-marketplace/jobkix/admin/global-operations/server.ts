import 'server-only';
import { requireMarketplaceApiContext, hasMarketplaceWorkspaceAccess } from '../../../auth/context';
import { readAdminPage,readAdmin,readOperations } from '../../server/admin-repository';
import { workspaceFromSlug,WORKSPACES,PURPOSE,type SourceArea } from './contracts';

type UnknownRow=Record<string,unknown>;
export type SafeRow={id:string;title:string;state:string;type:string;country:string;locale:string;createdAt:string;updatedAt:string;version:number|null;organization:string;kind:string};
export type Snapshot={area:SourceArea;total:number|null;rows:SafeRow[];page:number;counts?:Record<string,number>;metadata?:Record<string,number>};
export type OpsPayload={workspace:string;allowed:string[];sources:Snapshot[];failures:string[]};
const pick=(row:UnknownRow,keys:string[])=>{for(const k of keys){const value=row[k];if(typeof value==='string'&&value.length)return value;}return '';};
function project(row:UnknownRow):SafeRow{
 const organization=row.organization&&typeof row.organization==='object'&&!Array.isArray(row.organization)?row.organization as UnknownRow:{};
 return {
  id:pick(row,['id','key']),title:pick(row,['title','public_reference','document_slug','source_name_en','type','kind','key'])||'Untitled record',
  state:pick(row,['state','status'])||'unknown', type:pick(row,['kind','type','category','document_kind'])||'record',
  country:pick(row,['country','country_code'])||pick(organization,['country'])||'',locale:pick(row,['original_locale','language','locale'])||'',
  createdAt:pick(row,['created_at','createdAt'])||'',updatedAt:pick(row,['updated_at','updatedAt'])||'',
  version:typeof row.version==='number'?row.version:null,organization:pick(organization,['publicName','public_name'])||pick(row,['organization_name'])||'',kind:pick(row,['document_kind','kind'])||''
 };
}
const num=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:typeof v==='string'&&/^\d+$/.test(v)?Number(v):0;
function mapCounts(o:unknown){const counts:Record<string,number>={};if(o&&typeof o==='object'&&!Array.isArray(o))for(const [key,value] of Object.entries(o))counts[key]=num(value);return counts;}
async function one(area:SourceArea,page:number):Promise<Snapshot>{
 if(area==='health'){
  const result=await readAdmin('health',PURPOSE);
  const raw=result.data&&typeof result.data==='object'&&!Array.isArray(result.data)?result.data as UnknownRow:{};
  const queue=await readOperations(page,'');const ops=queue.data&&typeof queue.data==='object'&&!Array.isArray(queue.data)?queue.data as UnknownRow:{};
  const rows=Array.isArray(ops.items)?ops.items.map(x=>project(x as UnknownRow)):[];
  return {area,rows,total:typeof ops.total==='number'?ops.total:null,page,counts:mapCounts(raw.outbox),metadata:{expiredPublishedVacancies:num(raw.expiredPublishedVacancies),pendingCases:num(raw.pendingCases),savedFilterFailures:num(ops.savedFilterFailures)}};
 }
 const response=await readAdminPage(area,PURPOSE,page);
 const raw=response.data&&typeof response.data==='object'&&!Array.isArray(response.data)?response.data as UnknownRow:{};
 return {area,total:typeof raw.total==='number'?raw.total:null,page,rows:Array.isArray(raw.items)?raw.items.filter(r=>r&&typeof r==='object').map(r=>project(r as UnknownRow)):[]};
}
export async function loadOps(slug:string,page=1):Promise<OpsPayload>{
 const current=workspaceFromSlug(slug);
 if(!current)throw new Error('JOBKIX_OPS_UNKNOWN_WORKSPACE');
 // Native marketplace permissions are mandatory. No client-supplied role claims.
 const ctx=await requireMarketplaceApiContext('marketplace.admin.access');
 const authorized=new Set<SourceArea>();
 for(const area of ['verification','vacancies','cases','reputation','taxonomy','editorial','health','audit'] as const){
  if(hasMarketplaceWorkspaceAccess(ctx,`jobkix.${area}`))authorized.add(area);
 }
 if(!authorized.has(current.primary))throw new Error('JOBKIX_OPS_FORBIDDEN');
 const allowed=WORKSPACES.filter(w=>authorized.has(w.primary)).map(w=>w.slug);
 const requested=current.related.filter(a=>authorized.has(a as SourceArea)) as SourceArea[];
 const safePage=Number.isInteger(page)&&page>=1&&page<=10000?page:1;
 const settled=await Promise.allSettled(requested.map(area=>one(area,safePage)));
 const sources:Snapshot[]=[],failures:string[]=[];
 settled.forEach((item,i)=>{if(item.status==='fulfilled')sources.push(item.value);else failures.push(`Read failed: ${requested[i]}. Use native ${requested[i]} workspace to investigate.`);});
 // Fail closed when the primary authority is unavailable; do not pretend empty data is success.
 if(!sources.some(s=>s.area===current.primary))throw new Error('JOBKIX_OPS_PRIMARY_READ_FAILED');
 return {workspace:slug,allowed,sources,failures};
}
