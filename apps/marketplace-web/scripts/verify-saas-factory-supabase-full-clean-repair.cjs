const fs=require('fs'),path=require('path')
const root=process.cwd()
const files=[
'app/(protected)/saas-factory-command/supabase/page.tsx',
'components/saas-factory/supabase/SaasFactorySupabaseCommandCenter.tsx',
'lib/saas-factory/supabase-runtime.ts',
'app/api/saas-factory/supabase/summary/route.ts',
'app/api/saas-factory/supabase/execute/route.ts',
'app/api/saas-factory/supabase/export/route.ts',
'database/20260531_saas_factory_supabase_full_clean_repair.sql'
]
const failures=[]
for(const file of files) if(!fs.existsSync(path.join(root,file))) failures.push(`Missing ${file}`)
const page=fs.existsSync(path.join(root,files[0]))?fs.readFileSync(path.join(root,files[0]),'utf8'):''
if(!page.includes('SaasFactorySupabaseCommandCenter')) failures.push('Supabase route is not using dedicated Supabase component')
if(page.includes('SaasFactoryCommandCenter page="supabase"')) failures.push('Supabase route still uses generic command center')
const component=fs.existsSync(path.join(root,files[1]))?fs.readFileSync(path.join(root,files[1]),'utf8'):''
for(const token of ['Supabase Tables & Resources Overview','scrollBox','onDoubleClick','Resource Explorer','Policy Remediation Center','Evidence Detail','SaasFactorySupabaseCommandCenter']) if(!component.includes(token)) failures.push(`Component missing ${token}`)
const runtime=fs.existsSync(path.join(root,files[2]))?fs.readFileSync(path.join(root,files[2]),'utf8'):''
for(const token of ['seedSupabaseResources','getSupabaseSummary','executeSupabaseOperation','exportSupabase','destructive_sql','safe_migration_preview']) if(!runtime.includes(token)) failures.push(`Runtime missing ${token}`)
for(const rel of ['summary','execute','export']) {
  const file=path.join(root,`app/api/saas-factory/supabase/${rel}/route.ts`)
  if(fs.existsSync(file)&&!fs.readFileSync(file,'utf8').includes('../../../../../lib/saas-factory/supabase-runtime')) failures.push(`${rel} route wrong import`)
}
if(failures.length){console.error('Supabase full clean repair verification failed:'); failures.forEach(f=>console.error('- '+f)); process.exit(1)}
console.log('Supabase full clean repair verification passed.')
