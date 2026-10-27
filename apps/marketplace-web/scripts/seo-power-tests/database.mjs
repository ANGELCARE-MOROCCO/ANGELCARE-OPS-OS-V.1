import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const db=await PGlite.create();let checks=0;const ok=(v,msg)=>{assert.ok(v,msg);checks++};const equal=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++};
await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
const sql=fs.readFileSync(new URL('../../angelcare-marketplace/seo-power/INSTALL_SEO_POWER_R1.sql',import.meta.url),'utf8');
await db.exec(sql);await db.exec(sql);checks++;
const q=async(sql,args=[]) => (await db.query(sql,args)).rows;
const call=async(name,args)=> (await q(`select public.ac_seo_power_${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as r`,args)).at(0).r;
const actor='11111111-1111-4111-8111-111111111111';let n=0;
const cmd=async(action,payload,key='fixture-command-'+(++n),hash=key)=>call('command',[action,JSON.stringify(payload),actor,key,createHash('sha256').update(hash).digest('hex')]);
const refused=async(fn,code)=>{let message='';try{await fn()}catch(e){message=e.message}ok(message.includes(code),code+': '+message)};
const caps=await call('runtime_status',[]);equal([caps.cron,caps.net,caps.vault,caps.enabled],[false,false,false,false]);
const projects=await q('select * from public.ac_seo_power_projects order by world');equal(projects.length,3);const p=projects.find(p=>p.world==='kidflix'),j=projects.find(p=>p.world==='jobkix');
await refused(()=>cmd('register',{projectId:p.id,paths:['/kidflix/fr/saved']}),'PRIVATE_OR_WRONG_WORLD_PATH');
const paths=['/kidflix/fr','/kidflix/en','/kidflix/fr/explore/documents'];let ids=await cmd('register',{projectId:p.id,paths},'registration','same');equal(ids.length,3);equal(await cmd('register',{projectId:p.id,paths},'registration','same'),ids);
await refused(()=>cmd('register',{projectId:p.id,paths},'registration','different'),'REQUEST_REUSED');
await cmd('register',{projectId:j.id,paths:['/jobkix/fr']});
let jobs=await cmd('queue',{pageIds:[ids[0]],kind:'crawl',options:{discover:true}});let repeat=await cmd('queue',{pageIds:[ids[0]],kind:'crawl'});equal(jobs,repeat,'active queue deduplicated');
let job=await call('claim',[p.id]);equal(job.payload.discover,true);equal(job.page.id,ids[0]);equal(await call('claim',[j.id]),null,'scope isolated');
await refused(()=>call('finish',[job.id,'22222222-2222-4222-8222-222222222222','{}',null]),'STALE_JOB_LEASE');
const facts={status:200,title:'Native title',description:'Native desc',contentHash:'source1',robots:'index',seoPower:'r1:kidflix',sourceStamp:'meta1',links:[],images:[],schemas:[]};
await call('finish',[job.id,job.lease_token,JSON.stringify({facts,findings:[{code:'CANONICAL_MISSING',severity:'warning',message:'Missing',action:'metadata'}]}),null]);
let page=(await q('select * from public.ac_seo_power_pages where id=$1',[ids[0]]))[0];equal(page.content_hash,'source1');ok(page.indexable);equal((await q('select * from public.ac_seo_power_issues')).length,1);
await refused(()=>cmd('propose',{pageId:page.id,baseHash:'stale',patch:{title:'New'},reason:'Update title'}),'STALE_SOURCE');
let change=await cmd('propose',{pageId:page.id,baseHash:'source1',patch:{title:'Updated title',sourceStamp:'meta1'},reason:'Update actual title'});equal(change.state,'draft');
await refused(()=>cmd('publish',{id:change.id,version:change.version,liveHash:'source1'}),'REVIEW_REQUIRED');
let approved=await cmd('approve',{id:change.id,version:change.version});equal(approved.state,'approved');
await refused(()=>cmd('publish',{id:approved.id,version:approved.version,liveHash:'changed'}),'STALE_SOURCE');
let published=await cmd('publish',{id:approved.id,version:approved.version,liveHash:'source1'});equal(published.state,'published');equal(published.verified_at,null);
job=await call('claim',[p.id]);equal(job.kind,'verify');
await call('finish',[job.id,job.lease_token,JSON.stringify({verified:false,checks:{title:false},facts}),null]);
equal((await q('select verified_at from public.ac_seo_power_changes where id=$1',[change.id]))[0].verified_at,null,'failed verification does not certify');
await cmd('queue',{pageIds:[page.id],kind:'verify',options:{changeId:change.id}});job=await call('claim',[p.id]);await call('finish',[job.id,job.lease_token,JSON.stringify({verified:true,facts}),null]);ok((await q('select verified_at from public.ac_seo_power_changes where id=$1',[change.id]))[0].verified_at);
let second=await cmd('propose',{pageId:page.id,baseHash:'source1',patch:{description:'New description'},reason:'Second editorial change'});second=await cmd('approve',{id:second.id,version:second.version});second=await cmd('publish',{id:second.id,version:second.version,liveHash:'source1'});
await refused(()=>cmd('rollback',{id:published.id,version:published.version,reason:'Restore earlier edition'}),'LATER_PUBLICATION_PROTECTED');
await refused(()=>cmd('rollback',{id:second.id,version:second.version,reason:'bad'}),'CHANGE_REASON_REQUIRED');
let reverted=await cmd('rollback',{id:second.id,version:second.version,reason:'Restore the previous verified title'});equal(reverted.state,'reverted');equal(reverted.rollbackReason,'Restore the previous verified title');equal((await q('select published_change_id from public.ac_seo_power_pages where id=$1',[page.id]))[0].published_change_id,change.id);
// Cancel invalidates an active execution, and late finish cannot write.
await cmd('queue',{pageIds:[ids[1]],kind:'crawl'});let active;
for(let i=0;i<4;i++){job=await call('claim',[p.id]);if(!job)break;if(job.page.id===ids[1]){active=job;break;}await cmd('cancel',{id:job.id});}
ok(active);await cmd('cancel',{id:active.id});await refused(()=>call('finish',[active.id,active.lease_token,JSON.stringify({facts}),null]),'STALE_JOB_LEASE');
// Recovery and terminal failure after three attempts.
await cmd('queue',{pageIds:[ids[2]],kind:'crawl'});job=await call('claim',[p.id]);ok(job);await call('finish',[job.id,job.lease_token,'{}','timeout']);let failed=(await q('select * from public.ac_seo_power_jobs where id=$1',[job.id]))[0];equal(failed.state,'queued');ok(Date.parse(failed.due_at)>Date.now());
for(let i=0;i<2;i++){await q('update public.ac_seo_power_jobs set due_at=now() where id=$1',[job.id]);job=await call('claim',[p.id]);await call('finish',[job.id,job.lease_token,'{}','timeout']);}equal((await q('select state from public.ac_seo_power_jobs where id=$1',[job.id]))[0].state,'failed');
await refused(()=>cmd('project',{id:p.id,version:999,origin:p.origin,enabled:true,policy:{}}),'STALE_REVISION');
await refused(()=>call('scheduler',[p.origin+'/api/angelcare-marketplace/admin/seo-power/run','x'.repeat(64),'0'.repeat(64),true]),'SCHEDULER_EXTENSIONS_REQUIRED');
equal((await call('scheduler',[p.origin+'/api/angelcare-marketplace/admin/seo-power/run','x'.repeat(64),'0'.repeat(64),false])).enabled,false);
let summary=await call('summary',[p.id]);equal(summary.pages,3);equal(summary.published,1);ok(summary.issues>=1);
for(const role of ['anon','authenticated']){await db.exec('set role '+role);await refused(()=>q('select * from public.ac_seo_power_pages'),'permission denied');await refused(()=>call('summary',[null]),'permission denied');await db.exec('reset role');}
await db.exec('set role service_role');equal((await call('summary',[j.id])).pages,1);await db.exec('reset role');
// Only SEO tables exist; no library resources or job vacancies seeded.
equal((await q("select tablename from pg_tables where schemaname='public'")).length,9);
const report={checks,engine:'PGlite PostgreSQL',migrationRepeat:true,liveCronNetVault:false,result:'PASS'};fs.writeFileSync(new URL('./reports/database.json',import.meta.url),JSON.stringify(report,null,2));console.log(report);await db.close();
