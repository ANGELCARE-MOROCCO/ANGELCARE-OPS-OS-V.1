import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

const route = path.join(
  root,
  "components/market-os/ambassadors/routes/AmbassadorOnboardingRoute.tsx",
)

const page = path.join(
  root,
  "app/(protected)/market-os/ambassadors/onboarding/page.tsx",
)

const checks = []

function check(condition, label) {
  checks.push({ condition, label })
  console.log(condition ? "OK" : "FAIL", label)
}

check(fs.existsSync(route), "Enterprise onboarding route exists")
check(fs.existsSync(page), "Onboarding page exists")

if (fs.existsSync(route) && fs.existsSync(page)) {
  const routeSource = fs.readFileSync(route, "utf8")
  const pageSource = fs.readFileSync(page, "utf8")

  check(
    routeSource.includes(
      'data-ambassador-onboarding-route="enterprise-real-sync"',
    ),
    "Enterprise marker exists",
  )

  check(
    pageSource.includes("AmbassadorOnboardingRoute"),
    "Page renders dedicated route directly",
  )

  check(
    routeSource.includes(
      "/api/market-os/ambassadors/recruitment",
    ),
    "Recruitment synchronization exists",
  )

  check(
    routeSource.includes(
      "/api/market-os/ambassadors/onboarding",
    ),
    "Onboarding synchronization exists",
  )

  check(
    routeSource.includes(
      "/api/market-os/ambassadors/territories/assign",
    ),
    "Territory synchronization exists",
  )

  check(
    routeSource.includes("commission_rate: 10"),
    "Fixed 10% rule exists",
  )

  check(
    routeSource.includes("commission_locked: true"),
    "Fixed 10% lock exists",
  )

  check(
    !routeSource.includes("RefferQ"),
    "No RefferQ exists",
  )

  check(
    !routeSource.includes("alert(") &&
      !routeSource.includes("confirm(") &&
      !routeSource.includes("prompt("),
    "No browser alert/confirm/prompt exists",
  )
}

const failures = checks.filter((item) => !item.condition)

if (failures.length) {
  console.error(
    `Page 7 verification failed with ${failures.length} issue(s).`,
  )
  process.exit(1)
}

console.log("Page 7 enterprise onboarding verification passed.")
