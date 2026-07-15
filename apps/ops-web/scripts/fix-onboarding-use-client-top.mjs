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

// Remove all existing use client directives anywhere.
src = src.replace(/^\s*["']use client["'];?\s*/gm, "");

// Put it back at absolute top before imports.
src = `"use client"\n\n${src.trimStart()}`;

fs.writeFileSync(file, src);
console.log("Moved use client directive to top:", file);
