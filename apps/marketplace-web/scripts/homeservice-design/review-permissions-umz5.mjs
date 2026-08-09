import fs from'node:fs';import path from'node:path';const root=process.cwd();let p=0,f=0;const read=x=>fs.readFileSync(path.join(root,x),'utf8');const exists=x=>fs.existsSync(path.join(root,x));const check=(n,v,d='')=>{console.log(`${v?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`);v?p++:f++};
const s=read('supabase/migrations/20260802_homeservice_design_os_ultra_mega_zip5_production_sovereignty.sql'),a=read('lib/homeservice-performance/server/api-command.ts');
const perms=[...s.matchAll(/values\('(homeservice_design\.[^']+)'/gi)].map(x=>x[1]);
check('thirty-two UMZ5 permissions are seeded',new Set(perms.filter(x=>!x.includes('migration_'))).size>=32);
for(const x of ['close_customer_experience_cases','approve_improvement_proposals','run_reconciliation','approve_production_release','manage_system_incidents'])check(`${x} is enforced`,a.includes(`homeservice_design.${x}`));
check('cost or margin data is not exposed through AI',!read('lib/homeservice-performance/server/openrouter-free.ts').includes('price_book'));
check('consequential mutations use server API boundary',a.includes('requireHomeServiceApi'));
console.log(`\n${p}/${p+f} permission-authority checks passed.`);if(f)process.exit(1)
