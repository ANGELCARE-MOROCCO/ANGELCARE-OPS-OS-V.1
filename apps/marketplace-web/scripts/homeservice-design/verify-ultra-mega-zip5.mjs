import fs from'node:fs';import path from'node:path';import{spawnSync}from'node:child_process'
const root=process.cwd();let p=0,f=0
const check=(n,v,d='')=>{console.log(`${v?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`);v?p++:f++}
const required=[
 'types/homeservice-performance.ts','lib/homeservice-performance/server/repository.ts',
 'lib/homeservice-performance/server/analytics.ts','lib/homeservice-performance/server/openrouter-free.ts',
 'components/carelink/service-design/performance/PerformanceUI.tsx',
 'components/carelink/service-design/performance/workspaces/ExecutiveIntelligenceWorkspace.tsx',
 'components/carelink/service-design/performance/workspaces/CustomerExperienceCommandWorkspace.tsx',
 'components/carelink/service-design/performance/workspaces/ProductionReadinessWorkspace.tsx',
 'app/carelink-ops/service-design/performance/page.tsx',
 'app/api/carelink-ops/service-design/performance/dashboard/route.ts',
 'supabase/migrations/20260802_homeservice_design_os_ultra_mega_zip5_production_sovereignty.sql'
]
for(const x of required)check(`required ${x}`,fs.existsSync(path.join(root,x)))
for(const prior of [
 'supabase/migrations/20260801_homeservice_design_os_ultra_mega_zip1_foundation.sql',
 'supabase/migrations/20260801_homeservice_design_os_ultra_mega_zip2_planning.sql',
 'supabase/migrations/20260801_homeservice_design_os_ultra_mega_zip3_commercial.sql',
 'supabase/migrations/20260801_homeservice_design_os_ultra_mega_zip4_carelink_handoff.sql'
])check(`cumulative baseline ${path.basename(prior)}`,fs.existsSync(path.join(root,prior)))
for(const c of ['app/carelink-ops/page.tsx','app/carelink-ops/missions/page.tsx','app/carelink-ops/dispatch/page.tsx'])check(`CARELINK preserved ${c}`,fs.existsSync(path.join(root,c)))
for(const s of [
 'review-sql-umz5.mjs','review-performance-integrity-umz5.mjs','review-cx-integrity-umz5.mjs',
 'review-quality-evolution-umz5.mjs','review-reconciliation-readiness-umz5.mjs',
 'review-security-ai-umz5.mjs','review-workspaces-umz5.mjs','review-permissions-umz5.mjs','review-fk-types-umz5.mjs'
]){
 const r=spawnSync(process.execPath,[path.join(root,'scripts/homeservice-design',s)],{encoding:'utf8'})
 process.stdout.write(r.stdout||'');if(r.stderr)process.stderr.write(r.stderr)
 check(`${s} passes`,r.status===0)
}
const local=path.join(root,'node_modules/.bin/tsc'),compiler=fs.existsSync(local)?local:'tsc'
const config=fs.existsSync(local)?'tsconfig.homeservice-design-umz5.json':'tsconfig.homeservice-design-umz5.shim.json'
const r=spawnSync(compiler,['-p',config,'--pretty','false'],{encoding:'utf8'})
check('strict isolated TypeScript passes',r.status===0,r.status===0?'0 errors':`${r.stdout||''}${r.stderr||''}`.trim().slice(-5000))
console.log(`\n${p}/${p+f} Ultra Mega ZIP 5 orchestrated acceptance checks passed.`)
if(f)process.exit(1)
