import fs from'node:fs';import path from'node:path';const root=process.cwd();let p=0,f=0;const read=x=>fs.readFileSync(path.join(root,x),'utf8'),check=(n,v)=>{console.log(`${v?'PASS':'FAIL'}  ${n}`);v?p++:f++};
check("24 permissions in constants",(read('lib/homeservice-handoff/constants.ts').match(/homeservice_design\.[a-z_]+/g)||[]).length>=24);
check("separate commit permission",read('lib/homeservice-handoff/constants.ts').includes('commit_carelink_handoffs'));
check("separate sensitive permission",read('lib/homeservice-handoff/constants.ts').includes('view_sensitive_handoff_data'));
check("separate amendment approval",read('lib/homeservice-handoff/constants.ts').includes('approve_handoff_amendments'));
check("separate reconciliation permission",read('lib/homeservice-handoff/constants.ts').includes('run_handoff_reconciliation'));
check("server API permission checks",read('lib/homeservice-handoff/server/api-command.ts').includes('requireHomeServiceApi'));
console.log(`\n${p}/${p+f} checks passed.`);if(f)process.exit(1);
