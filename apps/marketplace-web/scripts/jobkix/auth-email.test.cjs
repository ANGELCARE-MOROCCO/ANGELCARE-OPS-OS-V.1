/** Composition only. Never contacts Auth, SMTP, production data or environment files. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),ts=require('typescript');
const test=require('node:test'),assert=require('node:assert/strict');
const app=path.resolve(__dirname,'../..');
const allowed=['angelcare-marketplace/jobkix/','angelcare-marketplace/customer-commerce/auth-email-native/','angelcare-marketplace/customer-commerce/customer-email-design/','lib/email-os-core/operational-mailboxes.ts'];
require.extensions['.ts']=(module,file)=>{const relative=path.relative(app,file);if(!allowed.some(prefix=>relative.startsWith(prefix)))throw Error('Test loader scope refused: '+relative);module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);};
const nativePath=path.join(app,'angelcare-marketplace/customer-commerce/auth-email-native/messages.ts');
const current=require(nativePath),jobkix=require(path.join(app,'angelcare-marketplace/jobkix/server/auth-email.ts'));
const baseline=JSON.parse(fs.readFileSync(path.join(app,'docs/jobkix/evidence/customer-email-baseline.json'),'utf8'));
const config={authOrigin:'https://auth.fixture.invalid',marketplaceOrigin:'https://marketplace.fixture.invalid'};
const job=(locale,action='signup')=>({id:'fixture-delivery',lease_token:'fixture-lease',action,recipient_slot:'primary',attempts:0,payload:{user:{id:'fixture-user',email:'candidate@fixture.invalid',user_metadata:{locale}},email_data:{email_action_type:action,token_hash:'a'.repeat(64),redirect_to:`https://marketplace.fixture.invalid/jobkix/${locale}/auth/callback?next=${encodeURIComponent(`/jobkix/${locale}/jobs/10000000-0000-4000-8000-000000000001?apply=1`)}`}}});
for(const locale of ['en','fr','es','hi','tl','id','ar'])test('JOBKIX authentication email links and authored copy: '+locale,()=>{
 for(const action of ['signup','recovery','magiclink','invite']){
  const input=job(locale,action),message=jobkix.composeJobkixAuthEmail(input,config);assert.equal(message.locale,locale);assert.match(message.subject,/^JOBKIX/);assert.match(message.html,new RegExp(`lang="${locale}"`));assert.match(message.html,new RegExp(`dir="${locale==='ar'?'rtl':'ltr'}"`));
  const links=[...message.text.matchAll(/https:\/\/[^\s]+/g)].map(match=>new URL(match[0]));const callback=links.find(link=>link.pathname.endsWith('/auth/callback'));assert.ok(callback);assert.equal(callback.origin,config.marketplaceOrigin);assert.equal(callback.pathname,`/jobkix/${locale}/auth/callback`);assert.equal(callback.searchParams.get('token_hash'),'a'.repeat(64));assert.equal(callback.searchParams.get('type'),action);assert.equal(callback.searchParams.get('next'),`/jobkix/${locale}/jobs/10000000-0000-4000-8000-000000000001?apply=1`);
  assert.equal(message.sender,'supports@angelcarehub.ma');assert.equal(message.recipient,'candidate@fixture.invalid');
 }
});
test('JOBKIX dispatcher preserves every existing customer email body byte for byte',()=>{
 for(const locale of ['en','fr','ar'])for(const action of ['signup','recovery','magiclink','invite','reauthentication','password_changed_notification']){
  const input=job(locale,action);input.payload.email_data.redirect_to='https://marketplace.fixture.invalid/angelcare-marketplace/auth/callback';input.payload.email_data.token='123456';
  assert.equal(jobkix.jobkixAuthLocale(input),null);const {link,...message}=current.composeAuthEmail(input,config);assert.equal(crypto.createHash('sha256').update(JSON.stringify(message)).digest('hex'),baseline.cases[locale+':'+action]);
 }
});
test('JOBKIX rendering rejects unsafe origins, tokens, unrelated callbacks and mismatched actions',()=>{
 let input=job('en');input.payload.email_data.redirect_to='https://attacker.invalid/jobkix/en/auth/callback';assert.throws(()=>jobkix.composeJobkixAuthEmail(input,config),/REDIRECT_NOT_ALLOWED/);
 input=job('en');input.payload.email_data.token_hash='bad';assert.throws(()=>jobkix.composeJobkixAuthEmail(input,config),/TOKEN_HASH_INVALID/);
 input=job('en');input.payload.email_data.redirect_to='https://marketplace.fixture.invalid/jobkix/xx/auth/callback';assert.equal(jobkix.jobkixAuthLocale(input),null);assert.throws(()=>jobkix.composeJobkixAuthEmail(input,config),/CONTEXT_INVALID/);
 input=job('en');input.payload.email_data.email_action_type='recovery';assert.throws(()=>jobkix.composeJobkixAuthEmail(input,config),/PAYLOAD_INVALID/);
});
test('email address change retains native dual-recipient token ownership',()=>{
 const input=job('ar','email_change');input.payload.user.new_email='changed@fixture.invalid';input.payload.email_data.token_hash_new='b'.repeat(64);
 input.recipient_slot='current';let message=jobkix.composeJobkixAuthEmail(input,config);assert.equal(message.recipient,'candidate@fixture.invalid');assert.match(message.text,new RegExp('token_hash='+'b'.repeat(64)));
 input.recipient_slot='new';message=jobkix.composeJobkixAuthEmail(input,config);assert.equal(message.recipient,'changed@fixture.invalid');assert.match(message.text,new RegExp('token_hash='+'a'.repeat(64)));
});
test('unsafe nested return context is replaced by the native JOBKIX account destination',()=>{
 const input=job('fr');input.payload.email_data.redirect_to='https://marketplace.fixture.invalid/jobkix/fr/auth/callback?next=https%3A%2F%2Fattacker.invalid';const result=jobkix.composeJobkixAuthEmail(input,config);assert.equal(result.text.includes('attacker.invalid'),false);assert.match(result.text,/next=%2Fjobkix%2Ffr%2Fcareer/);
});

const operational=require(path.join(app,'angelcare-marketplace/jobkix/notification.ts'));
const privateId=n=>`30000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
test('operational messages localize private canonical destinations without including application content',()=>{
 for(const locale of ['en','fr','es','hi','tl','id','ar'])for(const candidate of [true,false]){
  const context={locale,recipient:'recipient@fixture.invalid',type:'application.submitted',applicationId:privateId(1),organizationId:privateId(2),candidate,privateAnswers:'DO_NOT_COPY_PRIVATE_ANSWERS'};
  const mail=operational.composeOperationalMail(context,'https://marketplace.fixture.invalid');assert.equal(mail.locale,locale);assert.equal(mail.html.includes('DO_NOT_COPY_PRIVATE_ANSWERS'),false);assert.ok(mail.html.includes(`lang="${locale}"`));assert.ok(mail.html.includes(`dir="${locale==='ar'?'rtl':'ltr'}"`));
  const url=new URL(mail.text.match(/https:\/\/[^\s]+/)[0]);assert.equal(url.pathname,candidate?`/jobkix/${locale}/career/applications/${privateId(1)}`:`/jobkix/${locale}/hiring/applications`);if(!candidate){assert.equal(url.searchParams.get('organization'),privateId(2));assert.equal(url.searchParams.get('application'),privateId(1));}
 }
});
test('team mail keeps intended invitation context and refuses unsafe origins and malformed identifiers',()=>{
 const context={locale:'tl',recipient:'intended@fixture.invalid',type:'team.invited',invitationId:privateId(3),token:'f'.repeat(64)};
 const message=operational.composeOperationalMail(context,'https://marketplace.fixture.invalid'),url=new URL(message.text.match(/https:\/\/[^\s]+/)[0]);assert.equal(url.pathname,'/jobkix/tl/onboarding');assert.equal(url.searchParams.get('intent'),'hirer');assert.equal(url.searchParams.get('invitation'),privateId(3));assert.equal(url.searchParams.get('token'),'f'.repeat(64));
 for(const origin of ['http://example.invalid','https://user:pass@example.invalid','https://example.invalid/path','https://example.invalid/?secret=1'])assert.throws(()=>operational.composeOperationalMail(context,origin));
 for(const change of [{recipient:'invalid'},{locale:'xx'},{invitationId:'../../private'},{token:'short'}])assert.throws(()=>operational.composeOperationalMail({...context,...change},'https://marketplace.fixture.invalid'));
});

test('saved-search messages use native filters in every locale with authenticated alert-management links',()=>{
 for(const locale of ['en','fr','es','hi','tl','id','ar']){
  const context={locale,recipient:'candidate@fixture.invalid',type:'search.match',savedSearchId:privateId(1),filters:{origin:'FR',destination:'GB',reach:'abroad',occupation:'nanny'}},message=operational.composeOperationalMail(context,'https://marketplace.fixture.invalid');
  const destination=new URL(operational.notificationDestination(context),'https://marketplace.fixture.invalid');assert.equal(destination.pathname,'/jobkix/'+locale+'/career/discovery');assert.equal(destination.searchParams.get('origin'),'FR');assert.equal(destination.searchParams.get('reach'),'abroad');assert.ok(message.text.includes('/jobkix/'+locale+'/career/alerts'));assert.equal(message.text.includes('candidate_user_id'),false);
 }
 assert.throws(()=>operational.notificationDestination({locale:'en',type:'search.match',savedSearchId:privateId(1),filters:{redirect:'https://attacker.invalid'}}));
});
