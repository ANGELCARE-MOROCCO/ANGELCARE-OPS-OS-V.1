#!/usr/bin/env node
/**
 * Fix:
 * components/revenue-command-center/PartnersDirectoryWorkspace.tsx
 * Type error: Cannot find name 'Activity'
 */

const fs = require("fs");
const path = require("path");

const target = path.join(
  process.cwd(),
  "components/revenue-command-center/PartnersDirectoryWorkspace.tsx"
);

if (!fs.existsSync(target)) {
  console.error("File not found:", target);
  process.exit(1);
}

let code = fs.readFileSync(target, "utf8");
const backup = target + ".before-activity-import-fix.bak";
if (!fs.existsSync(backup)) fs.writeFileSync(backup, code);

if (!code.includes("Activity,")) {
  code = code.replace(
    /import\s*\{\s*/,
    "import {\n  Activity,\n"
  );
}

fs.writeFileSync(target, code);
console.log("✅ Added Activity import to PartnersDirectoryWorkspace.tsx");
console.log("Backup:", backup);
