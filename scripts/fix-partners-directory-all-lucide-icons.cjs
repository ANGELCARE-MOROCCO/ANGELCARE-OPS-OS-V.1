#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const target = path.join(process.cwd(), "components/revenue-command-center/PartnersDirectoryWorkspace.tsx");

if (!fs.existsSync(target)) {
  console.error("❌ File not found:", target);
  process.exit(1);
}

let code = fs.readFileSync(target, "utf8");
const backup = `${target}.before-all-lucide-icons-fix.bak`;
if (!fs.existsSync(backup)) fs.writeFileSync(backup, code);

const requiredIcons = [
  "Activity",
  "ArrowDownToLine",
  "BarChart3",
  "Building2",
  "CalendarDays",
  "CheckCircle2",
  "ChevronRight",
  "Eye",
  "FileText",
  "Filter",
  "GraduationCap",
  "Hotel",
  "Mail",
  "MapPin",
  "MoreHorizontal",
  "Network",
  "Phone",
  "Search",
  "ShieldCheck",
  "Sparkles",
  "Stethoscope",
  "Trash2",
  "TrendingUp",
  "UsersRound",
  "X",
];

// Replace the whole lucide-react import block with a complete clean one.
const importBlock = `import {
  ${requiredIcons.join(",\n  ")},
} from "lucide-react"`;

if (/import\s*\{[\s\S]*?\}\s*from\s*["']lucide-react["']/.test(code)) {
  code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*["']lucide-react["']/, importBlock);
} else {
  code = importBlock + "\n" + code;
}

fs.writeFileSync(target, code);

// Verify every required icon used in the file has an import.
const after = fs.readFileSync(target, "utf8");
const importPart = after.split('from "lucide-react"')[0] || "";
const missing = requiredIcons.filter((icon) => after.includes(icon) && !importPart.includes(icon));

if (missing.length) {
  console.error("❌ Still missing imports:", missing.join(", "));
  process.exit(1);
}

console.log("✅ Fixed PartnersDirectoryWorkspace lucide imports completely.");
console.log("Backup:", backup);
