#!/usr/bin/env node
const fs = require("fs")
const path = require("path")

const root = process.cwd()
const dryRun = process.argv.includes("--dry-run")
const apply = process.argv.includes("--apply")

const legacyNamePatterns = [
  /V10/i,
  /V11/i,
  /V12/i,
  /Mega/i,
  /Max/i,
  /Final/i,
  /ExecutionDepth/i,
]

const keep = new Set([
  "components/revenue-command-center/ProspectsDirectoryCommandCenter.tsx",
  "components/revenue-command-center/ProspectFullProfileCommandCenter.tsx",
  "components/revenue-command-center/CentralRevenueCore.tsx",
  "components/revenue-command-center/RevenueDailyTasksV13McKinseyWorkspace.tsx",
  "components/revenue-command-center/RevenueAppointmentsV12MegaWorkspace.tsx",
  "components/revenue-command-center/RevenuePartnershipsV13ActionsWorkspace.tsx",
  "lib/revenue-command-center/revenue-action-engine.ts",
  "lib/revenue-command-center/production-prospect-store.ts",
  "lib/revenue-command-center/use-revenue-entity-controls.ts",
])

const scanDirs = [
  "components/revenue-command-center",
  "app/(protected)/revenue-command-center",
  "app/revenue-command-center",
]

const candidates = []

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name)
    const stat = fs.statSync(file)
    if (stat.isDirectory()) walk(file)
    else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      const rel = path.relative(root, file)
      if (keep.has(rel)) continue
      if (legacyNamePatterns.some((rx) => rx.test(name)) || rel.includes("/_v10/") || rel.includes("/_max/") || rel.includes("/_final/")) {
        candidates.push(rel)
      }
    }
  }
}

scanDirs.forEach((d) => walk(path.join(root, d)))

console.log("\nRevenue Command Center Canonicalization Candidates")
console.log("================================================")
if (!candidates.length) {
  console.log("No legacy candidates found.")
} else {
  candidates.forEach((f, i) => console.log(`${i + 1}. ${f}`))
}

if (apply) {
  const archiveRoot = path.join(root, "_archive/revenue-command-center-legacy")
  fs.mkdirSync(archiveRoot, { recursive: true })
  for (const rel of candidates) {
    const from = path.join(root, rel)
    const to = path.join(archiveRoot, rel)
    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.renameSync(from, to)
    console.log("archived:", rel)
  }
  console.log("\nDone. Run npm run build now.")
} else {
  console.log("\nDry by default. To archive candidates, run:")
  console.log("node scripts/rcc-canonicalize-legacy.js --apply")
}
