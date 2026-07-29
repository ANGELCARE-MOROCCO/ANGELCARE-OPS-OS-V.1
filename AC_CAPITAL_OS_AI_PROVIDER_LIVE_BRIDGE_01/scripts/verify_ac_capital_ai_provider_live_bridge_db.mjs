import { spawnSync } from "node:child_process";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("FAIL: SUPABASE_DB_URL is required.");
  process.exit(1);
}
const sql = `
\\pset pager off
select 'module_registry' as gate, count(*)::text as value from public.ai_ops_module_registry where registry_key='ac_capital_os'
union all select 'provider_assignment', count(*)::text from public.ai_provider_module_assignments where module_key='ac_capital_os' and enabled
union all select 'routing_rule', count(*)::text from public.ai_provider_routing_rules where module_key='ac_capital_os' and capability='capital_intelligence' and enabled
union all select 'module_quota', count(*)::text from public.ai_provider_quota_policies where scope_type='module' and scope_key='ac_capital_os' and enabled
union all select 'command_policy', count(*)::text from public.ai_provider_command_policies where module_key='ac_capital_os' and command_code='AC_CAPITAL_GOVERNED_RUN' and enabled
union all select 'capital_agent', count(*)::text from public.ac_capital_ai_agents where agent_key='ac_capital_intelligence_director' and status='Active'
union all select 'active_credential', count(*)::text from public.ai_provider_credentials c join public.ai_provider_dossiers d on d.id=c.dossier_id where lower(d.name)=lower('Gemini AC CAPITAL OS Production') and c.status='active';
`;
const result = spawnSync("psql", [dbUrl, "-X", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8" });
process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
if (result.status !== 0) process.exit(result.status || 1);
const rows = (result.stdout || "").split(/\r?\n/).filter((line) => /\|/.test(line) && !/gate\s*\|/.test(line) && !/[-]+\+/.test(line));
const failed = rows.filter((line) => !/\|\s*[1-9][0-9]*\s*$/.test(line));
if (failed.length) {
  console.error("FAIL: one or more live bridge gates returned zero.");
  process.exit(1);
}
console.log("AC_CAPITAL_AI_PROVIDER_LIVE_BRIDGE_DATABASE_VERIFIED");
