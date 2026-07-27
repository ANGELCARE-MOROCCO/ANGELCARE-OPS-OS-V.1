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

const apiRoot = process.env.AC_CAPITAL_API_ROOT;
if (!apiRoot) {
  console.log("AC_CAPITAL_OS_LIVE_API_SMOKE_SKIPPED: set AC_CAPITAL_API_ROOT, e.g. http://localhost:3000");
  process.exit(0);
}
const routes = ["foundation","capital-radar","data-room","ai-command-center","strategy-production-command"];
for (const route of routes) {
  const response = await fetch(`${apiRoot}/api/ac-capital-os/${route}`);
  assert(response.ok, `API smoke failed for ${route}: ${response.status}`);
  const data = await response.json();
  assert("dataMode" in data, `${route} missing dataMode`);
  assert("source" in data, `${route} missing source`);
}
console.log("AC_CAPITAL_OS_LIVE_API_SMOKE_VERIFIED");
