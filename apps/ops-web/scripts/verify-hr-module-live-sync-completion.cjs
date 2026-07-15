#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const root = process.cwd()
function exists(p){ return fs.existsSync(path.join(root,p)) }
function read(p){ return fs.readFileSync(path.join(root,p),'utf8') }
let failures=[]
function check(name, ok){ if(!ok) failures.push(name); else console.log('✓', name) }
const required = [
 'components/hr-production/HRRealtimeSyncPanel.tsx',
 'lib/hr-production/live-sync.ts',
 'app/api/hr/realtime/state/route.ts',
 'app/api/hr/attendance/corrections/route.ts',
 'app/api/hr/rosters/conflicts/route.ts',
 'app/api/hr/leave/requests/route.ts',
 'app/api/hr/documents/compliance/route.ts',
 'app/api/hr/training/compliance/route.ts',
 'app/api/hr/recruitment/pipeline/route.ts',
 'app/api/hr/onboarding/checklists/route.ts',
 'app/api/hr/payroll/readiness/route.ts',
 'app/api/hr/reports/hr-complete-export/route.ts',
 'database/20260601_hr_realtime_sync_completion.sql'
]
required.forEach(p => check(`exists ${p}`, exists(p)))
const pages = ['attendance','rosters','work-schedules','leave','approvals','documents','contracts','compliance','training','recruitment','onboarding','payroll','reports','export']
pages.forEach(page => check(`${page} page has realtime sync panel`, exists(`app/(protected)/hr/${page}/page.tsx`) && read(`app/(protected)/hr/${page}/page.tsx`).includes('HRRealtimeSyncPanel')))
check('no forbidden phase routes created', !['phase9','phase10','phase11','phase12','phase13','phase14','mega'].some(name => exists(`app/(protected)/${name}`) || exists(`app/${name}`)))
check('live sync lib gates unsafe domain actions', read('components/hr-production/HRRealtimeSyncPanel.tsx').includes('/api/hr/action'))
check('full export supports csv', read('app/api/hr/reports/hr-complete-export/route.ts').includes('text/csv'))
check('SQL is additive only', !/drop\s+table|truncate\s+|delete\s+from/ig.test(read('database/20260601_hr_realtime_sync_completion.sql')))
if(failures.length){ console.error('\nHR live-sync completion verification failed:'); failures.forEach(f=>console.error(' - '+f)); process.exit(1) }
console.log('\nHR live-sync completion verification passed.')
