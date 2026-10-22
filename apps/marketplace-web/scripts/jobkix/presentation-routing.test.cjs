/** Executes real proxy logic with native Next requests/responses. Session refresh
 * is an isolated adapter: these tests do not certify hosted authentication. */
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const {NextRequest,NextResponse}=require('next/server');
const {getMiddlewareMatchers}=require('next/dist/build/analysis/get-page-static-info');
const app=path.resolve(__dirname,'../..'),owned=path.join(app,'angelcare-marketplace/jobkix'),calls=[];
const customer={async refreshCustomerSession(request){calls.push(request);const response=NextResponse.next({request:{headers:request.headers}});response.cookies.set('isolated-refresh','fixture',{httpOnly:true,sameSite:'lax'});return response;}};
const loaded=new Map();
function load(file){if(loaded.has(file))return loaded.get(file).exports;const m=new Module(file,module);m.filename=file;m.paths=module.paths;loaded.set(file,m);m.require=name=>{
 if(name==='@/angelcare-marketplace/customer-commerce/customer-session-proxy'||name==='../customer-commerce/customer-session-proxy')return customer;
 if(name.startsWith('@/angelcare-marketplace/jobkix/'))return load(path.join(owned,name.split('/').at(-1)+'.ts'));
 if(name.startsWith('./'))return load(path.resolve(path.dirname(file),name+'.ts'));
 return require(name);
};m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);return m.exports;}
const {proxy,config}=load(path.join(app,'proxy.ts'));
const hints={'x-jobkix-path':'/jobkix/ar','x-jobkix-locale':'ar'};
const native={'x-forwarded-host':'original.example.test','x-vercel-ip-country':'CA','x-tenant-id':'fixture-tenant',origin:'https://original.example.test'};
function request(route,headers={}){return new NextRequest('https://original.example.test'+route,{headers:{...native,...headers}});}
function forwarded(response){const names=response.headers.get('x-middleware-override-headers')?.split(',')||[];return new Headers(names.map(name=>[name,response.headers.get('x-middleware-request-'+name)]));}
test('public requests remove forged hints while preserving native country/host/context/cookies',async()=>{
 for(const route of ['/','/angelcare-marketplace/en','/angelcare-marketplace/ar','/kidflix/en','/unmatched','/unmatched.html','/api/another-world']){
  const clean=await proxy(request(route));assert.equal(clean.status,200);assert.equal(clean.headers.get('x-middleware-next'),'1');assert.equal(clean.headers.has('x-middleware-override-headers'),false);
  const source=request(route,{...hints,cookie:'fixture=retained'}),response=await proxy(source),headers=forwarded(response);
  assert.equal(response.status,200);assert.equal(response.headers.get('x-middleware-next'),'1');assert.equal(headers.has('x-jobkix-path'),false);assert.equal(headers.has('x-jobkix-locale'),false);
  for(const [name,value] of Object.entries({...native,cookie:'fixture=retained'}))assert.equal(headers.get(name),value);
  assert.equal(source.headers.get('x-jobkix-locale'),'ar');
 }
});
test('JOBKIX derives hints from the actual path and keeps native session refresh cookies',async()=>{
 for(const locale of ['en','fr','es','hi','tl','id','ar']){
  const response=await proxy(request('/jobkix/'+locale+'/jobs?origin=FR',{...hints,cookie:'fixture=retained'})),headers=forwarded(response);
  assert.equal(headers.get('x-jobkix-path'),'/jobkix/'+locale+'/jobs');assert.equal(headers.get('x-jobkix-locale'),locale);assert.equal(headers.get('cookie'),'fixture=retained');assert.equal(response.cookies.get('isolated-refresh').value,'fixture');
 }
 for(const route of ['/api/jobkix/commands','/api/jobkix/documents']){const response=await proxy(request(route,hints)),headers=forwarded(response);assert.equal(headers.has('x-jobkix-path'),false);assert.equal(headers.has('x-jobkix-locale'),false);}
});
test('existing Marketplace refresh routes receive sanitized headers and keep their response',async()=>{
 for(const route of ['/angelcare-marketplace/en/account','/angelcare-marketplace/fr/auth/callback','/angelcare-marketplace/ar/family/home','/angelcare-marketplace/family/home']){
  const source=request(route,{...hints,cookie:'sb-fixture=retained'}),response=await proxy(source),last=calls.at(-1);
  assert.equal(last.url,source.url);assert.equal(last.headers.has('x-jobkix-path'),false);assert.equal(last.headers.has('x-jobkix-locale'),false);assert.equal(last.headers.get('cookie'),'sb-fixture=retained');assert.equal(response.cookies.get('isolated-refresh').value,'fixture');
  const clean=request(route);await proxy(clean);assert.equal(calls.at(-1),clean);
 }
});
test('existing CareLink session prechecks and all redirect destinations remain unchanged',async()=>{
 for(const [route,target,cookie] of [
  ['/carelink-ops?tab=retained','/login','opsos_session=fixture'],['/carelink/ops/a?tab=retained','/login','angelcare_session=fixture'],
  ['/api/carelink/ops/a?tab=retained','/login','app_session=fixture'],['/api/carelink/admin/a?tab=retained','/login','supabase-auth-token=fixture'],
  ['/carelink?tab=retained','/carelink/login','carelink_mobile_session=fixture'],['/carelink/mobile/a?tab=retained','/carelink/login','carelink_agent_token=fixture']
 ]){
  for(const headers of [{},hints]){const response=await proxy(request(route,headers)),location=new URL(response.headers.get('location'));assert.equal(response.status,307);assert.equal(location.pathname,target);assert.equal(location.searchParams.get('next'),route);}
  const allowed=await proxy(request(route,{...hints,cookie}));assert.equal(allowed.status,200);assert.equal(forwarded(allowed).has('x-jobkix-path'),false);assert.equal(forwarded(allowed).get('cookie'),cookie);
 }
 for(const route of ['/carelink/login','/carelink/mobile-login/nested']){assert.equal((await proxy(request(route,hints))).status,200);const response=await proxy(request(route,{...hints,cookie:'carelink_mobile_token=fixture'}));assert.equal(response.status,307);assert.equal(new URL(response.headers.get('location')).pathname,'/carelink');}
 for(const route of ['/api/carelink/login','/api/carelink/mobile-login','/api/carelink/auth','/api/connect/status'])assert.equal((await proxy(request(route,hints))).status,200);
});
test('installed Next matcher analysis covers root documents and transport forms without static/image requests',()=>{
 const matchers=getMiddlewareMatchers(config.matcher,{}).map(item=>new RegExp(item.regexp)),matches=route=>matchers.some(item=>item.test(route));
 for(const route of ['/','/angelcare-marketplace/ar','/kidflix/en','/jobkix/ar','/unknown','/unknown.html','/jobkix/en/jobs.rsc','/_next/data/fixture/jobkix/en.json','/_next/static-document','/_next/image-document'])assert.ok(matches(route),route);
 for(const route of ['/_next/static/chunks/main.js','/_next/image'])assert.equal(matches(route),false,route);
});
test('legacy dispatch agrees with its actual former source/matchers on prefix edges',async()=>{
 const prior=load(path.join(app,'docs/jobkix/presentation-preserved-routing-baseline.txt')),matchers=getMiddlewareMatchers(prior.config.matcher,{}).map(item=>new RegExp(item.regexp)),matches=route=>matchers.some(item=>item.test(route));
 const decision=response=>({status:response.status,location:response.headers.get('location'),refresh:response.cookies.get('isolated-refresh')?.value||null});
 for(const route of ['/carelink-example','/carelink-ops-extra','/api/carelink-extra','/api/connect-extra','/jobkix-other','/angelcare-marketplace/en/account-extra','/carelink/ops-preview','/api/carelink/administer','/carelink/login-more','/carelink-ops','/carelink'])for(const cookie of ['', 'carelink_mobile_session=fixture','opsos_session=fixture']){
  const before=matches(route)?await prior.proxy(request(route,{cookie})):NextResponse.next(),after=await proxy(request(route,{...hints,cookie}));assert.deepEqual(decision(after),decision(before),route+' '+cookie);
 }
});
test('sanitized native Marketplace POST refresh forwards the exact existing body and request context',async()=>{
 const source=new NextRequest('https://original.example.test/angelcare-marketplace/en/account/command',{method:'POST',headers:{...native,...hints,cookie:'sb-fixture=retained','Content-Type':'application/json'},body:JSON.stringify({action:'isolated-existing-command',payload:{value:'preserved'}})}),response=await proxy(source),forwardedRequest=calls.at(-1);assert.equal(forwardedRequest.method,'POST');assert.equal(forwardedRequest.headers.get('cookie'),'sb-fixture=retained');assert.equal(forwardedRequest.headers.has('x-jobkix-path'),false);assert.equal(await forwardedRequest.text(),JSON.stringify({action:'isolated-existing-command',payload:{value:'preserved'}}));assert.equal(response.cookies.get('isolated-refresh').value,'fixture');
});
