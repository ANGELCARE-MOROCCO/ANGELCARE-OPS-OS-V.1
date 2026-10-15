'use strict'
// Executes the exact extracted Gate B correct_import branch against isolated
// in-memory receipt doubles: no application build, local server or SQL writes.
const fs=require('fs'),path=require('path'),vm=require('vm'),ts=require('../../node_modules/typescript'),assert=require('node:assert/strict')
const root=path.resolve(__dirname,'../../angelcare-marketplace/digital-customer-experience')
const source=fs.readFileSync(path.join(root,'repository.ts'),'utf8')
const start=source.indexOf(" if(cmd.action==='correct_import'){")
const end=source.indexOf("\n throw new MarketplaceError('VALIDATION_ERROR','Unsupported DCE command.')",start)
assert.ok(start>=0&&end>start,'Canonical correction branch must remain identifiable')
const segment=source.slice(start,end)
const wrapper=`export async function execute(c,cmd,db,deps){const {authorize,checked,scoped,MarketplaceError,object,text,record,normalizeRecord,assertTaskCorrection,validate,importBlockingIssues,references}=deps;${segment};throw Error('No handler.')}`
const js=ts.transpileModule(wrapper,{fileName:'correct_import.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const sandbox={exports:{}};vm.runInNewContext(js,sandbox)
const execute=sandbox.exports.execute
const rec={kind:'experience',family:'forms',key:'my-form',title:'Customer form',audience:'parent',topic:null,data:{mode:'Form Flow',fields:[]},lifecycle:'draft'}
let count=0
const run=async(name,callback)=>{await callback();count++;console.log('PASS',name)}
const structured=x=>JSON.parse(JSON.stringify(x))
const mk=({errors=[],lineState='invalid',draftId=null,storedRevision=0,liveRevision=0,changed=false,submittedId=draftId,submittedRecord=rec}={})=>{
 const line={id:'line-1',job_id:'job-1',state:lineState,updated_at:'2026-10-15T10:00:00Z',prepared:{id:draftId,revision:storedRevision,record:structured(rec),refs:{record:[],media:[],offer:[]}}}
 const job={id:'job-1',family:'forms',task:'create'}
 let written=null
 class Query{constructor(table){this.table=table;this.where=[];this.patch=null;}
  select(){return this} eq(k,v){this.where.push([k,v]);return this}
  update(v){this.patch=v;return this}
  async maybeSingle(){
   if(this.table==='ac_dce_jobs')return{data:job,error:null}
   if(this.table==='ac_dce_job_lines'){
    if(!this.patch)return{data:structured(line),error:null}
    const same=this.where.every(([k,v])=>line[k]===v)
    if(changed||!same)return{data:null,error:null}
    written=this.patch;Object.assign(line,this.patch);return{data:structured(line),error:null}
   }
   throw Error('Unexpected table '+this.table)
  }
 }
 const db={from:t=>new Query(t)}
 class MarketplaceError extends Error{constructor(code,message){super(message);this.code=code}}
 const deps={
  authorize:()=>{},checked:async req=>{const r=await req;if(r.error)throw r.error;return r.data},scoped:q=>q,
  MarketplaceError,object:v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{},text:v=>typeof v==='string'?v.trim():'',
  record:async()=>({...rec,id:draftId,revision:liveRevision}),
  normalizeRecord:(submitted,old)=>{if(old&&old.key!==submitted.key)throw Error('Identity changed');return structured(submitted)},
  assertTaskCorrection:()=>{},
  validate:async()=>({validation:{errors:structured(errors)}}),
  importBlockingIssues:v=>v.errors.filter(e=>['IDENTITY','MISSING_MEDIA','MISSING_RECORD','NATIVE_OFFER'].includes(e.code)).map(e=>e.path+': '+e.message[0]),
  references:d=>({records:[],media:[],offers:[]})
 }
 return{line,job,db,deps,request:{action:'correct_import',id:'line-1',prepared:{id:submittedId,record:submittedRecord}},get written(){return written}}
}
;(async()=>{
 await run('invalid corrected receipt remains INVALID with blocking issues',async()=>{
  const a=mk({errors:[{code:'MISSING_MEDIA',path:'coverAssetId',message:['Missing native media']} ]})
  const r=await execute({},a.request,a.db,a.deps)
  assert.equal(r.state,'invalid');assert.equal(r.issues.length,1);assert.equal(a.written.state,'invalid')
 })
 await run('valid corrected receipt becomes READY',async()=>{
  const a=mk();const r=await execute({},a.request,a.db,a.deps)
  assert.equal(r.state,'ready');assert.deepEqual(Array.from(r.issues),[])
 })
 await run('stale target revision is rejected before modifying receipt',async()=>{
  const a=mk({draftId:'id-existing',storedRevision:4,liveRevision:5})
  await assert.rejects(()=>execute({},a.request,a.db,a.deps),/target changed/i)
  assert.equal(a.written,null)
 })
 await run('forged correction target is rejected without write',async()=>{
  const a=mk({submittedId:'another-record'})
  await assert.rejects(()=>execute({},a.request,a.db,a.deps),/preserve the targeted experience/i)
  assert.equal(a.written,null)
 })
 await run('concurrent correction fails instead of overwriting newer state',async()=>{
  const a=mk({changed:true})
  await assert.rejects(()=>execute({},a.request,a.db,a.deps),/Import line changed/i)
  assert.equal(a.written,null)
 })
 await run('applied receipt cannot be corrected',async()=>{
  const a=mk({lineState:'applied'})
  await assert.rejects(()=>execute({},a.request,a.db,a.deps),/Only unapplied import lines/i)
  assert.equal(a.written,null)
 })
 console.log(`GATE_B_CORRECTION_BRANCH_TESTS=${count}/${count} PASS`)
 console.log('METHOD=CANONICAL_BRANCH_WITH_ISOLATED_RECEIPT_DOUBLES_NO_DB_NO_APP_BUILD')
})().catch(e=>{console.error(e);process.exitCode=1})
