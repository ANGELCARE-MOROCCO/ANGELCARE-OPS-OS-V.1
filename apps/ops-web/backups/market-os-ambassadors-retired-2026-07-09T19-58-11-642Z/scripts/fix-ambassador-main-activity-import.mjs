#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const file = path.join(
  process.cwd(),
  "components",
  "market-os",
  "ambassadors",
  "ambassador-main-overview-page.tsx"
);

if (!fs.existsSync(file)) {
  console.error("Target file not found:", file);
  process.exit(1);
}

let code = fs.readFileSync(file, "utf8");
const original = code;

const importRegex = /import\s*\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"];?/m;
const match = code.match(importRegex);

if (!match) {
  console.error("Could not find lucide-react named import block.");
  process.exit(1);
}

const imports = match[1]
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);

if (!imports.includes("Activity")) {
  imports.push("Activity");
}

const unique = Array.from(new Set(imports)).sort((a, b) => a.localeCompare(b));
const nextImport = `import {\n  ${unique.join(",\n  ")}\n} from "lucide-react";`;

code = code.replace(importRegex, nextImport);

fs.writeFileSync(file + ".activity-backup", original, "utf8");
fs.writeFileSync(file, code, "utf8");

console.log("Fixed Activity import in ambassador-main-overview-page.tsx");
console.log("Backup created:", file + ".activity-backup");
