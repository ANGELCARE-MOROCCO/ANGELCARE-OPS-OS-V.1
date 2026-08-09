import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

const routeFile = path.join(
  root,
  "components/market-os/ambassadors/routes/AmbassadorOnboardingRoute.tsx",
)

const pageFile = path.join(
  root,
  "app/(protected)/market-os/ambassadors/onboarding/page.tsx",
)

const sidebarFile = path.join(
  root,
  "components/market-os/ambassadors/ambassador-market-sidebar.tsx",
)

const checks = []

function check(condition, label) {
  checks.push({
    condition,
    label,
  })

  console.log(
    condition ? "OK" : "FAIL",
    label,
  )
}

check(
  fs.existsSync(routeFile),
  "Page 7 route exists",
)

check(
  fs.existsSync(pageFile),
  "Page 7 direct page exists",
)

check(
  fs.existsSync(sidebarFile),
  "Shared Ambassador sidebar exists",
)

if (
  fs.existsSync(routeFile) &&
  fs.existsSync(pageFile) &&
  fs.existsSync(sidebarFile)
) {
  const route = fs.readFileSync(
    routeFile,
    "utf8",
  )

  const page = fs.readFileSync(
    pageFile,
    "utf8",
  )

  const sidebar = fs.readFileSync(
    sidebarFile,
    "utf8",
  )

  check(
    route.includes(
      'data-page7-enterprise="operational-command-center"',
    ),
    "Enterprise command-center marker exists",
  )

  check(
    page.includes(
      "<AmbassadorMarketSidebar",
    ),
    "Shared sidebar remains rendered",
  )

  check(
    page.includes(
      "<AmbassadorOnboardingRoute",
    ),
    "Dedicated route remains rendered directly",
  )

  check(
    sidebar.includes(
      "/market-os/ambassadors/onboarding",
    ),
    "Onboarding destination remains in sidebar",
  )

  for (const marker of [
    "Démarrer onboarding",
    "Importer dossiers",
    "Session collective",
    "Actions groupées",
    "Centre de contrôles",
    "Activation Studio",
    "Contrôle documentaire",
    "Décision d’approbation",
    "Créer une tâche onboarding",
    "Préparer une communication",
  ]) {
    check(
      route.includes(marker),
      `Operational marker exists: ${marker}`,
    )
  }

  for (const endpoint of [
    "/api/market-os/ambassadors/recruitment",
    "/api/market-os/ambassadors/ambassadors",
    "/api/market-os/ambassadors/onboarding",
    "/api/market-os/ambassadors/training",
    "/api/market-os/ambassadors/territories/assign",
    "/api/market-os/ambassadors/missions",
    "/api/market-os/ambassadors/audit",
  ]) {
    check(
      route.includes(endpoint),
      `Real synchronization endpoint exists: ${endpoint}`,
    )
  }

  check(
    route.includes(
      "commissionRate: 10",
    ),
    "Fixed 10% commission exists",
  )

  check(
    route.includes(
      "commissionLocked: true",
    ),
    "Fixed 10% commission lock exists",
  )

  check(
    route.includes(
      "partialFailures",
    ),
    "Partial-failure reporting exists",
  )

  check(
    route.includes(
      "Aucun faux envoi",
    ) ||
      route.includes(
        "faux envoi",
      ),
    "Truthful communication protection exists",
  )

  check(
    route.includes(
      "-webkit-text-fill-color: #020617",
    ),
    "Strong black typography protection exists",
  )

  check(
    !route.includes("RefferQ"),
    "No RefferQ exists",
  )

  check(
    !route.includes("alert(") &&
      !route.includes("confirm(") &&
      !route.includes("prompt("),
    "No browser alert, confirm or prompt exists",
  )

  check(
    !/Amine Benkirane|Mehdi Tahiri|Sanaa El Amrani/.test(
      route,
    ),
    "No known fictional people exist",
  )
}

const failures = checks.filter(
  (checkItem) =>
    !checkItem.condition,
)

if (failures.length) {
  console.error(
    `\nPage 7 enterprise verification failed with ${failures.length} issue(s).`,
  )

  process.exit(1)
}

console.log(
  "\nPage 7 enterprise operational verification passed.",
)
