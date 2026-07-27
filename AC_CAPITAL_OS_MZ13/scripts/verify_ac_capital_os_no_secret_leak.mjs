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

const scanRoots = [
  path.join(opsRoot, "lib", "ac-capital-os"),
  path.join(opsRoot, "app", "api", "ac-capital-os"),
  path.join(opsRoot, "app", "(protected)", "ac-capital-os"),
];
const suspicious = [
  /AIza[0-9A-Za-z_-]{20,}/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /service_role_[A-Za-z0-9_-]{20,}/,
  /postgresql:\/\/[^'"\s]+:[^'"\s]+@/,
];
function walk(dir, files = []) {
  if (!exists(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|js|mjs|md)$/.test(entry)) files.push(full);
  }
  return files;
}
for (const root of scanRoots) {
  for (const file of walk(root)) {
    const content = fs.readFileSync(file, "utf8");
    for (const pattern of suspicious) assert(!pattern.test(content), `possible secret leak in ${path.relative(repoRoot, file)}`);
  }
}
console.log("AC_CAPITAL_OS_NO_SECRET_LEAK_VERIFIED");
