import fs from 'node:fs';import path from 'node:path';
const root=process.argv[2];if(!root)throw new Error('Monorepo path required');
const scriptsRoot={
'revenue-os:phase07:typecheck':'tsc -p apps/ops-web/tsconfig.revenue-os-phase7-kernel.json --noEmit',
'revenue-os:phase07:typecheck:integration':'tsc -p apps/ops-web/tsconfig.revenue-os-phase7.json --noEmit',
'revenue-os:phase07:verify':'node apps/ops-web/scripts/revenue-command-os/verify-phase7.mjs',
'revenue-os:phase07:test':'node apps/ops-web/scripts/revenue-command-os/run-phase7-command-tests.mjs',
'revenue-os:phase07:ui-syntax':'node apps/ops-web/scripts/revenue-command-os/transpile-phase7-ui.mjs',
'revenue-os:phase07:manifest':'node apps/ops-web/scripts/revenue-command-os/print-phase7-manifest.mjs',
'revenue-os:phase07:semantic-review':'node apps/ops-web/scripts/revenue-command-os/review-phase7-semantic-duplicates.mjs',
'revenue-os:phase07:sql-review':'node apps/ops-web/scripts/revenue-command-os/review-phase7-sql.mjs',
'revenue-os:phase07:verify:cumulative':'node apps/ops-web/scripts/revenue-command-os/verify-phase1.mjs && node apps/ops-web/scripts/revenue-command-os/verify-phase2.mjs && node apps/ops-web/scripts/revenue-command-os/verify-phase3.mjs && node apps/ops-web/scripts/revenue-command-os/verify-phase4.mjs && node apps/ops-web/scripts/revenue-command-os/verify-phase5.mjs && node apps/ops-web/scripts/revenue-command-os/verify-phase6.mjs && node apps/ops-web/scripts/revenue-command-os/verify-phase7.mjs'
};
const scriptsApp=Object.fromEntries(Object.entries(scriptsRoot).map(([k,v])=>[k,v.replaceAll('apps/ops-web/','')]));
const targets=[{file:path.join(root,'package.json'),scripts:scriptsRoot},{file:path.join(root,'apps/ops-web/package.json'),scripts:scriptsApp}];let changed=0;for(const target of targets){if(!fs.existsSync(target.file))continue;const pkg=JSON.parse(fs.readFileSync(target.file,'utf8'));pkg.scripts={...(pkg.scripts||{}),...target.scripts};fs.writeFileSync(target.file,JSON.stringify(pkg,null,2)+'\n');console.log(`Patched ${target.file}`);changed++;}if(!changed)console.warn('No package.json found in target.');
