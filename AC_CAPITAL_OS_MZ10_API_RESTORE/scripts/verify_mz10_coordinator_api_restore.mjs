import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

function exists(p) {
  return fs.existsSync(p);
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function findRoots(start) {
  const opsFromRepo = path.join(start, "apps", "ops-web");
  if (exists(opsFromRepo)) return { mode: "repository-root", repoRoot: start, opsRoot: opsFromRepo };
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) {
    return { mode: "ops-web-root", repoRoot: path.resolve(start, "..", ".."), opsRoot: start };
  }
  throw new Error("Run from repository root or apps/ops-web.");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

const { mode, repoRoot, opsRoot } = findRoots(cwd);
const target = path.join(opsRoot, "app", "api", "ac-capital-os", "coordinator-cockpit", "route.ts");

assert(exists(target), "coordinator-cockpit API still missing.");
const content = read(target);
for (const token of [
  "MZ10_AC_CAPITAL_OS_COORDINATOR_COCKPIT",
  "coordinatorTodayActions",
  "coordinatorAIPreparedTasks",
  "coordinatorManualEmails",
  "coordinatorCallDesk",
  "coordinatorProofTasks",
  "coordinatorFounderApprovals",
  "coordinatorSubmissionReadiness",
  "coordinatorEscalations",
  "coordinatorWorkload",
  "coordinatorHandoverSheets",
  "coordinatorSafetyWarnings",
  "coordinatorCompletionEvents",
]) {
  assert(content.includes(token), `coordinator-cockpit API missing token: ${token}`);
}

console.log("AC_CAPITAL_OS_MZ10_COORDINATOR_API_RESTORED_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log(`Verified: ${path.relative(repoRoot, target)}`);
console.log("Next: rerun MZ11 verifier.");
