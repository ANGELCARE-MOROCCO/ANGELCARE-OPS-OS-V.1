/** Actual isolated PostgreSQL/RLS and commands. No hosted/production connection. */
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createDatabase,id}=require('./local-database.cjs');
test('bounded native interview-panel selection and current command authority',async t=>{
 const fixture=await createDatabase({panelPagination:true}),{db,execute,ids}=fixture;
 try{
  const command=(actor,action,payload,version=0)=>execute('authenticated',actor,'jobkix_command',{p_action:action,p_payload:payload,p_expected_version:version,p_idempotency_key:crypto.randomUUID()});
  const vacancy=await execute('anon',null,'jobkix_public_vacancy',{p_vacancy:ids.vacancies[1]}),profile=(await db.query('select version from public.jobkix_candidates where user_id=$1',[ids.candidate])).rows[0];
  const application=await command(ids.candidate,'application.submit',{vacancyId:vacancy.id,vacancyVersion:vacancy.version,profileVersion:profile.version,documentId:ids.file,answers:Object.fromEntries(vacancy.questions.map(q=>[q.id,'ISOLATED panel-selection application evidence.'])),sharingConsent:true,consentRevision:'jobkix-application-2026-10-20'});
  const options=(actor=ids.hirer,extra={})=>execute('authenticated',actor,'jobkix_panel_options',{p_application:application.id,p_page:1,p_query:'',p_selected:[],...extra});
  await t.test('24-record pages reach all 250 panelists and retain an off-page selection without private fields',async()=>{
   const first=await options();assert.equal(first.total,251);assert.equal(first.pageSize,24);assert.equal(first.items.length,24);const found=new Set();
   for(let page=1;page<=Math.ceil(first.total/24);page++){const result=await options(ids.hirer,{p_page:page});assert.ok(result.items.length<=24);for(const row of result.items){assert.deepEqual(Object.keys(row).sort(),['available','id','label']);assert.equal(row.available,true);assert.ok(!found.has(row.id));found.add(row.id);}}
   for(const member of ids.panelMembers)assert.ok(found.has(member));
   const retained=await options(ids.hirer,{p_query:'0001',p_selected:[ids.panelMembers.at(-1)]});assert.equal(retained.total,1);assert.equal(retained.items[0].id,ids.panelMembers[0]);assert.equal(retained.selected[0].id,ids.panelMembers.at(-1));assert.ok(!JSON.stringify(retained).includes('@jobkix.fixture.invalid'));
   const literal=await options(ids.hirer,{p_query:'%'});assert.equal(literal.total,0,'Wildcards are literal search text');
  });
  await t.test('candidate, outsider, anonymous and directly invoked helper reads are denied',async()=>{
   for(const actor of [ids.candidate,ids.outsider])await assert.rejects(options(actor),/FORBIDDEN/);
   await assert.rejects(execute('anon',null,'jobkix_panel_options',{p_application:application.id}),/permission denied/);
   await assert.rejects(execute('authenticated',ids.hirer,'jobkix_panel_members',{p_vacancy:vacancy.id}),/permission denied/);
   await assert.rejects(options(ids.hirer,{p_application:id(99999)}),/FORBIDDEN/);
  });
  await t.test('duplicate, null, unsafe and excessive inputs fail at the SQL boundary',async()=>{
   for(const extra of [{p_page:0},{p_page:10001},{p_page:null},{p_query:'x'.repeat(181)},{p_query:'\n'},{p_selected:null},{p_selected:[null]},{p_selected:[ids.hirer,ids.hirer]},{p_selected:[ids.hirer,...ids.panelMembers.slice(0,20)]}])await assert.rejects(options(ids.hirer,extra),/INVALID_INPUT/);
  });
  await t.test('current member state, verification, site and vacancy scopes remove retained names immediately',async()=>{
   const member=ids.panelMembers.at(-1),matches=async()=>options(ids.hirer,{p_query:'0250',p_selected:[member]});assert.equal((await matches()).total,1);
   for(const [sql,args,restore] of [
    ['update public.jobkix_memberships set active=false where user_id=$1',[member],'update public.jobkix_memberships set active=true where user_id=$1'],
    ["update public.jobkix_memberships set expires_at=now()-interval '1 hour' where user_id=$1",[member],'update public.jobkix_memberships set expires_at=null where user_id=$1'],
    ["update public.jobkix_memberships set role='viewer' where user_id=$1",[member],"update public.jobkix_memberships set role='interviewer' where user_id=$1"],
    ["update public.jobkix_accounts set status='restricted' where user_id=$1",[member],"update public.jobkix_accounts set status='active' where user_id=$1"],
    ['update auth.users set email_confirmed_at=null where id=$1',[member],'update auth.users set email_confirmed_at=now() where id=$1'],
    ['update public.jobkix_memberships set site_ids=array[$2::uuid] where user_id=$1',[member,id(99998)],'update public.jobkix_memberships set site_ids=\'{}\' where user_id=$1'],
    ['update public.jobkix_memberships set vacancy_ids=array[$2::uuid] where user_id=$1',[member,id(99997)],'update public.jobkix_memberships set vacancy_ids=\'{}\' where user_id=$1']
   ]){await db.query(sql,args);const result=await matches();assert.equal(result.total,0);assert.deepEqual(result.selected,[]);await db.query(restore,[member]);assert.equal((await matches()).total,1);}
   await db.query('update public.jobkix_memberships set site_ids=array[$2::uuid],vacancy_ids=array[$3::uuid] where user_id=$1',[member,id(6),vacancy.id]);assert.equal((await matches()).total,1);await db.query("update public.jobkix_memberships set site_ids='{}',vacancy_ids='{}' where user_id=$1",[member]);
  });
  await t.test('a dual-role candidate is never eligible for their own interview panel',async()=>{
   await db.query("insert into public.jobkix_memberships(organization_id,user_id,role) values($1,$2,'interviewer')",[ids.institution,ids.candidate]);const result=await options(ids.hirer,{p_selected:[ids.candidate]});assert.ok(!result.items.some(row=>row.id===ids.candidate));assert.deepEqual(result.selected,[]);assert.equal(result.total,251);
   await db.query('delete from public.jobkix_memberships where organization_id=$1 and user_id=$2',[ids.institution,ids.candidate]);
  });
  await t.test('revoked caller capability and candidate blocking deny the whole roster',async()=>{
   await db.query('update public.jobkix_memberships set active=false where organization_id=$1 and user_id=$2',[ids.institution,ids.hirer]);await assert.rejects(options(),/FORBIDDEN/);await db.query('update public.jobkix_memberships set active=true where organization_id=$1 and user_id=$2',[ids.institution,ids.hirer]);
   await db.query('insert into public.jobkix_candidate_blocks(candidate_user_id,organization_id) values($1,$2)',[ids.candidate,ids.institution]);await assert.rejects(options(),/FORBIDDEN/);await db.query('delete from public.jobkix_candidate_blocks where candidate_user_id=$1 and organization_id=$2',[ids.candidate,ids.institution]);
  });
  await t.test('the native interview command rejects a revoked selection, then preserves the exact eligible off-page panel',async()=>{
   const member=ids.panelMembers.at(-1),startsAt=new Date(Date.now()+4*86400000).toISOString(),payload={applicationId:application.id,startsAt,endsAt:new Date(Date.parse(startsAt)+3600000).toISOString(),timezone:'Asia/Kolkata',format:'video',location:'https://meeting.fixture.invalid/panel-selection',panelUserIds:[member]};
   let version=application.version;for(const state of ['under_review','shortlisted','interview']){const next=await command(ids.hirer,'application.stage',{applicationId:application.id,state},version);version=next.version;}
   await db.query('update public.jobkix_memberships set active=false where user_id=$1',[member]);await assert.rejects(command(ids.hirer,'interview.propose',payload),/FORBIDDEN/);assert.equal((await db.query('select count(*)::integer total from public.jobkix_interviews where application_id=$1',[application.id])).rows[0].total,0);
   await db.query('update public.jobkix_memberships set active=true where user_id=$1',[member]);const result=await command(ids.hirer,'interview.propose',payload),panels=(await db.query('select member_user_id from public.jobkix_interview_panels where interview_id=$1',[result.id])).rows;assert.deepEqual(panels.map(row=>row.member_user_id),[member]);
   const snapshot=(await db.query('select snapshot from public.jobkix_interview_revisions where interview_id=$1 and version=$2',[result.id,result.version])).rows[0].snapshot;assert.equal(snapshot.panels[0].userId,member);
  });
 }finally{await db.close();}
});
