'use strict'
// Gate B source-contract tests. Runs pure canonical modules with TypeScript in
// memory: no application build, no browser server, no DB, no running service.
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const ts=require('../../node_modules/typescript')
const dir=path.resolve(__dirname,'../../angelcare-marketplace/digital-customer-experience')
const cache=new Map()
function load(name){
 if(!/^[a-z-]+$/.test(name))throw Error('Non-DCE import: '+name)
 if(cache.has(name))return cache.get(name).exports
 const file=path.join(dir,name+'.ts'),mod={exports:{}};cache.set(name,mod)
 const source=fs.readFileSync(file,'utf8'),javascript=ts.transpileModule(source,{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText
 vm.runInThisContext('(function(require,module,exports){'+javascript+'\n})',{filename:file})(dep=>{
  if(!/^\.\/[a-z-]+$/.test(dep))throw Error('Unsafe dependency '+dep)
  return load(dep.slice(2))
 },mod,mod.exports)
 return mod.exports
}
const {FAMILIES}=load('registry')
const {parseCsv,templatePack,planImport,importBlockingIssues,assertTaskCorrection,PROFILE_COUNT}=load('imports')
let passed=0
function test(label,action){action();passed++;console.log('PASS',label)}
const err=(code,path='field')=>({code,path,message:['No valid reference.','Référence invalide','مرجع غير صالح'],severity:'error'})
test('16 real families and 64 distinct modes',()=>{
 assert.equal(FAMILIES.length,16);assert.equal(new Set(FAMILIES.map(f=>f.key)).size,16)
 assert.equal(FAMILIES.reduce((n,f)=>n+f.modes.length,0),64)
})
test('128 native family/task import profiles',()=>assert.equal(PROFILE_COUNT,128))
for(const family of FAMILIES){
 test(family.key+' eight native task profiles round-trip',()=>{
  for(const task of ['create','content','translations','media','taxonomy','journeys','access','advertising']){
   const pack=templatePack(family.key,task),head=parseCsv(pack.csv)[0],example=parseCsv(pack.exampleCsv)
   assert.equal(example.length,2)
   assert.deepEqual(head,example[0])
   assert.equal(head[0],'key')
   if(task==='create')assert.ok(!head.includes('expected_revision'))
   else assert.ok(head.includes('expected_revision'))
  }
 })
}
test('CSV rejects shifted rows, duplicate columns and unclosed quotes',()=>{
 assert.throws(()=>parseCsv('key,title\nfoo'),/Shifted CSV row/)
 assert.throws(()=>parseCsv('key,key\n1,2'),/Duplicate CSV columns/)
 assert.throws(()=>parseCsv('key,title\nfoo,"bad'),/Unclosed CSV quote/)
})
test('correction ready is blocked on missing native media and record references',()=>{
 const issues=importBlockingIssues({errors:[err('MISSING_MEDIA','media'),err('NATIVE_OFFER','offer'),err('MISSING_RECORD','child')]})
 assert.equal(issues.length,3)
})
test('malformed identity, number, capability, age and cycles block correction',()=>{
 assert.equal(importBlockingIssues({errors:['IDENTITY','NUMBER','CAPABILITY','AGE','CYCLE'].map(code=>err(code))}).length,5)
})
test('draft-only publication readiness remains separate from correction validity',()=>{
 assert.deepEqual(importBlockingIssues({errors:[err('TITLE'),err('CONSENT'),err('PRIVATE_RECEIVER')]}),[])
})
test('content task prevents unrelated access and commerce changes',()=>{
 const a={kind:'experience',key:'draft',family:'forms',title:'Form',topic:null,audience:'parent',data:{mode:'Form Flow',fields:[]}}
 const b={...a,data:{...a.data,accessPolicyId:'fake'}}
 assert.throws(()=>assertTaskCorrection(a,b,'content'),/outside the selected task/)
})
test('translations task cannot change identity or core mode',()=>{
 const a={kind:'experience',key:'draft',family:'forms',title:'Form',topic:null,audience:'parent',data:{mode:'Form Flow',locales:{}}}
 assert.throws(()=>assertTaskCorrection(a,{...a,key:'hijacked'},'translations'),/outside the selected task/)
 assert.throws(()=>assertTaskCorrection(a,{...a,data:{...a.data,mode:'Application'}},'translations'),/outside the selected task/)
})
test('initial import blocking decisions share corrected-row contract',()=>{
 const csv='key,title,audience,mode,ageMin,ageMax,requiredLocales,locales,definition\n"my-experience","Sample","parent","INVALID-MODE","0","18","[""fr""]","{""fr"":{""title"":""Sample""}}","{}"'
 const p=planImport(csv,'forms','create',[])
 assert.equal(p.length,1)
 assert.ok(p[0].issues.some(x=>/mode/i.test(x)),JSON.stringify(p[0].issues))
})
console.log(`GATE_B_SOURCE_CONTRACT_TESTS=${passed}/${passed} PASS`)
console.log('METHOD=PURE_CANONICAL_SOURCE_IN_MEMORY_TRANSPILE_NO_APP_BUILD')
