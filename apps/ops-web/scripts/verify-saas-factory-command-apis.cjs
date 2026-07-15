const fs=require('fs'), path=require('path')
const root=process.cwd()
const files=[
'app/(protected)/saas-factory-command/apis/page.tsx',
'components/saas-factory/apis/SaasFactoryApisCommandCenter.tsx',
'lib/saas-factory/apis-runtime.ts',
'app/api/saas-factory/apis/summary/route.ts',
'app/api/saas-factory/apis/execute/route.ts',
'app/api/saas-factory/apis/export/route.ts',
'database/20260530_saas_factory_apis_registry.sql'
]
const failures=[]
for(const file of files) if(!fs.existsSync(path.join(root,file))) failures.push(`Missing ${file}`)
const component=fs.existsSync(path.join(root,files[1]))?fs.readFileSync(path.join(root,files[1]),'utf8'):''
for(const token of ['APIs Command Center','API Control Room','Probe endpoint','Validate contract','Create incident','Dependency Graph','Contract Policy Matrix','Probe Evidence']) if(!component.includes(token)) failures.push(`Component missing ${token}`)
const runtime=fs.existsSync(path.join(root,files[2]))?fs.readFileSync(path.join(root,files[2]),'utf8'):''
for(const token of ['seedApiEndpoints','getApisSummary','executeApiOperation','exportApis','register_api','probe_api','delete_api']) if(!runtime.includes(token)) failures.push(`Runtime missing ${token}`)
for(const rel of ['summary','execute','export']) {
  const file=path.join(root,`app/api/saas-factory/apis/${rel}/route.ts`)
  if(fs.existsSync(file)&&!fs.readFileSync(file,'utf8').includes('../../../../../lib/saas-factory/apis-runtime')) failures.push(`${rel} route wrong import`)
}
if(failures.length){console.error('SaaS Factory APIs verification failed:'); failures.forEach(f=>console.error('- '+f)); process.exit(1)}
console.log('SaaS Factory APIs verification passed.')
