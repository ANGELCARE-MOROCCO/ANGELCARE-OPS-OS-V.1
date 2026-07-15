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

// Ensure use client remains first.
src = src.replace(/^\s*["']use client["'];?\s*/gm, "");
src = `"use client"\n\n${src.trimStart()}`;

// Add missing sidebar import if absent.
const sidebarImport = 'import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"\n';

if (!src.includes('ambassador-market-sidebar')) {
  const lastImportMatch = [...src.matchAll(/^import .*$/gm)].at(-1);
  if (lastImportMatch) {
    const insertAt = lastImportMatch.index + lastImportMatch[0].length + 1;
    src = src.slice(0, insertAt) + sidebarImport + src.slice(insertAt);
  } else {
    src = `"use client"\n\n${sidebarImport}` + src.replace('"use client"\n\n', "");
  }
}

fs.writeFileSync(file, src);
console.log("Fixed missing AmbassadorMarketSidebar import in:", file);
