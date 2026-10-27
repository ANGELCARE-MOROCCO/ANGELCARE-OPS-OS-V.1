import 'server-only';
import {createServiceClient} from '@/lib/supabase/server';
import {hasMarketplaceWorkspaceAccess,requireMarketplaceApiContext} from '@/angelcare-marketplace/auth/context';
import {inspectFeed} from './feed';
import {scheduleSpec,nextDue,previewSchedule} from './schedule';
import {parseCSV,toCSV,sourceTemplate,vacancyTemplate,validateSourceCSV,VACANCY_HEADERS,SOURCE_HEADERS,checksum,compileSource} from './csv';
import {createHash} from 'node:crypto';
import {normalizeVacancy} from '../contracts';
type Row=Record<string,unknown>;
const s=(x:unknown)=>String(x??'');const guid=(x:unknown)=>/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(s(x))?s(x):(()=>{throw Error('Invalid UUID')})();
const need=async(r:{error?:{message:string}|null})=>{if(r.error)throw Error(r.error.message)};
async function auth(write=false){const c=await requireMarketplaceApiContext('marketplace.admin.access');if(!hasMarketplaceWorkspaceAccess(c,'jobkix.vacancies'))throw Error('JOBKIX_ACCESS_REQUIRED');if(write&&!hasMarketplaceWorkspaceAccess(c,'jobkix.editorial'))throw Error('JOBKIX_EDITORIAL_ACCESS_REQUIRED');return c;}
async function audit(action:string,user:string,data:Row={}){const db=await createServiceClient();await need(await db.from('jobkix_supply_events').insert({actor:user,action,data}));}
export async function r3Read(view:string){await auth();const db=await createServiceClient();
 if(view==='health'||view==='overview'){
  const [control,schedules,imports,runs]=await Promise.all([db.from('jobkix_supply_r3_control').select('*').eq('id',1).single(),db.from('jobkix_supply_r3_schedules').select('id',{count:'exact',head:true}),db.from('jobkix_supply_r3_imports').select('id',{count:'exact',head:true}),db.from('jobkix_supply_r3_runs').select('id',{count:'exact',head:true})]);await Promise.all([need(control),need(schedules),need(imports),need(runs)]);
  return {control:control.data,schedules:schedules.count||0,imports:imports.count||0,runs:runs.count||0,serverTime:new Date().toISOString()};
 }
 if(view==='sources'){const r=await db.from('jobkix_supply_sources').select('id,name,kind,country,endpoint,config,enabled,approved,publication_mode,version,archived_at,updated_at').order('updated_at',{ascending:false}).limit(300);await need(r);return {rows:r.data||[]};}
 if(view==='schedules'){const r=await db.from('jobkix_supply_r3_schedules').select('id,source_id,title,enabled,spec,next_run_at,last_run_at,last_due_at,last_status,failure_count,lease_until,version,updated_at').order('updated_at',{ascending:false}).limit(300);await need(r);return {rows:r.data||[]};}
 if(view==='runs'){const r=await db.from('jobkix_supply_r3_runs').select('*').order('started_at',{ascending:false}).limit(150);await need(r);return {rows:r.data||[]};}
 if(view==='imports'){const r=await db.from('jobkix_supply_r3_imports').select('id,filename,import_type,mode,state,total_rows,created_count,updated_count,rejected_count,created_at,committed_at,report').order('created_at',{ascending:false}).limit(100);await need(r);return {rows:r.data||[]};}
 if(view==='profiles'){const r=await db.from('jobkix_supply_r3_profiles').select('*').order('updated_at',{ascending:false}).limit(100);await need(r);return {rows:r.data||[]};}
 throw Error('Unknown R3 workspace');
}
export async function r3Command(body:Row){const c=await auth(true),user=s(c.actor.id),db=await createServiceClient(),action=s(body.action);
 if(action==='control.save'){
  const original=await db.from('jobkix_supply_r3_control').select('*').eq('id',1).single();await need(original);
  const input=(body.values&&typeof body.values==='object'&&!Array.isArray(body.values)?body.values:{}) as Row;
  const names=['rss_enabled','csv_enabled','vacancy_csv_enabled','scheduler_enabled','global_pause'] as const;
  const patch:Row={updated_at:new Date().toISOString(),updated_by:user};for(const key of names)if(typeof input[key]==='boolean')patch[key]=input[key];
  if(input.max_concurrency!==undefined)patch.max_concurrency=Math.max(1,Math.min(3,Number(input.max_concurrency)||1));
  if(patch.scheduler_enabled===true&&original.data?.global_pause!==false&&patch.global_pause!==false)throw Error('Scheduler requires deliberate removal of global pause in the same operation');
  const update=await db.from('jobkix_supply_r3_control').update(patch).eq('id',1).select('*').single();await need(update);await audit('r3.control.updated',user,{fields:Object.keys(patch)});return update.data;
 }
 if(action==='feed.test'){const url=s(body.endpoint);const config=body.config&&typeof body.config==='object'&&!Array.isArray(body.config)?body.config as Row:{};return inspectFeed(url,config,s(body.country));}
 if(action==='source.clone'){
  const id=guid(body.id),original=await db.from('jobkix_supply_sources').select('name,kind,country,endpoint,config,publication_mode').eq('id',id).single();await need(original);
  if(!original.data)throw Error('Source not found');const copy=await db.from('jobkix_supply_sources').insert({...original.data,name:('Copy · '+original.data.name).slice(0,120),approved:false,enabled:false,publication_mode:'none',credential_cipher:null,credential_header:null,created_by:user,updated_by:user}).select('id').single();await need(copy);await audit('r3.source.cloned',user,{originalId:id,copyId:copy.data!.id});return {id:copy.data!.id,approved:false,enabled:false};
 }
 if(action==='source.archive'||action==='source.restore'){
  const id=guid(body.id),archive=action==='source.archive';const update=await db.from('jobkix_supply_sources').update({archived_at:archive?new Date().toISOString():null,archived_by:archive?user:null,enabled:false,approved:false,updated_at:new Date().toISOString()}).eq('id',id).select('id').single();await need(update);
  const sch=await db.from('jobkix_supply_r3_schedules').update({enabled:false,next_run_at:null}).eq('source_id',id);await need(sch);await audit(action,user,{sourceId:id});return {id,archived:archive};
 }
 if(action==='source.delete'){
  const id=guid(body.id),source=await db.from('jobkix_supply_sources').select('id,archived_at').eq('id',id).single();await need(source);if(!source.data?.archived_at)throw Error('Archive and disable a source before permanent deletion');
  for(const table of ['jobkix_supply_missions','jobkix_supply_vacancies','jobkix_supply_r3_schedules']){const result=await db.from(table).select('id',{count:'exact',head:true}).eq('source_id',id);await need(result);if((result.count||0)>0)throw Error(`Cannot delete source with linked ${table}; archive instead`)}
  const deleted=await db.from('jobkix_supply_sources').delete().eq('id',id);await need(deleted);await audit(action,user,{sourceId:id});return {id,deleted:true};
 }
 if(action==='schedule.save'){
  const sourceId=guid(body.sourceId),id=body.id?guid(body.id):null,expected=Number(body.version||0),spec=scheduleSpec(body.spec);
  const r=await db.from('jobkix_supply_sources').select('id,kind,approved,enabled,archived_at,config').eq('id',sourceId).single();await need(r);if(!r.data||r.data.kind!=='api')throw Error('Only integrated API/RSS sources can be scheduled');
  if(spec.enabled&&(!r.data.enabled||!r.data.approved||r.data.archived_at))throw Error('Source must be enabled, authorized and not archived');
  const value={source_id:sourceId,title:s(body.title).slice(0,120),enabled:spec.enabled,spec,next_run_at:spec.enabled?nextDue(spec,new Date()).toISOString():null,updated_at:new Date().toISOString()};
  if(id){const result=await db.from('jobkix_supply_r3_schedules').update({...value,version:expected+1}).eq('id',id).eq('version',expected).eq('source_id',sourceId).select('id,version').maybeSingle();await need(result);if(!result.data)throw Error('VERSION_CONFLICT');await audit('r3.schedule.updated',user,{id,sourceId});return result.data;}
  const result=await db.from('jobkix_supply_r3_schedules').insert(value).select('id,version').single();await need(result);await audit('r3.schedule.created',user,{id:result.data?.id,sourceId});return result.data;
 }
 if(action==='schedule.preview')return {times:previewSchedule(body.spec,undefined,10)};
 if(action==='schedule.pause'||action==='schedule.resume'){
  const id=guid(body.id),resume=action==='schedule.resume';const q=await db.from('jobkix_supply_r3_schedules').select('id,spec,source_id').eq('id',id).single();await need(q);if(!q.data)throw Error('Schedule not found');
  const spec=scheduleSpec({...q.data.spec,enabled:resume});const result=await db.from('jobkix_supply_r3_schedules').update({enabled:resume,spec,next_run_at:resume?nextDue(spec,new Date()).toISOString():null,updated_at:new Date().toISOString()}).eq('id',id).select('id,enabled').single();await need(result);await audit(action,user,{id});return result.data;
 }
 if(action==='schedule.delete'){
  const id=guid(body.id);const q=await db.from('jobkix_supply_r3_runs').select('id',{count:'exact',head:true}).eq('schedule_id',id);await need(q);if((q.count||0)>0)throw Error('Schedule with run history must be paused, not deleted');const result=await db.from('jobkix_supply_r3_schedules').delete().eq('id',id);await need(result);await audit(action,user,{id});return {id,deleted:true};
 }
 if(action==='csv.preview'){const kind=body.kind==='vacancies'?'vacancies':'sources',data=s(body.csv);if(kind==='vacancies'){const rows=parseCSV(data),errors=rows.flatMap((r,i)=>!r.url||!r.title||!r.source_code?[{line:i+2,message:'source_code, title and URL are required'}]:[]);return {kind,total:rows.length,valid:rows.length-errors.length,invalid:errors.length,errors,checksum:checksum(data),sample:rows.slice(0,5).map(row=>({title:row.title,company:row.company,country:row.country,url:row.url}))}}
  const r=validateSourceCSV(data);return {kind,total:r.total,valid:r.valid,invalid:r.invalid,errors:r.errors,checksum:r.checksum,sample:r.compiled.slice(0,5).map(row=>({name:row.source.name,kind:row.source.kind,country:row.source.country,enabled:row.source.enabled,scheduled:row.schedule?.enabled||false}))};
 }
 if(action==='csv.commit'){
  const flags=await db.from('jobkix_supply_r3_control').select('csv_enabled,vacancy_csv_enabled').eq('id',1).single();await need(flags);
  const kind=body.kind==='vacancies'?'vacancies':'sources';if(kind==='sources'&&!flags.data?.csv_enabled||kind==='vacancies'&&!flags.data?.vacancy_csv_enabled)throw Error('CSV gateway is disabled by administrator');
  const data=s(body.csv),filename=s(body.filename).slice(0,120)||'import.csv',mode=body.mode==='valid_only'?'valid_only':'atomic';
  if(kind==='sources'){
   const v=validateSourceCSV(data);if(mode==='atomic'&&v.invalid)throw Error('Atomic import blocked: '+v.invalid+' invalid rows');
   const batch=await db.from('jobkix_supply_r3_imports').insert({import_type:'sources',checksum:v.checksum,filename,mode,operator_id:user,total_rows:v.total,state:'validated',rejected_count:v.invalid,report:{errors:v.errors}}).select('id').single();await need(batch);
   const records=v.compiled.map(x=>({source:x.source,schedule:x.schedule,operation:x.operation,sourceCode:x.sourceCode,line:x.line}));
   const result=await db.rpc('jobkix_supply_r3_apply_sources',{p_rows:records,p_actor:user,p_atomic:mode==='atomic'});await need(result);
   const out=(result.data||{}) as Row;const updated=await db.from('jobkix_supply_r3_imports').update({state:'committed',committed_at:new Date().toISOString(),created_count:Number(out.created||0),updated_count:Number(out.updated||0),rejected_count:Number(out.rejected||0)+v.invalid,report:{errors:v.errors,rows:out.rows||[]}}).eq('id',batch.data!.id);await need(updated);
   await audit('r3.csv.sources.committed',user,{id:batch.data!.id,count:v.total,mode});return {batchId:batch.data!.id,...out,validationErrors:v.errors};
  }
  const rows=parseCSV(data);if(rows.length>100)throw Error('Vacancy import limited to 100 rows per batch');const errorRows:{line:number;message:string}[]=[],changes:Row[]=[];
  for(const [i,record] of rows.entries())try{
   const sourceId=guid(record.source_code),source=await db.from('jobkix_supply_sources').select('id,country,approved').eq('id',sourceId).single();await need(source);if(!source.data?.approved)throw Error('Source is not authorized');
   const normalized=normalizeVacancy({title:record.title,company:record.company,city:record.city,country:record.country,url:record.url,description:record.description,externalId:record.external_id,remote:record.remote,salary:record.salary,postedAt:record.posted_at,settingId:record.setting_id,occupationId:record.occupation_id,workSchedule:record.work_schedule,contractType:record.contract_type,sponsorship:record.sponsorship,relocation:record.relocation},source.data.country);
   if(!normalized)throw Error('Valid title and HTTPS URL required');
   const fingerprint=createHash('sha256').update([normalized.canonical_url.toLowerCase(),normalized.title.toLowerCase(),normalized.country].join('|')).digest('hex');
   changes.push({source_id:sourceId,fingerprint,...normalized,state:'needs_review',quality_score:Math.min(100,30+(normalized.company?20:0)+(normalized.description.length>50?15:0)+15),raw:{...record,csv:true},last_seen:new Date().toISOString()});
  }catch(e){errorRows.push({line:i+2,message:e instanceof Error?e.message:String(e)})}
  if(mode==='atomic'&&errorRows.length)throw Error('Atomic vacancy import blocked: '+errorRows.length+' invalid rows');
  if(changes.length){const x=await db.from('jobkix_supply_vacancies').upsert(changes,{onConflict:'fingerprint',ignoreDuplicates:true});await need(x)}
  const batch=await db.from('jobkix_supply_r3_imports').insert({import_type:'vacancies',checksum:checksum(data),filename,mode,operator_id:user,total_rows:rows.length,state:'committed',created_count:changes.length,rejected_count:errorRows.length,committed_at:new Date().toISOString(),report:{errors:errorRows}}).select('id').single();await need(batch);await audit('r3.csv.vacancies.committed',user,{id:batch.data!.id,count:changes.length});return {batchId:batch.data!.id,created:changes.length,rejected:errorRows.length,errors:errorRows};
 }
 if(action==='csv.rollback'){
  const id=guid(body.id),batch=await db.from('jobkix_supply_r3_imports').select('id,state,import_type,report').eq('id',id).single();await need(batch);
  if(!batch.data||batch.data.import_type!=='sources'||batch.data.state!=='committed')throw Error('Only a committed source-registration batch may be safely rolled back');
  const entries=Array.isArray((batch.data.report as Row)?.rows)?(batch.data.report as Row).rows as Row[]:[];
  let archived=0,skipped=0;
  for(const entry of entries){if(entry.status!=='created'){skipped++;continue;}
   const sourceId=guid(entry.id),published=await db.from('jobkix_supply_vacancies').select('id',{count:'exact',head:true}).eq('source_id',sourceId).eq('state','published');await need(published);
   if(published.count){skipped++;continue;}
   const q=await db.from('jobkix_supply_sources').update({enabled:false,approved:false,archived_at:new Date().toISOString(),archived_by:user}).eq('id',sourceId);await need(q);
   const sc=await db.from('jobkix_supply_r3_schedules').update({enabled:false,next_run_at:null}).eq('source_id',sourceId);await need(sc);archived++;
  }
  const r=await db.from('jobkix_supply_r3_imports').update({state:'rolled_back',report:{...(batch.data.report as Row),rollback:{archived,skipped,actor:user,time:new Date().toISOString()}}}).eq('id',id);await need(r);
  await audit('r3.csv.rollback',user,{id,archived,skipped});return {id,archived,skipped,note:'Only eligible newly created sources were safely archived. Updated or published sources were preserved.'};
 }
 if(action==='profile.save'){
  const name=s(body.name).trim().slice(0,100);if(name.length<3)throw Error('Profile name too short');const result=await db.from('jobkix_supply_r3_profiles').insert({name,config:body.config||{},created_by:user}).select('id').single();await need(result);await audit(action,user,{id:result.data!.id});return result.data;
 }
 if(action==='profile.update'){
  const id=guid(body.id),expected=Number(body.version||0),name=s(body.name).trim().slice(0,100);if(name.length<3)throw Error('Profile name too short');
  const result=await db.from('jobkix_supply_r3_profiles').update({name,config:body.config||{},version:expected+1,updated_at:new Date().toISOString()}).eq('id',id).eq('version',expected).select('id,version').maybeSingle();await need(result);if(!result.data)throw Error('VERSION_CONFLICT');await audit(action,user,{id});return result.data;
 }
 if(action==='profile.delete'){const id=guid(body.id);await need(await db.from('jobkix_supply_r3_profiles').delete().eq('id',id));await audit(action,user,{id});return {deleted:true,id};}
 throw Error('Unknown R3 command');
}
export async function roundtripTemplate(){
 await auth();const db=await createServiceClient();const r=await db.from('jobkix_supply_sources').select('id,name,kind,country,endpoint,config,enabled,approved,publication_mode,version').order('updated_at',{ascending:false}).limit(300);await need(r);
 const rows=(r.data||[]).map((row:any)=>{
  const cfg=(row.config&&typeof row.config==='object'?row.config:{}) as Row,m=(cfg.mapping&&typeof cfg.mapping==='object'?cfg.mapping:{}) as Row;
  const result:Record<string,string>={operation:'update',source_code:row.id,source_name:row.name,source_kind:row.kind,source_format:s(cfg.format||'json'),target_country:row.country,endpoint:row.endpoint,collection_authorized:row.approved?'yes':'no',collection_enabled:row.enabled?'yes':'no',publication_mode:row.publication_mode,rights_basis:row.approved?'existing_internal_authorization':'review_required',rights_reference:row.publication_mode==='none'?'':'RECONFIRM_PUBLICATION_RIGHTS',terms_review_status:row.approved?'approved':'pending',expected_version:s(row.version),response_path:s(cfg.responsePath),search_parameter:s(cfg.keywordParam),search_terms:s(cfg.query),country_parameter:s(cfg.countryParam),page_parameter:s(cfg.pageParam),max_pages:s(cfg.maxPages),max_items:s(cfg.limit),request_headers_json:JSON.stringify(cfg.headers||{}),credential_reference:'NOT_EXPORTED',schedule_enabled:'no'};
  for(const [k,v] of Object.entries(m))result['map_'+k.replace(/[A-Z]/g,ch=>'_'+ch.toLowerCase())]=s(v);
  return result;
 });
 return {filename:'JOBKIX_R3_EXISTING_REGISTRY_ROUNDTRIP.csv',csv:toCSV(SOURCE_HEADERS,rows)};
}
export function templateFor(name:string){if(name==='quickstart')return {filename:'JOBKIX_R3_QUICKSTART.csv',csv:sourceTemplate(false)};if(name==='full')return {filename:'JOBKIX_R3_FULL_REGISTRY.csv',csv:sourceTemplate(true)};if(name==='vacancies')return {filename:'JOBKIX_R3_VACANCY_360.csv',csv:vacancyTemplate()};throw Error('Invalid template');}
