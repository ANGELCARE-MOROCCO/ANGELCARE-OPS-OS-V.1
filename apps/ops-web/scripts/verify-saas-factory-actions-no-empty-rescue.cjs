const fs=require('fs'), path=require('path')
const root=process.cwd()
const files=[
'app/(protected)/saas-factory-command/actions/page.tsx',
'components/saas-factory/actions/SaasFactoryActionsCommandCenter.tsx',
'lib/saas-factory/actions-runtime.ts',
'app/api/saas-factory/actions/summary/route.ts',
'app/api/saas-factory/actions/execute/route.ts',
'app/api/saas-factory/actions/export/route.ts'
]
const failures=[]
for(const f of files) if(!fs.existsSync(path.join(root,f))) failures.push(`Missing ${f}`)
const c=fs.existsSync(path.join(root,files[1]))?fs.readFileSync(path.join(root,files[1]),'utf8'):''
for(const token of ['buildFallback','seedActions','Action Control Room','Dry-run preview','Execute with audit','Dependency Graph','Policy Matrix','Execution Evidence']) if(!c.includes(token)) failures.push(`Missing component token ${token}`)
const r=fs.existsSync(path.join(root,files[2]))?fs.readFileSync(path.join(root,files[2]),'utf8'):''
for(const token of ['seedActions','getActionsSummary','executeFactoryAction','exportActions','Dry-run completed','Hard delete blocked']) if(!r.includes(token)) failures.push(`Missing runtime token ${token}`)
for(const rel of ['summary','execute','export']) {
 const file=path.join(root,`app/api/saas-factory/actions/${rel}/route.ts`)
 if(fs.existsSync(file)&&!fs.readFileSync(file,'utf8').includes('../../../../../lib/saas-factory/actions-runtime')) failures.push(`${rel} route wrong import`)
}
if(failures.length){console.error('Actions no-empty rescue verification failed:'); failures.forEach(f=>console.error('- '+f)); process.exit(1)}
console.log('Actions no-empty rescue verification passed.')
