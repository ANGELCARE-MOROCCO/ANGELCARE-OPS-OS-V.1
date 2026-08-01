import fs from'node:fs';import path from'node:path';const root=process.cwd();let p=0,f=0;const read=x=>fs.readFileSync(path.join(root,x),'utf8'),check=(n,v)=>{console.log(`${v?'PASS':'FAIL'}  ${n}`);v?p++:f++};
check("mission count reconciliation",read('supabase/migrations/20260801_homeservice_design_os_ultra_mega_zip4_carelink_handoff.sql').includes("'mission_count','critical'"));
check("date reconciliation",read('supabase/migrations/20260801_homeservice_design_os_ultra_mega_zip4_carelink_handoff.sql').includes("'mission_dates','critical'"));
check("time reconciliation",read('supabase/migrations/20260801_homeservice_design_os_ultra_mega_zip4_carelink_handoff.sql').includes("'mission_times','critical'"));
check("programme reconciliation",read('supabase/migrations/20260801_homeservice_design_os_ultra_mega_zip4_carelink_handoff.sql').includes("'programme_lines','warning'"));
check("critical blocks reconciled status",read('supabase/migrations/20260801_homeservice_design_os_ultra_mega_zip4_carelink_handoff.sql').includes("CASE WHEN crit>0 THEN 'critical'"));
check("reconciliation UI",fs.existsSync(path.join(root,'components/carelink/service-design/handoff/workspaces/ReconciliationControlWorkspace.tsx')));
console.log(`\n${p}/${p+f} checks passed.`);if(f)process.exit(1);
