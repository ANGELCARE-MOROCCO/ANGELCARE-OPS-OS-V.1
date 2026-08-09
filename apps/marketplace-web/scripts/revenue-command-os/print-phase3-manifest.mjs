import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
const root=process.cwd()
const roots=[
  'app/(protected)/revenue-command-os/memory-learning',
  'app/api/revenue-command-os/knowledge-memory',
  'lib/revenue-command-os/knowledge-memory',
  'docs/revenue-command-os/phase-03',
  'tests/revenue-command-os/fixtures/phase3-doctrine-memory.json',
  'tests/revenue-command-os/fixtures/phase3-lifecycle-cases.json',
  'tests/revenue-command-os/fixtures/phase3-governance-cases.json',
  'scripts/revenue-command-os/verify-phase3.mjs',
  'scripts/revenue-command-os/print-phase3-manifest.mjs',
  'supabase/migrations/20260720_revenue_command_os_phase3_doctrine_memory.sql',
  'tsconfig.revenue-os-phase3.json',
  'lib/revenue-command-os/constants.ts',
  'lib/revenue-command-os/types.ts',
  'lib/revenue-command-os/search.ts',
  'app/api/revenue-command-os/search/route.ts',
  'lib/auth/permissions.ts',
  'lib/access-control.ts',
]
const files=[]
function walk(p){const absolute=path.join(root,p);if(!fs.existsSync(absolute))return;const stat=fs.statSync(absolute);if(stat.isDirectory())for(const item of fs.readdirSync(absolute))walk(path.join(p,item));else files.push({path:p,bytes:stat.size})}
for(const p of roots)walk(p)
files.sort((a,b)=>a.path.localeCompare(b.path))
console.log(JSON.stringify({release:'AC-REVENUE-OS-MZ03-DOCTRINE-MEMORY',files,totalBytes:files.reduce((s,f)=>s+f.bytes,0)},null,2))
