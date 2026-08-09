#!/usr/bin/env node
const fs = require("node:fs")
const path = require("node:path")
const Module = require("node:module")
let ts
try { ts = require("typescript") } catch { console.error("FAIL — TypeScript package is required."); process.exit(1) }
const root = path.resolve(__dirname, "..")
const file = path.join(root, "components/market-os/content-command/experience-bulk7/bulk7-impact-model.ts")
const source = fs.readFileSync(file, "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText
const mod = new Module(file, module)
mod.filename = file
mod.paths = Module._nodeModulePaths(path.dirname(file))
mod._compile(compiled, file)
const { buildImpactModel } = mod.exports
const verification = { type: "publication_verification", conclusion: "verified" }
const basePackage = { id: "pkg-1", dossier_id: "dos-1", channel: "website", status: "verified", evidence: [verification], updated_at: "2026-07-29T00:00:00Z", published_at: "2026-07-28T00:00:00Z", external_reference: "https://example.invalid/proof" }
let model = buildImpactModel({ dossiers: [{ id: "dos-1", title: "Truth case" }], publicationPackages: [basePackage] })
if (model.metrics.verifiedPublications !== 1 || model.metrics.awaitingObservation !== 1 || model.metrics.totalRevenueDh !== null) throw new Error("Verified publication truth derivation failed")
const observation = { type: "performance_observation", provenanceType: "manual", metrics: { views: 120, leads: 3, revenueDh: 5000 } }
model = buildImpactModel({ dossiers: [{ id: "dos-1", title: "Truth case" }], publicationPackages: [{ ...basePackage, evidence: [verification, observation] }] })
if (model.metrics.observed !== 1 || model.metrics.totalRevenueDh !== null) throw new Error("Observed revenue was incorrectly treated as attributed revenue")
const conclusion = { type: "performance_conclusion", conclusion: "sufficient" }
const attribution = { type: "attribution_conclusion", conclusion: "correlated", attributedRevenueDh: 9000 }
model = buildImpactModel({ dossiers: [{ id: "dos-1", title: "Truth case" }], publicationPackages: [{ ...basePackage, evidence: [verification, observation, conclusion, attribution] }] })
if (model.metrics.totalRevenueDh !== null) throw new Error("Correlated revenue was incorrectly claimed as attributed")
const direct = { ...attribution, conclusion: "direct", attributedRevenueDh: 9000 }
model = buildImpactModel({ dossiers: [{ id: "dos-1", title: "Truth case" }], publicationPackages: [{ ...basePackage, evidence: [verification, observation, conclusion, direct] }] })
if (model.metrics.totalRevenueDh !== 9000) throw new Error("Direct attributed revenue was not preserved")
console.log("PASS — deterministic Bulk 7 truth, provenance and attribution model tests pass")
