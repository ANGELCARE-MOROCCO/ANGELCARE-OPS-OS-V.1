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

function findDeclarationBlocks(source) {
  const blocks = [];

  const typeRegex = /((?:export\s+)?type\s+[A-Za-z0-9_]*(?:Status|Statuses|Stage|Stages)[A-Za-z0-9_]*\s*=\s*[\s\S]*?;)/g;
  let match;
  while ((match = typeRegex.exec(source))) {
    const block = match[1];
    if (
      block.includes('"Needs Founder Approval"') &&
      block.includes('"AI Draft Ready"') &&
      block.includes('"Rejected / Rework"')
    ) {
      blocks.push({ kind: "type-union", start: match.index, end: match.index + block.length, block });
    }
  }

  const constRegex = /((?:export\s+)?const\s+[A-Za-z0-9_]*(?:status|statuses|Status|Statuses|STAGE|STAGES|Stage|Stages)[A-Za-z0-9_]*\s*=\s*\[[\s\S]*?\]\s*as const\s*;?)/g;
  while ((match = constRegex.exec(source))) {
    const block = match[1];
    if (
      block.includes('"Needs Founder Approval"') &&
      block.includes('"AI Draft Ready"') &&
      block.includes('"Rejected / Rework"')
    ) {
      blocks.push({ kind: "const-array", start: match.index, end: match.index + block.length, block });
    }
  }

  return blocks;
}

function patchBlock(blockInfo) {
  const { kind, block } = blockInfo;
  if (block.includes('"Needs Finance Review"')) {
    return { changed: false, block };
  }

  if (kind === "type-union") {
    if (block.includes('| "Needs Founder Approval"')) {
      return {
        changed: true,
        block: block.replace('| "Needs Founder Approval"', '| "Needs Founder Approval"\n  | "Needs Finance Review"'),
      };
    }

    return {
      changed: true,
      block: block.replace('"Needs Founder Approval"', '"Needs Founder Approval" | "Needs Finance Review"'),
    };
  }

  if (kind === "const-array") {
    if (block.includes('"Needs Founder Approval",')) {
      return {
        changed: true,
        block: block.replace('"Needs Founder Approval",', '"Needs Founder Approval",\n  "Needs Finance Review",'),
      };
    }

    return {
      changed: true,
      block: block.replace('"Needs Founder Approval"', '"Needs Founder Approval",\n  "Needs Finance Review"'),
    };
  }

  return { changed: false, block };
}

const { mode, repoRoot, opsRoot } = detectRoots(cwd);
const target = path.join(opsRoot, "lib", "ac-capital-os", "case-builder.ts");

if (!exists(target)) {
  throw new Error(`Target file not found: ${target}`);
}

let source = fs.readFileSync(target, "utf8");

if (!source.includes('"Needs Finance Review"')) {
  console.log("No literal \"Needs Finance Review\" was found in case-builder.ts. Nothing to patch for the reported TS2322 error.");
  process.exit(0);
}

const initialBlocks = findDeclarationBlocks(source);
if (initialBlocks.length === 0) {
  throw new Error(
    "Could not find the AC CAPITAL OS case-builder status declaration block safely. No changes applied. Please send the first 120 lines of lib/ac-capital-os/case-builder.ts."
  );
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(repoRoot, ".angelcare_backups", `ac-capital-os-case-builder-status-fix-${timestamp}`);
fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(target, path.join(backupDir, "case-builder.ts.before-status-fix"));

let patched = false;
for (const blockInfo of initialBlocks) {
  const currentBlock = source.slice(blockInfo.start, blockInfo.end);
  const result = patchBlock({ ...blockInfo, block: currentBlock });

  if (result.changed) {
    source = source.slice(0, blockInfo.start) + result.block + source.slice(blockInfo.end);
    patched = true;
    break;
  }
}

if (!patched) {
  console.log("Status declaration already includes \"Needs Finance Review\". No change required.");
} else {
  fs.writeFileSync(target, source, "utf8");
}

const after = fs.readFileSync(target, "utf8");
const afterBlocks = findDeclarationBlocks(after);
const supportsNeedsFinanceReview = afterBlocks.some((entry) => entry.block.includes('"Needs Finance Review"'));

if (!supportsNeedsFinanceReview) {
  throw new Error("Patch verification failed: status declaration still does not include \"Needs Finance Review\".");
}

console.log("AC CAPITAL OS TS2322 case-builder status fix applied.");
console.log(`Detected mode: ${mode}`);
console.log(`Touched file: ${path.relative(repoRoot, target)}`);
console.log(`Backup created at: ${path.relative(repoRoot, backupDir)}`);
console.log('Added allowed status: "Needs Finance Review"');
console.log("No other AC CAPITAL OS files touched.");
console.log("Next: node ./AC_CAPITAL_OS_TS_FIX_01/scripts/verify_ac_capital_os_case_builder_status_fix.mjs");
console.log("Then run: cd apps/ops-web && npx tsc -p tsconfig.json --noEmit --pretty false");
