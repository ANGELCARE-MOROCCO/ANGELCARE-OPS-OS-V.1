#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.join(
  process.cwd(),
  "components",
  "market-os",
  "ambassadors",
  "onboarding-workspace.tsx"
);

if (!fs.existsSync(file)) {
  console.error("File not found:", file);
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");

const lucideImportRegex = /import\s*\{([\s\S]*?)\}\s*from\s*["']lucide-react["'];?/m;
const match = src.match(lucideImportRegex);

if (!match) {
  console.error("Could not find lucide-react import block.");
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

src = src.replace(lucideImportRegex, nextImport);

fs.writeFileSync(file, src);
console.log("Fixed missing Activity import in:", file);
