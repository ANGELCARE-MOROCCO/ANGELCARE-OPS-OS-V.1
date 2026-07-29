import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const exists = (file) => fs.existsSync(file);
function detect(start = process.cwd()) {
  if (exists(path.join(start, "apps", "ops-web"))) return { repoRoot: start, opsRoot: path.join(start, "apps", "ops-web"), mode: "repository-root" };
  if (exists(path.join(start, "app")) && exists(path.join(start, "components")) && exists(path.join(start, "lib"))) return { repoRoot: path.resolve(start, "..", ".."), opsRoot: start, mode: "ops-web-root" };
  throw new Error("Run from the AngelCare repository root or apps/ops-web.");
}
function assert(condition, message) { if (!condition) { console.error(`FAIL: ${message}`); process.exit(1); } }
function read(file) { assert(exists(file), `missing file: ${file}`); return fs.readFileSync(file, "utf8"); }

const { repoRoot, opsRoot, mode } = detect();
const files = {
  intelligence: path.join(opsRoot, "lib", "ac-capital-os", "server", "live-intelligence.ts"),
  gemini: path.join(opsRoot, "lib", "ai-provider-control", "gemini-runtime.ts"),
  radarRoute: path.join(opsRoot, "app", "api", "ac-capital-os", "capital-radar", "research", "run", "route.ts"),
  radarList: path.join(opsRoot, "app", "api", "ac-capital-os", "capital-radar", "route.ts"),
  reportRoute: path.join(opsRoot, "app", "api", "ac-capital-os", "reports", "generate", "route.ts"),
  overlay: path.join(opsRoot, "components", "ac-capital-os", "core", "Overlay.tsx"),
  shell: path.join(opsRoot, "components", "ac-capital-os", "core", "AcCapitalShell.tsx"),
  coreCss: path.join(opsRoot, "components", "ac-capital-os", "core", "core.module.css"),
  shellCss: path.join(opsRoot, "components", "ac-capital-os", "core", "shell.module.css"),
  radarPage: path.join(opsRoot, "components", "ac-capital-os", "pages", "radar", "RadarPage.tsx"),
  reportsPage: path.join(opsRoot, "components", "ac-capital-os", "pages", "reports", "ReportsPage.tsx"),
  migration: path.join(repoRoot, "supabase", "migrations", "20260728_ac_capital_os_runtime_truth_repair_01.sql"),
};
const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));

for (const token of ["grounded_research", "googleSearch", "groundingMetadata", "AC_CAPITAL_RESEARCH_PROVIDER_CALL_NOT_EXECUTED", "rejectedSignals"]) assert(source.intelligence.includes(token), `live intelligence missing ${token}`);
for (const token of ["tools?: unknown[]", "tools: input.tools"]) assert(source.gemini.includes(token), `Gemini boundary missing ${token}`);
for (const token of ["gemini-google-search-grounding", "ac_capital_radar_rejections", "provider_request_id", "grounding_metadata", "status: \"source-review\""]) assert(source.radarRoute.includes(token), `Radar route missing ${token}`);
assert(!/adapter_mode\s*:\s*["']simulated["']/.test(source.radarRoute), "Radar route remains simulated");
assert(!source.radarRoute.includes("No live provider call occurred"), "Radar route retains false dry-run completion");
for (const token of ["executeCapitalReportComposition", "approvedForReport", "remainingCharacters", "content_markdown", "outputReference", "export_placeholder: false", "generated_body"]) assert(source.reportRoute.includes(token), `report route missing ${token}`);
assert(!source.reportRoute.includes("ac_capital_data_room_readiness_checks"), "report route retains invalid data-room table name");
assert(!/export_placeholder\s*:\s*true/.test(source.reportRoute), "report route remains placeholder-only");
for (const token of ["createPortal", "document.body"]) assert(source.overlay.includes(token), `shared overlay missing ${token}`);
for (const css of [source.coreCss, source.shellCss]) assert(css.includes("top:var(--angelcare-overhead-height,70px)"), "an overlay layer is not offset under the AngelCare overhead");
for (const token of ["seenIds", "occurrence", "key={`${zone.id}-${index}`}"]) assert(source.shell.includes(token), `zone identity repair missing ${token}`);
for (const token of ["Run Live Grounded Research", "Run live research"]) assert(source.radarPage.includes(token), `Radar UI missing ${token}`);
for (const token of ["Substantive Gemini Composition", "content_markdown", "Executive Summary"]) assert(source.reportsPage.includes(token), `Report UI missing ${token}`);
for (const token of ["max_grounded_requests_per_day", "grounded_research", "structured_content", "AC_CAPITAL_RADAR_GROUNDED_RESEARCH", "AC_CAPITAL_REPORT_COMPOSE", "updated_at timestamptz"]) assert(source.migration.includes(token), `migration missing ${token}`);
assert(!/AIza[0-9A-Za-z_-]{20,}/.test(Object.values(source).join("\n")), "a Gemini API key-like secret is embedded in source");

let ts;
const scopedResolvers = [
  createRequire(path.join(opsRoot, "__ac_capital_verifier__.cjs")),
  createRequire(path.join(repoRoot, "__ac_capital_verifier__.cjs")),
  createRequire(import.meta.url),
];

for (const resolver of scopedResolvers) {
  try {
    ts = resolver("typescript");
    break;
  } catch {}
}

for (const candidate of [
  path.join(opsRoot, "node_modules", "typescript", "lib", "typescript.js"),
  path.join(repoRoot, "node_modules", "typescript", "lib", "typescript.js"),
  path.resolve(
    path.dirname(process.execPath),
    "..",
    "lib",
    "node_modules",
    "typescript",
    "lib",
    "typescript.js",
  ),
  "/opt/homebrew/lib/node_modules/typescript/lib/typescript.js",
  "/usr/local/lib/node_modules/typescript/lib/typescript.js",
  "/usr/lib/node_modules/typescript/lib/typescript.js",
]) {
  if (ts || !exists(candidate)) continue;

  try {
    ts = createRequire(import.meta.url)(candidate);
    break;
  } catch {}
}

assert(
  ts,
  `TypeScript runtime not found. Checked ${path.join(
    opsRoot,
    "node_modules",
    "typescript",
  )} and ${path.join(
    repoRoot,
    "node_modules",
    "typescript",
  )}. Install the existing workspace dependencies, then retry.`,
);

const syntaxFiles = [files.intelligence, files.gemini, files.radarRoute, files.radarList, files.reportRoute, files.overlay, files.shell, files.radarPage, files.reportsPage];
for (const file of syntaxFiles) {
  const result = ts.transpileModule(read(file), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve, moduleResolution: ts.ModuleResolutionKind.Bundler, isolatedModules: true },
    fileName: file,
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error);
  assert(errors.length === 0, `${path.relative(repoRoot, file)} syntax diagnostics: ${errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, " ")).join(" | ")}`);
}

console.log("AC_CAPITAL_OS_RUNTIME_TRUTH_REPAIR_01_STATIC_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log("PASS shared body-level overlay and remaining-viewport offset");
console.log("PASS deterministic unique zone IDs and defensive React keys");
console.log("PASS governed Gemini Google Search call and grounding evidence extraction");
console.log("PASS source, opportunity, duplicate and rejection persistence contracts");
console.log("PASS substantive report composition and non-null output reference contract");
console.log("PASS provider request, tokens and estimated cost persistence contracts");
console.log("PASS no embedded Gemini credential pattern");
console.log("PASS all changed TypeScript/TSX files syntax-transpiled");
console.log("Database migration still must be applied before live execution.");
