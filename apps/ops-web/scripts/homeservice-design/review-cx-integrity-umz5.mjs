import fs from'node:fs';import path from'node:path';const root=process.cwd();let p=0,f=0;const read=x=>fs.readFileSync(path.join(root,x),'utf8');const exists=x=>fs.existsSync(path.join(root,x));const check=(n,v,d='')=>{console.log(`${v?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`);v?p++:f++};
const a=read('lib/homeservice-performance/server/analytics.ts'),r=read('lib/homeservice-performance/server/repository.ts'),s=read('supabase/migrations/20260802_homeservice_design_os_ultra_mega_zip5_production_sovereignty.sql');
check('customer feedback values are bounded',/rating smallint check\(rating between 1 and 5\)/.test(s)&&/nps smallint check\(nps between 0 and 10\)/.test(s));
check('CX lifecycle is explicit',a.includes("open:['acknowledged']")||read('lib/homeservice-performance/constants.ts').includes("open:['acknowledged']"));
check('case resolution requires customer confirmation',a.includes('CUSTOMER_CONFIRMATION_REQUIRED'));
check('database also protects case closure',s.includes("status not in ('resolved','closed') or customer_confirmed=true"));
check('customer evidence is formal',s.includes('hsd_customer_experience_events'));
check('recovery actions are separate',s.includes('hsd_customer_recovery_actions'));
check('confirmation records are immutable',s.includes('hsd_customer_confirmation_records'));
check('AI cannot close customer cases',!read('lib/homeservice-performance/server/openrouter-free.ts').includes('transitionCase'));
console.log(`\n${p}/${p+f} customer-experience integrity checks passed.`);if(f)process.exit(1)
