import fs from 'node:fs'
import path from 'node:path'
const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260728_2200_content_command_research_runtime_control.sql'), 'utf8')
const tables = [
  'market_content_research_provider_policies','market_content_research_agents','market_content_research_agent_versions',
  'market_content_research_runs','market_content_research_run_events','market_content_research_usage_ledger',
  'market_content_research_overrides','market_content_research_alerts','ac_capital_public_source_registry',
  'market_content_research_findings','market_content_research_audit',
]
for (const table of tables) {
  if (!sql.includes(`create table if not exists public.${table}`)) throw new Error(`SQL table missing: ${table}`)
  if (!sql.includes(`'${table}'`)) throw new Error(`RLS/grant registry missing: ${table}`)
}
for (const marker of ["approval_boundary = 'external_only'", 'enable row level security', 'revoke all on table', 'grant all on table', 'next_run_at = now()']) {
  if (!sql.includes(marker)) throw new Error(`SQL safety/scheduler marker missing: ${marker}`)
}
if (!/^begin;[\s\S]*commit;\s*$/m.test(sql.trim())) throw new Error('SQL transaction boundary is incomplete')
console.log('PASS — additive persistence, RLS, scheduler checkpoint and external-only authority SQL verified')
