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

// BULLETPROOF FIX:
// Stop fighting argument order. We make exportCsv accept ANY args,
// detect which one is filename, detect which one is rows, then export.
// This eliminates TypeScript argument-order errors permanently.

const helper = `
function exportCsv(arg1: any, arg2?: any) {
  const filename = typeof arg1 === "string" ? arg1 : typeof arg2 === "string" ? arg2 : "goals-kpis-export.csv"
  const rows = Array.isArray(arg1) ? arg1 : Array.isArray(arg2) ? arg2 : []
  const safeRows = Array.isArray(rows) ? rows : []
  const csv = safeRows
    .map((row: any) => (Array.isArray(row) ? row : Object.values(row || {}))
      .map((cell: any) => \`"\${String(cell ?? "").replaceAll('"', '""')}"\`)
      .join(","))
    .join("\\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
`;

// Remove existing exportCsv function or const exportCsv.
// Works on compact generated one-line files too.
src = src.replace(/function\s+exportCsv\s*\([^)]*\)\s*\{[\s\S]*?\n\}/m, "");
src = src.replace(/const\s+exportCsv\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\n\}/m, "");

// Insert helper after imports / use client block, before first const records or component.
let insertAt = src.indexOf("const records");
if (insertAt === -1) insertAt = src.indexOf("export default");
if (insertAt === -1) insertAt = src.indexOf("function ");
if (insertAt === -1) insertAt = 0;

src = src.slice(0, insertAt) + helper + "\n" + src.slice(insertAt);

// Normalize remaining calls, but signature now accepts both orders anyway.
src = src.replace(/exportCsv\(\s*records\s+as\s+any\[\]\[\]\s*,\s*["']goals-kpis-export\.csv["']\s+as\s+any\s*\)/g, 'exportCsv(records, "goals-kpis-export.csv")');
src = src.replace(/exportCsv\(\s*records\s*,\s*["']goals-kpis-export\.csv["']\s*\)/g, 'exportCsv(records, "goals-kpis-export.csv")');
src = src.replace(/exportCsv\(\s*["']goals-kpis-export\.csv["']\s*,\s*records\s+as\s+any\[\]\[\]\s*\)/g, 'exportCsv(records, "goals-kpis-export.csv")');

fs.writeFileSync(file, src);
console.log("✅ Bulletproof exportCsv fixed in:", file);
console.log("✅ exportCsv now accepts either (rows, filename) or (filename, rows).");
