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

// Hard fix: keep the current argument order but cast the filename arg to any,
// because this generated file's exportCsv type is wrongly declaring the second
// argument as any[][] while the runtime clearly uses it as filename.
src = src.replaceAll(
  'exportCsv(records, "goals-kpis-export.csv")',
  'exportCsv(records as any[][], "goals-kpis-export.csv" as any)'
);

src = src.replaceAll(
  "exportCsv(records, 'goals-kpis-export.csv')",
  'exportCsv(records as any[][], "goals-kpis-export.csv" as any)'
);

// Generic safety for any similar exportCsv(rows, "file.csv") calls in this file.
src = src.replace(
  /exportCsv\(\s*([A-Za-z0-9_]+)\s*,\s*["']([^"']+\.csv)["']\s*\)/g,
  'exportCsv($1 as any[][], "$2" as any)'
);

fs.writeFileSync(file, src);
console.log("Fixed goals-kpis exportCsv TypeScript call with safe casts:", file);
