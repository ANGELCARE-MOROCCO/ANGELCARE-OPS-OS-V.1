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

function copyRecursive(source, destination) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(destination, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function findActiveUniverseImports(opsRoot, retiredRoot) {
  const sourceRoots = [
    path.join(opsRoot, "app"),
    path.join(opsRoot, "components"),
    path.join(opsRoot, "lib"),
  ];

  const references = [];
  const importPattern =
    /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const sourceRoot of sourceRoots) {
    for (const file of walk(sourceRoot, (candidate) => /\.(?:ts|tsx|mts|cts)$/.test(candidate))) {
      if (file === retiredRoot || file.startsWith(`${retiredRoot}${path.sep}`)) continue;

      const content = fs.readFileSync(file, "utf8");
      let match;
      while ((match = importPattern.exec(content))) {
        const specifier = match[1] || match[2] || "";
        if (
          specifier.includes("ac-capital-os/universe") ||
          /(?:^|\/)universe(?:\/|$)/.test(specifier)
        ) {
          references.push(`${path.relative(opsRoot, file)} -> ${specifier}`);
        }
      }

      if (
        content.includes("CapitalUniverseClient") ||
        content.includes("CapitalUniverseData") ||
        content.includes("CapitalUniverseTypes")
      ) {
        references.push(`${path.relative(opsRoot, file)} -> legacy CapitalUniverse symbol`);
      }
    }
  }

  return [...new Set(references)];
}

const { mode, repoRoot, opsRoot } = detectRoots();
const retiredRoot = path.join(
  opsRoot,
  "components",
  "ac-capital-os",
  "universe",
);

if (!exists(retiredRoot)) {
  console.log("The obsolete MZ14 universe folder is already absent. Nothing to retire.");
  process.exit(0);
}

const activeReferences = findActiveUniverseImports(opsRoot, retiredRoot);
if (activeReferences.length) {
  throw new Error(
    [
      "Retirement aborted because active source files still reference the MZ14 universe.",
      ...activeReferences.map((reference) => `- ${reference}`),
    ].join("\n"),
  );
}

const backupDir = path.join(
  repoRoot,
  ".angelcare_backups",
  `ac-capital-os-mz15-retired-mz14-universe-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`,
);

const backupTarget = path.join(
  backupDir,
  "apps",
  "ops-web",
  "components",
  "ac-capital-os",
  "universe",
);

copyRecursive(retiredRoot, backupTarget);
fs.rmSync(retiredRoot, { recursive: true, force: true });

console.log("AC CAPITAL OS MZ15 obsolete MZ14 universe retired.");
console.log(`Detected mode: ${mode}`);
console.log(`Repository root: ${repoRoot}`);
console.log(`Retired folder: ${path.relative(repoRoot, retiredRoot)}`);
console.log(`Backup created at: ${path.relative(repoRoot, backupTarget)}`);
console.log("Reason: the MZ15 no-dead-buttons gate was scanning inactive MZ14 facade code.");
console.log("No active MZ15 route, page package, API, SQL, or business workflow was modified.");
console.log("Next: node ./AC_CAPITAL_OS_MZ15_RETIRE_MZ14_UNIVERSE_01/scripts/verify_retired_mz14_universe.mjs");
