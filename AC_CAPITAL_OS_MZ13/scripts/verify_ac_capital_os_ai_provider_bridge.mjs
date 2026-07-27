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

const bridge = path.join(opsRoot, "lib", "ac-capital-os", "server", "ai-provider-bridge.ts");
const runner = path.join(opsRoot, "lib", "ac-capital-os", "server", "ai-runner.ts");
assert(exists(bridge), "ai-provider-bridge.ts missing");
assert(exists(runner), "ai-runner.ts missing");
const content = fs.readFileSync(bridge, "utf8") + fs.readFileSync(runner, "utf8");
for (const token of ["/ai-provider-control","/api/ai-provider-control/snapshot","/api/ai-provider-control/action","dry-run","AC_CAPITAL_AI_ALLOW_LIVE_RUNS"]) {
  assert(content.includes(token), `AI provider bridge missing token: ${token}`);
}
console.log("AC_CAPITAL_OS_AI_PROVIDER_BRIDGE_VERIFIED");
