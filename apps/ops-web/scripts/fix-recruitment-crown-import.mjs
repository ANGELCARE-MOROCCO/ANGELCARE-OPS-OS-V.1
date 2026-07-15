#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.join(
  process.cwd(),
  "components",
  "market-os",
  "ambassadors",
  "recruitment-workspace.tsx"
);

if (!fs.existsSync(file)) {
  console.error("File not found:", file);
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");

// lucide-react may not export Crown in your version or it was missing from rebuilt imports.
// Replace Crown usage with Trophy, which is stable and already fits domination/achievement.
src = src.replace(/\bCrown\b/g, "Trophy");

// Add Trophy to lucide import if missing.
src = src.replace(/import\s*\{([\s\S]*?)\}\s*from\s*["']lucide-react["'];?/m, (match, imports) => {
  const names = imports.split(",").map((x) => x.trim()).filter(Boolean);
  if (!names.includes("Trophy")) names.push("Trophy");
  const unique = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  return `import {\n  ${unique.join(",\n  ")}\n} from "lucide-react";`;
});

fs.writeFileSync(file, src);
console.log("Fixed Crown reference by replacing it with Trophy in:", file);
