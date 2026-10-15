'use strict';
const fs=require('fs');const path=require('path');const vm=require('vm');
const app=path.resolve(__dirname,'../..');
const ts=require(path.join(app,'node_modules/typescript/lib/typescript.js'));const root=path.join(app,'angelcare-marketplace/digital-customer-experience');
let count=0;
function assert(ok,msg){if(!ok)throw new Error('FAIL '+msg);count++;process.stdout.write('PASS '+msg+'\n');}
function load(file,mocks, globals={}){
 const src=fs.readFileSync(path.join(root,file),'utf8');
 const out=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true});
 const errors=(out.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error);if(errors.length)throw Error(errors.map(e=>ts.flattenDiagnosticMessageText(e.messageText,'\n')).join('\n'));
 const exports={};const module={exports}; const sandbox={module,exports,require:(name)=>{
  if(Object.prototype.hasOwnProperty.call(mocks,name))return mocks[name];
  if(name==='node:crypto')return require('node:crypto');
  throw Error('Unexpected import '+name+' from '+file);
 },Date,Number,String,Boolean,Set,Map,JSON,Array,Math,RegExp,Object,Error,URLSearchParams,AbortSignal,console,process:{env:{DCE_GOOGLE_CLIENT_ID:'stub-id',DCE_GOOGLE_CLIENT_SECRET:'stub-secret',DCE_GOOGLE_REFRESH_TOKEN:'stub-refresh'}},...globals};
 vm.runInNewContext(out.outputText,sandbox,{filename:file,timeout:2000});return module.exports;
}
const typeMocks={array:x=>Array.isArray(x)?x:[],object:x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{},text:x=>typeof x==='string'?x:'',number:x=>typeof x==='number'?x:0};
const {inspectAccess,effectiveAccess}=load('access.ts',{'./types':typeMocks});
const resource={id:'11111111-1111-4111-8111-111111111111',kind:'experience',key:'experience-test',revision:1,lifecycle:'draft',family:'forms',topic:'general',data:{visibility:'native_entitlement',downloadAllowed:true,printAllowed:true}};
const validGrant={id:'g1',kind:'grant',lifecycle:'approved',data:{customerId:'customer-A',resourceId:resource.id,issuer:'native_order',nativeReceiptId:'receipt-A',revoked:false}};
let base={action:'use',audience:'parent',authenticated:true,customerId:'customer-A',grants:[validGrant],now:'2026-10-15T00:00:00.000Z'};
assert(inspectAccess(resource,undefined,base).allowed===true,'Verified native grant authorizes its own customer');
assert(inspectAccess(resource,undefined,{...base,customerId:'customer-B'}).allowed===false,'Another customer cannot reuse a recognized grant');
assert(inspectAccess(resource,undefined,{...base,authenticated:false}).allowed===false,'Unauthenticated caller cannot use a grant');
assert(inspectAccess(resource,undefined,{...base,grants:[{...validGrant,data:{...validGrant.data,expiresAt:'2020-01-01T00:00:00Z'}}]}).allowed===false,'Expired grant denied');
assert(inspectAccess({...resource,data:{visibility:'unexpected'}},undefined,base).reason==='UNSUPPORTED_ACCESS_RULE','Unknown access rule denied');
const parentPolicy={id:'p',kind:'access_policy',lifecycle:'draft',key:'parent-policy',title:'Parent',revision:2,data:{scope:'world',use:'disabled'}};
assert(effectiveAccess(resource,[parentPolicy],base).allowed===false,'Parent access restriction cannot be relaxed');
class MarketplaceError extends Error{constructor(code,message,extra){super(message);this.code=code;this.extra=extra;}}
let googleBody={rows:[{cells:[]}],totalMatchedRows:1};let requested=[];
const fetch=async (url,opts)=>{requested.push(String(url));return {ok:true,status:200,json:async()=>String(url).includes('oauth2.googleapis.com')?{access_token:'stub-token',expires_in:3600}:googleBody}};
const {googleOperation}=load('google.ts',{'../server/errors':{MarketplaceError},'./registry':{formatById:()=>null},'./types':typeMocks},{fetch});
const account='accounts/pub-123456789012';const query={account,start:'2026-10-01',end:'2026-10-15'};
async function run(){
 let result=await googleOperation('report',query);
 assert(result.complete===true,'AdSense report complete with authoritative matching total');
 googleBody={rows:[{cells:[]}]};result=await googleOperation('report',query);
 assert(result.complete===false,'AdSense report without matching total is NOT marked complete');
 googleBody={rows:[{cells:[]}],totalMatchedRows:2};result=await googleOperation('report',query);
 assert(result.complete===false,'AdSense partial report is NOT marked complete');
 googleBody={rows:[{cells:[]}],totalMatchedRows:'n/a'};result=await googleOperation('report',query);
 assert(result.complete===false,'AdSense invalid provider count is NOT marked complete');
 googleBody={rows:[{cells:[]}],totalMatchedRows:'1'};result=await googleOperation('report',query);
 assert(result.complete===true,'AdSense integer-string provider total recognized');
 const before=requested.length;
 try{await googleOperation('report',{...query,start:'2026-02-30'});throw Error('Invalid date accepted')}catch(e){assert(e.code==='VALIDATION_ERROR','Impossible calendar date rejected before provider call')}
 assert(requested.length===before,'Invalid AdSense date does not contact provider');
 let snapshot={id:resource.id,family:'forms',topic:'general',audience:'parent',title:'Form',tenant_id:null,territory_id:null,data:{destination:'dce',fields:[{id:'field-A',label:'Name',type:'text',required:true}]}};
 let rpcCalls=0,lastRequest=null;
 const db={from:(table)=>({select(){return this},eq(){return this},maybeSingle:async()=>({error:null,data:table==='ac_dce_releases'?{snapshot}:table==='ac_dce_records'?{published_release_id:'22222222-2222-4222-8222-222222222222'}:null})}),rpc:async(_name,request)=>{rpcCalls++;lastRequest=request;return {error:null,data:{record:{id:'33333333-3333-4333-8333-333333333333',key:'receipt-test',lifecycle:'draft'}}}}};
 const {receiveCustomerExperience}=load('reception.ts',{
 './capabilities':{compatibleDefinition:(_family,data)=>({data}),visibleFormFields:(fields)=>fields,formValueErrors:()=>[]},
 '../customer-commerce/customer-auth':{getCustomerContext:async()=>({marketplace:{tenantId:null,territoryId:null},account:{id:'customer-A'}})},
 '@/lib/supabase/server':{createServiceClient:async()=>db},
 '../server/errors':{MarketplaceError},'./model':{isId:v=>typeof v==='string'&&/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/.test(v)},
 './types':typeMocks
 });
 const rec={releaseId:'22222222-2222-4222-8222-222222222222',requestId:'44444444-4444-4444-8444-444444444444',kind:'form',consent:true,values:{'field-A':'Alice'},rating:5};
 await receiveCustomerExperience(rec);
 assert(rpcCalls===1,'Valid form reaches canonical receiving RPC');
 assert(lastRequest.p_record.data.rating===null,'Form submission cannot inject a review rating');
 assert(lastRequest.p_record.data.parentId===null,'Form receipt cannot acquire an unverified community parent');
 assert(lastRequest.p_record.data.contributionType===null,'Form receipt cannot masquerade as a review or reply');
 const rpcBefore=rpcCalls;
 const reject=async(obj,code,desc)=>{try{await receiveCustomerExperience(obj);throw Error('Unexpected success: '+desc)}catch(e){assert(e.code===code,desc)}assert(rpcCalls===rpcBefore,desc+' causes no receiving write')};
 await reject({...rec,kind:'fabricated'},'VALIDATION_ERROR','Unsupported runtime contribution kind rejected');
 await reject({...rec,values:[]},'VALIDATION_ERROR','Array payload rejected as form object');
 await reject({...rec,values:null},'VALIDATION_ERROR','Null form values rejected');
 await reject({...rec,contributionType:'administrator'},'VALIDATION_ERROR','Unsupported contribution type rejected');
 await reject({...rec,consent:false},'VALIDATION_ERROR','Explicit consent required');
 snapshot={...snapshot,data:{destination:'dce',fields:[{id:'field-A',label:'Name',type:'file',required:true}]}};
 await reject({...rec,values:{'field-A':'file-reference'}},'DEPENDENCY_BLOCKED','Unverified private attachment receiver remains fail-closed');
 assert(count>=25,'Adversarial integration assertions completed');
 console.log('GATE_C_BOUNDED_SOURCE_TEST_ASSERTIONS='+count+'/'+count+' PASS');
}
run().catch(e=>{console.error(e);process.exitCode=1});
