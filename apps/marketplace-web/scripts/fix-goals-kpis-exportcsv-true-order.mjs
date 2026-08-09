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

// Final correction: your exportCsv function expects filename FIRST.
// Current broken call:
// exportCsv(records as any[][], "goals-kpis-export.csv" as any)
// Correct call:
// exportCsv("goals-kpis-export.csv", records as any[][])

src = src.replaceAll(
  'exportCsv(records as any[][], "goals-kpis-export.csv" as any)',
  'exportCsv("goals-kpis-export.csv", records as any[][])'
);

src = src.replaceAll(
  "exportCsv(records as any[][], 'goals-kpis-export.csv' as any)",
  'exportCsv("goals-kpis-export.csv", records as any[][])'
);

src = src.replaceAll(
  'exportCsv(records, "goals-kpis-export.csv")',
  'exportCsv("goals-kpis-export.csv", records as any[][])'
);

// Generic rescue for any exportCsv(rows as any[][], "file.csv" as any)
src = src.replace(
  /exportCsv\(\s*([A-Za-z0-9_]+)\s+as\s+any\[\]\[\]\s*,\s*["']([^"']+\.csv)["']\s+as\s+any\s*\)/g,
  'exportCsv("$2", $1 as any[][])'
);

// Generic rescue for exportCsv(rows, "file.csv") in this file
src = src.replace(
  /exportCsv\(\s*([A-Za-z0-9_]+)\s*,\s*["']([^"']+\.csv)["']\s*\)/g,
  'exportCsv("$2", $1 as any[][])'
);

fs.writeFileSync(file, src);
console.log("Fixed exportCsv to filename-first order in:", file);
console.log('Expected final call: exportCsv("goals-kpis-export.csv", records as any[][])');
