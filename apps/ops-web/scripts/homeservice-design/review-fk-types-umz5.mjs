import fs from'node:fs';import path from'node:path';const root=process.cwd();let p=0,f=0;const read=x=>fs.readFileSync(path.join(root,x),'utf8');const exists=x=>fs.existsSync(path.join(root,x));const check=(n,v,d='')=>{console.log(`${v?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`);v?p++:f++};
const s=read('supabase/migrations/20260802_homeservice_design_os_ultra_mega_zip5_production_sovereignty.sql');
check('UMZ5 primary keys use uuid',(s.match(/id uuid primary key/g)||[]).length>=50);
check('internal foreign keys target uuid',!/\bbigint\s+references\s+public\./i.test(s));
check('CARELINK mission IDs are lineage values not foreign keys',s.includes('carelink_mission_id bigint')&&!/carelink_mission_id bigint references/i.test(s));
check('tenant identity remains text',s.includes("tenant_id text not null default 'angelcare-main'"));
check('sellable version foreign keys remain uuid',s.includes('sellable_version_id uuid references public.hsd_sellable_versions(id)'));
console.log(`\n${p}/${p+f} foreign-key compatibility checks passed.`);if(f)process.exit(1)
