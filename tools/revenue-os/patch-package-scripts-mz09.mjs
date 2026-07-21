import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(process.argv[2]||'.');
const targets=[path.join(root,'package.json'),path.join(root,'apps/ops-web/package.json')].filter(fs.existsSync);
if(!targets.length){console.log('No package.json found in focused handoff; live monorepo patch deferred.');process.exit(0)}
for(const file of targets){const pkg=JSON.parse(fs.readFileSync(file,'utf8'));pkg.scripts ||= {};const atRoot=file===path.join(root,'package.json');const pre=atRoot?'cd apps/ops-web && ':'';const tsc=atRoot?'tsc -p apps/ops-web/tsconfig.revenue-os-phase9-kernel.json --noEmit':'tsc -p tsconfig.revenue-os-phase9-kernel.json --noEmit';const integration=atRoot?'tsc -p apps/ops-web/tsconfig.revenue-os-phase9.json --noEmit':'tsc -p tsconfig.revenue-os-phase9.json --noEmit';Object.assign(pkg.scripts,{
'revenue-os:phase09:typecheck':tsc,
'revenue-os:phase09:verify':`${pre}node scripts/revenue-command-os/verify-phase9.mjs`,
'revenue-os:phase09:test':`${pre}node scripts/revenue-command-os/run-phase9-command-tests.mjs`,
'revenue-os:phase09:semantic-review':`${pre}node scripts/revenue-command-os/review-phase9-semantic-duplicates.mjs`,
'revenue-os:phase09:sql-review':`${pre}node scripts/revenue-command-os/review-phase9-sql.mjs`,
'revenue-os:phase09:typecheck:integration':integration});fs.writeFileSync(file,JSON.stringify(pkg,null,2)+'\n');console.log(`✓ Patched ${path.relative(root,file)}`)}
