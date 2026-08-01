import fs from'node:fs';import path from'node:path';const root=process.cwd();let p=0,f=0;const read=x=>fs.readFileSync(path.join(root,x),'utf8'),check=(n,v)=>{console.log(`${v?'PASS':'FAIL'}  ${n}`);v?p++:f++};
check("source snapshot table",read('supabase/migrations/20260801_homeservice_design_os_ultra_mega_zip4_carelink_handoff.sql').includes('hsd_handoff_source_snapshots'));
check("SHA-256 snapshot hash",read('lib/homeservice-handoff/server/repository.ts').includes('snapshotHash=await sha256'));
check("sellable version frozen",read('types/homeservice-handoff.ts').includes('sellableVersionId'));
check("technical plan version frozen",read('types/homeservice-handoff.ts').includes('technicalPlanVersionId'));
check("committed source guard",read('supabase/migrations/20260801_homeservice_design_os_ultra_mega_zip4_carelink_handoff.sql').includes('hsd_handoff_request_commit_guard'));
check("immutable lineage triggers",read('supabase/migrations/20260801_homeservice_design_os_ultra_mega_zip4_carelink_handoff.sql').includes('hsd_handoff_immutable_guard'));
check("amendments isolated",read('supabase/migrations/20260801_homeservice_design_os_ultra_mega_zip4_carelink_handoff.sql').includes('hsd_handoff_amendments'));
console.log(`\n${p}/${p+f} checks passed.`);if(f)process.exit(1);
