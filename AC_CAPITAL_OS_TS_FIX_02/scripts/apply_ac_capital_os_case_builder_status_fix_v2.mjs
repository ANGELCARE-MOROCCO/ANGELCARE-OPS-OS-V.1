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

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function writeFile(file, content) {
  fs.writeFileSync(file, content, "utf8");
}

function hasFinanceReviewLiteral(source) {
  return /['"]Needs Finance Review['"]/.test(source);
}

function includesStatus(block, status) {
  const escaped = status.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`['"]${escaped}['"]`).test(block);
}

function insertAfterFounderApproval(block) {
  if (includesStatus(block, "Needs Finance Review")) {
    return { changed: false, block };
  }

  const founderMatch = block.match(/(['"])Needs Founder Approval\1/);
  if (!founderMatch) {
    return { changed: false, block };
  }

  const quote = founderMatch[1];
  const finance = `${quote}Needs Finance Review${quote}`;
  const founder = `${quote}Needs Founder Approval${quote}`;

  const founderIndex = block.indexOf(founder);
  const afterFounder = block.slice(founderIndex + founder.length);

  // Const array style: "Needs Founder Approval",
  if (/^\s*,/.test(afterFounder)) {
    return {
      changed: true,
      block: block.slice(0, founderIndex + founder.length) + `,\n  ${finance}` + block.slice(founderIndex + founder.length),
    };
  }

  // Union style: "Needs Founder Approval" | ...
  return {
    changed: true,
    block: block.slice(0, founderIndex + founder.length) + `\n  | ${finance}` + block.slice(founderIndex + founder.length),
  };
}

function findStatusBlocks(source) {
  const blocks = [];

  const typeRegex = /((?:export\s+)?type\s+[A-Za-z0-9_]*(?:Status|Statuses|Stage|Stages)[A-Za-z0-9_]*\s*=\s*[\s\S]*?;)/g;
  let match;
  while ((match = typeRegex.exec(source))) {
    const block = match[1];
    if (includesStatus(block, "Needs Founder Approval") && includesStatus(block, "AI Draft Ready") && includesStatus(block, "Rejected / Rework")) {
      blocks.push({ start: match.index, end: match.index + block.length, block, kind: "type-union" });
    }
  }

  const propertyUnionRegex = /((?:status|stage|readiness|financialReadiness|caseReadiness|packageReadiness|documentReadiness)[A-Za-z0-9_]*\??:\s*[\s\S]*?;)/g;
  while ((match = propertyUnionRegex.exec(source))) {
    const block = match[1];
    if (includesStatus(block, "Needs Founder Approval") && includesStatus(block, "AI Draft Ready") && includesStatus(block, "Rejected / Rework")) {
      blocks.push({ start: match.index, end: match.index + block.length, block, kind: "property-union" });
    }
  }

  const constArrayRegex = /((?:export\s+)?const\s+[A-Za-z0-9_]*(?:status|statuses|Status|Statuses|STAGE|STAGES|Stage|Stages)[A-Za-z0-9_]*\s*=\s*\[[\s\S]*?\]\s*as const\s*;?)/g;
  while ((match = constArrayRegex.exec(source))) {
    const block = match[1];
    if (includesStatus(block, "Needs Founder Approval") && includesStatus(block, "AI Draft Ready") && includesStatus(block, "Rejected / Rework")) {
      blocks.push({ start: match.index, end: match.index + block.length, block, kind: "const-array" });
    }
  }

  return blocks;
}

function listAcCapitalLibFiles(opsRoot) {
  const dir = path.join(opsRoot, "lib", "ac-capital-os");
  if (!exists(dir)) {
    throw new Error(`AC CAPITAL OS lib directory not found: ${dir}`);
  }

  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".ts") || name.endsWith(".tsx"))
    .map((name) => path.join(dir, name));
}

const { mode, repoRoot, opsRoot } = detectRoots(cwd);
const targetCaseBuilder = path.join(opsRoot, "lib", "ac-capital-os", "case-builder.ts");

if (!exists(targetCaseBuilder)) {
  throw new Error(`Target file not found: ${targetCaseBuilder}`);
}

const acCapitalLibFiles = listAcCapitalLibFiles(opsRoot);
const caseBuilderSourceBefore = read(targetCaseBuilder);
const caseBuilderHasLiteralBefore = hasFinanceReviewLiteral(caseBuilderSourceBefore);

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(repoRoot, ".angelcare_backups", `ac-capital-os-case-builder-status-fix-v2-${timestamp}`);
fs.mkdirSync(backupDir, { recursive: true });

let changedFiles = [];

for (const file of acCapitalLibFiles) {
  const source = read(file);
  const blocks = findStatusBlocks(source);

  let next = source;
  let offset = 0;
  let changedThisFile = false;

  for (const blockInfo of blocks) {
    const start = blockInfo.start + offset;
    const end = blockInfo.end + offset;
    const currentBlock = next.slice(start, end);
    const result = insertAfterFounderApproval(currentBlock);

    if (result.changed) {
      next = next.slice(0, start) + result.block + next.slice(end);
      offset += result.block.length - currentBlock.length;
      changedThisFile = true;
      // One correct status declaration is usually enough, but patch all matching declarations in same file for consistency.
    }
  }

  if (changedThisFile) {
    fs.copyFileSync(file, path.join(backupDir, path.basename(file) + ".before-status-fix-v2"));
    writeFile(file, next);
    changedFiles.push(path.relative(repoRoot, file));
  }
}

const caseBuilderSourceAfter = read(targetCaseBuilder);
const caseBuilderHasLiteralAfter = hasFinanceReviewLiteral(caseBuilderSourceAfter);
const declarationSupportsFinanceReview = acCapitalLibFiles.some((file) => {
  const source = read(file);
  return findStatusBlocks(source).some((blockInfo) => includesStatus(blockInfo.block, "Needs Finance Review"));
});

if (caseBuilderHasLiteralAfter && !declarationSupportsFinanceReview) {
  throw new Error(
    'Patch failed: case-builder.ts still contains "Needs Finance Review" but no AC CAPITAL OS status declaration supports it.'
  );
}

console.log("AC CAPITAL OS TS2322 case-builder status fix V2 completed.");
console.log(`Detected mode: ${mode}`);
console.log(`Repo root: ${repoRoot}`);
console.log(`Target checked: ${path.relative(repoRoot, targetCaseBuilder)}`);

if (!caseBuilderHasLiteralBefore && changedFiles.length === 0) {
  console.log('No current "Needs Finance Review" literal exists in case-builder.ts. This means the uploaded log is stale or the value was already changed. No source file was modified.');
} else if (changedFiles.length > 0) {
  console.log('Added allowed status support for "Needs Finance Review".');
  console.log(`Changed files: ${changedFiles.join(", ")}`);
  console.log(`Backup created at: ${path.relative(repoRoot, backupDir)}`);
} else {
  console.log('Status support already existed. No source file was modified.');
}

console.log("No Market OS files touched.");
console.log("Next: node ./AC_CAPITAL_OS_TS_FIX_02/scripts/verify_ac_capital_os_case_builder_status_fix_v2.mjs");
console.log("Then run: cd apps/ops-web && npx tsc -p tsconfig.json --noEmit --pretty false");
