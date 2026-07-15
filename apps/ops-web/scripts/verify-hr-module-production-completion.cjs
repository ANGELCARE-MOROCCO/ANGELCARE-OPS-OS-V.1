#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const root = process.cwd()
const requiredPaths = [
  'app/(protected)/hr/page.tsx',
  'app/(protected)/hr/employees/page.tsx',
  'app/(protected)/hr/employees/_components/EmployeesCommandCenter.tsx',
  'app/api/hr/health/route.ts',
  'app/api/hr/employees/route.ts',
  'app/api/hr/navigation/route.ts',
  'app/api/hr/live-snapshot/route.ts',
  'app/api/hr/diagnostics/route.ts',
  'app/api/hr/audit/recent/route.ts',
  'app/api/hr/action/route.ts',
  'components/hr-production/HRModuleCommandBridge.tsx',
  'lib/hr-production/operations.ts',
]
const requiredRoutes = ['hr','hr/employees','hr/attendance','hr/rosters','hr/work-schedules','hr/leave','hr/recruitment','hr/onboarding','hr/training','hr/documents','hr/payroll','hr/approvals','hr/audit','hr/system-health']
const forbiddenRoutes = ['phase9','phase10','phase11','phase12','phase13','phase14','mega'].map((x) => `app/(protected)/${x}/page.tsx`)

function fail(msg){ console.error(`✗ ${msg}`); process.exitCode = 1 }
function pass(msg){ console.log(`✓ ${msg}`) }
function exists(p){ return fs.existsSync(path.join(root,p)) }
function walk(dir, out=[]){ if(!fs.existsSync(dir)) return out; for(const item of fs.readdirSync(dir)){ const p=path.join(dir,item); const st=fs.statSync(p); if(st.isDirectory()) walk(p,out); else out.push(p) } return out }

for (const p of requiredPaths) exists(p) ? pass(`${p} exists`) : fail(`${p} missing`)
for (const r of requiredRoutes) exists(`app/(protected)/${r}/page.tsx`) || exists(`app/(protected)/${r}/page.ts`) ? pass(`/${r} route exists`) : fail(`/${r} route missing`)
for (const p of forbiddenRoutes) !exists(p) ? pass(`forbidden route absent: ${p}`) : fail(`forbidden route created: ${p}`)

const hrFiles = walk(path.join(root,'app/(protected)/hr')).concat(walk(path.join(root,'components/hr-production'))).filter((p)=>/\.(tsx?|jsx?)$/.test(p))
const combined = hrFiles.map((p)=>fs.readFileSync(p,'utf8')).join('\n')
const fakePatterns = [
  [/onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/, 'empty onClick handler'],
  [/onClick=\{\s*\(\)\s*=>\s*console\.log\(/, 'console.log-only onClick handler'],
  [/onClick=\{\s*\(\)\s*=>\s*alert\(/, 'alert-only onClick handler'],
]
for (const [pattern,label] of fakePatterns) pattern.test(combined) ? fail(`${label} found`) : pass(`no ${label}`)

const bridge = fs.readFileSync(path.join(root,'components/hr-production/HRModuleCommandBridge.tsx'),'utf8')
;['/api/hr/live-snapshot','/api/hr/diagnostics','/api/hr/audit/recent','/api/hr/action','downloadJSON','downloadCSV','Safe repair gate'].forEach((needle)=> bridge.includes(needle) ? pass(`bridge contains ${needle}`) : fail(`bridge missing ${needle}`))
const employeesApi = fs.readFileSync(path.join(root,'app/api/hr/employees/route.ts'),'utf8')
employeesApi.includes('safe_archive') ? pass('employee DELETE is safe archive by default') : fail('employee DELETE is not safe archive by default')
const ops = fs.readFileSync(path.join(root,'lib/hr-production/operations.ts'),'utf8')
;['buildHROperationalSnapshot','runHRDiagnostics','getHRRecentAudit','recordHRSafeAction'].forEach((needle)=> ops.includes(needle) ? pass(`operations contains ${needle}`) : fail(`operations missing ${needle}`))
if (process.exitCode) process.exit(process.exitCode)
console.log('HR MODULE PRODUCTION COMPLETION VERIFY PASSED')
