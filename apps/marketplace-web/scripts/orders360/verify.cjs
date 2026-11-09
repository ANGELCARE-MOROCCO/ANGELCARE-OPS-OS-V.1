const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const ts=require('typescript')
const root=path.resolve(__dirname,'../..')
function load(file,stubs={}){const source=fs.readFileSync(path.join(root,file),'utf8');const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};vm.runInNewContext(code,{module,exports:module.exports,require:id=>Object.hasOwn(stubs,id)?stubs[id]:require(id),console,Date,Map,Set,Intl,URL,Blob,setTimeout},{filename:file});return module.exports}
class MarketplaceError extends Error{constructor(code,message){super(message);this.code=code}}
const model=load('angelcare-marketplace/orders360/model.ts')
const order=(patch={})=>({id:'o1',reference:'AC-01',title:'Kit',journeyType:'kit_order',status:'in_preparation',stage:'preparation',severity:'watch',customerName:'Client',customerId:'c1',territoryId:'t1',territoryName:'Casa',currency:'MAD',source:'online',amount:790,captured:790,refunded:0,outstanding:0,paymentStatus:'captured',scheduledStart:null,scheduledEnd:null,providerId:null,providerName:'À affecter',nextAction:'Préparer',nextActionDueAt:null,createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-11-07T00:00:00Z',closure:{payment:true,evidence:false},...patch})
let count=0
const test=async(name,fn)=>{await fn();count++;console.log('PASS',name)}
function dbFixture(options={}){
 const before={id:'o1',customer_account_id:'c1',tenant_id:'tenant1',territory_id:'t1',status:'in_preparation',updated_at:'2026-11-07T00:00:00Z',fulfillment_status:{provider_id:'p1',provider_snapshot:{source:'accepted-proposal'},status:'preparing'}}
 const fixture={before,address:{id:'a1',customer_account_id:'c1',status:'active',city:'Casa',address_line:'Lieu de test'},updates:[],events:[],...options}
 const db={from(table){let op='read',payload,filters=[];const q={select(){return q},eq(k,v){filters.push([k,v]);return q},update(v){op='update';payload=v;fixture.updates.push({table,payload,filters});return q},insert(v){op='insert';payload=v;return q},single(){return execute()},maybeSingle(){return execute()},then(resolve,reject){return execute().then(resolve,reject)}};async function execute(){if(op==='insert'){fixture.events.push(payload);return {data:payload,error:null}}if(table==='angelcare_marketplace_customer_addresses')return {data:fixture.address,error:null};if(op==='update')return {data:fixture.casFail?null:{...before,...payload},error:null};return {data:before,error:null}}return q}}
 const audits=[]
 const repo=load('angelcare-marketplace/enterprise-command/sovereign-repository.ts',{'@/lib/supabase/server':{createServiceClient:async()=>db},'../server/errors':{MarketplaceError},'../audit/write-audit':{writeMarketplaceAudit:async x=>audits.push(x)},'./repository':{segmentPreview:()=>null}})
 return {fixture,audits,operate:body=>repo.operateOrder({context:{tenantId:'tenant1',territoryId:'t1',actor:{id:'actor1'}},orderId:'o1',body})}
}
async function main(){
 await test('historical orders remain visible with all-history filters',()=>assert.equal(model.filterOrders([order()],model.parseQuery({})).length,1))
 await test('explicit period uses creation date consistently',()=>assert.equal(model.filterOrders([order()],model.parseQuery({period:'7'}),Date.parse('2026-11-08')).length,0))
 await test('pipeline group selects every counted stage',()=>assert.equal(model.filterOrders([order(),order({id:'o2',stage:'assigned'})],model.parseQuery({status:'preparation|assigned'})).length,2))
 await test('source filter and search preserve canonical customer identity',()=>assert.equal(model.filterOrders([order()],model.parseQuery({source:'online',q:'c1'})).length,1))
 await test('mixed currencies are displayed separately',()=>{const s=model.groupedMoney([order(),order({currency:'EUR',amount:10})],'amount');assert.ok(s.includes('MAD')&&s.includes('EUR'));assert.ok(!s.includes('800'))})
 await test('product orders do not generate provider assignment blockers',()=>assert.ok(!model.decoder(order(),{exceptions:[]}).some(d=>d.kind==='provider')))
 await test('services without mission explain materialization dependency',()=>assert.ok(model.decoder(order({journeyType:'family_booking'}),{exceptions:[]}).some(d=>d.kind==='provider'&&d.cause.includes('Aucune mission'))))
 await test('CSV export neutralizes spreadsheet formulas',()=>assert.equal(model.csvCell('=HYPERLINK("x")'),'"\'=HYPERLINK(""x"")"'))
 await test('address from another customer is rejected before mutation',async()=>{const {operate,fixture}=dbFixture({address:{id:'a2',customer_account_id:'c2',status:'active'}});await assert.rejects(operate({serviceAddressId:'a2'}),e=>e.code==='VALIDATION_ERROR');assert.equal(fixture.updates.length,0)})
 await test('archived customer address is rejected',async()=>{const {operate}=dbFixture({address:{id:'a1',customer_account_id:'c1',status:'archived'}});await assert.rejects(operate({serviceAddressId:'a1'}),e=>e.code==='VALIDATION_ERROR')})
 await test('missing address is rejected',async()=>{const {operate}=dbFixture({address:null});await assert.rejects(operate({serviceAddressId:'missing'}),e=>e.code==='NOT_FOUND')})
 await test('tenant boundary is enforced before write',async()=>{const f=dbFixture();f.fixture.before.tenant_id='other';await assert.rejects(f.operate({title:'x'}),e=>e.code==='SCOPE_MISMATCH');assert.equal(f.fixture.updates.length,0)})
 await test('stale form revision is rejected',async()=>{const {operate,fixture}=dbFixture();await assert.rejects(operate({title:'x',expectedUpdatedAt:'old'}),e=>e.code==='CONFLICT');assert.equal(fixture.updates.length,0)})
 await test('concurrent database edit is detected by compare-and-set',async()=>{const {operate}=dbFixture({casFail:true});await assert.rejects(operate({serviceAddressId:'a1'}),e=>e.code==='CONFLICT')})
 await test('address association preserves provider evidence and writes audit',async()=>{const {operate,fixture,audits}=dbFixture();const result=await operate({serviceAddressId:'a1',expectedUpdatedAt:fixture.before.updated_at,reason:'Adresse active confirmée'});assert.equal(result.fulfillment_status.service_address_id,'a1');assert.equal(result.fulfillment_status.provider_snapshot.source,'accepted-proposal');assert.equal(result.fulfillment_status.provider_id,'p1');assert.ok(fixture.updates[0].filters.some(([k,v])=>k==='updated_at'&&v===fixture.before.updated_at));assert.equal(audits.length,1);assert.equal(fixture.events.length,1)})
 await test('invalid scheduling range cannot overwrite order',async()=>{const {operate,fixture}=dbFixture();await assert.rejects(operate({scheduledStartAt:'2026-11-09T12:00:00Z',scheduledEndAt:'2026-11-09T11:00:00Z'}),e=>e.code==='VALIDATION_ERROR');assert.equal(fixture.updates.length,0)})
 const pagination=load('angelcare-marketplace/operational-intake/pagination.ts',{'../server/errors':{MarketplaceError}})
 await test('complete reads cross the Supabase page boundary',async()=>{const list=Array.from({length:1201},(_,id)=>({id}));const result=await pagination.readAllPages(()=>({range:async(a,b)=>({data:list.slice(a,b+1),error:null})}));assert.equal(result.length,1201)})
 await test('partial pagination failure never masquerades as a full result',async()=>{await assert.rejects(pagination.readAllPages(()=>({range:async(a)=>a?{data:null,error:{message:'offline'}}:{data:Array.from({length:500},(_,id)=>({id})),error:null}})),e=>e.code==='INTERNAL_ERROR')})
 console.log(`Orders 360: ${count} meaningful checks passed`)
}
main().catch(e=>{console.error(e);process.exitCode=1})
