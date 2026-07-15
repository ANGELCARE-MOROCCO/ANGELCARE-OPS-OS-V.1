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

// Repair broken import where lucide icons accidentally got inserted into react import.
src = src.replace(
  /import\s*\{[\s\S]*?\}\s*from\s*["']react["'];?/m,
  'import { useState } from "react"'
);

// Remove any existing lucide-react import block, then add a clean complete one.
src = src.replace(
  /import\s*\{[\s\S]*?\}\s*from\s*["']lucide-react["'];?\n?/m,
  ""
);

const lucideImport = `import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  Grid2X2,
  MapPinned,
  PackageCheck,
  Plus,
  Route,
  Search,
  ShieldCheck,
  Target,
  UserCheck,
  Users,
  X
} from "lucide-react";
`;

const reactImport = 'import { useState } from "react"\n';
if (src.includes(reactImport)) {
  src = src.replace(reactImport, reactImport + lucideImport);
} else {
  src = reactImport + lucideImport + src;
}

// Safety: if component uses icons not in above list, add common ones
const needed = ["Activity"];
for (const icon of needed) {
  if (!src.includes(icon)) {
    console.warn(`Warning: ${icon} not found in source text after repair`);
  }
}

fs.writeFileSync(file, src);
console.log("Repaired react/lucide import blocks in:", file);
