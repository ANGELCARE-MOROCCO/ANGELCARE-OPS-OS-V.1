/** Actual route handlers with isolated Auth/repository adapters; no network or credentials. */
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const test=require('node:test'),assert=require('node:assert/strict');
const app=path.resolve(__dirname,'../..'),root=path.join(app,'angelcare-marketplace/jobkix');
function loader(mocks={}){
 const cache=new Map();
 function load(file){
  if(cache.has(file))return cache.get(file).exports;
  const module={exports:{}};cache.set(file,module);
  const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const scopedRequire=name=>{
   if(Object.hasOwn(mocks,name))return mocks[name];
   if(name.endsWith('.module.css'))return {default:{}};
   if(name.startsWith('@/'))return load(path.join(app,name.slice(2))+'.ts');
   if(name.startsWith('.')){const base=path.resolve(path.dirname(file),name);return load(fs.existsSync(base+'.ts')?base+'.ts':base+'.tsx');}
   return require(name);
  };
  new Function('require','module','exports',source)(scopedRequire,module,module.exports);return module.exports;
 }
 return load;
}
const navigation=loader()(path.join(root,'auth-navigation.ts'));
const locales=['en','fr','es','hi','tl','id','ar'];
test('role and safe destination survive confirmation, onboarding and recovery in seven locales',()=>{
 for(const locale of locales)for(const intent of ['candidate','hirer']){
  const next=`/jobkix/${locale}/${intent==='hirer'?'hiring/vacancies/new':'jobs/fixture?apply=1'}`;
  const signup=new URL(navigation.authCallbackDestination(locale,intent,next,'signup'),'https://fixture.invalid');
  assert.equal(signup.pathname,`/jobkix/${locale}/onboarding`);assert.equal(signup.searchParams.get('intent'),intent);assert.equal(signup.searchParams.get('next'),next);
  const recovery=navigation.authCallbackDestination(locale,intent,next,'recovery'),url=new URL(recovery,'https://fixture.invalid');
  assert.equal(url.pathname,`/jobkix/${locale}/auth/reset`);assert.equal(url.searchParams.get('next'),next);assert.equal(url.searchParams.get('intent'),intent);
  assert.equal(navigation.authCallbackDestination(locale,intent,recovery,'recovery'),recovery);
  assert.equal(navigation.authCallbackDestination(locale,intent,'https://attacker.invalid','magiclink'),`/jobkix/${locale}/${intent==='hirer'?'hiring':'career'}`);
 }
 assert.equal(navigation.authIntent(undefined,'/jobkix/fr/hiring/vacancies'),'hirer');
 assert.equal(navigation.authIntent(undefined,'https://attacker.invalid/jobkix/fr/hiring'),'candidate');
});
function handlers({account=null,authError=null,session=null,terms={revision:'a'.repeat(64)},accountError=null}={}){
 const calls=[];
 const client={auth:{
  signUp:async input=>(calls.push(['signup',input]),{error:authError,data:{session}}),
  signInWithPassword:async input=>(calls.push(['signin',input]),{error:authError,data:{user:{id:'fixture'}}}),
  resetPasswordForEmail:async (...input)=>(calls.push(['recovery',...input]),{error:authError}),
  resend:async input=>(calls.push(['resend',input]),{error:authError}),
  verifyOtp:async input=>(calls.push(['otp',input]),{error:authError}),
  exchangeCodeForSession:async code=>(calls.push(['code',code]),{error:authError}),
 },from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:account,error:accountError})})})})};
 const load=loader({
  '@/lib/supabase/server':{createUserClient:async()=>client},
  '@/angelcare-marketplace/jobkix/server/repository':{accountTerms:async()=>terms},
  '@/angelcare-marketplace/jobkix/server/http':{
   requestJson:request=>request.json(),requestOrigin:request=>new URL(request.url).origin,PRIVATE_HEADERS:{'cache-control':'no-store'},
   failure:error=>Response.json({ok:false,error:{code:error.code}},{status:400}),
  },
 });
 return {calls,POST:load(path.join(app,'app/api/jobkix/auth/[action]/route.ts')).POST,GET:load(path.join(app,'app/jobkix/[locale]/auth/callback/route.ts')).GET};
}
const payload={locale:'en',intent:'hirer',email:'employer@fixture.invalid',password:'fixture-password-123',fullName:'Fixture Employer',accepted:true,adultConfirmed:true,consentRevision:'a'.repeat(64),returnTo:'/jobkix/en/hiring/vacancies/new'};
const post=(handler,action,data=payload)=>handler.POST(new Request('https://fixture.invalid/api/jobkix/auth/'+action,{method:'POST',body:JSON.stringify(data)}),{params:Promise.resolve({action})});
test('sign-up preserves employer context in both immediate-session and confirmation-required flows',async()=>{
 for(const session of [null,{access_token:'fixture'}]){
  const h=handlers({session}),response=await post(h,'sign-up'),body=await response.json();assert.equal(body.ok,true);
  const next=new URL(body.next,'https://fixture.invalid');assert.equal(next.pathname,session?'/jobkix/en/onboarding':'/jobkix/en/auth/confirmation');assert.equal(next.searchParams.get('intent'),'hirer');
  const callback=new URL(h.calls[0][1].options.emailRedirectTo);assert.equal(callback.searchParams.get('intent'),'hirer');assert.equal(callback.searchParams.get('type'),'signup');assert.equal(callback.searchParams.get('next'),payload.returnTo);
 }
});
test('registration refuses missing or changed reviewed consent before creating an identity',async()=>{
 for(const options of [{terms:null},{terms:{revision:'b'.repeat(64)}}]){const h=handlers(options),body=await(await post(h,'sign-up')).json();assert.equal(body.ok,false);assert.equal(h.calls.length,0);}
});
test('sign-in distinguishes first-time onboarding, existing accounts, restrictions and unconfirmed email',async()=>{
 for(const [options,expected] of [[{},'onboarding'],[{account:{status:'active'}},'destination'],[{account:{status:'suspended'}},'ACCOUNT_RESTRICTED'],[{authError:{code:'email_not_confirmed'}},'EMAIL_UNCONFIRMED'],[{accountError:{message:'unavailable'}},'DEPENDENCY_UNAVAILABLE']]){
  const h=handlers(options),body=await(await post(h,'sign-in')).json();
  if(expected==='onboarding')assert.match(body.next,/\/onboarding\?/);else if(expected==='destination')assert.equal(body.next,payload.returnTo);else assert.equal(body.error.code,expected);
 }
});
test('recovery and resend preserve role and original destination in provider callbacks',async()=>{
 for(const action of ['recovery','resend']){
  const h=handlers();assert.equal((await post(h,action)).status,200);
  const callback=new URL(action==='recovery'?h.calls[0][2].redirectTo:h.calls[0][1].options.emailRedirectTo);
  assert.equal(callback.searchParams.get('intent'),'hirer');assert.equal(callback.searchParams.get('type'),action==='recovery'?'recovery':'signup');
  if(action==='recovery'){const reset=new URL(callback.searchParams.get('next'),'https://fixture.invalid');assert.equal(reset.searchParams.get('next'),payload.returnTo);assert.equal(reset.searchParams.get('intent'),'hirer');}
 }
});
test('OTP and PKCE callbacks keep role and route signup through onboarding',async()=>{
 for(const credential of ['token_hash='+'a'.repeat(64),'code=fixture-code']){
  const h=handlers(),response=await h.GET(new Request('https://fixture.invalid/jobkix/en/auth/callback?'+credential+'&type=signup&intent=hirer&next='+encodeURIComponent(payload.returnTo)),{params:Promise.resolve({locale:'en'})});
  assert.equal(response.status,303);assert.equal(response.headers.get('cache-control'),'no-store');const next=new URL(response.headers.get('location'));assert.equal(next.pathname,'/jobkix/en/onboarding');assert.equal(next.searchParams.get('intent'),'hirer');assert.equal(next.searchParams.get('next'),payload.returnTo);
 }
});
test('failed recovery links offer recovery again while confirmation failures keep employer context',async()=>{
 for(const type of ['signup','recovery']){
  const h=handlers({authError:{code:'expired'}}),response=await h.GET(new Request('https://fixture.invalid/jobkix/fr/auth/callback?token_hash='+'a'.repeat(64)+'&type='+type+'&intent=hirer&next=%2Fjobkix%2Ffr%2Fhiring'),{params:Promise.resolve({locale:'fr'})}),next=new URL(response.headers.get('location'));
  assert.equal(next.pathname,type==='recovery'?'/jobkix/fr/auth/recovery':'/jobkix/fr/auth/confirmation');assert.equal(next.searchParams.get('intent'),'hirer');assert.equal(next.searchParams.get('state'),'link_failed');assert.equal(next.searchParams.has('token_hash'),false);
 }
 const h=handlers({authError:{code:'expired'}}),reset='/jobkix/en/auth/reset?intent=hirer&next='+encodeURIComponent(payload.returnTo);
 const response=await h.GET(new Request('https://fixture.invalid/jobkix/en/auth/callback?type=recovery&intent=hirer&next='+encodeURIComponent(reset)),{params:Promise.resolve({locale:'en'})});
 assert.equal(new URL(response.headers.get('location')).searchParams.get('next'),payload.returnTo);
});

function authPage({state='anonymous',profile=null,invitation=null}={}){
 const calls=[],redirect=target=>{throw Object.assign(new Error('redirect'),{target});};
 const load=loader({
  'next/navigation':{redirect},
  '../client/AuthForm':{AuthForm:()=>null},'../client/InvitationAcceptance':{InvitationAcceptance:()=>null},
  '../server/identity':{getJobkixSession:async()=>({state,userId:'fixture',timezone:'UTC'})},
  '../server/repository':{accountTerms:async()=>({revision:'a'.repeat(64),terms:{title:'Reviewed terms'},privacy:{title:'Reviewed privacy'}}),invitationPreview:async(...args)=>(calls.push(args),invitation)},
  '../server/http':{dependencyError:()=>({code:'DEPENDENCY_UNAVAILABLE'})},
  '../components/Public':{Empty:()=>null},
  '@/lib/supabase/server':{
   createUserClient:async()=>({
    auth:{getUser:async()=>({data:{user:{user_metadata:{full_name:'Sign-up Name'}}}})},
    from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:profile})})})}),
   }),
  },
 });
 return {calls,page:load(path.join(root,'pages/Auth.tsx')).AuthPage};
}
test('auth pages skip completed steps and preserve intended workspace',async()=>{
 for(const intent of ['candidate','hirer']){
  const screen=intent==='candidate'?'A02':'A04',next='/jobkix/en/'+(intent==='candidate'?'career':'hiring');
  await assert.rejects(authPage({state:'active'}).page({locale:'en',screen,search:{next}}),error=>error.target===next);
  await assert.rejects(authPage({state:'onboarding'}).page({locale:'en',screen,search:{next}}),error=>new URL(error.target,'https://fixture.invalid').searchParams.get('intent')===intent);
 }
 await assert.rejects(authPage({state:'active',profile:{id:'profile'}}).page({locale:'en',screen:'A08',search:{intent:'candidate'}}),error=>error.target==='/jobkix/en/career');
});
test('onboarding reuses sign-up name and still offers candidate setup for existing employer accounts',async()=>{
 for(const state of ['onboarding','active']){
  const result=await authPage({state}).page({locale:'en',screen:'A08',search:{intent:'candidate'}}),form=result.props.children[1];
  assert.equal(form.props.initialName,'Sign-up Name');assert.equal(form.props.intent,'candidate');assert.equal(form.props.consentRevision,'a'.repeat(64));assert.ok(form.props.consentDocuments);
 }
});
test('invitation context survives anonymous sign-in and active account acceptance',async()=>{
 const search={intent:'hirer',invitation:'10000000-0000-4000-8000-000000000001',token:'f'.repeat(64)};
 await assert.rejects(authPage().page({locale:'en',screen:'A08',search}),error=>{
  const signin=new URL(error.target,'https://fixture.invalid'),next=new URL(signin.searchParams.get('next'),'https://fixture.invalid');
  return signin.pathname==='/jobkix/en/hirer/sign-in'&&next.searchParams.get('invitation')===search.invitation&&next.searchParams.get('token')===search.token;
 });
 const h=authPage({state:'active',invitation:{id:search.invitation}}),result=await h.page({locale:'en',screen:'A08',search});assert.equal(result.props.children.props.token,search.token);assert.deepEqual(h.calls,[[search.invitation,search.token]]);
});
test('consent disclosure renders reviewed snapshot content as escaped HTML',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{ConsentDocuments}=loader()(path.join(root,'components/ConsentDocuments.tsx'));
 const html=renderToStaticMarkup(React.createElement(ConsentDocuments,{terms:{terms:{title:'Reviewed Terms',summary:'Summary',sections:[{title:'Consent',body:'<script>unsafe</script>',paragraphs:['Paragraph'],items:['Condition']}]},privacy:{title:'Reviewed Privacy'}}}));
 for(const content of ['Reviewed Terms','Reviewed Privacy','Summary','Paragraph','Condition','&lt;script&gt;unsafe&lt;/script&gt;'])assert.ok(html.includes(content));
 assert.equal(html.includes('<script>'),false);assert.equal((html.match(/<details/g)||[]).length,2);
});
