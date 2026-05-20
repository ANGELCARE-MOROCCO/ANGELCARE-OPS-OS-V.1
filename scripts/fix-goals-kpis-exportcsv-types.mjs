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

// Fix wrong exportCsv signature/order.
// Current call is exportCsv("goals & kpis-export.csv", records)
// but function expects records first, filename second OR was inferred as any[][] first.

// First, normalize the call.
src = src.replaceAll(
  'exportCsv("goals & kpis-export.csv", records)',
  'exportCsv(records, "goals-kpis-export.csv")'
);

src = src.replaceAll(
  "exportCsv('goals & kpis-export.csv', records)",
  'exportCsv(records, "goals-kpis-export.csv")'
);

// Then make exportCsv support records first safely.
// Handles: function exportCsv(rows:any[][], filename:string)
src = src.replace(
  /function\s+exportCsv\s*\(\s*rows\s*:\s*any\[\]\[\]\s*,\s*filename\s*:\s*string\s*\)/,
  "function exportCsv(rows: any[][], filename: string)"
);

// Handles: const exportCsv = (rows:any[][], filename:string) =>
src = src.replace(
  /const\s+exportCsv\s*=\s*\(\s*rows\s*:\s*any\[\]\[\]\s*,\s*filename\s*:\s*string\s*\)\s*=>/,
  "const exportCsv = (rows: any[][], filename: string) =>"
);

// If function is actually filename first, flip its parameters and internal names.
src = src.replace(
  /function\s+exportCsv\s*\(\s*filename\s*:\s*string\s*,\s*rows\s*:\s*any\[\]\[\]\s*\)/,
  "function exportCsv(rows: any[][], filename: string)"
);

src = src.replace(
  /const\s+exportCsv\s*=\s*\(\s*filename\s*:\s*string\s*,\s*rows\s*:\s*any\[\]\[\]\s*\)\s*=>/,
  "const exportCsv = (rows: any[][], filename: string) =>"
);

// Some generated phase6 files used records as tuple rows, not strict any[][].
// Force the local records declaration to be any[][] when it exists.
src = src.replace(
  /const\s+records\s*=\s*(\[[\s\S]*?\])\s*;/m,
  "const records: any[][] = $1;"
);

// If records declaration has no semicolon.
src = src.replace(
  /const\s+records\s*=\s*(\[[\s\S]*?\])\n/m,
  "const records: any[][] = $1\n"
);

// Final safety: if the file still contains filename-first call, convert all exportCsv("...", something)
src = src.replace(
  /exportCsv\(\s*["']([^"']+)["']\s*,\s*([A-Za-z0-9_]+)\s*\)/g,
  'exportCsv($2, "$1")'
);

fs.writeFileSync(file, src);
console.log("Fixed exportCsv argument order/type in:", file);
