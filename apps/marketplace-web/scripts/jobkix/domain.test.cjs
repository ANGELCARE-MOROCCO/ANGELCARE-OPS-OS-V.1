const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const test = require('node:test');
const assert = require('node:assert/strict');
const source = path.resolve(__dirname, '../../angelcare-marketplace/jobkix');
require.extensions['.ts'] = (module, file) => {
  if (!file.startsWith(source + path.sep)) throw Error('Test loader scope refused');
  module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions:{ module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022 } }).outputText, file);
};
const p = require(source + '/policy.ts');
const d = require(source + '/domain.ts');
const v = require(source + '/validation.ts');
const r = require(source + '/routes.ts');
const c = require(source + '/contracts.ts');
const taxonomy = require(source + '/taxonomy.ts');
// Isolated domain fixtures. No database, network, production catalogue or environment files.
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const now = Date.parse('2026-10-20T12:00:00.000Z');
const actor = { userId:id(1),emailConfirmed:true,restricted:false };
const recruiter = { userId:id(2),emailConfirmed:true,restricted:false };
const org = { id:id(3),kind:'household',publicName:'Test household alias',country:'GB',status:'active',identityReviewedUntil:'2027-01-01T00:00:00.000Z',version:1 };
const vacancy = { id:id(4),organizationId:org.id,siteId:id(5),version:3,state:'published',title:'Test vacancy',settingId:'households',occupationId:'nanny',country:'GB',region:'',city:'Test city',originalLocale:'en',description:'Isolated fixture',duties:['Professional care'],requirements:['Relevant experience'],benefits:[],workSchedule:'part_time',contractType:'permanent',workLocation:'on_site',liveIn:false,hoursPerWeek:20,languages:['en'],compensation:null,overseasApplicants:'unknown',sponsorship:'unknown',relocation:'unknown',requiredDocument:true,questions:[{id:id(6),label:'Test question',required:true,kind:'text',maxLength:100}],publishedAt:'2026-10-19T00:00:00.000Z',expiresAt:'2026-11-01T00:00:00.000Z',reviewedVersion:3,updatedAt:'2026-10-19T00:00:00.000Z' };
const profile = {id:id(7),userId:actor.userId,version:2,displayName:'Fixture candidate',headline:'Professional',country:'FR',timezone:'Europe/Paris',locale:'fr',summary:'Test-only professional profile',skills:['care'],occupations:['nanny'],languages:['fr'],adultConfirmedAt:'2026-10-19T00:00:00.000Z',discoverable:false,blockedOrganizationIds:[]};
const file = {id:id(8),ownerUserId:actor.userId,organizationId:null,purpose:'cv',status:'ready',mime:'application/pdf',bytes:1000,sha256:'a'.repeat(64),revision:1};
const input = {vacancyId:vacancy.id,vacancyVersion:3,profileVersion:2,documentId:file.id,answers:{[id(6)]:'Fixture answer'},sharingConsent:true,consentRevision:d.APPLICATION_CONSENT_REVISION};
const member = {id:id(9),userId:recruiter.userId,organizationId:org.id,role:'recruiter',siteIds:[],vacancyIds:[],active:true,expiresAt:null};
const fault = (code, fn) => assert.throws(fn, error => error instanceof c.JobkixFault && error.code === code);
test('presentation sanitation removes only JOBKIX hints and does not mutate the request headers',()=>{
 const {withoutJobkixPresentation,jobkixPresentation}=require(source+'/presentation-context.ts');
 const headers=new Headers({'x-jobkix-path':'/jobkix/ar','x-jobkix-locale':'ar',cookie:'synthetic-session=fixture','x-forwarded-host':'original.example.test',origin:'https://original.example.test','x-vercel-ip-country':'CA','x-angelcare-customer-path':'/original?context=retained','x-tenant-id':'fixture-tenant'});
 const sanitized=withoutJobkixPresentation(headers);
 assert.equal(jobkixPresentation(sanitized),null);assert.equal(sanitized.has('x-jobkix-path'),false);assert.equal(sanitized.has('x-jobkix-locale'),false);
 assert.equal(headers.get('x-jobkix-locale'),'ar');
 for(const [name,value] of headers)if(!name.startsWith('x-jobkix-'))assert.equal(sanitized.get(name),value,name);
});
test('location photography matches actual country/city context and preserves reviewed operator images',()=>{
 const {geographicScene,geographicOpeningImage,geographicTitle}=require(source+'/geographic-scenes.ts'),{g}=require(source+'/geography-copy.ts');
 for(const locale of c.LOCALES){for(const [country,city,expected] of [['CA',null,'destination-toronto'],['CA',' Toronto ','destination-toronto'],['GB','LONDON','destination-london']]){const image=geographicScene(country,city,locale);assert.equal(image.id,expected);assert.ok(image.alt.length>20);assert.equal(image.width,1536);assert.equal(image.height,1024);assert.ok(image.mobileUrl.endsWith('-mobile.webp'));assert.ok(require(source+'/editorial-assets.ts').isEditorialScene(image.id));}
  assert.ok(geographicTitle(locale,'Toronto').includes('Toronto'));assert.ok(!geographicTitle(locale,'Toronto').includes('{place}'));assert.ok(g(locale,'countsContext').length>20);assert.ok(geographicTitle(locale,"$& <Toronto>").includes('$& <Toronto>'));
 }
 for(const [country,city] of [['CA','Ottawa'],['GB','Manchester'],['FR','Toronto'],['US','London'],['FR',null]])assert.equal(geographicScene(country,city,'en'),null);
 const selected={...geographicScene('CA','Toronto','en'),id:'operator-selected',alt:'Reviewed operator description',desktopFocal:{x:7,y:81}};assert.equal(geographicOpeningImage(selected,'CA','Toronto','fr'),selected);
});
test('locked inventory is exactly 73 unique families; user families cover 455 locale cells', () => {
  assert.equal(r.SCREENS.length,73);assert.equal(new Set(r.SCREENS.map(s=>s.id)).size,73);
  assert.equal(r.SCREENS.filter(s=>s.audience!=='admin').length*c.LOCALES.length,455);
  assert.equal(taxonomy.SETTINGS.length,16);
});
test('private CV selection validates bounded query inputs and never projects storage or owner fields',()=>{
 const selection=require(source+'/document-selection.ts');
 assert.deepEqual(selection.documentSelectionQuery(new URLSearchParams('page=9&q=CV')), {page:9,q:'CV',selected:null});
 assert.equal(selection.documentSelectionQuery(new URLSearchParams({selected:id(8)})).selected,id(8));
 for(const query of ['page=0','page=10001','page=1.2','page=01','page=1&page=2','q=one&q=two','owner_user_id='+id(2),'selected=not-an-id','q='+encodeURIComponent('x'.repeat(181)),'q=%00'])fault('INVALID_INPUT',()=>selection.documentSelectionQuery(new URLSearchParams(query)));
 const projected=selection.selectableDocumentRow({id:id(8),filename:'My CV.pdf',revision:2,state:'ready',purpose:'cv',library_archived_at:null,owner_user_id:id(1),storage_path:'PRIVATE_PATH',sha256:'PRIVATE_HASH'});
 assert.deepEqual(projected,{id:id(8),filename:'My CV.pdf',revision:2,archived:false});assert.equal(JSON.stringify(projected).includes('PRIVATE'),false);
 assert.equal(selection.selectableDocumentRow({id:id(8),filename:'My CV.pdf',revision:2,state:'ready',purpose:'cv',library_archived_at:'2026-10-21T00:00:00Z'}).archived,true);
 fault('DOCUMENT_NOT_READY',()=>selection.selectableDocumentRow({state:'quarantined',purpose:'cv'}));
 const response={items:[projected],selected:projected,total:220,page:9,pageSize:24};assert.deepEqual(selection.documentSelectionResult(response),response);
 fault('DEPENDENCY_UNAVAILABLE',()=>selection.documentSelectionResult({...response,items:[projected,projected]}));
 fault('DEPENDENCY_UNAVAILABLE',()=>selection.documentSelectionResult({...response,pageSize:200}));
 fault('DEPENDENCY_UNAVAILABLE',()=>selection.documentSelectionResult({...response,total:0}));
 fault('DEPENDENCY_UNAVAILABLE',()=>selection.documentSelectionResult({...response,items:[{...projected,archived:true}]}));
 fault('DEPENDENCY_UNAVAILABLE',()=>selection.documentSelectionResult({...response,selected:{...projected,id:'invalid'}}));
});
test('native studio selection validates scope, stable retained IDs and bounded metadata responses',()=>{
 const lookup=require(source+'/studio-selection.ts'),request=lookup.studioSelectionRequest(lookup.studioSelectionParams('sites',id(3),'team',[id(5)]));assert.equal(request.organization,id(3));assert.equal(request.purpose,'team');assert.deepEqual(request.selected,[id(5)]);
 for(const query of ['kind=private-secrets','kind=sites','kind=organizations&organization='+id(3),'kind=pools&organization='+id(3)+'&purpose=team','kind=sites&organization='+id(3)+'&page=0','kind=sites&organization='+id(3)+'&page=1&page=2','kind=sites&organization='+id(3)+'&selected='+id(5)+'&selected='+id(5),'kind=sites&organization='+id(3)+'&actor='+id(2)])fault('INVALID_INPUT',()=>lookup.studioSelectionRequest(new URLSearchParams(query)));
 const row={id:id(5),label:'Native private record',available:true},result={items:[row],selected:[row],total:230,page:1,pageSize:24};assert.deepEqual(lookup.studioSelectionResult(result),result);assert.deepEqual(lookup.studioRecord({...row,private_address:'PRIVATE_ADDRESS',owner_email:'PRIVATE_EMAIL'}),row);
 for(const invalid of [{...result,pageSize:200},{...result,total:0},{...result,items:[row,row]},{...result,items:[{...row,available:false}]},{...result,selected:[{...row,id:'unsafe'}]}])fault('DEPENDENCY_UNAVAILABLE',()=>lookup.studioSelectionResult(invalid));
 assert.deepEqual(lookup.validSelectionIds([id(5),'invalid',id(5)]),[id(5)]);
});
test('interview panel lookup is application-bound and rejects actor overrides or overlarge retained panels',()=>{
 const lookup=require(source+'/panel-selection.ts');assert.deepEqual(lookup.panelSelectionRequest(lookup.panelSelectionParams(id(4),[id(5)])),{application:id(4),page:1,q:'',selected:[id(5)]});
 for(const query of ['kind=panels','kind=panels&application='+id(4)+'&organization='+id(3),'kind=panels&application='+id(4)+'&actor='+id(2),'kind=panels&application='+id(4)+'&application='+id(5),'kind=panels&application='+id(4)+'&page=0','kind=panels&application='+id(4)+'&page=01','kind=panels&application='+id(4)+'&q=%00','kind=panels&application='+id(4)+'&selected='+id(5)+'&selected='+id(5),lookup.panelSelectionParams(id(4),Array.from({length:21},(_,i)=>id(i+10))).toString()])fault('INVALID_INPUT',()=>lookup.panelSelectionRequest(new URLSearchParams(query)));
});
test('private pool presence accepts exactly one binding and a minimal boolean response',()=>{
 const membership=require(source+'/pool-membership.ts'),params=new URLSearchParams({organization:id(3),pool:id(4),candidate:id(1)});assert.deepEqual(membership.poolMembershipQuery(params),{organization:id(3),pool:id(4),candidate:id(1)});
 for(const query of ['',params+'&actor='+id(2),params+'&pool='+id(5),'organization='+id(3)+'&pool=unsafe&candidate='+id(1)])fault('INVALID_INPUT',()=>membership.poolMembershipQuery(new URLSearchParams(query)));
 assert.deepEqual(membership.poolMembershipResult({present:true}),{present:true});assert.deepEqual(membership.poolMembershipResult({present:false}),{present:false});
 for(const value of [{},{present:'true'},{present:true,private_email:'PRIVATE'}])fault('DEPENDENCY_UNAVAILABLE',()=>membership.poolMembershipResult(value));
});
test('support attachment selection keeps verification organization/purpose separate from CV queries',()=>{
 const selection=require(source+'/document-selection.ts');assert.equal(selection.caseDocumentQuery(new URLSearchParams('context=case&q=evidence')).context,'case');assert.equal(selection.caseDocumentQuery(new URLSearchParams({context:'verification',organization:id(3)})).organization,id(3));
 for(const query of ['context=unknown','context=case&organization='+id(3),'context=verification','context=verification&organization='+id(3)+'&actor='+id(2),'context=case&context=verification','context=case&selected=unsafe'])fault('INVALID_INPUT',()=>selection.caseDocumentQuery(new URLSearchParams(query)));
 const row={id:id(8),filename:'Evidence.pdf',revision:1,state:'ready',purpose:'report',library_archived_at:null,object_key:'PRIVATE_KEY',owner_user_id:id(2)};assert.deepEqual(selection.selectableEvidenceRow(row),{id:id(8),filename:'Evidence.pdf',revision:1,archived:false});fault('DOCUMENT_NOT_READY',()=>selection.selectableDocumentRow(row));fault('DOCUMENT_NOT_READY',()=>selection.selectableEvidenceRow({...row,state:'quarantined'}));fault('DOCUMENT_NOT_READY',()=>selection.selectableEvidenceRow({...row,purpose:'unknown'}));
});
test('every user route resolves to its own family, with literal precedence',()=>{
  for(const screen of r.SCREENS.filter(s=>s.audience!=='admin')) {
    const parts=screen.path.split('/').filter(Boolean).map(x=>x.startsWith(':')?'sample':x);
    assert.equal(r.resolveScreen(parts)?.screen.id,screen.id,screen.path);
  }
  assert.equal(r.resolveScreen(['hiring','vacancies','new']).screen.id,'H03');
  assert.equal(r.resolveScreen(['legal']).screen.id,'P26');
  assert.equal(r.resolveScreen(['unknown']),null);
});
test('locale switching preserves query, destination and fragments for all seven languages',()=>{
  for(const locale of c.LOCALES) assert.equal(r.switchLocale('/jobkix/fr/jobs?origin=FR&destination=CA&q=nanny#results',locale),`/jobkix/${locale}/jobs?origin=FR&destination=CA&q=nanny#results`);
});
test('unsafe return destinations are rejected; valid application context survives',()=>{
  for(const x of ['https://evil.test','//evil.test','/jobkix/en/%2f%2fevil.test','/jobkix/en/../../admin','/jobkix/en/a\\b','/jobkix/fr/career','/jobkix/en/one\nmore']) assert.equal(r.safeReturnTo(x,'en'),'/jobkix/en/career',x);
  assert.equal(r.safeReturnTo('/jobkix/en/career/applications?apply='+vacancy.id,'en'),'/jobkix/en/career/applications?apply='+vacancy.id);
});
test('eligibility closes at the exact deadline even without a background worker',()=>{
  assert.equal(p.vacancyEligible(vacancy,org,now),true);
  assert.equal(p.vacancyEligible(vacancy,org,Date.parse(vacancy.expiresAt)),false);
  for(const state of ['draft','pending_review','paused','expired','filled','closed','archived','suspended']) assert.equal(p.vacancyEligible({...vacancy,state},org,now),false);
  assert.equal(p.vacancyEligible(vacancy,{...org,status:'suspended'},now),false);
  assert.equal(p.vacancyEligible(vacancy,{...org,identityReviewedUntil:null},now),false);
});
test('membership guards combine actor, current membership, site and vacancy scopes',()=>{
  const scope={siteId:vacancy.siteId,vacancyId:vacancy.id};
  assert.equal(p.canAct(recruiter,[member],'application.read',org.id,scope,now),true);
  for(const changed of [{active:false},{expiresAt:'2026-10-20T12:00:00.000Z'},{siteIds:[id(99)]},{vacancyIds:[id(99)]},{organizationId:id(99)},{userId:id(99)},{role:'interviewer'}]) assert.equal(p.canAct(recruiter,[{...member,...changed}],'application.read',org.id,scope,now),false);
  assert.equal(p.canAct({...recruiter,restricted:true},[member],'application.read',org.id,scope,now),false);
});
test('discoverability requires independent consent, unblocked organization and current membership',()=>{
  assert.equal(p.canDiscoverCandidate(profile,org,recruiter,[member],now),false);
  assert.equal(p.canDiscoverCandidate({...profile,discoverable:true},org,recruiter,[member],now),true);
  assert.equal(p.canDiscoverCandidate({...profile,discoverable:true,blockedOrganizationIds:[org.id]},org,recruiter,[member],now),false);
});
test('submission creates a detached explicit snapshot and excludes privacy controls',()=>{
  const snapshot=d.prepareSubmission(actor,profile,vacancy,org,file,input,now);
  assert.equal(snapshot.profileVersion,2);assert.equal(snapshot.vacancyVersion,3);
  assert.equal('blockedOrganizationIds' in snapshot.profile,false);assert.equal('discoverable' in snapshot.profile,false);
  const previous=profile.skills[0];snapshot.profile.skills[0]='changed';assert.equal(profile.skills[0],previous);
  assert.equal(snapshot.file.sha256,file.sha256);
});
test('submission rejects unconfirmed, restricted, unrelated and unconsented actors',()=>{
  fault('EMAIL_UNCONFIRMED',()=>d.prepareSubmission({...actor,emailConfirmed:false},profile,vacancy,org,file,input,now));
  fault('ACCOUNT_RESTRICTED',()=>d.prepareSubmission({...actor,restricted:true},profile,vacancy,org,file,input,now));
  fault('FORBIDDEN',()=>d.prepareSubmission(recruiter,profile,vacancy,org,file,input,now));
  fault('INVALID_INPUT',()=>d.prepareSubmission(actor,profile,vacancy,org,file,{...input,sharingConsent:false},now));
  fault('INVALID_INPUT',()=>d.prepareSubmission(actor,{...profile,adultConfirmedAt:null},vacancy,org,file,input,now));
});
test('submission rejects stale versions, closed jobs, blocked organizations and unknown questions',()=>{
  fault('VERSION_CONFLICT',()=>d.prepareSubmission(actor,profile,vacancy,org,file,{...input,vacancyVersion:2},now));
  fault('VERSION_CONFLICT',()=>d.prepareSubmission(actor,profile,vacancy,org,file,{...input,profileVersion:1},now));
  fault('VACANCY_UNAVAILABLE',()=>d.prepareSubmission(actor,profile,{...vacancy,state:'closed'},org,file,input,now));
  fault('FORBIDDEN',()=>d.prepareSubmission(actor,{...profile,blockedOrganizationIds:[org.id]},vacancy,org,file,input,now));
  fault('INVALID_INPUT',()=>d.prepareSubmission(actor,profile,vacancy,org,file,{...input,answers:{[id(99)]:'unknown'}},now));
  fault('INVALID_INPUT',()=>d.prepareSubmission(actor,profile,vacancy,org,file,{...input,answers:{}},now));
});
test('only owned ready CV files may be attached; failed uploads do not become valid documents',()=>{
  for(const state of ['uploading','quarantined','rejected','deleted']) fault('DOCUMENT_NOT_READY',()=>d.prepareSubmission(actor,profile,vacancy,org,{...file,status:state},input,now));
  fault('DOCUMENT_NOT_READY',()=>d.prepareSubmission(actor,profile,vacancy,org,{...file,ownerUserId:recruiter.userId},input,now));
  fault('DOCUMENT_NOT_READY',()=>d.prepareSubmission(actor,profile,vacancy,org,null,{...input,documentId:null},now));
});
test('private document reads recheck submitted version, withdrawal, blocking and membership',()=>{
  const application={id:id(10),candidateUserId:actor.userId,organizationId:org.id,vacancyId:vacancy.id,state:'submitted',version:1,snapshot:d.prepareSubmission(actor,profile,vacancy,org,file,input,now),receipt:'test',submittedAt:new Date(now).toISOString()};
  assert.equal(p.canReadPrivateFile(recruiter,file,application,vacancy,[member],profile,now),true);
  assert.equal(p.canReadPrivateFile(recruiter,file,application,vacancy,[{...member,active:false}],profile,now),false);
  assert.equal(p.canReadPrivateFile(recruiter,file,{...application,state:'withdrawn'},vacancy,[member],profile,now),false);
  assert.equal(p.canReadPrivateFile(recruiter,{...file,revision:2},application,vacancy,[member],profile,now),false);
});
test('stage movement cannot manufacture candidate acceptance or resurrect terminal states',()=>{
  p.assertApplicationTransition('under_review','shortlisted');
  fault('INVALID_TRANSITION',()=>p.assertApplicationTransition('offer','hired'));
  p.assertApplicationTransition('offer','hired',true);
  fault('INVALID_TRANSITION',()=>p.assertApplicationTransition('withdrawn','submitted'));
  fault('INVALID_TRANSITION',()=>p.assertVacancyTransition('archived','published'));
});
test('offer response requires exact intended candidate, current revision and a live deadline',()=>{
  const offer={id:id(11),candidateUserId:actor.userId,applicationId:id(10),organizationId:org.id,version:2,state:'sent',title:'Role',terms:'Fixture terms',compensation:null,startsAt:null,responseDeadline:'2026-10-21T00:00:00.000Z',sentAt:'2026-10-20T00:00:00.000Z'};
  assert.equal(d.candidateOfferResponse(actor,offer,2,'accepted',now).state,'accepted');
  fault('FORBIDDEN',()=>d.candidateOfferResponse(recruiter,offer,2,'accepted',now));
  fault('VERSION_CONFLICT',()=>d.candidateOfferResponse(actor,offer,1,'accepted',now));
  fault('OFFER_EXPIRED',()=>d.candidateOfferResponse(actor,offer,2,'accepted',Date.parse(offer.responseDeadline)));
});
test('interviews validate explicit UTC instants, IANA zones, duration and safe meeting locations',()=>{
  const input={startsAt:'2026-10-21T12:00:00Z',endsAt:'2026-10-21T13:00:00Z',timezone:'Asia/Kolkata',format:'video',location:'https://meeting.example.test/room',panelUserIds:[recruiter.userId]};
  assert.equal(d.validateInterview(input,now).timezone,'Asia/Kolkata');
  fault('INVALID_INPUT',()=>d.validateInterview({...input,timezone:'GMT+5'},now));
  fault('INVALID_INPUT',()=>d.validateInterview({...input,endsAt:input.startsAt},now));
  fault('INVALID_INPUT',()=>d.validateInterview({...input,location:'javascript:alert(1)'},now));
  fault('INVALID_INPUT',()=>v.instant('2026-02-31T12:00:00Z','startsAt'));
});
test('calendar values cannot inject invitations; Unicode folding preserves valid content',()=>{
  const interview={id:id(12),version:2,state:'scheduled',startsAt:'2026-10-21T12:00:00Z',endsAt:'2026-10-21T13:00:00Z',timezone:'Asia/Kolkata',location:'Room\nATTENDEE:evil@example.test'};
  const ics=d.interviewCalendar(interview,'Interview مرحباً नमस्ते '.repeat(8),'2026-10-20T12:00:00Z');
  assert.equal(ics.includes('\r\nATTENDEE:'),false);assert.match(ics,/SEQUENCE:2/);assert.match(ics,/DTSTART:20261021T120000Z/);
  for(const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line)<=75);
});
test('public projection excludes private fields and closed/expired JobPosting schema',()=>{
  const projected=p.publicVacancy({...vacancy,privateAddress:'secret'},{...org,privateContact:'secret'},now);
  assert.equal(JSON.stringify(projected).includes('secret'),false);
  assert.equal(d.publicJobPosting({...vacancy,state:'closed'},org,'https://example.test/job',now),null);
  const schema=d.publicJobPosting(vacancy,org,'https://example.test/job',now);
  assert.deepEqual(schema.employmentType,['PART_TIME']);assert.equal('baseSalary' in schema,false);
});
test('input contracts reject unsafe URLs, nonobjects, invalid currencies and reversed compensation',()=>{
  for(const value of ['javascript:alert(1)','data:text/html,x','//evil.test','https://u:p@example.test','http://example.test']) fault('INVALID_INPUT',()=>v.safeUrl(value,'url'));
  assert.equal(v.safeUrl('/jobkix/en/jobs?q=nanny','url'),'/jobkix/en/jobs?q=nanny');
  fault('INVALID_INPUT',()=>v.object([]));fault('INVALID_INPUT',()=>v.compensation({minimum:20,maximum:10,currency:'USD',unit:'hour'}));
  fault('INVALID_INPUT',()=>v.compensation({minimum:10,currency:'ZZZ',unit:'hour'}));
  assert.equal(v.countryCode(null,true),null);fault('INVALID_INPUT',()=>v.countryCode('ZZ'));
});
test('all authored interaction keys and family titles have nonempty seven-language source copy',()=>{
 const {TEXT}=require(source+'/i18n.ts'),{EXPERIENCE}=require(source+'/experience-copy.ts'),{STUDIO}=require(source+'/studio-copy.ts'),{DISCOVERY_COPY,SETTING_DESCRIPTIONS}=require(source+'/discovery-copy.ts'),{RESOURCE_COPY}=require(source+'/resource-copy.ts'),{HIRING_COPY}=require(source+'/hiring-copy.ts'),{OPERATIONS_COPY}=require(source+'/operations-copy.ts'),{AGE_NAMES}=require(source+'/age-copy.ts'),{screenName}=require(source+'/screen-copy.ts');
 for(const collection of [TEXT,EXPERIENCE,STUDIO,DISCOVERY_COPY,SETTING_DESCRIPTIONS,RESOURCE_COPY,HIRING_COPY,OPERATIONS_COPY,AGE_NAMES])for(const [key,row] of Object.entries(collection))for(const locale of c.LOCALES)assert.ok(typeof row[locale]==='string'&&row[locale].trim().length>0,key+':'+locale);
 for(const screen of r.SCREENS)for(const locale of c.LOCALES)assert.ok(screenName(screen.id,locale).trim());
 // Structural source coverage only; does not verify 455 rendered family/language cells or native quality.
});
test('directory navigation preserves recruitment context and validates lists, letters and paging',()=>{
 const directory=require(source+'/directory.ts');const input={origin:'FR',destination:'CA',reach:'abroad',occupation:'native-admin-defined-role',term:'éducateur',letter:'É',view:'list',page:'2'},query=directory.directoryQuery(input);
 const url=new URL(directory.directoryHref('ar','occupation',query,{letter:'',page:1}),'https://fixture.invalid');assert.equal(url.pathname,'/jobkix/ar/professions');for(const key of ['origin','destination','reach','occupation','term','view'])assert.equal(url.searchParams.get(key),input[key]);assert.equal(url.searchParams.has('page'),false);assert.equal(url.searchParams.has('letter'),false);
 for(const invalid of [{page:'0'},{page:'2.5'},{term:['one','two']},{view:'unknown'},{letter:'toolong'},{term:'private\u0000marker'},{occupation:'../../private'}])fault('INVALID_INPUT',()=>directory.directoryQuery(invalid));
});
test('editorial preview binds exact document families to their actual public layouts',()=>{
 const {editorialPreviewTarget:target}=require(source+'/editorial-preview.ts');assert.deepEqual(target('sector','sectors/households'),{kind:'setting',slug:'households'});assert.deepEqual(target('profession','professions/nanny'),{kind:'occupation',slug:'nanny'});assert.deepEqual(target('legal','privacy'),{kind:'legal',slug:'privacy'});
 assert.deepEqual(target('guide','career-planning'),{kind:'guide',slug:'career-planning'});
 for(const pair of [['sector','professions/nanny'],['legal','sectors/households'],['guide','resources/not-a-single-slug'],['front','privacy'],['profession','professions/../../admin']])assert.equal(target(...pair),null);
});
test('editorial media input rejects arbitrary URLs and unsafe sources while retaining localized descriptions and crops',()=>{
 const media=require(source+'/editorial-media.ts'),valid={source:'editorial',id:'setting-households',alt:'Description française',desktopFocal:{x:10,y:20},mobileFocal:{x:70,y:50}};assert.deepEqual(media.editorialMedia(valid),valid);
 for(const invalid of [{...valid,id:'invented-image'},{...valid,alt:''},{...valid,url:'https://attacker.invalid'},{...valid,desktopFocal:{x:Infinity,y:20}},{...valid,mobileFocal:{x:0,y:101}},{...valid,source:'native',id:'../../other'}])fault('INVALID_INPUT',()=>media.editorialMedia(invalid));
 for(const url of ['https://u:p@fixture.invalid/image','https://10.0.0.1/private','https://host.local/image','https://fixture.invalid/image?token=private','javascript:alert(1)'])fault('INVALID_INPUT',()=>media.editorialPublicUrl(url));assert.equal(media.editorialPublicUrl('/jobkix/editorial/home-hero.webp'),'/jobkix/editorial/home-hero.webp');
});
test('localized parameters, Arabic plural categories and locale numbers execute without English fallback',()=>{
 const {t,opportunityCount}=require(source+'/i18n.ts');for(const locale of c.LOCALES){assert.ok(t(locale,'receipt',{reference:'JK-FIXTURE'}).includes('JK-FIXTURE'));for(const count of [0,1,2,3,11,102])assert.ok(opportunityCount(locale,count));}
 assert.notEqual(opportunityCount('ar',0),opportunityCount('ar',1));assert.notEqual(opportunityCount('ar',1),opportunityCount('ar',2));assert.match(opportunityCount('en',1),/1 opportunity$/);assert.match(opportunityCount('en',2),/2 opportunities$/);
 fault('INVALID_INPUT',()=>opportunityCount('en',-1));fault('DEPENDENCY_UNAVAILABLE',()=>t('en','receipt'));
});
test('search contracts preserve independent origin/destination, exact filters and safe pagination',()=>{
 const f=require(source+'/discovery.ts');const filters=f.readFilters(new URLSearchParams('origin=FR&destination=GB&reach=domestic&q=nanny&workSchedule=part_time&salaryMinimum=20&currency=GBP&salaryUnit=hour'));
 assert.equal(filters.origin,'FR');assert.equal(filters.destination,'GB');assert.equal(filters.reach,'domestic');assert.match(f.searchHref('ar',filters,{page:'2'}),/^\/jobkix\/ar\/jobs\?/);
 const studio=new URL(f.searchHref('ar',filters,{page:'2'},'career/discovery'),'https://fixture.invalid');assert.equal(studio.pathname,'/jobkix/ar/career/discovery');assert.equal(studio.searchParams.get('origin'),'FR');assert.equal(studio.searchParams.get('destination'),'GB');assert.equal(studio.searchParams.get('page'),'2');
 for(const query of ['page=0','page=1.5','origin=ZZ','q=one&q=two','workSchedule=permanent','setting=made-up','salaryMinimum=20','salaryMinimum=NaN&currency=GBP&salaryUnit=hour','salaryMinimum=20&currency=ZZZ&salaryUnit=hour'])fault('INVALID_INPUT',()=>f.readFilters(new URLSearchParams(query)));
});
test('language switching rewrites nested authenticated return context without losing application intent',()=>{
 const url=r.switchLocale('/jobkix/fr/candidate/sign-in?next='+encodeURIComponent('/jobkix/fr/jobs/'+vacancy.id+'?apply=1'),'ar'),parsed=new URL(url,'https://fixture.invalid');assert.equal(parsed.pathname,'/jobkix/ar/candidate/sign-in');assert.equal(parsed.searchParams.get('next'),'/jobkix/ar/jobs/'+vacancy.id+'?apply=1');
});
test('JSON command boundary enforces origin, content type, object shape, bytes and safe errors',async()=>{
 const http=require(source+'/server/http.ts');
 const valid=new Request('https://fixture.invalid/api/jobkix/commands',{method:'POST',headers:{Origin:'https://fixture.invalid','Content-Type':'application/json'},body:JSON.stringify({action:'test'})});assert.deepEqual(await http.requestJson(valid),{action:'test'});
 for(const [origin,body,contentType,code] of [['https://attacker.invalid','{}','application/json','FORBIDDEN'],['https://fixture.invalid','[]','application/json','INVALID_INPUT'],['https://fixture.invalid','{"x":"1234567890"}','application/json','INVALID_INPUT'],['https://fixture.invalid','{}','text/plain','INVALID_INPUT']]){
  await assert.rejects(http.requestJson(new Request('https://fixture.invalid/api/jobkix/commands',{method:'POST',headers:{Origin:origin,'Content-Type':contentType},body}),10),error=>error.code===code);
 }
 const response=http.failure(new Error('PRIVATE_TOKEN_MARKER'));assert.equal(response.status,503);assert.equal(response.headers.get('Cache-Control'),'private, no-store, max-age=0');assert.equal((await response.text()).includes('PRIVATE_TOKEN_MARKER'),false);
});

test('explicit IANA wall times round-trip and reject DST gaps, repeats and impossible dates',()=>{
 const z=require(source+'/zoned-time.ts');
 for(const [local,zone,utc] of [['2026-01-15T10:30','Asia/Kathmandu','2026-01-15T04:45:00.000Z'],['2026-07-15T09:00','America/New_York','2026-07-15T13:00:00.000Z'],['2026-01-15T09:00','Australia/Lord_Howe','2026-01-14T22:00:00.000Z']]){assert.equal(z.wallTimeInstant(local,zone),utc);assert.equal(z.wallTime(utc,zone),local);}
 fault('INVALID_INPUT',()=>z.wallTimeInstant('2026-03-08T02:30','America/New_York'));
 fault('INVALID_INPUT',()=>z.wallTimeInstant('2026-11-01T01:30','America/New_York'));
 fault('INVALID_INPUT',()=>z.wallTimeInstant('2026-02-30T10:00','UTC'));
 fault('INVALID_INPUT',()=>z.wallTimeInstant('2026-01-15T09:00','Invented/Zone'));
});
test('native taxonomy query rejects ambiguous parameters and unsafe pagination without losing the selected locale',()=>{
 const {taxonomyQuery}=require(source+'/taxonomy-query.ts');assert.deepEqual(taxonomyQuery(new URLSearchParams({kind:'occupation',locale:'tl',q:'care',page:'2'})),{kind:'occupation',locale:'tl',q:'care',page:2});
 for(const raw of ['kind=occupation&kind=setting&locale=en','kind=occupation&locale=en&page=1e2','kind=occupation&locale=en&page=0','kind=occupation&locale=en&private=true','kind=unknown&locale=en','kind=occupation&locale=xx'])fault('INVALID_INPUT',()=>taxonomyQuery(new URLSearchParams(raw)));
});
test('vacancy editor preserves questions, native bindings and fractional hours across reload and normalization',()=>{
 const {vacancyFields,vacancyContent}=require(source+'/vacancy-form.ts'),{vacancySaveInput}=require(source+'/vacancy-input.ts');
 const fields=vacancyFields({title:'Isolated care vacancy',setting_id:'households',occupation_id:'nanny',original_locale:'fr',country:'GB',city:'Approximate city',description:'Isolated original-language job text',duties:['Professional care'],requirements:['Relevant evidence'],benefits:[],hours_per_week:20.25,languages:['fr'],age_cohorts:['preschool'],work_schedule:'part_time',contract_type:'permanent',work_location:'on_site',live_in:false,required_document:true},[{id:id(500),label:'Isolated yes/no question',kind:'yes_no',required:true,max_length:3}],'en');
 const content=vacancyContent(fields,id(3));assert.equal(content.hoursPerWeek,20.25);assert.equal(content.originalLocale,'fr');assert.equal(content.questions[0].id,id(500));assert.equal(content.questions[0].maxLength,3);assert.equal(content.compensation,null);
 assert.equal(vacancySaveInput({...content,id:id(4)}).id,id(4));fault('INVALID_INPUT',()=>vacancySaveInput({...content,id:id(4),questions:[content.questions[0],content.questions[0]]}));fault('INVALID_INPUT',()=>vacancySaveInput({...content,id:id(4),questions:[{...content.questions[0],maxLength:2}]}));fault('INVALID_INPUT',()=>vacancySaveInput({...content,id:id(4),hoursPerWeek:169}));
});
test('recruiter stage options cannot manufacture an offer or candidate acceptance',()=>{for(const state of ['submitted','acknowledged','under_review','shortlisted','interview','offer','on_hold','hired','declined','withdrawn','closed_due_to_vacancy'])assert.equal(p.recruiterStages(state).some(value=>value==='hired'||value==='offer'),false);});

test('account copy has nonempty seven-language values without parameter drift',()=>{
 const {ACCOUNT_COPY}=require(source+'/account-copy.ts');
 for(const [key,translations] of Object.entries(ACCOUNT_COPY))for(const locale of c.LOCALES){assert.equal(typeof translations[locale],'string',key+':'+locale);assert.ok(translations[locale].trim().length>0,key+':'+locale);assert.deepEqual(translations[locale].match(/\{\w+\}/g)||[],translations.en.match(/\{\w+\}/g)||[],key+':'+locale);}
});
test('saved searches reuse strict native filters and exclude pagination',()=>{
 const {savedSearchFilters}=require(source+'/account-input.ts');
 assert.deepEqual(savedSearchFilters({q:'nanny',origin:'FR',reach:'abroad',page:'3'}),{q:'nanny',origin:'FR',reach:'abroad'});
 for(const value of [[],null,{unknown:'value'},{q:42},{pageSize:'24'},{origin:'France'},{reach:'fictional'}])fault('INVALID_INPUT',()=>savedSearchFilters(value));
});
test('case recovery accepts only a frozen supported command and exact version/key',()=>{
 const {caseIntent}=require(source+'/case-draft.ts');const value={action:'case.reply',payload:{id:id(1),description:'Private fixture reply'},version:2,key:'case-recovery-fixture-key'};
 assert.deepEqual(caseIntent(value),value);assert.equal(caseIntent(null),null);
 for(const changed of [{action:'case.delete'},{version:-1},{key:'short'},{payload:[]}])fault('INVALID_INPUT',()=>caseIntent({...value,...changed}));
});

test('hiring analytics windows validate calendar dates and exact bounded UTC ranges',()=>{
 const {analyticsWindow}=require(source+'/analytics-query.ts');
 assert.deepEqual(analyticsWindow({},new Date('2026-10-21T12:05:00Z')),{from:'2026-09-22T00:00:00.000Z',until:'2026-10-22T00:00:00.000Z'});
 assert.equal(analyticsWindow({from:'2024-02-29',until:'2024-03-01'}).from,'2024-02-29T00:00:00.000Z');
 for(const query of [{from:'2026-02-29',until:'2026-03-01'},{from:'2026-10-01',until:'2026-10-01'},{from:'2020-01-01',until:'2026-01-01'},{from:['2026-01-01']}])fault('INVALID_INPUT',()=>analyticsWindow(query));
});
test('talent query and durable intents keep native filters and reject ambiguous or unsupported inputs',()=>{
 const {talentQuery}=require(source+'/talent-query.ts'),{talentIntent}=require(source+'/talent-draft.ts'),{teamIntent}=require(source+'/team-draft.ts');
 assert.deepEqual(talentQuery({q:'Care',country:'GB',experience:'recorded',page:'2'}),{filters:{q:'Care',country:'GB',experience:'recorded'},page:2});
 for(const query of [{country:'United Kingdom'},{page:'2.5'},{q:['x','y']},{experience:'verified'}])fault('INVALID_INPUT',()=>talentQuery(query));
 const base={payload:{id:id(4)},version:1,key:'durable-private-fixture'};
 assert.equal(teamIntent({...base,action:'team.revoke'}).action,'team.revoke');assert.equal(talentIntent({...base,action:'pool.remove'}).action,'pool.remove');
 fault('INVALID_INPUT',()=>teamIntent({...base,action:'pool.remove'}));fault('INVALID_INPUT',()=>talentIntent({...base,action:'team.change'}));
});
test('workforce copy is complete for seven authored languages',()=>{
 const {WORKFORCE_COPY}=require(source+'/workforce-copy.ts');for(const translations of Object.values(WORKFORCE_COPY))for(const locale of c.LOCALES)assert.ok(translations[locale]?.trim());
});

test('public journey copy preserves seven authored languages',()=>{const {JOURNEY_COPY}=require(source+'/journey-copy.ts');for(const translations of Object.values(JOURNEY_COPY))for(const locale of c.LOCALES)assert.ok(translations[locale]?.trim());});

test('guest receipt credentials are purpose-scoped, signed, expiring and reject tampering',()=>{
 const {guestMac,issueGuestCredential,readGuestCredential}=require(source+'/guest-credential.ts'),secret='ISOLATED_TEST_SECRET_'.repeat(3),token='a'.repeat(64),now=Date.now(),cookie=issueGuestCredential(secret,token,now+1000);
 assert.equal(readGuestCredential(secret,cookie,now),token);assert.equal(readGuestCredential(secret,cookie,now+1000),null);assert.equal(readGuestCredential(secret+'different',cookie,now),null);
 for(const value of [undefined,'unsafe',cookie+'.extra',cookie.replace(/^./,'z'),cookie.slice(0,-1)+'z'])assert.equal(readGuestCredential(secret,value,now),null);
 assert.notEqual(guestMac(secret,'receipt',token),guestMac(secret,'cookie',token));fault('DEPENDENCY_UNAVAILABLE',()=>guestMac('short','receipt',token));
});
test('guest case inputs normalize safely and retain partial private drafts without accepting unsafe effects',()=>{
 const {guestCasePayload,guestDraft,guestIntent}=require(source+'/guest-case.ts'),payload={kind:'report',locale:'ar',category:'vacancy',description:'Isolated private report.',email:'REPORTER@FIXTURE.INVALID',relatedUrl:'https://fixture.invalid/jobs/1',unknownSecret:'not-stored'};
 const valid=guestCasePayload('case.create',payload);assert.equal(valid.email,'reporter@fixture.invalid');assert.equal('unknownSecret' in valid,false);
 for(const change of [{email:'invalid'},{relatedUrl:'javascript:alert(1)'},{relatedUrl:'https://user:pass@fixture.invalid'},{kind:'verification'},{description:'short'}])fault('INVALID_INPUT',()=>guestCasePayload('case.create',{...payload,...change}));
 const draft=guestDraft({fields:{action:'case.create',payload:{...payload,description:'',email:'unfinished@',relatedUrl:'https://'}},intent:null});assert.equal(draft.fields.payload.description,'');assert.equal('unknownSecret' in draft.fields.payload,false);assert.equal(draft.intent,null);
 fault('INVALID_INPUT',()=>guestIntent({action:'privacy.request',payload,version:0,key:'guest-fixture-key'}));
});
test('reviewed publication links permit explicit safe contacts and reject credentials or executable schemes',()=>{
 const {reviewedLink,reviewedSegments}=require(source+'/reviewed-links.ts');
 for(const value of ['javascript:alert(1)','data:text/html,a','https://user:secret@fixture.invalid','mailto:support@fixture.invalid?bcc=other@fixture.invalid','tel:555'])assert.equal(reviewedLink(value),null,value);
 assert.equal(reviewedLink('mailto:approved@fixture.invalid'),'mailto:approved@fixture.invalid');assert.equal(reviewedLink('tel:+442012345678'),'tel:+442012345678');assert.equal(reviewedLink('https://fixture.invalid/help'),'https://fixture.invalid/help');
 const value='Contact mailto:approved@fixture.invalid. Read https://fixture.invalid/help, please.';assert.equal(reviewedSegments(value).map(row=>row.text).join(''),value);assert.equal(reviewedSegments(value).filter(row=>row.href).length,2);
});
test('private file-library props exclude storage keys, proofs and unneeded sensitive fields',()=>{
 const {fileLibraryRows}=require(source+'/file-library.ts'),rows=fileLibraryRows([{id:id(1),filename:'Private fixture.pdf',purpose:'cv',object_key:'MUST_NOT_ENTER_RSC',sha256:'PRIVATE_CHECKSUM',scanner_reference:'PRIVATE_SCAN',owner_user_id:id(2),upload_key:'owned-resume-key'}]);
 assert.equal(rows[0].filename,'Private fixture.pdf');assert.equal(rows[0].upload_key,'owned-resume-key');for(const key of ['object_key','sha256','scanner_reference','owner_user_id'])assert.equal(key in rows[0],false,key);
});
test('public support copy covers seven authored languages and excludes reference billing expansion',()=>{const {SUPPORT_COPY,REPORT_CATEGORIES}=require(source+'/support-copy.ts');for(const translations of Object.values(SUPPORT_COPY))for(const locale of c.LOCALES)assert.ok(translations[locale]?.trim());assert.equal(REPORT_CATEGORIES.length,6);assert.equal(REPORT_CATEGORIES.includes('billing'),false);});

test('country discovery reuses native codes and verified region groupings without implying unavailable data',()=>{
 const {nativeCountry,countryDirectory,destinationFilters}=require(source+'/geography.ts'),{countryRegion}=require(source+'/country-regions.ts');assert.equal(nativeCountry('fr'),'FR');fault('NOT_FOUND',()=>nativeCountry('made-up'));assert.equal(countryRegion('FR'),'150');assert.equal(countryRegion('AE'),'145');assert.equal(countryRegion('US'),'021');assert.equal(countryRegion('MX'),'419');
 const unknown=countryDirectory('en',null,'France','',1);assert.equal(unknown.items[0].code,'FR');assert.equal(unknown.items[0].count,null);
 assert.equal(countryDirectory('en',[{code:'FR',count:2}],'France','150',1).items[0].count,2);assert.equal(countryDirectory('en',[],'France','002',1).total,0);fault('INVALID_INPUT',()=>countryDirectory('en',[],'','invented',1));
 assert.equal(destinationFilters({origin:'FR',reach:'domestic'},'GB').reach,'worldwide');assert.equal(destinationFilters({origin:'FR',reach:'domestic'},'FR').reach,'domestic');assert.equal(destinationFilters({origin:'FR',reach:'abroad'},'GB').reach,'abroad');
});
test('report context preserves actual native public URLs and rejects credentials or unsafe authorities',()=>{
 const {reportContextUrl}=require(source+'/guest-case.ts');for(const value of ['/jobkix/en/resources/fixture','/jobkix/fr/employers/'+id(1),'https://fixture.invalid/reported-page'])assert.equal(reportContextUrl(value),value);
 for(const value of ['//attacker.invalid','javascript:alert(1)','/admin/private','/jobkix/en/../../admin','/jobkix/en/auth/callback?token_hash=private','https://fixture.invalid/?password=private'])fault('INVALID_INPUT',()=>reportContextUrl(value));
});

test('reputation query and receipt normalization reject unsafe filters and unsupported effects',()=>{
 const {reputationFilters}=require(source+'/reputation-query.ts'),{reputationIntent}=require(source+'/reputation-draft.ts');assert.deepEqual(reputationFilters({country:'GB',rating:'4',currency:'GBP'}),{country:'GB',rating:'4',currency:'GBP'});
 for(const query of [{country:'XX'},{rating:'6'},{currency:'ZZZ'},{unit:'minute'},{organizationId:'../../private'},{term:['a','b']}])fault('INVALID_INPUT',()=>reputationFilters(query));
 const value={action:'reputation.withdraw',payload:{id:id(1)},version:2,key:'private-reputation-fixture'};assert.deepEqual(reputationIntent(value),value);fault('INVALID_INPUT',()=>reputationIntent({...value,action:'reputation.publish'}));
});
test('reputation copy has complete seven-language entries without silently changing source terminology',()=>{const {REPUTATION_COPY}=require(source+'/reputation-copy.ts');for(const translations of Object.values(REPUTATION_COPY))for(const locale of c.LOCALES)assert.ok(translations[locale]?.trim());});

test('pipeline selections retain exact versions and reject duplicate, terminal or fabricated effects',()=>{
 const {pipelinePayload,pipelineIntent,commonPipelineStages}=require(source+'/pipeline.ts'),payload={organizationId:id(1),applications:[{id:id(2),version:4}],state:'under_review',reason:'Manually reviewed professional stage change'};
 assert.deepEqual(pipelinePayload(payload),payload);const intent={action:'application.bulk_stage',payload,version:0,key:'isolated-pipeline-receipt'};assert.deepEqual(pipelineIntent(intent),intent);assert.deepEqual(commonPipelineStages(['submitted','acknowledged']),['under_review','shortlisted','on_hold']);
 for(const invalid of [{...payload,applications:[]},{...payload,applications:[payload.applications[0],payload.applications[0]]},{...payload,state:'hired'},{...payload,state:'declined'},{...payload,applications:[{id:id(2),version:0}]},{...payload,reason:'short'}])fault('INVALID_INPUT',()=>pipelinePayload(invalid));
 const {PIPELINE_COPY}=require(source+'/pipeline-copy.ts');for(const translations of Object.values(PIPELINE_COPY))for(const locale of c.LOCALES)assert.ok(translations[locale]?.trim());
});

test('editorial previews bind saved documents to their exact native public family',()=>{
 const {editorialPreviewTarget:target}=require(source+'/editorial-preview.ts');
 for(const [kind,slug,result] of [['front','home',{kind:'home'}],['front','careers-abroad',{kind:'abroad'}],['country','country/fr',{kind:'country',country:'fr'}],['city','city/fr/0123456789abcdef',{kind:'city',country:'fr',cityKey:'0123456789abcdef'}],['front','employer/'+id(1),{kind:'employer',id:id(1)}],['trust','trust-safety',{kind:'support',screen:'P20'}],['trust','reputation-methodology',{kind:'methodology'}],['help','contact',{kind:'support',screen:'P23'}],['help','account-recovery',{kind:'help',slug:'account-recovery'}],['front','for-employers',{kind:'journey',screen:'P18'}]])assert.deepEqual(target(kind,slug),result);
 for(const [kind,slug] of [['front','fabricated-world'],['city','city/fr/private'],['front','employer/../../private'],['country','country/fr/extra'],['trust','unbound-policy'],['guide','../private']])assert.equal(target(kind,slug),null);
});

test('JOBKIX sitemap integration preserves native robots rules and rejects private or unsafe entries',()=>{
 const {appendJobkixSitemap,safeSitemapPath,sitemapXml,sitemapIndexXml}=require(source+'/sitemap.ts'),baseline={rules:{userAgent:'*',disallow:['/api/','/admin/']},sitemap:'https://fixture.invalid/sitemap.xml',host:'https://fixture.invalid'};
 const extended=appendJobkixSitemap(baseline);assert.deepEqual(extended.rules,baseline.rules);assert.equal(extended.host,baseline.host);assert.deepEqual(extended.sitemap,[baseline.sitemap,'https://fixture.invalid/jobkix/sitemap.xml']);assert.equal(baseline.sitemap,'https://fixture.invalid/sitemap.xml');const disabled={rules:{userAgent:'*',disallow:['/']}};assert.equal(appendJobkixSitemap(disabled),disabled);assert.deepEqual(appendJobkixSitemap(extended),extended);
 for(const path of ['/jobkix/en/jobs/'+id(1),'/jobkix/ar/help/account-recovery','/jobkix/fr/countries/fr'])assert.equal(safeSitemapPath(path),path);
 for(const path of ['/jobkix/en/career','/jobkix/en/hiring','/jobkix/en/auth/reset','/jobkix/en/preview/'+id(1),'/jobkix/en/jobs?token=private','https://attacker.invalid/jobkix/en','/jobkix/en/../../admin','/jobkix/en/countries/xx','/jobkix/en/jobs/not-a-record'])assert.equal(safeSitemapPath(path),null);
 const xml=sitemapXml('https://fixture.invalid',[{path:'/jobkix/en/jobs/'+id(1),modified:'2026-10-20T12:00:00Z'},{path:'/jobkix/en/career',modified:'private'}]);assert.ok(xml.includes('<lastmod>2026-10-20T12:00:00.000Z</lastmod>'));assert.equal(xml.includes('/career'),false);assert.equal((sitemapIndexXml('https://fixture.invalid',2001).match(/<sitemap>/g)||[]).length,3);assert.throws(()=>sitemapXml('https://user:password@fixture.invalid',[]));
});

const siteDraft=require(source+'/site-draft.ts');
test('site intent recovery keeps the original key, payload and expected version and rejects unrelated actions',()=>{
 const value={action:'site.create',payload:{organizationId:id(3),label:'Private site draft'},version:0,key:'site-key-1234567890'};
 assert.deepEqual(siteDraft.siteIntent(value),value);assert.equal(siteDraft.siteIntent(null),null);
 for(const invalid of [{...value,action:'team.invite'},{...value,version:-1},{...value,key:'short'},{...value,payload:[]}])fault('INVALID_INPUT',()=>siteDraft.siteIntent(invalid));
});
