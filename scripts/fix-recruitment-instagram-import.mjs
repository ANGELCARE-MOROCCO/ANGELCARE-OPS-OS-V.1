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

// lucide-react does not export Instagram in your installed version.
// Replace usage with MessageCircle and remove Instagram from the import list.
src = src.replace(/\bInstagram\b/g, "MessageCircle");

// Clean duplicate MessageCircle entries inside lucide import block.
src = src.replace(/import\s*\{([\s\S]*?)\}\s*from\s*["']lucide-react["'];?/m, (match, imports) => {
  const unique = Array.from(
    new Set(
      imports
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  return `import {\n  ${unique.join(",\n  ")}\n} from "lucide-react";`;
});

fs.writeFileSync(file, src);
console.log("Fixed Instagram lucide import in:", file);
console.log("Replaced Instagram icon with MessageCircle.");
