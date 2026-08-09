#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const target = path.join(process.cwd(), "components/revenue-command-center/PartnersDirectoryWorkspace.tsx");

if (!fs.existsSync(target)) {
  console.error("❌ File not found:", target);
  process.exit(1);
}

let code = fs.readFileSync(target, "utf8");
const backup = `${target}.before-reactnode-fix.bak`;
if (!fs.existsSync(backup)) fs.writeFileSync(backup, code);

// Fix missing ReactNode type by importing it from react.
// Handles both:
// import { useMemo, useState } from "react"
// import { useMemo, useState, type ReactNode } from "react"

if (/import\s*\{([^}]+)\}\s*from\s*["']react["']/.test(code)) {
  code = code.replace(/import\s*\{([^}]+)\}\s*from\s*["']react["']/, (match, imports) => {
    if (imports.includes("ReactNode")) return match;
    return `import {${imports.trim()}, type ReactNode } from "react"`;
  });
} else {
  code = `import { type ReactNode } from "react"\n` + code;
}

fs.writeFileSync(target, code);

const after = fs.readFileSync(target, "utf8");
if (after.includes("ReactNode") && !/type\s+ReactNode/.test(after.split('from "react"')[0] || "")) {
  console.error("❌ ReactNode still not correctly imported.");
  process.exit(1);
}

console.log("✅ Fixed ReactNode import in PartnersDirectoryWorkspace.tsx");
console.log("Backup:", backup);
