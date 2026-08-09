#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.join(
  process.cwd(),
  "components",
  "market-os",
  "ambassadors",
  "phase6",
  "goals-kpis-workspace.tsx"
);

if (!fs.existsSync(file)) {
  console.error("File not found:", file);
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");

// Your file's exportCsv function expects filename first, rows second.
// The last patch flipped the call incorrectly. This restores the correct call.
src = src.replaceAll(
  'exportCsv(records, "goals-kpis-export.csv")',
  'exportCsv("goals-kpis-export.csv", records)'
);

src = src.replaceAll(
  "exportCsv(records, 'goals-kpis-export.csv')",
  'exportCsv("goals-kpis-export.csv", records)'
);

// Broader safety: convert any exportCsv(records, "file.csv") back to exportCsv("file.csv", records)
src = src.replace(
  /exportCsv\(\s*([A-Za-z0-9_]+)\s*,\s*["']([^"']+\.csv)["']\s*\)/g,
  'exportCsv("$2", $1)'
);

fs.writeFileSync(file, src);
console.log("Fixed exportCsv call order in:", file);
console.log('Expected call is now: exportCsv("goals-kpis-export.csv", records)');
