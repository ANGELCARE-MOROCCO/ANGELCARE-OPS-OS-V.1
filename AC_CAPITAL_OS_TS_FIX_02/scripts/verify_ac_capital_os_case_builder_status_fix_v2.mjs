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

  if (exists(path.join(start, "app")) && exists(path.join(start, "lib"))) {
    return { mode: "ops-web-root", repoRoot: path.resolve(start, "..", ".."), opsRoot: start };
  }

  throw new Error("Run from the repository root, e.g. ~/Desktop/angelcare-platform, or from apps/ops-web.");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function hasFinanceReviewLiteral(source) {
  return /['"]Needs Finance Review['"]/.test(source);
}

function includesStatus(block, status) {
  const escaped = status.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`['"]${escaped}['"]`).test(block);
}

function findStatusBlocks(source) {
  const blocks = [];

  const typeRegex = /((?:export\s+)?type\s+[A-Za-z0-9_]*(?:Status|Statuses|Stage|Stages)[A-Za-z0-9_]*\s*=\s*[\s\S]*?;)/g;
  let match;
  while ((match = typeRegex.exec(source))) {
    const block = match[1];
    if (includesStatus(block, "Needs Founder Approval") && includesStatus(block, "AI Draft Ready") && includesStatus(block, "Rejected / Rework")) {
      blocks.push({ block, kind: "type-union" });
    }
  }

  const propertyUnionRegex = /((?:status|stage|readiness|financialReadiness|caseReadiness|packageReadiness|documentReadiness)[A-Za-z0-9_]*\??:\s*[\s\S]*?;)/g;
  while ((match = propertyUnionRegex.exec(source))) {
    const block = match[1];
    if (includesStatus(block, "Needs Founder Approval") && includesStatus(block, "AI Draft Ready") && includesStatus(block, "Rejected / Rework")) {
      blocks.push({ block, kind: "property-union" });
    }
  }

  const constArrayRegex = /((?:export\s+)?const\s+[A-Za-z0-9_]*(?:status|statuses|Status|Statuses|STAGE|STAGES|Stage|Stages)[A-Za-z0-9_]*\s*=\s*\[[\s\S]*?\]\s*as const\s*;?)/g;
  while ((match = constArrayRegex.exec(source))) {
    const block = match[1];
    if (includesStatus(block, "Needs Founder Approval") && includesStatus(block, "AI Draft Ready") && includesStatus(block, "Rejected / Rework")) {
      blocks.push({ block, kind: "const-array" });
    }
  }

  return blocks;
}

function listAcCapitalLibFiles(opsRoot) {
  const dir = path.join(opsRoot, "lib", "ac-capital-os");
  assert(exists(dir), `AC CAPITAL OS lib directory not found: ${dir}`);
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".ts") || name.endsWith(".tsx"))
    .map((name) => path.join(dir, name));
}

const { mode, repoRoot, opsRoot } = detectRoots(cwd);
const targetCaseBuilder = path.join(opsRoot, "lib", "ac-capital-os", "case-builder.ts");
assert(exists(targetCaseBuilder), `Target file missing: ${targetCaseBuilder}`);

const caseBuilderSource = read(targetCaseBuilder);
const caseBuilderHasFinanceReview = hasFinanceReviewLiteral(caseBuilderSource);

const acCapitalLibFiles = listAcCapitalLibFiles(opsRoot);
const declarationBlocks = acCapitalLibFiles.flatMap((file) =>
  findStatusBlocks(read(file)).map((blockInfo) => ({
    file,
    block: blockInfo.block,
    kind: blockInfo.kind,
  }))
);

const supported = declarationBlocks.some((entry) => includesStatus(entry.block, "Needs Finance Review"));

if (caseBuilderHasFinanceReview) {
  assert(
    supported,
    'case-builder.ts contains "Needs Finance Review", but no AC CAPITAL OS status declaration supports it.'
  );
  console.log("AC_CAPITAL_OS_CASE_BUILDER_STATUS_FIX_V2_VERIFIED");
  console.log(`Detected mode: ${mode}`);
  console.log(`Verified file: ${path.relative(repoRoot, targetCaseBuilder)}`);
  console.log('Verified: "Needs Finance Review" is supported by AC CAPITAL OS status declaration.');
} else {
  console.log("AC_CAPITAL_OS_CASE_BUILDER_STATUS_FIX_V2_NOT_NEEDED_VERIFIED");
  console.log(`Detected mode: ${mode}`);
  console.log(`Verified file: ${path.relative(repoRoot, targetCaseBuilder)}`);
  console.log('No current "Needs Finance Review" literal exists in case-builder.ts. The uploaded TS log is stale or the source was already changed.');
}

console.log("Next: cd apps/ops-web && npx tsc -p tsconfig.json --noEmit --pretty false");
