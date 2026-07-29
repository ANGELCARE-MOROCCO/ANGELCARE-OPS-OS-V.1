import { spawnSync } from "node:child_process";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("FAIL: SUPABASE_DB_URL is required.");
  process.exit(1);
}
const sql = String.raw`
select 'grounded_quota' as gate, case when exists (
  select 1 from public.ai_provider_quota_policies
  where scope_type='module' and scope_key='ac_capital_os' and enabled and coalesce(max_grounded_requests_per_day,0)>0
) then '1' else '0' end as value
union all
select 'capability_assignment', case when exists (
  select 1 from public.ai_provider_module_assignments
  where module_key='ac_capital_os' and enabled and capability_allowlist @> array['grounded_research','structured_content']::text[]
) then '1' else '0' end;

select 'routing_rules' as gate, count(*)::text as value from public.ai_provider_routing_rules
where module_key='ac_capital_os' and capability in ('grounded_research','structured_content') and enabled
union all select 'command_policies', count(*)::text from public.ai_provider_command_policies
where module_key='ac_capital_os' and command_code in ('AC_CAPITAL_RADAR_GROUNDED_RESEARCH','AC_CAPITAL_REPORT_COMPOSE') and enabled
union all select 'rejection_table', case when to_regclass('public.ac_capital_radar_rejections') is not null then '1' else '0' end
union all select 'research_run_updated_at', count(*)::text from information_schema.columns where table_schema='public' and table_name='ac_capital_radar_research_runs' and column_name='updated_at'
union all select 'report_generated_body', count(*)::text from information_schema.columns where table_schema='public' and table_name='ac_capital_strategy_reports' and column_name='generated_body'
union all select 'report_output_reference', count(*)::text from information_schema.columns where table_schema='public' and table_name='ac_capital_report_exports' and column_name='report_id';
`;
const result = spawnSync("psql", [dbUrl, "-X", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8" });
process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
if (result.status !== 0) process.exit(result.status || 1);
const rows = (result.stdout || "").split(/\r?\n/).filter((line) => /\|/.test(line) && !/gate\s*\|/.test(line) && !/[-]+\+/.test(line));
const expected = new Map([["grounded_quota",1],["capability_assignment",1],["routing_rules",2],["command_policies",2],["rejection_table",1],["research_run_updated_at",1],["report_generated_body",1],["report_output_reference",1]]);
for (const line of rows) {
  const [gateRaw,valueRaw] = line.split("|");
  const gate = gateRaw?.trim();
  if (!expected.has(gate)) continue;
  const value = Number(valueRaw?.trim());
  if (value < expected.get(gate)) {
    console.error(`FAIL: ${gate} expected at least ${expected.get(gate)}, received ${value}`);
    process.exit(1);
  }
  expected.delete(gate);
}
if (expected.size) {
  console.error(`FAIL: missing database verification rows: ${[...expected.keys()].join(", ")}`);
  process.exit(1);
}
console.log("AC_CAPITAL_OS_RUNTIME_TRUTH_REPAIR_01_DATABASE_VERIFIED");
