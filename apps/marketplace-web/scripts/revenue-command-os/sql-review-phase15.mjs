import fs from 'node:fs'
const sql=fs.readFileSync(new URL('../../supabase/migrations/20260721_revenue_command_os_phase15_premium_cockpit.sql',import.meta.url),'utf8')
const rollback=fs.readFileSync(new URL('../../docs/revenue-command-os/phase-15/ROLLBACK.sql',import.meta.url),'utf8')
const tables=[...sql.matchAll(/CREATE TABLE IF NOT EXISTS public\.(revenue_os_[a-z0-9_]+)/gi)].map(m=>m[1])
const checks={transaction:/BEGIN;[\s\S]*COMMIT;/i.test(sql),tables:new Set(tables).size===15,views:(sql.match(/CREATE OR REPLACE VIEW/gi)||[]).length===3,rls:sql.includes('ENABLE ROW LEVEL SECURITY'),serviceOnly:sql.includes('REVOKE ALL ON TABLE')&&sql.includes('TO service_role'),permissions:sql.includes('phase_introduced,active')&&sql.includes('revenue_os.cockpit.admin'),externalLock:sql.includes('external_actions_enabled=false'),workspace:sql.includes("'/revenue-command-os/cockpit'"),registry:sql.includes('AC-REVENUE-OS-MZ15-PREMIUM-COCKPIT'),rollback:/DROP TABLE IF EXISTS public\.revenue_os_cockpit_/i.test(rollback),noSecrets:!/(postgresql:\/\/|sk-proj-|AIza[0-9A-Za-z_-]{20,})/.test(sql)}
const passed=Object.values(checks).filter(Boolean).length,failed=Object.values(checks).length-passed
console.log(JSON.stringify({phase:'MZ15',checks,passed,failed,tables:new Set(tables).size},null,2));if(failed)process.exit(1)
