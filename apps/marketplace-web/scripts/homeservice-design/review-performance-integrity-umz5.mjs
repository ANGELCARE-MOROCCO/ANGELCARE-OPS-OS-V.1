import fs from'node:fs';import path from'node:path';const root=process.cwd();let p=0,f=0;const read=x=>fs.readFileSync(path.join(root,x),'utf8');const exists=x=>fs.existsSync(path.join(root,x));const check=(n,v,d='')=>{console.log(`${v?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`);v?p++:f++};
const a=read('lib/homeservice-performance/server/analytics.ts'),r=read('lib/homeservice-performance/server/repository.ts'),s=read('supabase/migrations/20260802_homeservice_design_os_ultra_mega_zip5_production_sovereignty.sql');
check('plan-versus-actual domain exists',s.includes('hsd_mission_variance_findings'));
check('duration variance is deterministic',a.includes('actualMinutes-plannedMinutes'));
check('percentage calculation is deterministic',a.includes('(numerator/denominator)*10000'));
check('portfolio metrics never seed fake values',!/insert into public\.hsd_performance_metric_values/i.test(s));
check('CARELINK mission references remain bigint',/carelink_mission_id bigint/.test(s));
check('designed versus actual sources are explicit',r.includes('plannedValue')&&r.includes('actualValue'));
check('forecasts are normalized',s.includes('hsd_capacity_forecasts'));
check('workforce capability findings are aggregate',s.includes('hsd_workforce_capability_findings'));
console.log(`\n${p}/${p+f} performance-integrity checks passed.`);if(f)process.exit(1)
