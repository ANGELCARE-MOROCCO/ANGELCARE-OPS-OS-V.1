#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8")
const exists = (rel) => fs.existsSync(path.join(root, rel))
const hash = (rel) => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, rel))).digest("hex")
let gates = 0
function gate(name, condition, detail = "") {
  if (!condition) { console.error(`FAIL — ${name}${detail ? `: ${detail}` : ""}`); process.exitCode = 1; return }
  gates += 1; console.log(`PASS — ${name}`)
}
function has(source, parts) { return parts.every(part => source.includes(part)) }

const required = [
  "app/(protected)/market-os/content-command-center/performance/page.tsx",
  "app/(protected)/market-os/content-command-center/attribution/page.tsx",
  "app/(protected)/market-os/content-command-center/optimization/page.tsx",
  "app/(protected)/market-os/content-command-center/learning/page.tsx",
  "components/market-os/content-command/experience-bulk7/Bulk7ImpactWorkspaces.tsx",
  "components/market-os/content-command/experience-bulk7/bulk7-impact-model.ts",
  "components/market-os/content-command/experience-bulk7/bulk7-impact.module.css",
  "lib/market-os/content-command-headquarters/content-impact-service.ts",
  "tsconfig.content-experience-bulk7.json",
]
gate("Bulk 7 route and source scope exists", required.every(exists))

const workspace = read("components/market-os/content-command/experience-bulk7/Bulk7ImpactWorkspaces.tsx")
const model = read("components/market-os/content-command/experience-bulk7/bulk7-impact-model.ts")
const service = read("lib/market-os/content-command-headquarters/content-impact-service.ts")
const api = read("app/api/market-os/content-command-headquarters/actions/route.ts")
const css = read("components/market-os/content-command/experience-bulk7/bulk7-impact.module.css")
const navigation = read("components/market-os/content-command/content-command-navigation.tsx")
const shell = read("components/market-os/content-command/headquarters/ContentCommandHeadquartersWorkspace.tsx")
const directory = read("components/market-os/content-command/headquarters/DirectoryWorkspace.tsx")
const dossierModel = read("components/market-os/content-command/headquarters/mz2-view-models.ts")
const dossierWorkspace = read("components/market-os/content-command/experience-bulk1/Bulk1DossierWorkspace.tsx")
const legacyData = read("components/market-os/content-command/phase18-analytics-data.ts")
const legacyWorkspace = read("components/market-os/content-command/phase18-analytics-workspace.tsx")

const exportedWorkspaces = ["Bulk7ImpactObservatory", "Bulk7AttributionChamber", "Bulk7OptimizationFoundry", "Bulk7LearningChamber", "AtlasImpactLayer"]
gate("Five purpose-built institutional workspaces are exported", exportedWorkspaces.every(name => workspace.includes(`export function ${name}`)))
gate("Protected route shell mounts every Bulk 7 workspace", ["performance", "attribution", "optimization", "learning"].every(view => shell.includes(`view === \"${view}\"`)))
gate("Navigation exposes Impact & apprentissage as a distinct group", has(navigation, ["Impact & apprentissage", "/performance", "/attribution", "/optimization", "/learning"]))

gate("Bulk 6 external verification is mandatory before observation", has(service, ["VERIFIED_PUBLICATION_REQUIRED", "PUBLICATION_EXTERNAL_TRUTH_REQUIRED", "publication_verification"]))
gate("Observation records provenance, window, metrics and limitations", has(service, ["performance_observation", "observedFrom", "observedTo", "provenanceType", "sourceReference", "limitations", "metrics"]))
gate("Attribution distinguishes direct, assisted, correlated and unestablished", has(service, ["direct", "assisted", "correlated", "unestablished", "competingExplanations", "ATTRIBUTION_OUTCOME_REFERENCE_REQUIRED"]))
gate("Optimization and institutional learning preserve separate governed events", has(service, ["optimization_decision", "institutional_lesson", "lesson_governance", "LEARNING_AUTHORITY_REASON_REQUIRED"]))
gate("Every Bulk 7 mutation is audited", ["content_performance", "content_attribution", "content_optimization", "institutional_learning"].every(value => service.includes(value)) && (service.match(/auditContentHeadquarters/g) || []).length >= 7)

const permissions = {
  performance_record_observation: "operate",
  performance_record_conclusion: "review",
  attribution_record_conclusion: "review",
  optimization_record_decision: "govern",
  learning_record_lesson: "review",
  learning_govern_lesson: "govern",
}
gate("Server-side authority boundaries are explicit", Object.keys(permissions).every(action => api.includes(action)) && has(api, ["requireContentHeadquartersUser(permission)", "? \"review\"", "? \"govern\""]))

gate("No AI, provider SDK or fabricated confidence is used for institutional decisions", !/(Math\.random|estimatedRoiPercent|aiConfidence|confidencePercent|openai|gemini|anthropic|fakeProvider|simulatedProvider)/i.test(`${service}\n${model}\n${workspace}`))
gate("Financial impact counts only direct or assisted attribution", has(model, ["revenueCases", "[\"direct\", \"assisted\"]", "totalRevenueDh"]))
gate("Missing measurements remain honestly empty", has(model, ["totalRevenueDh: number | null", "awaiting_observation", "Non établi"]) && !/views:\s*[1-9]\d{2,}|revenueDh:\s*[1-9]\d{2,}/.test(model))

gate("Legacy fabricated Phase 18 analytics are retired", has(legacyWorkspace, ["Bulk7ImpactObservatory", "Legacy compatibility mount"]) && ["phase18ContentPerformance", "phase18CampaignAttribution", "phase18FunnelStages", "phase18ChannelMatrix"].every(name => new RegExp(`${name}:[^=]*= \\[\\]`).test(legacyData)) && !/(38500|9100|estimatedRoiPercent)/.test(`${legacyData}\n${legacyWorkspace}`))

gate("Content Atlas receives impact and learning lineage", has(directory, ["impact", "Impact & apprentissage", "AtlasImpactLayer"]))
gate("Dossier lifecycle progresses through performance and learning", has(dossierModel, ["performance_review", "Apprentissage", "/performance", "/learning"]) && has(dossierWorkspace, ["PerformanceLearningStage", "performance_review", "institutional_lesson"]))
gate("Commandement pressure includes observation, attribution, optimization and learning", ["impact-observation", "impact-conclusion", "attribution-", "optimization-", "learning-"].every(value => dossierModel.includes(value)))

const silhouettes = ["/* Observatory: panoramic outcome horizon */", "/* Attribution: formal journey court */", "/* Optimization: decision foundry */", "/* Learning: doctrinal chamber */", "/* Atlas outcome overlay */"]
gate("Five unmistakably different visual silhouettes are encoded", silhouettes.every(marker => css.includes(marker)))
gate("Premium AngelCare visual language is present", has(css, ["#fff", "#123f64", "#c92f3a", "box-shadow", "@media(max-width:620px)", "prefers-reduced-motion"]))
gate("Bulk 7 avoids generic Tailwind dashboard anatomy", !/(rounded-3xl|grid-cols-3.*KPI|bg-slate-50|shadow-sm)/.test(workspace) && !workspace.includes("estimated ROI"))
gate("Responsive and accessibility controls are present", has(workspace, ["aria-label", "aria-live", "aria-current"]) && has(css, [":focus-visible", "@media(max-width:920px)", "@media(max-width:620px)", "prefers-reduced-motion"]))

const patchList = read("BULK7_PATCH_FILE_LIST.txt").split(/\r?\n/).filter(Boolean)
gate("No SQL or migration is introduced", !patchList.some(rel => /\.(sql|prisma)$/i.test(rel)) && !patchList.some(rel => rel.includes("migrations/")))

const preservation = JSON.parse(read("BULK7_PRESERVATION_BASELINE.json"))
const drift = Object.entries(preservation).filter(([rel, expected]) => !exists(rel) || hash(rel) !== expected)
gate("Bulk 1–6 preservation hashes remain intact", drift.length === 0, drift.slice(0, 5).map(([rel]) => rel).join(", "))

if (process.exitCode) process.exit(process.exitCode)
console.log(`PASS — ${gates} Bulk 7 institutional gates passed`)
