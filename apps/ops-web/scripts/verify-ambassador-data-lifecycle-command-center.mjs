import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(scriptDirectory, "..")
const targets = {
  component: "components/market-os/ambassadors/data-lifecycle/AmbassadorDataLifecycleControlCenter.tsx",
  library: "lib/market-os/ambassadors/data-lifecycle.ts",
  route: "app/api/market-os/ambassadors/data-lifecycle/[[...action]]/route.ts",
  migration: "database/market-os-ambassadors/20260730_market_os_ambassador_data_lifecycle_command_center.sql",
  typecheck: "tsconfig.ambassador-data-lifecycle-command-center.json",
}

const source = Object.fromEntries(
  Object.entries(targets).map(([key, relative]) => {
    const absolute = path.join(appRoot, relative)
    if (!fs.existsSync(absolute)) {
      throw new Error(`Missing required delivery file: ${relative}`)
    }
    return [key, fs.readFileSync(absolute, "utf8")]
  }),
)

const assertions = [
  [source.component.includes("Vue de gouvernance"), "Governance workspace"],
  [source.component.includes("Registre des demandes"), "Request register workspace"],
  [source.component.includes("Opérations groupées"), "Bulk operations workspace"],
  [source.component.includes("Journal d’audit"), "Audit workspace"],
  [source.component.includes("Politiques et autorités"), "Policies workspace"],
  [source.component.includes("Préparer la suppression groupée"), "Bulk preparation action"],
  [source.component.includes("Dépendances"), "Dependency drawer tab"],
  [source.component.includes("Preuve et audit"), "Evidence drawer tab"],
  [source.component.includes("rejected") && source.component.includes("Rejetée"), "Rejected status integrity"],
  [!source.component.includes('status === "approved" || status === "blocked"'), "Blocked requests are not executable"],
  [source.library.includes('"bulk_create"'), "Bulk create server action"],
  [source.library.includes('"bulk_preflight"'), "Bulk preflight server action"],
  [source.library.includes('"bulk_execute"'), "Bulk execution server action"],
  [source.route.includes('segments[0] === "bulk"'), "Bulk API routing"],
  [source.migration.includes("market_os_ambassador_bulk_purge_jobs"), "Bulk job table"],
  [source.migration.includes("market_os_ambassador_bulk_purge_items"), "Bulk item table"],
  [source.migration.includes("market_os_ambassador_purge_adapters"), "Adapter registry"],
  [source.migration.includes("market_os_ambassador_bulk_purge_preflight"), "Bulk preflight RPC"],
  [source.migration.includes("market_os_ambassador_bulk_cleanup_adapters"), "Adapter cleanup RPC"],
  [source.migration.includes("externalVerificationPending"), "External verification evidence"],
]

const failures = assertions.filter(([passed]) => !passed)
if (failures.length) {
  for (const [, label] of failures) console.error(`FAIL  ${label}`)
  process.exit(1)
}

for (const [, label] of assertions) console.log(`PASS  ${label}`)
console.log(`\n${assertions.length} command-center checks passed.`)
console.log("No production build was run.")
