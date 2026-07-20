import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

const routeFile = path.join(
  root,
  "components/market-os/ambassadors/routes/AmbassadorTerritoriesRoute.tsx",
)
const pageFile = path.join(
  root,
  "app/(protected)/market-os/ambassadors/territories/page.tsx",
)
const approvalFile = path.join(
  root,
  "app/api/market-os/ambassadors/territories/approve/route.ts",
)
const sidebarFile = path.join(
  root,
  "components/market-os/ambassadors/ambassador-market-sidebar.tsx",
)

const checks = []

function check(condition, label) {
  checks.push({ condition, label })
  console.log(condition ? "OK" : "FAIL", label)
}

check(fs.existsSync(routeFile), "Dedicated territories route exists")
check(fs.existsSync(pageFile), "Territories page exists")
check(fs.existsSync(approvalFile), "Approval API exists")
check(fs.existsSync(sidebarFile), "Shared Ambassador sidebar exists")

if (
  fs.existsSync(routeFile) &&
  fs.existsSync(pageFile) &&
  fs.existsSync(approvalFile) &&
  fs.existsSync(sidebarFile)
) {
  const route = fs.readFileSync(routeFile, "utf8")
  const page = fs.readFileSync(pageFile, "utf8")
  const approval = fs.readFileSync(approvalFile, "utf8")
  const sidebar = fs.readFileSync(sidebarFile, "utf8")

  for (const marker of [
    'data-ambassador-territories-route="enterprise-territory-command-center"',
    "Territoires & couverture",
    "Affecter territoire",
    "Importer zones",
    "Couverture du terrain",
    "Performance par ville",
    "Charges de mission",
    "Alertes & recommandations",
    "Soumettre",
    "Approbations en attente",
    "Données réelles Ambassador OS",
    "Aucun chiffre injecté",
    "AMB_TERRITORY_OS_V2:",
  ]) {
    check(route.includes(marker), `Route marker: ${marker}`)
  }

  check(
    page.includes("<AmbassadorMarketSidebar"),
    "Shared sidebar is rendered directly",
  )
  check(
    page.includes("<AmbassadorTerritoriesRoute"),
    "Dedicated territories route is rendered directly",
  )
  check(
    sidebar.includes("/market-os/ambassadors/territories"),
    "Territories destination remains in shared sidebar",
  )

  for (const endpoint of [
    "/api/market-os/ambassadors/territories",
    "/api/market-os/ambassadors/territories/approve",
    "/api/market-os/ambassadors/audit",
  ]) {
    check(route.includes(endpoint), `Route uses ${endpoint}`)
  }

  for (const marker of [
    "assignAmbassadorTerritory",
    "territory_assignment_approved",
    "territory_assignment_rejected",
    "idempotent",
    "Pending assignment not found",
  ]) {
    check(approval.includes(marker), `Approval marker: ${marker}`)
  }

  check(
    route.includes("-webkit-text-fill-color:#020617"),
    "Strong black modal and drawer typography is enforced",
  )
  check(
    !/Amine Benkirane|Salma Bennis|Yassine Kabbaj|Mehdi Tahiri|Sanaa El Amrani/.test(
      route,
    ),
    "No fictional Ambassador records exist",
  )
  check(
    !route.includes("localStorage"),
    "No localStorage persistence is used",
  )
  check(
    !route.includes("alert(") &&
      !route.includes("confirm(") &&
      !route.includes("prompt("),
    "No browser alert, confirm or prompt is used",
  )
  check(!route.includes("RefferQ"), "RefferQ is untouched")
}

const failures = checks.filter((item) => !item.condition)

if (failures.length) {
  console.error(
    `\nTerritories enterprise verification failed with ${failures.length} issue(s).`,
  )
  process.exit(1)
}

console.log(
  "\nAmbassador Territories enterprise command center verification passed.",
)
