import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

function exists(p) {
  return fs.existsSync(p);
}

function detectRoots(start) {
  const repoOpsRoot = path.join(start, "apps", "ops-web");
  if (exists(repoOpsRoot)) {
    return { mode: "repository-root", repoRoot: start, opsRoot: repoOpsRoot };
  }
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) {
    return { mode: "ops-web-root", repoRoot: path.resolve(start, "..", ".."), opsRoot: start };
  }
  throw new Error("Run from repository root, e.g. ~/Desktop/angelcare-platform, or from apps/ops-web.");
}

const { mode, repoRoot, opsRoot } = detectRoots(cwd);
const target = path.join(opsRoot, "app", "(protected)", "ac-capital-os", "page.tsx");

if (!exists(target)) {
  throw new Error(`Target file not found: ${target}`);
}

let source = fs.readFileSync(target, "utf8");
const before = source;

const replacements = [
  {
    from: '<Badge tone={badgeTone(test.impact)}>{test.impact} impact</Badge>',
    to: '<Badge tone={badgeTone(test.impact)}>{`${test.impact} impact`}</Badge>',
  },
  {
    from: '<Badge tone={badgeTone(test.impact)}>{test.impact + " impact"}</Badge>',
    to: '<Badge tone={badgeTone(test.impact)}>{`${test.impact} impact`}</Badge>',
  },
];

for (const replacement of replacements) {
  source = source.split(replacement.from).join(replacement.to);
}

// Safety net: handle same JSX split across whitespace while preserving the single-string template literal.
source = source.replace(
  /<Badge\s+tone=\{badgeTone\(test\.impact\)\}>\s*\{test\.impact\}\s*impact\s*<\/Badge>/g,
  '<Badge tone={badgeTone(test.impact)}>{`${test.impact} impact`}</Badge>'
);

if (source === before) {
  if (source.includes('{`${test.impact} impact`}')) {
    console.log("MZ12 Badge children fix already applied. No source change needed.");
  } else {
    throw new Error("Could not find the MZ12 mixed Badge children pattern. No changes applied.");
  }
} else {
  const backupDir = path.join(repoRoot, ".angelcare_backups", `ac-capital-os-mz12-badge-children-fix-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(path.join(backupDir, "page.tsx.before-badge-children-fix"), before, "utf8");
  fs.writeFileSync(target, source, "utf8");
  console.log(`Backup created at: ${path.relative(repoRoot, backupDir)}`);
  console.log("MZ12 Badge children TS2322 fix applied.");
}

console.log(`Detected mode: ${mode}`);
console.log(`Touched file: ${path.relative(repoRoot, target)}`);
console.log("Fixed: Badge children now receives one string, not string[]");
console.log("No API, SQL, Market OS, AI Provider Control, or migration files touched.");
console.log("Next: node ./AC_CAPITAL_OS_MZ12_TS_FIX_01/scripts/verify_ac_capital_os_mz12_badge_children_fix.mjs");
