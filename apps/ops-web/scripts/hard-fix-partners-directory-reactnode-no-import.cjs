#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const target = path.join(process.cwd(), "components/revenue-command-center/PartnersDirectoryWorkspace.tsx");

if (!fs.existsSync(target)) {
  console.error("❌ File not found:", target);
  process.exit(1);
}

let code = fs.readFileSync(target, "utf8");
const backup = `${target}.before-hard-reactnode-no-import-fix.bak`;
if (!fs.existsSync(backup)) fs.writeFileSync(backup, code);

// HARD FIX: avoid depending on ReactNode import at all.
code = code.replace(/\bReactNode\b/g, "React.ReactNode");

// Make sure React namespace exists.
if (/import\s+React\s*,/.test(code) || /import\s+\*\s+as\s+React\s+from\s+["']react["']/.test(code)) {
  // already OK
} else if (/import\s*\{([^}]+)\}\s*from\s*["']react["']/.test(code)) {
  code = code.replace(/import\s*\{([^}]+)\}\s*from\s*["']react["']/, (match, imports) => {
    const clean = imports
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x && x !== "type React.ReactNode" && x !== "type ReactNode" && x !== "ReactNode")
      .join(", ");
    return `import React, { ${clean} } from "react"`;
  });
} else {
  code = `import React from "react"\n` + code;
}

// Clean accidental broken import text if prior scripts created it.
code = code.replace(/,\s*type React\.ReactNode/g, "");
code = code.replace(/\{\s*,/g, "{");

fs.writeFileSync(target, code);

const after = fs.readFileSync(target, "utf8");
if (/\bReactNode\b/.test(after)) {
  console.error("❌ ReactNode still exists. Lines:");
  after.split("\n").forEach((line, i) => {
    if (line.includes("ReactNode")) console.error(`${i + 1}: ${line}`);
  });
  process.exit(1);
}

console.log("✅ HARD FIX APPLIED: ReactNode replaced with React.ReactNode and React imported.");
console.log("Backup:", backup);
