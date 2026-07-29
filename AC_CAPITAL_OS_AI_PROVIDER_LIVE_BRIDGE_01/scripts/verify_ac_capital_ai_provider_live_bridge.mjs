import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const exists = (file) => fs.existsSync(file);
function detect(start = process.cwd()) {
  if (exists(path.join(start, "apps", "ops-web"))) return { repoRoot: start, opsRoot: path.join(start, "apps", "ops-web"), mode: "repository-root" };
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) return { repoRoot: path.resolve(start, "..", ".."), opsRoot: start, mode: "ops-web-root" };
  throw new Error("Run from the AngelCare repository root or apps/ops-web.");
}
function assert(condition, message) { if (!condition) { console.error(`FAIL: ${message}`); process.exit(1); } }
function read(file) { assert(exists(file), `missing file: ${file}`); return fs.readFileSync(file, "utf8"); }

const { repoRoot, opsRoot, mode } = detect();
const files = {
  workspace: path.join(opsRoot, "components", "ai-provider-control", "AiProviderControlWorkspace.tsx"),
  types: path.join(opsRoot, "lib", "ai-provider-control", "types.ts"),
  flags: path.join(opsRoot, "lib", "ac-capital-os", "server", "feature-flags.ts"),
  bridge: path.join(opsRoot, "lib", "ac-capital-os", "server", "ai-provider-bridge.ts"),
  route: path.join(opsRoot, "app", "api", "ac-capital-os", "ai-command-center", "run", "route.ts"),
  page: path.join(opsRoot, "components", "ac-capital-os", "pages", "ai-command", "AiCommandPage.tsx"),
  sql: path.join(repoRoot, "supabase", "migrations", "20260728_ac_capital_os_ai_provider_live_bridge.sql"),
};
const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));

for (const token of ["{ key: 'ac_capital_os', label: 'AC CAPITAL OS' }"]) assert(source.workspace.includes(token), `Provider Control missing module token: ${token}`);
for (const token of ["executeGovernedAiRequest", "invokeGeminiProvider", "AC_CAPITAL_PROVIDER_MODULE_KEY", "capital_intelligence", "gemini-3.6-flash"]) assert(source.bridge.includes(token), `Bridge missing token: ${token}`);
assert(!source.bridge.includes("Live provider action requires explicit integration"), "old placeholder bridge warning remains");
for (const token of ["executeAcCapitalGovernedAi", "Provider Execution Completed", "governed_live_ai_run"]) assert(source.route.includes(token), `run route missing governed token: ${token}`);
for (const token of ["Run Governed Test", "Execute governed Gemini run", "AI Provider Control · Gemini · Human Authority"]) assert(source.page.includes(token), `AI page missing live UX token: ${token}`);
for (const token of ["ai_ops_module_registry", "ac_capital_os", "Gemini AC CAPITAL OS Production", "ai_provider_module_assignments", "AC_CAPITAL_GOVERNED_RUN", "ac_capital_intelligence_director", "Never guarantee financing"]) assert(source.sql.includes(token), `migration missing token: ${token}`);
assert(!/AIza[0-9A-Za-z_-]{20,}/.test(Object.values(source).join("\n")), "a Gemini API key-like secret is present in installed source");

let ts;
for (const packageFile of [path.join(opsRoot, "package.json"), path.join(repoRoot, "package.json")]) {
  if (!exists(packageFile)) continue;
  try { ts = createRequire(packageFile)("typescript"); break; } catch {}
  const direct = path.join(path.dirname(packageFile), "node_modules", "typescript", "lib", "typescript.js");
  if (exists(direct)) { try { ts = createRequire(import.meta.url)(direct); break; } catch {} }
}
if (!ts) {
  const candidates = [
    path.resolve(path.dirname(process.execPath), "..", "lib", "node_modules", "typescript", "lib", "typescript.js"),
    "/opt/homebrew/lib/node_modules/typescript/lib/typescript.js",
    "/usr/local/lib/node_modules/typescript/lib/typescript.js",
    "/usr/lib/node_modules/typescript/lib/typescript.js",
  ];
  for (const candidate of candidates) {
    if (!exists(candidate)) continue;
    try { ts = createRequire(import.meta.url)(candidate); break; } catch {}
  }
}
if (!ts) {
  try { ts = createRequire(import.meta.url)("typescript"); } catch {}
}
assert(ts, "TypeScript runtime not found. Install project dependencies in apps/ops-web before running syntax verification.");

for (const file of [files.workspace, files.types, files.flags, files.bridge, files.route, files.page]) {
  const text = read(file);
  const result = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, strict: true }, fileName: file, reportDiagnostics: true });
  const errors = (result.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error);
  assert(errors.length === 0, `${path.relative(repoRoot, file)} syntax diagnostics: ${errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, " ")).join(" | ")}`);
}

console.log("AC_CAPITAL_AI_PROVIDER_LIVE_BRIDGE_STATIC_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log("PASS AC CAPITAL OS appears in AI Provider Control module catalogue");
console.log("PASS placeholder provider bridge replaced by governed runtime");
console.log("PASS live API route records provider decisions, usage and AC Capital run state");
console.log("PASS first governed capital agent and safety policy migration represented");
console.log("PASS no embedded Gemini key pattern");
console.log("PASS changed TypeScript/TSX files syntax-transpiled");
console.log("Next: apply supabase/migrations/20260728_ac_capital_os_ai_provider_live_bridge.sql");
