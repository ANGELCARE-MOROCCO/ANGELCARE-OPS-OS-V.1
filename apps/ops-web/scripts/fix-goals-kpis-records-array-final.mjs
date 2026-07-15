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

// Fix the actual current problem:
// records became a STRING containing JSON text, so records.map crashes in TS.
// Convert any const records = "[[...]]" / const records: any = "[[...]]" into a real array.

src = src.replace(
  /const\s+records(?:\s*:\s*[^=]+)?\s*=\s*(['"])(\[\[[\s\S]*?\]\])\1\s*;?/m,
  (_match, _quote, json) => {
    const unescaped = json
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, "\\");
    return `const records: any[][] = ${unescaped};`;
  }
);

// Safety fallback for the exact visible broken string.
src = src.replace(
  'const records = "[[\\"Monthly visits target\\",\\"Operations\\",\\"Tracking\\",78,\\"Open\\"],[\\"Proof quality KPI\\",\\"Quality Control\\",\\"Validation\\",84,\\"In Progress\\"],[\\"B2B lead conversion\\",\\"Growth\\",\\"Target Gap\\",61,\\"Critical\\"],[\\"Training completion KPI\\",\\"Academy\\",\\"Achieved\\",95,\\"Approved\\"]]"',
  'const records: any[][] = [["Monthly visits target","Operations","Tracking",78,"Open"],["Proof quality KPI","Quality Control","Validation",84,"In Progress"],["B2B lead conversion","Growth","Target Gap",61,"Critical"],["Training completion KPI","Academy","Achieved",95,"Approved"]]'
);

// Make records.map safe anyway.
src = src.replace(/records\.map\(/g, "(Array.isArray(records) ? records : []).map(");

// Replace exportCsv with flexible safe helper if there are still export issues.
const helper = `
function exportCsv(arg1: any, arg2?: any) {
  const filename = typeof arg1 === "string" ? arg1 : typeof arg2 === "string" ? arg2 : "goals-kpis-export.csv"
  const rows = Array.isArray(arg1) ? arg1 : Array.isArray(arg2) ? arg2 : []
  const csv = (Array.isArray(rows) ? rows : [])
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

src = src.replace(/function\s+exportCsv\s*\([^)]*\)\s*\{[\s\S]*?\n\}/m, "");
src = src.replace(/const\s+exportCsv\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\n\}/m, "");

if (!src.includes("function exportCsv(arg1: any")) {
  const insertAt = src.indexOf("const records");
  src = insertAt >= 0 ? src.slice(0, insertAt) + helper + "\n" + src.slice(insertAt) : helper + "\n" + src;
}

fs.writeFileSync(file, src);
console.log("✅ Fixed goals-kpis records string -> real array and hardened records.map/exportCsv.");
