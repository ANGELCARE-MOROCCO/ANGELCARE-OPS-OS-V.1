#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const target = path.join(
  process.cwd(),
  "components",
  "market-os",
  "ambassadors",
  "ambassador-main-overview-page.tsx"
);

if (!fs.existsSync(target)) {
  console.error("Target file not found:");
  console.error(target);
  process.exit(1);
}

let text = fs.readFileSync(target, "utf8");

if (text.includes("Activity") && text.includes('from "lucide-react"')) {
  const regex = /import\s*\{([\s\S]*?)\}\s*from\s*["']lucide-react["']/m;
  const match = text.match(regex);

  if (match && !match[1].includes("Activity")) {
    const updated = match[1].trim() + ",\n  Activity\n";
    text = text.replace(regex, `import {\n${updated}} from "lucide-react"`);
  }
}

fs.writeFileSync(target, text);

console.log("✅ ambassador-main-overview-page.tsx fixed successfully");
console.log("✅ Added missing Activity import");
