#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "components/market-os/ambassadors/recruitment-workspace.tsx");

if (!fs.existsSync(file)) {
  console.error("❌ File not found:", file);
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");

// FORCE replacement: exact failing code and all remaining Crown identifiers.
src = src.replaceAll("icon: Crown", "icon: Trophy");
src = src.replaceAll("<Crown", "<Trophy");
src = src.replaceAll("</Crown>", "</Trophy>");
src = src.replace(/\bCrown\b/g, "Trophy");

// Ensure Trophy is imported from lucide-react.
src = src.replace(/import\s*\{([\s\S]*?)\}\s*from\s*["']lucide-react["'];?/m, (_match, imports) => {
  const names = imports
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => x !== "Crown");

  if (!names.includes("Trophy")) names.push("Trophy");

  const unique = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  return `import {\n  ${unique.join(",\n  ")}\n} from "lucide-react";`;
});

fs.writeFileSync(file, src, "utf8");

const after = fs.readFileSync(file, "utf8");
if (after.includes("Crown")) {
  console.error("❌ Crown still exists in recruitment-workspace.tsx. Replacement failed.");
  process.exit(1);
}

console.log("✅ Crown fully removed from recruitment-workspace.tsx");
console.log("✅ Trophy is now used and imported");
