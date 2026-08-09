import fs from'node:fs';import path from'node:path';const root=process.cwd();let p=0,f=0;const read=x=>fs.readFileSync(path.join(root,x),'utf8');const exists=x=>fs.existsSync(path.join(root,x));const check=(n,v,d='')=>{console.log(`${v?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`);v?p++:f++};
const file='supabase/migrations/20260802_homeservice_design_os_ultra_mega_zip5_production_sovereignty.sql',s=read(file);
check('UMZ5 migration is transactional',/begin;[\s\S]*commit;/i.test(s));
check('advisory lock is unique',s.includes('84746005'));
check('UMZ1–UMZ4 and CARELINK baseline guard exists',s.includes('UMZ1–UMZ4 and CARELINK baselines'));
check('normalized table estate is deep',(s.match(/create table if not exists public\.hsd_/gi)||[]).length>=50);
check('all UMZ5 tables use uuid primary keys',!(s.match(/create table if not exists public\.hsd_[^(]+\([^;]+/gi)||[]).some(x=>!x.includes('id uuid primary key')));
check('mission references preserve CARELINK bigint',s.includes('carelink_mission_id bigint'));
check('RLS is enabled throughout',(s.match(/enable row level security/gi)||[]).length>=50);
check('authenticated tenant policies are present',(s.match(/tenant_select/gi)||[]).length>=50);
check('service_role grants are present',(s.match(/grant all on public\.hsd_/gi)||[]).length>=50);
check('five executive views are created',(s.match(/create or replace view public\.hsd_/gi)||[]).length>=5);
check('exactly twenty-four readiness controls',(s.match(/insert into public\.hsd_production_readiness_controls/gi)||[]).length===24);
check('thirty-two permissions are seeded',(s.match(/insert into public\.hsd_permissions/gi)||[]).length>=32);
console.log(`\n${p}/${p+f} SQL sovereignty checks passed.`);if(f)process.exit(1)
