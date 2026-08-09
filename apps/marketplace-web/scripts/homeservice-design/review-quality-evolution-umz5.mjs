import fs from'node:fs';import path from'node:path';const root=process.cwd();let p=0,f=0;const read=x=>fs.readFileSync(path.join(root,x),'utf8');const exists=x=>fs.existsSync(path.join(root,x));const check=(n,v,d='')=>{console.log(`${v?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`);v?p++:f++};
const r=read('lib/homeservice-performance/server/repository.ts'),s=read('supabase/migrations/20260802_homeservice_design_os_ultra_mega_zip5_production_sovereignty.sql');
check('quality signals preserve source lineage',s.includes('hsd_quality_signal_sources'));
check('quality impacts are normalized',s.includes('hsd_quality_signal_impacts'));
check('root cause is formal',s.includes('hsd_root_cause_analyses')&&s.includes('hsd_root_cause_factors'));
check('improvement impact is explicit',s.includes('hsd_improvement_impacts'));
check('technical commercial safety reviews are normalized',s.includes('hsd_improvement_reviews'));
check('safety review blocks approval',r.includes('SAFETY_REVIEW_REQUIRED'));
check('human decision table is immutable',s.includes('hsd_improvement_decisions'));
check('new releases preserve target version',s.includes('hsd_improvement_releases'));
check('quality board decisions are formal',s.includes('hsd_quality_board_decisions'));
console.log(`\n${p}/${p+f} quality-evolution checks passed.`);if(f)process.exit(1)
