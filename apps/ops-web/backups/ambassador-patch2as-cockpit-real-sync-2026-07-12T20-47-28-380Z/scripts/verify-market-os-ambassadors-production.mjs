import fs from "fs"
import path from "path"

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const exists = (file) => fs.existsSync(path.join(root, file))

const failures = []
const ok = (message) => console.log(`OK ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL ${message}`)
}

function ensureFile(file, needles = [], forbidden = []) {
  if (!exists(file)) {
    fail(`missing file ${file}`)
    return
  }
  const source = read(file)
  for (const needle of needles) {
    if (!source.includes(needle)) fail(`missing ${needle} in ${file}`)
    else ok(`${file} contains ${needle}`)
  }
  for (const needle of forbidden) {
    if (source.includes(needle)) fail(`forbidden ${needle} still present in ${file}`)
    else ok(`${file} does not contain ${needle}`)
  }
}

function walk(dir) {
  const entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const rel = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walk(rel))
    else if (entry.isFile()) files.push(rel)
  }
  return files
}

const ambassadorFiles = [
  ...walk("app/(protected)/market-os/ambassadors"),
  ...walk("components/market-os/ambassadors"),
  ...walk("lib/market-os/ambassadors"),
  ...walk("app/api/market-os/ambassadors"),
]

const forbiddenPatterns = [
  /RefferQ/i,
  /refferq/i,
  /(?:^|[^A-Za-z0-9_])alert\s*\(/i,
  /(?:^|[^A-Za-z0-9_])confirm\s*\(/i,
  /(?:^|[^A-Za-z0-9_])prompt\s*\(/i,
]
for (const file of ambassadorFiles) {
  const source = read(file)
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(source)) {
      fail(`forbidden pattern ${pattern} found in ${file}`)
    }
  }
}

ensureFile("app/(protected)/market-os/ambassadors/page.tsx", ['mode="overview"'])
ensureFile("app/(protected)/market-os/ambassadors/directory/page.tsx", ['mode="directory"'])
ensureFile("app/(protected)/market-os/ambassadors/recruitment/page.tsx", ['mode="recruitment"'])
ensureFile("app/(protected)/market-os/ambassadors/leads/page.tsx", ['mode="leads"'])
ensureFile("app/(protected)/market-os/ambassadors/conversions/page.tsx", ['mode="conversions"'])
ensureFile("app/(protected)/market-os/ambassadors/resources/page.tsx", ['mode="resources"'])
ensureFile("app/(protected)/market-os/ambassadors/payouts/page.tsx", ['mode="payouts"'])
ensureFile("app/(protected)/market-os/ambassadors/governance/page.tsx", ['mode="governance"'])
ensureFile("app/(protected)/market-os/ambassadors/command-center/page.tsx", ['mode="overview"'])
ensureFile("app/(protected)/market-os/ambassadors/program-rules/page.tsx", ['mode="governance"'])

ensureFile("components/market-os/ambassadors/ambassador-production-workspace.tsx", [
  "renderCockpit",
  "renderLeads",
  "renderConversions",
  "renderResources",
  "renderPayouts",
  "renderGovernance",
  "journeyTabs",
  "SummaryTile",
  "ModalShell",
  "DetailDrawer",
  "AmbassadorRouteHeader",
  "AmbassadorMetricCard",
  "AmbassadorJourneyNav",
  "AmbassadorVisibleRouteCanvas",
], ["RefferQ", "alert(", "confirm(", "prompt("])

ensureFile("components/market-os/ambassadors/design/ambassador-design-tokens.ts", [
  "ambassadorDesignTokens",
  "ambassadorRouteDefinitions",
  "getAmbassadorRouteDefinition",
  "Cockpit de pilotage",
  "Gouvernance, conformité & audit",
], ["RefferQ", "alert(", "confirm(", "prompt("])

ensureFile("components/market-os/ambassadors/design/ambassador-enterprise-primitives.tsx", [
  "AmbassadorRouteHeader",
  "AmbassadorMetricCard",
  "AmbassadorJourneyNav",
  "AmbassadorOperationalNotice",
  "AmbassadorFilterFrame",
], ["RefferQ", "alert(", "confirm(", "prompt("])

ensureFile("components/market-os/ambassadors/design/ambassador-visible-route-canvas.tsx", [
  "AmbassadorVisibleRouteCanvas",
  "Cockpit de pilotage",
  "Territoires & couverture",
  "Rapports & pilotage exécutif",
  "Journey workspace",
], ["RefferQ", "alert(", "confirm(", "prompt("])

ensureFile("lib/market-os/ambassadors/server.ts", [
  "ENTITY_LIMITS",
  "loadAmbassadorWorkspaceSnapshot",
  "createAmbassadorEntity",
  "assignAmbassadorTerritory",
  "generateAmbassadorReport",
  "limit(",
  "slice(0, ENTITY_LIMITS",
], ["RefferQ"])

ensureFile("app/api/market-os/ambassadors/route.ts", ["loadAmbassadorWorkspaceSnapshot"])
ensureFile("app/api/market-os/ambassadors/reports/export/route.ts", ["generateAmbassadorReport"])
ensureFile("app/api/market-os/ambassadors/operations/route.ts", ["loadAmbassadorWorkspaceSnapshot"])
ensureFile("lib/market-os/ambassadors/api.ts", ["handleAmbassadorApi"])

if (failures.length) {
  console.error(`Ambassador verification failed with ${failures.length} issue(s).`)
  process.exit(1)
}

console.log("Ambassador Market OS production verification passed.")
