#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function readFile(rel) {
  const file = path.join(process.cwd(), rel);
  if (!fs.existsSync(file)) {
    console.error("Missing file:", rel);
    process.exit(1);
  }
  return [file, fs.readFileSync(file, "utf8")];
}

function saveBackup(file, code) {
  const backup = file + ".before-radar-alert-key-fix.bak";
  if (!fs.existsSync(backup)) fs.writeFileSync(backup, code);
}

// Fix 1: Radar missing import
{
  const rel = "components/revenue-command-center/RevenuePartnershipsEnterprisePage.tsx";
  const [file, original] = readFile(rel);
  saveBackup(file, original);
  let code = original;

  const lucideRegex = /import\s*\{[\s\S]*?\}\s*from\s*["']lucide-react["']/m;
  const match = code.match(lucideRegex);

  if (!match) {
    code = 'import { Radar } from "lucide-react"\n' + code;
  } else if (!match[0].includes("Radar")) {
    const fixedImport = match[0].replace(/\}\s*from\s*["']lucide-react["']/, '  Radar,\n} from "lucide-react"');
    code = code.replace(lucideRegex, fixedImport);
  }

  fs.writeFileSync(file, code);
  console.log("Fixed Radar import:", rel);
}

// Fix 2: duplicate alert keys
{
  const rel = "app/(protected)/revenue-command-center/_central-core/CentralRevenueCoreDashboard.tsx";
  const [file, original] = readFile(rel);
  saveBackup(file, original);
  let code = original;

  code = code.replace(/alerts\.map\(\(a\)\s*=>/g, "alerts.map((a, index) =>");
  code = code.replace(/key=\{`\$\{a\.href\}-\$\{a\.title\}`\}/g, "key={`${a.href}-${a.title}-${index}`}");
  code = code.replace(/key=\{a\.href\}/g, "key={`${a.href}-${index}`}");
  code = code.replace(/key=\{a\.title\}/g, "key={`${a.title}-${index}`}");

  code = code.replace(/alerts\.map\(\(alert\)\s*=>/g, "alerts.map((alert, index) =>");
  code = code.replace(/key=\{`\$\{alert\.href\}-\$\{alert\.title\}`\}/g, "key={`${alert.href}-${alert.title}-${index}`}");
  code = code.replace(/key=\{alert\.href\}/g, "key={`${alert.href}-${index}`}");
  code = code.replace(/key=\{alert\.title\}/g, "key={`${alert.title}-${index}`}");

  fs.writeFileSync(file, code);
  console.log("Fixed duplicate alert keys:", rel);
}

console.log("Done. Run: npm run build");
