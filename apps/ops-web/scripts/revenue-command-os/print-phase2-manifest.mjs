import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
const root = process.cwd()
const roots = [
  'app/(protected)/revenue-command-os/digital-twin',
  'app/api/revenue-command-os/digital-twin',
  'lib/revenue-command-os/digital-twin',
  'docs/revenue-command-os/phase-02',
  'tests/revenue-command-os/fixtures',
  'scripts/revenue-command-os/verify-phase2.mjs',
  'scripts/revenue-command-os/print-phase2-manifest.mjs',
  'supabase/migrations/20260720_revenue_command_os_phase2_digital_twin.sql',
  'tsconfig.revenue-os-phase2.json'
]
const files=[]
function walk(p){const absolute=path.join(root,p); if(!fs.existsSync(absolute))return; const stat=fs.statSync(absolute); if(stat.isDirectory())for(const item of fs.readdirSync(absolute))walk(path.join(p,item)); else files.push({path:p,bytes:stat.size})}
for(const p of roots)walk(p)
files.sort((a,b)=>a.path.localeCompare(b.path))
console.log(JSON.stringify({release:'AC-REVENUE-OS-MZ02-DIGITAL-TWIN',files,totalBytes:files.reduce((s,f)=>s+f.bytes,0)},null,2))
