import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

const routeFile = path.join(
  root,
  "components/market-os/ambassadors/routes/AmbassadorDirectoryRoute.tsx",
)

const pageFile = path.join(
  root,
  "app/(protected)/market-os/ambassadors/directory/page.tsx",
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

check(fs.existsSync(routeFile), "Master dossier route exists")
check(fs.existsSync(pageFile), "Directory page exists")
check(fs.existsSync(sidebarFile), "Shared sidebar exists")

if (
  fs.existsSync(routeFile) &&
  fs.existsSync(pageFile) &&
  fs.existsSync(sidebarFile)
) {
  const route = fs.readFileSync(routeFile, "utf8")
  const page = fs.readFileSync(pageFile, "utf8")
  const sidebar = fs.readFileSync(sidebarFile, "utf8")

  check(
    route.includes(
      'data-ambassador-directory-route="enterprise-master-dossier"',
    ),
    "Enterprise master dossier marker exists",
  )

  check(
    page.includes("<AmbassadorMarketSidebar"),
    "Shared sidebar is rendered",
  )

  check(
    page.includes("<AmbassadorDirectoryRoute"),
    "Dedicated Directory route is rendered",
  )

  check(
    sidebar.includes("/market-os/ambassadors/directory"),
    "Directory destination remains in sidebar",
  )

  for (const marker of [
    "Dossiers ambassadeurs",
    "Affecter une mission",
    "Créer un lead",
    "Ouvrir une note",
    "Archiver",
    "Vue 360°",
    "Missions",
    "Leads & conversions",
    "Incentives & paiements",
    "Formations",
    "Conformité",
    "Documents",
    "Historique",
    "Mettre à jour le dossier",
    "Command Drawer",
    "Explication du score ambassadeur",
  ]) {
    check(
      route.includes(marker),
      `Operational marker exists: ${marker}`,
    )
  }

  for (const endpoint of [
    "/api/market-os/ambassadors/ambassadors",
    "/api/market-os/ambassadors/recruitment",
    "/api/market-os/ambassadors/onboarding",
    "/api/market-os/ambassadors/missions",
    "/api/market-os/ambassadors/leads",
    "/api/market-os/ambassadors/conversions",
    "/api/market-os/ambassadors/incentives",
    "/api/market-os/ambassadors/payouts",
    "/api/market-os/ambassadors/territories/assign",
    "/api/market-os/ambassadors/training",
    "/api/market-os/ambassadors/documents",
    "/api/market-os/ambassadors/notes",
    "/api/market-os/ambassadors/audit",
    "/api/market-os/ambassadors/operations",
  ]) {
    check(
      route.includes(endpoint),
      `Synchronization endpoint exists: ${endpoint}`,
    )
  }

  check(
    route.includes("commissionRate: 10"),
    "Fixed 10% commission exists",
  )

  check(
    route.includes("commissionLocked: true"),
    "Fixed 10% commission is locked",
  )

  check(
    route.includes("partialFailures"),
    "Partial synchronization reporting exists",
  )

  check(
    route.includes(
      "-webkit-text-fill-color: #020617",
    ),
    "Strong black typography protection exists",
  )

  check(!route.includes("RefferQ"), "No RefferQ exists")

  check(
    !route.includes("alert(") &&
      !route.includes("confirm(") &&
      !route.includes("prompt("),
    "No browser alert, confirm or prompt exists",
  )

  check(
    !/Amine Benkirane|Mehdi Tahiri|Sanaa El Amrani|Yassine Kabbaj/.test(
      route,
    ),
    "No fictional ambassador records exist",
  )
}

const failures = checks.filter((item) => !item.condition)

if (failures.length) {
  console.error(
    `\nMaster dossier verification failed with ${failures.length} issue(s).`,
  )
  process.exit(1)
}

console.log(
  "\nAmbassador master dossier enterprise verification passed.",
)
