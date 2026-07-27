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
      blocks.push({ kind: "type-union", block });
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
      blocks.push({ kind: "const-array", block });
    }
  }

  return blocks;
}

const { mode, repoRoot, opsRoot } = detectRoots(cwd);
const target = path.join(opsRoot, "lib", "ac-capital-os", "case-builder.ts");

assert(exists(target), `Target file missing: ${target}`);

const source = fs.readFileSync(target, "utf8");
const blocks = findDeclarationBlocks(source);
assert(blocks.length > 0, "Could not locate the case-builder status declaration block.");
assert(
  blocks.some((entry) => entry.block.includes('"Needs Finance Review"')),
  'Status declaration does not include "Needs Finance Review".'
);
assert(source.includes('"Needs Finance Review"'), 'case-builder.ts no longer contains the reported "Needs Finance Review" literal.');

console.log("AC_CAPITAL_OS_CASE_BUILDER_STATUS_FIX_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log(`Verified file: ${path.relative(repoRoot, target)}`);
console.log('Verified status support: "Needs Finance Review"');
console.log("Next: cd apps/ops-web && npx tsc -p tsconfig.json --noEmit --pretty false");
