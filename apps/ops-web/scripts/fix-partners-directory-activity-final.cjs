#!/usr/bin/env node
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
const backup = target + ".before-activity-final-fix.bak";
if (!fs.existsSync(backup)) fs.writeFileSync(backup, code);

// safest fix: replace the undefined Activity icon with Stethoscope directly
code = code.replace(/\bActivity\b/g, "Stethoscope");

// remove accidental duplicate Stethoscope import lines if they exist
code = code.replace(/(\n\s*Stethoscope,\s*){2,}/g, "\n  Stethoscope,\n");

fs.writeFileSync(target, code);
console.log("✅ Fixed Activity undefined error by replacing Activity with Stethoscope.");
console.log("Backup:", backup);
