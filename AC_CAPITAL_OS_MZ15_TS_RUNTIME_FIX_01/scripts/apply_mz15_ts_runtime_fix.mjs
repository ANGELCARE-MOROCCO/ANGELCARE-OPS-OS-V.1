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

const { mode, repoRoot, opsRoot } = detectRoots();

const target = path.join(
  repoRoot,
  "AC_CAPITAL_OS_MZ15_FINAL_PRODUCTION",
  "scripts",
  "_lib.mjs",
);

if (!exists(target)) {
  throw new Error(`MZ15 verifier library not found: ${target}`);
}

const before = fs.readFileSync(target, "utf8");
const backupDir = path.join(
  repoRoot,
  ".angelcare_backups",
  `ac-capital-os-mz15-ts-runtime-fix-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
fs.mkdirSync(backupDir, { recursive: true });
fs.writeFileSync(path.join(backupDir, "_lib.mjs.before-ts-runtime-fix"), before, "utf8");

const replacement = `export function loadTypeScript() {
  const attempted = [];
  const requireFromScript = createRequire(import.meta.url);

  function tryRequire(requireFn, specifier, label) {
    try {
      const loaded = requireFn(specifier);
      if (loaded && typeof loaded.createSourceFile === "function") return loaded;
    } catch (error) {
      attempted.push(\`\${label}: \${error instanceof Error ? error.message : String(error)}\`);
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
      \`package resolution from \${packageFile}\`,
    );
    if (packageResolved) return packageResolved;

    const directLocal = path.join(root, "node_modules", "typescript", "lib", "typescript.js");
    if (exists(directLocal)) {
      const directResolved = tryRequire(
        requireFromPackage,
        directLocal,
        \`direct local runtime \${directLocal}\`,
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
    const loaded = tryRequire(requireFromScript, candidate, \`NODE_PATH runtime \${candidate}\`);
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
      const loaded = tryRequire(requireFromScript, candidate, \`NVM runtime \${candidate}\`);
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
    const loaded = tryRequire(requireFromScript, candidate, \`global runtime \${candidate}\`);
    if (loaded) return loaded;
  }

  const directPackage = tryRequire(requireFromScript, "typescript", "script package resolution");
  if (directPackage) return directPackage;

  throw new Error(
    [
      "TypeScript runtime was not found.",
      "Expected it in apps/ops-web/node_modules/typescript or another project/global Node module location.",
      "Run npm install in apps/ops-web only if node_modules is genuinely absent.",
      attempted.length ? \`Resolution attempts:\\n- \${attempted.join("\\n- ")}\` : "",
    ]
      .filter(Boolean)
      .join("\\n"),
  );
}`;

const pattern = /export function loadTypeScript\(\) \{[\s\S]*?\n\}\nexport const routes =/;

if (!pattern.test(before)) {
  if (before.includes("package resolution from") && before.includes("apps\", \"ops-web")) {
    console.log("MZ15 TypeScript runtime resolver is already fixed.");
    process.exit(0);
  }
  throw new Error("Could not locate the original loadTypeScript() function in _lib.mjs.");
}

const after = before.replace(pattern, `${replacement}\nexport const routes =`);
fs.writeFileSync(target, after, "utf8");

console.log("AC CAPITAL OS MZ15 TypeScript runtime resolution fix applied.");
console.log(`Detected mode: ${mode}`);
console.log(`Repository root: ${repoRoot}`);
console.log(`Ops-web root: ${opsRoot}`);
console.log(`Touched file: ${path.relative(repoRoot, target)}`);
console.log(`Backup created at: ${path.relative(repoRoot, backupDir)}`);
console.log("No application runtime, route, API, SQL, UI, or business logic file was changed.");
console.log("Next: node ./AC_CAPITAL_OS_MZ15_TS_RUNTIME_FIX_01/scripts/verify_mz15_ts_runtime_fix.mjs");
