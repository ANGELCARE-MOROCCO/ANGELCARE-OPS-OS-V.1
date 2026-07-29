import fs from "node:fs";
import path from "node:path";

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

function walk(root, predicate = () => true) {
  const found = [];
  if (!exists(root)) return found;

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", "dist", "coverage"].includes(entry.name)) continue;
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) found.push(...walk(absolute, predicate));
    else if (predicate(absolute)) found.push(absolute);
  }

  return found;
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

const { mode, repoRoot, opsRoot } = detectRoots();
const retiredRoot = path.join(
  opsRoot,
  "components",
  "ac-capital-os",
  "universe",
);

assert(!exists(retiredRoot), "obsolete MZ14 universe folder still exists");

const routeNames = [
  "",
  "radar",
  "qualification",
  "funders",
  "doctrine",
  "cases",
  "data-room",
  "pipeline",
  "coordinator",
  "ai-command",
  "strategy",
  "simulator",
  "reports",
  "manual",
  "approvals",
  "learning",
  "settings",
  "production",
];

for (const routeName of routeNames) {
  const pageFile = routeName
    ? path.join(
        opsRoot,
        "app",
        "(protected)",
        "ac-capital-os",
        routeName,
        "page.tsx",
      )
    : path.join(
        opsRoot,
        "app",
        "(protected)",
        "ac-capital-os",
        "page.tsx",
      );

  assert(exists(pageFile), `MZ15 route missing after cleanup: ${pageFile}`);
  const content = fs.readFileSync(pageFile, "utf8");
  assert(
    !content.includes("CapitalUniverseClient"),
    `route still uses retired CapitalUniverseClient: ${pageFile}`,
  );
}

const activeReferences = [];
for (const sourceRoot of [
  path.join(opsRoot, "app"),
  path.join(opsRoot, "components"),
  path.join(opsRoot, "lib"),
]) {
  for (const file of walk(sourceRoot, (candidate) => /\.(?:ts|tsx|mts|cts)$/.test(candidate))) {
    const content = fs.readFileSync(file, "utf8");
    if (
      content.includes("ac-capital-os/universe") ||
      content.includes("CapitalUniverseClient") ||
      content.includes("CapitalUniverseData") ||
      content.includes("CapitalUniverseTypes")
    ) {
      activeReferences.push(path.relative(opsRoot, file));
    }
  }
}

assert(
  activeReferences.length === 0,
  `active legacy universe references remain: ${activeReferences.join(", ")}`,
);

console.log("MZ15_OBSOLETE_MZ14_UNIVERSE_RETIREMENT_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log("All 18 dedicated MZ15 routes remain present.");
console.log("No active MZ14 CapitalUniverse facade reference remains.");
console.log("Next: node ./AC_CAPITAL_OS_MZ15_FINAL_PRODUCTION/scripts/verify_ac_capital_os_mz15_final.mjs");
