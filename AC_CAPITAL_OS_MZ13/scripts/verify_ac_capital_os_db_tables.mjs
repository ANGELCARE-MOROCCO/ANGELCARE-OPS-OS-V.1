import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
function exists(p) { return fs.existsSync(p); }
function findRoots(start) {
  const opsFromRepo = path.join(start, "apps", "ops-web");
  if (exists(opsFromRepo)) return { mode: "repository-root", repoRoot: start, opsRoot: opsFromRepo };
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) return { mode: "ops-web-root", repoRoot: path.resolve(start, "..", ".."), opsRoot: start };
  throw new Error("Run from repo root or apps/ops-web");
}
function assert(condition, message) { if (!condition) { console.error(`FAIL: ${message}`); process.exit(1); } }
const { repoRoot, opsRoot } = findRoots(cwd);

const migrationsDir = path.join(repoRoot, "supabase", "migrations");
const expected = [
  "ac_capital_os_module_registry","ac_capital_radar_opportunities","ac_capital_qualification_dossiers",
  "ac_capital_funders","ac_capital_doctrine_items","ac_capital_cases","ac_capital_data_room_documents",
  "ac_capital_pipeline_records","ac_capital_coordinator_tasks","ac_capital_ai_agents",
  "ac_capital_strategy_scenarios","ac_capital_live_wiring_status","ac_capital_report_exports",
];
const allSql = fs.readdirSync(migrationsDir).filter((f) => f.includes("ac_capital_os_mz") && f.endsWith(".sql"))
  .map((f) => fs.readFileSync(path.join(migrationsDir, f), "utf8")).join("\n");
for (const table of expected) assert(allSql.includes(table), `expected table not found in migrations: ${table}`);
console.log("AC_CAPITAL_OS_DB_TABLES_STATIC_VERIFIED");
console.log("Set SUPABASE_DB_URL and query information_schema separately to verify live remote tables.");
