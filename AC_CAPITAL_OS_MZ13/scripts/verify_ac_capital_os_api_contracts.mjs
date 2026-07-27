import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
function exists(p) { return fs.existsSync(p); }
function findRoots(start) {
  const opsFromRepo = path.join(start, "apps", "ops-web");
  if (exists(opsFromRepo)) return { mode: "repository-root", repoRoot: start, opsRoot: opsFromRepo };
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) return { mode: "ops-web-root", repoRoot: path.resolve(start, "..", ".."), opsRoot: start };
  throw new Error("Run from repo root or apps/ops-web");
}
function assert(condition, message) { if (!condition) { console.error(`FAIL: ${message}`); process.exit(1); } }
const { repoRoot, opsRoot } = findRoots(cwd);

const routes = [
  "foundation","executive-cockpit","capital-radar","qualification-engine","funder-intelligence","capital-doctrine",
  "case-builder","data-room","capital-pipeline","coordinator-cockpit","ai-command-center","strategy-production-command",
];
for (const route of routes) {
  const file = path.join(opsRoot, "app", "api", "ac-capital-os", route, "route.ts");
  assert(exists(file), `missing API route ${route}`);
  const content = fs.readFileSync(file, "utf8");
  assert(content.includes("createWorkspaceRouteHandlers"), `${route} not upgraded to live/fallback handler`);
}
console.log("AC_CAPITAL_OS_API_CONTRACTS_VERIFIED");
