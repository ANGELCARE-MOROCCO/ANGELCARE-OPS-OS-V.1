import fs from 'node:fs'
const target=process.argv[2]
if(!target||!fs.existsSync(target)){console.error('package.json target missing');process.exit(2)}
const p=JSON.parse(fs.readFileSync(target,'utf8'))
p.scripts={...(p.scripts||{}),
 'revenue-os:phase15:verify':'node scripts/revenue-command-os/verify-phase15.mjs',
 'revenue-os:phase15:test':'node scripts/revenue-command-os/test-phase15.mjs',
 'revenue-os:phase15:sql-review':'node scripts/revenue-command-os/sql-review-phase15.mjs',
 'revenue-os:phase15:typecheck':'NODE_OPTIONS=--max-old-space-size=8192 tsc -p tsconfig.revenue-os-phase15.json --noEmit',
 'revenue-os:phase15:smoke':'bash ../../tools/revenue-os/smoke-phase15-cockpit.sh ../..'}
fs.writeFileSync(target,JSON.stringify(p,null,2)+'\n')
console.log('MZ15 package scripts patched.')
