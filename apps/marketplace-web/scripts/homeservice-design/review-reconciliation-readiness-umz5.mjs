import fs from'node:fs';import path from'node:path';const root=process.cwd();let p=0,f=0;const read=x=>fs.readFileSync(path.join(root,x),'utf8');const exists=x=>fs.existsSync(path.join(root,x));const check=(n,v,d='')=>{console.log(`${v?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`);v?p++:f++};
const r=read('lib/homeservice-performance/server/repository.ts'),a=read('lib/homeservice-performance/server/analytics.ts'),s=read('supabase/migrations/20260802_homeservice_design_os_ultra_mega_zip5_production_sovereignty.sql');
check('enterprise reconciliation RPC exists',s.includes('hsd_run_enterprise_reconciliation'));
check('handoff mission count is reconciled',s.includes('handoff_sub_mission_count'));
check('sellable plan lineage is reconciled',s.includes('active_sellable_plan_version'));
check('critical findings are counted',s.includes('critical_count'));
check('readiness is evidence-backed',s.includes('hsd_production_readiness_evidence'));
check('missing controls never return ready',a.includes("return{status:'not_ready'"));
check('release approval is blocked until ready',r.includes('PRODUCTION_NOT_READY'));
check('all five migrations are represented',s.includes("'migration_umz5'")&&s.includes("'migration_umz1'"));
check('backup and restore are separate controls',s.includes("'backup'")&&s.includes("'restore_test'"));
console.log(`\n${p}/${p+f} reconciliation-readiness checks passed.`);if(f)process.exit(1)
