import fs from'node:fs';import path from'node:path';const root=process.cwd();let p=0,f=0;const read=x=>fs.readFileSync(path.join(root,x),'utf8'),check=(n,v)=>{console.log(`${v?'PASS':'FAIL'}  ${n}`);v?p++:f++};
check("stable idempotency builder",read('lib/homeservice-handoff/server/idempotency.ts').includes('buildIdempotencyKey'));
check("tenant customer beneficiary sellable plan dates included",['tenantId','customerRef','beneficiaryRefs','sellableVersionId','technicalPlanVersionId','dates','requestId'].every(x=>read('lib/homeservice-handoff/server/idempotency.ts').includes(x)));
check("unique database key",read('supabase/migrations/20260801_homeservice_design_os_ultra_mega_zip4_carelink_handoff.sql').includes('unique(tenant_id,idempotency_key)'));
check("existing result return in RPC",read('supabase/migrations/20260801_homeservice_design_os_ultra_mega_zip4_carelink_handoff.sql').includes('existing_t.parent_mission_id'));
check("duplicate preflight blocker",read('lib/homeservice-handoff/server/preflight.ts').includes('DUPLICATE_HANDOFF'));
console.log(`\n${p}/${p+f} checks passed.`);if(f)process.exit(1);
