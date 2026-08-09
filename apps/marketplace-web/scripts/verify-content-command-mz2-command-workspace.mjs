import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const dashboard = fs.readFileSync(path.join(root, "components/market-os/content-command/headquarters/DashboardWorkspace.tsx"), "utf8")
const sections = fs.readFileSync(path.join(root, "components/market-os/content-command/headquarters/command/ExecutiveCommandSections.tsx"), "utf8")
const model = fs.readFileSync(path.join(root, "components/market-os/content-command/headquarters/mz2-view-models.ts"), "utf8")
const failures = []
const requiredComponents = [
  "ExecutiveMandateMasthead",
  "SituationRoom",
  "ExecutiveInterventionQueue",
  "LifecyclePressureMap",
  "ProductionRunway",
  "DecisionIntegrityPanels",
  "StrategicWaveTimeline",
  "CapacityAndActivity",
  "ExecutiveCommandDock",
]
for (const component of requiredComponents) {
  if (!dashboard.includes(`<${component}`)) failures.push(`Commandement 360 is missing ${component}.`)
}
const requiredMarkers = [
  "SITUATION ROOM",
  "EXECUTIVE INTERVENTION QUEUE",
  "VALUE CHAIN CONTROL",
  "LIVE PRODUCTION RUNWAY",
  "DECISION COMMAND",
  "SOURCE & EVIDENCE INTEGRITY",
  "OBSERVED WORKLOAD",
  "EXECUTIVE ACTIVITY",
]
for (const marker of requiredMarkers) if (!sections.includes(marker)) failures.push(`Missing command marker: ${marker}`)
if (!model.includes("buildCommandViewModel")) failures.push("Command view-model adapter is missing.")
if (!model.includes("Aucun objectif de mandat n’est exposé")) failures.push("Honest missing-mandate state is missing.")
if (/quarterWaves|Fondation & activation|Trust · Demand · Conversion/.test(dashboard + sections)) failures.push("Legacy fabricated quarter-wave content remains in Commandement 360.")

if (failures.length) {
  console.error("FAIL — MZ2 Commandement 360 contract")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("PASS — Commandement 360 contains the complete executive intervention architecture")
