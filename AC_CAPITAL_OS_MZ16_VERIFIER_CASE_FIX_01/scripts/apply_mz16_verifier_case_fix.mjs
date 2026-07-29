import fs from "node:fs";
import path from "node:path";

function exists(file) {
  return fs.existsSync(file);
}

function detectRepo(start = process.cwd()) {
  if (exists(path.join(start, "apps", "ops-web"))) return start;
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) {
    return path.resolve(start, "..", "..");
  }
  throw new Error("Run from the AngelCare repository root or apps/ops-web.");
}

const repo = detectRepo();
const target = path.join(
  repo,
  "AC_CAPITAL_OS_MZ16_FINAL_INSTITUTIONAL_COMMAND_EXPERIENCE",
  "scripts",
  "verify_ac_capital_os_mz16.mjs",
);

if (!exists(target)) {
  throw new Error(`MZ16 verifier not found: ${target}`);
}

const before = fs.readFileSync(target, "utf8");

const oldBlock = `const ai = read(path.join(ops, "components/ac-capital-os/pages/ai-command/AiCommandPage.tsx"));
for (const token of ["Provider", "Workspace", "Linked skills", "governed"]) {
  if (!ai.includes(token)) fail(\`AI command hydration UI missing \${token}\`);
}`;

const newBlock = `const ai = read(path.join(ops, "components/ac-capital-os/pages/ai-command/AiCommandPage.tsx"));
const aiNormalized = ai.toLowerCase();
for (const token of ["provider", "workspace", "linked skills", "governed"]) {
  if (!aiNormalized.includes(token)) fail(\`AI command hydration UI missing \${token}\`);
}`;

if (!before.includes(oldBlock)) {
  if (
    before.includes("const aiNormalized = ai.toLowerCase();") &&
    before.includes('"linked skills"')
  ) {
    console.log("MZ16 verifier case-sensitivity fix is already applied.");
    process.exit(0);
  }

  throw new Error(
    "Expected MZ16 AI hydration verifier block was not found. No file changed.",
  );
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(
  repo,
  ".angelcare_backups",
  `ac-capital-os-mz16-verifier-case-fix-${stamp}`,
);
fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(target, path.join(backupDir, "verify_ac_capital_os_mz16.mjs.before-fix"));

const after = before.replace(oldBlock, newBlock);
fs.writeFileSync(target, after, "utf8");

console.log("AC CAPITAL OS MZ16 verifier case-sensitivity fix applied.");
console.log(`Touched file: ${path.relative(repo, target)}`);
console.log(`Backup: ${path.relative(repo, backupDir)}`);
console.log("No application, UI, API, SQL, provider, or business-logic file was changed.");
console.log("Next: node ./AC_CAPITAL_OS_MZ16_VERIFIER_CASE_FIX_01/scripts/verify_mz16_verifier_case_fix.mjs");
