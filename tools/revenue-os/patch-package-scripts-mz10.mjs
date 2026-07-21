import fs from 'node:fs';
const p=process.argv[2]||'apps/ops-web/package.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));j.scripts||={};Object.assign(j.scripts,{
'revenue-os:phase10:verify':'node scripts/revenue-command-os/verify-phase10.mjs',
'revenue-os:phase10:test':'node scripts/revenue-command-os/test-phase10.mjs',
'revenue-os:phase10:typecheck':'node --max-old-space-size=8192 ../../node_modules/typescript/bin/tsc -p tsconfig.revenue-os-phase10.json --noEmit'
});fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');
