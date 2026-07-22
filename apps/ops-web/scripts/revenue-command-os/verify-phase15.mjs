import fs from 'node:fs'
import path from 'node:path'
const cwd=process.cwd()
const required=[
 'lib/revenue-command-os/cockpit/types.ts','lib/revenue-command-os/cockpit/read-model.ts','lib/revenue-command-os/cockpit/exception-engine.ts','lib/revenue-command-os/cockpit/executive-brief.ts','lib/revenue-command-os/cockpit/service.ts','lib/revenue-command-os/cockpit/route-handler.ts',
 'app/(protected)/revenue-command-os/cockpit/page.tsx','app/(protected)/revenue-command-os/cockpit/_components/PremiumRevenueCockpit.tsx',
 'supabase/migrations/20260721_revenue_command_os_phase15_premium_cockpit.sql','fixtures/revenue-command-os/phase15-cockpit-scenario.json'
]
const zones=['objective-command','live-signals','strategy-assembly','validation-council','active-programs','command-runs','campaign-waves','mission-compiler','execution-progress','revenue-exceptions','experiments-winning-plays','revenue-learning-memory','approvals-governance']
const api=['route','brief','objective','signals','strategies','council','programs','runs','campaigns','compiler','execution','exceptions','approvals','learning','timeline','acknowledge','intervene','resolve-exception','save-view','create-watchlist','export-brief']
const failures=[]; let passed=0
const check=(ok,msg)=>{if(ok)passed++;else failures.push(msg)}
for(const f of required)check(fs.existsSync(path.join(cwd,f)),`missing ${f}`)
const types=fs.readFileSync(path.join(cwd,'lib/revenue-command-os/cockpit/types.ts'),'utf8')
for(const z of zones)check(types.includes(`'${z}'`),`zone missing ${z}`)
for(const r of api)check(fs.existsSync(path.join(cwd,`app/api/revenue-command-os/cockpit/${r==='route'?'route.ts':`${r}/route.ts`}`)),`route missing ${r}`)
const ui=fs.readFileSync(path.join(cwd,'app/(protected)/revenue-command-os/cockpit/_components/PremiumRevenueCockpit.tsx'),'utf8')
for(const phrase of ['Ce que le moteur cherche à gagner','Ce qui a changé','Décision immédiate','Ce qui se passe ensuite','Exceptions revenus','Approbations & gouvernance'])check(ui.includes(phrase),`UX contract phrase missing: ${phrase}`)
const constants=fs.readFileSync(path.join(cwd,'lib/revenue-command-os/constants.ts'),'utf8')
check(constants.includes('AC-REVENUE-OS-MZ15-PREMIUM-COCKPIT')||constants.includes('AC-REVENUE-OS-MZ16-MEGA-PRODUCTION'),'release constant missing')
check(constants.includes('/revenue-command-os/cockpit'),'cockpit workspace missing')
const m14crypto=fs.readFileSync(path.join(cwd,'lib/revenue-command-os/execution-autopilot/crypto.ts'),'utf8')
check(m14crypto.includes('Record<string,unknown>'),'MZ14 recursive redaction strict fix missing')
const m14repo=fs.readFileSync(path.join(cwd,'lib/revenue-command-os/execution-autopilot/repository.ts'),'utf8')
check(m14repo.includes('Promise<ExecutionAction[]>'),'MZ14 listActions strict fix missing')
const sql=fs.readFileSync(path.join(cwd,'supabase/migrations/20260721_revenue_command_os_phase15_premium_cockpit.sql'),'utf8')
for(const token of ['BEGIN;','COMMIT;','phase_introduced','external_actions_enabled=false','revenue_os_cockpit_exceptions','revenue_os_executive_briefs'])check(sql.includes(token),`SQL token missing ${token}`)
check(!/(postgresql:\/\/|sk-proj-|AIza[0-9A-Za-z_-]{20,})/.test([types,ui,sql].join('\n')),'embedded secret detected')
console.log(JSON.stringify({phase:'MZ15',passed,failed:failures.length,failures,mandatoryZones:13,apiRoutes:21,externalActions:0,mode:'approval-gated'},null,2))
if(failures.length)process.exit(1)
