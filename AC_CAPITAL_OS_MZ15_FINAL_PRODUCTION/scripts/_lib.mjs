import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

export function exists(file) { return fs.existsSync(file); }
export function read(file) { return fs.readFileSync(file, "utf8"); }
export function assert(condition, message) { if (!condition) { console.error(`FAIL: ${message}`); process.exit(1); } }
export function detectRoots(start = process.cwd()) {
  const opsFromRepo = path.join(start, "apps", "ops-web");
  if (exists(opsFromRepo)) return { mode: "repository-root", repoRoot: start, opsRoot: opsFromRepo };
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) return { mode: "ops-web-root", repoRoot: path.resolve(start, "..", ".."), opsRoot: start };
  throw new Error("Run from the AngelCare repository root or apps/ops-web.");
}
export function walk(dir, predicate = () => true, files = []) {
  if (!exists(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, predicate, files);
    else if (predicate(full)) files.push(full);
  }
  return files;
}
export function relative(repoRoot, file) { return path.relative(repoRoot, file); }
export function assertFile(file, repoRoot = process.cwd()) { assert(exists(file), `missing file: ${relative(repoRoot, file)}`); }
export function assertIncludes(file, token, repoRoot = process.cwd()) { assertFile(file, repoRoot); assert(read(file).includes(token), `${relative(repoRoot, file)} missing token: ${token}`); }
export function loadTypeScript() {
  const attempted = [];
  const requireFromScript = createRequire(import.meta.url);

  function tryRequire(requireFn, specifier, label) {
    try {
      const loaded = requireFn(specifier);
      if (loaded && typeof loaded.createSourceFile === "function") return loaded;
    } catch (error) {
      attempted.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    }
    return null;
  }

  const searchRoots = [];
  const addRoot = (root) => {
    if (!root) return;
    const normalized = path.resolve(root);
    if (!searchRoots.includes(normalized)) searchRoots.push(normalized);
  };

  let cursor = process.cwd();
  while (true) {
    addRoot(cursor);
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }

  for (const root of [...searchRoots]) {
    addRoot(path.join(root, "apps", "ops-web"));
  }

  for (const root of searchRoots) {
    const packageFile = path.join(root, "package.json");
    if (!exists(packageFile)) continue;

    const requireFromPackage = createRequire(packageFile);
    const packageResolved = tryRequire(
      requireFromPackage,
      "typescript",
      `package resolution from ${packageFile}`,
    );
    if (packageResolved) return packageResolved;

    const directLocal = path.join(root, "node_modules", "typescript", "lib", "typescript.js");
    if (exists(directLocal)) {
      const directResolved = tryRequire(
        requireFromPackage,
        directLocal,
        `direct local runtime ${directLocal}`,
      );
      if (directResolved) return directResolved;
    }
  }

  const nodePathEntries = (process.env.NODE_PATH || "")
    .split(path.delimiter)
    .filter(Boolean);
  for (const entry of nodePathEntries) {
    const candidate = path.join(entry, "typescript", "lib", "typescript.js");
    if (!exists(candidate)) continue;
    const loaded = tryRequire(requireFromScript, candidate, `NODE_PATH runtime ${candidate}`);
    if (loaded) return loaded;
  }

  const home = process.env.HOME || process.env.USERPROFILE || "";
  const nvmVersions = path.join(home, ".nvm", "versions", "node");
  if (exists(nvmVersions)) {
    const versions = fs.readdirSync(nvmVersions).sort().reverse();
    for (const version of versions) {
      const candidate = path.join(
        nvmVersions,
        version,
        "lib",
        "node_modules",
        "typescript",
        "lib",
        "typescript.js",
      );
      if (!exists(candidate)) continue;
      const loaded = tryRequire(requireFromScript, candidate, `NVM runtime ${candidate}`);
      if (loaded) return loaded;
    }
  }

  const globalCandidates = [
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
    "/opt/local/lib/node_modules/typescript/lib/typescript.js",
  ];

  for (const candidate of globalCandidates) {
    if (!exists(candidate)) continue;
    const loaded = tryRequire(requireFromScript, candidate, `global runtime ${candidate}`);
    if (loaded) return loaded;
  }

  const directPackage = tryRequire(requireFromScript, "typescript", "script package resolution");
  if (directPackage) return directPackage;

  throw new Error(
    [
      "TypeScript runtime was not found.",
      "Expected it in apps/ops-web/node_modules/typescript or another project/global Node module location.",
      "Run npm install in apps/ops-web only if node_modules is genuinely absent.",
      attempted.length ? `Resolution attempts:\n- ${attempted.join("\n- ")}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}
export const routes = [
  ["", "command-floor", "CommandFloorPage"], ["radar", "radar", "RadarPage"], ["qualification", "qualification", "QualificationPage"],
  ["funders", "funders", "FundersPage"], ["doctrine", "doctrine", "DoctrinePage"], ["cases", "cases", "CasesPage"],
  ["data-room", "data-room", "DataRoomPage"], ["pipeline", "pipeline", "PipelinePage"], ["coordinator", "coordinator", "CoordinatorPage"],
  ["ai-command", "ai-command", "AiCommandPage"], ["strategy", "strategy", "StrategyPage"], ["simulator", "simulator", "SimulatorPage"],
  ["reports", "reports", "ReportsPage"], ["manual", "manual", "ManualPage"], ["approvals", "approvals", "ApprovalsPage"],
  ["learning", "learning", "LearningPage"], ["settings", "settings", "SettingsPage"], ["production", "production", "ProductionPage"],
];
