import 'server-only';
import {createCipheriv,createDecipheriv,createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {createServiceClient} from '@/lib/supabase/server';
import {hasMarketplaceWorkspaceAccess,requireMarketplaceApiContext} from '@/angelcare-marketplace/auth/context';
import {JobkixFault} from '../contracts';
import {sourceInput,normalizeVacancy,type SourceInput} from './contracts';
import {collectInlineApi} from './inline-api';
import {collectFeed} from './r3/feed';
import {sourceIdentityKey,publicationAssessment,withManualEnrichment,mergeEnrichment} from './native-gate';
import {randomUUID} from 'node:crypto';
import {SupplyError,assertDecisionResult} from './errors';

type Row=Record<string,unknown>;
const fail=(message:string):never=>{throw new Error(message)};
const txt=(value:unknown)=>typeof value==='string'?value:'';
const number=(value:unknown)=>Number.isSafeInteger(value)?value as number:0;
const uuid=(s:unknown)=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s)?s:fail('Invalid record identifier');
const cfgKey=()=>{const k=process.env.JOBKIX_SUPPLY_ENCRYPTION_KEY||'';const key=Buffer.from(k,'base64');if(key.length!==32)fail('JOBKIX_SUPPLY_ENCRYPTION_KEY must be 32 random bytes in base64');return key;};
const seal=(str:string)=>{const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',cfgKey(),iv);const data=Buffer.concat([cipher.update(str,'utf8'),cipher.final()]);return [iv.toString('base64'),cipher.getAuthTag().toString('base64'),data.toString('base64')].join('.')};
const unseal=(str:string)=>{const [iv,tag,data]=str.split('.');const dec=createDecipheriv('aes-256-gcm',cfgKey(),Buffer.from(iv,'base64'));dec.setAuthTag(Buffer.from(tag,'base64'));return Buffer.concat([dec.update(Buffer.from(data,'base64')),dec.final()]).toString('utf8')};

/** Opt-in publication for strictly verified, explicitly authorized external sources.
 * Never creates a native employer account, never fabricates applications, and never
 * exposes unlicensed descriptions. A low-quality listing remains in review. */
async function publishEligible(sourceId:string, actor:string, missionId?:string, limit=100, automatic=false){
 const db=await createServiceClient();
 const src=await db.from('jobkix_supply_sources').select('id,enabled,approved,archived_at,publication_mode,config').eq('id',sourceId).maybeSingle();
 await mandatory(src);
 if(!src.data?.approved||!src.data.enabled||src.data.archived_at||src.data.publication_mode!=='full')
  throw Error('Publication requires an active, explicitly approved source with content permissions');
 const cfg=src.data.config&&typeof src.data.config==='object'?src.data.config as Row:{};
 if(automatic&&cfg.autoPublish!==true) return {published:0,eligible:0};
 let q=db.from('jobkix_supply_vacancies').select('id,version,state,title,company,canonical_url,quality_score,description,city,country,normalized,last_seen').eq('source_id',sourceId).in('state',automatic?['ready']:['ready','approved']) .order('last_seen',{ascending:false}).limit(Math.max(1,Math.min(100,limit)));
 if(missionId)q=q.eq('mission_id',missionId);
 const rows=await q;await mandatory(rows);
 let published=0,skipped=0;const outcomes:Row[]=[];
 for(const vacancy of rows.data||[]){
  const info=vacancy.normalized&&typeof vacancy.normalized==='object'&&!Array.isArray(vacancy.normalized)?vacancy.normalized as Row:{};
  if(!automatic&&vacancy.state!=='approved'){skipped++;outcomes.push({id:vacancy.id,status:'blocked',reasons:['EDITORIAL_APPROVAL_REQUIRED']});continue;}
  const eligibility=publicationAssessment(vacancy,{...src.data,config:cfg});
  if(!eligibility.eligible){
   skipped++;outcomes.push({id:vacancy.id,status:'blocked',reasons:eligibility.reasons});continue;
  }
  try {
   const {data,error}=await db.rpc('jobkix_supply_r4_decide',{p_id:vacancy.id,p_version:vacancy.version,p_action:'published',p_actor:actor,p_key:randomUUID(),p_automatic:automatic});
   await mandatory({error});const decision=assertDecisionResult(data);published++;outcomes.push({id:vacancy.id,status:'published',version:decision.version});
  }catch(error){skipped++;outcomes.push({id:vacancy.id,status:error instanceof SupplyError&&error.code==='PUBLICATION_NOT_ELIGIBLE'?'blocked':'failed',code:error instanceof SupplyError?error.code:'INTERNAL_ERROR',reasons:error instanceof SupplyError?error.blockers.map(x=>x.code):[]});}

 }
 return {published,eligible:(rows.data||[]).length,skipped,sourceId,automatic,outcomes};
}

export async function supplyAdmin(){const c=await requireMarketplaceApiContext('marketplace.admin.access');if(!hasMarketplaceWorkspaceAccess(c,'jobkix.vacancies'))throw new JobkixFault('FORBIDDEN');return c;}
export const workerAuthorized=(key:string)=>{const expected=process.env.JOBKIX_SUPPLY_WORKER_KEY||'';if(expected.length<32||key.length!==expected.length)return false;return timingSafeEqual(Buffer.from(key),Buffer.from(expected))};
async function event(action:string,actor:string,details:Row={}){const db=await createServiceClient();const {error}=await db.from('jobkix_supply_events').insert({actor,action,source_id:details.source_id||null,mission_id:details.mission_id||null,vacancy_id:details.vacancy_id||null,data:details.data||{}});if(error)fail('Supply audit write failed: '+error.message)}
const mandatory=async(result:{error?:{message:string}|null})=>{if(result.error)fail('Supply storage error: '+result.error.message)};

type InlineApiSource={id:string;country:string;endpoint:string;config:unknown;credential_cipher?:string|null;credential_header?:string|null};
async function runInlineApiMission(id:string,source:InlineApiSource):Promise<{id:string;state:'completed';processed:number;accepted:number;rejected:number;published?:number}>{
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
   const cfg=source.config&&typeof source.config==='object'?source.config as Row:{};
   const rss=cfg.format==='rss';
   let items:Row[]=[];
   let feedCache:{etag:string|null;lastModified:string|null;unchanged:boolean}|null=null;
   if(rss){
    const cache=await db.from('jobkix_supply_r3_feed_cache').select('etag,last_modified').eq('source_id',source.id).maybeSingle();
    await mandatory(cache);
    const feed=await collectFeed({endpoint:source.endpoint,country:source.country,config:{...cfg,feedEtag:cache.data?.etag||'',feedLastModified:cache.data?.last_modified||''}});
    items=feed.items as Row[];
    feedCache={etag:feed.etag,lastModified:feed.lastModified,unchanged:feed.unchanged};
   }else{
    items=await collectInlineApi({endpoint:source.endpoint,country:source.country,config:source.config,
     credential,credentialHeader:source.credential_header||''});
   }
   const result=await workerBatch(worker,{missionId:id,items});
   const auto=await publishEligible(source.id,'jobkix-automated-supply',id,100,true);
   if(feedCache){
    const saved=await db.from('jobkix_supply_r3_feed_cache').upsert({source_id:source.id,etag:feedCache.etag,last_modified:feedCache.lastModified,last_checked_at:new Date().toISOString(),...(feedCache.unchanged?{}:{last_changed_at:new Date().toISOString()})},{onConflict:'source_id'});
    await mandatory(saved);
   }
  if(items.length>0&&result.accepted===0)throw Error('No valid vacancies after mapping. Check title and URL fields, then retry.');
  await workerFinish(worker,{missionId:id,success:true});
  return {id,state:'completed',processed:result.processed,accepted:result.accepted,rejected:result.rejected,published:auto.published};
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

/** Durable scheduler entry: called only by the internal Node coordinator, never through public admin HTTP. */
export async function executeR3ScheduledSource(sourceId:string,scheduleId:string):Promise<{id:string;state:'completed';processed:number;accepted:number;rejected:number;published?:number}>{
 const db=await createServiceClient();
 const source=await db.from('jobkix_supply_sources').select('id,country,kind,endpoint,config,approved,enabled,credential_cipher,credential_header,version,publication_mode,archived_at').eq('id',sourceId).maybeSingle();
 await mandatory(source);
 if(!source.data||!source.data.approved||!source.data.enabled||source.data.archived_at||source.data.kind!=='api')throw Error('Scheduled source is disabled, unapproved, archived or unsupported');
 const active=await db.from('jobkix_supply_missions').select('id,state').eq('source_id',sourceId).in('state',['queued','running']).order('created_at',{ascending:true}).limit(1);await mandatory(active);
 if(active.data?.[0]?.state==='running')throw Error('Another source mission is already executing');
 let missionId=active.data?.[0]?.id;
 if(!missionId){const inserted=await db.from('jobkix_supply_missions').insert({source_id:sourceId,country:source.data.country,config_snapshot:{kind:'api',endpoint:source.data.endpoint,config:source.data.config,publication_mode:source.data.publication_mode,schedule_id:scheduleId},source_version:source.data.version}).select('id').single();await mandatory(inserted);missionId=inserted.data!.id;}
 await event('r3.schedule.dispatched','jobkix-r3-scheduler',{source_id:sourceId,mission_id:missionId,data:{scheduleId}});
 return runInlineApiMission(missionId!,source.data);
}

export async function adminRead(section:string,params:URLSearchParams){await supplyAdmin();if(['feeds','schedules','imports'].includes(section))return {rows:[]};const db=await createServiceClient();const id=params.get('id');
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
  const p=sourceInput(body.source);if((p.approved||p.publicationMode!=='none'||(Array.isArray((p.config as unknown as Row).officialApplyHosts)&&((p.config as unknown as Row).officialApplyHosts as unknown[]).length>0))&&!hasMarketplaceWorkspaceAccess(actor,'jobkix.editorial'))throw new JobkixFault('FORBIDDEN');const changes={name:p.name,kind:p.kind,country:p.country,endpoint:p.endpoint,config:p.config,enabled:p.enabled,approved:p.approved,publication_mode:p.publicationMode,credential_header:p.credentialHeader||null,updated_by:user,updated_at:new Date().toISOString()};
  if(p.enabled&&!p.approved)fail('Approve a source before enabling');
  if(p.id){const existing=await db.from('jobkix_supply_sources').select('id,version,approved,publication_mode,config').eq('id',p.id).maybeSingle();await mandatory(existing);if(!existing.data||existing.data.version!==p.expectedVersion)throw new JobkixFault('VERSION_CONFLICT');
   if((existing.data.approved||existing.data.publication_mode!=='none')&&!hasMarketplaceWorkspaceAccess(actor,'jobkix.editorial'))throw new JobkixFault('FORBIDDEN');
   const rawSource=body.source&&typeof body.source==='object'&&!Array.isArray(body.source)?body.source as Row:{};
   const supplied=rawSource.config&&typeof rawSource.config==='object'&&!Array.isArray(rawSource.config)?rawSource.config as Row:{};
   const older=existing.data.config&&typeof existing.data.config==='object'&&!Array.isArray(existing.data.config)?existing.data.config as Row:{};
   // Do not erase an editorially approved host registry when the old admin form resaves a source.
   if(!Object.prototype.hasOwnProperty.call(supplied,'officialApplyHosts')&&Array.isArray(older.officialApplyHosts))
    changes.config={...p.config,officialApplyHosts:older.officialApplyHosts};
   const result=await db.from('jobkix_supply_sources').update({...changes,...(p.credential?{credential_cipher:seal(p.credential)}:{}),version:p.expectedVersion+1}).eq('id',p.id).eq('version',p.expectedVersion).select('id,version').maybeSingle();await mandatory(result);if(!result.data)throw new JobkixFault('VERSION_CONFLICT');await event('source.updated',user,{source_id:p.id,data:{kind:p.kind,country:p.country}});return result.data;
  }
  const result=await db.from('jobkix_supply_sources').insert({...changes,credential_cipher:p.credential?seal(p.credential):null,created_by:user}).select('id,version').single();await mandatory(result);await event('source.created',user,{source_id:result.data!.id,data:{kind:p.kind,country:p.country}});return result.data;
 }
 if(a==='source.test'){const p=sourceInput(body.source);return {valid:true,engine:p.kind,details:p.kind==='api'?'JSON/RSS field mapping configured':p.kind==='scrapy'?'CSS selectors configured':'JobSpy board parameters configured',note:'Configuration validation only; remote collection is verified by a real mission.'};}
 if(a==='vacancy.batch'){
  const ids=Array.isArray(body.items)?body.items:[];if(ids.length<1||ids.length>20)fail('Choose 1–20 records');
  const results:Row[]=[];for(const item of ids){if(!item||typeof item!=='object')fail('Invalid batch record');
   const record=item as Row;try{const value=await adminCommand({action:'vacancy.decide',id:record.id,version:record.version,decision:body.decision,key:randomUUID()});results.push({id:record.id,status:'completed',value});}
   catch(error){results.push({id:record.id,status:'failed',code:error instanceof SupplyError?error.code:'INTERNAL_ERROR',blockers:error instanceof SupplyError?error.blockers:[]});}
  }return {changed:results.filter(x=>x.status==='completed').length,failed:results.filter(x=>x.status==='failed').length,rows:results};
 }
 if(a==='mission.start'){
  const id=uuid(body.sourceId),source=await db.from('jobkix_supply_sources').select('id,name,kind,country,endpoint,config,version,enabled,approved,publication_mode,credential_cipher,credential_header').eq('id',id).maybeSingle();await mandatory(source);
  if(!source.data?.approved||!source.data.enabled)throw new Error('Source is not enabled and approved');
  if(source.data.kind!=='api')throw Error('Scrapy/JobSpy need an explicitly approved execution architecture; only API/RSS sources are supported in this Marketplace.');
  if((source.data.config as Row)?.format==='rss'){const flags=await db.from('jobkix_supply_r3_control').select('rss_enabled').eq('id',1).single();await mandatory(flags);if(!flags.data?.rss_enabled)throw Error('RSS engine is paused globally. Enable it in Automation & Schedules.');}
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
 if(a==='vacancy.assess'){
  if(!hasMarketplaceWorkspaceAccess(actor,'jobkix.editorial'))throw new JobkixFault('FORBIDDEN');
  const id=uuid(body.id);const {data,error}=await db.rpc('jobkix_supply_r4_assess',{p_id:id});await mandatory({error});return data;
 }
 if(a==='vacancy.publish_eligible'){
  if(!hasMarketplaceWorkspaceAccess(actor,'jobkix.editorial'))throw new JobkixFault('FORBIDDEN');
  const sourceId=uuid(body.sourceId);return publishEligible(sourceId,user,undefined,Math.max(1,Math.min(100,Number(body.limit)||50)),false);
 }
 if(a==='vacancy.enrich'){
  if(!hasMarketplaceWorkspaceAccess(actor,'jobkix.editorial'))throw new JobkixFault('FORBIDDEN');
  const id=uuid(body.id),version=number(body.version);
  const q=await db.from('jobkix_supply_vacancies').select('id,version,state,normalized,canonical_url,quality_score,review_notes').eq('id',id).maybeSingle();
  await mandatory(q);if(!q.data||q.data.version!==version)throw new JobkixFault('VERSION_CONFLICT');
  if(q.data.state==='published'||q.data.state==='withdrawn')throw new SupplyError('INVALID_TRANSITION',422);
  const patch=(body.fields&&typeof body.fields==='object'&&!Array.isArray(body.fields)?body.fields:{}) as Row;
  const wantsContent=patch.duties!==undefined||patch.requirements!==undefined;
  if(wantsContent&&(patch.editorialVerified!==true||txt(patch.evidenceUrl)!==q.data.canonical_url))
   throw new SupplyError('EDITORIAL_SOURCE_EVIDENCE_REQUIRED',422);
  const normalized=withManualEnrichment(q.data.normalized,patch),notes=txt(body.notes).slice(0,2000);
  const previous=q.data.normalized&&typeof q.data.normalized==='object'?q.data.normalized as Row:{};
  const wasRich=(Array.isArray(previous.duties)&&previous.duties.length>0)||(Array.isArray(previous.requirements)&&previous.requirements.length>0);
  const nowRich=(Array.isArray(normalized.duties)&&normalized.duties.length>0)||(Array.isArray(normalized.requirements)&&normalized.requirements.length>0);
  const score=Math.min(100,Math.max(0,Number(q.data.quality_score||0)+(nowRich&&!wasRich?10:!nowRich&&wasRich?-10:0)));
  const {data,error}=await db.rpc('jobkix_supply_r4_enrich',{
   p_id:id,p_version:version,p_actor:user,p_normalized:normalized,p_notes:notes,
   p_quality:score,p_evidence:wantsContent?q.data.canonical_url:null
  });
  await mandatory({error});return assertDecisionResult(data);
 }
 if(a==='mission.retry'){const id=uuid(body.id);const r=await db.from('jobkix_supply_missions').select('source_id').eq('id',id).in('state',['failed','cancelled']).maybeSingle();await mandatory(r);if(!r.data)throw new Error('Only failed/cancelled missions can be retried');return adminCommand({action:'mission.start',sourceId:r.data.source_id});}
 if(a==='vacancy.decide'){
  if(!hasMarketplaceWorkspaceAccess(actor,'jobkix.editorial'))throw new JobkixFault('FORBIDDEN');
  const id=uuid(body.id),version=number(body.version),decision=txt(body.decision);
  if(!['approved','rejected','published','withdrawn','needs_review'].includes(decision))throw new JobkixFault('INVALID_INPUT');
  const key=typeof body.key==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(body.key)?body.key:randomUUID();
  // The database RPC serializes all decisions and their audit event under a row lock.
  // No prior JS-side state/version read: a retry can replay its receipt after a commit.
  const {data,error}=await db.rpc('jobkix_supply_r4_decide',{p_id:id,p_version:version,p_action:decision,p_actor:user,p_key:key,p_automatic:false});
  await mandatory({error});return assertDecisionResult(data);
 }

 throw new JobkixFault('INVALID_INPUT');
}

export async function workerClaim(worker:string){const db=await createServiceClient(),r=await db.rpc('jobkix_supply_claim',{p_worker:worker});await mandatory(r);const mission=Array.isArray(r.data)?r.data[0]:null;if(!mission)return null;
 const source=await db.from('jobkix_supply_sources').select('credential_cipher,credential_header,approved,enabled').eq('id',mission.source_id).single();await mandatory(source);if(!source.data?.approved||!source.data.enabled){await db.from('jobkix_supply_missions').update({state:'failed',error_message:'Source disabled',ended_at:new Date().toISOString()}).eq('id',mission.id);return null;}
 const credential=source.data.credential_cipher?unseal(source.data.credential_cipher):'';
 await event('mission.claimed',worker,{source_id:mission.source_id,mission_id:mission.id});return {id:mission.id,sourceId:mission.source_id,country:mission.country,source:mission.config_snapshot,credential,credentialHeader:source.data.credential_header||''};
}
export async function workerBatch(worker:string,body:Row){const id=uuid(body.missionId),items=Array.isArray(body.items)?body.items:[];if(items.length>40)fail('Batch too large');const db=await createServiceClient();const mission=await db.from('jobkix_supply_missions').select('id,state,worker_id,source_id,country,processed,accepted,rejected,config_snapshot').eq('id',id).maybeSingle();await mandatory(mission);if(!mission.data||mission.data.state!=='running'||mission.data.worker_id!==worker)throw new JobkixFault('FORBIDDEN');
 const missionSourceId=mission.data.source_id;
 const mode=(mission.data.config_snapshot as Row)?.publication_mode;let accepted=0,rejected=0;
 const source=await db.from('jobkix_supply_sources').select('approved,enabled,archived_at,publication_mode,config')
  .eq('id',mission.data.source_id).maybeSingle();await mandatory(source);
 if(!source.data)throw Error('Supply source disappeared');
 const seen=new Set<string>();
 const rows=[];
 for(const raw of items){
  const item=normalizeVacancy(raw,mission.data.country);
  if(!item){rejected++;continue;}
  const fingerprint=createHash('sha256').update(sourceIdentityKey(mission.data.source_id,item.external_ref,item.canonical_url)).digest('hex');
  if(seen.has(fingerprint)){rejected++;continue;} // no duplicate promotion in one source batch
  seen.add(fingerprint);
  const rich=item.normalized.duties.length>0||item.normalized.requirements.length>0;
  const score=Math.min(100,(item.title?25:0)+(item.company?20:0)+(item.city?10:0)+
   (item.description.length>=120?20:0)+(rich?10:0)+(item.canonical_url?10:0)+
   (item.normalized.countryEvidence==='source'?5:0));
  const last_seen=new Date().toISOString();
  rows.push({source_id:mission.data.source_id,mission_id:id,fingerprint,...item,
   quality_score:score,state:score>=80&&mode!=='none'?'ready':'needs_review',last_seen});accepted++;
 }
 if(rows.length){
  // Scoping by source plus source-native job ID avoids incorrect merging of different employers' jobs.
  // Exact URLs and new fingerprints also identify legacy records created before this migration.
  const refs=rows.map(r=>r.external_ref).filter(Boolean),urls=rows.map(r=>r.canonical_url),hashes=rows.map(r=>r.fingerprint);
  const read=async(field:'external_ref'|'canonical_url'|'fingerprint',values:string[])=>{
   if(!values.length)return [] as Row[];
   const found=await db.from('jobkix_supply_vacancies')
    .select('id,external_ref,canonical_url,fingerprint,state,version,normalized,review_notes,published_at')
    .eq('source_id',missionSourceId).in(field,[...new Set(values)]).limit(250);
   await mandatory(found);return (found.data||[]) as Row[];
  };
  const candidates=[...await read('external_ref',refs),...await read('canonical_url',urls),...await read('fingerprint',hashes)];
  const unique=new Map<string,Row>();for(const candidate of candidates)unique.set(String(candidate.id),candidate);
  const byRef=new Map<string,Row[]>(),byUrl=new Map<string,Row[]>(),byHash=new Map<string,Row[]>();
  const append=(map:Map<string,Row[]>,key:string,row:Row)=>{if(!key)return;map.set(key,[...(map.get(key)||[]),row]);};
  for(const candidate of unique.values()){
   append(byRef,txt(candidate.external_ref),candidate);
   append(byUrl,txt(candidate.canonical_url),candidate);
   append(byHash,txt(candidate.fingerprint),candidate);
  }
  for(const row of rows){
   let possible:Row[]=[];
   if(row.external_ref)possible=byRef.get(row.external_ref)||[];
   if(!possible.length){
    const urlMatches=byUrl.get(row.canonical_url)||[];
    // A shared URL with a DIFFERENT nonblank source job ID is not the same vacancy.
    possible=urlMatches.filter(x=>!txt(x.external_ref)||!row.external_ref||txt(x.external_ref)===row.external_ref);
   }
   if(!possible.length)possible=byHash.get(row.fingerprint)||[];
   const distinct=new Map(possible.map(x=>[String(x.id),x]));
   if(distinct.size>1)throw Error('AMBIGUOUS_EXTERNAL_IDENTITY: manual source deduplication required');
   const existing=[...distinct.values()][0];
   if(existing){
    const state=String(existing.state),normalized=mergeEnrichment(row.normalized,existing.normalized,Boolean(txt(existing.review_notes))||['approved','published'].includes(state),row.canonical_url);
    const sourceRich=(Array.isArray(row.normalized.duties)&&row.normalized.duties.length>0)||(Array.isArray(row.normalized.requirements)&&row.normalized.requirements.length>0);
    const mergedRich=(Array.isArray(normalized.duties)&&normalized.duties.length>0)||(Array.isArray(normalized.requirements)&&normalized.requirements.length>0);
    const editorial=normalized.editorialOverrides&&typeof normalized.editorialOverrides==='object'&&!Array.isArray(normalized.editorialOverrides)?normalized.editorialOverrides as Row:{};
    const verifiedEditor=txt(editorial.evidenceUrl)===row.canonical_url;
    const recalculatedScore=Math.min(100,row.quality_score+(!sourceRich&&mergedRich&&verifiedEditor?10:0));
    const eligible=publicationAssessment({...row,normalized,quality_score:recalculatedScore},source.data);
    const keepPublished=state==='published'&&eligible.eligible;
    const nextState=keepPublished?'published':['withdrawn','rejected'].includes(state)?state:
     ['published','approved'].includes(state)?(eligible.eligible?'approved':'needs_review'):row.state;
    const updated=await db.from('jobkix_supply_vacancies').update({
     mission_id:id,fingerprint:row.fingerprint,canonical_url:row.canonical_url,
     title:row.title,company:row.company,country:row.country,city:row.city,
     description:row.description,salary_text:row.salary_text,work_mode:row.work_mode,
     posted_at:row.posted_at,raw:row.raw,normalized,external_ref:row.external_ref,
     quality_score:recalculatedScore,last_seen:row.last_seen,state:nextState,
     ...(state==='published'&&!keepPublished?{published_at:null}:{}),
     updated_at:new Date().toISOString(),version:Number(existing.version)+1
    }).eq('id',existing.id).eq('source_id',mission.data.source_id)
     .eq('version',existing.version).select('id').maybeSingle();
    await mandatory(updated);if(!updated.data)fail('Concurrent external vacancy update; retry mission');
   }else{
    // Do not use ignoreDuplicates: a real collision is an error, never a silently missing job.
    const inserted=await db.from('jobkix_supply_vacancies').insert(row).select('id').maybeSingle();
    await mandatory(inserted);if(!inserted.data)fail('External job insertion was not acknowledged');
   }
  }
 }
 const update=await db.from('jobkix_supply_missions').update({processed:mission.data.processed+items.length,accepted:mission.data.accepted+accepted,rejected:mission.data.rejected+rejected,lease_until:new Date(Date.now()+15*60*1000).toISOString(),updated_at:new Date().toISOString()}).eq('id',id).eq('worker_id',worker).eq('state','running').select('id');await mandatory(update);return {accepted,rejected,processed:items.length};
}
export async function workerFinish(worker:string,body:Row){const id=uuid(body.missionId),state=body.success===true?'completed':'failed',db=await createServiceClient();const result=await db.from('jobkix_supply_missions').update({state,ended_at:new Date().toISOString(),error_message:body.success===true?null:txt(body.error).slice(0,500)}).eq('id',id).eq('state','running').eq('worker_id',worker).select('id,source_id');await mandatory(result);if(!result.data?.length)throw new JobkixFault('VERSION_CONFLICT');await event('mission.'+state,worker,{mission_id:id,source_id:result.data[0].source_id});return {id,state};}
export async function publicExternal(country:string|null=null,limit=24){
 const db=await createServiceClient();
 let q=db.from('jobkix_supply_vacancies').select('id,title,company,country,city,description,canonical_url,salary_text,work_mode,published_at,source_id').eq('state','published').order('published_at',{ascending:false}).limit(Math.min(100,Math.max(1,limit*3)));
 if(country&&/^[A-Z]{2}$/.test(country))q=q.eq('country',country);
 const list=await q;if(list.error||!list.data?.length)return [];
 const checks=await Promise.all(list.data.map(async row=>{
  const r=await db.rpc('jobkix_r3_external_visible',{p_vacancy:row.id});
  return !r.error&&r.data===true?row:null;
 }));
 const passed=checks.filter((v):v is NonNullable<typeof v>=>v!==null).slice(0,limit);
 if(!passed.length)return [];
 const sources=await db.from('jobkix_supply_sources').select('id,name,approved,publication_mode').in('id',[...new Set(passed.map(v=>v.source_id))]).eq('approved',true).eq('publication_mode','full');
 if(sources.error)return [];const allowed=new Map((sources.data||[]).map(s=>[s.id,s]));
 return passed.filter(v=>allowed.has(v.source_id)).map(v=>({...v,source_name:allowed.get(v.source_id)?.name||'External source'}));
}
export async function externalDetail(id:string){
 uuid(id);const db=await createServiceClient();
 const visible=await db.rpc('jobkix_r3_external_visible',{p_vacancy:id});
 if(visible.error||visible.data!==true)return null;
 const r=await db.from('jobkix_supply_vacancies').select('id,title,company,country,city,description,canonical_url,salary_text,work_mode,published_at,source_id').eq('id',id).eq('state','published').maybeSingle();
 if(r.error||!r.data)return null;
 const s=await db.from('jobkix_supply_sources').select('name,approved,publication_mode').eq('id',r.data.source_id).maybeSingle();
 if(s.error||!s.data?.approved||s.data.publication_mode!=='full')return null;
 return {...r.data,source_name:s.data.name,publication_mode:s.data.publication_mode};
}
