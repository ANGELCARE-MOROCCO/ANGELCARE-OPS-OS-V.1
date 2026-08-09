#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const target = path.join(process.cwd(), "components/revenue-command-center/PartnersDirectoryWorkspace.tsx");

if (!fs.existsSync(target)) {
  console.error("❌ File not found:", target);
  process.exit(1);
}

let code = fs.readFileSync(target, "utf8");
const backup = `${target}.before-serious-activity-fix.bak`;
if (!fs.existsSync(backup)) fs.writeFileSync(backup, code);

// FORCE FIX THE EXACT FAILING EXPRESSION.
code = code.replace(
  /partner\.type\.includes\("Ortho"\)\s*\?\s*Activity\s*:/g,
  'partner.type.includes("Ortho") ? Stethoscope :'
);

// FORCE FIX ANY OTHER Activity identifier left in this file.
code = code.replace(/\bActivity\b/g, "Stethoscope");

// Make sure Stethoscope is imported.
if (!/\bStethoscope\b/.test(code.split('from "lucide-react"')[0] || "")) {
  code = code.replace(/import\s*\{/, "import {\n  Stethoscope,");
}

// Remove duplicate Stethoscope import lines if created.
code = code.replace(/(\n\s*Stethoscope,\s*){2,}/g, "\n  Stethoscope,\n");

fs.writeFileSync(target, code);

const after = fs.readFileSync(target, "utf8");
if (/\bActivity\b/.test(after)) {
  console.error("❌ Activity still exists in file. Build would still fail.");
  const lines = after.split("\n");
  lines.forEach((line, index) => {
    if (line.includes("Activity")) console.error(`${index + 1}: ${line}`);
  });
  process.exit(1);
}

console.log("✅ SERIOUS FIX APPLIED.");
console.log("✅ No Activity identifier remains in PartnersDirectoryWorkspace.tsx");
console.log("Backup:", backup);
