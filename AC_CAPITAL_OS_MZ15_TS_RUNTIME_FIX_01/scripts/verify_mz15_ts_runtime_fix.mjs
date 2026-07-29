import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function exists(file) {
  return fs.existsSync(file);
}

function detectRoots(start = process.cwd()) {
  const opsFromRepo = path.join(start, "apps", "ops-web");
  if (exists(opsFromRepo)) {
    return { mode: "repository-root", repoRoot: start, opsRoot: opsFromRepo };
  }

  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) {
    return {
      mode: "ops-web-root",
      repoRoot: path.resolve(start, "..", ".."),
      opsRoot: start,
    };
  }

  throw new Error("Run from the AngelCare repository root or apps/ops-web.");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

const { mode, repoRoot, opsRoot } = detectRoots();
const target = path.join(
  repoRoot,
  "AC_CAPITAL_OS_MZ15_FINAL_PRODUCTION",
  "scripts",
  "_lib.mjs",
);

assert(exists(target), "MZ15 verifier library is missing.");

const content = fs.readFileSync(target, "utf8");
for (const token of [
  "package resolution from",
  '"apps", "ops-web"',
  "node_modules\", \"typescript\", \"lib\", \"typescript.js",
  "Resolution attempts:",
]) {
  assert(content.includes(token), `_lib.mjs missing resolver token: ${token}`);
}

const moduleUrl = `${pathToFileURL(target).href}?verification=${Date.now()}`;
const verifierLib = await import(moduleUrl);
assert(typeof verifierLib.loadTypeScript === "function", "loadTypeScript export is missing.");

const ts = verifierLib.loadTypeScript();
assert(ts && typeof ts.createSourceFile === "function", "Resolved module is not the TypeScript compiler API.");

const resolvedVersion = typeof ts.version === "string" ? ts.version : "unknown";
console.log("MZ15_TYPESCRIPT_RUNTIME_RESOLUTION_FIX_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log(`Ops-web root: ${opsRoot}`);
console.log(`Resolved TypeScript version: ${resolvedVersion}`);
console.log("Next: node ./AC_CAPITAL_OS_MZ15_FINAL_PRODUCTION/scripts/verify_ac_capital_os_mz15_final.mjs");
