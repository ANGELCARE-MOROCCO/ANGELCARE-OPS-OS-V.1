import 'server-only';
import {createCipheriv,createDecipheriv,createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {createServiceClient} from '@/lib/supabase/server';
import {hasMarketplaceWorkspaceAccess,requireMarketplaceApiContext} from '@/angelcare-marketplace/auth/context';
import {JobkixFault} from '../contracts';
import {sourceInput,normalizeVacancy,type SourceInput} from './contracts';
import {collectInlineApi} from './inline-api';

type Row=Record<string,unknown>;
const fail=(message:string):never=>{throw new Error(message)};
const txt=(value:unknown)=>typeof value==='string'?value:'';
const number=(value:unknown)=>Number.isSafeInteger(value)?value as number:0;
const uuid=(s:unknown)=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s)?s:fail('Invalid record identifier');
const cfgKey=()=>{const k=process.env.JOBKIX_SUPPLY_ENCRYPTION_KEY||'';const key=Buffer.from(k,'base64');if(key.length!==32)fail('JOBKIX_SUPPLY_ENCRYPTION_KEY must be 32 random bytes in base64');return key;};
const seal=(str:string)=>{const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',cfgKey(),iv);const data=Buffer.concat([cipher.update(str,'utf8'),cipher.final()]);return [iv.toString('base64'),cipher.getAuthTag().toString('base64'),data.toString('base64')].join('.')};
const unseal=(str:string)=>{const [iv,tag,data]=str.split('.');const dec=createDecipheriv('aes-256-gcm',cfgKey(),Buffer.from(iv,'base64'));dec.setAuthTag(Buffer.from(tag,'base64'));return Buffer.concat([dec.update(Buffer.from(data,'base64')),dec.final()]).toString('utf8')};
export async function supplyAdmin(){const c=await requireMarketplaceApiContext('marketplace.admin.access');if(!hasMarketplaceWorkspaceAccess(c,'jobkix.vacancies'))throw new JobkixFault('FORBIDDEN');return c;}
export const workerAuthorized=(key:string)=>{const expected=process.env.JOBKIX_SUPPLY_WORKER_KEY||'';if(expected.length<32||key.length!==expected.length)return false;return timingSafeEqual(Buffer.from(key),Buffer.from(expected))};
async function event(action:string,actor:string,details:Row={}){const db=await createServiceClient();const {error}=await db.from('jobkix_supply_events').insert({actor,action,source_id:details.source_id||null,mission_id:details.mission_id||null,vacancy_id:details.vacancy_id||null,data:details.data||{}});if(error)fail('Supply audit write failed: '+error.message)}
const mandatory=async(result:{error?:{message:string}|null})=>{if(result.error)fail('Supply storage error: '+result.error.message)};

type InlineApiSource={country:string;endpoint:string;config:unknown;credential_cipher?:string|null;credential_header?:string|null};
async function runInlineApiMission(id:string,source:InlineApiSource):Promise<{id:string;state:'completed';processed:number;accepted:number;rejected:number}>{
 const db=await createServiceClient(),worker='internal-api-'+randomBytes(8).toString('hex');
 const now=new Date();
 const claim=await db.from('jobkix_supply_missions').update({
  state:'running',worker_id:worker,started_at:now.toISOString(),updated_at:now.toISOString(),
  attempts:1,lease_until:new Date(now.getTime()+120000).toISOString()
 }).eq('id',id).eq('state','queued').is('worker_id',null).select('id').maybeSingle();
 await mandatory(claim);
 if(!claim.data)throw Error('Mission was already claimed, cancelled or completed. Refresh Live Missions.');
 try{
  const credential=source.credential_cipher?unseal(source.credential_cipher):'';
  const items=await collectInlineApi({endpoint:source.endpoint,country:source.country,config:source.config,
   credential,credentialHeader:source.credential_header||''});
  const result=await workerBatch(worker,{missionId:id,items});
  if(items.length>0&&result.accepted===0)throw Error('No valid vacancies after mapping. Check title and URL fields, then retry.');
  await workerFinish(worker,{missionId:id,success:true});
  return {id,state:'completed',processed:result.processed,accepted:result.accepted,rejected:result.rejected};
 }catch(error){
  const reason=error instanceof Error?error.message:String(error);
  try{await workerFinish(worker,{missionId:id,success:false,error:reason});}
  catch{
   await db.from('jobkix_supply_missions').update({state:'failed',ended_at:new Date().toISOString(),error_message:reason.slice(0,450)})
    .eq('id',id).eq('worker_id',worker).eq('state','running');
  }
  throw Error('API collection failed: '+reason);
 }
}

export async function adminRead(section:string,params:URLSearchParams){await supplyAdmin();const db=await createServiceClient();const id=params.get('id');
 if(section==='overview'){
  const tables=['jobkix_supply_sources','jobkix_supply_missions','jobkix_supply_vacancies'] as const;
  const numbers=await Promise.all(tables.map(x=>db.from(x).select('id',{count:'exact',head:true})));
  numbers.forEach(x=>{if(x.error)fail('Supply migration is unavailable: '+x.error.message)});
  const recent=await db.from('jobkix_supply_missions').select('id,state,country,created_at,processed,accepted,rejected,source_id').order('created_at',{ascending:false}).limit(12);await mandatory(recent);
  return {stats:{sources:numbers[0].count||0,missions:numbers[1].count||0,vacancies:numbers[2].count||0},rows:recent.data||[]};
 }
 if(section==='sources'){const result=await db.from('jobkix_supply_sources').select('id,name,kind,country,endpoint,config,enabled,approved,publication_mode,version,created_at,updated_at,credential_header').order('updated_at',{ascending:false}).limit(200);await mandatory(result);return {rows:result.data||[]};}
 if(section==='countries'){const result=await db.from('jobkix_supply_sources').select('id,country,approved,enabled,kind').limit(1000);await mandatory(result);return {rows:result.data||[]};}
 if(section==='missions'){const result=await db.from('jobkix_supply_missions').select('id,source_id,state,country,created_at,started_at,ended_at,processed,accepted,rejected,error_message,lease_until').order('created_at',{ascending:false}).limit(150);await mandatory(result);return {rows:result.data||[]};}
 if(section==='bucket'||section==='review'||section==='publications'){
  const page=Math.max(1,Math.min(1000,Number(params.get('page'))||1));let q=db.from('jobkix_supply_vacancies').select('id,source_id,mission_id,title,company,country,city,canonical_url,description,salary_text,work_mode,posted_at,state,quality_score,first_seen,last_seen,version,external_ref,published_at,raw,normalized,review_notes',{count:'exact'}).order('last_seen',{ascending:false}).range((page-1)*75,page*75-1);
  if(section==='review')q=q.in('state',['ready','needs_review','approved']);if(section==='publications')q=q.in('state',['published','withdrawn','approved']);
  const result=await q;await mandatory(result);return {rows:result.data||[],count:result.count||0,page};
 }
 if(section==='audit'){const result=await db.from('jobkix_supply_events').select('id,actor,action,source_id,mission_id,vacancy_id,data,created_at').order('created_at',{ascending:false}).limit(120);await mandatory(result);return {rows:result.data||[]};}
 if(section==='record'&&id){const result=await db.from('jobkix_supply_vacancies').select('*').eq('id',uuid(id)).maybeSingle();await mandatory(result);return {record:result.data};}
 throw new JobkixFault('INVALID_INPUT');
}
export async function adminCommand(body:Row):Promise<unknown>{const actor=await supplyAdmin(),db=await createServiceClient();const a=txt(body.action),user=String(actor.actor.id);
 if(a==='source.save'){
  const p=sourceInput(body.source);if(p.approved&&!hasMarketplaceWorkspaceAccess(actor,'jobkix.editorial'))throw new JobkixFault('FORBIDDEN');const changes={name:p.name,kind:p.kind,country:p.country,endpoint:p.endpoint,config:p.config,enabled:p.enabled,approved:p.approved,publication_mode:p.publicationMode,credential_header:p.credentialHeader||null,updated_by:user,updated_at:new Date().toISOString()};
  if(p.enabled&&!p.approved)fail('Approve a source before enabling');
  if(p.id){const existing=await db.from('jobkix_supply_sources').select('id,version').eq('id',p.id).maybeSingle();await mandatory(existing);if(!existing.data||existing.data.version!==p.expectedVersion)throw new JobkixFault('VERSION_CONFLICT');
   const result=await db.from('jobkix_supply_sources').update({...changes,...(p.credential?{credential_cipher:seal(p.credential)}:{}),version:p.expectedVersion+1}).eq('id',p.id).eq('version',p.expectedVersion).select('id,version').maybeSingle();await mandatory(result);if(!result.data)throw new JobkixFault('VERSION_CONFLICT');await event('source.updated',user,{source_id:p.id,data:{kind:p.kind,country:p.country}});return result.data;
  }
  const result=await db.from('jobkix_supply_sources').insert({...changes,credential_cipher:p.credential?seal(p.credential):null,created_by:user}).select('id,version').single();await mandatory(result);await event('source.created',user,{source_id:result.data!.id,data:{kind:p.kind,country:p.country}});return result.data;
 }
 if(a==='source.test'){const p=sourceInput(body.source);return {valid:true,engine:p.kind,details:p.kind==='api'?'JSON/RSS field mapping configured':p.kind==='scrapy'?'CSS selectors configured':'JobSpy board parameters configured',note:'Configuration validation only; remote collection is verified by a real mission.'};}
 if(a==='vacancy.batch'){const ids=Array.isArray(body.items)?body.items:[];if(ids.length<1||ids.length>20)fail('Choose 1–20 records');const results=[];for(const item of ids){if(!item||typeof item!=='object')fail('Invalid batch record');const record=item as Row;results.push(await adminCommand({action:'vacancy.decide',id:record.id,version:record.version,decision:body.decision}));}return {changed:results.length,rows:results};}
 if(a==='mission.start'){
  const id=uuid(body.sourceId),source=await db.from('jobkix_supply_sources').select('id,name,kind,country,endpoint,config,version,enabled,approved,publication_mode,credential_cipher,credential_header').eq('id',id).maybeSingle();await mandatory(source);
  if(!source.data?.approved||!source.data.enabled)throw new Error('Source is not enabled and approved');
  if(source.data.kind!=='api')throw Error('This engine is not available in the current Marketplace deployment. Only bounded JSON API collection is enabled.');
  const ongoing=await db.from('jobkix_supply_missions').select('id,state').eq('source_id',id).in('state',['queued','running']).order('created_at',{ascending:true}).limit(1);await mandatory(ongoing);
  if(ongoing.data?.length){
   if(ongoing.data[0].state==='queued')return runInlineApiMission(ongoing.data[0].id,source.data);
   throw Error('A mission is already running for this source. See Live Missions.');
  }
  const result=await db.from('jobkix_supply_missions').insert({source_id:id,country:source.data.country,config_snapshot:{kind:source.data.kind,endpoint:source.data.endpoint,config:source.data.config,publication_mode:source.data.publication_mode},source_version:source.data.version,created_by:user}).select('id,state').single();await mandatory(result);
  await event('mission.queued',user,{source_id:id,mission_id:result.data!.id});
  return runInlineApiMission(result.data!.id,source.data);
 }
 if(a==='mission.cancel'){
  const id=uuid(body.id),result=await db.from('jobkix_supply_missions').update({state:'cancelled',ended_at:new Date().toISOString()}).eq('id',id).in('state',['queued','running']).select('id,state').maybeSingle();await mandatory(result);if(!result.data)throw new Error('Only queued/running missions can be cancelled');await event('mission.cancelled',user,{mission_id:id});return result.data;
 }
 if(a==='vacancy.enrich'){const id=uuid(body.id),version=number(body.version);const q=await db.from('jobkix_supply_vacancies').select('id,version,state').eq('id',id).maybeSingle();await mandatory(q);if(!q.data||q.data.version!==version)throw new JobkixFault('VERSION_CONFLICT');if(q.data.state==='published'||q.data.state==='withdrawn')throw new Error('Withdraw the public listing before editing');const patch=(body.fields&&typeof body.fields==='object'&&!Array.isArray(body.fields)?body.fields:{}) as Row;const normalized={settingId:txt(patch.settingId).slice(0,100)||null,occupationId:txt(patch.occupationId).slice(0,100)||null,workSchedule:txt(patch.workSchedule).slice(0,40)||null,contractType:txt(patch.contractType).slice(0,40)||null,sponsorship:txt(patch.sponsorship).slice(0,30)||'unknown',relocation:txt(patch.relocation).slice(0,30)||'unknown'};const notes=txt(body.notes).slice(0,2000);const r=await db.from('jobkix_supply_vacancies').update({normalized,review_notes:notes,version:version+1,updated_at:new Date().toISOString()}).eq('id',id).eq('version',version).select('id,version').maybeSingle();await mandatory(r);if(!r.data)throw new JobkixFault('VERSION_CONFLICT');await event('vacancy.enriched',user,{vacancy_id:id});return r.data;}
 if(a==='mission.retry'){const id=uuid(body.id);const r=await db.from('jobkix_supply_missions').select('source_id').eq('id',id).in('state',['failed','cancelled']).maybeSingle();await mandatory(r);if(!r.data)throw new Error('Only failed/cancelled missions can be retried');return adminCommand({action:'mission.start',sourceId:r.data.source_id});}
 if(a==='vacancy.decide'){
  const id=uuid(body.id),version=number(body.version),decision=txt(body.decision);if(!['approved','rejected','published','withdrawn','needs_review'].includes(decision))fail('Invalid decision');
  const row=await db.from('jobkix_supply_vacancies').select('id,state,version,source_id,quality_score').eq('id',id).maybeSingle();await mandatory(row);if(!row.data||row.data.version!==version)throw new JobkixFault('VERSION_CONFLICT');
  const old=txt(row.data.state),legal=(decision==='approved'&&['ready','needs_review'].includes(old))||(decision==='rejected'&&['new','ready','needs_review','approved'].includes(old))||(decision==='needs_review'&&['ready','approved'].includes(old))||(decision==='published'&&old==='approved')||(decision==='withdrawn'&&old==='published');if(!legal)fail('Invalid status transition');
  if(decision==='published'){
   if(!hasMarketplaceWorkspaceAccess(actor,'jobkix.editorial'))throw new JobkixFault('FORBIDDEN');
   const source=await db.from('jobkix_supply_sources').select('approved,publication_mode').eq('id',row.data.source_id).single();await mandatory(source);if(!source.data?.approved||source.data.publication_mode==='none'||row.data.quality_score<65)throw new Error('Source permission and quality gate required');
  }
  const result=await db.from('jobkix_supply_vacancies').update({state:decision,version:version+1,updated_at:new Date().toISOString(),...(decision==='approved'?{approved_by:user}:{}),...(decision==='published'?{published_by:user,published_at:new Date().toISOString()}:{}),...(decision==='withdrawn'?{published_at:null}:{})}).eq('id',id).eq('version',version).select('id,state,version').maybeSingle();await mandatory(result);if(!result.data)throw new JobkixFault('VERSION_CONFLICT');await event('vacancy.'+decision,user,{vacancy_id:id,source_id:row.data.source_id,data:{from:old,to:decision}});return result.data;
 }
 throw new JobkixFault('INVALID_INPUT');
}

export async function workerClaim(worker:string){const db=await createServiceClient(),r=await db.rpc('jobkix_supply_claim',{p_worker:worker});await mandatory(r);const mission=Array.isArray(r.data)?r.data[0]:null;if(!mission)return null;
 const source=await db.from('jobkix_supply_sources').select('credential_cipher,credential_header,approved,enabled').eq('id',mission.source_id).single();await mandatory(source);if(!source.data?.approved||!source.data.enabled){await db.from('jobkix_supply_missions').update({state:'failed',error_message:'Source disabled',ended_at:new Date().toISOString()}).eq('id',mission.id);return null;}
 const credential=source.data.credential_cipher?unseal(source.data.credential_cipher):'';
 await event('mission.claimed',worker,{source_id:mission.source_id,mission_id:mission.id});return {id:mission.id,sourceId:mission.source_id,country:mission.country,source:mission.config_snapshot,credential,credentialHeader:source.data.credential_header||''};
}
export async function workerBatch(worker:string,body:Row){const id=uuid(body.missionId),items=Array.isArray(body.items)?body.items:[];if(items.length>40)fail('Batch too large');const db=await createServiceClient();const mission=await db.from('jobkix_supply_missions').select('id,state,worker_id,source_id,country,processed,accepted,rejected,config_snapshot').eq('id',id).maybeSingle();await mandatory(mission);if(!mission.data||mission.data.state!=='running'||mission.data.worker_id!==worker)throw new JobkixFault('FORBIDDEN');
 const mode=(mission.data.config_snapshot as Row)?.publication_mode;let accepted=0,rejected=0;
 const rows=[];for(const raw of items){const item=normalizeVacancy(raw,mission.data.country);if(!item){rejected++;continue;}
  const canonical=new URL(item.canonical_url);canonical.search='';canonical.hash='';const key=[canonical.href.toLowerCase(),item.title.toLowerCase(),item.country].join('|');const fingerprint=createHash('sha256').update(key).digest('hex');const score=Math.min(100,(item.title?30:0)+(item.company?20:0)+(item.city?10:0)+(item.description.length>50?15:0)+(item.canonical_url?15:0)+(item.external_ref?10:0));
  rows.push({source_id:mission.data.source_id,mission_id:id,fingerprint,...item,quality_score:score,state:score>=65&&mode!=='none'?'ready':'needs_review',last_seen:new Date().toISOString()});accepted++;
 }
 if(rows.length){const result=await db.from('jobkix_supply_vacancies').upsert(rows,{onConflict:'fingerprint',ignoreDuplicates:true});await mandatory(result)}
 const update=await db.from('jobkix_supply_missions').update({processed:mission.data.processed+items.length,accepted:mission.data.accepted+accepted,rejected:mission.data.rejected+rejected,lease_until:new Date(Date.now()+15*60*1000).toISOString(),updated_at:new Date().toISOString()}).eq('id',id).eq('worker_id',worker).eq('state','running').select('id');await mandatory(update);return {accepted,rejected,processed:items.length};
}
export async function workerFinish(worker:string,body:Row){const id=uuid(body.missionId),state=body.success===true?'completed':'failed',db=await createServiceClient();const result=await db.from('jobkix_supply_missions').update({state,ended_at:new Date().toISOString(),error_message:body.success===true?null:txt(body.error).slice(0,500)}).eq('id',id).eq('state','running').eq('worker_id',worker).select('id,source_id');await mandatory(result);if(!result.data?.length)throw new JobkixFault('VERSION_CONFLICT');await event('mission.'+state,worker,{mission_id:id,source_id:result.data[0].source_id});return {id,state};}
export async function publicExternal(country:string|null=null,limit=24){const db=await createServiceClient();let query=db.from('jobkix_supply_vacancies').select('id,title,company,country,city,description,canonical_url,salary_text,work_mode,published_at,source_id').eq('state','published').order('published_at',{ascending:false}).limit(limit);if(country&&/^[A-Z]{2}$/.test(country))query=query.eq('country',country);
 const r=await query;if(r.error)return [];const ids=[...new Set((r.data||[]).map(x=>x.source_id))];if(!ids.length)return [];
 const sources=await db.from('jobkix_supply_sources').select('id,name,approved,publication_mode').in('id',ids).eq('approved',true).neq('publication_mode','none');if(sources.error)return [];const allowed=new Map((sources.data||[]).map(s=>[s.id,s]));return (r.data||[]).filter(v=>allowed.has(v.source_id)).map(v=>({...v,source_name:allowed.get(v.source_id)?.name||'External source'}));
}
export async function externalDetail(id:string){uuid(id);const db=await createServiceClient();const r=await db.from('jobkix_supply_vacancies').select('id,title,company,country,city,description,canonical_url,salary_text,work_mode,published_at,source_id').eq('id',id).eq('state','published').maybeSingle();if(r.error||!r.data)return null;const s=await db.from('jobkix_supply_sources').select('name,approved,publication_mode').eq('id',r.data.source_id).maybeSingle();if(s.error||!s.data?.approved||s.data.publication_mode==='none')return null;return {...r.data,source_name:s.data.name,publication_mode:s.data.publication_mode};}
