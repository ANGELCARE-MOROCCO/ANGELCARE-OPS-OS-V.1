/** Actual in-memory PostgreSQL; synthetic Supabase auth fixtures. No production connection. */
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const toolsDirectory = process.env.JOBKIX_TEST_TOOLS || '/private/tmp/jobkix-source-20261020/test-tools';
const { PGlite } = require(require.resolve('@electric-sql/pglite', { paths: [toolsDirectory] }));
const migrations = path.resolve(__dirname, '../../angelcare-marketplace/jobkix/migrations');
const id = n => `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

test('JOBKIX PostgreSQL migrations and row-level authorization', async t => {
 const db = new PGlite();
 try {
  await db.exec(`create schema auth;
   create role anon; create role authenticated; create role service_role bypassrls;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   grant usage on schema public,auth to anon,authenticated,service_role;
   grant execute on function auth.uid() to anon,authenticated,service_role;`);
  // Native media dependency fixture mirrors the inspected existing table/usage columns.
  // It does not establish compatibility with a hosted storage installation.
  await db.exec(`create table public.angelcare_marketplace_media_assets(id uuid primary key,status text,mime_type text,rights_status text,rights_expires_at timestamptz,public_url text);
   create table public.angelcare_marketplace_media_usage(media_asset_id uuid not null references public.angelcare_marketplace_media_assets(id) on delete restrict,object_type text not null,object_id uuid not null,slot_key text not null,locale text,unique(media_asset_id,object_type,object_id,slot_key,locale));`);
  for (const file of fs.readdirSync(migrations).filter(name => /^\d+_.*\.sql$/.test(name)).sort()) {
   await t.test('apply ' + file, async () => { await db.exec(fs.readFileSync(path.join(migrations, file), 'utf8')); });
  }
  await db.query('insert into auth.users values($1,$2,now()),($3,$4,now()),($5,$6,now())', [id(1),'candidate@fixture.invalid',id(2),'hirer@fixture.invalid',id(3),'outsider@fixture.invalid']);
  for (const user of [id(1),id(2),id(3)]) await db.query('insert into public.jobkix_accounts(user_id,adult_confirmed_at) values($1,now())',[user]);
  await db.query('insert into public.jobkix_candidates(user_id,display_name,summary) values($1,$2,$3)',[id(1),'Private fixture candidate','PRIVATE_PROFILE_MARKER']);
  await db.query(`insert into public.jobkix_organizations(id,kind,public_name,country,created_by,identity_reviewed_until,public_profile_approved_at) values($1,'household','Fixture household alias','GB',$2,now()+interval '1 year',now())`,[id(4),id(2)]);
  await db.query(`insert into public.jobkix_organization_private(organization_id,private_address,contact_phone) values($1,'PRIVATE_ADDRESS_MARKER','PRIVATE_PHONE_MARKER')`,[id(4)]);
  await db.query(`insert into public.jobkix_memberships(organization_id,user_id,role) values($1,$2,'owner')`,[id(4),id(2)]);
  await db.query(`insert into public.jobkix_vacancies(id,organization_id,title,setting_id,occupation_id,state,original_locale,country,city,description,work_schedule,contract_type,work_location,published_at,expires_at,created_by) values($1,$2,'Fixture role','households','nanny','published','en','GB','Approximate fixture city','Public fixture duties','part_time','permanent','on_site',now()-interval '1 hour',now()+interval '1 day',$3)`,[id(5),id(4),id(2)]);
  await db.query("update public.jobkix_vacancies set public_snapshot=public.jobkix_vacancy_projection(id),published_version=version where state='published'");
  const asUser = async (user, callback) => db.transaction(async tx => {
   await tx.exec('set local role authenticated'); await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);
   return callback(tx);
  });
  const command=(user,action,payload,version=0,key=crypto.randomUUID())=>asUser(user,async tx=>(await tx.query('select public.jobkix_command($1,$2,$3,$4) result',[action,payload,version,key])).rows[0].result);
  const workspace=(user,action,payload,version=0,key=crypto.randomUUID())=>asUser(user,async tx=>(await tx.query('select public.jobkix_workspace_command($1,$2,$3,$4) result',[action,payload,version,key])).rows[0].result);
  const admin=(action,payload,version=0,key=crypto.randomUUID())=>db.transaction(async tx=>{await tx.exec('set local role service_role');return (await tx.query('select public.jobkix_admin_command($1,$2,$3,$4,$5) result',[id(900),action,{note:'Isolated authorized administration review; no production operation.',...payload},version,key])).rows[0].result;});
  await t.test('native taxonomy drafts and public projections enforce current publication and seven languages',async()=>{
   const content={kind:'occupation',key:'isolated-discovery-role',sourceName:'Isolated discovery role',localizedNames:{en:'Isolated discovery role'},synonyms:['fixture synonym'],sortOrder:99,status:'draft'};
   const draft=await admin('taxonomy.save',content);assert.equal(draft.state,'saved');
   const taxon=()=>db.transaction(async tx=>{await tx.exec('set local role anon');return (await tx.query('select public.jobkix_public_taxon($1,$2,$3) result',['occupation',content.key,'en'])).rows[0].result;});assert.equal(await taxon(),null);
   await assert.rejects(admin('taxonomy.save',{...content,status:'published'},1),/INVALID_INPUT/);
   const names=Object.fromEntries(['en','fr','es','hi','tl','id','ar'].map(locale=>[locale,locale==='en'?content.sourceName:'Isolated '+locale+' fixture']));
   await admin('taxonomy.save',{...content,localizedNames:names,status:'published'},1);assert.equal((await taxon()).name,content.sourceName);
   await assert.rejects(admin('taxonomy.save',{...content,localizedNames:names,status:'published'},1),/VERSION_CONFLICT/);
   const result=(await db.query('select public.jobkix_public_taxonomy($1,$2,$3,$4,$5) result',['occupation','fr','Isolated fr','',1])).rows[0].result;assert.equal(result.total,1);assert.equal(result.items[0].key,content.key);assert.equal(result.items[0].opportunityCount,0);assert.equal(JSON.stringify(result).includes('PRIVATE_'),false);
   const setting=(await db.query("select * from public.jobkix_taxonomy where kind='setting' and key='households'")).rows[0];
   await assert.rejects(admin('taxonomy.save',{kind:'setting',key:'households',sourceName:setting.source_name_en,localizedNames:setting.localized_names,synonyms:[],status:'published',sortOrder:999},setting.version),/INVALID_INPUT/);
   await assert.rejects(db.query('select public.jobkix_search($1)',[{occupation:'unpublished-fiction'}]),/INVALID_INPUT/);
  });
  await t.test('database compensation validation rejects malformed, unsupported and reversed ranges',async()=>{
   for(const pay of [{minimum:20,maximum:10,currency:'GBP',unit:'hour'},{minimum:'20',currency:'GBP',unit:'hour'},{minimum:20,currency:'ZZZ',unit:'hour'},{minimum:20,currency:'GBP',unit:'minute'},{minimum:-1,currency:'GBP',unit:'hour'},{minimum:1e10,currency:'GBP',unit:'hour'},{currency:'GBP',unit:'hour'},{minimum:20,currency:'GBP',unit:'hour',privateNote:'unexpected'}])await assert.rejects(db.query('select public.jobkix_pay($1)',[pay]),/INVALID_INPUT/);
   assert.deepEqual((await db.query('select public.jobkix_pay($1) result',[{minimum:0,maximum:25.5,currency:'GBP',unit:'hour'}])).rows[0].result,{minimum:0,maximum:25.5,currency:'GBP',unit:'hour'});
  });
  await t.test('database profile entries reject duplicate IDs, invalid dates and private extra fields',async()=>{
   const entry={id:id(800),title:'Fixture qualification',organization:'Fixture provider',start:'2024-09',end:'2025-06',description:'Isolated professional evidence'};
   for(const entries of [[entry,entry],[{...entry,start:'2024-13'}],[{...entry,end:'2023-01'}],[{...entry,privateContact:'unapproved'}],[{...entry,title:''}]])await assert.rejects(db.query('select public.jobkix_profile_entries($1)',[entries]),/INVALID_INPUT/);
   assert.deepEqual((await db.query('select public.jobkix_profile_entries($1) result',[[entry]])).rows[0].result,[entry]);
  });
  await t.test('candidate can read own profile; unrelated hirer cannot read it',async()=>{
   const own=await asUser(id(1),tx=>tx.query('select * from public.jobkix_candidates'));assert.equal(own.rows.length,1);
   const other=await asUser(id(2),tx=>tx.query('select * from public.jobkix_candidates'));assert.equal(other.rows.length,0);
  });
  await t.test('household private fields require current organization management authority',async()=>{
   const own=await asUser(id(2),tx=>tx.query('select * from public.jobkix_organization_private'));assert.equal(own.rows.length,1);
   const other=await asUser(id(1),tx=>tx.query('select * from public.jobkix_organization_private'));assert.equal(other.rows.length,0);
  });
  await t.test('anonymous discovery uses an explicit projection without private profile/address/contact',async()=>{
   const result=await db.transaction(async tx=>{await tx.exec('set local role anon');return tx.query('select public.jobkix_search($1) result',[{}]);});
   assert.equal(result.rows[0].result.items.length,1);assert.equal(JSON.stringify(result.rows).includes('PRIVATE_'),false);
  });
  await t.test('anonymous direct private-table reads and authenticated direct mutations are denied',async()=>{
   await assert.rejects(db.transaction(async tx=>{await tx.exec('set local role anon');await tx.query('select * from public.jobkix_candidates');}),/permission denied/);
   await assert.rejects(asUser(id(1),tx=>tx.query("update public.jobkix_candidates set discoverable=true")),/permission denied/);
  });
  await t.test('talent search is consented and block-aware with no private profile controls projected',async()=>{
   let result=await asUser(id(2),tx=>tx.query('select public.jobkix_talent_search($1) result',[id(4)]));assert.deepEqual(result.rows[0].result,[]);
   await db.query('update public.jobkix_candidates set discoverable=true,discoverability_consented_at=now() where user_id=$1',[id(1)]);
   result=await asUser(id(2),tx=>tx.query('select public.jobkix_talent_search($1) result',[id(4)]));assert.equal(result.rows[0].result.length,1);assert.equal('discoverability_consented_at' in result.rows[0].result[0],false);
   await db.query('insert into public.jobkix_candidate_blocks values($1,$2,now())',[id(1),id(4)]);
   result=await asUser(id(2),tx=>tx.query('select public.jobkix_talent_search($1) result',[id(4)]));assert.deepEqual(result.rows[0].result,[]);
   await db.query('delete from public.jobkix_candidate_blocks');
  });
  await t.test('revoked membership immediately revokes private organization reads',async()=>{
   await db.query('update public.jobkix_memberships set active=false where user_id=$1',[id(2)]);
   const result=await asUser(id(2),tx=>tx.query('select * from public.jobkix_organization_private'));assert.equal(result.rows.length,0);
   await db.query('update public.jobkix_memberships set active=true where user_id=$1',[id(2)]);
  });
  await t.test('query-time expiry and closure remove discovery even without a worker',async()=>{
   await db.query("update public.jobkix_vacancies set expires_at=now()-interval '1 minute' where id=$1",[id(5)]);
   let result=await db.query('select public.jobkix_search($1) result',[{}]);assert.equal(result.rows[0].result.total,0);
   result=await db.query('select public.jobkix_public_vacancy($1,true) result',[id(5)]);assert.equal(result.rows[0].result.state,'closed');
   await db.query("update public.jobkix_vacancies set expires_at=now()+interval '1 day',state='closed' where id=$1",[id(5)]);
   result=await db.query('select public.jobkix_search($1) result',[{}]);assert.equal(result.rows[0].result.total,0);
  });
  await t.test('onboarding refuses unpublished or stale legal consent; stores exact reviewed editions',async()=>{
   await db.query('insert into auth.users values($1,$2,now())',[id(30),'new-account@fixture.invalid']);
   const payload={intent:'candidate',displayName:'Isolated onboarding candidate',country:'FR',locale:'en',timezone:'Europe/Paris',adultConfirmed:true,accepted:true,consentRevision:'0'.repeat(64)};
   await assert.rejects(command(id(30),'account.initialize',payload),/DEPENDENCY_UNAVAILABLE/);
   assert.equal((await db.query('select * from public.jobkix_accounts where user_id=$1',[id(30)])).rows.length,0);
   // Explicitly synthetic reviewed legal editions; does not establish legal approval or administration E2E.
   for(const [n,slug] of [[100,'account-terms'],[101,'privacy']]){
    await db.query("insert into public.jobkix_editorial_documents(id,slug,kind,source_hash) values($1,$2,'legal',$3)",[id(n),slug,'f'.repeat(64)]);
    await db.query("insert into public.jobkix_editorial_editions(document_id,locale,title,sections,source_revision,source_hash,content_hash,status,reviewed_hash,reviewed_by,published_by,author_name,published_at) values($1,'en','ISOLATED REVIEW FIXTURE','[]',1,$2,$2,'published',$2,$3,$3,'Synthetic test reviewer',now())",[id(n),'f'.repeat(64),id(2)]);
   }
   const terms=(await db.query("select public.jobkix_account_terms('en') result")).rows[0].result;assert.match(terms.revision,/^[a-f0-9]{64}$/);
   await assert.rejects(command(id(30),'account.initialize',payload),/VERSION_CONFLICT/);
   const accepted={...payload,consentRevision:terms.revision},key=crypto.randomUUID();await command(id(30),'account.initialize',accepted,0,key);await command(id(30),'account.initialize',accepted,0,key);
   const records=await asUser(id(30),tx=>tx.query('select * from public.jobkix_account_consents'));assert.equal(records.rows.length,1);assert.deepEqual(records.rows[0].terms_snapshot,terms.terms);assert.deepEqual(records.rows[0].privacy_snapshot,terms.privacy);
   assert.equal((await asUser(id(2),tx=>tx.query('select * from public.jobkix_account_consents'))).rows.length,0);
   await db.query('update public.jobkix_editorial_documents set source_revision=2 where id=$1',[id(100)]);
   assert.equal((await db.query("select public.jobkix_account_terms('en') result")).rows[0].result,null);
  });

  // Database-level connected workflow. Supabase identity and trust review are isolated fixtures;
  // this does not certify browser, hosted Auth, transport, storage or production E2E.
  let posting,application,interview,offer,vacancyContent;
  const submissionKey=crypto.randomUUID();
  const questionId=id(20),fileId=id(21);
  let applicationInput;
  await t.test('canonical vacancy draft saves, reloads, requires review, then publishes',async()=>{
   posting=await command(id(2),'vacancy.create',{organizationId:id(4),title:'Database fixture care role',settingId:'households',occupationId:'nanny',originalLocale:'en',country:'GB',city:'Approximate city',description:'Draft',workSchedule:'part_time',contractType:'permanent',workLocation:'on_site'});
   const content={id:posting.id,title:'Database fixture care role',settingId:'households',occupationId:'nanny',country:'GB',city:'Approximate city',description:'Test-only professional duties and employment conditions, with no real employer or public record.',duties:['Professional care'],requirements:['Relevant experience'],benefits:[],workSchedule:'part_time',contractType:'permanent',workLocation:'on_site',liveIn:false,hoursPerWeek:20,languages:['en'],ageCohorts:['preschool'],compensation:{minimum:20,maximum:25,currency:'GBP',unit:'hour'},overseasApplicants:'yes',sponsorship:'unknown',relocation:'no',requiredDocument:true,questions:[{id:questionId,label:'Test-only professional answer',kind:'text',required:true,maxLength:500}]};
   vacancyContent=content;posting=await command(id(2),'vacancy.save',content,posting.version);assert.equal(posting.version,2);
   posting=await command(id(2),'vacancy.submit_review',{id:posting.id},posting.version);
   const expiresAt=new Date(Date.now()+7*86400000).toISOString();
   await assert.rejects(command(id(2),'vacancy.publish',{id:posting.id,expiresAt},posting.version),/FORBIDDEN/);
   const reviewed=await admin('vacancy.approve',{id:posting.id},posting.version);assert.equal(reviewed.state,'reviewed');
   posting=await command(id(2),'vacancy.publish',{id:posting.id,expiresAt},posting.version);assert.equal(posting.state,'published');
   const data=(await db.query('select public.jobkix_public_vacancy($1) result',[posting.id])).rows[0].result;
   assert.equal(data.questions[0].id,questionId);assert.equal(data.compensation.currency,'GBP');assert.equal(data.workSchedule,'part_time');
  });
  await t.test('anonymous historical job reads preserve the published snapshot during private revision',async()=>{
   const before=(await db.query('select public.jobkix_public_vacancy($1,true) result',[posting.id])).rows[0].result;
   posting=await command(id(2),'vacancy.pause',{id:posting.id,reason:'Isolated publication privacy review'},posting.version);
   posting=await command(id(2),'vacancy.save',{...vacancyContent,description:'PRIVATE_UNREVIEWED_DRAFT_MARKER: this text must never appear in anonymous history.',questions:[{...vacancyContent.questions[0],label:'PRIVATE_UNREVIEWED_QUESTION_MARKER'}]},posting.version);
   const privateRecord=(await asUser(id(2),tx=>tx.query('select description from public.jobkix_vacancies where id=$1',[posting.id]))).rows[0];assert.match(privateRecord.description,/PRIVATE_UNREVIEWED_DRAFT_MARKER/);
   const historical=await db.transaction(async tx=>{await tx.exec('set local role anon');return (await tx.query('select public.jobkix_public_vacancy($1,true) result',[posting.id])).rows[0].result;});
   assert.equal(historical.state,'closed');assert.equal(historical.version,before.version);assert.equal(historical.description,before.description);assert.deepEqual(historical.questions,before.questions);assert.equal(JSON.stringify(historical).includes('PRIVATE_'),false);
   assert.equal((await db.query('select public.jobkix_public_vacancy($1) result',[posting.id])).rows[0].result,null);
   await assert.rejects(db.transaction(async tx=>{await tx.exec('set local role anon');return tx.query('select public.jobkix_vacancy_projection($1)',[posting.id]);}),/permission denied/);
   posting=await command(id(2),'vacancy.save',vacancyContent,posting.version);posting=await command(id(2),'vacancy.submit_review',{id:posting.id},posting.version);await admin('vacancy.approve',{id:posting.id},posting.version);
   posting=await command(id(2),'vacancy.publish',{id:posting.id,expiresAt:new Date(Date.now()+7*86400000).toISOString()},posting.version);
   assert.equal((await db.query('select public.jobkix_public_vacancy($1) result',[posting.id])).rows[0].result.state,'published');
  });
  await t.test('vacancy duplication and reopening require reasons, retain private history and recover one original effect',async()=>{
   const original=(await db.query('select * from public.jobkix_vacancies where id=$1',[posting.id])).rows[0],key=crypto.randomUUID(),payload={id:posting.id,reason:'Create a separate isolated private vacancy draft'};
   await assert.rejects(command(id(2),'vacancy.duplicate',{id:posting.id},posting.version),/INVALID_INPUT/);
   const copy=await command(id(2),'vacancy.duplicate',payload,posting.version,key),replay=await command(id(2),'vacancy.duplicate',payload,posting.version,key);assert.equal(copy.id,replay.id);assert.equal(replay.replayed,true);assert.equal(copy.state,'draft');
   await assert.rejects(command(id(2),'vacancy.duplicate',{...payload,reason:'Another conflicting copy reason'},posting.version,key),/IDEMPOTENCY_CONFLICT/);
   const row=(await db.query('select * from public.jobkix_vacancies where id=$1',[copy.id])).rows[0];assert.equal(row.public_snapshot,null);assert.equal(row.reviewed_version,null);assert.equal(row.published_at,null);assert.equal(row.title,original.title);
   assert.equal((await db.query('select public.jobkix_public_vacancy($1,true) result',[copy.id])).rows[0].result,null);
   const copiedQuestions=(await db.query('select * from public.jobkix_screening_questions where vacancy_id=$1',[copy.id])).rows;assert.equal(copiedQuestions.length,1);assert.notEqual(copiedQuestions[0].id,questionId);assert.equal(copiedQuestions[0].label,vacancyContent.questions[0].label);
   assert.equal((await db.query('select version from public.jobkix_vacancies where id=$1',[posting.id])).rows[0].version,original.version);
   const actionKey='vacancy-action:'+copy.id,body={action:'vacancy.close',payload:{id:copy.id,reason:'Isolated closed draft'},key:crypto.randomUUID(),version:copy.version};const draft=await workspace(id(2),'draft.save',{kind:'vacancy',key:actionKey,body});assert.equal(draft.version,1);
   assert.equal((await asUser(id(3),tx=>tx.query('select * from public.jobkix_drafts where draft_key=$1',[actionKey]))).rows.length,0);
   let closed=await command(id(2),'vacancy.close',body.payload,copy.version,body.key);assert.equal(closed.state,'closed');
   const receipt=(await asUser(id(2),tx=>tx.query('select public.jobkix_hiring_receipt($1,$2) result',['vacancy.close',body.key]))).rows[0].result;assert.equal(receipt.id,copy.id);
   await assert.rejects(command(id(2),'vacancy.submit_review',{id:copy.id},closed.version),/INVALID_TRANSITION/);
   await assert.rejects(command(id(2),'vacancy.reopen',{id:copy.id,reason:'short'},closed.version),/INVALID_INPUT/);
   const reopened=await command(id(2),'vacancy.reopen',{id:copy.id,reason:'Reopen isolated vacancy for a fresh review'},closed.version);assert.equal(reopened.state,'draft');
   assert.equal((await db.query('select reviewed_version from public.jobkix_vacancies where id=$1',[copy.id])).rows[0].reviewed_version,null);
   await assert.rejects(command(id(2),'vacancy.publish',{id:copy.id,expiresAt:new Date(Date.now()+86400000).toISOString()},reopened.version),/FORBIDDEN/);
   const revision=(await db.query('select snapshot from public.jobkix_vacancy_revisions where vacancy_id=$1 order by version desc limit 1',[copy.id])).rows[0];assert.equal(revision.snapshot.change.reason,'Reopen isolated vacancy for a fresh review');
   await workspace(id(2),'draft.remove',{kind:'vacancy',key:actionKey},draft.version);
  });
  await t.test('native administration RPCs reject public identity roles',async()=>{
   await assert.rejects(asUser(id(2),tx=>tx.query('select public.jobkix_admin_command($1,$2,$3,0,$4)',[id(900),'vacancy.approve',{id:posting.id},crypto.randomUUID()])),/permission denied/);
   await assert.rejects(asUser(id(1),tx=>tx.query('select public.jobkix_admin_read($1,$2,$3)',[id(900),'cases','Unauthorized candidate access attempt'])),/permission denied/);
  });
  await t.test('private upload records recover identical requests, deny conflicting retries and require service validation',async()=>{
   const metadata={filename:'ISOLATED fixture.pdf',mime:'application/pdf',purpose:'cv',organizationId:null,bytes:100,sha256:'c'.repeat(64)},key=crypto.randomUUID();
   const begin=()=>asUser(id(1),async tx=>(await tx.query('select public.jobkix_file_begin($1,$2) result',[metadata,key])).rows[0].result);
   const first=await begin(),replay=await begin();assert.equal(first.id,replay.id);assert.equal(first.state,'uploading');
   await assert.rejects(asUser(id(1),tx=>tx.query('select public.jobkix_file_begin($1,$2)',[{...metadata,sha256:'d'.repeat(64)},key])),/IDEMPOTENCY_CONFLICT/);
   await assert.rejects(asUser(id(1),tx=>tx.query('select public.jobkix_file_finish($1,$2,$3,100,$4)',[id(1),first.id,metadata.sha256,'jobkix-static-content-v1:'+metadata.sha256])),/permission denied/);
   await assert.rejects(asUser(id(1),tx=>tx.query('select public.jobkix_file_download($1)',[first.id])),/FORBIDDEN/);
   const finish=()=>db.transaction(async tx=>{await tx.exec('set local role service_role');return tx.query('select public.jobkix_file_finish($1,$2,$3,100,$4)',[id(1),first.id,metadata.sha256,'jobkix-static-content-v1:'+metadata.sha256]);});
   await finish();await finish();
   assert.equal((await asUser(id(1),tx=>tx.query('select * from public.jobkix_files where id=$1',[first.id]))).rows[0].state,'ready');
   assert.equal((await asUser(id(2),tx=>tx.query('select * from public.jobkix_files where id=$1',[first.id]))).rows.length,0);
   await assert.rejects(asUser(id(2),tx=>tx.query('select public.jobkix_file_download($1)',[first.id])),/FORBIDDEN/);
   await assert.rejects(db.query('update public.jobkix_files set sha256=$2 where id=$1',[first.id,'d'.repeat(64)]),/IMMUTABLE_DOCUMENT_REVISION/);
   await asUser(id(1),tx=>tx.query('select public.jobkix_file_archive($1,true)',[first.id]));
   assert.equal((await asUser(id(1),tx=>tx.query('select public.jobkix_file_download($1) result',[first.id]))).rows[0].result.id,first.id,'Archiving a library item must preserve its authorized history bytes');
  });
  await t.test('editorial save/read/review/publish protects exact revisions and language-specific authority',async()=>{
   const content={locale:'en',title:'Isolated career guide',summary:'Synthetic source content; not production editorial.',sections:[{id:'overview',title:'Test section',body:'This is isolated fixture content.'}],author:'Synthetic reviewer',provenance:'Isolated test fixture'};
   let english=await admin('editorial.create',{...content,slug:'isolated-career-guide',kind:'guide'});assert.equal(english.state,'draft');
   assert.equal((await db.query("select public.jobkix_public_editorial('isolated-career-guide','en') result")).rows[0].result,null);
   const initial=english;english=await admin('editorial.save',{...content,id:english.id,title:'Revised isolated career guide'},english.version);assert.equal(english.version,2);
   await assert.rejects(admin('editorial.review',{id:initial.id,contentHash:initial.contentHash},initial.version),/VERSION_CONFLICT/);
   await assert.rejects(admin('editorial.publish',{id:english.id,contentHash:english.contentHash},english.version),/INVALID_TRANSITION/);
   english=await admin('editorial.review',{id:english.id,contentHash:english.contentHash},english.version);
   await assert.rejects(admin('editorial.publish',{id:english.id,contentHash:'0'.repeat(64)},english.version),/VERSION_CONFLICT/);
   const key=crypto.randomUUID();english=await admin('editorial.publish',{id:english.id,contentHash:english.contentHash},english.version,key);
   const replay=await admin('editorial.publish',{id:english.id,contentHash:english.contentHash},english.version,key);assert.equal(replay.replayed,true);
   const published=(await db.query("select public.jobkix_public_editorial('isolated-career-guide','en') result")).rows[0].result;assert.equal(published.title,'Revised isolated career guide');
   let french=await admin('editorial.translate',{...content,id:english.id,locale:'fr',title:'Guide de test isolé',sourceHash:english.sourceHash},english.version);
   french=await admin('editorial.review',{id:french.id,contentHash:french.contentHash},french.version);french=await admin('editorial.publish',{id:french.id,contentHash:french.contentHash},french.version);
   assert.notEqual((await db.query("select public.jobkix_public_editorial('isolated-career-guide','fr') result")).rows[0].result,null);
   let changed=await admin('editorial.save',{...content,id:english.id,title:'New source revision'},english.version);
   assert.equal((await db.query("select public.jobkix_public_editorial('isolated-career-guide','en') result")).rows[0].result.title,published.title,'Draft authoring must preserve the published edition');
   changed=await admin('editorial.review',{id:changed.id,contentHash:changed.contentHash},changed.version);changed=await admin('editorial.publish',{id:changed.id,contentHash:changed.contentHash},changed.version);
   assert.equal((await db.query("select public.jobkix_public_editorial('isolated-career-guide','fr') result")).rows[0].result,null,'Old-source translations must stop publishing');
   await assert.rejects(admin('editorial.save',{...content,id:french.id,locale:'fr',sourceHash:french.sourceHash},french.version),/VERSION_CONFLICT/);
   const rollback=await admin('editorial.rollback',{id:english.id,contentHash:english.contentHash},english.version);assert.ok(rollback.sourceRevision>changed.sourceRevision);
   assert.equal((await db.query("select public.jobkix_public_editorial('isolated-career-guide','en') result")).rows[0].result.title,published.title);
   await admin('editorial.unpublish',{id:rollback.id},rollback.version);assert.equal((await db.query("select public.jobkix_public_editorial('isolated-career-guide','en') result")).rows[0].result,null);
  });
  await t.test('editorial review refuses empty publications and public lists exclude drafts and stale translations',async()=>{
   const content={slug:'isolated-discovery-guide',kind:'guide',locale:'en',title:'Isolated discovery guide',summary:'Test-only discovery content',sections:[],author:'Synthetic editor',provenance:'Isolated test fixture'};
   let record=await admin('editorial.create',content);await assert.rejects(admin('editorial.review',{id:record.id,contentHash:record.contentHash},record.version),/INVALID_INPUT/);
   const list=()=>db.transaction(async tx=>{await tx.exec('set local role anon');return (await tx.query('select public.jobkix_public_editorial_list($1,$2,$3,$4,$5) result',['guide','en','isolated-discovery-','',1])).rows[0].result;});assert.equal((await list()).total,0);
   record=await admin('editorial.save',{...content,id:record.id,sections:[{id:'overview',title:'Fixture section',body:'Synthetic authored content, not a production record.'}]},record.version);record=await admin('editorial.review',{id:record.id,contentHash:record.contentHash},record.version);record=await admin('editorial.publish',{id:record.id,contentHash:record.contentHash},record.version);
   const result=await list();assert.equal(result.total,1);assert.equal(result.items[0].title,content.title);assert.equal('sections' in result.items[0],false);
   const related=(await db.query('select public.jobkix_related_taxonomy($1,$2,$3) result',['setting','households','en'])).rows[0].result;assert.equal(related.some(row=>row.key==='nanny'&&row.opportunityCount>0),true);
   await assert.rejects(admin('organization.review',{id:id(4),reference:'fixture reference',evidenceIds:[]},1),/INVALID_INPUT/);
  });
  await t.test('native editorial media follows stable section IDs, preserves historical references and rechecks rights',async()=>{
   const asset=id(950);await db.query("insert into public.angelcare_marketplace_media_assets values($1,'active','image/webp','licensed',now()+interval '1 day','https://fixture.invalid/approved-editorial.webp')",[asset]);
   const media={source:'native',id:asset,alt:'Isolated licensed editorial scene',desktopFocal:{x:55,y:40},mobileFocal:{x:45,y:35}},opening={id:'opening',title:'Fixture opening',body:'Synthetic editorial context',media},details={id:'details',title:'Fixture details',body:'Synthetic details'};
   const content={slug:'isolated-native-media',kind:'guide',locale:'en',title:'Isolated media guide',summary:'Test-only media workflow',sections:[opening,details],author:'Synthetic editor',provenance:'Isolated licensed asset fixture'};
   let record=await admin('editorial.create',content);const first=record;
   record=await admin('editorial.save',{...content,id:record.id,sections:[details,opening]},record.version);
   const saved=(await db.query('select sections from public.jobkix_editorial_editions where id=$1',[record.id])).rows[0].sections;assert.equal(saved[1].id,'opening');assert.deepEqual(saved[1].media,media);
   let references=(await db.query('select * from public.angelcare_marketplace_media_usage where media_asset_id=$1',[asset])).rows;assert.equal(references.length,2);assert.ok(references.every(row=>row.slot_key==='section:opening'));
   record=await admin('editorial.save',{...content,id:record.id,sections:[details]},record.version);assert.equal((await db.query('select * from public.angelcare_marketplace_media_usage where object_id=$1',[record.id])).rows.length,0);
   assert.equal((await db.query('select * from public.angelcare_marketplace_media_usage where object_id=$1',[first.id])).rows.length,1,'An older draft retains its legitimate native reference');
   await assert.rejects(db.query('delete from public.angelcare_marketplace_media_assets where id=$1',[asset]),/foreign key/);
   record=await admin('editorial.save',{...content,id:record.id},record.version);record=await admin('editorial.review',{id:record.id,contentHash:record.contentHash},record.version);
   await db.query("update public.angelcare_marketplace_media_assets set rights_status='expired' where id=$1",[asset]);await assert.rejects(admin('editorial.publish',{id:record.id,contentHash:record.contentHash},record.version),/DOCUMENT_NOT_READY/);
   await assert.rejects(admin('editorial.create',{...content,slug:'isolated-expired-image'}),/DOCUMENT_NOT_READY/);
   await db.query("update public.angelcare_marketplace_media_assets set rights_status='licensed' where id=$1",[asset]);
   for(const sections of [[opening,opening],[{...opening,media:{...media,alt:''}}],[{...opening,media:{...media,desktopFocal:{x:101,y:50}}}],[{...opening,media:{...media,source:'editorial',id:'unregistered-scene'}}]])await assert.rejects(admin('editorial.create',{...content,slug:'isolated-invalid-image',sections}),/INVALID_INPUT/);
  });
  await t.test('resource bookmarks persist privately with exact versions, idempotency and unavailable history',async()=>{
   const document=(await db.query("select id from public.jobkix_editorial_documents where slug='isolated-discovery-guide'")).rows[0].id,key=crypto.randomUUID();
   const save=(user,saved,version,retry=crypto.randomUUID())=>asUser(user,async tx=>(await tx.query('select public.jobkix_save_resource($1,$2,$3,$4,$5,$6) result',[document,'en',saved,'Resource fixtures',version,retry])).rows[0].result);
   const first=await save(id(1),true,0,key);assert.equal(first.saved,true);assert.equal(first.version,1);assert.equal((await save(id(1),true,0,key)).replayed,true);
   await assert.rejects(save(id(1),false,0,key),/IDEMPOTENCY_CONFLICT/);await assert.rejects(save(id(1),true,0),/VERSION_CONFLICT/);
   assert.equal((await asUser(id(2),tx=>tx.query('select * from public.jobkix_saved_resources'))).rows.length,0);
   await assert.rejects(db.transaction(async tx=>{await tx.exec('set local role anon');return tx.query('select * from public.jobkix_saved_resources');}),/permission denied/);
   const list=()=>asUser(id(1),async tx=>(await tx.query('select public.jobkix_saved_collection($1,$2,$3,$4,$5) result',['en','resource','Resource fixtures','',1])).rows[0].result);
   assert.equal((await list()).items[0].target.title,'Isolated discovery guide');
   const edition=(await db.query("select e.id,e.version from public.jobkix_editorial_editions e where e.document_id=$1 and e.status='published'",[document])).rows[0];await admin('editorial.unpublish',{id:edition.id},edition.version);
   assert.equal((await list()).items[0].target,null);assert.equal((await list()).items[0].title,'Isolated discovery guide');
   await assert.rejects(save(id(1),true,1),/NOT_FOUND/);const removed=await save(id(1),false,1);assert.equal(removed.version,2);assert.equal((await list()).total,0);
   await save(id(1),true,0,key);assert.equal((await list()).total,0,'An old receipt replay must never resurrect a later removal');
  });
  await t.test('canonical discovery resolves controlled synonyms and one-edit typos without wildcard matches',async()=>{
   for(const q of ['nounou','niñera','nany']){const result=(await db.query('select public.jobkix_search($1) result',[{q}])).rows[0].result;assert.equal(result.items.some(item=>item.id===posting.id),true,q);}
   assert.equal((await db.query('select public.jobkix_search($1) result',[{q:'%'}])).rows[0].result.total,0);
   assert.equal((await db.query('select public.jobkix_search($1) result',[{reach:'domestic',origin:'GB',destination:'FR'}])).rows[0].result.total,1);
   await assert.rejects(db.query('select public.jobkix_search($1)',[{salaryMinimum:'20'}]),/INVALID_INPUT/);
   await assert.rejects(db.query('select public.jobkix_search($1)',[{page:0}]),/INVALID_INPUT/);
   await assert.rejects(db.query('select public.jobkix_search($1)',[{privateCandidateId:id(1)}]),/INVALID_INPUT/);
   assert.equal((await db.query('select public.jobkix_search($1) result',[{salaryMinimum:'24',currency:'GBP',salaryUnit:'hour'}])).rows[0].result.total,0,'A maximum of 25 is not a guaranteed minimum of 24');
   assert.equal((await db.query('select public.jobkix_search($1) result',[{salaryMinimum:'20',currency:'GBP',salaryUnit:'hour'}])).rows[0].result.items.some(item=>item.id===posting.id),true);
  });
  await t.test('invalid required answers roll back application, receipt, thread and events together',async()=>{
   await db.query(`insert into public.jobkix_files(id,owner_user_id,purpose,object_key,filename,mime,expected_bytes,actual_bytes,sha256,state,scanner_reference) values($1,$2,'cv',$3,'fixture.pdf','application/pdf',100,100,$4,'ready','ISOLATED_SCAN_FIXTURE')`,[fileId,id(1),'fixture/'+fileId,'a'.repeat(64)]);
   applicationInput={vacancyId:posting.id,vacancyVersion:posting.version,profileVersion:1,documentId:fileId,answers:{[questionId]:'Professional fixture answer'},sharingConsent:true,consentRevision:'jobkix-application-2026-10-20'};
   await assert.rejects(command(id(1),'application.submit',{...applicationInput,answers:{}},0,submissionKey),/INVALID_INPUT/);
   for(const table of ['jobkix_applications','jobkix_threads','jobkix_command_receipts']) {
    const result=await db.query(`select count(*)::integer n from public.${table}`);
    if(table==='jobkix_command_receipts') assert.equal((await db.query('select count(*)::integer n from public.jobkix_command_receipts where idempotency_key=$1',[submissionKey])).rows[0].n,0);
    else assert.equal(result.rows[0].n,0);
   }
  });
  await t.test('atomic submit creates one canonical receipt, immutable snapshot, thread and durable notifications',async()=>{
   application=await command(id(1),'application.submit',applicationInput,0,submissionKey);assert.equal(application.state,'submitted');assert.match(application.receipt,/^JK-/);
   const row=(await asUser(id(1),tx=>tx.query('select * from public.jobkix_applications where id=$1',[application.id]))).rows[0];
   assert.equal(row.snapshot.vacancy.title,'Database fixture care role');assert.equal(row.snapshot.file.sha256,'a'.repeat(64));
   assert.equal('discoverable' in row.snapshot.profile,false);assert.equal('blockedOrganizationIds' in row.snapshot.profile,false);
   assert.equal((await db.query('select count(*)::integer n from public.jobkix_threads where application_id=$1',[application.id])).rows[0].n,1);
   assert.equal((await db.query("select count(*)::integer n from public.jobkix_outbox where template_key='application.submitted'")).rows[0].n,4);
  });
  await t.test('same-key replay recovers the original effect; changed payload and duplicate keyless apply are rejected',async()=>{
   const replay=await command(id(1),'application.submit',applicationInput,0,submissionKey);assert.equal(replay.id,application.id);assert.equal(replay.replayed,true);
   await assert.rejects(command(id(1),'application.submit',{...applicationInput,answers:{[questionId]:'Changed'}},0,submissionKey),/IDEMPOTENCY_CONFLICT/);
   await assert.rejects(command(id(1),'application.submit',applicationInput),/ALREADY_APPLIED/);
   assert.equal((await db.query('select count(*)::integer n from public.jobkix_applications')).rows[0].n,1);
  });
  await t.test('later profile updates and notification delivery failure preserve the committed application',async()=>{
   await command(id(1),'profile.save',{displayName:'Updated fixture name',headline:'Changed headline',summary:'Changed current profile',country:'FR',skills:['new'],occupations:['nanny'],languages:['fr'],experience:[],education:[],preferences:{}},1);
   const stored=(await asUser(id(1),tx=>tx.query('select snapshot from public.jobkix_applications where id=$1',[application.id]))).rows[0].snapshot;
   assert.equal(stored.profile.displayName,'Private fixture candidate');assert.equal(stored.profileVersion,1);
   await assert.rejects(db.query("update public.jobkix_applications set snapshot='{}' where id=$1",[application.id]),/IMMUTABLE_APPLICATION_SNAPSHOT/);
   const before=(await db.query('select count(*)::integer n from public.jobkix_outbox')).rows[0].n;
   await db.query("update public.jobkix_outbox set state='failed',attempts=1,last_error_code='ISOLATED_TRANSPORT_FAILURE' where channel='email'");
   const replay=await command(id(1),'application.submit',applicationInput,0,submissionKey);assert.equal(replay.id,application.id);
   assert.equal((await db.query('select count(*)::integer n from public.jobkix_outbox')).rows[0].n,before);
  });
  await t.test('recruiter review enforces current permissions and expected version; unrelated identity sees nothing',async()=>{
   const outsider=await asUser(id(3),tx=>tx.query('select * from public.jobkix_applications'));assert.equal(outsider.rows.length,0);
   await assert.rejects(command(id(3),'application.stage',{applicationId:application.id,state:'shortlisted'},1),/FORBIDDEN/);
   application=await command(id(2),'application.stage',{applicationId:application.id,state:'shortlisted'},1);
   await assert.rejects(command(id(2),'application.stage',{applicationId:application.id,state:'interview'},1),/VERSION_CONFLICT/);
   await assert.rejects(command(id(2),'application.stage',{applicationId:application.id,state:'hired'},application.version),/INVALID_TRANSITION/);
  });
  await t.test('participant messaging records a durable original-language message without opening unrelated threads',async()=>{
   await command(id(2),'message.send',{applicationId:application.id,body:'Test-only recruitment message',locale:'en'});
   const messages=await asUser(id(1),tx=>tx.query('select body,original_locale from public.jobkix_messages'));assert.equal(messages.rows.length,1);assert.equal(messages.rows[0].original_locale,'en');
   const outsider=await asUser(id(3),tx=>tx.query('select * from public.jobkix_messages'));assert.equal(outsider.rows.length,0);
   await assert.rejects(command(id(3),'message.send',{applicationId:application.id,body:'Unauthorized',locale:'en'}),/FORBIDDEN/);
  });
  await t.test('new messages recheck current block and organization status while preserving committed receipts',async()=>{
   const key=crypto.randomUUID(),payload={applicationId:application.id,body:'Private candidate message before block',locale:'fr'};const first=await command(id(1),'message.send',payload,0,key);
   await workspace(id(1),'privacy.block',{organizationId:id(4)});await assert.rejects(command(id(1),'message.send',{...payload,body:'Must not send after block'}),/FORBIDDEN/);
   assert.equal((await command(id(1),'message.send',payload,0,key)).id,first.id);assert.equal((await asUser(id(1),tx=>tx.query('select * from public.jobkix_applications where id=$1',[application.id]))).rows.length,1);
   await workspace(id(1),'privacy.unblock',{organizationId:id(4)});await db.query("update public.jobkix_organizations set status='suspended' where id=$1",[id(4)]);
   await assert.rejects(command(id(1),'message.send',{...payload,body:'Must not send to suspended organization'}),/FORBIDDEN/);await db.query("update public.jobkix_organizations set status='active' where id=$1",[id(4)]);
  });
  await t.test('international interview stores UTC/IANA context, panel scope and the candidate response',async()=>{
   const startsAt=new Date(Date.now()+86400000).toISOString(),endsAt=new Date(Date.now()+90000000).toISOString();
   interview=await command(id(2),'interview.propose',{applicationId:application.id,startsAt,endsAt,timezone:'Asia/Kolkata',format:'video',location:'https://meeting.fixture.invalid/room',panelUserIds:[id(2)]});
   const stored=(await asUser(id(1),tx=>tx.query('select * from public.jobkix_interviews where id=$1',[interview.id]))).rows[0];assert.equal(stored.timezone,'Asia/Kolkata');assert.equal(new Date(stored.starts_at).toISOString(),startsAt);
   await assert.rejects(command(id(3),'interview.respond',{id:interview.id,response:'accepted'},1),/FORBIDDEN/);
   interview=await command(id(1),'interview.respond',{id:interview.id,response:'accepted'},1);assert.equal(interview.state,'scheduled');
   assert.equal((await asUser(id(1),tx=>tx.query('select * from public.jobkix_interview_revisions where interview_id=$1',[interview.id]))).rows.length,2);
  });
  await t.test('assigned panelists read only submitted evidence; revocation immediately removes application and file access',async()=>{
   await db.query('insert into auth.users values($1,$2,now())',[id(760),'panel@fixture.invalid']);await db.query("insert into public.jobkix_accounts(user_id,adult_confirmed_at,display_name) values($1,now(),'Isolated panel reviewer')",[id(760)]);
   await db.query("insert into public.jobkix_memberships(organization_id,user_id,role,vacancy_ids) values($1,$2,'interviewer',$3)",[id(4),id(760),[posting.id]]);
   assert.equal((await asUser(id(760),tx=>tx.query('select * from public.jobkix_applications'))).rows.length,0);
   const meeting=(await db.query('select * from public.jobkix_interviews where id=$1',[interview.id])).rows[0];
   await assert.rejects(command(id(2),'interview.reschedule',{id:interview.id,startsAt:new Date(meeting.starts_at).toISOString(),endsAt:new Date(meeting.ends_at).toISOString(),timezone:meeting.timezone,format:meeting.format,location:meeting.location,panelUserIds:[id(1)]},interview.version),/INVALID_INPUT/);
   interview=await command(id(2),'interview.reschedule',{id:interview.id,startsAt:new Date(meeting.starts_at).toISOString(),endsAt:new Date(meeting.ends_at).toISOString(),timezone:meeting.timezone,format:meeting.format,location:meeting.location,panelUserIds:[id(2),id(760)]},interview.version);
   const visible=await asUser(id(760),tx=>tx.query('select * from public.jobkix_applications'));assert.equal(visible.rows.length,1);assert.equal(visible.rows[0].id,application.id);
   for(const table of ['jobkix_candidates','jobkix_vacancies','jobkix_organization_private'])assert.equal((await asUser(id(760),tx=>tx.query('select * from public.'+table))).rows.length,0,table);
   const capabilities=(await asUser(id(760),tx=>tx.query('select public.jobkix_application_capabilities($1) result',[application.id]))).rows[0].result;assert.deepEqual(capabilities,{decide:false,message:false,interview:false,offer:false,evaluate:true});
   const roster=(await asUser(id(2),tx=>tx.query('select public.jobkix_panel_roster($1) result',[posting.id]))).rows[0].result;assert.equal(roster.find(row=>row.userId===id(760)).name,'Isolated panel reviewer');assert.equal(JSON.stringify(roster).includes('@fixture.invalid'),false);
   await assert.rejects(asUser(id(760),tx=>tx.query('select public.jobkix_panel_roster($1)',[posting.id])),/FORBIDDEN/);
   assert.equal((await asUser(id(760),tx=>tx.query('select public.jobkix_file_download($1) result',[fileId]))).rows[0].result.id,fileId);
   await assert.rejects(workspace(id(760),'draft.save',{kind:'hiring',key:'interview:'+application.id+':new',body:{fields:{location:'PRIVATE_SCHEDULING_MARKER'}}}),/FORBIDDEN/);
   const panelVersion=interview.version,panelKey=crypto.randomUUID(),panelInput={id:interview.id,response:'accepted'};
   await assert.rejects(command(id(1),'interview.panel_respond',panelInput,panelVersion),/FORBIDDEN/);await assert.rejects(command(id(3),'interview.panel_respond',panelInput,panelVersion),/FORBIDDEN/);
   interview=await command(id(760),'interview.panel_respond',panelInput,panelVersion,panelKey);assert.equal((await command(id(760),'interview.panel_respond',panelInput,panelVersion,panelKey)).version,interview.version);
   assert.equal((await db.query('select candidate_response from public.jobkix_interviews where id=$1',[interview.id])).rows[0].candidate_response,'pending','A panel response must not accept on behalf of the candidate');
   const panelHistory=(await db.query('select snapshot from public.jobkix_interview_revisions where interview_id=$1 and version=$2',[interview.id,interview.version])).rows[0].snapshot;assert.equal(panelHistory.panels.find(member=>member.userId===id(760)).response,'accepted');
   await assert.rejects(command(id(760),'interview.panel_respond',{id:interview.id,response:'declined'},panelVersion),/VERSION_CONFLICT/);
   interview=await command(id(760),'interview.panel_respond',{id:interview.id,response:'declined'},interview.version);assert.equal((await asUser(id(760),tx=>tx.query('select * from public.jobkix_applications'))).rows.length,0);await assert.rejects(asUser(id(760),tx=>tx.query('select public.jobkix_file_download($1)',[fileId])),/FORBIDDEN/);await assert.rejects(workspace(id(760),'evaluation.save',{interviewId:interview.id,criteria:{professionalEvidence:'Must not create a new evaluation after declining'},notes:''}),/FORBIDDEN/);
   await db.query('update public.jobkix_memberships set active=false where user_id=$1',[id(760)]);assert.equal((await asUser(id(760),tx=>tx.query('select * from public.jobkix_applications'))).rows.length,0);await assert.rejects(asUser(id(760),tx=>tx.query('select public.jobkix_file_download($1)',[fileId])),/FORBIDDEN/);
  });
  await t.test('recruitment drafts and receipts stay actor/capability scoped through interrupted commands',async()=>{
   const key='interview:'+application.id+':'+interview.id,meeting=(await db.query('select * from public.jobkix_interviews where id=$1',[interview.id])).rows[0],commandKey=crypto.randomUUID(),payload={id:interview.id,startsAt:new Date(meeting.starts_at).toISOString(),endsAt:new Date(meeting.ends_at).toISOString(),timezone:meeting.timezone,format:meeting.format,location:meeting.location,panelUserIds:[id(2)]},body={fields:{location:payload.location},intent:{action:'interview.reschedule',payload,version:interview.version,key:commandKey}};
   let draft=await workspace(id(2),'draft.save',{kind:'hiring',key,body});assert.equal(draft.version,1);
   for(const actor of [id(1),id(3)]){assert.equal((await asUser(actor,tx=>tx.query("select * from public.jobkix_drafts where kind='hiring'"))).rows.length,0);await assert.rejects(workspace(actor,'draft.save',{kind:'hiring',key,body}),/FORBIDDEN/);}
   interview=await command(id(2),'interview.reschedule',payload,body.intent.version,commandKey);const recovered=(await asUser(id(2),tx=>tx.query('select public.jobkix_recruitment_receipt($1,$2) result',['interview.reschedule',commandKey]))).rows[0].result;assert.equal(recovered.id,interview.id);assert.equal(recovered.version,interview.version);
   assert.equal((await asUser(id(1),tx=>tx.query('select public.jobkix_recruitment_receipt($1,$2) result',['interview.reschedule',commandKey]))).rows[0].result,null);
   await db.query('update public.jobkix_memberships set active=false where user_id=$1',[id(2)]);assert.equal((await asUser(id(2),tx=>tx.query("select * from public.jobkix_drafts where kind='hiring'"))).rows.length,0);await assert.rejects(asUser(id(2),tx=>tx.query('select public.jobkix_recruitment_receipt($1,$2)',['interview.reschedule',commandKey])),/FORBIDDEN/);await db.query('update public.jobkix_memberships set active=true where user_id=$1',[id(2)]);
   await workspace(id(2),'draft.remove',{kind:'hiring',key},draft.version);
  });
  await t.test('confidential evaluation writes and reads exclude the candidate and unrelated identities',async()=>{
   const evaluation=await workspace(id(2),'evaluation.save',{interviewId:interview.id,criteria:{professionalEvidence:'ISOLATED_CRITERION'},notes:'CONFIDENTIAL_EVALUATION_MARKER'});
   assert.equal((await asUser(id(2),tx=>tx.query('select * from public.jobkix_evaluations where id=$1',[evaluation.id]))).rows.length,1);
   for(const actor of [id(1),id(3)]){assert.equal((await asUser(actor,tx=>tx.query('select * from public.jobkix_evaluations'))).rows.length,0);await assert.rejects(workspace(actor,'evaluation.save',{interviewId:interview.id,criteria:{},notes:'Forbidden'}),/FORBIDDEN/);}
  });
  await t.test('server drafts are versioned, idempotent and separated by authenticated account',async()=>{
   const payload={kind:'application',key:posting.id,body:{answers:{[questionId]:'PRIVATE_DRAFT_MARKER'}}},key=crypto.randomUUID();
   const first=await workspace(id(1),'draft.save',payload,0,key),replay=await workspace(id(1),'draft.save',payload,0,key);assert.equal(first.version,1);assert.equal(replay.replayed,true);
   await assert.rejects(workspace(id(1),'draft.save',{...payload,body:{changed:true}},0,key),/IDEMPOTENCY_CONFLICT/);
   await assert.rejects(workspace(id(1),'draft.save',payload,0),/VERSION_CONFLICT/);
   assert.equal((await asUser(id(2),tx=>tx.query('select * from public.jobkix_drafts'))).rows.length,0);
   const saved=await workspace(id(1),'draft.save',{...payload,body:{answers:{[questionId]:'Revised draft'}}},1);assert.equal(saved.version,2);
   await assert.rejects(workspace(id(2),'draft.remove',{kind:'application',key:posting.id},2),/VERSION_CONFLICT/);
  });
  await t.test('saved searches and jobs persist without leaking candidate job-seeking activity',async()=>{
   const saved=await workspace(id(1),'saved.save',{vacancyId:posting.id,collection:'Private collection'});assert.equal(saved.version,1);
   const alert=await workspace(id(1),'search.save',{id:null,name:'Private search',filters:{origin:'FR',destination:'GB'},frequency:'off',enabled:true});
   assert.equal((await asUser(id(1),tx=>tx.query('select * from public.jobkix_saved_jobs'))).rows.length,1);
   for(const table of ['jobkix_saved_jobs','jobkix_saved_searches'])assert.equal((await asUser(id(2),tx=>tx.query('select * from public.'+table))).rows.length,0);
   await assert.rejects(workspace(id(2),'search.remove',{id:alert.id},1),/NOT_FOUND/);
   const moved=await workspace(id(1),'saved.save',{vacancyId:posting.id,collection:'Updated private collection'},saved.version);assert.equal(moved.version,2);
   await assert.rejects(workspace(id(1),'saved.remove',{vacancyId:posting.id},saved.version),/VERSION_CONFLICT/);
   const list=(await asUser(id(1),tx=>tx.query('select public.jobkix_saved_collection($1,$2,$3,$4,$5) result',['en','job','Updated private collection','',1]))).rows[0].result;assert.equal(list.total,1);assert.equal(list.items[0].target.id,posting.id);
  });
  await t.test('saved-search edits use expected versions, native filters and private ownership',async()=>{
   const payload={id:null,name:'Operational alert fixture',filters:{origin:'FR',reach:'abroad'},frequency:'weekly',enabled:true};
   let saved=await workspace(id(1),'search.save',payload);
   await assert.rejects(workspace(id(1),'search.save',{...payload,filters:{...payload.filters,unapproved:'private'}},0),/INVALID_INPUT/);
   await assert.rejects(workspace(id(1),'search.save',{...payload,filters:{pageSize:'48'}},0),/INVALID_INPUT/);
   await assert.rejects(workspace(id(1),'search.save',{...payload,filters:{q:123}},0),/INVALID_INPUT/);
   await assert.rejects(workspace(id(3),'search.save',{...payload,id:saved.id},saved.version),/NOT_FOUND/);
   saved=await workspace(id(1),'search.save',{...payload,id:saved.id,filters:{destination:'CA'},frequency:'off'},saved.version);
   await assert.rejects(workspace(id(1),'search.save',{...payload,id:saved.id},1),/VERSION_CONFLICT/);
   const row=(await asUser(id(1),tx=>tx.query('select * from public.jobkix_saved_searches where id=$1',[saved.id]))).rows[0];assert.deepEqual(row.filters,{destination:'CA'});assert.equal(row.frequency,'off');
  });
  await t.test('private cases save/reload, recover receipts, retain original language and enforce reporter versions',async()=>{
   const payload={kind:'support',category:'application',description:'PRIVATE_CASE_REPORTER_MARKER request recovery.',locale:'fr',organizationId:id(4)},key=crypto.randomUUID();
   let created=await workspace(id(1),'case.create',payload,0,key);const caseId=created.id;
   assert.equal((await workspace(id(1),'case.create',payload,0,key)).replayed,true);
   const receipt=(await asUser(id(1),tx=>tx.query('select public.jobkix_case_receipt($1,$2) result',['case.create',key]))).rows[0].result;assert.equal(receipt.id,caseId);assert.equal(receipt.reference,created.reference);
   assert.equal((await asUser(id(3),tx=>tx.query('select public.jobkix_case_receipt($1,$2) result',['case.create',key]))).rows[0].result,null);
   assert.equal((await asUser(id(3),tx=>tx.query('select * from public.jobkix_cases where id=$1',[caseId]))).rows.length,0);
   let row=(await asUser(id(1),tx=>tx.query('select * from public.jobkix_cases where id=$1',[caseId]))).rows[0];assert.equal(row.organization_id,id(4));assert.equal(row.original_locale,'fr');
   const intent={action:'case.reply',payload:{id:caseId,description:'PRIVATE_CASE_REPLY_MARKER needs assistance.',locale:'tl'},version:1,key:crypto.randomUUID()};
   await workspace(id(1),'draft.save',{kind:'case',key:'reply:'+caseId,body:{fields:{description:intent.payload.description},intent}},0);
   assert.equal((await asUser(id(1),tx=>tx.query("select body from public.jobkix_drafts where kind='case' and draft_key=$1",['reply:'+caseId]))).rows[0].body.intent.key,intent.key);
   await assert.rejects(workspace(id(3),'draft.save',{kind:'case',key:'reply:'+caseId,body:{}},0),/FORBIDDEN/);
   await assert.rejects(workspace(id(3),'case.reply',intent.payload,1),/FORBIDDEN/);
   created=await workspace(id(1),intent.action,intent.payload,intent.version,intent.key);assert.equal(created.version,2);
   assert.equal((await workspace(id(1),intent.action,intent.payload,intent.version,intent.key)).replayed,true);
   await assert.rejects(workspace(id(1),intent.action,{...intent.payload,description:'Changed same-key effect is forbidden'},intent.version,intent.key),/IDEMPOTENCY_CONFLICT/);
   await assert.rejects(workspace(id(1),intent.action,intent.payload,1),/VERSION_CONFLICT/);
   await admin('case.advance',{id:caseId,state:'under_review',visibility:'internal',locale:'en',note:'INTERNAL_CASE_EVALUATION_MARKER'},2);
   await admin('case.advance',{id:caseId,state:'no_action',visibility:'reporter',locale:'ar',note:'Private visible fixture decision.'},3);
   const visible=(await asUser(id(1),tx=>tx.query('select * from public.jobkix_case_events where case_id=$1',[caseId]))).rows;
   assert.equal(visible.length,2);assert.ok(visible.some(event=>event.original_locale==='tl'));assert.ok(visible.some(event=>event.original_locale==='ar'));assert.equal(JSON.stringify(visible).includes('INTERNAL_CASE'),false);
   await workspace(id(1),'case.appeal',{id:caseId,description:'PRIVATE_CASE_APPEAL_MARKER reviewed objection.',locale:'hi'},4);
   assert.equal((await asUser(id(1),tx=>tx.query('select state from public.jobkix_cases where id=$1',[caseId]))).rows[0].state,'appealed');
   await assert.rejects(workspace(id(1),'case.create',{...payload,kind:'verification'}),/INVALID_INPUT/);
   await assert.rejects(workspace(id(1),'privacy.request',{...payload,kind:'support'}),/INVALID_INPUT/);
   await assert.rejects(workspace(id(1),'verification.submit',{...payload,kind:'verification',fileId}),/FORBIDDEN/);
   await workspace(id(1),'privacy.request',{kind:'privacy_deletion',category:'privacy',description:'A private manual review request without immediate deletion.',locale:'id'});
  });
  await t.test('public employer pagination and block-list display never reveal private draft identity',async()=>{
   await workspace(id(1),'privacy.block',{organizationId:id(4)});
   let blocked=(await asUser(id(1),tx=>tx.query('select public.jobkix_blocked_organizations() result'))).rows[0].result;assert.equal(blocked[0].name,'Fixture household alias');
   await db.query('update public.jobkix_organizations set public_profile_approved_at=null,public_name=$2 where id=$1',[id(4),'PRIVATE_DRAFT_EMPLOYER_NAME']);
   blocked=(await asUser(id(1),tx=>tx.query('select public.jobkix_blocked_organizations() result'))).rows[0].result;assert.equal(blocked[0].name,null);
   let page=(await db.query('select public.jobkix_public_employers(null,$1,1) result',['PRIVATE_DRAFT'])).rows[0].result;assert.equal(page.total,0);
   await db.query('update public.jobkix_organizations set public_profile_approved_at=now(),public_name=$2 where id=$1',[id(4),'Fixture household alias']);
   page=(await db.query("select public.jobkix_public_employers('GB','Fixture household',1) result")).rows[0].result;assert.equal(page.total,1);assert.equal(page.pageSize,24);assert.equal(page.items.length,1);assert.equal('media' in page.items[0],false);
   await assert.rejects(db.query("select public.jobkix_public_employers('bad','',1)"),/INVALID_INPUT/);
   await workspace(id(1),'privacy.unblock',{organizationId:id(4)});
  });
  await t.test('self export excludes internal evaluation, private storage and other candidates, and enforces active identity',async()=>{
   const result=(await asUser(id(1),tx=>tx.query('select public.jobkix_self_export() result'))).rows[0].result;
   assert.equal(result.format,'JOBKIX_PRIVATE_CAREER_EXPORT_V1');assert.equal(result.profile.user_id,id(1));assert.ok(result.applications.some(row=>row.id===application.id));assert.ok(result.cases.length>=2);
   const bytes=JSON.stringify(result);for(const key of ['object_key','upload_key','INTERNAL_CASE_EVALUATION_MARKER','confidential_notes','professional_criteria','PRIVATE_ADDRESS_MARKER','PRIVATE_PHONE_MARKER'])assert.equal(bytes.includes(key),false,key);
   const other=(await asUser(id(3),tx=>tx.query('select public.jobkix_self_export() result'))).rows[0].result;assert.equal(other.profile,null);assert.deepEqual(other.applications,[]);assert.deepEqual(other.cases,[]);
   await assert.rejects(db.transaction(async tx=>{await tx.exec('set local role anon');await tx.query('select public.jobkix_self_export()');}),/permission denied/);
   await db.query("update public.jobkix_accounts set status='restricted' where user_id=$1",[id(1)]);
   await assert.rejects(asUser(id(1),tx=>tx.query('select public.jobkix_self_export()')),/ACCOUNT_RESTRICTED/);
   await db.query("update public.jobkix_accounts set status='active' where user_id=$1",[id(1)]);
  });
  await t.test('talent pools immediately stop exposing members after consent withdrawal or blocking',async()=>{
   const pool=await workspace(id(2),'pool.create',{organizationId:id(4),name:'Isolated consented pool'});
   await workspace(id(2),'pool.add',{poolId:pool.id,candidateUserId:id(1)});
   assert.equal((await asUser(id(2),tx=>tx.query('select * from public.jobkix_talent_pool_members'))).rows.length,1);
   await workspace(id(1),'privacy.block',{organizationId:id(4)});
   assert.equal((await asUser(id(2),tx=>tx.query('select * from public.jobkix_talent_pool_members'))).rows.length,0);
   await assert.rejects(workspace(id(2),'pool.add',{poolId:pool.id,candidateUserId:id(1)}),/FORBIDDEN/);
   await workspace(id(1),'privacy.unblock',{organizationId:id(4)});
  });
  await t.test('invitations require the intended verified email and preserve scoped membership',async()=>{
   const site=await workspace(id(2),'site.create',{organizationId:id(4),label:'Isolated institution site',country:'GB',region:'',city:'Approximate city',timezone:'Europe/London'});
   const invitation=await workspace(id(2),'team.invite',{organizationId:id(4),email:'outsider@fixture.invalid',locale:'tl',role:'recruiter',siteIds:[site.id],vacancyIds:[posting.id]});
   const privateEvent=(await db.query("select data from public.jobkix_outbox where template_key='team.invited' and data->>'invitationId'=$1",[invitation.id])).rows[0].data;
   assert.equal((await asUser(id(1),tx=>tx.query("select * from public.jobkix_outbox where template_key='team.invited'"))).rows.length,0);
   await assert.rejects(workspace(id(1),'team.accept',{id:invitation.id,token:privateEvent.token}),/FORBIDDEN/);
   const accepted=await workspace(id(3),'team.accept',{id:invitation.id,token:privateEvent.token});
   const member=(await asUser(id(3),tx=>tx.query('select * from public.jobkix_memberships where id=$1',[accepted.id]))).rows[0];assert.deepEqual(member.site_ids,[site.id]);assert.deepEqual(member.vacancy_ids,[posting.id]);
   assert.equal((await asUser(id(3),tx=>tx.query('select * from public.jobkix_applications'))).rows.length,0);
   await assert.rejects(workspace(id(3),'team.invite',{organizationId:id(4),email:'forbidden@fixture.invalid',locale:'en',role:'admin'}),/FORBIDDEN/);
   const owner=(await db.query('select * from public.jobkix_memberships where user_id=$1',[id(2)])).rows[0];
   await assert.rejects(workspace(id(2),'team.change',{id:owner.id,role:'admin',active:true,siteIds:[],vacancyIds:[]},owner.version),/INVALID_TRANSITION/);
   await assert.rejects(workspace(id(2),'team.transfer',{id:accepted.id},1),/INVALID_INPUT/);
   await workspace(id(2),'team.change',{id:accepted.id,role:'recruiter',active:false,siteIds:[site.id],vacancyIds:[posting.id]},1);
  });
  await t.test('talent paging is consent-aware, filterable, scoped, and private after pool expiry',async()=>{
   const filters={country:'FR'};
   const get=async(user,filters={},pool=null)=>(await asUser(user,tx=>tx.query('select public.jobkix_talent_page($1,$2,$3,$4) result',[id(4),filters,1,pool]))).rows[0].result;
   const own=(await db.query('select * from public.jobkix_candidates where user_id=$1',[id(1)])).rows[0];
   await db.query("update public.jobkix_candidates set country='FR',skills=array['Child care'],occupations=array['nanny'],languages=array['fr'],discoverable=true,discoverability_consented_at=now() where user_id=$1",[id(1)]);
   let found=await get(id(2),{country:'FR',skill:'care',occupation:'nanny',language:'fr'});assert.equal(found.total,1);assert.equal(found.items[0].userId,id(1));for(const key of ['file','cv','discoverability_consented_at','preferences','blockedOrganizationIds'])assert.equal(key in found.items[0],false,key);
   assert.equal((await get(id(2),{country:'GB'})).total,0);
   await assert.rejects(get(id(3)),/FORBIDDEN/);await assert.rejects(get(id(2),{privateField:'x'}),/INVALID_INPUT/);
   const pool=await workspace(id(2),'pool.create',{organizationId:id(4),name:'Versioned pool fixture'}),payload={poolId:pool.id,candidateUserId:id(1)};
   const member=await workspace(id(2),'pool.add',payload);assert.equal(member.version,1);assert.equal((await get(id(2),{},pool.id)).items[0].poolMemberVersion,1);
   await assert.rejects(workspace(id(2),'pool.add',payload),/VERSION_CONFLICT/);await assert.rejects(workspace(id(2),'pool.remove',payload,0),/VERSION_CONFLICT/);
   const key=crypto.randomUUID();await workspace(id(2),'draft.save',{kind:'talent',key:'candidate:'+id(4)+':'+id(1),body:{intent:{action:'pool.remove',payload,version:1,key}}},0);
   await workspace(id(2),'pool.remove',payload,1,key);assert.equal((await get(id(2),{},pool.id)).total,0);
   const receipt=(await asUser(id(2),tx=>tx.query('select public.jobkix_talent_receipt($1,$2) result',['pool.remove',key]))).rows[0].result;assert.equal(receipt.id,pool.id);
   await workspace(id(2),'pool.add',payload);await db.query("update public.jobkix_talent_pool_members set expires_at=now()-interval '1 second' where pool_id=$1",[pool.id]);assert.equal((await get(id(2),{},pool.id)).total,0);
   await command(id(1),'privacy.save',{discoverable:false},own.version);assert.equal((await get(id(2))).total,0);
   await db.query('update public.jobkix_candidates set country=$2,skills=$3,occupations=$4,languages=$5,discoverable=$6,discoverability_consented_at=$7,version=$8 where user_id=$1',[id(1),own.country,own.skills,own.occupations,own.languages,own.discoverable,own.discoverability_consented_at,own.version]);
  });
  await t.test('team pages omit tokens; invitation revocation is versioned, durable and current-permission guarded',async()=>{
   const payload={organizationId:id(4),email:'invited-later@fixture.invalid',locale:'es',role:'viewer',siteIds:[],vacancyIds:[]},key=crypto.randomUUID(),invite=await workspace(id(2),'team.invite',payload,0,key);
   await assert.rejects(workspace(id(2),'team.invite',payload),/INVALID_TRANSITION/);
   const list=async(user,invitations)=>(await asUser(user,tx=>tx.query('select public.jobkix_team_page($1,$2,$3) result',[id(4),1,invitations]))).rows[0].result;
   const page=await list(id(2),true),row=page.items.find(row=>row.id===invite.id);assert.ok(row);assert.equal(row.version,1);assert.equal(row.delivery.state,'pending');assert.equal(JSON.stringify(page).includes('token'),false);
   assert.ok((await list(id(2),false)).items.some(row=>row.user_id===id(2)));await assert.rejects(list(id(3),true),/FORBIDDEN/);
   await workspace(id(2),'draft.save',{kind:'team',key:'invitation:'+invite.id,body:{fields:{},intent:{action:'team.revoke',payload:{id:invite.id},version:1,key:crypto.randomUUID()}}},0);
   await assert.rejects(workspace(id(3),'draft.save',{kind:'team',key:'invitation:'+invite.id,body:{}},0),/FORBIDDEN/);
   await assert.rejects(workspace(id(2),'team.revoke',{id:invite.id},0),/VERSION_CONFLICT/);
   const revokeKey=crypto.randomUUID(),revoked=await workspace(id(2),'team.revoke',{id:invite.id},1,revokeKey);assert.equal(revoked.state,'revoked');assert.equal(revoked.version,2);
   assert.equal((await workspace(id(2),'team.revoke',{id:invite.id},1,revokeKey)).replayed,true);
   assert.equal((await asUser(id(2),tx=>tx.query('select public.jobkix_team_receipt($1,$2) result',['team.revoke',revokeKey]))).rows[0].result.id,invite.id);
   const revokedRow=(await list(id(2),true)).items.find(row=>row.id===invite.id);assert.ok(revokedRow.revoked_at);assert.equal(revokedRow.delivery.state,'cancelled');
   await db.query('update public.jobkix_memberships set active=false where organization_id=$1 and user_id=$2',[id(4),id(2)]);await assert.rejects(list(id(2),false),/FORBIDDEN/);assert.equal((await asUser(id(2),tx=>tx.query("select * from public.jobkix_drafts where kind='team'"))).rows.length,0);await db.query('update public.jobkix_memberships set active=true where organization_id=$1 and user_id=$2',[id(4),id(2)]);
  });
  await t.test('analytics count canonical records with exact UTC windows and current site/job permissions',async()=>{
   const from=new Date(Date.now()-86400000).toISOString(),until=new Date(Date.now()+86400000).toISOString();
   const report=async(user)=>(await asUser(user,tx=>tx.query('select public.jobkix_hiring_analytics($1,$2,$3) result',[id(4),from,until]))).rows[0].result;
   const owner=await report(id(2));assert.ok(owner.submissions>=1);assert.equal(Object.values(owner.currentApplicationStates).reduce((a,b)=>a+b,0),owner.submissions);assert.equal('impressions' in owner,false);
   await assert.rejects(report(id(1)),/FORBIDDEN/);await assert.rejects(report(id(3)),/FORBIDDEN/);
   const membership=(await db.query('select * from public.jobkix_memberships where user_id=$1',[id(3)])).rows[0];
   await db.query("update public.jobkix_memberships set role='hiring_manager',active=true,site_ids='{}' where id=$1",[membership.id]);const scoped=await report(id(3));assert.equal(scoped.submissions,owner.submissions);
   await db.query('update public.jobkix_memberships set vacancy_ids=$2 where id=$1',[membership.id,[id(5)]]);const empty=await report(id(3));assert.equal(empty.submissions,0);assert.equal(empty.acceptedOffers,0);
   await db.query('update public.jobkix_memberships set role=$2,vacancy_ids=$3,active=$4,site_ids=$5 where id=$1',[membership.id,membership.role,membership.vacancy_ids,membership.active,membership.site_ids]);
  });
  await t.test('offer terms and revisions are retained; only the intended candidate can produce acceptance/hire',async()=>{
   offer=await command(id(2),'offer.create',{applicationId:application.id,title:'Fixture care role offer',terms:'Test-only exact employment terms and schedule.',compensation:{minimum:20,maximum:25,currency:'GBP',unit:'hour'},responseDeadline:new Date(Date.now()+172800000).toISOString()});
   assert.equal((await asUser(id(1),tx=>tx.query('select * from public.jobkix_offers'))).rows.length,0);
   offer=await command(id(2),'offer.send',{id:offer.id},offer.version);assert.equal(offer.state,'sent');
   await assert.rejects(command(id(2),'offer.respond',{id:offer.id,response:'accepted'},offer.version),/FORBIDDEN/);
   await assert.rejects(command(id(3),'offer.respond',{id:offer.id,response:'accepted'},offer.version),/FORBIDDEN/);
   await workspace(id(1),'privacy.block',{organizationId:id(4)});await assert.rejects(command(id(1),'offer.respond',{id:offer.id,response:'accepted'},offer.version),/FORBIDDEN/);await workspace(id(1),'privacy.unblock',{organizationId:id(4)});
   await db.query("update public.jobkix_organizations set status='suspended' where id=$1",[id(4)]);await assert.rejects(command(id(1),'offer.respond',{id:offer.id,response:'accepted'},offer.version),/FORBIDDEN/);await db.query("update public.jobkix_organizations set status='active' where id=$1",[id(4)]);
   offer=await command(id(1),'offer.respond',{id:offer.id,response:'accepted'},offer.version);assert.equal(offer.state,'accepted');
   const stored=(await asUser(id(1),tx=>tx.query('select state from public.jobkix_applications where id=$1',[application.id]))).rows[0];assert.equal(stored.state,'hired');
   const history=await asUser(id(1),tx=>tx.query('select snapshot from public.jobkix_offer_revisions where offer_id=$1',[offer.id]));assert.equal(history.rows.length,2);assert.ok(history.rows.every(row=>row.snapshot.state!=='draft'));
  });
  await t.test('closure removes discovery but retains candidate history and permits original submission receipt recovery',async()=>{
   posting=await command(id(2),'vacancy.close',{id:posting.id,reason:'Isolated recruitment closure test'},posting.version);assert.equal(posting.state,'closed');
   const search=(await db.query('select public.jobkix_search($1) result',[{}])).rows[0].result;assert.equal(search.total,0);
   assert.equal((await asUser(id(1),tx=>tx.query('select id from public.jobkix_applications'))).rows.length,1);
   const replay=await command(id(1),'application.submit',applicationInput,0,submissionKey);assert.equal(replay.id,application.id);assert.equal(replay.replayed,true);
   await assert.rejects(command(id(1),'application.submit',{...applicationInput,profileVersion:2}),/VACANCY_UNAVAILABLE/);
  });
  await t.test('terminal application stages atomically retire outstanding offers and interview invitations',async()=>{
   // Extra isolated candidate/application fixtures exercise negative lifecycle edges, not registration or public E2E.
   const candidateId=id(780),appId=id(781);await db.query('insert into auth.users values($1,$2,now())',[candidateId,'lifecycle@fixture.invalid']);await db.query('insert into public.jobkix_accounts(user_id,adult_confirmed_at) values($1,now())',[candidateId]);
   await db.query("insert into public.jobkix_applications(id,vacancy_id,candidate_user_id,organization_id,state,snapshot,receipt) values($1,$2,$3,$4,'shortlisted',$5,$6)",[appId,posting.id,candidateId,id(4),{profile:{displayName:'ISOLATED lifecycle candidate'},answers:{},vacancy:{title:'ISOLATED lifecycle role'}},'ISOLATED-'+appId]);await db.query('insert into public.jobkix_threads(application_id) values($1)',[appId]);
   const proposed=await command(id(2),'interview.propose',{applicationId:appId,startsAt:new Date(Date.now()+3*86400000).toISOString(),endsAt:new Date(Date.now()+3*86400000+3600000).toISOString(),timezone:'Europe/Paris',format:'phone',location:'Private fixture phone contact',panelUserIds:[]});
   let proposedOffer=await command(id(2),'offer.create',{applicationId:appId,title:'ISOLATED replacement terms',terms:'Isolated terms to verify stage interruption.',compensation:null});proposedOffer=await command(id(2),'offer.send',{id:proposedOffer.id},proposedOffer.version);
   const version=(await db.query('select version from public.jobkix_applications where id=$1',[appId])).rows[0].version;const moved=await command(id(2),'application.stage',{applicationId:appId,state:'declined'},version);assert.equal(moved.state,'declined');
   assert.equal((await db.query('select state from public.jobkix_offers where id=$1',[proposedOffer.id])).rows[0].state,'withdrawn');assert.equal((await db.query('select state from public.jobkix_interviews where id=$1',[proposed.id])).rows[0].state,'cancelled');
   await assert.rejects(command(candidateId,'offer.respond',{id:proposedOffer.id,response:'accepted'},proposedOffer.version),/VERSION_CONFLICT|INVALID_TRANSITION/);await assert.rejects(command(candidateId,'interview.respond',{id:proposed.id,response:'accepted'},proposed.version),/VERSION_CONFLICT|INVALID_TRANSITION/);
   const history=await asUser(candidateId,tx=>tx.query('select type from public.jobkix_application_events where application_id=$1',[appId]));assert.equal(history.rows.some(row=>row.type==='offer.withdrawn'),true);
  });
  await t.test('organization setup recovers its receipt and distinguishes private corrections from identity changes',async()=>{
   const key=crypto.randomUUID(),input={kind:'institution',publicName:'Isolated institution identity',country:'GB',city:'Approximate city',originalLocale:'fr'};
   let organization=await command(id(2),'organization.create',input,0,key);assert.equal((await command(id(2),'organization.create',input,0,key)).id,organization.id);
   const evidence=id(970);await db.query("insert into public.jobkix_files(id,owner_user_id,organization_id,purpose,object_key,filename,mime,expected_bytes,actual_bytes,sha256,state,scanner_reference) values($1,$2,$3,'verification',$4,'ISOLATED evidence.pdf','application/pdf',100,100,$5,'ready','ISOLATED_READINESS_FIXTURE')",[evidence,id(2),organization.id,id(2)+'/'+evidence+'/original','e'.repeat(64)]);
   organization=await admin('organization.review',{id:organization.id,validUntil:new Date(Date.now()+86400000*30).toISOString(),reference:'Isolated native identity review',evidenceIds:[evidence]},organization.version);
   const content={organizationId:organization.id,publicName:input.publicName,description:'',country:'GB',city:input.city,originalLocale:'fr',legalName:'',contactEmail:'private@fixture.invalid',contactPhone:'PRIVATE_FIXTURE_PHONE',privateAddress:'PRIVATE_FIXTURE_ADDRESS'};
   organization=await workspace(id(2),'organization.save',content,organization.version);let stored=(await db.query('select * from public.jobkix_organizations where id=$1',[organization.id])).rows[0];assert.ok(stored.public_profile_approved_at);assert.ok(stored.identity_reviewed_until);assert.equal(stored.original_locale,'fr');assert.equal(JSON.stringify(stored).includes('PRIVATE_FIXTURE'),false);
   organization=await workspace(id(2),'organization.save',{...content,legalName:'Changed legal fixture identity'},organization.version);stored=(await db.query('select * from public.jobkix_organizations where id=$1',[organization.id])).rows[0];assert.equal(stored.identity_reviewed_until,null);assert.equal(stored.identity_review_reference,null);
   await assert.rejects(workspace(id(1),'organization.save',content,organization.version),/FORBIDDEN/);
  });
  await t.test('private organization and message drafts recheck membership on reads and writes',async()=>{
   const organizationKey=crypto.randomUUID(),messageKey=crypto.randomUUID();await workspace(id(2),'draft.save',{kind:'organization',key:id(4),body:{fields:{privateAddress:'ISOLATED_PRIVATE_DRAFT'}}},0,organizationKey);
   await workspace(id(2),'draft.save',{kind:'message',key:application.id,body:{body:'Isolated authorized message draft'}},0,messageKey);
   assert.equal((await asUser(id(2),tx=>tx.query("select * from public.jobkix_drafts where kind in ('organization','message')"))).rows.length,2);
   await db.query('update public.jobkix_memberships set active=false where organization_id=$1 and user_id=$2',[id(4),id(2)]);
   assert.equal((await asUser(id(2),tx=>tx.query("select * from public.jobkix_drafts where kind in ('organization','message')"))).rows.length,0);
   await assert.rejects(workspace(id(2),'draft.save',{kind:'organization',key:id(4),body:{fields:{privateAddress:'ISOLATED_PRIVATE_DRAFT'}}},0,organizationKey),/FORBIDDEN/);
   await assert.rejects(workspace(id(2),'draft.save',{kind:'message',key:application.id,body:{body:'Isolated unauthorized retry'}},1),/FORBIDDEN/);
   await db.query('update public.jobkix_memberships set active=true where organization_id=$1 and user_id=$2',[id(4),id(2)]);
   assert.equal((await asUser(id(2),tx=>tx.query("select * from public.jobkix_drafts where kind in ('organization','message')"))).rows.length,2);
  });
  await t.test('site drafts survive reload and same-key receipt recovery without duplicate effects, and revoke with membership',async()=>{
   const draftKey='site:'+id(4)+':new',key=crypto.randomUUID(),payload={organizationId:id(4),label:'Isolated recovered site',country:'GB',region:'',city:'Approximate location',timezone:'Europe/London'},intent={action:'site.create',payload,version:0,key};
   const draft=await workspace(id(2),'draft.save',{kind:'organization',key:draftKey,body:{fields:{...payload,baseVersion:0},intent}});
   const read=actor=>asUser(actor,tx=>tx.query("select * from public.jobkix_drafts where kind='organization' and draft_key=$1",[draftKey]));
   assert.deepEqual((await read(id(2))).rows[0].body.intent,intent);assert.equal((await read(id(3))).rows.length,0);
   await assert.rejects(workspace(id(3),'draft.save',{kind:'organization',key:draftKey,body:{intent}}),/FORBIDDEN/);
   const created=await workspace(id(2),'site.create',payload,0,key),replayed=await workspace(id(2),'site.create',payload,0,key);assert.equal(created.id,replayed.id);assert.equal(replayed.replayed,true);
   await assert.rejects(workspace(id(2),'site.create',{...payload,label:'Conflicting retry'},0,key),/IDEMPOTENCY_CONFLICT/);
   const recover=actor=>asUser(actor,tx=>tx.query('select public.jobkix_hiring_receipt($1,$2) result',['site.create',key]));
   assert.equal((await recover(id(2))).rows[0].result.id,created.id);assert.equal((await recover(id(3))).rows[0].result,null);
   await assert.rejects(workspace(id(2),'draft.save',{kind:'organization',key:'site:'+id(999)+':'+created.id,body:{fields:{}}}),/FORBIDDEN/);
   await db.query('update public.jobkix_memberships set active=false where user_id=$1 and organization_id=$2',[id(2),id(4)]);
   assert.equal((await read(id(2))).rows.length,0);await assert.rejects(recover(id(2)),/FORBIDDEN/);
   await db.query('update public.jobkix_memberships set active=true where user_id=$1 and organization_id=$2',[id(2),id(4)]);
   const changed=await workspace(id(2),'site.save',{...payload,id:created.id,active:false},created.version);assert.equal(changed.version,created.version+1);
   await assert.rejects(workspace(id(2),'site.save',{...payload,id:created.id,active:true},created.version),/VERSION_CONFLICT/);
   await workspace(id(2),'draft.remove',{kind:'organization',key:draftKey},draft.version);
  });
  await t.test('inactive sites immediately stop eligibility and submissions without a background process',async()=>{
   const site=await workspace(id(2),'site.create',{organizationId:id(4),label:'Isolated branch eligibility fixture',country:'GB',region:'',city:'Approximate branch city',timezone:'Europe/London'});
   const vacancy=await command(id(2),'vacancy.create',{organizationId:id(4),siteId:site.id,title:'Isolated branch vacancy',settingId:'primary-schools',occupationId:'teacher',originalLocale:'en',country:'GB',city:'Approximate branch city',description:'Test-only source record',workSchedule:'part_time',contractType:'permanent',workLocation:'on_site'});
   // Synthetic initial publication for this isolated eligibility test; the separate publish test uses native review commands.
   await db.query("update public.jobkix_vacancies set state='published',published_at=now(),expires_at=now()+interval '1 day' where id=$1",[vacancy.id]);
   await db.query('update public.jobkix_vacancies set public_snapshot=public.jobkix_vacancy_projection(id),published_version=version where id=$1',[vacancy.id]);
   assert.equal((await db.query('select public.jobkix_job_eligible($1) result',[vacancy.id])).rows[0].result,true);
   const input={id:site.id,label:'Isolated branch eligibility fixture',country:'GB',region:'',city:'Approximate branch city',timezone:'Europe/London',active:false};const inactive=await workspace(id(2),'site.save',input,site.version);
   assert.equal((await db.query('select public.jobkix_job_eligible($1) result',[vacancy.id])).rows[0].result,false);
   await assert.rejects(command(id(1),'application.submit',{vacancyId:vacancy.id,vacancyVersion:1,profileVersion:2,documentId:null,answers:{},sharingConsent:true,consentRevision:'jobkix-application-2026-10-20'}),/VACANCY_UNAVAILABLE/);
   await workspace(id(2),'site.save',{...input,active:true},inactive.version);assert.equal((await db.query('select public.jobkix_job_eligible($1) result',[vacancy.id])).rows[0].result,true);
  });
  await t.test('verification submission requires current management and owned ready organization evidence',async()=>{
   const payload={kind:'verification',category:'identity',organizationId:id(4),description:'Isolated organization identity review request.',locale:'es'};
   await assert.rejects(workspace(id(2),'verification.submit',payload),/DOCUMENT_NOT_READY/);
   await assert.rejects(workspace(id(1),'verification.submit',{...payload,fileId}),/FORBIDDEN/);
   const evidence=id(751);await db.query("insert into public.jobkix_files(id,owner_user_id,organization_id,purpose,object_key,filename,mime,expected_bytes,actual_bytes,sha256,state,scanner_reference) values($1,$2,$3,'verification',$4,'private identity fixture.pdf','application/pdf',100,100,$5,'ready','ISOLATED_VALIDATION')",[evidence,id(2),id(4),id(2)+'/'+evidence+'/original','f'.repeat(64)]);
   const request=await workspace(id(2),'verification.submit',{...payload,fileId:evidence});assert.equal(request.state,'reported');assert.equal((await asUser(id(2),tx=>tx.query('select original_locale from public.jobkix_cases where id=$1',[request.id]))).rows[0].original_locale,'es');
   await workspace(id(2),'draft.save',{kind:'case',key:'verification:'+id(4),body:{fields:{description:payload.description}}},0);
   await assert.rejects(workspace(id(1),'draft.save',{kind:'case',key:'verification:'+id(4),body:{}},0),/FORBIDDEN/);
  });
  await t.test('intended invitation preview, acceptance recovery and current revocation do not create candidate profiles',async()=>{
   const actor=id(991);await db.query('insert into auth.users values($1,$2,now())',[actor,'fresh-invited@fixture.invalid']);await db.query('insert into public.jobkix_accounts(user_id,adult_confirmed_at) values($1,now())',[actor]);
   const invite=await workspace(id(2),'team.invite',{organizationId:id(4),email:'fresh-invited@fixture.invalid',locale:'hi',role:'viewer',siteIds:[],vacancyIds:[]});
   const data=(await db.query("select data from public.jobkix_outbox where template_key='team.invited' and data->>'invitationId'=$1",[invite.id])).rows[0].data;
   const preview=async(user,token=data.token)=>(await asUser(user,tx=>tx.query('select public.jobkix_invitation_preview($1,$2) result',[invite.id,token]))).rows[0].result;
   await assert.rejects(preview(id(1)),/FORBIDDEN/);await assert.rejects(preview(actor,'a'.repeat(64)),/FORBIDDEN/);
   const before=await preview(actor);assert.equal(before.state,'pending');assert.equal(before.role,'viewer');assert.equal('token' in before,false);
   await workspace(actor,'team.accept',{id:invite.id,token:data.token});assert.equal((await preview(actor)).state,'accepted');assert.equal((await db.query('select * from public.jobkix_candidates where user_id=$1',[actor])).rows.length,0);
   await db.query('update public.jobkix_memberships set active=false where user_id=$1',[actor]);await assert.rejects(preview(actor),/FORBIDDEN/);
  });
  await t.test('operational delivery claims lease real records, recheck consent, guard acknowledgements and never replay unknown sends',async()=>{
   // Retire unrelated synthetic queue rows for this isolated worker scenario only.
   await db.query("update public.jobkix_outbox set state='cancelled' where channel='email'");
   const service=async(sql,values=[])=>(await db.transaction(async tx=>{await tx.exec('set local role service_role');return tx.query(sql,values);}));
   const emit=async()=>{await db.query('select public.jobkix_emit($1,$2,$3,$4,$5)',['application.submitted',application.id,id(1),[id(1)],{applicationId:application.id,vacancyId:posting.id}]);};
   await assert.rejects(asUser(id(1),tx=>tx.query('select public.jobkix_outbox_claim()')),/permission denied/);
   await emit();let claim=(await service('select public.jobkix_outbox_claim() result')).rows[0].result;assert.ok(claim);assert.equal(claim.context.recipient,'candidate@fixture.invalid');assert.equal(claim.attempt,1);
   assert.equal((await service('select public.jobkix_outbox_claim() result')).rows[0].result,null);
   assert.equal((await service("select public.jobkix_outbox_finish($1,$2,'provider_accepted',null,'isolated-transport-reference') result",[claim.id,id(999)])).rows[0].result,false);
   assert.ok((await service('select public.jobkix_outbox_recheck($1,$2) result',[claim.id,claim.lease])).rows[0].result);
   await db.query('update public.jobkix_accounts set notifications_email=false where user_id=$1',[id(1)]);assert.equal((await service('select public.jobkix_outbox_recheck($1,$2) result',[claim.id,claim.lease])).rows[0].result,null);
   await db.query('update public.jobkix_accounts set notifications_email=true where user_id=$1',[id(1)]);
   assert.equal((await service("select public.jobkix_outbox_finish($1,$2,'provider_accepted',null,'isolated-transport-reference') result",[claim.id,claim.lease])).rows[0].result,true);
   assert.equal((await service("select public.jobkix_outbox_finish($1,$2,'provider_accepted') result",[claim.id,claim.lease])).rows[0].result,false);
   await emit();claim=(await service('select public.jobkix_outbox_claim() result')).rows[0].result;assert.ok(claim);
   await service("select public.jobkix_outbox_finish($1,$2,'failed','SMTP_TRANSIENT')",[claim.id,claim.lease]);assert.equal((await service('select public.jobkix_outbox_claim() result')).rows[0].result,null);
   await db.query("update public.jobkix_outbox set available_at=now()-interval '1 second' where id=$1",[claim.id]);claim=(await service('select public.jobkix_outbox_claim() result')).rows[0].result;assert.equal(claim.attempt,2);
   await db.query("update public.jobkix_outbox set locked_until=now()-interval '1 second' where id=$1",[claim.id]);assert.equal((await service('select public.jobkix_outbox_claim() result')).rows[0].result,null);
   const unknown=(await db.query('select state,last_error_code from public.jobkix_outbox where id=$1',[claim.id])).rows[0];assert.equal(unknown.state,'delivery_unknown');assert.equal(unknown.last_error_code,'DELIVERY_LEASE_EXPIRED');
   const notices=(await asUser(id(1),tx=>tx.query('select public.jobkix_notifications_page(1) result'))).rows[0].result;assert.ok(notices.total>=2);assert.equal(JSON.stringify(notices).includes('recipient'),false);assert.equal(JSON.stringify(notices).includes('token'),false);
   const notice=notices.items[0];await workspace(id(1),'notification.read',{id:notice.id});assert.ok((await asUser(id(1),tx=>tx.query('select public.jobkix_notifications_page(1) result'))).rows[0].result.items.find(row=>row.id===notice.id).readAt);
   assert.equal((await db.query('select count(*) from public.jobkix_applications where id=$1',[application.id])).rows[0].count,1);
  });
  await t.test('anonymous case proofs persist drafts and recover one canonical report with private replies and appeals',async()=>{
   const hash='a'.repeat(64),other='b'.repeat(64),rate='c'.repeat(64),call=async(name,args)=>(await db.transaction(async tx=>{await tx.exec('set local role service_role');return tx.query('select public.'+name+'('+args.map((_,i)=>'$'+(i+1)).join(',')+') result',args);})).rows[0].result;
   const status=(hash)=>call('jobkix_guest_case_status',[hash,rate]),run=(action,payload,version=0,key=crypto.randomUUID())=>call('jobkix_guest_case_command',[hash,action,payload,version,key,rate]);
   await assert.rejects(asUser(id(1),tx=>tx.query('select public.jobkix_guest_case_status($1,$2)',[hash,rate])),/permission denied/);
   const payload={kind:'report',locale:'ar',category:'vacancy',description:'PRIVATE_GUEST_REPORT_MARKER needs review.',name:'Private fixture guest',email:'guest@fixture.invalid'},intent={action:'case.create',payload,version:0,key:crypto.randomUUID()},draftKey=crypto.randomUUID(),draft={fields:{action:'case.create',payload},intent};
   const saved=await run('draft.save',draft,0,draftKey);assert.equal(saved.version,1);assert.equal((await run('draft.save',draft,0,draftKey)).replayed,true);assert.equal((await status(hash)).draft.body.intent.key,intent.key);assert.equal((await status(other)).draft,null);
   await assert.rejects(run('draft.save',draft,0),/VERSION_CONFLICT/);
   let result=await run('case.create',payload,0,intent.key);const caseId=result.id;assert.equal((await run('case.create',payload,0,intent.key)).id,caseId);
   await assert.rejects(run('case.create',{...payload,description:'Conflicting same-key private report.'},0,intent.key),/IDEMPOTENCY_CONFLICT/);
   await assert.rejects(run('case.create',payload),/IDEMPOTENCY_CONFLICT/);
   let snapshot=await status(hash);assert.equal(snapshot.case.reference,result.reference);assert.equal(snapshot.case.originalLocale,'ar');assert.equal(snapshot.draft,null);assert.equal(JSON.stringify(snapshot).includes('guest@fixture.invalid'),false);assert.equal((await status(other)).case,null);
   assert.equal((await db.query('select count(*) from public.jobkix_cases where guest_receipt_hash=$1',[hash])).rows[0].count,1);
   await admin('case.advance',{id:caseId,state:'under_review',visibility:'internal',locale:'en',note:'PRIVATE_GUEST_INTERNAL_NOTE_MARKER'},1);
   await admin('case.advance',{id:caseId,state:'needs_information',visibility:'reporter',locale:'fr',note:'Please provide more context in this private case.'},2);
   const reply={locale:'tl',description:'PRIVATE_GUEST_REPLY_MARKER additional context.'},replyKey=crypto.randomUUID();result=await run('case.reply',reply,3,replyKey);assert.equal(result.version,4);assert.equal((await run('case.reply',reply,3,replyKey)).replayed,true);
   await assert.rejects(run('case.reply',reply,3),/VERSION_CONFLICT/);snapshot=await status(hash);assert.equal(snapshot.case.state,'under_review');assert.equal(snapshot.case.events.length,2);assert.equal(JSON.stringify(snapshot).includes('PRIVATE_GUEST_INTERNAL_NOTE_MARKER'),false);
   await admin('case.advance',{id:caseId,state:'no_action',visibility:'reporter',locale:'en'},4);result=await run('case.appeal',{locale:'hi',description:'An isolated request for decision review.'},5);assert.equal(result.state,'appealed');
   await db.query("update public.jobkix_cases set guest_receipt_expires_at=now()-interval '1 second' where id=$1",[caseId]);assert.equal((await status(hash)).case,null);await assert.rejects(run('case.create',payload,0,intent.key),/FORBIDDEN/);
   const attackRate='d'.repeat(64);for(let index=0;index<10;index++)await call('jobkix_guest_case_command',[(index+10).toString(16).padStart(64,'0'),'case.create',{...payload,description:'Isolated rate-limit report '+index},0,crypto.randomUUID(),attackRate]);
   await assert.rejects(call('jobkix_guest_case_command',['e'.repeat(64),'case.create',payload,0,crypto.randomUUID(),attackRate]),/RATE_LIMITED/);
   assert.equal((await asUser(id(1),tx=>tx.query('select * from public.jobkix_cases where guest_receipt_hash is not null'))).rows.length,0);
  });
  await t.test('public geography retains published coarse locations and excludes private revisions and international ineligibility',async()=>{
   const geo=async(country=null,city=null,origin=null,abroad=false)=>(await db.transaction(async tx=>{await tx.exec('set local role anon');return tx.query('select public.jobkix_public_geography($1,$2,$3,$4,$5,$6) result',[country,city,'',1,origin,abroad]);})).rows[0].result;
   let result=await geo('GB');assert.ok(result.cities.length);assert.equal(result.cityPageSize,24);assert.ok(result.cityTotal>=result.cities.length);assert.equal(JSON.stringify(result).includes('PRIVATE_'),false);
   const location=result.cities[0];assert.match(location.key,/^[a-f0-9]{16}$/);assert.equal((await geo('GB',location.key)).cities[0].name,location.name);
   const previous=(await db.query('select city from public.jobkix_vacancies where id=$1',[id(5)])).rows[0].city;await db.query('update public.jobkix_vacancies set city=$2 where id=$1',[id(5),'PRIVATE_CITY_REVISION_MARKER']);assert.equal(JSON.stringify(await geo('GB')).includes('PRIVATE_CITY_REVISION_MARKER'),false);await db.query('update public.jobkix_vacancies set city=$2 where id=$1',[id(5),previous]);
   assert.ok((await geo(null,null,null,true)).countries.every(row=>row.opportunityCount===0));assert.ok((await geo(null,null,'GB',true)).countries.filter(row=>row.code==='GB').every(row=>row.opportunityCount===0));
   await assert.rejects(geo('bad-country'),/INVALID_INPUT/);await assert.rejects(geo('GB','../../private'),/INVALID_INPUT/);
  });
  await t.test('employer discovery, profile projections and saved native searches preserve publication and private ownership',async()=>{
   const get=async(filters={})=>(await db.query('select public.jobkix_employers_page($1,1) result',[filters])).rows[0].result;
   const result=await get({country:'GB',kind:'household',q:'Fixture household'});assert.equal(result.total,1);assert.equal(result.items[0].id,id(4));assert.equal(JSON.stringify(result).includes('PRIVATE_ADDRESS'),false);
   assert.equal((await get({kind:'ngo',q:'Fixture household'})).total,0);await assert.rejects(get({kind:'catalogue-product'}),/INVALID_INPUT/);
   const key=crypto.randomUUID(),saved=await workspace(id(1),'employer.search.save',{organizationId:id(4)},0,key);assert.equal((await workspace(id(1),'employer.search.save',{organizationId:id(4)},0,key)).id,saved.id);
   assert.equal((await workspace(id(1),'employer.search.save',{organizationId:id(4)})).id,saved.id);
   const own=(await asUser(id(1),tx=>tx.query('select public.jobkix_employer_saved_search($1) result',[id(4)]))).rows[0].result;assert.equal(own.id,saved.id);assert.equal((await asUser(id(2),tx=>tx.query('select public.jobkix_employer_saved_search($1) result',[id(4)]))).rows[0].result,null);
   await db.query('update public.jobkix_organizations set public_profile_approved_at=null where id=$1',[id(4)]);assert.equal((await get({q:'Fixture household'})).total,0);assert.equal((await db.query('select public.jobkix_public_employer($1) result',[id(4)])).rows[0].result,null);await assert.rejects(workspace(id(1),'employer.search.save',{organizationId:id(4)}),/NOT_FOUND/);await db.query('update public.jobkix_organizations set public_profile_approved_at=now() where id=$1',[id(4)]);
  });
  await t.test('actual employer images require scoped evidence and native rights, and revocation preserves other usage references',async()=>{
   const asset=id(881),evidence=id(882);await db.query("insert into public.angelcare_marketplace_media_assets(id,status,mime_type,rights_status,public_url) values($1,'active','image/webp','licensed','https://fixture.invalid/approved-employer.webp')",[asset]);
   await db.query("insert into public.jobkix_files(id,owner_user_id,organization_id,purpose,object_key,filename,mime,expected_bytes,actual_bytes,sha256,state,scanner_reference) values($1,$2,$3,'verification',$4,'ISOLATED employer image approval.pdf','application/pdf',100,100,$5,'ready','ISOLATED_VALIDATION')",[evidence,id(2),id(4),id(2)+'/'+evidence+'/original','e'.repeat(64)]);
   let org=(await db.query('select version from public.jobkix_organizations where id=$1',[id(4)])).rows[0];await assert.rejects(admin('organization.media_review',{id:id(4),mediaId:asset,evidenceId:fileId},org.version),/DOCUMENT_NOT_READY/);
   let reviewed=await admin('organization.media_review',{id:id(4),mediaId:asset,evidenceId:evidence},org.version);
   const profile=async()=>(await db.transaction(async tx=>{await tx.exec('set local role anon');return tx.query('select public.jobkix_public_employer($1) result',[id(4)]);})).rows[0].result;
   assert.ok((await profile()).approvedMediaIds.includes(asset));assert.equal(JSON.stringify(await profile()).includes(evidence),false);
   await db.query("update public.angelcare_marketplace_media_assets set rights_expires_at=now()-interval '1 second' where id=$1",[asset]);assert.deepEqual((await profile()).approvedMediaIds,[]);await db.query('update public.angelcare_marketplace_media_assets set rights_expires_at=null where id=$1',[asset]);
   await assert.rejects(admin('organization.media_revoke',{id:id(4),mediaId:asset},org.version),/VERSION_CONFLICT/);await admin('organization.media_revoke',{id:id(4),mediaId:asset},reviewed.version);assert.deepEqual((await profile()).approvedMediaIds,[]);
   assert.equal((await db.query("select count(*) from public.angelcare_marketplace_media_usage where media_asset_id=$1 and object_type='jobkix_employer_approval'",[asset])).rows[0].count,1);
  });
  await t.test('reputation requires fresh reviewed methodology and exact publication consent; corrections preserve the reviewed publication',async()=>{
   const query=async(kind='review',locale='en',filters={})=>(await db.transaction(async tx=>{await tx.exec('set local role anon');return tx.query('select public.jobkix_public_reputation($1,$2,$3,1) result',[kind,locale,filters]);})).rows[0].result;
   const payload={kind:'review',organizationId:id(4),locale:'en',body:'An isolated declared workplace experience for moderation.',relationship:'Former fixture professional',country:'GB',professionId:'nanny',rating:4,publicationConsent:true,methodologyRevision:'f'.repeat(64)};
   assert.equal((await query()).methodology,null);await assert.rejects(workspace(id(1),'reputation.contribute',payload),/DEPENDENCY_UNAVAILABLE/);
   let method=await admin('editorial.create',{slug:'reputation-methodology',kind:'trust',locale:'en',title:'ISOLATED reputation methodology',summary:'Synthetic moderation and privacy policy fixture.',sections:[{id:'overview',title:'Fixture policy',body:'Self-declared moderated reviews; latest salary contribution per person and comparable group, with five-person minimum.',media:null}],author:'Isolated policy reviewer',provenance:'ISOLATED_TEST_FIXTURE'});
   method=await admin('editorial.review',{id:method.id,contentHash:method.contentHash},method.version);method=await admin('editorial.publish',{id:method.id,contentHash:method.contentHash},method.version);
   const input={...payload,methodologyRevision:method.sourceHash};await assert.rejects(workspace(id(1),'reputation.contribute',{...input,publicationConsent:false}),/INVALID_INPUT/);await assert.rejects(workspace(id(1),'reputation.contribute',payload),/VERSION_CONFLICT/);
   const key=crypto.randomUUID();let review=await workspace(id(1),'reputation.contribute',input,0,key);assert.equal((await workspace(id(1),'reputation.contribute',input,0,key)).id,review.id);assert.equal((await query()).items.length,0);
   await assert.rejects(admin('reputation.review',{id:review.id,state:'published',methodologyRevision:'a'.repeat(64)},review.version),/INVALID_INPUT/);
   review=await admin('reputation.review',{id:review.id,state:'published',methodologyRevision:method.sourceHash},review.version);let published=await query();assert.equal(published.items.length,1);assert.equal(published.items[0].body,input.body);assert.equal(published.statistics,null);assert.equal(JSON.stringify(published).includes('Former fixture professional'),false);assert.equal(JSON.stringify(published).includes(id(1)),false);assert.equal((await query('review','fr')).methodology,null);
   const correction=await workspace(id(1),'reputation.contribute',{...input,parentId:review.id,body:'A corrected isolated workplace declaration awaiting review.',rating:3},review.version);assert.equal((await query()).items[0].body,input.body);
   await assert.rejects(workspace(id(1),'reputation.contribute',{...input,parentId:review.id},review.version),/INVALID_TRANSITION/);
   await assert.rejects(workspace(id(2),'reputation.withdraw',{id:review.id},review.version),/FORBIDDEN/);
   await admin('reputation.review',{id:correction.id,state:'published',methodologyRevision:method.sourceHash},correction.version);published=await query();assert.equal(published.items.length,1);assert.equal(published.items[0].id,correction.id);assert.equal(published.items[0].rating,3);
   const own=(await asUser(id(1),tx=>tx.query('select public.jobkix_my_reputation(1,null) result'))).rows[0].result;assert.equal(own.total,2);assert.ok(own.items.some(row=>row.id===review.id&&row.state==='withdrawn'));assert.equal((await asUser(id(2),tx=>tx.query('select public.jobkix_my_reputation(1,null) result'))).rows[0].result.total,0);
   const current=(await db.query('select version from public.jobkix_reputation where id=$1',[correction.id])).rows[0];await workspace(id(1),'reputation.withdraw',{id:correction.id},current.version);assert.equal((await query()).total,0);
  });
  await t.test('salary samples suppress fewer than five distinct contributors, retain currency/period boundaries and hide private narratives',async()=>{
   const method=(await db.query("select public.jobkix_public_editorial('reputation-methodology','en') result")).rows[0].result,query=async(filters={})=>(await db.query("select public.jobkix_public_reputation('salary','en',$1,1) result",[filters])).rows[0].result;
   const actors=Array.from({length:5},(_,index)=>id(1100+index));for(const [index,actor] of actors.entries()){
    await db.query('insert into auth.users values($1,$2,now())',[actor,'salary-'+index+'@fixture.invalid']);await db.query('insert into public.jobkix_accounts(user_id,adult_confirmed_at) values($1,now())',[actor]);
    const contribution=await workspace(actor,'reputation.contribute',{kind:'salary',organizationId:id(4),locale:'en',body:'PRIVATE_SALARY_NARRATIVE_MARKER isolated fixture pay.',relationship:'Fixture self declaration',country:'GB',professionId:'nanny',amount:20+index,currency:'GBP',unit:'hour',publicationConsent:true,methodologyRevision:method.sourceHash});
    await admin('reputation.review',{id:contribution.id,state:'published',methodologyRevision:method.sourceHash},contribution.version);
    if(index<4)assert.equal((await query()).items.length,0);
   }
   let result=await query();assert.equal(result.total,1);assert.equal(result.items[0].sample,5);assert.equal(result.items[0].median,22);assert.equal(result.items[0].currency,'GBP');assert.equal(result.items[0].unit,'hour');assert.equal(JSON.stringify(result).includes('PRIVATE_SALARY'),false);
   assert.equal((await query({q:'PRIVATE_SALARY_NARRATIVE_MARKER'})).items.length,0);await assert.rejects(query({organizationId:id(4)}),/INVALID_INPUT/);assert.equal((await query({currency:'USD'})).items.length,0);
   const repeat=await workspace(actors[0],'reputation.contribute',{kind:'salary',organizationId:id(4),locale:'en',body:'A latest self-declared fixture compensation amount.',relationship:'Fixture self declaration',country:'GB',professionId:'nanny',amount:30,currency:'GBP',unit:'hour',publicationConsent:true,methodologyRevision:method.sourceHash});await admin('reputation.review',{id:repeat.id,state:'published',methodologyRevision:method.sourceHash},repeat.version);result=await query();assert.equal(result.items[0].sample,5);assert.equal(result.items[0].median,23);
  });

  await t.test('scheduled search alerts share canonical matching, drain bounded batches and cancel stale consent',async()=>{
   const source='Scheduled fixture opportunity';for(let index=0;index<25;index++){
    const vacancy=id(1300+index);await db.query("insert into public.jobkix_vacancies(id,organization_id,title,setting_id,occupation_id,state,original_locale,country,city,description,work_schedule,contract_type,work_location,published_at,expires_at,created_by) values($1,$2,$3,'households','nanny','published','en','GB','Approximate scheduled city','Isolated scheduled opportunity duties','part_time','permanent','on_site',now(),now()+interval '3 days',$4)",[vacancy,id(4),source+' '+index,id(2)]);
    await db.query('update public.jobkix_vacancies set public_snapshot=public.jobkix_vacancy_projection(id),published_version=version where id=$1',[vacancy]);
   }
   const filters={q:source};let saved=await workspace(id(1),'search.save',{name:'Isolated scheduled search',filters,frequency:'daily',enabled:true});
   const tick=()=>db.transaction(async tx=>{await tx.exec('set local role service_role');return (await tx.query('select public.jobkix_process_search_alerts() result')).rows[0].result;});
   await assert.rejects(asUser(id(1),tx=>tx.query('select public.jobkix_process_search_alerts()')),/permission denied/);
   await tick();assert.equal((await db.query('select count(*) from public.jobkix_search_matches where search_id=$1',[saved.id])).rows[0].count,20);
   assert.equal((await db.query('select last_run_at from public.jobkix_saved_searches where id=$1',[saved.id])).rows[0].last_run_at,null);
   await tick();assert.equal((await db.query('select count(*) from public.jobkix_search_matches where search_id=$1',[saved.id])).rows[0].count,25);
   await tick();assert.equal((await db.query('select count(*) from public.jobkix_events where type=$1 and object_id=$2',['search.match',saved.id])).rows[0].count,2);
   const queued=(await db.query("select * from public.jobkix_outbox where template_key='search.match' and data->>'savedSearchId'=$1 and channel='email' order by created_at,id limit 1",[saved.id])).rows[0];
   let context=(await db.query('select public.jobkix_notification_context(o,true) result from public.jobkix_outbox o where id=$1',[queued.id])).rows[0].result;assert.equal(context.matchCount,20);assert.deepEqual(context.filters,filters);
   await db.query('insert into public.jobkix_candidate_blocks values($1,$2,now()) on conflict do nothing',[id(1),id(4)]);assert.equal((await db.query('select public.jobkix_notification_context(o,true) result from public.jobkix_outbox o where id=$1',[queued.id])).rows[0].result,null);await db.query('delete from public.jobkix_candidate_blocks where candidate_user_id=$1 and organization_id=$2',[id(1),id(4)]);
   saved=await workspace(id(1),'search.save',{id:saved.id,name:'Isolated scheduled search',filters,frequency:'off',enabled:false},saved.version);assert.equal((await db.query('select public.jobkix_notification_context(o,true) result from public.jobkix_outbox o where id=$1',[queued.id])).rows[0].result,null);
   const bad=id(1330);await db.query("insert into public.jobkix_saved_searches(id,user_id,name,filters,frequency,enabled) values($1,$2,'Unavailable taxonomy fixture',$3,'daily',true)",[bad,id(1),{occupation:'not-currently-published'}]);await tick();const unchanged=(await db.query('select filters,last_error_code,retry_after from public.jobkix_saved_searches where id=$1',[bad])).rows[0];assert.equal(unchanged.filters.occupation,'not-currently-published');assert.equal(unchanged.last_error_code,'SAVED_FILTER_UNAVAILABLE');assert.ok(unchanged.retry_after);
  });
  await t.test('interview reminders use the current revision, candidate response and panel permission without duplicate effects',async()=>{
   await db.query("insert into public.jobkix_applications(id,vacancy_id,candidate_user_id,organization_id,state,snapshot,receipt) values($1,$2,$3,$4,'interview','{}','ISOLATED_SCHEDULED_APPLICATION')",[id(1400),id(1300),id(1),id(4)]);
   await db.query("insert into public.jobkix_interviews(id,application_id,organization_id,candidate_user_id,starts_at,ends_at,timezone,format,location,created_by) values($1,$2,$3,$4,now()+interval '2 hours',now()+interval '3 hours','Europe/London','video','Private test-only meeting location',$5)",[id(1401),id(1400),id(4),id(1),id(2)]);
   await db.query('insert into public.jobkix_interview_panels(interview_id,member_user_id) values($1,$2)',[id(1401),id(2)]);
   const tick=async()=>(await db.query('select public.jobkix_process_interview_reminders() result')).rows[0].result;
   await tick();await tick();let events=(await db.query("select * from public.jobkix_events where type='interview.reminder' and object_id=$1",[id(1401)])).rows;assert.equal(events.length,1);
   const queued=(await db.query("select id from public.jobkix_outbox where event_id=$1 and recipient_user_id=$2 and channel='email'",[events[0].id,id(1)])).rows[0];assert.ok((await db.query('select public.jobkix_notification_context(o,true) result from public.jobkix_outbox o where id=$1',[queued.id])).rows[0].result);
   await db.query("update public.jobkix_interviews set starts_at=now()+interval '50 minutes',ends_at=now()+interval '80 minutes',version=version+1 where id=$1",[id(1401)]);await tick();await tick();assert.equal((await db.query("select count(*) from public.jobkix_events where type='interview.reminder' and object_id=$1",[id(1401)])).rows[0].count,2);assert.equal((await db.query('select public.jobkix_notification_context(o,true) result from public.jobkix_outbox o where id=$1',[queued.id])).rows[0].result,null);
   await db.query("update public.jobkix_interviews set state='cancelled',version=version+1 where id=$1",[id(1401)]);await tick();assert.equal((await db.query("select count(*) from public.jobkix_events where type='interview.reminder' and object_id=$1",[id(1401)])).rows[0].count,2);
  });
  await t.test('expiry housekeeping preserves application decisions and records one offer and vacancy revision',async()=>{
   await db.query("insert into public.jobkix_offers(id,application_id,organization_id,candidate_user_id,state,title,terms,response_deadline,created_by) values($1,$2,$3,$4,'sent','Isolated expired offer','Private fixture terms',now()-interval '1 minute',$5)",[id(1410),id(1400),id(4),id(1),id(2)]);
   await assert.rejects(command(id(1),'offer.respond',{id:id(1410),response:'accepted'},1),/INVALID_TRANSITION/);
   await db.query("update public.jobkix_vacancies set published_at=now()-interval '1 hour',expires_at=now()-interval '1 minute' where id=$1",[id(1300)]);
   await db.query('select public.jobkix_process_expiries()');await db.query('select public.jobkix_process_expiries()');
   assert.equal((await db.query('select state,version from public.jobkix_offers where id=$1',[id(1410)])).rows[0].state,'expired');assert.equal((await db.query('select state from public.jobkix_vacancies where id=$1',[id(1300)])).rows[0].state,'expired');assert.equal((await db.query('select state from public.jobkix_applications where id=$1',[id(1400)])).rows[0].state,'interview');
   assert.equal((await db.query("select count(*) from public.jobkix_events where type='offer.expired' and object_id=$1",[id(1410)])).rows[0].count,1);assert.equal((await db.query('select count(*) from public.jobkix_offer_revisions where offer_id=$1',[id(1410)])).rows[0].count,2);
  });
  await t.test('operator delivery recovery protects versions and never resends unknown acknowledgements',async()=>{
   const row=(await db.query("select id,version from public.jobkix_outbox where template_key='interview.reminder' and recipient_user_id=$1 and channel='email' order by created_at,id limit 1",[id(1)])).rows[0];assert.ok(row);
   await db.query("update public.jobkix_outbox set state='delivery_unknown',last_error_code='DELIVERY_ACKNOWLEDGEMENT_UNKNOWN' where id=$1",[row.id]);let current=(await db.query('select version from public.jobkix_outbox where id=$1',[row.id])).rows[0];await assert.rejects(admin('delivery.retry',{id:row.id},current.version),/INVALID_TRANSITION/);
   await assert.rejects(asUser(id(1),tx=>tx.query('select public.jobkix_delivery_recovery($1,$2,$3)',[row.id,current.version,'delivery.cancel'])),/permission denied/);
   const cancelled=await admin('delivery.cancel',{id:row.id},current.version);assert.equal(cancelled.state,'cancelled');await assert.rejects(admin('delivery.cancel',{id:row.id},current.version),/VERSION_CONFLICT/);
   const page=(await db.query('select public.jobkix_operations_read($1,$2,1,$3) result',[id(900),'Isolated operational recovery review','cancelled'])).rows[0].result;assert.ok(page.total>0);assert.equal(JSON.stringify(page).includes('recipient_email'),false);assert.equal(JSON.stringify(page).includes('lock_token'),false);assert.equal(JSON.stringify(page).includes('token_hash'),false);
   const saved=(await workspace(id(1),'search.save',{name:'Recoverable isolated alert',filters:{q:'Scheduled fixture opportunity'},frequency:'daily',enabled:true}));await db.query('select public.jobkix_process_search_alerts()');const retryRow=(await db.query("update public.jobkix_outbox set state='failed',last_error_code='TRANSPORT_CONFIGURATION',attempts=8 where channel='email' and data->>'savedSearchId'=$1 returning id,version",[saved.id])).rows[0];assert.ok(retryRow);
   const key=crypto.randomUUID(),recovered=await admin('delivery.retry',{id:retryRow.id},retryRow.version,key);assert.equal(recovered.state,'pending');assert.equal((await admin('delivery.retry',{id:retryRow.id},retryRow.version,key)).replayed,true);const attempts=(await db.query('select attempts,attempt_limit from public.jobkix_outbox where id=$1',[retryRow.id])).rows[0];assert.equal(attempts.attempts,8);assert.equal(attempts.attempt_limit,16);
  });

  await t.test('pipeline group changes are atomic, versioned, permission-checked and recover their original receipt',async()=>{
   for(const [app,candidate,vacancy] of [[id(1450),id(1),id(1301)],[id(1451),id(3),id(1302)]])await db.query("insert into public.jobkix_applications(id,vacancy_id,candidate_user_id,organization_id,state,snapshot,receipt) values($1,$2,$3,$4,'submitted','{}',$5)",[app,vacancy,candidate,id(4),'ISOLATED_BATCH_'+app]);
   const payload={organizationId:id(4),applications:[{id:id(1451),version:1},{id:id(1450),version:1}],state:'under_review',reason:'Human-reviewed isolated recruitment stage change.'};
   await assert.rejects(command(id(2),'application.bulk_stage',{...payload,applications:[payload.applications[0],{id:id(1450),version:99}]}),/VERSION_CONFLICT/);
   assert.deepEqual((await db.query('select state from public.jobkix_applications where id=any($1) order by id',[[id(1450),id(1451)]])).rows.map(row=>row.state),['submitted','submitted']);
   await assert.rejects(command(id(2),'application.bulk_stage',{...payload,state:'declined'}),/INVALID_INPUT/);await assert.rejects(command(id(2),'application.bulk_stage',{...payload,applications:[payload.applications[0],payload.applications[0]]}),/INVALID_INPUT/);await assert.rejects(command(id(1),'application.bulk_stage',payload),/FORBIDDEN/);
   const key=crypto.randomUUID(),draftKey='pipeline:'+id(4),intent={action:'application.bulk_stage',payload,version:0,key};let draft=await workspace(id(2),'draft.save',{kind:'hiring',key:draftKey,body:{fields:payload,intent}});
   const saved=(await asUser(id(2),tx=>tx.query("select * from public.jobkix_drafts where kind='hiring' and draft_key=$1",[draftKey]))).rows[0];assert.deepEqual(saved.body.intent,intent);
   const changed=await command(id(2),'application.bulk_stage',payload,0,key);assert.equal(changed.applications.length,2);assert.equal((await command(id(2),'application.bulk_stage',payload,0,key)).replayed,true);
   assert.deepEqual((await db.query('select state,version from public.jobkix_applications where id=any($1) order by id',[[id(1450),id(1451)]])).rows.map(row=>[row.state,row.version]),[['under_review',2],['under_review',2]]);
   const recovered=(await asUser(id(2),tx=>tx.query('select public.jobkix_pipeline_receipt($1) result',[key]))).rows[0].result;assert.equal(recovered.id,id(4));assert.equal((await asUser(id(1),tx=>tx.query('select public.jobkix_pipeline_receipt($1) result',[key]))).rows[0].result,null);
   await assert.rejects(command(id(2),'application.bulk_stage',{...payload,state:'shortlisted'},0,key),/IDEMPOTENCY_CONFLICT/);
   await db.query('update public.jobkix_memberships set active=false where user_id=$1 and organization_id=$2',[id(2),id(4)]);await assert.rejects(command(id(2),'application.bulk_stage',payload,0,key),/FORBIDDEN/);assert.equal((await asUser(id(2),tx=>tx.query("select * from public.jobkix_drafts where kind='hiring' and draft_key=$1",[draftKey]))).rows.length,0);await assert.rejects(asUser(id(2),tx=>tx.query('select public.jobkix_pipeline_receipt($1)',[key])),/FORBIDDEN/);await db.query('update public.jobkix_memberships set active=true where user_id=$1 and organization_id=$2',[id(2),id(4)]);
   await workspace(id(2),'draft.remove',{kind:'hiring',key:draftKey},draft.version);
  });

  await t.test('native administration pagination reaches records beyond the former cap and separates verification cases',async()=>{
   for(let index=0;index<205;index++)await db.query("insert into public.jobkix_cases(public_reference,reporter_user_id,kind,category,description,original_locale,created_at) values($1,$2,'support','isolated-pagination','ISOLATED PRIVATE CASE PAGINATION','en',now()-interval '2 hours')",['ISOLATED_CASE_PAGE_'+index,id(1)]);
   const read=async(collection,page=1)=>(await db.transaction(async tx=>{await tx.exec('set local role service_role');return tx.query('select public.jobkix_admin_page($1,$2,$3,$4) result',[id(900),collection,'Isolated authorized native queue pagination review',page]);})).rows[0].result;
   const first=await read('cases'),last=await read('cases',9);assert.ok(first.total>200);assert.equal(first.items.length,24);assert.ok(last.items.length>0);assert.equal(new Set([...first.items,...last.items].map(row=>row.id)).size,first.items.length+last.items.length);assert.ok(first.items.every(row=>row.kind!=='verification'));
   const verification=await read('verification');assert.ok(verification.items.every(row=>row.kind==='verification'));
   await assert.rejects(asUser(id(1),tx=>tx.query('select public.jobkix_admin_page($1,$2,$3,1)',[id(900),'cases','Unauthorized user attempts private queue access'])),/permission denied/);await assert.rejects(read('arbitrary-table'),/INVALID_INPUT/);await assert.rejects(read('cases',0),/INVALID_INPUT/);
  });
  await t.test('organization approval resolves only the reviewed version of its verification case',async()=>{
   const evidence=id(1470);await db.query("insert into public.jobkix_files(id,owner_user_id,organization_id,purpose,object_key,filename,mime,expected_bytes,actual_bytes,sha256,state,scanner_reference) values($1,$2,$3,'verification',$4,'ISOLATED verification close.pdf','application/pdf',100,100,$5,'ready','ISOLATED_VALIDATION')",[evidence,id(2),id(4),id(2)+'/'+evidence+'/original','b'.repeat(64)]);
   const submitted=await workspace(id(2),'verification.submit',{locale:'en',kind:'verification',organizationId:id(4),category:'identity',description:'Isolated organization approval with reporter-visible resolution.',fileId:evidence});
   let organization=(await db.query('select version from public.jobkix_organizations where id=$1',[id(4)])).rows[0];const input={id:id(4),caseId:submitted.id,caseVersion:submitted.version,evidenceIds:[evidence],validUntil:new Date(Date.now()+86400000).toISOString(),reference:'Isolated approved evidence reference'};
   await assert.rejects(admin('case.advance',{id:submitted.id,state:'under_review',visibility:'reporter'},submitted.version),/FORBIDDEN/);await assert.rejects(admin('organization.review',{...input,caseVersion:99},organization.version),/VERSION_CONFLICT/);assert.equal((await db.query('select version from public.jobkix_organizations where id=$1',[id(4)])).rows[0].version,organization.version);
   await admin('organization.review',input,organization.version);const resolved=(await asUser(id(2),tx=>tx.query('select state,version from public.jobkix_cases where id=$1',[submitted.id]))).rows[0];assert.equal(resolved.state,'resolved');assert.equal(resolved.version,submitted.version+1);assert.equal((await asUser(id(2),tx=>tx.query('select detail from public.jobkix_case_events where case_id=$1',[submitted.id]))).rows.length,1);
  });

  await t.test('anonymous sitemaps expose only current public paths and remove closed jobs without a scheduler',async()=>{
   const read=async(page=1)=>(await db.transaction(async tx=>{await tx.exec('set local role anon');return tx.query('select public.jobkix_sitemap_page($1) result',[page]);})).rows[0].result;
   let result=await read(),paths=result.items.map(row=>row.path);assert.ok(paths.includes('/jobkix/en/jobs/'+id(1301)));assert.equal(paths.includes('/jobkix/en/jobs/'+id(1300)),false);assert.ok(paths.includes('/jobkix/en/legal/privacy'));assert.equal(paths.includes('/jobkix/fr/legal/privacy'),false);assert.equal(paths.some(path=>/career\/|hiring\/|preview\/|auth\/|token/.test(path)),false);assert.equal(JSON.stringify(result).includes('PRIVATE_'),false);assert.equal(paths.length,new Set(paths).size);
   await db.query("update public.jobkix_vacancies set state='closed' where id=$1",[id(1301)]);result=await read();assert.equal(result.items.some(row=>row.path.endsWith('/jobs/'+id(1301))),false);assert.ok((await db.query('select public.jobkix_public_vacancy($1,true) result',[id(1301)])).rows[0].result);
   assert.equal((await read(2)).items.length,0);await assert.rejects(read(0),/INVALID_INPUT/);
  });

  await t.test('verified identities without an active JOBKIX account retain private support and appeals without recruitment access',async()=>{
   const applicant=id(1500),other=id(1501);for(const [actor,email] of [[applicant,'support-only@fixture.invalid'],[other,'other-support@fixture.invalid']])await db.query('insert into auth.users values($1,$2,now())',[actor,email]);
   const support=(actor,action,payload,version=0,key=crypto.randomUUID())=>asUser(actor,async tx=>(await tx.query('select public.jobkix_restricted_case_command($1,$2,$3,$4) result',[action,payload,version,key])).rows[0].result);
   const read=(actor,caseId=null)=>asUser(actor,async tx=>(await tx.query('select public.jobkix_restricted_cases($1,1) result',[caseId])).rows[0].result);
   const payload={kind:'support',category:'account',locale:'ar',description:'An isolated verified-identity assistance request, without joining JOBKIX.'},key=crypto.randomUUID();let recorded=await support(applicant,'case.create',payload,0,key);assert.equal((await support(applicant,'case.create',payload,0,key)).id,recorded.id);await assert.rejects(support(applicant,'case.create',{...payload,description:'A different conflicting private support request'},0,key),/IDEMPOTENCY_CONFLICT/);
   assert.equal((await db.query('select count(*) from public.jobkix_accounts where user_id=$1',[applicant])).rows[0].count,0);assert.equal((await db.query('select count(*) from public.jobkix_candidates where user_id=$1',[applicant])).rows[0].count,0);
   assert.equal((await read(applicant)).total,1);assert.equal((await read(other)).total,0);await assert.rejects(read(other,recorded.id),/FORBIDDEN/);await assert.rejects(support(applicant,'verification.submit',payload),/INVALID_INPUT/);await assert.rejects(support(applicant,'case.create',{...payload,organizationId:id(4)}),/FORBIDDEN/);
   let draft=await support(applicant,'draft.save',{kind:'case',key:'reply:'+recorded.id,body:{fields:{description:'Private recovered case reply'},intent:null}});assert.equal((await read(applicant,recorded.id)).draft.body.fields.description,'Private recovered case reply');await assert.rejects(support(other,'draft.save',{kind:'case',key:'reply:'+recorded.id,body:{fields:{}}}),/FORBIDDEN/);await assert.rejects(support(applicant,'draft.save',{kind:'hiring',key:'pipeline:'+id(4),body:{fields:{}}}),/FORBIDDEN/);
   const replyKey=crypto.randomUUID(),reply={id:recorded.id,locale:'ar',description:'Additional private information provided by the verified reporter.'},replied=await support(applicant,'case.reply',reply,recorded.version,replyKey);assert.equal((await support(applicant,'case.reply',reply,recorded.version,replyKey)).replayed,true);await assert.rejects(support(applicant,'case.reply',reply,recorded.version),/VERSION_CONFLICT/);
   await db.query("insert into public.jobkix_case_events(case_id,admin_actor_id,visibility,detail) values($1,$2,'internal','PRIVATE_INTERNAL_RESTRICTED_CASE_MARKER')",[recorded.id,id(900)]);const visible=await read(applicant,recorded.id);assert.equal(visible.items.length,1);assert.equal(JSON.stringify(visible).includes('PRIVATE_INTERNAL_RESTRICTED_CASE_MARKER'),false);assert.equal(JSON.stringify(visible).includes('assigned_admin_id'),false);
   let reviewed=await admin('case.advance',{id:recorded.id,state:'under_review',visibility:'reporter'},replied.version);reviewed=await admin('case.advance',{id:recorded.id,state:'resolved',visibility:'reporter'},reviewed.version);const appeal=await support(applicant,'case.appeal',{id:recorded.id,locale:'ar',description:'An isolated appeal of the reviewed assistance decision.'},reviewed.version);assert.equal(appeal.state,'appealed');
   const recovered=(await asUser(applicant,tx=>tx.query('select public.jobkix_case_receipt($1,$2) result',['case.create',key]))).rows[0].result;assert.equal(recovered.id,recorded.id);assert.equal((await asUser(other,tx=>tx.query('select public.jobkix_case_receipt($1,$2) result',['case.create',key]))).rows[0].result,null);
   await assert.rejects(command(applicant,'vacancy.create',{organizationId:id(4)}),/AUTHENTICATION_REQUIRED/);await assert.rejects(asUser(applicant,tx=>tx.query('select public.jobkix_file_download($1)',[fileId])),/AUTHENTICATION_REQUIRED/);
   await db.query("update public.jobkix_accounts set status='restricted' where user_id=$1",[id(1)]);try{
    await assert.rejects(command(id(1),'privacy.save',{discoverable:true},1),/ACCOUNT_RESTRICTED/);await assert.rejects(asUser(id(1),tx=>tx.query('select public.jobkix_file_download($1)',[fileId])),/ACCOUNT_RESTRICTED/);const own=await support(id(1),'privacy.request',{kind:'privacy_deletion',locale:'fr',category:'privacy',description:'A private data-review request while recruitment access is restricted.'});assert.equal((await read(id(1),own.id)).case.id,own.id);
   }finally{await db.query("update public.jobkix_accounts set status='active' where user_id=$1",[id(1)]);}
   // Historical queue fixtures above are older than the creation-rate window.
   for(let index=0;index<19;index++)await db.query("insert into public.jobkix_cases(public_reference,reporter_user_id,kind,category,description) values($1,$2,'support','isolated-rate','Isolated rate-window fixture')",['ISOLATED_SUPPORT_RATE_'+index,applicant]);await assert.rejects(support(applicant,'case.create',payload),/RATE_LIMITED/);
   await assert.rejects(read(id(1)),/FORBIDDEN/);await assert.rejects(db.transaction(async tx=>{await tx.exec('set local role anon');await tx.query('select public.jobkix_restricted_cases(null,1)');}),/permission denied/);
  });
 } finally { await db.close(); }
});
