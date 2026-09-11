import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
let pass=0,fail=0
const failures=[]
const ok=(name,cond,detail='')=>{if(cond){pass++;console.log(`PASS  ${name}`)}else{fail++;failures.push(`${name}${detail?`: ${detail}`:''}`);console.error(`FAIL  ${name}${detail?` — ${detail}`:''}`)}}
const exts=['.ts','.tsx','.js','.jsx','.mjs','.cjs']
function walkPages(rel){const base=path.join(root,rel),out=[];const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name==='page.tsx')out.push(path.relative(root,p))}};walk(base);return out.sort()}
function resolveImport(from,spec){
  if(!(spec.startsWith('@/')||spec.startsWith('./')||spec.startsWith('../'))) return null
  let base=spec.startsWith('@/')?path.join(root,spec.slice(2)):path.resolve(path.dirname(path.join(root,from)),spec)
  const candidates=[base,...exts.map(e=>base+e),...exts.map(e=>path.join(base,'index'+e))]
  for(const p of candidates){if(fs.existsSync(p)&&fs.statSync(p).isFile()){const rel=path.relative(root,p);if(!rel.startsWith('..')) return rel}}
  return null
}
function imports(file,text){const out=[];for(const m of text.matchAll(/(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g)){const r=resolveImport(file,m[1]);if(r)out.push(r)};return out}
function trace(start,maxDepth=5){const seen=new Set();const queue=[[start,0]];while(queue.length){const [f,d]=queue.shift();if(seen.has(f)||d>maxDepth)continue;seen.add(f);let t='';try{t=fs.readFileSync(path.join(root,f),'utf8')}catch{continue}for(const i of imports(f,t)){if(!seen.has(i))queue.push([i,d+1])}}return [...seen]}
const dataPatterns=[
  /createClient\s*\(/, /\.from\s*\(/, /\.rpc\s*\(/, /get[A-Z][A-Za-z0-9_]*(?:Snapshot|Overview|Workspace|Dossier|Data|Metrics|State)\s*\(/,
  /load[A-Z][A-Za-z0-9_]*\s*\(/, /list[A-Z][A-Za-z0-9_]*\s*\(/, /Promise\.all\s*\(/,
  /requireAngelcare360(?:RouteAccess|OperatorPermission|OperatorSession)\s*\(/
]
const writePatterns=[
  /<form\b/i, /onSubmit\s*=/, /formAction\s*=/, /onClick\s*=\s*\{[^}]*\b(?:create|update|delete|archive|restore|approve|reject|assign|invite|send|save|submit|execute|mutate|suspend|revoke|cancel|close|pay|record)/i,
  /method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i,
  /fetch\s*\([^)]*[\s\S]{0,400}method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i,
  /execute[A-Z][A-Za-z0-9_]*\s*\(/,
  /(?:create|update|delete|archive|restore|approve|reject|assign|invite|send|save|submit|suspend|revoke|cancel|close|record)[A-Z][A-Za-z0-9_]*\s*\(/
]
function classify(page){
  const files=trace(page,6)
  const texts=files.map(f=>{try{return fs.readFileSync(path.join(root,f),'utf8')}catch{return''}})
  const text=texts.join('\n')
  const redirect=/\bredirect\s*\(/.test(texts[0]||'')
  const data=dataPatterns.some(r=>r.test(text))
  const write=writePatterns.some(r=>r.test(text))
  const importsReal=files.length>1
  return {files,data,write,redirect,importsReal,status:redirect?'REDIRECT_ALIAS':write?'WRITE_OPERATIONAL':data?'READ_OPERATIONAL':importsReal?'IMPLEMENTATION_ONLY':'STATIC_SHELL'}
}

const tenant=walkPages('app/(protected)/angelcare-360-command-center')
const operator=walkPages('app/(protected)/angelcare-360-operator')
const rows=[]
for(const [universe,pages] of [['tenant',tenant],['operator',operator]]){
  for(const page of pages){const c=classify(page);rows.push({universe,page,...c});ok(`${universe} ${page} is not static shell`,c.status!=='STATIC_SHELL',c.status)}
}
const counts={}
for(const r of rows)counts[r.status]=(counts[r.status]||0)+1
const staticRows=rows.filter(r=>r.status==='STATIC_SHELL'||r.status==='IMPLEMENTATION_ONLY')
// IMPLEMENTATION_ONLY is deliberately not accepted: imported code must show either data, mutation or explicit redirect evidence.
ok('no Operator/Tenant implementation-only ambiguity',staticRows.length===0,staticRows.map(r=>r.page).join(', '))

const outDir=path.join(root,'docs/sanila-final-product-closure');fs.mkdirSync(outDir,{recursive:true})
fs.writeFileSync(path.join(outDir,'OPERATOR_TENANT_OPERATIONAL_REALITY.json'),JSON.stringify({generatedAt:'SOURCE_FROZEN_2026-09-11',counts:{tenant:tenant.length,operator:operator.length,total:rows.length,...counts,blocked:staticRows.length},rows:rows.map(r=>({universe:r.universe,page:r.page,status:r.status,trace:r.files.slice(0,20)}))},null,2))
let md=`# SANILA Operator / Tenant Operational Reality Ledger\n\n- Tenant routes: **${tenant.length}**\n- Operator routes: **${operator.length}**\n- Total: **${rows.length}**\n- Write-operational: **${counts.WRITE_OPERATIONAL||0}**\n- Read-operational: **${counts.READ_OPERATIONAL||0}**\n- Redirect aliases: **${counts.REDIRECT_ALIAS||0}**\n- Blocked/static/ambiguous: **${staticRows.length}**\n\n| Universe | Page | Classification |\n|---|---|---|\n`
for(const r of rows)md+=`| ${r.universe} | \`${r.page}\` | ${r.status} |\n`
fs.writeFileSync(path.join(outDir,'OPERATOR_TENANT_OPERATIONAL_REALITY.md'),md)
console.log(`\nTENANT_ROUTES=${tenant.length}`);console.log(`OPERATOR_ROUTES=${operator.length}`);console.log(`WRITE_OPERATIONAL=${counts.WRITE_OPERATIONAL||0}`);console.log(`READ_OPERATIONAL=${counts.READ_OPERATIONAL||0}`);console.log(`REDIRECT_ALIAS=${counts.REDIRECT_ALIAS||0}`);console.log(`STATIC_OR_AMBIGUOUS=${staticRows.length}`);console.log(`OPERATOR_TENANT_REALITY_PASS=${pass}`);console.log(`OPERATOR_TENANT_REALITY_FAIL=${fail}`)
if(fail){console.error('\nFAILURES');failures.forEach(f=>console.error('- '+f));process.exit(1)}
