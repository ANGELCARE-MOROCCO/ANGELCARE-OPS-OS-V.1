import { execFileSync } from "node:child_process";

const url = process.env.SUPABASE_DB_URL;
if (!url) throw new Error("SUPABASE_DB_URL is required.");

const sql = `
\\pset tuples_only on
select
  case when to_regclass('public.ac_capital_command_activity') is not null then 'TABLE_OK' else 'TABLE_MISSING' end;
select
  case when exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='ac_capital_command_activity' and c.relrowsecurity
  ) then 'RLS_OK' else 'RLS_MISSING' end;
select
  case when count(*)=0 then 'AMBIGUITY_PATTERN_CLEARED' else 'AMBIGUITY_PATTERN_REMAINS:'||count(*) end
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and pg_get_functiondef(p.oid) ~* 'select[[:space:]]+decision[[:space:]]+into[[:space:]]+decision';
`;

const output = execFileSync("psql", [url, "-X", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8" });
process.stdout.write(output);
if (!output.includes("TABLE_OK") || !output.includes("RLS_OK") || !output.includes("AMBIGUITY_PATTERN_CLEARED")) {
  throw new Error("MZ16 live database verification did not pass.");
}
console.log("AC_CAPITAL_OS_MZ16_DATABASE_VERIFIED");
