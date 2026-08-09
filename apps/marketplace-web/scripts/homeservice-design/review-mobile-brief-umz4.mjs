import fs from'node:fs';import path from'node:path';const root=process.cwd();let p=0,f=0;const read=x=>fs.readFileSync(path.join(root,x),'utf8'),check=(n,v)=>{console.log(`${v?'PASS':'FAIL'}  ${n}`);v?p++:f++};
check("brief per sub-mission",read('lib/homeservice-handoff/server/repository.ts').includes('mobileBriefs.length'));
check("brief source hash",read('lib/homeservice-handoff/server/repository.ts').includes('source_hash:await sha256'));
check("brief sections include programme",read('lib/homeservice-handoff/server/blueprint.ts').includes('programme:d.blocks.map'));
check("brief includes safeguards",read('lib/homeservice-handoff/server/blueprint.ts').includes('safeguards:Array.from'));
check("brief excludes pricing",!read('lib/homeservice-handoff/server/blueprint.ts').includes('grossMargin'));
check("smartphone preview exists",read('components/carelink/service-design/handoff/workspaces/MobileBriefPreviewWorkspace.tsx').includes('border-[10px]'));
console.log(`\n${p}/${p+f} checks passed.`);if(f)process.exit(1);
